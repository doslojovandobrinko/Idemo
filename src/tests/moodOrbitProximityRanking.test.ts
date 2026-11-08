import { describe, it } from 'node:test';
import assert from 'node:assert';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia/index';
import { getRankedRecommendations, UserPreferences } from '../lib/recommendationEngine';
import { Recommendation } from '../types';

describe('Mood Orbit 2D Field & Spatial Proximity Invariants', () => {
  it('Invariant 1: All recommendations have authentic non-zero 2D coordinates', () => {
    assert.ok(INITIAL_RECOMMENDATIONS.length >= 190, `Expected at least 190 items, got ${INITIAL_RECOMMENDATIONS.length}`);

    const zeroOrMissingCoordinates: string[] = [];
    for (const rec of INITIAL_RECOMMENDATIONS) {
      if (
        typeof rec.coordinateX !== 'number' ||
        typeof rec.coordinateY !== 'number' ||
        isNaN(rec.coordinateX) ||
        isNaN(rec.coordinateY)
      ) {
        zeroOrMissingCoordinates.push(`${rec.id} (${rec.title}): missing/NaN`);
      } else if (rec.coordinateX === 0 && rec.coordinateY === 0) {
        zeroOrMissingCoordinates.push(`${rec.id} (${rec.title}): dead center (0, 0)`);
      }
    }

    assert.strictEqual(
      zeroOrMissingCoordinates.length,
      0,
      `Found recommendations clustering in the center (0, 0) or missing coordinates: ${zeroOrMissingCoordinates.join(', ')}`
    );
  });

  it('Invariant 2: When visitor sets custom mood orb, recommendation ranking strictly prioritizes closest matches', () => {
    // Target 2D coordinates in recommendation space: (targetX = 3.5, targetY = -4.0)
    // In normalized orbit coordinates ([0, 1]):
    // targetX = (orbitX - 0.5) * 10 => orbitX = 3.5 / 10 + 0.5 = 0.85
    // targetY = (0.5 - orbitY) * 10 => orbitY = 0.5 - (-4.0 / 10) = 0.90
    const targetX = 3.5;
    const targetY = -4.0;
    const customPrefsA: UserPreferences = {
      budget: 100,
      time: 24,
      days: 'All',
      timeOfDay: 'Anytime',
      selectedCategories: [],
      orbitX: 0.85,
      orbitY: 0.90,
      isCustomOrbit: true,
    };

    const rankedA = getRankedRecommendations(INITIAL_RECOMMENDATIONS, customPrefsA);
    assert.ok(rankedA.length > 5, 'Should rank all recommendations');

    // Calculate Euclidean distance to target for the top 5
    const distancesA = rankedA.slice(0, 5).map((rec: Recommendation) => {
      const dx = (rec.coordinateX ?? 0) - targetX;
      const dy = (rec.coordinateY ?? 0) - targetY;
      return Math.sqrt(dx * dx + dy * dy);
    });

    // Top recommendations should be very close to (3.5, -4.0), within distance <= 2.8
    for (let i = 0; i < distancesA.length; i++) {
      assert.ok(
        distancesA[i] <= 2.8,
        `Top item #${i + 1} (${rankedA[i].title}) has distance ${distancesA[i].toFixed(2)}, expected <= 2.8 from target (${targetX}, ${targetY})`
      );
    }

    // Verify distance monotonicity for top matches (closest matches first)
    for (let i = 0; i < distancesA.length - 1; i++) {
      // Due to subtle situational factors, allow up to small epsilon (0.75 distance tolerance)
      assert.ok(
        distancesA[i] <= distancesA[i + 1] + 0.75,
        `Distance inversion detected: rank ${i + 1} (${distancesA[i].toFixed(2)}) is much further than rank ${i + 2} (${distancesA[i + 1].toFixed(2)})`
      );
    }
  });

  it('Invariant 3: Calibrated custom orbit in Top-Left (Introspective, Cultural, Quiet) prioritizes quiet cultural recommendations', () => {
    // Target in 2D space: (-3.0, 3.0)
    // orbitX = -3.0 / 10 + 0.5 = 0.20
    // orbitY = 0.5 - (3.0 / 10) = 0.20
    const targetX = -3.0;
    const targetY = 3.0;
    const customPrefsB: UserPreferences = {
      budget: 100,
      time: 24,
      days: 'All',
      timeOfDay: 'Anytime',
      selectedCategories: [],
      orbitX: 0.20,
      orbitY: 0.20,
      isCustomOrbit: true,
    };

    const rankedB = getRankedRecommendations(INITIAL_RECOMMENDATIONS, customPrefsB);
    const topRec = rankedB[0];
    const dx = (topRec.coordinateX ?? 0) - targetX;
    const dy = (topRec.coordinateY ?? 0) - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    assert.ok(
      dist <= 2.5,
      `Top match (${topRec.title}) distance ${dist.toFixed(2)} should be <= 2.5 from target (${targetX}, ${targetY})`
    );
  });

  it('Invariant 4: Default uncalibrated visitor maintains pinned master benchmark [1, 12, 9]', () => {
    const defaultPrefs: UserPreferences = {
      budget: 100,
      time: 24,
      days: 'All',
      timeOfDay: 'Anytime',
      selectedCategories: [],
      orbitX: 0.625,
      orbitY: 0.494,
      isCustomOrbit: false,
    };

    const rankedDefault = getRankedRecommendations(INITIAL_RECOMMENDATIONS, defaultPrefs);
    const top3Ids = rankedDefault.slice(0, 3).map((r: Recommendation) => r.id);

    assert.deepStrictEqual(
      top3Ids,
      ['1', '12', '9'],
      `Default visitor must maintain pinned benchmark [1: Uvac, 12: Banjska Stena, 9: Wines from the Sands]. Got: ${JSON.stringify(top3Ids)}`
    );
  });
});
