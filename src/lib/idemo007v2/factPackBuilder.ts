/**
 * IDEMO 007 V2 - Deterministic FactPack Builder
 * Assembles compact, structured FactPacks with provenance, freshness summaries,
 * source-authority conflict resolution, and deterministic Lookup Decisions.
 *
 * GUARANTEED: Zero Gemini calls, Zero Search calls, Zero Maps calls, No editorial prose generation.
 */

import {
  FactPack,
  BuildFactPackInput,
  Entity,
  FactRecord,
  JourneyComponent,
  FactGap,
} from '../../types/idemo007v2';
import { filterTrustedEntities, assignDeterministicVolatility } from './trustGuard';
import { summarizeFreshness } from './factFreshness';
import { detectAndReconcileFactConflicts } from './sourceAuthority';
import { evaluateLookupDecision, evaluateCacheStatus } from './decisionEngine';
import { logDecisionTelemetry } from './telemetry';

const FACTPACK_VERSION = '1.0';

/**
 * Builds a deterministic FactPack from provided entities, facts, and journey components.
 */
export function buildFactPack(input: BuildFactPackInput): FactPack {
  const {
    recommendationType,
    curatorInput = {},
    entities = [],
    facts = [],
    journeyComponents = [],
  } = input;

  // 1. Process facts with deterministic volatility
  const processedFacts: FactRecord[] = facts.map((f) => ({
    ...f,
    volatility: f.volatility || assignDeterministicVolatility(f.factKey),
  }));

  // 2. Identify trusted entities
  const trustedEntities = filterTrustedEntities(entities);

  // 3. Extract primary geography
  const primaryEntity = entities.find((e) => e.entityType === 'PLACE') || entities[0];
  const geography = primaryEntity
    ? {
        primaryLocation: primaryEntity.location || null,
        coordinates: primaryEntity.coordinates || null,
        address: primaryEntity.address || null,
        serviceAreaId: (primaryEntity.metadata as any)?.serviceAreaId || null,
      }
    : null;

  // 4. Process Journey components (sorted by stopOrder)
  let sortedComponents: JourneyComponent[] = [];
  if (recommendationType === 'JOURNEY' && journeyComponents.length > 0) {
    sortedComponents = [...journeyComponents].sort((a, b) => a.stopOrder - b.stopOrder);
  }

  // 5. Basic Gap Detection
  const unresolvedGaps: FactGap[] = detectFactGaps(
    recommendationType,
    entities,
    processedFacts,
    sortedComponents,
    curatorInput
  );

  // 6. Source Summary
  const officialSourcesCount = processedFacts.filter(
    (f) => f.sourceType === 'PRIMARY_OFFICIAL' || f.sourceType === 'CURATOR' || f.sourceType === 'PARTNER'
  ).length;
  const hasSearchGroundedFacts = processedFacts.some((f) => f.sourceType === 'SEARCH_GROUNDED');

  // 7. Calculate Journey metadata if applicable
  let journeyData = null;
  if (recommendationType === 'JOURNEY') {
    const totalDurationMinutes = sortedComponents.reduce(
      (acc, curr) => acc + (curr.recommendedDurationMinutes || 0) + (curr.travelFromPreviousMinutes || 0),
      0
    );
    const totalDistanceKm = sortedComponents.reduce(
      (acc, curr) => acc + (curr.distanceFromPreviousKm || 0),
      0
    );

    journeyData = {
      stops: sortedComponents,
      totalDurationMinutes: totalDurationMinutes > 0 ? totalDurationMinutes : null,
      totalDistanceKm: totalDistanceKm > 0 ? totalDistanceKm : null,
    };
  }

  // 8. Slice 2: Summarize Freshness
  const freshnessSummary = summarizeFreshness(processedFacts);

  // 9. Slice 2: Detect & Reconcile Conflicts
  const factConflicts = detectAndReconcileFactConflicts(processedFacts, entities);

  // 10. Slice 2: Evaluate Deterministic Lookup Decision
  const lookupDecision = evaluateLookupDecision(
    input,
    processedFacts,
    entities,
    sortedComponents,
    factConflicts
  );

  // 11. Slice 2: Evaluate Cache Status
  const cacheStatus = evaluateCacheStatus(input);

  // 12. Slice 2: Telemetry Logging
  logDecisionTelemetry(lookupDecision, input, factConflicts.filter((c) => !c.isReconciled).length);

  return {
    version: FACTPACK_VERSION,
    recommendationType,
    generatedAt: new Date().toISOString(),
    curatorInput,
    entities,
    facts: processedFacts,
    trustedEntities,
    geography,
    journeyData,
    sourceSummary: {
      totalFacts: processedFacts.length,
      officialSourcesCount,
      hasSearchGroundedFacts,
    },
    unresolvedGaps,
    lookupDecision,
    freshnessSummary,
    factConflicts,
    cacheStatus,
  };
}

