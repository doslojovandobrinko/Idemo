/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { getActiveDestinationPackage } from './destinationPackageManager';
import { getApprovedPrimaryMedia } from './recommendationMediaService';

const staticRecsMap = new Map(INITIAL_RECOMMENDATIONS.map(r => [r.id, r]));

export interface LoadRecommendationsResult {
  data: Recommendation[] | null;
  error: string | null;
  isLive: boolean;
  packageVersion?: string;
}

export interface SupabaseRecommendationRow {
  id: string;
  source_id?: string | null;
  title_en: string;
  title_sr?: string | null;
  category?: string | null;
  short_description_en?: string | null;
  short_description_sr?: string | null;
  long_description_en?: string | null;
  long_description_sr?: string | null;
  image_url?: string | null;
  duration?: string | null;
  travel_time?: string | null;
  travel_time_minutes?: number | null;
  location_en?: string | null;
  location_sr?: string | null;
  estimated_cost?: string | null;
  preferred_transport?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  best_time_to_visit_en?: string | null;
  best_time_to_visit_sr?: string | null;
  insider_tip_en?: string | null;
  insider_tip_sr?: string | null;
  moods?: string[] | null;
  ranking_score?: number | null;
  is_published?: boolean;
}

export const loadRecommendations = async (): Promise<LoadRecommendationsResult> => {
  if (!isSupabaseConfigured()) {
    const pkg = await getActiveDestinationPackage();
    return {
      data: pkg.recommendations,
      error: null,
      isLive: false,
      packageVersion: pkg.manifest.packageVersion,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const pkg = await getActiveDestinationPackage();
    return {
      data: pkg.recommendations,
      error: null,
      isLive: false,
      packageVersion: pkg.manifest.packageVersion,
    };
  }


  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select(`
        id,
        source_id,
        title_en,
        title_sr,
        category,
        short_description_en,
        short_description_sr,
        long_description_en,
        long_description_sr,
        image_url,
        duration,
        travel_time,
        travel_time_minutes,
        location_en,
        location_sr,
        estimated_cost,
        preferred_transport,
        latitude,
        longitude,
        best_time_to_visit_en,
        best_time_to_visit_sr,
        insider_tip_en,
        insider_tip_sr,
        moods,
        ranking_score,
        is_published
      `)
      .eq('is_published', true);

    if (error || !data || data.length === 0) {
      const pkg = await getActiveDestinationPackage();
      return {
        data: pkg.recommendations,
        error: error ? `FALLBACK_TO_PACKAGE: Database error (${error.message}). Loaded package v${pkg.manifest.packageVersion}.` : null,
        isLive: false,
        packageVersion: pkg.manifest.packageVersion,
      };
    }

    const mappedRecommendations: Recommendation[] = [];
    let rejectedRowCount = 0;

    for (const row of data as SupabaseRecommendationRow[]) {
      if (!row.source_id || !row.title_en || !row.category || !row.short_description_en) {
        rejectedRowCount++;
        continue;
      }

      const recId = row.source_id;
      const staticMatch = staticRecsMap.get(recId);
      const coordX = (row as any).coordinate_x ?? (row as any).coordinateX ?? staticMatch?.coordinateX ?? 0;
      const coordY = (row as any).coordinate_y ?? (row as any).coordinateY ?? staticMatch?.coordinateY ?? 0;

      const candidateImage = row.image_url || staticMatch?.image || '/src/assets/images/uvac_meanders_1778841048759.png';
      const approvedImage = getApprovedPrimaryMedia(recId, candidateImage);

      mappedRecommendations.push({
        id: recId,
        dbId: row.id,
        title: row.title_en,
        category: row.category,
        shortDescription: row.short_description_en,
        longDescription: row.long_description_en || row.short_description_en || staticMatch?.longDescription,
        image: approvedImage,
        duration: row.duration || staticMatch?.duration || '2-4 hours',
        travelTime: row.travel_time || staticMatch?.travelTime || '1-2 hours',
        travelTimeMinutes: row.travel_time_minutes ?? staticMatch?.travelTimeMinutes ?? 60,
        location: row.location_en || staticMatch?.location || 'Serbia',
        estimatedCost: row.estimated_cost || staticMatch?.estimatedCost || 'Moderate',
        preferredTransport: row.preferred_transport || staticMatch?.preferredTransport || 'Car',
        coordinateX: coordX,
        coordinateY: coordY,
        badge: staticMatch?.badge,
        equivalents: staticMatch?.equivalents,
        radius: staticMatch?.radius,
        energy: staticMatch?.energy,
        social: staticMatch?.social,
        luxury: staticMatch?.luxury,
        urbanity: staticMatch?.urbanity,
        nature: staticMatch?.nature,
        weatherDependency: staticMatch?.weatherDependency,
        seasonality: staticMatch?.seasonality,
        familySuitability: staticMatch?.familySuitability,
        accessibility: staticMatch?.accessibility,
        premiumLevel: staticMatch?.premiumLevel,
        budgetLevel: staticMatch?.budgetLevel,
        recommendedVisitDuration: staticMatch?.recommendedVisitDuration,
        website: staticMatch?.website,
        phone: staticMatch?.phone,
        conciergePhone: staticMatch?.conciergePhone,
        coordinates:
          row.latitude != null && row.longitude != null
            ? { lat: Number(row.latitude), lng: Number(row.longitude) }
            : staticMatch?.coordinates,
        translations: {
          sr: {
            title: row.title_sr || staticMatch?.translations?.sr?.title,
            shortDescription: row.short_description_sr || staticMatch?.translations?.sr?.shortDescription,
            longDescription: row.long_description_sr || staticMatch?.translations?.sr?.longDescription,
            location: row.location_sr || staticMatch?.translations?.sr?.location,
          },
        },
      });
    }

    if (mappedRecommendations.length === 0) {
      return {
        data: null,
        error: `MAPPER_REJECTION: ${data.length} database row(s) returned, but none could be mapped due to missing essential fields (${rejectedRowCount} row(s) rejected).`,
        isLive: false,
      };
    }

    return {
      data: mappedRecommendations,
      error: null,
      isLive: true,
    };
  } catch (err: any) {
    return {
      data: null,
      error: `UNEXPECTED_EXCEPTION: ${err?.message || String(err)}`,
      isLive: false,
    };
  }
};


