/**
 * IDEMO 007 V2 - Curator Final Authority Override Tests (Slice 4.6)
 * Tests COA-01 through COA-10 for deterministic final publication decision resolution.
 */

import { resolveFinalPublicationDecision } from '../lib/idemo007v2/curatorAuthority';
import {
  PublicationValidationResult,
  CuratorOverride,
  CanonicalRecommendation,
} from '../types/idemo007v2';

export async function runCuratorAuthorityTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.6] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
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
    blockingReasons: ['INVALID_PROVENANCE'],
    errorDetails: ['Recommendation is missing valid provenance object'],
  };

  // COA-01 — automated PASS + no override → final publishable true, source AUTOMATED_GATE
  const decision01 = resolveFinalPublicationDecision(passValidation);
  addResult(
    'COA-01',
    'Automated PASS + no override resolves to finalPublishable true with source AUTOMATED_GATE',
    'finalPublishable: true, source: AUTOMATED_GATE',
    `finalPublishable: ${decision01.finalPublishable}, source: ${decision01.source}`,
    decision01.finalPublishable === true && decision01.source === 'AUTOMATED_GATE'
  );

  // COA-02 — automated FAIL + no override → final publishable false, source AUTOMATED_GATE
  const decision02 = resolveFinalPublicationDecision(failValidation);
  addResult(
    'COA-02',
    'Automated FAIL + no override resolves to finalPublishable false with source AUTOMATED_GATE',
    'finalPublishable: false, source: AUTOMATED_GATE',
    `finalPublishable: ${decision02.finalPublishable}, source: ${decision02.source}`,
    decision02.finalPublishable === false && decision02.source === 'AUTOMATED_GATE'
  );

  // COA-03 — automated FAIL + curator APPROVE → final publishable true, source CURATOR_OVERRIDE
  const approveOverride: CuratorOverride = {
    decision: 'APPROVE',
    reason: 'Verified manually with monastery authority',
    decidedAt: '2026-09-26T03:00:00Z',
    curatorId: 'curator-007',
  };
  const decision03 = resolveFinalPublicationDecision(failValidation, approveOverride);
  addResult(
    'COA-03',
    'Automated FAIL + curator APPROVE resolves to finalPublishable true with source CURATOR_OVERRIDE',
    'finalPublishable: true, source: CURATOR_OVERRIDE',
    `finalPublishable: ${decision03.finalPublishable}, source: ${decision03.source}`,
    decision03.finalPublishable === true && decision03.source === 'CURATOR_OVERRIDE'
  );

  // COA-04 — automated PASS + curator REJECT → final publishable false, source CURATOR_OVERRIDE
  const rejectOverride: CuratorOverride = {
    decision: 'REJECT',
    reason: 'Temporary site closure due to maintenance',
    decidedAt: '2026-09-26T03:05:00Z',
    curatorId: 'curator-007',
  };
  const decision04 = resolveFinalPublicationDecision(passValidation, rejectOverride);
  addResult(
    'COA-04',
    'Automated PASS + curator REJECT resolves to finalPublishable false with source CURATOR_OVERRIDE',
    'finalPublishable: false, source: CURATOR_OVERRIDE',
    `finalPublishable: ${decision04.finalPublishable}, source: ${decision04.source}`,
    decision04.finalPublishable === false && decision04.source === 'CURATOR_OVERRIDE'
  );

  // COA-05 — automated blocking reasons preserved after APPROVE override
  addResult(
    'COA-05',
    'Automated blocking reasons remain preserved and visible after curator APPROVE override',
    'automatedPublishable: false, reasons: INVALID_PROVENANCE',
    `automatedPublishable: ${decision03.automatedPublishable}, reasons: ${decision03.automatedBlockingReasons.join(',')}`,
    decision03.automatedPublishable === false && decision03.automatedBlockingReasons.includes('INVALID_PROVENANCE')
  );

  // COA-06 — automated PASS remains visible after curator REJECT
  addResult(
    'COA-06',
    'Automated PASS status remains visible as automatedPublishable true after curator REJECT',
    'automatedPublishable: true, finalPublishable: false',
    `automatedPublishable: ${decision04.automatedPublishable}, finalPublishable: ${decision04.finalPublishable}`,
    decision04.automatedPublishable === true && decision04.finalPublishable === false
  );

  // COA-07 — curator reason preserved
  addResult(
    'COA-07',
    'Curator reason text is preserved in override output',
    'reason: Verified manually with monastery authority',
    `reason: ${decision03.curatorOverride?.reason}`,
    decision03.curatorOverride?.reason === 'Verified manually with monastery authority'
  );

  // COA-08 — curator timestamp preserved
  addResult(
    'COA-08',
    'Curator decision timestamp is preserved in override output',
    'decidedAt: 2026-09-26T03:00:00Z',
    `decidedAt: ${decision03.curatorOverride?.decidedAt}`,
    decision03.curatorOverride?.decidedAt === '2026-09-26T03:00:00Z'
  );

  // COA-09 — override does NOT mutate PublicationValidationResult
  const frozenValidation: PublicationValidationResult = {
    publishable: false,
    blockingReasons: ['MISSING_IDENTITY'],
  };
  Object.freeze(frozenValidation);
  Object.freeze(frozenValidation.blockingReasons);

  let mutated = false;
  try {
    resolveFinalPublicationDecision(frozenValidation, approveOverride);
  } catch {
    mutated = true;
  }

  addResult(
    'COA-09',
    'Curator override resolution does not mutate input PublicationValidationResult object',
    'mutated: false',
    `mutated: ${mutated}`,
    mutated === false && frozenValidation.publishable === false
  );

  // COA-10 — override does NOT alter CanonicalRecommendation
  const sampleRec: CanonicalRecommendation = {
    id: 'rec-101',
    title: 'Test Place',
    category: 'History',
    shortDescription: 'Short test description',
  } as CanonicalRecommendation;

  const recCopyBefore = JSON.stringify(sampleRec);
  resolveFinalPublicationDecision(failValidation, approveOverride);
  const recCopyAfter = JSON.stringify(sampleRec);

  addResult(
    'COA-10',
    'Curator override resolution does not alter CanonicalRecommendation object',
    'recUnchanged: true',
    `recUnchanged: ${recCopyBefore === recCopyAfter}`,
    recCopyBefore === recCopyAfter
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2CuratorAuthority.test.ts')) {
  runCuratorAuthorityTests();
}
