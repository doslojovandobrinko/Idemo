/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO AUTHORITATIVE PARTNER RECOMMENDATION PROPOSAL SERVICE
 * Supabase-backed proposal workflow with revision locking, idempotency, and curator protection.
 */

import { safeStorage } from './safeStorage';
import { 
  PartnerRecommendationProposal, 
  ProposalType, 
  ProposalOrigin, 
  ProposalReviewState, 
  CuratorDecisionType 
} from '../types/proposal';

export type { PartnerRecommendationProposal, ProposalType, ProposalOrigin, ProposalReviewState, CuratorDecisionType };

const PROPOSALS_STORAGE_KEY = 'idemo_partner_recommendation_proposals_v2';

function getStoredProposals(): PartnerRecommendationProposal[] {
  try {
    const raw = safeStorage.getItem(PROPOSALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[ProposalService] Failed to read local proposals:', err);
    return [];
  }
}

function saveStoredProposals(proposals: PartnerRecommendationProposal[]): void {
  try {
    safeStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  } catch (err) {
    console.error('[ProposalService] Failed to save local proposals:', err);
  }
}

/**
 * Executes a curator decision on a proposal via Supabase RPC with idempotency & atomic updates.
 */
export async function curatorDecideProposalSecure(
  proposalId: string,
  decision: CuratorDecisionType,
  curatorId?: string,
  notes?: string,
  expectedRevision: number = 1,
  idempotencyKey?: string
): Promise<{ success: boolean; proposal?: PartnerRecommendationProposal; isReplay?: boolean; error?: string }> {
  const { getSupabaseClient, isSupabaseConfigured } = await import('./supabaseClient');

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('curator_decide_proposal_secure', {
        p_proposal_id: proposalId,
        p_decision: decision,
        p_curator_id: curatorId || null,
        p_notes: notes || null,
        p_expected_revision: expectedRevision,
        p_idempotency_key: idempotencyKey || null
      });

      if (error) {
        console.error('[ProposalService] RPC curator_decide_proposal_secure failed:', error.message);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        const rawProp = data.proposal || {};
        const proposal: PartnerRecommendationProposal = {
          id: rawProp.id,
          partnerId: rawProp.partner_id,
          recommendationId: rawProp.recommendation_id,
          proposedTitle: rawProp.proposed_title,
          proposalType: rawProp.proposal_type || 'ASSIGNMENT',
          origin: rawProp.origin || 'CURATOR_DIRECT',
          reviewState: rawProp.review_state || 'PENDING_REVIEW',
          curatorDecision: rawProp.curator_decision,
          curatorId: rawProp.curator_id,
          curatorNotes: rawProp.curator_notes,
          curatorDecidedAt: rawProp.curator_decided_at,
          isCuratorLocked: Boolean(rawProp.is_curator_locked),
          eligibleForAgentReconsideration: Boolean(rawProp.eligible_for_agent_reconsideration),
          rationale: rawProp.rationale || '',
          matchScore: Number(rawProp.match_score || 0),
          manualPriority: Number(rawProp.manual_priority || 0),
          revision: Number(rawProp.revision || 1),
          idempotencyKey: rawProp.idempotency_key,
          createdAt: rawProp.created_at,
          updatedAt: rawProp.updated_at
        };

        // Sync local storage
        const local = getStoredProposals();
        const idx = local.findIndex((p) => p.id === proposalId);
        if (idx >= 0) local[idx] = proposal;
        else local.push(proposal);
        saveStoredProposals(local);

        return { success: true, proposal, isReplay: Boolean(data.is_replay) };
      }
    } catch (err: any) {
      console.error('[ProposalService] Exception during curator decision:', err);
      return { success: false, error: err.message || 'RPC invocation failed' };
    }
  }

  // Fallback local execution
  const local = getStoredProposals();
  const target = local.find((p) => p.id === proposalId);
  if (!target) return { success: false, error: 'Proposal not found in local memory' };

  if (target.revision !== expectedRevision) {
    return { success: false, error: `Revision mismatch: Expected ${expectedRevision}, found ${target.revision}` };
  }

  target.reviewState = decision === 'APPROVED' ? 'CURATOR_APPROVED' : decision === 'SUSPENDED' ? 'CURATOR_SUSPENDED' : 'CURATOR_REJECTED';
  target.curatorDecision = decision;
  target.curatorId = curatorId;
  target.curatorNotes = notes;
  target.curatorDecidedAt = new Date().toISOString();
  target.isCuratorLocked = true;
  target.eligibleForAgentReconsideration = false;
  target.revision += 1;
  target.updatedAt = new Date().toISOString();

  saveStoredProposals(local);
  return { success: true, proposal: target, isReplay: false };
}

