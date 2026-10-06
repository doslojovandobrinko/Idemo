/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Controlled Verification Suite for Proposal Polling and Rate Coordination Fix
 */

import {
  canExecuteVisitorRequest,
  executeCoordinatedVisitorRequest,
} from '../lib/visitorRateCoordinator';
import { safeStorage } from '../lib/safeStorage';
import {
  checkHasUnreadProposals,
  updateInquiryCachedProposalV2,
  updateInquiryServerStatusV2,
  markProposalAsSeen,
} from '../lib/inquiryStorage';
import { parseRetryAfter } from '../lib/inquiryService';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runProposalPollingVerificationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const inqId = '635840e0-05aa-4d8f-8db4-0a37312df1c5';

  // Helper to reset test state
  function resetStorage() {
    safeStorage.removeItem('idemo_visitor_req_timestamps_v1');
    safeStorage.removeItem('idemo_inquiries_v2');
    safeStorage.removeItem('idemo_seen_proposals_v1');
  }

  // TEST 1: Proposal checks permit 60 scheduled polls over 15 minutes (plus boundary test)
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    let successfulPolls = 0;
    try {
      // Execute 60 polls at 11-second intervals = 660s (within 15m = 900s)
      for (let i = 0; i < 60; i++) {
        fakeTime += 11000;
        const res = await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'PROPOSAL',
          async () => ({ success: true, proposal_found: false }),
          true
        );
        if (res.executed && res.success) {
          successfulPolls++;
        }
      }

      // Add 20 foreground triggers (refocus / screen changes) spaced by 8 seconds = 160s (total elapsed 820s < 900s)
      for (let i = 0; i < 20; i++) {
        fakeTime += 8000;
        const res = await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'PROPOSAL',
          async () => ({ success: true, proposal_found: false }),
          true
        );
        if (res.executed && res.success) {
          successfulPolls++;
        }
      }

      // At 80 requests within 820s (< 900s 15-minute window), the 81st request must be bounded
      fakeTime += 2000;
      const boundedCheck = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      results.push({
        testId: 'PPV-01',
        name: 'Permits 60 scheduled polls + 20 headroom across rolling 15m window',
        expected: '80 successful polls, then rate bounded at 81',
        actual: `${successfulPolls} successful polls, bounded: ${!boundedCheck.allowed} (${boundedCheck.reason})`,
        passed: successfulPolls === 80 && !boundedCheck.allowed,
      });

      // Window boundary check: Advance time by 16 minutes from the start so oldest timestamps roll off
      fakeTime += 16 * 60 * 1000;
      const afterWindowCheck = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);
      results.push({
        testId: 'PPV-02',
        name: 'Rolling window rolls off timestamps allowing continued polling across window boundary',
        expected: 'allowed === true after window expiration',
        actual: `allowed === ${afterWindowCheck.allowed}`,
        passed: afterWindowCheck.allowed === true,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 2: Proposal arriving at approximately 3 minutes (t = 180s) is fetched and activates unread red dot
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // Seed visitor inquiry
      safeStorage.setItem(
        'idemo_inquiries_v2',
        JSON.stringify([
          {
            local_queue_id: 'queue_uvac',
            server_inquiry_id: inqId,
            recommendation_id: '4862aa0f-686c-491e-a81a-d9ded2c7a156',
            recommendation_title: 'Uvac Meanders',
            status: 'submitted',
            public_reference_code: 'IDM-510-RGN',
          },
        ])
      );

      // Verify unread proposal is false initially
      const initialUnread = checkHasUnreadProposals();

      // Poll at 15s intervals for 12 cycles (12 * 15s = 180s = 3 minutes)
      for (let i = 0; i < 12; i++) {
        fakeTime += 15000;
        await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'PROPOSAL',
          async () => ({ success: true, proposal_found: false }),
          true
        );
      }

      // At t = 195s (3m 15s), partner proposal arrives from UNO1
      fakeTime += 15000;
      const delayedProposalResult = await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({
          success: true,
          proposal_found: true,
          match_id: 'dbec9268-b022-464c-a19a-12053b6e02a2',
          response_id: 'resp_uno1_uvac',
          response_type: 'accept_as_requested',
          message: 'Proposal confirmed for October 22, 2026 at 14:00',
        }),
        true
      );

      let unreadAfterProposal = false;
      if (delayedProposalResult.executed && delayedProposalResult.success && delayedProposalResult.data) {
        const prop = delayedProposalResult.data;
        updateInquiryCachedProposalV2(inqId, {
          schema_version: 1,
          match_id: prop.match_id,
          response_id: prop.response_id,
          response_type: prop.response_type,
          message: prop.message,
          cached_at: fakeTime,
        });
        updateInquiryServerStatusV2(inqId, 'Waiting for confirmation');
        unreadAfterProposal = checkHasUnreadProposals();
      }

      results.push({
        testId: 'PPV-03',
        name: 'Proposal arriving at 3 minutes is executed and produces unread state',
        expected: 'initialUnread === false, delayed poll executed === true, unreadAfterProposal === true',
        actual: `initial: ${initialUnread}, executed: ${delayedProposalResult.executed}, unread: ${unreadAfterProposal}`,
        passed: !initialUnread && delayedProposalResult.executed && unreadAfterProposal,
      });

      // Confirming seen proposal clears unread state
      markProposalAsSeen(inqId, 'dbec9268-b022-464c-a19a-12053b6e02a2_resp_uno1_uvac');
      const unreadAfterSeen = checkHasUnreadProposals();
      results.push({
        testId: 'PPV-04',
        name: 'Marking proposal as seen clears unread state cleanly',
        expected: 'unreadAfterSeen === false',
        actual: `unreadAfterSeen: ${unreadAfterSeen}`,
        passed: unreadAfterSeen === false,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 3: Rapid refocus / navigation does not send duplicate requests (15s minimum spacing)
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // First poll at t = 0
      const poll1 = await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({ success: true }),
        true
      );

      // Rapid tab refocus 2 seconds later
      fakeTime += 2000;
      const rapidRefocusCheck = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      // Refocus after 15 seconds
      fakeTime += 14000;
      const legitimateRefocusCheck = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      results.push({
        testId: 'PPV-05',
        name: 'Navigation / refocus within 15s is debounced, avoiding duplicated server load',
        expected: 'Rapid (2s) blocked, legitimate (16s) allowed',
        actual: `Rapid: ${rapidRefocusCheck.allowed} (${rapidRefocusCheck.reason}), Legitimate: ${legitimateRefocusCheck.allowed}`,
        passed: !rapidRefocusCheck.allowed && legitimateRefocusCheck.allowed,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 4: Sensitive / non-proposal operations preserve strict rate limits (max 4 per 15m)
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      let mutationCount = 0;
      for (let i = 0; i < 4; i++) {
        fakeTime += 20000;
        const res = await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'STATUS',
          async () => ({ success: true }),
          true
        );
        if (res.executed) mutationCount++;
      }

      fakeTime += 20000;
      const fifthCheck = canExecuteVisitorRequest(inqId, 'background', 'STATUS', true);

      results.push({
        testId: 'PPV-06',
        name: 'Non-proposal operations preserve strict rate limit of 4 per 15 minutes',
        expected: '4 executions allowed, 5th check blocked',
        actual: `Executed: ${mutationCount}, 5th allowed: ${fifthCheck.allowed} (${fifthCheck.reason})`,
        passed: mutationCount === 4 && !fifthCheck.allowed,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 5: Concurrent same-inquiry calls produce exactly ONE network request (in-flight coalescing)
  {
    resetStorage();
    let networkCallCount = 0;
    let resolveNetwork: (val: any) => void;
    const networkPromise = new Promise((resolve) => {
      resolveNetwork = resolve;
    });

    const requestFn = () => {
      networkCallCount++;
      return networkPromise;
    };

    // Dispatch 3 concurrent requests simultaneously for the same inquiry
    const p1 = executeCoordinatedVisitorRequest(inqId, 'background', 'PROPOSAL', requestFn, true);
    const p2 = executeCoordinatedVisitorRequest(inqId, 'plan_auto', 'PROPOSAL', requestFn, true);
    const p3 = executeCoordinatedVisitorRequest(inqId, 'plan_manual', 'PROPOSAL', requestFn, true);

    // Resolve underlying network call
    resolveNetwork!({ success: true, proposal_found: false });
    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    results.push({
      testId: 'PPV-07',
      name: 'Concurrent same-inquiry calls coalesce into exactly one network request',
      expected: 'networkCallCount === 1, all 3 promises resolve success',
      actual: `networkCalls: ${networkCallCount}, r1: ${res1.success}, r2: ${res2.success}, r3: ${res3.success}`,
      passed: networkCallCount === 1 && res1.success && res2.success && res3.success,
    });
  }

  // TEST 6: HTTP 429 Retry-After metadata honored and cooldown expires cleanly with controlled clock
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // Simulate backend returning 429 with retry_after: 60 seconds
      await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED: Too many requests.',
          retryAfter: 60,
        }),
        true
      );

      // Immediately afterwards (t = 10s), check should be blocked by cooldown
      fakeTime += 10000;
      const blockedDuringCooldown = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      // Advance clock past the 60s cooldown (t = 65s)
      fakeTime += 55000;
      const allowedAfterCooldown = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      results.push({
        testId: 'PPV-08',
        name: 'Honors server Retry-After metadata and allows requests after cooldown expiry',
        expected: 'blockedDuringCooldown === false, allowedAfterCooldown === true',
        actual: `during: ${blockedDuringCooldown.allowed} (${blockedDuringCooldown.reason}), after: ${allowedAfterCooldown.allowed}`,
        passed: !blockedDuringCooldown.allowed && allowedAfterCooldown.allowed,
      });

      // Bounded fallback test: If error has no retryAfter, defaults to ROLLING_WINDOW_MS
      await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({
          success: false,
          error: 'Too many requests. Please slow down.',
        }),
        true
      );
      fakeTime += 60000; // 1 minute later
      const blockedUnderFallback = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);
      fakeTime += 15 * 60 * 1000; // 15 minutes later (exceeding fallback cooldown)
      const allowedAfterFallback = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      results.push({
        testId: 'PPV-09',
        name: 'Bounded fallback to 15m cooldown when server supplies no Retry-After',
        expected: 'blocked at 1m, allowed after 15m',
        actual: `at 1m: ${blockedUnderFallback.allowed}, after 15m: ${allowedAfterFallback.allowed}`,
        passed: !blockedUnderFallback.allowed && allowedAfterFallback.allowed,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 7: Mixed read and mutation behavior: read polling does NOT exhaust or block mutation allowance
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // Execute 30 read checks
      let readCount = 0;
      for (let i = 0; i < 30; i++) {
        fakeTime += 15000;
        const res = await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'PROPOSAL',
          async () => ({ success: true }),
          true
        );
        if (res.executed) readCount++;
      }

      // Verify that after 30 read checks, a mutation (STATUS/mutation role) is STILL fully permitted
      const mutationCheck1 = canExecuteVisitorRequest(inqId, 'background', 'STATUS', true);
      let mutationCount = 0;
      for (let i = 0; i < 4; i++) {
        fakeTime += 20000;
        const res = await executeCoordinatedVisitorRequest(
          inqId,
          'background',
          'STATUS',
          async () => ({ success: true }),
          true
        );
        if (res.executed) mutationCount++;
      }

      results.push({
        testId: 'PPV-10',
        name: 'High read polling traffic does not exhaust or block mutation budget',
        expected: 'readCount === 30, mutationCheck1.allowed === true, mutationCount === 4',
        actual: `reads: ${readCount}, mutationAllowed: ${mutationCheck1.allowed}, mutations: ${mutationCount}`,
        passed: readCount === 30 && mutationCheck1.allowed && mutationCount === 4,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 8: Server cooldown longer than 15 minutes is respected in full (NOT shortened to 15m)
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // Simulate backend returning 429 with Retry-After: 1800 seconds (30 minutes)
      await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED: Extended maintenance.',
          retryAfter: 1800, // 30 minutes
        }),
        true
      );

      // At t = 16 minutes (longer than 15m window!), request MUST STILL be blocked because server requested 30m
      fakeTime += 16 * 60 * 1000;
      const blockedAt16m = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      // At t = 31 minutes, cooldown has expired and request must be allowed
      fakeTime += 15 * 60 * 1000;
      const allowedAt31m = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);

      results.push({
        testId: 'PPV-11',
        name: 'Server cooldown >15m (1800s) is respected in full and not truncated to 15m',
        expected: 'blocked at 16m === true, allowed at 31m === true',
        actual: `at 16m blocked: ${!blockedAt16m.allowed} (${blockedAt16m.reason}), at 31m allowed: ${allowedAt31m.allowed}`,
        passed: !blockedAt16m.allowed && allowedAt31m.allowed,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 9: Read-specific proposal cooldown does NOT block unrelated mutations or status requests
  {
    resetStorage();
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      // PROPOSAL endpoint receives 429 with 600s cooldown
      await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'PROPOSAL',
        async () => ({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED: Proposal rate limit.',
          retryAfter: 600,
        }),
        true
      );

      fakeTime += 5000;
      // PROPOSAL check is blocked
      const proposalBlocked = canExecuteVisitorRequest(inqId, 'background', 'PROPOSAL', true);
      // But STATUS / mutation check is STILL ALLOWED (isolated cooldown)
      const statusAllowed = canExecuteVisitorRequest(inqId, 'background', 'STATUS', true);
      const statusExec = await executeCoordinatedVisitorRequest(
        inqId,
        'background',
        'STATUS',
        async () => ({ success: true, status: 'awaiting_visitor' }),
        true
      );

      results.push({
        testId: 'PPV-12',
        name: 'Read-specific proposal cooldown does not block unrelated status or mutation requests',
        expected: 'proposalBlocked === false, statusAllowed === true, statusExec.success === true',
        actual: `proposalAllowed: ${proposalBlocked.allowed}, statusAllowed: ${statusAllowed.allowed}, statusExec: ${statusExec.success}`,
        passed: !proposalBlocked.allowed && statusAllowed.allowed && statusExec.success,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  // TEST 10: In-flight coalescing does NOT merge cross-kind operations (e.g. PROPOSAL vs STATUS)
  {
    resetStorage();
    let proposalNetworkCalls = 0;
    let statusNetworkCalls = 0;

    let resolveProposal: (val: any) => void;
    const proposalPromise = new Promise((resolve) => {
      resolveProposal = resolve;
    });

    let resolveStatus: (val: any) => void;
    const statusPromise = new Promise((resolve) => {
      resolveStatus = resolve;
    });

    // Start a PROPOSAL request that stays in flight
    const pProposal = executeCoordinatedVisitorRequest(
      inqId,
      'background',
      'PROPOSAL',
      () => {
        proposalNetworkCalls++;
        return proposalPromise;
      },
      true
    );

    // Simultaneously dispatch a STATUS request for the same inquiry
    const pStatus = executeCoordinatedVisitorRequest(
      inqId,
      'background',
      'STATUS',
      () => {
        statusNetworkCalls++;
        return statusPromise;
      },
      true
    );

    // Resolve both independently
    resolveProposal!({ success: true, proposal_found: true, match_id: 'm1' });
    resolveStatus!({ success: true, status: 'confirmed' });

    const [resProp, resStat] = await Promise.all([pProposal, pStatus]);

    results.push({
      testId: 'PPV-13',
      name: 'Cross-kind in-flight operations do not merge or return incorrect data types',
      expected: 'proposalNetworkCalls === 1, statusNetworkCalls === 1, resProp.data !== resStat.data',
      actual: `propCalls: ${proposalNetworkCalls}, statCalls: ${statusNetworkCalls}, propData: ${(resProp.data as any)?.match_id}, statData: ${(resStat.data as any)?.status}`,
      passed:
        proposalNetworkCalls === 1 &&
        statusNetworkCalls === 1 &&
        (resProp.data as any)?.match_id === 'm1' &&
        (resStat.data as any)?.status === 'confirmed',
    });
  }

  // TEST 11: parseRetryAfter correctly parses numeric seconds, HTTP-date, and body fallback
  {
    const originalNow = Date.now;
    let fakeTime = 1700000000000;
    Date.now = () => fakeTime;

    try {
      const parsedSec = parseRetryAfter('120');
      const dateTarget = new Date(fakeTime + 300000).toUTCString();
      const parsedDate = parseRetryAfter(dateTarget);
      const parsedBody = parseRetryAfter(null, 45);
      const parsedInvalid = parseRetryAfter('invalid-string');

      results.push({
        testId: 'PPV-14',
        name: 'parseRetryAfter handles decimal integer seconds, RFC 9110 HTTP-date, and body fallback',
        expected: 'sec === 120, date === 300, body === 45, invalid === undefined',
        actual: `sec: ${parsedSec}, date: ${parsedDate}, body: ${parsedBody}, invalid: ${parsedInvalid}`,
        passed: parsedSec === 120 && parsedDate === 300 && parsedBody === 45 && parsedInvalid === undefined,
      });
    } finally {
      Date.now = originalNow;
    }
  }

  resetStorage();
  return results;
}
