import { INITIAL_RECOMMENDATIONS } from '../index';
import { getCanonicalRecommendations, buildCanonicalSerbiaPackage } from '../../../../lib/destinationPackageManager';

export async function runCanonicalFilterValidation(): Promise<boolean> {
  console.log('=== STARTING 192-RECOMMENDATION CATALOGUE RELEASE VALIDATION ===');

  // 1. Verify total unique repository records
  const uniqueIds = new Set(INITIAL_RECOMMENDATIONS.map(r => r.id));
  if (INITIAL_RECOMMENDATIONS.length !== 192 || uniqueIds.size !== 192) {
    console.error(`FAILED: Expected 192 unique records, got ${INITIAL_RECOMMENDATIONS.length} total, ${uniqueIds.size} unique.`);
    return false;
  }
  console.log('✔ Proved 192 unique repository records exist');

  // 2. Verify all mapped recommendations enter package generation
  const canonicalPackageRecs = getCanonicalRecommendations(INITIAL_RECOMMENDATIONS);
  if (canonicalPackageRecs.length !== 192) {
    console.error(`FAILED: Package generator returned ${canonicalPackageRecs.length} items instead of 192`);
    return false;
  }
  console.log('✔ Proved exactly 192 recommendations enter package generation');

  // 3. Test actual buildCanonicalSerbiaPackage promise
  const pkg = await buildCanonicalSerbiaPackage();
  if (pkg.recommendations.length !== 192) {
    console.error(`FAILED: buildCanonicalSerbiaPackage returned ${pkg.recommendations.length} items instead of 192`);
    return false;
  }
  console.log('✔ Proved buildCanonicalSerbiaPackage payload contains exactly 192 items');

  console.log('=== ALL 192-RECOMMENDATION CATALOGUE RELEASE VALIDATION CHECKS PASSED PERFECTLY ===');
  return true;
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalFilterValidation().then(success => {
    if (!success) process.exit(1);
  });
}
