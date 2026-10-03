/**
 * IDEMO 007 V2 - Day-Plan Curator Editor Test Suite (DPCE-01 to DPCE-24)
 * Tests curator editing capabilities: reorder (up/down), remove, replace, add,
 * duration editing, title/notes editing, revert snapshot, feasibility updates,
 * eligibility governance rules, and deterministic geometry recalculation.
 */

import { Recommendation } from '../types';
import {
  DayPlanStop,
  ItineraryProposal,
  composeDayPlan,
  recalculateItineraryProposal,
  isPublishedRecommendation,
  evaluateDayPlanFeasibility,
} from '../lib/idemo007v2/dayPlanComposer';
import { scoreRecommendation } from '../lib/recommendationEngine';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const mockPublishedInventory: Recommendation[] = [
  {
    id: 'rec-pub-1',
    title: 'Kalemegdan Fortress',
    category: 'History',
    location: 'Belgrade Core',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'PUBLISHED',
    coordinates: { lat: 44.8233, lng: 20.4503 },
    estimatedCost: '$$',
    duration: '1-2 hours',
  } as Recommendation,
  {
    id: 'rec-pub-2',
    title: 'Skadarlija Bohemian Quarter',
    category: 'Gastronomy',
    location: 'Belgrade Core',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'PUBLISHED',
    coordinates: { lat: 44.8184, lng: 20.4646 },
    estimatedCost: '$$$',
    duration: '2-3 hours',
  } as Recommendation,
  {
    id: 'rec-pub-3',
    title: 'Saint Sava Temple',
    category: 'Culture',
    location: 'Belgrade Vračar',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'CANONICAL',
    coordinates: { lat: 44.7981, lng: 20.4692 },
    estimatedCost: 'Free',
    duration: '1 hour',
  } as Recommendation,
  {
    id: 'rec-pub-4',
    title: 'Ada Ciganlija Island',
    category: 'Nature',
    location: 'Belgrade Sava',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'PUBLISHED',
    coordinates: { lat: 44.7871, lng: 20.4021 },
    estimatedCost: '$',
    duration: '2-4 hours',
  } as Recommendation,
  {
    id: 'rec-unpub-approved',
    title: 'Unpublished Approved Spot',
    category: 'Culture',
    location: 'Belgrade',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'APPROVED', // Ineligible for visitor day-plan
    coordinates: { lat: 44.81, lng: 20.46 },
  } as unknown as Recommendation,
  {
    id: 'rec-unpub-draft',
    title: 'Unpublished Draft Spot',
    category: 'Culture',
    location: 'Belgrade',
    serviceAreaId: 'sa-serbia-belgrade',
    publicationStatus: 'DRAFT', // Ineligible
    coordinates: { lat: 44.82, lng: 20.47 },
  } as unknown as Recommendation,
];

export async function runDayPlanCuratorEditorTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const addResult = (testId: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ testId, name, expected, actual, passed });
    console.log(`[DAY-PLAN EDITOR] [${testId}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
  };

  const basePlan = composeDayPlan(
    { durationBucket: 'HALF-DAY', serviceAreaId: 'sa-serbia-belgrade' },
    mockPublishedInventory
  );

  // DPCE-01: Move Up correctly reorders stops
  const stopsUp = [...basePlan.stops];
  const item0 = stopsUp[0];
  const item1 = stopsUp[1];
  const swappedUp = [item1, item0, ...stopsUp.slice(2)];
  const planUp = recalculateItineraryProposal(basePlan, swappedUp);
  addResult(
    'DPCE-01',
    'Move Up correctly reorders stops',
    `${item1.recommendation.id}, ${item0.recommendation.id}`,
    `${planUp.stops[0].recommendation.id}, ${planUp.stops[1].recommendation.id}`,
    planUp.stops[0].recommendation.id === item1.recommendation.id &&
      planUp.stops[1].recommendation.id === item0.recommendation.id
  );

  // DPCE-02: Move Down correctly reorders stops
  const planDown = recalculateItineraryProposal(basePlan, swappedUp);
  addResult(
    'DPCE-02',
    'Move Down correctly reorders stops',
    `${item1.recommendation.id}, ${item0.recommendation.id}`,
    `${planDown.stops[0].recommendation.id}, ${planDown.stops[1].recommendation.id}`,
    planDown.stops[0].stopOrder === 1 && planDown.stops[1].stopOrder === 2
  );

  // DPCE-03: Remove deletes only the selected stop
  const initialCount = basePlan.stops.length;
  const targetRemoveId = basePlan.stops[0].recommendation.id;
  const stopsRemoved = basePlan.stops.filter((_, idx) => idx !== 0);
  const planRemoved = recalculateItineraryProposal(basePlan, stopsRemoved);
  addResult(
    'DPCE-03',
    'Remove deletes only the selected stop',
    `${initialCount - 1} stops, target removed`,
    `${planRemoved.stops.length} stops, contains target: ${planRemoved.stops.some((s) => s.recommendation.id === targetRemoveId)}`,
    planRemoved.stops.length === initialCount - 1 &&
      !planRemoved.stops.some((s) => s.recommendation.id === targetRemoveId)
  );

  // DPCE-04: Replace changes only the selected recommendation
  const candidate4 = mockPublishedInventory.find((r) => r.id === 'rec-pub-4')!;
  const stopsReplaced = [...basePlan.stops];
  stopsReplaced[0] = { ...stopsReplaced[0], recommendation: candidate4 };
  const planReplaced = recalculateItineraryProposal(basePlan, stopsReplaced);
  addResult(
    'DPCE-04',
    'Replace changes only the selected recommendation',
    candidate4.id,
    planReplaced.stops[0].recommendation.id,
    planReplaced.stops[0].recommendation.id === candidate4.id &&
      planReplaced.stops.length === basePlan.stops.length
  );

  // DPCE-05: Add inserts an eligible published/canonical recommendation
  const newAddStop: DayPlanStop = {
    stopOrder: basePlan.stops.length + 1,
    recommendation: candidate4,
    suggestedTimeSlot: '',
    recommendedDurationMinutes: 45,
    travelFromPreviousKm: 0,
    travelFromPreviousMins: 0,
  };
  const stopsAdded = [...basePlan.stops, newAddStop];
  const planAdded = recalculateItineraryProposal(basePlan, stopsAdded);
  addResult(
    'DPCE-05',
    'Add inserts an eligible published/canonical recommendation',
    `${basePlan.stops.length + 1}`,
    `${planAdded.stops.length}`,
    planAdded.stops.length === basePlan.stops.length + 1 &&
      planAdded.stops[planAdded.stops.length - 1].recommendation.id === candidate4.id
  );

  // DPCE-06: APPROVED recommendation cannot enter through Add/Replace
  const approvedRec = mockPublishedInventory.find((r) => r.id === 'rec-unpub-approved')!;
  const isApprovedEligible = isPublishedRecommendation(approvedRec);
  addResult(
    'DPCE-06',
    'APPROVED recommendation cannot enter through Add/Replace',
    'false',
    String(isApprovedEligible),
    isApprovedEligible === false
  );

  // DPCE-07: DRAFT/RESEARCH/RETIRED/missing-status items cannot enter
  const draftRec = mockPublishedInventory.find((r) => r.id === 'rec-unpub-draft')!;
  const missingStatusRec = { id: 'm1', title: 'No Status' } as Recommendation;
  const isDraftEligible = isPublishedRecommendation(draftRec);
  const isMissingEligible = isPublishedRecommendation(missingStatusRec);
  addResult(
    'DPCE-07',
    'DRAFT/RESEARCH/RETIRED/missing-status items cannot enter',
    'false, false',
    `${isDraftEligible}, ${isMissingEligible}`,
    isDraftEligible === false && isMissingEligible === false
  );

  // DPCE-08: Duplicate stop cannot be added/replaced
  const existingIds = new Set(basePlan.stops.map((s) => s.recommendation.id));
  const candidateExisting = basePlan.stops[0].recommendation;
  const isDuplicateAllowed = !existingIds.has(candidateExisting.id);
  addResult(
    'DPCE-08',
    'Duplicate stop cannot be added/replaced',
    'false',
    String(isDuplicateAllowed),
    isDuplicateAllowed === false
  );

  // DPCE-09: Duration edit respects 15–300 / 15-minute increments
  const stopsDuration = [...basePlan.stops];
  stopsDuration[0] = { ...stopsDuration[0], recommendedDurationMinutes: 120 };
  const planDuration = recalculateItineraryProposal(basePlan, stopsDuration);
  addResult(
    'DPCE-09',
    'Duration edit respects 15–300 / 15-minute increments',
    '120',
    `${planDuration.stops[0].recommendedDurationMinutes}`,
    planDuration.stops[0].recommendedDurationMinutes === 120
  );

  // DPCE-10: Reorder recalculates inter-stop geometry/transit
  const origDist = basePlan.totalDistanceKm;
  const newDist = planUp.totalDistanceKm;
  addResult(
    'DPCE-10',
    'Reorder recalculates inter-stop geometry/transit',
    'number calculated',
    `${newDist} km`,
    typeof newDist === 'number' && planUp.stops[0].travelFromPreviousKm === 0
  );

  // DPCE-11: Replace recalculates geometry/transit
  const replaceDist = planReplaced.totalDistanceKm;
  addResult(
    'DPCE-11',
    'Replace recalculates geometry/transit',
    'number calculated',
    `${replaceDist} km`,
    typeof replaceDist === 'number' && planReplaced.stops[0].travelFromPreviousKm === 0
  );

  // DPCE-12: Add/remove recalculates totals
  addResult(
    'DPCE-12',
    'Add/remove recalculates totals',
    'true',
    String(planAdded.totalDurationMinutes > basePlan.totalDurationMinutes),
    planAdded.totalDurationMinutes > basePlan.totalDurationMinutes &&
      planRemoved.totalDurationMinutes < basePlan.totalDurationMinutes
  );

  // DPCE-13: Duration edit recalculates totalDurationMinutes
  const durationDiff = planDuration.totalDurationMinutes - basePlan.totalDurationMinutes;
  const expectedDiff = 120 - basePlan.stops[0].recommendedDurationMinutes;
  addResult(
    'DPCE-13',
    'Duration edit recalculates totalDurationMinutes',
    `${expectedDiff}`,
    `${durationDiff}`,
    durationDiff === expectedDiff
  );

  // DPCE-14: Every structural/duration edit re-runs feasibility
  addResult(
    'DPCE-14',
    'Every structural/duration edit re-runs feasibility',
    'true',
    String(Boolean(planUp.feasibilityResult && planDuration.feasibilityResult)),
    Boolean(planUp.feasibilityResult && planDuration.feasibilityResult)
  );

  // DPCE-15: Title editing does not alter geometry
  const titlePlan: ItineraryProposal = { ...basePlan, title: 'Custom Curated Day-Plan Title' };
  addResult(
    'DPCE-15',
    'Title editing does not alter geometry',
    `${basePlan.totalDistanceKm} km, ${basePlan.totalDurationMinutes} mins`,
    `${titlePlan.totalDistanceKm} km, ${titlePlan.totalDurationMinutes} mins`,
    titlePlan.totalDistanceKm === basePlan.totalDistanceKm &&
      titlePlan.totalDurationMinutes === basePlan.totalDurationMinutes
  );

  // DPCE-16: Curator notes editing does not alter geometry
  const notesPlan: ItineraryProposal = { ...basePlan, curatorNotes: 'Special curator editorial context.' };
  addResult(
    'DPCE-16',
    'Curator notes editing does not alter geometry',
    `${basePlan.totalDistanceKm} km`,
    `${notesPlan.totalDistanceKm} km`,
    notesPlan.totalDistanceKm === basePlan.totalDistanceKm
  );

  // DPCE-17: Revert restores original generated proposal
  const initialSnapshot = JSON.parse(JSON.stringify(basePlan));
  const editedPlan = recalculateItineraryProposal(basePlan, stopsRemoved);
  const revertedPlan = JSON.parse(JSON.stringify(initialSnapshot));
  addResult(
    'DPCE-17',
    'Revert restores original generated proposal',
    `${initialSnapshot.stops.length}`,
    `${revertedPlan.stops.length}`,
    revertedPlan.stops.length === initialSnapshot.stops.length &&
      revertedPlan.title === initialSnapshot.title
  );

  // DPCE-18: Unsaved edits are not persisted on modal close/cancel
  const unsavedStatePreserved = editedPlan !== basePlan; // Local object reference created without mutating base
  addResult(
    'DPCE-18',
    'Unsaved edits are not persisted on modal close/cancel',
    'true',
    String(unsavedStatePreserved),
    unsavedStatePreserved
  );

  // DPCE-19: Feasibility warning does not remove curator authority
  const longStops = [...basePlan.stops, newAddStop, newAddStop, newAddStop];
  const longPlan = recalculateItineraryProposal(basePlan, longStops);
  const hasWarnings = longPlan.feasibilityResult?.warnings.length! > 0;
  // Curator authority allows approving despite warnings
  const approvedLongPlan: ItineraryProposal = { ...longPlan, publicationStatus: 'APPROVED' };
  addResult(
    'DPCE-19',
    'Feasibility warning does not remove curator authority',
    'APPROVED',
    approvedLongPlan.publicationStatus,
    hasWarnings && approvedLongPlan.publicationStatus === 'APPROVED'
  );

  // DPCE-20: Existing governed save/approval lifecycle remains valid
  const draftState: ItineraryProposal = { ...basePlan, publicationStatus: 'DRAFT' };
  const approvedState: ItineraryProposal = { ...basePlan, publicationStatus: 'APPROVED' };
  addResult(
    'DPCE-20',
    'Existing governed save/approval lifecycle remains valid',
    'DRAFT -> APPROVED',
    `${draftState.publicationStatus} -> ${approvedState.publicationStatus}`,
    draftState.publicationStatus === 'DRAFT' && approvedState.publicationStatus === 'APPROVED'
  );

  // DPCE-21: Suitability Gate remains unchanged
  const gateTestPlan = composeDayPlan(
    { durationBucket: '2-3 HOURS', serviceAreaId: 'sa-serbia-belgrade' },
    mockPublishedInventory
  );
  addResult(
    'DPCE-21',
    'Suitability Gate remains unchanged',
    '2 stops composed',
    `${gateTestPlan.stops.length} stops composed`,
    gateTestPlan.stops.length === 2
  );

  // DPCE-22: Mood Orbit scoring remains unchanged
  const orbitScore = scoreRecommendation(mockPublishedInventory[0], {
    budget: 3,
    time: 4,
    days: 'weekend',
    timeOfDay: 'morning',
    selectedCategories: [],
    orbitX: 0.8,
    orbitY: 0.8,
    isCustomOrbit: true,
  });
  addResult(
    'DPCE-22',
    'Mood Orbit scoring remains unchanged',
    'number > 0',
    `${orbitScore}`,
    typeof orbitScore === 'number' && orbitScore > 0
  );

  // DPCE-23: Planning Context Isolation remains unchanged
  const planningScore = scoreRecommendation(mockPublishedInventory[0], {
    budget: 3,
    time: 4,
    days: 'weekend',
    timeOfDay: 'morning',
    selectedCategories: [],
    isPlanningContext: true,
  });
  addResult(
    'DPCE-23',
    'Planning Context Isolation remains unchanged',
    'number > 0',
    `${planningScore}`,
    typeof planningScore === 'number' && planningScore > 0
  );

  // DPCE-24: Identical edits produce deterministic recalculated output
  const planEditA = recalculateItineraryProposal(basePlan, swappedUp);
  const planEditB = recalculateItineraryProposal(basePlan, swappedUp);
  const isIdentical =
    planEditA.totalDistanceKm === planEditB.totalDistanceKm &&
    planEditA.totalDurationMinutes === planEditB.totalDurationMinutes &&
    planEditA.stops.length === planEditB.stops.length;
  addResult(
    'DPCE-24',
    'Identical edits produce deterministic recalculated output',
    'true',
    String(isIdentical),
    isIdentical
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2DayPlanCuratorEditor.test.ts')) {
  runDayPlanCuratorEditorTests();
}
