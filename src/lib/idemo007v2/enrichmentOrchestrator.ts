/**
 * IDEMO 007 V2 - External Evidence Orchestrator
 * Executes ONLY the external lookups explicitly required by LookupDecision.
 * Guaranteed ZERO Recommendation editorial synthesis, ZERO localization.
 */

import {
  FactPack,
  LookupDecision,
  BuildFactPackInput,
  FactRecord,
  Entity,
  JourneyComponent,
} from '../../types/idemo007v2';
import { buildFactPack } from './factPackBuilder';
import { resolveEntityLocation, mapsEvidenceToFactRecord } from './mapsResolver';
import { computeJourneyRoutes, evaluateRouteFeasibility } from './journeyRouter';
import { performTargetedSearch } from './targetedSearch';
import { persistExternalFacts, generateFactPackCacheKey, setCachedFactPack, getCachedFactPack } from './factCacheManager';
import { logDecisionTelemetry } from './telemetry';

export interface EnrichmentTelemetry {
  runId: string;
  lookupOutcome: string;
  mapsCallCount: number;
  routesCallCount: number;
  searchGeminiCallCount: number;
  searchQueryCount: number;
  cacheHit: boolean;
  externalDurationMs: number;
  status: string;
}

export interface EnrichmentResult {
  factPack: FactPack;
  status:
    | 'ENRICHMENT_COMPLETED'
    | 'NO_LOOKUP_PERFORMED'
    | 'BLOCKED_CURATOR_REVIEW'
    | 'BUDGET_EXCEEDED'
    | 'ENRICHMENT_FAILED';
  telemetry: EnrichmentTelemetry;
  reason?: string;
}

/**
 * Main external evidence enrichment orchestrator.
 */
