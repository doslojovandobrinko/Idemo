/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { partnerSessionStorage, PartnerSessionData } from './partnerSessionStorage';

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

function getFunctionUrl(endpoint: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/partner_resolution/${endpoint.replace(/^\/+/, '')}`;
}

function getAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export async function loginPartner(publicCode: string, pin: string): Promise<PartnerLoginResult> {
  const codeClean = publicCode.trim().toUpperCase();
  const pinClean = pin.trim();
  const pinHash = await sha256(pinClean);

  // Mock local partners mapping with hashes
  const mockPartners: Record<string, { id: string; name: string; pinHash: string; pins: string[] }> = {
    'P-TG-1': { id: 'p-tg-1', name: 'Belgrade Undercover Walking', pinHash: '68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c', pins: ['3001'] },
    'P-TG-2': { id: 'p-tg-2', name: 'Danube Delta Sailing Guides', pinHash: '68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c', pins: ['3002'] },
    'P-MW-1': { id: 'p-mw-1', name: 'Belgrade Elite Dental Care', pinHash: '0ca51c7efd9c15555c82a537f5d6f30a9058bcf7fb475e7a968393e98218e2a2', pins: ['4001'] },
    'P-TR-1': { id: 'p-tr-1', name: 'Tesla Ride Belgrade Premium', pinHash: '394e2ea416d80ff36b62ec54181a4d5c41793732c5890e03be81a5c68b6d808e', pins: ['5001'] },
    'UNO1': { id: 'UNO1', name: 'UNO1', pinHash: 'b0f807217ebf4c5a968eb1e428d09995c65f97b6057a17724a3501a5e1cf3a68', pins: ['3001'] },
    'UNO2': { id: 'UNO2', name: 'UNO2', pinHash: '3834a362f6d63fb645edff2088b90ed7255d64ffc3ae94fa8ecaa7f1d43eb49f', pins: ['3002'] }
  };

  const matched = mockPartners[codeClean] || Object.values(mockPartners).find(p => p.id === codeClean || p.id.toUpperCase() === codeClean);
  if (matched && (matched.pins.includes(pinClean) || matched.pinHash === pinHash)) {
    const session: PartnerSessionData = {
      sessionToken: `mock_session_${matched.id}`,
      partnerId: matched.id,
      publicCode: codeClean,
      name: matched.name,
      mustChangePin: false,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    partnerSessionStorage.savePartnerSession(session);
    return {
      success: true,
      partner: {
        id: matched.id,
        public_code: codeClean,
        name: matched.name,
        must_change_pin: false,
      }
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return {
      success: false,
      error: 'Invalid mock credentials. Use UNO1 (PIN: 3001) or UNO2 (PIN: 3002) for preview testing.'
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
      body: JSON.stringify({ public_code: publicCode.trim(), pin: pin.trim() }),
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
      opportunities: [
        {
          match_id: 'mock-match-1',
          inquiry_id: 'mock-inquiry-1',
          public_reference_code: 'REF-2026-9041',
          recommendation_id: '1',
          recommendation_title: 'Uvac Meanders',
          visitor_notes: 'Traveling with family, we would like a private boat tour.',
          requested_start_at: new Date(Date.now() + 86400000).toISOString(),
          requested_end_at: new Date(Date.now() + 90000000).toISOString(),
          created_at: new Date().toISOString(),
          match_status: 'Unmatched',
          inquiry_status: 'Unmatched',
          visitor_contact: {
            visitor_name: 'John Doe',
            email: 'john@example.com',
            phone_number: '+15550199'
          }
        }
      ]
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

export async function changePartnerPin(
  currentPin: string,
  newPin: string,
  confirmNewPin: string
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
