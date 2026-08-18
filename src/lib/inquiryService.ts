/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InquiryRecordV2, Recommendation, VisitorStatusResult, VisitorProposalResult, VisitorActionResult } from '../types';
import { saveInquiryRecordV2, saveVisitorCredential, getVisitorCredential, removeVisitorCredential } from './inquiryStorage';
import { bootstrapTaxonomy, getTaxonomyCache } from './taxonomyStore';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface SubmitInquiryParams {
  recommendation: Recommendation;
  visitorName: string;
  email?: string;
  phoneNumber?: string;
  visitorNotes: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:MM or free text time
}

export interface SubmitInquiryResult {
  success: boolean;
  referenceCode?: string;
  inquiryId?: string;
  isDuplicate?: boolean;
  error?: string;
}

export async function submitInquiry(params: SubmitInquiryParams): Promise<SubmitInquiryResult> {
  const { recommendation, visitorName, email, phoneNumber, visitorNotes, preferredDate, preferredTime } = params;

  // 1. Ensure recommendation has backend dbId
  if (!recommendation.dbId) {
    return {
      success: false,
      error: 'NO_DB_ID: Online Concierge arrangements require a live database recommendation.',
    };
  }

  // 2. Ensure taxonomy is bootstrapped
  let taxonomy = getTaxonomyCache();
  if (!taxonomy.isLoaded) {
    taxonomy = await bootstrapTaxonomy();
  }

  if (!taxonomy.isLoaded || !taxonomy.defaultLanguageId || !taxonomy.defaultServiceAreaId) {
    return {
      success: false,
      error: taxonomy.loadError || 'TAXONOMY_UNAVAILABLE: Required taxonomy resolution failed.',
    };
  }

  // 3. Prepare client_request_id and local record
  const clientRequestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const localQueueId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Convert preferredDate and preferredTime into ISO timestamps
  let requestedStartAt: string;
  let requestedEndAt: string;

  try {
    const datePart = preferredDate || new Date().toISOString().split('T')[0];
    const timeMatch = (preferredTime || '10:00').match(/(\d{1,2}):(\d{2})/);
    const hours = timeMatch ? parseInt(timeMatch[1], 10) : 10;
    const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;

    const startDate = new Date(`${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);
    if (isNaN(startDate.getTime())) {
      requestedStartAt = new Date().toISOString();
    } else {
      requestedStartAt = startDate.toISOString();
    }

    // Default duration window: start time + 2 hours for concierge matching
    const endDate = new Date(new Date(requestedStartAt).getTime() + 2 * 60 * 60 * 1000);
    requestedEndAt = endDate.toISOString();
  } catch {
    requestedStartAt = new Date().toISOString();
    requestedEndAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  }

  const initialRecord: InquiryRecordV2 = {
    local_queue_id: localQueueId,
    recommendation_id: recommendation.id,
    recommendation_db_id: recommendation.dbId,
    recommendation_title: recommendation.title,
    visitor_name: visitorName,
    email: email || undefined,
    phone_number: phoneNumber || undefined,
    visitor_notes: visitorNotes,
    requested_start_at: requestedStartAt,
    requested_end_at: requestedEndAt,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    status: 'submitting',
    is_server_authoritative: false,
    created_at: new Date().toISOString(),
    client_request_id: clientRequestId,
  };

  saveInquiryRecordV2(initialRecord);

  // 4. Perform authoritative Edge Function submission
  if (!isSupabaseConfigured()) {
    const failedRecord: InquiryRecordV2 = {
      ...initialRecord,
      status: 'failed',
      last_error: 'SUPABASE_UNCONFIGURED: Cannot dispatch inquiry without live Supabase configuration.',
    };
    saveInquiryRecordV2(failedRecord);

    return {
      success: false,
      error: failedRecord.last_error,
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const payload = {
      recommendation_id: recommendation.dbId,
      visitor_notes: visitorNotes,
      preferred_language_id: taxonomy.defaultLanguageId,
      service_area_id: taxonomy.defaultServiceAreaId,
      requested_start_at: requestedStartAt,
      requested_end_at: requestedEndAt,
      visitor_name: visitorName,
      email: email || undefined,
      phone_number: phoneNumber || undefined,
      consent_text_version: 'v1.0',
      consent_purpose: 'concierge_service',
      consent_channel: 'web_form',
      required_capability_ids: taxonomy.defaultCapabilityIds,
      client_request_id: clientRequestId,
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/create_public_inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok || resData.error) {
      const errorMsg = resData.error || `HTTP_${response.status}: Edge function submission failed.`;
      const failedRecord: InquiryRecordV2 = {
        ...initialRecord,
        status: 'failed',
        last_error: errorMsg,
      };
      saveInquiryRecordV2(failedRecord);

      return {
        success: false,
        error: errorMsg,
      };
    }

    // Success response handling
    if (resData.inquiry_id && resData.raw_recovery_token) {
      saveVisitorCredential(resData.inquiry_id, resData.raw_recovery_token);
    }

    const submittedRecord: InquiryRecordV2 = {
      ...initialRecord,
      status: 'submitted',
      server_inquiry_id: resData.inquiry_id,
      public_reference_code: resData.public_reference_code,
      is_server_authoritative: true,
      submitted_at: new Date().toISOString(),
      last_error: undefined,
    };

    // Ensure raw_recovery_token is NEVER placed inside InquiryRecordV2 or idemo_inquiries_v2
    saveInquiryRecordV2(submittedRecord);

    return {
      success: true,
      referenceCode: resData.public_reference_code,
      inquiryId: resData.inquiry_id,
      isDuplicate: !!resData.is_duplicate,
    };
  } catch (err: any) {
    const errorMsg = `NETWORK_OR_TIMEOUT_FAILURE: ${err?.message || String(err)}`;
    const failedRecord: InquiryRecordV2 = {
      ...initialRecord,
      status: 'failed',
      last_error: errorMsg,
    };
    saveInquiryRecordV2(failedRecord);

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/* ============================================================================
 * VISITOR RESOLUTION SERVICE (Hardened Mode A)
 * Uses isolated visitor credentials to interact with visitor_resolution endpoints
 * ============================================================================ */

export async function fetchInquiryStatus(inquiryId: string): Promise<VisitorStatusResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, error: 'NO_CREDENTIAL: Recovery token not found on this device.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const url = `${supabaseUrl}/functions/v1/visitor_resolution/status?inquiry_id=${encodeURIComponent(inquiryId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'x-visitor-token': token,
      },
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      const errMsg = resData.error || 'Failed to fetch status';
      if (errMsg.includes('expired') || errMsg.includes('revoked') || errMsg.includes('Inquiry not found')) {
        removeVisitorCredential(inquiryId);
      }
      return { success: false, error: 'Access denied. The request may be expired or invalid.' };
    }

    // Auto-purge credential if status became terminal
    const terminalStatuses = ['completed', 'canceled', 'closed'];
    if (resData.status && terminalStatuses.includes(resData.status)) {
      removeVisitorCredential(inquiryId);
    }

    return {
      success: true,
      inquiry_id: resData.inquiry_id,
      public_reference_code: resData.public_reference_code,
      status: resData.status,
      visitor_status_label: resData.visitor_status_label,
      requested_start_at: resData.requested_start_at,
      requested_end_at: resData.requested_end_at,
      created_at: resData.created_at,
    };
  } catch (err: any) {
    return { success: false, error: 'Unable to check status. Please check your connection and try again.' };
  }
}

export async function fetchActiveProposal(inquiryId: string): Promise<VisitorProposalResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, error: 'NO_CREDENTIAL: Recovery token not found on this device.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const url = `${supabaseUrl}/functions/v1/visitor_resolution/proposal?inquiry_id=${encodeURIComponent(inquiryId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'x-visitor-token': token,
      },
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return { success: false, error: 'Access denied or error retrieving proposal details.' };
    }

    return {
      success: true,
      proposal_found: !!resData.proposal_found,
      match_id: resData.match_id,
      response_id: resData.response_id,
      response_type: resData.response_type,
      message: resData.message,
      proposed_start_at: resData.proposed_start_at,
      proposed_end_at: resData.proposed_end_at,
    };
  } catch (err: any) {
    return { success: false, error: 'Unable to check active proposal. Please try again.' };
  }
}

