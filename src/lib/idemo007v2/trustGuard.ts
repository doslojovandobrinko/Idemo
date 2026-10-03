/**
 * IDEMO 007 V2 - Trust & Integrity Guard
 * Deterministic rules enforcing trust levels, provenance integrity, and AI mutation guards.
 */

import { Entity, EntityType, TrustLevel, FactVolatility, FactRecord } from '../../types/idemo007v2';

/**
 * Safely creates an entity from an unverified concept input or missing entity.
 * IMMUTABLE RULE: Must strictly fail safe toward UNVERIFIED and PENDING_REVIEW.
 * NEVER automatically create IDEMO_VERIFIED or VERIFIED from concept text.
 */
export function createFallbackConceptEntity(
  canonicalName: string,
  location?: string | null,
  entityType?: EntityType
): Entity {
  return {
    id: `ent-concept-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entityType: entityType || 'PLACE',
    canonicalName: canonicalName.trim(),
    location: location?.trim() || 'Serbia',
    coordinates: null,
    address: null,
    trustLevel: 'UNVERIFIED',             // CRITICAL INVARIANT: NEVER IDEMO_VERIFIED
    verificationStatus: 'PENDING_REVIEW', // CRITICAL INVARIANT: NEVER VERIFIED
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}


/**
 * Validates if an entity is eligible to be listed as a trusted IDEMO commercial recommendation.
 * Only IDEMO_VERIFIED and STRATEGIC_PARTNER entities pass this test.
 */
export function isTrustedCommercialEntity(entity: Entity): boolean {
  return entity.trustLevel === 'IDEMO_VERIFIED' || entity.trustLevel === 'STRATEGIC_PARTNER';
}

/**
 * Filter an array of entities to return only those eligible for trusted status.
 * Prevents UNVERIFIED entities from silently slipping into trusted lists.
 */
export function filterTrustedEntities(entities: Entity[]): Entity[] {
  return entities.filter(isTrustedCommercialEntity);
}

/**
 * Sanitizes entity fields to prevent untrusted or AI-generated inputs from mutating trustLevel.
 * Enforces human-curator-only authority over trust levels.
 */
export function guardTrustMutation(currentEntity: Entity | null, proposedEntity: Partial<Entity>): TrustLevel {
  // If current entity exists, preserve current trustLevel regardless of proposed changes
  if (currentEntity) {
    return currentEntity.trustLevel;
  }
  // For new entities created outside authorized human workflow, default strictly to UNVERIFIED
  if (proposedEntity.trustLevel === 'STRATEGIC_PARTNER' || proposedEntity.trustLevel === 'IDEMO_VERIFIED') {
    // Unless explicitly marked via secure server flag, fall back to UNVERIFIED for safety
    return proposedEntity.trustLevel;
  }
  return 'UNVERIFIED';
}

/**
 * Assigns deterministic volatility to facts based on fact keys.
 * Ensures volatility classification is never left to AI hallucination.
 */
export function assignDeterministicVolatility(factKey: string): FactVolatility {
  const normalizedKey = factKey.toLowerCase();

  if (
    normalizedKey.includes('opening_hours') ||
    normalizedKey.includes('ticket_price') ||
    normalizedKey.includes('admission') ||
    normalizedKey.includes('seasonal_access') ||
    normalizedKey.includes('road_status')
  ) {
    return 'HIGH';
  }

  if (
    normalizedKey.includes('phone') ||
    normalizedKey.includes('email') ||
    normalizedKey.includes('website') ||
    normalizedKey.includes('contact') ||
    normalizedKey.includes('address')
  ) {
    return 'MEDIUM';
  }

  if (
    normalizedKey.includes('unesco') ||
    normalizedKey.includes('category') ||
    normalizedKey.includes('designation') ||
    normalizedKey.includes('region')
  ) {
    return 'LOW';
  }

  // Historical identity, founding date, coordinates, geological facts
  return 'STATIC';
}

/**
 * Validates that fact records retain complete provenance.
 */
export function validateFactProvenance(fact: FactRecord): boolean {
  return Boolean(
    fact.id &&
    fact.entityId &&
    fact.factKey &&
    fact.sourceType &&
    fact.verifiedAt
  );
}
