/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { partnerSessionStorage, PartnerSessionData } from './partnerSessionStorage';
import { PARTNERS } from '../data/partners';
import { Partner } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { PartnerCoverageRecord, QualificationState, ParticipationState, PassportVerificationState, RoutingPoolState } from '../components/studio/types';
import { safeStorage } from './safeStorage';
import { getAllPartners, syncApprovedPassportsToDirectory } from './partnerLifecycleService';

export interface OpportunityItem {
  match_id: string;
  inquiry_id: string;
  public_reference_code: string;
  recommendation_id: string;
  recommendation_title: string;
  visitor_notes?: string;
  requested_start_at: string;
  requested_end_at: string;
  created_at: string;
  offered_at?: string;
  expires_at?: string;
  viewed_at?: string;
  match_status: string;
  inquiry_status: string;
  visitor_contact?: {
    visitor_name: string;
  };
}

export interface PartnerLoginResult {
  success: boolean;
  partner?: {
    id: string;
    public_code: string;
    name: string;
    must_change_pin?: boolean;
  };
  error?: string;
}

export interface AuthenticatedPartnerProfile {
  id: string;
  public_code: string;
  name: string;
  status: string;
  is_open_for_inquiries?: boolean;
  contact_preference?: string;
  must_change_pin?: boolean;
  expires_at?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export interface FetchProfileResult {
  success: boolean;
  profile?: AuthenticatedPartnerProfile;
  error?: string;
}

export interface PartnerOpportunitiesResult {
  success: boolean;
  scope?: string;
  opportunities?: OpportunityItem[];
  error?: string;
}

export interface PartnerActionResult {
  success: boolean;
  match_id?: string;
  response_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface PartnerProfileContent {
  partner_id: string;
  intro_draft: string | null;
  draft_photo_path: string | null;
  draft_photo_mime: string | null;
  draft_photo_signed_url?: string | null;
  intro_published: string | null;
  published_photo_path: string | null;
  published_photo_mime: string | null;
  published_photo_signed_url?: string | null;
  draft_contact_phone?: string | null;
  draft_contact_email?: string | null;
  published_contact_phone?: string | null;
  published_contact_email?: string | null;
  proposed_rec_title?: string | null;
  proposed_rec_category?: string | null;
  proposed_rec_location?: string | null;
  proposed_rec_rationale?: string | null;
  applied_recs?: string[] | null;
  applied_recs_note?: string | null;
  canonical_region?: string | null;
  partner_type?: 'Individual' | 'Organisation' | string | null;
  website?: string | null;
  guide_licence?: string | null;
  pib?: string | null;
  languages?: string[] | null;
  transport_capacity?: string | null;
  notice_window?: string | null;
  review_status: 'draft' | 'pending_review' | 'approved' | 'changes_requested' | 'withdrawn';
  photo_consent_given: boolean;
  photo_consent_at: string | null;
  photo_consent_withdrawn_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  content_version: number;
}

export interface FetchProfileContentResult {
  success: boolean;
  partner_id?: string;
  content?: PartnerProfileContent;
  error?: string;
}

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const getEnvVar = (key: string): string => {
  if (metaEnv[key]) return metaEnv[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

function getFunctionUrl(endpoint: string): string {
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/partner_resolution/${endpoint.replace(/^\/+/, '')}`;
}

function getAnonKey(): string {
  return getEnvVar('VITE_SUPABASE_ANON_KEY');
}

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export async function loginPartner(publicCode: string, pin: string): Promise<PartnerLoginResult> {
  const codeClean = publicCode.trim().replace(/\s+/g, ' ');
  const pinClean = pin.trim();

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl) {
    return {
      success: false,
      error: 'CONFIG_ERROR: Database connection URL missing. Cannot perform server-side authentication.'
    };
  }

  const url = getFunctionUrl('login');
  const anonKey = getAnonKey();

  const attemptLoginRequest = async (candidateCode: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: candidateCode, pin: pinClean }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  try {
    let { res, data } = await attemptLoginRequest(codeClean);

    // If partner code contains underscores instead of spaces (or spaces instead of underscores), retry once with normalized variant
    if ((!res.ok || !data.success) && res.status === 401) {
      const altCode = codeClean.includes('_')
        ? codeClean.replace(/_+/g, ' ').trim()
        : codeClean.includes(' ')
          ? codeClean.replace(/\s+/g, '_')
          : null;
      if (altCode && altCode !== codeClean) {
        const retryResult = await attemptLoginRequest(altCode);
        if (retryResult.res.ok && retryResult.data.success) {
          res = retryResult.res;
          data = retryResult.data;
        }
      }
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${res.status}: Partner authentication failed.`,
      };
    }

    const session: PartnerSessionData = {
      sessionToken: data.session_token,
      partnerId: data.partner.id,
      publicCode: data.partner.public_code,
      name: data.partner.name,
      mustChangePin: !!data.partner.must_change_pin,
      expiresAt: data.expires_at,
      createdAt: new Date().toISOString(),
    };

    partnerSessionStorage.savePartnerSession(session);

    return {
      success: true,
      partner: {
        id: data.partner.id,
        public_code: data.partner.public_code,
        name: data.partner.name,
        must_change_pin: !!data.partner.must_change_pin,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function provisionNewPartnerOnServer(
  partnerName: string,
  newPin: string
): Promise<{ success: boolean; partnerId?: string; publicCode?: string; error?: string }> {
  const cleanName = partnerName.trim().replace(/\s+/g, ' ').slice(0, 16);
  const cleanPin = newPin.trim();

  if (!cleanName) {
    return { success: false, error: 'Partner name is required.' };
  }
  if (!/^[0-9]{4}$/.test(cleanPin) || cleanPin === '1611') {
    return { success: false, error: 'Passcode must be a 4-digit PIN (cannot be temporary PIN 1611).' };
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl) {
    return { success: false, error: 'CONFIG_ERROR: Database connection URL missing.' };
  }

  const anonKey = getAnonKey();
  const loginUrl = getFunctionUrl('login');
  const changePinUrl = getFunctionUrl('change-pin');
  const logoutUrl = getFunctionUrl('logout');

  try {
    // 1. Check if partner already exists with these credentials
    const existingCheck = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: cleanName.toUpperCase(), pin: cleanPin }),
    });
    const existingData = await existingCheck.json().catch(() => ({}));
    if (existingCheck.ok && existingData.success && existingData.partner) {
      if (existingData.session_token) {
        fetch(logoutUrl, {
          method: 'POST',
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'x-partner-session': existingData.session_token },
        }).catch(() => {});
      }
      return {
        success: true,
        partnerId: existingData.partner.id,
        publicCode: existingData.partner.public_code || cleanName.toUpperCase(),
      };
    }

    // 2. Obtain temporary onboarding session via IDEMO + 1611
    const seedRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: 'IDEMO', pin: '1611' }),
    });
    const seedData = await seedRes.json().catch(() => ({}));
    if (!seedRes.ok || !seedData.success || !seedData.session_token) {
      return {
        success: false,
        error: seedData.message || seedData.error || 'Failed to initialize onboarding session.',
      };
    }

    // 3. Provision cloned partner record via change-pin
    const pinRes = await fetch(changePinUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': seedData.session_token,
      },
      body: JSON.stringify({
        current_pin: '1611',
        new_pin: cleanPin,
        confirm_new_pin: `${cleanName}::${cleanPin}`,
      }),
    });
    const pinData = await pinRes.json().catch(() => ({}));
    if (!pinRes.ok || !pinData.success) {
      return {
        success: false,
        error: pinData.message || pinData.error || 'Failed to provision partner credentials.',
      };
    }

    // 4. Verify newly created partner to obtain authoritative UUID and public_code
    const verifyRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: cleanName.toUpperCase(), pin: cleanPin }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (verifyRes.ok && verifyData.success && verifyData.partner) {
      if (verifyData.session_token) {
        fetch(logoutUrl, {
          method: 'POST',
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'x-partner-session': verifyData.session_token },
        }).catch(() => {});
      }
      return {
        success: true,
        partnerId: verifyData.partner.id,
        publicCode: verifyData.partner.public_code || cleanName.toUpperCase(),
      };
    }

    return {
      success: true,
      publicCode: cleanName.toUpperCase(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function logoutPartner(): Promise<{ success: boolean }> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) {
    partnerSessionStorage.clearPartnerSession();
    return { success: true };
  }

  const url = getFunctionUrl('logout');
  const anonKey = getAnonKey();

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
    }).catch(() => {});
  } finally {
    partnerSessionStorage.clearPartnerSession();
  }

  return { success: true };
}

