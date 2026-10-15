/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProposalType = 'ASSIGNMENT' | 'NEW_RECOMMENDATION' | 'PACKAGE';
export type ProposalOrigin = 'PARTNER_SUBMISSION' | 'AGENT_007' | 'CURATOR_DIRECT';
export type ProposalReviewState = 'PENDING_REVIEW' | 'CURATOR_APPROVED' | 'CURATOR_REJECTED' | 'CURATOR_SUSPENDED' | 'SUPERSEDED';
export type CuratorDecisionType = 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'NEEDS_REVISION';

export interface PartnerRecommendationProposal {
  id: string;
  partnerId: string;
  recommendationId?: string;
  proposedTitle?: string;
  proposalType: ProposalType;
  origin: ProposalOrigin;
  reviewState: ProposalReviewState;
  curatorDecision?: CuratorDecisionType;
  curatorId?: string;
  curatorNotes?: string;
  curatorDecidedAt?: string;
  isCuratorLocked: boolean;
  eligibleForAgentReconsideration: boolean;
  rationale: string;
  matchScore: number;
  manualPriority: number;
  revision: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalRevisionAuditLog {
  id: string;
  proposalId: string;
  revisionNumber: number;
  previousState?: string;
  newState: string;
  actionBy?: string;
  reason: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface PublicDirectoryFetchResult {
  success: boolean;
  partners?: Array<{
    id: string;
    name: string;
    companyName: string;
    type: string;
    description: string;
    city: string;
    languages: string[];
    website: string;
    logoUrl: string;
    verificationStatus: 'VERIFIED' | 'UNVERIFIED';
    status: 'ACTIVE';
  }>;
  error?: string;
}
