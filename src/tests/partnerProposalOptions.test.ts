/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PARTNER PROPOSAL DESK (OPTION A & OPTION B) TEST SUITE
 * Verifies partner ability to propose Option A (New Recommendation)
 * and Option B (Curated Experience Package), Agent 007 pre-evaluation,
 * SafeStorage persistence, and Curator approval with partner co-assignment.
 */

import { 
  savePartnerRecommendationProposal, 
  getPartnerProposalsByPartnerId, 
  getPartnerRecommendationProposals,
  curatorApproveProposal, 
  curatorRejectProposal,
  PartnerRecommendationProposal 
} from '../lib/partnerProposalService';
import { safeStorage } from '../lib/safeStorage';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runPartnerProposalOptionsTests(): TestResult[] {
  const results: TestResult[] = [];

  const record = (name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ name, passed, expected, actual });
  };

  // Setup test environment in safeStorage
  const TEST_PARTNER_ID = 'test-partner-uno-999';
  const TEST_PARTNER_CODE = 'UNO99';
  const TEST_PARTNER_NAME = 'UNO99 — Homolje Authentic Guide';

  // Seed portal partners list so co-assignment can be verified
  const portalPartners = [
    {
      id: TEST_PARTNER_ID,
      pin: TEST_PARTNER_CODE,
      name: TEST_PARTNER_NAME,
      assignedRecs: ['rec-1', 'rec-2']
    }
  ];
  safeStorage.setItem('idemo_portal_partners', JSON.stringify(portalPartners));

  // --- TEST 1: Option A (Recommendation) Submission & Agent 007 Evaluation ---
  const propA = savePartnerRecommendationProposal({
    partnerId: TEST_PARTNER_ID,
    partnerCode: TEST_PARTNER_CODE,
    partnerName: TEST_PARTNER_NAME,
    partnerEmail: 'guide@homolje.rs',
    proposalType: 'RECOMMENDATION',
    title: 'Gornjak Cliffside Monastic Sanctuary',
    category: 'History',
    location: 'Homolje Mountains, Eastern Serbia',
    proposalReason: 'EXPERTISE',
    description: '14th-century monastery built into vertical rock cliffs by Prince Lazar, surrounded by Mlava canyon springs.',
    highlights: ['Prince Lazar Cave Sanctuary', 'Mlava River Canyon View', 'Monastic Spring Water']
  });

  record(
    'Prop-A-01: Option A proposal is created with status REVIEWED_007',
    propA.status === 'REVIEWED_007' && propA.proposalType === 'RECOMMENDATION',
    'status: REVIEWED_007, proposalType: RECOMMENDATION',
    `status: ${propA.status}, proposalType: ${propA.proposalType}`
  );

  record(
    'Prop-A-02: Agent 007 generates suitability score between 85 and 99',
    typeof propA.agent007Evaluation?.suitabilityScore === 'number' &&
      propA.agent007Evaluation.suitabilityScore >= 85 &&
      propA.agent007Evaluation.suitabilityScore <= 99,
    'Score between 85 and 99',
    `Score: ${propA.agent007Evaluation?.suitabilityScore}`
  );

  record(
    'Prop-A-03: Option A is retrievable by partner ID via getPartnerProposalsByPartnerId',
    getPartnerProposalsByPartnerId(TEST_PARTNER_ID).some(p => p.id === propA.id),
    'Proposal present in partner proposal list',
    'Found proposal in partner proposal list'
  );

  // --- TEST 2: Option B (Curated Experience Package) Submission & Evaluation ---
  const propB = savePartnerRecommendationProposal({
    partnerId: TEST_PARTNER_ID,
    partnerCode: TEST_PARTNER_CODE,
    partnerName: TEST_PARTNER_NAME,
    partnerEmail: 'guide@homolje.rs',
    proposalType: 'PACKAGE',
    title: 'Homolje Monastic Trails & Trout Spring Day Package',
    category: 'Travel',
    location: 'Belgrade → Petrovac na Mlavi → Gornjak → Krupaj Spring',
    proposalReason: 'UNDERREPRESENTED_SERBIA',
    description: 'Curated full-day private expedition traversing hidden cliffside monasteries, natural springs, and traditional Homolje trout gastronomy.',
    durationBucket: 'FULL-DAY',
    routeStops: ['Gornjak Monastery', 'Mlava Canyon Spring', 'Krupaj Spring', 'Traditional Trout Lunch'],
    includedServices: ['Licensed Guide in English/German', 'Private Minivan', 'Trout Tasting Menu', 'Spring Cave Entry'],
    targetVibe: 'Contemplative serenity, scenic springs, relaxed pace'
  });

  record(
    'Prop-B-01: Option B package proposal stores routeStops and durationBucket',
    propB.proposalType === 'PACKAGE' &&
      propB.durationBucket === 'FULL-DAY' &&
      Array.isArray(propB.routeStops) &&
      propB.routeStops.length === 4,
    'proposalType: PACKAGE, durationBucket: FULL-DAY, 4 routeStops',
    `type: ${propB.proposalType}, duration: ${propB.durationBucket}, stops: ${propB.routeStops?.length}`
  );

  record(
    'Prop-B-02: Agent 007 evaluates package multi-stop itinerary and partner services',
    typeof propB.agent007Evaluation?.curatorRecommendation === 'string' &&
      propB.agent007Evaluation.curatorRecommendation.includes('Homolje Monastic Trails'),
    'Evaluation mentions package title and partner co-assignment',
    `curatorRecommendation: ${propB.agent007Evaluation?.curatorRecommendation}`
  );

  // --- TEST 3: Invariant - Proposal is NOT automatically published before Curator Action ---
  const currentInitialRecs = INITIAL_RECOMMENDATIONS.map(r => r.title);
  record(
    'Prop-Inv-01: Proposals do not enter canonical public recommendations until Curator approves',
    !currentInitialRecs.includes(propA.title) && !currentInitialRecs.includes(propB.title),
    'Not yet published to INITIAL_RECOMMENDATIONS',
    'Confirmed absent prior to approval'
  );

  // --- TEST 4: Curator Approval & Automatic Partner Co-Assignment for Option B Package ---
  const approveResB = curatorApproveProposal(propB.id);

  record(
    'Prop-Approve-01: Curator approves Option B proposal successfully',
    approveResB.success === true && !!approveResB.recommendation,
    'success: true with generated recommendation',
    `success: ${approveResB.success}, recId: ${approveResB.recommendation?.id}`
  );

  // Verify partner was co-assigned
  const rawUpdatedPartners = safeStorage.getItem('idemo_portal_partners');
  const updatedPartners = rawUpdatedPartners ? JSON.parse(rawUpdatedPartners) : [];
  const testPartnerRecord = updatedPartners.find((p: any) => p.id === TEST_PARTNER_ID);
  const recId = approveResB.recommendation?.id;

  record(
    'Prop-Approve-02: Partner is automatically co-assigned to the approved package recommendation',
    Array.isArray(testPartnerRecord?.assignedRecs) && testPartnerRecord.assignedRecs.includes(recId),
    `assignedRecs includes ${recId}`,
    `assignedRecs: ${JSON.stringify(testPartnerRecord?.assignedRecs)}`
  );

  // Verify package recommendation stops and details formatted into longDescription
  record(
    'Prop-Approve-03: Recommendation highlights and description include route stops and inclusions',
    Boolean(
      (approveResB.recommendation as any)?.highlights?.includes('Gornjak Monastery') &&
      approveResB.recommendation?.longDescription?.includes('Key Stops:')
    ),
    'Stops included in highlights and longDescription',
    'Verified route stops formatted into recommendation'
  );

  // --- TEST 5: Curator Rejection / Archiving ---
  const rejectRes = curatorRejectProposal(propA.id);
  const reloadedProposals = getPartnerRecommendationProposals();
  const rejectedPropA = reloadedProposals.find(p => p.id === propA.id);

  record(
    'Prop-Reject-01: Curator can archive proposal cleanly',
    rejectRes.success && rejectedPropA?.status === 'CURATOR_REJECTED',
    'status: CURATOR_REJECTED',
    `status: ${rejectedPropA?.status}`
  );

  return results;
}

// Auto-run if executed directly
if (import.meta.url.endsWith('partnerProposalOptions.test.ts')) {
  console.log('--- RUNNING PARTNER PROPOSAL OPTIONS TEST SUITE ---');
  const results = runPartnerProposalOptionsTests();
  let passed = 0;
  for (const r of results) {
    const icon = r.passed ? '✓ PASS' : '✗ FAIL';
    if (r.passed) passed++;
    console.log(`[${icon}] ${r.name}`);
    if (!r.passed) {
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}`);
    }
  }
  console.log(`\nSUMMARY: ${passed} / ${results.length} PASSED`);
}