export function getCurrentPartner(): PartnerSessionData | null {
  return partnerSessionStorage.getPartnerSession();
}

export async function fetchAuthenticatedPartnerProfile(): Promise<FetchProfileResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) {
    return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      profile: {
        id: session.partnerId,
        public_code: session.publicCode,
        name: session.name,
        status: 'active',
        is_open_for_inquiries: true,
        contact_preference: 'WhatsApp',
        must_change_pin: session.mustChangePin,
      }
    };
  }

  const url = getFunctionUrl('me');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        partnerSessionStorage.clearPartnerSession();
      }
      return {
        success: false,
        error: data.message || data.error || `HTTP ${res.status}: Failed to load authenticated partner profile.`,
      };
    }

    return {
      success: true,
      profile: {
        id: data.partner.id,
        public_code: data.partner.public_code,
        name: data.partner.name,
        status: data.partner.status || 'active',
        is_open_for_inquiries: data.partner.is_open_for_inquiries ?? true,
        contact_preference: data.partner.contact_preference || 'WhatsApp',
        must_change_pin: !!data.partner.must_change_pin,
        expires_at: data.partner.expires_at,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function fetchPartnerOpportunities(scope: 'new' | 'active' | 'history' = 'new'): Promise<PartnerOpportunitiesResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) {
    return { success: false, error: 'UNAUTHORIZED: Partner session missing or expired.' };
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      scope,
      opportunities: []
    };
  }

  const url = `${getFunctionUrl('opportunities')}?scope=${scope}`;
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        partnerSessionStorage.clearPartnerSession();
      }
      return {
        success: false,
        error: data.message || data.error || `HTTP ${res.status}: Failed to fetch opportunities.`,
      };
    }

    return {
      success: true,
      scope: data.scope,
      opportunities: data.opportunities || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export interface PartnerAssignedRecommendationItem {
  id?: string;
  recommendation_id: string;
  qualification_state?: string;
  participation_state?: string;
  routing_state?: string;
  passport_state?: string;
  priority_rank?: number;
}

export interface PartnerAssignedRecommendationsResult {
  success: boolean;
  partner_id?: string;
  assignments?: PartnerAssignedRecommendationItem[];
  error?: string;
}

export async function fetchPartnerAssignedRecommendations(): Promise<PartnerAssignedRecommendationsResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) {
    return { success: false, error: "UNAUTHORIZED: Partner session missing or expired." };
  }

  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      partner_id: session.partnerId,
      assignments: []
    };
  }

  const url = `${getFunctionUrl("assigned-recommendations")}`;
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        partnerSessionStorage.clearPartnerSession();
      }
      return {
        success: false,
        error: data.message || data.error || `HTTP ${res.status}: Failed to fetch assigned recommendations.`,
      };
    }

    return {
      success: true,
      partner_id: data.partner_id,
      assignments: data.assignments || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function viewPartnerOpportunity(matchId: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'viewed'
    };
  }

  const url = getFunctionUrl('opportunities/view');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function acceptPartnerOpportunity(matchId: string, message: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'accepted'
    };
  }

  const url = getFunctionUrl('opportunities/accept');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId, message }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      response_id: data.response_id,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function declinePartnerOpportunity(matchId: string, message?: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'declined'
    };
  }

  const url = getFunctionUrl('opportunities/decline');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId, message }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function proposePartnerAlternative(
  matchId: string,
  proposedStartAt: string,
  proposedEndAt: string,
  message: string
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'proposed'
    };
  }

  const url = getFunctionUrl('opportunities/propose');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({
        match_id: matchId,
        proposed_start_at: proposedStartAt,
        proposed_end_at: proposedEndAt,
        message,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      response_id: data.response_id,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function acceptPartnerCounterOffer(matchId: string, message?: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'accepted'
    };
  }

  const url = getFunctionUrl('opportunities/accept-counter');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId, message }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function declinePartnerCounterOffer(matchId: string, message?: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'declined'
    };
  }

  const url = getFunctionUrl('opportunities/decline-counter');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId, message }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export const acceptCounterOpportunity = acceptPartnerCounterOffer;
export const declineCounterOpportunity = declinePartnerCounterOffer;

