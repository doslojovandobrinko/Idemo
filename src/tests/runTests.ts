/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runAcceptanceTests } from './proposalAgentRemediation.test';
import { runDraftDeletionTests } from './draftDeletion.test';
import { runApprovalGuardTests } from './unauthorizedApprovalGuard.test';
import { runUnifiedRecommendationManagementTests } from './unifiedRecommendationManagement.test';
import { runLifecycleInvariantTests } from './recommendationLifecycleInvariant.test';
import { runPartnerLifecycleInvariantTests } from './partnerLifecycle.test';
import { runAgent007QuotaSafetyTests } from './agent007QuotaSafety.test';
import { runTab6StateAwareActionTests } from './tab6StateAwareAction.test';
import { runNonDestructive429RerunTests } from './nonDestructive429Rerun.test';
import { runAgent007HttpErrorClassificationTests } from './agent007HttpErrorClassification.test';
import { runAgent007TimeoutTests } from './agent007Timeout.test';
import { runAgent007SplitCompileTests } from './agent007SplitCompile.test';
import { runServiceAreaUuidResolutionTests } from './serviceAreaUuidResolution.test';
import { runMediaPipelineUuidSafetyTests } from './mediaPipelineUuidSafety.test';
import { runStudioAuthenticationContractTests } from './studioAuthenticationContract.test';
import { runReservationHandoffSafetyTests } from './reservationHandoffSafety.test';
import { runSinglePrimaryMediaInvariantTests } from './singlePrimaryMediaInvariant.test';
import { runPracticalGeoPersistenceTests } from './practicalGeoPersistence.test';
import { runLocalDraftSanitizerTests } from './localDraftSanitizer.test';
import { runServerDraftIdentityTests } from './serverDraftIdentity.test';
import { runTravelTimeFallbackTests } from './travelTimeFallback.test';
import { runSaveConfirmationTests } from './saveConfirmation.test';
import { runDraftVsCanonicalIdentityTests } from './draftVsCanonicalIdentity.test';
import { runPendingRecommendationRevisionTests } from './pendingRecommendationRevision.test';
import { runPassportStateIsolationTests } from './passportStateIsolation.test';
import { runMyPlannerUnreadIndicatorTests } from './myPlannerUnreadIndicator.test';
import { runHumanMediaAuthorityTests } from './humanMediaAuthority.test';

