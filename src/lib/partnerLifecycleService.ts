/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Partner } from '../types';
import { PARTNERS as STATIC_PARTNERS } from '../data/partners';
import { safeStorage } from './safeStorage';

const PARTNER_OVERRIDES_STORAGE_KEY = 'idemo_partner_overrides_v1';

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
    return JSON.parse(raw) as Record<string, Partner>;
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
 * Migrates a single approved passport record into the authoritative Partner Directory.
 * Ensures the partner has stage: 'Approved' and verificationStatus: 'verified'.
 */
export function migrateApprovedPassportToDirectory(passportData: any, rawPartnerKeyOrCode: string): Partner {
  const overrides = getPersistedPartnerOverrides();
  const existingMap = new Map<string, Partner>();
  STATIC_PARTNERS.forEach((p) => existingMap.set(p.id.toLowerCase(), p));
  Object.values(overrides).forEach((p) => existingMap.set(p.id.toLowerCase(), p));

  const portalPartnersRaw = safeStorage.getItem('idemo_portal_partners');
  const portalPartners: any[] = portalPartnersRaw ? JSON.parse(portalPartnersRaw) : [];

  const cleanKey = String(rawPartnerKeyOrCode).replace(/^idemo_partner_passport_/i, '').trim();
  const matchedPortal = portalPartners.find(
    (p) =>
      String(p.id).toLowerCase() === cleanKey.toLowerCase() ||
      String(p.publicCode || '').toLowerCase() === cleanKey.toLowerCase() ||
      String(p.pin || '').toLowerCase() === cleanKey.toLowerCase()
  );

  const matchedExisting =
    existingMap.get(cleanKey.toLowerCase()) ||
    (matchedPortal?.id ? existingMap.get(String(matchedPortal.id).toLowerCase()) : undefined) ||
    (passportData.partner_code ? existingMap.get(String(passportData.partner_code).toLowerCase()) : undefined);

  // Authoritative Partner ID determination
  let partnerId = passportData.partner_id || matchedExisting?.id || matchedPortal?.id || cleanKey;
  if (!partnerId.startsWith('P-') && !partnerId.includes('-')) {
    partnerId = `P-${partnerId.toUpperCase()}`;
  }

  const partnerName =
    passportData.partner_name ||
    matchedExisting?.nameEn ||
    matchedPortal?.name ||
    passportData.partner_code ||
    cleanKey;

  const contactPhone =
    passportData.published_contact_phone ||
    passportData.draft_contact_phone ||
    matchedExisting?.phone ||
    matchedPortal?.contactPhone ||
    '';

  const contactEmail =
    passportData.published_contact_email ||
    passportData.draft_contact_email ||
    matchedExisting?.email ||
    '';

  const introText =
    passportData.intro_published ||
    passportData.intro_draft ||
    matchedExisting?.descriptionEn ||
    '';

  const category =
    matchedExisting?.category ||
    matchedPortal?.category ||
    passportData.proposed_rec_category ||
    'Tourist Guide';

  const linkedRecs =
    Array.isArray(passportData.applied_recs) && passportData.applied_recs.length > 0
      ? passportData.applied_recs
      : matchedExisting?.linkedRecommendations || matchedPortal?.assignedRecs || [];

  const reviewedAtIso = passportData.reviewed_at || new Date().toISOString();
  const lastVerifiedDate = reviewedAtIso.includes('T') ? reviewedAtIso.split('T')[0] : reviewedAtIso;

  const migratedPartner: Partner = {
    ...(matchedExisting || {}),
    id: partnerId,
    pinHash: matchedExisting?.pinHash || (matchedPortal?.pin ? `hash_${matchedPortal.pin}` : 'hash_default'),
    nameEn: partnerName,
    nameSr: matchedExisting?.nameSr || partnerName,
    nameZh: matchedExisting?.nameZh || partnerName,
    category,
    partnerType: passportData.partner_type || matchedExisting?.partnerType || 'Individual',
    website: passportData.website || matchedExisting?.website,
    guideLicence: passportData.guide_licence || matchedExisting?.guideLicence,
    pib: passportData.pib || matchedExisting?.pib,
    languages: passportData.languages || matchedExisting?.languages || ['English', 'Serbian'],
    transportCapacity: passportData.transport_capacity || matchedExisting?.transportCapacity || 'none',
    noticeWindow: passportData.notice_window || matchedExisting?.noticeWindow || '24h',
    stage: 'Approved',
    verificationStatus: 'verified',
    verificationDetails: `Approved via IDEMO Partner Passport Review on ${reviewedAtIso}`,
    lastVerified: lastVerifiedDate,
    status: matchedExisting?.status === 'active' ? 'active' : 'invited',
    descriptionEn: introText || matchedExisting?.descriptionEn,
    descriptionSr: introText || matchedExisting?.descriptionSr,
    descriptionZh: introText || matchedExisting?.descriptionZh,
    phone: contactPhone || matchedExisting?.phone,
    email: contactEmail || matchedExisting?.email,
    directBookingPhone: contactPhone || matchedExisting?.directBookingPhone,
    directBookingEmail: contactEmail || matchedExisting?.directBookingEmail,
    linkedRecommendations: linkedRecs,
    locationEn: matchedExisting?.locationEn || matchedPortal?.geography || 'Belgrade Metro & Serbia',
    locationSr: matchedExisting?.locationSr || matchedPortal?.geography || 'Beograd & Srbija',
    locationZh: matchedExisting?.locationZh || matchedPortal?.geography || '贝尔格莱德及塞尔维亚',
  };

  overrides[partnerId] = migratedPartner;
  savePartnerOverridesToStorage(overrides);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('idemo_partners_updated'));
  }

  return migratedPartner;
}

