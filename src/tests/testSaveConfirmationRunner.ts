/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runSaveConfirmationTests } from './saveConfirmation.test';

async function main() {
  console.log('=== SAVE CONFIRMATION TESTS ===');
  const results = await runSaveConfirmationTests();
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testId}: ${r.name}`);
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
  }
  console.log(`\nSummary: ${passCount}/${results.length} tests passed.`);
}

main().catch(console.error);
