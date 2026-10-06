/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Unified Partner Passport Review Queue Test Suite
 * Verifies that:
 * 1. fetchPartnerProfileReviewQueue loads pending submissions even when token is null
 * 2. UNO3's submitted passport appears in the review queue
 * 3. Approving a passport updates review status to 'approved' and publishes introduction & photo
 * 4. Requesting changes requires a review note and updates status to 'changes_requested'
 * 5. SafeStorage entries are synchronized seamlessly
 */

import { fetchPartnerProfileReviewQueue, adminReviewPartnerProfile } from '../lib/partnerService';
import { safeStorage } from '../lib/safeStorage';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPassportReviewQueueUnifiedTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Setup: Ensure UNO3 is represented in SafeStorage if offline/demo
  const uno3Key = 'idemo_partner_passport_UNO3';
  safeStorage.setItem(uno3Key, JSON.stringify({
    intro_draft: 'TEST for Partner approva cycle',
    photo_url: 'https://example.com/uno3-portrait.jpg',
    draft_photo_path: 'drafts/uno3-test.jpg',
    photo_consent_given: true,
    review_status: 'pending_review',
    draft_contact_phone: '+38163286396',
    draft_contact_email: 'office@idemo.group',
    submitted_at: new Date().toISOString(),
  }));

  // TEST 1: fetchPartnerProfileReviewQueue works without token
  {
    const res = await fetchPartnerProfileReviewQueue(null, 'pending_review');
    const hasUno3 = res.profiles?.some(p => p.partner_code.toUpperCase() === 'UNO3');
    results.push({
      name: 'PRQ-01: fetchPartnerProfileReviewQueue executes successfully without auth token',
      passed: res.success && Array.isArray(res.profiles),
      details: `Success: ${res.success}, Profiles Count: ${res.count}, Contains UNO3: ${hasUno3}`,
    });
  }

  // TEST 2: UNO3 appears in the queue with correct details
  {
    const res = await fetchPartnerProfileReviewQueue(undefined, 'pending_review');
    const uno3Item = res.profiles?.find(p => p.partner_code.toUpperCase() === 'UNO3');
    const isValid = Boolean(
      uno3Item &&
      uno3Item.review_status === 'pending_review' &&
      uno3Item.introduction_draft?.includes('TEST') &&
      uno3Item.photo_consent_given === true
    );
    results.push({
      name: 'PRQ-02: UNO3 appears in the pending queue with introduction and photo consent',
      passed: isValid,
      details: `Found: ${!!uno3Item}, Code: ${uno3Item?.partner_code}, Intro: "${uno3Item?.introduction_draft?.slice(0, 30)}...", Consent: ${uno3Item?.photo_consent_given}`,
    });
  }

  // TEST 3: Admin approve action publishes the passport
  {
    const approveRes = await adminReviewPartnerProfile('UNO3', 'approve', 'Approved by IDEMO Editorial Lead');
    const rawStored = safeStorage.getItem(uno3Key);
    const parsed = rawStored ? JSON.parse(rawStored) : {};
    const isApproved = approveRes.success && parsed.review_status === 'approved' && parsed.intro_published === parsed.intro_draft;

    results.push({
      name: 'PRQ-03: adminReviewPartnerProfile approves and publishes passport to SafeStorage and state',
      passed: isApproved,
      details: `Approve Result: ${approveRes.success}, Stored Status: '${parsed.review_status}', Published Intro: '${parsed.intro_published}'`,
    });
  }

  // TEST 4: Queue reflects approved status
  {
    const res = await fetchPartnerProfileReviewQueue(undefined, 'approved');
    const uno3Approved = res.profiles?.some(p => p.partner_code.toUpperCase() === 'UNO3' && p.review_status === 'approved');

    results.push({
      name: 'PRQ-04: Approved passport appears under "approved" queue filter',
      passed: Boolean(uno3Approved),
      details: `Approved Filter Count: ${res.count}, UNO3 Approved in List: ${uno3Approved}`,
    });
  }

  // TEST 5: Request changes updates status to changes_requested
  {
    const changesRes = await adminReviewPartnerProfile('UNO3', 'request_changes', 'Please provide more detail about Belgrade heritage.');
    const rawStored = safeStorage.getItem(uno3Key);
    const parsed = rawStored ? JSON.parse(rawStored) : {};
    const hasChangesReq = changesRes.success && parsed.review_status === 'changes_requested';

    results.push({
      name: 'PRQ-05: adminReviewPartnerProfile supports "request_changes" action with review note',
      passed: hasChangesReq,
      details: `Action Success: ${changesRes.success}, Stored Status: '${parsed.review_status}', Note: '${parsed.review_note}'`,
    });
  }

  return results;
}
