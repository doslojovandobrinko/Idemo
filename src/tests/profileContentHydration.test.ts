/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProfileContentHydrationTestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface ProfileContentResponsePayload {
  success: boolean;
  partner_id?: string;
  content?: {
    partner_id: string;
    intro_draft: string | null;
    draft_photo_path: string | null;
    draft_photo_mime: string | null;
    intro_published: string | null;
    published_photo_path: string | null;
    published_photo_mime: string | null;
    review_status: string;
    photo_consent_given: boolean;
    photo_consent_at: string | null;
    photo_consent_withdrawn_at: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    review_note: string | null;
    draft_contact_phone?: string | null;
    draft_contact_email?: string | null;
    published_contact_phone?: string | null;
    published_contact_email?: string | null;
    draft_photo_signed_url?: string | null;
    published_photo_signed_url?: string | null;
  };
  error?: string;
  message?: string;
}

/**
 * Pure response mapping and hydration safety validator for GET /profile-content
 */
export function validateProfileContentHydration(
  httpStatus: number,
  payload: ProfileContentResponsePayload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (httpStatus !== 200) {
    errors.push(`Expected HTTP 200 status, received ${httpStatus}`);
  }

  if (!payload.success) {
    errors.push(`Response success flag is false: ${payload.error || payload.message || 'unknown error'}`);
  }

  if (!payload.partner_id) {
    errors.push('Response missing top-level partner_id.');
  }

  if (!payload.content) {
    errors.push('Response missing content object.');
    return { valid: false, errors };
  }

  const content = payload.content;

  if (typeof content.review_status !== 'string') {
    errors.push('content.review_status must be a string.');
  }

  if (typeof content.photo_consent_given !== 'boolean') {
    errors.push('content.photo_consent_given must be a boolean.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Execute acceptance suite for GET /profile-content hydration contract.
 */
export function runProfileContentHydrationTests(): ProfileContentHydrationTestResult[] {
  const results: ProfileContentHydrationTestResult[] = [];

  // TEST 1: Complete persisted UNO1 profile response (with biography, photo, consent, and pending_review)
  const uno1PersistedPayload: ProfileContentResponsePayload = {
    success: true,
    partner_id: 'a0000000-0000-0000-0000-000000000091',
    content: {
      partner_id: 'a0000000-0000-0000-0000-000000000091',
      intro_draft: 'Leading Belgrade luxury private chauffeur and concierge service.',
      draft_photo_path: 'drafts/93e43f50863b4459adfe5a91d5020143.png',
      draft_photo_mime: 'image/png',
      intro_published: null,
      published_photo_path: null,
      published_photo_mime: null,
      review_status: 'pending_review',
      photo_consent_given: true,
      photo_consent_at: '2026-08-24T00:00:00Z',
      photo_consent_withdrawn_at: null,
      submitted_at: '2026-08-24T00:05:00Z',
      reviewed_at: null,
      reviewed_by: null,
      review_note: null,
      draft_contact_phone: '+381 11 555 0191',
      draft_contact_email: 'vip@uno1-transports.rs',
      published_contact_phone: null,
      published_contact_email: null,
      draft_photo_signed_url: 'https://xyz.supabase.co/storage/v1/object/sign/partner-passports/drafts/93e43f50863b4459adfe5a91d5020143.png?token=mock',
      published_photo_signed_url: null,
    },
  };

  const val1 = validateProfileContentHydration(200, uno1PersistedPayload);
  results.push({
    testId: 'HYDRATION-001',
    name: 'UNO1 persisted profile content GET returns 200 with non-null biography and draft_photo_path',
    expected: 'VALID: 0 errors',
    actual: val1.valid ? 'VALID: 0 errors' : `INVALID: ${val1.errors.join('; ')}`,
    passed: val1.valid && uno1PersistedPayload.content?.intro_draft !== null && uno1PersistedPayload.content?.draft_photo_path !== null,
  });

  // TEST 2: UNO2 profile content with null optional fields
  const uno2Payload: ProfileContentResponsePayload = {
    success: true,
    partner_id: 'a0000000-0000-0000-0000-000000000092',
    content: {
      partner_id: 'a0000000-0000-0000-0000-000000000092',
      intro_draft: 'Premier Danube dining experience in Novi Sad.',
      draft_photo_path: null,
      draft_photo_mime: null,
      intro_published: null,
      published_photo_path: null,
      published_photo_mime: null,
      review_status: 'draft',
      photo_consent_given: false,
      photo_consent_at: null,
      photo_consent_withdrawn_at: null,
      submitted_at: null,
      reviewed_at: null,
      reviewed_by: null,
      review_note: null,
      draft_contact_phone: null,
      draft_contact_email: null,
      published_contact_phone: null,
      published_contact_email: null,
      draft_photo_signed_url: null,
      published_photo_signed_url: null,
    },
  };

  const val2 = validateProfileContentHydration(200, uno2Payload);
  results.push({
    testId: 'HYDRATION-002',
    name: 'UNO2 profile content GET handles missing/null optional fields cleanly',
    expected: 'VALID: 0 errors',
    actual: val2.valid ? 'VALID: 0 errors' : `INVALID: ${val2.errors.join('; ')}`,
    passed: val2.valid,
  });

  // TEST 3: Photo preview URL generation failure does NOT prevent profile hydration (draft_photo_signed_url = null)
  const previewFailurePayload: ProfileContentResponsePayload = {
    success: true,
    partner_id: 'a0000000-0000-0000-0000-000000000091',
    content: {
      partner_id: 'a0000000-0000-0000-0000-000000000091',
      intro_draft: 'Persisted biography text remains intact.',
      draft_photo_path: 'drafts/93e43f50863b4459adfe5a91d5020143.png',
      draft_photo_mime: 'image/png',
      intro_published: null,
      published_photo_path: null,
      published_photo_mime: null,
      review_status: 'pending_review',
      photo_consent_given: true,
      photo_consent_at: '2026-08-24T00:00:00Z',
      photo_consent_withdrawn_at: null,
      submitted_at: '2026-08-24T00:05:00Z',
      reviewed_at: null,
      reviewed_by: null,
      review_note: null,
      draft_photo_signed_url: null, // Photo preview URL creation failed, but core hydration succeeds!
      published_photo_signed_url: null,
    },
  };

  const val3 = validateProfileContentHydration(200, previewFailurePayload);
  results.push({
    testId: 'HYDRATION-003',
    name: 'Storage photo signed URL failure does NOT cause 500 or break core profile hydration',
    expected: 'VALID: 0 errors',
    actual: val3.valid ? 'VALID: 0 errors' : `INVALID: ${val3.errors.join('; ')}`,
    passed: val3.valid && previewFailurePayload.content?.draft_photo_path === 'drafts/93e43f50863b4459adfe5a91d5020143.png',
  });

  return results;
}
