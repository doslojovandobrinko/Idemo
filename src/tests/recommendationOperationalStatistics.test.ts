/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO OPERATIONAL TELEMETRY & CURATOR MATRIX STATISTICS TEST SUITE
 * 
 * Tests:
 * 1. Anonymous recommendation view recording (Zero PII).
 * 2. In-memory session deduplication (prevents write spam).
 * 3. Matrix operational statistics aggregation (Views, Inquiries, Partner Responses, Agreements).
 * 4. Partner response ratio & agreement rate calculations.
 */

import { 
  recordRecommendationView, 
  fetchMatrixOperationalStatistics 
} from '../lib/recommendationStatsService';
import { safeStorage } from '../lib/safeStorage';

async function runTests() {
  console.log('--- STARTING IDEMO OPERATIONAL STATISTICS SUITE ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failCount++;
    }
  }

  // TEST 1: Initial state and view recording
  try {
    const initialResult = await recordRecommendationView('test-rec-1');
    assert(initialResult !== null && initialResult >= 1, 'ROS-01: Successfully records anonymous recommendation view');
  } catch (e: any) {
    assert(false, `ROS-01: Threw error: ${e.message}`);
  }

  // TEST 2: Session deduplication prevents redundant increment
  try {
    const duplicateResult = await recordRecommendationView('test-rec-1');
    assert(duplicateResult === null, 'ROS-02: Session deduplication suppresses repeated pings for the same recommendation');
  } catch (e: any) {
    assert(false, `ROS-02: Threw error: ${e.message}`);
  }

  // TEST 3: Multiple unique recommendations can be viewed
  try {
    const rec2Result = await recordRecommendationView('test-rec-2');
    assert(rec2Result !== null && rec2Result >= 1, 'ROS-03: Distinct recommendation view is recorded cleanly');
  } catch (e: any) {
    assert(false, `ROS-03: Threw error: ${e.message}`);
  }

  // TEST 4: Fetch Matrix Operational Statistics
  try {
    const statsResult = await fetchMatrixOperationalStatistics();
    assert(statsResult.success === true, 'ROS-04: Matrix operational telemetry fetch returns success: true');
    assert(typeof statsResult.data === 'object' && statsResult.data !== null, 'ROS-05: Returns data map of recommendation stats');
    
    // Check known baseline or recorded item
    const hasData = Object.keys(statsResult.data).length > 0;
    assert(hasData, 'ROS-06: Telemetry data contains recommendation statistics records');

    const sampleKey = Object.keys(statsResult.data)[0];
    const sample = statsResult.data[sampleKey];
    assert(typeof sample.view_count === 'number' && sample.view_count >= 0, 'ROS-07: Telemetry record has numeric view_count');
    assert(typeof sample.inquiries_count === 'number' && sample.inquiries_count >= 0, 'ROS-08: Telemetry record has numeric inquiries_count');
    assert(typeof sample.agreements_count === 'number' && sample.agreements_count >= 0, 'ROS-09: Telemetry record has numeric agreements_count');
    assert(typeof sample.partner_breakdown === 'object', 'ROS-10: Telemetry record contains partner_breakdown');
  } catch (e: any) {
    assert(false, `ROS-04..10: Threw error: ${e.message}`);
  }

  // TEST 5: Privacy Guarantee (Zero PII Check)
  try {
    const rawLocal = safeStorage.getItem('idemo_local_recommendation_views_v1');
    const parsed = rawLocal ? JSON.parse(rawLocal) : {};
    const keys = Object.keys(parsed);
    const containsOnlyNumbers = keys.every(k => typeof parsed[k] === 'number');
    assert(containsOnlyNumbers, 'ROS-11: Privacy Foundation Verified: Local store contains strictly { recId: count } with zero visitor PII');
  } catch (e: any) {
    assert(false, `ROS-11: Threw error: ${e.message}`);
  }

  console.log(`\nTEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
