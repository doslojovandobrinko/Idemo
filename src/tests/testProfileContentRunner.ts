import { runProfileContentHydrationTests } from './profileContentHydration.test.js';

console.log('=== IDEMO PROFILE CONTENT HYDRATION TEST SUITE ===');
const results = runProfileContentHydrationTests();
let failed = 0;

for (const r of results) {
  const mark = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${mark}] ${r.testId}: ${r.name}`);
  if (!r.passed) {
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\nFAILED: ${failed} tests failed.`);
  process.exit(1);
} else {
  console.log(`\nSUCCESS: All ${results.length} hydration tests passed.`);
  process.exit(0);
}
