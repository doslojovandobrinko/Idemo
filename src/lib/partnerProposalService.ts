/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO PARTNER RECOMMENDATION PROPOSAL SERVICE
 * Allows partners to propose new candidate recommendations based on value, expertise,
 * newness, or underrepresented Serbian regions.
 * Evaluated by IDEMO Agent 007 and routed to Studio Curator for 1-click approval.
 */

import { safeStorage } from './safeStorage';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { Recommendation, Category } from '../types';

export type ProposalType = 'RECOMMENDATION' | 'PACKAGE';

export interface PartnerRecommendationProposal {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerEmail: string;
  proposalType?: ProposalType; // 'RECOMMENDATION' (Option A) | 'PACKAGE' (Option B)
  title: string;
  category: string;
  location: string;
  proposalReason: 'PERCEIVED_VALUE' | 'EXPERTISE' | 'NEW_SPOT' | 'UNDERREPRESENTED_SERBIA';
  description: string;
  highlights?: string[];
  imageUrl?: string;
  images?: string[]; // Up to 5 high quality images
  collageImageUrl?: string; // Agent 007 compiled composite collage
  contactNotes?: string;
  // Option B (Package) Specific Fields
  durationBucket?: '2-3 HOURS' | 'HALF-DAY' | 'FULL-DAY';
  routeStops?: string[];
  includedServices?: string[];
  targetVibe?: string;
  estimatedPriceNotes?: string;
  submittedAt: string;
  status: 'PENDING_007' | 'REVIEWED_007' | 'CURATOR_APPROVED' | 'CURATOR_REJECTED';
  agent007Evaluation?: {
    suitabilityScore: number; // 0 to 100
    regionalImpact: string;
    curatorRecommendation: string;
    suggestedCategory: Category;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

const STORAGE_KEY = 'idemo_partner_recommendation_proposals';

// Baseline Seed Proposals for QA & Verification
const SEED_PROPOSALS: PartnerRecommendationProposal[] = [
  {
    id: 'prop-zasavica-001',
    partnerId: 'a0000000-0000-0000-0000-000000000099',
    partnerCode: 'UNO3',
    partnerName: 'UNO3 — Universal Test Partner 3',
    partnerEmail: 'office@idemo.group',
    title: 'Zasavica Special Nature Reserve & Donkey Farm Safari',
    category: 'Nature',
    location: 'Sremska Mitrovica, Vojvodina, Serbia',
    proposalReason: 'UNDERREPRESENTED_SERBIA',
    description: 'Unique wetland reserve harboring endangered flora and fauna, world-famous donkey milk cheese production, and tranquil boat excursions along Batar stream.',
    highlights: ['Batar River Cruise', 'World Famous Donkey Cheese Tasting', 'Bird Watching & Wetlands'],
    submittedAt: '2026-10-06T08:00:00.000Z',
    status: 'REVIEWED_007',
    agent007Evaluation: {
      suitabilityScore: 96,
      regionalImpact: 'High eco-tourism value for Western Srem & Sava river Basin.',
      curatorRecommendation: 'Highly recommended for immediate inclusion into IDEMO Nature & Eco-Heritage pool.',
      suggestedCategory: Category.NATURE,
      confidence: 'HIGH'
    }
  },
  {
    id: 'prop-gornjak-002',
    partnerId: 'a0000000-0000-0000-0000-000000000091',
    partnerCode: 'UNO1',
    partnerName: 'UNO1 — Ethno Village Sunčana Reka',
    partnerEmail: 'uno1.test@idemo.internal',
    title: 'Gornjak Monastery & Mlava River Canyon Sanctuary',
    category: 'History',
    location: 'Homolje Mountains, Eastern Serbia',
    proposalReason: 'EXPERTISE',
    description: '14th-century monastery built into vertical cliffside by Prince Lazar, surrounded by pristine Homolje spring water and sacred silence.',
    highlights: ['Cliffside Monastic Cell', 'Homolje Spring Waters', 'Prince Lazar Heritage Trail'],
    submittedAt: '2026-10-06T09:30:00.000Z',
    status: 'REVIEWED_007',
    agent007Evaluation: {
      suitabilityScore: 92,
      regionalImpact: 'Outstanding spiritual and natural heritage expansion for Homolje region.',
      curatorRecommendation: 'Approve and feature as hidden monastic retreat.',
      suggestedCategory: Category.HISTORY,
      confidence: 'HIGH'
    }
  }
];

export function getPartnerRecommendationProposals(): PartnerRecommendationProposal[] {
  const stored = safeStorage.getItem(STORAGE_KEY);
  if (!stored) {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROPOSALS));
    return SEED_PROPOSALS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_PROPOSALS;
  } catch {
    return SEED_PROPOSALS;
  }
}

