/**
 * IDEMO 007 V2 - Domain Types
 * Core entities, facts, FactPacks, journey components, trust definitions, and lookup decisions.
 */

import { Recommendation } from '../types';

export type EntityType =
  | 'PLACE'
  | 'ACCOMMODATION'
  | 'RESTAURANT'
  | 'GUIDE'
  | 'TRANSPORT'
  | 'EXPERIENCE_PROVIDER';

export type TrustLevel =
  | 'UNVERIFIED'
  | 'IDEMO_VERIFIED'
  | 'STRATEGIC_PARTNER';

export interface Entity {
  id: string;
  entityType: EntityType;
  canonicalName: string;
  location?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  address?: string | null;
  trustLevel: TrustLevel;
  verificationStatus: string;
  lastVerifiedAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type FactSourceType =
  | 'CURATOR'
  | 'PARTNER'
  | 'PRIMARY_OFFICIAL'
  | 'MAPS'
  | 'SEARCH_GROUNDED'
  | 'SECONDARY_REFERENCE';

export type FactVolatility = 'STATIC' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface FactRecord {
  id: string;
  entityId: string;
  factKey: string;
  value: any;
  sourceType: FactSourceType;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  verifiedAt: string;
  validUntil?: string | null;
  volatility: FactVolatility;
  createdAt: string;
  updatedAt: string;
}

export type JourneyComponentRole =
  | 'PRIMARY_STOP'
  | 'SECONDARY_STOP'
  | 'OVERNIGHT'
  | 'MEAL'
  | 'GUIDE'
  | 'TRANSPORT'
  | 'OTHER';

export interface JourneyComponent {
  id: string;
  recommendationId: string;
  entityId: string;
  stopOrder: number;
  componentRole: JourneyComponentRole;
  isOptional: boolean;
  recommendedDurationMinutes?: number | null;
  isOvernightStay: boolean;
  curatorNote?: string | null;
  travelFromPreviousMinutes?: number | null;
  distanceFromPreviousKm?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FactGap {
  code: string;
  message: string;
  entityId?: string;
  field?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export type LookupDecisionOutcome =
  | 'NO_EXTERNAL_LOOKUP'
  | 'SEARCH_REQUIRED'
  | 'MAPS_REQUIRED'
  | 'SEARCH_AND_MAPS_REQUIRED'
  | 'CURATOR_REVIEW_REQUIRED';

export interface LookupDecision {
  outcome: LookupDecisionOutcome;
  reasons: string[];
  missingFacts: string[];
  staleFacts: string[];
  mapsNeeds: string[];
  searchNeeds: string[];
  curatorReviewNeeds: string[];
}

export interface FreshnessSummary {
  freshFactCount: number;
  staleFactCount: number;
  expiredFactCount: number;
  missingRequiredFactCount: number;
}

export interface FactConflict {
  entityId: string;
  factKey: string;
  conflictingFacts: FactRecord[];
  isReconciled: boolean;
  winningFact?: FactRecord;
  reconciliationReason?: string;
}

export type CacheStatus = 'CACHE_VALID' | 'CACHE_STALE' | 'CACHE_MISS';

export interface DecisionTelemetryLog {
  runId?: string;
  recommendationType: 'PLACE' | 'EXPERIENCE' | 'JOURNEY';
  decisionOutcome: LookupDecisionOutcome;
  reasonCodes: string[];
  missingFactCount: number;
  staleFactCount: number;
  conflictCount: number;
  searchNeeded: boolean;
  mapsNeeded: boolean;
  curatorReviewNeeded: boolean;
  timestamp: string;
}

export interface FactPack {
  version: string; // e.g., "1.0"
  recommendationType: 'PLACE' | 'EXPERIENCE' | 'JOURNEY';
  generatedAt: string;
  curatorInput?: Record<string, any>;
  entities: Entity[];
  facts: FactRecord[];
  trustedEntities: Entity[];
  geography?: {
    primaryLocation?: string | null;
    coordinates?: { lat: number; lng: number } | null;
    address?: string | null;
    serviceAreaId?: string | null;
  } | null;
  journeyData?: {
    stops: JourneyComponent[];
    totalDurationMinutes?: number | null;
    totalDistanceKm?: number | null;
  } | null;
  sourceSummary: {
    totalFacts: number;
    officialSourcesCount: number;
    hasSearchGroundedFacts: boolean;
  };
  unresolvedGaps: FactGap[];
  lookupDecision?: LookupDecision;
  freshnessSummary?: FreshnessSummary;
  factConflicts?: FactConflict[];
  cacheStatus?: CacheStatus;
}

export interface BuildFactPackInput {
  recommendationType: 'PLACE' | 'EXPERIENCE' | 'JOURNEY';
  curatorInput?: Record<string, any>;
  entities: Entity[];
  facts?: FactRecord[];
  journeyComponents?: JourneyComponent[];
  recommendationId?: string;
  cachedFactPack?: FactPack | null;
}

export interface EditorialSynthesisOutput {
  titleEn?: string;
  titleSr?: string;
  subtitleEn?: string;
  subtitleSr?: string;
  shortDescriptionEn: string;
  shortDescriptionSr?: string;
  longDescriptionEn?: string;
  longDescriptionSr?: string;
  whyItMattersEn?: string;
  whyItMattersSr?: string;
  usedFactKeys: string[];
}

export type EditorialParseBlockingReason =
  | 'MALFORMED_EDITORIAL_OUTPUT'
  | 'MISSING_REQUIRED_EDITORIAL_FIELD'
  | 'PROHIBITED_OUTPUT_FIELD'
  | 'UNSUPPORTED_OUTPUT_STRUCTURE';

export interface EditorialOutputParseResult {
  success: boolean;
  editorialOutput?: EditorialSynthesisOutput;
  blockingReasons: EditorialParseBlockingReason[];
  errorDetails?: string;
}

export interface EditorialOutput {
  titleEn: string;
  titleSr: string;
  subtitleEn: string;
  subtitleSr: string;
  shortDescriptionEn: string;
  shortDescriptionSr: string;
  longDescriptionEn: string;
  longDescriptionSr: string;
  usedFactKeys: string[];
}

export interface VerifiedLocationData {
  coordinates: { lat: number; lng: number } | null;
  mapsPlaceId?: string | null;
  address?: string | null;
}

export interface GovernedSynthesisInput {
  candidateId: string;
  canonicalName: string;
  entityType: EntityType;
  subtype?: string;
  researchMode: 'DISCOVERY' | 'EXACT_PROPOSITION';
  locationResolutionStatus: 'VERIFIED' | 'UNRESOLVED';
  verifiedLocation: VerifiedLocationData | null;
  factPack: FactPack;
  curatorNotes?: string;
  humanProvidedMedia?: {
    url: string;
    source?: string;
    license?: string;
    altText?: string;
  };
  partnerId?: string;
  existingRecommendationId?: string;
  forceRegenerate?: boolean;
  curatorOverride?: CuratorOverride;
}

export interface SynthesisInput {
  factPack: FactPack;
  curatorNotes?: string;
  humanProvidedMedia?: {
    url: string;
    source?: string;
    license?: string;
    altText?: string;
  };
  partnerId?: string;
  existingRecommendationId?: string;
  forceRegenerate?: boolean;
  curatorOverride?: CuratorOverride;
}

export type CanonicalRecommendation = Recommendation;

export type PublicationBlockingReason =
  | 'MISSING_IDENTITY'
  | 'MISSING_REQUIRED_EDITORIAL_CONTENT'
  | 'INVALID_LOCATION_STATE'
  | 'INVALID_PROVENANCE'
  | 'PROHIBITED_RAW_PAYLOAD'
  | 'INVALID_PUBLICATION_STATUS';

export interface PublicationValidationResult {
  publishable: boolean;
  blockingReasons: PublicationBlockingReason[];
  errorDetails?: string[];
}

export type CuratorDecision = 'APPROVE' | 'REJECT';

export interface CuratorOverride {
  decision: CuratorDecision;
  reason?: string;
  decidedAt: string;
  curatorId?: string;
}

export interface FinalPublicationDecision {
  finalPublishable: boolean;
  source: 'AUTOMATED_GATE' | 'CURATOR_OVERRIDE';
  automatedPublishable: boolean;
  automatedBlockingReasons: PublicationBlockingReason[];
  curatorOverride?: CuratorOverride;
}

export interface SynthesisResult {
  recommendation: any; // Canonical Recommendation object
  editorialOutput: EditorialOutput;
  telemetry: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    durationMs: number;
    model: string;
    cacheHit?: boolean;
  };
  claimsValidation: {
    passed: boolean;
    violations: string[];
    citedFactKeys: string[];
    validFactKeys: string[];
  };
  publicationValidation?: PublicationValidationResult;
  finalPublicationDecision?: FinalPublicationDecision;
}

