/**
 * IDEMO 007 V2 - Fact Freshness Evaluator
 * Deterministic freshness rules based on volatility and explicit validUntil thresholds.
 */

import { FactRecord, FactVolatility, FreshnessSummary } from '../../types/idemo007v2';

export const VOLATILITY_TTL_DAYS: Record<FactVolatility, number> = {
  STATIC: Infinity, // No automatic expiry
  LOW: 365,
  MEDIUM: 90,
  HIGH: 30,
};

/**
 * Returns the default volatility for a given factKey.
 */
export function getFactKeyDefaultVolatility(factKey: string): FactVolatility {
  const k = factKey.toLowerCase();

  if (
    k.includes('opening_hours') ||
    k.includes('ticket_price') ||
    k.includes('admission') ||
    k.includes('seasonal_access') ||
    k.includes('event_dates')
  ) {
    return 'HIGH';
  }

  if (
    k.includes('contact_details') ||
    k.includes('phone') ||
    k.includes('email') ||
    k.includes('website') ||
    k.includes('contact') ||
    k.includes('address')
  ) {
    return 'MEDIUM';
  }

  if (
    k.includes('official_status') ||
    k.includes('unesco_status') ||
    k.includes('coordinates') ||
    k.includes('category')
  ) {
    return 'LOW';
  }

  if (
    k.includes('historical_identity') ||
    k.includes('founding_date') ||
    k.includes('significance') ||
    k.includes('reason_to_visit')
  ) {
    return 'STATIC';
  }

  return 'STATIC';
}

export interface FactFreshnessResult {
  isFresh: boolean;
  isStale: boolean;
  isExpired: boolean;
  ageInDays: number;
  maxValidDays: number;
  reason?: string;
}

/**
 * Evaluates the freshness of a single FactRecord against a reference date.
 */
export function evaluateFactFreshness(fact: FactRecord, referenceDate?: Date): FactFreshnessResult {
  const now = referenceDate ? referenceDate.getTime() : Date.now();
  const verifiedTime = new Date(fact.verifiedAt).getTime();
  const ageInMs = Math.max(0, now - verifiedTime);
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));

  // 1. Explicit validUntil takes precedence
  if (fact.validUntil) {
    const validUntilTime = new Date(fact.validUntil).getTime();
    const isExpired = now > validUntilTime;
    return {
      isFresh: !isExpired,
      isStale: isExpired,
      isExpired,
      ageInDays,
      maxValidDays: Math.floor((validUntilTime - verifiedTime) / (1000 * 60 * 60 * 24)),
      reason: isExpired ? `Explicit validUntil date passed (${fact.validUntil})` : undefined,
    };
  }

  // 2. Volatility window check
  const volatility = fact.volatility || getFactKeyDefaultVolatility(fact.factKey);
  const maxValidDays = VOLATILITY_TTL_DAYS[volatility];

  if (maxValidDays === Infinity) {
    return {
      isFresh: true,
      isStale: false,
      isExpired: false,
      ageInDays,
      maxValidDays: Infinity,
    };
  }

  const isStale = ageInDays > maxValidDays;
  return {
    isFresh: !isStale,
    isStale,
    isExpired: isStale,
    ageInDays,
    maxValidDays,
    reason: isStale ? `Fact age (${ageInDays} days) exceeds ${volatility} volatility limit of ${maxValidDays} days` : undefined,
  };
}

/**
 * Summarizes freshness across an array of facts.
 */
export function summarizeFreshness(facts: FactRecord[], referenceDate?: Date): FreshnessSummary {
  let freshFactCount = 0;
  let staleFactCount = 0;
  let expiredFactCount = 0;

  for (const fact of facts) {
    const evalResult = evaluateFactFreshness(fact, referenceDate);
    if (evalResult.isFresh) {
      freshFactCount++;
    } else {
      staleFactCount++;
      if (evalResult.isExpired) {
        expiredFactCount++;
      }
    }
  }

  return {
    freshFactCount,
    staleFactCount,
    expiredFactCount,
    missingRequiredFactCount: 0,
  };
}
