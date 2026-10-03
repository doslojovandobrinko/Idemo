/**
 * IDEMO 007 V2 - Link Integrity Monitor Service Test Suite
 * Tests pure deterministic read-only outbound URL scanning, protocol validation,
 * syntax checks, recommendation field mapping, and zero data mutation.
 */

import {
  scanLinkIntegrity,
  LinkIntegrityReport,
} from '../lib/idemo007v2/linkIntegrityService';
import { Recommendation } from '../types';

export interface TestResult {
  id: string;
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const mockBaseRecommendation: Recommendation = {
  id: 'test-rec-1',
  title: 'Kafana Zlatna Moruna',
  category: 'Gastronomy',
  shortDescription: 'Historic Serbian kafana in Belgrade.',
  longDescription: 'Historic kafana with rich cultural history.',
  image: '/src/assets/images/zlatna-moruna.jpg',
  duration: '2 hours',
  travelTime: '15 mins',
  travelTimeMinutes: 15,
  location: 'Belgrade',
  estimatedCost: '€20-€40',
  preferredTransport: 'Taxi',
  website: 'https://zlatnamoruna.rs',
  practicalInfo: {
    website: 'https://zlatnamoruna.rs/reservations',
  },
};

export function runLinkIntegrityTests(): TestResult[] {
  const results: TestResult[] = [];

  // LI-01: Valid HTTP/HTTPS URLs produce no findings
  (() => {
    const recs: Recommendation[] = [
      { ...mockBaseRecommendation, website: 'https://valid-site.com', practicalInfo: { website: 'http://valid-sub.org' } },
    ];
    const report = scanLinkIntegrity(recs);
    const passed = report.findingCount === 0 && report.healthyCount === 1;
    results.push({
      id: 'LI-01',
      testId: 'LI-01',
      name: 'valid HTTP/HTTPS URLs produce no findings',
      expected: 'findingCount=0, healthyCount=1',
      actual: `findingCount=${report.findingCount}, healthyCount=${report.healthyCount}`,
      passed,
    });
  })();

  // LI-02: Malformed URL produces MALFORMED_URL
  (() => {
    const recs: Recommendation[] = [
      { ...mockBaseRecommendation, website: 'https://invalid domain with spaces.com' },
    ];
    const report = scanLinkIntegrity(recs);
    const hasMalformed = report.findings.some(f => f.code === 'MALFORMED_URL' && f.field === 'website');
    results.push({
      id: 'LI-02',
      testId: 'LI-02',
      name: 'malformed URL produces MALFORMED_URL',
      expected: 'finding code MALFORMED_URL',
      actual: report.findings.map(f => f.code).join(', ') || 'none',
      passed: hasMalformed,
    });
  })();

  // LI-03: Unsupported/unsafe protocol produces INVALID_PROTOCOL
  (() => {
    const recs: Recommendation[] = [
      { ...mockBaseRecommendation, website: 'ftp://fileserver.com/doc' },
      { ...mockBaseRecommendation, id: 'test-rec-2', website: 'javascript:alert(1)' },
      { ...mockBaseRecommendation, id: 'test-rec-3', website: 'www.missing-protocol.com' },
    ];
    const report = scanLinkIntegrity(recs);
    const protocolFindings = report.findings.filter(f => f.code === 'INVALID_PROTOCOL');
    const passed = protocolFindings.length === 3;
    results.push({
      id: 'LI-03',
      testId: 'LI-03',
      name: 'unsupported/unsafe protocol produces INVALID_PROTOCOL',
      expected: '3 INVALID_PROTOCOL findings',
      actual: `${protocolFindings.length} INVALID_PROTOCOL findings`,
      passed,
    });
  })();

  // LI-04: Absent optional URL does not create a false positive unless existing governance requires it
  (() => {
    const recs: Recommendation[] = [
      { ...mockBaseRecommendation, website: undefined, practicalInfo: undefined },
    ];
    const report = scanLinkIntegrity(recs);
    const passed = report.findingCount === 0 && report.healthyCount === 1;
    results.push({
      id: 'LI-04',
      testId: 'LI-04',
      name: 'absent optional URL does not create a false positive',
      expected: 'findingCount=0, healthyCount=1',
      actual: `findingCount=${report.findingCount}, healthyCount=${report.healthyCount}`,
      passed,
    });
  })();

  // LI-05: Finding identifies recommendation + exact field
  (() => {
    const recs: Recommendation[] = [
      {
        ...mockBaseRecommendation,
        id: 'rec-target-99',
        title: 'Target Spot',
        website: 'https://valid.com',
        practicalInfo: { website: 'javascript:void(0)' },
      },
    ];
    const report = scanLinkIntegrity(recs);
    const finding = report.findings[0];
    const passed =
      finding &&
      finding.recommendationId === 'rec-target-99' &&
      finding.recommendationTitle === 'Target Spot' &&
      finding.field === 'practicalInfo.website';

    results.push({
      id: 'LI-05',
      testId: 'LI-05',
      name: 'finding identifies recommendation + exact field',
      expected: 'recId=rec-target-99, field=practicalInfo.website',
      actual: finding ? `recId=${finding.recommendationId}, field=${finding.field}` : 'no finding',
      passed,
    });
  })();

  // LI-06: Repeated scans produce identical ordered output
  (() => {
    const recs: Recommendation[] = [
      { ...mockBaseRecommendation, id: 'rec-b', website: 'ftp://b.com' },
      { ...mockBaseRecommendation, id: 'rec-a', website: 'javascript:a()' },
    ];
    const report1 = scanLinkIntegrity(recs);
    const report2 = scanLinkIntegrity(recs);

    const json1 = JSON.stringify(report1.findings);
    const json2 = JSON.stringify(report2.findings);
    const isOrdered = report1.findings[0]?.recommendationId === 'rec-a';

    results.push({
      id: 'LI-06',
      testId: 'LI-06',
      name: 'repeated scans produce identical ordered output',
      expected: 'identical deterministic output sorted by recId',
      actual: json1 === json2 && isOrdered ? 'identical and sorted' : 'mismatch or unsorted',
      passed: json1 === json2 && isOrdered,
    });
  })();

  // LI-07: Source recommendation objects remain unchanged
  (() => {
    const originalJson = JSON.stringify(mockBaseRecommendation);
    const recs: Recommendation[] = [{ ...mockBaseRecommendation }];
    scanLinkIntegrity(recs);
    const postScanJson = JSON.stringify(recs[0]);

    results.push({
      id: 'LI-07',
      testId: 'LI-07',
      name: 'source recommendation objects remain unchanged',
      expected: 'original object unchanged',
      actual: originalJson === postScanJson ? 'unchanged' : 'mutated',
      passed: originalJson === postScanJson,
    });
  })();

  return results;
}