export async function confirmProposal(inquiryId: string, matchId: string): Promise<VisitorActionResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, error: 'NO_CREDENTIAL: Recovery token not found on this device.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/visitor_resolution/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'x-visitor-token': token,
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        match_id: matchId,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return { success: false, error: resData.error || 'Failed to confirm proposal.' };
    }

    return {
      success: true,
      inquiry_id: resData.inquiry_id,
      match_id: resData.match_id,
      status: resData.status,
    };
  } catch (err: any) {
    return { success: false, error: 'Unable to confirm proposal. Please try again.' };
  }
}

export async function declineProposal(inquiryId: string, matchId: string, reason?: string): Promise<VisitorActionResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, error: 'NO_CREDENTIAL: Recovery token not found on this device.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/visitor_resolution/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'x-visitor-token': token,
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        match_id: matchId,
        reason: reason || '',
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return { success: false, error: resData.error || 'Failed to decline proposal.' };
    }

    // Status becomes canceled (terminal) -> purge credential
    removeVisitorCredential(inquiryId);

    return {
      success: true,
      inquiry_id: resData.inquiry_id,
      match_id: resData.match_id,
      status: resData.status,
    };
  } catch (err: any) {
    return { success: false, error: 'Unable to decline proposal. Please try again.' };
  }
}