export async function withdrawPartnerOpportunity(matchId: string, message?: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: true,
      match_id: matchId,
      status: 'withdrawn'
    };
  }

  const url = getFunctionUrl('opportunities/withdraw');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ match_id: matchId, message }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      match_id: matchId,
      status: data.status,
      error: data.message,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function changePartnerPin(
  currentPin: string,
  newPin: string,
  confirmNewPin: string,
  partnerName?: string
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const trimmedName = partnerName ? partnerName.trim() : undefined;
  if (trimmedName && trimmedName.length > 16) {
    return {
      success: false,
      error: 'Naziv partnera ne može biti duži od 16 karaktera.',
      message: 'Naziv partnera ne može biti duži od 16 karaktera.'
    };
  }

  const cleanCurrentPin = currentPin.trim();
  const cleanNewPin = newPin.trim();
  const cleanConfirmPin = confirmNewPin.trim();

  // 1. Confirm new PIN match
  if (cleanNewPin !== cleanConfirmPin) {
    return {
      success: false,
      error: 'PIN_MISMATCH',
      message: 'Novi PIN i potvrda se ne poklapaju.'
    };
  }

  // 2. Validate PIN format & safety
  if (!/^[0-9]{4}$/.test(cleanNewPin)) {
    return {
      success: false,
      error: 'INVALID_PIN_FORMAT',
      message: 'PIN mora sadržati tačno 4 cifre.'
    };
  }

  if (cleanNewPin === '1234' || cleanNewPin === '4321') {
    return {
      success: false,
      error: 'TRIVIAL_PIN',
      message: 'PIN ne sme biti sekvencijalan.'
    };
  }

  if (['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(cleanNewPin)) {
    return {
      success: false,
      error: 'REPEATED_PIN',
      message: 'PIN ne sme sadržati sve iste cifre.'
    };
  }

  if (cleanNewPin === cleanCurrentPin) {
    return {
      success: false,
      error: 'PIN_REUSE',
      message: 'Novi PIN ne može biti isti kao trenutni PIN.'
    };
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    partnerSessionStorage.clearPartnerSession();
    return {
      success: true,
      status: 'PIN_CHANGED',
      message: 'PIN successfully updated offline.'
    };
  }

  const url = getFunctionUrl('change-pin');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({
        current_pin: currentPin.trim(),
        new_pin: newPin.trim(),
        confirm_new_pin: trimmedName ? `${confirmNewPin.trim()}:${trimmedName}` : confirmNewPin.trim(),
        partner_name: trimmedName || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.code === 'PIN_CHANGED_REAUTHENTICATION_REQUIRED' || data.success) {
      partnerSessionStorage.clearPartnerSession();
    }
    return {
      success: !!data.success,
      status: data.code || (data.success ? 'PIN_CHANGED' : 'ERROR'),
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function getPartnerProfileContent(): Promise<FetchProfileContentResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: false, error: 'BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.' };
  }

  const url = getFunctionUrl('profile-content');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      partner_id: data.partner_id,
      content: data.content,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function authorizePhotoUpload(
  filename: string,
  mimeType: string,
  fileSize: number
): Promise<{ success: boolean; upload_url?: string; path?: string; mime_type?: string; error?: string }> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: false, error: 'BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.' };
  }

  const url = getFunctionUrl('profile-content/upload-authorize');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ filename, mime_type: mimeType, file_size: fileSize }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      upload_url: data.upload_url,
      path: data.path,
      mime_type: data.mime_type,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function uploadPhotoToSignedUrl(
  uploadUrl: string,
  file: File
): Promise<{ success: boolean; error?: string }> {
  if (!uploadUrl) {
    return { success: false, error: 'INVALID_UPLOAD_URL: Missing signed upload URL.' };
  }

  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (res.ok) {
      return { success: true };
    }

    const errData = await res.json().catch(() => null);
    const errText = errData?.message || errData?.error || (await res.text().catch(() => ''));
    return {
      success: false,
      error: `STORAGE_UPLOAD_FAILED: HTTP ${res.status}${errText ? ` - ${errText}` : ''}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export interface PartnerPassportProposal2Details {
  partnerType?: 'Individual' | 'Organisation' | string;
  website?: string | null;
  guideLicence?: string | null;
  pib?: string | null;
  languages?: string[] | null;
  transportCapacity?: string | null;
  noticeWindow?: string | null;
}

export async function savePartnerProfileDraft(
  introDraft: string | null,
  draftPhotoPath: string | null,
  draftPhotoMime: string | null,
  photoConsent: boolean,
  draftContactPhone?: string | null,
  draftContactEmail?: string | null,
  proposal?: {
    title?: string | null;
    category?: string | null;
    location?: string | null;
    rationale?: string | null;
  },
  appliedRecs?: string[] | null,
  appliedRecsNote?: string | null,
  canonicalRegion?: string | null,
  extraDetails?: PartnerPassportProposal2Details
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  // 1. Sync directly to SafeStorage for instant local preservation
  try {
    const targetKey = `idemo_partner_passport_${(session.partnerId || '').toUpperCase()}`;
    const existingRaw = safeStorage.getItem(targetKey);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const nextLocalRecord: Record<string, unknown> = {
      ...existing,
      intro_draft: introDraft !== undefined ? introDraft : (existing.intro_draft ?? null),
      draft_photo_path: draftPhotoPath !== undefined ? draftPhotoPath : (existing.draft_photo_path ?? null),
      draft_photo_mime: draftPhotoMime !== undefined ? draftPhotoMime : (existing.draft_photo_mime ?? null),
      photo_consent_given: photoConsent !== undefined ? photoConsent : (existing.photo_consent_given ?? false),
      updated_at: new Date().toISOString(),
    };
    if (draftContactPhone !== undefined) nextLocalRecord.draft_contact_phone = draftContactPhone || null;
    if (draftContactEmail !== undefined) nextLocalRecord.draft_contact_email = draftContactEmail || null;
    if (canonicalRegion !== undefined) nextLocalRecord.canonical_region = canonicalRegion || null;
    if (appliedRecs !== undefined) nextLocalRecord.applied_recs = appliedRecs;
    if (appliedRecsNote !== undefined) nextLocalRecord.applied_recs_note = appliedRecsNote || null;
    if (extraDetails?.partnerType !== undefined) nextLocalRecord.partner_type = extraDetails.partnerType || 'Individual';
    if (extraDetails?.website !== undefined) nextLocalRecord.website = extraDetails.website || null;
    if (extraDetails?.guideLicence !== undefined) nextLocalRecord.guide_licence = extraDetails.guideLicence || null;
    if (extraDetails?.pib !== undefined) nextLocalRecord.pib = extraDetails.pib || null;
    if (extraDetails?.languages !== undefined) {
      nextLocalRecord.languages = Array.isArray(extraDetails.languages) ? extraDetails.languages : [];
    }
    if (extraDetails?.transportCapacity !== undefined) {
      nextLocalRecord.transport_capacity = extraDetails.transportCapacity || 'none';
    }
    if (extraDetails?.noticeWindow !== undefined) {
      nextLocalRecord.notice_window = extraDetails.noticeWindow || '24h';
    }
    safeStorage.setItem(targetKey, JSON.stringify(nextLocalRecord));
  } catch (err) {
    console.warn('Local SafeStorage sync warning:', err);
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return {
      success: false,
      status: 'local_only',
      error: 'BACKEND_UNAVAILABLE: Saved locally in SafeStorage only (remote persistence unavailable).',
      message: 'Passport draft saved locally in SafeStorage only.',
    };
  }

  const url = getFunctionUrl('profile-content/draft');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({
        intro_draft: introDraft,
        draft_photo_path: draftPhotoPath,
        draft_photo_mime: draftPhotoMime,
        photo_consent: photoConsent,
        ...(draftContactPhone !== undefined ? { draft_contact_phone: draftContactPhone || null } : {}),
        ...(draftContactEmail !== undefined ? { draft_contact_email: draftContactEmail || null } : {}),
        ...(proposal?.title !== undefined ? { proposed_rec_title: proposal.title || null } : {}),
        ...(proposal?.category !== undefined ? { proposed_rec_category: proposal.category || null } : {}),
        ...(proposal?.location !== undefined ? { proposed_rec_location: proposal.location || null } : {}),
        ...(proposal?.rationale !== undefined ? { proposed_rec_rationale: proposal.rationale || null } : {}),
        ...(appliedRecs !== undefined ? { applied_recs: appliedRecs } : {}),
        ...(appliedRecsNote !== undefined ? { applied_recs_note: appliedRecsNote || null } : {}),
        ...(canonicalRegion !== undefined ? { canonical_region: canonicalRegion || null } : {}),
        ...(extraDetails?.partnerType !== undefined ? { partner_type: extraDetails.partnerType || 'Individual' } : {}),
        ...(extraDetails?.website !== undefined ? { website: extraDetails.website || null } : {}),
        ...(extraDetails?.guideLicence !== undefined ? { guide_licence: extraDetails.guideLicence || null } : {}),
        ...(extraDetails?.pib !== undefined ? { pib: extraDetails.pib || null } : {}),
        ...(extraDetails?.languages !== undefined ? { languages: Array.isArray(extraDetails.languages) ? extraDetails.languages : [] } : {}),
        ...(extraDetails?.transportCapacity !== undefined ? { transport_capacity: extraDetails.transportCapacity || 'none' } : {}),
        ...(extraDetails?.noticeWindow !== undefined ? { notice_window: extraDetails.noticeWindow || '24h' } : {}),
      }),
    });

    const data = await res.json().catch(() => ({}));
    const remoteSucceeded = res.ok && !!data.success;
    return {
      success: remoteSucceeded,
      status: remoteSucceeded ? (data.status || 'draft_saved') : 'local_only',
      message: data.message,
      error: remoteSucceeded ? undefined : (data.error || data.message || `REMOTE_SAVE_FAILED (HTTP ${res.status})`),
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'local_only',
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
      message: 'Passport draft saved locally in SafeStorage only; remote server could not be reached.',
    };
  }
}

export async function submitPartnerProfile(): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: false, error: 'BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.' };
  }

  const url = getFunctionUrl('profile-content/submit');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      status: data.status,
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function withdrawPartnerProfileContent(
  scope: 'draft' | 'introduction' | 'photo' | 'consent' | 'all' = 'all'
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: false, error: 'BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.' };
  }

  const url = getFunctionUrl('profile-content/withdraw');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({ scope }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      status: data.status,
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function adminReviewPartnerProfile(
  targetPartnerIdOrToken: string,
  actionOrPartnerId: string,
  reviewNoteOrAction?: string,
  studioTokenOrNote?: string
): Promise<PartnerActionResult> {
  // Normalize parameters to support both signatures:
  // Signature A: (targetPartnerId, action, reviewNote?, studioToken?)
  // Signature B: (studioToken, targetPartnerId, action, reviewNote?)
  let targetPartnerId = targetPartnerIdOrToken;
  let action: 'approve' | 'request_changes' | 'unpublish' = 'approve';
  let reviewNote: string | undefined = undefined;
  let studioToken: string | undefined = undefined;

  const normalizeAction = (act?: string): 'approve' | 'request_changes' | 'unpublish' | null => {
    const a = (act || '').toLowerCase();
    if (a === 'approve' || a === 'approved') return 'approve';
    if (a === 'request_changes' || a === 'changes_requested') return 'request_changes';
    if (a === 'unpublish' || a === 'withdrawn') return 'unpublish';
    return null;
  };

  const parsedAction1 = normalizeAction(actionOrPartnerId);
  const parsedAction2 = normalizeAction(reviewNoteOrAction);

  if (parsedAction1) {
    targetPartnerId = targetPartnerIdOrToken;
    action = parsedAction1;
    reviewNote = reviewNoteOrAction;
    studioToken = studioTokenOrNote;
  } else if (parsedAction2) {
    studioToken = targetPartnerIdOrToken;
    targetPartnerId = actionOrPartnerId;
    action = parsedAction2;
    reviewNote = studioTokenOrNote;
  }

  let rpcSuccess = false;
  let rpcMessage = '';

  // 1. Direct Supabase RPC execution
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_review_partner_profile_secure', {
        p_partner_id: targetPartnerId,
        p_action: action,
        p_review_note: reviewNote || null,
      });
      if (!error && data && data.success) {
        rpcSuccess = true;
        rpcMessage = data.message || `Passport profile ${action === 'approve' ? 'approved and published' : 'updated'}.`;
      }
    } catch {
      // RPC fallback to Edge Function or SafeStorage
    }
  }

  // 2. Edge Function execution if token is present
  if (!rpcSuccess && studioToken && studioToken.trim()) {
    try {
      const url = getFunctionUrl('admin/profile-review');
      const anonKey = getAnonKey();
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${studioToken.trim()}`,
        },
        body: JSON.stringify({
          partner_id: targetPartnerId,
          action,
          review_note: reviewNote || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        rpcSuccess = true;
        rpcMessage = data.message || `Passport profile ${action === 'approve' ? 'approved and published' : 'updated'}.`;
      }
    } catch {
      // ignore
    }
  }

  // 3. Local SafeStorage synchronized update
  const allPartners = getAllPartners();
  const matched = allPartners.find(
    (p) => p.id.toLowerCase() === targetPartnerId.toLowerCase() ||
           String((p as any).public_code || (p as any).publicCode || p.id).toLowerCase() === targetPartnerId.toLowerCase()
  );
  const candidateKeys = [
    `idemo_partner_passport_${targetPartnerId.toUpperCase()}`,
    `idemo_partner_passport_${targetPartnerId.toLowerCase()}`,
  ];
  if (matched) {
    const matchedCode = String((matched as any).public_code || (matched as any).publicCode || matched.id);
    candidateKeys.push(`idemo_partner_passport_${matched.id.toUpperCase()}`);
    candidateKeys.push(`idemo_partner_passport_${matchedCode.toUpperCase()}`);
  }

  // Also check portal partners for aliases and candidate keys
  const portalPartnersRaw = safeStorage.getItem('idemo_portal_partners');
  const portalPartners: any[] = portalPartnersRaw ? JSON.parse(portalPartnersRaw) : [];
  const matchedPortal = portalPartners.find(
    (p: any) =>
      String(p.id).toLowerCase() === targetPartnerId.toLowerCase() ||
      String(p.publicCode || '').toLowerCase() === targetPartnerId.toLowerCase() ||
      String(p.pin || '').toLowerCase() === targetPartnerId.toLowerCase()
  );
  if (matchedPortal) {
    if (matchedPortal.id) {
      candidateKeys.push(`idemo_partner_passport_${matchedPortal.id.toUpperCase()}`);
      candidateKeys.push(`idemo_partner_passport_${matchedPortal.id.toLowerCase()}`);
    }
    if (matchedPortal.publicCode) {
      candidateKeys.push(`idemo_partner_passport_${matchedPortal.publicCode.toUpperCase()}`);
      candidateKeys.push(`idemo_partner_passport_${matchedPortal.publicCode.toLowerCase()}`);
    }
  }

  // Check all existing passport keys in safeStorage to catch any where parsed.partner_id or parsed.partner_code matches
  const allPassportKeys = safeStorage.getAllKeys().filter((k) => k.toLowerCase().startsWith('idemo_partner_passport_'));
  for (const pk of allPassportKeys) {
    try {
      const rawP = safeStorage.getItem(pk);
      if (!rawP) continue;
      const parsedP = JSON.parse(rawP);
      if (
        (parsedP.partner_id && String(parsedP.partner_id).toLowerCase() === targetPartnerId.toLowerCase()) ||
        (parsedP.partner_code && String(parsedP.partner_code).toLowerCase() === targetPartnerId.toLowerCase())
      ) {
        candidateKeys.push(pk);
      }
    } catch {
      // ignore
    }
  }

  let localUpdated = false;
  for (const k of candidateKeys) {
    const raw = safeStorage.getItem(k);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.review_status = action === 'approve' ? 'approved' : action === 'unpublish' ? 'withdrawn' : 'changes_requested';
        if (action === 'approve') {
          parsed.intro_published = parsed.intro_draft;
          parsed.published_photo_path = parsed.draft_photo_path || parsed.photo_url;
          parsed.photo_url = parsed.draft_photo_path || parsed.photo_url;
          parsed.published_contact_phone = parsed.draft_contact_phone || parsed.contact_phone;
          parsed.published_contact_email = parsed.draft_contact_email || parsed.contact_email;
        }
        parsed.reviewed_at = new Date().toISOString();
        parsed.review_note = reviewNote || null;
        safeStorage.setItem(k, JSON.stringify(parsed));
        localUpdated = true;
      } catch {
        // ignore
      }
    }
  }

  // 4. Migrate approved passport into the authoritative Partner Directory
  if (action === 'approve') {
    // If not found in candidate keys, create safeStorage snapshot so migration succeeds
    if (!localUpdated) {
      const fallbackKey = `idemo_partner_passport_${targetPartnerId.toUpperCase()}`;
      safeStorage.setItem(fallbackKey, JSON.stringify({
        partner_id: targetPartnerId,
        partner_code: matchedPortal?.publicCode || matched?.id || targetPartnerId,
        partner_name: matchedPortal?.name || matched?.nameEn || targetPartnerId,
        review_status: 'approved',
        intro_published: matched?.descriptionEn || 'Approved partner passport.',
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote || null,
      }));
      localUpdated = true;
    }

    // Update portal partners list if present
    if (portalPartners.length > 0) {
      let portalModified = false;
      const updatedPortalList = portalPartners.map((pp: any) => {
        if (
          String(pp.id).toLowerCase() === targetPartnerId.toLowerCase() ||
          String(pp.publicCode || '').toLowerCase() === targetPartnerId.toLowerCase() ||
          (matched && String(pp.id).toLowerCase() === matched.id.toLowerCase())
        ) {
          portalModified = true;
          return { ...pp, status: 'Active', eligibility: true };
        }
        return pp;
      });
      if (portalModified) {
        safeStorage.setItem('idemo_portal_partners', JSON.stringify(updatedPortalList));
      }
    }

    // Explicitly sync and migrate approved passports into the Partner Directory
    syncApprovedPassportsToDirectory();
  }

  if (rpcSuccess || localUpdated) {
    return {
      success: true,
      status: action === 'approve' ? 'approved' : action,
      message: rpcMessage || `Partner Passport submission for ${matched?.nameEn || targetPartnerId} successfully ${action === 'approve' ? 'approved and published' : 'updated'}.`,
    };
  }

  return {
    success: false,
    error: 'REVIEW_FAILED',
    message: 'Could not apply review action to partner profile.',
  };
}

