/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO AUTHORITATIVE PARTNER RECOMMENDATION PROPOSAL SERVICE
 * Supabase-backed proposal workflow with revision locking and curator protection.
 */

import { safeStorage } from './safeStorage';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { PersistentPartnerProposal, ProposalType, ProposalReviewState } from '../types/proposal';
import { Recommendation, Category } from '../types';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { saveLocalStudioDraft } from './recommendationWorkflowService';

const STORAGE_KEY = 'idemo_partner_recommendation_proposals_v2';

export type { ProposalType };

export interface PartnerRecommendationProposal {
  id: string;
  recDraftId?: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerEmail: string;
  proposalType?: ProposalType;
  title: string;
  category: string;
  location: string;
  proposalReason: 'PERCEIVED_VALUE' | 'EXPERTISE' | 'NEW_SPOT' | 'UNDERREPRESENTED_SERBIA';
  description: string;
  highlights?: string[];
  imageUrl?: string;
  images?: string[];
  collageImageUrl?: string;
  contactNotes?: string;
  durationBucket?: '2-3 HOURS' | 'HALF-DAY' | 'FULL-DAY';
  routeStops?: string[];
  includedServices?: string[];
  targetVibe?: string;
  estimatedPriceNotes?: string;
  submittedAt: string;
  status: 'AGENT_007_PENDING' | 'AGENT_007_RECOMMENDED' | 'CURATOR_APPROVED' | 'CURATOR_REJECTED';
  agent007Evaluation?: {
    evaluatedAt: string;
    rationale: string;
    suggestedCategory: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export function getPartnerRecommendationProposals(): PartnerRecommendationProposal[] {
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getPartnerProposalsByPartnerId(partnerId: string): PartnerRecommendationProposal[] {
  const proposals = getPartnerRecommendationProposals();
  return proposals.filter(p => p.partnerId === partnerId || p.partnerCode?.toLowerCase() === partnerId?.toLowerCase());
}

export function savePartnerRecommendationProposal(
  proposalData: Omit<PartnerRecommendationProposal, 'id' | 'submittedAt' | 'status' | 'agent007Evaluation'>
): PartnerRecommendationProposal {
  const existing = getPartnerRecommendationProposals();
  const proposalId = `PROP-${Date.now().toString().slice(-6)}`;
  const recDraftId = `REC-DRAFT-${Date.now().toString().slice(-6)}`;
  const isPackage = proposalData.proposalType === 'PACKAGE';
  const matchedCat = (proposalData.category || (isPackage ? 'Travel' : 'Nature')) as Category;

  const newProposal: PartnerRecommendationProposal = {
    ...proposalData,
    id: proposalId,
    recDraftId,
    proposalType: proposalData.proposalType || (isPackage ? 'PACKAGE' : 'RECOMMENDATION'),
    submittedAt: new Date().toISOString(),
    status: 'AGENT_007_RECOMMENDED',
    agent007Evaluation: {
      evaluatedAt: new Date().toISOString(),
      rationale: isPackage
        ? `Agent 007 approves multi-stop package "${proposalData.title}" submitted by ${proposalData.partnerCode} (${proposalData.partnerName}).`
        : `Agent 007 approves proposal "${proposalData.title}" submitted by ${proposalData.partnerCode} (${proposalData.partnerName}).`,
      suggestedCategory: matchedCat,
      confidence: 'HIGH'
    }
  };

  const updated = [newProposal, ...existing];
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  try {
    const resolvedImg = newProposal.collageImageUrl || newProposal.imageUrl || (newProposal.images && newProposal.images[0]) || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200';
    saveLocalStudioDraft({
      id: recDraftId,
      title: newProposal.title,
      titleEn: newProposal.title,
      titleSr: newProposal.title,
      category: matchedCat,
      location: newProposal.location || 'Serbia',
      locationEn: newProposal.location || 'Serbia',
      locationSr: newProposal.location || 'Serbia',
      shortDescription: newProposal.description,
      longDescription: newProposal.description,
      image: resolvedImg,
      imageUrl: resolvedImg,
      duration: newProposal.durationBucket || 'Half-Day',
      publicationStatus: 'RESEARCH_CANDIDATE',
      headerVisualState: 'AMBER',
      source: 'partner_proposal',
      proposedByPartnerId: newProposal.partnerId,
      proposedByPartnerCode: newProposal.partnerCode,
      proposedByPartnerName: newProposal.partnerName,
      proposalType: newProposal.proposalType,
      curatorNotes: `Proposed by Partner ${newProposal.partnerCode} (${newProposal.partnerName}).`,
      highlights: newProposal.highlights && newProposal.highlights.length > 0 ? newProposal.highlights : ['Authentic Serbian Journey'],
      serviceAreaId: 'sa-serbia-belgrade'
    });
  } catch (err) {
    console.warn('[PartnerProposalService] Failed to auto-enqueue candidate draft:', err);
  }

  return newProposal;
}

export function curatorApproveProposal(
  proposalId: string,
  approvedImageUrl?: string
): { success: boolean; recommendation?: Recommendation; message: string } {
  const proposals = getPartnerRecommendationProposals();
  const targetIndex = proposals.findIndex(p => p.id === proposalId);
  if (targetIndex === -1) {
    return { success: false, message: 'Proposal not found.' };
  }
  const proposal = proposals[targetIndex];
  proposal.status = 'CURATOR_APPROVED';
  proposals[targetIndex] = proposal;
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));

  const recId = `REC-${Date.now().toString().slice(-6)}`;
  const resolvedImage = approvedImageUrl || proposal.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200';
  const newRec: Recommendation = {
    id: recId,
    title: proposal.title,
    titleEn: proposal.title,
    titleSr: proposal.title,
    category: (proposal.agent007Evaluation?.suggestedCategory || proposal.category) as Category,
    location: proposal.location,
    locationEn: proposal.location,
    locationSr: proposal.location,
    shortDescription: proposal.description,
    longDescription: proposal.description,
    highlights: proposal.highlights || ['Authentic Serbian Experience'],
    imageUrl: resolvedImage,
    image: resolvedImage,
    curatorNotes: `Proposed by Partner ${proposal.partnerCode} (${proposal.partnerName}). Approved by IDEMO Curator.`,
    status: 'APPROVED',
    completenessScore: 95
  } as unknown as Recommendation;

  if (!INITIAL_RECOMMENDATIONS.some(r => r.id === newRec.id)) {
    INITIAL_RECOMMENDATIONS.unshift(newRec);
  }

  return {
    success: true,
    recommendation: newRec,
    message: `Proposal "${proposal.title}" approved! Recommendation ${recId} published to IDEMO pool.`
  };
}

export function curatorRejectProposal(proposalId: string): { success: boolean; message: string } {
  const proposals = getPartnerRecommendationProposals();
  const targetIndex = proposals.findIndex(p => p.id === proposalId);
  if (targetIndex === -1) {
    return { success: false, message: 'Proposal not found.' };
  }
  proposals[targetIndex].status = 'CURATOR_REJECTED';
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  return {
    success: true,
    message: `Proposal "${proposals[targetIndex].title}" was archived by Curator.`
  };
}

// ============================================================================
// SUPABASE AUTHORITATIVE PROPOSAL FUNCTIONS
// ============================================================================

export async function fetchAuthoritativeProposals(
  statusFilter: ProposalReviewState | 'all' = 'pending_review'
): Promise<{ success: boolean; proposals: PersistentPartnerProposal[]; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('fetch_authoritative_partner_proposals_secure', {
        p_review_state: statusFilter
      });

      if (!error && data?.success) {
        return { success: true, proposals: data.proposals || [] };
      }
    } catch (err) {
      console.warn('[ProposalService] Supabase fetch failed, falling back to local storage:', err);
    }
  }

  // Local Storage Fallback
  const list = getPartnerRecommendationProposals();
  const adapted: PersistentPartnerProposal[] = list.map(p => ({
    id: p.id,
    proposal_type: (p.proposalType as any) || 'NEW_RECOMMENDATION',
    partner_id: p.partnerId,
    partner_code: p.partnerCode,
    partner_name: p.partnerName,
    rationale: p.description,
    origin: 'PARTNER_SUBMISSION',
    review_state: p.status === 'CURATOR_APPROVED' ? 'curator_approved' : p.status === 'CURATOR_REJECTED' ? 'curator_rejected' : 'pending_review',
    revision: 1,
    curator_locked: p.status === 'CURATOR_APPROVED' || p.status === 'CURATOR_REJECTED',
    created_at: p.submittedAt,
    updated_at: p.submittedAt
  }));

  const filtered = statusFilter === 'all' ? adapted : adapted.filter(p => p.review_state === statusFilter);
  return { success: true, proposals: filtered };
}

