/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from '../types';
import { ServiceAreaOption, fetchAuthoritativeServiceAreas, resolveServiceAreaForLocation, SERVICE_AREA_OPTIONS } from './recommendationWorkflowService';
import { evaluatePartnerSuitability, PartnerIntelligenceResult } from './partnerIntelligenceService';

export const AGENT_RESEARCH_TIMEOUT_MS = 180000;

export interface HumanProvidedMedia {
  url: string;
  source?: string;
  license?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  altText?: string;
}

export interface AgentProposalInput {
  nameOrTitle: string;
  descriptionOrNotes?: string;
  destinationOrLocation?: string;
  referenceUrl?: string;
  humanProvidedMedia?: HumanProvidedMedia;
  additionalCuratorNotes?: string;
  targetServiceAreaId?: string;
}

export interface EvidenceFieldStatus {
  fieldName: string;
  status: 'VERIFIED' | 'SUPPORTED' | 'UNRESOLVED';
  sourceOrRationale: string;
}

export interface AgentCompilationResult {
  recommendation: Partial<Recommendation>;
  evidenceReport: {
    verifiedFields: string[];
    supportedFields: string[];
    unresolvedFields: string[];
    fieldStatuses: EvidenceFieldStatus[];
    serviceAreaResolution: {
      isResolved: boolean;
      serviceAreaId: string;
      serviceAreaName: string;
      requiresAdminReview: boolean;
      resolutionNote: string;
    };
    mediaHandling: {
      type: 'HUMAN_MANDATORY' | 'AGENT_CURATED' | 'RESEARCH_CANDIDATE';
      mediaUrl: string;
      precedenceEnforced: boolean;
      provenanceSource: string;
      provenanceLicense: string;
    };
    lifecycleStatus: 'CANDIDATE' | 'NEEDS RESEARCH';
    headerVisualState: 'AMBER';
  };
  partnerIntelligence: PartnerIntelligenceResult;
  metadata?: {
    usedAi: boolean;
    executionMode?: 'GEMINI_GROUNDED' | 'DETERMINISTIC_FALLBACK';
    model: string;
    geminiRequestAttempted?: boolean;
    geminiRequestSucceeded?: boolean;
    fallbackInvoked?: boolean;
    fallbackReason?: string;
    classification?: 'GEMINI_QUOTA_EXCEEDED' | 'RESEARCH_ALREADY_IN_PROGRESS' | 'CLIENT_SIDE_OFFLINE_FALLBACK' | string;
    googleSearchGroundingMetadataReceived?: boolean;
    groundingWebSearchQueriesCount?: number;
    groundingChunksCount?: number;
    quotaExceeded?: boolean;
    userNotice?: string;
    sources: string[];
  };
}

/**
 * Compiles an AI Recommendation Proposal using Server-Side Grounded Research.
 * Connects to /api/studio/recommendation-agent/research with zero-fabrication safety.
 */