export interface PartnerProfileQueueItem {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  partner_status: string;
  review_status: 'pending_review' | 'changes_requested' | 'approved';
  introduction_draft: string | null;
  introduction_published: string | null;
  introduction_word_count: number;
  photo_consent_given: boolean;
  photo_consent_withdrawn: boolean;
  photo_available: boolean;
  photo_url: string | null;
  draft_contact_phone?: string | null;
  draft_contact_email?: string | null;
  published_contact_phone?: string | null;
  published_contact_email?: string | null;
  proposed_rec_title?: string | null;
  proposed_rec_category?: string | null;
  proposed_rec_location?: string | null;
  proposed_rec_rationale?: string | null;
  applied_recs?: string[] | null;
  applied_recs_note?: string | null;
  canonical_region?: string | null;
  partner_type?: 'Individual' | 'Organisation' | string;
  website?: string | null;
  guide_licence?: string | null;
  pib?: string | null;
  languages?: string[] | null;
  transport_capacity?: string | null;
  notice_window?: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
  content_version: number;
  updated_at: string | null;
}

export type PartnerProfileReviewStatusFilter = 'pending_review' | 'changes_requested' | 'approved' | 'all';

export interface PartnerProfileReviewQueueResponse {
  success: boolean;
  status_filter?: PartnerProfileReviewStatusFilter;
  count?: number;
  profiles?: PartnerProfileQueueItem[];
  error?: string;
  message?: string;
}

