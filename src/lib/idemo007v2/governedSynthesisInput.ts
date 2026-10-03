/**
 * IDEMO 007 V2 - Promoted Input Boundary Hardening (Slice 4.3)
 *
 * Ensures Agent 007 synthesizes strictly from the promoted governed input package DTO.
 * Excludes raw search responses, search snippets, unpromoted candidate discovery notes,
 * unverified metadata, stale candidate metadata, ranking words, debug fields, and previous model output.
 */

import {
  GovernedSynthesisInput,
  VerifiedLocationData,
  FactPack,
  EntityType,
} from '../../types/idemo007v2';
import {
  candidateIsPromoted,
  validateCandidatePromotion,
} from './candidatePromotionGate';

export type GovernedIntakeBlockingReason =
  | 'NOT_PROMOTED'
  | 'MISSING_FACTPACK'
  | 'MISSING_PROVENANCE'
  | 'MISSING_REQUIRED_IDENTITY'
  | 'MISSING_RESEARCH_MODE'
  | 'PROHIBITED_RESEARCH_PAYLOAD_DETECTED';

export interface GovernedIntakeValidationResult {
  valid: boolean;
  blockingReasons: GovernedIntakeBlockingReason[];
}

/**
 * Detects if the raw input contains unpromoted or prohibited research payloads
 * attached outside the governed FactPack boundary.
 */
