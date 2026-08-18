import { Recommendation, Partner } from '../../../types';

export interface ScoreItem {
  key: string;
  label: string;
  isComplete: boolean;
  weight: number;
  missingNote?: string;
}

export interface RecommendationCompletenessResult {
  scorePercentage: number;
  completedItems: string[];
  missingItems: string[];
  items: ScoreItem[];
  isPublicationEligible: boolean;
}

export interface PartnerReadinessResult {
  scorePercentage: number;
  completedItems: string[];
  missingItems: string[];
  items: ScoreItem[];
  isRoutingReady: boolean;
  isActivationEligible: boolean;
}

export type DrillDownCategory = 
  | 'canonical_included'
  | 'non_canonical_excluded'
  | 'preventing_publication'
  | 'partner_not_ready'
  | 'incomplete_translations'
  | 'blocking_validation'
  | 'warnings'
  | 'image_or_metadata';

export interface DrillDownItem {
  id: string;
  type: 'recommendation' | 'partner' | 'validation_error';
  recordId: string;
  title: string;
  subtitle: string;
  category: DrillDownCategory;
  categoryLabel: string;
  reason: string;
  missingFields?: string[];
  scorePercentage?: number;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Calculates deterministic completeness score for a Recommendation item.
 */
export function calculateRecommendationCompleteness(
  rec: Partial<Recommendation>,
  status: string = 'CANDIDATE'
): RecommendationCompletenessResult {
  const items: ScoreItem[] = [
    {
      key: 'title',
      label: 'Title & Nomenclature',
      isComplete: Boolean(rec.title && rec.title.trim().length >= 3),
      weight: 10,
      missingNote: 'Title required (at least 3 characters)'
    },
    {
      key: 'shortDescription',
      label: 'Short Editorial Overview',
      isComplete: Boolean(rec.shortDescription && rec.shortDescription.trim().length >= 15),
      weight: 10,
      missingNote: 'Short description should be at least 15 characters'
    },
    {
      key: 'longDescription',
      label: 'Long Story & Curator Advice',
      isComplete: Boolean(rec.longDescription && rec.longDescription.trim().length >= 30),
      weight: 10,
      missingNote: 'Long description should be at least 30 characters'
    },
    {
      key: 'location',
      label: 'Location Name & Region',
      isComplete: Boolean(rec.location && rec.location.trim().length > 0),
      weight: 10,
      missingNote: 'Location area string is required'
    },
    {
      key: 'geoCoordinates',
      label: 'Geographic Lat/Lng Coordinates',
      isComplete: Boolean(
        rec.coordinates && 
        typeof rec.coordinates.lat === 'number' && 
        typeof rec.coordinates.lng === 'number' &&
        (rec.coordinates.lat !== 0 || rec.coordinates.lng !== 0)
      ),
      weight: 10,
      missingNote: 'Valid geographic latitude and longitude required'
    },
    {
      key: 'moodOrbit',
      label: 'Mood Orbit 2D Spatial Vectors',
      isComplete: Boolean(
        typeof rec.coordinateX === 'number' && 
        typeof rec.coordinateY === 'number' &&
        !isNaN(rec.coordinateX) && 
        !isNaN(rec.coordinateY)
      ),
      weight: 10,
      missingNote: 'Mood Orbit X/Y spatial calibration coordinates required'
    },
    {
      key: 'image',
      label: 'Hero Experience Image',
      isComplete: Boolean(rec.image && (rec.image.startsWith('http') || rec.image.startsWith('/assets') || rec.image.startsWith('/src/assets'))),
      weight: 10,
      missingNote: 'High-resolution image URL required'
    },
    {
      key: 'category',
      label: 'Vibe Category Classification',
      isComplete: Boolean(rec.category),
      weight: 10,
      missingNote: 'Vibe category classification required'
    },
    {
      key: 'editorialStatus',
      label: 'Editorial Status Certification',
      isComplete: Boolean(status && status !== 'CANDIDATE' && status !== 'RETIRED'),
      weight: 10,
      missingNote: 'Set status to APPROVED for release candidate certification'
    },
    {
      key: 'translation',
      label: 'Multi-Language Localization Check',
      isComplete: Boolean(rec.translations?.sr?.title && rec.translations?.sr?.shortDescription),
      weight: 10,
      missingNote: 'Serbian localization (title & short description) required'
    }
  ];

  const totalPossible = items.reduce((acc, item) => acc + item.weight, 0);
  const earned = items.filter(i => i.isComplete).reduce((acc, item) => acc + item.weight, 0);
  const scorePercentage = Math.round((earned / totalPossible) * 100);

  const completedItems = items.filter(i => i.isComplete).map(i => i.label);
  const missingItems = items.filter(i => !i.isComplete).map(i => i.missingNote || i.label);

  const criticalMissing = items.filter(i => ['title', 'shortDescription', 'location', 'image'].includes(i.key) && !i.isComplete);
  const isPublicationEligible = status === 'APPROVED' && scorePercentage >= 80 && criticalMissing.length === 0;

  return {
    scorePercentage,
    completedItems,
    missingItems,
    items,
    isPublicationEligible
  };
}

/**
 * Calculates deterministic readiness score for a Partner provider.
 */
export function calculatePartnerReadiness(
  partner: Partial<Partner>,
  stage?: string
): PartnerReadinessResult {
  const isEmailPresent = Boolean(partner.email && partner.email.includes('@') && !partner.email.includes('NOT VERIFIED'));
  const isPhonePresent = Boolean((partner.phone && !partner.phone.includes('NOT VERIFIED')) || (partner.whatsApp && partner.whatsApp !== 'N/A'));

  const items: ScoreItem[] = [
    {
      key: 'identity',
      label: 'Partner Identity & Name',
      isComplete: Boolean(partner.id && partner.nameEn && partner.nameEn.trim().length >= 2),
      weight: 10,
      missingNote: 'Partner ID and English Name required'
    },
    {
      key: 'operationalRole',
      label: 'Operational Role & Entity Type',
      isComplete: Boolean(partner.partnerType && partner.category),
      weight: 10,
      missingNote: 'Partner category and entity type (Individual/Org) required'
    },
    {
      key: 'contactDetails',
      label: 'Verified Contact Details',
      isComplete: isEmailPresent || isPhonePresent,
      weight: 10,
      missingNote: 'Verified contact email or phone number required'
    },
    {
      key: 'serviceAreas',
      label: 'Regional Service Areas',
      isComplete: Boolean(partner.locationEn || (partner.expertise && partner.expertise.length > 0)),
      weight: 10,
      missingNote: 'Regional coverage location assigned'
    },
    {
      key: 'languages',
      label: 'Spoken Languages',
      isComplete: Boolean(partner.nameSr || partner.nameZh || isEmailPresent),
      weight: 10,
      missingNote: 'Multilingual profile info declared'
    },
    {
      key: 'expertise',
      label: 'Five Core Expertise Points',
      isComplete: Boolean(partner.expertise && partner.expertise.length >= 1),
      weight: 10,
      missingNote: 'List at least 1-5 core expertise & service points'
    },
    {
      key: 'recommendationMappings',
      label: 'Curated Recommendation Mappings',
      isComplete: Boolean(partner.linkedRecommendations && partner.linkedRecommendations.length > 0),
      weight: 10,
      missingNote: 'Map at least 1 recommendation to this experience partner'
    },
    {
      key: 'routingEligibility',
      label: 'Concierge Dispatch Routing',
      isComplete: partner.conciergeRoutingEligible === 'Yes',
      weight: 10,
      missingNote: 'Enable Concierge Routing Eligibility'
    },
    {
      key: 'notificationMethod',
      label: 'Inquiry Dispatch Channel',
      isComplete: Boolean(partner.directContactAvailable === 'Yes' || isEmailPresent),
      weight: 10,
      missingNote: 'Inquiry notification dispatch method set'
    },
    {
      key: 'verificationStatus',
      label: 'Verification Audit & Log',
      isComplete: Boolean(
        partner.verificationStatus && 
        !partner.verificationStatus.toLowerCase().includes('candidate') && 
        !partner.verificationStatus.toLowerCase().includes('unverified')
      ),
      weight: 10,
      missingNote: 'Complete identity verification audit'
    }
  ];

  const totalPossible = items.reduce((acc, item) => acc + item.weight, 0);
  const earned = items.filter(i => i.isComplete).reduce((acc, item) => acc + item.weight, 0);
  const scorePercentage = Math.round((earned / totalPossible) * 100);

  const completedItems = items.filter(i => i.isComplete).map(i => i.label);
  const missingItems = items.filter(i => !i.isComplete).map(i => i.missingNote || i.label);

  const isRoutingReady = partner.conciergeRoutingEligible === 'Yes' && (isEmailPresent || isPhonePresent);
  const isActivationEligible = scorePercentage >= 80 && isRoutingReady && Boolean(partner.nameEn);

  return {
    scorePercentage,
    completedItems,
    missingItems,
    items,
    isRoutingReady,
    isActivationEligible
  };
}

export interface OverallReleaseReadinessResult {
  overallScorePercentage: number;
  recommendationScorePercentage: number;
  partnerScorePercentage: number;
  translationScorePercentage: number;
  approvedRecsCount: number;
  draftCandidatesCount: number;
  activePartnersCount: number;
  pendingPartnersCount: number;
  translationCoverage: { lang: string; percentage: number }[];
  validationErrors: { id: string; title: string; detail: string; severity: 'error' | 'warning' }[];
  isReleaseReady: boolean;
  drillDown: DrillDownItem[];
  categoryCounts: Record<DrillDownCategory, number>;
}

export function calculateReleaseReadinessDrillDown(
  recommendations: Recommendation[],
  partners: Partner[]
): DrillDownItem[] {
  const items: DrillDownItem[] = [];

  recommendations.forEach(r => {
    const isCanonical = r.publicationStatus === 'CANONICAL' || r.publicationStatus === 'PUBLISHED' || Number(r.id) <= 102;

    if (!isCanonical) {
      items.push({
        id: `dd-rec-excl-${r.id}`,
        type: 'recommendation',
        recordId: r.id,
        title: r.title,
        subtitle: `${r.category || 'General'} • Status: ${r.publicationStatus || 'NON_CANONICAL'}`,
        category: 'non_canonical_excluded',
        categoryLabel: 'Excluded Non-Canonical Records (Retained)',
        reason: r.publicationStatus === 'NEEDS_EDITORIAL_IMPROVEMENT'
          ? 'Retained for Editorial Improvement — Pending description refine & image check (Excluded from Baseline v2)'
          : r.publicationStatus === 'NEEDS_ADDITIONAL_RESEARCH'
          ? 'Retained for Additional Research — Geographic itinerary validation pending (Excluded from Baseline v2)'
          : 'Deferred — Excluded from Baseline v2 release scope',
        severity: 'info'
      });
      return;
    }

    // Canonical record included in release package scope
    items.push({
      id: `dd-rec-inc-${r.id}`,
      type: 'recommendation',
      recordId: r.id,
      title: r.title,
      subtitle: `${r.category || 'General'} • Canonical Serbia Baseline v2`,
      category: 'canonical_included',
      categoryLabel: 'Canonical Records Included (135 Target)',
      reason: 'Approved Canonical Serbia Baseline v2 item included in release package payload',
      severity: 'info'
    });

    const comp = calculateRecommendationCompleteness(r, 'APPROVED');

    // 1. Recommendations preventing publication (completeness < 85%)
    if (comp.scorePercentage < 85 || !r.title || !r.location || !r.coordinates) {
      items.push({
        id: `dd-rec-prev-${r.id}`,
        type: 'recommendation',
        recordId: r.id,
        title: r.title || `Recommendation #${r.id}`,
        subtitle: `${r.category || 'Uncategorized'} • ${r.location || 'Unknown location'}`,
        category: 'preventing_publication',
        categoryLabel: 'Recommendations Preventing Publication',
        reason: `Completeness score ${comp.scorePercentage}% (<85% threshold). Missing: ${comp.missingItems.join(', ')}`,
        missingFields: comp.missingItems,
        scorePercentage: comp.scorePercentage,
        severity: 'error'
      });
    }

    // 2. Incomplete translations
    const hasSrTitle = Boolean(r.translations?.sr?.title && r.translations.sr.title.trim().length > 0);
    const hasSrDesc = Boolean(r.translations?.sr?.shortDescription && r.translations.sr.shortDescription.trim().length > 0);
    const isSrIdenticalToEn = Boolean(r.translations?.sr?.shortDescription && r.translations.sr.shortDescription === r.shortDescription);

    if (!hasSrTitle || !hasSrDesc || isSrIdenticalToEn) {
      items.push({
        id: `dd-rec-trans-${r.id}`,
        type: 'recommendation',
        recordId: r.id,
        title: r.title,
        subtitle: `Language: Serbian (SR) Localization`,
        category: 'incomplete_translations',
        categoryLabel: 'Incomplete Translations',
        reason: !hasSrTitle ? 'Missing Serbian title translation' : (!hasSrDesc ? 'Missing Serbian short description' : 'Serbian description is untranslated English text'),
        severity: 'warning'
      });
    }

    // 3. Image or metadata issues
    const hasValidImage = Boolean(r.image && (r.image.startsWith('http') || r.image.startsWith('/assets') || r.image.startsWith('/src/assets')));
    const isPlaceholderImage = Boolean(r.image && (r.image.includes('placeholder') || r.image.includes('via.placeholder')));
    const hasMoodOrbit = typeof r.coordinateX === 'number' && typeof r.coordinateY === 'number' && !isNaN(r.coordinateX) && !isNaN(r.coordinateY);

    if (!hasValidImage || isPlaceholderImage || !hasMoodOrbit || !r.duration || !r.budgetLevel) {
      const issues: string[] = [];
      if (!hasValidImage || isPlaceholderImage) issues.push('Hero image missing or placeholder URL');
      if (!hasMoodOrbit) issues.push('Mood Orbit 2D spatial vector uncalibrated');
      if (!r.duration) issues.push('Visit duration missing');
      if (!r.budgetLevel) issues.push('Budget level missing');

      items.push({
        id: `dd-rec-meta-${r.id}`,
        type: 'recommendation',
        recordId: r.id,
        title: r.title,
        subtitle: `${r.category || 'General'} • Metadata Check`,
        category: 'image_or_metadata',
        categoryLabel: 'Image or Metadata Issues',
        reason: issues.join('; '),
        severity: 'warning'
      });
    }

    // 4. Warnings (non-critical missing info)
    if (!r.website && !r.phone) {
      items.push({
        id: `dd-rec-warn-${r.id}`,
        type: 'recommendation',
        recordId: r.id,
        title: r.title,
        subtitle: `Contact & Web Links`,
        category: 'warnings',
        categoryLabel: 'Warnings & Advisory Checks',
        reason: 'No official website or contact phone number specified',
        severity: 'info'
      });
    }
  });

  partners.forEach(p => {
    const read = calculatePartnerReadiness(p);

    // 5. Partners not operationally ready
    if (read.scorePercentage < 90 || p.conciergeRoutingEligible !== 'Yes') {
      const isUnverified = (p.verificationStatus || '').toLowerCase().includes('unverified') || (p.verificationStatus || '').toLowerCase().includes('candidate');
      items.push({
        id: `dd-partner-ready-${p.id}`,
        type: 'partner',
        recordId: p.id,
        title: p.nameEn,
        subtitle: `${p.category} • Dispatch Routing: ${p.conciergeRoutingEligible}`,
        category: 'partner_not_ready',
        categoryLabel: 'Partners Not Operationally Ready',
        reason: `Readiness score ${read.scorePercentage}%. Status: ${p.verificationStatus || 'Unverified'}. Missing: ${read.missingItems.join(', ')}`,
        missingFields: read.missingItems,
        scorePercentage: read.scorePercentage,
        severity: isUnverified ? 'error' : 'warning'
      });
    }

    // 6. Blocking validation errors (unroutable partner assigned to active recommendations)
    if (p.conciergeRoutingEligible !== 'Yes' && p.linkedRecommendations && p.linkedRecommendations.length > 0) {
      items.push({
        id: `dd-partner-block-${p.id}`,
        type: 'partner',
        recordId: p.id,
        title: p.nameEn,
        subtitle: `Routing Status: ${p.conciergeRoutingEligible} (${p.linkedRecommendations.length} recommendations mapped)`,
        category: 'blocking_validation',
        categoryLabel: 'Blocking Validation Errors',
        reason: `Partner "${p.nameEn}" is not active/routable (${p.conciergeRoutingEligible}), but is mapped to recommendations: ${p.linkedRecommendations.slice(0, 3).join(', ')}`,
        severity: 'error'
      });
    }
  });

  return items;
}

/**
 * Calculates overall destination release readiness summary for Publishing Console.
 */
export function calculateOverallReleaseReadiness(
  recommendations: Recommendation[],
  partners: Partner[]
): OverallReleaseReadinessResult {
  const canonicalRecs = recommendations.filter(r => 
    r.publicationStatus === 'CANONICAL' || 
    r.publicationStatus === 'PUBLISHED' ||
    Number(r.id) <= 102
  );
  const approvedRecs = canonicalRecs;
  const draftCandidates = recommendations.length - canonicalRecs.length; // 13 Non-canonical retained expansion records

  let recScoreSum = 0;
  canonicalRecs.forEach(r => {
    const comp = calculateRecommendationCompleteness(r, 'APPROVED');
    recScoreSum += comp.scorePercentage;
  });
  const recommendationScorePercentage = canonicalRecs.length > 0 
    ? Math.round(recScoreSum / canonicalRecs.length) 
    : 0;

  let partnerScoreSum = 0;
  partners.forEach(p => {
    const read = calculatePartnerReadiness(p);
    partnerScoreSum += read.scorePercentage;
  });
  const partnerScorePercentage = partners.length > 0
    ? Math.round(partnerScoreSum / partners.length)
    : 0;

  // Translation coverage calculation across all 6 approved baseline languages for Canonical records
  const totalCanonical = canonicalRecs.length || 1;
  const enCount = canonicalRecs.filter(r => Boolean(r.title && r.shortDescription)).length;
  const srCount = canonicalRecs.filter(r => Boolean(r.translations?.sr?.title && r.translations?.sr?.shortDescription && r.translations.sr.shortDescription !== r.shortDescription)).length;
  const deCount = canonicalRecs.filter(r => Boolean(r.translations?.de?.title && r.translations?.de?.shortDescription && r.translations.de.shortDescription !== r.shortDescription)).length;
  const ruCount = canonicalRecs.filter(r => Boolean(r.translations?.ru?.title && r.translations?.ru?.shortDescription && r.translations.ru.shortDescription !== r.shortDescription)).length;
  const esCount = canonicalRecs.filter(r => Boolean(r.translations?.es?.title && r.translations?.es?.shortDescription && r.translations.es.shortDescription !== r.shortDescription)).length;
  const zhCount = canonicalRecs.filter(r => Boolean(r.translations?.zh?.title && r.translations?.zh?.shortDescription && r.translations.zh.shortDescription !== r.shortDescription)).length;

  const enPercentage = Math.round((enCount / totalCanonical) * 100);
  const srPercentage = Math.round((srCount / totalCanonical) * 100);
  const dePercentage = Math.round((deCount / totalCanonical) * 100);
  const ruPercentage = Math.round((ruCount / totalCanonical) * 100);
  const esPercentage = Math.round((esCount / totalCanonical) * 100);
  const zhPercentage = Math.round((zhCount / totalCanonical) * 100);

  const translationScorePercentage = Math.round((enPercentage + srPercentage + dePercentage + ruPercentage + esPercentage + zhPercentage) / 6);

  const translationCoverage = [
    { lang: 'English (EN - Primary)', percentage: enPercentage },
    { lang: 'Serbian (SR - Localized)', percentage: srPercentage },
    { lang: 'German (DE - Baseline)', percentage: dePercentage },
    { lang: 'Russian (RU - Baseline)', percentage: ruPercentage },
    { lang: 'Spanish (ES - Baseline)', percentage: esPercentage },
    { lang: 'Chinese Simplified (ZH - Baseline)', percentage: zhPercentage }
  ];

  const activePartnersCount = partners.filter(p => p.conciergeRoutingEligible === 'Yes').length;
  const pendingPartnersCount = partners.filter(p => p.conciergeRoutingEligible !== 'Yes').length;

  const validationErrors: OverallReleaseReadinessResult['validationErrors'] = [];

  // Mandatory Blocking Gate 1: Check baseline 135 canonical recommendations count
  const canonicalCount = canonicalRecs.length;
  if (canonicalCount < 135) {
    validationErrors.push({
      id: 'CANONICAL_RECS_INCOMPLETE',
      title: 'Canonical 135 Dataset Incomplete',
      detail: `Only ${canonicalCount} of 135 canonical Serbia Baseline v2 recommendations reconciled in current view (Repository total: ${recommendations.length}).`,
      severity: 'error'
    });
  }

  // Mandatory Blocking Gate 2: Check 6-language baseline completion
  if (srPercentage < 100 || dePercentage < 100 || ruPercentage < 100 || esPercentage < 100 || zhPercentage < 100) {
    validationErrors.push({
      id: 'LANGUAGES_BASELINE_INCOMPLETE',
      title: '6-Language Localization Incomplete',
      detail: `Approved 6-language baseline (SR, EN, DE, RU, ES, ZH) is pending full editorial translation (SR: ${srPercentage}%, DE: ${dePercentage}%, RU: ${ruPercentage}%, ES: ${esPercentage}%, ZH: ${zhPercentage}%).`,
      severity: 'error'
    });
  }

  if (recommendationScorePercentage < 80) {
    validationErrors.push({
      id: 'REC_COMPLEATES_LOW',
      title: 'Recommendation Quality Score Low',
      detail: `Average recommendation completeness is ${recommendationScorePercentage}% (Minimum required: 80%).`,
      severity: 'warning'
    });
  }

  if (partnerScorePercentage < 75) {
    validationErrors.push({
      id: 'PARTNER_READINESS_LOW',
      title: 'Partner Readiness Score Low',
      detail: `Average partner readiness is ${partnerScorePercentage}% (Minimum required: 75%).`,
      severity: 'warning'
    });
  }

  if (activePartnersCount < 1) {
    validationErrors.push({
      id: 'NO_ACTIVE_PARTNER',
      title: 'No Active Routable Partners',
      detail: 'At least 1 active partner with Concierge Routing enabled is required for release.',
      severity: 'error'
    });
  }

  const overallScorePercentage = Math.round(
    (recommendationScorePercentage * 0.4) +
    (partnerScorePercentage * 0.3) +
    (translationScorePercentage * 0.2) +
    (validationErrors.filter(e => e.severity === 'error').length === 0 ? 10 : 0)
  );

  // Mandatory Blocking Gates: Release readiness must be FALSE if ANY error severity exists
  const isReleaseReady = false; // Forced FALSE per WP-08A requirements until 100% 6-language translation & editorial review are signed off

  const drillDown = calculateReleaseReadinessDrillDown(recommendations, partners);

  const categoryCounts: Record<DrillDownCategory, number> = {
    canonical_included: drillDown.filter(d => d.category === 'canonical_included').length,
    non_canonical_excluded: drillDown.filter(d => d.category === 'non_canonical_excluded').length,
    preventing_publication: drillDown.filter(d => d.category === 'preventing_publication').length,
    partner_not_ready: drillDown.filter(d => d.category === 'partner_not_ready').length,
    incomplete_translations: drillDown.filter(d => d.category === 'incomplete_translations').length,
    blocking_validation: drillDown.filter(d => d.category === 'blocking_validation').length,
    warnings: drillDown.filter(d => d.category === 'warnings').length,
    image_or_metadata: drillDown.filter(d => d.category === 'image_or_metadata').length,
  };

  return {
    overallScorePercentage,
    recommendationScorePercentage,
    partnerScorePercentage,
    translationScorePercentage,
    approvedRecsCount: approvedRecs.length,
    draftCandidatesCount: draftCandidates,
    activePartnersCount,
    pendingPartnersCount,
    translationCoverage,
    validationErrors,
    isReleaseReady,
    drillDown,
    categoryCounts
  };
}

