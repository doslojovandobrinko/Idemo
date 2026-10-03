/**
 * IDEMO 007 V2 - Dedicated Synthesis Cache Manager
 * 
 * Manages deterministic content-based caching for Gemini Editorial Outputs.
 * Strictly decoupled from FactPack caching.
 * 
 * Contract Version: '1'
 */

import crypto from 'crypto';
import { SynthesisInput, EditorialOutput } from '../../types/idemo007v2';

export const SYNTHESIS_CONTRACT_VERSION = '1';

/**
 * Computes a deterministic SHA-256 synthesis cache key based strictly on inputs
 * that can affect the generated EditorialOutput.
 * Excludes updatedAt timestamp to preserve caching across timestamp-only updates.
 */
export function generateSynthesisCacheKey(input: SynthesisInput): string {
  const { factPack, curatorNotes } = input;
  const primaryEntity = factPack.entities[0] || {
    id: '',
    canonicalName: '',
    entityType: 'PLACE',
    location: '',
    address: '',
  };

  // 1. Sorted fact content (factKey, value, sourceType) - EXCLUDES updatedAt
  const sortedFacts = [...(factPack.facts || [])]
    .sort((a, b) => a.factKey.localeCompare(b.factKey))
    .map((f) => {
      const valStr = typeof f.value === 'object' ? JSON.stringify(f.value) : String(f.value);
      return `${f.factKey}:${valStr}:${f.sourceType}`;
    })
    .join('||');

  // 2. Curator emphasis & notes
  const curatorText = curatorNotes || factPack.curatorInput?.emphasis || factPack.curatorInput?.curatorNotes || '';

  // 3. Primary entity canonical identity & location
  const primaryLoc = factPack.geography?.primaryLocation || primaryEntity.location || '';
  const primaryAddr = factPack.geography?.address || primaryEntity.address || '';

  // 4. Journey Data fields supplied to synthesis (if recommendationType === 'JOURNEY')
  let journeyStr = '';
  if (factPack.recommendationType === 'JOURNEY' && factPack.journeyData) {
    const stopsStr = (factPack.journeyData.stops || [])
      .map((s) => `${s.entityId}:${s.stopOrder}:${s.componentRole}`)
      .join(',');
    journeyStr = `stops[${stopsStr}]|dur[${factPack.journeyData.totalDurationMinutes || 0}]|dist[${factPack.journeyData.totalDistanceKm || 0}]`;
  }

  // Combine canonical payload
  const canonicalPayload = [
    `v:${SYNTHESIS_CONTRACT_VERSION}`,
    `type:${factPack.recommendationType}`,
    `id:${primaryEntity.id}`,
    `name:${primaryEntity.canonicalName}`,
    `entityType:${primaryEntity.entityType}`,
    `loc:${primaryLoc}`,
    `addr:${primaryAddr}`,
    `curator:${curatorText}`,
    `facts:${sortedFacts}`,
    `journey:${journeyStr}`,
  ].join(':::');

  const hash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
  return `synth_cache_v${SYNTHESIS_CONTRACT_VERSION}_${hash}`;
}

interface CachedSynthesisRecord {
  editorialOutput: EditorialOutput;
  cachedAt: number;
  cacheKey: string;
}

// In-memory synthesis cache map
const localSynthesisCache = new Map<string, CachedSynthesisRecord>();

/**
 * Retrieve cached EditorialOutput if present.
 */
export async function getCachedSynthesis(cacheKey: string): Promise<EditorialOutput | null> {
  const record = localSynthesisCache.get(cacheKey);
  if (record) {
    return record.editorialOutput;
  }
  return null;
}

/**
 * Store EditorialOutput in cache.
 */
export async function setCachedSynthesis(cacheKey: string, output: EditorialOutput): Promise<void> {
  localSynthesisCache.set(cacheKey, {
    editorialOutput: output,
    cachedAt: Date.now(),
    cacheKey,
  });
}

/**
 * Clear all cached synthesis entries (primarily for test resets).
 */
export function clearSynthesisCache(): void {
  localSynthesisCache.clear();
}
