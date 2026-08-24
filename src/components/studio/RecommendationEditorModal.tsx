/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon, 
  MapPin, 
  Compass, 
  Sparkles, 
  Globe, 
  Link as LinkIcon, 
  Layers,
  ShieldCheck,
  Building2,
  Check,
  Clock,
  Phone,
  Mail,
  DollarSign,
  Tag,
  Info,
  Sliders,
  Eye,
  Send,
  AlertCircle,
  Upload,
  RefreshCw,
  Trash2,
  Loader2,
  FileImage
} from 'lucide-react';
import { Recommendation, Category } from '../../types';
import { INITIAL_RECOMMENDATIONS } from '../../data/recommendations/serbia';
import { draftExpansionPool } from '../../data/recommendations/serbia/draft_expansion';

function findStaticSeedForRecommendation(recId?: string, rec?: Partial<Recommendation>): Partial<Recommendation> | undefined {
  if (!recId && !rec) return undefined;
  const cleanId = recId || rec?.id;
  const searchPool = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
  return searchPool.find(r =>
    (cleanId && r.id === cleanId) ||
    (r.draftReservationId && rec?.draftReservationId && r.draftReservationId === rec.draftReservationId)
  );
}
import { calculateRecommendationCompleteness } from './utils/scoring';
import { getDraftSaveConfirmationMessage } from './utils/saveConfirmation';
import { 
  submitCanonicalRecommendationCreate, 
  buildCanonicalRecommendationPayload,
  fetchAuthoritativeServiceAreas,
  ServiceAreaOption,
  saveRecommendationDraft,
  fetchLatestDraftForRecommendation,
  sanitizeStudioDraft,
  resolveCanonicalRecommendationIdentity,
  resolveServiceAreaUuid,
  isUuid,
  removeLocalStudioDraft,
  retireRecommendation,
} from '../../lib/recommendationWorkflowService';
import { localizeRecommendation } from '../../lib/recommendationAgentService';
import {
  MediaWorkflowState,
  validateLocalMediaFile,
  reserveRecommendationDraft,
  authorizeRecommendationMediaUpload,
  uploadFileToSignedUrl,
  confirmRecommendationMediaUpload,
  updateRecommendationMediaMetadata,
  verifyRecommendationMediaAsset,
  attachRecommendationMediaAsset,
  abandonRecommendationMediaAsset,
  getCanonicalMediaReference,
  resolveMediaDisplayUrl,
  invalidateMediaCache,
} from '../../lib/recommendationMediaService';
import { getOptimizedImageUrl } from '../../utils/assetHelper';
import { AIRecommendationAgentModal } from './AIRecommendationAgentModal';
import { PartnerIntelligenceReview } from './PartnerIntelligenceReview';
import { evaluatePartnerSuitability, PartnerIntelligenceResult, StagedPartner } from '../../lib/partnerIntelligenceService';
import { AgentCompilationResult, compileRecommendationProposal, AgentProposalInput } from '../../lib/recommendationAgentService';


interface RecommendationEditorModalProps {
  initialRecommendation?: Recommendation | null;
  initialServiceAreaId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recommendation: Recommendation, status: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED') => void;
  onDeleteDraft?: (draftId: string) => void;
  currentStatus?: 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED';
}

const EXPERTISE_OPTIONS = [
  { id: 'exp-gastronomy-fine', name: 'Fine Dining & Gastronomy' },
  { id: 'exp-gastronomy-wine', name: 'Wine Tasting & Estates' },
  { id: 'exp-heritage-medieval', name: 'Medieval Monasteries & Fortresses' },
  { id: 'exp-nature-hiking', name: 'National Parks & Hiking' },
  { id: 'exp-wellness-thermal', name: 'Thermal Spas & Wellness' },
  { id: 'exp-culture-museums', name: 'Museums & Contemporary Art' },
];

const CAPABILITY_OPTIONS = [
  { id: 'cap-english-fluent', name: 'English Speaking Staff' },
  { id: 'cap-wheelchair-accessible', name: 'Wheelchair Accessible' },
  { id: 'cap-private-transfer', name: 'Private Concierge Transfer' },
  { id: 'cap-card-payment', name: 'Credit Card Payment' },
  { id: 'cap-family-friendly', name: 'Family & Child Friendly' },
];

const MOOD_OPTIONS = ['Serene', 'Vibrant', 'Cultural', 'Gastronomic', 'Historic', 'Scenic', 'Active', 'Romantic', 'Family'];

