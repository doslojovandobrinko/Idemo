/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Visitor Resolution Rate Coordinator
 * Centralized, deterministic rate-budget manager ensuring that visitor_resolution
 * network requests across all application components never exceed the backend limit:
 * MAXIMUM 5 requests per visitor credential per rolling 15-minute window.
 *
 * Distinguishes request capability:
 * - STATUS: Lightweight status check (App shell background sync)
 * - PROPOSAL: Full proposal retrieval (PlanCard view / manual check)
 */

import { safeStorage } from './safeStorage';

const STORAGE_KEY_TIMESTAMPS = 'idemo_visitor_req_timestamps_v1';

// Server rolling window configuration
const ROLLING_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
// Hard cap: maximum 4 requests per rolling 15m window across all components and request types
// Leaving 1 guaranteed request safety margin so client NEVER reaches the 5-request server limit
const MAX_REQUESTS_PER_WINDOW = 4;

// Cooldown intervals per request kind and role
const MIN_INTERVAL_STATUS_BACKGROUND_MS = 8 * 60 * 1000; // 8 minutes between background status checks for same inquiry
const MIN_INTERVAL_PROPOSAL_AUTO_MS = 3 * 60 * 1000; // 3 minutes between auto proposal fetches on PlanCard mount
const MIN_INTERVAL_PROPOSAL_MANUAL_MS = 30 * 1000; // 30 seconds between manual "CHECK STATUS" proposal checks
const MIN_SAME_KIND_INTERVAL_MS = 15 * 1000; // 15 seconds minimum between identical kind requests for same inquiry

export type VisitorRequestRole = 'background' | 'plan_auto' | 'plan_manual';
export type VisitorRequestKind = 'STATUS' | 'PROPOSAL';

export interface CoordinatedRequestResult<T> {
  success: boolean;
  executed: boolean;
  data?: T;
  rateLimited?: boolean;
  inFlightSkipped?: boolean;
  cooldownSkipped?: boolean;
  reason?: string;
}

interface InquiryLedgerRecord {
  allTimestamps: number[];
  lastStatusAt?: number;
  lastProposalAt?: number;
}

// In-flight mutex per inquiry: holds the active promise and what kind it is
const inFlightRequests = new Map<string, { promise: Promise<any>; kind: VisitorRequestKind }>();

// In-memory timestamps cache + safeStorage persistence with backward compatibility
function getInquiryLedger(inquiryId: string): InquiryLedgerRecord {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_TIMESTAMPS);
    if (!raw) return { allTimestamps: [] };
    const parsed = JSON.parse(raw);
    const item = parsed[inquiryId];
    if (!item) return { allTimestamps: [] };

    const now = Date.now();

    // Backward compatibility: if item was just an array of timestamps [number, number]
    if (Array.isArray(item)) {
      const validTimestamps = item.filter((t: number) => now - t < ROLLING_WINDOW_MS);
      return {
        allTimestamps: validTimestamps,
        lastStatusAt: undefined,
        lastProposalAt: undefined,
      };
    }

    // New format: { allTimestamps: number[], lastStatusAt?: number, lastProposalAt?: number }
    const timestamps = (item.allTimestamps || []).filter((t: number) => now - t < ROLLING_WINDOW_MS);
    return {
      allTimestamps: timestamps,
      lastStatusAt: item.lastStatusAt,
      lastProposalAt: item.lastProposalAt,
    };
  } catch (err) {
    return { allTimestamps: [] };
  }
}

function saveInquiryLedger(inquiryId: string, record: InquiryLedgerRecord): void {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_TIMESTAMPS);
    let store: Record<string, any> = {};
    if (raw) {
      try {
        store = JSON.parse(raw);
      } catch (e) {
        store = {};
      }
    }
    const now = Date.now();
    // Prune all inquiries' timestamps
    for (const id of Object.keys(store)) {
      const entry = store[id];
      if (Array.isArray(entry)) {
        store[id] = entry.filter((t: number) => now - t < ROLLING_WINDOW_MS);
      } else if (entry && entry.allTimestamps) {
        entry.allTimestamps = entry.allTimestamps.filter((t: number) => now - t < ROLLING_WINDOW_MS);
      }
    }

    store[inquiryId] = {
      allTimestamps: record.allTimestamps.filter((t: number) => now - t < ROLLING_WINDOW_MS),
      lastStatusAt: record.lastStatusAt,
      lastProposalAt: record.lastProposalAt,
    };

    safeStorage.setItem(STORAGE_KEY_TIMESTAMPS, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to persist visitor request ledger:', err);
  }
}

