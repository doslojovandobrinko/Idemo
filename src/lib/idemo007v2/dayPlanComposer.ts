/**
 * IDEMO 007 V2 - Day-Plan Composer MVP
 * Generates deterministic 1-day itinerary proposals using published IDEMO recommendations.
 * Reuses existing preferenceEngine, scoreRecommendation, and Haversine distance math.
 * 
 * ZERO Search calls, ZERO Maps calls, ZERO LLM calls.
 */

import { Recommendation, Category } from '../../types';
import { UserPreferences, scoreRecommendation, calculateDistance } from '../recommendationEngine';
import { INITIAL_RECOMMENDATIONS } from '../../constants';
import { draftExpansionPool } from '../../data/recommendations/serbia/draft_expansion';
import { getLocalStudioDrafts } from '../recommendationWorkflowService';

export type DayPlanDurationBucket = '2-3 HOURS' | 'HALF-DAY' | 'FULL-DAY';

export type DayPlanFeasibilityWarningType =
  | 'PLAN_TOO_LONG'
  | 'TRANSIT_TOO_HIGH'
  | 'LEG_TOO_LONG'
  | 'MISSING_COORDINATES'
  | 'OUTSIDE_SERVICE_AREA'
  | 'BUDGET_EXCEEDED'
  | 'INSUFFICIENT_STOPS'
  | 'NON_PUBLISHED_ITEM_INCLUDED'
  | 'DUPLICATE_STOPS_DETECTED';

export interface DayPlanFeasibilityWarning {
  type: DayPlanFeasibilityWarningType;
  message: string;
  stopOrder?: number;
}

export interface DayPlanFeasibilityResult {
  feasible: boolean;
  warnings: DayPlanFeasibilityWarning[];
  totalExperienceMinutes: number;
  totalTransitMinutes: number;
  totalBufferMinutes: number;
  totalPlanMinutes: number;
}

export interface DayPlanComposerInput {
  serviceAreaId?: string;
  durationBucket: DayPlanDurationBucket;
  orbitX?: number; // 0..1 (default 0.5)
  orbitY?: number; // 0..1 (default 0.5)
  budgetLevel?: 'free' | 'low' | 'moderate' | 'high' | 'exclusive';
  selectedCategories?: string[];
  curatorTitle?: string;
  currentTimeMinutes?: number;
  plannedDayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  plannedWeather?: 'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy';
  visitorPreferences?: Partial<UserPreferences>;
}

export interface DayPlanStop {
  stopOrder: number;
  recommendation: Recommendation;
  suggestedTimeSlot: string;
  recommendedDurationMinutes: number;
  travelFromPreviousKm: number;
  travelFromPreviousMins: number;
}

export interface ItineraryProposal {
  id: string;
  title: string;
  serviceAreaId: string;
  durationBucket: DayPlanDurationBucket;
  stops: DayPlanStop[];
  totalDurationMinutes: number;
  totalDistanceKm: number;
  publicationStatus: 'DRAFT' | 'APPROVED';
  createdAt: string;
  curatorNotes?: string;
  feasibilityResult?: DayPlanFeasibilityResult;
}

export const FEASIBILITY_THRESHOLDS = {
  DURATION_BUCKET_MAX_MINUTES: {
    '2-3 HOURS': 180,
    'HALF-DAY': 360,
    'FULL-DAY': 720,
  } as Record<DayPlanDurationBucket, number>,

  DURATION_BUCKET_ALLOWANCE_BUFFER: {
    '2-3 HOURS': 30, // max 210 mins before PLAN_TOO_LONG warning
    'HALF-DAY': 30,  // max 390 mins before PLAN_TOO_LONG warning
    'FULL-DAY': 60,  // max 780 mins before PLAN_TOO_LONG warning
  } as Record<DayPlanDurationBucket, number>,

  BUFFER_MINUTES_PER_TRANSITION: 15, // buffer between stops

  MAX_SINGLE_LEG_TRANSIT_MINS: 45, // leg > 45 mins triggers LEG_TOO_LONG
  MAX_SINGLE_LEG_TRANSIT_KM: 35,   // leg > 35 km triggers LEG_TOO_LONG

  MAX_TOTAL_TRANSIT_RATIO: 0.40,   // transit > 40% of experience time triggers TRANSIT_TOO_HIGH

  // Day-Plan Suitability Gate Thresholds
  // Candidate suitability margin relative to top anchor score (bestMatchScore)
  SUITABILITY_RELATIVE_MARGIN_POINTS: 25.0, // Candidates must be within 25 points of bestMatchScore
  SUITABILITY_ABSOLUTE_FLOOR_POINTS: 40.0,   // Absolute floor: candidate preference score must be >= 40.0

  TARGET_STOPS_PER_BUCKET: {
    '2-3 HOURS': 2,
    'HALF-DAY': 3,
    'FULL-DAY': 4,
  } as Record<DayPlanDurationBucket, number>,
};

