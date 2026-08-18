/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface CanonicalRecommendationPayload {
  destination_id: string;
  title: string;
  title_en: string;
  title_sr: string;
  title_de?: string;
  title_ru?: string;
  title_es?: string;
  title_zh?: string;
  category: string;
  categories: string[];
  short_description: string;
  short_description_en: string;
  short_description_sr: string;
  short_description_de?: string;
  short_description_ru?: string;
  short_description_es?: string;
  short_description_zh?: string;
  long_description: string;
  long_description_en: string;
  long_description_sr: string;
  long_description_de?: string;
  long_description_ru?: string;
  long_description_es?: string;
  long_description_zh?: string;
  location: string;
  location_en: string;
  location_sr: string;
  location_de?: string;
  location_ru?: string;
  location_es?: string;
  location_zh?: string;
  duration?: string;
  travel_time?: string;
  travel_time_minutes?: number;
  estimated_cost?: string;
  preferred_transport?: string;
  latitude?: number;
  longitude?: number;
  best_time_to_visit_en?: string;
  best_time_to_visit_sr?: string;
  insider_tip_en?: string;
  insider_tip_sr?: string;
  moods?: string[];
  image_url?: string;
  expertise_ids?: string[];
  capability_ids?: string[];
  practical_info?: {
    opening_hours?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
    admission_fee?: string;
  };
  provenance?: {
    source?: string;
    method?: string;
    license?: string;
    attribution_required?: boolean;
    attribution_text?: string;
    verification_status?: string;
    alt_text?: string;
  };
  translations?: Record<string, {
    title?: string;
    short_description?: string;
    long_description?: string;
    location?: string;
    best_time_to_visit?: string;
    insider_tip?: string;
  }>;
}

/**
 * Builds the exact canonical payload for submit_recommendation_create_secure RPC.
 * Server-derived fields (id, ranking_score, publication_status, created_at, updated_at) are strictly stripped.
 */
