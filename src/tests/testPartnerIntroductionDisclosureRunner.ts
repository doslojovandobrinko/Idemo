/**
 * Runner for Partner Introduction Disclosure Tests
 */
import { runPartnerIntroductionDisclosureTests } from './partnerIntroductionDisclosure.test';

console.log('=== IDEMO PARTNER INTRODUCTION DISCLOSURE TEST SUITE ===');

const results = runPartnerIntroductionDisclosureTests();
let allPassed = true;

for (const r of results) {
  if (r.passed) {
    console.log(`[✓ PASS] INTRO-${String(r.testNumber).padStart(3, '0')}: ${r.name}`);
  } else {
    allPassed = false;
    console.error(`[✗ FAIL] INTRO-${String(r.testNumber).padStart(3, '0')}: ${r.name}`);
    console.error(`  Expected: ${r.expected}`);
    console.error(`  Actual:   ${r.actual}`);
  }
}

if (allPassed) {
  console.log(`\nSUCCESS: All ${results.length} partner introduction disclosure tests passed.`);
  process.exit(0);
} else {
  console.error(`\nFAILURE: Some tests failed.`);
  process.exit(1);
}
