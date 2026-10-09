/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runPartnerPhotoAuthenticityRegressionTests } from './partnerPhotoAuthenticityRegression.test';

async function main() {
  console.log('=== IDEMO PARTNER PHOTO AUTHENTICITY NON-REGRESSION TEST SUITE ===\n');
  const results = runPartnerPhotoAuthenticityRegressionTests();

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${icon}] ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
    if (!r.passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log(`SUCCESS: All ${results.length} partner photo authenticity regression tests passed.`);
    process.exit(0);
  } else {
    console.error(`FAILURE: Some tests failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
