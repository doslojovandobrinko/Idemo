/**
 * IDEMO 007 V2 - Destination Health Monitor Service Test Suite
 * Tests deterministic, pure read-only health scanning, publication readiness findings,
 * coordinate bounds checks, localization findings, media checks, and zero data mutation.
 */

import {
  scanDestinationHealth,
  DestinationScopeInput,
  DestinationHealthReport,
} from '../lib/idemo007v2/destinationHealthService';
import { Recommendation } from '../types';

export interface TestResult {
  id: string;
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runDestinationHealthTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const addResult = (testId: string, name: string, expected: string, actual: string, passed: boolean) => {
    results.push({ id: testId, testId, name, expected, actual, passed });
    console.log(`[DESTINATION HEALTH] [${testId}] ${name}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    if (!passed) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
  };

  const healthyRec: Partial<Recommendation> = {
    id: 'rec-healthy-001',
    title: 'Manasija Monastery',
    category: 'History',
    serviceAreaId: 'sa-belgrade-001',
    shortDescription: '15th-century fortified Serbian Orthodox monastery near Despotovac.',
    shortDescriptionSr: 'Манастир Манасија из 15. века.',
    image: '/assets/images/recommendations/manasija.jpg',
    coordinates: { lat: 44.10, lng: 21.46 },
    publicationStatus: 'PUBLISHED' as any,
    provenance: {
      source: 'Curator Field Verification',
      verificationStatus: 'VERIFIED',
    },
    translations: {
      en: { title: 'Manasija Monastery', shortDescription: '15th-century monastery.' },
      sr: { title: 'Манастир Манасија', shortDescription: 'Манастир из 15. века.' },
      de: { title: 'Kloster Manasija', shortDescription: 'Kloster aus dem 15. Jahrhundert.' },
      ru: { title: 'Монастырь Манасия', shortDescription: 'Монастырь 15 века.' },
      es: { title: 'Monasterio Manasija', shortDescription: 'Monasterio del siglo XV.' },
      zh: { title: '马纳西亚修道院', shortDescription: '15世纪的大修道院。' },
    },
  };

  const incompleteRec: Partial<Recommendation> = {
    id: 'rec-incomplete-002',
    title: '', // Missing title
    category: '', // Missing category
    shortDescription: '', // Missing short description
    image: '', // Missing image
    coordinates: { lat: 0, lng: 0 }, // Zero coordinates
    publicationStatus: 'DRAFT' as any,
  };

  // 1. DH-01 — Healthy destination/item evaluation
  const healthyScope: DestinationScopeInput = {
    id: 'dest-healthy-1',
    name: 'Healthy Destination',
    recommendations: [healthyRec],
  };
  const report1 = scanDestinationHealth(healthyScope);
  addResult(
    'DH-01',
    'Healthy item returns clean health score and HEALTHY status',
    'status: HEALTHY, healthScore >= 85, blockingCount: 0',
    `status: ${report1.status}, healthScore: ${report1.healthScore}, blockingCount: ${report1.summary.blockingCount}`,
    report1.status === 'HEALTHY' && report1.healthScore >= 85 && report1.summary.blockingCount === 0
  );

  // 2. DH-02 — Publication-readiness finding for incomplete item
  const incompleteScope: DestinationScopeInput = {
    id: 'dest-incomplete-1',
    name: 'Incomplete Destination',
    recommendations: [incompleteRec],
  };
  const report2 = scanDestinationHealth(incompleteScope);
  const pubFinding = report2.findings.find(f => f.category === 'PUBLICATION_READINESS');
  addResult(
    'DH-02',
    'Publication readiness finding emitted for incomplete item',
    'Category PUBLICATION_READINESS with BLOCKING severity',
    pubFinding ? `Category ${pubFinding.category}, severity ${pubFinding.severity}` : 'Not found',
    Boolean(pubFinding && pubFinding.severity === 'BLOCKING')
  );

  // 3. DH-03 — Missing / invalid zero coordinates finding
  const geoFinding = report2.findings.find(f => f.code === 'MISSING_GEOGRAPHIC_COORDINATES');
  addResult(
    'DH-03',
    'Missing/zero geographic coordinates emit MISSING_GEOGRAPHIC_COORDINATES finding',
    'Code MISSING_GEOGRAPHIC_COORDINATES present',
    geoFinding ? `Code ${geoFinding.code}` : 'Not found',
    Boolean(geoFinding)
  );

  // 4. DH-04 — Localization completeness finding
  const locFinding = report2.findings.find(f => f.code === 'INCOMPLETE_LOCALIZATION');
  addResult(
    'DH-04',
    'Incomplete multi-language translations emit INCOMPLETE_LOCALIZATION finding',
    'Code INCOMPLETE_LOCALIZATION present',
    locFinding ? `Code ${locFinding.code}` : 'Not found',
    Boolean(locFinding)
  );

  // 5. DH-05 — Primary media missing finding
  const mediaFinding = report2.findings.find(f => f.code === 'MISSING_PRIMARY_MEDIA');
  addResult(
    'DH-05',
    'Missing primary recommendation image emits MISSING_PRIMARY_MEDIA finding',
    'Code MISSING_PRIMARY_MEDIA present',
    mediaFinding ? `Code ${mediaFinding.code}` : 'Not found',
    Boolean(mediaFinding)
  );

  // 6. DH-06 — Service area coverage finding
  const saFinding = report2.findings.find(f => f.code === 'UNASSIGNED_SERVICE_AREA');
  addResult(
    'DH-06',
    'Unassigned service area emits UNASSIGNED_SERVICE_AREA finding',
    'Code UNASSIGNED_SERVICE_AREA present',
    saFinding ? `Code ${saFinding.code}` : 'Not found',
    Boolean(saFinding)
  );

  // 7. DH-07 — Deterministic repeated output
  const reportA = scanDestinationHealth(incompleteScope);
  const reportB = scanDestinationHealth(incompleteScope);
  const isIdentical =
    reportA.healthScore === reportB.healthScore &&
    reportA.status === reportB.status &&
    reportA.findings.length === reportB.findings.length &&
    reportA.findings.every((f, i) => f.id === reportB.findings[i]?.id);
  addResult(
    'DH-07',
    'Identical inputs produce identical deterministic health report output',
    'true',
    String(isIdentical),
    isIdentical
  );

  // 8. DH-08 — Zero data mutation of source objects
  const snapshotBefore = JSON.stringify(incompleteRec);
  scanDestinationHealth(incompleteScope);
  const snapshotAfter = JSON.stringify(incompleteRec);
  addResult(
    'DH-08',
    'Destination health scan performs zero mutation on source objects',
    'Source object snapshot unchanged',
    snapshotBefore === snapshotAfter ? 'Snapshot identical' : 'Snapshot mutated',
    snapshotBefore === snapshotAfter
  );

  return results;
}

if (typeof import.meta !== 'undefined' && import.meta.url && import.meta.url.endsWith('idemo007V2DestinationHealth.test.ts')) {
  runDestinationHealthTests();
}
