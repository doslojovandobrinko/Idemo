/**
 * IDEMO 007 V2 - Fact Persistence & Persistent FactPack Cache Manager
 * Manages Supabase entity_facts persistence and deterministic fact_pack_cache invalidation.
 */

import { FactRecord, FactPack, BuildFactPackInput } from '../../types/idemo007v2';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { evaluateFactFreshness } from './factFreshness';

let supabaseClient: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

/**
 * Computes a deterministic cache key for a FactPack.
 * Materials: recommendationType, sorted entity IDs, journey components, factual constraints.
 * Excludes: action, layout, media, localization.
 */
export function generateFactPackCacheKey(input: BuildFactPackInput): string {
  const entityIds = (input.entities || []).map((e) => e.id).sort().join(',');
  const journeyStops = (input.journeyComponents || [])
    .map((c) => `${c.entityId}:${c.stopOrder}:${c.isOvernightStay}`)
    .sort()
    .join('|');

  const constraints = [
    input.curatorInput?.requiresOvernight ? 'overnight:true' : '',
    input.curatorInput?.declaredDurationMinutes ? `dur:${input.curatorInput.declaredDurationMinutes}` : '',
  ]
    .filter(Boolean)
    .join('&');

  return `fp_cache_${input.recommendationType}_${entityIds}_${journeyStops}_${constraints}`;
}

// In-memory cache fallback for local/unit testing when Supabase is offline
const localFactPackCache = new Map<string, { pack: FactPack; cachedAt: number }>();

/**
 * Stores a FactPack into the persistent cache.
 */
export async function setCachedFactPack(cacheKey: string, factPack: FactPack): Promise<boolean> {
  localFactPackCache.set(cacheKey, { pack: factPack, cachedAt: Date.now() });

  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('fact_pack_cache').upsert(
      {
        cache_key: cacheKey,
        recommendation_type: factPack.recommendationType,
        fact_pack_json: factPack,
        source_hash: cacheKey,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'cache_key' }
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Retrieves a FactPack from cache if valid and fresh.
 */
export async function getCachedFactPack(cacheKey: string): Promise<FactPack | null> {
  const local = localFactPackCache.get(cacheKey);
  if (local) {
    const ageHours = (Date.now() - local.cachedAt) / (1000 * 60 * 60);
    if (ageHours < 24) {
      // Freshness sanity check on cached facts
      const hasStaleHighFact = local.pack.facts.some((f) => {
        if (f.volatility === 'HIGH') {
          return !evaluateFactFreshness(f).isFresh;
        }
        return false;
      });
      if (!hasStaleHighFact) {
        return local.pack;
      }
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('fact_pack_cache')
      .select('fact_pack_json, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error || !data) return null;

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return null;
    }

    const pack = data.fact_pack_json as FactPack;
    const hasStaleHighFact = pack.facts.some((f) => {
      if (f.volatility === 'HIGH') {
        return !evaluateFactFreshness(f).isFresh;
      }
      return false;
    });

    if (hasStaleHighFact) return null;

    return pack;
  } catch {
    return null;
  }
}

/**
 * Persists newly acquired external facts into the entity_facts table.
 */
export async function persistExternalFacts(facts: FactRecord[]): Promise<number> {
  if (facts.length === 0) return 0;

  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  try {
    const recordsToInsert = facts.map((f) => ({
      entity_id: f.entityId,
      fact_key: f.factKey,
      value: f.value,
      source_type: f.sourceType,
      source_url: f.sourceUrl || null,
      source_title: f.sourceTitle || null,
      verified_at: f.verifiedAt || new Date().toISOString(),
      valid_until: f.validUntil || null,
      volatility: f.volatility || 'MEDIUM',
    }));

    const { data, error } = await supabase.from('entity_facts').insert(recordsToInsert).select('id');
    if (error) return 0;
    return data ? data.length : 0;
  } catch {
    return 0;
  }
}
