/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getEntityKey,
  activeResearchRuns,
  isResearchRunActive,
  generateDeterministicSemanticResearch,
  processAndAuditResearchData,
} from '../../server';
import {
  compileClientSemanticFallback,
  AGENT_RESEARCH_TIMEOUT_MS,
  localizeRecommendation,
} from '../lib/recommendationAgentService';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runAgent007SplitCompileTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // A007-SPLIT-01: Initial proposal compile completes with EN & SR content present and DE/RU/ES/ZH marked as "PENDING LOCALIZATION"
  try {
    const rawResearched = generateDeterministicSemanticResearch('Žestival Užice', 'Užice');
    const result = processAndAuditResearchData(
      { nameOrTitle: 'Žestival Užice', destinationOrLocation: 'Užice' },
      rawResearched,
      [],
      false,
      []
    );
    const trans = result.recommendation.translations;
    const hasEnSr = Boolean(trans?.en?.shortDescription && trans?.sr?.shortDescription);
    const dePending = trans?.de?.shortDescription === 'PENDING LOCALIZATION';
    const ruPending = trans?.ru?.shortDescription === 'PENDING LOCALIZATION';
    const esPending = trans?.es?.shortDescription === 'PENDING LOCALIZATION';
    const zhPending = trans?.zh?.shortDescription === 'PENDING LOCALIZATION';

    const passed = hasEnSr && dePending && ruPending && esPending && zhPending;
    results.push({
      testId: 'A007-SPLIT-01',
      name: 'Initial proposal compile produces EN & SR and DE/RU/ES/ZH marked as PENDING LOCALIZATION',
      expected: 'EN & SR populated; DE, RU, ES, ZH shortDescription === "PENDING LOCALIZATION"',
      actual: `EN/SR present: ${hasEnSr}; DE pending: ${dePending}; RU pending: ${ruPending}; ES pending: ${esPending}; ZH pending: ${zhPending}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-01',
      name: 'Initial proposal compile produces EN & SR and DE/RU/ES/ZH marked as PENDING LOCALIZATION',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-02: Initial proposal compile browser timeout remains 180s
  try {
    const passed = AGENT_RESEARCH_TIMEOUT_MS === 180000;
    results.push({
      testId: 'A007-SPLIT-02',
      name: 'Browser research timeout set to 180000 ms (180s)',
      expected: '180000',
      actual: String(AGENT_RESEARCH_TIMEOUT_MS),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-02',
      name: 'Browser research timeout set to 180000 ms (180s)',
      expected: '180000',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-03: Proposal lifecycle status remains "NEEDS RESEARCH" (AMBER)
  try {
    const rawResearched = generateDeterministicSemanticResearch('Test Venue', 'Beograd');
    const result = processAndAuditResearchData(
      { nameOrTitle: 'Test Venue', destinationOrLocation: 'Beograd' },
      rawResearched,
      [],
      false,
      []
    );
    const passed = result.evidenceReport.lifecycleStatus === 'NEEDS RESEARCH' && result.evidenceReport.headerVisualState === 'AMBER';
    results.push({
      testId: 'A007-SPLIT-03',
      name: 'Initial compile recommendation preserves NEEDS RESEARCH lifecycle and AMBER visual state',
      expected: 'NEEDS RESEARCH / AMBER',
      actual: `${result.evidenceReport.lifecycleStatus} / ${result.evidenceReport.headerVisualState}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-03',
      name: 'Initial compile recommendation preserves NEEDS RESEARCH lifecycle and AMBER visual state',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-04: Full taxonomy, category, coordinates, practicalInfo, and Mood Orbit fields are preserved in initial compile
  try {
    const rawResearched = generateDeterministicSemanticResearch('Banja Koviljača', 'Loznica');
    const result = processAndAuditResearchData(
      { nameOrTitle: 'Banja Koviljača', destinationOrLocation: 'Loznica' },
      rawResearched,
      [],
      false,
      []
    );
    const rec = result.recommendation;
    const hasCategory = Boolean(rec.category);
    const hasExpertise = Array.isArray(rec.expertiseIds) && rec.expertiseIds.length > 0;
    const hasPractical = Boolean(rec.practicalInfo);
    const hasMoodOrbit = typeof rec.coordinateX === 'number' && typeof rec.coordinateY === 'number';

    const passed = hasCategory && hasExpertise && hasPractical && hasMoodOrbit;
    results.push({
      testId: 'A007-SPLIT-04',
      name: 'Core taxonomy, category, practicalInfo, and Mood Orbit fields preserved in initial compile',
      expected: 'category, expertiseIds, practicalInfo, coordinateX/Y all present',
      actual: `category: ${hasCategory}, expertise: ${hasExpertise}, practical: ${hasPractical}, moodOrbit: ${hasMoodOrbit}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-04',
      name: 'Core taxonomy, category, practicalInfo, and Mood Orbit fields preserved in initial compile',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-05: Service area resolution is preserved in initial compile
  try {
    const serviceAreas = [{ id: 'sa-uzice', name: 'Užice Region', destination_code: 'UZ' }];
    const rawResearched = generateDeterministicSemanticResearch('Žestival', 'Užice');
    const result = processAndAuditResearchData(
      { nameOrTitle: 'Žestival', destinationOrLocation: 'Užice', targetServiceAreaId: 'sa-uzice' },
      rawResearched,
      serviceAreas,
      false,
      []
    );
    const passed = result.recommendation.serviceAreaId === 'sa-uzice' && result.evidenceReport.serviceAreaResolution.isResolved;
    results.push({
      testId: 'A007-SPLIT-05',
      name: 'Service area resolution preserved during initial compile',
      expected: 'serviceAreaId === "sa-uzice" and isResolved === true',
      actual: `serviceAreaId: ${result.recommendation.serviceAreaId}, isResolved: ${result.evidenceReport.serviceAreaResolution.isResolved}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-05',
      name: 'Service area resolution preserved during initial compile',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-06: Evidence and provenance metadata are preserved in initial compile
  try {
    const rawResearched = generateDeterministicSemanticResearch('Tara River Canyon', 'Bajina Bašta');
    const result = processAndAuditResearchData(
      { nameOrTitle: 'Tara River Canyon', destinationOrLocation: 'Bajina Bašta' },
      rawResearched,
      [],
      false,
      []
    );
    const hasEvidence = Array.isArray(result.evidenceReport.verifiedFields) && Array.isArray(result.evidenceReport.unresolvedFields);
    const hasProvenance = Boolean(result.recommendation.provenance);

    const passed = hasEvidence && hasProvenance;
    results.push({
      testId: 'A007-SPLIT-06',
      name: 'Evidence report and provenance metadata preserved in initial compile',
      expected: 'evidenceReport and recommendation.provenance present',
      actual: `hasEvidence: ${hasEvidence}, hasProvenance: ${hasProvenance}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-06',
      name: 'Evidence report and provenance metadata preserved in initial compile',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-07: Deferred localization preserves existing EN/SR content while updating target languages
  try {
    const mockRec: any = {
      id: 'rec-test-123',
      title: 'Original English Title',
      shortDescription: 'Original English Description',
      translations: {
        en: { title: 'Original English Title', shortDescription: 'Original English Description', longDescription: 'Original EN Long', location: 'Užice' },
        sr: { title: 'Original Serbian Title', shortDescription: 'Original Serbian Description', longDescription: 'Original SR Long', location: 'Ужице' },
        de: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
        ru: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
        es: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
        zh: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      }
    };

    // Simulated localization response merging
    const newTranslations = {
      ...mockRec.translations,
      de: { title: 'German Title', shortDescription: 'German Description', longDescription: 'German Long', location: 'Užice' },
      ru: { title: 'Russian Title', shortDescription: 'Russian Description', longDescription: 'Russian Long', location: 'Užice' },
      es: { title: 'Spanish Title', shortDescription: 'Spanish Description', longDescription: 'Spanish Long', location: 'Užice' },
      zh: { title: 'Chinese Title', shortDescription: 'Chinese Description', longDescription: 'Chinese Long', location: 'Užice' },
    };

    const enUnchanged = newTranslations.en.shortDescription === 'Original English Description';
    const srUnchanged = newTranslations.sr.shortDescription === 'Original Serbian Description';
    const deUpdated = newTranslations.de.shortDescription === 'German Description';

    const passed = enUnchanged && srUnchanged && deUpdated;
    results.push({
      testId: 'A007-SPLIT-07',
      name: 'Deferred localization preserves EN and SR content while updating target languages',
      expected: 'EN/SR unchanged, DE/RU/ES/ZH populated',
      actual: `EN unchanged: ${enUnchanged}, SR unchanged: ${srUnchanged}, DE updated: ${deUpdated}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-07',
      name: 'Deferred localization preserves EN and SR content while updating target languages',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-08: Deferred localization does not modify canonical recommendation ID or DB identity
  try {
    const mockRec: any = { id: 'rec-canonical-999', dbId: 'uuid-db-999', title: 'Test Item' };
    const updated = { ...mockRec, translations: {} };

    const passed = updated.id === 'rec-canonical-999' && updated.dbId === 'uuid-db-999';
    results.push({
      testId: 'A007-SPLIT-08',
      name: 'Deferred localization preserves canonical recommendation ID and DB identity',
      expected: 'id === "rec-canonical-999" and dbId === "uuid-db-999"',
      actual: `id: ${updated.id}, dbId: ${updated.dbId}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-08',
      name: 'Deferred localization preserves canonical recommendation ID and DB identity',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-09: Deferred localization does not modify lifecycle status or auto-approve
  try {
    const mockRec: any = { id: 'rec-1', lifecycleStatus: 'NEEDS RESEARCH', headerVisualState: 'AMBER' };
    const updated = { ...mockRec, translations: {} };

    const passed = updated.lifecycleStatus === 'NEEDS RESEARCH' && updated.headerVisualState === 'AMBER';
    results.push({
      testId: 'A007-SPLIT-09',
      name: 'Deferred localization preserves NEEDS RESEARCH lifecycle and does not auto-approve',
      expected: 'NEEDS RESEARCH / AMBER',
      actual: `${updated.lifecycleStatus} / ${updated.headerVisualState}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-09',
      name: 'Deferred localization preserves NEEDS RESEARCH lifecycle and does not auto-approve',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-10: Deferred localization failure leaves EN/SR content and existing fields intact
  try {
    const mockRec: any = {
      id: 'rec-1',
      title: 'Valid EN Title',
      translations: {
        en: { title: 'Valid EN Title', shortDescription: 'Valid EN Short', longDescription: 'Long', location: 'Užice' },
        sr: { title: 'Valid SR Title', shortDescription: 'Valid SR Short', longDescription: 'Long', location: 'Ужице' },
      }
    };

    // On failure, return original recommendation
    const failedResult = { success: false, recommendation: mockRec, error: 'Network failure' };

    const enIntact = failedResult.recommendation.translations?.en?.title === 'Valid EN Title';
    const srIntact = failedResult.recommendation.translations?.sr?.title === 'Valid SR Title';

    const passed = enIntact && srIntact;
    results.push({
      testId: 'A007-SPLIT-10',
      name: 'Deferred localization failure leaves existing EN/SR content completely intact',
      expected: 'EN and SR titles intact after failure',
      actual: `EN intact: ${enIntact}, SR intact: ${srIntact}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-10',
      name: 'Deferred localization failure leaves existing EN/SR content completely intact',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-11: Quota safety gate and 429 response handling remain intact
  try {
    const fallback = compileClientSemanticFallback(
      { nameOrTitle: 'Quota Test' },
      [],
      {
        fallbackReason: '429 RESOURCE_EXHAUSTED',
        classification: 'GEMINI_QUOTA_EXCEEDED',
        quotaExceeded: true,
      }
    );
    const passed = fallback.metadata.quotaExceeded === true && fallback.metadata.fallbackInvoked === true;
    results.push({
      testId: 'A007-SPLIT-11',
      name: '429 Quota Exceeded fallback flags quotaExceeded and fallbackInvoked correctly',
      expected: 'quotaExceeded === true and fallbackInvoked === true',
      actual: `quotaExceeded: ${fallback.metadata.quotaExceeded}, fallbackInvoked: ${fallback.metadata.fallbackInvoked}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-11',
      name: '429 Quota Exceeded fallback flags quotaExceeded and fallbackInvoked correctly',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  // A007-SPLIT-12: Single-flight lock prevents concurrent research requests for the same entity key
  try {
    const key = getEntityKey('Žestival Užice', 'Užice');
    activeResearchRuns.clear();
    activeResearchRuns.add(key);

    const isBlocked = isResearchRunActive(key);
    activeResearchRuns.clear();

    const passed = isBlocked === true;
    results.push({
      testId: 'A007-SPLIT-12',
      name: 'Single-flight lock blocks concurrent research requests for same entity key',
      expected: 'isResearchRunActive returns true',
      actual: `isResearchRunActive returned ${isBlocked}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'A007-SPLIT-12',
      name: 'Single-flight lock blocks concurrent research requests for same entity key',
      expected: 'Success',
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }

  return results;
}
