/**
 * IDEMO 007 V2 - Server-Side Google Maps & Geocoding Resolver
 * Resolves place coordinates and geocoding deterministically.
 * ZERO Gemini calls, ZERO client-side API key exposure.
 */

import { Entity, FactRecord } from '../../types/idemo007v2';

export interface MapsEvidence {
  entityId: string;
  matchedName: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  providerPlaceId?: string;
  evidenceSource: 'MAPS';
  retrievedAt: string;
}

export interface ResolvePlaceResult {
  success: boolean;
  evidence?: MapsEvidence;
  reason?: 'MAPS_NOT_CONFIGURED' | 'AMBIGUOUS_MAP_MATCH' | 'MAPS_NO_MATCH' | 'MAPS_TIMEOUT' | 'MAPS_ERROR';
  rawCandidateCount?: number;
}

/**
 * Resolves a single Entity's coordinates via Google Maps Places/Geocoding API server-side.
 * Accepts optional fetch override for unit testing / mocking.
 */
export async function resolveEntityLocation(
  entity: Entity,
  customFetch?: typeof fetch
): Promise<ResolvePlaceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey && !customFetch) {
    return {
      success: false,
      reason: 'MAPS_NOT_CONFIGURED',
    };
  }

  const queryTerm = [entity.canonicalName, entity.location, entity.address]
    .filter(Boolean)
    .join(', ');

  if (!queryTerm.trim()) {
    return {
      success: false,
      reason: 'MAPS_NO_MATCH',
    };
  }

  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
    queryTerm
  )}&inputtype=textquery&fields=formatted_address,name,geometry,place_id&key=${apiKey || 'MOCK_KEY'}`;

  const fetchFn = customFetch || globalThis.fetch;

  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      return { success: false, reason: 'MAPS_ERROR' };
    }
    const data = await res.json();

    if (data.status === 'ZERO_RESULTS' || !data.candidates || data.candidates.length === 0) {
      return { success: false, reason: 'MAPS_NO_MATCH', rawCandidateCount: 0 };
    }

    // Ambiguity Check: If multiple candidates return
    if (data.candidates.length > 1) {
      return {
        success: false,
        reason: 'AMBIGUOUS_MAP_MATCH',
        rawCandidateCount: data.candidates.length,
      };
    }

    const candidate = data.candidates[0];
    const location = candidate.geometry?.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return { success: false, reason: 'MAPS_NO_MATCH' };
    }

    return {
      success: true,
      rawCandidateCount: 1,
      evidence: {
        entityId: entity.id,
        matchedName: candidate.name || entity.canonicalName,
        formattedAddress: candidate.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        providerPlaceId: candidate.place_id,
        evidenceSource: 'MAPS',
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { success: false, reason: 'MAPS_ERROR' };
  }
}

/**
 * Converts MapsEvidence into a domain FactRecord.
 */
export function mapsEvidenceToFactRecord(evidence: MapsEvidence): FactRecord {
  return {
    id: `fact-maps-${evidence.entityId}-${Date.now()}`,
    entityId: evidence.entityId,
    factKey: 'coordinates',
    value: { lat: evidence.latitude, lng: evidence.longitude, address: evidence.formattedAddress },
    sourceType: 'MAPS',
    sourceTitle: `Google Maps Place Resolution (${evidence.matchedName})`,
    verifiedAt: evidence.retrievedAt,
    volatility: 'LOW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
