/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../types';
import { PartnerProfileQueueItem } from './partnerService';
import { PartnerRecommendationProposal } from './partnerProposalService';
import { validateCanonicalRecommendationForPublication } from './idemo007v2/publicationGate';
import { CanonicalRecommendation } from '../types/idemo007v2';
import { StudioTab } from '../components/studio/types';

export type TaskAgingTier = 'TIER_1_FRESH' | 'TIER_2_AGING' | 'TIER_3_BOTTLENECK';

export type TaskIssueType = 
  | 'GATE_BLOCKER' 
  | 'PARTNER_VERIFICATION' 
  | 'PARTNER_PROPOSAL'
  | 'AMBIGUITY' 
  | 'COVERAGE_GAP' 
  | 'TRANSLATION_GAP';

export interface CuratorTask {
  id: string;
  title: string;
  entityType: 'recommendation' | 'partner' | 'proposal' | 'coverage';
  targetId: string;
  category: string;
  urgency: 'CRITICAL' | 'WARNING' | 'ROUTINE';
  agingHours: number;
  agingTier: TaskAgingTier;
  agingLabel: string;
  issueType: TaskIssueType;
  issueTypeLabel: string;
  issueSummary: string;
  recommendedAction: string;
  actionTab: StudioTab;
  createdAt: string;
}

/**
 * Deterministically computes aging hours and SLA tier
 */
export function calculateTaskAging(timestampStr?: string): {
  hours: number;
  tier: TaskAgingTier;
  label: string;
} {
  if (!timestampStr) {
    // Default fallback to 48 hours for legacy unversioned items
    return {
      hours: 48,
      tier: 'TIER_2_AGING',
      label: '48h pending'
    };
  }

  const then = new Date(timestampStr).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 24) {
    return {
      hours,
      tier: 'TIER_1_FRESH',
      label: hours === 0 ? '< 1h fresh' : `${hours}h fresh`
    };
  }

  if (hours <= 72) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return {
      hours,
      tier: 'TIER_2_AGING',
      label: `${days}d ${remHours}h aging`
    };
  }

  // > 72h is critical bottleneck
  const days = Math.floor(hours / 24);
  return {
    hours,
    tier: 'TIER_3_BOTTLENECK',
    label: `${days}d critical SLA`
  };
}

/**
 * Aggregates all actionable curator tasks across recommendations,
 * partner queues, and proposals into a single high-priority queue.
 */
