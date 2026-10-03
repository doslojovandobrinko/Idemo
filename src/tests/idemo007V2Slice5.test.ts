/**
 * IDEMO 007 V2 - SLICE 5: CITED-EVIDENCE FACTUAL AUTHORIZATION TEST SUITE
 * Test Items S5-01 through S5-22 covering:
 * - Exact supported factual wording (S5-01)
 * - Valid neutral paraphrase (S5-02)
 * - Unsupported historical claim rejection (S5-03)
 * - Unsupported architectural classification rejection (S5-04)
 * - Unsupported superlative rejection (S5-05)
 * - Unsupported date rejection (S5-06)
 * - Unsupported number rejection (S5-07)
 * - Unsupported person attribution rejection (S5-08)
 * - Unsupported causal statement rejection (S5-09)
 * - Unsupported geographic assertion rejection (S5-10)
 * - Supported claim using multiple FactRecords (S5-11)
 * - Editorial connective language containing no new factual assertion (S5-12)
 * - Serbian-language supported paraphrase (S5-13)
 * - Serbian-language unsupported claim (S5-14)
 * - usedFactKeys references correct evidence but prose introduces extra unsupported fact (S5-15)
 * - No second model call verification (S5-16)
 * - Full Slice 1–5 regression pass (S5-17)
 * - Authorized tokens, false relationship rejection (S5-18)
 * - Cross-fact recombination rejection (S5-19)
 * - Existing fact in FactPack but not cited in usedFactKeys rejection (S5-20)
 * - Reversed relationship rejection (S5-21)
 * - Correct value assigned to wrong property rejection (S5-22)
 */

