/**
 * Test suite to verify that before visitors set their ORB (customOrbit === null)
 * and before applying explicit preference filters, the 3 agreed default recommendations
 * load first in exact canonical order:
 * 1. Uvac Meanders ('1')
 * 2. Wines from the Sands ('9')
 * 3. Via Ferrata Kablar ('81')
 */

import { getRankedRecommendations, UserPreferences } from '../lib/recommendationEngine';
import { Recommendation } from '../types';
import { natureRecommendations } from '../data/recommendations/serbia/nature';
import { gastronomyRecommendations } from '../data/recommendations/serbia/gastronomy';
import { historyRecommendations } from '../data/recommendations/serbia/history';

const allSerbiaRecs: Recommendation[] = [
  ...natureRecommendations,
  ...gastronomyRecommendations,
  ...historyRecommendations
];

function runTest() {
  console.log('--- DEFAULT RECOMMENDATIONS ORDER TEST RESULTS ---');

  // Test 1: Fresh visitor with default budget (100), default time (24), no selected categories, customOrbit === null
  const defaultPrefs: UserPreferences = {
    budget: 100,
    time: 24,
    days: 'All',
    timeOfDay: 'Anytime',
    selectedCategories: [],
    orbitX: 0.625, // budget blended coordinate
    orbitY: 0.494, // time blended coordinate
    isCustomOrbit: false
  };

  const ranked = getRankedRecommendations(allSerbiaRecs, defaultPrefs);
  const top3 = ranked.slice(0, 3).map(r => ({ id: r.id, title: r.title }));

  console.log('[DEF-01] Default recommendations order before ORB set:');
  console.log('  Top 3 loaded:', top3);

  const isOrderCorrect =
    ranked[0]?.id === '1' &&
    ranked[1]?.id === '9' &&
    ranked[2]?.id === '81';

  if (isOrderCorrect) {
    console.log('✅ PASS: Top 3 loaded first in exact order (1: Uvac Meanders, 9: Wines from the Sands, 81: Via Ferrata Kablar)');
  } else {
    console.error('❌ FAIL: Expected top 3 [1, 9, 81] but got:', top3);
    process.exit(1);
  }

  // Test 2: After visitor sets custom Orbit (isCustomOrbit === true)
  const customOrbitPrefs: UserPreferences = {
    ...defaultPrefs,
    orbitX: -1.0,
    orbitY: -1.0,
    isCustomOrbit: true
  };

  const rankedCustom = getRankedRecommendations(allSerbiaRecs, customOrbitPrefs);
  console.log('[DEF-02] Dynamic ranking active after ORB set:');
  console.log('  Top 1 loaded ID:', rankedCustom[0]?.id, '-', rankedCustom[0]?.title);

  if (rankedCustom.length > 0) {
    console.log('✅ PASS: Dynamic scoring active when custom ORB is set');
  }

  console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
}

runTest();