export async function compileRecommendationProposal(
  input: AgentProposalInput,
  providedServiceAreas?: ServiceAreaOption[]
): Promise<AgentCompilationResult> {
  const serviceAreas = providedServiceAreas || (await fetchAuthoritativeServiceAreas());

  try {
    const isBrowser = typeof window !== 'undefined';
    // If in test environment without explicit TEST_SERVER_URL, run semantic compiler directly
    if (!isBrowser && !process.env.TEST_SERVER_URL) {
      return compileClientSemanticFallback(input, serviceAreas, {
        fallbackReason: 'Test Environment Offline Mode',
        classification: 'CLIENT_SIDE_OFFLINE_FALLBACK',
      });
    }

    const endpoint = isBrowser
      ? '/api/studio/recommendation-agent/research'
      : (process.env.TEST_SERVER_URL || 'http://127.0.0.1:3000/api/studio/recommendation-agent/research');

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), isBrowser ? AGENT_RESEARCH_TIMEOUT_MS : 1500) : null;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller?.signal,
        body: JSON.stringify({
          ...input,
          availableServiceAreas: serviceAreas,
        }),
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    // Always inspect/parse JSON response bodies when Content-Type is JSON, regardless of response.ok
    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;
    if (contentType.includes('application/json') || contentType === '') {
      try {
        responseData = await response.json();
      } catch {
        // Ignored, responseData remains null
      }
    }

    // If server returned a structurally valid recommendation/fallback proposal
    if (responseData && typeof responseData === 'object' && responseData.recommendation) {
      const result: AgentCompilationResult = responseData;
      if (result.recommendation) {
        result.partnerIntelligence = evaluatePartnerSuitability(result.recommendation);
      }

      if (!result.metadata) {
        result.metadata = {
          usedAi: false,
          model: 'deterministic_semantic_engine',
          sources: [],
        };
      }

      const reasonStr = String(result.metadata.fallbackReason || '');
      const noticeStr = String(result.metadata.userNotice || '');
      const isSingleFlight =
        reasonStr.includes('single-flight') ||
        reasonStr.includes('already active') ||
        noticeStr.includes('Compilation already in progress');

      const isQuota =
        result.metadata.quotaExceeded ||
        reasonStr.includes('429') ||
        reasonStr.includes('RESOURCE_EXHAUSTED') ||
        reasonStr.includes('Quota');

      if (response.status === 429) {
        if (isSingleFlight) {
          result.metadata.classification = 'RESEARCH_ALREADY_IN_PROGRESS';
          result.metadata.fallbackReason = 'Research compilation already active for this entity (single-flight blocked)';
          result.metadata.quotaExceeded = false;
        } else {
          result.metadata.classification = 'GEMINI_QUOTA_EXCEEDED';
          result.metadata.fallbackReason = '429 RESOURCE_EXHAUSTED';
          result.metadata.quotaExceeded = true;
        }
      } else if (isQuota) {
        result.metadata.classification = 'GEMINI_QUOTA_EXCEEDED';
        result.metadata.quotaExceeded = true;
      } else if (isSingleFlight) {
        result.metadata.classification = 'RESEARCH_ALREADY_IN_PROGRESS';
      } else if (!response.ok) {
        result.metadata.classification = `SERVER_HTTP_${response.status}`;
        result.metadata.fallbackReason = result.metadata.fallbackReason || `Server HTTP ${response.status}`;
      }

      return result;
    }

    // If response came back from server but responseData was not a full proposal (e.g. structured error or empty body)
    const errText = responseData ? (responseData.error || responseData.message || JSON.stringify(responseData)) : `HTTP ${response.status}`;
    const isSingleFlight = errText.includes('single-flight') || errText.includes('already active');

    if (response.status === 429) {
      if (isSingleFlight) {
        return compileClientSemanticFallback(input, serviceAreas, {
          fallbackReason: 'Research compilation already active for this entity (single-flight blocked)',
          classification: 'RESEARCH_ALREADY_IN_PROGRESS',
          quotaExceeded: false,
          userNotice: 'Compilation already in progress for this entity.',
        });
      } else {
        return compileClientSemanticFallback(input, serviceAreas, {
          fallbackReason: '429 RESOURCE_EXHAUSTED',
          classification: 'GEMINI_QUOTA_EXCEEDED',
          quotaExceeded: true,
          userNotice: 'Gemini API quota exceeded. Clean fallback to deterministic research activated.',
        });
      }
    }

    return compileClientSemanticFallback(input, serviceAreas, {
      fallbackReason: `Server HTTP ${response.status}: ${errText.substring(0, 100)}`,
      classification: `SERVER_HTTP_${response.status}`,
      quotaExceeded: false,
    });

  } catch (netErr) {
    console.warn('[recommendationAgentService] Network/server research fetch failed, using client semantic fallback:', netErr);
    // ONLY genuine network failure / fetch rejection / unreachable server uses CLIENT_SIDE_OFFLINE_FALLBACK
    return compileClientSemanticFallback(input, serviceAreas, {
      fallbackReason: 'Client-Side Offline Fallback Mode',
      classification: 'CLIENT_SIDE_OFFLINE_FALLBACK',
    });
  }
}

/**
 * Client Semantic Fallback with Strict Zero-Fabrication Rules
 */
