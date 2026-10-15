/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Partner } from '../types';
import { PARTNERS as STATIC_PARTNERS } from '../data/partners';
import { safeStorage } from './safeStorage';
import { PublicDirectoryFetchResult } from '../types/proposal';

const PARTNER_OVERRIDES_STORAGE_KEY = 'idemo_partner_overrides_v1';

const REMOVED_DEMO_IDS = new Set([
  'p-001', 'p-002', 'p-003', 'p-004', 'p-005'
]);

export function isRemovedDemoPartnerId(idOrCode: string | undefined | null): boolean {
  if (!idOrCode) return false;
  return REMOVED_DEMO_IDS.has(idOrCode.trim().toLowerCase());
}

export interface PartnerLifecycleState {
  stage: 'Candidate' | 'Verification' | 'Approved' | 'Active' | 'Suspended' | 'Archived';
  verificationStatus: string;
  isCandidate: boolean;
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isRetired: boolean;
  isConciergeRoutable: boolean;
  isRoutable: boolean;
  mayVerify: boolean;
  mayActivate: boolean;
  mayEnableRouting: boolean;
  mayDisableRouting: boolean;
  maySuspend: boolean;
  mayRetire: boolean;
  mayReactivate: boolean;
}

/**
 * Authoritative fail-safe resolution of Partner Lifecycle State.
 * No Partner may become VERIFIED, ACTIVE, or CONCIERGE-ROUTABLE implicitly.
 * Missing or undefined state strictly fails safe to Candidate/Unverified/Inactive/Non-routable.
 */
export function getPartnerLifecycleState(partner: Partial<Partner> | null | undefined): PartnerLifecycleState {
  if (!partner) {
    return {
      stage: 'Candidate',
      verificationStatus: 'unverified',
      isCandidate: true,
      isVerified: false,
      isActive: false,
      isSuspended: false,
      isRetired: false,
      isConciergeRoutable: false,
      isRoutable: false,
      mayVerify: true,
      mayActivate: false,
      mayEnableRouting: false,
      mayDisableRouting: false,
      maySuspend: false,
      mayRetire: true,
      mayReactivate: false,
    };
  }

  const vStatus = (partner.verificationStatus || '').toLowerCase();
  const stageProp = (partner.stage || '').toString();
  const statusProp = (partner.status || '').toLowerCase();

  // 1. Check Retirement / Archived state
  const isRetired =
    stageProp === 'Archived' ||
    stageProp === 'Retired' ||
    statusProp === 'closed' ||
    statusProp === 'retired' ||
    vStatus.includes('archived') ||
    vStatus.includes('retired');

  // 2. Check Suspended state
  const isSuspended =
    !isRetired &&
    (stageProp === 'Suspended' ||
      statusProp === 'suspended' ||
      statusProp === 'paused' ||
      vStatus.includes('suspended') ||
      vStatus.includes('paused'));

  // 3. Check Verification state (explicit Admin verification required)
  const isExplicitlyUnverified =
    !partner.verificationStatus ||
    vStatus.includes('unverified') ||
    vStatus.includes('not verified') ||
    vStatus.includes('candidate') ||
    vStatus === 'invited';

  const isVerified =
    !isRetired &&
    !isSuspended &&
    !isExplicitlyUnverified &&
    (vStatus === 'verified' ||
      vStatus.includes('public contact verified') ||
      vStatus.includes('approved') ||
      stageProp === 'Approved' ||
      (stageProp === 'Active' && statusProp === 'active'));

  // 4. Check Operational Active state (requires verification)
  const isActive =
    !isRetired &&
    !isSuspended &&
    isVerified &&
    (stageProp === 'Active' || statusProp === 'active' || (partner.conciergeRoutingEligible === 'Yes' && isVerified));

  // 5. Check Concierge Routing Eligibility (requires verified + active + explicit enabled + contact info)
  const hasContactInfo = Boolean(
    partner.phone ||
      partner.email ||
      partner.whatsApp ||
      partner.directBookingPhone ||
      partner.directBookingEmail ||
      partner.directBookingWhatsApp
  );

  const isConciergeRoutable =
    !isRetired &&
    !isSuspended &&
    isVerified &&
    isActive &&
    hasContactInfo &&
    partner.conciergeRoutingEligible === 'Yes';

  // 6. Candidate State
  const isCandidate = !isVerified && !isActive && !isSuspended && !isRetired;

  // Determine normalized stage label
  let stage: PartnerLifecycleState['stage'] = 'Candidate';
  if (isRetired) stage = 'Archived';
  else if (isSuspended) stage = 'Suspended';
  else if (isActive) stage = 'Active';
  else if (isVerified) stage = 'Approved';
  else if (vStatus.includes('review') || stageProp === 'Verification') stage = 'Verification';

  return {
    stage,
    verificationStatus: partner.verificationStatus || (isVerified ? 'verified' : 'unverified'),
    isCandidate,
    isVerified,
    isActive,
    isSuspended,
    isRetired,
    isConciergeRoutable,
    isRoutable: isConciergeRoutable,
    mayVerify: !isVerified && !isRetired && !isSuspended,
    mayActivate: isVerified && !isActive && !isRetired && !isSuspended,
    mayEnableRouting: isVerified && isActive && partner.conciergeRoutingEligible !== 'Yes' && !isRetired && !isSuspended,
    mayDisableRouting: partner.conciergeRoutingEligible === 'Yes' && !isRetired,
    maySuspend: (isActive || isVerified) && !isSuspended && !isRetired,
    mayRetire: !isRetired,
    mayReactivate: (isSuspended || isRetired || !isActive) && !isCandidate,
  };
}

