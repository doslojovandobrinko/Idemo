/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runProfessionalContactEndpointTests } from './professionalContactEndpoint.test';

async function main() {
  console.log('=== PROFESSIONAL CONTACT ENDPOINT TESTS ===');
  const results = await runProfessionalContactEndpointTests();
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testId}: ${r.name}`);
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
  }
  console.log(`\nSummary: ${passCount}/${results.length} tests passed.`);
  if (passCount !== results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
