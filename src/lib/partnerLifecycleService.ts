/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Partner } from '../types';
import { PARTNERS as STATIC_PARTNERS } from '../data/partners';
import { safeStorage } from './safeStorage';

export interface PublicDirectoryFetchResult {
  success: boolean;
  partners: Partner[];
  error?: string;
}

const PARTNER_OVERRIDES_STORAGE_KEY = 'idemo_partner_overrides_v1';
const REMOVED_DEMO_PARTNERS_KEY = 'idemo_removed_demo_partner_ids';

export function isRemovedDemoPartnerId(partnerId: string | null | undefined): boolean {
  if (!partnerId) return false;
  const norm = partnerId.trim().toLowerCase();
  if (
    norm === '00000000-0000-0000-0000-000000000000' ||
    norm === 'p-onboarding-template-000'
  ) {
    return true;
  }
  try {
    const raw = safeStorage.getItem(REMOVED_DEMO_PARTNERS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      if (Array.isArray(ids) && ids.some(id => String(id).trim().toLowerCase() === norm)) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function markDemoPartnerAsRemoved(partnerId: string): void {
  if (!partnerId) return;
  try {
    const norm = partnerId.trim().toLowerCase();
    const raw = safeStorage.getItem(REMOVED_DEMO_PARTNERS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.some(id => String(id).trim().toLowerCase() === norm)) {
      ids.push(partnerId);
      safeStorage.setItem(REMOVED_DEMO_PARTNERS_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
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
    let raw = safeStorage.getItem(PARTNER_OVERRIDES_STORAGE_KEY);
    if (!raw) {
      // Check legacy alternate storage key
      const legacyRaw = safeStorage.getItem('idemo_partner_lifecycle_overrides');
      if (legacyRaw) {
        raw = legacyRaw;
        safeStorage.setItem(PARTNER_OVERRIDES_STORAGE_KEY, legacyRaw);
      }
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partner>;
    const sanitized: Record<string, Partner> = {};
    const legacyIds = new Set([
      'p-001', 'p-002', 'p-003', 'p-004', 'p-005', 'p-006', 'p-007', 'p-008', 'p-009',
      'p-010', 'p-011', 'p-012', 'p-013', 'p-014', 'p-015', 'p-016', 'p-017', 'p-018',
      'p-019', 'p-020', 'p-021', 'p-022', 'p-023', 'p-024', 'p-025', 'p-026', 'p-027', 'p-028'
    ]);
    for (const [key, val] of Object.entries(parsed)) {
      if (!legacyIds.has(key.toLowerCase()) && !legacyIds.has((val.id || '').toLowerCase())) {
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

let isSyncingApprovedPassports = false;

/**
 * Migrates a single approved passport record into the authoritative Partner Directory.
 * Ensures the partner has stage: 'Approved' and verificationStatus: 'verified'.
 */
export function migrateApprovedPassportToDirectory(
  passportData: any,
  rawPartnerKeyOrCode: string,
  options?: { suppressEvent?: boolean }
): Partner {
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuidLike = (val?: string | null): boolean => Boolean(val && uuidRegex.test(val.trim()));

  const nonUuidCandidates = [
    passportData.partner_name,
    passportData.partner_code,
    matchedPortal?.name,
    matchedPortal?.publicCode,
    matchedExisting?.nameEn,
    cleanKey,
  ].filter((c): c is string => typeof c === 'string' && c.trim().length > 0 && !isUuidLike(c));

  const partnerName =
    nonUuidCandidates[0] ||
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

  const reviewedAtIso = passportData.reviewed_at || matchedExisting?.lastVerified || new Date().toISOString();
  const lastVerifiedDate = reviewedAtIso.includes('T') ? reviewedAtIso.split('T')[0] : reviewedAtIso;

  const existingNameSr = matchedExisting?.nameSr && !isUuidLike(matchedExisting.nameSr) ? matchedExisting.nameSr : partnerName;
  const existingNameZh = matchedExisting?.nameZh && !isUuidLike(matchedExisting.nameZh) ? matchedExisting.nameZh : partnerName;

  const migratedPartner: Partner = {
    ...(matchedExisting || {}),
    id: partnerId,
    publicCode: (!isUuidLike(passportData.partner_code) && passportData.partner_code) || matchedExisting?.publicCode || partnerName,
    pinHash: matchedExisting?.pinHash || (matchedPortal?.pin ? `hash_${matchedPortal.pin}` : 'hash_default'),
    nameEn: partnerName,
    nameSr: existingNameSr,
    nameZh: existingNameZh,
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

  const prevOverride = overrides[partnerId];
  const hasChanged =
    !prevOverride ||
    prevOverride.stage !== migratedPartner.stage ||
    prevOverride.verificationStatus !== migratedPartner.verificationStatus ||
    prevOverride.nameEn !== migratedPartner.nameEn ||
    prevOverride.nameSr !== migratedPartner.nameSr ||
    prevOverride.descriptionEn !== migratedPartner.descriptionEn ||
    prevOverride.phone !== migratedPartner.phone ||
    prevOverride.email !== migratedPartner.email;

  if (hasChanged) {
    overrides[partnerId] = migratedPartner;
    savePartnerOverridesToStorage(overrides);

    if (!options?.suppressEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('idemo_partners_updated'));
    }
  }

  return migratedPartner;
}

/**
 * Scans all safeStorage Partner Passport entries and migrates any approved passports
 * into the authoritative Partner Directory (overrides).
 */
export function syncApprovedPassportsToDirectory(): void {
  if (isSyncingApprovedPassports) return;
  isSyncingApprovedPassports = true;
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
        migrateApprovedPassportToDirectory(passportData, key, { suppressEvent: true });
      }
    }
  } catch (err) {
    console.warn('[IDEMO Partner Directory Sync] Failed syncing approved passports:', err);
  } finally {
    isSyncingApprovedPassports = false;
  }
}

export async function fetchPublicApprovedPartnersDirectory(): Promise<PublicDirectoryFetchResult> {
  const { getSupabaseClient, isSupabaseConfigured } = await import("./supabaseClient");
  const ONBOARDING_TEMPLATE_ID = "a0000000-0000-0000-0000-000000000099";

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("fetch_public_approved_partner_directory_secure");

      if (error) {
        console.error("[IDEMO Partner Directory] Supabase directory fetch RPC error:", error.message);
        return { success: false, partners: [], error: error.message };
      }

      if (data?.success && Array.isArray(data.partners)) {
        if (data.partners.length === 0) {
          // Empty response clears stale cached overrides
          safeStorage.removeItem(PARTNER_OVERRIDES_STORAGE_KEY);
          return { success: true, partners: [] };
        }

        const LEGACY_PARTNER_IDS = new Set([
          'p-001', 'p-002', 'p-003', 'p-004', 'p-005', 'p-006', 'p-007', 'p-008', 'p-009',
          'p-010', 'p-011', 'p-012', 'p-013', 'p-014', 'p-015', 'p-016', 'p-017', 'p-018',
          'p-019', 'p-020', 'p-021', 'p-022', 'p-023', 'p-024', 'p-025', 'p-026', 'p-027', 'p-028'
        ]);

        const partners = data.partners
          .filter(
            (p: any) =>
              p.id &&
              p.id.toLowerCase() !== ONBOARDING_TEMPLATE_ID &&
              p.public_code?.toLowerCase() !== "p-onboarding-template-000" &&
              !LEGACY_PARTNER_IDS.has(String(p.id).toLowerCase()) &&
              !LEGACY_PARTNER_IDS.has(String(p.public_code || '').toLowerCase())
          )
          .map((p: any) => ({
            id: p.id,
            pinHash: "", // Excluded for public security
            nameEn: p.name,
            nameSr: p.name,
            nameZh: p.name,
            category: p.category,
            partnerType: p.partner_type || "Individual",
            descriptionEn: p.description,
            descriptionSr: p.description,
            descriptionZh: p.description,
            website: p.website || "",
            languages: p.languages || [],
            transportCapacity: p.transport_capacity || "none",
            noticeWindow: p.notice_window || "24h",
            phone: p.published_contact_phone,
            email: p.published_contact_email,
            directBookingPhone: p.published_contact_phone,
            directBookingEmail: p.published_contact_email,
            locationEn: p.location,
            locationSr: p.location,
            locationZh: p.location,
            stage: p.review_status === "approved" ? "Approved" : "Candidate",
            verificationStatus: p.review_status === "approved" ? "verified" : "unverified",
            status: p.status || "inactive"
          }));

        return { success: true, partners };
      }
    } catch (err: any) {
      console.error("[IDEMO Partner Directory] Exception fetching directory:", err);
      return { success: false, partners: [], error: err.message || "Directory fetch failed" };
    }
  }

  // Fallback to local memory when Supabase is unconfigured
  const local = getAllPartners().filter(
    (p) =>
      p.id !== ONBOARDING_TEMPLATE_ID &&
      p.publicCode !== "p-onboarding-template-000" &&
      !isRemovedDemoPartnerId(p.id)
  );

  return {
    success: true,
    partners: local
  };
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
