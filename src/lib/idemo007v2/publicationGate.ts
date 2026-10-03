/**
 * IDEMO 007 V2 - Canonical Recommendation Publication Gate (Slice 4.5)
 *
 * Deterministic publication-readiness gate executed after canonical recommendation assembly.
 * Answers one single question: CAN THIS GOVERNED CANONICAL RECOMMENDATION ENTER A PUBLISHABLE STATE?
 *
 * Enforces hard invariants:
 * 1. IDENTITY (recommendation ID, canonical name/title, entity type/category)
 * 2. EDITORIAL CONTENT (required user-facing short description)
 * 3. FACT GOVERNANCE (zero raw search payloads, zero raw LLM/debug payloads inside recommendation)
 * 4. LOCATION (if unresolved, coordinates must remain null; mapsPlaceId must not be verified)
 * 5. PROVENANCE (valid provenance object present)
 * 6. STATUS (valid approved publication status transition state)
 */

import {
  GovernedSynthesisInput,
  PublicationBlockingReason,
  PublicationValidationResult,
  CanonicalRecommendation,
} from '../../types/idemo007v2';

// Prohibited raw search and raw LLM payload keys that must never appear in publishable output
const PROHIBITED_PAYLOAD_KEYS = [
  'rawSearchResponse',
  'rawSearchResults',
  'searchSnippets',
  'googleSearchRaw',
  'rawSearchHtml',
  'unpromotedSearchData',
  'summaryNote',
  'rawLlmResponse',
  'previousModelOutput',
  'modelReasoning',
  'debugPayload',
  'entireRawJsonResponse',
  'syntheticProsePayload',
];

// Valid allowed publication status set values
const VALID_PUBLICATION_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHABLE', 'PUBLISHED', 'CANONICAL', 'NEEDS_EDITORIAL_IMPROVEMENT'];

/**
 * Deterministically validates an assembled canonical recommendation for publication readiness.
 * Note: INVALID_PUBLICATION_STATUS performs an invalid-status-value check against the allowed publication status set.
 */
export function validateCanonicalRecommendationForPublication(
  recommendation: CanonicalRecommendation,
  governedInput?: GovernedSynthesisInput
): PublicationValidationResult {
  const blockingReasons: PublicationBlockingReason[] = [];
  const errorDetails: string[] = [];

  if (!recommendation || typeof recommendation !== 'object') {
    return {
      publishable: false,
      blockingReasons: ['MISSING_IDENTITY', 'MISSING_REQUIRED_EDITORIAL_CONTENT'],
      errorDetails: ['Recommendation object is null or invalid'],
    };
  }

  // 1. IDENTITY INVARIANT
  const recId = recommendation.id;
  const recTitle = recommendation.title || recommendation.titleEn || (recommendation as any).canonicalName;
  const recCategory = recommendation.category || (Array.isArray(recommendation.categories) && recommendation.categories[0]);

  if (!recId || typeof recId !== 'string' || !recId.trim()) {
    blockingReasons.push('MISSING_IDENTITY');
    errorDetails.push('Recommendation is missing valid ID');
  }

  if (!recTitle || typeof recTitle !== 'string' || !recTitle.trim()) {
    if (!blockingReasons.includes('MISSING_IDENTITY')) blockingReasons.push('MISSING_IDENTITY');
    errorDetails.push('Recommendation is missing canonical name/title');
  }

  if (!recCategory || typeof recCategory !== 'string' || !recCategory.trim()) {
    if (!blockingReasons.includes('MISSING_IDENTITY')) blockingReasons.push('MISSING_IDENTITY');
    errorDetails.push('Recommendation is missing category/entityType');
  }

  // 2. EDITORIAL CONTENT INVARIANT
  const shortDesc = recommendation.shortDescription || recommendation.shortDescriptionEn;

  if (!shortDesc || typeof shortDesc !== 'string' || !shortDesc.trim()) {
    blockingReasons.push('MISSING_REQUIRED_EDITORIAL_CONTENT');
    errorDetails.push('Recommendation is missing required user-facing short description');
  }

  // 3. FACT GOVERNANCE & PROHIBITED RAW PAYLOAD INVARIANT
  const recKeys = Object.keys(recommendation);
  const foundProhibited = recKeys.filter((k) => PROHIBITED_PAYLOAD_KEYS.includes(k));

  if (foundProhibited.length > 0) {
    blockingReasons.push('PROHIBITED_RAW_PAYLOAD');
    errorDetails.push(`Recommendation contains prohibited raw research/LLM payloads: ${foundProhibited.join(', ')}`);
  }

  // 4. LOCATION INVARIANT
  const isUnresolved =
    (governedInput && governedInput.locationResolutionStatus === 'UNRESOLVED') ||
    (recommendation as any).locationResolutionStatus === 'UNRESOLVED' ||
    (governedInput && governedInput.verifiedLocation === null);

  if (isUnresolved) {
    // Unresolved location MUST NOT contain verified non-null coordinates or verified place ID
    if (recommendation.coordinates !== null && recommendation.coordinates !== undefined) {
      blockingReasons.push('INVALID_LOCATION_STATE');
      errorDetails.push('UNRESOLVED location recommendation contains non-null coordinates');
    }

    const mapsId = (recommendation as any).mapsPlaceId;
    if (mapsId && typeof mapsId === 'string' && mapsId.startsWith('ChIJ')) {
      if (!blockingReasons.includes('INVALID_LOCATION_STATE')) blockingReasons.push('INVALID_LOCATION_STATE');
      errorDetails.push('UNRESOLVED location recommendation contains verified mapsPlaceId');
    }
  }

  // 5. PROVENANCE INVARIANT
  const prov = recommendation.provenance;
  if (!prov || typeof prov !== 'object' || !prov.source || !prov.verificationStatus) {
    blockingReasons.push('INVALID_PROVENANCE');
    errorDetails.push('Recommendation is missing valid provenance object');
  }

  // 6. PUBLICATION STATUS INVARIANT
  const pubStatus = recommendation.publicationStatus;
  if (!pubStatus || !VALID_PUBLICATION_STATUSES.includes(pubStatus)) {
    blockingReasons.push('INVALID_PUBLICATION_STATUS');
    errorDetails.push(`Recommendation has invalid or corrupted publication status: "${pubStatus}"`);
  }

  return {
    publishable: blockingReasons.length === 0,
    blockingReasons,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
  };
}