/**
 * Reconsiders a proposal, resetting curator locks and making it eligible for Agent reconsideration.
 */
export async function curatorReconsiderAssignmentSecure(
  proposalId: string,
  curatorId?: string,
  notes?: string,
  expectedRevision: number = 1
): Promise<{ success: boolean; proposal?: PartnerRecommendationProposal; error?: string }> {
  const { getSupabaseClient, isSupabaseConfigured } = await import('./supabaseClient');

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('curator_reconsider_assignment_secure', {
        p_proposal_id: proposalId,
        p_curator_id: curatorId || null,
        p_notes: notes || null,
        p_expected_revision: expectedRevision
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        const rawProp = data.proposal || {};
        const proposal: PartnerRecommendationProposal = {
          id: rawProp.id,
          partnerId: rawProp.partner_id,
          recommendationId: rawProp.recommendation_id,
          proposedTitle: rawProp.proposed_title,
          proposalType: rawProp.proposal_type || 'ASSIGNMENT',
          origin: rawProp.origin || 'CURATOR_DIRECT',
          reviewState: rawProp.review_state || 'PENDING_REVIEW',
          curatorDecision: rawProp.curator_decision,
          curatorId: rawProp.curator_id,
          curatorNotes: rawProp.curator_notes,
          curatorDecidedAt: rawProp.curator_decided_at,
          isCuratorLocked: Boolean(rawProp.is_curator_locked),
          eligibleForAgentReconsideration: Boolean(rawProp.eligible_for_agent_reconsideration),
          rationale: rawProp.rationale || '',
          matchScore: Number(rawProp.match_score || 0),
          manualPriority: Number(rawProp.manual_priority || 0),
          revision: Number(rawProp.revision || 1),
          createdAt: rawProp.created_at,
          updatedAt: rawProp.updated_at
        };

        const local = getStoredProposals();
        const idx = local.findIndex((p) => p.id === proposalId);
        if (idx >= 0) local[idx] = proposal;
        saveStoredProposals(local);

        return { success: true, proposal };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'RPC invocation failed' };
    }
  }

  const local = getStoredProposals();
  const target = local.find((p) => p.id === proposalId);
  if (!target) return { success: false, error: 'Proposal not found' };

  target.reviewState = 'PENDING_REVIEW';
  target.curatorDecision = undefined;
  target.isCuratorLocked = false;
  target.eligibleForAgentReconsideration = true;
  target.revision += 1;
  target.updatedAt = new Date().toISOString();

  saveStoredProposals(local);
  return { success: true, proposal: target };
}

// Backward-compatible query and save functions
export function getPartnerProposalsByPartnerId(partnerId: string): PartnerRecommendationProposal[] {
  const all = getStoredProposals();
  return all.filter((p) => p.partnerId.toLowerCase() === partnerId.toLowerCase());
}

export function savePartnerRecommendationProposal(
  proposal: Omit<PartnerRecommendationProposal, 'id' | 'createdAt' | 'updatedAt' | 'revision' | 'isCuratorLocked' | 'eligibleForAgentReconsideration'>
): PartnerRecommendationProposal {
  const local = getStoredProposals();
  const now = new Date().toISOString();
  const newProp: PartnerRecommendationProposal = {
    ...proposal,
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isCuratorLocked: false,
    eligibleForAgentReconsideration: true,
    revision: 1,
    createdAt: now,
    updatedAt: now
  };
  local.push(newProp);
  saveStoredProposals(local);
  return newProp;
}

export function getPartnerRecommendationProposals(): PartnerRecommendationProposal[] {
  return getStoredProposals();
}

export async function curatorApproveProposal(
  proposalId: string,
  curatorId?: string,
  notes?: string,
  expectedRevision: number = 1
) {
  return curatorDecideProposalSecure(proposalId, 'APPROVED', curatorId, notes, expectedRevision);
}

export async function curatorRejectProposal(
  proposalId: string,
  curatorId?: string,
  notes?: string,
  expectedRevision: number = 1
) {
  return curatorDecideProposalSecure(proposalId, 'REJECTED', curatorId, notes, expectedRevision);
}
