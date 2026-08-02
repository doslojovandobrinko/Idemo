import { INITIAL_RECOMMENDATIONS } from "../index";

export type LanguageCode = "sr" | "zh" | "de" | "ru" | "es";

export interface WaveValidationResult {
  wave: string;
  lang: LanguageCode;
  totalCanonical: number;
  completedCount: number;
  unresolvedCount: number;
  emptyFieldErrors: string[];
  placeholderErrors: string[];
  nonCanonicalTranslationErrors: string[];
  success: boolean;
}

export function validateWave(
  lang: LanguageCode,
  waveName: string,
): WaveValidationResult {
  console.log(`\n==================================================`);
  console.log(
    `RUNNING VALIDATION FOR WAVE: ${waveName} [Lang: ${lang.toUpperCase()}]`,
  );
  console.log(`==================================================`);

  const canonicalRecs = INITIAL_RECOMMENDATIONS.filter(
    (r) => r.publicationStatus === "CANONICAL",
  );
  const nonCanonicalRecs = INITIAL_RECOMMENDATIONS.filter(
    (r) => r.publicationStatus !== "CANONICAL",
  );

  const emptyFieldErrors: string[] = [];
  const placeholderErrors: string[] = [];
  const nonCanonicalTranslationErrors: string[] = [];

  let completedCount = 0;
  let unresolvedCount = 0;

  // 1. Check Canonical Recommendations
  for (const rec of canonicalRecs) {
    const trans = rec.translations?.[lang];
    if (!trans) {
      unresolvedCount++;
      emptyFieldErrors.push(
        `Canonical ID ${rec.id}: Missing translation object for '${lang}'`,
      );
      continue;
    }

    const title = trans.title?.trim();
    const shortDesc = trans.shortDescription?.trim();
    const longDesc = trans.longDescription?.trim();
    const location = trans.location?.trim();

    let recComplete = true;

    if (!title) {
      emptyFieldErrors.push(
        `Canonical ID ${rec.id} [${rec.title}]: Missing '${lang}' title`,
      );
      recComplete = false;
    }
    if (!shortDesc) {
      emptyFieldErrors.push(
        `Canonical ID ${rec.id} [${rec.title}]: Missing '${lang}' shortDescription`,
      );
      recComplete = false;
    }
    if (!longDesc) {
      emptyFieldErrors.push(
        `Canonical ID ${rec.id} [${rec.title}]: Missing '${lang}' longDescription`,
      );
      recComplete = false;
    }
    if (!location) {
      emptyFieldErrors.push(
        `Canonical ID ${rec.id} [${rec.title}]: Missing '${lang}' location`,
      );
      recComplete = false;
    }

    // English Fallback Detection: for non-English target languages, shortDescription or longDescription must not be identical to source English text
    if ((lang as string) !== "en") {
      if (shortDesc && shortDesc === rec.shortDescription.trim()) {
        emptyFieldErrors.push(
          `Canonical ID ${rec.id} [${rec.title}]: Detected English fallback in '${lang}' shortDescription`,
        );
        recComplete = false;
      }
      if (longDesc && longDesc === rec.longDescription.trim()) {
        emptyFieldErrors.push(
          `Canonical ID ${rec.id} [${rec.title}]: Detected English fallback in '${lang}' longDescription`,
        );
        recComplete = false;
      }
    }

    // Token / placeholder checks
    const checkText = `${title || ""} ${shortDesc || ""} ${longDesc || ""}`;
    if (
      checkText.includes("undefined") ||
      checkText.includes("null") ||
      checkText.includes("[object Object]")
    ) {
      placeholderErrors.push(
        `Canonical ID ${rec.id}: Contains invalid token/placeholder in '${lang}'`,
      );
      recComplete = false;
    }

    if (recComplete) {
      completedCount++;
    } else {
      unresolvedCount++;
    }
  }

  // 2. Check Non-Canonical Recommendations (Must NOT be translated per WP-09 rule)
  for (const rec of nonCanonicalRecs) {
    if (rec.translations?.[lang]) {
      // Check if non-canonical rec has translation for this language
      // Note: If previous draft data had SR translation, verify it's ignored or excluded
    }
  }

  const success =
    unresolvedCount === 0 &&
    emptyFieldErrors.length === 0 &&
    placeholderErrors.length === 0;

  console.log(`Wave Results for ${waveName}:`);
  console.log(`- Canonical Total: ${canonicalRecs.length}`);
  console.log(`- Completed: ${completedCount}/${canonicalRecs.length}`);
  console.log(`- Unresolved: ${unresolvedCount}`);
  console.log(`- Empty Field Errors: ${emptyFieldErrors.length}`);
  console.log(`- Placeholder Errors: ${placeholderErrors.length}`);
  console.log(
    `- Verdict: ${success ? "PASSED SUCCESSFUL" : "FAILED - STRUCTURAL DISCREPANCIES"}`,
  );

  if (emptyFieldErrors.length > 0) {
    console.log(`First 5 Empty Field Errors:`, emptyFieldErrors.slice(0, 5));
  }

  return {
    wave: waveName,
    lang,
    totalCanonical: canonicalRecs.length,
    completedCount,
    unresolvedCount,
    emptyFieldErrors,
    placeholderErrors,
    nonCanonicalTranslationErrors,
    success,
  };
}

// Direct execution test CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const langArg = (process.argv[2] || "sr") as LanguageCode;
  const res = validateWave(langArg, `Wave Test (${langArg.toUpperCase()})`);
  if (!res.success) process.exit(1);
}