// ==========================================
// DURABLE PERSISTENCE & LIFECYCLE MANAGEMENT
// ==========================================

export function getPersistedPartnerOverrides(): Record<string, Partner> {
  try {
    const raw = safeStorage.getItem(PARTNER_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partner>;
    const sanitized: Record<string, Partner> = {};

    for (const [key, val] of Object.entries(parsed)) {
      if (
        !isRemovedDemoPartnerId(key) &&
        !isRemovedDemoPartnerId(val.id) &&
        !isRemovedDemoPartnerId(val.publicCode)
      ) {
        sanitized[key] = val;
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

export function savePartnerOverridesToStorage(overrides: Record<string, Partner>): void {
  try {
    safeStorage.setItem(PARTNER_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[IDEMO Partner Storage] Failed to save partner overrides:', err);
  }
}

/**
 * Async database-backed directory loader for public approved partners.
 * Queries fetch_public_approved_partner_directory_secure RPC with fallback.
 */
export async function fetchPublicApprovedPartnersDirectory(): Promise<PublicDirectoryFetchResult> {
  const { getSupabaseClient, isSupabaseConfigured } = await import('./supabaseClient');

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('fetch_public_approved_partner_directory_secure');

      if (error) {
        console.error('[IDEMO Partner Directory] Supabase directory fetch RPC error:', error.message);
        return { success: false, error: error.message };
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          // Empty response clears stale cached overrides
          safeStorage.removeItem(PARTNER_OVERRIDES_STORAGE_KEY);
          return { success: true, partners: [] };
        }

        const ONBOARDING_TEMPLATE_ID = 'a0000000-0000-0000-0000-000000000099';
        const partners = data
          .filter(
            (p: any) =>
              p.id &&
              p.id.toLowerCase() !== ONBOARDING_TEMPLATE_ID &&
              !isRemovedDemoPartnerId(p.id)
          )
          .map((p: any) => ({
            id: p.id,
            name: p.name || 'IDEMO Partner',
            companyName: p.company_name || '',
            type: p.partner_type || 'Individual',
            description: p.description || '',
            city: p.city || 'Belgrade',
            languages: p.languages || ['English'],
            website: p.website || '',
            logoUrl: p.logo_url || '',
            verificationStatus: p.verification_status === 'VERIFIED' ? ('VERIFIED' as const) : ('UNVERIFIED' as const),
            status: 'ACTIVE' as const
          }));

        return { success: true, partners };
      }
    } catch (err: any) {
      console.error('[IDEMO Partner Directory] Exception fetching directory:', err);
      return { success: false, error: err.message || 'Directory fetch failed' };
    }
  }

  // Fallback to local memory when Supabase is unconfigured
  const local = getAllPartners().filter(
    (p) => p.id !== 'a0000000-0000-0000-0000-000000000099' && !isRemovedDemoPartnerId(p.id)
  );
  return {
    success: true,
    partners: local.map((p) => ({
      id: p.id,
      name: p.name,
      companyName: p.companyName || '',
      type: p.type || 'Individual',
      description: p.description || '',
      city: p.city || 'Belgrade',
      languages: p.languages || ['English'],
      website: p.website || '',
      logoUrl: p.logoUrl || '',
      verificationStatus: p.verificationStatus === 'verified' ? ('VERIFIED' as const) : ('UNVERIFIED' as const),
      status: 'ACTIVE' as const
    }))
  };
}

export function getAllPartners(): Partner[] {
  const overrides = getPersistedPartnerOverrides();
  const partnersMap = new Map<string, Partner>();

  // Load static baseline partners first (excluding removed demo IDs)
  STATIC_PARTNERS.forEach((p) => {
    if (!isRemovedDemoPartnerId(p.id) && !isRemovedDemoPartnerId(p.publicCode)) {
      partnersMap.set(p.id, { ...p });
    }
  });

  // Apply durable local storage overrides
  Object.values(overrides).forEach((p) => {
    if (!isRemovedDemoPartnerId(p.id) && !isRemovedDemoPartnerId(p.publicCode)) {
      partnersMap.set(p.id, { ...p });
    }
  });

  return Array.from(partnersMap.values());
}

export function savePartnerProfile(partner: Partner): Partner {
  if (isRemovedDemoPartnerId(partner.id) || isRemovedDemoPartnerId(partner.publicCode)) {
    throw new Error('Cannot save profile for removed demo partner.');
  }

  const overrides = getPersistedPartnerOverrides();
  const existingMap = new Map<string, Partner>();
  STATIC_PARTNERS.forEach((p) => existingMap.set(p.id, p));

  const current = overrides[partner.id] || existingMap.get(partner.id);
  let updated: Partner;

  if (current) {
    updated = {
      ...partner,
      verificationStatus: current.verificationStatus || partner.verificationStatus || 'unverified',
      stage: current.stage || partner.stage || 'Candidate',
      conciergeRoutingEligible: current.conciergeRoutingEligible || partner.conciergeRoutingEligible || 'No',
      status: current.status || partner.status || 'invited',
    };
  } else {
    updated = {
      ...partner,
      verificationStatus: 'unverified',
      stage: 'Candidate',
      conciergeRoutingEligible: 'No',
      status: 'invited',
    };
  }

  overrides[partner.id] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function verifyPartnerAction(partnerId: string, reviewer: string = 'Admin'): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const updated: Partner = {
    ...partner,
    verificationStatus: 'verified',
    verificationDetails: `Explicitly verified by ${reviewer} on ${new Date().toISOString()}`,
    lastVerified: new Date().toISOString().split('T')[0],
    stage: partner.stage === 'Active' ? 'Active' : 'Approved',
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function activatePartnerAction(partnerId: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const state = getPartnerLifecycleState(partner);
  if (!state.isVerified) {
    throw new Error(`Partner ${partnerId} cannot be activated before explicit Admin verification.`);
  }

  const updated: Partner = {
    ...partner,
    stage: 'Active',
    status: 'active',
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function enableConciergeRoutingAction(partnerId: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const state = getPartnerLifecycleState(partner);
  if (!state.isVerified || !state.isActive) {
    throw new Error(`Partner ${partnerId} must be both verified and active before enabling concierge routing.`);
  }

  const updated: Partner = {
    ...partner,
    conciergeRoutingEligible: 'Yes',
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function disableConciergeRoutingAction(partnerId: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const updated: Partner = {
    ...partner,
    conciergeRoutingEligible: 'No',
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function suspendPartnerAction(partnerId: string, reason?: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const updated: Partner = {
    ...partner,
    stage: 'Suspended',
    status: 'suspended',
    conciergeRoutingEligible: 'No',
    is_open_for_inquiries: false,
    verificationDetails: reason ? `Suspended: ${reason}` : partner.verificationDetails,
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function retirePartnerAction(partnerId: string, reason?: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const updated: Partner = {
    ...partner,
    stage: 'Archived',
    status: 'closed',
    verificationStatus: 'archived',
    conciergeRoutingEligible: 'No',
    is_open_for_inquiries: false,
    verificationDetails: reason ? `Retired: ${reason}` : partner.verificationDetails,
  };

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}

export function reactivatePartnerAction(partnerId: string): Partner {
  const all = getAllPartners();
  const partner = all.find((p) => p.id === partnerId);
  if (!partner) throw new Error(`Partner ${partnerId} not found`);

  const vStatus = (partner.verificationStatus || '').toLowerCase();
  const stageProp = (partner.stage || '').toString();
  const statusProp = (partner.status || '').toLowerCase();

  const isRetired =
    stageProp === 'Archived' ||
    stageProp === 'Retired' ||
    statusProp === 'closed' ||
    statusProp === 'retired' ||
    vStatus.includes('archived') ||
    vStatus.includes('retired');

  const wasVerified =
    vStatus === 'verified' ||
    vStatus.includes('public contact verified') ||
    vStatus.includes('approved') ||
    stageProp === 'Approved' ||
    stageProp === 'Active' ||
    stageProp === 'Suspended';

  let updated: Partner;

  if (isRetired) {
    updated = {
      ...partner,
      stage: 'Candidate',
      status: 'invited',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No',
      is_open_for_inquiries: false,
    };
  } else {
    updated = {
      ...partner,
      stage: wasVerified ? 'Active' : 'Candidate',
      status: wasVerified ? 'active' : 'invited',
      verificationStatus: wasVerified ? 'verified' : 'unverified',
      conciergeRoutingEligible: 'No',
      is_open_for_inquiries: wasVerified,
    };
  }

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}