/**
 * Positive Published Eligibility Invariant:
 * Authoritative publication field: recommendation.publicationStatus
 * Valid published domain states: 'PUBLISHED' | 'CANONICAL' (defined in RecommendationLifecycleStatus).
 *
 * Strictly ineligible: 'DRAFT', 'RESEARCH_CANDIDATE', 'NEEDS_ADDITIONAL_RESEARCH',
 * 'NEEDS_EDITORIAL_IMPROVEMENT', 'DEFERRED', 'RETIRED', missing publicationStatus,
 * or un-typed 'status' / 'APPROVED' overrides.
 */
export function isPublishedRecommendation(rec: Partial<Recommendation>): boolean {
  if (!rec || !rec.id || !rec.publicationStatus) return false;
  return rec.publicationStatus === 'PUBLISHED' || rec.publicationStatus === 'CANONICAL';
}

const DEFAULT_TIME_SLOTS: Record<DayPlanDurationBucket, { targetStops: number; slots: string[] }> = {
  '2-3 HOURS': {
    targetStops: 2,
    slots: ['10:00 AM', '12:30 PM'],
  },
  'HALF-DAY': {
    targetStops: 3,
    slots: ['10:00 AM', '01:00 PM', '04:00 PM'],
  },
  'FULL-DAY': {
    targetStops: 4,
    slots: ['09:30 AM', '12:30 PM', '03:30 PM', '07:00 PM'],
  },
};

/**
 * Retrieves all published recommendations from canonical static inventory and studio drafts.
 * Enforces positive publication eligibility invariant.
 */
export function getPublishedRecommendationsInventory(): Recommendation[] {
  const map = new Map<string, Recommendation>();

  // 1. Static canonical recommendations baseline
  const staticPool = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
  for (const item of staticPool) {
    if (item && item.id && isPublishedRecommendation(item as Recommendation)) {
      map.set(item.id, item as Recommendation);
    }
  }

  // 2. Local studio published recommendations
  try {
    const studioDrafts = getLocalStudioDrafts();
    for (const draft of studioDrafts) {
      if (draft && draft.id && isPublishedRecommendation(draft as Recommendation)) {
        map.set(draft.id, draft as Recommendation);
      }
    }
  } catch (err) {
    console.warn('[DayPlanComposer] Error loading studio drafts inventory:', err);
  }

  return Array.from(map.values());
}

/**
 * Deterministically composes an ItineraryProposal draft using published IDEMO inventory.
 */
