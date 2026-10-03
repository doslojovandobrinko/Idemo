/**
 * IDEMO 007 V2 - Publication Gate Tests (Slice 4.5)
 * Tests PG-01 through PG-12 for deterministic publication-readiness validation.
 */

import { validateCanonicalRecommendationForPublication } from '../lib/idemo007v2/publicationGate';
import {
  buildGovernedSynthesisInput,
} from '../lib/idemo007v2/governedSynthesisInput';
import {
  assembleCanonicalRecommendation,
  executeV2Synthesis,
} from '../lib/idemo007v2/synthesisEngine';
import { promoteCandidate } from '../lib/idemo007v2/candidatePromotionGate';
import { parseEditorialOutput } from '../lib/idemo007v2/editorialOutputParser';
import { DiscoveredCandidate } from '../lib/idemo007v2/candidateDiscoveryEngine';
import { FactPack, Entity, FactRecord, GovernedSynthesisInput, CanonicalRecommendation } from '../types/idemo007v2';

export async function runPublicationGateTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.5] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  // Helper mock factory for a valid governed candidate
  const createMockGovernedInput = (overrides?: Partial<DiscoveredCandidate>): GovernedSynthesisInput => {
    const entity: Entity = {
      id: 'entity-401',
      entityType: 'PLACE',
      canonicalName: 'Manasija Monastery',
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      location: 'Despotovac',
      coordinates: { lat: 44.101, lng: 21.469 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { researchMode: 'DISCOVERY' },
    };

    const fact1: FactRecord = {
      id: 'fact-401',
      entityId: 'entity-401',
      factKey: 'foundation_fortress',
      value: '15th-century fortified Serbian Orthodox monastery founded by Despot Stefan Lazarević',
      sourceType: 'SEARCH_GROUNDED',
      sourceUrl: 'https://manasija.rs',
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
      facts: [fact1],
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
      id: 'entity-401',
      canonicalName: 'Manasija Monastery',
      entityType: 'PLACE',
      subtype: 'Monastery',
      location: 'Despotovac',
      address: 'Despotovac, Pomoravlje',
      summaryNote: 'Fortified 15th century monastery near Despotovac.',
      coordinates: { lat: 44.101, lng: 21.469 },
      mapsPlaceId: 'ChIJ_manasija_place_id',
      locationResolutionStatus: 'VERIFIED',
      entity,
      factPack,
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: 'DISCOVERY',
      ...overrides,
    };

    const isUnresolved = rawCandidate.locationResolutionStatus === 'UNRESOLVED';
    const promoted = promoteCandidate(rawCandidate, { locationAcknowledged: isUnresolved });
    return buildGovernedSynthesisInput(promoted);
  };

  const validEditorialJson = JSON.stringify({
    titleEn: 'Manasija Monastery',
    titleSr: 'Манастир Манасија',
    subtitleEn: '15th-Century Fortified Monastery',
    subtitleSr: 'Утврђени манастир из 15. века',
    shortDescriptionEn:
      'Manasija Monastery is a 15th-century fortified Serbian Orthodox monastery founded by Despot Stefan Lazarević.',
    shortDescriptionSr:
      'Манастир Манасија је утврђени српски православни манастир из 15. века који је основао деспот Стефан Лазаревић.',
    usedFactKeys: ['foundation_fortress'],
  });

  const parsedEd = parseEditorialOutput(validEditorialJson).editorialOutput!;

  // PG-01 — valid canonical recommendation is publishable
  const governedPG01 = createMockGovernedInput();
  const assembledPG01 = assembleCanonicalRecommendation(parsedEd, governedPG01);
  const gatePG01 = validateCanonicalRecommendationForPublication(assembledPG01, governedPG01);

  addResult(
    'PG-01',
    'Valid canonical recommendation is publishable with zero blocking reasons',
    'publishable: true, blockingReasons: empty',
    `publishable: ${gatePG01.publishable}, reasons: ${gatePG01.blockingReasons.join(',')}`,
    gatePG01.publishable === true && gatePG01.blockingReasons.length === 0
  );

  // PG-02 — missing canonical identity is blocked
  const invalidIdentityRec = { ...assembledPG01, title: '', titleEn: '', canonicalName: '' } as unknown as CanonicalRecommendation;
  const gatePG02 = validateCanonicalRecommendationForPublication(invalidIdentityRec, governedPG01);

  addResult(
    'PG-02',
    'Missing canonical identity triggers MISSING_IDENTITY blocking reason',
    'publishable: false, includes MISSING_IDENTITY',
    `publishable: ${gatePG02.publishable}, reasons: ${gatePG02.blockingReasons.join(',')}`,
    gatePG02.publishable === false && gatePG02.blockingReasons.includes('MISSING_IDENTITY')
  );

  // PG-03 — missing required editorial field is blocked
  const invalidEditorialRec = { ...assembledPG01, shortDescription: '', shortDescriptionEn: '' } as unknown as CanonicalRecommendation;
  const gatePG03 = validateCanonicalRecommendationForPublication(invalidEditorialRec, governedPG01);

  addResult(
    'PG-03',
    'Missing required editorial short description triggers MISSING_REQUIRED_EDITORIAL_CONTENT',
    'publishable: false, includes MISSING_REQUIRED_EDITORIAL_CONTENT',
    `publishable: ${gatePG03.publishable}, reasons: ${gatePG03.blockingReasons.join(',')}`,
    gatePG03.publishable === false && gatePG03.blockingReasons.includes('MISSING_REQUIRED_EDITORIAL_CONTENT')
  );

  // PG-04 — raw LLM/debug field is blocked if injected adversarially
  const rawLlmRec = { ...assembledPG01, rawLlmResponse: 'Adversarial LLM dump text' } as unknown as CanonicalRecommendation;
  const gatePG04 = validateCanonicalRecommendationForPublication(rawLlmRec, governedPG01);

  addResult(
    'PG-04',
    'Adversarially injected raw LLM payload triggers PROHIBITED_RAW_PAYLOAD',
    'publishable: false, includes PROHIBITED_RAW_PAYLOAD',
    `publishable: ${gatePG04.publishable}, reasons: ${gatePG04.blockingReasons.join(',')}`,
    gatePG04.publishable === false && gatePG04.blockingReasons.includes('PROHIBITED_RAW_PAYLOAD')
  );

  // PG-05 — raw research payload is blocked if injected adversarially
  const rawResearchRec = { ...assembledPG01, rawSearchResponse: 'Search dump' } as unknown as CanonicalRecommendation;
  const gatePG05 = validateCanonicalRecommendationForPublication(rawResearchRec, governedPG01);

  addResult(
    'PG-05',
    'Adversarially injected raw search payload triggers PROHIBITED_RAW_PAYLOAD',
    'publishable: false, includes PROHIBITED_RAW_PAYLOAD',
    `publishable: ${gatePG05.publishable}, reasons: ${gatePG05.blockingReasons.join(',')}`,
    gatePG05.publishable === false && gatePG05.blockingReasons.includes('PROHIBITED_RAW_PAYLOAD')
  );

  // PG-06 — VERIFIED location preserves governed coordinates
  const verifiedRec = { ...assembledPG01 } as CanonicalRecommendation;
  const gatePG06 = validateCanonicalRecommendationForPublication(verifiedRec, governedPG01);

  addResult(
    'PG-06',
    'VERIFIED location recommendation preserves governed coordinates and passes publication gate',
    'publishable: true, coordinates lat: 44.101',
    `publishable: ${gatePG06.publishable}, lat: ${verifiedRec.coordinates?.lat}`,
    gatePG06.publishable === true && verifiedRec.coordinates?.lat === 44.101
  );

  // PG-07 — UNRESOLVED location with null coordinates remains valid
  const unresolvedGoverned = createMockGovernedInput({
    locationResolutionStatus: 'UNRESOLVED',
    coordinates: null,
    mapsPlaceId: null,
  });
  const unresolvedRec = assembleCanonicalRecommendation(parsedEd, unresolvedGoverned) as CanonicalRecommendation;
  const gatePG07 = validateCanonicalRecommendationForPublication(unresolvedRec, unresolvedGoverned);

  addResult(
    'PG-07',
    'UNRESOLVED location with null coordinates remains publishable',
    'publishable: true, coordinates: null',
    `publishable: ${gatePG07.publishable}, coordinates: ${unresolvedRec.coordinates}`,
    gatePG07.publishable === true && unresolvedRec.coordinates === null
  );

  // PG-08 — UNRESOLVED location cannot contain verified coordinates/place ID
  const invalidUnresolvedRec = {
    ...unresolvedRec,
    coordinates: { lat: 44.101, lng: 21.469 },
    mapsPlaceId: 'ChIJ_verified_maps_id',
  } as unknown as CanonicalRecommendation;
  const gatePG08 = validateCanonicalRecommendationForPublication(invalidUnresolvedRec, unresolvedGoverned);

  addResult(
    'PG-08',
    'UNRESOLVED location recommendation with non-null coordinates or verified mapsPlaceId is blocked',
    'publishable: false, includes INVALID_LOCATION_STATE',
    `publishable: ${gatePG08.publishable}, reasons: ${gatePG08.blockingReasons.join(',')}`,
    gatePG08.publishable === false && gatePG08.blockingReasons.includes('INVALID_LOCATION_STATE')
  );

  // PG-09 — invalid provenance is blocked
  const invalidProvRec = { ...assembledPG01, provenance: null } as unknown as CanonicalRecommendation;
  const gatePG09 = validateCanonicalRecommendationForPublication(invalidProvRec, governedPG01);

  addResult(
    'PG-09',
    'Invalid or missing provenance triggers INVALID_PROVENANCE',
    'publishable: false, includes INVALID_PROVENANCE',
    `publishable: ${gatePG09.publishable}, reasons: ${gatePG09.blockingReasons.join(',')}`,
    gatePG09.publishable === false && gatePG09.blockingReasons.includes('INVALID_PROVENANCE')
  );

  // PG-10 — invalid publication status transition is blocked
  const invalidStatusRec = { ...assembledPG01, publicationStatus: 'CORRUPTED_STATUS' } as unknown as CanonicalRecommendation;
  const gatePG10 = validateCanonicalRecommendationForPublication(invalidStatusRec, governedPG01);

  addResult(
    'PG-10',
    'Invalid publication status value triggers INVALID_PUBLICATION_STATUS',
    'publishable: false, includes INVALID_PUBLICATION_STATUS',
    `publishable: ${gatePG10.publishable}, reasons: ${gatePG10.blockingReasons.join(',')}`,
    gatePG10.publishable === false && gatePG10.blockingReasons.includes('INVALID_PUBLICATION_STATUS')
  );

  // PG-11 — model-created application-owned values cannot bypass the gate
  const bypassedRec = {
    ...assembledPG01,
    locationResolutionStatus: 'UNRESOLVED',
    coordinates: { lat: 10.0, lng: 20.0 },
  } as unknown as CanonicalRecommendation;
  const gatePG11 = validateCanonicalRecommendationForPublication(bypassedRec);

  addResult(
    'PG-11',
    'Model/adversarial override of application-owned location state cannot bypass publication gate',
    'publishable: false, includes INVALID_LOCATION_STATE',
    `publishable: ${gatePG11.publishable}, reasons: ${gatePG11.blockingReasons.join(',')}`,
    gatePG11.publishable === false && gatePG11.blockingReasons.includes('INVALID_LOCATION_STATE')
  );

  // PG-12 — valid output from Slice 4.4 passes unchanged
  const governedPG12 = createMockGovernedInput();
  const assembledPG12 = assembleCanonicalRecommendation(parsedEd, governedPG12);
  const gatePG12 = validateCanonicalRecommendationForPublication(assembledPG12, governedPG12);

  addResult(
    'PG-12',
    'Valid assembled canonical recommendation from Slice 4.4 passes publication gate unchanged',
    'publishable: true, blockingReasons: empty',
    `publishable: ${gatePG12.publishable}, reasons: ${gatePG12.blockingReasons.join(',')}`,
    gatePG12.publishable === true && gatePG12.blockingReasons.length === 0
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2PublicationGate.test.ts')) {
  runPublicationGateTests();
}
