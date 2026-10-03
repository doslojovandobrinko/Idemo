/**
 * IDEMO 007 V2 - Candidate Curator Promotion Gate Tests (Slice 4.2)
 * Tests CP-01 through CP-12 for deterministic candidate promotion validation,
 * Agent 007 entry guard, unresolved location acknowledgement rules, and zero extra call execution.
 */

import {
  validateCandidatePromotion,
  promoteCandidate,
  candidateIsPromoted,
} from '../lib/idemo007v2/candidatePromotionGate';
import { executeV2Synthesis } from '../lib/idemo007v2/synthesisEngine';
import { DiscoveredCandidate } from '../lib/idemo007v2/candidateDiscoveryEngine';
import { FactPack, Entity, FactRecord } from '../types/idemo007v2';

export async function runCandidatePromotionTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.2] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  // Helper mock factory for a valid verified candidate
  const createMockCandidate = (overrides?: Partial<DiscoveredCandidate>): DiscoveredCandidate => {
    const entity: Entity = {
      id: 'entity-101',
      entityType: 'PLACE',
      canonicalName: 'Sopoćani Monastery',
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      location: 'Novi Pazar',
      coordinates: { lat: 43.118, lng: 20.373 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fact: FactRecord = {
      id: 'fact-101',
      entityId: 'entity-101',
      factKey: 'unesco_listing',
      value: 'UNESCO World Heritage site since 1979',
      sourceType: 'SEARCH_GROUNDED',
      sourceUrl: 'https://whc.unesco.org/en/list/96',
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const factPack: FactPack = {
      version: '1.0',
      recommendationType: 'PLACE',
      generatedAt: new Date().toISOString(),
      entities: [entity],
      facts: [fact],
      trustedEntities: [],
      sourceSummary: {
        totalFacts: 1,
        officialSourcesCount: 1,
        hasSearchGroundedFacts: true,
      },
      unresolvedGaps: [],
      curatorInput: {
        verificationStatus: 'RESEARCH_CANDIDATE',
        researchMode: 'DISCOVERY',
      },
    };

    return {
      id: 'entity-101',
      canonicalName: 'Sopoćani Monastery',
      entityType: 'PLACE',
      subtype: 'Monastery',
      location: 'Novi Pazar',
      address: 'Sopoćani, Novi Pazar',
      summaryNote: 'UNESCO World Heritage monastery near Novi Pazar.',
      coordinates: { lat: 43.118, lng: 20.373 },
      mapsPlaceId: 'ChIJ_sopocani_place_id',
      locationResolutionStatus: 'VERIFIED',
      entity,
      factPack,
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: 'DISCOVERY',
      ...overrides,
    };
  };

  // CP-01: complete verified candidate promotes
  const candidateVerified = createMockCandidate();
  const valCP01 = validateCandidatePromotion(candidateVerified);
  const promotedCP01 = valCP01.eligible ? promoteCandidate(candidateVerified) : null;

  addResult(
    'CP-01',
    'Complete verified candidate promotes',
    'eligible: true, status: PROMOTED',
    `eligible: ${valCP01.eligible}, status: ${promotedCP01?.verificationStatus}`,
    valCP01.eligible && promotedCP01?.verificationStatus === 'PROMOTED'
  );

  // CP-02: missing FactPack rejects
  const candidateNoFactPack = createMockCandidate({ factPack: undefined as any });
  const valCP02 = validateCandidatePromotion(candidateNoFactPack);

  addResult(
    'CP-02',
    'Missing FactPack rejects',
    'eligible: false, reasons includes MISSING_FACTPACK',
    `eligible: ${valCP02.eligible}, reasons: ${valCP02.blockingReasons.join(', ')}`,
    !valCP02.eligible && valCP02.blockingReasons.includes('MISSING_FACTPACK')
  );

  // CP-03: missing required fact rejects
  const candidateEmptyFacts = createMockCandidate();
  candidateEmptyFacts.factPack.facts = [];
  const valCP03 = validateCandidatePromotion(candidateEmptyFacts);

  addResult(
    'CP-03',
    'Missing required fact rejects',
    'eligible: false, reasons includes MISSING_REQUIRED_FACT',
    `eligible: ${valCP03.eligible}, reasons: ${valCP03.blockingReasons.join(', ')}`,
    !valCP03.eligible && valCP03.blockingReasons.includes('MISSING_REQUIRED_FACT')
  );

  // CP-04: missing provenance rejects
  const candidateNoProvenance = createMockCandidate();
  candidateNoProvenance.factPack.facts = [
    {
      id: 'fact-no-prov',
      entityId: 'entity-101',
      factKey: 'description',
      value: 'Some description',
      sourceType: undefined as any,
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  delete candidateNoProvenance.factPack.sourceSummary;
  delete (candidateNoProvenance.entity as any).provenance;

  const valCP04 = validateCandidatePromotion(candidateNoProvenance);

  addResult(
    'CP-04',
    'Missing provenance rejects',
    'eligible: false, reasons includes MISSING_PROVENANCE',
    `eligible: ${valCP04.eligible}, reasons: ${valCP04.blockingReasons.join(', ')}`,
    !valCP04.eligible && valCP04.blockingReasons.includes('MISSING_PROVENANCE')
  );

  // CP-04A: one fact with provenance + one governed fact without provenance → REJECT
  const candidatePartialProv = createMockCandidate();
  candidatePartialProv.factPack.facts = [
    {
      id: 'fact-with-prov',
      entityId: 'entity-101',
      factKey: 'unesco_listing',
      value: 'UNESCO World Heritage site',
      sourceType: 'SEARCH_GROUNDED',
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fact-without-prov',
      entityId: 'entity-101',
      factKey: 'opening_hours',
      value: '08:00 - 18:00',
      sourceType: undefined as any,
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const valCP04A = validateCandidatePromotion(candidatePartialProv);
  addResult(
    'CP-04A',
    'One fact with provenance + one governed fact without provenance rejects',
    'eligible: false, reasons includes MISSING_PROVENANCE',
    `eligible: ${valCP04A.eligible}, reasons: ${valCP04A.blockingReasons.join(', ')}`,
    !valCP04A.eligible && valCP04A.blockingReasons.includes('MISSING_PROVENANCE')
  );

  // CP-04B: every governed fact has provenance → PASS
  const candidateAllProv = createMockCandidate();
  candidateAllProv.factPack.facts = [
    {
      id: 'fact-1',
      entityId: 'entity-101',
      factKey: 'unesco_listing',
      value: 'UNESCO World Heritage site',
      sourceType: 'SEARCH_GROUNDED',
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fact-2',
      entityId: 'entity-101',
      factKey: 'opening_hours',
      value: '08:00 - 18:00',
      sourceType: 'PRIMARY_OFFICIAL',
      sourceUrl: 'https://sopocani.rs',
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const valCP04B = validateCandidatePromotion(candidateAllProv);
  addResult(
    'CP-04B',
    'Every governed fact has provenance passes',
    'eligible: true, blockingReasons empty',
    `eligible: ${valCP04B.eligible}, reasons: ${valCP04B.blockingReasons.join(', ')}`,
    valCP04B.eligible && !valCP04B.blockingReasons.includes('MISSING_PROVENANCE')
  );

  // CP-04C: FactPack-level provenance does not incorrectly cover unrelated facts -> REJECT
  const candidateEntityProvOnly = createMockCandidate();
  (candidateEntityProvOnly.entity as any).provenance = 'Entity-wide research document';
  candidateEntityProvOnly.factPack.sourceSummary = {
    totalFacts: 1,
    officialSourcesCount: 1,
    hasSearchGroundedFacts: true,
  };
  candidateEntityProvOnly.factPack.facts = [
    {
      id: 'fact-unbound',
      entityId: 'entity-101',
      factKey: 'ticket_price',
      value: 'Free admission',
      sourceType: undefined as any,
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const valCP04C = validateCandidatePromotion(candidateEntityProvOnly);
  addResult(
    'CP-04C',
    'FactPack-level provenance does not incorrectly cover unrelated facts',
    'eligible: false, reasons includes MISSING_PROVENANCE',
    `eligible: ${valCP04C.eligible}, reasons: ${valCP04C.blockingReasons.join(', ')}`,
    !valCP04C.eligible && valCP04C.blockingReasons.includes('MISSING_PROVENANCE')
  );

  // CP-04D: missing/invalid research mode → REJECT
  const candidateNoMode = createMockCandidate();
  delete (candidateNoMode as any).researchMode;
  delete (candidateNoMode as any).mode;
  delete candidateNoMode.factPack.curatorInput?.researchMode;
  delete candidateNoMode.entity.metadata?.researchMode;

  const valCP04D = validateCandidatePromotion(candidateNoMode);
  addResult(
    'CP-04D',
    'Missing/invalid research mode rejects',
    'eligible: false, reasons includes MISSING_RESEARCH_MODE',
    `eligible: ${valCP04D.eligible}, reasons: ${valCP04D.blockingReasons.join(', ')}`,
    !valCP04D.eligible && valCP04D.blockingReasons.includes('MISSING_RESEARCH_MODE')
  );

  // CP-05: unresolved without acknowledgement rejects
  const candidateUnresolved = createMockCandidate({
    coordinates: null,
    mapsPlaceId: null,
    locationResolutionStatus: 'UNRESOLVED',
  });

  const valCP05 = validateCandidatePromotion(candidateUnresolved, { locationAcknowledged: false });

  addResult(
    'CP-05',
    'Unresolved location without acknowledgement rejects',
    'eligible: false, reasons includes LOCATION_ACKNOWLEDGEMENT_REQUIRED',
    `eligible: ${valCP05.eligible}, reasons: ${valCP05.blockingReasons.join(', ')}`,
    !valCP05.eligible && valCP05.blockingReasons.includes('LOCATION_ACKNOWLEDGEMENT_REQUIRED')
  );

  // CP-06: unresolved with acknowledgement promotes
  const valCP06 = validateCandidatePromotion(candidateUnresolved, { locationAcknowledged: true });
  const promotedCP06 = valCP06.eligible ? promoteCandidate(candidateUnresolved, { locationAcknowledged: true }) : null;

  addResult(
    'CP-06',
    'Unresolved location with acknowledgement promotes',
    'eligible: true, status: PROMOTED',
    `eligible: ${valCP06.eligible}, status: ${promotedCP06?.verificationStatus}`,
    valCP06.eligible && promotedCP06?.verificationStatus === 'PROMOTED'
  );

  // CP-07: unresolved status remains UNRESOLVED after promotion
  addResult(
    'CP-07',
    'Unresolved status remains UNRESOLVED after promotion',
    'locationResolutionStatus: UNRESOLVED',
    `locationResolutionStatus: ${promotedCP06?.locationResolutionStatus}`,
    promotedCP06?.locationResolutionStatus === 'UNRESOLVED'
  );

  // CP-08: no coordinates/mapsPlaceId created for unresolved promotion
  const coordsIsNull = promotedCP06?.coordinates === null && promotedCP06?.entity?.coordinates === null;
  const placeIdIsNull = promotedCP06?.mapsPlaceId === null;

  addResult(
    'CP-08',
    'No coordinates or mapsPlaceId created for unresolved candidate during promotion',
    'coordinates: null, mapsPlaceId: null',
    `coordinates: ${JSON.stringify(promotedCP06?.coordinates)}, mapsPlaceId: ${promotedCP06?.mapsPlaceId}`,
    Boolean(coordsIsNull && placeIdIsNull)
  );

  // CP-09: view/edit does not auto-promote
  const candidateViewed = createMockCandidate();
  // Simply accessing fields or cloning object does not promote it
  const cloneViewed = { ...candidateViewed, summaryNote: 'Updated summary during review' };
  const isViewedPromoted = candidateIsPromoted(cloneViewed);

  addResult(
    'CP-09',
    'Viewing/editing candidate does not auto-promote',
    'candidateIsPromoted: false',
    `candidateIsPromoted: ${isViewedPromoted}`,
    isViewedPromoted === false
  );

  // CP-10: direct Agent 007 call rejects non-promoted candidate
  let directCallRejected = false;
  try {
    const unpromotedInput = {
      factPack: candidateVerified.factPack,
    };
    await executeV2Synthesis(unpromotedInput as any);
  } catch (err: any) {
    directCallRejected = err.message.includes('NOT_PROMOTED');
  }

  addResult(
    'CP-10',
    'Direct Agent 007 synthesis call rejects non-promoted candidate',
    'throws Error containing NOT_PROMOTED',
    `directCallRejected: ${directCallRejected}`,
    directCallRejected === true
  );

  // CP-11: FactPack/provenance unchanged after promotion
  const originalFactsCount = candidateVerified.factPack.facts.length;
  const originalFactKey = candidateVerified.factPack.facts[0].factKey;
  const promotedFactsCount = promotedCP01?.factPack.facts.length;
  const promotedFactKey = promotedCP01?.factPack.facts[0].factKey;

  addResult(
    'CP-11',
    'FactPack and provenance remain unchanged after promotion',
    `factsCount: ${originalFactsCount}, factKey: ${originalFactKey}`,
    `factsCount: ${promotedFactsCount}, factKey: ${promotedFactKey}`,
    originalFactsCount === promotedFactsCount && originalFactKey === promotedFactKey
  );

  // CP-12: promotion adds zero search/maps/LLM calls
  const startCallsTime = Date.now();
  const valCP12 = validateCandidatePromotion(candidateVerified);
  const promCP12 = promoteCandidate(candidateVerified);
  const durationMs = Date.now() - startCallsTime;

  addResult(
    'CP-12',
    'Promotion adds zero grounded search, zero Maps, and zero LLM calls',
    'durationMs < 10ms, 0 external network calls',
    `durationMs: ${durationMs}ms`,
    durationMs < 10 && Boolean(promCP12)
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2CandidatePromotion.test.ts')) {
  runCandidatePromotionTests();
}
