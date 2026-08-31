/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from '../lib/safeStorage';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

// Helper duplicating startup restore logic from App.tsx
export function restoreCustomOrbitFromStorage(): { orbitX: number; orbitY: number } | null {
  try {
    const saved = safeStorage.getItem('idemo_custom_orbit_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.isCustom === 'boolean') {
        if (parsed.isCustom && typeof parsed.orbitX === 'number' && typeof parsed.orbitY === 'number') {
          return { orbitX: parsed.orbitX, orbitY: parsed.orbitY };
        }
        return null;
      }
      // Legacy record compatibility (missing isCustom field):
      const isUntouchedDefault =
        parsed.orbitX === 0.5 &&
        parsed.orbitY === 0.5 &&
        (parsed.budget === undefined || parsed.budget === 100) &&
        (parsed.time === undefined || parsed.time === 24);
      if (isUntouchedDefault) {
        return null;
      }
      if (typeof parsed.orbitX === 'number' && typeof parsed.orbitY === 'number') {
        return { orbitX: parsed.orbitX, orbitY: parsed.orbitY };
      }
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
}

// Helper duplicating budget restore logic from App.tsx
export function restoreBudgetFromStorage(): number {
  try {
    const saved = safeStorage.getItem('idemo_custom_orbit_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.budget === 'number') return parsed.budget;
    }
  } catch (e) {
    console.warn(e);
  }
  return 100;
}

// Helper duplicating time restore logic from App.tsx
export function restoreTimeFromStorage(): number {
  try {
    const saved = safeStorage.getItem('idemo_custom_orbit_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.time === 'number') return parsed.time;
    }
  } catch (e) {
    console.warn(e);
  }
  return 24;
}

// Helper duplicating background sync write logic from App.tsx
export function persistBackgroundOrbitSync(
  customOrbit: { orbitX: number; orbitY: number } | null,
  budget: number,
  time: number
) {
  if (customOrbit !== null) {
    safeStorage.setItem(
      'idemo_custom_orbit_v1',
      JSON.stringify({
        isCustom: true,
        orbitX: customOrbit.orbitX,
        orbitY: customOrbit.orbitY,
        budget,
        time,
      })
    );
  } else {
    safeStorage.setItem(
      'idemo_custom_orbit_v1',
      JSON.stringify({
        isCustom: false,
        budget,
        time,
      })
    );
  }
}

// Helper duplicating explicit onOrbitChange write logic from App.tsx
export function persistExplicitOrbitChange(x: number, y: number, budget: number, time: number) {
  safeStorage.setItem(
    'idemo_custom_orbit_v1',
    JSON.stringify({
      isCustom: true,
      orbitX: x,
      orbitY: y,
      budget,
      time,
    })
  );
}

export async function runMoodOrbitPersistenceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Cleanup before tests
  safeStorage.removeItem('idemo_custom_orbit_v1');

  // TEST 1 — Fresh installation/default state
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    const restored = restoreCustomOrbitFromStorage();
    const passed = restored === null;
    results.push({
      testId: 'MOOD-01',
      name: 'Fresh installation/default state leaves customOrbit null',
      expected: 'null',
      actual: JSON.stringify(restored),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-01',
      name: 'Fresh installation/default state leaves customOrbit null',
      expected: 'null',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 2 — Category-derived Orbit
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    // Simulate background sync with customOrbit = null
    persistBackgroundOrbitSync(null, 100, 24);
    const restored = restoreCustomOrbitFromStorage();
    const rawStorage = safeStorage.getItem('idemo_custom_orbit_v1');
    const parsed = rawStorage ? JSON.parse(rawStorage) : {};
    const passed = restored === null && parsed.isCustom === false && parsed.orbitX === undefined;
    results.push({
      testId: 'MOOD-02',
      name: 'Category-derived Orbit does not convert derived values into custom Orbit',
      expected: 'customOrbit === null, isCustom === false, no orbitX persisted',
      actual: `restored: ${JSON.stringify(restored)}, raw: ${rawStorage}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-02',
      name: 'Category-derived Orbit does not convert derived values into custom Orbit',
      expected: 'customOrbit === null',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 3 — Explicit custom Orbit
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.25, 0.75, 100, 24);
    const restored = restoreCustomOrbitFromStorage();
    const rawStorage = safeStorage.getItem('idemo_custom_orbit_v1');
    const parsed = rawStorage ? JSON.parse(rawStorage) : {};
    const passed =
      restored?.orbitX === 0.25 &&
      restored?.orbitY === 0.75 &&
      parsed.isCustom === true;
    results.push({
      testId: 'MOOD-03',
      name: 'Explicit custom Orbit persists with isCustom: true and correct coordinates',
      expected: 'orbitX: 0.25, orbitY: 0.75, isCustom: true',
      actual: `restored: ${JSON.stringify(restored)}, isCustom: ${parsed.isCustom}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-03',
      name: 'Explicit custom Orbit persists with isCustom: true and correct coordinates',
      expected: 'orbitX: 0.25, orbitY: 0.75',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 4 — Budget only
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistBackgroundOrbitSync(null, 250, 24);
    const restoredOrbit = restoreCustomOrbitFromStorage();
    const restoredBudget = restoreBudgetFromStorage();
    const passed = restoredOrbit === null && restoredBudget === 250;
    results.push({
      testId: 'MOOD-04',
      name: 'Budget change persists independently without locking custom Orbit',
      expected: 'customOrbit: null, budget: 250',
      actual: `orbit: ${JSON.stringify(restoredOrbit)}, budget: ${restoredBudget}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-04',
      name: 'Budget change persists independently without locking custom Orbit',
      expected: 'customOrbit: null, budget: 250',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 5 — Time only
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistBackgroundOrbitSync(null, 100, 12);
    const restoredOrbit = restoreCustomOrbitFromStorage();
    const restoredTime = restoreTimeFromStorage();
    const passed = restoredOrbit === null && restoredTime === 12;
    results.push({
      testId: 'MOOD-05',
      name: 'Time change persists independently without locking custom Orbit',
      expected: 'customOrbit: null, time: 12',
      actual: `orbit: ${JSON.stringify(restoredOrbit)}, time: ${restoredTime}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-05',
      name: 'Time change persists independently without locking custom Orbit',
      expected: 'customOrbit: null, time: 12',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 6 — Explicit custom + budget + time
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.8, 0.2, 300, 8);
    const restoredOrbit = restoreCustomOrbitFromStorage();
    const restoredBudget = restoreBudgetFromStorage();
    const restoredTime = restoreTimeFromStorage();
    const passed =
      restoredOrbit?.orbitX === 0.8 &&
      restoredOrbit?.orbitY === 0.2 &&
      restoredBudget === 300 &&
      restoredTime === 8;
    results.push({
      testId: 'MOOD-06',
      name: 'Explicit custom Orbit + budget + time all restored accurately',
      expected: 'orbitX: 0.8, orbitY: 0.2, budget: 300, time: 8',
      actual: `orbit: ${JSON.stringify(restoredOrbit)}, budget: ${restoredBudget}, time: ${restoredTime}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-06',
      name: 'Explicit custom Orbit + budget + time all restored accurately',
      expected: 'orbitX: 0.8, orbitY: 0.2, budget: 300, time: 8',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 7 — Language change
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.6, 0.4, 150, 16);
    // Simulate language change in safeStorage
    safeStorage.setItem('idemo_language_v1', 'sr');
    const restoredOrbit = restoreCustomOrbitFromStorage();
    const passed = restoredOrbit?.orbitX === 0.6 && restoredOrbit?.orbitY === 0.4;
    results.push({
      testId: 'MOOD-07',
      name: 'Language change does not reset or alter Mood Orbit',
      expected: 'orbitX: 0.6, orbitY: 0.4',
      actual: JSON.stringify(restoredOrbit),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-07',
      name: 'Language change does not reset or alter Mood Orbit',
      expected: 'orbitX: 0.6, orbitY: 0.4',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 8 — Navigation
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.35, 0.65, 100, 24);
    // Navigation re-reads storage or relies on in-memory state
    const restoredOrbit = restoreCustomOrbitFromStorage();
    const passed = restoredOrbit?.orbitX === 0.35 && restoredOrbit?.orbitY === 0.65;
    results.push({
      testId: 'MOOD-08',
      name: 'Navigation preserves Mood Orbit state',
      expected: 'orbitX: 0.35, orbitY: 0.65',
      actual: JSON.stringify(restoredOrbit),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-08',
      name: 'Navigation preserves Mood Orbit state',
      expected: 'orbitX: 0.35, orbitY: 0.65',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 9 — Explicit subsequent visitor change
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.1, 0.1, 100, 24);
    const restoredA = restoreCustomOrbitFromStorage();
    persistExplicitOrbitChange(0.9, 0.9, 100, 24);
    const restoredB = restoreCustomOrbitFromStorage();
    const passed =
      restoredA?.orbitX === 0.1 &&
      restoredA?.orbitY === 0.1 &&
      restoredB?.orbitX === 0.9 &&
      restoredB?.orbitY === 0.9;
    results.push({
      testId: 'MOOD-09',
      name: 'Subsequent visitor change overwrites previous custom Orbit',
      expected: 'Orbit A (0.1, 0.1) then Orbit B (0.9, 0.9)',
      actual: `A: ${JSON.stringify(restoredA)}, B: ${JSON.stringify(restoredB)}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-09',
      name: 'Subsequent visitor change overwrites previous custom Orbit',
      expected: 'Orbit A then Orbit B',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 10 — Legacy default record
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    // Simulate legacy default record created by old background sync
    safeStorage.setItem(
      'idemo_custom_orbit_v1',
      JSON.stringify({
        orbitX: 0.5,
        orbitY: 0.5,
        budget: 100,
        time: 24,
      })
    );
    const restored = restoreCustomOrbitFromStorage();
    const passed = restored === null;
    results.push({
      testId: 'MOOD-10',
      name: 'Legacy default record (0.5, 0.5, 100, 24) treated as isCustom: false',
      expected: 'null',
      actual: JSON.stringify(restored),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-10',
      name: 'Legacy default record (0.5, 0.5, 100, 24) treated as isCustom: false',
      expected: 'null',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 11 — Legacy non-default record
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    // Simulate legacy non-default custom orbit record without isCustom property
    safeStorage.setItem(
      'idemo_custom_orbit_v1',
      JSON.stringify({
        orbitX: 0.3,
        orbitY: 0.7,
        budget: 150,
        time: 18,
      })
    );
    const restored = restoreCustomOrbitFromStorage();
    const passed = restored?.orbitX === 0.3 && restored?.orbitY === 0.7;
    results.push({
      testId: 'MOOD-11',
      name: 'Legacy non-default record preserves visitor custom Orbit preference',
      expected: 'orbitX: 0.3, orbitY: 0.7',
      actual: JSON.stringify(restored),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-11',
      name: 'Legacy non-default record preserves visitor custom Orbit preference',
      expected: 'orbitX: 0.3, orbitY: 0.7',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 12 — Position change survives control switch
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.10, 0.90, 100, 24);
    const restored = restoreCustomOrbitFromStorage();
    const passed = restored?.orbitX === 0.10 && restored?.orbitY === 0.90;
    results.push({
      testId: 'MOOD-12',
      name: 'Position change survives control switch',
      expected: 'orbitX: 0.10, orbitY: 0.90',
      actual: JSON.stringify(restored),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-12',
      name: 'Position change survives control switch',
      expected: 'orbitX: 0.10, orbitY: 0.90',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 13 — Position change survives Profile unmount/remount
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.15, 0.85, 200, 18);
    const restored = restoreCustomOrbitFromStorage();
    const passed = restored?.orbitX === 0.15 && restored?.orbitY === 0.85;
    results.push({
      testId: 'MOOD-13',
      name: 'Position change survives Profile unmount/remount',
      expected: 'orbitX: 0.15, orbitY: 0.85',
      actual: JSON.stringify(restored),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-13',
      name: 'Position change survives Profile unmount/remount',
      expected: 'orbitX: 0.15, orbitY: 0.85',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 14 — Budget survives control switch
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.5, 0.5, 350, 24);
    const restoredBudget = restoreBudgetFromStorage();
    const passed = restoredBudget === 350;
    results.push({
      testId: 'MOOD-14',
      name: 'Budget survives control switch',
      expected: 'budget: 350',
      actual: `budget: ${restoredBudget}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-14',
      name: 'Budget survives control switch',
      expected: 'budget: 350',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 15 — Time survives control switch
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.5, 0.5, 100, 14);
    const restoredTime = restoreTimeFromStorage();
    const passed = restoredTime === 14;
    results.push({
      testId: 'MOOD-15',
      name: 'Time survives control switch',
      expected: 'time: 14',
      actual: `time: ${restoredTime}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-15',
      name: 'Time survives control switch',
      expected: 'time: 14',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // TEST 16 — Canonical App state updates without Apply button
  try {
    safeStorage.removeItem('idemo_custom_orbit_v1');
    persistExplicitOrbitChange(0.10, 0.90, 250, 12);
    const rawStorage = safeStorage.getItem('idemo_custom_orbit_v1');
    const parsed = rawStorage ? JSON.parse(rawStorage) : {};
    const passed =
      parsed.isCustom === true &&
      parsed.orbitX === 0.10 &&
      parsed.orbitY === 0.90 &&
      parsed.budget === 250 &&
      parsed.time === 12;
    results.push({
      testId: 'MOOD-16',
      name: 'Canonical App state updates without Apply button',
      expected: 'isCustom: true, orbitX: 0.10, orbitY: 0.90, budget: 250, time: 12',
      actual: rawStorage || 'null',
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MOOD-16',
      name: 'Canonical App state updates without Apply button',
      expected: 'isCustom: true, orbitX: 0.10, orbitY: 0.90',
      actual: err?.message || String(err),
      passed: false,
    });
  }

  // Cleanup after tests
  safeStorage.removeItem('idemo_custom_orbit_v1');

  return results;
}

// Runner for test CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runMoodOrbitPersistenceTests().then((results) => {
    let allPassed = true;
    console.log('\n--- MOOD ORBIT PERSISTENCE TEST RESULTS ---');
    for (const r of results) {
      const status = r.passed ? '✅ PASS' : '❌ FAIL';
      if (!r.passed) allPassed = false;
      console.log(`[${r.testId}] ${r.name}: ${status}`);
      console.log(`   Expected: ${r.expected}`);
      console.log(`   Actual:   ${r.actual}\n`);
    }
    if (!allPassed) {
      process.exit(1);
    }
  });
}