export function composeDayPlan(
  input: DayPlanComposerInput,
  overrideInventory?: Recommendation[]
): ItineraryProposal {
  const {
    serviceAreaId = 'sa-serbia-belgrade',
    durationBucket,
    orbitX = 0.5,
    orbitY = 0.5,
    budgetLevel,
    selectedCategories = [],
    curatorTitle,
  } = input;

  const inventory = overrideInventory || getPublishedRecommendationsInventory();

  // 1. Filter PUBLISHED / CANONICAL recommendations compatible with requested duration/service area
  let filtered = inventory.filter((rec) => {
    // Strictly enforce positive publication eligibility invariant
    if (!isPublishedRecommendation(rec)) {
      return false;
    }

    // Service area check
    if (serviceAreaId && serviceAreaId !== 'all') {
      const saClean = serviceAreaId.replace('sa-serbia-', '').toLowerCase();
      const recSaClean = (rec.serviceAreaId || '').replace('sa-serbia-', '').toLowerCase();
      const matchServiceArea =
        recSaClean === saClean ||
        ((rec as any).serviceAreas && (rec as any).serviceAreas.includes(serviceAreaId)) ||
        (rec.location || '').toLowerCase().includes(saClean);
      if (!matchServiceArea && (rec.serviceAreaId || rec.location)) {
        return false;
      }
    }

    // Budget check
    if (budgetLevel && rec.budgetLevel) {
      if (budgetLevel === 'free' && rec.budgetLevel !== 'free') return false;
      if (budgetLevel === 'low' && (rec.budgetLevel === 'high' || rec.budgetLevel === 'exclusive')) return false;
    }

    return true;
  });

  // Fallback if service-area/budget filtering yields fewer than 2 items
  if (filtered.length < 2) {
    filtered = inventory.filter((rec) => isPublishedRecommendation(rec));
  }

  // 2. Score candidates using existing preference engine logic
  const userPrefs: UserPreferences = {
    budget: 3,
    time: durationBucket === '2-3 HOURS' ? 2 : durationBucket === 'HALF-DAY' ? 4 : 8,
    days: 'weekend',
    timeOfDay: 'morning',
    selectedCategories,
    orbitX,
    orbitY,
    isCustomOrbit: true,
    currentTimeMinutes: input.currentTimeMinutes,
    currentDayOfWeek: input.plannedDayOfWeek,
    currentWeather: input.plannedWeather,
    ratings: input.visitorPreferences?.ratings,
    implicitTastes: input.visitorPreferences?.implicitTastes,
    lpeProfile: input.visitorPreferences?.lpeProfile,
    isPlanningContext: true,
  };

  const scoredCandidates = filtered.map((rec) => {
    const safeRec = {
      ...rec,
      estimatedCost: rec.estimatedCost || '$$',
      duration: rec.duration || '1-2 hours',
      travelTimeMinutes: typeof rec.travelTimeMinutes === 'number' ? rec.travelTimeMinutes : 15,
    };
    return {
      rec,
      score: scoreRecommendation(safeRec as Recommendation, userPrefs),
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  // 3. Day-Plan Suitability Gate:
  // Personal fit determines WHAT belongs in the day; geography determines HOW suitable experiences are assembled.
  // Filter scored candidates into a suitable pool relative to the bestMatchScore (anchor score).
  const bestMatchScore = scoredCandidates.length > 0 ? scoredCandidates[0].score : 0;
  const suitabilityThreshold = Math.max(
    FEASIBILITY_THRESHOLDS.SUITABILITY_ABSOLUTE_FLOOR_POINTS,
    bestMatchScore - FEASIBILITY_THRESHOLDS.SUITABILITY_RELATIVE_MARGIN_POINTS
  );

  const suitableCandidates = scoredCandidates.filter((cand) => cand.score >= suitabilityThreshold);

  // 4. Determine target stop count and time slots based on available suitable pool
  const config = DEFAULT_TIME_SLOTS[durationBucket] || DEFAULT_TIME_SLOTS['HALF-DAY'];
  const targetCount = Math.min(config.targetStops, suitableCandidates.length);

  // 5. Select stops greedily minimizing geographic distance among suitable candidates
  const selectedStops: Recommendation[] = [];
  const selectedIds = new Set<string>();

  if (suitableCandidates.length > 0) {
    // Stop 1 (Anchor): Highest scoring candidate (geography has ZERO influence on anchor selection)
    const topAnchor = suitableCandidates[0].rec;
    selectedStops.push(topAnchor);
    selectedIds.add(topAnchor.id);
  }

  while (selectedStops.length < targetCount) {
    const lastStop = selectedStops[selectedStops.length - 1];
    const lastLat = lastStop.coordinates?.lat ?? lastStop.coordinateX;
    const lastLng = lastStop.coordinates?.lng ?? lastStop.coordinateY;

    let bestCandidate: Recommendation | null = null;
    let bestCombinedScore = -Infinity;

    for (const cand of suitableCandidates) {
      if (selectedIds.has(cand.rec.id)) continue;

      let distKm = 0;
      const cLat = cand.rec.coordinates?.lat ?? cand.rec.coordinateX;
      const cLng = cand.rec.coordinates?.lng ?? cand.rec.coordinateY;

      if (lastLat !== undefined && lastLng !== undefined && cLat !== undefined && cLng !== undefined) {
        distKm = calculateDistance(lastLat, lastLng, cLat, cLng);
      }

      // Proximity reordering among suitable candidates: high match score penalized by distance
      const combinedScore = cand.score - distKm * 2;
      if (combinedScore > bestCombinedScore) {
        bestCombinedScore = combinedScore;
        bestCandidate = cand.rec;
      }
    }

    if (bestCandidate) {
      selectedStops.push(bestCandidate);
      selectedIds.add(bestCandidate.id);
    } else {
      break;
    }
  }

  // 5. Build ordered stops with transit time & distance estimation
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  const stops: DayPlanStop[] = selectedStops.map((rec, idx) => {
    let travelKm = 0;
    let travelMins = 0;

    if (idx > 0) {
      const prev = selectedStops[idx - 1];
      const pLat = prev.coordinates?.lat ?? prev.coordinateX;
      const pLng = prev.coordinates?.lng ?? prev.coordinateY;
      const cLat = rec.coordinates?.lat ?? rec.coordinateX;
      const cLng = rec.coordinates?.lng ?? rec.coordinateY;

      if (pLat !== undefined && pLng !== undefined && cLat !== undefined && cLng !== undefined) {
        travelKm = calculateDistance(pLat, pLng, cLat, cLng);
        travelMins = travelKm === 0 ? 0 : Math.max(10, Math.round(travelKm * 4 + 5));
      }
    }

    const recVisitMins = rec.recommendedVisitDuration || (durationBucket === '2-3 HOURS' ? 60 : 90);
    totalDistanceKm += travelKm;
    totalDurationMinutes += recVisitMins + travelMins;

    return {
      stopOrder: idx + 1,
      recommendation: rec,
      suggestedTimeSlot: config.slots[idx] || `Stop ${idx + 1}`,
      recommendedDurationMinutes: recVisitMins,
      travelFromPreviousKm: Math.round(travelKm * 10) / 10,
      travelFromPreviousMins: travelMins,
    };
  });

  const generatedTitle =
    curatorTitle ||
    `${serviceAreaId.replace('sa-serbia-', '').replace('-', ' ').toUpperCase()} ${durationBucket} Day-Plan`;

  const proposalWithoutFeasibility: ItineraryProposal = {
    id: `plan-draft-${Date.now()}`,
    title: generatedTitle,
    serviceAreaId,
    durationBucket,
    stops,
    totalDurationMinutes,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    publicationStatus: 'DRAFT',
    createdAt: new Date().toISOString(),
    curatorNotes: 'Composed via IDEMO Studio Day-Plan Engine MVP.',
  };

  proposalWithoutFeasibility.feasibilityResult = evaluateDayPlanFeasibility(proposalWithoutFeasibility, budgetLevel);

  return proposalWithoutFeasibility;
}

/**
 * Deterministically evaluates the feasibility of a Day-Plan Itinerary Proposal.
 * Side-effect free & advisory only (curator retains final authority to save/approve).
 */
export function evaluateDayPlanFeasibility(
  proposal: ItineraryProposal,
  requestedBudgetLevel?: 'free' | 'low' | 'moderate' | 'high' | 'exclusive'
): DayPlanFeasibilityResult {
  const warnings: DayPlanFeasibilityWarning[] = [];
  const stops = proposal.stops || [];
  const durationBucket = proposal.durationBucket || 'HALF-DAY';

  let totalExperienceMinutes = 0;
  let totalTransitMinutes = 0;

  const seenIds = new Set<string>();
  let hasDuplicates = false;

  for (const stop of stops) {
    if (!stop) continue;
    const rec = stop.recommendation;
    if (rec) {
      if (seenIds.has(rec.id)) {
        hasDuplicates = true;
      } else {
        seenIds.add(rec.id);
      }

      // Positive publication eligibility invariant check
      if (!isPublishedRecommendation(rec)) {
        warnings.push({
          type: 'NON_PUBLISHED_ITEM_INCLUDED',
          message: `Stop ${stop.stopOrder} ('${rec.title || rec.id}') is not an approved published recommendation.`,
          stopOrder: stop.stopOrder,
        });
      }

      // Missing coordinate check
      const lat = rec.coordinates?.lat ?? rec.coordinateX;
      const lng = rec.coordinates?.lng ?? rec.coordinateY;
      if (lat === undefined || lng === undefined || lat === null || lng === null) {
        warnings.push({
          type: 'MISSING_COORDINATES',
          message: `Stop ${stop.stopOrder} ('${rec.title || 'Untitled'}') has insufficient coordinate data for transit estimation.`,
          stopOrder: stop.stopOrder,
        });
      }

      // Service area escape check
      if (proposal.serviceAreaId && proposal.serviceAreaId !== 'all') {
        const saClean = proposal.serviceAreaId.replace('sa-serbia-', '').toLowerCase();
        const recSaClean = (rec.serviceAreaId || '').replace('sa-serbia-', '').toLowerCase();
        const matchServiceArea =
          recSaClean === saClean ||
          ((rec as any).serviceAreas && (rec as any).serviceAreas.includes(proposal.serviceAreaId)) ||
          (rec.location || '').toLowerCase().includes(saClean);

        if (!matchServiceArea) {
          warnings.push({
            type: 'OUTSIDE_SERVICE_AREA',
            message: `Stop ${stop.stopOrder} ('${rec.title || 'Untitled'}') lies outside requested service area ${proposal.serviceAreaId}.`,
            stopOrder: stop.stopOrder,
          });
        }
      }

      // Budget overflow check
      if (requestedBudgetLevel) {
        if (requestedBudgetLevel === 'free' && rec.budgetLevel && rec.budgetLevel !== 'free') {
          warnings.push({
            type: 'BUDGET_EXCEEDED',
            message: `Stop ${stop.stopOrder} ('${rec.title || 'Untitled'}') exceeds requested free budget level (${rec.budgetLevel}).`,
            stopOrder: stop.stopOrder,
          });
        } else if (
          requestedBudgetLevel === 'low' &&
          rec.budgetLevel &&
          (rec.budgetLevel === 'high' || rec.budgetLevel === 'exclusive')
        ) {
          warnings.push({
            type: 'BUDGET_EXCEEDED',
            message: `Stop ${stop.stopOrder} ('${rec.title || 'Untitled'}') exceeds requested low budget level (${rec.budgetLevel}).`,
            stopOrder: stop.stopOrder,
          });
        }
      }
    }

    totalExperienceMinutes += stop.recommendedDurationMinutes || 60;
    totalTransitMinutes += stop.travelFromPreviousMins || 0;

    // Single leg transit check
    if (
      stop.travelFromPreviousMins > FEASIBILITY_THRESHOLDS.MAX_SINGLE_LEG_TRANSIT_MINS ||
      stop.travelFromPreviousKm > FEASIBILITY_THRESHOLDS.MAX_SINGLE_LEG_TRANSIT_KM
    ) {
      warnings.push({
        type: 'LEG_TOO_LONG',
        message: `Estimated transit to Stop ${stop.stopOrder} is unusually high (${stop.travelFromPreviousKm} km, ~${stop.travelFromPreviousMins} mins).`,
        stopOrder: stop.stopOrder,
      });
    }
  }

  if (hasDuplicates) {
    warnings.push({
      type: 'DUPLICATE_STOPS_DETECTED',
      message: 'Itinerary contains duplicate recommendation stops.',
    });
  }

  // Target stops check
  const targetStops = FEASIBILITY_THRESHOLDS.TARGET_STOPS_PER_BUCKET[durationBucket] || 2;
  if (stops.length < targetStops || stops.length < 2) {
    warnings.push({
      type: 'INSUFFICIENT_STOPS',
      message: `Itinerary contains ${stops.length} stops, below target of ${targetStops} for ${durationBucket}.`,
    });
  }

  // Total buffer minutes (15 mins per transition between stops)
  const totalBufferMinutes = Math.max(0, stops.length - 1) * FEASIBILITY_THRESHOLDS.BUFFER_MINUTES_PER_TRANSITION;
  const totalPlanMinutes = totalExperienceMinutes + totalTransitMinutes + totalBufferMinutes;

  // Plan duration check against duration bucket
  const maxAllowedMins =
    (FEASIBILITY_THRESHOLDS.DURATION_BUCKET_MAX_MINUTES[durationBucket] || 360) +
    (FEASIBILITY_THRESHOLDS.DURATION_BUCKET_ALLOWANCE_BUFFER[durationBucket] || 30);

  if (totalPlanMinutes > maxAllowedMins) {
    warnings.push({
      type: 'PLAN_TOO_LONG',
      message: `Estimated plan duration (${totalPlanMinutes} mins) exceeds the selected ${durationBucket} window (max ${maxAllowedMins} mins).`,
    });
  }

  // Total transit ratio check
  if (totalExperienceMinutes > 0) {
    const transitRatio = totalTransitMinutes / totalExperienceMinutes;
    if (transitRatio > FEASIBILITY_THRESHOLDS.MAX_TOTAL_TRANSIT_RATIO) {
      warnings.push({
        type: 'TRANSIT_TOO_HIGH',
        message: `Total estimated transit (${totalTransitMinutes} mins) accounts for over 40% of experience time.`,
      });
    }
  }

  return {
    feasible: warnings.length === 0,
    warnings,
    totalExperienceMinutes,
    totalTransitMinutes,
    totalBufferMinutes,
    totalPlanMinutes,
  };
}

/**
 * Recalculate an ItineraryProposal after curator stop editing (reorder, remove, replace, add, duration edit).
 * Deterministically updates stopOrder, suggestedTimeSlot, travelFromPreviousKm, travelFromPreviousMins, totalDistanceKm, totalDurationMinutes, and feasibilityResult.
 */
export function recalculateItineraryProposal(
  proposal: ItineraryProposal,
  newStops: DayPlanStop[],
  budgetLevel: 'free' | 'low' | 'moderate' | 'high' | 'exclusive' | undefined = undefined
): ItineraryProposal {
  const durationBucket = proposal.durationBucket;
  const slotConfig = DEFAULT_TIME_SLOTS[durationBucket] || DEFAULT_TIME_SLOTS['HALF-DAY'];
  const slotMap = slotConfig.slots || [];

  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  const recalculatedStops: DayPlanStop[] = newStops.map((s, idx) => {
    const rec = s.recommendation;
    let travelKm = 0;
    let travelMins = 0;

    if (idx > 0) {
      const prevRec = newStops[idx - 1].recommendation;
      const pLat = prevRec.coordinates?.lat ?? prevRec.coordinateX;
      const pLng = prevRec.coordinates?.lng ?? prevRec.coordinateY;
      const cLat = rec.coordinates?.lat ?? rec.coordinateX;
      const cLng = rec.coordinates?.lng ?? rec.coordinateY;

      if (pLat !== undefined && pLng !== undefined && cLat !== undefined && cLng !== undefined) {
        travelKm = calculateDistance(pLat, pLng, cLat, cLng);
        travelMins = travelKm === 0 ? 0 : Math.max(10, Math.round(travelKm * 4 + 5));
      }
    }

    const durMins = Math.max(15, Math.min(300, Number(s.recommendedDurationMinutes) || 45));
    totalDistanceKm += travelKm;
    totalDurationMinutes += durMins + travelMins;

    return {
      stopOrder: idx + 1,
      recommendation: rec,
      suggestedTimeSlot: slotMap[idx] || `Stop ${idx + 1}`,
      recommendedDurationMinutes: durMins,
      travelFromPreviousKm: Math.round(travelKm * 10) / 10,
      travelFromPreviousMins: travelMins,
    };
  });

  const updatedProposal: ItineraryProposal = {
    ...proposal,
    stops: recalculatedStops,
    totalDurationMinutes,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
  };

  updatedProposal.feasibilityResult = evaluateDayPlanFeasibility(updatedProposal, budgetLevel);
  return updatedProposal;
}
