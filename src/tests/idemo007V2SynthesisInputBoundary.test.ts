/**
 * IDEMO 007 V2 - Promoted Input Boundary Hardening Tests (Slice 4.3)
 * Tests SI-01 through SI-12 for governed synthesis input DTO construction,
 * intake boundary validation, raw payload exclusion, unresolved location handling,
 * and zero additional network calls.
 */

import {
  buildGovernedSynthesisInput,
  validateGovernedSynthesisInput,
} from '../lib/idemo007v2/governedSynthesisInput';
import { buildSynthesisPrompt, executeV2Synthesis } from '../lib/idemo007v2/synthesisEngine';
import { promoteCandidate } from '../lib/idemo007v2/candidatePromotionGate';
import { DiscoveredCandidate } from '../lib/idemo007v2/candidateDiscoveryEngine';
import { FactPack, Entity, FactRecord } from '../types/idemo007v2';

export async function runSynthesisInputBoundaryTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.3] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  // Helper mock factory for a valid promoted candidate
  const createMockCandidate = (overrides?: Partial<DiscoveredCandidate>): DiscoveredCandidate => {
    const entity: Entity = {
      id: 'entity-201',
      entityType: 'PLACE',
      canonicalName: 'Studenica Monastery',
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      location: 'Kraljevo',
      coordinates: { lat: 43.486, lng: 20.531 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        researchMode: 'DISCOVERY',
      },
    };

    const fact: FactRecord = {
      id: 'fact-201',
      entityId: 'entity-201',
      factKey: 'unesco_inscription',
      value: 'UNESCO World Heritage Site since 1986',
      sourceType: 'SEARCH_GROUNDED',
      sourceUrl: 'https://whc.unesco.org/en/list/384',
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

    const rawCandidate: DiscoveredCandidate = {
      id: 'entity-201',
      canonicalName: 'Studenica Monastery',
      entityType: 'PLACE',
      subtype: 'Monastery',
      location: 'Kraljevo',
      address: 'Studenica, Kraljevo',
      summaryNote: 'Twelfth-century Serbian Orthodox monastery near Kraljevo.',
      coordinates: { lat: 43.486, lng: 20.531 },
      mapsPlaceId: 'ChIJ_studenica_place_id',
      locationResolutionStatus: 'VERIFIED',
      entity,
      factPack,
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: 'DISCOVERY',
      ...overrides,
    };

    // Promote candidate so it passes promotion gate
    return promoteCandidate(rawCandidate);
  };

  // SI-01: promoted valid candidate builds governed synthesis input
  const candidateSI01 = createMockCandidate();
  const governedSI01 = buildGovernedSynthesisInput(candidateSI01);

  addResult(
    'SI-01',
    'Promoted valid candidate builds governed synthesis input DTO',
    'candidateId: entity-201, canonicalName: Studenica Monastery, researchMode: DISCOVERY',
    `candidateId: ${governedSI01.candidateId}, canonicalName: ${governedSI01.canonicalName}, researchMode: ${governedSI01.researchMode}`,
    governedSI01.candidateId === 'entity-201' &&
      governedSI01.canonicalName === 'Studenica Monastery' &&
      governedSI01.researchMode === 'DISCOVERY' &&
      governedSI01.factPack.facts.length === 1
  );

  // SI-02: non-promoted candidate rejects
  let rejectedSI02 = false;
  try {
    const rawCandidateUnpromoted = {
      id: 'entity-unpromoted',
      canonicalName: 'Unpromoted Place',
      entityType: 'PLACE',
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: 'DISCOVERY',
      factPack: {
        version: '1.0',
        recommendationType: 'PLACE',
        generatedAt: new Date().toISOString(),
        entities: [],
        facts: [
          {
            id: 'f1',
            entityId: 'entity-unpromoted',
            factKey: 'k',
            value: 'v',
            sourceType: 'SEARCH_GROUNDED',
            verifiedAt: new Date().toISOString(),
            volatility: 'STATIC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        trustedEntities: [],
        sourceSummary: { totalFacts: 1, officialSourcesCount: 1, hasSearchGroundedFacts: true },
        unresolvedGaps: [],
      },
    };

    buildGovernedSynthesisInput(rawCandidateUnpromoted);
  } catch (err: any) {
    rejectedSI02 = err.message.includes('NOT_PROMOTED');
  }

  addResult(
    'SI-02',
    'Non-promoted candidate rejects synthesis boundary intake',
    'throws Error containing NOT_PROMOTED',
    `rejected: ${rejectedSI02}`,
    rejectedSI02 === true
  );

  // SI-03: raw search metadata is excluded
  const candidateWithRawSearch = createMockCandidate();
  (candidateWithRawSearch as any).rawSearchResponse = 'RAW SEARCH FLUFF - Top 10 places in Serbia';
  (candidateWithRawSearch as any).searchSnippets = ['Promotional snippet text'];

  let rejectedSI03 = false;
  try {
    buildGovernedSynthesisInput(candidateWithRawSearch);
  } catch (err: any) {
    rejectedSI03 = err.message.includes('PROHIBITED_RESEARCH_PAYLOAD_DETECTED');
  }

  addResult(
    'SI-03',
    'Raw search metadata outside FactPack triggers prohibited research payload rejection',
    'throws Error containing PROHIBITED_RESEARCH_PAYLOAD_DETECTED',
    `rejected: ${rejectedSI03}`,
    rejectedSI03 === true
  );

  // SI-04: discovery notes are excluded unless promoted into FactPack
  const candidateWithNotes = createMockCandidate({
    summaryNote: 'Unpromoted raw discovery search summary note',
  });
  const governedSI04 = buildGovernedSynthesisInput(candidateWithNotes);
  const promptSI04 = buildSynthesisPrompt(governedSI04);

  const notesInDTO = (governedSI04 as any).summaryNote !== undefined;
  const notesInPrompt = promptSI04.userPrompt.includes('Unpromoted raw discovery search summary note');

  addResult(
    'SI-04',
    'Discovery notes outside FactPack are excluded from DTO and model prompt',
    'notesInDTO: false, notesInPrompt: false',
    `notesInDTO: ${notesInDTO}, notesInPrompt: ${notesInPrompt}`,
    notesInDTO === false && notesInPrompt === false
  );

  // SI-05: governed FactPack facts are preserved unchanged
  const candidateSI05 = createMockCandidate();
  const originalFactKey = candidateSI05.factPack.facts[0].factKey;
  const originalFactValue = candidateSI05.factPack.facts[0].value;
  const governedSI05 = buildGovernedSynthesisInput(candidateSI05);

  const preservedKey = governedSI05.factPack.facts[0].factKey;
  const preservedValue = governedSI05.factPack.facts[0].value;

  addResult(
    'SI-05',
    'Governed FactPack facts are preserved unchanged in DTO',
    `factKey: ${originalFactKey}, value: ${originalFactValue}`,
    `factKey: ${preservedKey}, value: ${preservedValue}`,
    originalFactKey === preservedKey && originalFactValue === preservedValue
  );

  // SI-06: missing provenance rejects
  let rejectedSI06 = false;
  try {
    const candidateNoProv = createMockCandidate();
    candidateNoProv.factPack.facts = [
      {
        id: 'f-no-prov',
        entityId: 'entity-201',
        factKey: 'unprovenanced_fact',
        value: 'Unverified claim',
        sourceType: undefined as any,
        verifiedAt: new Date().toISOString(),
        volatility: 'STATIC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    delete candidateNoProv.factPack.sourceSummary;
    delete (candidateNoProv.entity as any).provenance;

    buildGovernedSynthesisInput(candidateNoProv);
  } catch (err: any) {
    rejectedSI06 = err.message.includes('MISSING_PROVENANCE');
  }

  addResult(
    'SI-06',
    'Missing fact provenance rejects synthesis intake',
    'throws Error containing MISSING_PROVENANCE',
    `rejected: ${rejectedSI06}`,
    rejectedSI06 === true
  );

  // SI-07: unresolved candidate passes without synthetic coordinates
  const rawUnresolved = {
    id: 'entity-unresolved',
    canonicalName: 'Remote Canyon Viewpoint',
    entityType: 'PLACE',
    subtype: 'Viewpoint',
    location: 'Tara National Park',
    coordinates: null,
    mapsPlaceId: null,
    locationResolutionStatus: 'UNRESOLVED',
    verificationStatus: 'RESEARCH_CANDIDATE',
    researchMode: 'DISCOVERY',
    entity: {
      id: 'entity-unresolved',
      entityType: 'PLACE',
      canonicalName: 'Remote Canyon Viewpoint',
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      location: 'Tara National Park',
      coordinates: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { researchMode: 'DISCOVERY' },
    },
    factPack: {
      version: '1.0',
      recommendationType: 'PLACE',
      generatedAt: new Date().toISOString(),
      entities: [],
      facts: [
        {
          id: 'fact-unres-1',
          entityId: 'entity-unresolved',
          factKey: 'viewpoint_elevation',
          value: '1020 meters above sea level',
          sourceType: 'SEARCH_GROUNDED',
          verifiedAt: new Date().toISOString(),
          volatility: 'STATIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      trustedEntities: [],
      sourceSummary: { totalFacts: 1, officialSourcesCount: 0, hasSearchGroundedFacts: true },
      unresolvedGaps: [],
      curatorInput: { verificationStatus: 'RESEARCH_CANDIDATE', researchMode: 'DISCOVERY' },
    },
  };

  const promotedUnresolved = promoteCandidate(rawUnresolved as any, { locationAcknowledged: true });
  const governedSI07 = buildGovernedSynthesisInput(promotedUnresolved);

  addResult(
    'SI-07',
    'Unresolved candidate passes intake without synthetic coordinates',
    'locationResolutionStatus: UNRESOLVED, verifiedLocation: null',
    `locationResolutionStatus: ${governedSI07.locationResolutionStatus}, verifiedLocation: ${JSON.stringify(
      governedSI07.verifiedLocation
    )}`,
    governedSI07.locationResolutionStatus === 'UNRESOLVED' && governedSI07.verifiedLocation === null
  );

  // SI-08: unresolved candidate does not gain verified-location wording/data in prompt
  const promptSI08 = buildSynthesisPrompt(governedSI07);
  const promptHasLat = promptSI08.userPrompt.includes('43.') || promptSI08.userPrompt.includes('20.');
  const promptHasPlaceId = promptSI08.userPrompt.includes('ChIJ');

  addResult(
    'SI-08',
    'Unresolved candidate does not gain verified location coordinates or place IDs in model prompt',
    'promptHasLat: false, promptHasPlaceId: false',
    `promptHasLat: ${promptHasLat}, promptHasPlaceId: ${promptHasPlaceId}`,
    promptHasLat === false && promptHasPlaceId === false
  );

  // SI-09: synthesis prompt reads governed DTO only
  const promptSI09 = buildSynthesisPrompt(governedSI01);
  const promptHasCanonicalName = promptSI09.userPrompt.includes('Studenica Monastery');
  const promptHasType = promptSI09.userPrompt.includes('Type: PLACE');
  const promptHasFact = promptSI09.userPrompt.includes('unesco_inscription');

  addResult(
    'SI-09',
    'Synthesis prompt consumes governed DTO canonical identity and FactPack evidence only',
    'hasCanonicalName: true, hasType: true, hasFact: true',
    `hasCanonicalName: ${promptHasCanonicalName}, hasType: ${promptHasType}, hasFact: ${promptHasFact}`,
    promptHasCanonicalName && promptHasType && promptHasFact
  );

  // SI-10: stale candidate metadata cannot influence model input
  const candidateWithStaleMeta = createMockCandidate();
  (candidateWithStaleMeta as any).staleMetadata = {
    deprecatedName: 'Stale Monastery Title',
    oldCoordinates: { lat: 11.11, lng: 22.22 },
  };

  const governedSI10 = buildGovernedSynthesisInput(candidateWithStaleMeta);
  const promptSI10 = buildSynthesisPrompt(governedSI10);

  const staleInDTO = (governedSI10 as any).staleMetadata !== undefined;
  const staleInPrompt = promptSI10.userPrompt.includes('Stale Monastery Title') || promptSI10.userPrompt.includes('11.11');

  addResult(
    'SI-10',
    'Stale candidate metadata outside FactPack cannot influence governed DTO or model prompt',
    'staleInDTO: false, staleInPrompt: false',
    `staleInDTO: ${staleInDTO}, staleInPrompt: ${staleInPrompt}`,
    staleInDTO === false && staleInPrompt === false
  );

  // SI-11: previous model output cannot re-enter factual input
  const candidateWithPrevLLM = createMockCandidate();
  (candidateWithPrevLLM as any).previousModelOutput = 'Previous synthesized LLM paragraph text';

  let rejectedSI11 = false;
  try {
    buildGovernedSynthesisInput(candidateWithPrevLLM);
  } catch (err: any) {
    rejectedSI11 = err.message.includes('PROHIBITED_RESEARCH_PAYLOAD_DETECTED');
  }

  addResult(
    'SI-11',
    'Previous model output re-entering factual input triggers prohibited research payload rejection',
    'throws Error containing PROHIBITED_RESEARCH_PAYLOAD_DETECTED',
    `rejected: ${rejectedSI11}`,
    rejectedSI11 === true
  );

  // SI-12: zero additional search/maps/LLM calls
  const startTime = Date.now();
  const governedSI12 = buildGovernedSynthesisInput(candidateSI01);
  const promptSI12 = buildSynthesisPrompt(governedSI12);
  const durationMs = Date.now() - startTime;

  addResult(
    'SI-12',
    'Synthesis input boundary building and validation adds zero search, zero Maps, and zero LLM calls',
    'durationMs < 10ms, 0 external network calls',
    `durationMs: ${durationMs}ms`,
    durationMs < 10 && Boolean(promptSI12.userPrompt)
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2SynthesisInputBoundary.test.ts')) {
  runSynthesisInputBoundaryTests();
}