const CANONICAL_LANGUAGES = [
  { code: 'en', name: 'English (Primary)' },
  { code: 'sr', name: 'Serbian (Cyrillic/Latin)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'zh', name: 'Chinese (中文)' },
] as const;

/**
 * Lookup map for case-insensitive validation against the canonical Category enum.
 */
export const CANONICAL_CATEGORY_LOOKUP: Record<string, Category> = Object.values(Category).reduce((acc, cat) => {
  acc[cat.toLowerCase()] = cat;
  return acc;
}, {} as Record<string, Category>);

/**
 * Generic normalization boundary for recommendation category taxonomy.
 * - Validates tokens against the canonical Category enum.
 * - Splits legacy composite strings (e.g., "History, Travel" -> ["History", "Travel"]).
 * - Sets first valid Category enum as primaryCategory.
 * - Preserves all valid category tokens in categories array without duplicates.
 * - If no valid enum matches and a raw string exists, preserves it without falling back silently to Wellbeing.
 */
export function normalizeRecommendationCategories(
  rawCategory?: string | Category | null,
  rawCategories?: (string | Category)[] | null
): { primaryCategory: Category | string; categories: string[] } {
  const validCategoriesList: Category[] = [];
  const seenValid = new Set<string>();

  const extractTokens = (val: any) => {
    if (!val || typeof val !== 'string') return;
    const parts = val.split(',').map((s: string) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const canonical = CANONICAL_CATEGORY_LOOKUP[part.toLowerCase()];
      if (canonical && !seenValid.has(canonical)) {
        seenValid.add(canonical);
        validCategoriesList.push(canonical);
      }
    }
  };

  // 1. Extract from rawCategory first to prioritize primary intent
  extractTokens(rawCategory);

  // 2. Extract from rawCategories array
  if (Array.isArray(rawCategories)) {
    for (const catItem of rawCategories) {
      extractTokens(catItem);
    }
  }

  let primaryCategory: Category | string;
  let categories: string[];

  if (validCategoriesList.length > 0) {
    primaryCategory = validCategoriesList[0];
    categories = [...validCategoriesList];
  } else {
    // Fallback if no Category enum token was found
    const rawTrimmed = typeof rawCategory === 'string' ? rawCategory.trim() : '';
    if (rawTrimmed) {
      primaryCategory = rawTrimmed;
      categories = [rawTrimmed];
    } else {
      primaryCategory = Category.GASTRONOMY;
      categories = [Category.GASTRONOMY];
    }
  }

  return { primaryCategory, categories };
}

export function buildInitialForm(initialRecommendation?: Recommendation | null, initialServiceAreaId?: string): Partial<Recommendation> {
  if (initialRecommendation) {
    const existingTranslations = initialRecommendation.translations || {};
    const normalizedTaxonomy = normalizeRecommendationCategories(
      initialRecommendation.category,
      initialRecommendation.categories
    );

    const resolvedServiceAreaId =
      initialRecommendation.serviceAreaId ||
      (initialRecommendation as any)?.service_area_id ||
      initialServiceAreaId ||
      '';

    return {
      ...initialRecommendation,
      serviceAreaId: resolvedServiceAreaId,
      category: normalizedTaxonomy.primaryCategory,
      categories: normalizedTaxonomy.categories,
      expertiseIds: initialRecommendation.expertiseIds || [],
      capabilityIds: initialRecommendation.capabilityIds || [],
      moods: initialRecommendation.moods || ['Serene'],
      title: initialRecommendation.title || '',
      titleSr: initialRecommendation.titleSr || existingTranslations.sr?.title || '',
      shortDescription: initialRecommendation.shortDescription || '',
      shortDescriptionSr: initialRecommendation.shortDescriptionSr || existingTranslations.sr?.shortDescription || '',
      longDescription: initialRecommendation.longDescription || '',
      longDescriptionSr: initialRecommendation.longDescriptionSr || existingTranslations.sr?.longDescription || '',
      location: initialRecommendation.location || '',
      locationSr: initialRecommendation.locationSr || existingTranslations.sr?.location || '',
      image: initialRecommendation.image || '',
      duration: initialRecommendation.duration !== undefined ? initialRecommendation.duration : '',
      travelTime: typeof initialRecommendation.travelTime === 'string' ? initialRecommendation.travelTime : '',
      travelTimeMinutes: typeof initialRecommendation.travelTimeMinutes === 'number' ? initialRecommendation.travelTimeMinutes : undefined,
      preferredTransport: initialRecommendation.preferredTransport || '',
      estimatedCost: initialRecommendation.estimatedCost || '',
      coordinateX: initialRecommendation.coordinateX ?? 0,
      coordinateY: initialRecommendation.coordinateY ?? 0,
      energy: initialRecommendation.energy ?? 0.5,
      social: initialRecommendation.social ?? 0.5,
      luxury: initialRecommendation.luxury ?? 0.5,
      urbanity: initialRecommendation.urbanity ?? 0.5,
      nature: initialRecommendation.nature ?? 0.5,
      weatherDependency: initialRecommendation.weatherDependency ?? 0.2,
      seasonality: initialRecommendation.seasonality || 'all',
      familySuitability: initialRecommendation.familySuitability ?? true,
      accessibility: initialRecommendation.accessibility ?? true,
      coordinates: (initialRecommendation.coordinates && typeof initialRecommendation.coordinates.lat === 'number' && typeof initialRecommendation.coordinates.lng === 'number')
        ? initialRecommendation.coordinates
        : ((typeof (initialRecommendation as any).latitude === 'number' && typeof (initialRecommendation as any).longitude === 'number')
          ? { lat: (initialRecommendation as any).latitude, lng: (initialRecommendation as any).longitude }
          : undefined),
      practicalInfo: {
        opening_hours: initialRecommendation.practicalInfo?.opening_hours || '',
        contact_phone: initialRecommendation.practicalInfo?.contact_phone || initialRecommendation.phone || '',
        contact_email: initialRecommendation.practicalInfo?.contact_email || '',
        website: initialRecommendation.practicalInfo?.website || initialRecommendation.website || '',
        admission_fee: initialRecommendation.practicalInfo?.admission_fee || initialRecommendation.estimatedCost || '',
      },
      provenance: {
        source: initialRecommendation.provenance?.source || 'Curator Archive',
        method: initialRecommendation.provenance?.method || 'original',
        license: initialRecommendation.provenance?.license || 'CC-BY-4.0',
        attributionRequired: initialRecommendation.provenance?.attributionRequired ?? false,
        attributionText: initialRecommendation.provenance?.attributionText || '',
        verificationStatus: initialRecommendation.provenance?.verificationStatus || 'Verified',
        altText: initialRecommendation.provenance?.altText || initialRecommendation.title || '',
      },
      translations: {
        en: {
          title: existingTranslations.en?.title || initialRecommendation.title || '',
          shortDescription: existingTranslations.en?.shortDescription || initialRecommendation.shortDescription || '',
          longDescription: existingTranslations.en?.longDescription || initialRecommendation.longDescription || '',
          location: existingTranslations.en?.location || initialRecommendation.location || '',
          bestTimeToVisit: existingTranslations.en?.bestTimeToVisit || (initialRecommendation as any).bestTimeToVisitEn || '',
          insiderTip: existingTranslations.en?.insiderTip || (initialRecommendation as any).insiderTipEn || '',
        },
        sr: {
          title: existingTranslations.sr?.title || initialRecommendation.titleSr || '',
          shortDescription: existingTranslations.sr?.shortDescription || initialRecommendation.shortDescriptionSr || '',
          longDescription: existingTranslations.sr?.longDescription || initialRecommendation.longDescriptionSr || '',
          location: existingTranslations.sr?.location || initialRecommendation.locationSr || '',
          bestTimeToVisit: existingTranslations.sr?.bestTimeToVisit || (initialRecommendation as any).bestTimeToVisitSr || '',
          insiderTip: existingTranslations.sr?.insiderTip || (initialRecommendation as any).insiderTipSr || '',
        },
        de: existingTranslations.de || {},
        ru: existingTranslations.ru || {},
        es: existingTranslations.es || {},
        zh: existingTranslations.zh || {},
      },
    };
  }

  return {
    id: `rec-temp-${Date.now()}`,
    serviceAreaId: initialServiceAreaId || '',
    title: '',
    titleSr: '',
    category: Category.GASTRONOMY,
    categories: [Category.GASTRONOMY],
    expertiseIds: ['exp-gastronomy-fine'],
    capabilityIds: ['cap-english-fluent'],
    shortDescription: '',
    shortDescriptionSr: '',
    longDescription: '',
    longDescriptionSr: '',
    image: '',
    location: '',
    locationSr: '',
    duration: '2-3 hours',
    travelTime: '',
    travelTimeMinutes: 0,
    estimatedCost: '€€',
    preferredTransport: 'Car / Regional Transit',
    coordinateX: 0,
    coordinateY: 0,
    coordinates: undefined,
    energy: 0.5,
    social: 0.5,
    luxury: 0.5,
    urbanity: 0.5,
    nature: 0.5,
    weatherDependency: 0.2,
    seasonality: 'all',
    familySuitability: true,
    accessibility: true,
    premiumLevel: 'standard',
    budgetLevel: 'moderate',
    moods: ['Serene'],
    website: '',
    phone: '',
    practicalInfo: {
      opening_hours: '',
      contact_phone: '',
      contact_email: '',
      website: '',
      admission_fee: '',
    },
    provenance: {
      source: 'Studio Editorial Team',
      method: 'original',
      license: 'CC-BY-4.0',
      attributionRequired: false,
      attributionText: 'IDEMO Serbia Curations',
      verificationStatus: 'Unverified',
      altText: '',
    },
    translations: {
      en: { title: '', shortDescription: '', longDescription: '', location: '' },
      sr: { title: '', shortDescription: '', longDescription: '', location: '' },
      de: { title: '', shortDescription: '', longDescription: '', location: '' },
      ru: { title: '', shortDescription: '', longDescription: '', location: '' },
      es: { title: '', shortDescription: '', longDescription: '', location: '' },
      zh: { title: '', shortDescription: '', longDescription: '', location: '' },
    }
  };
}

export type GovernanceGateType = 'GATE_A' | 'GATE_B' | 'GATE_C';

export interface GovernanceValidationError {
  gate: GovernanceGateType;
  code: string;
  message: string;
}

export interface GovernanceGateParams {
  form: {
    serviceAreaId?: string;
    title?: string;
    shortDescription?: string;
    longDescription?: string;
    coordinates?: { lat?: number; lng?: number };
    travelTimeMinutes?: number;
    practicalInfo?: {
      contact_email?: string;
      contact_phone?: string;
      website?: string;
      opening_hours?: string;
    };
    image?: string;
    translations?: Record<string, { title?: string; shortDescription?: string; longDescription?: string; location?: string }>;
    lifecycleStatus?: string;
  };
  displayUrlResolutionError?: boolean;
  selectedFile?: File | null;
  fileLocalPreview?: string | null;
  mediaState?: string;
  agentProposalMetadata?: {
    executionMode?: string;
    fallbackReason?: string;
    quotaExceeded?: boolean;
    researchStatus?: string;
    usedAi?: boolean;
  } | null;
  agentEvidenceReport?: {
    unresolvedFields?: string[];
    fieldStatuses?: Array<{ fieldName: string; status: string }>;
  } | null;
  researchStatus?: string;
  fallbackReason?: string;
}

export interface GovernanceGateEvaluation {
  errors: GovernanceValidationError[];
  errorMessages: string[];
  gateA: { pass: boolean; errors: GovernanceValidationError[] };
  gateB: { pass: boolean; errors: GovernanceValidationError[] };
  gateC: { pass: boolean; errors: GovernanceValidationError[] };
}

export function isDraftNeedingResearch(
  form: any,
  selectedStatus?: string,
  agentProposalMetadata?: any,
  agentEvidenceReport?: any
): boolean {
  if (selectedStatus === 'APPROVED' && agentProposalMetadata?.executionMode === 'GEMINI_GROUNDED') {
    return false;
  }

  const status = selectedStatus || form?.lifecycleStatus || 'CANDIDATE';
  const isAmber = status === 'CANDIDATE' || status === 'NEEDS RESEARCH' || status === 'AMBER';

  const isUnresearched =
    Boolean(form?.shortDescription?.includes('[Unresearched Structural Draft]')) ||
    Boolean(form?.longDescription?.includes('[Unresearched Structural Draft]')) ||
    Boolean(form?.title?.includes('[Unresearched Structural Draft]')) ||
    Object.values(form?.translations || {}).some(
      (t: any) => t?.shortDescription?.includes('[Unresearched Structural Draft]') || t?.longDescription?.includes('[Unresearched Structural Draft]')
    );

  const isFallbackMode =
    agentProposalMetadata?.executionMode === 'DETERMINISTIC_FALLBACK' ||
    agentProposalMetadata?.executionMode === 'FALLBACK' ||
    agentProposalMetadata?.executionMode === 'DETERMINISTIC_SEMANTIC_RECOVERY' ||
    agentProposalMetadata?.usedAi === false ||
    Boolean(agentProposalMetadata?.quotaExceeded);

  const hasFallbackReason = Boolean(
    agentProposalMetadata?.fallbackReason &&
    agentProposalMetadata.fallbackReason.trim().length > 0 &&
    agentProposalMetadata.fallbackReason !== 'NONE'
  );

  const hasUnresolvedAgentResearch = Boolean(
    agentEvidenceReport?.unresolvedFields?.some((f: string) => f === 'shortDescription' || f === 'longDescription' || f === 'research')
  );

  return isAmber && (isUnresearched || isFallbackMode || hasFallbackReason || hasUnresolvedAgentResearch || !agentProposalMetadata);
}

export function evaluateRecommendationGovernanceGates(params: GovernanceGateParams): GovernanceGateEvaluation {
  const errors: GovernanceValidationError[] = [];
  const { form, displayUrlResolutionError, selectedFile, fileLocalPreview, mediaState, agentProposalMetadata, agentEvidenceReport, researchStatus, fallbackReason } = params;

  // Gate C Hardening: Unresearched / Fallback Draft checks
  const isUnresearchedDraft =
    Boolean(form.shortDescription?.includes('[Unresearched Structural Draft]')) ||
    Boolean(form.longDescription?.includes('[Unresearched Structural Draft]')) ||
    Boolean(form.title?.includes('[Unresearched Structural Draft]')) ||
    Object.values(form.translations || {}).some(
      t => t?.shortDescription?.includes('[Unresearched Structural Draft]') || t?.longDescription?.includes('[Unresearched Structural Draft]')
    );

  const hasFallbackStatus =
    researchStatus === 'FALLBACK' ||
    agentProposalMetadata?.executionMode === 'DETERMINISTIC_FALLBACK' ||
    agentProposalMetadata?.executionMode === 'FALLBACK' ||
    agentProposalMetadata?.executionMode === 'DETERMINISTIC_SEMANTIC_RECOVERY' ||
    agentProposalMetadata?.researchStatus === 'FALLBACK' ||
    agentProposalMetadata?.usedAi === false;

  const hasFallbackReason =
    Boolean(fallbackReason && fallbackReason.trim().length > 0 && fallbackReason !== 'NONE') ||
    Boolean(agentProposalMetadata?.fallbackReason && agentProposalMetadata.fallbackReason.trim().length > 0 && agentProposalMetadata.fallbackReason !== 'NONE');

  const hasUnresolvedAgentResearch =
    Boolean(agentEvidenceReport?.unresolvedFields?.some(f => f === 'shortDescription' || f === 'longDescription' || f === 'research')) ||
    Boolean(agentEvidenceReport?.fieldStatuses?.some(f => f.status === 'UNRESOLVED' && (f.fieldName === 'shortDescription' || f.fieldName === 'longDescription')));

  if (isUnresearchedDraft || hasFallbackStatus || hasFallbackReason || hasUnresolvedAgentResearch) {
    errors.push({
      gate: 'GATE_C',
      code: 'UNRESEARCHED_FALLBACK_CONTENT',
      message: 'Recommendation contains fallback or unresearched structural content ([Unresearched Structural Draft]). Grounded research execution is required before canonical submission.'
    });
  }

  // Gate C: Media Storage Resolution Failure
  if (displayUrlResolutionError) {
    errors.push({
      gate: 'GATE_C',
      code: 'MEDIA_UNRESOLVABLE',
      message: 'Attached media object cannot be resolved from storage (re-upload required).'
    });
  }

  // Gate B: Required Fields & Completeness
  if (!form.serviceAreaId || !form.serviceAreaId.trim()) {
    errors.push({
      gate: 'GATE_B',
      code: 'SERVICE_AREA_REQUIRED',
      message: 'Destination service area selection is required.'
    });
  }
  if (!form.title || !form.title.trim()) {
    errors.push({
      gate: 'GATE_B',
      code: 'TITLE_REQUIRED',
      message: 'English Title is required.'
    });
  }

  // Gate A: Schema & Format Constraints
  if (form.title && form.title.length > 255) {
    errors.push({
      gate: 'GATE_A',
      code: 'TITLE_TOO_LONG',
      message: 'Title exceeds maximum allowed length of 255 characters.'
    });
  }
  if (form.shortDescription && form.shortDescription.length > 500) {
    errors.push({
      gate: 'GATE_A',
      code: 'SHORT_DESC_TOO_LONG',
      message: 'Short description exceeds maximum allowed length of 500 characters.'
    });
  }
  if (form.longDescription && form.longDescription.length > 5000) {
    errors.push({
      gate: 'GATE_A',
      code: 'LONG_DESC_TOO_LONG',
      message: 'Long description exceeds maximum allowed length of 5000 characters.'
    });
  }
  if (form.coordinates?.lat !== undefined) {
    if (isNaN(form.coordinates.lat) || form.coordinates.lat < -90 || form.coordinates.lat > 90) {
      errors.push({
        gate: 'GATE_A',
        code: 'INVALID_LATITUDE',
        message: 'Latitude must be a valid number between -90 and 90.'
      });
    }
  }
  if (form.coordinates?.lng !== undefined) {
    if (isNaN(form.coordinates.lng) || form.coordinates.lng < -180 || form.coordinates.lng > 180) {
      errors.push({
        gate: 'GATE_A',
        code: 'INVALID_LONGITUDE',
        message: 'Longitude must be a valid number between -180 and 180.'
      });
    }
  }
  if (form.travelTimeMinutes !== undefined && form.travelTimeMinutes < 0) {
    errors.push({
      gate: 'GATE_A',
      code: 'INVALID_TRAVEL_TIME',
      message: 'Travel time in minutes cannot be negative.'
    });
  }
  if (form.practicalInfo?.contact_email && form.practicalInfo.contact_email.trim().length > 0) {
    if (!form.practicalInfo.contact_email.includes('@')) {
      errors.push({
        gate: 'GATE_A',
        code: 'INVALID_EMAIL_FORMAT',
        message: 'Contact email format is invalid.'
      });
    }
  }

  // Gate C: Semantic & Evidence Integrity checks (Placeholders & Media)
  const bannedPlaceholders = [
    'experience.rs',
    '+381 11 328 1234',
    '09:00 - 22:00 Daily',
    'Free entry / Ala carte',
    'concierge@experience.rs',
  ];

  if (form.practicalInfo?.website && bannedPlaceholders.some(p => form.practicalInfo?.website?.includes(p))) {
    errors.push({
      gate: 'GATE_C',
      code: 'DUMMY_WEBSITE_PLACEHOLDER',
      message: 'Website contains synthetic dummy placeholder (experience.rs). Provide genuine official URL.'
    });
  }
  if (form.practicalInfo?.contact_phone && bannedPlaceholders.some(p => form.practicalInfo?.contact_phone?.includes(p))) {
    errors.push({
      gate: 'GATE_C',
      code: 'DUMMY_PHONE_PLACEHOLDER',
      message: 'Contact phone contains synthetic dummy placeholder (+381 11 328 1234). Provide genuine phone or leave unresolved.'
    });
  }
  if (form.practicalInfo?.contact_email && bannedPlaceholders.some(p => form.practicalInfo?.contact_email?.includes(p))) {
    errors.push({
      gate: 'GATE_C',
      code: 'DUMMY_EMAIL_PLACEHOLDER',
      message: 'Contact email contains synthetic dummy placeholder (concierge@experience.rs). Provide genuine email or leave unresolved.'
    });
  }
  if (form.practicalInfo?.opening_hours && bannedPlaceholders.some(p => form.practicalInfo?.opening_hours?.includes(p))) {
    errors.push({
      gate: 'GATE_C',
      code: 'DUMMY_HOURS_PLACEHOLDER',
      message: 'Opening hours contains synthetic dummy placeholder (09:00 - 22:00 Daily).'
    });
  }

  if (selectedFile || fileLocalPreview || (mediaState && mediaState !== 'empty')) {
    if (mediaState !== 'attached') {
      errors.push({
        gate: 'GATE_C',
        code: 'INCOMPLETE_MEDIA_UPLOAD',
        message: 'Media upload pipeline must complete backend verification and attachment before submission.'
      });
    }
  }

  if (form.image) {
    if (form.image.startsWith('blob:') || form.image.startsWith('data:')) {
      errors.push({
        gate: 'GATE_C',
        code: 'BLOB_MEDIA_URL',
        message: 'Local preview images (blob URLs) cannot be submitted as permanent recommendation media.'
      });
    }
    if (form.image.includes('/storage/v1/object/public/')) {
      errors.push({
        gate: 'GATE_C',
        code: 'PUBLIC_STORAGE_URL',
        message: 'Recommendation media bucket is private and cannot be referenced via public storage URL.'
      });
    }
    if (form.image.includes('token=') || form.image.includes('signed_upload_url')) {
      errors.push({
        gate: 'GATE_C',
        code: 'SIGNED_TOKEN_URL',
        message: 'Signed upload URLs or tokens cannot be persisted as permanent media references.'
      });
    }
  }

  const gateAErrors = errors.filter(e => e.gate === 'GATE_A');
  const gateBErrors = errors.filter(e => e.gate === 'GATE_B');
  const gateCErrors = errors.filter(e => e.gate === 'GATE_C');

  return {
    errors,
    errorMessages: errors.map(e => e.message),
    gateA: { pass: gateAErrors.length === 0, errors: gateAErrors },
    gateB: { pass: gateBErrors.length === 0, errors: gateBErrors },
    gateC: { pass: gateCErrors.length === 0, errors: gateCErrors },
  };
}

export function RecommendationEditorModal({
  initialRecommendation,
  initialServiceAreaId,
  isOpen,
  onClose,
  onSave,
  onDeleteDraft,
  currentStatus = 'CANDIDATE'
}: RecommendationEditorModalProps) {
  const isEditing = !!initialRecommendation;

  // Form State
  const [form, setForm] = useState<Partial<Recommendation>>(() => buildInitialForm(initialRecommendation, initialServiceAreaId));
  const [selectedStatus, setSelectedStatus] = useState<'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'RETIRED'>(currentStatus);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'sr' | 'de' | 'ru' | 'es' | 'zh'>('en');
  
  // Dynamic Service Areas State
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaOption[]>([]);
  const [isLoadingServiceAreas, setIsLoadingServiceAreas] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // AI Recommendation Proposal Agent State (WP-14C5 & V9-STUDIO-AI-REC-01)
  const [isAIAgentModalOpen, setIsAIAgentModalOpen] = useState(false);
  const [agentEvidenceReport, setAgentEvidenceReport] = useState<AgentCompilationResult['evidenceReport'] | null>(null);
  const [agentProposalMetadata, setAgentProposalMetadata] = useState<AgentCompilationResult['metadata'] | null>(null);
  const [partnerIntelligence, setPartnerIntelligence] = useState<PartnerIntelligenceResult | null>(null);
  const [stagedPartners, setStagedPartners] = useState<StagedPartner[]>(() => {
    if ((initialRecommendation as any)?.stagedPartners && Array.isArray((initialRecommendation as any).stagedPartners)) {
      return (initialRecommendation as any).stagedPartners;
    }
    return [];
  });

  // Apply AI Recommendation Proposal to canonical editor
  const handleApplyAgentProposal = (result: AgentCompilationResult) => {
    setForm(prev => ({
      ...prev,
      ...result.recommendation,
      translations: {
        ...(prev.translations || {}),
        ...(result.recommendation.translations || {}),
      },
      provenance: {
        ...(prev.provenance || {}),
        ...(result.recommendation.provenance || {}),
      },
    }));

    if (result.recommendation.image) {
      setResolvedDisplayUrl(result.recommendation.image);
      setMediaState('attached');
    } else {
      setResolvedDisplayUrl('');
      setMediaState('empty');
    }

    const nextStatus = result.evidenceReport.lifecycleStatus || 'CANDIDATE';
    setSelectedStatus(nextStatus);
    setAgentEvidenceReport(result.evidenceReport);
    setAgentProposalMetadata(result.metadata || null);
    setPartnerIntelligence(result.partnerIntelligence);

    const isFallback = result.metadata?.executionMode === 'DETERMINISTIC_FALLBACK' || !result.metadata?.usedAi;

    setSubmissionFeedback({
      type: isFallback ? 'info' : 'success',
      message: isFallback
        ? `[FALLBACK DRAFT] AI Proposal "${result.recommendation.title}" compiled in AMBER (${nextStatus}). Live research was unavailable (${result.metadata?.fallbackReason || 'Conservative Fallback'}). Review unverified fields before approval.`
        : `AI Proposal "${result.recommendation.title}" compiled into canonical 6-step editor! Status initialized in AMBER (${nextStatus}). Please review and validate all fields before final Admin approval.`
    });
  };

  const [isRerunningResearch, setIsRerunningResearch] = useState(false);

  // State-Aware Tab 6 Action: Re-Run Grounded Research for current saved recommendation draft
  const handleRerunGroundedResearch = async () => {
    if (isRerunningResearch) return;
    setIsRerunningResearch(true);

    setSubmissionFeedback({
      type: 'info',
      message: 'Research in progress… Querying Gemini Grounded Web Search...'
    });

    try {
      const cleanTitle = (form.title || form.nameEn || initialRecommendation?.title || 'Recommendation')
        .replace(/\[Unresearched Structural Draft\]/g, '')
        .trim();

      const cleanLocation = (form.location || form.locationEn || form.translations?.en?.location || '')
        .replace(/\[Unresearched Structural Draft\]/g, '')
        .trim();

      const input: AgentProposalInput = {
        nameOrTitle: cleanTitle,
        destinationOrLocation: cleanLocation || undefined,
        targetServiceAreaId: form.serviceAreaId || initialServiceAreaId || undefined,
        descriptionOrNotes: form.shortDescription?.includes('[Unresearched Structural Draft]') ? undefined : form.shortDescription,
        referenceUrl: form.website || form.practicalInfo?.website || undefined,
        humanProvidedMedia: (form.image || fileLocalPreview) ? {
          url: form.image || fileLocalPreview || '',
          source: form.provenance?.source || 'Curator Field Photography',
          license: form.provenance?.license || 'Editorial Rights Approved',
          altText: cleanTitle,
        } : undefined,
      };

      const result = await compileRecommendationProposal(input, serviceAreas);

      const isQuotaExceeded =
        Boolean(result.metadata?.quotaExceeded) ||
        result.metadata?.classification === 'GEMINI_QUOTA_EXCEEDED' ||
        Boolean(result.metadata?.fallbackReason?.includes('429')) ||
        Boolean(result.metadata?.fallbackReason?.includes('RESOURCE_EXHAUSTED'));

      if (isQuotaExceeded) {
        setAgentProposalMetadata(prev => ({
          ...(prev || {}),
          usedAi: false,
          executionMode: 'DETERMINISTIC_FALLBACK',
          model: 'deterministic_semantic_engine',
          sources: prev?.sources || [],
          quotaExceeded: true,
          fallbackReason: '429 RESOURCE_EXHAUSTED',
        }));
        setSubmissionFeedback({
          type: 'error',
          message: 'Gemini research quota exceeded. Existing draft preserved. Try again later.'
        });
        return;
      }

      // Update current draft IN PLACE
      setForm(prev => {
        const updated = {
          ...prev,
          id: prev.id || form.dbId || initialRecommendation?.id,
          dbId: prev.dbId || initialRecommendation?.dbId,
          serviceAreaId: prev.serviceAreaId || result.recommendation.serviceAreaId,
          title: result.recommendation.title || prev.title,
          titleSr: result.recommendation.titleSr || prev.titleSr,
          category: result.recommendation.category || prev.category,
          subCategory: (result.recommendation as any).subCategory || (prev as any).subCategory,
          shortDescription: result.recommendation.shortDescription || prev.shortDescription,
          shortDescriptionSr: result.recommendation.shortDescriptionSr || prev.shortDescriptionSr,
          longDescription: result.recommendation.longDescription || prev.longDescription,
          longDescriptionSr: result.recommendation.longDescriptionSr || prev.longDescriptionSr,
          location: result.recommendation.location || prev.location,
          locationSr: result.recommendation.locationSr || prev.locationSr,
          coordinates: result.recommendation.coordinates || prev.coordinates,
          practicalInfo: {
            ...(prev.practicalInfo || {}),
            ...(result.recommendation.practicalInfo || {}),
          },
          duration: result.recommendation.duration || prev.duration,
          travelTime: result.recommendation.travelTime || prev.travelTime,
          travelTimeMinutes: result.recommendation.travelTimeMinutes ?? prev.travelTimeMinutes,
          estimatedCost: result.recommendation.estimatedCost || prev.estimatedCost,
          preferredTransport: result.recommendation.preferredTransport || prev.preferredTransport,
          image: prev.image || result.recommendation.image,
          provenance: {
            ...(result.recommendation.provenance || {}),
            ...(prev.provenance || {}),
          },
          translations: {
            ...(prev.translations || {}),
            ...(result.recommendation.translations || {}),
          },
          lifecycleStatus: prev.lifecycleStatus === 'APPROVED' ? 'NEEDS RESEARCH' : (prev.lifecycleStatus || 'NEEDS RESEARCH'),
        };
        return updated;
      });

      setAgentEvidenceReport(result.evidenceReport);
      setAgentProposalMetadata(result.metadata || null);
      if (result.partnerIntelligence) {
        setPartnerIntelligence(result.partnerIntelligence);
      }

      // Remain AMBER
      setSelectedStatus('NEEDS RESEARCH');

      setSubmissionFeedback({
        type: 'success',
        message: 'Grounded research refreshed — review all tabs before approval.'
      });
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        setSubmissionFeedback({
          type: 'error',
          message: '429 RESOURCE_EXHAUSTED — Quota limit reached. Current draft preserved unchanged. Please try again later.'
        });
      } else {
        setSubmissionFeedback({
          type: 'error',
          message: `Research rerun failed: ${errStr}. Current draft preserved.`
        });
      }
    } finally {
      setIsRerunningResearch(false);
    }
  };

  // WP-14C5D Primary Recommendation Media State
  const [mediaState, setMediaState] = useState<MediaWorkflowState>('empty');
  const reservationIdempotencyKeyRef = useRef<string>(`res_key_${crypto.randomUUID()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileLocalPreview, setFileLocalPreview] = useState<string | null>(null);
  const [resolvedDisplayUrl, setResolvedDisplayUrl] = useState<string>('');
  const [isResolvingDisplayUrl, setIsResolvingDisplayUrl] = useState<boolean>(false);
  const [displayUrlResolutionError, setDisplayUrlResolutionError] = useState<string | null>(null);
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaStepStatus, setMediaStepStatus] = useState<{
    localValidation: 'idle' | 'pending' | 'success' | 'error';
    authorize: 'idle' | 'pending' | 'success' | 'error';
    upload: 'idle' | 'pending' | 'success' | 'error';
    confirm: 'idle' | 'pending' | 'success' | 'error';
    metadata: 'idle' | 'pending' | 'success' | 'error';
    verify: 'idle' | 'pending' | 'success' | 'error';
    attach: 'idle' | 'pending' | 'success' | 'error';
  }>({
    localValidation: 'idle',
    authorize: 'idle',
    upload: 'idle',
    confirm: 'idle',
    metadata: 'idle',
    verify: 'idle',
    attach: 'idle',
  });

  // Handle local image file selection
  const handleSelectFile = (file: File) => {
    setMediaError(null);
    setDisplayUrlResolutionError(null);
    const valResult = validateLocalMediaFile(file);
    if (!valResult.valid) {
      setMediaError(valResult.error || 'Invalid file selection.');
      setMediaState('error');
      setSelectedFile(null);
      if (activeBlobUrlRef.current) {
        try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
        activeBlobUrlRef.current = null;
      }
      setFileLocalPreview(null);
      return;
    }

    // Revoke previous blob if any
    if (activeBlobUrlRef.current) {
      try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
      activeBlobUrlRef.current = null;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    activeBlobUrlRef.current = objectUrl;
    setFileLocalPreview(objectUrl);
    setMediaState('selected');
    setMediaStepStatus({
      localValidation: 'success',
      authorize: 'idle',
      upload: 'idle',
      confirm: 'idle',
      metadata: 'idle',
      verify: 'idle',
      attach: 'idle',
    });
  };


  // Handle execution of the 6-step governed media upload pipeline
  const handleStartMediaPipeline = async () => {
    if (!selectedFile) {
      setMediaError('Please select a valid image file first.');
      return;
    }

    setMediaError(null);

    const rawDestId = form.serviceAreaId || serviceAreas[0]?.id;
    if (!rawDestId || !rawDestId.trim()) {
      setMediaError('Canonical Service Area (Destination ID) is required in Step 1 before uploading media.');
      return;
    }

    // Resolve canonical service area UUID before calling UUID database parameters
    const resolvedDestUuid = await resolveServiceAreaUuid(rawDestId);
    if (!resolvedDestUuid) {
      setMediaError('Canonical service area UUID could not be resolved.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
      return;
    }

    // Resolve canonical recommendation identity without overwriting display ID (e.g., "97")
    const identity = await resolveCanonicalRecommendationIdentity({
      id: form.id,
      dbId: form.dbId || initialRecommendation?.dbId,
      serviceAreaId: resolvedDestUuid,
    });

    let targetMediaRecId = (identity.canonicalUuid && isUuid(identity.canonicalUuid))
      ? identity.canonicalUuid
      : (form.draftReservationId && isUuid(form.draftReservationId))
        ? form.draftReservationId
        : '';

    if (!targetMediaRecId || !isUuid(targetMediaRecId)) {
      setMediaState('authorizing');
      setMediaStepStatus(s => ({ ...s, authorize: 'pending' }));
      const reserveRes = await reserveRecommendationDraft(resolvedDestUuid, reservationIdempotencyKeyRef.current);
      if (reserveRes.success && reserveRes.reserved_recommendation_id && isUuid(reserveRes.reserved_recommendation_id)) {
        targetMediaRecId = reserveRes.reserved_recommendation_id;
        setForm(prev => ({
          ...prev,
          draftReservationId: targetMediaRecId,
        }));
      } else if (reserveRes.error === 'MEDIA_AUTH_REQUIRED' || reserveRes.error === 'UNAUTHORIZED') {
        setMediaError('Studio authentication session expired or missing. Please sign in with an authorized Studio account.');
        setMediaState('error');
        setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
        return;
      }
    }

    if (!targetMediaRecId || !isUuid(targetMediaRecId)) {
      setMediaError('Draft reservation UUID could not be established. Media upload was not started.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
      return;
    }

    // 1. Local Validation
    setMediaStepStatus(s => ({ ...s, localValidation: 'pending' }));
    const valResult = validateLocalMediaFile(selectedFile);
    if (!valResult.valid) {
      setMediaError(valResult.error || 'Validation failed');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, localValidation: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, localValidation: 'success' }));

    // 2. Authorize Upload
    setMediaState('authorizing');
    setMediaStepStatus(s => ({ ...s, authorize: 'pending' }));

    let authRes = await authorizeRecommendationMediaUpload({
      destination_id: resolvedDestUuid,
      reserved_recommendation_id: targetMediaRecId,
      mime_type: selectedFile.type,
      file_size_bytes: selectedFile.size,
      original_filename: selectedFile.name,
      replacement_asset_id: currentAssetId || undefined,
    });

    // Auto-healing: If reservation is inactive or destination-mismatched (MEDIA_AUTHORIZATION_INVALID),
    // clear stale reservation, request a fresh server-authoritative reservation for resolvedDestUuid, update draftReservationId, and retry authorization exactly once.
    if (!authRes.success && authRes.error === 'MEDIA_AUTHORIZATION_INVALID') {
      setForm(prev => ({ ...prev, draftReservationId: undefined }));
      const freshKey = `reserve_${resolvedDestUuid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const freshReserveRes = await reserveRecommendationDraft(resolvedDestUuid, freshKey);

      if (freshReserveRes.success && freshReserveRes.reserved_recommendation_id) {
        targetMediaRecId = freshReserveRes.reserved_recommendation_id;
        setForm(prev => ({
          ...prev,
          draftReservationId: targetMediaRecId,
        }));

        authRes = await authorizeRecommendationMediaUpload({
          destination_id: resolvedDestUuid,
          reserved_recommendation_id: targetMediaRecId,
          mime_type: selectedFile.type,
          file_size_bytes: selectedFile.size,
          original_filename: selectedFile.name,
          replacement_asset_id: currentAssetId || undefined,
        });
      }
    }

    if (!authRes.success) {
      if (authRes.error === 'MEDIA_AUTH_REQUIRED' || authRes.error === 'UNAUTHORIZED') {
        setMediaError('MEDIA_AUTH_REQUIRED: Valid Studio user session access token is required to perform media operations.');
      } else if (authRes.error === 'MEDIA_SERVICE_UNAVAILABLE' || authRes.error === 'NO_SUPABASE' || authRes.error === 'NO_SUPABASE_CLIENT') {
        setMediaError('MEDIA_SERVICE_UNAVAILABLE: Editorial workflow engine backend is unavailable. Selected file preserved for retry.');
      } else if (authRes.error === 'MEDIA_AUTHORIZATION_INVALID') {
        setMediaError(authRes.message ? `MEDIA_AUTHORIZATION_INVALID: ${authRes.message}` : 'MEDIA_AUTHORIZATION_INVALID: Upload authorization response is missing required fields or invalid.');
      } else {
        setMediaError(authRes.message || authRes.error || 'Upload authorization failed.');
      }
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, authorize: 'error' }));
      return;
    }

    setMediaStepStatus(s => ({ ...s, authorize: 'success' }));
    setCurrentAssetId(authRes.asset_id!);

    // 3. Signed Storage Upload
    setMediaState('uploading');
    setMediaStepStatus(s => ({ ...s, upload: 'pending' }));

    const uploadBucket = authRes.bucket!;
    const uploadPath = (authRes.object_path || authRes.path)!;
    const uploadToken = authRes.token!;

    const uploadRes = await uploadFileToSignedUrl(
      selectedFile,
      uploadBucket,
      uploadPath,
      uploadToken,
      authRes.signed_upload_url
    );

    if (!uploadRes.success) {
      setMediaError(uploadRes.error || 'Failed to upload image file to storage bucket.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, upload: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, upload: 'success' }));

    // 4. Confirm Upload
    setMediaState('confirming');
    setMediaStepStatus(s => ({ ...s, confirm: 'pending' }));

    const confirmRes = await confirmRecommendationMediaUpload(authRes.asset_id!);
    if (!confirmRes.success) {
      setMediaError(confirmRes.message || confirmRes.error || 'Failed to confirm upload object in storage.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, confirm: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, confirm: 'success' }));

    // 5. Update Metadata & Provenance
    setMediaState('updating_metadata');
    setMediaStepStatus(s => ({ ...s, metadata: 'pending' }));

    const metaRes = await updateRecommendationMediaMetadata(authRes.asset_id!, {
      altText: {
        en: form.title || selectedFile.name,
        sr: form.titleSr || form.title || selectedFile.name,
      },
      provenanceSource: form.provenance?.source && form.provenance.source !== 'Pending Human Upload' ? form.provenance.source : 'Studio Verified Upload',
      acquisitionMethod: 'original',
      licenceType: form.provenance?.license === 'CC-BY 4.0' ? 'CC-BY-4.0' : (form.provenance?.license || 'CC-BY-4.0'),
      attributionRequired: form.provenance?.attributionRequired || false,
      attributionText: form.provenance?.attributionText || '',
    });

    if (!metaRes.success) {
      setMediaError(metaRes.message || metaRes.error || 'Failed to register provenance metadata.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, metadata: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, metadata: 'success' }));

    // 6. Verify Asset
    setMediaState('verifying');
    setMediaStepStatus(s => ({ ...s, verify: 'pending' }));

    const verifyRes = await verifyRecommendationMediaAsset(authRes.asset_id!);
    if (!verifyRes.success) {
      setMediaError(verifyRes.message || verifyRes.error || 'Media asset verification failed.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, verify: 'error' }));
      return;
    }
    setMediaStepStatus(s => ({ ...s, verify: 'success' }));

    // 7. Attach Asset
    setMediaState('attaching');
    setMediaStepStatus(s => ({ ...s, attach: 'pending' }));

    const attachRes = await attachRecommendationMediaAsset(authRes.asset_id!);
    if (!attachRes.success) {
      setMediaError(attachRes.message || attachRes.error || 'Failed to attach media asset to recommendation workflow.');
      setMediaState('error');
      setMediaStepStatus(s => ({ ...s, attach: 'error' }));
      return;
    }

    setMediaStepStatus(s => ({ ...s, attach: 'success' }));

    const canonicalRef = attachRes.canonical_url || (attachRes.object_path ? getCanonicalMediaReference(attachRes.object_path) : (authRes.object_path ? getCanonicalMediaReference(authRes.object_path) : ''));

    // Safe replacement ordering: Abandon old asset ONLY AFTER new asset is verified and attached
    const previousAssetToAbandon = currentAssetId && currentAssetId !== authRes.asset_id ? currentAssetId : null;
    if (previousAssetToAbandon) {
      abandonRecommendationMediaAsset(previousAssetToAbandon, 'Superseded by newly verified replacement image').catch((e) => {
        console.warn('[RecommendationEditorModal] Non-blocking abandonment warning:', e);
      });
    }

    setCurrentAssetId(authRes.asset_id!);
    setSelectedFile(null);

    // Keep active local blob preview as immediate display URL while transitioning canonical state
    const immediateBlobUrl = fileLocalPreview;
    if (immediateBlobUrl) {
      setResolvedDisplayUrl(immediateBlobUrl);
    }

    const updatedFormState: Partial<Recommendation> = {
      ...form,
      dbId: identity.canonicalUuid || form.dbId,
      draftReservationId: !identity.canonicalUuid ? targetMediaRecId : form.draftReservationId,
      image: canonicalRef,
      provenance: {
        ...form.provenance,
        source: form.provenance?.source && form.provenance.source !== 'Pending Human Upload' ? form.provenance.source : 'Studio Verified Upload',
        method: 'original',
        license: form.provenance?.license || 'CC-BY-4.0',
        verificationStatus: 'verified',
      }
    };

    setForm(updatedFormState);
    setMediaState('attached');

    // Auto-persist the verified replacement media into the active server draft amendment
    saveRecommendationDraft(updatedFormState, resolvedDestUuid)
      .then((draftRes) => {
        if (draftRes.success) {
          setSubmissionFeedback({
            type: 'success',
            message: 'Media verified, attached, and persisted to active editorial draft amendment.',
          });
        }
      })
      .catch((err) => {
        console.warn('[RecommendationEditorModal] Draft auto-persist notice:', err);
      });

    // Invalidate stale cache for this path and resolve permanent signed read URL
    invalidateMediaCache(canonicalRef);
    resolveMediaDisplayUrl(canonicalRef)
      .then((signedUrl) => {
        if (signedUrl) {
          setResolvedDisplayUrl(signedUrl);
          setDisplayUrlResolutionError(null);
          // Revoke temporary blob preview only after permanent display URL is secured
          if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
            try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
            activeBlobUrlRef.current = null;
          }
          setFileLocalPreview(null);
        }
      })
      .catch((err) => {
        console.warn('[RecommendationEditorModal] Post-attach signed URL resolution notice:', err);
        // If immediate local blob preview is active in this session, keep showing it
        if (!immediateBlobUrl) {
          setDisplayUrlResolutionError(err?.message || 'Failed to resolve display URL for attached media.');
        }
      });
  };

  // Safe Removal: Clears image reference and disassociates asset
  const handleRemoveImage = async () => {
    if (currentAssetId) {
      setMediaState('abandoning');
      await abandonRecommendationMediaAsset(currentAssetId, 'User explicitly removed image from recommendation draft');
    }
    if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
      try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setFileLocalPreview(null);
    setCurrentAssetId(null);
    setMediaError(null);
    setResolvedDisplayUrl('');
    setDisplayUrlResolutionError(null);
    setMediaState('empty');
    setForm(prev => ({ ...prev, image: '' }));
    setMediaStepStatus({
      localValidation: 'idle',
      authorize: 'idle',
      upload: 'idle',
      confirm: 'idle',
      metadata: 'idle',
      verify: 'idle',
      attach: 'idle',
    });
  };

  // Safe Replace Trigger: Resets file input value and triggers OS file chooser without clearing existing active image
  const handleTriggerReplaceImage = () => {
    setMediaError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
        try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // Display URL Resolution Effect: Authoritative SSOT for resolving form.image into a displayable URL
  useEffect(() => {
    let mounted = true;
    if (!isOpen || !form.image) {
      if (!form.image) {
        setResolvedDisplayUrl('');
        setDisplayUrlResolutionError(null);
      }
      return;
    }

    const currentImg = form.image;

    // 1. Direct displayable URLs
    if (currentImg.startsWith('blob:') || currentImg.startsWith('data:') || currentImg.startsWith('http://') || currentImg.startsWith('https://')) {
      setResolvedDisplayUrl(currentImg);
      setDisplayUrlResolutionError(null);
      return;
    }

    // 2. Bundled static assets
    if (
      currentImg.startsWith('/src/assets/images/') ||
      currentImg.startsWith('src/assets/images/') ||
      currentImg.startsWith('assets/images/') ||
      currentImg.startsWith('/assets/images/')
    ) {
      setResolvedDisplayUrl(getOptimizedImageUrl(currentImg));
      setDisplayUrlResolutionError(null);
      return;
    }

    // 3. Governed private storage references ('recommendation-media/...')
    if (currentImg.startsWith('recommendation-media/') || currentImg.startsWith('/recommendation-media/')) {
      // If we already have an active local blob preview for this session, keep displaying it without disruption
      if (!fileLocalPreview) {
        setIsResolvingDisplayUrl(true);
      }
      setDisplayUrlResolutionError(null);

      resolveMediaDisplayUrl(currentImg)
        .then((signedUrl) => {
          if (mounted) {
            setResolvedDisplayUrl(signedUrl);
            setIsResolvingDisplayUrl(false);
            setDisplayUrlResolutionError(null);
          }
        })
        .catch((err) => {
          if (mounted) {
            setIsResolvingDisplayUrl(false);
            if (!fileLocalPreview) {
              setDisplayUrlResolutionError(err?.message || 'Failed to resolve private media storage URL.');
            }
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [form.image, isOpen, fileLocalPreview]);

  // Load service areas from public.service_areas
  useEffect(() => {
    let mounted = true;
    async function loadServiceAreas() {
      setIsLoadingServiceAreas(true);
      const areas = await fetchAuthoritativeServiceAreas();
      if (mounted) {
        setServiceAreas(areas);
        setIsLoadingServiceAreas(false);
      }
    }
    loadServiceAreas();
    return () => { mounted = false; };
  }, [isOpen]);

  // Initialize or reset form state
  useEffect(() => {
    setForm(buildInitialForm(initialRecommendation, initialServiceAreaId));
    setShowDiscardConfirm(false);
    if (initialRecommendation) {
      setSelectedStatus(currentStatus);
    } else {
      setSelectedStatus('CANDIDATE');
    }
    if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
      try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setFileLocalPreview(null);
    setMediaError(null);
    setDisplayUrlResolutionError(null);
    setMediaState(initialRecommendation?.image ? 'attached' : 'empty');
    setCurrentStep(1);
    setSubmissionFeedback(null);

    let mounted = true;
    async function checkForServerDraft() {
      if (!isOpen || !initialRecommendation) return;
      const recId = initialRecommendation.id || initialRecommendation.dbId;
      const explicitDbId = initialRecommendation.dbId;
      if (!recId && !explicitDbId) return;

      const draft = await fetchLatestDraftForRecommendation(recId, explicitDbId);
      if (draft && mounted) {
        setForm(prev => {
          const draftTranslations = draft.translations || {};
          const normalizedTaxonomy = (draft.category || draft.categories)
            ? normalizeRecommendationCategories(draft.category, draft.categories)
            : null;

          // Check whether local prev state is tied to the exact same workflowWorkItemId and has newer unsaved edits
          const isSameWorkItem = Boolean(
            prev.workflowWorkItemId &&
            draft.workflowWorkItemId &&
            prev.workflowWorkItemId === draft.workflowWorkItemId
          );

          const localUpdatedAt = (prev as any).updatedAt || (prev as any).updated_at || 0;
          const serverUpdatedAt = (draft as any).updatedAt || (draft as any).updated_at || 0;
          const isLocalNewer = localUpdatedAt > serverUpdatedAt;

          if (isSameWorkItem && isLocalNewer) {
            // Local unsaved user edits for the exact same work item override server proposal
            return {
              ...draft,
              ...prev,
              workflowWorkItemId: draft.workflowWorkItemId,
            };
          }

          // Otherwise, server proposal content is authoritative and wins completely
          return {
            ...prev,
            ...draft,
            id: prev.id || initialRecommendation.id,
            dbId: draft.dbId || prev.dbId || initialRecommendation.dbId,
            draftReservationId: draft.draftReservationId || prev.draftReservationId || initialRecommendation.draftReservationId,
            workflowWorkItemId: draft.workflowWorkItemId || prev.workflowWorkItemId || initialRecommendation.workflowWorkItemId,
            category: normalizedTaxonomy ? normalizedTaxonomy.primaryCategory : (draft.category || prev.category),
            categories: normalizedTaxonomy ? normalizedTaxonomy.categories : (draft.categories || prev.categories),
            title: draft.title ?? prev.title,
            shortDescription: draft.shortDescription ?? prev.shortDescription,
            longDescription: draft.longDescription ?? prev.longDescription,
            location: draft.location ?? prev.location,
            titleSr: draft.titleSr || draftTranslations.sr?.title || prev.titleSr || '',
            shortDescriptionSr: draft.shortDescriptionSr || draftTranslations.sr?.shortDescription || prev.shortDescriptionSr || '',
            longDescriptionSr: draft.longDescriptionSr || draftTranslations.sr?.longDescription || prev.longDescriptionSr || '',
            locationSr: draft.locationSr || draftTranslations.sr?.location || prev.locationSr || '',
            image: draft.image ?? prev.image,
            travelTime: typeof draft.travelTime === 'string' ? draft.travelTime : (prev.travelTime || ''),
            travelTimeMinutes: typeof draft.travelTimeMinutes === 'number' ? draft.travelTimeMinutes : prev.travelTimeMinutes,
            coordinates: draft.coordinates ?? prev.coordinates,
            translations: {
              ...prev.translations,
              ...draftTranslations,
            },
          };
        });

        if (draft.image) {
          setMediaState('attached');
          resolveMediaDisplayUrl(draft.image)
            .then(url => {
              if (url && mounted) setResolvedDisplayUrl(url);
            })
            .catch(() => {});
        }
      }
    }

    if (isOpen && initialRecommendation) {
      checkForServerDraft();
    }

    return () => { mounted = false; };
  }, [initialRecommendation, initialServiceAreaId, currentStatus, isOpen]);

  // Synchronization helper for EN/SR direct fields and translations object
  const updateFieldWithSync = (field: string, val: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };

      // Keep title synced
      if (field === 'title') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, title: val }
        };
      } else if (field === 'titleSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, title: val }
        };
      } else if (field === 'shortDescription') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, shortDescription: val }
        };
      } else if (field === 'shortDescriptionSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, shortDescription: val }
        };
      } else if (field === 'longDescription') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, longDescription: val }
        };
      } else if (field === 'longDescriptionSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, longDescription: val }
        };
      } else if (field === 'location') {
        next.translations = {
          ...next.translations,
          en: { ...next.translations?.en, location: val }
        };
      } else if (field === 'locationSr') {
        next.translations = {
          ...next.translations,
          sr: { ...next.translations?.sr, location: val }
        };
      }

      return next;
    });
  };

  // Update translation for specific language
  const updateTranslationField = (lang: 'en' | 'sr' | 'de' | 'ru' | 'es' | 'zh', key: string, val: string) => {
    setForm(prev => {
      const langObj = prev.translations?.[lang] || {};
      const updatedLang = { ...langObj, [key]: val };
      const updatedTrans = { ...prev.translations, [lang]: updatedLang };

      const next = { ...prev, translations: updatedTrans };

      // Sync EN/SR back to direct fields if editing EN/SR tab
      if (lang === 'en') {
        if (key === 'title') next.title = val;
        if (key === 'shortDescription') next.shortDescription = val;
        if (key === 'longDescription') next.longDescription = val;
        if (key === 'location') next.location = val;
      } else if (lang === 'sr') {
        if (key === 'title') next.titleSr = val;
        if (key === 'shortDescription') next.shortDescriptionSr = val;
        if (key === 'longDescription') next.longDescriptionSr = val;
        if (key === 'location') next.locationSr = val;
      }

      return next;
    });
  };

  // Validation checks & completeness
  const completeness = calculateRecommendationCompleteness(form, selectedStatus, {
    isMediaUnresolvable: Boolean(displayUrlResolutionError)
  });

  // Field validation errors
  const governanceEvaluation = useMemo(() => {
    return evaluateRecommendationGovernanceGates({
      form,
      displayUrlResolutionError: Boolean(displayUrlResolutionError),
      selectedFile,
      fileLocalPreview,
      mediaState,
      agentProposalMetadata,
      agentEvidenceReport,
    });
  }, [form, displayUrlResolutionError, selectedFile, fileLocalPreview, mediaState, agentProposalMetadata, agentEvidenceReport]);

  const validationErrors = governanceEvaluation.errorMessages;

  // Determine if recommendation draft requires grounded research refresh
  const needsResearch = useMemo(() => {
    return isDraftNeedingResearch(form, selectedStatus, agentProposalMetadata, agentEvidenceReport);
  }, [form, selectedStatus, agentProposalMetadata, agentEvidenceReport]);

  // Overall localization completeness percentage
  const localizationProgress = useMemo(() => {
    let completedCount = 0;
    CANONICAL_LANGUAGES.forEach(lang => {
      const trans = form.translations?.[lang.code];
      if (trans?.title && trans?.shortDescription) {
        completedCount++;
      }
    });
    return Math.round((completedCount / CANONICAL_LANGUAGES.length) * 100);
  }, [form.translations]);

  // Dynamic Partner Intelligence memo
  const currentPartnerIntelligence = useMemo(() => {
    if (partnerIntelligence) return partnerIntelligence;
    return evaluatePartnerSuitability(form);
  }, [partnerIntelligence, form]);

  // Handle Form Submission via RPC / Handler
  const handleSubmitCanonical = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
      setSubmissionFeedback({
        type: 'error',
        message: `Cannot submit recommendation due to blocking errors: ${validationErrors.join(' ')}`
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback({ type: 'info', message: 'Validating canonical recommendation payload and submitting via RPC...' });

    try {
      const rawDestId = form.serviceAreaId;
      if (!rawDestId || !rawDestId.trim()) {
        setSubmissionFeedback({
          type: 'error',
          message: 'A valid destination service area selection is strictly required before submission.'
        });
        setIsSubmitting(false);
        return;
      }

      const resolvedDestUuid = await resolveServiceAreaUuid(rawDestId);
      if (!resolvedDestUuid) {
        setSubmissionFeedback({
          type: 'error',
          message: 'Canonical service area UUID could not be resolved.'
        });
        setIsSubmitting(false);
        return;
      }

      const res = await submitCanonicalRecommendationCreate(form, resolvedDestUuid);

      if (res.success) {
        setSubmissionFeedback({
          type: 'success',
          message: res.message || 'Canonical recommendation successfully submitted and verified!'
        });

        // Construct clean recommendation object for UI state
        const savedRec: Recommendation = {
          ...(form as Recommendation),
          stagedPartners,
          id: form.id || (res.proposed_recommendation_id && !isUuid(form.id) ? form.id : res.proposed_recommendation_id) || `rec-${Date.now()}`,
          dbId: form.dbId || (isUuid(form.id) ? form.id : undefined) || (res.proposed_recommendation_id && isUuid(res.proposed_recommendation_id) ? res.proposed_recommendation_id : undefined),
          publicationStatus: selectedStatus === 'APPROVED' ? 'CANONICAL' : 'RESEARCH_CANDIDATE',
        };

        setTimeout(() => {
          onSave(savedRec, selectedStatus);
          onClose();
        }, 800);
      } else {
        setSubmissionFeedback({
          type: 'error',
          message: res.message || res.error || 'Failed to submit recommendation.'
        });
      }
    } catch (err: any) {
      setSubmissionFeedback({
        type: 'error',
        message: `Submission exception: ${err?.message || String(err)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Draft durably to PostgreSQL backend via RPC
  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionFeedback({ type: 'info', message: 'Saving recommendation draft to authoritative backend...' });

    try {
      const rawDestId = form.serviceAreaId;
      const resolvedDestUuid = await resolveServiceAreaUuid(rawDestId);
      if (!resolvedDestUuid && rawDestId) {
        setSubmissionFeedback({
          type: 'error',
          message: 'DRAFT SAVE FAILED — Canonical service area UUID could not be resolved.'
        });
        setIsSubmitting(false);
        return;
      }

      const res = await saveRecommendationDraft(form, resolvedDestUuid || rawDestId);
      const confirmation = getDraftSaveConfirmationMessage(res);
      setSubmissionFeedback(confirmation);

      if (res.serverPersisted === true) {
        const isBaselineCanonical = INITIAL_RECOMMENDATIONS.some(
          i => i.id === form.id && (i.publicationStatus === 'CANONICAL' || i.publicationStatus === 'PUBLISHED')
        );
        const savedRec: Recommendation = {
          ...(form as Recommendation),
          stagedPartners,
          id: form.id || `rec-draft-${Date.now()}`,
          dbId: isBaselineCanonical ? (form.dbId || (isUuid(form.id) ? form.id : undefined)) : undefined,
          draftReservationId: form.draftReservationId || (res.proposed_recommendation_id && isUuid(res.proposed_recommendation_id) ? res.proposed_recommendation_id : undefined),
        };

        const draftStatus = (selectedStatus === 'APPROVED' && !isBaselineCanonical)
          ? 'NEEDS RESEARCH'
          : (selectedStatus || 'NEEDS RESEARCH');

        onSave(savedRec, draftStatus);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setSubmissionFeedback({
        type: 'error',
        message: 'DRAFT SAVE FAILED'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current item is an unpublished draft (safety check to strictly hide/block for canonical/published items)
  const isCanonicalOrPublished =
    form.publicationStatus === 'CANONICAL' ||
    form.publicationStatus === 'PUBLISHED' ||
    selectedStatus === 'APPROVED' ||
    currentStatus === 'APPROVED' ||
    initialRecommendation?.publicationStatus === 'CANONICAL' ||
    initialRecommendation?.publicationStatus === 'PUBLISHED';

  const isUnpublishedDraft = !isCanonicalOrPublished && (
    form.publicationStatus === 'RESEARCH_CANDIDATE' ||
    form.publicationStatus === 'NEEDS_EDITORIAL_IMPROVEMENT' ||
    form.publicationStatus === 'NEEDS_ADDITIONAL_RESEARCH' ||
    selectedStatus === 'CANDIDATE' ||
    selectedStatus === 'NEEDS RESEARCH' ||
    currentStatus === 'CANDIDATE' ||
    currentStatus === 'NEEDS RESEARCH' ||
    !form.publicationStatus
  );

  const executeDiscardDraft = async () => {
    setIsSubmitting(true);
    const targetId = form.id || form.dbId || initialRecommendation?.id || initialRecommendation?.dbId;
    if (targetId) {
      removeLocalStudioDraft(targetId);
      if (form.id) removeLocalStudioDraft(form.id);
      if (form.dbId) removeLocalStudioDraft(form.dbId);
      if (initialRecommendation?.id) removeLocalStudioDraft(initialRecommendation.id);
      if (initialRecommendation?.dbId) removeLocalStudioDraft(initialRecommendation.dbId);

      try {
        await retireRecommendation(targetId, 'Admin deleted recommendation from Studio');
      } catch (err) {
        console.warn('[EditorModal] Retire RPC warning:', err);
      }

      if (onDeleteDraft) {
        onDeleteDraft(targetId);
      }
      if (onSave) {
        onSave({ ...form, id: targetId, publicationStatus: 'RETIRED', isPublished: false } as Recommendation, 'RETIRED');
      }
    }
    setIsSubmitting(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  const isApproved = selectedStatus === 'APPROVED';
  const isRetired = selectedStatus === 'RETIRED';
  const isAmberReview = selectedStatus === 'CANDIDATE' || selectedStatus === 'NEEDS RESEARCH';

  const headerBgClass = isApproved 
    ? 'bg-[#23251E] border-[#32352B]' 
    : isRetired
    ? 'bg-[#334155] border-[#475569]'
    : 'bg-[#854D0E] border-[#A16207]'; // Rich Warm Amber for AI-Assisted Draft / Admin Review

  const headerBadgeClass = isApproved
    ? 'bg-white/10 text-[#C5A059]'
    : isRetired
    ? 'bg-white/10 text-slate-300'
    : 'bg-black/30 text-[#FEF08A]';

  const headerTagLabel = isApproved
    ? (isEditing ? `CANONICAL REC #${form.id} (APPROVED)` : 'CANONICAL RECOMMENDATION (APPROVED)')
    : isRetired
    ? 'RETIRED RECOMMENDATION (ARCHIVE)'
    : (agentEvidenceReport ? 'AI-ASSISTED DRAFT — HUMAN REVIEW IN PROGRESS (AMBER)' : 'RESEARCH CANDIDATE / DRAFT (AMBER)');

  return (
    <>
      <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
        <div className="w-full max-w-5xl bg-white border border-[#E5E3DB] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className={`${headerBgClass} text-white p-4 sm:p-5 px-6 flex items-center justify-between border-b shrink-0 transition-colors duration-300`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${headerBadgeClass}`}>
                <Sparkles size={18} />
              </div>
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#FEF08A] font-bold block">
                  {headerTagLabel}
                </span>
                <h2 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                  {isEditing ? `Edit: ${form.title || 'Untitled'}` : (form.title ? form.title : 'Create Recommendation')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAIAgentModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 shadow-xs active:scale-95"
              >
                <Sparkles size={14} className="text-[#FEF08A]" />
                <span className="hidden sm:inline">AI Proposal Agent</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

        {/* 6-Step Governed Wizard Bar */}
        <div className="bg-[#FAF9F5] border-b border-[#E5E3DB] px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto shrink-0 font-mono text-xs gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { step: 1, label: '1. Identity & Taxonomy' },
              { step: 2, label: '2. Content & Media' },
              { step: 3, label: '3. Practical & Geo' },
              { step: 4, label: '4. Mood Orbit' },
              { step: 5, label: '5. Localization' },
              { step: 6, label: '6. Review & Validate' },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentStep === s.step 
                    ? 'bg-[#23251E] text-white shadow-xs' 
                    : 'bg-white/80 text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10.5px]">
            <span className="text-[#8C8A7D]">Lifecycle Status:</span>
            <span className="font-bold text-[#8A1F1F] uppercase">{selectedStatus}</span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmitCanonical} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Feedback banner */}
          {submissionFeedback && (
            <div className={`p-4 rounded-2xl border font-mono text-xs flex items-center gap-3 shadow-xs ${
              submissionFeedback.type === 'error' ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828] font-bold' :
              submissionFeedback.type === 'success' ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32] font-bold' :
              'bg-[#E3F2FD] border-[#BBDEFB] text-[#1565C0] font-bold'
            }`}>
              {submissionFeedback.type === 'success' ? (
                <CheckCircle2 size={18} className="shrink-0 text-[#2E7D32]" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">{submissionFeedback.message}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY & TAXONOMY */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Tag size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Canonical Service Area & Titles
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service Area UUID */}
                  <div className="sm:col-span-2 space-y-2">
                    {agentEvidenceReport?.serviceAreaResolution?.requiresAdminReview && !form.serviceAreaId && (
                      <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs font-mono text-[#92400E] flex items-start gap-2.5">
                        <AlertCircle size={16} className="text-[#D97706] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase block">⚠️ SERVICE AREA UNRESOLVED — ADMIN ACTION REQUIRED</span>
                          <p className="text-[11px] text-[#78350F] mt-0.5">
                            {agentEvidenceReport.serviceAreaResolution.resolutionNote}
                          </p>
                        </div>
                      </div>
                    )}

                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Canonical Service Area / Destination (UUID) *
                    </label>
                    {isLoadingServiceAreas ? (
                      <div className="h-11 px-3.5 bg-white border border-[#E5E3DB] rounded-xl flex items-center font-mono text-xs text-[#8C8A7D]">
                        Loading service areas from public.service_areas...
                      </div>
                    ) : serviceAreas.length === 0 ? (
                      <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>No active service areas found in public.service_areas. Recommendation creation is blocked.</span>
                      </div>
                    ) : (
                      <select
                        value={form.serviceAreaId || ''}
                        onChange={(e) => setForm({ ...form, serviceAreaId: e.target.value, draftReservationId: undefined })}
                        className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Select Authoritative Service Area --</option>
                        {serviceAreas.map((sa) => (
                          <option key={sa.id} value={sa.id}>
                            {sa.name_en} {sa.name_sr ? `(${sa.name_sr})` : ''} [{sa.id}]
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Title EN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Title (Primary) *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.title || '').length}/255
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.title || ''}
                      onChange={(e) => updateFieldWithSync('title', e.target.value)}
                      placeholder="e.g., Kalemegdan Fortress Sunset Walk"
                      className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                    />
                  </div>

                  {/* Title SR */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Title (Cyrillic / Latin)
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.titleSr || '').length}/255
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={255}
                      value={form.titleSr || ''}
                      onChange={(e) => updateFieldWithSync('titleSr', e.target.value)}
                      placeholder="e.g., Залазак сунца на Калемегдану"
                      className="w-full h-11 px-3.5 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-sm font-serif font-bold text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Category Selection */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#8A1F1F]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Multi-Category Taxonomy
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C8A7D]">
                    Primary: {form.category} | Total: {form.categories?.length || 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Primary Category *
                    </label>
                    <select
                      value={form.category || Category.GASTRONOMY}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const existingCats = form.categories || [];
                        const updatedCats = Array.from(new Set([newCat, ...existingCats]));
                        setForm({ ...form, category: newCat, categories: updatedCats });
                      }}
                      className="w-full h-11 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono font-bold text-[#1E2E20] outline-none"
                    >
                      {form.category && !Object.values(Category).includes(form.category as Category) && (
                        <option value={form.category} disabled>
                          {form.category} (Unrecognized Category)
                        </option>
                      )}
                      {Object.values(Category).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Additional Categories (Chips)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-[#E5E3DB] rounded-xl min-h-[44px]">
                      {Object.values(Category).map((cat) => {
                        const isSelected = form.categories?.includes(cat);
                        const isPrimary = form.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              let nextCats = form.categories || [];
                              if (isSelected) {
                                if (isPrimary) return; // Cannot remove primary
                                nextCats = nextCats.filter(c => c !== cat);
                              } else {
                                if (nextCats.length >= 10) return;
                                nextCats = [...nextCats, cat];
                              }
                              setForm({ ...form, categories: nextCats });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              isPrimary ? 'bg-[#23251E] text-white cursor-not-allowed' :
                              isSelected ? 'bg-[#C5A059] text-white cursor-pointer' :
                              'bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] cursor-pointer border border-[#E5E3DB]'
                            }`}
                          >
                            {cat} {isPrimary && '(Primary)'} {isSelected && !isPrimary && '×'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expertise & Capability Taxonomy Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expertise IDs */}
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Expertise Identifiers (`expertise_ids`)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
                    {EXPERTISE_OPTIONS.map((exp) => {
                      const isChecked = Boolean(form.expertiseIds?.includes(exp.id));
                      return (
                        <label key={exp.id} className="flex items-center gap-2 cursor-pointer hover:text-[#1E2E20]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = form.expertiseIds || [];
                              const next = e.target.checked ? [...curr, exp.id] : curr.filter(id => id !== exp.id);
                              setForm({ ...form, expertiseIds: next });
                            }}
                            className="accent-[#23251E]"
                          />
                          <span className="text-[11px] text-[#1E2E20]">{exp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Capability IDs */}
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-2">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                    Capability Identifiers (`capability_ids`)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
                    {CAPABILITY_OPTIONS.map((cap) => {
                      const isChecked = Boolean(form.capabilityIds?.includes(cap.id));
                      return (
                        <label key={cap.id} className="flex items-center gap-2 cursor-pointer hover:text-[#1E2E20]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = form.capabilityIds || [];
                              const next = e.target.checked ? [...curr, cap.id] : curr.filter(id => id !== cap.id);
                              setForm({ ...form, capabilityIds: next });
                            }}
                            className="accent-[#23251E]"
                          />
                          <span className="text-[11px] text-[#1E2E20]">{cap.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Location Strings */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    English Location Name *
                  </label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={(e) => updateFieldWithSync('location', e.target.value)}
                    placeholder="e.g., Belgrade Fortress, Belgrade"
                    className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Serbian Location Name
                  </label>
                  <input
                    type="text"
                    value={form.locationSr || ''}
                    onChange={(e) => updateFieldWithSync('locationSr', e.target.value)}
                    placeholder="e.g., Београдска тврђава, Београд"
                    className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDITORIAL CONTENT & PRIMARY MEDIA */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Descriptions */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-2">
                  Editorial Descriptions & Curator Notes
                </h3>

                {/* Short Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Short Overview (~50 words) *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.shortDescription || '').length}/500
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={form.shortDescription || ''}
                      onChange={(e) => updateFieldWithSync('shortDescription', e.target.value)}
                      placeholder="Concise overview highlighting key traveler experience..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Short Overview
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.shortDescriptionSr || '').length}/500
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={form.shortDescriptionSr || ''}
                      onChange={(e) => updateFieldWithSync('shortDescriptionSr', e.target.value)}
                      placeholder="Кратак преглед за српске посетиоце..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Long Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        English Long Story & Advice *
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.longDescription || '').length}/5000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={form.longDescription || ''}
                      onChange={(e) => updateFieldWithSync('longDescription', e.target.value)}
                      placeholder="Detailed background story, insider advice, best times to visit..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D]">
                        Serbian Long Story & Advice
                      </label>
                      <span className="font-mono text-[10px] text-[#8C8A7D]">
                        {(form.longDescriptionSr || '').length}/5000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={form.longDescriptionSr || ''}
                      onChange={(e) => updateFieldWithSync('longDescriptionSr', e.target.value)}
                      placeholder="Детаљна историја и савети куратора..."
                      className="w-full p-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-sans text-[#1E2E20] outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Best Time to Visit & Insider Tip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Best Time To Visit (EN)
                    </label>
                    <input
                      type="text"
                      value={form.bestTimeToVisitEn || ''}
                      onChange={(e) => setForm({ ...form, bestTimeToVisitEn: e.target.value })}
                      placeholder="e.g., Late afternoon for sunset"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Insider Tip (EN)
                    </label>
                    <input
                      type="text"
                      value={form.insiderTipEn || ''}
                      onChange={(e) => setForm({ ...form, insiderTipEn: e.target.value })}
                      placeholder="e.g., Reserve a terrace table in advance"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Image & Governed Media Pipeline Workspace (WP-14C5D) */}
              <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-5">
                {/* Authoritative Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="recommendation-media-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSelectFile(file);
                    }
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-[#C5A059]" />
                    <div>
                      <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                        Primary Recommendation Media & Provenance
                      </h3>
                      <p className="font-mono text-[10px] text-[#8C8A7D]">
                        Governed Media Foundation (`recommendation-media` storage)
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="flex items-center gap-2">
                    {mediaState === 'empty' && !form.image && (
                      <span className="px-2.5 py-1 rounded-md bg-[#F0EFEA] text-[#8C8A7D] font-mono text-[9px] font-bold uppercase border border-[#E5E3DB]">
                        No Media Attached
                      </span>
                    )}
                    {mediaState === 'selected' && (
                      <span className="px-2.5 py-1 rounded-md bg-[#FFF8E1] text-[#F57F17] font-mono text-[9px] font-bold uppercase border border-[#FFE082]">
                        Ready to Process & Upload
                      </span>
                    )}
                    {['authorizing', 'uploading', 'confirming', 'updating_metadata', 'verifying', 'attaching'].includes(mediaState) && (
                      <span className="px-2.5 py-1 rounded-md bg-[#E3F2FD] text-[#1976D2] font-mono text-[9px] font-bold uppercase border border-[#90CAF9] flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin text-[#1976D2]" />
                        <span>Processing Pipeline ({mediaState})</span>
                      </span>
                    )}
                    {(form.image || mediaState === 'attached' || mediaState === 'verified') && (
                      <span className="px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32] font-mono text-[9px] font-bold uppercase border border-[#A5D6A7] flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-[#2E7D32]" />
                        <span>Media Verified & Attached</span>
                      </span>
                    )}
                    {mediaState === 'error' && (
                      <span className="px-2.5 py-1 rounded-md bg-[#FFEBEE] text-[#C62828] font-mono text-[9px] font-bold uppercase border border-[#EF9A9A] flex items-center gap-1">
                        <AlertTriangle size={10} className="text-[#C62828]" />
                        <span>Pipeline Failure</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Error Message */}
                {mediaError && (
                  <div className="p-3 bg-[#FFEBEE] border border-[#EF9A9A] rounded-xl text-xs font-mono text-[#C62828] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{mediaError}</span>
                  </div>
                )}

                {/* State 1: File Upload Dropzone (When Empty or Error) */}
                {(mediaState === 'empty' || mediaState === 'error') && !form.image && (
                  <div className="border-2 border-dashed border-[#D4D1C7] hover:border-[#C5A059] rounded-2xl p-6 text-center bg-white transition-all">
                    <div className="w-12 h-12 rounded-full bg-[#FAF9F5] border border-[#E5E3DB] flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                      <Upload size={20} />
                    </div>
                    <p className="font-mono text-xs font-bold text-[#1E2E20] uppercase tracking-wide">
                      Select Primary Image
                    </p>
                    <p className="font-mono text-[10px] text-[#8C8A7D] mt-1 mb-4">
                      JPEG, PNG, or WebP up to 5 MB. Strictly governed storage contract.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-4 py-2 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      <FileImage size={14} className="text-[#C5A059]" />
                      <span>Browse Image File</span>
                    </button>
                  </div>
                )}

                {/* State 2: Selected File Inspection & Execution Button */}
                {mediaState === 'selected' && selectedFile && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {fileLocalPreview && (
                          <img src={fileLocalPreview || undefined} alt="Selected preview" className="w-14 h-14 object-cover rounded-lg border border-[#E5E3DB]" />
                        )}
                        <div>
                          <p className="font-mono text-xs font-bold text-[#1E2E20]">{selectedFile.name}</p>
                          <p className="font-mono text-[10px] text-[#8C8A7D]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setFileLocalPreview(null);
                            setMediaState(form.image ? 'attached' : 'empty');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="px-3 py-1.5 border border-[#E5E3DB] hover:bg-[#FAF9F5] text-[#8C8A7D] hover:text-[#1E2E20] rounded-lg font-mono text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleStartMediaPipeline}
                          className="px-4 py-2 bg-[#23251E] hover:bg-[#32352B] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                          <Upload size={14} className="text-[#C5A059]" />
                          <span>Process & Upload Primary Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 3: Pipeline Processing Dashboard */}
                {['authorizing', 'uploading', 'confirming', 'updating_metadata', 'verifying', 'attaching'].includes(mediaState) && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-2 font-mono text-xs">
                    <p className="text-[10px] uppercase font-bold text-[#8C8A7D] mb-2">Executing Governed Media Upload Pipeline</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.localValidation === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        <CheckCircle2 size={12} />
                        <span>1. Validation</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.authorize === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.authorize === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.authorize === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>2. Authorize</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.upload === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.upload === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.upload === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>3. Storage Upload</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${mediaStepStatus.confirm === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : mediaStepStatus.confirm === 'pending' ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]' : 'bg-[#FAF9F5] border-[#E5E3DB] text-[#8C8A7D]'}`}>
                        {mediaStepStatus.confirm === 'pending' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        <span>4. Confirm Object</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 4: Attached & Verified Primary Image Display */}
                {(form.image || mediaState === 'attached') && (
                  <div className="p-4 bg-white border border-[#E5E3DB] rounded-xl space-y-3">
                    <div className="relative h-48 rounded-xl overflow-hidden border border-[#E5E3DB] bg-black/5 group">
                      {displayUrlResolutionError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFEBEE] p-4 text-center">
                          <AlertTriangle size={24} className="text-[#C62828] mb-1.5" />
                          <span className="text-xs font-mono font-bold text-[#C62828] uppercase">Media Display Resolution Failed — Re-upload Required</span>
                          <span className="text-[10px] font-mono text-[#8C8A7D] mt-1 max-w-sm">{displayUrlResolutionError}</span>
                          <div className="flex items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (form.image) {
                                  setDisplayUrlResolutionError(null);
                                  setIsResolvingDisplayUrl(true);
                                  resolveMediaDisplayUrl(form.image)
                                    .then(u => {
                                      setResolvedDisplayUrl(u);
                                      setIsResolvingDisplayUrl(false);
                                    })
                                    .catch(e => {
                                      setIsResolvingDisplayUrl(false);
                                      setDisplayUrlResolutionError(e?.message || 'Resolution failed');
                                    });
                                }
                              }}
                              className="px-3 py-1 bg-white border border-[#EF9A9A] hover:bg-[#FFEBEE] text-[#C62828] font-mono text-[10px] font-bold rounded-lg uppercase cursor-pointer transition-colors shadow-xs"
                            >
                              Retry Loading
                            </button>
                            <button
                              type="button"
                              onClick={handleTriggerReplaceImage}
                              className="px-3 py-1 bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-[10px] font-bold rounded-lg uppercase cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                            >
                              <Upload size={10} className="text-[#C5A059]" />
                              <span>Upload Replacement Image</span>
                            </button>
                          </div>
                        </div>
                      ) : isResolvingDisplayUrl && !resolvedDisplayUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F5]">
                          <Loader2 size={24} className="animate-spin text-[#C5A059] mb-2" />
                          <span className="text-[10px] font-mono text-[#8C8A7D] uppercase font-bold">Loading Governed Media Asset...</span>
                        </div>
                      ) : (
                        <img
                          src={resolvedDisplayUrl || fileLocalPreview || getOptimizedImageUrl(form.image || '') || undefined}
                          alt={form.provenance?.altText || 'Primary Recommendation Image'}
                          className="w-full h-full object-cover"
                          onError={() => {
                            if (form.image && (form.image.startsWith('recommendation-media/') || form.image.startsWith('/recommendation-media/'))) {
                              setDisplayUrlResolutionError('Governed media asset could not be rendered in browser.');
                            }
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white font-mono text-[9px]">
                            Canonical Media Object Path
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#2E7D32]/80 backdrop-blur-xs text-white font-mono text-[9px] font-bold flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <button
                            type="button"
                            onClick={handleTriggerReplaceImage}
                            className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#23251E] font-mono text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RefreshCw size={11} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#C62828] font-mono text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Trash2 size={11} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E5E3DB] font-mono text-[10px] text-[#1E2E20] break-all flex items-center justify-between">
                      <span className="text-[#8C8A7D]">Permanent Storage Reference:</span>
                      <span className="font-bold text-[#1E2E20]">{form.image}</span>
                    </div>
                  </div>
                )}


                {/* Provenance Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Provenance Source
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.source || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, source: e.target.value }
                      })}
                      placeholder="e.g. Unsplash Verified"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Acquisition Method
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.method || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, method: e.target.value }
                      })}
                      placeholder="e.g. original"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-[#8C8A7D] mb-1">
                      License
                    </label>
                    <input
                      type="text"
                      value={form.provenance?.license || ''}
                      onChange={(e) => setForm({
                        ...form,
                        provenance: { ...form.provenance, license: e.target.value }
                      })}
                      placeholder="e.g. CC-BY-4.0"
                      className="w-full h-9 px-2.5 bg-white border border-[#E5E3DB] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRACTICAL INFORMATION & GEOLOCATION */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Practical Info JSON */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Clock size={16} className="text-[#8A1F1F]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Practical Visitor Information (`practical_info`)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Opening Hours (`opening_hours`)
                    </label>
                    <input
                      type="text"
                      value={form.practicalInfo?.opening_hours || ''}
                      onChange={(e) => setForm({
                        ...form,
                        practicalInfo: { ...form.practicalInfo, opening_hours: e.target.value }
                      })}
                      placeholder="e.g. 09:00 - 22:00 Daily"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Contact Phone (`contact_phone`)
                    </label>
                    <input
                      type="tel"
                      value={form.practicalInfo?.contact_phone || ''}
                      onChange={(e) => setForm({
                        ...form,
                        phone: e.target.value,
                        practicalInfo: { ...form.practicalInfo, contact_phone: e.target.value }
                      })}
                      placeholder="e.g. +381 11 328 1234"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Contact Email (`contact_email`)
                    </label>
                    <input
                      type="email"
                      value={form.practicalInfo?.contact_email || ''}
                      onChange={(e) => setForm({
                        ...form,
                        practicalInfo: { ...form.practicalInfo, contact_email: e.target.value }
                      })}
                      placeholder="e.g. concierge@experience.rs"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Official Website (`website`)
                    </label>
                    <input
                      type="url"
                      value={form.practicalInfo?.website || ''}
                      onChange={(e) => setForm({
                        ...form,
                        website: e.target.value,
                        practicalInfo: { ...form.practicalInfo, website: e.target.value }
                      })}
                      placeholder="https://experience.rs"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Admission Fee (`admission_fee`)
                    </label>
                    <input
                      type="text"
                      value={form.practicalInfo?.admission_fee || ''}
                      onChange={(e) => setForm({
                        ...form,
                        estimatedCost: e.target.value,
                        practicalInfo: { ...form.practicalInfo, admission_fee: e.target.value }
                      })}
                      placeholder="e.g. Free entry / Ala carte"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Preferred Transport
                    </label>
                    <input
                      type="text"
                      value={form.preferredTransport || ''}
                      onChange={(e) => setForm({ ...form, preferredTransport: e.target.value })}
                      placeholder="e.g. Taxi / Walking"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={form.duration || ''}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g., 2-3 hours"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Travel Time String
                    </label>
                    <input
                      type="text"
                      value={form.travelTime || ''}
                      onChange={(e) => setForm({ ...form, travelTime: e.target.value })}
                      placeholder="e.g., 15 mins"
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Travel Time (`travel_time_minutes`)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={typeof form.travelTimeMinutes === 'number' ? form.travelTimeMinutes : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setForm({
                          ...form,
                          travelTimeMinutes: val === '' ? undefined : (isNaN(parseInt(val, 10)) ? 0 : Math.max(0, parseInt(val, 10)))
                        });
                      }}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <MapPin size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Geographic Map Coordinates
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Latitude (-90.0 to 90.0) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      placeholder="e.g. 44.8176 (blank if unresolved)"
                      value={typeof form.coordinates?.lat === 'number' ? form.coordinates.lat : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '') {
                          const currentLng = typeof form.coordinates?.lng === 'number' ? form.coordinates.lng : undefined;
                          if (currentLng === undefined) {
                            setForm({ ...form, coordinates: undefined });
                          } else {
                            setForm({ ...form, coordinates: { lat: undefined as any, lng: currentLng } });
                          }
                        } else {
                          const parsed = parseFloat(val);
                          const currentLng = typeof form.coordinates?.lng === 'number' ? form.coordinates.lng : undefined;
                          setForm({
                            ...form,
                            coordinates: {
                              lat: isNaN(parsed) ? (undefined as any) : parsed,
                              lng: currentLng as any,
                            },
                          });
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Longitude (-180.0 to 180.0) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      placeholder="e.g. 20.4569 (blank if unresolved)"
                      value={typeof form.coordinates?.lng === 'number' ? form.coordinates.lng : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '') {
                          const currentLat = typeof form.coordinates?.lat === 'number' ? form.coordinates.lat : undefined;
                          if (currentLat === undefined) {
                            setForm({ ...form, coordinates: undefined });
                          } else {
                            setForm({ ...form, coordinates: { lat: currentLat, lng: undefined as any } });
                          }
                        } else {
                          const parsed = parseFloat(val);
                          const currentLat = typeof form.coordinates?.lat === 'number' ? form.coordinates.lat : undefined;
                          setForm({
                            ...form,
                            coordinates: {
                              lat: currentLat as any,
                              lng: isNaN(parsed) ? (undefined as any) : parsed,
                            },
                          });
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-[#E5E3DB] focus:border-[#23251E] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MOOD ORBIT & RANKING INPUTS */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Mood Orbit 2D Vector */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-[#C5A059]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Mood Orbit 2D Spatial Vector Calibration
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#1E2E20]">
                    X: {(form.coordinateX ?? 0).toFixed(1)}, Y: {(form.coordinateY ?? 0).toFixed(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      X Axis (-5.0 Serene/Tranquil ↔ +5.0 High Energy/Vibrant)
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={form.coordinateX ?? 0}
                      onChange={(e) => setForm({ ...form, coordinateX: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>-5.0 Serene Calm</span>
                      <span>0.0 Center</span>
                      <span>+5.0 High Vibrant</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Y Axis (-5.0 Remote Nature/Heritage ↔ +5.0 Metropolitan/Urban)
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={form.coordinateY ?? 0}
                      onChange={(e) => setForm({ ...form, coordinateY: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8C8A7D] mt-1">
                      <span>-5.0 Remote Nature</span>
                      <span>0.0 Center</span>
                      <span>+5.0 Dense Urban</span>
                    </div>
                  </div>
                </div>

                {/* Mood Tag Chips */}
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                    Mood Tags (`moods`)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_OPTIONS.map((m) => {
                      const isSelected = form.moods?.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const curr = form.moods || [];
                            const next = isSelected ? curr.filter(x => x !== m) : [...curr, m];
                            setForm({ ...form, moods: next });
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#23251E] text-white'
                              : 'bg-white text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-Sliders: Energy, Social, Luxury, Urbanity, Nature */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20] border-b border-[#E5E3DB] pb-2">
                  Dimensional Experience Attributes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Energy Level: {(form.energy ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.energy ?? 0.5}
                      onChange={(e) => setForm({ ...form, energy: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Social Level: {(form.social ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.social ?? 0.5}
                      onChange={(e) => setForm({ ...form, social: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Luxury Tier: {(form.luxury ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.luxury ?? 0.5}
                      onChange={(e) => setForm({ ...form, luxury: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Urbanity Level: {(form.urbanity ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.urbanity ?? 0.5}
                      onChange={(e) => setForm({ ...form, urbanity: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Nature Density: {(form.nature ?? 0.5).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.nature ?? 0.5}
                      onChange={(e) => setForm({ ...form, nature: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C8A7D]">
                      Weather Dependency: {(form.weatherDependency ?? 0.2).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.weatherDependency ?? 0.2}
                      onChange={(e) => setForm({ ...form, weatherDependency: parseFloat(e.target.value) })}
                      className="w-full accent-[#23251E] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggles & Options */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-[#E5E3DB]">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Seasonality
                    </label>
                    <select
                      value={form.seasonality || 'all'}
                      onChange={(e) => setForm({ ...form, seasonality: e.target.value as any })}
                      className="w-full h-10 px-2.5 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono font-bold"
                    >
                      <option value="all">Year-Round (All)</option>
                      <option value="summer">Summer Season</option>
                      <option value="winter">Winter Season</option>
                      <option value="spring-fall">Spring / Fall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                      Premium Tier
                    </label>
                    <select
                      value={form.premiumLevel || 'standard'}
                      onChange={(e) => setForm({ ...form, premiumLevel: e.target.value as any })}
                      className="w-full h-10 px-2.5 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono font-bold"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="ultra">Ultra Luxury</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="fam-suit"
                      checked={Boolean(form.familySuitability)}
                      onChange={(e) => setForm({ ...form, familySuitability: e.target.checked })}
                      className="accent-[#23251E] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="fam-suit" className="font-mono text-xs font-bold text-[#1E2E20] cursor-pointer">
                      Family Suitable
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="acc-suit"
                      checked={Boolean(form.accessibility)}
                      onChange={(e) => setForm({ ...form, accessibility: e.target.checked })}
                      className="accent-[#23251E] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="acc-suit" className="font-mono text-xs font-bold text-[#1E2E20] cursor-pointer">
                      Wheelchair Accessible
                    </label>
                  </div>
                </div>

                {/* Server-derived ranking score notice */}
                <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs font-mono text-[#2E7D32] flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>
                    Ranking score (`ranking_score`) is server-derived by the IDEMO Ranking Engine and cannot be manually modified.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SIX-LANGUAGE LOCALIZATION */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[#8A1F1F]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Six-Language Canonical Visitor Localization
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#2E7D32]">
                    Overall Completeness: {localizationProgress}%
                  </span>
                </div>

                {/* Sub-tabs for 6 languages */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E3DB]">
                  {CANONICAL_LANGUAGES.map((lang) => {
                    const trans = form.translations?.[lang.code];
                    const isPending = trans?.shortDescription === 'PENDING LOCALIZATION';
                    const isComplete = Boolean(trans?.title && trans?.shortDescription && !isPending);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setActiveLangTab(lang.code as any)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeLangTab === lang.code
                            ? 'bg-[#23251E] text-white shadow-xs'
                            : 'bg-white text-[#8C8A7D] hover:text-[#1E2E20] border border-[#E5E3DB]'
                        }`}
                      >
                        <span>{lang.name}</span>
                        {isPending ? (
                          <span className="px-1 py-0.5 text-[9px] bg-[#FEF3C7] text-[#92400E] rounded font-mono font-bold">PENDING</span>
                        ) : isComplete ? (
                          <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Deferred Localizations Action Panel */}
                {['de', 'ru', 'es', 'zh'].some(l => form.translations?.[l]?.shortDescription === 'PENDING LOCALIZATION') && (
                  <div className="p-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#D97706]" />
                      <span className="font-mono text-xs text-[#92400E] font-medium">
                        Additional localizations (DE, RU, ES, ZH) are pending.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await localizeRecommendation(form as Recommendation);
                          if (res.success && res.recommendation?.translations) {
                            setForm(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                ...res.recommendation.translations,
                              }
                            }));
                          } else if (res.error) {
                            setSubmissionFeedback({
                              type: 'error',
                              message: `Localization error: ${res.error}`
                            });
                          }
                        } catch (e: any) {
                          setSubmissionFeedback({
                            type: 'error',
                            message: `Localization failed: ${e?.message || String(e)}`
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Generate DE, RU, ES, ZH</span>
                    </button>
                  </div>
                )}

                {/* Localized Form Fields for selected language */}
                {(() => {
                  const currentTrans = form.translations?.[activeLangTab] || {};
                  return (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                            Title ({activeLangTab.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={currentTrans.title || ''}
                            onChange={(e) => updateTranslationField(activeLangTab, 'title', e.target.value)}
                            placeholder={`Title in ${activeLangTab.toUpperCase()}...`}
                            className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                            Location Area ({activeLangTab.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={currentTrans.location || ''}
                            onChange={(e) => updateTranslationField(activeLangTab, 'location', e.target.value)}
                            placeholder={`Location in ${activeLangTab.toUpperCase()}...`}
                            className="w-full h-10 px-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-mono text-[#1E2E20] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Short Description ({activeLangTab.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={currentTrans.shortDescription || ''}
                          onChange={(e) => updateTranslationField(activeLangTab, 'shortDescription', e.target.value)}
                          placeholder={`Short overview in ${activeLangTab.toUpperCase()}...`}
                          className="w-full p-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase font-bold text-[#8C8A7D] mb-1">
                          Long Description ({activeLangTab.toUpperCase()})
                        </label>
                        <textarea
                          rows={3}
                          value={currentTrans.longDescription || ''}
                          onChange={(e) => updateTranslationField(activeLangTab, 'longDescription', e.target.value)}
                          placeholder={`Long story in ${activeLangTab.toUpperCase()}...`}
                          className="w-full p-3 bg-white border border-[#E5E3DB] rounded-xl text-xs font-sans text-[#1E2E20] outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & CANONICAL VALIDATION */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Visitor Style Preview */}
              <div className="p-5 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E3DB] pb-2">
                  <Eye size={16} className="text-[#C5A059]" />
                  <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                    Real Visitor Card Preview & Experience Inspection
                  </h3>
                </div>

                <div className="bg-white border border-[#E5E3DB] rounded-2xl overflow-hidden shadow-xs p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Image */}
                  <div className="relative h-48 md:h-full min-h-[160px] rounded-xl overflow-hidden bg-black/5">
                    {displayUrlResolutionError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFEBEE] p-3 text-center">
                        <AlertTriangle size={18} className="text-[#C62828] mb-1" />
                        <span className="text-[10px] font-mono text-[#C62828] font-bold uppercase">Image Error</span>
                      </div>
                    ) : isResolvingDisplayUrl && !resolvedDisplayUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-[#FAF9F5]">
                        <Loader2 size={16} className="animate-spin text-[#C5A059]" />
                      </div>
                    ) : (resolvedDisplayUrl || fileLocalPreview || form.image) ? (
                      <img
                        src={resolvedDisplayUrl || fileLocalPreview || getOptimizedImageUrl(form.image) || undefined}
                        alt={form.title || 'Preview'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F5] p-3 text-center border border-dashed border-[#E5E3DB]">
                        <span className="font-mono text-[10px] text-[#8C8A7D] font-bold uppercase">NO MEDIA ATTACHED</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#23251E] text-white font-mono text-[9px] font-bold rounded-md uppercase">
                      {form.category || 'Gastronomy'}
                    </div>
                  </div>


                  {/* Details */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-[#8C8A7D] uppercase font-bold block">
                          {form.location || 'Belgrade, Serbia'}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#1E2E20] leading-tight">
                          {form.title || 'Untitled Recommendation'}
                        </h4>
                      </div>
                      <span className="px-2 py-1 bg-[#FAF9F5] border border-[#E5E3DB] rounded-lg font-mono text-[10px] font-bold">
                        {form.estimatedCost || '€€'}
                      </span>
                    </div>

                    <p className="text-xs text-[#1E2E20] font-sans leading-relaxed line-clamp-3">
                      {form.shortDescription || 'No short overview provided.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E3DB] text-[10.5px] font-mono text-[#8C8A7D]">
                      <div>⏱ {form.duration || '2-3 hours'}</div>
                      <div>🚗 {form.travelTime || 'Unresolved'}</div>
                      <div>📍 Lat: {form.coordinates?.lat?.toFixed(2)}, Lng: {form.coordinates?.lng?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Lifecycle Review & Promotion Selector */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#C5A059]" />
                    <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                      Admin Lifecycle Review & Promotion Gate
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    selectedStatus === 'APPROVED' ? 'bg-[#1E2E20] text-[#C5A059] border-[#C5A059]' :
                    'bg-[#854D0E] text-white border-[#A16207]'
                  }`}>
                    {selectedStatus === 'APPROVED' ? 'CANONICAL / APPROVED (BLACK)' : 'HUMAN REVIEW IN PROGRESS (AMBER)'}
                  </span>
                </div>

                <p className="text-xs text-[#57534E] font-sans">
                  All AI proposals initialize in the governed <strong>AMBER</strong> review state. Selecting <strong>APPROVED</strong> transitions this recommendation to <strong>BLACK</strong> and certifies full canonical eligibility in the IDEMO engine.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { status: 'CANDIDATE', label: 'Candidate (Amber)', desc: 'Research candidate under review' },
                    { status: 'NEEDS RESEARCH', label: 'Needs Research (Amber)', desc: 'Requires field or fact verification' },
                    { status: 'APPROVED', label: 'Approved (Black / Canonical)', desc: 'Human-approved canonical status' },
                  ].map((item) => {
                    const isSelected = selectedStatus === item.status;
                    return (
                      <button
                        key={item.status}
                        type="button"
                        onClick={() => setSelectedStatus(item.status as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? item.status === 'APPROVED'
                              ? 'bg-[#1E2E20] text-white border-[#1E2E20] shadow-sm'
                              : 'bg-[#854D0E] text-white border-[#A16207] shadow-sm'
                            : 'bg-white text-[#57534E] border-[#E5E3DB] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <div className="font-mono text-xs font-bold uppercase mb-0.5">{item.label}</div>
                        <div className={`text-[10px] font-sans ${isSelected ? 'text-white/80' : 'text-[#8C8A7D]'}`}>{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Proposal Evidence & Uncertainty Report */}
              {agentEvidenceReport && (
                <div className="p-4 bg-white border border-[#E5E3DB] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#C5A059]" />
                      <h3 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
                        AI Proposal Evidence & Source-of-Truth Report
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-[#8C8A7D]">
                      {agentEvidenceReport.verifiedFields.length} Verified | {agentEvidenceReport.supportedFields.length} Supported | {agentEvidenceReport.unresolvedFields.length} Unresolved
                    </span>
                  </div>

                  {/* Provenance & Execution Mode Banner */}
                  {agentProposalMetadata && (
                    <div className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                      agentProposalMetadata.executionMode === 'GEMINI_GROUNDED'
                        ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]'
                        : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="shrink-0" />
                        <span>
                          <strong>Mode:</strong> {agentProposalMetadata.executionMode === 'GEMINI_GROUNDED' ? 'Live Gemini + Google Search Grounded' : 'Conservative Deterministic Fallback'}
                          {agentProposalMetadata.model && <span className="opacity-75"> ({agentProposalMetadata.model})</span>}
                        </span>
                      </div>
                      {agentProposalMetadata.quotaExceeded && (
                        <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-bold text-[9.5px]">
                          QUOTA EXCEEDED (429) — FALLBACK PRESERVED
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#2E7D32] block">
                        ✓ Verified Fields ({agentEvidenceReport.verifiedFields.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {agentEvidenceReport.verifiedFields.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32] font-mono text-[9.5px] font-bold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#1565C0] block">
                        ℹ Supported Fields ({agentEvidenceReport.supportedFields.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {agentEvidenceReport.supportedFields.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-[#E3F2FD] text-[#1565C0] font-mono text-[9.5px] font-bold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {agentEvidenceReport.unresolvedFields.length > 0 && (
                    <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs font-mono text-[#92400E]">
                      <span className="font-bold uppercase block mb-1">Unresolved Fields Awaiting Review:</span>
                      <div className="flex flex-wrap gap-1">
                        {agentEvidenceReport.unresolvedFields.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-mono text-[9.5px] font-bold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Precedence Badge */}
                  <div className="pt-2 border-t border-[#E5E3DB] flex items-center justify-between text-[11px] font-mono text-[#57534E]">
                    <span>Media Handling: <strong>{agentEvidenceReport.mediaHandling.type}</strong></span>
                    <span className="text-[#2E7D32] font-bold">
                      {agentEvidenceReport.mediaHandling.precedenceEnforced ? '✓ Human Media Precedence Enforced' : '✓ Curated Asset Assigned'}
                    </span>
                  </div>
                </div>
              )}

              {/* Partner Intelligence & Concierge Suitability */}
              <PartnerIntelligenceReview 
                partnerIntelligence={currentPartnerIntelligence} 
                onRefreshEvaluation={() => {
                  const refreshed = evaluatePartnerSuitability(form);
                  setPartnerIntelligence(refreshed);
                }}
                stagedPartners={stagedPartners}
                onUpdateStagedPartners={setStagedPartners}
                recommendationId={form.id || form.dbId}
                isExistingCanonical={Boolean(form.dbId && isUuid(form.dbId))}
              />

              {/* 4-Tier Readiness Gate Audit */}
              <div className="p-5 bg-white border border-[#E5E3DB] rounded-2xl space-y-4">
                {needsResearch && (
                  <div className="p-4 bg-[#FFF8E1] border border-[#FFE082] rounded-2xl flex items-start gap-3 text-xs font-mono text-[#8D6E63] mb-3">
                    <AlertTriangle size={18} className="text-[#F57F17] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-[#F57F17] block uppercase">Grounded Research Required</span>
                      <p className="text-[#5D4037]">
                        This recommendation draft contains fallback or unresearched structural content. Grounded web research is required before canonical submission.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-3">
                  <div>
                    <span className="font-mono text-[9.5px] uppercase font-bold text-[#8C8A7D] block">
                      Canonical 4-Tier Governance Readiness Gate
                    </span>
                    <span className="font-serif font-bold text-sm text-[#1E2E20]">
                      Review & Approval Gate Status
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase border ${
                    validationErrors.length === 0
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                      : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                  }`}>
                    {validationErrors.length === 0 ? 'READY FOR ADMIN APPROVAL' : 'BLOCKING GATES OPEN'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  {/* Gate A: Schema */}
                  <div className={`p-3 rounded-xl border ${
                    governanceEvaluation.gateA.pass
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] uppercase">Gate A: Schema</span>
                      <span>{governanceEvaluation.gateA.pass ? '✓ PASS' : '✗ FAIL'}</span>
                    </div>
                    <p className="text-[10px] opacity-80">Types, lengths, character whitelist limits.</p>
                  </div>

                  {/* Gate B: Required Fields */}
                  <div className={`p-3 rounded-xl border ${
                    governanceEvaluation.gateB.pass
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] uppercase">Gate B: Required</span>
                      <span>{governanceEvaluation.gateB.pass ? '✓ PASS' : '✗ FAIL'}</span>
                    </div>
                    <p className="text-[10px] opacity-80">Title, service area, descriptions.</p>
                  </div>

                  {/* Gate C: Semantic & Evidence */}
                  <div className={`p-3 rounded-xl border ${
                    governanceEvaluation.gateC.pass
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] uppercase">Gate C: Evidence</span>
                      <span>{governanceEvaluation.gateC.pass ? '✓ PASS' : '✗ FAIL'}</span>
                    </div>
                    <p className="text-[10px] opacity-80">Zero fabrication, genuine data & media.</p>
                  </div>
                </div>

                {validationErrors.length > 0 ? (
                  <div className="p-3.5 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs font-mono text-[#C62828] space-y-1">
                    <span className="font-bold block uppercase">Blocking Governance Issues:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs font-mono text-[#2E7D32] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>All automated gates passed. Ready for human Admin review and canonical submission.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation & Submissions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E3DB]">
            {showDiscardConfirm ? (
              <div className="flex flex-col sm:flex-row items-center justify-between w-full p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-900 gap-3">
                <div className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-600 shrink-0" />
                  <span>
                    {isCanonicalOrPublished || form.publicationStatus === 'CANONICAL' || form.publicationStatus === 'PUBLISHED' || selectedStatus === 'APPROVED' || initialRecommendation?.publicationStatus === 'CANONICAL' || initialRecommendation?.publicationStatus === 'PUBLISHED'
                      ? 'Remove this published recommendation from active IDEMO use? It will be unpublished and excluded from future active packages, while its historical record, identifiers, partner history, media provenance, and prior package references will be preserved.'
                      : 'Remove this recommendation from active IDEMO use? It will be retired and removed from active Recommendations Desk.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-gray-50 text-gray-700 font-mono text-xs font-bold uppercase tracking-wide cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={executeDiscardDraft}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wide cursor-pointer transition-all shadow-2xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] text-xs font-mono uppercase font-bold text-[#8C8A7D] hover:text-[#1E2E20] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowDiscardConfirm(true)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-mono text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 size={13} className="text-red-600" />
                  <span>Delete Recommendation</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E3DB] bg-white text-[#1E2E20] font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Previous Step
                </button>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep + 1) as any)}
                  className="px-5 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting || isRerunningResearch}
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-xl border border-[#23251E] bg-[#FAF9F5] hover:bg-white disabled:opacity-50 text-[#1E2E20] font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving Draft...' : 'Save as Draft'}
                  </button>

                  {needsResearch ? (
                    <button
                      type="button"
                      disabled={isSubmitting || isRerunningResearch}
                      onClick={handleRerunGroundedResearch}
                      className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Sparkles size={14} className={isRerunningResearch ? 'animate-spin text-white' : 'text-white'} />
                      <span>{isRerunningResearch ? 'Researching Gemini...' : 'RE-RUN GROUNDED RESEARCH'}</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || validationErrors.length > 0}
                      className="px-6 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Send size={14} className="text-[#C5A059]" />
                      <span>{isSubmitting ? 'Submitting RPC...' : 'Submit Canonical Recommendation'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>

    {/* AI Recommendation Proposal Agent Modal */}
    <AIRecommendationAgentModal
      isOpen={isAIAgentModalOpen}
      onClose={() => setIsAIAgentModalOpen(false)}
      serviceAreas={serviceAreas}
      onApplyProposal={handleApplyAgentProposal}
    />
  </>
  );
}
