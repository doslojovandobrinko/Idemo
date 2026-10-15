/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProposalType = 'ASSIGNMENT' | 'NEW_RECOMMENDATION' | 'PACKAGE';
export type ProposalOrigin = 'PARTNER_SUBMISSION' | 'AGENT_007' | 'CURATOR_DIRECT';
export type ProposalReviewState =
  | 'pending_review'
  | 'under_review'
  | 'curator_approved'
  | 'curator_rejected'
  | 'reconsideration_requested';

export interface ProposedRecommendationPayload {
  title: string;
  category: string;
  location: string;
  description: string;
  highlights?: string[];
  imageUrl?: string;
  images?: string[];
  collageImageUrl?: string;
  durationBucket?: '2-3 HOURS' | 'HALF-DAY' | 'FULL-DAY';
  routeStops?: string[];
  includedServices?: string[];
  targetVibe?: string;
  estimatedPriceNotes?: string;
}

export interface CuratorDecisionDetail {
  decision: 'curator_approved' | 'curator_rejected';
  decided_by: string;
  decided_at: string;
  note?: string;
  approved_image_url?: string;
}

export interface PersistentPartnerProposal {
  id: string;
  proposal_type: ProposalType;
  partner_id: string;
  partner_code?: string;
  partner_name?: string;
  recommendation_id?: string;
  proposed_rec_payload?: ProposedRecommendationPayload;
  rationale: string;
  origin: ProposalOrigin;
  review_state: ProposalReviewState;
  curator_decision?: CuratorDecisionDetail;
  revision: number;
  curator_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalRevisionHistoryRecord {
  id: string;
  proposal_id: string;
  revision: number;
  previous_state: string;
  new_state: string;
  changed_by: string;
  changed_at: string;
  payload_snapshot: Record<string, any>;
}
