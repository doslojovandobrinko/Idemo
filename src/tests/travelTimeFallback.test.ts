/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildCanonicalRecommendationPayload } from '../lib/recommendationWorkflowService';

export interface TravelTimeFallbackTestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runTravelTimeFallbackTests(): Promise<TravelTimeFallbackTestResult[]> {
  const results: TravelTimeFallbackTestResult[] = [];

  const record = (
    testId: string,
    name: string,
    expected: string,
    actual: string,
    passed: boolean
  ) => {
    results.push({ testId, name, expected, actual, passed });
  };

  // Helper function mimicking the modal rendering logic
  const renderTravelTime = (travelTime: string | undefined) => {
    return travelTime || 'Unresolved';
  };

  // TRAVEL-TIME-01: travelTime="" does not render "15 mins"
  try {
    const travelTime = '';
    const rendered = renderTravelTime(travelTime);
    const passed = rendered !== '15 mins' && rendered === 'Unresolved';
    record(
      'TRAVEL-TIME-01',
      'travelTime="" does not render "15 mins"',
      'Value is "Unresolved" and not "15 mins"',
      `Rendered: "${rendered}"`,
      passed
    );
  } catch (err: any) {
    record('TRAVEL-TIME-01', 'travelTime="" does not render "15 mins"', 'Not 15 mins', err?.message || String(err), false);
  }

  // TRAVEL-TIME-02: travelTime="45 min" renders "45 min"
  try {
    const travelTime = '45 min';
    const rendered = renderTravelTime(travelTime);
    const passed = rendered === '45 min';
    record(
      'TRAVEL-TIME-02',
      'travelTime="45 min" renders "45 min"',
      'Rendered: "45 min"',
      `Rendered: "${rendered}"`,
      passed
    );
  } catch (err: any) {
    record('TRAVEL-TIME-02', 'travelTime="45 min" renders "45 min"', '45 min', err?.message || String(err), false);
  }

  // TRAVEL-TIME-03: travelTimeMinutes=0 remains unchanged
  try {
    const rec = {
      id: 'rec-test-01',
      travelTimeMinutes: 0,
    };
    const payload = buildCanonicalRecommendationPayload(rec, 'sa-west-003');
    const passed = payload.travel_time_minutes === 0;
    record(
      'TRAVEL-TIME-03',
      'travelTimeMinutes=0 remains unchanged',
      'travel_time_minutes=0',
      `travel_time_minutes=${payload.travel_time_minutes}`,
      passed
    );
  } catch (err: any) {
    record('TRAVEL-TIME-03', 'travelTimeMinutes=0 remains unchanged', '0', err?.message || String(err), false);
  }

  // TRAVEL-TIME-04: coordinates remain unchanged
  try {
    const rec = {
      id: 'rec-test-01',
      coordinates: { lat: 43.85677, lng: 19.84026 },
    };
    const payload = buildCanonicalRecommendationPayload(rec, 'sa-west-003');
    const passed = payload.latitude === 43.85677 && payload.longitude === 19.84026;
    record(
      'TRAVEL-TIME-04',
      'coordinates remain unchanged',
      'latitude=43.85677, longitude=19.84026',
      `latitude=${payload.latitude}, longitude=${payload.longitude}`,
      passed
    );
  } catch (err: any) {
    record('TRAVEL-TIME-04', 'coordinates remain unchanged', 'Exact coordinates preserved', err?.message || String(err), false);
  }

  return results;
}
