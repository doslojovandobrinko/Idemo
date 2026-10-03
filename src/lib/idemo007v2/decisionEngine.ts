/**
 * IDEMO 007 V2 - Deterministic Freshness, Fact-Gap & External-Lookup Decision Engine
 * Decides whether a proposed Recommendation has sufficient trusted/current information
 * or requires Search, Maps, Search & Maps, or Curator Review.
 *
 * ZERO Gemini calls, ZERO Google Search calls, ZERO Google Maps calls.
 */

import {
  BuildFactPackInput,
  LookupDecision,
  LookupDecisionOutcome,
  FactRecord,
  Entity,
  JourneyComponent,
  CacheStatus,
  FactConflict,
} from '../../types/idemo007v2';
import { evaluateFactFreshness } from './factFreshness';
import { detectAndReconcileFactConflicts } from './sourceAuthority';

/**
 * Evaluates external lookup requirements deterministically.
 */
export function evaluateLookupDecision(
  input: BuildFactPackInput,
  processedFacts: FactRecord[],
  entities: Entity[],
  journeyComponents: JourneyComponent[],
  reconciledConflicts: FactConflict[] = []
): LookupDecision {
  const { recommendationType, curatorInput = {} } = input;

  const reasons: string[] = [];
  const missingFacts: string[] = [];
  const staleFacts: string[] = [];
  const mapsNeeds: string[] = [];
  const searchNeeds: string[] = [];
  const curatorReviewNeeds: string[] = [];

  // 1. Check Action Exemption Rules
  const action = curatorInput.action;
  const isEditorialOrMediaAction =
    action === 'EDITORIAL_EDIT' ||
    action === 'MEDIA_EDIT' ||
    action === 'CATEGORY_EDIT' ||
    action === 'LAYOUT_EDIT' ||
    action === 'LOCALIZE';

  if (isEditorialOrMediaAction) {
    // Check if basic critical entities still exist
    if (entities.length > 0) {
      return {
        outcome: 'NO_EXTERNAL_LOOKUP',
        reasons: ['ACTION_EXEMPT_FROM_LOOKUP'],
        missingFacts: [],
        staleFacts: [],
        mapsNeeds: [],
        searchNeeds: [],
        curatorReviewNeeds: [],
      };
    }
  }

  // 2. Conflict Evaluation
  const unresolvedConflicts = reconciledConflicts.filter((c) => !c.isReconciled);
  if (unresolvedConflicts.length > 0) {
    curatorReviewNeeds.push('UNRESOLVED_FACT_CONFLICT');
    reasons.push('CONFLICTING_ACTIVE_FACTS');
  }

  // 3. Fact Freshness Evaluation
  for (const fact of processedFacts) {
    const freshness = evaluateFactFreshness(fact);
    if (!freshness.isFresh) {
      // Check if it's an operational fact (HIGH or MEDIUM volatility)
      if (fact.volatility === 'HIGH' || fact.volatility === 'MEDIUM') {
        staleFacts.push(fact.factKey);
        searchNeeds.push(`STALE_OPERATIONAL_FACT_${fact.factKey.toUpperCase()}`);
        if (!reasons.includes('STALE_OPERATIONAL_FACTS')) {
          reasons.push('STALE_OPERATIONAL_FACTS');
        }
      }
    }
  }

  // 4. Curator Explicit Request
  if (curatorInput.requiresSearchVerification) {
    searchNeeds.push('CURATOR_REQUESTED_VERIFICATION');
    if (!reasons.includes('CURATOR_EXPLICIT_SEARCH_REQUEST')) {
      reasons.push('CURATOR_EXPLICIT_SEARCH_REQUEST');
    }
  }

  // 5. Recommendation Type Rules

  // --- PLACE ---
  if (recommendationType === 'PLACE') {
    const primaryPlace = entities.find((e) => e.entityType === 'PLACE') || entities[0];

    if (!primaryPlace) {
      curatorReviewNeeds.push('MISSING_PLACE_ENTITY');
      reasons.push('NO_ENTITIES_PROVIDED');
    } else {
      // Identity
      if (!primaryPlace.canonicalName) {
        curatorReviewNeeds.push('MISSING_PLACE_CANONICAL_NAME');
        reasons.push('MISSING_CANONICAL_NAME');
      }

      // Location / Coordinates
      if (!primaryPlace.coordinates) {
        mapsNeeds.push('MISSING_PLACE_COORDINATES');
        reasons.push('MISSING_COORDINATES');
      }

      // Significance / Reason-to-visit fact
      const hasSignificanceFact = processedFacts.some((f) => {
        const k = f.factKey.toLowerCase();
        return (
          k.includes('significance') ||
          k.includes('history') ||
          k.includes('unesco') ||
          k.includes('reason_to_visit') ||
          k.includes('summary')
        );
      });

      if (!hasSignificanceFact && processedFacts.length === 0) {
        missingFacts.push('SIGNIFICANCE_FACT');
        searchNeeds.push('MISSING_SIGNIFICANCE_FACT');
        reasons.push('MISSING_SIGNIFICANCE_FACT');
      }
    }
  }

  // --- EXPERIENCE ---
  if (recommendationType === 'EXPERIENCE') {
    // Check commercial provider trust
    const commercialEntities = entities.filter(
      (e) =>
        e.entityType === 'ACCOMMODATION' ||
        e.entityType === 'RESTAURANT' ||
        e.entityType === 'GUIDE' ||
        e.entityType === 'TRANSPORT' ||
        e.entityType === 'EXPERIENCE_PROVIDER'
    );

    const requiresCommercialProvider = curatorInput.requiresCommercialProvider || commercialEntities.length > 0;

    if (requiresCommercialProvider) {
      const unverifiedProvider = commercialEntities.find((e) => e.trustLevel === 'UNVERIFIED');
      if (unverifiedProvider) {
        curatorReviewNeeds.push(`UNVERIFIED_COMMERCIAL_PROVIDER_${unverifiedProvider.id}`);
        reasons.push('UNVERIFIED_COMMERCIAL_PROVIDER');
      }
    }

    // Check experience context facts
    if (processedFacts.length === 0) {
      missingFacts.push('EXPERIENCE_CONTEXT');
      searchNeeds.push('MISSING_EXPERIENCE_FACTS');
      reasons.push('MISSING_EXPERIENCE_FACTS');
    }

    // Check location / coordinates
    const hasCoordinates = entities.some((e) => e.coordinates != null);
    if (!hasCoordinates) {
      mapsNeeds.push('MISSING_EXPERIENCE_COORDINATES');
      reasons.push('MISSING_COORDINATES');
    }
  }

  // --- JOURNEY ---
  if (recommendationType === 'JOURNEY') {
    // Stop count check
    if (journeyComponents.length < 2) {
      curatorReviewNeeds.push('JOURNEY_LESS_THAN_2_STOPS');
      reasons.push('JOURNEY_INSUFFICIENT_STOPS');
    }

    // Duplicate stop_order check
    const stopOrders = journeyComponents.map((c) => c.stopOrder);
    if (new Set(stopOrders).size !== stopOrders.length) {
      curatorReviewNeeds.push('JOURNEY_DUPLICATE_STOP_ORDER');
      reasons.push('JOURNEY_DUPLICATE_STOP_ORDER');
    }

    // Coordinates check for all stops
    for (const comp of journeyComponents) {
      const matchEntity = entities.find((e) => e.id === comp.entityId);
      if (!matchEntity || !matchEntity.coordinates) {
        mapsNeeds.push(`MISSING_STOP_COORDINATES_ORDER_${comp.stopOrder}`);
        if (!reasons.includes('JOURNEY_STOP_MISSING_COORDINATES')) {
          reasons.push('JOURNEY_STOP_MISSING_COORDINATES');
        }
      }
    }

    // Travel time & distance check for ordered stops
    for (const comp of journeyComponents) {
      if (comp.stopOrder > 1) {
        if (comp.travelFromPreviousMinutes == null || comp.distanceFromPreviousKm == null) {
          mapsNeeds.push(`MISSING_ROUTE_TIMING_ORDER_${comp.stopOrder}`);
          if (!reasons.includes('JOURNEY_MISSING_ROUTE_TIMING')) {
            reasons.push('JOURNEY_MISSING_ROUTE_TIMING');
          }
        }
      }
    }

    // Overnight accommodation trust check
    const overnightStops = journeyComponents.filter((c) => c.isOvernightStay || c.componentRole === 'OVERNIGHT');
    for (const stop of overnightStops) {
      const matchEntity = entities.find((e) => e.id === stop.entityId);
      if (matchEntity && matchEntity.trustLevel === 'UNVERIFIED') {
        curatorReviewNeeds.push(`UNVERIFIED_OVERNIGHT_PROVIDER_${matchEntity.id}`);
        if (!reasons.includes('UNVERIFIED_OVERNIGHT_PROVIDER')) {
          reasons.push('UNVERIFIED_OVERNIGHT_PROVIDER');
        }
      }
    }

    // Required overnight check
    if (curatorInput.requiresOvernight && overnightStops.length === 0) {
      curatorReviewNeeds.push('MISSING_REQUIRED_OVERNIGHT_STAY');
      reasons.push('MISSING_REQUIRED_OVERNIGHT_STAY');
    }

    // Mathematical Duration / Pacing check
    const totalActivityMinutes = journeyComponents.reduce(
      (acc, curr) => acc + (curr.recommendedDurationMinutes || 0),
      0
    );
    const hasMissingTravelTime = journeyComponents.some((c) => c.stopOrder > 1 && c.travelFromPreviousMinutes == null);
    const totalTravelMinutes = journeyComponents.reduce(
      (acc, curr) => acc + (curr.travelFromPreviousMinutes || 0),
      0
    );

    if (curatorInput.declaredDurationMinutes != null) {
      if (hasMissingTravelTime) {
        // Missing travel timing -> MAPS_REQUIRED rather than guessing duration
        if (!mapsNeeds.includes('MISSING_ROUTE_TIMING')) {
          mapsNeeds.push('MISSING_ROUTE_TIMING');
          if (!reasons.includes('JOURNEY_MISSING_ROUTE_TIMING')) {
            reasons.push('JOURNEY_MISSING_ROUTE_TIMING');
          }
        }
      } else {
        const totalCalculated = totalActivityMinutes + totalTravelMinutes;
        if (totalCalculated > curatorInput.declaredDurationMinutes) {
          curatorReviewNeeds.push('JOURNEY_DURATION_EXCEEDED');
          reasons.push('JOURNEY_DURATION_EXCEEDED');
        }
      }
    }
  }

  // 6. Outcome Determination
  let outcome: LookupDecisionOutcome = 'NO_EXTERNAL_LOOKUP';

  if (curatorReviewNeeds.length > 0) {
    outcome = 'CURATOR_REVIEW_REQUIRED';
  } else if (searchNeeds.length > 0 && mapsNeeds.length > 0) {
    outcome = 'SEARCH_AND_MAPS_REQUIRED';
  } else if (searchNeeds.length > 0) {
    outcome = 'SEARCH_REQUIRED';
  } else if (mapsNeeds.length > 0) {
    outcome = 'MAPS_REQUIRED';
  } else {
    outcome = 'NO_EXTERNAL_LOOKUP';
  }

  return {
    outcome,
    reasons,
    missingFacts,
    staleFacts,
    mapsNeeds,
    searchNeeds,
    curatorReviewNeeds,
  };
}

/**
 * Evaluates cache status deterministically for a FactPack.
 */
export function evaluateCacheStatus(input: BuildFactPackInput): CacheStatus {
  if (!input.cachedFactPack) {
    return 'CACHE_MISS';
  }

  const cachedAt = new Date(input.cachedFactPack.generatedAt).getTime();
  const ageInHours = (Date.now() - cachedAt) / (1000 * 60 * 60);

  // Cache is stale if older than 24 hours
  if (ageInHours > 24) {
    return 'CACHE_STALE';
  }

  return 'CACHE_VALID';
}
