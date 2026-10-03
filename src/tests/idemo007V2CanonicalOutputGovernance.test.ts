/**
 * IDEMO 007 V2 - Canonical Output Governance & Claim Traceability Tests (Slice 4.4)
 * Tests CO-01 through CO-15 for deterministic output parsing, prohibited field rejection,
 * claim traceability, location claim rules, and application ownership of canonical fields.
 */

import { parseEditorialOutput } from '../lib/idemo007v2/editorialOutputParser';
import {
  buildGovernedSynthesisInput,
} from '../lib/idemo007v2/governedSynthesisInput';
import {
  validateEditorialClaims,
  assembleCanonicalRecommendation,
  executeV2Synthesis,
} from '../lib/idemo007v2/synthesisEngine';
import { promoteCandidate } from '../lib/idemo007v2/candidatePromotionGate';
import { DiscoveredCandidate } from '../lib/idemo007v2/candidateDiscoveryEngine';
import { FactPack, Entity, FactRecord, GovernedSynthesisInput } from '../types/idemo007v2';

export async function runCanonicalOutputGovernanceTests() {
  const results: Array<{ id: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  const addResult = (id: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id, name, expected, actual, passed });
    console.log(`[SLICE 4.4] [${id}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual:   ${actual}`);
    }
  };

  // Helper mock factory for a valid promoted candidate
  const createMockCandidate = (overrides?: Partial<DiscoveredCandidate>): GovernedSynthesisInput => {
    const entity: Entity = {
      id: 'entity-301',
      entityType: 'PLACE',
      canonicalName: 'Žiča Monastery',
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      location: 'Kraljevo',
      coordinates: { lat: 43.696, lng: 20.646 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { researchMode: 'DISCOVERY' },
    };

    const fact1: FactRecord = {
      id: 'fact-301',
      entityId: 'entity-301',
      factKey: 'foundation_century',
      value: 'Early 13th-century Serbian Orthodox monastery founded by Saint Sava and King Stefan the First-Crowned',
      sourceType: 'SEARCH_GROUNDED',
      sourceUrl: 'https://zica.org.rs',
      verifiedAt: new Date().toISOString(),
      volatility: 'STATIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fact2: FactRecord = {
      id: 'fact-302',
      entityId: 'entity-301',
      factKey: 'coronation_site',
      value: 'Historical coronation church of medieval Serbian kings',
      sourceType: 'PRIMARY_OFFICIAL',
      sourceUrl: 'https://zica.org.rs/history',
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
      facts: [fact1, fact2],
      trustedEntities: [],
      sourceSummary: {
        totalFacts: 2,
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
      id: 'entity-301',
      canonicalName: 'Žiča Monastery',
      entityType: 'PLACE',
      subtype: 'Monastery',
      location: 'Kraljevo',
      address: 'Žiča, Kraljevo',
      summaryNote: 'Historic red-facaded monastery near Kraljevo.',
      coordinates: { lat: 43.696, lng: 20.646 },
      mapsPlaceId: 'ChIJ_zica_place_id',
      locationResolutionStatus: 'VERIFIED',
      entity,
      factPack,
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: 'DISCOVERY',
      ...overrides,
    };

    const promoted = promoteCandidate(rawCandidate);
    return buildGovernedSynthesisInput(promoted);
  };

  // CO-01: Valid editorial output passes
  const validOutputJson = JSON.stringify({
    titleEn: 'Žiča Monastery',
    titleSr: 'Манастир Жича',
    subtitleEn: '13th-Century Coronation Site',
    subtitleSr: 'Крунидбено место из 13. века',
    shortDescriptionEn:
      'Žiča Monastery is an early 13th-century Serbian Orthodox monastery. It served as the historical coronation church of medieval Serbian kings.',
    shortDescriptionSr:
      'Манастир Жича је српски православни манастир из раног 13. века. Служио је као историјска крунидбена црква средњевековних српских краљева.',
    usedFactKeys: ['foundation_century', 'coronation_site'],
  });

  const parseCO01 = parseEditorialOutput(validOutputJson);
  const governedCO01 = createMockCandidate();
  const claimsCO01 = parseCO01.success ? validateEditorialClaims(parseCO01.editorialOutput, governedCO01) : null;

  addResult(
    'CO-01',
    'Valid editorial output passes output parser and claim validation',
    'parseSuccess: true, claimsPassed: true',
    `parseSuccess: ${parseCO01.success}, claimsPassed: ${claimsCO01?.passed}`,
    parseCO01.success === true && claimsCO01?.passed === true
  );

  // CO-02: Malformed model output rejected
  const parseCO02A = parseEditorialOutput('INVALID_NON_JSON_STRING');
  const parseCO02B = parseEditorialOutput('');
  const parseCO02C = parseEditorialOutput(12345);

  addResult(
    'CO-02',
    'Malformed model output rejected with MALFORMED_EDITORIAL_OUTPUT or UNSUPPORTED_OUTPUT_STRUCTURE',
    'rejected across all malformed shapes',
    `CO02A: ${parseCO02A.blockingReasons.join(',')}, CO02B: ${parseCO02B.blockingReasons.join(',')}`,
    parseCO02A.success === false &&
      parseCO02B.success === false &&
      parseCO02C.success === false &&
      parseCO02A.blockingReasons.includes('MALFORMED_EDITORIAL_OUTPUT')
  );

  // CO-03: Model attempts to supply coordinates → rejected
  const jsonWithCoords = JSON.stringify({
    shortDescriptionEn: 'A valid description of Žiča Monastery.',
    usedFactKeys: ['foundation_century'],
    coordinates: { lat: 11.11, lng: 22.22 },
  });
  const parseCO03 = parseEditorialOutput(jsonWithCoords);

  addResult(
    'CO-03',
    'Model attempts to supply coordinates triggers PROHIBITED_OUTPUT_FIELD rejection',
    'success: false, blockingReasons includes PROHIBITED_OUTPUT_FIELD',
    `success: ${parseCO03.success}, reasons: ${parseCO03.blockingReasons.join(',')}`,
    parseCO03.success === false && parseCO03.blockingReasons.includes('PROHIBITED_OUTPUT_FIELD')
  );

  // CO-04: Model attempts to supply mapsPlaceId → rejected
  const jsonWithMaps = JSON.stringify({
    shortDescriptionEn: 'A valid description of Žiča Monastery.',
    usedFactKeys: ['foundation_century'],
    mapsPlaceId: 'fake_place_id_123',
  });
  const parseCO04 = parseEditorialOutput(jsonWithMaps);

  addResult(
    'CO-04',
    'Model attempts to supply mapsPlaceId triggers PROHIBITED_OUTPUT_FIELD rejection',
    'success: false, blockingReasons includes PROHIBITED_OUTPUT_FIELD',
    `success: ${parseCO04.success}, reasons: ${parseCO04.blockingReasons.join(',')}`,
    parseCO04.success === false && parseCO04.blockingReasons.includes('PROHIBITED_OUTPUT_FIELD')
  );

  // CO-05: Model changes canonicalName in payload → application canonicalName remains authoritative
  const jsonWithCanonical = JSON.stringify({
    shortDescriptionEn: 'A valid description of Žiča Monastery.',
    usedFactKeys: ['foundation_century'],
    canonicalName: 'Renamed Monastery Model Override',
  });
  const parseCO05 = parseEditorialOutput(jsonWithCanonical);

  // Test assembly canonicalName precedence
  const governedCO05 = createMockCandidate();
  const validEdOutput = parseEditorialOutput(validOutputJson).editorialOutput!;
  const assembledCO05 = assembleCanonicalRecommendation(validEdOutput, governedCO05);

  addResult(
    'CO-05',
    'Model cannot supply canonicalName in output, application canonicalName remains authoritative in assembly',
    'parseRejected: true, assembledTitle: Žiča Monastery',
    `parseRejected: ${!parseCO05.success}, assembledTitle: ${assembledCO05.title}`,
    parseCO05.success === false && assembledCO05.title === 'Žiča Monastery'
  );

  // CO-06: Unsupported historical fact rejected
  const ungroundedHistEd = {
    titleEn: 'Žiča Monastery',
    shortDescriptionEn:
      'Žiča Monastery was constructed by Emperor Galerius in 298 AD as a Roman imperial complex.',
    usedFactKeys: ['foundation_century'],
  };
  const governedCO06 = createMockCandidate();
  const valCO06 = validateEditorialClaims(ungroundedHistEd, governedCO06);

  addResult(
    'CO-06',
    'Unsupported historical fact (Emperor Galerius, 298 AD) rejected by claim validator',
    'passed: false, violations present',
    `passed: ${valCO06.passed}, violations: ${valCO06.violations.join('; ')}`,
    valCO06.passed === false && valCO06.violations.some((v) => v.includes('298') || v.includes('galerius'))
  );

  // CO-07: Unsupported architectural/category claim rejected
  const ungroundedStructEd = {
    titleEn: 'Žiča Palace',
    shortDescriptionEn:
      'Žiča was a sprawling Roman palace complex with a lavish villa, amphitheater, and imperial baths.',
    usedFactKeys: ['foundation_century'],
  };
  const valCO07 = validateEditorialClaims(ungroundedStructEd, governedCO06);

  addResult(
    'CO-07',
    'Unsupported structural claims (palace, villa, amphitheater) rejected by claim validator',
    'passed: false, violations present',
    `passed: ${valCO07.passed}, violations count: ${valCO07.violations.length}`,
    valCO07.passed === false && valCO07.violations.some((v) => v.includes('palace') || v.includes('amphitheater'))
  );

  // CO-08: Unsupported comparative/superlative rejected
  const ungroundedCompEd = {
    titleEn: 'Žiča Monastery',
    shortDescriptionEn:
      'Žiča Monastery is the best-preserved, largest, and most iconic monastery in all of Serbia.',
    usedFactKeys: ['foundation_century'],
  };
  const valCO08 = validateEditorialClaims(ungroundedCompEd, governedCO06);

  addResult(
    'CO-08',
    'Unsupported comparative/superlative claims (best-preserved, largest, iconic) rejected',
    'passed: false, violations present',
    `passed: ${valCO08.passed}, violations count: ${valCO08.violations.length}`,
    valCO08.passed === false && valCO08.violations.some((v) => v.includes('comparative'))
  );

  // CO-09: Supported governed fact expressed editorially passes
  const supportedEd = {
    titleEn: 'Žiča Monastery',
    shortDescriptionEn:
      'Founded in the early 13th century, Žiča Monastery served as the historical coronation church of medieval Serbian kings.',
    usedFactKeys: ['foundation_century', 'coronation_site'],
  };
  const valCO09 = validateEditorialClaims(supportedEd, governedCO06);

  addResult(
    'CO-09',
    'Supported governed facts expressed editorially pass claim validation',
    'passed: true, violations: 0',
    `passed: ${valCO09.passed}, violations: ${valCO09.violations.length}`,
    valCO09.passed === true && valCO09.violations.length === 0
  );

  // CO-10: UNRESOLVED location cannot gain invented address/proximity claim
  const unresolvedGoverned = createMockCandidate();
  unresolvedGoverned.locationResolutionStatus = 'UNRESOLVED';
  unresolvedGoverned.verifiedLocation = null;

  const inventedLocEd = {
    titleEn: 'Žiča Monastery',
    shortDescriptionEn:
      'Žiča Monastery is located 5 minutes from central Kraljevo at exact location Žička Ulica 12.',
    usedFactKeys: ['foundation_century'],
  };
  const valCO10 = validateEditorialClaims(inventedLocEd, unresolvedGoverned);

  addResult(
    'CO-10',
    'UNRESOLVED location gaining invented proximity or address claim is rejected',
    'passed: false, UNRESOLVED location violation detected',
    `passed: ${valCO10.passed}, violations: ${valCO10.violations.join('; ')}`,
    valCO10.passed === false && valCO10.violations.some((v) => v.includes('UNRESOLVED location'))
  );

  // CO-11: VERIFIED location remains application-owned and survives assembly unchanged
  const verifiedGoverned = createMockCandidate();
  const assembledCO11 = assembleCanonicalRecommendation(validEdOutput, verifiedGoverned);

  addResult(
    'CO-11',
    'VERIFIED location and coordinates remain application-owned and survive assembly unchanged',
    'lat: 43.696, lng: 20.646',
    `assembledCoordinates: ${JSON.stringify(assembledCO11.coordinates)}`,
    assembledCO11.coordinates?.lat === 43.696 && assembledCO11.coordinates?.lng === 20.646
  );

  // CO-12: Raw LLM/debug payload absent from canonical recommendation
  const assembledKeys = Object.keys(assembledCO11);
  const prohibitedInCanonical = [
    'rawLlmResponse',
    'previousModelOutput',
    'modelReasoning',
    'debugPayload',
    'entireRawJsonResponse',
  ].filter((k) => assembledKeys.includes(k));

  addResult(
    'CO-12',
    'Raw LLM and debug payloads absent from canonical recommendation object',
    'prohibitedInCanonical: empty',
    `prohibitedInCanonical: ${prohibitedInCanonical.join(',')}`,
    prohibitedInCanonical.length === 0
  );

  // CO-13: Previous model output cannot become evidence for a new claim
  const prevOutputInput = createMockCandidate();
  (prevOutputInput as any).previousModelOutput = 'Historical coronation site built by King Stefan';

  let rejectedCO13 = false;
  try {
    buildGovernedSynthesisInput(prevOutputInput);
  } catch (err: any) {
    rejectedCO13 = err.message.includes('PROHIBITED_RESEARCH_PAYLOAD_DETECTED');
  }

  addResult(
    'CO-13',
    'Previous model output cannot re-enter factual input or serve as claim evidence',
    'rejected: true',
    `rejected: ${rejectedCO13}`,
    rejectedCO13 === true
  );

  // CO-14: Governed FactRecord provenance remains sole factual evidence basis
  const unprovenancedInput = createMockCandidate();
  unprovenancedInput.factPack.facts[0].sourceType = undefined as any;
  delete (unprovenancedInput.factPack.facts[0] as any).sourceUrl;

  let rejectedCO14 = false;
  try {
    buildGovernedSynthesisInput(unprovenancedInput);
  } catch (err: any) {
    rejectedCO14 = err.message.includes('MISSING_PROVENANCE');
  }

  addResult(
    'CO-14',
    'Governed FactRecord provenance remains sole factual evidence basis',
    'rejected: true',
    `rejected: ${rejectedCO14}`,
    rejectedCO14 === true
  );

  // CO-15: Existing Slice 4.1-4.3 behavior remains unchanged
  const governedCO15 = createMockCandidate();
  const assembledCO15 = assembleCanonicalRecommendation(validEdOutput, governedCO15);

  addResult(
    'CO-15',
    'Existing Slice 4.1-4.3 behavior and canonical recommendation shape remain fully preserved',
    'publicationStatus: DRAFT, serviceAreaId: sa-rs-eastern',
    `publicationStatus: ${assembledCO15.publicationStatus}, serviceAreaId: ${assembledCO15.serviceAreaId}`,
    assembledCO15.publicationStatus === 'DRAFT' &&
      assembledCO15.serviceAreaId === 'sa-rs-eastern' &&
      assembledCO15.title === 'Žiča Monastery'
  );

  return results;
}

if (import.meta.url.endsWith('idemo007V2CanonicalOutputGovernance.test.ts')) {
  runCanonicalOutputGovernanceTests();
}
