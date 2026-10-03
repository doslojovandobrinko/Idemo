/**
 * IDEMO 007 V2 - Candidate Curator Promotion Gate (Slice 4.2)
 *
 * Deterministic, non-AI curator gate that validates and promotes RESEARCH_CANDIDATE
 * entities before Agent 007 synthesis can run.
 */

import { DiscoveredCandidate } from './candidateDiscoveryEngine';
import { FactPack, Entity } from '../../types/idemo007v2';

export type CandidatePromotionBlockingReason =
  | 'MISSING_ENTITY_ID'
  | 'MISSING_CANONICAL_NAME'
  | 'MISSING_ENTITY_TYPE'
  | 'MISSING_FACTPACK'
  | 'MISSING_PROVENANCE'
  | 'MISSING_REQUIRED_FACT'
  | 'LOCATION_ACKNOWLEDGEMENT_REQUIRED'
  | 'MISSING_RESEARCH_MODE';

export interface CandidatePromotionValidationResult {
  eligible: boolean;
  blockingReasons: CandidatePromotionBlockingReason[];
  requiresLocationAcknowledgement: boolean;
}

export interface CandidatePromotionOptions {
  locationAcknowledged?: boolean;
}

/**
 * Checks if a single FactRecord has valid provenance bound directly to that fact.
 * FactPack-level or entity-level provenance does NOT satisfy a fact without explicit binding.
 */
function hasValidFactProvenance(fact: any): boolean {
  if (!fact) return false;
  if (fact.sourceType && typeof fact.sourceType === 'string' && fact.sourceType.trim() !== '') {
    return true;
  }
  if (fact.sourceUrl && typeof fact.sourceUrl === 'string' && fact.sourceUrl.trim() !== '') {
    return true;
  }
  if (fact.sourceTitle && typeof fact.sourceTitle === 'string' && fact.sourceTitle.trim() !== '') {
    return true;
  }
  if (fact.provenance) {
    if (typeof fact.provenance === 'string' && fact.provenance.trim() !== '') return true;
    if (typeof fact.provenance === 'object' && Object.keys(fact.provenance).length > 0) return true;
  }
  if (fact.source) {
    if (typeof fact.source === 'string' && fact.source.trim() !== '') return true;
    if (typeof fact.source === 'object' && Object.keys(fact.source).length > 0) return true;
  }
  return false;
}

/**
 * Deterministically validates whether a candidate is eligible for promotion to Agent 007.
 * Executed in 0ms without any AI, network, or external search calls.
 */
export function validateCandidatePromotion(
  candidate: any,
  options?: CandidatePromotionOptions
): CandidatePromotionValidationResult {
  const blockingReasons: CandidatePromotionBlockingReason[] = [];

  if (!candidate) {
    return {
      eligible: false,
      blockingReasons: ['MISSING_ENTITY_ID', 'MISSING_CANONICAL_NAME', 'MISSING_ENTITY_TYPE', 'MISSING_RESEARCH_MODE', 'MISSING_FACTPACK'],
      requiresLocationAcknowledgement: false,
    };
  }

  // 1. Entity ID
  const entityId = candidate.id || candidate.entity?.id;
  if (!entityId) {
    blockingReasons.push('MISSING_ENTITY_ID');
  }

  // 2. Canonical Name
  const canonicalName = candidate.canonicalName || candidate.entity?.canonicalName;
  if (!canonicalName || typeof canonicalName !== 'string' || !canonicalName.trim()) {
    blockingReasons.push('MISSING_CANONICAL_NAME');
  }

  // 3. Entity Type
  const entityType = candidate.entityType || candidate.entity?.entityType;
  if (!entityType) {
    blockingReasons.push('MISSING_ENTITY_TYPE');
  }

  // 4. Research Mode ('DISCOVERY' | 'EXACT_PROPOSITION')
  const researchMode =
    candidate.researchMode ||
    candidate.mode ||
    candidate.factPack?.curatorInput?.researchMode ||
    candidate.factPack?.curatorInput?.mode ||
    candidate.entity?.metadata?.researchMode ||
    candidate.entity?.metadata?.mode;

  if (!researchMode || (researchMode !== 'DISCOVERY' && researchMode !== 'EXACT_PROPOSITION')) {
    blockingReasons.push('MISSING_RESEARCH_MODE');
  }

  // 5. FactPack
  const factPack: FactPack | undefined = candidate.factPack;
  if (!factPack || !factPack.facts) {
    blockingReasons.push('MISSING_FACTPACK');
  } else {
    // 6. Required Facts
    if (!Array.isArray(factPack.facts) || factPack.facts.length === 0) {
      blockingReasons.push('MISSING_REQUIRED_FACT');
    }

    // 7. Provenance: Every governed FactRecord must have its own valid provenance
    if (Array.isArray(factPack.facts) && factPack.facts.length > 0) {
      const allFactsHaveProvenance = factPack.facts.every((f) => hasValidFactProvenance(f));
      if (!allFactsHaveProvenance) {
        blockingReasons.push('MISSING_PROVENANCE');
      }
    }
  }

  // 8. Location Status & Acknowledgement
  const isUnresolved =
    candidate.locationResolutionStatus === 'UNRESOLVED' ||
    (candidate.coordinates === null && candidate.locationResolutionStatus !== 'VERIFIED');

  const requiresLocationAcknowledgement = isUnresolved;

  if (isUnresolved && !options?.locationAcknowledged) {
    blockingReasons.push('LOCATION_ACKNOWLEDGEMENT_REQUIRED');
  }

  return {
    eligible: blockingReasons.length === 0,
    blockingReasons,
    requiresLocationAcknowledgement,
  };
}

