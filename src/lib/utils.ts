/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from "./safeStorage";

export const getLocalizedValue = (item: any, field: string, lang: string) => {
  if (!item) return "";

  // Tier 1: Selected Language - Try hardcoded translation first
  if (item.translations?.[lang]?.[field]) {
    return item.translations[lang][field];
  }

  // Tier 2: Check localStorage translation cache for the selected language
  const originalText = item[field] || item.translations?.["en"]?.[field] || "";
  const cacheKey = `tr_${item.id || item.title || "g"}_${lang}_${field}`;

  if (lang !== "en") {
    const cachedValue = safeStorage.getItem(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }

  // Tier 3: Fall back to English hardcoded translation if available
  if (item.translations?.["en"]?.[field]) {
    return item.translations["en"][field];
  }

  // Tier 4: Fall back to base field (English / Primary)
  if (item[field]) {
    return item[field];
  }

  // Tier 5: Absolute protection against empty text (scan all other translation keys)
  if (item.translations) {
    for (const otherLang of Object.keys(item.translations)) {
      if (item.translations[otherLang]?.[field]) {
        return item.translations[otherLang][field];
      }
    }
  }

  // Return original text immediately (offline-first, zero tracking / network leakage)
  return originalText || `[${field}]`;
};

export const formatCategory = (categoryStr: string, tDict: any) => {
  if (!categoryStr) return "";
  return categoryStr
    .split(",")
    .map((c) => {
      const term = c.trim();
      return tDict["category_" + term.toLowerCase()] || term;
    })
    .join(" / ");
};