export function buildCanonicalRecommendationPayload(
  rec: Partial<Recommendation>,
  destinationId?: string
): CanonicalRecommendationPayload {
  const destId = rec.serviceAreaId || destinationId || '';

  // Title fallback
  const title = rec.title?.trim() || rec.translations?.en?.title?.trim() || 'Untitled Recommendation';
  const titleEn = rec.translations?.en?.title?.trim() || rec.titleEn?.trim() || title;
  const titleSr = rec.translations?.sr?.title?.trim() || rec.titleSr?.trim() || title;

  // Category fallback
  const primaryCategory = String(rec.category || 'Gastronomy');
  const categoriesList = Array.isArray(rec.categories) && rec.categories.length > 0
    ? Array.from(new Set([primaryCategory, ...rec.categories]))
    : [primaryCategory];

  // Descriptions
  const shortDesc = rec.shortDescription?.trim() || rec.translations?.en?.shortDescription?.trim() || '';
  const shortDescEn = rec.translations?.en?.shortDescription?.trim() || rec.shortDescriptionEn?.trim() || shortDesc;
  const shortDescSr = rec.translations?.sr?.shortDescription?.trim() || rec.shortDescriptionSr?.trim() || shortDesc;

  const longDesc = rec.longDescription?.trim() || rec.translations?.en?.longDescription?.trim() || '';
  const longDescEn = rec.translations?.en?.longDescription?.trim() || rec.longDescriptionEn?.trim() || longDesc;
  const longDescSr = rec.translations?.sr?.longDescription?.trim() || rec.longDescriptionSr?.trim() || longDesc;

  // Locations
  const location = rec.location?.trim() || 'Belgrade, Serbia';
  const locationEn = rec.translations?.en?.location?.trim() || rec.locationEn?.trim() || location;
  const locationSr = rec.translations?.sr?.location?.trim() || rec.locationSr?.trim() || location;

  // Translations Map
  const translationsMap: CanonicalRecommendationPayload['translations'] = {
    en: {
      title: titleEn,
      short_description: shortDescEn,
      long_description: longDescEn,
      location: locationEn,
      best_time_to_visit: rec.translations?.en?.bestTimeToVisit || rec.bestTimeToVisitEn || '',
      insider_tip: rec.translations?.en?.insiderTip || rec.insiderTipEn || '',
    },
    sr: {
      title: titleSr,
      short_description: shortDescSr,
      long_description: longDescSr,
      location: locationSr,
      best_time_to_visit: rec.translations?.sr?.bestTimeToVisit || rec.bestTimeToVisitSr || '',
      insider_tip: rec.translations?.sr?.insiderTip || rec.insiderTipSr || '',
    },
    de: {
      title: rec.translations?.de?.title || '',
      short_description: rec.translations?.de?.shortDescription || '',
      long_description: rec.translations?.de?.longDescription || '',
      location: rec.translations?.de?.location || '',
      best_time_to_visit: rec.translations?.de?.bestTimeToVisit || '',
      insider_tip: rec.translations?.de?.insiderTip || '',
    },
    ru: {
      title: rec.translations?.ru?.title || '',
      short_description: rec.translations?.ru?.shortDescription || '',
      long_description: rec.translations?.ru?.longDescription || '',
      location: rec.translations?.ru?.location || '',
      best_time_to_visit: rec.translations?.ru?.bestTimeToVisit || '',
      insider_tip: rec.translations?.ru?.insiderTip || '',
    },
    es: {
      title: rec.translations?.es?.title || '',
      short_description: rec.translations?.es?.shortDescription || '',
      long_description: rec.translations?.es?.longDescription || '',
      location: rec.translations?.es?.location || '',
      best_time_to_visit: rec.translations?.es?.bestTimeToVisit || '',
      insider_tip: rec.translations?.es?.insiderTip || '',
    },
    zh: {
      title: rec.translations?.zh?.title || '',
      short_description: rec.translations?.zh?.shortDescription || '',
      long_description: rec.translations?.zh?.longDescription || '',
      location: rec.translations?.zh?.location || '',
      best_time_to_visit: rec.translations?.zh?.bestTimeToVisit || '',
      insider_tip: rec.translations?.zh?.insiderTip || '',
    },
  };

  const practicalInfoObj = {
    opening_hours: rec.practicalInfo?.opening_hours || '',
    contact_phone: rec.practicalInfo?.contact_phone || rec.phone || '',
    contact_email: rec.practicalInfo?.contact_email || '',
    website: rec.practicalInfo?.website || rec.website || '',
    admission_fee: rec.practicalInfo?.admission_fee || rec.estimatedCost || '',
  };

  const provenanceObj = rec.provenance ? {
    source: rec.provenance.source || 'Studio Editor',
    method: rec.provenance.method || 'Curator Entry',
    license: rec.provenance.license || 'Proprietary',
    attribution_required: Boolean(rec.provenance.attributionRequired),
    attribution_text: rec.provenance.attributionText || '',
    verification_status: rec.provenance.verificationStatus || 'Pending Review',
    alt_text: rec.provenance.altText || rec.title || '',
  } : undefined;

  return {
    destination_id: destId,
    title,
    title_en: titleEn,
    title_sr: titleSr,
    title_de: rec.translations?.de?.title,
    title_ru: rec.translations?.ru?.title,
    title_es: rec.translations?.es?.title,
    title_zh: rec.translations?.zh?.title,
    category: primaryCategory,
    categories: categoriesList,
    short_description: shortDesc,
    short_description_en: shortDescEn,
    short_description_sr: shortDescSr,
    short_description_de: rec.translations?.de?.shortDescription,
    short_description_ru: rec.translations?.ru?.shortDescription,
    short_description_es: rec.translations?.es?.shortDescription,
    short_description_zh: rec.translations?.zh?.shortDescription,
    long_description: longDesc,
    long_description_en: longDescEn,
    long_description_sr: longDescSr,
    long_description_de: rec.translations?.de?.longDescription,
    long_description_ru: rec.translations?.ru?.longDescription,
    long_description_es: rec.translations?.es?.longDescription,
    long_description_zh: rec.translations?.zh?.longDescription,
    location,
    location_en: locationEn,
    location_sr: locationSr,
    location_de: rec.translations?.de?.location,
    location_ru: rec.translations?.ru?.location,
    location_es: rec.translations?.es?.location,
    location_zh: rec.translations?.zh?.location,
    duration: rec.duration || '2-3 hours',
    travel_time: rec.travelTime || '15 mins',
    travel_time_minutes: typeof rec.travelTimeMinutes === 'number' ? Math.max(0, rec.travelTimeMinutes) : 15,
    estimated_cost: rec.estimatedCost || '€€',
    preferred_transport: rec.preferredTransport || 'Taxi / Walking',
    latitude: rec.coordinates?.lat,
    longitude: rec.coordinates?.lng,
    best_time_to_visit_en: rec.translations?.en?.bestTimeToVisit || rec.bestTimeToVisitEn,
    best_time_to_visit_sr: rec.translations?.sr?.bestTimeToVisit || rec.bestTimeToVisitSr,
    insider_tip_en: rec.translations?.en?.insiderTip || rec.insiderTipEn,
    insider_tip_sr: rec.translations?.sr?.insiderTip || rec.insiderTipSr,
    moods: Array.isArray(rec.moods) ? rec.moods : [],
    image_url: rec.image || '',
    expertise_ids: Array.isArray(rec.expertiseIds) ? rec.expertiseIds : [],
    capability_ids: Array.isArray(rec.capabilityIds) ? rec.capabilityIds : [],
    practical_info: practicalInfoObj,
    provenance: provenanceObj,
    translations: translationsMap,
  };
}

