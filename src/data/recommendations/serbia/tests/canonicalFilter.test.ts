import {
  INITIAL_RECOMMENDATIONS,
  EDITORIAL_IMPROVEMENT_IDS,
  ADDITIONAL_RESEARCH_IDS,
  DEFERRED_IDS,
  CANONICAL_EXPANSION_IDS,
} from "../index";
import {
  getCanonicalRecommendations,
  buildCanonicalSerbiaPackage,
} from "../../../../lib/destinationPackageManager";

export async function runCanonicalFilterValidation(): Promise<boolean> {
  console.log("=== STARTING CANONICAL FILTER AND INVENTORY VALIDATION ===");

  // 1. Verify total unique repository records
  const uniqueIds = new Set(INITIAL_RECOMMENDATIONS.map((r) => r.id));
  if (INITIAL_RECOMMENDATIONS.length !== 148 || uniqueIds.size !== 148) {
    console.error(
      `FAILED: Expected 148 unique records, got ${INITIAL_RECOMMENDATIONS.length} total, ${uniqueIds.size} unique.`,
    );
    return false;
  }
  console.log("✔ Proved 148 unique repository records exist");

  // 2. Verify Canonical vs Excluded counts
  const canonicalRecs = INITIAL_RECOMMENDATIONS.filter(
    (r) => r.publicationStatus === "CANONICAL",
  );
  const excludedRecs = INITIAL_RECOMMENDATIONS.filter(
    (r) => r.publicationStatus !== "CANONICAL",
  );

  if (canonicalRecs.length !== 135) {
    console.error(
      `FAILED: Expected 135 Canonical records, got ${canonicalRecs.length}`,
    );
    return false;
  }
  console.log("✔ Proved exactly 135 recommendations are Canonical");

  if (excludedRecs.length !== 13) {
    console.error(
      `FAILED: Expected 13 Excluded records, got ${excludedRecs.length}`,
    );
    return false;
  }
  console.log("✔ Proved exactly 13 recommendations are Excluded");

  // 3. Verify exact exclusion reasons for each excluded ID
  const expectedEditorialImp = new Set(["103", "109", "116", "126", "136"]);
  const expectedAddResearch = new Set(["117", "144"]);
  const expectedDeferred = new Set(["113", "125", "129", "132", "143", "147"]);

  for (const rec of excludedRecs) {
    if (expectedEditorialImp.has(rec.id)) {
      if (rec.publicationStatus !== "NEEDS_EDITORIAL_IMPROVEMENT") {
        console.error(
          `FAILED: ID ${rec.id} expected NEEDS_EDITORIAL_IMPROVEMENT, got ${rec.publicationStatus}`,
        );
        return false;
      }
    } else if (expectedAddResearch.has(rec.id)) {
      if (rec.publicationStatus !== "NEEDS_ADDITIONAL_RESEARCH") {
        console.error(
          `FAILED: ID ${rec.id} expected NEEDS_ADDITIONAL_RESEARCH, got ${rec.publicationStatus}`,
        );
        return false;
      }
    } else if (expectedDeferred.has(rec.id)) {
      if (rec.publicationStatus !== "DEFERRED") {
        console.error(
          `FAILED: ID ${rec.id} expected DEFERRED, got ${rec.publicationStatus}`,
        );
        return false;
      }
    } else {
      console.error(`FAILED: Unexpected excluded ID ${rec.id}`);
      return false;
    }
  }
  console.log("✔ Proved every excluded ID has the correct exclusion reason");

  // 4. Verify package generator filter
  const canonicalPackageRecs = getCanonicalRecommendations(
    INITIAL_RECOMMENDATIONS,
  );
  if (canonicalPackageRecs.length !== 135) {
    console.error(
      `FAILED: Package generator returned ${canonicalPackageRecs.length} items instead of 135`,
    );
    return false;
  }
  console.log("✔ Proved exactly 135 recommendations enter package generation");

  // 5. Verify no Canonical omitted & no non-canonical included
  const canonicalIdSet = new Set(canonicalRecs.map((r) => r.id));
  const packageIdSet = new Set(canonicalPackageRecs.map((r) => r.id));

  for (const id of canonicalIdSet) {
    if (!packageIdSet.has(id)) {
      console.error(`FAILED: Canonical ID ${id} omitted from package`);
      return false;
    }
  }

  for (const id of packageIdSet) {
    if (!canonicalIdSet.has(id)) {
      console.error(`FAILED: Non-canonical ID ${id} entered package`);
      return false;
    }
  }
  console.log(
    "✔ Proved no Canonical recommendation is omitted and no non-canonical enters the package",
  );

  // 6. Test actual buildCanonicalSerbiaPackage promise
  const pkg = await buildCanonicalSerbiaPackage();
  if (pkg.recommendations.length !== 135) {
    console.error(
      `FAILED: buildCanonicalSerbiaPackage returned ${pkg.recommendations.length} items`,
    );
    return false;
  }
  console.log(
    "✔ Proved buildCanonicalSerbiaPackage payload contains exactly 135 Canonical items",
  );

  console.log(
    "=== ALL CANONICAL FILTER VALIDATION CHECKS PASSED PERFECTLY ===",
  );
  return true;
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalFilterValidation().then((success) => {
    if (!success) process.exit(1);
  });
}
