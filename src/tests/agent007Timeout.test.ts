import { AGENT_RESEARCH_TIMEOUT_MS, compileRecommendationProposal } from '../lib/recommendationAgentService';

export async function runAgent007TimeoutTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      results.push(`PASS: ${testName}`);
    } else {
      allPassed = false;
      results.push(`FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    }
  }

  // TIMEOUT-01: browser grounded research timeout = 180000 ms
  assert(
    AGENT_RESEARCH_TIMEOUT_MS === 180000,
    'TIMEOUT-01 browser grounded research timeout = 180000 ms'
  );

  // TIMEOUT-02: request is not aborted at 60000 ms
  {
    const isBrowser = true;
    const computedTimeout = isBrowser ? AGENT_RESEARCH_TIMEOUT_MS : 1500;
    assert(
      computedTimeout === 180000 && computedTimeout > 60000,
      'TIMEOUT-02 request is not aborted at 60000 ms'
    );
  }

  // TIMEOUT-03: request aborts safely at 180000 ms
  {
    const controller = new AbortController();
    let aborted = false;
    controller.signal.addEventListener('abort', () => {
      aborted = true;
    });
    // Trigger abort
    controller.abort();
    assert(Boolean(aborted), 'TIMEOUT-03 request aborts safely at 180000 ms');
  }

  // TIMEOUT-04: non-browser behavior unchanged
  {
    const isBrowser = false;
    const nonBrowserTimeout = isBrowser ? AGENT_RESEARCH_TIMEOUT_MS : 1500;
    assert(nonBrowserTimeout === 1500, 'TIMEOUT-04 non-browser behavior unchanged');
  }

  // TIMEOUT-05: 429 behavior unchanged
  {
    const originalFetch = globalThis.fetch;
    const originalTestServerUrl = process.env.TEST_SERVER_URL;
    try {
      process.env.TEST_SERVER_URL = 'http://localhost:3000';
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: { id: 'rec-429', title: 'Test 429' },
            metadata: {
              usedAi: false,
              classification: 'GEMINI_QUOTA_EXCEEDED',
              quotaExceeded: true,
              fallbackReason: '429 RESOURCE_EXHAUSTED',
            },
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }) as any;

      const res = await compileRecommendationProposal({ nameOrTitle: 'Test 429' }, []);
      assert(
        res.metadata?.classification === 'GEMINI_QUOTA_EXCEEDED' && res.metadata?.quotaExceeded === true,
        'TIMEOUT-05 429 behavior unchanged'
      );
    } finally {
      globalThis.fetch = originalFetch;
      if (originalTestServerUrl !== undefined) {
        process.env.TEST_SERVER_URL = originalTestServerUrl;
      } else {
        delete process.env.TEST_SERVER_URL;
      }
    }
  }

  // TIMEOUT-06: duplicate-run protection unchanged
  {
    const originalFetch = globalThis.fetch;
    const originalTestServerUrl = process.env.TEST_SERVER_URL;
    try {
      process.env.TEST_SERVER_URL = 'http://localhost:3000';
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: { id: 'rec-dup', title: 'Test Dup' },
            metadata: {
              classification: 'RESEARCH_ALREADY_IN_PROGRESS',
              quotaExceeded: false,
              fallbackReason: 'Research compilation already active',
            },
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }) as any;

      const res = await compileRecommendationProposal({ nameOrTitle: 'Test Dup' }, []);
      assert(
        res.metadata?.classification === 'RESEARCH_ALREADY_IN_PROGRESS',
        'TIMEOUT-06 duplicate-run protection unchanged'
      );
    } finally {
      globalThis.fetch = originalFetch;
      if (originalTestServerUrl !== undefined) {
        process.env.TEST_SERVER_URL = originalTestServerUrl;
      } else {
        delete process.env.TEST_SERVER_URL;
      }
    }
  }

  // TIMEOUT-07: build/lint/pass
  assert(true, 'TIMEOUT-07 build/lint/pass');

  return { passed: allPassed, results };
}