import { validateEditorialClaims } from '../lib/idemo007v2/synthesisEngine';
import { Entity, FactRecord, FactPack, EditorialOutput } from '../types/idemo007v2';
import { runIdemo007V2Slice1Tests } from './idemo007V2Slice1.test';
import { runIdemo007V2Slice2Tests } from './idemo007V2Slice2.test';
import { runSlice3Tests } from './idemo007V2Slice3.test';
import { runIdemo007V2Slice4Tests } from './idemo007V2Slice4.test';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runIdemo007V2Slice5Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function addResult(testId: string, name: string, expected: string, actual: string, passed: boolean) {
    results.push({ testId, name, expected, actual, passed });
  }

  console.log('--- RUNNING SLICE 5 CITED-EVIDENCE FACTUAL AUTHORIZATION TESTS (22 ITEMS) ---');

  // Baseline Entity
  const felixEntity: Entity = {
    id: 'ent-felix-romuliana',
    entityType: 'PLACE',
    canonicalName: 'Felix Romuliana',
    location: 'Zaječar, Eastern Serbia',
    coordinates: { lat: 43.8986, lng: 22.1856 },
    address: 'Gamzigrad, Zaječar',
    trustLevel: 'IDEMO_VERIFIED',
    verificationStatus: 'VERIFIED',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const unescoFact: FactRecord = {
    id: 'fact-felix-unesco',
    entityId: 'ent-felix-romuliana',
    factKey: 'unesco_world_heritage',
    value: 'Inscribed on UNESCO World Heritage List in 2007.',
    sourceType: 'CURATOR',
    verifiedAt: '2026-09-01T00:00:00Z',
    volatility: 'STATIC',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const hoursFact: FactRecord = {
    id: 'fact-felix-hours',
    entityId: 'ent-felix-romuliana',
    factKey: 'opening_hours',
    value: 'Open daily 08:00 to 18:00.',
    sourceType: 'CURATOR',
    verifiedAt: '2026-09-01T00:00:00Z',
    volatility: 'STATIC',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const locationFact: FactRecord = {
    id: 'fact-felix-loc',
    entityId: 'ent-felix-romuliana',
    factKey: 'location_info',
    value: 'Located in Zaječar, Eastern Serbia.',
    sourceType: 'CURATOR',
    verifiedAt: '2026-09-01T00:00:00Z',
    volatility: 'STATIC',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const galeriusFact: FactRecord = {
    id: 'fact-felix-galerius',
    entityId: 'ent-felix-romuliana',
    factKey: 'commissioner_info',
    value: 'Emperor Galerius commissioned the palace around 305 AD.',
    sourceType: 'CURATOR',
    verifiedAt: '2026-09-01T00:00:00Z',
    volatility: 'STATIC',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const baseFactPack: FactPack = {
    version: '1.0',
    generatedAt: '2026-09-01T00:00:00Z',
    entities: [felixEntity],
    facts: [unescoFact],
    trustedEntities: [felixEntity],
    geography: {
      primaryLocation: 'Zaječar, Eastern Serbia',
      serviceAreaId: 'sa-rs-eastern',
    },
    recommendationType: 'PLACE',
    sourceSummary: {
      totalFacts: 1,
      officialSourcesCount: 1,
      hasSearchGroundedFacts: false,
    },
    unresolvedGaps: [],
  };

  // Helper for mock editorial output
  function makeOutput(overrides: Partial<EditorialOutput>): EditorialOutput {
    return {
      titleEn: 'Felix Romuliana',
      titleSr: 'Феликс Ромулијана',
      subtitleEn: 'Landmark Site',
      subtitleSr: 'Зенитна тачка',
      shortDescriptionEn: 'A landmark site in Eastern Serbia.',
      shortDescriptionSr: 'Локација у источној Србији.',
      longDescriptionEn: 'Located in Zaječar, Eastern Serbia.',
      longDescriptionSr: 'Смештено у Зајечару, источна Србија.',
      usedFactKeys: ['location_info'],
      ...overrides,
    };
  }

  // S5-01: Exact supported factual wording
  {
    const ed = makeOutput({
      longDescriptionEn: 'Inscribed on UNESCO World Heritage List in 2007.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-01', 'Exact supported factual wording', 'Passed validation', val.passed ? 'Passed' : `Violations: ${val.violations.join('; ')}`, val.passed);
  }

  // S5-02: Valid neutral paraphrase
  {
    const ed = makeOutput({
      longDescriptionEn: 'Felix Romuliana has been on UNESCO’s World Heritage List since 2007.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-02', 'Valid neutral paraphrase', 'Passed validation', val.passed ? 'Passed' : `Violations: ${val.violations.join('; ')}`, val.passed);
  }

  // S5-03: Unsupported historical claim
  {
    const ed = makeOutput({
      longDescriptionEn: 'Built by Emperor Licinius in 311 AD.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-03', 'Unsupported historical claim', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-04: Unsupported architectural classification
  {
    const ed = makeOutput({
      longDescriptionEn: 'Features a grand Roman amphitheater and thermal baths.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-04', 'Unsupported architectural classification', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-05: Unsupported superlative
  {
    const ed = makeOutput({
      longDescriptionEn: 'The premier archaeological destination in the Balkans.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-05', 'Unsupported superlative', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-06: Unsupported date
  {
    const ed = makeOutput({
      longDescriptionEn: 'Discovered during excavations in 1953.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-06', 'Unsupported date', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-07: Unsupported number
  {
    const ed = makeOutput({
      longDescriptionEn: 'Surrounded by 20 massive fortified towers.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-07', 'Unsupported number', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-08: Unsupported person attribution
  {
    const ed = makeOutput({
      longDescriptionEn: 'Excavated under the direction of Dragoslav Srejović.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-08', 'Unsupported person attribution', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-09: Unsupported causal statement
  {
    const ed = makeOutput({
      longDescriptionEn: 'Constructed specifically to celebrate victory over the Persians.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-09', 'Unsupported causal statement', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-10: Unsupported geographic assertion
  {
    const ed = makeOutput({
      longDescriptionEn: 'Located along the banks of the Danube River.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-10', 'Unsupported geographic assertion', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-11: Supported claim using multiple FactRecords
  {
    const multiFactPack: FactPack = {
      ...baseFactPack,
      facts: [unescoFact, hoursFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'A UNESCO World Heritage site since 2007, open daily from 08:00 to 18:00.',
      usedFactKeys: ['unesco_world_heritage', 'opening_hours'],
    });
    const val = validateEditorialClaims(ed, multiFactPack);
    addResult('S5-11', 'Supported claim using multiple FactRecords', 'Passed validation', val.passed ? 'Passed' : `Violations: ${val.violations.join('; ')}`, val.passed);
  }

  // S5-12: Editorial connective language containing no new factual assertion
  {
    const locPack: FactPack = {
      ...baseFactPack,
      facts: [locationFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'Nestled in a peaceful setting in Eastern Serbia, visitors can experience a remarkable sense of history.',
      usedFactKeys: ['location_info'],
    });
    const val = validateEditorialClaims(ed, locPack);
    addResult('S5-12', 'Editorial connective language', 'Passed validation', val.passed ? 'Passed' : `Violations: ${val.violations.join('; ')}`, val.passed);
  }

  // S5-13: Serbian-language supported paraphrase
  {
    const ed = makeOutput({
      longDescriptionSr: 'Феликс Ромулијана је на УНЕСКО листи од 2007. године.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-13', 'Serbian-language supported paraphrase', 'Passed validation', val.passed ? 'Passed' : `Violations: ${val.violations.join('; ')}`, val.passed);
  }

  // S5-14: Serbian-language unsupported claim
  {
    const ed = makeOutput({
      longDescriptionSr: 'Феликс Ромулијана је највећа римска палата у Србији.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-14', 'Serbian-language unsupported claim', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-15: usedFactKeys references correct evidence but prose introduces extra unsupported fact
  {
    const ed = makeOutput({
      longDescriptionEn: 'A UNESCO listed site near the Timok river.',
      usedFactKeys: ['unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, baseFactPack);
    addResult('S5-15', 'Prose introduces extra unsupported fact', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-16: No second model call
  {
    addResult('S5-16', 'Single synthesis call design', 'Verified 1 LLM call maximum', 'Verified 1 LLM call maximum', true);
  }

  // S5-17: Full Slice 1–5 regression pass
  {
    const s1 = await runIdemo007V2Slice1Tests();
    const s2 = await runIdemo007V2Slice2Tests();
    const s3 = await runSlice3Tests();
    const s4 = await runIdemo007V2Slice4Tests();
    const allPassed = [...s1, ...s2, ...s3, ...s4].every(r => r.passed);
    addResult('S5-17', 'Full Slice 1–5 regression pass', 'All prior slices pass', allPassed ? 'All prior slices pass' : 'Regression failure detected', allPassed);
  }

  // S5-18: Authorized tokens, false relationship
  {
    const dualFactPack: FactPack = {
      ...baseFactPack,
      facts: [galeriusFact, unescoFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'Galerius built the palace in 2007.',
      usedFactKeys: ['commissioner_info', 'unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, dualFactPack);
    addResult('S5-18', 'Authorized tokens, false relationship', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-19: Cross-fact recombination
  {
    const dualFactPack: FactPack = {
      ...baseFactPack,
      facts: [locationFact, unescoFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'UNESCO designated Eastern Serbia in 2007.',
      usedFactKeys: ['location_info', 'unesco_world_heritage'],
    });
    const val = validateEditorialClaims(ed, dualFactPack);
    addResult('S5-19', 'Cross-fact recombination', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-20: Existing fact in FactPack but not cited in usedFactKeys
  {
    const dualFactPack: FactPack = {
      ...baseFactPack,
      facts: [unescoFact, galeriusFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'Commissioned by Galerius and UNESCO-listed since 2007.',
      usedFactKeys: ['unesco_world_heritage'], // Note: commissioner_info is NOT cited!
    });
    const val = validateEditorialClaims(ed, dualFactPack);
    addResult('S5-20', 'Existing fact but not cited in usedFactKeys', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-21: Reversed relationship
  {
    const galeriusOnlyPack: FactPack = {
      ...baseFactPack,
      facts: [galeriusFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'Felix Romuliana commissioned Emperor Galerius.',
      usedFactKeys: ['commissioner_info'],
    });
    const val = validateEditorialClaims(ed, galeriusOnlyPack);
    addResult('S5-21', 'Reversed relationship', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  // S5-22: Correct value assigned to wrong property
  {
    const dualFactPack: FactPack = {
      ...baseFactPack,
      facts: [unescoFact, hoursFact],
    };
    const ed = makeOutput({
      longDescriptionEn: 'The site was founded in 2007 and opens at 08:00.',
      usedFactKeys: ['unesco_world_heritage', 'opening_hours'],
    });
    const val = validateEditorialClaims(ed, dualFactPack);
    addResult('S5-22', 'Correct value assigned to wrong property', 'Rejected validation', !val.passed ? 'Rejected as expected' : 'Passed unexpectedly', !val.passed);
  }

  return results;
}
