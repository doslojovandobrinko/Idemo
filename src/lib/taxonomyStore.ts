/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { isForeignServiceAreaRow, isSerbiaServiceAreaRow } from './destinationIsolation';

export interface TaxonomyCache {
  defaultLanguageId: string | null;
  defaultServiceAreaId: string | null;
  defaultCapabilityIds: string[];
  isLoaded: boolean;
  loadError: string | null;
}

let cache: TaxonomyCache = {
  defaultLanguageId: null,
  defaultServiceAreaId: null,
  defaultCapabilityIds: [],
  isLoaded: false,
  loadError: null,
};

export async function bootstrapTaxonomy(): Promise<TaxonomyCache> {
  if (cache.isLoaded) return cache;

  if (!isSupabaseConfigured()) {
    cache.loadError = 'Supabase environment not configured for taxonomy bootstrap.';
    return cache;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    cache.loadError = 'Failed to initialize Supabase client for taxonomy.';
    return cache;
  }

  try {
    const [langRes, areaRes, capRes] = await Promise.all([
      supabase.from('languages').select('id, code').limit(10),
      supabase.from('service_areas').select('*').limit(20),
      supabase.from('capabilities').select('id, code').limit(20),
    ]);

    if (langRes.error || areaRes.error) {
      cache.loadError = `Taxonomy query failed: ${langRes.error?.message || areaRes.error?.message}`;
      return cache;
    }

    const langRows = langRes.data || [];
    const preferredLang =
      langRows.find((l: any) => String(l.code || '').toLowerCase() === 'en') ||
      langRows.find((l: any) => String(l.code || '').toLowerCase() === 'sr') ||
      langRows[0];
    const langId = preferredLang?.id || null;

    const areaRows = areaRes.data || [];
    const preferredArea =
      areaRows.find((a: any) => isSerbiaServiceAreaRow(a)) ||
      areaRows.find((a: any) => !isForeignServiceAreaRow(a)) ||
      areaRows[0];
    const areaId = preferredArea?.id || null;
    const capIds = (capRes.data || []).map((c: any) => c.id).filter(Boolean);

    if (!langId || !areaId) {
      cache.loadError = 'Taxonomy tables returned empty results for primary language or service area.';
      return cache;
    }

    cache = {
      defaultLanguageId: langId,
      defaultServiceAreaId: areaId,
      defaultCapabilityIds: capIds,
      isLoaded: true,
      loadError: null,
    };
    return cache;
  } catch (err: any) {
    cache.loadError = `Taxonomy bootstrap exception: ${err?.message || String(err)}`;
    return cache;
  }
}

export function getTaxonomyCache(): TaxonomyCache {
  return cache;
}
