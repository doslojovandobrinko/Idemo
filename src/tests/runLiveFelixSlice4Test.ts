/**
 * IDEMO 007 V2 - Slice 4.1 Live Controlled Acceptance Test: Felix Romuliana
 * 
 * Strict Evidence Boundary Test:
 * FactPack contains ONLY:
 * 1. unesco_world_heritage: "UNESCO World Heritage Site since 2007"
 * 2. opening_hours: "Daily 08:00 - 17:00"
 * 3. Primary Entity: Felix Romuliana (Zaječar, coordinates: 43.8986, 22.1856)
 * 4. Curator Emphasis: "Roman imperial history and UNESCO archaeological significance."
 * 
 * Prohibited memory additions:
 * - Galerius, Romula, 3rd/4th century, Magura, tumuli, apotheosis, mosaics, baths, basilicas, fortifications.
 * - Invented entry fees, invented media URLs, invented curator notes, invented mood orbit.
 */

import { executeV2Synthesis } from '../lib/idemo007v2/synthesisEngine';
import { buildFactPack } from '../lib/idemo007v2/factPackBuilder';
import { Entity, FactRecord, FactPack } from '../types/idemo007v2';

async function runLiveFelixAcceptance() {
  console.log('================================================================');
  console.log('IDEMO 007 V2 — SLICE 4.1 LIVE ACCEPTANCE TEST: FELIX ROMULIANA');
  console.log('================================================================\n');

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
    value: 'UNESCO World Heritage Site since 2007',
    sourceType: 'PRIMARY_OFFICIAL',
    sourceUrl: 'https://whc.unesco.org/en/list/1253',
    verifiedAt: '2026-09-20T00:00:00Z',
    volatility: 'STATIC',
    createdAt: '2026-09-20T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  };

  const hoursFact: FactRecord = {
    id: 'fact-felix-hours',
    entityId: 'ent-felix-romuliana',
    factKey: 'opening_hours',
    value: 'Daily 08:00 - 17:00',
    sourceType: 'PRIMARY_OFFICIAL',
    verifiedAt: '2026-09-20T00:00:00Z',
    volatility: 'HIGH',
    createdAt: '2026-09-20T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  };

  const factPack: FactPack = buildFactPack({
    recommendationType: 'PLACE',
    entities: [felixEntity],
    facts: [unescoFact, hoursFact],
    curatorInput: {
      emphasis: 'Roman imperial history and UNESCO archaeological significance.',
    },
  });

  console.log('CONTROLLED FACTPACK EVIDENCE:');
  console.log(`- Entity: "${felixEntity.canonicalName}" (${felixEntity.location})`);
  console.log(`- Facts supplied: ${factPack.facts.length}`);
  for (const f of factPack.facts) {
    console.log(`  * [${f.factKey}] ${f.value} (Source: ${f.sourceType})`);
  }
  console.log(`- Curator emphasis: "Roman imperial history and UNESCO archaeological significance."\n`);

  console.log('Executing single V2 synthesis call with structured output (responseSchema)...');
  const result = await executeV2Synthesis({
    factPack,
    // Note: No curator notes supplied -> must result in undefined curatorNote
    // Note: No media supplied -> must result in empty string image
  });

  console.log('\n--- SYNTHESIS TELEMETRY ---');
  console.log(`Model: ${result.telemetry.model}`);
  console.log(`Duration: ${result.telemetry.durationMs}ms`);
  console.log(`Input Tokens: ${result.telemetry.inputTokens}`);
  console.log(`Output Tokens: ${result.telemetry.outputTokens}`);
  console.log(`Total Tokens: ${result.telemetry.totalTokens}`);

  console.log('\n--- GENERATED EDITORIAL TEXT ---');
  console.log(`Title (EN): "${result.editorialOutput.titleEn}"`);
  console.log(`Title (SR): "${result.editorialOutput.titleSr}"`);
  console.log(`Subtitle (EN): "${result.editorialOutput.subtitleEn}"`);
  console.log(`Subtitle (SR): "${result.editorialOutput.subtitleSr}"`);
  console.log(`Short Overview (EN): "${result.editorialOutput.shortDescriptionEn}"`);
  console.log(`Short Overview (SR): "${result.editorialOutput.shortDescriptionSr}"`);
  console.log(`Long Story (EN): "${result.editorialOutput.longDescriptionEn}"`);
  console.log(`Long Story (SR): "${result.editorialOutput.longDescriptionSr}"`);
  console.log(`Cited Fact Keys: ${JSON.stringify(result.editorialOutput.usedFactKeys)}`);

  console.log('\n--- CLAIMS VALIDATION RESULT ---');
  console.log(`Passed: ${result.claimsValidation.passed}`);
  console.log(`Violations: ${result.claimsValidation.violations.length > 0 ? result.claimsValidation.violations.join(', ') : 'NONE'}`);

  console.log('\n--- CANONICAL RECOMMENDATION APPLICATION-OWNED FIELDS ---');
  console.log(`Image: "${result.recommendation.image}" (Expected: "")`);
  console.log(`Coordinates: lat=${result.recommendation.coordinates?.lat}, lng=${result.recommendation.coordinates?.lng} (Expected: 43.8986, 22.1856)`);
  console.log(`Curator Note: ${result.recommendation.curatorNote === undefined ? 'undefined (CORRECT)' : `"${result.recommendation.curatorNote}"`}`);
  console.log(`Practical Info Opening Hours: "${result.recommendation.practicalInfo?.opening_hours}" (Expected: "Daily 08:00 - 17:00")`);
  console.log(`Practical Info Admission Fee: ${result.recommendation.practicalInfo?.admission_fee === undefined ? 'undefined (CORRECT - NOT INVENTED)' : result.recommendation.practicalInfo?.admission_fee}`);
  console.log(`Mood Orbit: X=${result.recommendation.coordinateX}, Y=${result.recommendation.coordinateY}, Energy=${result.recommendation.energy}`);
  console.log(`German Translation: "${result.recommendation.translations?.de?.shortDescription}" (Expected: PENDING LOCALIZATION)`);

  // Prohibited terms verification
  const prohibitedTerms = [
    'galerius',
    'romula',
    '3rd century',
    '4th century',
    'fourth century',
    'third century',
    'magura',
    'tumuli',
    'apotheosis',
    'mosaic',
    'basilica',
    'baths',
    'temple',
    'fortification',
    'towers',
  ];

  const fullText = `${result.editorialOutput.titleEn} ${result.editorialOutput.subtitleEn} ${result.editorialOutput.shortDescriptionEn} ${result.editorialOutput.longDescriptionEn}`.toLowerCase();
  const detectedViolations = prohibitedTerms.filter(term => fullText.includes(term));

  console.log('\n--- PROHIBITED MODEL MEMORY TERMS AUDIT ---');
  if (detectedViolations.length === 0) {
    console.log('✓ PASS: ZERO prohibited model memory terms found in generated English text.');
  } else {
    console.error(`✗ FAIL: Prohibited terms found: ${detectedViolations.join(', ')}`);
  }

  // Factual Assertions Mapping
  console.log('\n--- FACTUAL ASSERTIONS IN ENGLISH TEXT MAPPING ---');
  console.log('1. Entity Name & Location: "Felix Romuliana", "Eastern Serbia / Zaječar" -> Mapped to: CANONICAL ENTITY');
  console.log('2. UNESCO World Heritage Status: -> Mapped to: FactKey [unesco_world_heritage]');
  console.log('3. Roman imperial / archaeological significance: -> Mapped to: CURATOR EMPHASIS');
  console.log('4. Visiting / Opening Hours: -> Mapped to: FactKey [opening_hours]');
  console.log('5. Editorial phrasing / flow: -> Understated luxury connective prose');

  const overallPass = result.claimsValidation.passed &&
    detectedViolations.length === 0 &&
    result.recommendation.image === '' &&
    result.recommendation.practicalInfo?.admission_fee === undefined &&
    result.recommendation.curatorNote === undefined;

  console.log('\n================================================================');
  console.log(`LIVE ACCEPTANCE VERDICT: ${overallPass ? 'PASS' : 'FAIL'}`);
  console.log('================================================================');

  if (!overallPass) {
    process.exit(1);
  }
}

runLiveFelixAcceptance().catch(err => {
  console.error('Fatal live acceptance error:', err);
  process.exit(1);
});
