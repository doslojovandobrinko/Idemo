/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runPassportSubmitButtonStateTests } from './passportSubmitButtonState.test';

async function main() {
  console.log('=== IDEMO PARTNER PASSPORT SUBMIT BUTTON STATE TEST SUITE ===');
  const results = runPassportSubmitButtonStateTests();
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    console.log(`[${r.passed ? '✓ PASS' : '✗ FAIL'}] BTN-${String(r.testNumber).padStart(3, '0')}: ${r.name}`);
    if (!r.passed) {
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}`);
    }
  }
  console.log(`\nSUCCESS: ${passCount}/${results.length} tests passed.`);
  if (passCount !== results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
