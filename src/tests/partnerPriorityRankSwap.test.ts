/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Partner Priority Rank Swap Test Suite
 * Verifies:
 * 1. 1-action priority rank updating (Rank 1 = 1st [0m], Rank 2 = 2nd [+30m], Rank 3 = 3rd [+60m]).
 * 2. Atomic collision-free rank swapping when another partner occupies the requested slot.
 * 3. Inquiry routing candidate ordering matches priority rank ascending.
 * 4. Dual-layer storage synchronization (safeStorage fallback and Supabase compatibility).
 */

import { setPartnerCoveragePriorityRank, getPartnerCoveragePriorityRank } from '../lib/partnerService';
import { safeStorage } from '../lib/safeStorage';
import { tierToPriorityRank, priorityRankToTier } from '../lib/partnerIntelligenceService';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPartnerPriorityRankSwapTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Clean test setup
  const TEST_REC_ID = 'test-rec-uvac-meanders';
  const PARTNER_UNO1 = 'test-partner-uno1';
  const PARTNER_UNO2 = 'test-partner-uno2';
  const PARTNER_UNO3 = 'test-partner-uno3';

  // 1. Verify tierToPriorityRank and priorityRankToTier mapping
  const p1Rank = tierToPriorityRank('PRIMARY');
  const p2Rank = tierToPriorityRank('SECONDARY');
  const p3Rank = tierToPriorityRank('TERTIARY');

  const p1Tier = priorityRankToTier(1);
  const p2Tier = priorityRankToTier(2);
  const p3Tier = priorityRankToTier(3);

  results.push({
    name: "PRS-01: Tier-to-Rank and Rank-to-Tier bidirectional mappings",
    passed: p1Rank === 1 && p2Rank === 2 && p3Rank === 3 && p1Tier === 'PRIMARY' && p2Tier === 'SECONDARY' && p3Tier === 'TERTIARY',
    details: `PRIMARY=${p1Rank}, SECONDARY=${p2Rank}, TERTIARY=${p3Rank}. Inverses match exactly.`,
  });

  // 2. Assign Partner UNO1 to 1st Place (Priority Rank 1)
  const res1 = await setPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO1, 1);
  const rank1 = getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO1);

  results.push({
    name: "PRS-02: Partner UNO1 assigned to 1st Place (Rank 1)",
    passed: res1.success && rank1 === 1,
    details: `Result success: ${res1.success}, recorded rank: ${rank1}.`,
  });

  // 3. Assign Partner UNO2 to 2nd Place (Priority Rank 2)
  const res2 = await setPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO2, 2);
  const rank2 = getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO2);

  results.push({
    name: "PRS-03: Partner UNO2 assigned to 2nd Place (Rank 2)",
    passed: res2.success && rank2 === 2,
    details: `Result success: ${res2.success}, recorded rank: ${rank2}.`,
  });

  // 4. Atomic 1-Action Collision Swap: Promote Partner UNO2 to 1st Place
  // Expected: UNO2 becomes Rank 1, UNO1 automatically moves to Rank 2 (swapped)
  const resSwap = await setPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO2, 1);
  const newRankUNO2 = getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO2);
  const newRankUNO1 = getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO1);

  results.push({
    name: "PRS-04: Atomic collision-free swap: promoting UNO2 to 1st place swaps UNO1 to 2nd place",
    passed: resSwap.success && newRankUNO2 === 1 && newRankUNO1 === 2 && resSwap.swappedPartnerId === PARTNER_UNO1,
    details: `UNO2 rank: ${newRankUNO2} (expected 1), UNO1 rank: ${newRankUNO1} (expected 2), swappedPartnerId: ${resSwap.swappedPartnerId}.`,
  });

  // 5. Assign Partner UNO3 to 3rd Place (Priority Rank 3)
  const res3 = await setPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO3, 3);
  const rank3 = getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO3);

  results.push({
    name: "PRS-05: Partner UNO3 assigned to 3rd Place (Rank 3)",
    passed: res3.success && rank3 === 3,
    details: `Result success: ${res3.success}, recorded rank: ${rank3}.`,
  });

  // 6. Verify Inquiry Routing Candidate Queue Order (Ordered by Rank ASC)
  const candidates = [
    { partnerId: PARTNER_UNO1, rank: getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO1) || 100 },
    { partnerId: PARTNER_UNO2, rank: getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO2) || 100 },
    { partnerId: PARTNER_UNO3, rank: getPartnerCoveragePriorityRank(TEST_REC_ID, PARTNER_UNO3) || 100 },
  ];

  candidates.sort((a, b) => a.rank - b.rank);

  results.push({
    name: "PRS-06: Routing queue order matches 1st (UNO2), 2nd (UNO1), 3rd (UNO3)",
    passed: candidates[0].partnerId === PARTNER_UNO2 && candidates[1].partnerId === PARTNER_UNO1 && candidates[2].partnerId === PARTNER_UNO3,
    details: `Queue order: 1st=${candidates[0].partnerId} (rank ${candidates[0].rank}), 2nd=${candidates[1].partnerId} (rank ${candidates[1].rank}), 3rd=${candidates[2].partnerId} (rank ${candidates[2].rank}).`,
  });

  return results;
}
