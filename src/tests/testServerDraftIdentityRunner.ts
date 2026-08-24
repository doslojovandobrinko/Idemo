/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runServerDraftIdentityTests } from './serverDraftIdentity.test';

async function main() {
  console.log('=== SERVER DRAFT IDENTITY PERMANENT TESTS ===');
  const results = await runServerDraftIdentityTests();
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
