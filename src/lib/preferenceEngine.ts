/**
 * IDEMO - Invisible Local Preference Engine (LPE)
 * -------------------------------------------------------------
 * Architected for complete on-device client-side learning.
 * Absolutely 100% private. No cloud, no analytics, no network tracking.
 *
 * This engine tracks implicit and explicit signals to build a high-fidelity
 * interest profile. It maps user activities to categories, locations, tags,
 * and individual item affinity scores.
 */

import { Recommendation } from "../types";
import { safeStorage } from "./safeStorage";

export interface LocalPreferenceProfile {
  // Direct affinity scores for specific recommendation IDs
  itemAffinities: Record<string, number>;

  // Affinity scores for categories (e.g., "Gastronomy", "Nature")
  categoryAffinities: Record<string, number>;

  // Affinity scores for tags (e.g., "fine-dining", "outdoor", "byzantine")
  tagAffinities: Record<string, number>;

  // Historical logs of interactions (capped for performance and storage)
  history: Array<{
    timestamp: string;
    type:
      | "favorite"
      | "search"
      | "category_view"
      | "qr_scan"
      | "map_open"
      | "calendar_export"
      | "view_details";
    targetId?: string;
    details?: string;
  }>;

  // Past search terms used
  searchTerms: string[];
}

const LOCAL_STORAGE_KEY = "idemo_local_preference_profile_v1";

// Interaction Signal Weights
export const SIGNAL_WEIGHTS = {
  FAVORITE_ADD: 60, // Explicit strong positive signal
  FAVORITE_REMOVE: -20, // Correction signal
  QR_SCAN: 50, // High intent physical interaction
  CALENDAR_EXPORT: 45, // Action demonstrating planning intent
  MAP_OPEN: 40, // Navigation intent
  SEARCH_MATCH: 30, // Text relevance matching
  CATEGORY_VIEW: 15, // Direct browsing filter selection
  VIEW_DETAILS: 10, // Micro-view engagement
};

// Category Propagation Weights (When an action is taken on an item, we boost its category)
export const PROPAGATION_WEIGHTS = {
  FAVORITE: 15,
  QR_SCAN: 12,
  CALENDAR_EXPORT: 10,
  MAP_OPEN: 8,
  SEARCH: 6,
  VIEW_DETAILS: 3,
};

const DEFAULT_PROFILE: LocalPreferenceProfile = {
  itemAffinities: {},
  categoryAffinities: {},
  tagAffinities: {},
  history: [],
  searchTerms: [],
};

/**
 * Loads the active preference profile from localStorage
 */
export function getPreferenceProfile(): LocalPreferenceProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const data = safeStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        itemAffinities: parsed.itemAffinities || {},
        categoryAffinities: parsed.categoryAffinities || {},
        tagAffinities: parsed.tagAffinities || {},
        history: parsed.history || [],
        searchTerms: parsed.searchTerms || [],
      };
    }
  } catch (e) {
    console.warn("Failed to load on-device preference profile:", e);
  }
  return { ...DEFAULT_PROFILE };
}

/**
 * Saves the preference profile to local device storage
 */
export function savePreferenceProfile(profile: LocalPreferenceProfile) {
  if (typeof window === "undefined") return;
  try {
    // Keep history capped at 150 items to optimize memory/perf
    if (profile.history.length > 150) {
      profile.history = profile.history.slice(profile.history.length - 150);
    }
    // Keep search terms capped to 30 items
    if (profile.searchTerms.length > 30) {
      profile.searchTerms = profile.searchTerms.slice(
        profile.searchTerms.length - 30,
      );
    }
    safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to save preference profile to local device:", e);
  }
}

/**
 * Helper to parse a recommendation's categories and tags
 */
function extractRecAttributes(rec: Recommendation) {
  const categories =
    typeof rec.category === "string"
      ? rec.category.split(",").map((s) => s.trim())
      : [rec.category];

  const tags: string[] = [];
  const anyRec = rec as any;
  if (anyRec.tags && Array.isArray(anyRec.tags)) {
    tags.push(...anyRec.tags);
  }
  // Extract keywords from descriptions if no tags exist
  const keywordsText =
    `${rec.title} ${rec.shortDescription} ${rec.longDescription}`.toLowerCase();
  const candidateTags = [
    "exclusive",
    "authentic",
    "relaxing",
    "adventure",
    "historic",
    "romantic",
    "traditional",
    "viewpoint",
    "gourmet",
    "waterfront",
    "nature",
  ];
  candidateTags.forEach((t) => {
    if (keywordsText.includes(t)) {
      tags.push(t);
    }
  });

  return { categories, tags };
}

/**
 * Dynamic Decay Function:
 * To prevent old interactions from permanently freezing the recommendation deck,
 * we occasionally decay scores slightly toward zero.
 */
