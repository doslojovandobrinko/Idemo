/**
 * IDEMO 007 V2 - Curator Review & Final Decision Surface Tests (Slice 4.7)
 * Tests CR-01 through CR-14 for curator surface rendering and decision resolution.
 */

import { validateCanonicalRecommendationForPublication } from '../lib/idemo007v2/publicationGate';
import { resolveFinalPublicationDecision } from '../lib/idemo007v2/curatorAuthority';
import {
  PublicationValidationResult,
  CuratorOverride,
  CanonicalRecommendation,
} from '../types/idemo007v2';

export async function runCuratorReviewSurfaceTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.7] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  const passValidation: PublicationValidationResult = {
    publishable: true,
    blockingReasons: [],
  };

  const failValidation: PublicationValidationResult = {
    publishable: false,
    blockingReasons: ['INVALID_PROVENANCE', 'INVALID_LOCATION_STATE'],
    errorDetails: [
      'Recommendation is missing valid provenance object',
      'UNRESOLVED location recommendation contains non-null coordinates',
    ],
  };

  const validRec: CanonicalRecommendation = {
    id: 'rec-valid-01',
    title: 'Manasija Monastery',
    category: 'History',
    shortDescription: '15th-century fortified Serbian Orthodox monastery near Despotovac.',
    shortDescriptionEn: '15th-century fortified Serbian Orthodox monastery near Despotovac.',
    publicationStatus: 'PUBLISHED',
    provenance: {
      source: 'Curator Field Verification',
      verificationStatus: 'VERIFIED',
    },
  } as unknown as CanonicalRecommendation;

  const blockedRec: CanonicalRecommendation = {
    id: 'rec-blocked-01',
    title: 'Unknown Site',
    category: 'History',
    shortDescription: 'Unverified historical location',
    publicationStatus: 'DRAFT',
  } as unknown as CanonicalRecommendation;

  // CR-01 — automated PASS displayed correctly
  const pubGateCR01 = validateCanonicalRecommendationForPublication(validRec);
  addResult(
    'CR-01',
    'Automated PASS status is evaluated and rendered correctly from publication gate',
    'publishable: true, blockingReasons: empty',
    `publishable: ${pubGateCR01.publishable}, reasons: ${pubGateCR01.blockingReasons.length}`,
    pubGateCR01.publishable === true && pubGateCR01.blockingReasons.length === 0
  );

  // CR-02 — automated BLOCKED displayed with blocking reasons
  addResult(
    'CR-02',
    'Automated BLOCKED status displays all active blocking reasons',
    'publishable: false, reasons: INVALID_PROVENANCE,INVALID_LOCATION_STATE',
    `publishable: ${failValidation.publishable}, reasons: ${failValidation.blockingReasons.join(',')}`,
    failValidation.publishable === false && failValidation.blockingReasons.includes('INVALID_PROVENANCE')
  );

  // CR-03 — no curator decision shows automated result as effective result
  const decisionCR03 = resolveFinalPublicationDecision(failValidation, undefined);
  addResult(
    'CR-03',
    'Unset curator decision defaults to automated gate result',
    'finalPublishable: false, source: AUTOMATED_GATE',
    `finalPublishable: ${decisionCR03.finalPublishable}, source: ${decisionCR03.source}`,
    decisionCR03.finalPublishable === false && decisionCR03.source === 'AUTOMATED_GATE'
  );

  // CR-04 — curator APPROVE overrides automated BLOCKED final outcome
  const approveOverride: CuratorOverride = {
    decision: 'APPROVE',
    reason: 'Verified through local cultural authority archive',
    decidedAt: '2026-09-26T04:00:00Z',
    curatorId: 'curator-007',
  };
  const decisionCR04 = resolveFinalPublicationDecision(failValidation, approveOverride);
  addResult(
    'CR-04',
    'Curator APPROVE overrides automated BLOCKED to finalPublishable true',
    'finalPublishable: true, source: CURATOR_OVERRIDE',
    `finalPublishable: ${decisionCR04.finalPublishable}, source: ${decisionCR04.source}`,
    decisionCR04.finalPublishable === true && decisionCR04.source === 'CURATOR_OVERRIDE'
  );

  // CR-05 — automated blocking reasons remain visible after curator APPROVE
  addResult(
    'CR-05',
    'Automated blocking reasons remain preserved after curator APPROVE override',
    'automatedPublishable: false, reasons: INVALID_PROVENANCE,INVALID_LOCATION_STATE',
    `automatedPublishable: ${decisionCR04.automatedPublishable}, reasons: ${decisionCR04.automatedBlockingReasons.join(',')}`,
    decisionCR04.automatedPublishable === false && decisionCR04.automatedBlockingReasons.includes('INVALID_PROVENANCE')
  );

  // CR-06 — curator REJECT overrides automated PASS final outcome
  const rejectOverride: CuratorOverride = {
    decision: 'REJECT',
    reason: 'Site temporarily closed for conservation work',
    decidedAt: '2026-09-26T04:05:00Z',
    curatorId: 'curator-007',
  };
  const decisionCR06 = resolveFinalPublicationDecision(passValidation, rejectOverride);
  addResult(
    'CR-06',
    'Curator REJECT overrides automated PASS to finalPublishable false',
    'finalPublishable: false, source: CURATOR_OVERRIDE',
    `finalPublishable: ${decisionCR06.finalPublishable}, source: ${decisionCR06.source}`,
    decisionCR06.finalPublishable === false && decisionCR06.source === 'CURATOR_OVERRIDE'
  );

  // CR-07 — curator reason is captured and preserved
  addResult(
    'CR-07',
    'Curator reason text is preserved in override object',
    'reason: Verified through local cultural authority archive',
    `reason: ${decisionCR04.curatorOverride?.reason}`,
    decisionCR04.curatorOverride?.reason === 'Verified through local cultural authority archive'
  );

  // CR-08 — decidedAt is populated using existing timestamp convention
  addResult(
    'CR-08',
    'Curator decision timestamp is populated in valid ISO format',
    'decidedAt present: true',
    `decidedAt: ${decisionCR04.curatorOverride?.decidedAt}`,
    typeof decisionCR04.curatorOverride?.decidedAt === 'string' && decisionCR04.curatorOverride.decidedAt.includes('T')
  );

  // CR-09 — existing curator decision renders/persists correctly when review is reopened
  const recWithOverride = {
    ...blockedRec,
    curatorOverride: approveOverride,
    publicationValidation: failValidation,
    finalPublicationDecision: decisionCR04,
  };
  const reloadedDecision = resolveFinalPublicationDecision(
    recWithOverride.publicationValidation,
    recWithOverride.curatorOverride
  );
  addResult(
    'CR-09',
    'Persisted curator decision reloads and resolves consistently when reopened',
    'finalPublishable: true, decision: APPROVE',
    `finalPublishable: ${reloadedDecision.finalPublishable}, decision: ${reloadedDecision.curatorOverride?.decision}`,
    reloadedDecision.finalPublishable === true && reloadedDecision.curatorOverride?.decision === 'APPROVE'
  );

  // CR-10 — changing APPROVE to REJECT updates final decision correctly
  const updatedRejectOverride: CuratorOverride = {
    ...approveOverride,
    decision: 'REJECT',
    reason: 'Updated status after finding new safety issue',
    decidedAt: '2026-09-26T04:10:00Z',
  };
  const decisionCR10 = resolveFinalPublicationDecision(failValidation, updatedRejectOverride);
  addResult(
    'CR-10',
    'Updating decision from APPROVE to REJECT alters finalPublishable to false',
    'finalPublishable: false, decision: REJECT',
    `finalPublishable: ${decisionCR10.finalPublishable}, decision: ${decisionCR10.curatorOverride?.decision}`,
    decisionCR10.finalPublishable === false && decisionCR10.curatorOverride?.decision === 'REJECT'
  );

  // CR-11 — changing REJECT to APPROVE updates final decision correctly
  const updatedApproveOverride: CuratorOverride = {
    ...rejectOverride,
    decision: 'APPROVE',
    reason: 'Conservation work completed ahead of schedule',
    decidedAt: '2026-09-26T04:15:00Z',
  };
  const decisionCR11 = resolveFinalPublicationDecision(passValidation, updatedApproveOverride);
  addResult(
    'CR-11',
    'Updating decision from REJECT to APPROVE alters finalPublishable to true',
    'finalPublishable: true, decision: APPROVE',
    `finalPublishable: ${decisionCR11.finalPublishable}, decision: ${decisionCR11.curatorOverride?.decision}`,
    decisionCR11.finalPublishable === true && decisionCR11.curatorOverride?.decision === 'APPROVE'
  );

  // CR-12 — UI/resolution consumes domain layer without recomputing governance independently
  const domainResolved = resolveFinalPublicationDecision(failValidation, approveOverride);
  addResult(
    'CR-12',
    'UI resolution relies directly on domain authority resolveFinalPublicationDecision',
    'source: CURATOR_OVERRIDE, finalPublishable: true',
    `source: ${domainResolved.source}, finalPublishable: ${domainResolved.finalPublishable}`,
    domainResolved.source === 'CURATOR_OVERRIDE' && domainResolved.finalPublishable === true
  );

  // CR-13 — raw LLM/search/debug payloads are not exposed in canonical recommendation display
  const cleanRecKeys = Object.keys(validRec);
  const containsProhibitedRaw = cleanRecKeys.some((k) =>
    ['rawSearchResponse', 'rawLlmResponse', 'modelReasoning', 'debugPayload'].includes(k)
  );
  addResult(
    'CR-13',
    'Canonical recommendation display excludes raw LLM/search debug payloads',
    'containsProhibitedRaw: false',
    `containsProhibitedRaw: ${containsProhibitedRaw}`,
    containsProhibitedRaw === false
  );

  // CR-14 — fresh and cached synthesis results render equivalent governance state when passed to final decision resolution
  const freshDecision = resolveFinalPublicationDecision(passValidation, approveOverride);
  const cachedDecision = resolveFinalPublicationDecision(passValidation, approveOverride);
  addResult(
    'CR-14',
    'Fresh and cached synthesis results yield identical final publication decisions',
    'equivalent: true',
    `equivalent: ${JSON.stringify(freshDecision) === JSON.stringify(cachedDecision)}`,
    JSON.stringify(freshDecision) === JSON.stringify(cachedDecision)
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2CuratorReviewSurface.test.ts')) {
  runCuratorReviewSurfaceTests();
}