// In-memory role-specific last execution tracker
const lastExecutionByRole: Record<string, Record<VisitorRequestRole, number>> = {};

function getLastRoleTimestamp(inquiryId: string, role: VisitorRequestRole): number {
  return lastExecutionByRole[inquiryId]?.[role] || 0;
}

function setLastRoleTimestamp(inquiryId: string, role: VisitorRequestRole, timestamp: number): void {
  if (!lastExecutionByRole[inquiryId]) {
    lastExecutionByRole[inquiryId] = {
      background: 0,
      plan_auto: 0,
      plan_manual: 0,
    };
  }
  lastExecutionByRole[inquiryId][role] = timestamp;
}

/**
 * Checks whether a visitor request of a specific kind and role can be executed within the server budget.
 */
export function canExecuteVisitorRequest(
  inquiryId: string,
  role: VisitorRequestRole,
  kind: VisitorRequestKind
): { allowed: boolean; reason?: string; inFlightPromise?: Promise<any>; inFlightKind?: VisitorRequestKind } {
  if (!inquiryId) {
    return { allowed: false, reason: 'Missing inquiry ID' };
  }

  // 1. Check in-flight lock
  const activeInFlight = inFlightRequests.get(inquiryId);
  if (activeInFlight) {
    return {
      allowed: false,
      reason: `Request (${activeInFlight.kind}) already in flight for this inquiry`,
      inFlightPromise: activeInFlight.promise,
      inFlightKind: activeInFlight.kind,
    };
  }

  const now = Date.now();
  const ledger = getInquiryLedger(inquiryId);

  // 2. Hard budget check: rolling 15-minute window across ALL request kinds
  if (ledger.allTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = ledger.allTimestamps[0];
    const waitSeconds = Math.ceil((ROLLING_WINDOW_MS - (now - oldestTimestamp)) / 1000);
    return {
      allowed: false,
      reason: `Rate budget limit reached (max ${MAX_REQUESTS_PER_WINDOW}/15m). Available in ${waitSeconds}s`,
    };
  }

  // 3. Capability / Kind-specific Freshness Checks
  if (kind === 'STATUS') {
    // STATUS request: Check if STATUS was fetched very recently
    if (ledger.lastStatusAt && (now - ledger.lastStatusAt < MIN_SAME_KIND_INTERVAL_MS)) {
      return { allowed: false, reason: 'Status fetched very recently' };
    }

    if (role === 'background') {
      const lastRoleTime = getLastRoleTimestamp(inquiryId, 'background');
      if (now - lastRoleTime < MIN_INTERVAL_STATUS_BACKGROUND_MS) {
        return { allowed: false, reason: 'Background status sync cooldown active (8m)' };
      }
      // If status was already retrieved in last 5m by any status call, skip background check
      if (ledger.lastStatusAt && (now - ledger.lastStatusAt < 5 * 60 * 1000)) {
        return { allowed: false, reason: 'Status already fresh' };
      }
    }
  } else if (kind === 'PROPOSAL') {
    // PROPOSAL request: A recent STATUS check must NOT block a PROPOSAL fetch.
    // Check if PROPOSAL was already fetched recently.
    if (ledger.lastProposalAt && (now - ledger.lastProposalAt < MIN_SAME_KIND_INTERVAL_MS)) {
      return { allowed: false, reason: 'Proposal fetched very recently' };
    }

    if (role === 'plan_auto') {
      const lastRoleTime = getLastRoleTimestamp(inquiryId, 'plan_auto');
      if (now - lastRoleTime < MIN_INTERVAL_PROPOSAL_AUTO_MS) {
        return { allowed: false, reason: 'PlanCard auto-sync cooldown active (3m)' };
      }
      // If proposal was already fetched in last 2m, auto-sync is redundant
      if (ledger.lastProposalAt && (now - ledger.lastProposalAt < 2 * 60 * 1000)) {
        return { allowed: false, reason: 'Proposal already fresh' };
      }
    } else if (role === 'plan_manual') {
      const lastRoleTime = getLastRoleTimestamp(inquiryId, 'plan_manual');
      if (now - lastRoleTime < MIN_INTERVAL_PROPOSAL_MANUAL_MS) {
        return { allowed: false, reason: 'Manual check cooldown active (30s)' };
      }
    }
  }

  return { allowed: true };
}

