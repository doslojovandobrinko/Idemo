/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../../types';

export type LinkIntegritySeverity = 'BLOCKING' | 'WARNING';

export interface LinkIntegrityFinding {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  field: string;
  code: 'MALFORMED_URL' | 'INVALID_PROTOCOL';
  url: string;
  severity: LinkIntegritySeverity;
  message: string;
}

export interface LinkIntegrityReport {
  findings: LinkIntegrityFinding[];
  findingCount: number;
  healthyCount: number;
  totalEvaluated: number;
  scannedAt: string;
}

/**
 * Validates a single URL string.
 * Returns finding details if invalid, or null if valid.
 */
function validateUrl(
  url: string,
  recommendationId: string,
  recommendationTitle: string,
  field: string
): LinkIntegrityFinding | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Space inside URL -> MALFORMED_URL
  if (/\s/.test(trimmed)) {
    return {
      id: `${recommendationId}-${field}-malformed`,
      recommendationId,
      recommendationTitle,
      field,
      code: 'MALFORMED_URL',
      url: trimmed,
      severity: 'WARNING',
      message: `URL contains whitespace or illegal characters: "${trimmed}"`,
    };
  }

  // Must have protocol http:// or https://
  const protocolMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!protocolMatch) {
    return {
      id: `${recommendationId}-${field}-no-protocol`,
      recommendationId,
      recommendationTitle,
      field,
      code: 'INVALID_PROTOCOL',
      url: trimmed,
      severity: 'WARNING',
      message: `URL lacks http:// or https:// protocol: "${trimmed}"`,
    };
  }

  const protocol = protocolMatch[1].toLowerCase();
  if (protocol !== 'http' && protocol !== 'https') {
    return {
      id: `${recommendationId}-${field}-invalid-proto`,
      recommendationId,
      recommendationTitle,
      field,
      code: 'INVALID_PROTOCOL',
      url: trimmed,
      severity: 'BLOCKING',
      message: `Unsupported or unsafe protocol "${protocol}:": "${trimmed}"`,
    };
  }

  // Parse URL
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        id: `${recommendationId}-${field}-malformed`,
        recommendationId,
        recommendationTitle,
        field,
        code: 'MALFORMED_URL',
        url: trimmed,
        severity: 'WARNING',
        message: `URL hostname is invalid: "${trimmed}"`,
      };
    }
  } catch {
    return {
      id: `${recommendationId}-${field}-malformed`,
      recommendationId,
      recommendationTitle,
      field,
      code: 'MALFORMED_URL',
      url: trimmed,
      severity: 'WARNING',
      message: `Failed to parse URL: "${trimmed}"`,
    };
  }

  return null;
}

/**
 * Scans a list of recommendations for link integrity without mutating the source objects.
 * PURE READ-ONLY FUNCTION.
 */
export function scanLinkIntegrity(recommendations: Recommendation[]): LinkIntegrityReport {
  const findings: LinkIntegrityFinding[] = [];
  let healthyRecCount = 0;

  for (const rec of recommendations) {
    if (!rec) continue;
    let recHasFinding = false;

    // Check rec.website
    if (rec.website && typeof rec.website === 'string') {
      const f = validateUrl(rec.website, rec.id, rec.title || rec.id, 'website');
      if (f) {
        findings.push(f);
        recHasFinding = true;
      }
    }

    // Check rec.practicalInfo?.website
    if (rec.practicalInfo?.website && typeof rec.practicalInfo.website === 'string') {
      const f = validateUrl(
        rec.practicalInfo.website,
        rec.id,
        rec.title || rec.id,
        'practicalInfo.website'
      );
      if (f) {
        findings.push(f);
        recHasFinding = true;
      }
    }

    if (!recHasFinding) {
      healthyRecCount++;
    }
  }

  // Deterministically sort findings by recommendationId then field
  findings.sort((a, b) => {
    if (a.recommendationId !== b.recommendationId) {
      return a.recommendationId.localeCompare(b.recommendationId);
    }
    return a.field.localeCompare(b.field);
  });

  return {
    findings,
    findingCount: findings.length,
    healthyCount: healthyRecCount,
    totalEvaluated: recommendations.length,
    scannedAt: new Date().toISOString(),
  };
}