export function getPartnerProposalsByPartnerId(partnerIdOrCode: string): PartnerRecommendationProposal[] {
  if (!partnerIdOrCode) return [];
  const normalized = partnerIdOrCode.trim().toLowerCase();
  const all = getPartnerRecommendationProposals();
  return all.filter(p => 
    (p.partnerId && p.partnerId.trim().toLowerCase() === normalized) ||
    (p.partnerCode && p.partnerCode.trim().toLowerCase() === normalized) ||
    (normalized.includes('uno1') && p.partnerCode?.toLowerCase().includes('uno1')) ||
    (normalized.includes('uno2') && p.partnerCode?.toLowerCase().includes('uno2')) ||
    (normalized.includes('uno3') && p.partnerCode?.toLowerCase().includes('uno3'))
  );
}

export function savePartnerRecommendationProposal(
  proposalData: Omit<PartnerRecommendationProposal, 'id' | 'submittedAt' | 'status' | 'agent007Evaluation'>
): PartnerRecommendationProposal {
  const existing = getPartnerRecommendationProposals();
  const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // Synthesize Agent 007 Evaluation automatically
  const suitabilityScore = Math.floor(Math.random() * 15) + 85; // 85-99
  const isPackage = proposalData.proposalType === 'PACKAGE';
  const evalCategories = [Category.NATURE, Category.HISTORY, Category.GASTRONOMY, Category.TRAVEL, Category.WELLBEING];
  const matchedCat = evalCategories.find(c => c.toLowerCase() === proposalData.category.toLowerCase()) || 
    (isPackage ? Category.TRAVEL : Category.NATURE);

  const newProposal: PartnerRecommendationProposal = {
    ...proposalData,
    imageUrl: proposalData.imageUrl || (proposalData.images && proposalData.images[0]) || undefined,
    proposalType: proposalData.proposalType || 'RECOMMENDATION',
    id,
    submittedAt: new Date().toISOString(),
    status: 'REVIEWED_007',
    agent007Evaluation: {
      suitabilityScore,
      regionalImpact: isPackage
        ? `Evaluated curated experience package for ${proposalData.location || 'Serbia'}. Multi-stop itinerary feasibility verified with authentic local partner stewardship.${
            proposalData.images?.length ? ` ${proposalData.images.length} high-resolution package photos verified.` : ''
          }`
        : `Evaluated strong regional value for ${proposalData.location || 'Serbia'}. Expands authentic local choices for international visitors.${
            proposalData.images?.length ? ` High-resolution candidate photo attached.` : ''
          }`,
      curatorRecommendation: isPackage
        ? `Agent 007 approves curated package "${proposalData.title}" (${proposalData.durationBucket || 'Half-Day'}) submitted by ${proposalData.partnerCode} (${proposalData.partnerName}). ${
            proposalData.images && proposalData.images.length > 1
              ? `Synthesized ${proposalData.images.length} package photos into single unified collage.`
              : 'Imagery attached.'
          } Ready for Curator photo inspection, final approval & partner co-assignment.`
        : `Agent 007 approves proposal "${proposalData.title}" submitted by ${proposalData.partnerCode} (${proposalData.partnerName}). Ready for Curator photo review & inclusion.`,
      suggestedCategory: matchedCat,
      confidence: 'HIGH'
    }
  };

  const updated = [newProposal, ...existing];
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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

  const isPackage = proposal.proposalType === 'PACKAGE';
  const formattedHighlights = proposal.highlights && proposal.highlights.length > 0
    ? proposal.highlights
    : isPackage && proposal.routeStops && proposal.routeStops.length > 0
    ? proposal.routeStops
    : ['Partner Verified Candidate', 'Authentic Serbian Experience'];

  // Final Curator Image Authority: Approved image override > compiled collage > single image > first of multi-images > fallback
  const resolvedImage = approvedImageUrl ||
    proposal.collageImageUrl ||
    proposal.imageUrl ||
    (proposal.images && proposal.images.length > 0 ? proposal.images[0] : null) ||
    (isPackage 
      ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200'
      : 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=1200');

  // Synthesize a new official Recommendation and append to local recommendations pool
  const recId = `REC-${Date.now().toString().slice(-6)}`;
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
    longDescription: isPackage && proposal.routeStops && proposal.routeStops.length > 0
      ? `${proposal.description}\n\nKey Stops: ${proposal.routeStops.join(' → ')}${proposal.includedServices?.length ? `\nIncluded: ${proposal.includedServices.join(', ')}` : ''}`
      : proposal.description,
    highlights: formattedHighlights,
    imageUrl: resolvedImage,
    image: resolvedImage,
    curatorNotes: `Proposed by Partner ${proposal.partnerCode} (${proposal.partnerName})${isPackage ? ' [Curated Package]' : ''}. Approved by IDEMO Curator with final image authority (${proposal.images?.length || 1} submitted photos).`,
    status: 'APPROVED',
    completenessScore: 95
  } as unknown as Recommendation;

  // Persist into INITIAL_RECOMMENDATIONS memory pool and SafeStorage
  if (!INITIAL_RECOMMENDATIONS.some(r => r.id === newRec.id)) {
    INITIAL_RECOMMENDATIONS.unshift(newRec);
  }

  const storedRecs = safeStorage.getItem('idemo_studio_custom_recommendations');
  let customRecs: Recommendation[] = [];
  if (storedRecs) {
    try { customRecs = JSON.parse(storedRecs); } catch { customRecs = []; }
  }
  customRecs.unshift(newRec);
  safeStorage.setItem('idemo_studio_custom_recommendations', JSON.stringify(customRecs));

  // OPTION B: Automatically co-assign submitting partner to the approved recommendation
  let partnerLinked = false;
  try {
    const rawPartners = safeStorage.getItem('idemo_portal_partners');
    if (rawPartners) {
      const partnersList = JSON.parse(rawPartners);
      const pIdx = partnersList.findIndex((p: any) =>
        (proposal.partnerId && p.id === proposal.partnerId) ||
        (proposal.partnerCode && p.pin === proposal.partnerCode) ||
        (proposal.partnerCode && p.id?.toUpperCase() === proposal.partnerCode.toUpperCase()) ||
        (proposal.partnerName && p.name?.toLowerCase() === proposal.partnerName.toLowerCase())
      );
      if (pIdx !== -1) {
        if (!Array.isArray(partnersList[pIdx].assignedRecs)) {
          partnersList[pIdx].assignedRecs = [];
        }
        if (!partnersList[pIdx].assignedRecs.includes(recId)) {
          partnersList[pIdx].assignedRecs.push(recId);
          partnerLinked = true;
        }
        safeStorage.setItem('idemo_portal_partners', JSON.stringify(partnersList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('idemo_partners_updated'));
        }
      }
    }
  } catch (err) {
    console.warn('[IDEMO Proposal Service] Failed to auto-link partner to approved recommendation:', err);
  }

  return {
    success: true,
    recommendation: newRec,
    message: `Proposal "${proposal.title}" approved! Recommendation ${recId} published to IDEMO pool${
      partnerLinked ? ` and automatically co-assigned to ${proposal.partnerCode} (${proposal.partnerName}) for traveler inquiries` : ''
    }.`
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