export interface ServiceAreaOption {
  id: string;
  name_en: string;
  name_sr?: string;
  parent_id?: string | null;
}

/**
 * Loads valid service area options dynamically from public.service_areas.
 */
export async function fetchAuthoritativeServiceAreas(): Promise<ServiceAreaOption[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('service_areas')
      .select('id, name_en, name_sr, parent_id')
      .order('name_en', { ascending: true });

    if (error || !data) {
      console.error('Failed to load service areas:', error);
      return [];
    }

    return data as ServiceAreaOption[];
  } catch (err) {
    console.error('Exception fetching service areas:', err);
    return [];
  }
}

export interface RecommendationSubmissionResult {
  success: boolean;
  work_item_id?: string;
  proposed_recommendation_id?: string;
  error?: string;
  message?: string;
}

/**
 * Submits a canonical recommendation creation via the secure RPC.
 */
export async function submitCanonicalRecommendationCreate(
  rec: Partial<Recommendation>,
  destinationId?: string
): Promise<RecommendationSubmissionResult> {
  const targetDestId = rec.serviceAreaId || destinationId;

  if (!targetDestId || !targetDestId.trim()) {
    return {
      success: false,
      error: 'MISSING_DESTINATION_ID',
      message: 'A valid service area (destination) UUID is strictly required before submission.',
    };
  }

  const payload = buildCanonicalRecommendationPayload(rec, targetDestId);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      proposed_recommendation_id: rec.id || `rec-local-${Date.now()}`,
      message: 'Draft stored locally (Supabase environment not configured).',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'NO_SUPABASE_CLIENT',
      message: 'Supabase client is uninitialized.',
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      return {
        success: true,
        proposed_recommendation_id: rec.id || `rec-local-${Date.now()}`,
        message: 'Draft stored locally (No authenticated user session for RPC).',
      };
    }

    const { data, error } = await supabase.rpc('submit_recommendation_create_secure', {
      p_author_id: userId,
      p_destination_id: destinationId,
      p_proposed_recommendation: payload,
      p_idempotency_key: `rec_create_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
    });

    if (error) {
      return {
        success: false,
        error: error.code || 'RPC_ERROR',
        message: error.message,
      };
    }

    return {
      success: data?.success ?? true,
      work_item_id: data?.work_item_id,
      proposed_recommendation_id: data?.proposed_recommendation_id || data?.snapshot_id,
      error: data?.error,
      message: data?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'EXCEPTIONAL_FAILURE',
      message: err?.message || String(err),
    };
  }
}

/**
 * Helper to check if a string is a valid UUID.
 */
export function isUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Saves a recommendation draft durably to PostgreSQL via the workflow engine RPCs.
 * Requires an authenticated user session (Studio JWT).
 */
export async function saveRecommendationDraft(
  rec: Partial<Recommendation>,
  destinationId?: string
): Promise<RecommendationSubmissionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
      message: 'Supabase environment is not configured. Authoritative draft saving requires Supabase backend.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'NO_SUPABASE_CLIENT',
      message: 'Supabase client is uninitialized.',
    };
  }

  // Require valid authenticated session (Studio JWT)
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  const userId = session?.user?.id;

  if (!session || !userId) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'A valid Studio authentication session (JWT) is required to save drafts.',
    };
  }

  // 1. Resolve existing canonical recommendation FIRST
  let recUuid: string | null = null;
  let resolvedServiceAreaId: string | null = null;

  const rawId = rec.dbId || rec.id;
  if (rawId && typeof rawId === 'string' && rawId.trim().length > 0) {
    const cleanRawId = rawId.trim();
    try {
      if (isUuid(cleanRawId)) {
        // Query id column strictly for valid UUIDs
        const { data: recRow } = await supabase
          .from('recommendations')
          .select('id, service_area_id')
          .eq('id', cleanRawId)
          .maybeSingle();

        if (recRow?.id) {
          recUuid = recRow.id;
          if (recRow.service_area_id) {
            resolvedServiceAreaId = recRow.service_area_id;
          }
        }
      } else {
        // Query text source_id column strictly for non-UUID legacy/source IDs
        const { data: recRow } = await supabase
          .from('recommendations')
          .select('id, service_area_id')
          .eq('source_id', cleanRawId)
          .maybeSingle();

        if (recRow?.id) {
          recUuid = recRow.id;
          if (recRow.service_area_id) {
            resolvedServiceAreaId = recRow.service_area_id;
          }
        }
      }
    } catch {
      // Ignore lookup failure, proceed cleanly
    }
  }

  // 2. Derive targetDestId AFTER canonical lookup
  const targetDestId = rec.serviceAreaId || resolvedServiceAreaId || destinationId;
  if (!targetDestId || !targetDestId.trim()) {
    return {
      success: false,
      error: 'MISSING_DESTINATION_ID',
      message: 'A valid service area (destination) selection is required to save a draft.',
    };
  }

  // Build canonical payload without mutating the input rec object
  const payload = buildCanonicalRecommendationPayload(rec, targetDestId.trim());

  try {
    if (recUuid) {
      // Amend existing canonical recommendation
      const { data, error } = await supabase.rpc('submit_recommendation_amend_secure', {
        p_author_id: userId,
        p_recommendation_id: recUuid,
        p_proposed_changes: payload,
        p_base_content_version: 1,
        p_idempotency_key: `rec_draft_amend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.code || 'RPC_ERROR',
          message: error.message || 'Failed to save draft amendment.',
        };
      }

      // Explicit fail-closed check: response must be a non-null object with success === true
      if (!data || typeof data !== 'object' || data.success !== true) {
        return {
          success: false,
          error: (data && typeof data === 'object' && data.error) || 'INVALID_RPC_RESPONSE',
          message: (data && typeof data === 'object' && data.message) || 'Authoritative RPC response was ambiguous, null, or unsuccessful.',
        };
      }

      const workItemId = data.work_item?.id;
      const proposedRecId = data.work_item?.recommendation_id || recUuid;

      return {
        success: true,
        work_item_id: workItemId,
        proposed_recommendation_id: proposedRecId,
        message: data.message || 'Draft amendment successfully saved to backend.',
      };
    } else {
      // Create new recommendation draft
      const { data, error } = await supabase.rpc('submit_recommendation_create_secure', {
        p_author_id: userId,
        p_destination_id: targetDestId.trim(),
        p_proposed_recommendation: payload,
        p_idempotency_key: `rec_draft_create_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.code || 'RPC_ERROR',
          message: error.message || 'Failed to save new recommendation draft.',
        };
      }

      // Explicit fail-closed check: response must be a non-null object with success === true
      if (!data || typeof data !== 'object' || data.success !== true) {
        return {
          success: false,
          error: (data && typeof data === 'object' && data.error) || 'INVALID_RPC_RESPONSE',
          message: (data && typeof data === 'object' && data.message) || 'Authoritative RPC response was ambiguous, null, or unsuccessful.',
        };
      }

      const workItemId = data.work_item?.id;
      const proposedRecId = data.work_item?.recommendation_id;

      return {
        success: true,
        work_item_id: workItemId,
        proposed_recommendation_id: proposedRecId,
        message: data.message || 'New recommendation draft successfully saved to backend.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'EXCEPTIONAL_FAILURE',
      message: err?.message || String(err),
    };
  }
}

/**
 * Maps a stored proposed_value payload from editorial_work_items back to a Recommendation object.
 */
export function mapDraftPayloadToRecommendation(pv: any): Partial<Recommendation> {
  if (!pv || typeof pv !== 'object') return {};

  const translations = pv.translations || {};

  return {
    serviceAreaId: pv.destination_id || '',
    title: pv.title_en || pv.title || translations.en?.title || '',
    category: pv.category || 'Gastronomy',
    categories: Array.isArray(pv.categories) ? pv.categories : [pv.category || 'Gastronomy'],
    shortDescription: pv.short_description_en || pv.short_description || translations.en?.short_description || '',
    longDescription: pv.long_description_en || pv.long_description || translations.en?.long_description || '',
    location: pv.location_en || pv.location || translations.en?.location || '',
    titleSr: pv.title_sr || translations.sr?.title || '',
    shortDescriptionSr: pv.short_description_sr || translations.sr?.short_description || '',
    longDescriptionSr: pv.long_description_sr || translations.sr?.long_description || '',
    locationSr: pv.location_sr || translations.sr?.location || '',
    duration: pv.duration || '',
    travelTime: pv.travel_time || '',
    travelTimeMinutes: typeof pv.travel_time_minutes === 'number' ? pv.travel_time_minutes : undefined,
    estimatedCost: pv.estimated_cost || '',
    preferredTransport: pv.preferred_transport || '',
    image: pv.image_url || '',
    coordinates: (typeof pv.latitude === 'number' && typeof pv.longitude === 'number') ? {
      lat: pv.latitude,
      lng: pv.longitude,
    } : undefined,
    bestTimeToVisitEn: pv.best_time_to_visit_en || translations.en?.best_time_to_visit || '',
    bestTimeToVisitSr: pv.best_time_to_visit_sr || translations.sr?.best_time_to_visit || '',
    insiderTipEn: pv.insider_tip_en || translations.en?.insider_tip || '',
    insiderTipSr: pv.insider_tip_sr || translations.sr?.insider_tip || '',
    moods: Array.isArray(pv.moods) ? pv.moods : [],
    expertiseIds: Array.isArray(pv.expertise_ids) ? pv.expertise_ids : [],
    capabilityIds: Array.isArray(pv.capability_ids) ? pv.capability_ids : [],
    practicalInfo: pv.practical_info || undefined,
    provenance: pv.provenance ? {
      source: pv.provenance.source || '',
      method: pv.provenance.method || '',
      license: pv.provenance.license || '',
      attributionRequired: Boolean(pv.provenance.attribution_required),
      attributionText: pv.provenance.attribution_text || '',
      verificationStatus: pv.provenance.verification_status || '',
      altText: pv.provenance.alt_text || '',
    } : undefined,
    translations: {
      en: {
        title: pv.title_en || translations.en?.title || '',
        shortDescription: pv.short_description_en || translations.en?.short_description || '',
        longDescription: pv.long_description_en || translations.en?.long_description || '',
        location: pv.location_en || translations.en?.location || '',
        bestTimeToVisit: pv.best_time_to_visit_en || translations.en?.best_time_to_visit || '',
        insiderTip: pv.insider_tip_en || translations.en?.insider_tip || '',
      },
      sr: {
        title: pv.title_sr || translations.sr?.title || '',
        shortDescription: pv.short_description_sr || translations.sr?.short_description || '',
        longDescription: pv.long_description_sr || translations.sr?.long_description || '',
        location: pv.location_sr || translations.sr?.location || '',
        bestTimeToVisit: pv.best_time_to_visit_sr || translations.sr?.best_time_to_visit || '',
        insiderTip: pv.insider_tip_sr || translations.sr?.insider_tip || '',
      },
      de: translations.de ? {
        title: translations.de.title || '',
        shortDescription: translations.de.short_description || '',
        longDescription: translations.de.long_description || '',
        location: translations.de.location || '',
        bestTimeToVisit: translations.de.best_time_to_visit || '',
        insiderTip: translations.de.insider_tip || '',
      } : undefined,
      ru: translations.ru ? {
        title: translations.ru.title || '',
        shortDescription: translations.ru.short_description || '',
        longDescription: translations.ru.long_description || '',
        location: translations.ru.location || '',
        bestTimeToVisit: translations.ru.best_time_to_visit || '',
        insiderTip: translations.ru.insider_tip || '',
      } : undefined,
      es: translations.es ? {
        title: translations.es.title || '',
        shortDescription: translations.es.short_description || '',
        longDescription: translations.es.long_description || '',
        location: translations.es.location || '',
        bestTimeToVisit: translations.es.best_time_to_visit || '',
        insiderTip: translations.es.insider_tip || '',
      } : undefined,
      zh: translations.zh ? {
        title: translations.zh.title || '',
        shortDescription: translations.zh.short_description || '',
        longDescription: translations.zh.long_description || '',
        location: translations.zh.location || '',
        bestTimeToVisit: translations.zh.best_time_to_visit || '',
        insiderTip: translations.zh.insider_tip || '',
      } : undefined,
    },
  };
}

/**
 * Fetches the latest saved draft for a recommendation from editorial_work_items.
 */
export async function fetchLatestDraftForRecommendation(
  recIdOrDbId: string
): Promise<Partial<Recommendation> | null> {
  if (!recIdOrDbId || !recIdOrDbId.trim() || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const cleanId = recIdOrDbId.trim();
    let targetUuid: string | null = null;

    if (isUuid(cleanId)) {
      targetUuid = cleanId;
    } else {
      const { data: recRow } = await supabase
        .from('recommendations')
        .select('id')
        .eq('source_id', cleanId)
        .maybeSingle();

      if (recRow?.id) {
        targetUuid = recRow.id;
      }
    }

    const queryEntityId = targetUuid || cleanId;

    const { data, error } = await supabase
      .from('editorial_work_items')
      .select('id, entity_id, proposed_value, review_status, created_at')
      .eq('entity_type', 'recommendation')
      .eq('entity_id', queryEntityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.proposed_value) {
      return null;
    }

    return mapDraftPayloadToRecommendation(data.proposed_value);
  } catch (err) {
    console.error('Failed to fetch latest recommendation draft:', err);
    return null;
  }
}