/**
 * Executes a network request wrapped in centralized concurrency lock, kind-specific freshness, and rate-budget ledger.
 */
export async function executeCoordinatedVisitorRequest<T>(
  inquiryId: string,
  role: VisitorRequestRole,
  kind: VisitorRequestKind,
  requestFn: () => Promise<T>
): Promise<CoordinatedRequestResult<T>> {
  let check = canExecuteVisitorRequest(inquiryId, role, kind);

  // If another request for this inquiry is currently in flight:
  if (!check.allowed && check.inFlightPromise) {
    if (check.inFlightKind === kind) {
      // SAME-KIND COALESCING:
      // A request of the exact same kind is already in flight.
      // Await it and safely return the typed data without duplicate network calls.
      try {
        const inFlightResult = await check.inFlightPromise;
        return {
          success: true,
          executed: true,
          data: inFlightResult as T,
        };
      } catch (err: any) {
        return {
          success: false,
          executed: false,
          inFlightSkipped: true,
          reason: check.reason,
        };
      }
    } else {
      // CROSS-KIND CONCURRENCY:
      // A different capability (e.g. STATUS when PROPOSAL is requested, or vice versa) is in flight.
      // 1. Wait for the active foreign-kind request to finish cleanly.
      try {
        await check.inFlightPromise;
      } catch (ignored) {
        // Even if the first request fails, continue to independent re-evaluation.
      }

      // 2. Re-evaluate eligibility for the requested kind under updated budget and freshness.
      check = canExecuteVisitorRequest(inquiryId, role, kind);
      if (!check.allowed) {
        return {
          success: false,
          executed: false,
          rateLimited: check.reason?.includes('Rate budget'),
          inFlightSkipped: check.reason?.includes('in flight'),
          cooldownSkipped: check.reason?.includes('cooldown') || check.reason?.includes('recently') || check.reason?.includes('fresh'),
          reason: check.reason,
        };
      }
      // If eligible, execution proceeds below to execute caller's own requestFn().
    }
  } else if (!check.allowed) {
    return {
      success: false,
      executed: false,
      rateLimited: check.reason?.includes('Rate budget'),
      inFlightSkipped: check.reason?.includes('in flight'),
      cooldownSkipped: check.reason?.includes('cooldown') || check.reason?.includes('recently') || check.reason?.includes('fresh'),
      reason: check.reason,
    };
  }

  const now = Date.now();
  setLastRoleTimestamp(inquiryId, role, now);

  const requestPromise = (async () => {
    try {
      const data = await requestFn();
      const completionTime = Date.now();
      
      // Update persistent ledger with kind-specific timestamp and increment rolling count
      const ledger = getInquiryLedger(inquiryId);
      ledger.allTimestamps.push(completionTime);
      if (kind === 'STATUS') {
        ledger.lastStatusAt = completionTime;
      } else if (kind === 'PROPOSAL') {
        ledger.lastProposalAt = completionTime;
      }
      saveInquiryLedger(inquiryId, ledger);

      return data;
    } catch (err: any) {
      const completionTime = Date.now();
      // Record failed attempt in sliding-window ledger to protect backend from retry bursts
      const ledger = getInquiryLedger(inquiryId);
      ledger.allTimestamps.push(completionTime);
      if (kind === 'STATUS') {
        ledger.lastStatusAt = completionTime;
      } else if (kind === 'PROPOSAL') {
        ledger.lastProposalAt = completionTime;
      }
      saveInquiryLedger(inquiryId, ledger);

      throw err;
    } finally {
      inFlightRequests.delete(inquiryId);
    }
  })();

  inFlightRequests.set(inquiryId, { promise: requestPromise, kind });

  try {
    const data = await requestPromise;
    return { success: true, executed: true, data };
  } catch (err: any) {
    return { success: false, executed: true, reason: err?.message || 'Network error' };
  }
}