export function decayPreferenceScores(
  profile: LocalPreferenceProfile,
  factor = 0.95,
): LocalPreferenceProfile {
  const updated = { ...profile };

  // Decay items
  for (const key in updated.itemAffinities) {
    updated.itemAffinities[key] = parseFloat(
      (updated.itemAffinities[key] * factor).toFixed(2),
    );
    if (updated.itemAffinities[key] < 0.1) delete updated.itemAffinities[key];
  }

  // Decay categories
  for (const key in updated.categoryAffinities) {
    updated.categoryAffinities[key] = parseFloat(
      (updated.categoryAffinities[key] * factor).toFixed(2),
    );
    if (updated.categoryAffinities[key] < 0.1)
      delete updated.categoryAffinities[key];
  }

  // Decay tags
  for (const key in updated.tagAffinities) {
    updated.tagAffinities[key] = parseFloat(
      (updated.tagAffinities[key] * factor).toFixed(2),
    );
    if (updated.tagAffinities[key] < 0.1) delete updated.tagAffinities[key];
  }

  return updated;
}

/**
 * 1. Learn from Saved/Favorited Places
 */
export function trackFavoriteSignal(rec: Recommendation, isSaved: boolean) {
  const profile = getPreferenceProfile();
  const { categories, tags } = extractRecAttributes(rec);

  const itemId = rec.id;
  const weight = isSaved
    ? SIGNAL_WEIGHTS.FAVORITE_ADD
    : SIGNAL_WEIGHTS.FAVORITE_REMOVE;
  const propWeight = isSaved
    ? PROPAGATION_WEIGHTS.FAVORITE
    : -PROPAGATION_WEIGHTS.FAVORITE / 2;

  profile.itemAffinities[itemId] =
    (profile.itemAffinities[itemId] || 0) + weight;

  categories.forEach((cat) => {
    profile.categoryAffinities[cat] =
      (profile.categoryAffinities[cat] || 0) + propWeight;
  });

  tags.forEach((tag) => {
    profile.tagAffinities[tag] = (profile.tagAffinities[tag] || 0) + propWeight;
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "favorite",
    targetId: itemId,
    details: isSaved ? "Added to Saved Places" : "Removed from Saved Places",
  });

  savePreferenceProfile(profile);
}

/**
 * 2. Learn from Search Queries (Filter keywords)
 */
export function trackSearchSignal(query: string, allRecs: Recommendation[]) {
  if (!query || query.trim().length < 2) return;

  const cleanQuery = query.trim().toLowerCase();
  const profile = getPreferenceProfile();

  if (!profile.searchTerms.includes(cleanQuery)) {
    profile.searchTerms.push(cleanQuery);
  }

  // Find recommendations that match this search query text
  allRecs.forEach((rec) => {
    const searchText =
      `${rec.title} ${rec.shortDescription} ${rec.longDescription} ${rec.category} ${rec.location}`.toLowerCase();
    if (searchText.includes(cleanQuery)) {
      // Direct item boost
      profile.itemAffinities[rec.id] =
        (profile.itemAffinities[rec.id] || 0) + SIGNAL_WEIGHTS.SEARCH_MATCH;

      const { categories, tags } = extractRecAttributes(rec);
      categories.forEach((cat) => {
        profile.categoryAffinities[cat] =
          (profile.categoryAffinities[cat] || 0) + PROPAGATION_WEIGHTS.SEARCH;
      });
      tags.forEach((tag) => {
        profile.tagAffinities[tag] =
          (profile.tagAffinities[tag] || 0) + PROPAGATION_WEIGHTS.SEARCH;
      });
    }
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "search",
    details: `Search term: ${query}`,
  });

  savePreferenceProfile(decayPreferenceScores(profile, 0.99)); // minor decay on search to refresh topics
}

/**
 * 3. Learn from Categories Viewed / Toggled
 */
export function trackCategoryViewSignal(category: string) {
  if (!category) return;
  const profile = getPreferenceProfile();

  profile.categoryAffinities[category] =
    (profile.categoryAffinities[category] || 0) + SIGNAL_WEIGHTS.CATEGORY_VIEW;

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "category_view",
    details: `Category: ${category}`,
  });

  savePreferenceProfile(profile);
}

/**
 * 4. Learn from QR Scans
 */
export function trackQRScanSignal(rec: Recommendation) {
  const profile = getPreferenceProfile();
  const { categories, tags } = extractRecAttributes(rec);

  profile.itemAffinities[rec.id] =
    (profile.itemAffinities[rec.id] || 0) + SIGNAL_WEIGHTS.QR_SCAN;

  categories.forEach((cat) => {
    profile.categoryAffinities[cat] =
      (profile.categoryAffinities[cat] || 0) + PROPAGATION_WEIGHTS.QR_SCAN;
  });

  tags.forEach((tag) => {
    profile.tagAffinities[tag] =
      (profile.tagAffinities[tag] || 0) + PROPAGATION_WEIGHTS.QR_SCAN;
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "qr_scan",
    targetId: rec.id,
    details: `QR Code scanned for: ${rec.title}`,
  });

  savePreferenceProfile(profile);
}

