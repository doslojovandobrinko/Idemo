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
import { getAllPartners } from './partnerLifecycleService';

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
  const codeClean = publicCode.trim();
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

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: codeClean, pin: pinClean }),
    });

    const data = await res.json().catch(() => ({}));

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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

export async function viewPartnerOpportunity(matchId: string): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
        confirm_new_pin: confirmNewPin.trim(),
        partner_name: partnerName ? partnerName.trim().slice(0, 16) : undefined,
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
  appliedRecsNote?: string | null
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith('mock_session_')) {
    return { success: false, error: 'BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.' };
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
        draft_contact_phone: draftContactPhone || null,
        draft_contact_email: draftContactEmail || null,
        proposed_rec_title: proposal?.title || null,
        proposed_rec_category: proposal?.category || null,
        proposed_rec_location: proposal?.location || null,
        proposed_rec_rationale: proposal?.rationale || null,
        applied_recs: appliedRecs || null,
        applied_recs_note: appliedRecsNote || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      status: data.status,
      message: data.message,
      error: data.success ? undefined : (data.error || data.message),
    };
  } catch (err: any) {
    return { success: false, error: `NETWORK_FAILURE: ${err?.message || String(err)}` };
  }
}

export async function submitPartnerProfile(): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) return { success: false, error: 'UNAUTHORIZED: Partner session missing.' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

  const validActions = ['approve', 'request_changes', 'unpublish'];
  if (validActions.includes(actionOrPartnerId)) {
    targetPartnerId = targetPartnerIdOrToken;
    action = actionOrPartnerId as 'approve' | 'request_changes' | 'unpublish';
    reviewNote = reviewNoteOrAction;
    studioToken = studioTokenOrNote;
  } else if (validActions.includes(reviewNoteOrAction || '')) {
    studioToken = targetPartnerIdOrToken;
    targetPartnerId = actionOrPartnerId;
    action = reviewNoteOrAction as 'approve' | 'request_changes' | 'unpublish';
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

export async function fetchPartnerProfileReviewQueue(
  studioToken?: string | null,
  status: PartnerProfileReviewStatusFilter = 'pending_review'
): Promise<PartnerProfileReviewQueueResponse> {
  let serverProfiles: PartnerProfileQueueItem[] = [];

  // 1. Direct Supabase RPC execution
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('fetch_partner_profile_review_queue_secure', {
        p_status: status,
      });
      if (!error && data && data.success && Array.isArray(data.profiles)) {
        serverProfiles = data.profiles;
      }
    } catch {
      // fallback
    }
  }

  // 2. Edge Function execution if token is present and RPC returned empty
  if (serverProfiles.length === 0 && studioToken && studioToken.trim()) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const anonKey = getAnonKey();
  if (!anonKey) {
    return { success: false, error: 'CONFIGURATION_ERROR', message: 'Anon key missing.' };
  }

  const baseUrl = getFunctionUrl('admin/profile-queue');
  const url = `${baseUrl}?status=${encodeURIComponent(status)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${studioToken.trim()}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && Array.isArray(data.profiles)) {
      serverProfiles = data.profiles;
    }
  } catch {
    // fallback
  }
}

  // 3. Merge with local SafeStorage partner passport submissions (Offline-First / Demo persistence)
  const allPartners = getAllPartners();
  const partnersMap = new Map<string, Partner>();
  allPartners.forEach((p) => {
    if (p.id) partnersMap.set(p.id.toLowerCase(), p);
    const pCode = (p as any).public_code || (p as any).publicCode || p.id;
    if (pCode) partnersMap.set(String(pCode).toLowerCase(), p);
  });

  const mergedProfiles: PartnerProfileQueueItem[] = [...serverProfiles];
  const existingIds = new Set(serverProfiles.map((p) => p.partner_id.toLowerCase()));
  const existingCodes = new Set(serverProfiles.map((p) => p.partner_code.toLowerCase()));

  const localKeys = safeStorage.getAllKeys().filter((k) => k.toLowerCase().startsWith('idemo_partner_passport_'));
  for (const k of localKeys) {
    try {
      const raw = safeStorage.getItem(k);
      if (!raw) continue;
      const data = JSON.parse(raw);
      const codeOrId = k.replace(/^idemo_partner_passport_/i, '').trim();
      const matched = partnersMap.get(codeOrId.toLowerCase());

      const pId = matched?.id || (codeOrId.length > 20 ? codeOrId : `local-${codeOrId}`);
      const pCode = String((matched as any)?.public_code || (matched as any)?.publicCode || matched?.id || codeOrId).toUpperCase();
      const pName = String((matched as any)?.name || (matched as any)?.nameEn || pCode);

      if (existingIds.has(pId.toLowerCase()) || existingCodes.has(pCode.toLowerCase())) {
        const idx = mergedProfiles.findIndex(
          (p) => p.partner_id.toLowerCase() === pId.toLowerCase() || p.partner_code.toLowerCase() === pCode.toLowerCase()
        );
        if (idx !== -1) {
          if (!mergedProfiles[idx].photo_url && data.photo_url) {
            mergedProfiles[idx].photo_url = data.photo_url;
            mergedProfiles[idx].photo_available = true;
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
        }
        continue;
      }

      const pStatus = data.review_status || 'pending_review';
      if (status !== 'all' && pStatus !== status) continue;

      const introText = data.intro_draft || '';
      const wordCount = introText.trim() ? introText.trim().split(/\s+/).length : 0;

      mergedProfiles.push({
        partner_id: pId,
        partner_code: pCode,
        partner_name: pName,
        partner_status: matched?.status || 'active',
        review_status: pStatus,
        introduction_draft: data.intro_draft || null,
        introduction_published: data.intro_published || null,
        introduction_word_count: wordCount,
        photo_consent_given: Boolean(data.photo_consent_given),
        photo_consent_withdrawn: false,
        photo_available: Boolean(data.photo_url || data.draft_photo_path),
        photo_url: data.photo_url || data.draft_photo_path || null,
        draft_contact_phone: data.draft_contact_phone || null,
        draft_contact_email: data.draft_contact_email || null,
        published_contact_phone: data.published_contact_phone || data.contact_phone || null,
        published_contact_email: data.published_contact_email || data.contact_email || null,
        applied_recs: data.applied_recs || null,
        applied_recs_note: data.applied_recs_note || null,
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

