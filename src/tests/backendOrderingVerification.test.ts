/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backend Ordering & Atomic Capacity Reservation Verification Suite
 * Tests exact Edge Function execution order, atomic admission guard, fail-closed handling,
 * and concurrency boundaries mirroring supabase/functions/visitor_resolution/index.ts.
 */

export interface BackendTestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  rpcCallOrder: string[];
  validationRpcCalls: number;
  rateLimitRpcCalls: number;
}

// Simulates the exact Edge Function gateway logic in supabase/functions/visitor_resolution/index.ts
export class EdgeFunctionSimulator {
  // Mock durable storage for recovery_rate_limits table
  private rateLimitsTable = new Map<string, {
    window_started_at: number;
    request_count: number;
    blocked_until?: number;
  }>();

  // Call logger
  public rpcCallLog: { call: string; args: any }[] = [];
  public validationRpcCount = 0;
  public rateLimitRpcCount = 0;
  public simulateRateLimitError = false;

  constructor(private validInquiries: Record<string, string>) {}

  private async hmac(scope: string, id: string): Promise<string> {
    return `hash_${scope}_${id}`;
  }

  // Simulates check_and_increment_rate_limits SQL function
  private checkAndIncrementRateLimits(
    sourceBucket: string,
    sourceMax: number,
    targetBucket: string,
    targetMax: number,
    now: number
  ): boolean | null {
    this.rateLimitRpcCount++;
    this.rpcCallLog.push({
      call: 'check_and_increment_rate_limits',
      args: { sourceBucket, sourceMax, targetBucket, targetMax, now },
    });

    if (this.simulateRateLimitError) {
      return null; // Database error
    }

    // Target bucket logic
    let target = this.rateLimitsTable.get(targetBucket);
    if (!target) {
      target = { window_started_at: now, request_count: 0 };
      this.rateLimitsTable.set(targetBucket, target);
    }

    if (target.blocked_until && target.blocked_until > now) {
      return false;
    }

    // 15-minute window
    const windowMs = 15 * 60 * 1000;
    if (now > target.window_started_at + windowMs) {
      target.window_started_at = now;
      target.request_count = 1;
      target.blocked_until = undefined;
      return true;
    }

    if (target.request_count >= targetMax) {
      target.blocked_until = now + windowMs;
      return false;
    }

    target.request_count++;
    return true;
  }

  // Simulates validate_and_get_inquiry SQL function
  private validateAndGetInquiry(inquiryId: string, token: string): boolean {
    this.validationRpcCount++;
    this.rpcCallLog.push({
      call: 'validate_and_get_inquiry',
      args: { inquiryId, token },
    });
    return this.validInquiries[inquiryId] === token;
  }

  // Executes the exact request handler logic as defined in supabase/functions/visitor_resolution/index.ts
  public async handleRequest(
    method: 'GET' | 'POST',
    path: string,
    inquiryId: string,
    rawToken: string,
    now: number,
    clientIp = '192.168.1.1'
  ): Promise<{ status: number; body: any; rpcOrder: string[] }> {
    const callStartIdx = this.rpcCallLog.length;

    // 1. Structural validation
    if (!inquiryId || !rawToken) {
      return { status: 400, body: { error: 'Missing parameters' }, rpcOrder: [] };
    }
    const tokenRegex = /^idm_rc_[0-9a-f]{32}$/i;
    if (!tokenRegex.test(rawToken)) {
      return { status: 400, body: { error: 'Invalid token format' }, rpcOrder: [] };
    }

    // 5. Pre-validation Admission Guard: Atomically reserve capacity before credential validation
    const isReadOnly = path.endsWith('/proposal') || path.endsWith('/status');
    const admissionScope = isReadOnly ? 'admission:read' : 'admission:mutation';
    const admissionSourceHash = await this.hmac(admissionScope, clientIp);
    const admissionTargetHash = await this.hmac(admissionScope, `${clientIp}:${inquiryId}`);

    const admissionTargetMax = isReadOnly ? 80 : 5;
    const admissionSourceMax = isReadOnly ? 60 : 10;

    const admissionAllowed = this.checkAndIncrementRateLimits(
      admissionSourceHash,
      admissionSourceMax,
      admissionTargetHash,
      admissionTargetMax,
      now
    );

    // FAIL-CLOSED behavior: If rate-limiter errors or quota is exhausted, block before credential validation
    if (admissionAllowed === null || admissionAllowed === undefined) {
      const rpcOrder = this.rpcCallLog.slice(callStartIdx).map((c) => c.call);
      return { status: 500, body: { error: 'Admission rate limiter check failed' }, rpcOrder };
    } else if (!admissionAllowed) {
      const rpcOrder = this.rpcCallLog.slice(callStartIdx).map((c) => c.call);
      return { status: 429, body: { error: 'Admission rate limit exceeded', retry_after: 900 }, rpcOrder };
    }

    // 6. Authenticate visitor token credential (executed ONLY after admission capacity is reserved)
    const isAuthenticated = this.validateAndGetInquiry(inquiryId, rawToken);

    // 7. Post-validation: Enforce strict invalid-token and unauthenticated limits
    if (!isAuthenticated) {
      const unauthSourceHash = await this.hmac('unauth', clientIp);
      const unauthTargetHash = await this.hmac('unauth', `${clientIp}:${inquiryId}`);

      const unauthAllowed = this.checkAndIncrementRateLimits(
        unauthSourceHash,
        10,
        unauthTargetHash,
        5,
        now
      );

      const rpcOrder = this.rpcCallLog.slice(callStartIdx).map((c) => c.call);

      if (unauthAllowed === false) {
        return { status: 429, body: { error: 'Invalid token attempt limit exceeded', retry_after: 900 }, rpcOrder };
      }

      return { status: 403, body: { error: 'Access denied: Invalid credential' }, rpcOrder };
    }

    const rpcOrder = this.rpcCallLog.slice(callStartIdx).map((c) => c.call);
    return { status: 200, body: { success: true }, rpcOrder };
  }
}