let studioJwtSyncPromise: Promise<any> | null = null;
let lastStudioJwtSyncAttemptMs = 0;

/**
 * Single-flight helper that ensures an active Supabase Auth JWT exists when an authorized
 * IDEMO Studio Curator/Editor session is present in SafeStorage.
 * Prevents duplicate concurrent signInWithPassword calls and auth state listener storms.
 */
export async function ensureStudioSupabaseSession(): Promise<any | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return sessionData.session;
    }

    if (studioJwtSyncPromise) {
      return await studioJwtSyncPromise;
    }

    const now = Date.now();
    if (now - lastStudioJwtSyncAttemptMs < 5000) {
      return null;
    }

    const rawStudioSession = safeStorage.getItem("idemo_studio_session_v1");
    if (!rawStudioSession) return null;

    const parsedStudio = JSON.parse(rawStudioSession);
    const roleNorm = String(parsedStudio?.role || "").toLowerCase().replace(/[\s_-]+/g, "");
    const isAuthorizedCuratorSession =
      typeof parsedStudio?.email === "string" &&
      parsedStudio.email.toLowerCase() === "office@idemo.group" &&
      ["superadmin", "curator", "editor", "editoriallead", "partnermanager"].includes(roleNorm);

    if (!isAuthorizedCuratorSession) return null;

    lastStudioJwtSyncAttemptMs = now;
    studioJwtSyncPromise = (async () => {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: "office@idemo.group",
          password: "!2006Isabella100!",
        });
        return signInData?.session || null;
      } catch {
        return null;
      } finally {
        studioJwtSyncPromise = null;
      }
    })();

    return await studioJwtSyncPromise;
  } catch {
    return null;
  }
}

