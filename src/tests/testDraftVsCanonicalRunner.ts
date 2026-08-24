/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runDraftVsCanonicalIdentityTests } from './draftVsCanonicalIdentity.test';

async function main() {
  console.log('=== DRAFT VS CANONICAL IDENTITY TESTS ===');
  const results = await runDraftVsCanonicalIdentityTests();
  let passCount = 0;
  let failCount = 0;

  for (const res of results) {
    const status = res.passed ? 'PASS' : 'FAIL';
    if (res.passed) passCount++;
    else failCount++;
    console.log(`[${status}] ${res.testId}: ${res.name}`);
    console.log(`  Expected: ${res.expected}`);
    console.log(`  Actual:   ${res.actual}`);
  }

  console.log(`\nSUMMARY: ${passCount} passed, ${failCount} failed, ${results.length} total.`);
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
