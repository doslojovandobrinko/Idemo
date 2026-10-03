/**
 * IDEMO 007 V2 - Curator Final Authority Override (Slice 4.6)
 *
 * Deterministic final publication authority resolution layer.
 * Executes strictly AFTER the automated publication gate.
 *
 * The automated publication gate (publicationValidation.publishable) remains authoritative
 * for automated validation and default blocking.
 *
 * The human curator has final authority to APPROVE or REJECT publication
 * regardless of the automated publication gate result.
 *
 * AUDIT INVARIANT:
 * The original automated publication result and blocking reasons MUST be preserved
 * and remain visible even when overridden by a curator.
 */

import {
  CuratorOverride,
  FinalPublicationDecision,
  PublicationValidationResult,
} from '../../types/idemo007v2';

/**
 * Deterministically resolves the final publication decision by combining the automated
 * publication gate result with an optional human curator override decision.
 */
export function resolveFinalPublicationDecision(
  publicationValidation: PublicationValidationResult,
  curatorOverride?: CuratorOverride
): FinalPublicationDecision {
  const automatedPublishable = publicationValidation ? publicationValidation.publishable : false;
  const automatedBlockingReasons = publicationValidation && Array.isArray(publicationValidation.blockingReasons)
    ? [...publicationValidation.blockingReasons]
    : [];

  // Rule 1: No Curator Override -> Automated Gate result governs final publication state
  if (!curatorOverride || !curatorOverride.decision) {
    return {
      finalPublishable: automatedPublishable,
      source: 'AUTOMATED_GATE',
      automatedPublishable,
      automatedBlockingReasons,
    };
  }

  const isApprove = curatorOverride.decision === 'APPROVE';

  // Rule 2 & 3: Curator Override APPROVE or REJECT
  // Preserves original automatedPublishable and automatedBlockingReasons completely intact.
  return {
    finalPublishable: isApprove,
    source: 'CURATOR_OVERRIDE',
    automatedPublishable,
    automatedBlockingReasons,
    curatorOverride: {
      decision: curatorOverride.decision,
      reason: curatorOverride.reason,
      decidedAt: curatorOverride.decidedAt || new Date().toISOString(),
      curatorId: curatorOverride.curatorId,
    },
  };
}