export function aggregateCuratorTasks(params: {
  recommendations?: Recommendation[];
  editorialStatuses?: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>;
  partnerQueue?: PartnerProfileQueueItem[];
  proposals?: PartnerRecommendationProposal[];
}): CuratorTask[] {
  const {
    recommendations = [],
    editorialStatuses = {},
    partnerQueue = [],
    proposals = []
  } = params;

  const tasks: CuratorTask[] = [];

  // 1. Partner Passport Verification Queue
  for (const partner of partnerQueue) {
    if (partner.review_status === 'pending_review' || partner.review_status === 'changes_requested') {
      const aging = calculateTaskAging(partner.submitted_at || partner.created_at);
      const isChangesRequested = partner.review_status === 'changes_requested';

      tasks.push({
        id: `task-partner-${partner.partner_id}`,
        title: partner.partner_name || `Partner ${partner.partner_id}`,
        entityType: 'partner',
        targetId: partner.partner_id,
        category: partner.category || 'Hospitality',
        urgency: aging.tier === 'TIER_3_BOTTLENECK' ? 'CRITICAL' : isChangesRequested ? 'WARNING' : 'CRITICAL',
        agingHours: aging.hours,
        agingTier: aging.tier,
        agingLabel: aging.label,
        issueType: isChangesRequested ? 'AMBIGUITY' : 'PARTNER_VERIFICATION',
        issueTypeLabel: isChangesRequested ? 'Partner Ambiguity' : 'Passport Review',
        issueSummary: isChangesRequested 
          ? `Changes requested: Awaiting partner revision or curator override on review notes.` 
          : `Passport profile submitted with ${partner.image_urls?.length || 0} photos. Verification required for concierge routing.`,
        recommendedAction: isChangesRequested ? 'Clarify / Overrule' : 'Verify Passport',
        actionTab: 'editorial-review',
        createdAt: partner.submitted_at || partner.created_at || new Date().toISOString()
      });
    }
  }

  // 2. Recommendations requiring Curator Gate Attention
  for (const rec of recommendations) {
    // Avoid duplicating a Partner Proposal that is already tracked in the proposals queue
    if (
      (rec as any).source === 'partner_proposal' &&
      proposals.some(p => p.recDraftId === rec.id || p.id === rec.id)
    ) {
      continue;
    }

    const status = editorialStatuses[rec.id] || 'CANDIDATE';

    // If candidate or needs research, inspect publication gate blockers
    if (status === 'CANDIDATE' || status === 'NEEDS RESEARCH') {
      // Validate with deterministic canonical gate
      const validation = validateCanonicalRecommendationForPublication(rec as CanonicalRecommendation);
      const aging = calculateTaskAging((rec as any).createdAt || (rec as any).updatedAt); // defaults gracefully

      if (!validation.isPublishable) {
        const topReason = validation.blockingReasons[0] || 'MISSING_REQUIRED_EDITORIAL_CONTENT';
        let summary = 'Publication gate requirements unfulfilled.';
        let issueType: TaskIssueType = 'GATE_BLOCKER';

        if (topReason === 'INVALID_PROVENANCE') {
          summary = 'Provenance missing or unverified: Source citations required.';
          issueType = 'GATE_BLOCKER';
        } else if (topReason === 'MISSING_REQUIRED_EDITORIAL_CONTENT') {
          summary = 'Editorial text incomplete: Short description or translation missing.';
          issueType = 'AMBIGUITY';
        } else if (topReason === 'INVALID_LOCATION_STATE') {
          summary = 'Geographic coordinates or Google Place ID uncalibrated.';
          issueType = 'GATE_BLOCKER';
        }

        tasks.push({
          id: `task-rec-${rec.id}`,
          title: rec.title,
          entityType: 'recommendation',
          targetId: rec.id,
          category: typeof rec.category === 'string' ? rec.category : (rec.category as any)?.name || 'Editorial',
          urgency: validation.blockingReasons.length > 2 ? 'CRITICAL' : 'WARNING',
          agingHours: aging.hours,
          agingTier: aging.tier,
          agingLabel: aging.label,
          issueType,
          issueTypeLabel: issueType === 'GATE_BLOCKER' ? 'Gate Blocker' : 'Editorial Incomplete',
          issueSummary: summary,
          recommendedAction: 'Resolve Blocker',
          actionTab: 'editorial-review',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // 3. Partner Recommendation Proposals
  for (const prop of proposals) {
    const isPendingStatus =
      prop.status === 'AGENT_007_PENDING' ||
      prop.status === 'AGENT_007_RECOMMENDED' ||
      (prop as any).curatorReviewStatus === 'PENDING';
    const linkedRecStatus = prop.recDraftId ? editorialStatuses[prop.recDraftId] : undefined;
    const isAlreadyResolved = linkedRecStatus === 'APPROVED' || linkedRecStatus === 'RETIRED';

    if (isPendingStatus && !isAlreadyResolved) {
      const submittedAt = prop.submittedAt || (prop as any).createdAt;
      const aging = calculateTaskAging(submittedAt);
      const isPackage = prop.proposalType === 'PACKAGE' || (prop.proposalType as string) === 'PACKAGE_TOUR';

      tasks.push({
        id: `task-prop-${prop.id}`,
        title: prop.title || (prop as any).proposedTitle || 'Untitled Partner Proposal',
        entityType: 'proposal',
        targetId: prop.recDraftId || prop.id,
        category: prop.category || (isPackage ? 'Package Tour' : 'Editorial'),
        urgency: aging.tier === 'TIER_3_BOTTLENECK' ? 'CRITICAL' : 'WARNING',
        agingHours: aging.hours,
        agingTier: aging.tier,
        agingLabel: aging.label,
        issueType: 'PARTNER_PROPOSAL',
        issueTypeLabel: isPackage ? 'Partner Package Proposal' : 'Partner Spot Proposal',
        issueSummary: `Submitted by ${prop.partnerName || prop.partnerCode || prop.partnerId}: Curation team review required in Destinations (Curated spots).`,
        recommendedAction: 'Review Proposal',
        actionTab: 'recommendations',
        createdAt: submittedAt || new Date().toISOString()
      });
    }
  }

  // Sort by urgency: CRITICAL first, then highest aging hours
  tasks.sort((a, b) => {
    if (a.urgency === 'CRITICAL' && b.urgency !== 'CRITICAL') return -1;
    if (b.urgency === 'CRITICAL' && a.urgency !== 'CRITICAL') return 1;
    return b.agingHours - a.agingHours;
  });

  return tasks;
}
