/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorialCollection, LoadEditorialCollectionsResult, SupabaseEditorialCollectionRow } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_EDITORIAL_COLLECTIONS } from '../data/editorialCollections';

const staticCollectionsMap = new Map(INITIAL_EDITORIAL_COLLECTIONS.map(c => [c.id, c]));

/**
 * Loads Editorial Collections from Supabase backend if available,
 * falling back gracefully to static initial collections for offline-first support.
 */
export const loadEditorialCollections = async (): Promise<LoadEditorialCollectionsResult> => {
  if (!isSupabaseConfigured()) {
    return {
      data: INITIAL_EDITORIAL_COLLECTIONS,
      error: 'MISSING_CONFIG: Supabase environment variables not set. Using local static baseline.',
      isLive: false,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: INITIAL_EDITORIAL_COLLECTIONS,
      error: 'CLIENT_INIT_FAILED: Unable to initialize Supabase client instance. Using local static baseline.',
      isLive: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('editorial_collections')
      .select(`
        id,
        source_id,
        title_en,
        title_sr,
        title_zh,
        subtitle_en,
        subtitle_sr,
        subtitle_zh,
        introduction_en,
        introduction_sr,
        introduction_zh,
        hero_image,
        gallery,
        category,
        estimated_duration,
        visitor_profile,
        recommended_season,
        estimated_budget,
        geographic_scope,
        recommendation_ids,
        recommended_order,
        map_route,
        is_published,
        created_at,
        updated_at
      `)
      .eq('is_published', true);

    if (error) {
      return {
        data: INITIAL_EDITORIAL_COLLECTIONS,
        error: `QUERY_FAILED: ${error.message} (code: ${error.code || 'N/A'}). Using local static baseline.`,
        isLive: false,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: INITIAL_EDITORIAL_COLLECTIONS,
        error: null,
        isLive: true,
      };
    }

    const mappedCollections: EditorialCollection[] = [];

    for (const row of data as SupabaseEditorialCollectionRow[]) {
      const collectionId = row.source_id || row.id;
      const staticMatch = staticCollectionsMap.get(collectionId);

      mappedCollections.push({
        id: collectionId,
        dbId: row.id,
        titleEn: row.title_en || staticMatch?.titleEn || '',
        titleSr: row.title_sr || staticMatch?.titleSr,
        titleZh: row.title_zh || staticMatch?.titleZh,
        subtitleEn: row.subtitle_en || staticMatch?.subtitleEn || '',
        subtitleSr: row.subtitle_sr || staticMatch?.subtitleSr,
        subtitleZh: row.subtitle_zh || staticMatch?.subtitleZh,
        introductionEn: row.introduction_en || staticMatch?.introductionEn || '',
        introductionSr: row.introduction_sr || staticMatch?.introductionSr,
        introductionZh: row.introduction_zh || staticMatch?.introductionZh,
        heroImage: row.hero_image || staticMatch?.heroImage || '',
        gallery: row.gallery || staticMatch?.gallery,
        category: row.category || staticMatch?.category || 'Special Journey',
        estimatedDuration: row.estimated_duration || staticMatch?.estimatedDuration,
        visitorProfile: row.visitor_profile || staticMatch?.visitorProfile,
        recommendedSeason: row.recommended_season || staticMatch?.recommendedSeason,
        estimatedBudget: row.estimated_budget || staticMatch?.estimatedBudget,
        geographicScope: row.geographic_scope || staticMatch?.geographicScope,
        recommendationIds: row.recommendation_ids || staticMatch?.recommendationIds || [],
        recommendedOrder: row.recommended_order || staticMatch?.recommendedOrder,
        mapRoute: row.map_route || staticMatch?.mapRoute,
        isPublished: row.is_published ?? true,
        createdAt: row.created_at || undefined,
        updatedAt: row.updated_at || undefined,
        translations: {
          sr: {
            title: row.title_sr || staticMatch?.translations?.sr?.title,
            subtitle: row.subtitle_sr || staticMatch?.translations?.sr?.subtitle,
            introduction: row.introduction_sr || staticMatch?.translations?.sr?.introduction,
            estimatedDuration: row.estimated_duration || staticMatch?.translations?.sr?.estimatedDuration,
            geographicScope: row.geographic_scope || staticMatch?.translations?.sr?.geographicScope,
            estimatedBudget: row.estimated_budget || staticMatch?.translations?.sr?.estimatedBudget,
          },
          zh: {
            title: row.title_zh || staticMatch?.translations?.zh?.title,
            subtitle: row.subtitle_zh || staticMatch?.translations?.zh?.subtitle,
            introduction: row.introduction_zh || staticMatch?.translations?.zh?.introduction,
          },
        },
      });
    }

    return {
      data: mappedCollections,
      error: null,
      isLive: true,
    };
  } catch (err: any) {
    return {
      data: INITIAL_EDITORIAL_COLLECTIONS,
      error: `UNEXPECTED_EXCEPTION: ${err?.message || String(err)}. Using local static baseline.`,
      isLive: false,
    };
  }
};
