/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, RecommendationLifecycleStatus } from "../../../types";
import { natureRecommendations } from "./nature";
import { historyRecommendations } from "./history";
import { gastronomyRecommendations } from "./gastronomy";
import { travelRecommendations } from "./travel";
import { wellbeingRecommendations } from "./wellbeing";
import { medicalRecommendations } from "./medical";
import { clubbingRecommendations } from "./clubbing";
import { draftExpansionPool } from "./draft_expansion";

import { CANONICAL_SERBIA_TRANSLATIONS } from "../../translations/serbia";

/**
 * Approved Canonical Serbia Baseline v2 Classification Sets (148 Total Inventory)
 * - 102 core baseline items (IDs 1-102) -> CANONICAL
 * - 33 promoted expansion items -> CANONICAL
 * - 5 retained items -> NEEDS_EDITORIAL_IMPROVEMENT
 * - 2 retained items -> NEEDS_ADDITIONAL_RESEARCH
 * - 6 retained items -> DEFERRED
 */
export const CANONICAL_EXPANSION_IDS = new Set<string>([
  "104",
  "105",
  "106",
  "107",
  "108",
  "110",
  "111",
  "112",
  "114",
  "115",
  "118",
  "119",
  "120",
  "121",
  "122",
  "123",
  "124",
  "127",
  "128",
  "130",
  "131",
  "133",
  "134",
  "135",
  "137",
  "138",
  "139",
  "140",
  "141",
  "142",
  "145",
  "146",
  "148",
]);

export const EDITORIAL_IMPROVEMENT_IDS = new Set<string>([
  "103",
  "109",
  "116",
  "126",
  "136",
]);
export const ADDITIONAL_RESEARCH_IDS = new Set<string>(["117", "144"]);
export const DEFERRED_IDS = new Set<string>([
  "113",
  "125",
  "129",
  "132",
  "143",
  "147",
]);

export function getRecommendationLifecycleStatus(
  id: string,
  existingStatus?: RecommendationLifecycleStatus,
): RecommendationLifecycleStatus {
  if (existingStatus) return existingStatus;
  const numId = Number(id);
  if (numId >= 1 && numId <= 102) return "CANONICAL";
  if (CANONICAL_EXPANSION_IDS.has(id)) return "CANONICAL";
  if (EDITORIAL_IMPROVEMENT_IDS.has(id)) return "NEEDS_EDITORIAL_IMPROVEMENT";
  if (ADDITIONAL_RESEARCH_IDS.has(id)) return "NEEDS_ADDITIONAL_RESEARCH";
  if (DEFERRED_IDS.has(id)) return "DEFERRED";
  return "RESEARCH_CANDIDATE";
}

const rawRecommendations: Recommendation[] = [
  ...natureRecommendations,
  ...historyRecommendations,
  ...gastronomyRecommendations,
  ...travelRecommendations,
  ...wellbeingRecommendations,
  ...medicalRecommendations,
  ...clubbingRecommendations,
  ...draftExpansionPool,
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = rawRecommendations.map(
  (rec) => {
    const status = getRecommendationLifecycleStatus(
      rec.id,
      rec.publicationStatus,
    );
    const isCanonical = status === "CANONICAL";

    const translations = { ...(rec.translations || {}) };
    if (isCanonical && CANONICAL_SERBIA_TRANSLATIONS) {
      for (const lang of ["sr", "zh", "de", "ru", "es"]) {
        const langData = CANONICAL_SERBIA_TRANSLATIONS[lang]?.[rec.id];
        if (langData) {
          translations[lang] = {
            ...translations[lang],
            ...langData,
          };
        }
      }
    }

    return {
      ...rec,
      publicationStatus: status,
      translations:
        Object.keys(translations).length > 0 ? translations : undefined,
    };
  },
);
