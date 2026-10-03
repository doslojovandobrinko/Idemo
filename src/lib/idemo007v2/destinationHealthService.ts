/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Partner } from '../../types';
import { validateCanonicalRecommendationForPublication } from './publicationGate';
import { CanonicalRecommendation } from '../../types/idemo007v2';

export type DestinationHealthSeverity = 'BLOCKING' | 'WARNING' | 'INFO';

export type DestinationHealthCategory =
  | 'PUBLICATION_READINESS'
  | 'COORDINATES_LOCATION'
  | 'LOCALIZATION'
  | 'PRIMARY_MEDIA'
  | 'PARTNER_COVERAGE';

export interface DestinationHealthFinding {
  id: string;
  destinationId: string;
  destinationName: string;
  recommendationId?: string;
  recommendationTitle?: string;
  category: DestinationHealthCategory;
  code: string;
  severity: DestinationHealthSeverity;
  actionableReason: string;
  remediationAdvice: string;
  evaluatedAt: string;
}

export interface DestinationHealthReport {
  destinationId: string;
  destinationName: string;
  totalRecommendationsEvaluated: number;
  healthScore: number; // 0 to 100
  status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  findings: DestinationHealthFinding[];
  summary: {
    blockingCount: number;
    warningCount: number;
    infoCount: number;
  };
  evaluatedAt: string;
}

export interface DestinationScopeInput {
  id: string;
  name: string;
  serviceAreaCode?: string;
  recommendations: Partial<Recommendation>[];
  partners?: Partial<Partner>[];
}

const CANONICAL_LANG_CODES = ['en', 'sr', 'de', 'ru', 'es', 'zh'] as const;

/**
 * Deterministically scans a destination package scope for actionable health conditions.
 * PURE READ-ONLY FUNCTION. Zero LLM calls, zero network calls, zero data mutations.
 */
