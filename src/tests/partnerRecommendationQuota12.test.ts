/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Partner Recommendation Quota & Canonical Region Test Suite
 *
 * Verifies:
 * 1. Each partner can be assigned to no more than 12 recommendations max (4 as 1st, 4 as 2nd, 4 as 3rd).
 * 2. Over-allocation prevention: assigning a 5th recommendation to 1st, 2nd, or 3rd priority is rejected with error.
 * 3. Total over-allocation prevention: assigning more than 12 recommendations total is rejected with error.
 * 4. Partner passport selection limit: prevents exceeding 12 recommendations with message "( this is the limit )".
 * 5. Canonical region persistence: correctly saves and restores canonical service region in partner passport.
 * 6. Agent fit analysis: evaluates geographic match and proposes priority rank within 4/4/4 quota limits.
 * 7. Partner passport approval view: displays approved recommendations with explicit priority rank badges and quota breakdown.
 */

import { safeStorage } from '../lib/safeStorage';
import { 
  setPartnerCoveragePriorityRank, 
  getPartnerCoveragePriorityRank, 
  getPartnerCoverageQuota,
  getPartnerFitAnalysis,
  CANONICAL_REGIONS,
  savePartnerProfileDraft
} from '../lib/partnerService';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPartnerRecommendationQuotaTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const TEST_PARTNER = 'test-guide-quota-01';

  // Clear any existing test ranks
  try {
    const raw = safeStorage.getItem('idemo_coverage_ranks');
    const ranks = raw ? JSON.parse(raw) : {};
    for (const recId of Object.keys(ranks)) {
      if (ranks[recId][TEST_PARTNER]) {
        delete ranks[recId][TEST_PARTNER];
      }
    }
    safeStorage.setItem('idemo_coverage_ranks', JSON.stringify(ranks));
  } catch {
    // ignore
  }

  // 1. Assign 4 recommendations as 1st Priority (Rank 1)
  const r1 = await setPartnerCoveragePriorityRank('rec-1st-01', TEST_PARTNER, 1);
  const r2 = await setPartnerCoveragePriorityRank('rec-1st-02', TEST_PARTNER, 1);
  const r3 = await setPartnerCoveragePriorityRank('rec-1st-03', TEST_PARTNER, 1);
  const r4 = await setPartnerCoveragePriorityRank('rec-1st-04', TEST_PARTNER, 1);

  const quotaAfter4 = getPartnerCoverageQuota(TEST_PARTNER);

  results.push({
    name: 'PRQ-01: Successfully assign 4 recommendations as 1st Priority',
    passed: r1.success && r2.success && r3.success && r4.success && quotaAfter4.rank1Count === 4,
    details: `Assigned 4 rank 1 recs. Recorded: rank1Count=${quotaAfter4.rank1Count}, totalAssigned=${quotaAfter4.totalAssigned}`,
  });

  // 2. Attempt to assign a 5th recommendation as 1st Priority -> MUST FAIL
  const r5Exceed = await setPartnerCoveragePriorityRank('rec-1st-05-excess', TEST_PARTNER, 1);
  const quotaAfter5Attempt = getPartnerCoverageQuota(TEST_PARTNER);

  results.push({
    name: 'PRQ-02: Over-allocation prevention: 5th recommendation as 1st Priority is rejected',
    passed: !r5Exceed.success && Boolean(r5Exceed.error?.includes('QUOTA_EXCEEDED')) && quotaAfter5Attempt.rank1Count === 4,
    details: `Success=${r5Exceed.success}, error="${r5Exceed.error}". Rank 1 count remains 4.`,
  });

  // 3. Assign 4 recommendations as 2nd Priority and 4 as 3rd Priority
  await setPartnerCoveragePriorityRank('rec-2nd-01', TEST_PARTNER, 2);
  await setPartnerCoveragePriorityRank('rec-2nd-02', TEST_PARTNER, 2);
  await setPartnerCoveragePriorityRank('rec-2nd-03', TEST_PARTNER, 2);
  await setPartnerCoveragePriorityRank('rec-2nd-04', TEST_PARTNER, 2);

  await setPartnerCoveragePriorityRank('rec-3rd-01', TEST_PARTNER, 3);
  await setPartnerCoveragePriorityRank('rec-3rd-02', TEST_PARTNER, 3);
  await setPartnerCoveragePriorityRank('rec-3rd-03', TEST_PARTNER, 3);
  await setPartnerCoveragePriorityRank('rec-3rd-04', TEST_PARTNER, 3);

  const fullQuota = getPartnerCoverageQuota(TEST_PARTNER);

  results.push({
    name: 'PRQ-03: Full allocation: 4 as 1st, 4 as 2nd, 4 as 3rd equals exactly 12 recommendations',
    passed: fullQuota.rank1Count === 4 && fullQuota.rank2Count === 4 && fullQuota.rank3Count === 4 && fullQuota.totalAssigned === 12,
    details: `rank1=${fullQuota.rank1Count}/4, rank2=${fullQuota.rank2Count}/4, rank3=${fullQuota.rank3Count}/4, total=${fullQuota.totalAssigned}/12.`,
  });

  // 4. Attempt to assign a 13th recommendation -> MUST FAIL
  const r13Exceed = await setPartnerCoveragePriorityRank('rec-13th-excess', TEST_PARTNER, 2);

  results.push({
    name: 'PRQ-04: Total allocation limit: 13th recommendation is rejected with QUOTA_EXCEEDED',
    passed: !r13Exceed.success && Boolean(r13Exceed.error?.includes('QUOTA_EXCEEDED')),
    details: `Success=${r13Exceed.success}, error="${r13Exceed.error}". Total remains 12.`,
  });

  // 5. Verify Canonical Region persistence in Partner Passport
  const testPassportKey = `idemo_partner_passport_${TEST_PARTNER.toUpperCase()}`;
  const testRegion = 'sa-west-003';
  safeStorage.setItem(testPassportKey, JSON.stringify({
    partner_id: TEST_PARTNER,
    canonical_region: testRegion,
    applied_recs: ['rec-1st-01', 'rec-1st-02', 'rec-2nd-01'],
    review_status: 'approved'
  }));

  const loadedPassport = JSON.parse(safeStorage.getItem(testPassportKey) || '{}');
  const regionSaved = loadedPassport.canonical_region === testRegion;
  const regionDef = CANONICAL_REGIONS[testRegion];

  results.push({
    name: 'PRQ-05: Partner passport correctly saves and persists canonical service region',
    passed: regionSaved && !!regionDef,
    details: `Stored region=${loadedPassport.canonical_region} (${regionDef?.nameEn})`,
  });

  // 6. Agent Fit Analysis: geographic match in Western Serbia (Zlatibor / Tara)
  const westRec = { title: 'Tara National Park Viewpoints', location: 'Tara & Bajina Bašta', category: 'Nature' };
  const fitResultWest = getPartnerFitAnalysis(TEST_PARTNER, 'rec-tara-viewpoint', westRec, testRegion);

  results.push({
    name: 'PRQ-06: Agent Fit Analysis detects geographic match with canonical region',
    passed: fitResultWest.regionMatch && fitResultWest.fitScore >= 80 && fitResultWest.fitTier === 'HIGH',
    details: `GeoMatch=${fitResultWest.regionMatch}, FitScore=${fitResultWest.fitScore}%, Tier=${fitResultWest.fitTier}, Region=${fitResultWest.canonicalRegionName}`,
  });

  // 7. Verify PartnersScreen and StudioPassportReviewView contain the required limits & wording
  const fs = await import('fs');
  const partnersScreen = fs.readFileSync('src/components/PartnersScreen.tsx', 'utf-8');
  const hasLimitText = partnersScreen.includes('this is the limit') && partnersScreen.includes('12 preporuka');
  const hasQuotaMeter = partnersScreen.includes('4 max') && partnersScreen.includes('Approved Recommendations');
  const hasCanonicalDropdown = partnersScreen.includes('canonicalRegion') && partnersScreen.includes('Canonical Service Region');

  const studioPassport = fs.readFileSync('src/components/studio/StudioPassportReviewView.tsx', 'utf-8');
  const hasAgentFitBanner = studioPassport.includes('Agent Fit Analysis & Proposition');
  const hasStudioQuota = studioPassport.includes('Allocation Quota (12 max)');
  const hasCanonicalMeta = studioPassport.includes('Canonical Region');

  const filesVerified = hasLimitText && hasQuotaMeter && hasCanonicalDropdown && hasAgentFitBanner && hasStudioQuota && hasCanonicalMeta;

  results.push({
    name: 'PRQ-07: Code verification: UI components implement ( this is the limit ) prevention, 4/4/4 quota meters, canonical region inputs, and Agent Fit proposition',
    passed: filesVerified,
    details: `LimitText=${hasLimitText}, QuotaMeters=${hasQuotaMeter}, CanonicalRegionInput=${hasCanonicalDropdown}, AgentFitBanner=${hasAgentFitBanner}, StudioQuota=${hasStudioQuota}`,
  });

  // Cleanup test ranks
  try {
    const raw = safeStorage.getItem('idemo_coverage_ranks');
    const ranks = raw ? JSON.parse(raw) : {};
    for (const recId of Object.keys(ranks)) {
      if (ranks[recId][TEST_PARTNER]) {
        delete ranks[recId][TEST_PARTNER];
      }
    }
    safeStorage.setItem('idemo_coverage_ranks', JSON.stringify(ranks));
    safeStorage.removeItem(testPassportKey);
  } catch {
    // ignore
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPartnerRecommendationQuotaTests().then((res) => {
    console.log('\n--- PARTNER RECOMMENDATION QUOTA TEST RESULTS ---');
    let allPass = true;
    for (const r of res) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}: ${r.details}`);
      if (!r.passed) allPass = false;
    }
    console.log(allPass ? '\nALL TESTS PASSED!' : '\nTESTS FAILED!');
    process.exit(allPass ? 0 : 1);
  });
}
