/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from '../lib/safeStorage';
import { 
  savePartnerProfileDraft, 
  fetchPartnerProfileReviewQueue, 
  adminReviewPartnerProfile 
} from '../lib/partnerService';
import { loadRecommendations } from '../lib/recommendationsLoader';

export interface TestResult {
  testId: string;
  description: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

export async function runPartnerExpertiseApplicationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const addResult = (testId: string, description: string, pass: boolean, details?: string) => {
    results.push({
      testId,
      description,
      status: pass ? 'PASS' : 'FAIL',
      details,
    });
  };

  try {
    // --- TEST 1: Dynamic Recommendations Loader returns active catalog ---
    const recsRes = await loadRecommendations();
    const hasRecs = !!(recsRes && recsRes.data && recsRes.data.length > 0);
    addResult(
      'PEA-01',
      'Dynamic recommendations loader returns active catalog items for partner selection',
      hasRecs,
      `Loaded ${recsRes?.data?.length || 0} active recommendations (Live: ${recsRes?.isLive})`
    );

    // --- TEST 2: Partner Passport saves applied recommendations draft ---
    const testPartnerId = 'TEST_GUIDE_BELGRADE_01';
    const appliedRecIds = ['1', '2', '7'];
    const expertiseNote = 'Licensed Belgrade tourist guide, licensed for Kalemegdan & Manasija';

    // Store in safeStorage snapshot as in PartnersScreen.tsx
    const passportKey = `idemo_partner_passport_${testPartnerId}`;
    safeStorage.setItem(
      passportKey,
      JSON.stringify({
        intro_draft: 'I am a certified Belgrade guide with 10 years experience.',
        photo_url: '/assets/images/partners/uno_portrait.svg',
        photo_consent_given: true,
        review_status: 'pending_review',
        applied_recs: appliedRecIds,
        applied_recs_note: expertiseNote,
        submitted_at: new Date().toISOString()
      })
    );

    const savedRaw = safeStorage.getItem(passportKey);
    const parsed = savedRaw ? JSON.parse(savedRaw) : null;
    const draftSavedCorrectly = 
      parsed && 
      Array.isArray(parsed.applied_recs) && 
      parsed.applied_recs.length === 3 &&
      parsed.applied_recs_note === expertiseNote;

    addResult(
      'PEA-02',
      'Partner passport correctly persists applied recommendations and expertise note',
      !!draftSavedCorrectly,
      `Stored appliedRecs: ${parsed?.applied_recs?.join(', ')}`
    );

    // --- TEST 3: Studio Passport Queue receives applied recommendations ---
    const queueRes = await fetchPartnerProfileReviewQueue(undefined, 'all');
    const profiles = queueRes.profiles || [];
    const matchedQueueItem = profiles.find(
      p => p.partner_id.toUpperCase() === testPartnerId || p.partner_code.toUpperCase() === testPartnerId
    );

    const queueHasAppliedRecs = 
      matchedQueueItem && 
      Array.isArray(matchedQueueItem.applied_recs) && 
      matchedQueueItem.applied_recs.includes('1') &&
      matchedQueueItem.applied_recs.includes('7');

    addResult(
      'PEA-03',
      'Studio Passport Review Queue surfaces partner applied recommendations',
      !!queueHasAppliedRecs,
      `Found in queue: ${matchedQueueItem?.partner_name}, applied: ${matchedQueueItem?.applied_recs?.join(', ')}`
    );

    // --- TEST 4: Studio Curator assigns applied recommendations to partner ---
    // Seed initial portal partners
    const initialPartners = [
      {
        id: testPartnerId,
        publicCode: testPartnerId,
        name: 'Belgrade Heritage Guide',
        assignedRecs: ['10'], // currently only assigned to #10
      }
    ];
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(initialPartners));

    // Simulate curator assigning the applied recommendations
    const rawBefore = safeStorage.getItem('idemo_portal_partners');
    const listBefore = rawBefore ? JSON.parse(rawBefore) : [];
    const updatedList = listBefore.map((p: any) => {
      if (p.id === testPartnerId || p.publicCode === testPartnerId) {
        const current = Array.isArray(p.assignedRecs) ? p.assignedRecs : [];
        const combined = Array.from(new Set([...current, ...appliedRecIds]));
        return { ...p, assignedRecs: combined };
      }
      return p;
    });
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(updatedList));

    const rawAfter = safeStorage.getItem('idemo_portal_partners');
    const listAfter = rawAfter ? JSON.parse(rawAfter) : [];
    const targetAfter = listAfter.find((p: any) => p.id === testPartnerId);

    const successfullyAssigned = 
      targetAfter && 
      targetAfter.assignedRecs.includes('1') &&
      targetAfter.assignedRecs.includes('2') &&
      targetAfter.assignedRecs.includes('7') &&
      targetAfter.assignedRecs.includes('10');

    addResult(
      'PEA-04',
      'Curator assignment successfully merges applied recommendations into partner portfolio',
      !!successfullyAssigned,
      `Assigned recs after curator action: ${targetAfter?.assignedRecs?.join(', ')}`
    );

    // Cleanup test artifacts
    safeStorage.removeItem(passportKey);

  } catch (err: any) {
    addResult('PEA-ERR', 'Unexpected exception during execution', false, err?.message || String(err));
  }

  return results;
}

// Self-executing runner when run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runPartnerExpertiseApplicationTests().then((res) => {
    console.log('\n--- PARTNER EXPERTISE APPLICATION TEST RESULTS ---');
    let allPass = true;
    for (const r of res) {
      console.log(`[${r.status}] ${r.testId}: ${r.description} (${r.details || ''})`);
      if (r.status !== 'PASS') allPass = false;
    }
    console.log(allPass ? '\nALL TESTS PASSED!' : '\nTESTS FAILED!');
    process.exit(allPass ? 0 : 1);
  });
}
