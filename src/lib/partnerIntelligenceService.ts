/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Partner, Recommendation, Category } from '../types';
import { PARTNERS } from '../data/partners';
import { getPartnerLifecycleState, getAllPartners } from './partnerLifecycleService';

export type PartnerSuitabilityTier = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export interface StagedPartner {
  partnerId: string;
  partnerName: string;
  tier: PartnerSuitabilityTier;
  origin: '007_PROPOSAL' | 'ADMIN_SELECTED';
  suitabilityScore?: number;
  operationalRole?: string;
  category?: string;
  location?: string;
  phone?: string;
  email?: string;
  verificationStatus?: string;
  conciergeRoutingEligible?: string;
  matchReasons?: string[];
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface PartnerMatchScore {
  partnerId: string;
  partnerName: string;
  tier: PartnerSuitabilityTier;
  suitabilityScore: number; // 0 to 100
  categoryAffinityScore: number;
  expertiseScore: number;
  geographicScore: number;
  operationalReadinessScore: number;
  matchReasons: string[];
  operationalRole: string;
  verificationStatus: string;
  conciergeRoutingEligible: string;
  directContactAvailable: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface PartnerCoverageGap {
  isGap: boolean;
  destinationServiceArea: string;
  primaryCategory: string;
  reason: string;
  missingExpertise: string[];
  missingCapabilities: string[];
  recommendedAction: string;
}

export interface PartnerIntelligenceResult {
  recommendationId?: string;
  recommendationTitle: string;
  evaluatedPartnersCount: number;
  qualifiedPartnersCount: number;
  matches: PartnerMatchScore[];
  coverageGap?: PartnerCoverageGap;
  advisoryNotice: string;
}

/**
 * Deterministic keywords for category to partner matching
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  [Category.GASTRONOMY]: ['gastronomy', 'dining', 'wine', 'food', 'culinary', 'restaurant', 'tasting', 'sommelier', 'chef', 'organic'],
  [Category.HISTORY]: ['history', 'heritage', 'monastery', 'fortress', 'monument', 'museum', 'medieval', 'roman', 'byzantine', 'archaeology'],
  [Category.NATURE]: ['nature', 'hiking', 'national park', 'mountain', 'lake', 'canyon', 'kayaking', 'outdoor', 'adventure', 'wildlife'],
  [Category.WELLBEING]: ['wellness', 'spa', 'thermal', 'mineral', 'bath', 'relaxation', 'healing', 'massage', 'retreat'],
  [Category.MEDICAL]: ['medical', 'dental', 'clinic', 'rehabilitation', 'doctor', 'specialist', 'hospital', 'treatment'],
  [Category.TRAVEL]: ['transfer', 'guide', 'tour', 'transport', 'chauffeur', 'airport', 'excursion', 'concierge'],
  [Category.CLUBBING]: ['nightlife', 'club', 'lounge', 'bar', 'cocktail', 'splav', 'music', 'dj', 'entertainment'],
};

/**
 * Evaluates Partner suitability for a given Recommendation.
 * ZERO DATABASE MUTATIONS. Purely deterministic and advisory.
 */
export function evaluatePartnerSuitability(
  recommendation: Partial<Recommendation>,
  customPartners?: Partner[]
): PartnerIntelligenceResult {
  const pool = customPartners && customPartners.length > 0 ? customPartners : getAllPartners();
  const title = recommendation.title || recommendation.titleEn || 'Untitled Experience';
  const primaryCategory = String(recommendation.category || Category.GASTRONOMY);
  const location = (recommendation.location || recommendation.locationEn || '').toLowerCase();
  const shortDesc = (recommendation.shortDescription || '').toLowerCase();
  const longDesc = (recommendation.longDescription || '').toLowerCase();
  const recCategories = Array.isArray(recommendation.categories) ? recommendation.categories : [primaryCategory];

  const categoryKeywords = recCategories.flatMap(c => CATEGORY_KEYWORDS[c] || [c.toLowerCase()]);
  const experienceKeywords = `${title.toLowerCase()} ${location} ${shortDesc} ${longDesc}`;

  const scoredPartners: PartnerMatchScore[] = [];

  for (const partner of pool) {
    let categoryScore = 0;
    let expertiseScore = 0;
    let geoScore = 0;
    let opsScore = 0;
    const matchReasons: string[] = [];

    // 1. Governed Partner Lifecycle Check
    const state = getPartnerLifecycleState(partner);
    if (state.isRetired || state.isSuspended || !state.isVerified) {
      // Suspended, retired, or unverified partners are excluded from routing matches
      continue;
    }

    const isPublicVerified = state.isVerified;
    const isRoutable = state.isConciergeRoutable;
    const isDirect = partner.directContactAvailable === 'Yes';

    if (isPublicVerified) opsScore += 40;
    if (isRoutable) opsScore += 35;
    if (isDirect) opsScore += 25;

    // Filter out unverified/non-routable partners from suitability matches
    if (opsScore < 50 || !state.isVerified) {
      continue;
    }

    // 2. Category Affinity Check
    const partnerCatLower = (partner.category || '').toLowerCase();
    const partnerRoleLower = (partner.operationalRole || '').toLowerCase();

    for (const kw of categoryKeywords) {
      if (partnerCatLower.includes(kw) || partnerRoleLower.includes(kw)) {
        categoryScore += 35;
        matchReasons.push(`Category alignment: "${kw}" in partner profile`);
        break;
      }
    }

    // Guides and Concierges match cultural, historical, and travel experiences
    if (partnerCatLower.includes('guide') || partnerCatLower.includes('concierge') || partnerCatLower.includes('tourist')) {
      if (['History', 'Travel', 'Gastronomy', 'Nature'].some(c => recCategories.includes(c))) {
        categoryScore = Math.max(categoryScore, 65);
        matchReasons.push('Licensed Guide / Concierge service capability');
      }
    }

    // 3. Expertise Overlap
    const expertiseList = Array.isArray(partner.expertise) ? partner.expertise : [];
    for (const exp of expertiseList) {
      const expLower = exp.toLowerCase();
      let matchedInExp = false;

      for (const kw of categoryKeywords) {
        if (expLower.includes(kw)) {
          expertiseScore += 25;
          matchReasons.push(`Specialized expertise: ${exp}`);
          matchedInExp = true;
          break;
        }
      }

      if (!matchedInExp) {
        // Check if title or location keywords match partner expertise
        const titleTokens = title.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        for (const token of titleTokens) {
          if (expLower.includes(token)) {
            expertiseScore += 20;
            matchReasons.push(`Expertise relates to "${token}": ${exp}`);
            break;
          }
        }
      }
    }

    // 4. Geographic & Recommendation Link Affinity
    const linkedRecs = Array.isArray(partner.linkedRecommendations) ? partner.linkedRecommendations : [];
    for (const linked of linkedRecs) {
      if (linked.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(linked.toLowerCase())) {
        geoScore += 50;
        matchReasons.push(`Directly linked recommendation: "${linked}"`);
      }
    }

    // Location name matching (e.g. Belgrade, Subotica, Zlatibor, Tara, Novi Sad)
    const partnerBlob = `${partner.nameEn} ${partner.nameSr} ${partner.verificationDetails || ''} ${partner.routingRole || ''}`.toLowerCase();
    if (location && (partnerBlob.includes(location) || experienceKeywords.includes(location))) {
      geoScore += 30;
      matchReasons.push(`Geographic coverage for "${recommendation.location || 'region'}"`);
    }

    // Total Normalized Suitability Score (0 - 100)
    categoryScore = Math.min(100, categoryScore);
    expertiseScore = Math.min(100, expertiseScore);
    geoScore = Math.min(100, geoScore);
    opsScore = Math.min(100, opsScore);

    const totalScore = Math.round(
      categoryScore * 0.35 +
      expertiseScore * 0.30 +
      geoScore * 0.20 +
      opsScore * 0.15
    );

    if (totalScore >= 35) {
      scoredPartners.push({
        partnerId: partner.id,
        partnerName: partner.nameEn,
        tier: 'PRIMARY', // Assigned below
        suitabilityScore: totalScore,
        categoryAffinityScore: categoryScore,
        expertiseScore: expertiseScore,
        geographicScore: geoScore,
        operationalReadinessScore: opsScore,
        matchReasons: Array.from(new Set(matchReasons)),
        operationalRole: partner.operationalRole,
        verificationStatus: partner.verificationStatus,
        conciergeRoutingEligible: partner.conciergeRoutingEligible,
        directContactAvailable: partner.directContactAvailable,
        phone: partner.phone !== 'NOT VERIFIED' ? partner.phone : undefined,
        email: partner.email !== 'NOT VERIFIED' ? partner.email : undefined,
        website: partner.website !== 'N/A' ? partner.website : undefined,
      });
    }
  }

  // Sort descending by suitability score
  scoredPartners.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  // Assign tiers: PRIMARY, SECONDARY, TERTIARY (Max 3 matches)
  const matches: PartnerMatchScore[] = [];
  if (scoredPartners.length > 0 && scoredPartners[0].suitabilityScore >= 55) {
    scoredPartners[0].tier = 'PRIMARY';
    matches.push(scoredPartners[0]);
  }
  if (scoredPartners.length > 1 && scoredPartners[1].suitabilityScore >= 45) {
    scoredPartners[1].tier = 'SECONDARY';
    matches.push(scoredPartners[1]);
  }
  if (scoredPartners.length > 2 && scoredPartners[2].suitabilityScore >= 35) {
    scoredPartners[2].tier = 'TERTIARY';
    matches.push(scoredPartners[2]);
  }

  // Determine coverage gap if insufficient matches
  let coverageGap: PartnerCoverageGap | undefined;
  if (matches.length === 0) {
    coverageGap = {
      isGap: true,
      destinationServiceArea: recommendation.location || 'Selected Service Area',
      primaryCategory,
      reason: `No verified, concierge-routable IDEMO partner found with qualified ${primaryCategory} expertise in ${recommendation.location || 'this destination area'}.`,
      missingExpertise: [
        `Licensed ${primaryCategory} guides / concierge providers`,
        `Direct local host partnership in ${recommendation.location || 'destination'}`,
      ],
      missingCapabilities: [
        'Direct booking / WhatsApp concierge integration',
        'Verified English & Serbian direct communication channels',
      ],
      recommendedAction: 'Initiate Partner Acquisition workflow in Studio Partners desk to onboard certified local providers.',
    };
  }

  return {
    recommendationId: recommendation.id,
    recommendationTitle: title,
    evaluatedPartnersCount: pool.length,
    qualifiedPartnersCount: scoredPartners.length,
    matches,
    coverageGap,
    advisoryNotice: 'ADVISORY ONLY — Partner Intelligence proposals do NOT automatically bind or alter partner routing. Binding requires explicit Admin confirmation via Studio Partner Coverage controls.',
  };
}

export interface PartnerSearchFilters {
  query?: string;
  category?: string;
  location?: string;
  verifiedOnly?: boolean;
  routableOnly?: boolean;
}

/**
 * Searches the governed partner pool using multiple search criteria.
 * Allows Admin to discover candidates even when 007 did not propose them in the top 3.
 */
export function searchGovernedPartners(
  filters: PartnerSearchFilters,
  partnerPool?: Partner[]
): Partner[] {
  const pool = partnerPool || PARTNERS;
  const q = (filters.query || '').trim().toLowerCase();
  const category = (filters.category || '').trim().toLowerCase();
  const location = (filters.location || '').trim().toLowerCase();

  return pool.filter(partner => {
    if (filters.verifiedOnly && partner.verificationStatus?.toLowerCase().includes('not')) {
      return false;
    }
    if (filters.routableOnly && partner.conciergeRoutingEligible?.toLowerCase() !== 'yes') {
      return false;
    }
    if (category && category !== 'all' && partner.category.toLowerCase() !== category) {
      return false;
    }
    if (location && location !== 'all') {
      const locStr = `${partner.locationEn || ''} ${partner.locationSr || ''}`.toLowerCase();
      if (!locStr.includes(location)) {
        return false;
      }
    }

    if (q) {
      const haystack = [
        partner.nameEn,
        partner.nameSr,
        partner.category,
        partner.operationalRole || '',
        partner.locationEn || '',
        partner.locationSr || '',
        partner.verificationDetails || '',
        ...(partner.expertise || []),
        ...(partner.linkedRecommendations || []),
      ].join(' ').toLowerCase();

      const tokens = q.split(/\s+/).filter(Boolean);
      return tokens.every(token => haystack.includes(token));
    }

    return true;
  });
}

/**
 * Evaluates a single partner's suitability score (0 to 100) for a given location and category.
 * Enforces strict fail-safe: returns 0 if partner is unverified, inactive, or retired.
 */
export function getPartnerSuitabilityScore(
  partner: Partner,
  location?: string,
  category?: string
): number {
  const state = getPartnerLifecycleState(partner);
  if (!state.isVerified || !state.isActive || state.isRetired || state.isSuspended) {
    return 0;
  }

  let score = 50; // Base score for active verified partner
  if (category && partner.category.toLowerCase().includes(category.toLowerCase())) {
    score += 30;
  }
  if (location && (partner.locationEn?.toLowerCase().includes(location.toLowerCase()) || partner.serviceAreas?.some(a => a.toLowerCase().includes(location.toLowerCase())))) {
    score += 20;
  }
  return Math.min(100, score);
}

/**
 * PIC-01: Evaluates Partner Introduction Capability (PIC) for concierge routing.
 * Enforces strict fail-safe: fails safe to incapable when partner is inactive or unverified.
 */
export function evaluatePartnerIntroductionCapability(partner: Partner): {
  capable: boolean;
  reasons: string[];
} {
  const state = getPartnerLifecycleState(partner);
  const reasons: string[] = [];

  if (!state.isVerified) {
    reasons.push('Partner profile is unverified');
  }
  if (!state.isActive) {
    reasons.push('Partner profile is inactive');
  }
  if (!state.isRoutable) {
    reasons.push('Partner is not concierge routing eligible');
  }
  if (state.isRetired) {
    reasons.push('Partner is retired / archived');
  }
  if (state.isSuspended) {
    reasons.push('Partner is suspended');
  }

  if (reasons.length > 0) {
    return { capable: false, reasons };
  }

  return {
    capable: true,
    reasons: ['Partner is verified, active, and eligible for direct concierge introduction.']
  };
}

/**
 * Transforms a 007 Proposal into a Staged Partner object.
 */
export function stageFromProposal(
  proposal: PartnerMatchScore,
  assignedTier?: PartnerSuitabilityTier
): StagedPartner {
  return {
    partnerId: proposal.partnerId,
    partnerName: proposal.partnerName,
    tier: assignedTier || proposal.tier,
    origin: '007_PROPOSAL',
    suitabilityScore: proposal.suitabilityScore,
    operationalRole: proposal.operationalRole,
    verificationStatus: proposal.verificationStatus,
    conciergeRoutingEligible: proposal.conciergeRoutingEligible,
    matchReasons: proposal.matchReasons,
    phone: proposal.phone,
    email: proposal.email,
    contactEmail: proposal.email,
    contactPhone: proposal.phone,
  };
}

/**
 * Transforms a governed Partner record into a Staged Partner object via manual Admin selection.
 */
export function stageFromManualSelection(
  partner: Partner,
  assignedTier: PartnerSuitabilityTier
): StagedPartner {
  return {
    partnerId: partner.id,
    partnerName: partner.nameEn,
    tier: assignedTier,
    origin: 'ADMIN_SELECTED',
    operationalRole: partner.operationalRole || partner.category,
    category: partner.category,
    location: partner.locationEn,
    verificationStatus: partner.verificationStatus,
    conciergeRoutingEligible: partner.conciergeRoutingEligible,
    phone: partner.phone !== 'NOT VERIFIED' ? partner.phone : undefined,
    email: partner.email !== 'NOT VERIFIED' ? partner.email : undefined,
    contactEmail: partner.email !== 'NOT VERIFIED' ? partner.email : undefined,
    contactPhone: partner.phone !== 'NOT VERIFIED' ? partner.phone : undefined,
    matchReasons: ['Manually selected and verified by IDEMO Admin during editorial review.'],
  };
}

