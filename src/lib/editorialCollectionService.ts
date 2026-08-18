/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorialCollection, Recommendation } from '../types';

/**
 * Higher-level Editorial Collection Service.
 * Provides canonical query, mapping, and localization helpers for Editorial Collections.
 */

/**
 * Resolves linked Recommendation objects for a given collection without duplication.
 * Respects optional recommendedOrder indices if provided.
 */
export const getRecommendationsForCollection = (
  collection: EditorialCollection,
  allRecommendations: Recommendation[]
): Recommendation[] => {
  if (!collection || !collection.recommendationIds || collection.recommendationIds.length === 0) {
    return [];
  }

  const recMap = new Map(allRecommendations.map(r => [r.id, r]));
  const resolved: Recommendation[] = [];
  const seenIds = new Set<string>();

  // If explicit ordering is provided, sort recommendationIds accordingly
  let orderedIds = [...collection.recommendationIds];
  if (
    collection.recommendedOrder &&
    collection.recommendedOrder.length === collection.recommendationIds.length
  ) {
    const paired = collection.recommendationIds.map((id, index) => ({
      id,
      order: collection.recommendedOrder![index] ?? index,
    }));
    paired.sort((a, b) => a.order - b.order);
    orderedIds = paired.map(p => p.id);
  }

  for (const id of orderedIds) {
    if (seenIds.has(id)) continue;
    const rec = recMap.get(id);
    if (rec) {
      resolved.push(rec);
      seenIds.add(id);
    }
  }

  return resolved;
};

/**
 * Finds all collections that include a specific recommendation ID.
 * Supports multi-collection belonging (one-to-many / many-to-many).
 */
export const getCollectionsForRecommendation = (
  recommendationId: string,
  collections: EditorialCollection[]
): EditorialCollection[] => {
  if (!recommendationId || !collections) return [];
  return collections.filter(c => c.recommendationIds && c.recommendationIds.includes(recommendationId));
};

/**
 * Filters collections by category.
 */
export const filterCollectionsByCategory = (
  collections: EditorialCollection[],
  category: string
): EditorialCollection[] => {
  if (!category || category === 'All') return collections;
  return collections.filter(
    c => c.category.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Localized string resolution for Collection Title.
 */
export const getLocalizedCollectionTitle = (collection: EditorialCollection, lang: string = 'en'): string => {
  if (!collection) return '';
  if (lang === 'sr' && collection.titleSr) return collection.titleSr;
  if (lang === 'zh' && collection.titleZh) return collection.titleZh;
  if (lang !== 'en' && collection.translations && collection.translations[lang]?.title) {
    return collection.translations[lang].title!;
  }
  return collection.titleEn || '';
};

/**
 * Localized string resolution for Collection Subtitle.
 */
export const getLocalizedCollectionSubtitle = (collection: EditorialCollection, lang: string = 'en'): string => {
  if (!collection) return '';
  if (lang === 'sr' && collection.subtitleSr) return collection.subtitleSr;
  if (lang === 'zh' && collection.subtitleZh) return collection.subtitleZh;
  if (lang !== 'en' && collection.translations && collection.translations[lang]?.subtitle) {
    return collection.translations[lang].subtitle!;
  }
  return collection.subtitleEn || '';
};

/**
 * Localized string resolution for Collection Introduction.
 */
export const getLocalizedCollectionIntroduction = (collection: EditorialCollection, lang: string = 'en'): string => {
  if (!collection) return '';
  if (lang === 'sr' && collection.introductionSr) return collection.introductionSr;
  if (lang === 'zh' && collection.introductionZh) return collection.introductionZh;
  if (lang !== 'en' && collection.translations && collection.translations[lang]?.introduction) {
    return collection.translations[lang].introduction!;
  }
  return collection.introductionEn || '';
};

/**
 * Generates coordinate map points for an Editorial Collection.
 * Prefers explicit mapRoute if defined, otherwise extracts coordinates from linked recommendations.
 */
export const getCollectionMapCoordinates = (
  collection: EditorialCollection,
  allRecommendations: Recommendation[]
): Array<{ lat: number; lng: number; label: string; recommendationId?: string }> => {
  if (!collection) return [];

  if (collection.mapRoute && collection.mapRoute.length > 0) {
    return collection.mapRoute.map(r => ({
      lat: r.latitude,
      lng: r.longitude,
      label: r.label || collection.titleEn,
      recommendationId: r.recommendationId,
    }));
  }

  const linkedRecs = getRecommendationsForCollection(collection, allRecommendations);
  const coords: Array<{ lat: number; lng: number; label: string; recommendationId?: string }> = [];

  for (const rec of linkedRecs) {
    if (rec.coordinates && rec.coordinates.lat && rec.coordinates.lng) {
      coords.push({
        lat: rec.coordinates.lat,
        lng: rec.coordinates.lng,
        label: rec.title,
        recommendationId: rec.id,
      });
    }
  }

  return coords;
};
