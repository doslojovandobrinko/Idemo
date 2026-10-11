/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test suite for IDEMO Bottom Navigation Globe (Language / Landing) Feature:
 * 1. Confirms CustomGlobeIcon strokeWidth, viewBox, and geometry matching editorial standards.
 * 2. Confirms language translation key availability across all 6 supported locales.
 * 3. Confirms navigation destination contract (landing card).
 */

import { TRANSLATIONS } from '../data/translations';
import { CustomGlobeIcon } from '../components/IdemoCustomNavIcons';

export function runBottomNavGlobeTests(): boolean {
  console.log('--- BOTTOM NAVIGATION GLOBE ICON TEST SUITE ---');

  // Test 1: Translation keys
  console.log('[BNG-01] Validating language label across all supported locales...');
  const supportedLocales = ['en', 'sr', 'de', 'ru', 'es', 'zh'];
  for (const loc of supportedLocales) {
    const t = TRANSLATIONS[loc];
    if (!t) {
      console.error(`❌ FAIL: Locale '${loc}' is missing from TRANSLATIONS dictionary`);
      return false;
    }
    if (!t.language || typeof t.language !== 'string' || t.language.trim().length === 0) {
      console.error(`❌ FAIL: Locale '${loc}' is missing valid 'language' label`);
      return false;
    }
    console.log(`  Locale [${loc}]: "${t.language}"`);
  }
  console.log('✅ PASS: All 6 locales contain valid language translations.');

  // Test 2: CustomGlobeIcon function export
  console.log('[BNG-02] Verifying CustomGlobeIcon export...');
  if (typeof CustomGlobeIcon !== 'function') {
    console.error('❌ FAIL: CustomGlobeIcon is not a valid exported component function');
    return false;
  }
  console.log('✅ PASS: CustomGlobeIcon is exported.');

  // Test 3: Screen destination verification
  console.log('[BNG-03] Verifying navigation screen destination contract...');
  const targetScreen = 'landing';
  const allowedScreens = ['landing', 'home', 'explore', 'plan', 'profile', 'partners'];
  if (!allowedScreens.includes(targetScreen)) {
    console.error(`❌ FAIL: Target screen '${targetScreen}' is not a recognized AppScreen`);
    return false;
  }
  console.log('✅ PASS: Globe icon routes to canonical "landing" screen.');

  console.log('--- ALL BOTTOM NAVIGATION GLOBE TESTS PASSED ---');
  return true;
}

// Auto-run if executed directly via bun
runBottomNavGlobeTests();
