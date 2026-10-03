/**
 * IDEMO 007 V2 - Decision Telemetry & Diagnostic Logging
 * Logs deterministic diagnostic metrics without storing sensitive curator input.
 */

import { LookupDecision, BuildFactPackInput, DecisionTelemetryLog } from '../../types/idemo007v2';

export function createDecisionTelemetryLog(
  decision: LookupDecision,
  input: BuildFactPackInput,
  conflictCount: number = 0,
  runId?: string
): DecisionTelemetryLog {
  return {
    runId: runId || `run-${Date.now()}`,
    recommendationType: input.recommendationType,
    decisionOutcome: decision.outcome,
    reasonCodes: decision.reasons,
    missingFactCount: decision.missingFacts.length,
    staleFactCount: decision.staleFacts.length,
    conflictCount,
    searchNeeded: decision.searchNeeds.length > 0,
    mapsNeeded: decision.mapsNeeds.length > 0,
    curatorReviewNeeded: decision.curatorReviewNeeds.length > 0,
    timestamp: new Date().toISOString(),
  };
}

export function logDecisionTelemetry(
  decision: LookupDecision,
  input: BuildFactPackInput,
  conflictCount: number = 0,
  runId?: string
): DecisionTelemetryLog {
  const telemetry = createDecisionTelemetryLog(decision, input, conflictCount, runId);
  // Log structured JSON to console for backend observability
  console.log(`[IDEMO_007_V2_DECISION_TELEMETRY] ${JSON.stringify(telemetry)}`);
  return telemetry;
}