/**
 * Scans all safeStorage Partner Passport entries and migrates any approved passports
 * into the authoritative Partner Directory (overrides).
 */
export function syncApprovedPassportsToDirectory(): void {
  try {
    const passportKeys = safeStorage.getAllKeys().filter((k) => k.toLowerCase().startsWith('idemo_partner_passport_'));
    for (const key of passportKeys) {
      const raw = safeStorage.getItem(key);
      if (!raw) continue;
      let passportData: any;
      try {
        passportData = JSON.parse(raw);
      } catch {
        continue;
      }

      if (passportData.review_status === 'approved') {
        migrateApprovedPassportToDirectory(passportData, key);
      }
    }
  } catch (err) {
    console.warn('[IDEMO Partner Directory Sync] Failed syncing approved passports:', err);
  }
}

export function getAllPartners(): Partner[] {
  // First synchronize any approved passports into the directory
  syncApprovedPassportsToDirectory();

  const overrides = getPersistedPartnerOverrides();
  const partnersMap = new Map<string, Partner>();

  // Load static baseline partners first
  STATIC_PARTNERS.forEach((p) => partnersMap.set(p.id, { ...p }));

  // Apply durable local storage overrides & new local partners
  Object.values(overrides).forEach((p) => {
    partnersMap.set(p.id, { ...p });
  });

  return Array.from(partnersMap.values());
}

/**
 * Saves modified partner profile fields.
 * Preserves lifecycle state unless explicit lifecycle action arguments are provided.
 */
export function savePartnerProfile(partner: Partner): Partner {
  const overrides = getPersistedPartnerOverrides();
  const existingMap = new Map<string, Partner>();
  STATIC_PARTNERS.forEach((p) => existingMap.set(p.id, p));
  const current = overrides[partner.id] || existingMap.get(partner.id);

  let updated: Partner;
  if (current) {
    // Preserve lifecycle state when updating ordinary profile fields
    updated = {
      ...partner,
      verificationStatus: current.verificationStatus || partner.verificationStatus || 'unverified',
      stage: current.stage || partner.stage || 'Candidate',
      conciergeRoutingEligible: current.conciergeRoutingEligible || partner.conciergeRoutingEligible || 'No',
      status: current.status || partner.status || 'invited',
    };
  } else {
    // New partner created: default strictly to Candidate / unverified / non-routable
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

/**
 * Explicit Admin Action: Verify Partner
 */
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

/**
 * Explicit Admin Action: Activate Partner
 */
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

/**
 * Explicit Admin Action: Enable Concierge Routing
 */
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

/**
 * Explicit Admin Action: Disable Concierge Routing
 */
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

/**
 * Explicit Admin Action: Suspend Partner
 */
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

/**
 * Explicit Admin Action: Retire Partner
 */
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

/**
 * Explicit Admin Action: Reactivate Partner
 */
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
    // Reactivating a Retired partner restores Candidate state for explicit re-verification
    updated = {
      ...partner,
      stage: 'Candidate',
      status: 'invited',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No',
      is_open_for_inquiries: false,
    };
  } else {
    // Reactivating a Suspended partner restores Active status if verified, else Candidate
    updated = {
      ...partner,
      stage: wasVerified ? 'Active' : 'Candidate',
      status: wasVerified ? 'active' : 'invited',
      verificationStatus: wasVerified ? 'verified' : 'unverified',
      conciergeRoutingEligible: 'No', // Requires explicit re-enablement for routing
      is_open_for_inquiries: wasVerified,
    };
  }

  const overrides = getPersistedPartnerOverrides();
  overrides[partnerId] = updated;
  savePartnerOverridesToStorage(overrides);
  return updated;
}
