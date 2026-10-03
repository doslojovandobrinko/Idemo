/**
 * IDEMO 007 V2 - Journey Route Computation & Feasibility Evaluator
 * Computes travel segment durations and distances using Google Routes API server-side.
 * Re-evaluates mathematical itinerary feasibility deterministically.
 */

import { JourneyComponent, Entity } from '../../types/idemo007v2';

export interface RouteSegmentEvidence {
  fromEntityId: string;
  toEntityId: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  retrievedAt: string;
  sourceType: 'MAPS';
}

export interface RouteComputationResult {
  success: boolean;
  segments: RouteSegmentEvidence[];
  reason?: 'MAPS_NOT_CONFIGURED' | 'MISSING_STOP_COORDINATES' | 'ROUTES_ERROR';
}

/**
 * Computes route segment timings and distances for ordered journey stops.
 * Accepts optional fetch override for unit testing / mocking.
 */
export async function computeJourneyRoutes(
  stops: JourneyComponent[],
  entities: Entity[],
  customFetch?: typeof fetch
): Promise<RouteComputationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

  const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

  if (sortedStops.length < 2) {
    return { success: true, segments: [] };
  }

  // Ensure all stops have coordinates
  const stopEntities = sortedStops.map((stop) => entities.find((e) => e.id === stop.entityId));
  const missingCoords = stopEntities.some((e) => !e || !e.coordinates);

  if (missingCoords) {
    return {
      success: false,
      segments: [],
      reason: 'MISSING_STOP_COORDINATES',
    };
  }

  if (!apiKey && !customFetch) {
    return {
      success: false,
      segments: [],
      reason: 'MAPS_NOT_CONFIGURED',
    };
  }

  const segments: RouteSegmentEvidence[] = [];
  const fetchFn = customFetch || globalThis.fetch;

  // Compute consecutive pairs (Hard budget: 1 route computation operation)
  try {
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const originComp = sortedStops[i];
      const destComp = sortedStops[i + 1];

      const originEntity = stopEntities[i]!;
      const destEntity = stopEntities[i + 1]!;

      const originLat = originEntity.coordinates!.lat;
      const originLng = originEntity.coordinates!.lng;
      const destLat = destEntity.coordinates!.lat;
      const destLng = destEntity.coordinates!.lng;

      // Google Routes API (v2) computeRoutes endpoint
      const routesUrl = `https://routes.googleapis.com/v2/computeRoutes`;
      const requestBody = {
        origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
        destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      };

      const res = await fetchFn(routesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey || 'MOCK_KEY',
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        return { success: false, segments: [], reason: 'ROUTES_ERROR' };
      }

      const data = await res.json();
      const route = data.routes?.[0];

      if (!route) {
        return { success: false, segments: [], reason: 'ROUTES_ERROR' };
      }

      const distanceMeters = route.distanceMeters || 0;
      const durationStr = route.duration || '0s';
      const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;

      segments.push({
        fromEntityId: originComp.entityId,
        toEntityId: destComp.entityId,
        distanceMeters,
        durationSeconds,
        distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
        durationMinutes: Math.ceil(durationSeconds / 60),
        retrievedAt: new Date().toISOString(),
        sourceType: 'MAPS',
      });
    }

    return {
      success: true,
      segments,
    };
  } catch (err) {
    return {
      success: false,
      segments: [],
      reason: 'ROUTES_ERROR',
    };
  }
}

/**
 * Re-evaluates mathematical journey duration feasibility after route enrichment.
 */
export function evaluateRouteFeasibility(
  stops: JourneyComponent[],
  declaredDurationMinutes?: number | null
): { isFeasible: boolean; totalCalculatedMinutes: number; reason?: string } {
  const totalActivityMinutes = stops.reduce((acc, c) => acc + (c.recommendedDurationMinutes || 0), 0);
  const totalTravelMinutes = stops.reduce((acc, c) => acc + (c.travelFromPreviousMinutes || 0), 0);

  const totalCalculatedMinutes = totalActivityMinutes + totalTravelMinutes;

  if (declaredDurationMinutes != null && totalCalculatedMinutes > declaredDurationMinutes) {
    return {
      isFeasible: false,
      totalCalculatedMinutes,
      reason: `Total activity (${totalActivityMinutes}m) + travel (${totalTravelMinutes}m) = ${totalCalculatedMinutes}m exceeds declared duration of ${declaredDurationMinutes}m`,
    };
  }

  return {
    isFeasible: true,
    totalCalculatedMinutes,
  };
}
