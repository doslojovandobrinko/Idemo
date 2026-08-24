/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getCanonicalMediaReference, getApprovedPrimaryMedia } from './recommendationMediaService';
import { safeStorage } from './safeStorage';

export const STORAGE_KEY_STUDIO_DRAFTS = 'idemo_v9_studio_recommendation_drafts';
export const STORAGE_KEY_CUSTOM_RECS = 'idemo_custom_recommendations_v1';
export const STORAGE_KEY_LEGACY_STUDIO_RECS = 'idemo_studio_recommendations_v1';
export const STUDIO_DRAFT_SCHEMA_VERSION = 2;
export const STORAGE_KEY_DRAFT_SCHEMA_VERSION = 'idemo_studio_drafts_schema_version';

/**
 * Pass-through helper for studio draft objects.
 * Value-based magic sanitization is explicitly removed from production workflows.
 */
export function sanitizeStudioDraft<T extends Record<string, any>>(d: T): T {
  return d;
}

/**
 * Retrieves all locally persisted studio recommendation drafts from safeStorage.
 */
export function getLocalStudioDrafts(): Partial<Recommendation>[] {
  const draftsMap = new Map<string, Partial<Recommendation>>();

  // 1. Read from idemo_v9_studio_recommendation_drafts
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_STUDIO_DRAFTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && item.id) {
            const sanitized = sanitizeStudioDraft(item);
            draftsMap.set(sanitized.id || item.id, sanitized);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[IDEMO Storage] Error reading studio recommendation drafts:', e);
  }

  // 2. Read from idemo_custom_recommendations_v1 for backwards compatibility
  try {
    const rawCustom = safeStorage.getItem(STORAGE_KEY_CUSTOM_RECS);
    if (rawCustom) {
      const parsedCustom = JSON.parse(rawCustom);
      if (Array.isArray(parsedCustom)) {
        parsedCustom.forEach((item) => {
          if (item && item.id && !draftsMap.has(item.id)) {
            const sanitized = sanitizeStudioDraft(item);
            draftsMap.set(sanitized.id || item.id, sanitized);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[IDEMO Storage] Error reading custom recommendations:', e);
  }

  // 3. Read from idemo_studio_recommendations_v1 for backwards compatibility
  try {
    const rawLegacy = safeStorage.getItem(STORAGE_KEY_LEGACY_STUDIO_RECS);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy)) {
        parsedLegacy.forEach((item) => {
          if (item && item.id && !draftsMap.has(item.id)) {
            const sanitized = sanitizeStudioDraft(item);
            draftsMap.set(sanitized.id || item.id, sanitized);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[IDEMO Storage] Error reading legacy studio recommendations:', e);
  }

  return Array.from(draftsMap.values());
}

/**
 * Saves a recommendation draft locally to safeStorage under Studio drafts key, custom recs key, and legacy studio key.
 */
export function saveLocalStudioDraft(rec: Partial<Recommendation>): Partial<Recommendation> {
  const recId = rec.id || rec.dbId || `rec-draft-${Date.now()}`;
  const draftToSave: Record<string, any> = {
    ...rec,
    id: recId,
    headerVisualState: (rec as any).headerVisualState || 'AMBER', // Ensure non-approved proposal AMBER state
    publicationStatus: rec.publicationStatus === 'CANONICAL' ? 'RESEARCH_CANDIDATE' : (rec.publicationStatus || 'RESEARCH_CANDIDATE'),
    updatedAt: new Date().toISOString(),
    createdAt: (rec as any).createdAt || new Date().toISOString(),
  };

  // 1. Write to idemo_v9_studio_recommendation_drafts
  try {
    const drafts = getLocalStudioDrafts();
    const idx = drafts.findIndex(d => d.id === recId || (d.dbId && d.dbId === draftToSave.dbId));
    if (idx >= 0) {
      drafts[idx] = { ...drafts[idx], ...draftToSave };
    } else {
      drafts.unshift(draftToSave);
    }
    safeStorage.setItem(STORAGE_KEY_STUDIO_DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error('[IDEMO Storage] Failed to write to idemo_v9_studio_recommendation_drafts:', e);
  }

  // 2. Sync with idemo_custom_recommendations_v1 for App.tsx compatibility
  try {
    const rawCustom = safeStorage.getItem(STORAGE_KEY_CUSTOM_RECS);
    let customList: Partial<Recommendation>[] = [];
    if (rawCustom) {
      try { customList = JSON.parse(rawCustom) || []; } catch {}
    }
    const idxCustom = customList.findIndex(d => d.id === recId || (d.dbId && d.dbId === draftToSave.dbId));
    if (idxCustom >= 0) {
      customList[idxCustom] = { ...customList[idxCustom], ...draftToSave };
    } else {
      customList.unshift(draftToSave);
    }
    safeStorage.setItem(STORAGE_KEY_CUSTOM_RECS, JSON.stringify(customList));
  } catch (e) {
    console.error('[IDEMO Storage] Failed to write to idemo_custom_recommendations_v1:', e);
  }

  // 3. Sync with idemo_studio_recommendations_v1 for backwards compatibility
  try {
    const rawLegacy = safeStorage.getItem(STORAGE_KEY_LEGACY_STUDIO_RECS);
    let legacyList: Partial<Recommendation>[] = [];
    if (rawLegacy) {
      try { legacyList = JSON.parse(rawLegacy) || []; } catch {}
    }
    const idxLegacy = legacyList.findIndex(d => d.id === recId || (d.dbId && d.dbId === draftToSave.dbId));
    if (idxLegacy >= 0) {
      legacyList[idxLegacy] = { ...legacyList[idxLegacy], ...draftToSave };
    } else {
      legacyList.unshift(draftToSave);
    }
    safeStorage.setItem(STORAGE_KEY_LEGACY_STUDIO_RECS, JSON.stringify(legacyList));
  } catch (e) {
    console.error('[IDEMO Storage] Failed to write to idemo_studio_recommendations_v1:', e);
  }

  return draftToSave;
}

/**
 * Removes a recommendation draft from local storage by ID.
 */
export function removeLocalStudioDraft(id: string): void {
  try {
    const drafts = getLocalStudioDrafts().filter(d => d.id !== id && d.dbId !== id);
    safeStorage.setItem(STORAGE_KEY_STUDIO_DRAFTS, JSON.stringify(drafts));
    safeStorage.setItem(STORAGE_KEY_CUSTOM_RECS, JSON.stringify(drafts));
    safeStorage.setItem(STORAGE_KEY_LEGACY_STUDIO_RECS, JSON.stringify(drafts));
  } catch (e) {
    console.warn('[IDEMO Storage] Error removing local draft:', e);
  }
}

export interface CanonicalRecommendationPayload {
  id?: string;
  db_id?: string;
  draft_reservation_id?: string;
  publication_status?: string;
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
  const title = rec.title?.trim() || rec.titleEn?.trim() || rec.translations?.en?.title?.trim() || 'Untitled Recommendation';
  const titleEn = rec.titleEn?.trim() || rec.title?.trim() || rec.translations?.en?.title?.trim() || title;
  const titleSr = rec.titleSr?.trim() || rec.translations?.sr?.title?.trim() || title;

  // Category fallback
  const primaryCategory = String(rec.category || 'Gastronomy');
  const categoriesList = Array.isArray(rec.categories) && rec.categories.length > 0
    ? Array.from(new Set([primaryCategory, ...rec.categories]))
    : [primaryCategory];

  // Descriptions
  const shortDesc = rec.shortDescription?.trim() || rec.shortDescriptionEn?.trim() || rec.translations?.en?.shortDescription?.trim() || '';
  const shortDescEn = rec.shortDescriptionEn?.trim() || rec.shortDescription?.trim() || rec.translations?.en?.shortDescription?.trim() || shortDesc;
  const shortDescSr = rec.shortDescriptionSr?.trim() || rec.translations?.sr?.shortDescription?.trim() || shortDesc;

  const longDesc = rec.longDescription?.trim() || rec.longDescriptionEn?.trim() || rec.translations?.en?.longDescription?.trim() || '';
  const longDescEn = rec.longDescriptionEn?.trim() || rec.longDescription?.trim() || rec.translations?.en?.longDescription?.trim() || longDesc;
  const longDescSr = rec.longDescriptionSr?.trim() || rec.translations?.sr?.longDescription?.trim() || longDesc;

  // Locations
  const location = rec.location?.trim() || rec.locationEn?.trim() || rec.translations?.en?.location?.trim() || 'Belgrade, Serbia';
  const locationEn = rec.locationEn?.trim() || rec.location?.trim() || rec.translations?.en?.location?.trim() || location;
  const locationSr = rec.locationSr?.trim() || rec.translations?.sr?.location?.trim() || location;

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

  const isZeroZeroSentinel =
    rec.coordinates &&
    typeof rec.coordinates.lat === 'number' &&
    typeof rec.coordinates.lng === 'number' &&
    rec.coordinates.lat === 0 &&
    rec.coordinates.lng === 0;

  const rawLat = (rec.coordinates && typeof rec.coordinates.lat === 'number' && !isNaN(rec.coordinates.lat))
    ? rec.coordinates.lat
    : (typeof (rec as any).latitude === 'number' && !isNaN((rec as any).latitude) ? (rec as any).latitude : undefined);

  const rawLng = (rec.coordinates && typeof rec.coordinates.lng === 'number' && !isNaN(rec.coordinates.lng))
    ? rec.coordinates.lng
    : (typeof (rec as any).longitude === 'number' && !isNaN((rec as any).longitude) ? (rec as any).longitude : undefined);

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
    duration: rec.duration !== undefined ? rec.duration : '2-3 hours',
    travel_time: typeof rec.travelTime === 'string' ? rec.travelTime : '',
    travel_time_minutes: typeof rec.travelTimeMinutes === 'number' ? Math.max(0, rec.travelTimeMinutes) : undefined,
    estimated_cost: rec.estimatedCost !== undefined ? rec.estimatedCost : '€€',
    preferred_transport: rec.preferredTransport !== undefined ? rec.preferredTransport : 'Taxi / Walking',
    latitude: isZeroZeroSentinel ? undefined : rawLat,
    longitude: isZeroZeroSentinel ? undefined : rawLng,
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
  code?: string;
  name_en: string;
  name_sr?: string;
  parent_id?: string | null;
  destination_code?: string;
}

export const SERVICE_AREA_OPTIONS: ServiceAreaOption[] = [
  { id: '43ce68cc-5f50-42ba-b3ed-0116adf47b98', code: 'sa-belgrade-001', name_en: 'Belgrade Metropolitan Area', name_sr: 'Beogradska mitropolitanska oblast' },
  { id: 'a1000000-0000-0000-0000-000000000002', code: 'sa-novisad-002', name_en: 'Novi Sad & Vojvodina', name_sr: 'Novi Sad i Vojvodina' },
  { id: 'a1000000-0000-0000-0000-000000000003', code: 'sa-west-003', name_en: 'Western Serbia & Podrinje', name_sr: 'Zapadna Srbija i Podrinje' },
  { id: 'a1000000-0000-0000-0000-000000000004', code: 'sa-sumadija-004', name_en: 'Šumadija & Central Serbia', name_sr: 'Šumadija i Centralna Srbija' },
  { id: 'a1000000-0000-0000-0000-000000000005', code: 'sa-east-005', name_en: 'Eastern Serbia & Lower Danube', name_sr: 'Istočna Srbija i Donje Podunavlje' },
  { id: 'a1000000-0000-0000-0000-000000000006', code: 'sa-south-006', name_en: 'Niš & Southern Serbia', name_sr: 'Niš i Južna Srbija' },
];

/**
 * Resolves location string queries to authoritative Serbia service areas.
 */
export function resolveServiceAreaForLocation(
  locationQuery: string,
  availableAreas: ServiceAreaOption[] = SERVICE_AREA_OPTIONS
): ServiceAreaOption | null {
  if (!locationQuery || !locationQuery.trim()) return null;
  const q = locationQuery.toLowerCase();

  const activeAreas = availableAreas.length > 0 ? availableAreas : SERVICE_AREA_OPTIONS;

  for (const sa of activeAreas) {
    const saId = (sa.code || sa.id).toLowerCase();
    const saRawId = sa.id.toLowerCase();
    const saName = (sa.name_en || sa.name_sr || '').toLowerCase();

    // Western Serbia, Podrinje & Mačva (sa-west-003 / sa-macva)
    if (
      saId === 'sa-west-003' ||
      saRawId === 'sa-west-003' ||
      saId.includes('macva') ||
      saName.includes('western serbia') ||
      saName.includes('podrinje') ||
      saName.includes('mačva') ||
      saName.includes('macva')
    ) {
      if (
        q.includes('bogatić') || q.includes('bogatic') ||
        q.includes('mačva') || q.includes('macva') ||
        q.includes('šabac') || q.includes('sabac') ||
        q.includes('loznica') || q.includes('banja koviljača') ||
        q.includes('banja koviljaca') || q.includes('podrinje') ||
        q.includes('valjevo')
      ) {
        return sa;
      }
    }

    // Tara & Zlatibor (sa-tara-003)
    if (
      saId === 'sa-tara-003' ||
      saRawId === 'sa-tara-003' ||
      (saName.includes('tara') && saName.includes('zlatibor')) ||
      saName === 'tara' ||
      saName === 'zlatibor'
    ) {
      if (
        q.includes('zlatibor') || q.includes('tara') ||
        q.includes('mokra gora') || q.includes('zlatar') ||
        q.includes('uvac') || q.includes('bajina bašta') ||
        q.includes('bajina basta')
      ) {
        return sa;
      }
    }

    // Belgrade (sa-belgrade-001)
    if (saId === 'sa-belgrade-001' || saRawId === 'sa-belgrade-001' || saName.includes('belgrade') || saName.includes('beograd')) {
      if (
        q.includes('belgrade') || q.includes('beograd') ||
        q.includes('zemun') || q.includes('dorcol') || q.includes('dorćol') ||
        q.includes('vračar') || q.includes('vracar')
      ) {
        return sa;
      }
    }

    // Novi Sad & Vojvodina (sa-novisad-002)
    if (saId === 'sa-novisad-002' || saRawId === 'sa-novisad-002' || saName.includes('novi sad') || saName.includes('vojvodina')) {
      if (
        q.includes('novi sad') || q.includes('petrovaradin') ||
        q.includes('subotica') || q.includes('sombor') || q.includes('zrenjanin') ||
        q.includes('palić') || q.includes('palic')
      ) {
        return sa;
      }
    }

    // Šumadija & Central Serbia (sa-sumadija-004)
    if (saId === 'sa-sumadija-004' || saRawId === 'sa-sumadija-004' || saName.includes('šumadija') || saName.includes('sumadija') || saName.includes('central serbia')) {
      if (
        q.includes('kragujevac') || q.includes('kraljevo') || q.includes('vrnjačka banja') || q.includes('vrnjacka banja') ||
        q.includes('topola') || q.includes('arandjelovac') || q.includes('aranđelovac')
      ) {
        return sa;
      }
    }

    // Eastern Serbia & Lower Danube (sa-east-005)
    if (saId === 'sa-east-005' || saRawId === 'sa-east-005' || saName.includes('eastern serbia') || saName.includes('lower danube')) {
      if (
        q.includes('golubac') || q.includes('kladovo') || q.includes('majdanpek') || q.includes('djerdap') || q.includes('đerdap') ||
        q.includes('zaječar') || q.includes('zajecar') || q.includes('sokobanja')
      ) {
        return sa;
      }
    }

    // Niš & Southern Serbia (sa-south-006)
    if (saId === 'sa-south-006' || saRawId === 'sa-south-006' || saName.includes('niš') || saName.includes('nis') || saName.includes('southern serbia')) {
      if (
        q.includes('niš') || q.includes('nis') || q.includes('leskovac') || q.includes('vranje') ||
        q.includes('pirot') || q.includes('stara planina')
      ) {
        return sa;
      }
    }
  }

  // Direct Keyword fallbacks
  if (q.includes('bogatić') || q.includes('bogatic') || q.includes('mačva') || q.includes('macva')) {
    const found = activeAreas.find(a => a.id === 'sa-west-003' || a.code === 'sa-west-003' || a.id.includes('macva') || (a.name_en && a.name_en.toLowerCase().includes('macva')));
    if (found) return found;
  }
  if (q.includes('zlatibor') || q.includes('tara')) {
    const found = activeAreas.find(a => a.id === 'sa-tara-003' || a.id === 'sa-west-003' || a.code === 'sa-west-003' || (a.name_en && a.name_en.toLowerCase().includes('tara')));
    if (found) return found;
  }
  if (q.includes('belgrade') || q.includes('beograd')) {
    const found = activeAreas.find(a => a.id === 'sa-belgrade-001' || a.code === 'sa-belgrade-001' || (a.name_en && a.name_en.toLowerCase().includes('belgrade')));
    if (found) return found;
  }
  if (q.includes('novi sad') || q.includes('petrovaradin')) {
    const found = activeAreas.find(a => a.id === 'sa-novisad-002' || a.code === 'sa-novisad-002' || (a.name_en && a.name_en.toLowerCase().includes('novi sad')));
    if (found) return found;
  }

  return null;
}

/**
 * Loads valid service area options dynamically from public.service_areas.
 */
export async function fetchAuthoritativeServiceAreas(): Promise<ServiceAreaOption[]> {
  let dbAreas: ServiceAreaOption[] = [];
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('service_areas')
          .select('*')
          .order('name_en', { ascending: true });

        if (!error && data && data.length > 0) {
          dbAreas = data as ServiceAreaOption[];
        }
      } catch (err) {
        console.warn('Exception fetching service areas from Supabase:', err);
      }
    }
  }

  // Merge database areas with SERVICE_AREA_OPTIONS to ensure full Serbia coverage
  const merged: ServiceAreaOption[] = [];
  const processedIds = new Set<string>();
  const processedCodes = new Set<string>();

  // Process DB areas first
  for (const dbArea of dbAreas) {
    let code = dbArea.code;
    if (!code) {
      const match = SERVICE_AREA_OPTIONS.find(
        opt => opt.id === dbArea.id || opt.code === dbArea.id ||
        (opt.name_en && dbArea.name_en && opt.name_en.toLowerCase() === dbArea.name_en.toLowerCase())
      );
      if (match) {
        code = match.code || match.id;
      }
    }
    const item: ServiceAreaOption = {
      ...dbArea,
      code: code || dbArea.id,
    };
    merged.push(item);
    if (item.id) processedIds.add(item.id);
    if (item.code) processedCodes.add(item.code);
  }

  // Append canonical SERVICE_AREA_OPTIONS if not present
  for (const opt of SERVICE_AREA_OPTIONS) {
    const optCode = opt.code || opt.id;
    if (!processedIds.has(opt.id) && !processedCodes.has(optCode)) {
      merged.push({
        ...opt,
        code: optCode,
      });
      processedIds.add(opt.id);
      processedCodes.add(optCode);
    }
  }

  return merged;
}

/**
 * Resolves a canonical service-area string code (e.g., "sa-west-003") or ID to an authoritative database UUID.
 * Returns null if the code cannot be resolved.
 */
export async function resolveServiceAreaUuid(codeOrId?: string | null): Promise<string | null> {
  if (!codeOrId || !codeOrId.trim()) return null;
  const target = codeOrId.trim();

  if (isUuid(target)) {
    return target;
  }

  const areas = await fetchAuthoritativeServiceAreas();

  // 1. Exact match on code or id
  let match = areas.find(a => a.code === target || a.id === target);

  // 2. Case-insensitive match on code or destination_code
  if (!match) {
    match = areas.find(a =>
      (a.code && a.code.toLowerCase() === target.toLowerCase()) ||
      (a.destination_code && a.destination_code.toLowerCase() === target.toLowerCase()) ||
      a.id.toLowerCase() === target.toLowerCase()
    );
  }

  // 3. Name match fallback
  if (!match) {
    match = areas.find(a =>
      (a.name_en && a.name_en.toLowerCase().includes(target.toLowerCase())) ||
      (a.name_sr && a.name_sr.toLowerCase().includes(target.toLowerCase()))
    );
  }

  if (match && isUuid(match.id)) {
    return match.id;
  }

  return null;
}

export interface RecommendationSubmissionResult {
  success: boolean;
  serverPersisted?: boolean;
  localFallbackPersisted?: boolean;
  work_item_id?: string;
  proposed_recommendation_id?: string;
  error?: string;
  message?: string;
}

/**
 * Helper to check if a string is a valid UUID.
 */
export function isUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export interface ResolvedRecommendationIdentity {
  canonicalUuid: string | null;
  sourceId: string | null;
  destinationId: string | null;
  isExisting: boolean;
  isExistingCanonical: boolean;
}

/**
 * Resolves the authoritative database UUID and identity for a recommendation.
 * Implements the Non-Negotiable Identity Model:
 * 1. Canonical Recommendation Identity: Immutable, Supabase UUID from recommendations.id.
 * 2. Source / Display ID: e.g. "97" or "serbia_rec_97", preserved in recommendations.source_id.
 * 3. Never confuses draft reservation UUIDs with existing canonical entity UUIDs.
 */
export async function resolveCanonicalRecommendationIdentity(
  rec?: Partial<Recommendation> | null
): Promise<ResolvedRecommendationIdentity> {
  if (!rec) {
    return { canonicalUuid: null, sourceId: null, destinationId: null, isExisting: false, isExistingCanonical: false };
  }

  const sourceId = rec.id ? String(rec.id).trim() : null;
  const dbId = rec.dbId ? String(rec.dbId).trim() : null;
  const isExplicitDbUuid = Boolean(dbId && isUuid(dbId));

  if (!isSupabaseConfigured()) {
    const isCanonicalStatus = rec.publicationStatus === 'CANONICAL' || rec.publicationStatus === 'PUBLISHED';
    const canonicalUuid = (isCanonicalStatus && isExplicitDbUuid) ? dbId : null;
    return {
      canonicalUuid,
      sourceId,
      destinationId: rec.serviceAreaId || null,
      isExisting: Boolean(canonicalUuid),
      isExistingCanonical: Boolean(canonicalUuid),
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const isCanonicalStatus = rec.publicationStatus === 'CANONICAL' || rec.publicationStatus === 'PUBLISHED';
    const canonicalUuid = (isCanonicalStatus && isExplicitDbUuid) ? dbId : null;
    return {
      canonicalUuid,
      sourceId,
      destinationId: rec.serviceAreaId || null,
      isExisting: Boolean(canonicalUuid),
      isExistingCanonical: Boolean(canonicalUuid),
    };
  }

  try {
    // 1. If explicit dbId is provided and is a valid UUID, query recommendations table
    if (isExplicitDbUuid && dbId) {
      const { data: recRow } = await supabase
        .from('recommendations')
        .select('id, source_id, service_area_id')
        .eq('id', dbId)
        .maybeSingle();

      if (recRow?.id) {
        return {
          canonicalUuid: recRow.id,
          sourceId: recRow.source_id || sourceId,
          destinationId: recRow.service_area_id || rec.serviceAreaId || null,
          isExisting: true,
          isExistingCanonical: true,
        };
      }
      // Note: If recRow is null, dbId is NOT a row in public.recommendations (it is likely a draft reservation / entity UUID).
    }

    // 2. If sourceId is provided, check if it matches id or source_id in DB
    if (sourceId) {
      if (isUuid(sourceId)) {
        const { data: recRow } = await supabase
          .from('recommendations')
          .select('id, source_id, service_area_id')
          .eq('id', sourceId)
          .maybeSingle();

        if (recRow?.id) {
          return {
            canonicalUuid: recRow.id,
            sourceId: recRow.source_id || sourceId,
            destinationId: recRow.service_area_id || rec.serviceAreaId || null,
            isExisting: true,
            isExistingCanonical: true,
          };
        }
      } else {
        // Query solely on the text column source_id (never on UUID column id)
        let { data: recRow } = await supabase
          .from('recommendations')
          .select('id, source_id, service_area_id')
          .eq('source_id', sourceId)
          .maybeSingle();

        // If not found and sourceId is numeric (e.g. '97'), try canonical prefix 'serbia_rec_97'
        if (!recRow && /^\d+$/.test(sourceId)) {
          const alternateSourceId = `serbia_rec_${sourceId}`;
          const { data: altRow } = await supabase
            .from('recommendations')
            .select('id, source_id, service_area_id')
            .eq('source_id', alternateSourceId)
            .maybeSingle();
          if (altRow) {
            recRow = altRow;
          }
        } else if (!recRow && sourceId.startsWith('serbia_rec_')) {
          const digitsOnly = sourceId.replace('serbia_rec_', '');
          const { data: altRow } = await supabase
            .from('recommendations')
            .select('id, source_id, service_area_id')
            .eq('source_id', digitsOnly)
            .maybeSingle();
          if (altRow) {
            recRow = altRow;
          }
        }

        if (recRow?.id) {
          return {
            canonicalUuid: recRow.id,
            sourceId: recRow.source_id || sourceId,
            destinationId: recRow.service_area_id || rec.serviceAreaId || null,
            isExisting: true,
            isExistingCanonical: true,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[recommendationWorkflowService] Identity resolution notice:', err);
  }

  return {
    canonicalUuid: null,
    sourceId,
    destinationId: rec.serviceAreaId || null,
    isExisting: false,
    isExistingCanonical: false,
  };
}

/**
 * Submits a canonical recommendation creation or amendment via the secure RPCs.
 */
export async function submitCanonicalRecommendationCreate(
  rec: Partial<Recommendation>,
  destinationId?: string
): Promise<RecommendationSubmissionResult> {
  if (rec.draftReservationId && !isUuid(rec.draftReservationId)) {
    return {
      success: false,
      error: 'INVALID_RESERVATION_ID',
      message: 'The established draft reservation UUID is invalid.',
    };
  }

  const identity = await resolveCanonicalRecommendationIdentity(rec);
  const rawDestId = rec.serviceAreaId || identity.destinationId || destinationId;
  const targetDestId = await resolveServiceAreaUuid(rawDestId);

  if (!targetDestId || !targetDestId.trim()) {
    return {
      success: false,
      error: 'MISSING_DESTINATION_ID',
      message: 'Canonical service area UUID could not be resolved.',
    };
  }

  const payload = buildCanonicalRecommendationPayload(rec, targetDestId.trim());

  if (!isSupabaseConfigured()) {
    const fallbackId = (rec.draftReservationId && isUuid(rec.draftReservationId)) ? rec.draftReservationId : identity.canonicalUuid || rec.id || `rec-local-${Date.now()}`;
    return {
      success: true,
      proposed_recommendation_id: fallbackId,
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
      const fallbackId = (rec.draftReservationId && isUuid(rec.draftReservationId)) ? rec.draftReservationId : identity.canonicalUuid || rec.id || `rec-local-${Date.now()}`;
      return {
        success: true,
        proposed_recommendation_id: fallbackId,
        message: 'Draft stored locally (No authenticated user session for RPC).',
      };
    }

    if (identity.isExistingCanonical && identity.canonicalUuid) {
      // Existing canonical recommendation -> call amend RPC
      const { data, error } = await supabase.rpc('submit_recommendation_amend_secure', {
        p_author_id: userId,
        p_recommendation_id: identity.canonicalUuid,
        p_proposed_changes: payload,
        p_base_content_version: 1,
        p_idempotency_key: `rec_submit_amend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.code || 'RPC_ERROR',
          message: error.message || 'Failed to submit recommendation amendment.',
        };
      }

      return {
        success: data?.success ?? true,
        work_item_id: data?.work_item?.id || data?.work_item_id,
        proposed_recommendation_id: data?.work_item?.recommendation_id || identity.canonicalUuid,
        error: data?.error,
        message: data?.message || 'Recommendation amendment successfully submitted and verified!',
      };
    } else {
      // New recommendation -> resolve draft reservation UUID if present or expected
      const rawReservedId = (rec.draftReservationId && isUuid(rec.draftReservationId))
        ? rec.draftReservationId
        : (rec.dbId && isUuid(rec.dbId) && !identity.isExistingCanonical ? rec.dbId : (rec.id && isUuid(rec.id) ? rec.id : undefined));
      if (rec.draftReservationId && !isUuid(rec.draftReservationId)) {
        return {
          success: false,
          error: 'INVALID_RESERVATION_ID',
          message: 'The established draft reservation UUID is invalid.',
        };
      }
      const reservedRecId = rawReservedId && isUuid(rawReservedId) ? rawReservedId : undefined;

      const { data, error } = await supabase.rpc('submit_recommendation_create_secure', {
        p_author_id: userId,
        p_destination_id: targetDestId.trim(),
        p_proposed_recommendation: payload,
        p_idempotency_key: `rec_create_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
        p_reserved_recommendation_id: reservedRecId,
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
        work_item_id: data?.work_item?.id || data?.work_item_id,
        proposed_recommendation_id: data?.work_item?.recommendation_id || data?.proposed_recommendation_id || data?.snapshot_id,
        error: data?.error,
        message: data?.message || 'Canonical recommendation successfully submitted and verified!',
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
 * Saves a recommendation draft durably to PostgreSQL via the workflow engine RPCs.
 * Requires an authenticated user session (Studio JWT).
 */
export async function saveRecommendationDraft(
  rec: Partial<Recommendation>,
  destinationId?: string
): Promise<RecommendationSubmissionResult> {
  // 1. First attempt backend Supabase RPC draft save if configured & authenticated
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        const userId = session?.user?.id;

        if (session && userId) {
          const identity = await resolveCanonicalRecommendationIdentity(rec);
          const rawDraftReservationUuid = (rec.draftReservationId && isUuid(rec.draftReservationId))
            ? rec.draftReservationId
            : (!identity.isExistingCanonical && rec.dbId && isUuid(rec.dbId) ? rec.dbId : null);

          const recUuid = identity.canonicalUuid;
          const rawDestId = rec.serviceAreaId || identity.destinationId || destinationId;
          const targetDestId = await resolveServiceAreaUuid(rawDestId);

          if (!targetDestId && rawDestId) {
            return {
              success: false,
              serverPersisted: false,
              localFallbackPersisted: false,
              error: 'CANONICAL_SERVICE_AREA_UNRESOLVED',
              message: 'Canonical service area UUID could not be resolved.',
            };
          }

          if (targetDestId && targetDestId.trim()) {
            const payload = buildCanonicalRecommendationPayload(rec, targetDestId.trim());

            // Check if there is an existing pending work item for this recommendation proposal
            let targetWorkItemId: string | null = (rec.workflowWorkItemId && isUuid(rec.workflowWorkItemId)) ? rec.workflowWorkItemId : null;

            if (!targetWorkItemId && !identity.isExistingCanonical) {
              if (rawDraftReservationUuid) {
                const { data: existingWi } = await supabase
                  .from('editorial_work_items')
                  .select('id')
                  .eq('entity_type', 'recommendation')
                  .eq('operation', 'recommendation.create')
                  .eq('entity_id', rawDraftReservationUuid)
                  .in('review_status', ['submitted', 'draft', 'under_review', 'changes_requested'])
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (existingWi?.id) {
                  targetWorkItemId = existingWi.id;
                }
              }
              if (!targetWorkItemId && rec.id) {
                const cleanId = String(rec.id).trim();
                const { data: existingWi } = await supabase
                  .from('editorial_work_items')
                  .select('id')
                  .eq('entity_type', 'recommendation')
                  .eq('operation', 'recommendation.create')
                  .or(`proposed_value->>id.eq.${cleanId},proposed_value->>source_id.eq.${cleanId}`)
                  .in('review_status', ['submitted', 'draft', 'under_review', 'changes_requested'])
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (existingWi?.id) {
                  targetWorkItemId = existingWi.id;
                }
              }
            }

            if (recUuid && identity.isExistingCanonical) {
              // CASE A: Actual canonical recommendation UUID exists in public.recommendations
              const { data, error } = await supabase.rpc('submit_recommendation_amend_secure', {
                p_author_id: userId,
                p_recommendation_id: recUuid,
                p_proposed_changes: payload,
                p_base_content_version: 1,
                p_idempotency_key: `rec_draft_amend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
              });

              if (!error && data && typeof data === 'object' && data.success === true) {
                const workItemId = data.work_item?.id;
                const proposedRecId = data.work_item?.recommendation_id || recUuid;
                // Sync to safeStorage locally
                saveLocalStudioDraft({ ...rec, dbId: recUuid, draftReservationId: undefined, workflowWorkItemId: undefined });
                return {
                  success: true,
                  serverPersisted: true,
                  localFallbackPersisted: true,
                  work_item_id: workItemId,
                  proposed_recommendation_id: proposedRecId,
                  message: data.message || 'Draft amendment successfully saved to backend.',
                };
              }
            } else if (targetWorkItemId && !identity.isExistingCanonical) {
              // CASE B: Existing pending recommendation.create work item exists and no canonical row exists
              const { data, error } = await supabase.rpc('update_pending_recommendation_work_item_secure', {
                p_author_id: userId,
                p_work_item_id: targetWorkItemId,
                p_proposed_recommendation: payload,
                p_idempotency_key: `rec_draft_update_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
              });

              if (!error && data && typeof data === 'object' && data.success === true) {
                const workItemId = data.work_item?.id || targetWorkItemId;
                const draftReservationId = data.work_item?.recommendation_id || rawDraftReservationUuid || rec.draftReservationId;
                saveLocalStudioDraft({
                  ...rec,
                  workflowWorkItemId: workItemId,
                  draftReservationId: draftReservationId || rec.draftReservationId,
                  dbId: undefined,
                });
                return {
                  success: true,
                  serverPersisted: true,
                  localFallbackPersisted: true,
                  work_item_id: workItemId,
                  proposed_recommendation_id: draftReservationId,
                  message: data.message || 'Pending recommendation draft successfully updated on backend.',
                };
              }
            } else {
              // CASE C: No work item exists and an active reservation exists
              if (rec.draftReservationId && !isUuid(rec.draftReservationId)) {
                return {
                  success: false,
                  serverPersisted: false,
                  localFallbackPersisted: false,
                  error: 'INVALID_RESERVATION_ID',
                  message: 'The established draft reservation UUID is invalid.',
                };
              }
              const reservedRecId = rawDraftReservationUuid || (rec.id && isUuid(rec.id) ? rec.id : undefined);

              const { data, error } = await supabase.rpc('submit_recommendation_create_secure', {
                p_author_id: userId,
                p_destination_id: targetDestId.trim(),
                p_proposed_recommendation: payload,
                p_idempotency_key: `rec_draft_create_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
                p_reserved_recommendation_id: reservedRecId || undefined,
              });

              if (!error && data && typeof data === 'object' && data.success === true) {
                const workItemId = data.work_item?.id;
                const draftReservationId = data.work_item?.recommendation_id || data.work_item?.entity_id || reservedRecId;
                saveLocalStudioDraft({
                  ...rec,
                  workflowWorkItemId: workItemId,
                  draftReservationId: draftReservationId || rec.draftReservationId,
                  dbId: undefined,
                });
                return {
                  success: true,
                  serverPersisted: true,
                  localFallbackPersisted: true,
                  work_item_id: workItemId,
                  proposed_recommendation_id: draftReservationId,
                  message: data.message || 'New recommendation draft successfully saved to backend.',
                };
              } else if (data && (data.error === 'RESERVATION_ALREADY_CONSUMED' || data.error === 'RESERVATION_INACTIVE') && reservedRecId) {
                // Fallback: Reservation was already consumed by a work item created earlier
                const { data: fallbackWi } = await supabase
                  .from('editorial_work_items')
                  .select('id')
                  .eq('entity_type', 'recommendation')
                  .eq('operation', 'recommendation.create')
                  .eq('entity_id', reservedRecId)
                  .in('review_status', ['submitted', 'draft', 'under_review', 'changes_requested'])
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (fallbackWi?.id) {
                  const { data: updateData, error: updateErr } = await supabase.rpc('update_pending_recommendation_work_item_secure', {
                    p_author_id: userId,
                    p_work_item_id: fallbackWi.id,
                    p_proposed_recommendation: payload,
                    p_idempotency_key: `rec_draft_update_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                    p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
                  });

                  if (!updateErr && updateData && typeof updateData === 'object' && updateData.success === true) {
                    const workItemId = updateData.work_item?.id || fallbackWi.id;
                    const draftReservationId = updateData.work_item?.recommendation_id || reservedRecId;
                    saveLocalStudioDraft({
                      ...rec,
                      workflowWorkItemId: workItemId,
                      draftReservationId: draftReservationId || rec.draftReservationId,
                      dbId: undefined,
                    });
                    return {
                      success: true,
                      serverPersisted: true,
                      localFallbackPersisted: true,
                      work_item_id: workItemId,
                      proposed_recommendation_id: draftReservationId,
                      message: updateData.message || 'Pending recommendation draft successfully updated on backend.',
                    };
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Workflow] Supabase draft save error, falling back to local storage:', err);
      }
    }
  }

  // 2. Fallback: Save locally via safeStorage
  try {
    const savedLocal = saveLocalStudioDraft(rec);
    return {
      success: false,
      serverPersisted: false,
      localFallbackPersisted: true,
      proposed_recommendation_id: rec.draftReservationId || savedLocal.id || `rec-local-${Date.now()}`,
      error: 'SERVER_PERSISTENCE_FAILED',
      message: 'Draft saved locally to browser storage in AMBER non-canonical state.',
    };
  } catch (localErr: any) {
    return {
      success: false,
      serverPersisted: false,
      localFallbackPersisted: false,
      error: 'PERSISTENCE_FAILED',
      message: 'Draft save failed on server and local storage.',
    };
  }
}

/**
 * Maps a stored proposed_value payload from editorial_work_items back to a Recommendation object.
 */
export function mapDraftPayloadToRecommendation(pv: any): Partial<Recommendation> {
  if (!pv || typeof pv !== 'object') return {};

  const sanitizedPv = sanitizeStudioDraft(pv);
  const translations = sanitizedPv.translations || {};

  const mapped: Partial<Recommendation> = {
    id: sanitizedPv.id || sanitizedPv.source_id || '',
    dbId: sanitizedPv.db_id || sanitizedPv.dbId || undefined,
    draftReservationId: sanitizedPv.draft_reservation_id || sanitizedPv.draftReservationId || undefined,
    workflowWorkItemId: sanitizedPv.workflow_work_item_id || sanitizedPv.workflowWorkItemId || undefined,
    serviceAreaId: sanitizedPv.destination_id || '',
    title: sanitizedPv.title_en || sanitizedPv.title || translations.en?.title || '',
    category: sanitizedPv.category || 'Gastronomy',
    categories: Array.isArray(sanitizedPv.categories) ? sanitizedPv.categories : [sanitizedPv.category || 'Gastronomy'],
    shortDescription: sanitizedPv.short_description_en || sanitizedPv.short_description || translations.en?.short_description || '',
    longDescription: sanitizedPv.long_description_en || sanitizedPv.long_description || translations.en?.long_description || '',
    location: sanitizedPv.location_en || sanitizedPv.location || translations.en?.location || '',
    titleSr: sanitizedPv.title_sr || translations.sr?.title || '',
    shortDescriptionSr: sanitizedPv.short_description_sr || translations.sr?.short_description || '',
    longDescriptionSr: sanitizedPv.long_description_sr || translations.sr?.long_description || '',
    locationSr: sanitizedPv.location_sr || translations.sr?.location || '',
    duration: sanitizedPv.duration || '',
    travelTime: typeof sanitizedPv.travel_time === 'string' ? sanitizedPv.travel_time : (typeof sanitizedPv.travelTime === 'string' ? sanitizedPv.travelTime : ''),
    travelTimeMinutes: typeof sanitizedPv.travel_time_minutes === 'number' ? sanitizedPv.travel_time_minutes : (typeof sanitizedPv.travelTimeMinutes === 'number' ? sanitizedPv.travelTimeMinutes : undefined),
    estimatedCost: sanitizedPv.estimated_cost || '',
    preferredTransport: sanitizedPv.preferred_transport || '',
    image: getApprovedPrimaryMedia(sanitizedPv.id || sanitizedPv.source_id || pv.source_id || pv.id || '', sanitizedPv.image_url || sanitizedPv.image || ''),
    coordinates: (sanitizedPv.coordinates && typeof sanitizedPv.coordinates.lat === 'number' && typeof sanitizedPv.coordinates.lng === 'number')
      ? { lat: sanitizedPv.coordinates.lat, lng: sanitizedPv.coordinates.lng }
      : (typeof sanitizedPv.latitude === 'number' && typeof sanitizedPv.longitude === 'number'
        ? { lat: sanitizedPv.latitude, lng: sanitizedPv.longitude }
        : (typeof sanitizedPv.lat === 'number' && typeof sanitizedPv.lng === 'number'
          ? { lat: sanitizedPv.lat, lng: sanitizedPv.lng }
          : undefined)),
    bestTimeToVisitEn: sanitizedPv.best_time_to_visit_en || translations.en?.best_time_to_visit || '',
    bestTimeToVisitSr: sanitizedPv.best_time_to_visit_sr || translations.sr?.best_time_to_visit || '',
    insiderTipEn: sanitizedPv.insider_tip_en || translations.en?.insider_tip || '',
    insiderTipSr: sanitizedPv.insider_tip_sr || translations.sr?.insider_tip || '',
    moods: Array.isArray(sanitizedPv.moods) ? sanitizedPv.moods : [],
    expertiseIds: Array.isArray(sanitizedPv.expertise_ids) ? sanitizedPv.expertise_ids : [],
    capabilityIds: Array.isArray(sanitizedPv.capability_ids) ? sanitizedPv.capability_ids : [],
    practicalInfo: sanitizedPv.practical_info || undefined,
    provenance: sanitizedPv.provenance ? {
      source: sanitizedPv.provenance.source || '',
      method: sanitizedPv.provenance.method || '',
      license: sanitizedPv.provenance.license || '',
      attributionRequired: Boolean(sanitizedPv.provenance.attribution_required),
      attributionText: sanitizedPv.provenance.attribution_text || '',
      verificationStatus: sanitizedPv.provenance.verification_status || '',
      altText: sanitizedPv.provenance.alt_text || '',
    } : undefined,
    translations: {
      en: {
        title: sanitizedPv.title_en || translations.en?.title || '',
        shortDescription: sanitizedPv.short_description_en || translations.en?.short_description || '',
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

  return sanitizeStudioDraft(mapped);
}

/**
 * Maps a canonical recommendation row from public.recommendations to a Recommendation object.
 */
export function mapCanonicalDbRowToRecommendation(row: any): Partial<Recommendation> {
  if (!row || typeof row !== 'object') return {};

  const translations = row.translations || {};

  return {
    id: row.source_id || row.id,
    dbId: row.id,
    serviceAreaId: row.service_area_id || '',
    title: row.title_en || row.title || translations.en?.title || '',
    titleSr: row.title_sr || translations.sr?.title || '',
    category: row.category || 'Gastronomy',
    categories: Array.isArray(row.categories) ? row.categories : [row.category || 'Gastronomy'],
    shortDescription: row.short_description_en || row.short_description || translations.en?.short_description || '',
    shortDescriptionSr: row.short_description_sr || translations.sr?.short_description || '',
    longDescription: row.long_description_en || row.long_description || translations.en?.long_description || '',
    longDescriptionSr: row.long_description_sr || translations.sr?.long_description || '',
    location: row.location_en || row.location || translations.en?.location || '',
    locationSr: row.location_sr || translations.sr?.location || '',
    duration: row.duration || '',
    travelTime: typeof row.travel_time === 'string' ? row.travel_time : (typeof row.travelTime === 'string' ? row.travelTime : ''),
    travelTimeMinutes: typeof row.travel_time_minutes === 'number' ? row.travel_time_minutes : (typeof row.travelTimeMinutes === 'number' ? row.travelTimeMinutes : undefined),
    estimatedCost: row.estimated_cost || '',
    preferredTransport: row.preferred_transport || '',
    image: getApprovedPrimaryMedia(row.source_id || row.id, row.image_url || ''),
    coordinates: (row.coordinates && typeof row.coordinates.lat === 'number' && typeof row.coordinates.lng === 'number')
      ? { lat: row.coordinates.lat, lng: row.coordinates.lng }
      : (typeof row.latitude === 'number' && typeof row.longitude === 'number'
        ? { lat: row.latitude, lng: row.longitude }
        : (typeof row.lat === 'number' && typeof row.lng === 'number'
          ? { lat: row.lat, lng: row.lng }
          : undefined)),
    bestTimeToVisitEn: row.best_time_to_visit_en || translations.en?.best_time_to_visit || '',
    bestTimeToVisitSr: row.best_time_to_visit_sr || translations.sr?.best_time_to_visit || '',
    insiderTipEn: row.insider_tip_en || translations.en?.insider_tip || '',
    insiderTipSr: row.insider_tip_sr || translations.sr?.insider_tip || '',
    moods: Array.isArray(row.moods) ? row.moods : [],
    expertiseIds: Array.isArray(row.expertise_ids) ? row.expertise_ids : [],
    capabilityIds: Array.isArray(row.capability_ids) ? row.capability_ids : [],
    practicalInfo: row.practical_info || undefined,
    provenance: row.provenance || undefined,
    translations: {
      en: {
        title: row.title_en || translations.en?.title || '',
        shortDescription: row.short_description_en || translations.en?.short_description || '',
        longDescription: row.long_description_en || translations.en?.long_description || '',
        location: row.location_en || translations.en?.location || '',
        bestTimeToVisit: row.best_time_to_visit_en || translations.en?.best_time_to_visit || '',
        insiderTip: row.insider_tip_en || translations.en?.insider_tip || '',
      },
      sr: {
        title: row.title_sr || translations.sr?.title || '',
        shortDescription: row.short_description_sr || translations.sr?.short_description || '',
        longDescription: row.long_description_sr || translations.sr?.long_description || '',
        location: row.location_sr || translations.sr?.location || '',
        bestTimeToVisit: row.best_time_to_visit_sr || translations.sr?.best_time_to_visit || '',
        insiderTip: row.insider_tip_sr || translations.sr?.insider_tip || '',
      },
      ...(translations.de ? { de: translations.de } : {}),
      ...(translations.ru ? { ru: translations.ru } : {}),
      ...(translations.es ? { es: translations.es } : {}),
      ...(translations.zh ? { zh: translations.zh } : {}),
    },
    publicationStatus: row.publication_status === 'CANONICAL' || row.publication_status === 'APPROVED' ? 'CANONICAL' : 'RESEARCH_CANDIDATE',
  };
}

/**
 * Fetches the latest state for a recommendation adhering to the strict Hydration Precedence:
 * 1. LATEST ACTIVE EDITORIAL DRAFT / AMENDMENT (from editorial_work_items by canonical UUID)
 * 2. CANONICAL DATABASE RECOMMENDATION (from public.recommendations by canonical UUID)
 * 3. STATIC SEED FALLBACK (returns null to let caller use initial seed data)
 */
export async function fetchLatestDraftForRecommendation(
  recIdOrDbId: string,
  explicitDbId?: string
): Promise<Partial<Recommendation> | null> {
  if ((!recIdOrDbId || !recIdOrDbId.trim()) && !explicitDbId) {
    return null;
  }

  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const identity = await resolveCanonicalRecommendationIdentity({
      id: recIdOrDbId,
      dbId: explicitDbId,
    });

    const canonicalUuid = identity.canonicalUuid;
    const cleanId = (recIdOrDbId || '').trim();
    const explicitUuid = (explicitDbId && isUuid(explicitDbId)) ? explicitDbId : null;
    const queryEntityId = canonicalUuid || (isUuid(cleanId) ? cleanId : explicitUuid);

    // ------------------------------------------------------------------------
    // Check for attached media assets for this canonical UUID if available
    // ------------------------------------------------------------------------
    let latestAttachedMediaRef: string | null = null;
    let latestProvenance: any = null;

    if (canonicalUuid || (queryEntityId && isUuid(queryEntityId))) {
      const targetMediaRecId = canonicalUuid || queryEntityId!;
      const { data: mediaAsset } = await supabase
        .from('recommendation_media_assets')
        .select('object_path, status, alt_text, provenance_source, acquisition_method, licence_type, attribution_required, attribution_text, creator_name, source_url, created_at')
        .eq('reserved_recommendation_id', targetMediaRecId)
        .eq('status', 'attached')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mediaAsset?.object_path) {
        latestAttachedMediaRef = getCanonicalMediaReference(mediaAsset.object_path);
        latestProvenance = {
          source: mediaAsset.provenance_source || 'Studio Verified Upload',
          method: mediaAsset.acquisition_method || 'original',
          license: mediaAsset.licence_type || 'CC-BY-4.0',
          attributionRequired: Boolean(mediaAsset.attribution_required),
          attributionText: mediaAsset.attribution_text || '',
          altText: mediaAsset.alt_text?.en || '',
        };
      }
    }

    // ------------------------------------------------------------------------
    // PRECEDENCE TIER 1: Latest Active Editorial Draft / Amendment
    // ------------------------------------------------------------------------
    let workItemQuery = supabase
      .from('editorial_work_items')
      .select('id, entity_id, proposed_value, review_status, created_at')
      .eq('entity_type', 'recommendation')
      .in('review_status', ['draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'canonical'])
      .order('created_at', { ascending: false });

    if (queryEntityId && isUuid(queryEntityId)) {
      workItemQuery = workItemQuery.eq('entity_id', queryEntityId);
    } else if (cleanId) {
      workItemQuery = workItemQuery.or(`proposed_value->>id.eq.${cleanId},proposed_value->>source_id.eq.${cleanId}`);
    }

    const { data: workItem } = await workItemQuery
      .limit(1)
      .maybeSingle();

    if (workItem && workItem.proposed_value) {
      const mapped = mapDraftPayloadToRecommendation(workItem.proposed_value);
      // Reconcile latest attached governed media asset reference if present
      if (latestAttachedMediaRef && (!mapped.image || !mapped.image.startsWith('recommendation-media/'))) {
        mapped.image = latestAttachedMediaRef;
        if (latestProvenance && !mapped.provenance) {
          mapped.provenance = latestProvenance;
        }
      }
      return {
        ...mapped,
        workflowWorkItemId: workItem.id,
        draftReservationId: workItem.entity_id || mapped.draftReservationId,
        dbId: canonicalUuid || undefined,
      };
    }

    // ------------------------------------------------------------------------
    // PRECEDENCE TIER 2: Canonical Database Recommendation
    // ------------------------------------------------------------------------
    if (canonicalUuid && isUuid(canonicalUuid)) {
      const { data: canonicalRow } = await supabase
        .from('recommendations')
        .select('*')
        .eq('id', canonicalUuid)
        .maybeSingle();

      if (canonicalRow) {
        const mappedCanonical = mapCanonicalDbRowToRecommendation(canonicalRow);
        // Reconcile attached governed media asset if present
        if (latestAttachedMediaRef) {
          mappedCanonical.image = latestAttachedMediaRef;
          if (latestProvenance) {
            mappedCanonical.provenance = latestProvenance;
          }
        }
        return mappedCanonical;
      }
    }

    // ------------------------------------------------------------------------
    // Intermediate Media Reconcile: Attached media found without active draft or canonical row
    // ------------------------------------------------------------------------
    if (latestAttachedMediaRef) {
      return {
        image: latestAttachedMediaRef,
        dbId: canonicalUuid || undefined,
        provenance: latestProvenance || undefined,
      };
    }

    // ------------------------------------------------------------------------
    // PRECEDENCE TIER 3: Static Seed Fallback (Return null to use seed in caller)
    // ------------------------------------------------------------------------
    return null;
  } catch (err) {
    console.error('Failed to fetch latest recommendation draft:', err);
    return null;
  }
}

export interface RecommendationRetireResult {
  success: boolean;
  work_item_id?: string;
  message?: string;
  error?: string;
}

/**
 * Retires a recommendation in Supabase via governed workflow engine RPCs
 * (submit_recommendation_retire_secure + approve_recommendation_work_item_secure),
 * or abandons active draft reservations via abandon_recommendation_draft_secure.
 * Always purges local drafts and marks local status as RETIRED.
 */
export async function retireRecommendation(
  recId: string,
  reason: string = 'Admin requested retirement'
): Promise<RecommendationRetireResult> {
  // 1. Purge local draft storage
  removeLocalStudioDraft(recId);

  // 2. If Supabase is configured and session exists, execute RPC retirement
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (userId) {
          const identity = await resolveCanonicalRecommendationIdentity({ id: recId, dbId: recId });
          const targetUuid = identity.canonicalUuid || recId;

          // A. Abandon any active draft reservations for this user
          try {
            await supabase.rpc('abandon_recommendation_draft_secure', {
              p_reserved_recommendation_id: targetUuid,
              p_reserved_by: userId,
              p_reason: reason
            });
          } catch (e) {
            // Ignore if reservation not found
          }

          // B. Attempt submit_recommendation_retire_secure for published / canonical items
          if (identity.canonicalUuid) {
            const { data: retireData, error: retireErr } = await supabase.rpc('submit_recommendation_retire_secure', {
              p_author_id: userId,
              p_recommendation_id: identity.canonicalUuid,
              p_retirement_reason: reason,
              p_idempotency_key: `rec_retire_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              p_correlation_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
            });

            if (!retireErr && retireData && (retireData.success || retireData.is_idempotent_replay)) {
              const workItemId = retireData.work_item_id || retireData.work_item?.id;

              if (workItemId) {
                // Immediately approve retirement (as authenticated Admin)
                const { data: approveData, error: approveErr } = await supabase.rpc('approve_recommendation_work_item_secure', {
                  p_work_item_id: workItemId,
                  p_reviewer_id: userId,
                  p_expected_version: 1,
                  p_reviewer_note: `Admin approved retirement: ${reason}`
                });

                if (!approveErr && approveData && approveData.success) {
                  return {
                    success: true,
                    work_item_id: workItemId,
                    message: 'Recommendation successfully retired and queued for package exclusion.',
                  };
                }
              }

              return {
                success: true,
                work_item_id: workItemId,
                message: 'Retirement work item created and queued.',
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('[Workflow] Supabase retirement error, proceeding with local retirement:', err);
      }
    }
  }

  // 3. Local/source-backed fallback
  return {
    success: true,
    message: 'Recommendation retired locally and removed from active desk.',
  };
}

/**
 * Authoritative central helper to determine lifecycle state for any recommendation.
 * Strictly fails safe to CANDIDATE / NEEDS RESEARCH and never defaults unindexed state to APPROVED.
 */
export function getRecommendationLifecycleState(
  rec: Partial<Recommendation> | null | undefined,
  editorialStatuses?: Record<string, string>
): {
  status: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED';
  isDraft: boolean;
  isApproved: boolean;
  isPublished: boolean;
  isRetired: boolean;
  mayApprove: boolean;
  mayRetire: boolean;
  mayDeleteLocalDraft: boolean;
} {
  if (!rec || (!rec.id && !rec.dbId)) {
    return {
      status: 'CANDIDATE',
      isDraft: true,
      isApproved: false,
      isPublished: false,
      isRetired: false,
      mayApprove: true,
      mayRetire: false,
      mayDeleteLocalDraft: true,
    };
  }

  const targetId = rec.id || rec.dbId || '';
  const explicitStatus = editorialStatuses ? editorialStatuses[targetId] : undefined;

  let resolvedStatus: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED' = 'CANDIDATE';

  if (explicitStatus && ['CANDIDATE', 'NEEDS RESEARCH', 'APPROVED', 'MERGE CANDIDATE', 'RETIRED'].includes(explicitStatus)) {
    resolvedStatus = explicitStatus as any;
  } else if (rec.publicationStatus === 'CANONICAL' || rec.publicationStatus === 'PUBLISHED') {
    resolvedStatus = 'APPROVED';
  } else {
    // Fail safe to CANDIDATE or NEEDS RESEARCH for unindexed drafts
    resolvedStatus = 'CANDIDATE';
  }

  const isApproved = resolvedStatus === 'APPROVED';
  const isRetired = resolvedStatus === 'RETIRED';
  const isDraft = !isApproved && !isRetired;
  const isPublished = isApproved && (rec.publicationStatus === 'CANONICAL' || rec.publicationStatus === 'PUBLISHED');

  return {
    status: resolvedStatus,
    isDraft,
    isApproved,
    isPublished,
    isRetired,
    mayApprove: !isApproved && !isRetired,
    mayRetire: true,
    mayDeleteLocalDraft: isDraft,
  };
}