/**
 * Checks if a candidate or synthesis input has been explicitly promoted by the curator.
 */
export function candidateIsPromoted(candidateOrInput: any): boolean {
  if (!candidateOrInput) return false;

  // Direct candidate or entity promotion check
  if (candidateOrInput.verificationStatus === 'PROMOTED') return true;
  if (candidateOrInput.entity?.verificationStatus === 'PROMOTED') return true;
  if (candidateOrInput.isPromoted === true) return true;
  if (candidateOrInput.entity?.metadata?.isPromoted === true) return true;

  // SynthesisInput checking
  const fp = candidateOrInput.factPack || candidateOrInput;
  if (fp) {
    if (fp.curatorInput?.verificationStatus === 'PROMOTED') return true;
    if (fp.curatorInput?.isPromoted === true) return true;
    if (fp.entities && fp.entities[0]?.verificationStatus === 'PROMOTED') return true;
  }

  // If explicitly in RESEARCH_CANDIDATE state and NOT promoted, return false
  const status =
    candidateOrInput.verificationStatus ||
    candidateOrInput.entity?.verificationStatus ||
    fp?.curatorInput?.verificationStatus ||
    fp?.entities?.[0]?.verificationStatus;

  if (status === 'RESEARCH_CANDIDATE') {
    return false;
  }

  // Non-RESEARCH_CANDIDATE inputs (canonical/legacy synthesis inputs) pass
  return true;
}

/**
 * Explicitly promotes a research candidate following curator validation.
 * Preserves exact location status (UNRESOLVED stays UNRESOLVED with null coordinates) and exact FactPack/provenance.
 */
export function promoteCandidate(
  candidate: DiscoveredCandidate,
  options?: CandidatePromotionOptions
): DiscoveredCandidate {
  const validation = validateCandidatePromotion(candidate, options);
  if (!validation.eligible) {
    throw new Error(
      `CANNOT_PROMOTE_CANDIDATE: Candidate promotion failed validation with reasons: ${validation.blockingReasons.join(
        ', '
      )}`
    );
  }

  const isUnresolved =
    candidate.locationResolutionStatus === 'UNRESOLVED' || candidate.coordinates === null;

  const researchMode =
    candidate.researchMode ||
    candidate.factPack?.curatorInput?.researchMode ||
    candidate.entity?.metadata?.researchMode ||
    'DISCOVERY';

  const promotedEntity: Entity = {
    ...candidate.entity,
    id: candidate.entity?.id || candidate.id,
    canonicalName: candidate.entity?.canonicalName || candidate.canonicalName,
    entityType: candidate.entity?.entityType || candidate.entityType,
    trustLevel: candidate.entity?.trustLevel || 'UNVERIFIED',
    verificationStatus: 'PROMOTED',
    coordinates: isUnresolved ? null : candidate.entity?.coordinates || candidate.coordinates || null,
    metadata: {
      ...(candidate.entity?.metadata || {}),
      researchMode,
      isPromoted: true,
      promotedAt: new Date().toISOString(),
      locationResolutionStatus: isUnresolved ? 'UNRESOLVED' : 'VERIFIED',
    },
    updatedAt: new Date().toISOString(),
    createdAt: candidate.entity?.createdAt || new Date().toISOString(),
  };

  const updatedFactPack: FactPack = {
    ...candidate.factPack,
    curatorInput: {
      ...(candidate.factPack?.curatorInput || {}),
      researchMode,
      verificationStatus: 'PROMOTED',
      isPromoted: true,
      promotedAt: new Date().toISOString(),
    },
    geography: {
      ...(candidate.factPack?.geography || {}),
      coordinates: isUnresolved ? null : candidate.factPack?.geography?.coordinates || candidate.coordinates || null,
    },
  };

  return {
    ...candidate,
    researchMode: researchMode as 'DISCOVERY' | 'EXACT_PROPOSITION',
    verificationStatus: 'PROMOTED',
    locationResolutionStatus: isUnresolved ? 'UNRESOLVED' : candidate.locationResolutionStatus || 'VERIFIED',
    coordinates: isUnresolved ? null : candidate.coordinates || null,
    mapsPlaceId: isUnresolved ? null : candidate.mapsPlaceId || null,
    entity: promotedEntity,
    factPack: updatedFactPack,
  };
}
