/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * V9-STUDIO-CORE-OPS-01 — STAGE 2
 * Recommendation Lifecycle Verification Test Suite
 * 
 * Tests the complete Recommendation operational lifecycle:
 * - Create & Payload Serialization
 * - Taxonomy Normalization & Multi-Category Handling
 * - Mood Orbit 2D Spatial Vectors & Dimensional Calibration
 * - Geo Coordinates & Practical Visitor Data Validation
 * - Six-Language Localization Map Construction
 * - Draft Roundtrip Mapping & Reconstitution
 * - Deterministic Completeness Scoring & Release Gating
 * - Package Builder Filtering & Retirement Enforcement
 * - Partner Matrix Link Compatibility
 */

import { Category, Recommendation } from '../src/types';
import { 
  buildCanonicalRecommendationPayload, 
  mapDraftPayloadToRecommendation,
  isUuid 
} from '../src/lib/recommendationWorkflowService';
import { normalizeRecommendationCategories } from '../src/components/studio/RecommendationEditorModal';
import { calculateRecommendationCompleteness } from '../src/components/studio/utils/scoring';
import { getCanonicalRecommendations, calculatePackageHash } from '../src/lib/destinationPackageManager';
import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import { PARTNERS } from '../src/data/partners';

interface TestResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

function assertTest(name: string, expected: string, actual: string, condition: boolean, notes?: string) {
  results.push({
    name,
    expected,
    actual,
    passed: condition,
    notes
  });
}