export async function requestAlternativeProposal(inquiryId: string, matchId: string, reason?: string): Promise<VisitorActionResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, error: 'NO_CREDENTIAL: Recovery token not found on this device.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/visitor_resolution/request-alternative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'x-visitor-token': token,
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        match_id: matchId,
        reason: reason || '',
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return { success: false, error: resData.error || 'Failed to request alternative option.' };
    }

    return {
      success: true,
      inquiry_id: resData.inquiry_id,
      match_id: resData.match_id,
      status: resData.status,
    };
  } catch (err: any) {
    return { success: false, error: 'Unable to request alternative option. Please try again.' };
  }
}

export interface PartnerIntroductionResult {
  success: boolean;
  introduction_available: boolean;
  partner_name?: string;
  partner_code?: string;
  introduction?: string;
  photo_available?: boolean;
  photo_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  content_version?: number;
  message?: string;
  error?: string;
}

export async function fetchPartnerIntroduction(inquiryId: string): Promise<PartnerIntroductionResult> {
  const token = getVisitorCredential(inquiryId);
  if (!token) {
    return { success: false, introduction_available: false, error: 'NO_CREDENTIAL: Visitor recovery token missing.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return {
      success: true,
      introduction_available: true,
      partner_name: 'IDEMO Verified Partner',
      partner_code: 'IDM-PTR-01',
      introduction: 'Licensed professional guide specializing in heritage, gastronomy, and bespoke luxury travel across Belgrade and Serbia.',
      photo_available: false,
      photo_url: null,
      contact_phone: null,
      contact_email: null,
      content_version: 1,
    };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/visitor_resolution/partner-introduction?inquiry_id=${encodeURIComponent(inquiryId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          'x-visitor-token': token,
        },
      }
    );

    const resData = await response.json();
    if (!response.ok) {
      return { success: false, introduction_available: false, error: resData.error || 'Failed to fetch partner introduction.' };
    }

    return {
      success: true,
      introduction_available: !!resData.introduction_available,
      partner_name: resData.partner_name,
      partner_code: resData.partner_code,
      introduction: resData.introduction,
      photo_available: !!resData.photo_available,
      photo_url: resData.photo_url || null,
      contact_phone: resData.contact_phone || null,
      contact_email: resData.contact_email || null,
      content_version: resData.content_version,
      message: resData.message,
    };
  } catch (err: any) {
    return { success: false, introduction_available: false, error: 'Unable to connect to service.' };
  }
}