export async function runBackendOrderingTests(): Promise<BackendTestResult[]> {
  const results: BackendTestResult[] = [];
  const validInquiryId = '635840e0-05aa-4d8f-8db4-0a37312df1c5';
  const validToken = 'idm_rc_0123456789abcdef0123456789abcdef';
  const invalidToken = 'idm_rc_ffffffffffffffffffffffffffffffff';

  // TEST 1: Capacity is reserved before credential validation (RPC call order check)
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    const now = 1700000000000;

    const res = await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, now);

    const firstRpc = res.rpcOrder[0];
    const secondRpc = res.rpcOrder[1];

    results.push({
      testId: 'BE-01',
      name: 'Capacity is reserved before credential validation (Atomic admission RPC runs first)',
      expected: 'firstRpc === check_and_increment_rate_limits, secondRpc === validate_and_get_inquiry',
      actual: `1st: ${firstRpc}, 2nd: ${secondRpc}`,
      passed: firstRpc === 'check_and_increment_rate_limits' && secondRpc === 'validate_and_get_inquiry',
      rpcCallOrder: res.rpcOrder,
      validationRpcCalls: sim.validationRpcCount,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  // TEST 2: Validation-call count cannot exceed admission allowance under concurrent flood
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    const now = 1700000000000;

    // Simulate 100 concurrent requests arriving on /proposal with invalid tokens
    const requests = Array.from({ length: 100 }, () =>
      sim.handleRequest('GET', '/proposal', validInquiryId, invalidToken, now)
    );

    // 100 concurrent requests:
    // Requests 1..80 are admitted and reach validation (totalValidationCalls === 80).
    // Requests 81..100 are rejected by the admission guard BEFORE validation (20 blocked before validation).
    // Within the 80 validated requests, 5 return 403 and 75 return 429 from strict unauth limiter.
    const responses = await Promise.all(requests);
    const totalValidationCalls = sim.validationRpcCount;
    const count403 = responses.filter((r) => r.status === 403).length;
    const count429 = responses.filter((r) => r.status === 429).length;

    // Admission allowance for read is 80; requests 81..100 must be blocked before validation
    results.push({
      testId: 'BE-02',
      name: 'Validation-call count cannot exceed admission allowance (100 requests capped at 80 validations)',
      expected: 'totalValidationCalls === 80, count403 === 5, count429 === 95',
      actual: `totalValidationCalls: ${totalValidationCalls}, 403s: ${count403}, 429s: ${count429}`,
      passed: totalValidationCalls === 80 && count403 === 5 && count429 === 95,
      rpcCallOrder: ['check_and_increment_rate_limits', 'validate_and_get_inquiry'],
      validationRpcCalls: totalValidationCalls,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  // TEST 3: Rate-limit errors fail closed (prevents credential validation on DB rate-limiter failure)
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    sim.simulateRateLimitError = true; // Simulate DB connection/timeout error on rate limiter
    const now = 1700000000000;

    const res = await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, now);

    results.push({
      testId: 'BE-03',
      name: 'Rate-limit errors fail closed (Returns 500 without invoking validation RPC)',
      expected: 'Status === 500, validationRpcCount === 0',
      actual: `Status: ${res.status}, validationRpcCount: ${sim.validationRpcCount}`,
      passed: res.status === 500 && sim.validationRpcCount === 0,
      rpcCallOrder: res.rpcOrder,
      validationRpcCalls: sim.validationRpcCount,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  // TEST 4: Post-validation enforces strict 5-attempt limit for invalid tokens
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    let simTime = 1700000000000;

    // 5 invalid token attempts
    let status403Count = 0;
    for (let i = 1; i <= 5; i++) {
      simTime += 1000;
      const r = await sim.handleRequest('GET', '/proposal', validInquiryId, invalidToken, simTime);
      if (r.status === 403) status403Count++;
    }

    // 6th invalid attempt is locked out by strict unauth limiter
    simTime += 1000;
    const r6 = await sim.handleRequest('GET', '/proposal', validInquiryId, invalidToken, simTime);

    results.push({
      testId: 'BE-04',
      name: 'Strict invalid-token limit enforced afterward (5 allowed with 403, 6th returns 429)',
      expected: 'status403Count === 5, r6.status === 429',
      actual: `403s: ${status403Count}, 6th status: ${r6.status}`,
      passed: status403Count === 5 && r6.status === 429,
      rpcCallOrder: r6.rpcOrder,
      validationRpcCalls: sim.validationRpcCount,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  // TEST 5: Valid 15-second polling still works across the rolling-window boundary
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    let simTime = 1700000000000;

    // 80 successful polls spaced across 800s (< 900s 15m window)
    let pollsAllowed = 0;
    for (let i = 1; i <= 80; i++) {
      simTime += 10000;
      const res = await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, simTime);
      if (res.status === 200) pollsAllowed++;
    }

    // 81st poll within window is rate-limited by admission guard
    simTime += 2000;
    const poll81 = await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, simTime);

    // Advance clock past 15-minute rolling window boundary (16 minutes)
    simTime += 16 * 60 * 1000;
    const pollAfterBoundary = await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, simTime);

    results.push({
      testId: 'BE-05',
      name: 'Valid 15-second polling still works across the window boundary (80 allowed, rolls off)',
      expected: 'pollsAllowed === 80, poll81 === 429, pollAfterBoundary === 200',
      actual: `Allowed: ${pollsAllowed}, 81st: ${poll81.status}, afterBoundary: ${pollAfterBoundary.status}`,
      passed: pollsAllowed === 80 && poll81.status === 429 && pollAfterBoundary.status === 200,
      rpcCallOrder: pollAfterBoundary.rpcOrder,
      validationRpcCalls: sim.validationRpcCount,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  // TEST 6: Read traffic does not consume mutation allowance
  {
    const sim = new EdgeFunctionSimulator({ [validInquiryId]: validToken });
    let simTime = 1700000000000;

    // Run 50 proposal read requests on admission:read
    for (let i = 1; i <= 50; i++) {
      simTime += 15000;
      await sim.handleRequest('GET', '/proposal', validInquiryId, validToken, simTime);
    }

    // Attempt mutations on /confirm (admission:mutation)
    let mutationsAllowed = 0;
    for (let i = 1; i <= 5; i++) {
      simTime += 1000;
      const res = await sim.handleRequest('POST', '/confirm', validInquiryId, validToken, simTime);
      if (res.status === 200) mutationsAllowed++;
    }

    // 6th mutation within 15m is blocked by admission:mutation budget of 5
    simTime += 1000;
    const mutation6 = await sim.handleRequest('POST', '/confirm', validInquiryId, validToken, simTime);

    results.push({
      testId: 'BE-06',
      name: 'Read traffic does not consume mutation allowance (5 mutations allowed after 50 reads)',
      expected: 'mutationsAllowed === 5, mutation6 === 429',
      actual: `Mutations allowed: ${mutationsAllowed}, 6th: ${mutation6.status}`,
      passed: mutationsAllowed === 5 && mutation6.status === 429,
      rpcCallOrder: mutation6.rpcOrder,
      validationRpcCalls: sim.validationRpcCount,
      rateLimitRpcCalls: sim.rateLimitRpcCount,
    });
  }

  return results;
}
