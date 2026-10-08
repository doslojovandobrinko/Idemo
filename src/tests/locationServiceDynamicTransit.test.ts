/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  locationService, 
  calculateDistanceKm, 
  calculateTaxiFare, 
  BASE_LOCATION_HUBS 
} from '../lib/locationService';

function runLocationServiceTests() {
  console.log('--- STARTING LOCATION SERVICE & DYNAMIC TRANSIT TESTS ---');
  let passedCount = 0;
  let totalCount = 0;

  function assert(testId: string, description: string, condition: boolean, detail?: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] ${testId}: ${description} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`[FAIL] ${testId}: ${description} ${detail ? `(${detail})` : ''}`);
      process.exit(1);
    }
  }

  // 1. Haversine distance accuracy
  // Republic Square (44.8154, 20.4607) to Kalemegdan (44.8236, 20.4504) is ~1.2 km
  const distKalemegdan = calculateDistanceKm(44.8154, 20.4607, 44.8236, 20.4504);
  assert(
    'LOC-01',
    'Haversine distance calculates accurate short distance in Belgrade center',
    distKalemegdan >= 1.0 && distKalemegdan <= 1.5,
    `Calculated: ${distKalemegdan} km`
  );

  // Republic Square to EXPO 2027 (44.7176, 20.2794) is ~18-20 km
  const distExpo = calculateDistanceKm(44.8154, 20.4607, 44.7176, 20.2794);
  assert(
    'LOC-02',
    'Haversine distance between Republic Square and EXPO site is ~18-20 km',
    distExpo >= 17 && distExpo <= 21,
    `Calculated: ${distExpo} km`
  );

  // 2. Taxi Fare calculation
  // Base start 270 RSD, 100 RSD/km
  const fareShort = calculateTaxiFare(5.0);
  // Estimated: 270 + 500 = 770 RSD
  assert(
    'LOC-03',
    'Taxi fare calculation follows Belgrade Tariff 1 (270 start + 100/km)',
    fareShort.rsdNum === 770 && fareShort.eurNum === Math.round(770 / 117),
    `Calculated 5km: ${fareShort.rsd} (${fareShort.eur})`
  );

  // 3. Default state is republic_square when no GPS active
  locationService.setSelectedHub('republic_square');
  const activeOrigin = locationService.getActiveOrigin();
  assert(
    'LOC-04',
    'Default active origin is Republic Square when GPS is inactive',
    activeOrigin.labelSr.includes('Trg Republike') && !activeOrigin.isLiveGps,
    `Origin: ${activeOrigin.labelSr}`
  );

  // 4. Switching to EXPO hub updates active origin
  locationService.setSelectedHub('expo_hub');
  const expoOrigin = locationService.getActiveOrigin();
  assert(
    'LOC-05',
    'Switching to expo_hub sets origin to EXPO 2027 complex',
    expoOrigin.labelSr.includes('EXPO 2027') && !expoOrigin.isLiveGps,
    `Origin: ${expoOrigin.labelSr}`
  );

  // 5. Dynamic Transit Recommendation heuristics
  // Close spot (< 1.5 km) gets 'walking'
  const closeTransit = locationService.calculateTransitTo({ lat: 44.7180, lng: 20.2800 }); // very close to EXPO
  assert(
    'LOC-06',
    'Close destinations (< 1.5 km from active hub) recommend walking mode',
    closeTransit.recommendedMode === 'walking' && closeTransit.walkingMins >= 2,
    `Mode: ${closeTransit.recommendedMode}, Walk: ${closeTransit.walkingMins}m`
  );

  // Moderate spot gets 'taxi'
  const modTransit = locationService.calculateTransitTo({ lat: 44.8154, lng: 20.4607 }); // Republic Square from EXPO (~18km)
  assert(
    'LOC-07',
    'City destinations between 1.5 km and 35 km recommend taxi mode',
    modTransit.recommendedMode === 'taxi' && modTransit.drivingMins >= 15,
    `Mode: ${modTransit.recommendedMode}, Drive: ${modTransit.drivingMins}m`
  );

  // 6. Geofence test: London (51.5074, -0.1278) to Belgrade is ~1700 km (> 180 km)
  const distLondon = calculateDistanceKm(44.8154, 20.4607, 51.5074, -0.1278);
  assert(
    'LOC-08',
    'Geofence correctly identifies distant coordinates as abroad (> 180 km)',
    distLondon > 1000,
    `Distance London-Belgrade: ${distLondon} km`
  );

  // Reset back to republic_square
  locationService.setSelectedHub('republic_square');

  console.log(`--- ALL ${passedCount}/${totalCount} LOCATION TESTS PASSED! ---`);
}

runLocationServiceTests();