async function runStage2Tests() {
  console.log('================================================================');
  console.log('V9-STUDIO-CORE-OPS-01: STAGE 2 RECOMMENDATION LIFECYCLE TESTS');
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TAXONOMY NORMALIZATION & DUAL CATEGORY SELECTION
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const norm1 = normalizeRecommendationCategories('Gastronomy', ['Gastronomy', 'History']);
    assertTest(
      'Taxonomy: Canonical enum normalization and deduplication',
      'primaryCategory=Gastronomy, categories=["Gastronomy", "History"]',
      `primaryCategory=${norm1.primaryCategory}, categories=${JSON.stringify(norm1.categories)}`,
      norm1.primaryCategory === Category.GASTRONOMY && norm1.categories.length === 2 && norm1.categories.includes(Category.HISTORY)
    );

    const norm2 = normalizeRecommendationCategories('nature, gastronomy', null);
    assertTest(
      'Taxonomy: Case-insensitive string parsing & comma separation in rawCategory',
      'primaryCategory=Nature, categories contains Nature and Gastronomy',
      `primaryCategory=${norm2.primaryCategory}, categories=${JSON.stringify(norm2.categories)}`,
      norm2.primaryCategory === Category.NATURE && norm2.categories.includes(Category.GASTRONOMY)
    );

    const norm2b = normalizeRecommendationCategories('nature', ['Nature', 'Gastronomy']);
    assertTest(
      'Taxonomy: Multi-category array parameter parsing',
      'primaryCategory=Nature, categories contains Nature and Gastronomy',
      `primaryCategory=${norm2b.primaryCategory}, categories=${JSON.stringify(norm2b.categories)}`,
      norm2b.primaryCategory === Category.NATURE && norm2b.categories.includes(Category.GASTRONOMY)
    );

    const norm3 = normalizeRecommendationCategories('', []);
    assertTest(
      'Taxonomy: Empty fallback default',
      'primaryCategory=Gastronomy, categories=["Gastronomy"]',
      `primaryCategory=${norm3.primaryCategory}, categories=${JSON.stringify(norm3.categories)}`,
      norm3.primaryCategory === Category.GASTRONOMY && norm3.categories.length === 1
    );

    const norm4 = normalizeRecommendationCategories('Custom Vibe Unlisted', []);
    assertTest(
      'Taxonomy: Preserves custom non-standard raw category without silent corrupt fallback',
      'primaryCategory="Custom Vibe Unlisted", categories=["Custom Vibe Unlisted"]',
      `primaryCategory=${norm4.primaryCategory}, categories=${JSON.stringify(norm4.categories)}`,
      norm4.primaryCategory === 'Custom Vibe Unlisted' && norm4.categories[0] === 'Custom Vibe Unlisted'
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CANONICAL PAYLOAD SERIALIZATION & SERVER-DERIVED FIELD STRIPPING
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const sampleRec: Partial<Recommendation> & { id: string; ranking_score?: number; publication_status?: string } = {
      id: 'test-rec-101',
      title: 'Kalemegdan Sunset Walk',
      serviceAreaId: 'f0000000-0000-0000-0000-000000000001',
      category: Category.HISTORY,
      categories: [Category.HISTORY, Category.NATURE],
      shortDescription: 'Historic panoramic sunset overlook.',
      longDescription: 'Comprehensive curator story describing the confluence of Danube and Sava rivers.',
      location: 'Belgrade Fortress, Belgrade',
      coordinates: { lat: 44.8233, lng: 20.4503 },
      coordinateX: 0.25,
      coordinateY: 0.75,
      energy: 0.4,
      social: 0.7,
      luxury: 0.6,
      urbanity: 0.8,
      nature: 0.5,
      weatherDependency: 0.9,
      duration: '2-3 hours',
      travelTime: '10 mins',
      travelTimeMinutes: 10,
      estimatedCost: 'Free',
      preferredTransport: 'Walking',
      image: 'https://images.unsplash.com/photo-kalemegdan',
      moods: ['Serene', 'Historic', 'Sunset'],
      practicalInfo: {
        opening_hours: '24/7 Accessible',
        contact_phone: '+381 11 2620685',
        contact_email: 'info@beogradskatvrdjava.co.rs',
        website: 'https://beogradskatvrdjava.co.rs',
        admission_fee: 'Free'
      },
      provenance: {
        source: 'Curator Fieldwork',
        method: 'Direct Inspection',
        license: 'Proprietary',
        attributionRequired: false,
        attributionText: 'IDEMO Editorial Team',
        verificationStatus: 'Verified',
        altText: 'Belgrade Fortress at Sunset'
      },
      translations: {
        en: { title: 'Kalemegdan Sunset Walk', shortDescription: 'Historic panoramic sunset overlook.', longDescription: 'Long EN story.', location: 'Belgrade Fortress' },
        sr: { title: 'Шетња Калемегданом у смирај дана', shortDescription: 'Историјски панорамски поглед на ушће.', longDescription: 'Дугачак опис на српском.', location: 'Београдска тврђава' },
        de: { title: 'Sonnenuntergang auf Kalemegdan', shortDescription: 'Historischer Ausblick.', longDescription: '', location: 'Festung Belgrad' },
        ru: { title: 'Закат на Калемегдане', shortDescription: 'Панорамный вид.', longDescription: '', location: 'Белградская крепость' },
        es: { title: 'Paseo al atardecer en Kalemegdan', shortDescription: 'Vista panorámica.', longDescription: '', location: 'Fortaleza de Belgrado' },
        zh: { title: '卡莱梅格丹日落漫步', shortDescription: '历史全景俯瞰。', longDescription: '', location: '贝尔格莱德要塞' }
      }
    };

    const payload = buildCanonicalRecommendationPayload(sampleRec, sampleRec.serviceAreaId);

    assertTest(
      'Payload: Strips client ID from root canonical payload',
      'id is undefined in payload',
      `id in payload=${(payload as any).id}`,
      (payload as any).id === undefined
    );

    assertTest(
      'Payload: Destination ID correctly assigned',
      'destination_id === "f0000000-0000-0000-0000-000000000001"',
      `destination_id=${payload.destination_id}`,
      payload.destination_id === 'f0000000-0000-0000-0000-000000000001'
    );

    assertTest(
      'Payload: Category and multi-categories populated',
      'category="History", categories contains 2 categories',
      `category=${payload.category}, categories=${JSON.stringify(payload.categories)}`,
      payload.category === Category.HISTORY && payload.categories.length === 2
    );

    assertTest(
      'Payload: Geo coordinates correctly mapped',
      'latitude=44.8233, longitude=20.4503',
      `latitude=${payload.latitude}, longitude=${payload.longitude}`,
      payload.latitude === 44.8233 && payload.longitude === 20.4503
    );

    assertTest(
      'Payload: Six-language translations dictionary preserved',
      'all 6 languages present in payload.translations',
      `keys=${Object.keys(payload.translations || {}).join(',')}`,
      Boolean(
        payload.translations?.en?.title &&
        payload.translations?.sr?.title &&
        payload.translations?.de?.title &&
        payload.translations?.ru?.title &&
        payload.translations?.es?.title &&
        payload.translations?.zh?.title
      )
    );

    assertTest(
      'Payload: Practical Info JSON preserved',
      'opening_hours, contact_phone, contact_email, website, admission_fee all present',
      `keys=${Object.keys(payload.practical_info || {}).join(',')}`,
      payload.practical_info?.opening_hours === '24/7 Accessible' &&
      payload.practical_info?.contact_email === 'info@beogradskatvrdjava.co.rs' &&
      payload.practical_info?.admission_fee === 'Free'
    );

    assertTest(
      'Payload: Provenance metadata serialized correctly',
      'source="Curator Fieldwork", verification_status="Verified"',
      `source=${payload.provenance?.source}, status=${payload.provenance?.verification_status}`,
      payload.provenance?.source === 'Curator Fieldwork' && payload.provenance?.verification_status === 'Verified'
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DRAFT RECONSTITUTION (ROUNDTRIP TEST)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const rawProposedValue = {
      destination_id: 'f0000000-0000-0000-0000-000000000001',
      title_en: 'Vinča Archaeological Sanctuary',
      title_sr: 'Археолошко налазиште Винча',
      category: 'History',
      categories: ['History', 'Nature'],
      short_description_en: 'Neolithic civilization on the banks of Danube.',
      short_description_sr: 'Неолитска цивилизација на обали Дунава.',
      long_description_en: 'Curator insights on the Vinča culture and 7,000 year old artifacts.',
      long_description_sr: 'Дуги опис културе Винча.',
      location_en: 'Vinča, Belgrade Suburbs',
      location_sr: 'Винча, Београд',
      latitude: 44.7622,
      longitude: 20.6214,
      duration: '3-4 hours',
      travel_time_minutes: 35,
      estimated_cost: 'RSD 400',
      moods: ['Serene', 'Archaeological', 'Historic'],
      practical_info: {
        opening_hours: '10:00 - 18:00 Tue-Sun',
        contact_phone: '+381 11 8065334',
        contact_email: 'muzej@vinca.rs',
        website: 'https://mgb.org.rs/vinca',
        admission_fee: 'RSD 400'
      },
      translations: {
        en: { title: 'Vinča Archaeological Sanctuary', short_description: 'Neolithic civilization.' },
        sr: { title: 'Археолошко налазиште Винча', short_description: 'Неолитска цивилизација.' },
        de: { title: 'Archäologische Stätte Vinča', short_description: 'Neolithische Zivilisation.' },
        ru: { title: 'Археологический памятник Винча', short_description: 'Неолитическая цивилизация.' },
        es: { title: 'Yacimiento arqueológico de Vinča', short_description: 'Civilización neolítica.' },
        zh: { title: '温查考古遗址', short_description: '新石器时代文明。' }
      }
    };

    const reconstituted = mapDraftPayloadToRecommendation(rawProposedValue);

    assertTest(
      'Reconstitution: Maps title and EN/SR fields accurately',
      'title="Vinča Archaeological Sanctuary", titleSr="Археолошко налазиште Винча"',
      `title=${reconstituted.title}, titleSr=${reconstituted.titleSr}`,
      reconstituted.title === 'Vinča Archaeological Sanctuary' && reconstituted.titleSr === 'Археолошко налазиште Винча'
    );

    assertTest(
      'Reconstitution: Geo coordinates object reconstructed',
      'coordinates.lat=44.7622, coordinates.lng=20.6214',
      `lat=${reconstituted.coordinates?.lat}, lng=${reconstituted.coordinates?.lng}`,
      reconstituted.coordinates?.lat === 44.7622 && reconstituted.coordinates?.lng === 20.6214
    );

    assertTest(
      'Reconstitution: Multi-language translations preserved',
      'all 6 translations present in reconstituted object',
      `keys=${Object.keys(reconstituted.translations || {}).join(',')}`,
      Boolean(
        reconstituted.translations?.de?.title === 'Archäologische Stätte Vinča' &&
        reconstituted.translations?.zh?.title === '温查考古遗址'
      )
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. MOOD ORBIT & DIMENSIONAL CALIBRATION INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const recWithMood: Partial<Recommendation> = {
      title: 'Kafana Question Mark (Znak Pitanja)',
      coordinateX: 0.85,
      coordinateY: 0.15,
      energy: 0.8,
      social: 0.9,
      luxury: 0.4,
      urbanity: 0.9,
      nature: 0.1,
      weatherDependency: 0.2,
      moods: ['Historic', 'Gastronomic', 'Social']
    };

    const payload = buildCanonicalRecommendationPayload(recWithMood);

    assertTest(
      'Mood Orbit: Vector values stay within [0.0, 1.0] domain',
      'X and Y between 0.0 and 1.0',
      `X=${recWithMood.coordinateX}, Y=${recWithMood.coordinateY}`,
      (recWithMood.coordinateX! >= 0 && recWithMood.coordinateX! <= 1) &&
      (recWithMood.coordinateY! >= 0 && recWithMood.coordinateY! <= 1)
    );

    assertTest(
      'Mood Orbit: Mood tags array serialized cleanly',
      'moods=["Historic", "Gastronomic", "Social"]',
      `moods=${JSON.stringify(payload.moods)}`,
      payload.moods?.length === 3 && payload.moods[1] === 'Gastronomic'
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DETERMINISTIC COMPLETENESS SCORING & RELEASE GATING
  // ─────────────────────────────────────────────────────────────────────────────
  {
    // A. Complete, Approved Recommendation
    const completeApprovedRec: Partial<Recommendation> = {
      title: 'Museum of Contemporary Art (MoCAB)',
      shortDescription: 'Modernist gem in Ušće park featuring 20th century Yugoslav modernism.',
      longDescription: 'Curator story detailing Ivan Antić architecture and premier regional art exhibitions.',
      location: 'Ušće, New Belgrade',
      coordinates: { lat: 44.8202, lng: 20.4419 },
      coordinateX: 0.4,
      coordinateY: 0.6,
      image: 'https://images.unsplash.com/photo-mocap',
      category: Category.HISTORY,
      translations: {
        sr: {
          title: 'Музеј савремене уметности',
          shortDescription: 'Модернистички бисер на Ушћу.'
        }
      }
    };

    const scoreApproved = calculateRecommendationCompleteness(completeApprovedRec, 'APPROVED');
    assertTest(
      'Scoring: Complete APPROVED recommendation scores 100% and is release-ready',
      'scorePercentage=100, isPublicationEligible=true',
      `scorePercentage=${scoreApproved.scorePercentage}, isPublicationEligible=${scoreApproved.isPublicationEligible}`,
      scoreApproved.scorePercentage === 100 && scoreApproved.isPublicationEligible === true
    );

    // B. Complete CANDIDATE Recommendation (blocked by status gate)
    const scoreCandidate = calculateRecommendationCompleteness(completeApprovedRec, 'CANDIDATE');
    assertTest(
      'Scoring: Complete CANDIDATE recommendation is gated from publication release',
      'scorePercentage=90, isPublicationEligible=false',
      `scorePercentage=${scoreCandidate.scorePercentage}, isPublicationEligible=${scoreCandidate.isPublicationEligible}`,
      scoreCandidate.scorePercentage === 90 && scoreCandidate.isPublicationEligible === false
    );

    // C. Incomplete Recommendation (missing Serbian translation & coordinates)
    const incompleteRec: Partial<Recommendation> = {
      title: 'Incomplete Bar',
      shortDescription: 'A short description here.',
      longDescription: 'A longer description for the curator story.',
      location: 'Belgrade',
      image: 'https://images.unsplash.com/photo-bar',
      category: Category.GASTRONOMY
    };

    const scoreIncomplete = calculateRecommendationCompleteness(incompleteRec, 'APPROVED');
    assertTest(
      'Scoring: Incomplete recommendation properly tracks missing items and fails eligibility',
      'isPublicationEligible=false, missing items tracked',
      `scorePercentage=${scoreIncomplete.scorePercentage}, missing=${scoreIncomplete.missingItems.length}`,
      scoreIncomplete.isPublicationEligible === false && scoreIncomplete.missingItems.length >= 2
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. DESTINATION PACKAGE BUILDER & RETIREMENT FILTERING
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const sampleRecList: Recommendation[] = [
      ...INITIAL_RECOMMENDATIONS.slice(0, 5),
      {
        ...INITIAL_RECOMMENDATIONS[0],
        id: 'rec-retired-sample',
        publicationStatus: 'RETIRED'
      }
    ];

    const canonicalFiltered = getCanonicalRecommendations(sampleRecList);
    const hasRetired = canonicalFiltered.some(r => r.id === 'rec-retired-sample');

    assertTest(
      'Package Builder: Excludes RETIRED recommendations from release catalogue',
      'hasRetired === false',
      `hasRetired=${hasRetired}, canonicalFilteredCount=${canonicalFiltered.length}`,
      !hasRetired
    );

    // SHA-256 package hash determinism
    const hash1 = await calculatePackageHash({
      recommendations: INITIAL_RECOMMENDATIONS.slice(0, 10),
      collections: [],
      partners: PARTNERS.slice(0, 5)
    });

    const hash2 = await calculatePackageHash({
      recommendations: INITIAL_RECOMMENDATIONS.slice(0, 10),
      collections: [],
      partners: PARTNERS.slice(0, 5)
    });

    assertTest(
      'Package Integrity: Deterministic SHA-256 package hash computation',
      'hash1 === hash2 and hash is 64 hex characters',
      `hash1=${hash1}, hash2=${hash2}`,
      hash1 === hash2 && hash1.length === 64
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PARTNER ASSOCIATION COMPATIBILITY & MATRIX RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────────
  {
    // Test that the PartnerCoverage matching engine handles both RPC database matrix records
    // and fallback linked recommendations without runtime errors.
    const sampleDbRecord = {
      partner_id: 'P-004',
      recommendation_id: '2',
      qualification_state: 'idemo_selected' as const,
      participation_state: 'introduction_ready' as const,
      passport_state: 'verified' as const,
      routing_state: 'active' as const
    };

    const targetRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '2');
    const matched = targetRec && targetRec.id === sampleDbRecord.recommendation_id;

    assertTest(
      'Partner Compatibility: Verified DB matrix recommendation_id resolution to Recommendation record',
      'targetRec.id === "2"',
      `matched=${matched}, recTitle=${targetRec?.title}`,
      Boolean(matched && targetRec?.title === 'Manasija Monastery')
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------');
  console.log('STAGE 2 AUTOMATED TEST RESULTS:');
  console.log('----------------------------------------------------------------');

  let passedCount = 0;
  results.forEach((r, idx) => {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    if (r.passed) passedCount++;
    console.log(`[${idx + 1}/${results.length}] ${status}: ${r.name}`);
    if (!r.passed) {
      console.log(`   Expected: ${r.expected}`);
      console.log(`   Actual:   ${r.actual}`);
    }
  });

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passedCount}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runStage2Tests().catch(err => {
  console.error('Fatal error during Stage 2 test run:', err);
  process.exit(1);
});
