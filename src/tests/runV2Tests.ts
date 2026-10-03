/**
 * IDEMO 007 V2 - Dedicated Test Suite Runner (Slices 1, 2 & 3)
 */

import { runIdemo007V2Slice1Tests } from './idemo007V2Slice1.test';
import { runIdemo007V2Slice2Tests } from './idemo007V2Slice2.test';
import { runSlice3Tests } from './idemo007V2Slice3.test';
import { runIdemo007V2Slice4Tests } from './idemo007V2Slice4.test';
import { runIdemo007V2Slice5Tests } from './idemo007V2Slice5.test';
import { runSynthesisCacheTests } from './idemo007V2SynthesisCache.test';
import { runCandidateDiscoveryTests } from './idemo007V2CandidateDiscovery.test';
import { runCandidatePromotionTests } from './idemo007V2CandidatePromotion.test';
import { runSynthesisInputBoundaryTests } from './idemo007V2SynthesisInputBoundary.test';
import { runCanonicalOutputGovernanceTests } from './idemo007V2CanonicalOutputGovernance.test';
import { runPublicationGateTests } from './idemo007V2PublicationGate.test';
import { runCuratorAuthorityTests } from './idemo007V2CuratorAuthority.test';
import { runCuratorReviewSurfaceTests } from './idemo007V2CuratorReviewSurface.test';
import { runDayPlanComposerTests } from './idemo007V2DayPlanComposer.test';
import { runDayPlanCuratorEditorTests } from './idemo007V2DayPlanCuratorEditor.test';
import { runPartnerInquiryMatcherTests } from './idemo007V2PartnerInquiryMatcher.test';
import { runDestinationHealthTests } from './idemo007V2DestinationHealth.test';
import { runLinkIntegrityTests } from './idemo007V2LinkIntegrity.test';
import { runDayPlanExportTests } from './idemo007V2DayPlanExport.test';

async function main() {
  console.log('================================================================');
  console.log('IDEMO 007 V2 — FULL REGRESSION & CURATOR OVERRIDE RUNNER');
  console.log('================================================================\n');

  try {
    const slice1Results = await runIdemo007V2Slice1Tests();
    const slice2Results = await runIdemo007V2Slice2Tests();
    const slice3Results = await runSlice3Tests();
    const slice4Results = await runIdemo007V2Slice4Tests();
    const slice5Results = await runIdemo007V2Slice5Tests();
    const cacheResults = await runSynthesisCacheTests();
    const candidateResults = await runCandidateDiscoveryTests();
    const promotionResults = await runCandidatePromotionTests();
    const inputBoundaryResults = await runSynthesisInputBoundaryTests();
    const outputGovernanceResults = await runCanonicalOutputGovernanceTests();
    const publicationGateResults = await runPublicationGateTests();
    const curatorAuthorityResults = await runCuratorAuthorityTests();
    const curatorSurfaceResults = await runCuratorReviewSurfaceTests();
    const dayPlanComposerResults = await runDayPlanComposerTests();
    const dayPlanEditorResults = await runDayPlanCuratorEditorTests();
    const partnerMatcherResults = await runPartnerInquiryMatcherTests();
    const destinationHealthResults = await runDestinationHealthTests();
    const linkIntegrityResults = runLinkIntegrityTests();
    const dayPlanExportResults = runDayPlanExportTests();

    let passedCount = 0;
    let failedCount = 0;

    console.log('--- SLICE 1 & 2 TESTS ---');
    for (const r of [...slice1Results, ...slice2Results]) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[TEST ${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- SLICE 3 TESTS ---');
    for (const r of slice3Results) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[SLICE 3] ${r.name}: ${status}`);
    }

    console.log('\n--- SLICE 4.1 TESTS ---');
    for (const r of slice4Results) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[SLICE 4.1] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- SLICE 5 TESTS ---');
    for (const r of slice5Results) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[SLICE 5] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- SYNTHESIS CACHE TESTS ---');
    for (const r of cacheResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[SYNTHESIS CACHE] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- CANDIDATE DISCOVERY TESTS ---');
    for (const r of candidateResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[CANDIDATE DISCOVERY] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- CANDIDATE PROMOTION TESTS ---');
    for (const r of promotionResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[CANDIDATE PROMOTION] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- PROMOTED INPUT BOUNDARY TESTS ---');
    for (const r of inputBoundaryResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[SYNTHESIS INPUT BOUNDARY] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- CANONICAL OUTPUT GOVERNANCE TESTS ---');
    for (const r of outputGovernanceResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[CANONICAL OUTPUT GOVERNANCE] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- PUBLICATION GATE TESTS ---');
    for (const r of publicationGateResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[PUBLICATION GATE] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- CURATOR AUTHORITY TESTS ---');
    for (const r of curatorAuthorityResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[CURATOR AUTHORITY] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- CURATOR REVIEW SURFACE TESTS ---');
    for (const r of curatorSurfaceResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[CURATOR SURFACE] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- DAY-PLAN COMPOSER MVP TESTS ---');
    for (const r of dayPlanComposerResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[DAY-PLAN COMPOSER] [${r.id}] ${r.name}: ${status}`);
    }

    console.log('\n--- DAY-PLAN CURATOR EDITOR TESTS ---');
    for (const r of dayPlanEditorResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[DAY-PLAN EDITOR] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- PARTNER INQUIRY MATCHER & DISPATCH STAGER TESTS ---');
    for (const r of partnerMatcherResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[PARTNER MATCHER] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- DESTINATION HEALTH MONITOR TESTS ---');
    for (const r of destinationHealthResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[DESTINATION HEALTH] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- LINK INTEGRITY MONITOR TESTS ---');
    for (const r of linkIntegrityResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[LINK INTEGRITY] [${r.testId}] ${r.name}: ${status}`);
    }

    console.log('\n--- DAY PLAN VISITOR EXPORT TESTS ---');
    for (const r of dayPlanExportResults) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[DAY PLAN EXPORT] [${r.testId}] ${r.name}: ${status}`);
    }

    const totalCount =
      slice1Results.length +
      slice2Results.length +
      slice3Results.length +
      slice4Results.length +
      slice5Results.length +
      cacheResults.length +
      candidateResults.length +
      promotionResults.length +
      inputBoundaryResults.length +
      outputGovernanceResults.length +
      publicationGateResults.length +
      curatorAuthorityResults.length +
      curatorSurfaceResults.length +
      dayPlanComposerResults.length +
      dayPlanEditorResults.length +
      partnerMatcherResults.length +
      destinationHealthResults.length +
      linkIntegrityResults.length +
      dayPlanExportResults.length;

    console.log('\n================================================================');
    console.log(`TOTAL V2 TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log(
      `FINAL RESULT: ${
        failedCount === 0
          ? 'ALL V2 TESTS PASSED INCLUDING CURATOR FINAL AUTHORITY OVERRIDE'
          : 'TEST FAILURES DETECTED'
      }`
    );
    console.log('================================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

main();