async function main() {
  console.log('================================================================');
  console.log('IDEMO ENGINEERING OFFICE — WORK PACKAGE: MEDIA PIPELINE UUID SAFETY');
  console.log('PERMANENT NON-REGRESSION TEST SUITE RUNNER');
  console.log('================================================================\n');

  try {
    const acceptanceResults = await runAcceptanceTests();
    const deletionResults = await runDraftDeletionTests();
    const approvalGuardResults = await runApprovalGuardTests();
    const unifiedResults = await runUnifiedRecommendationManagementTests();
    const lifecycleResults = await runLifecycleInvariantTests();
    const partnerLifecycleResults = await runPartnerLifecycleInvariantTests();
    const quotaSafetyResults = await runAgent007QuotaSafetyTests();
    const tab6Results = await runTab6StateAwareActionTests();
    const nr429Results = await runNonDestructive429RerunTests();
    const httpResults = await runAgent007HttpErrorClassificationTests();
    const timeoutResults = await runAgent007TimeoutTests();
    const splitResults = await runAgent007SplitCompileTests();
    const saUuidResults = await runServiceAreaUuidResolutionTests();
    const mediaUuidResults = await runMediaPipelineUuidSafetyTests();
    const authContractResults = await runStudioAuthenticationContractTests();
    const resHandoffResults = await runReservationHandoffSafetyTests();
    const resPrimaryMediaResults = await runSinglePrimaryMediaInvariantTests();
    const practicalGeoResults = await runPracticalGeoPersistenceTests();
    const localDraftResults = await runLocalDraftSanitizerTests();
    const serverDraftResults = await runServerDraftIdentityTests();
    const travelTimeFallbackResults = await runTravelTimeFallbackTests();
    const saveConfirmationResults = await runSaveConfirmationTests();
    const draftVsCanonicalResults = await runDraftVsCanonicalIdentityTests();
    const pendingRevisionResults = await runPendingRecommendationRevisionTests();
    const passportIsolationResults = await runPassportStateIsolationTests();
    const myPlannerUnreadResults = await runMyPlannerUnreadIndicatorTests();
    const humanMediaResults = await runHumanMediaAuthorityTests();

    const formattedUnified = unifiedResults.map(r => ({ ...r, testId: `U${r.testNumber}` }));
    const results = [
      ...acceptanceResults.map(r => ({ ...r, testId: `A${r.testNumber}` })),
      ...deletionResults.map(r => ({ ...r, testId: `D${r.testNumber}` })),
      ...approvalGuardResults.map(r => ({ ...r, testId: `G${r.testNumber}` })),
      ...formattedUnified,
      ...lifecycleResults.map(r => ({ ...r, testId: r.testId })),
      ...partnerLifecycleResults.map(r => ({ ...r, testId: r.testId })),
      ...quotaSafetyResults.map(r => ({ ...r, testId: r.testId })),
      ...splitResults.map(r => ({ ...r, testId: r.testId })),
      ...saUuidResults.map(r => ({ ...r, testId: r.testId })),
      ...mediaUuidResults.map(r => ({ ...r, testId: r.testId })),
      ...authContractResults.map(r => ({ ...r, testId: r.testId })),
      ...resHandoffResults.map(r => ({ ...r, testId: r.testId })),
      ...resPrimaryMediaResults.map(r => ({ ...r, testId: r.testId })),
      ...practicalGeoResults.map(r => ({ ...r, testId: r.testId })),
      ...localDraftResults.map(r => ({ ...r, testId: r.testId })),
      ...serverDraftResults.map(r => ({ ...r, testId: r.testId })),
      ...travelTimeFallbackResults.map(r => ({ ...r, testId: r.testId })),
      ...saveConfirmationResults.map(r => ({ ...r, testId: r.testId })),
      ...draftVsCanonicalResults.map(r => ({ ...r, testId: r.testId })),
      ...pendingRevisionResults.map(r => ({ ...r, testId: r.testId })),
      ...passportIsolationResults.map(r => ({ ...r, testId: r.testId })),
      ...myPlannerUnreadResults.map(r => ({ ...r, testId: r.testId })),
      ...humanMediaResults.logs.map((log, idx) => {
        const passed = log.startsWith('✅ PASS:');
        const name = log.replace(/^([✅❌]\s*(PASS|FAIL):\s*)/, '');
        return {
          testId: `MEDIA-GOV-${(idx + 1).toString().padStart(2, '0')}`,
          name,
          expected: 'Strict Human Media Authority condition satisfied',
          actual: passed ? 'Condition satisfied' : 'Media authority violation detected',
          passed,
        };
      }),
      ...tab6Results.results.map((res, idx) => {
        const passed = res.startsWith('PASS:');
        const parts = res.replace(/^(PASS|FAIL):\s*/, '').split(' - ');
        return {
          testId: `T6${(idx + 1).toString().padStart(2, '0')}`,
          name: parts[0] || 'Tab 6 State-Aware Test',
          expected: 'Test condition satisfied',
          actual: passed ? 'Test condition satisfied' : (parts[1] || 'Test failed'),
          passed,
        };
      }),
      ...nr429Results.results.map((res, idx) => {
        const passed = res.startsWith('PASS:');
        const parts = res.replace(/^(PASS|FAIL):\s*/, '').split(' - ');
        return {
          testId: `NR429-${(idx + 1).toString().padStart(2, '0')}`,
          name: parts[0] || 'Non-Destructive 429 Test',
          expected: 'Test condition satisfied',
          actual: passed ? 'Test condition satisfied' : (parts[1] || 'Test failed'),
          passed,
        };
      }),
      ...httpResults.results.map((res, idx) => {
        const passed = res.startsWith('PASS:');
        const parts = res.replace(/^(PASS|FAIL):\s*/, '').split(' - ');
        return {
          testId: `HTTP${(idx + 1).toString().padStart(2, '0')}`,
          name: parts[0] || 'HTTP Error Classification Test',
          expected: 'Test condition satisfied',
          actual: passed ? 'Test condition satisfied' : (parts[1] || 'Test failed'),
          passed,
        };
      }),
      ...timeoutResults.results.map((res, idx) => {
        const passed = res.startsWith('PASS:');
        const parts = res.replace(/^(PASS|FAIL):\s*/, '').split(' - ');
        return {
          testId: `TIMEOUT-${(idx + 1).toString().padStart(2, '0')}`,
          name: parts[0] || 'Timeout Configuration Test',
          expected: 'Test condition satisfied',
          actual: passed ? 'Test condition satisfied' : (parts[1] || 'Test failed'),
          passed,
        };
      }),
    ];
    let passedCount = 0;
    let failedCount = 0;

    for (const r of results) {
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;

      console.log(`[TEST ${r.testId}] ${r.name}`);
      console.log(`  Expected: ${r.expected}`);
      console.log(`  Actual:   ${r.actual}`);
      console.log(`  Status:   ${status}\n`);
    }

    console.log('================================================================');
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log(`FINAL RESULT: ${failedCount === 0 ? 'ALL ACCEPTANCE & LIFECYCLE INVARIANT TESTS PASSED' : 'TEST FAILURES DETECTED'}`);
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