export async function curatorDecideProposalAction(
  proposalId: string,
  decision: 'curator_approved' | 'curator_rejected',
  expectedRevision: number = 1,
  note?: string,
  approvedImageUrl?: string
): Promise<{ success: boolean; message: string; error?: string; revision?: number }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('curator_decide_proposal_secure', {
        p_proposal_id: proposalId,
        p_decision: decision,
        p_note: note || null,
        p_expected_revision: expectedRevision,
        p_approved_image_url: approvedImageUrl || null
      });

      if (error) {
        return { success: false, error: 'RPC_ERROR', message: error.message };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'DECISION_FAILED',
          message: data?.message || 'Curator decision could not be recorded.'
        };
      }

      return {
        success: true,
        revision: data.revision,
        message: data.message
      };
    } catch (err: any) {
      return { success: false, error: 'CLIENT_ERROR', message: err?.message || 'Network exception occurred.' };
    }
  }

  // Local storage fallback
  if (decision === 'curator_approved') {
    const res = curatorApproveProposal(proposalId, approvedImageUrl);
    return { success: res.success, message: res.message, revision: 2 };
  } else {
    const res = curatorRejectProposal(proposalId);
    return { success: res.success, message: res.message, revision: 2 };
  }
}

export async function curatorRequestReconsiderationAction(
  recommendationId: string,
  partnerId: string
): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('curator_reconsider_assignment_secure', {
        p_recommendation_id: recommendationId,
        p_partner_id: partnerId
      });

      if (!error && data?.success) {
        return { success: true, message: data.message };
      }
    } catch (err) {
      console.warn('[ProposalService] Reconsideration RPC failed:', err);
    }
  }

  return { success: true, message: `Reconsideration requested for Partner ${partnerId} on Recommendation ${recommendationId}.` };
}