export async function enrichFactPack(params: {
  runId?: string;
  factPack: FactPack;
  lookupDecision: LookupDecision;
  buildInput?: BuildFactPackInput;
  customFetch?: typeof fetch;
  customGenAI?: any;
}): Promise<EnrichmentResult> {
  const startTime = Date.now();
  const runId = params.runId || `run-enrich-${Date.now()}`;
  const { factPack, lookupDecision, buildInput, customFetch, customGenAI } = params;

  let mapsCallCount = 0;
  let routesCallCount = 0;
  let searchGeminiCallCount = 0;
  let searchQueryCount = 0;
  let cacheHit = false;

  // 1. Check Cache Hit if buildInput provided
  if (buildInput) {
    const cacheKey = generateFactPackCacheKey(buildInput);
    const cachedPack = await getCachedFactPack(cacheKey);
    if (cachedPack) {
      cacheHit = true;
      return {
        factPack: cachedPack,
        status: 'NO_LOOKUP_PERFORMED',
        telemetry: {
          runId,
          lookupOutcome: 'NO_EXTERNAL_LOOKUP',
          mapsCallCount: 0,
          routesCallCount: 0,
          searchGeminiCallCount: 0,
          searchQueryCount: 0,
          cacheHit: true,
          externalDurationMs: Date.now() - startTime,
          status: 'CACHE_HIT',
        },
      };
    }
  }

  // 2. Branch: NO_EXTERNAL_LOOKUP
  if (lookupDecision.outcome === 'NO_EXTERNAL_LOOKUP') {
    return {
      factPack,
      status: 'NO_LOOKUP_PERFORMED',
      telemetry: {
        runId,
        lookupOutcome: 'NO_EXTERNAL_LOOKUP',
        mapsCallCount: 0,
        routesCallCount: 0,
        searchGeminiCallCount: 0,
        searchQueryCount: 0,
        cacheHit: false,
        externalDurationMs: Date.now() - startTime,
        status: 'NO_EXTERNAL_LOOKUP',
      },
    };
  }

  // 3. Branch: CURATOR_REVIEW_REQUIRED
  if (lookupDecision.outcome === 'CURATOR_REVIEW_REQUIRED') {
    return {
      factPack,
      status: 'BLOCKED_CURATOR_REVIEW',
      reason: lookupDecision.reasons.join(', '),
      telemetry: {
        runId,
        lookupOutcome: 'CURATOR_REVIEW_REQUIRED',
        mapsCallCount: 0,
        routesCallCount: 0,
        searchGeminiCallCount: 0,
        searchQueryCount: 0,
        cacheHit: false,
        externalDurationMs: Date.now() - startTime,
        status: 'BLOCKED_CURATOR_REVIEW',
      },
    };
  }

  // Working state variables
  const updatedEntities: Entity[] = [...factPack.entities];
  const newFactsToPersist: FactRecord[] = [];
  const newFactsForPack: FactRecord[] = [...factPack.facts];
  let updatedJourneyComponents: JourneyComponent[] = factPack.journeyData?.stops
    ? [...factPack.journeyData.stops]
    : [];

  const needMaps =
    lookupDecision.outcome === 'MAPS_REQUIRED' || lookupDecision.outcome === 'SEARCH_AND_MAPS_REQUIRED';
  const needSearch =
    lookupDecision.outcome === 'SEARCH_REQUIRED' || lookupDecision.outcome === 'SEARCH_AND_MAPS_REQUIRED';

  // --- MAPS / PLACE RESOLUTION ---
  if (needMaps && lookupDecision.mapsNeeds.length > 0) {
    // Budget limit: max 5 place resolution calls
    if (mapsCallCount >= 5) {
      return {
        factPack,
        status: 'BUDGET_EXCEEDED',
        reason: 'EXTERNAL_LOOKUP_BUDGET_EXCEEDED: Maximum Maps calls budget (5) exceeded',
        telemetry: {
          runId,
          lookupOutcome: lookupDecision.outcome,
          mapsCallCount,
          routesCallCount,
          searchGeminiCallCount,
          searchQueryCount,
          cacheHit: false,
          externalDurationMs: Date.now() - startTime,
          status: 'BUDGET_EXCEEDED',
        },
      };
    }

    // Resolve missing place coordinates
    for (let i = 0; i < updatedEntities.length; i++) {
      const entity = updatedEntities[i];
      if (!entity.coordinates) {
        mapsCallCount++;
        const mapRes = await resolveEntityLocation(entity, customFetch);

        if (mapRes.success && mapRes.evidence) {
          // Update entity coordinates
          updatedEntities[i] = {
            ...entity,
            coordinates: { lat: mapRes.evidence.latitude, lng: mapRes.evidence.longitude },
            address: entity.address || mapRes.evidence.formattedAddress,
          };
          const newFact = mapsEvidenceToFactRecord(mapRes.evidence);
          newFactsToPersist.push(newFact);
          newFactsForPack.push(newFact);
        } else if (mapRes.reason === 'AMBIGUOUS_MAP_MATCH') {
          // Ambiguous map match forces Curator Review!
          const blockedPack = {
            ...factPack,
            lookupDecision: {
              ...lookupDecision,
              outcome: 'CURATOR_REVIEW_REQUIRED' as const,
              curatorReviewNeeds: [...lookupDecision.curatorReviewNeeds, 'AMBIGUOUS_MAP_MATCH'],
              reasons: [...lookupDecision.reasons, 'AMBIGUOUS_MAP_MATCH'],
            },
          };
          return {
            factPack: blockedPack,
            status: 'BLOCKED_CURATOR_REVIEW',
            reason: 'AMBIGUOUS_MAP_MATCH',
            telemetry: {
              runId,
              lookupOutcome: 'CURATOR_REVIEW_REQUIRED',
              mapsCallCount,
              routesCallCount,
              searchGeminiCallCount,
              searchQueryCount,
              cacheHit: false,
              externalDurationMs: Date.now() - startTime,
              status: 'AMBIGUOUS_MAP_MATCH',
            },
          };
        }
      }
    }

    // --- JOURNEY ROUTE RESOLUTION ---
    if (
      factPack.recommendationType === 'JOURNEY' &&
      updatedJourneyComponents.length >= 2 &&
      lookupDecision.mapsNeeds.some((n) => n.includes('ROUTE_TIMING') || n.includes('COORDINATES'))
    ) {
      if (routesCallCount >= 1) {
        return {
          factPack,
          status: 'BUDGET_EXCEEDED',
          reason: 'EXTERNAL_LOOKUP_BUDGET_EXCEEDED: Maximum Routes call budget (1) exceeded',
          telemetry: {
            runId,
            lookupOutcome: lookupDecision.outcome,
            mapsCallCount,
            routesCallCount,
            searchGeminiCallCount,
            searchQueryCount,
            cacheHit: false,
            externalDurationMs: Date.now() - startTime,
            status: 'BUDGET_EXCEEDED',
          },
        };
      }

      routesCallCount++;
      const routeRes = await computeJourneyRoutes(
        updatedJourneyComponents,
        updatedEntities,
        customFetch
      );

      if (routeRes.success && routeRes.segments.length > 0) {
        // Update Journey components with route travel times
        updatedJourneyComponents = updatedJourneyComponents.map((comp) => {
          const matchingSegment = routeRes.segments.find((s) => s.toEntityId === comp.entityId);
          if (matchingSegment) {
            return {
              ...comp,
              travelFromPreviousMinutes: matchingSegment.durationMinutes,
              distanceFromPreviousKm: matchingSegment.distanceKm,
            };
          }
          return comp;
        });

        // Route Feasibility Re-evaluation
        const feasibility = evaluateRouteFeasibility(
          updatedJourneyComponents,
          factPack.curatorInput?.declaredDurationMinutes
        );

        if (!feasibility.isFeasible) {
          const blockedPack = {
            ...factPack,
            lookupDecision: {
              ...lookupDecision,
              outcome: 'CURATOR_REVIEW_REQUIRED' as const,
              curatorReviewNeeds: [...lookupDecision.curatorReviewNeeds, 'JOURNEY_DURATION_EXCEEDED'],
              reasons: [...lookupDecision.reasons, 'JOURNEY_DURATION_EXCEEDED'],
            },
          };
          return {
            factPack: blockedPack,
            status: 'BLOCKED_CURATOR_REVIEW',
            reason: feasibility.reason,
            telemetry: {
              runId,
              lookupOutcome: 'CURATOR_REVIEW_REQUIRED',
              mapsCallCount,
              routesCallCount,
              searchGeminiCallCount,
              searchQueryCount,
              cacheHit: false,
              externalDurationMs: Date.now() - startTime,
              status: 'JOURNEY_DURATION_EXCEEDED',
            },
          };
        }
      }
    }
  }

  // --- TARGETED SEARCH RESEARCH ---
  if (needSearch && lookupDecision.searchNeeds.length > 0) {
    if (searchGeminiCallCount >= 1) {
      return {
        factPack,
        status: 'BUDGET_EXCEEDED',
        reason: 'EXTERNAL_LOOKUP_BUDGET_EXCEEDED: Maximum Search Gemini call budget (1) exceeded',
        telemetry: {
          runId,
          lookupOutcome: lookupDecision.outcome,
          mapsCallCount,
          routesCallCount,
          searchGeminiCallCount,
          searchQueryCount,
          cacheHit: false,
          externalDurationMs: Date.now() - startTime,
          status: 'BUDGET_EXCEEDED',
        },
      };
    }

    searchGeminiCallCount++;
    const primaryEntity = updatedEntities[0];

    if (primaryEntity) {
      const searchRes = await performTargetedSearch({
        entity: primaryEntity,
        missingFactKeys: lookupDecision.missingFacts,
        staleFactKeys: lookupDecision.staleFacts,
        runId,
        customGenAI,
      });

      searchQueryCount = searchRes.searchQueriesCount;

      if (searchRes.success && searchRes.facts.length > 0) {
        for (const item of searchRes.facts) {
          const newFactRecord: FactRecord = {
            id: `fact-search-${primaryEntity.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            entityId: primaryEntity.id,
            factKey: item.factKey,
            value: item.value,
            sourceType: item.sourceType || 'SEARCH_GROUNDED',
            sourceUrl: item.sourceUrl,
            sourceTitle: item.sourceTitle,
            verifiedAt: new Date().toISOString(),
            volatility: item.factKey.includes('opening_hours') ? 'HIGH' : 'MEDIUM',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          newFactsToPersist.push(newFactRecord);
          newFactsForPack.push(newFactRecord);
        }
      }
    }
  }

  // 4. Persist external facts into Supabase
  if (newFactsToPersist.length > 0) {
    await persistExternalFacts(newFactsToPersist);
  }

  // 5. Rebuild FactPack with enriched evidence using deterministic FactPack builder
  const rebuildInput: BuildFactPackInput = {
    recommendationType: factPack.recommendationType,
    curatorInput: factPack.curatorInput,
    entities: updatedEntities,
    facts: newFactsForPack,
    journeyComponents: updatedJourneyComponents,
  };

  const enrichedFactPack = buildFactPack(rebuildInput);

  // 6. Persist into FactPack cache
  const cacheKey = generateFactPackCacheKey(rebuildInput);
  await setCachedFactPack(cacheKey, enrichedFactPack);

  const durationMs = Date.now() - startTime;

  return {
    factPack: enrichedFactPack,
    status: 'ENRICHMENT_COMPLETED',
    telemetry: {
      runId,
      lookupOutcome: enrichedFactPack.lookupDecision?.outcome || lookupDecision.outcome,
      mapsCallCount,
      routesCallCount,
      searchGeminiCallCount,
      searchQueryCount,
      cacheHit: false,
      externalDurationMs: durationMs,
      status: 'ENRICHMENT_COMPLETED',
    },
  };
}