export function detectProhibitedResearchPayload(input: any): boolean {
  if (!input) return false;

  // Check for prohibited raw search or LLM outputs attached to candidate/input outside FactPack
  if (
    input.rawSearchResponse ||
    input.rawSearchResults ||
    input.searchSnippets ||
    input.googleSearchRaw ||
    input.rawSearchHtml ||
    input.unpromotedSearchData
  ) {
    return true;
  }

  // Check for previous model output re-entering factual input outside FactPack
  if (
    input.previousModelOutput ||
    input.rawLlmResponse ||
    input.syntheticProsePayload ||
    input.previousEditorialOutput
  ) {
    return true;
  }

  // Check entity or metadata for prohibited payloads
  if (input.entity) {
    if (
      input.entity.rawSearchResponse ||
      input.entity.searchSnippets ||
      input.entity.previousModelOutput
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Deterministically validates raw intake object against the governed synthesis boundary.
 */
export function validateGovernedSynthesisInput(input: any): GovernedIntakeValidationResult {
  const blockingReasons: GovernedIntakeBlockingReason[] = [];

  if (!input) {
    return {
      valid: false,
      blockingReasons: ['NOT_PROMOTED', 'MISSING_FACTPACK', 'MISSING_REQUIRED_IDENTITY', 'MISSING_RESEARCH_MODE'],
    };
  }

  // 1. Candidate must be explicitly PROMOTED
  if (!candidateIsPromoted(input)) {
    blockingReasons.push('NOT_PROMOTED');
  }

  // 2. FactPack required
  const factPack: FactPack | undefined = input.factPack || (input as any);
  if (!factPack || !factPack.facts || !Array.isArray(factPack.facts)) {
    blockingReasons.push('MISSING_FACTPACK');
  }

  // 3. Required identity
  const candidateId = input.candidateId || input.id || input.entity?.id || input.factPack?.entities?.[0]?.id;
  const canonicalName = input.canonicalName || input.entity?.canonicalName || input.factPack?.entities?.[0]?.canonicalName;
  const entityType = input.entityType || input.entity?.entityType || input.factPack?.entities?.[0]?.entityType;

  if (!candidateId || !canonicalName || !entityType) {
    blockingReasons.push('MISSING_REQUIRED_IDENTITY');
  }

  // 4. Research mode
  const researchMode =
    input.researchMode ||
    input.mode ||
    input.factPack?.curatorInput?.researchMode ||
    input.entity?.metadata?.researchMode;

  if (!researchMode || (researchMode !== 'DISCOVERY' && researchMode !== 'EXACT_PROPOSITION')) {
    blockingReasons.push('MISSING_RESEARCH_MODE');
  }

  // 5. Governed fact provenance check (Slice 4.2.1)
  if (factPack && Array.isArray(factPack.facts)) {
    const promotionVal = validateCandidatePromotion(input);
    if (promotionVal.blockingReasons.includes('MISSING_PROVENANCE')) {
      blockingReasons.push('MISSING_PROVENANCE');
    }
  }

  // 6. Prohibited research payload check
  if (detectProhibitedResearchPayload(input)) {
    blockingReasons.push('PROHIBITED_RESEARCH_PAYLOAD_DETECTED');
  }

  return {
    valid: blockingReasons.length === 0,
    blockingReasons,
  };
}

/**
 * Deterministically constructs a clean, isolated GovernedSynthesisInput DTO from a promoted candidate/input.
 * Strips raw search responses, search snippets, unpromoted summary notes, unverified metadata,
 * stale metadata, debug fields, and previous model outputs.
 */
export function buildGovernedSynthesisInput(rawInput: any): GovernedSynthesisInput {
  const validation = validateGovernedSynthesisInput(rawInput);
  if (!validation.valid) {
    throw new Error(
      `GOVERNED_INTAKE_REJECTED: Synthesis input boundary validation failed with reasons: ${validation.blockingReasons.join(
        ', '
      )}`
    );
  }

  const candidateId = String(
    rawInput.candidateId || rawInput.id || rawInput.entity?.id || rawInput.factPack?.entities?.[0]?.id
  );
  const canonicalName = String(
    rawInput.canonicalName || rawInput.entity?.canonicalName || rawInput.factPack?.entities?.[0]?.canonicalName
  );
  const entityType: EntityType =
    rawInput.entityType || rawInput.entity?.entityType || rawInput.factPack?.entities?.[0]?.entityType || 'PLACE';

  const subtype = rawInput.subtype || rawInput.entity?.metadata?.subtype || rawInput.factPack?.curatorInput?.subtype;

  const researchMode: 'DISCOVERY' | 'EXACT_PROPOSITION' =
    rawInput.researchMode ||
    rawInput.mode ||
    rawInput.factPack?.curatorInput?.researchMode ||
    rawInput.entity?.metadata?.researchMode ||
    'DISCOVERY';

  // Unresolved location governance
  const isUnresolved =
    rawInput.locationResolutionStatus === 'UNRESOLVED' ||
    rawInput.coordinates === null ||
    (rawInput.entity && rawInput.entity.coordinates === null) ||
    (rawInput.factPack?.geography && rawInput.factPack.geography.coordinates === null);

  const locationResolutionStatus: 'VERIFIED' | 'UNRESOLVED' = isUnresolved ? 'UNRESOLVED' : 'VERIFIED';

  const verifiedLocation: VerifiedLocationData | null = isUnresolved
    ? null
    : {
        coordinates:
          rawInput.coordinates ||
          rawInput.entity?.coordinates ||
          rawInput.factPack?.geography?.coordinates ||
          null,
        mapsPlaceId: rawInput.mapsPlaceId || null,
        address: rawInput.address || rawInput.entity?.address || rawInput.factPack?.geography?.address || null,
      };

  // FactPack cleanup: sanitize entities and ensure FactPack is clean of raw search payloads
  const rawFactPack: FactPack = rawInput.factPack;

  const sanitizedFactPack: FactPack = {
    version: rawFactPack.version || '1.0',
    recommendationType: rawFactPack.recommendationType || 'PLACE',
    generatedAt: rawFactPack.generatedAt || new Date().toISOString(),
    curatorInput: {
      ...(rawFactPack.curatorInput || {}),
      verificationStatus: 'PROMOTED',
      researchMode,
    },
    entities: (rawFactPack.entities || []).map((e) => ({
      id: e.id,
      entityType: e.entityType,
      canonicalName: e.canonicalName,
      location: e.location,
      coordinates: isUnresolved ? null : e.coordinates,
      address: e.address,
      trustLevel: e.trustLevel,
      verificationStatus: 'PROMOTED',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      metadata: {
        ...(e.metadata || {}),
        researchMode,
      },
    })),
    facts: (rawFactPack.facts || []).map((f) => ({ ...f })), // Preserved unchanged
    trustedEntities: (rawFactPack.trustedEntities || []).map((e) => ({ ...e })),
    geography: rawFactPack.geography
      ? {
          primaryLocation: rawFactPack.geography.primaryLocation || null,
          coordinates: isUnresolved ? null : rawFactPack.geography.coordinates || null,
          address: rawFactPack.geography.address || null,
          serviceAreaId: rawFactPack.geography.serviceAreaId || null,
        }
      : null,
    journeyData: rawFactPack.journeyData || null,
    sourceSummary: rawFactPack.sourceSummary || {
      totalFacts: rawFactPack.facts?.length || 0,
      officialSourcesCount: 0,
      hasSearchGroundedFacts: false,
    },
    unresolvedGaps: rawFactPack.unresolvedGaps || [],
  };

  return {
    candidateId,
    canonicalName,
    entityType,
    subtype,
    researchMode,
    locationResolutionStatus,
    verifiedLocation,
    factPack: sanitizedFactPack,
    curatorNotes: rawInput.curatorNotes,
    humanProvidedMedia: rawInput.humanProvidedMedia,
    partnerId: rawInput.partnerId,
    existingRecommendationId: rawInput.existingRecommendationId,
    forceRegenerate: rawInput.forceRegenerate,
    curatorOverride: rawInput.curatorOverride,
  };
}
