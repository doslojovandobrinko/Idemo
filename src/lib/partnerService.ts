/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  partnerSessionStorage,
  PartnerSessionData,
} from "./partnerSessionStorage";
import { PARTNERS } from "../data/partners";

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
    email?: string;
    phone_number?: string;
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
  intro_published: string | null;
  published_photo_path: string | null;
  published_photo_mime: string | null;
  review_status:
    "draft" | "pending_review" | "approved" | "changes_requested" | "withdrawn";
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

const metaEnv =
  (import.meta as unknown as { env?: Record<string, string> }).env || {};
const getEnvVar = (key: string): string => {
  if (metaEnv[key]) return metaEnv[key];
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return "";
};

function getFunctionUrl(endpoint: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/partner_resolution/${endpoint.replace(/^\/+/, "")}`;
}

function getAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || "";
}

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export async function loginPartner(
  publicCode: string,
  pin: string,
): Promise<PartnerLoginResult> {
  const codeClean = publicCode.trim();
  const pinClean = pin.trim();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  if (!supabaseUrl) {
    return {
      success: false,
      error:
        "Database connection URL missing. Cannot perform server-side authentication.",
    };
  }

  const url = getFunctionUrl("login");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ public_code: codeClean, pin: pinClean }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          `HTTP ${res.status}: Partner authentication failed.`,
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

  const url = getFunctionUrl("logout");
  const anonKey = getAnonKey();

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      profile: {
        id: session.partnerId,
        public_code: session.publicCode,
        name: session.name,
        status: "active",
        is_open_for_inquiries: true,
        contact_preference: "WhatsApp",
        must_change_pin: session.mustChangePin,
      },
    };
  }

  const url = getFunctionUrl("me");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
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
        error:
          data.message ||
          data.error ||
          `HTTP ${res.status}: Failed to load authenticated partner profile.`,
      };
    }

    return {
      success: true,
      profile: {
        id: data.partner.id,
        public_code: data.partner.public_code,
        name: data.partner.name,
        status: data.partner.status || "active",
        is_open_for_inquiries: data.partner.is_open_for_inquiries ?? true,
        contact_preference: data.partner.contact_preference || "WhatsApp",
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

export async function fetchPartnerOpportunities(
  scope: "new" | "active" | "history" = "new",
): Promise<PartnerOpportunitiesResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session) {
    return {
      success: false,
      error: "UNAUTHORIZED: Partner session missing or expired.",
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      scope,
      opportunities: [
        {
          match_id: "mock-match-1",
          inquiry_id: "mock-inquiry-1",
          public_reference_code: "REF-2026-9041",
          recommendation_id: "1",
          recommendation_title: "Uvac Meanders",
          visitor_notes:
            "Traveling with family, we would like a private boat tour.",
          requested_start_at: new Date(Date.now() + 86400000).toISOString(),
          requested_end_at: new Date(Date.now() + 90000000).toISOString(),
          created_at: new Date().toISOString(),
          match_status: "Unmatched",
          inquiry_status: "Unmatched",
          visitor_contact: {
            visitor_name: "John Doe",
            email: "john@example.com",
            phone_number: "+15550199",
          },
        },
      ],
    };
  }

  const url = `${getFunctionUrl("opportunities")}?scope=${scope}`;
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
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
        error:
          data.message ||
          data.error ||
          `HTTP ${res.status}: Failed to fetch opportunities.`,
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

export async function viewPartnerOpportunity(
  matchId: string,
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      match_id: matchId,
      status: "viewed",
    };
  }

  const url = getFunctionUrl("opportunities/view");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function acceptPartnerOpportunity(
  matchId: string,
  message: string,
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      match_id: matchId,
      status: "accepted",
    };
  }

  const url = getFunctionUrl("opportunities/accept");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function declinePartnerOpportunity(
  matchId: string,
  message?: string,
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      match_id: matchId,
      status: "declined",
    };
  }

  const url = getFunctionUrl("opportunities/decline");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function proposePartnerAlternative(
  matchId: string,
  proposedStartAt: string,
  proposedEndAt: string,
  message: string,
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: true,
      match_id: matchId,
      status: "proposed",
    };
  }

  const url = getFunctionUrl("opportunities/propose");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function changePartnerPin(
  currentPin: string,
  newPin: string,
  confirmNewPin: string,
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    partnerSessionStorage.clearPartnerSession();
    return {
      success: true,
      status: "PIN_CHANGED",
      message: "PIN successfully updated offline.",
    };
  }

  const url = getFunctionUrl("change-pin");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
      },
      body: JSON.stringify({
        current_pin: currentPin.trim(),
        new_pin: newPin.trim(),
        confirm_new_pin: confirmNewPin.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.code === "PIN_CHANGED_REAUTHENTICATION_REQUIRED" || data.success) {
      partnerSessionStorage.clearPartnerSession();
    }
    return {
      success: !!data.success,
      status: data.code || (data.success ? "PIN_CHANGED" : "ERROR"),
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function getPartnerProfileContent(): Promise<FetchProfileContentResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: false,
      error:
        "BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.",
    };
  }

  const url = getFunctionUrl("profile-content");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function authorizePhotoUpload(
  filename: string,
  mimeType: string,
  fileSize: number,
): Promise<{
  success: boolean;
  upload_url?: string;
  path?: string;
  mime_type?: string;
  error?: string;
}> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: false,
      error:
        "BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.",
    };
  }

  const url = getFunctionUrl("profile-content/upload-authorize");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
      },
      body: JSON.stringify({
        filename,
        mime_type: mimeType,
        file_size: fileSize,
      }),
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
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: false,
      error:
        "BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.",
    };
  }

  const url = getFunctionUrl("profile-content/draft");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
      },
      body: JSON.stringify({
        intro_draft: introDraft,
        draft_photo_path: draftPhotoPath,
        draft_photo_mime: draftPhotoMime,
        photo_consent: photoConsent,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      status: data.status,
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function submitPartnerProfile(): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: false,
      error:
        "BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.",
    };
  }

  const url = getFunctionUrl("profile-content/submit");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function withdrawPartnerProfileContent(
  scope: "draft" | "introduction" | "photo" | "consent" | "all" = "all",
): Promise<PartnerActionResult> {
  const session = partnerSessionStorage.getPartnerSession();
  if (!session)
    return { success: false, error: "UNAUTHORIZED: Partner session missing." };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || session.sessionToken.startsWith("mock_session_")) {
    return {
      success: false,
      error:
        "BACKEND_UNAVAILABLE: Real backend configuration and valid partner session required.",
    };
  }

  const url = getFunctionUrl("profile-content/withdraw");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "x-partner-session": session.sessionToken,
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
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}

export async function adminReviewPartnerProfile(
  targetPartnerId: string,
  action: "approve" | "request_changes" | "unpublish",
  reviewNote?: string,
  studioToken?: string,
): Promise<PartnerActionResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return {
      success: false,
      error: "CONFIGURATION_ERROR: Supabase URL missing.",
    };
  }
  if (!studioToken || !studioToken.trim()) {
    return {
      success: false,
      error: "UNAUTHORIZED: Studio administrator session token required.",
    };
  }

  const url = getFunctionUrl("admin/profile-review");
  const anonKey = getAnonKey();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${studioToken.trim()}`,
      },
      body: JSON.stringify({
        partner_id: targetPartnerId,
        action,
        review_note: reviewNote || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: !!data.success,
      status: data.status,
      message: data.message,
      error: data.message || data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `NETWORK_FAILURE: ${err?.message || String(err)}`,
    };
  }
}