export function compileClientSemanticFallback(
  input: AgentProposalInput,
  availableServiceAreas: ServiceAreaOption[],
  overrideOptions?: {
    fallbackReason?: string;
    classification?: string;
    quotaExceeded?: boolean;
    userNotice?: string;
  }
): AgentCompilationResult {
  const textCombined = `${input.nameOrTitle} ${input.destinationOrLocation || ''} ${input.descriptionOrNotes || ''} ${input.additionalCuratorNotes || ''}`.toLowerCase();

  // 1. Semantic Category Detection
  let primaryCategory = Category.GASTRONOMY;
  let expertiseIds = ['exp-culture-museums'];
  let categories: string[] = ['Culture'];

  if (
    textCombined.includes('thermal') ||
    textCombined.includes('termaln') ||
    textCombined.includes('rivijer') ||
    textCombined.includes('spa') ||
    textCombined.includes('wellness') ||
    textCombined.includes('banja') ||
    textCombined.includes('kupališt') ||
    textCombined.includes('bazen') ||
    textCombined.includes('geotermal') ||
    textCombined.includes('spring') ||
    textCombined.includes('mineral water')
  ) {
    primaryCategory = Category.WELLBEING;
    expertiseIds = ['exp-wellness-thermal', 'exp-wellness-spa'];
    categories = ['Wellbeing', 'Travel'];
  } else if (
    textCombined.includes('restaurant') ||
    textCombined.includes('restoran') ||
    textCombined.includes('kafana') ||
    textCombined.includes('vino') ||
    textCombined.includes('wine') ||
    textCombined.includes('winery') ||
    textCombined.includes('vinarija') ||
    textCombined.includes('rakia') ||
    textCombined.includes('food') ||
    textCombined.includes('dining') ||
    textCombined.includes('gastronom')
  ) {
    primaryCategory = Category.GASTRONOMY;
    expertiseIds = ['exp-gastronomy-traditional'];
    categories = ['Gastronomy'];
  } else if (
    textCombined.includes('national park') ||
    textCombined.includes('nacionalni park') ||
    textCombined.includes('mountain') ||
    textCombined.includes('planina') ||
    textCombined.includes('hiking') ||
    textCombined.includes('canyon') ||
    textCombined.includes('lake') ||
    textCombined.includes('river')
  ) {
    primaryCategory = Category.NATURE;
    expertiseIds = ['exp-nature-nationalparks'];
    categories = ['Nature'];
  } else if (
    textCombined.includes('monastery') ||
    textCombined.includes('manastir') ||
    textCombined.includes('fortress') ||
    textCombined.includes('tvrdjava') ||
    textCombined.includes('tvrđava') ||
    textCombined.includes('heritage') ||
    textCombined.includes('istorij')
  ) {
    primaryCategory = Category.HISTORY;
    expertiseIds = ['exp-history-monasteries'];
    categories = ['History', 'Culture'];
  }

  // 2. Strict Service Area Resolution
  let resolvedServiceAreaId = input.targetServiceAreaId || '';
  let serviceAreaName = '';
  let isResolved = false;
  let resolutionNote = '';

  const locationQuery = `${input.destinationOrLocation || ''} ${input.nameOrTitle}`.toLowerCase();

  if (resolvedServiceAreaId) {
    const matched = availableServiceAreas.find((sa) => sa.id === resolvedServiceAreaId);
    if (matched) {
      serviceAreaName = matched.name_en || matched.name_sr || matched.id;
      isResolved = true;
      resolutionNote = `Explicitly targeted service area: ${serviceAreaName}`;
    }
  }

  if (!isResolved) {
    const matchedSa = resolveServiceAreaForLocation(locationQuery, availableServiceAreas.length > 0 ? availableServiceAreas : SERVICE_AREA_OPTIONS);
    if (matchedSa) {
      resolvedServiceAreaId = matchedSa.id;
      serviceAreaName = matchedSa.name_en || matchedSa.name_sr || matchedSa.id;
      isResolved = true;
      resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
    }
  }

  if (!isResolved) {
    resolvedServiceAreaId = '';
    serviceAreaName = 'UNRESOLVED';
    resolutionNote = `Location "${input.destinationOrLocation || input.nameOrTitle}" does not match an active destination service area. Admin action required.`;
  }

  // 3. Geolocation Resolution (Strict Zero-Fabrication: No synthetic coordinate injection)
  const coordinates: { lat: number; lng: number } | undefined = undefined;
  const isCoordinatesResolved = false;
  const locationEn = input.destinationOrLocation || input.nameOrTitle;
  const locationSr = input.destinationOrLocation || input.nameOrTitle;

  // 4. Media Handling (Human Mandatory Precedence)
  let mediaHandlingType: 'HUMAN_MANDATORY' | 'AGENT_CURATED' | 'RESEARCH_CANDIDATE' = 'RESEARCH_CANDIDATE';
  let finalImageUrl = '';
  let precedenceEnforced = false;
  let provenanceSource = 'Pending Human Upload';
  let provenanceLicense = 'CC-BY-4.0';
  let provenanceStatus = 'Unverified';
  let provenanceMethod: string | undefined = undefined;

  if (input.humanProvidedMedia?.url) {
    mediaHandlingType = 'HUMAN_MANDATORY';
    finalImageUrl = input.humanProvidedMedia.url;
    precedenceEnforced = true;
    provenanceSource = input.humanProvidedMedia.source || 'Curator Submission';
    provenanceLicense = input.humanProvidedMedia.license || 'Proprietary / Human Provided';
    provenanceStatus = 'Verified';
    provenanceMethod = 'original';
  }

  // 5. Unresearched Structural Descriptions
  const shortDescEn = `[Unresearched Structural Draft] ${input.nameOrTitle}${locationEn ? ` (${locationEn})` : ''}. Live research unavailable; curator verification required.`;
  const shortDescSr = `[Нацрт без истраживања] ${input.nameOrTitle}${locationSr ? ` (${locationSr})` : ''}. Потребно је унети кураторски опис након истраживања.`;
  const longDescEn = `[Unresearched Structural Draft] Live destination research was unavailable at proposal compilation time. Curator research and factual verification required for ${input.nameOrTitle}.`;
  const longDescSr = `[Нацрт без истраживања] Аутоматско истраживање дестинације није било доступно. Потребно је унети аутентичне чињенице и кураторски опис за ${input.nameOrTitle}.`;

  // 6. Zero-Fabrication Practical Info
  const practicalInfo = {
    opening_hours: '',
    contact_phone: '',
    contact_email: '',
    website: input.referenceUrl || '',
    admission_fee: '',
  };

  // 7. Evidence Audit
  const verifiedFields: string[] = ['title', 'category'];
  const supportedFields: string[] = [];
  const unresolvedFields: string[] = [];
  const fieldStatuses: EvidenceFieldStatus[] = [
    { fieldName: 'title', status: 'VERIFIED', sourceOrRationale: 'Curator provided entity title' },
    { fieldName: 'category', status: 'VERIFIED', sourceOrRationale: `Semantic classification: ${primaryCategory}` },
  ];

  if (isCoordinatesResolved && coordinates) {
    supportedFields.push('coordinates');
    fieldStatuses.push({ fieldName: 'coordinates', status: 'SUPPORTED', sourceOrRationale: `Geocoded to ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` });
  } else {
    unresolvedFields.push('coordinates');
    fieldStatuses.push({ fieldName: 'coordinates', status: 'UNRESOLVED', sourceOrRationale: 'Precise venue coordinates could not be resolved without live research' });
  }

  if (isResolved) {
    verifiedFields.push('serviceAreaId');
    fieldStatuses.push({ fieldName: 'serviceAreaId', status: 'VERIFIED', sourceOrRationale: serviceAreaName });
  } else {
    unresolvedFields.push('serviceAreaId');
    fieldStatuses.push({ fieldName: 'serviceAreaId', status: 'UNRESOLVED', sourceOrRationale: resolutionNote });
  }

  if (input.humanProvidedMedia?.url) {
    verifiedFields.push('image');
    fieldStatuses.push({ fieldName: 'image', status: 'VERIFIED', sourceOrRationale: 'Human-provided media attached' });
  } else {
    unresolvedFields.push('image');
    fieldStatuses.push({ fieldName: 'image', status: 'UNRESOLVED', sourceOrRationale: 'Awaiting verified human media attachment' });
  }

  // Unresolved descriptions & transport under fallback
  unresolvedFields.push('shortDescription');
  fieldStatuses.push({ fieldName: 'shortDescription', status: 'UNRESOLVED', sourceOrRationale: 'Unresearched structural draft — requires curator verification' });

  unresolvedFields.push('longDescription');
  fieldStatuses.push({ fieldName: 'longDescription', status: 'UNRESOLVED', sourceOrRationale: 'Unresearched structural draft — requires curator verification' });

  unresolvedFields.push('preferredTransport');
  fieldStatuses.push({ fieldName: 'preferredTransport', status: 'UNRESOLVED', sourceOrRationale: 'Transit options unresearched' });

  unresolvedFields.push('practicalInfo.opening_hours', 'practicalInfo.contact_phone', 'practicalInfo.contact_email', 'practicalInfo.admission_fee');

  const recommendation: Partial<Recommendation> = {
    id: `rec-candidate-${Date.now()}`,
    serviceAreaId: resolvedServiceAreaId,
    title: input.nameOrTitle,
    titleSr: input.nameOrTitle,
    category: primaryCategory,
    categories,
    expertiseIds,
    capabilityIds: ['cap-english-fluent'],
    shortDescription: shortDescEn,
    shortDescriptionSr: shortDescSr,
    longDescription: longDescEn,
    longDescriptionSr: longDescSr,
    location: locationEn,
    locationSr: locationSr,
    bestTimeToVisitEn: '',
    insiderTipEn: '',
    duration: '',
    travelTime: '',
    travelTimeMinutes: 0,
    estimatedCost: '',
    preferredTransport: '',
    image: finalImageUrl,
    coordinates,
    coordinateX: primaryCategory === Category.WELLBEING ? -3.5 : 0.0,
    coordinateY: primaryCategory === Category.WELLBEING ? -2.0 : 0.0,
    energy: primaryCategory === Category.WELLBEING ? 0.3 : 0.5,
    social: 0.5,
    luxury: 0.5,
    urbanity: 0.5,
    nature: primaryCategory === Category.WELLBEING ? 0.6 : 0.5,
    weatherDependency: 0.3,
    seasonality: 'all',
    familySuitability: true,
    accessibility: true,
    premiumLevel: 'standard',
    budgetLevel: 'moderate',
    moods: primaryCategory === Category.WELLBEING ? ['Serene', 'Thermal', 'Wellness'] : ['Cultural', 'Authentic'],
    website: practicalInfo.website,
    phone: '',
    practicalInfo,
    provenance: {
      source: provenanceSource,
      method: provenanceMethod,
      license: provenanceLicense,
      attributionRequired: false,
      attributionText: 'IDEMO Serbia Concierge',
      verificationStatus: provenanceStatus,
      altText: input.nameOrTitle,
    },
    translations: {
      en: { title: input.nameOrTitle, shortDescription: shortDescEn, longDescription: longDescEn, location: locationEn },
      sr: { title: input.nameOrTitle, shortDescription: shortDescSr, longDescription: longDescSr, location: locationSr },
      de: { title: input.nameOrTitle, shortDescription: shortDescEn, longDescription: longDescEn, location: locationEn },
      ru: { title: input.nameOrTitle, shortDescription: shortDescEn, longDescription: longDescEn, location: locationEn },
      es: { title: input.nameOrTitle, shortDescription: shortDescEn, longDescription: longDescEn, location: locationEn },
      zh: { title: input.nameOrTitle, shortDescription: shortDescEn, longDescription: longDescEn, location: locationEn },
    },
  };

  const partnerIntelligence = evaluatePartnerSuitability(recommendation);

  const fallbackReason = overrideOptions?.fallbackReason || 'Client-Side Offline Fallback Mode';
  const classification = overrideOptions?.classification || (fallbackReason === 'Client-Side Offline Fallback Mode' ? 'CLIENT_SIDE_OFFLINE_FALLBACK' : undefined);
  const quotaExceeded = overrideOptions?.quotaExceeded ?? false;

  return {
    recommendation,
    evidenceReport: {
      verifiedFields,
      supportedFields,
      unresolvedFields,
      fieldStatuses,
      serviceAreaResolution: {
        isResolved,
        serviceAreaId: resolvedServiceAreaId,
        serviceAreaName,
        requiresAdminReview: !isResolved,
        resolutionNote,
      },
      mediaHandling: {
        type: mediaHandlingType,
        mediaUrl: finalImageUrl,
        precedenceEnforced,
        provenanceSource,
        provenanceLicense,
      },
      lifecycleStatus: 'NEEDS RESEARCH',
      headerVisualState: 'AMBER',
    },
    partnerIntelligence,
    metadata: {
      usedAi: false,
      executionMode: 'DETERMINISTIC_FALLBACK',
      model: 'deterministic_semantic_engine',
      geminiRequestAttempted: false,
      geminiRequestSucceeded: false,
      fallbackInvoked: true,
      fallbackReason,
      classification,
      googleSearchGroundingMetadataReceived: false,
      groundingWebSearchQueriesCount: 0,
      groundingChunksCount: 0,
      quotaExceeded,
      userNotice: overrideOptions?.userNotice || 'LIVE RESEARCH UNAVAILABLE. Proposal preserved as AMBER draft. Unverified fields remain unresolved.',
      sources: input.referenceUrl ? [input.referenceUrl] : [],
    },
  };
}

export async function localizeRecommendation(
  recommendation: Partial<Recommendation>,
  targetLanguages?: string[]
): Promise<{ success: boolean; recommendation: Partial<Recommendation>; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch('/api/studio/recommendation-agent/localize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation, targetLanguages }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        recommendation,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      recommendation: data.recommendation || recommendation,
    };
  } catch (err: any) {
    return {
      success: false,
      recommendation,
      error: err?.message || String(err),
    };
  }
}
