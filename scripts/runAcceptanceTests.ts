/**
 * Runner for V9-STUDIO-PROPOSAL-AGENT-01 Acceptance Test Suite
 */
import { runAcceptanceTests } from '../src/tests/proposalAgentRemediation.test';

async function main() {
  console.log('====================================================');
  console.log('RUNNING V9-STUDIO-PROPOSAL-AGENT-01 ACCEPTANCE SUITE');
  console.log('====================================================\n');

  try {
    const results = await runAcceptanceTests();
    let passedCount = 0;
    let failedCount = 0;

    for (const r of results) {
      const status = r.passed ? '✅ PASS' : '❌ FAIL';
      if (r.passed) passedCount++;
      else failedCount++;
      console.log(`[TEST ${String(r.testNumber).padStart(2, '0')}] ${status} - ${r.name}`);
      console.log(`  Expected: ${r.expected}`);
      console.log(`  Actual:   ${r.actual}\n`);
    }

    console.log('====================================================');
    console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED, ${results.length} TOTAL`);
    console.log('====================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

main();