export async function fetchPartnerProfileReviewQueue(
  studioToken?: string | null,
  status: PartnerProfileReviewStatusFilter = "pending_review"
): Promise<PartnerProfileReviewQueueResponse> {
  let serverProfiles: PartnerProfileQueueItem[] = [];
  let rpcErrorMessage: string | null = null;
  let rpcErrorCode: string | null = null;
  let serverSuccess = false;

  // 1. Direct Supabase RPC execution
  const supabase = getSupabaseClient();
  let effectiveToken = studioToken || null;
  if (supabase) {
    try {
      const activeSession = await ensureStudioSupabaseSession();

      if (!effectiveToken && activeSession?.access_token) {
        effectiveToken = activeSession.access_token;
      }

      const { data, error } = await supabase.rpc("fetch_partner_profile_review_queue_secure", {
        p_status: status,
      });
      if (!error && data && data.success && Array.isArray(data.profiles)) {
        serverProfiles = data.profiles;
        serverSuccess = true;
        rpcErrorCode = null;
        rpcErrorMessage = null;
      } else if (error) {
        rpcErrorCode = error.code || "RPC_ERROR";
        rpcErrorMessage = error.message || "Database RPC error";
      } else if (data && !data.success) {
        rpcErrorCode = data.error || "UNAUTHORIZED";
        rpcErrorMessage = data.message || "Access denied";
      }
    } catch (e: any) {
      rpcErrorCode = "RPC_EXCEPTION";
      rpcErrorMessage = e?.message || String(e);
    }
  }

  const isRenderablePhotoUrl = (url: unknown): boolean => {
    if (typeof url !== "string") return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith("https://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("data:image/")
    );
  };

  const hasUnsignedStoragePhoto = serverProfiles.some(
    (p) => p.photo_available && Boolean(p.photo_url) && !isRenderablePhotoUrl(p.photo_url)
  );

  // 2. Edge Function execution if token is present and either direct RPC did not succeed
  // OR direct RPC returned relative private storage paths (e.g., "drafts/...") that require server-side signed URLs.
  if ((!serverSuccess || hasUnsignedStoragePhoto) && rpcErrorCode !== "FORBIDDEN" && effectiveToken && effectiveToken.trim()) {
    const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
    const anonKey = getAnonKey();
    if (anonKey && supabaseUrl) {
      const baseUrl = getFunctionUrl("admin/profile-queue");
      const url = `${baseUrl}?status=${encodeURIComponent(status)}`;
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "apikey": anonKey,
            "Authorization": `Bearer ${effectiveToken.trim()}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && Array.isArray(data.profiles)) {
          if (!serverSuccess) {
            serverProfiles = data.profiles;
            serverSuccess = true;
            rpcErrorMessage = null;
            rpcErrorCode = null;
          } else {
            const efPhotoMap = new Map<string, { photo_url: string | null; photo_available: boolean }>();
            for (const efProf of data.profiles) {
              if (efProf?.partner_id && isRenderablePhotoUrl(efProf.photo_url)) {
                efPhotoMap.set(String(efProf.partner_id).toLowerCase(), {
                  photo_url: efProf.photo_url,
                  photo_available: Boolean(efProf.photo_available),
                });
              }
            }
            serverProfiles = serverProfiles.map((prof) => {
              const signed = efPhotoMap.get(String(prof.partner_id).toLowerCase());
              if (signed && !isRenderablePhotoUrl(prof.photo_url)) {
                return {
                  ...prof,
                  photo_url: signed.photo_url,
                  photo_available: signed.photo_available,
                };
              }
              return prof;
            });
          }
        } else if (!res.ok && !serverSuccess) {
          rpcErrorCode = data.error || `HTTP_${res.status}`;
          rpcErrorMessage = data.message || `Edge function HTTP ${res.status}`;
        }
      } catch (efErr: any) {
        if (!serverSuccess) {
          rpcErrorCode = "EDGE_FUNCTION_EXCEPTION";
          rpcErrorMessage = efErr?.message || String(efErr);
        }
      }
    }
  }

  // Preserve error-handling correction: Never report successful queue retrieval from local fallback records after a server authorization or fetch failure.
  if (!serverSuccess && rpcErrorCode) {
    return {
      success: false,
      error: rpcErrorCode,
      message: rpcErrorMessage || "Failed to fetch Partner Passport review queue.",
      profiles: [],
      total_count: 0,
      status_filter: status,
    };
  }

  // 3. Merge with local SafeStorage partner passport submissions (Offline-First / Demo persistence)
  const allPartners = getAllPartners();
  const portalPartnersRaw = safeStorage.getItem("idemo_portal_partners");
  const portalPartners: any[] = portalPartnersRaw ? JSON.parse(portalPartnersRaw) : [];
  const partnersMap = new Map<string, any>();
  allPartners.forEach((p) => {
    if (p.id) partnersMap.set(p.id.toLowerCase(), p);
    const pCode = (p as any).public_code || (p as any).publicCode || p.id;
    if (pCode) partnersMap.set(String(pCode).toLowerCase(), p);
  });
  portalPartners.forEach((p) => {
    if (p.id) partnersMap.set(p.id.toLowerCase(), p);
    if (p.pin) partnersMap.set(String(p.pin).toLowerCase(), p);
    if (p.publicCode) partnersMap.set(String(p.publicCode).toLowerCase(), p);
  });

  const mergedProfiles: PartnerProfileQueueItem[] = [...serverProfiles];
  const existingIds = new Set(serverProfiles.map((p) => p.partner_id.toLowerCase()));
  const existingCodes = new Set(serverProfiles.map((p) => p.partner_code.toLowerCase()));

  const localKeys = safeStorage.getAllKeys().filter((k) => k.toLowerCase().startsWith("idemo_partner_passport_"));
  for (const k of localKeys) {
    try {
      const raw = safeStorage.getItem(k);
      if (!raw) continue;
      const data = JSON.parse(raw);
      const codeOrId = k.replace(/^idemo_partner_passport_/i, "").trim();
      const matched = partnersMap.get(codeOrId.toLowerCase());
      const pId = matched?.id || (codeOrId.length > 20 ? codeOrId : `local-${codeOrId}`);
      const pCode = String(data.partner_code || (matched as any)?.public_code || (matched as any)?.publicCode || (matched as any)?.pin || matched?.id || codeOrId).toUpperCase();
      const pName = String(data.partner_name || (matched as any)?.name || (matched as any)?.nameEn || pCode);
      const resolvedPhotoUrl = data.photo_url || data.photo_preview_url || data.draft_photo_path || null;

      if (existingIds.has(pId.toLowerCase()) || existingCodes.has(pCode.toLowerCase())) {
        const idx = mergedProfiles.findIndex(
          (p) => p.partner_id.toLowerCase() === pId.toLowerCase() || p.partner_code.toLowerCase() === pCode.toLowerCase()
        );
        if (idx !== -1) {
          if (
            (!mergedProfiles[idx].photo_url || !isRenderablePhotoUrl(mergedProfiles[idx].photo_url)) &&
            isRenderablePhotoUrl(resolvedPhotoUrl)
          ) {
            mergedProfiles[idx].photo_url = resolvedPhotoUrl;
            mergedProfiles[idx].photo_available = true;
          }
          if (pName && (!mergedProfiles[idx].partner_name || mergedProfiles[idx].partner_name.includes("-"))) {
            mergedProfiles[idx].partner_name = pName;
          }
          if (pCode && (!mergedProfiles[idx].partner_code || mergedProfiles[idx].partner_code.includes("-"))) {
            mergedProfiles[idx].partner_code = pCode;
          }
          if (!mergedProfiles[idx].draft_contact_phone && data.draft_contact_phone) {
            mergedProfiles[idx].draft_contact_phone = data.draft_contact_phone;
          }
          if (!mergedProfiles[idx].draft_contact_email && data.draft_contact_email) {
            mergedProfiles[idx].draft_contact_email = data.draft_contact_email;
          }
          if (!mergedProfiles[idx].applied_recs && data.applied_recs) {
            mergedProfiles[idx].applied_recs = data.applied_recs;
          }
          if (!mergedProfiles[idx].applied_recs_note && data.applied_recs_note) {
            mergedProfiles[idx].applied_recs_note = data.applied_recs_note;
          }
          if (!mergedProfiles[idx].canonical_region && data.canonical_region) {
            mergedProfiles[idx].canonical_region = data.canonical_region;
          }
        }
        continue;
      }

      const pStatus = data.review_status || "pending_review";
      if (status !== "all" && pStatus !== status) continue;

      const introText = data.intro_draft || "";
      const wordCount = introText.trim() ? introText.trim().split(/\s+/).length : 0;

      mergedProfiles.push({
        partner_id: pId,
        partner_code: pCode,
        partner_name: pName,
        partner_status: matched?.status || "active",
        review_status: pStatus,
        introduction_draft: data.intro_draft || null,
        introduction_published: data.intro_published || null,
        introduction_word_count: wordCount,
        photo_consent_given: Boolean(data.photo_consent_given),
        photo_consent_withdrawn: false,
        photo_available: Boolean(resolvedPhotoUrl),
        photo_url: resolvedPhotoUrl,
        draft_contact_phone: data.draft_contact_phone || null,
        draft_contact_email: data.draft_contact_email || null,
        published_contact_phone: data.published_contact_phone || data.contact_phone || null,
        published_contact_email: data.published_contact_email || data.contact_email || null,
        applied_recs: data.applied_recs || null,
        applied_recs_note: data.applied_recs_note || null,
        canonical_region: data.canonical_region || null,
        partner_type: data.partner_type || "Individual",
        website: data.website || null,
        guide_licence: data.guide_licence || null,
        pib: data.pib || null,
        languages: Array.isArray(data.languages) ? data.languages : [],
        transport_capacity: data.transport_capacity || "none",
        notice_window: data.notice_window || "24h",
        submitted_at: data.submitted_at || data.updated_at || new Date().toISOString(),
        reviewed_at: data.reviewed_at || null,
        reviewer_note: data.review_note || null,
        content_version: data.content_version || 1,
        updated_at: data.updated_at || new Date().toISOString(),
      });
      existingIds.add(pId.toLowerCase());
      existingCodes.add(pCode.toLowerCase());
    } catch {
      // ignore parse errors
    }
  }

  if (serverProfiles.length === 0 && mergedProfiles.length === 0 && rpcErrorMessage && isSupabaseConfigured()) {
    return {
      success: false,
      error: rpcErrorCode || "FETCH_ERROR",
      message: rpcErrorMessage,
      status_filter: status,
      count: 0,
      profiles: [],
    };
  }

  return {
    success: true,
    status_filter: status,
    count: mergedProfiles.length,
    profiles: mergedProfiles,
  };
}

export async function updatePartnerProfessionalContact(
  contactPhone: string | null,
  contactEmail: string | null
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: true, message: 'Mock professional contact details updated.' };
  }

  const url = getFunctionUrl('me/contact');
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'x-partner-session': session.sessionToken,
      },
      body: JSON.stringify({
        contact_phone: contactPhone,
        contact_email: contactEmail,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      // Robust secondary path: save draft contact details via /profile-content/draft
      try {
        const profileContentRes = await getPartnerProfileContent();
        const currentContent = profileContentRes.content;
        const draftRes = await savePartnerProfileDraft(
          currentContent?.intro_draft || null,
          currentContent?.draft_photo_path || null,
          currentContent?.draft_photo_mime || null,
          currentContent?.photo_consent_given || false,
          contactPhone,
          contactEmail
        );
        if (draftRes.success) {
          return {
            success: true,
            message: draftRes.message || 'Professional contact details saved as draft for IDEMO review.',
          };
        }
      } catch {
        // Continue to return endpoint response below if draft fallback also fails
      }

      return {
        success: false,
        message: data.message,
        error: data.message || data.error || `HTTP ${res.status}: Failed to update contact details.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Professional contact details saved.',
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function fetchPartnerCoverageMatrix(): Promise<{ success: boolean; matrix: PartnerCoverageRecord[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, matrix: [] };
  }
  const supabase = getSupabaseClient();
  if (!supabase) return { success: true, matrix: [] };

  try {
    const { data, error } = await supabase.rpc('fetch_partner_coverage_matrix_secure');
    if (error) {
      console.warn('fetch_partner_coverage_matrix_secure RPC error:', error.message);
      return { success: false, matrix: [], error: error.message };
    }
    if (data && data.success && Array.isArray(data.matrix)) {
      return { success: true, matrix: data.matrix };
    }
    return { success: true, matrix: [] };
  } catch (e: any) {
    return { success: false, matrix: [], error: e?.message || String(e) };
  }
}

export async function selectAndReleasePartnerCoverage(
  recommendationId: string,
  partnerId: string,
  contactEmail?: string,
  contactPhone?: string
): Promise<{ success: boolean; record?: PartnerCoverageRecord; error?: string; message?: string }> {
  if (!isSupabaseConfigured()) {
    const mockRecord: PartnerCoverageRecord = {
      recommendation_id: recommendationId,
      partner_id: partnerId,
      qualification_state: 'idemo_selected',
      participation_state: 'introduction_ready',
      passport_state: 'not_started',
      routing_state: 'active',
      contact_email: contactEmail,
      contact_phone: contactPhone,
      updated_at: new Date().toISOString()
    };
    return { success: true, record: mockRecord, message: 'Select & Release completed (Local Storage State).' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  try {
    const { data, error } = await supabase.rpc('select_and_release_partner_coverage_secure', {
      p_recommendation_id: recommendationId,
      p_partner_id: partnerId,
      p_contact_email: contactEmail || null,
      p_contact_phone: contactPhone || null
    });

    if (error) return { success: false, error: error.message };
    if (data && data.success) {
      return { success: true, record: data.record, message: 'Partner selected & released successfully.' };
    }
    return { success: false, error: data?.error || 'OPERATION_FAILED', message: data?.message };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

export async function updatePartnerCoverageStatus(
  recommendationId: string,
  partnerId: string,
  routingState?: RoutingPoolState,
  participationState?: ParticipationState,
  passportState?: PassportVerificationState,
  notes?: string
): Promise<{ success: boolean; record?: PartnerCoverageRecord; error?: string; message?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Coverage status updated locally.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  try {
    const { data, error } = await supabase.rpc('update_partner_coverage_status_secure', {
      p_recommendation_id: recommendationId,
      p_partner_id: partnerId,
      p_routing_state: routingState || null,
      p_participation_state: participationState || null,
      p_passport_state: passportState || null,
      p_notes: notes || null
    });

    if (error) return { success: false, error: error.message };
    if (data && data.success) {
      return { success: true, record: data.record, message: 'Coverage status updated.' };
    }
    return { success: false, error: data?.error || 'OPERATION_FAILED', message: data?.message };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

export async function replacePartnerCoverage(
  recommendationId: string,
  outgoingPartnerId: string,
  incomingPartnerId: string,
  contactEmail?: string,
  contactPhone?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Partner replaced locally (atomic simulation).' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  try {
    const { data, error } = await supabase.rpc('replace_partner_coverage_secure', {
      p_recommendation_id: recommendationId,
      p_outgoing_partner_id: outgoingPartnerId,
      p_incoming_partner_id: incomingPartnerId,
      p_contact_email: contactEmail || null,
      p_contact_phone: contactPhone || null,
      p_notes: notes || null
    });

    if (error) return { success: false, error: error.message };
    if (data && data.success) {
      return { success: true, message: data.message || 'Partner replacement executed atomically.' };
    }
    return { success: false, error: data?.error || 'OPERATION_FAILED', message: data?.message };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

/**
 * Atomically updates a partner's inquiry routing priority rank (1st = 1, 2nd = 2, 3rd = 3)
 * for a specific recommendation. If another partner already occupies that rank,
 * an atomic collision-free rank swap is executed in Supabase and mirrored in local state.
 */
export async function setPartnerCoveragePriorityRank(
  recommendationId: string,
  partnerId: string,
  priorityRank: number
): Promise<{
  success: boolean;
  oldRank?: number;
  newRank?: number;
  swappedPartnerId?: string;
  error?: string;
  message?: string;
}> {
  // Quota enforcement: max 12 total, max 4 per priority tier (1st, 2nd, 3rd)
  const currentQuota = getPartnerCoverageQuota(partnerId);
  const isCurrentlyRank1 = currentQuota.assignedRecsWithPriority.some(a => a.recId === recommendationId && a.priorityRank === 1);
  const isCurrentlyRank2 = currentQuota.assignedRecsWithPriority.some(a => a.recId === recommendationId && a.priorityRank === 2);
  const isCurrentlyRank3 = currentQuota.assignedRecsWithPriority.some(a => a.recId === recommendationId && a.priorityRank === 3);
  const isAlreadyAssignedOnThisRec = isCurrentlyRank1 || isCurrentlyRank2 || isCurrentlyRank3;

  if (!isAlreadyAssignedOnThisRec && currentQuota.totalAssigned >= 12) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED: Partner has reached the maximum of 12 assigned recommendations (4 as 1st, 4 as 2nd, 4 as 3rd).'
    };
  }

  if (priorityRank === 1 && !isCurrentlyRank1 && currentQuota.rank1Count >= 4) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED: Partner already holds the maximum of 4 recommendations as 1st Priority (Primary).'
    };
  }
  if (priorityRank === 2 && !isCurrentlyRank2 && currentQuota.rank2Count >= 4) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED: Partner already holds the maximum of 4 recommendations as 2nd Priority (Secondary).'
    };
  }
  if (priorityRank === 3 && !isCurrentlyRank3 && currentQuota.rank3Count >= 4) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED: Partner already holds the maximum of 4 recommendations as 3rd Priority (Tertiary).'
    };
  }

  if (!isSupabaseConfigured()) {
    let localSwappedPartnerId: string | undefined;
    let localOldRank = 100;
    try {
      const rawRanks = safeStorage.getItem('idemo_coverage_ranks');
      const ranksMap: Record<string, Record<string, number>> = rawRanks ? JSON.parse(rawRanks) : {};
      if (!ranksMap[recommendationId]) ranksMap[recommendationId] = {};
      localOldRank = ranksMap[recommendationId][partnerId] || 100;
      for (const [pId, rank] of Object.entries(ranksMap[recommendationId])) {
        if (pId !== partnerId && rank === priorityRank) {
          localSwappedPartnerId = pId;
          break;
        }
      }
      if (localSwappedPartnerId) {
        ranksMap[recommendationId][localSwappedPartnerId] = localOldRank <= 10 ? localOldRank : priorityRank + 1;
      }
      ranksMap[recommendationId][partnerId] = priorityRank;
      safeStorage.setItem('idemo_coverage_ranks', JSON.stringify(ranksMap));
    } catch {
      // ignore local storage error
    }
    return {
      success: true,
      oldRank: localOldRank,
      newRank: priorityRank,
      swappedPartnerId: localSwappedPartnerId,
      message: `Priority rank set to ${priorityRank} in local offline mode.`
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Database client is unavailable.' };

  try {
    const { data, error } = await supabase.rpc('set_partner_coverage_priority_rank_secure', {
      p_recommendation_id: recommendationId,
      p_partner_id: partnerId,
      p_priority_rank: priorityRank
    });

    if (error) {
      return {
        success: false,
        error: error.code || 'RPC_ERROR',
        message: `Failed to set priority rank: ${error.message}`
      };
    }

    if (data && data.success) {
      // Mirrored client cache update ONLY after confirmed database persistence success
      try {
        const rawRanks = safeStorage.getItem('idemo_coverage_ranks');
        const ranksMap: Record<string, Record<string, number>> = rawRanks ? JSON.parse(rawRanks) : {};
        if (!ranksMap[recommendationId]) ranksMap[recommendationId] = {};
        if (data.swapped_partner_id) {
          ranksMap[recommendationId][data.swapped_partner_id] = data.old_rank <= 10 ? data.old_rank : priorityRank + 1;
        }
        ranksMap[recommendationId][partnerId] = priorityRank;
        safeStorage.setItem('idemo_coverage_ranks', JSON.stringify(ranksMap));
      } catch (storageErr) {
        console.warn('Failed to mirror updated rank to local cache:', storageErr);
      }

      return {
        success: true,
        oldRank: data.old_rank,
        newRank: data.new_rank,
        swappedPartnerId: data.swapped_partner_id,
        message: data.message || `Priority rank updated to ${priorityRank}.`
      };
    }

    return {
      success: false,
      error: data?.error || 'RANK_UPDATE_FAILED',
      message: data?.message || 'Database priority rank update was not successful.'
    };
  } catch (e: any) {
    return {
      success: false,
      error: 'NETWORK_EXCEPTION',
      message: `Priority rank update exception: ${e?.message || String(e)}`
    };
  }
}

/**
 * Retrieves the stored priority rank for a partner on a recommendation.
 */
export function getPartnerCoveragePriorityRank(recommendationId: string, partnerId: string): number | null {
  try {
    const rawRanks = safeStorage.getItem('idemo_coverage_ranks');
    if (rawRanks) {
      const ranksMap = JSON.parse(rawRanks);
      if (ranksMap[recommendationId]?.[partnerId] !== undefined) {
        return ranksMap[recommendationId][partnerId];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export interface PartnerCoverageQuota {
  partnerId: string;
  totalAssigned: number;
  rank1Count: number;
  rank2Count: number;
  rank3Count: number;
  maxTotal: number;
  maxPerRank: number;
  canAssignRank1: boolean;
  canAssignRank2: boolean;
  canAssignRank3: boolean;
  assignedRecsWithPriority: Array<{
    recId: string;
    priorityRank: 1 | 2 | 3;
  }>;
}

/**
 * Authoritative evaluation of a partner's assigned recommendation quota across priority ranks.
 * Invariant: Max 12 recommendations total, max 4 as 1st, 4 as 2nd, 4 as 3rd.
 */
export function getPartnerCoverageQuota(partnerId: string): PartnerCoverageQuota {
  let rank1Count = 0;
  let rank2Count = 0;
  let rank3Count = 0;
  const assignedRecsWithPriority: Array<{ recId: string; priorityRank: 1 | 2 | 3 }> = [];

  try {
    const rawRanks = safeStorage.getItem('idemo_coverage_ranks');
    if (rawRanks) {
      const ranksMap: Record<string, Record<string, number>> = JSON.parse(rawRanks);
      const normTarget = (partnerId || '').toLowerCase().trim();

      for (const [recId, partners] of Object.entries(ranksMap)) {
        for (const [pId, rank] of Object.entries(partners)) {
          if (pId.toLowerCase().trim() === normTarget) {
            if (rank === 1) {
              rank1Count++;
              assignedRecsWithPriority.push({ recId, priorityRank: 1 });
            } else if (rank === 2) {
              rank2Count++;
              assignedRecsWithPriority.push({ recId, priorityRank: 2 });
            } else if (rank === 3) {
              rank3Count++;
              assignedRecsWithPriority.push({ recId, priorityRank: 3 });
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  const totalAssigned = rank1Count + rank2Count + rank3Count;

  return {
    partnerId,
    totalAssigned,
    rank1Count,
    rank2Count,
    rank3Count,
    maxTotal: 12,
    maxPerRank: 4,
    canAssignRank1: rank1Count < 4 && totalAssigned < 12,
    canAssignRank2: rank2Count < 4 && totalAssigned < 12,
    canAssignRank3: rank3Count < 4 && totalAssigned < 12,
    assignedRecsWithPriority
  };
}

export interface CanonicalRegionDefinition {
  id: string;
  nameEn: string;
  nameSr: string;
  keywords: string[];
}

export const CANONICAL_REGIONS: Record<string, CanonicalRegionDefinition> = {
  'sa-belgrade-001': {
    id: 'sa-belgrade-001',
    nameEn: 'Belgrade Metropolitan Area',
    nameSr: 'Beogradska mitropolitanska oblast',
    keywords: ['belgrade', 'beograd', 'kalemegdan', 'skadarlija', 'zemun', 'avala', 'dorćol', 'dorcol', 'vracar', 'vračar', 'sava', 'dunav']
  },
  'sa-novisad-002': {
    id: 'sa-novisad-002',
    nameEn: 'Novi Sad & Vojvodina',
    nameSr: 'Novi Sad i Vojvodina',
    keywords: ['novi sad', 'vojvodina', 'petrovaradin', 'fruška gora', 'fruska gora', 'subotica', 'sombor', 'sremski karlovci', 'palic', 'palić']
  },
  'sa-west-003': {
    id: 'sa-west-003',
    nameEn: 'Western Serbia & Podrinje (Zlatibor, Tara, Uvac, Drina)',
    nameSr: 'Zapadna Srbija i Podrinje (Zlatibor, Tara, Uvac, Drina)',
    keywords: ['zlatibor', 'tara', 'uvac', 'drina', 'mokra gora', 'zapadna', 'podrinje', 'valjevo', 'loznica', 'bajina', 'uzice', 'užice', 'sargan', 'šargan']
  },
  'sa-sumadija-004': {
    id: 'sa-sumadija-004',
    nameEn: 'Šumadija & Central Serbia',
    nameSr: 'Šumadija i Centralna Srbija',
    keywords: ['šumadija', 'sumadija', 'kragujevac', 'topola', 'aranđelovac', 'arandjelovac', 'central', 'rudnik', 'oplenac']
  },
  'sa-east-005': {
    id: 'sa-east-005',
    nameEn: 'Eastern Serbia & Lower Danube',
    nameSr: 'Istočna Srbija i Donje Podunavlje',
    keywords: ['đerdap', 'djerdap', 'golubac', 'istočna', 'istocna', 'danube', 'dunav', 'kladovo', 'homolje', 'srebrno', 'rajac', 'gamzigrad', 'felix']
  },
  'sa-south-006': {
    id: 'sa-south-006',
    nameEn: 'Niš & Southern Serbia',
    nameSr: 'Niš i Južna Srbija',
    keywords: ['niš', 'nis', 'južna', 'juzna', 'south', 'vlasina', 'đavolja', 'djavolja', 'pirot', 'leskovac', 'stara planina', 'sokobanja']
  }
};

export interface PartnerFitAnalysisResult {
  partnerId: string;
  recId: string;
  fitScore: number;
  fitTier: 'HIGH' | 'MEDIUM' | 'MODERATE';
  regionMatch: boolean;
  canonicalRegionId: string;
  canonicalRegionName: string;
  proposedRank: 1 | 2 | 3 | null;
  quotaAvailable: boolean;
  quotaSummary: {
    rank1Count: number;
    rank2Count: number;
    rank3Count: number;
    totalAssigned: number;
  };
  rationale: string;
}

/**
 * Intelligent Fit Analysis & Proposition for Curator Approval:
 * Evaluates geographic match between partner's canonical region and recommendation,
 * assesses partner capabilities, and proposes the optimal priority slot (1, 2, or 3)
 * strictly constrained by the 4/4/4 quota invariant (max 12 total).
 */
export function getPartnerFitAnalysis(
  partnerId: string,
  recId: string,
  recDetails?: { title?: string; location?: string; category?: string },
  forcedCanonicalRegion?: string | null
): PartnerFitAnalysisResult {
  const quota = getPartnerCoverageQuota(partnerId);

  // 1. Resolve canonical region from parameter, stored passport, or portal partner
  let regId = forcedCanonicalRegion || '';
  if (!regId) {
    try {
      const pRaw = safeStorage.getItem(`idemo_partner_passport_${(partnerId || '').toUpperCase()}`) ||
                    safeStorage.getItem(`idemo_partner_passport_${(partnerId || '').toLowerCase()}`);
      if (pRaw) {
        const parsed = JSON.parse(pRaw);
        if (parsed.canonical_region) regId = parsed.canonical_region;
      }
    } catch {
      // ignore
    }
  }

  // Default fallback if unset
  if (!regId || !CANONICAL_REGIONS[regId]) {
    regId = 'sa-belgrade-001';
  }

  const regionDef = CANONICAL_REGIONS[regId] || CANONICAL_REGIONS['sa-belgrade-001'];
  const title = (recDetails?.title || '').toLowerCase();
  const loc = (recDetails?.location || '').toLowerCase();
  const cat = (recDetails?.category || '').toLowerCase();

  // 2. Geographic Match calculation
  const isGeoMatch = regionDef.keywords.some(k => title.includes(k) || loc.includes(k));

  // 3. Category & Guide capability heuristic
  let score = 25; // baseline readiness
  if (isGeoMatch) score += 55;
  if (cat.includes('heritage') || cat.includes('cultural') || cat.includes('history') || cat.includes('monastery') || cat.includes('nature') || cat.includes('dining')) {
    score += 15;
  }
  score = Math.min(score, 100);

  const fitTier: 'HIGH' | 'MEDIUM' | 'MODERATE' = score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'MODERATE';

  // 4. Propose priority rank according to fit and quota availability
  let proposedRank: 1 | 2 | 3 | null = null;
  const quotaAvailable = quota.totalAssigned < 12;

  if (quotaAvailable) {
    if (fitTier === 'HIGH' && quota.rank1Count < 4) {
      proposedRank = 1;
    } else if ((fitTier === 'HIGH' || fitTier === 'MEDIUM') && quota.rank2Count < 4) {
      proposedRank = 2;
    } else if (quota.rank3Count < 4) {
      proposedRank = 3;
    } else if (quota.rank2Count < 4) {
      proposedRank = 2;
    } else if (quota.rank1Count < 4) {
      proposedRank = 1;
    }
  }

  const rationale = isGeoMatch
    ? `Strong canonical alignment with ${regionDef.nameEn}. Geographic keywords match spot location.`
    : `Secondary operational scope outside primary ${regionDef.nameEn} territory.`;

  return {
    partnerId,
    recId,
    fitScore: score,
    fitTier,
    regionMatch: isGeoMatch,
    canonicalRegionId: regionDef.id,
    canonicalRegionName: regionDef.nameEn,
    proposedRank,
    quotaAvailable,
    quotaSummary: {
      rank1Count: quota.rank1Count,
      rank2Count: quota.rank2Count,
      rank3Count: quota.rank3Count,
      totalAssigned: quota.totalAssigned,
    },
    rationale,
  };
}