/**
 * Deterministic gap detection logic.
 */
function detectFactGaps(
  recommendationType: 'PLACE' | 'EXPERIENCE' | 'JOURNEY',
  entities: Entity[],
  facts: FactRecord[],
  journeyComponents: JourneyComponent[],
  curatorInput: Record<string, any>
): FactGap[] {
  const gaps: FactGap[] = [];

  if (entities.length === 0) {
    gaps.push({
      code: 'NO_ENTITIES_PROVIDED',
      message: 'No entities were attached to this recommendation proposal.',
      severity: 'CRITICAL',
    });
    return gaps;
  }

  // Check PLACE gaps
  if (recommendationType === 'PLACE') {
    const placeEntity = entities.find((e) => e.entityType === 'PLACE') || entities[0];
    if (!placeEntity.canonicalName) {
      gaps.push({
        code: 'MISSING_CANONICAL_NAME',
        message: 'Primary place entity is missing a canonical name.',
        entityId: placeEntity.id,
        field: 'canonicalName',
        severity: 'CRITICAL',
      });
    }
    if (!placeEntity.coordinates) {
      gaps.push({
        code: 'MISSING_COORDINATES',
        message: 'Primary place entity is missing geographic coordinates.',
        entityId: placeEntity.id,
        field: 'coordinates',
        severity: 'WARNING',
      });
    }
    if (!placeEntity.location) {
      gaps.push({
        code: 'MISSING_LOCATION_TEXT',
        message: 'Primary place entity is missing location string.',
        entityId: placeEntity.id,
        field: 'location',
        severity: 'WARNING',
      });
    }
  }

  // Check commercial entity trust gaps
  for (const entity of entities) {
    if (
      (entity.entityType === 'ACCOMMODATION' ||
        entity.entityType === 'RESTAURANT' ||
        entity.entityType === 'GUIDE' ||
        entity.entityType === 'TRANSPORT') &&
      entity.trustLevel === 'UNVERIFIED'
    ) {
      gaps.push({
        code: 'COMMERCIAL_ENTITY_UNVERIFIED',
        message: `Commercial entity '${entity.canonicalName}' (${entity.entityType}) is unverified. Cannot be portrayed as IDEMO endorsed.`,
        entityId: entity.id,
        field: 'trustLevel',
        severity: 'WARNING',
      });
    }
  }

  // Check JOURNEY gaps
  if (recommendationType === 'JOURNEY') {
    if (journeyComponents.length === 0) {
      gaps.push({
        code: 'JOURNEY_NO_STOPS',
        message: 'Journey recommendation requires at least one ordered stop component.',
        severity: 'CRITICAL',
      });
    }

    // Check duplicate stop orders
    const stopOrders = journeyComponents.map((c) => c.stopOrder);
    const uniqueStopOrders = new Set(stopOrders);
    if (uniqueStopOrders.size !== stopOrders.length) {
      gaps.push({
        code: 'JOURNEY_DUPLICATE_STOP_ORDER',
        message: 'Journey components contain duplicate stopOrder values.',
        severity: 'CRITICAL',
      });
    }

    // Check component coordinates
    for (const comp of journeyComponents) {
      const matchEntity = entities.find((e) => e.id === comp.entityId);
      if (matchEntity && !matchEntity.coordinates) {
        gaps.push({
          code: 'JOURNEY_STOP_MISSING_COORDINATES',
          message: `Journey stop '${matchEntity.canonicalName}' (Order #${comp.stopOrder}) is missing coordinates.`,
          entityId: matchEntity.id,
          field: 'coordinates',
          severity: 'WARNING',
        });
      }
    }

    // Check curator required overnight stay
    if (curatorInput.requiresOvernight) {
      const hasOvernight = journeyComponents.some((c) => c.isOvernightStay);
      if (!hasOvernight) {
        gaps.push({
          code: 'JOURNEY_MISSING_OVERNIGHT',
          message: 'Curator requested an overnight stay, but no component is flagged as overnight.',
          severity: 'WARNING',
        });
      }
    }
  }

  return gaps;
}