/**
 * 5. Learn from Map Openings
 */
export function trackMapOpenSignal(rec: Recommendation) {
  const profile = getPreferenceProfile();
  const { categories, tags } = extractRecAttributes(rec);

  profile.itemAffinities[rec.id] =
    (profile.itemAffinities[rec.id] || 0) + SIGNAL_WEIGHTS.MAP_OPEN;

  categories.forEach((cat) => {
    profile.categoryAffinities[cat] =
      (profile.categoryAffinities[cat] || 0) + PROPAGATION_WEIGHTS.MAP_OPEN;
  });

  tags.forEach((tag) => {
    profile.tagAffinities[tag] =
      (profile.tagAffinities[tag] || 0) + PROPAGATION_WEIGHTS.MAP_OPEN;
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "map_open",
    targetId: rec.id,
    details: `Map opened for: ${rec.title}`,
  });

  savePreferenceProfile(profile);
}

/**
 * 6. Learn from Calendar Exports
 */
export function trackCalendarExportSignal(rec: Recommendation) {
  const profile = getPreferenceProfile();
  const { categories, tags } = extractRecAttributes(rec);

  profile.itemAffinities[rec.id] =
    (profile.itemAffinities[rec.id] || 0) + SIGNAL_WEIGHTS.CALENDAR_EXPORT;

  categories.forEach((cat) => {
    profile.categoryAffinities[cat] =
      (profile.categoryAffinities[cat] || 0) +
      PROPAGATION_WEIGHTS.CALENDAR_EXPORT;
  });

  tags.forEach((tag) => {
    profile.tagAffinities[tag] =
      (profile.tagAffinities[tag] || 0) + PROPAGATION_WEIGHTS.CALENDAR_EXPORT;
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "calendar_export",
    targetId: rec.id,
    details: `Calendar Exported/Synced for: ${rec.title}`,
  });

  savePreferenceProfile(profile);
}

/**
 * 7. Learn from Detail Views (implicit engagement)
 */
export function trackViewDetailsSignal(rec: Recommendation) {
  const profile = getPreferenceProfile();
  const { categories, tags } = extractRecAttributes(rec);

  profile.itemAffinities[rec.id] =
    (profile.itemAffinities[rec.id] || 0) + SIGNAL_WEIGHTS.VIEW_DETAILS;

  categories.forEach((cat) => {
    profile.categoryAffinities[cat] =
      (profile.categoryAffinities[cat] || 0) + PROPAGATION_WEIGHTS.VIEW_DETAILS;
  });

  tags.forEach((tag) => {
    profile.tagAffinities[tag] =
      (profile.tagAffinities[tag] || 0) + PROPAGATION_WEIGHTS.VIEW_DETAILS;
  });

  profile.history.push({
    timestamp: new Date().toISOString(),
    type: "view_details",
    targetId: rec.id,
    details: `Viewed details of: ${rec.title}`,
  });

  savePreferenceProfile(profile);
}

/**
 * Get dynamic score boost for a recommendation based on LPE profile.
 * Incorporates item affinity, category affinity, and keyword/tag matching.
 */
export function getLocalPreferenceBoost(
  rec: Recommendation,
  profile?: LocalPreferenceProfile,
): number {
  const lpe = profile || getPreferenceProfile();
  let boost = 0;

  // 1. Direct Item Affinity (e.g., historical clicks, scans, exports)
  const itemScore = lpe.itemAffinities[rec.id] || 0;
  boost += itemScore;

  // 2. Category Affinity
  const categories =
    typeof rec.category === "string"
      ? rec.category.split(",").map((s) => s.trim())
      : [rec.category];

  let maxCatScore = 0;
  categories.forEach((cat) => {
    const catScore = lpe.categoryAffinities[cat] || 0;
    if (catScore > maxCatScore) {
      maxCatScore = catScore;
    }
  });
  boost += maxCatScore;

  // 3. Tag/Keyword Affinity
  const tags: string[] = [];
  const anyRec = rec as any;
  if (anyRec.tags && Array.isArray(anyRec.tags)) {
    tags.push(...anyRec.tags);
  }
  const keywordsText =
    `${rec.title} ${rec.shortDescription} ${rec.longDescription}`.toLowerCase();
  const candidateTags = [
    "exclusive",
    "authentic",
    "relaxing",
    "adventure",
    "historic",
    "romantic",
    "traditional",
    "viewpoint",
    "gourmet",
    "waterfront",
    "nature",
  ];
  candidateTags.forEach((t) => {
    if (keywordsText.includes(t)) {
      tags.push(t);
    }
  });

  let tagBoostSum = 0;
  tags.forEach((tag) => {
    const tagScore = lpe.tagAffinities[tag] || 0;
    tagBoostSum += tagScore * 0.5; // weight individual tags gently
  });
  boost += Math.min(40, tagBoostSum); // cap tag contribution to avoid runaway boosts

  return parseFloat(boost.toFixed(1));
}