export function scanDestinationHealth(scope: DestinationScopeInput): DestinationHealthReport {
  const evaluatedAt = new Date().toISOString();
  const findings: DestinationHealthFinding[] = [];
  const recs = Array.isArray(scope.recommendations) ? scope.recommendations : [];

  for (const rec of recs) {
    const recId = String(rec.id || rec.dbId || 'unidentified-rec');
    const recTitle = rec.title || rec.titleEn || (rec as any).canonicalName || 'Untitled Recommendation';

    // 1. Publication Readiness Check via publicationGate
    const pubValidation = validateCanonicalRecommendationForPublication(rec as CanonicalRecommendation);
    if (!pubValidation.publishable && pubValidation.blockingReasons) {
      for (const reasonCode of pubValidation.blockingReasons) {
        findings.push({
          id: `dhf_${recId}_pub_${reasonCode}`,
          destinationId: scope.id,
          destinationName: scope.name,
          recommendationId: recId,
          recommendationTitle: recTitle,
          category: 'PUBLICATION_READINESS',
          code: reasonCode,
          severity: 'BLOCKING',
          actionableReason: `Publication Gate Blocking: ${reasonCode}. Recommendation cannot enter published state.`,
          remediationAdvice: `Open recommendation in Studio Editor to complete mandatory ${reasonCode.toLowerCase()} fields.`,
          evaluatedAt,
        });
      }
    }

    // 2. Coordinates & Location Health Check
    const coords = rec.coordinates;
    const hasCoordinates = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number';
    const isZeroCoords = hasCoordinates && coords.lat === 0 && coords.lng === 0;

    if (!hasCoordinates || isZeroCoords) {
      findings.push({
        id: `dhf_${recId}_geo_missing`,
        destinationId: scope.id,
        destinationName: scope.name,
        recommendationId: recId,
        recommendationTitle: recTitle,
        category: 'COORDINATES_LOCATION',
        code: 'MISSING_GEOGRAPHIC_COORDINATES',
        severity: 'WARNING',
        actionableReason: 'Geographic coordinates (latitude / longitude) are missing or set to zero.',
        remediationAdvice: 'Set precise GPS coordinates in Step 1 (General & Spatial) of the recommendation editor.',
        evaluatedAt,
      });
    } else {
      // Validate bounding box (Serbia & Balkans region approximation: Lat 41.0 to 47.0, Lng 18.0 to 23.5)
      const isOutOfBounds = coords.lat < 40.0 || coords.lat > 48.0 || coords.lng < 17.0 || coords.lng > 24.5;
      if (isOutOfBounds) {
        findings.push({
          id: `dhf_${recId}_geo_bounds`,
          destinationId: scope.id,
          destinationName: scope.name,
          recommendationId: recId,
          recommendationTitle: recTitle,
          category: 'COORDINATES_LOCATION',
          code: 'COORDINATES_OUT_OF_BOUNDS',
          severity: 'WARNING',
          actionableReason: `Coordinates (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}) fall outside destination regional bounds.`,
          remediationAdvice: 'Verify map marker pin or manual coordinate inputs in Studio editor.',
          evaluatedAt,
        });
      }
    }

    // 3. Primary Media / Image Availability Check
    const imagePath = rec.image || (rec as any).photoUrl || (rec as any).primaryMediaUrl;
    if (!imagePath || typeof imagePath !== 'string' || !imagePath.trim()) {
      findings.push({
        id: `dhf_${recId}_media_missing`,
        destinationId: scope.id,
        destinationName: scope.name,
        recommendationId: recId,
        recommendationTitle: recTitle,
        category: 'PRIMARY_MEDIA',
        code: 'MISSING_PRIMARY_MEDIA',
        severity: 'WARNING',
        actionableReason: 'No primary recommendation image is attached to this experience.',
        remediationAdvice: 'Upload an approved primary image via the governed Media Pipeline in Step 2 of the editor.',
        evaluatedAt,
      });
    }

    // 4. Localization Completeness Check across 6 Canonical Languages
    const translations = rec.translations || {};
    const missingLangs: string[] = [];

    for (const langCode of CANONICAL_LANG_CODES) {
      const trans = translations[langCode];
      const hasShortDesc = trans && trans.shortDescription && trans.shortDescription.trim() !== '' && trans.shortDescription !== 'PENDING LOCALIZATION';
      if (!hasShortDesc) {
        missingLangs.push(langCode.toUpperCase());
      }
    }

    if (missingLangs.length > 0) {
      findings.push({
        id: `dhf_${recId}_loc_incomplete`,
        destinationId: scope.id,
        destinationName: scope.name,
        recommendationId: recId,
        recommendationTitle: recTitle,
        category: 'LOCALIZATION',
        code: 'INCOMPLETE_LOCALIZATION',
        severity: 'INFO',
        actionableReason: `Localization is incomplete or pending for ${missingLangs.length} language(s): ${missingLangs.join(', ')}.`,
        remediationAdvice: 'Generate or review localizations in Step 5 (Six-Language Visitor Localization) of the editor.',
        evaluatedAt,
      });
    }

    // 5. Service Area & Partner Coverage Check
    if (!rec.serviceAreaId && !(rec as any).serviceArea) {
      findings.push({
        id: `dhf_${recId}_sa_missing`,
        destinationId: scope.id,
        destinationName: scope.name,
        recommendationId: recId,
        recommendationTitle: recTitle,
        category: 'PARTNER_COVERAGE',
        code: 'UNASSIGNED_SERVICE_AREA',
        severity: 'WARNING',
        actionableReason: 'Recommendation is not assigned to a canonical Destination Service Area.',
        remediationAdvice: 'Select an authoritative service area in Step 1 of the recommendation editor.',
        evaluatedAt,
      });
    }
  }

  // Calculate health summary & deterministic score
  let blockingCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    if (f.severity === 'BLOCKING') blockingCount++;
    else if (f.severity === 'WARNING') warningCount++;
    else if (f.severity === 'INFO') infoCount++;
  }

  // Deduct 15 pts per BLOCKING, 5 pts per WARNING, 1 pt per INFO
  const penalty = blockingCount * 15 + warningCount * 5 + infoCount * 1;
  const healthScore = Math.max(0, 100 - penalty);

  let status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'HEALTHY';
  if (blockingCount > 0 || healthScore < 60) {
    status = 'CRITICAL';
  } else if (warningCount > 0 || infoCount > 3 || healthScore < 85) {
    status = 'NEEDS_ATTENTION';
  }

  return {
    destinationId: scope.id,
    destinationName: scope.name,
    totalRecommendationsEvaluated: recs.length,
    healthScore,
    status,
    findings,
    summary: {
      blockingCount,
      warningCount,
      infoCount,
    },
    evaluatedAt,
  };
}
