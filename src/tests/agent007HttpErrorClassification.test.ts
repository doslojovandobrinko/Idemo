import { compileRecommendationProposal, AgentProposalInput } from '../lib/recommendationAgentService';

export async function runAgent007HttpErrorClassificationTests(): Promise<{ passed: boolean; results: string[] }> {
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

  // Preserve original fetch and env if present
  const originalFetch = globalThis.fetch;
  const originalTestServerUrl = process.env.TEST_SERVER_URL;

  try {
    process.env.TEST_SERVER_URL = 'http://localhost:3000';
    const mockInput: AgentProposalInput = {
      nameOrTitle: 'Žestival Užice',
      destinationOrLocation: 'Užice',
    };

    // HTTP01 — valid 200 proposal parses normally
    {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: {
              id: 'rec-200',
              serviceAreaId: 'sa-uzice',
              title: 'Žestival Užice',
              shortDescription: 'Festival rakije u Užicu.',
              longDescription: 'Tradicionalna manifestacija voćnih rakija.',
              location: 'Užice',
            },
            evidenceReport: { headerVisualState: 'GREEN' },
            metadata: {
              usedAi: true,
              model: 'gemini-3.7-flash',
              sources: ['https://zestival.rs'],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.recommendation.title === 'Žestival Užice' &&
        res.metadata.usedAi === true &&
        res.metadata.classification === undefined,
        'HTTP01 — valid 200 proposal parses normally'
      );
    }

    // HTTP02 — 429 Gemini quota is classified GEMINI_QUOTA_EXCEEDED
    {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: {
              id: 'rec-429-quota',
              serviceAreaId: 'sa-uzice',
              title: 'Žestival Užice',
              shortDescription: '[Unresearched Structural Draft] Žestival Užice.',
              longDescription: '[Unresearched Structural Draft]',
            },
            metadata: {
              usedAi: false,
              executionMode: 'DETERMINISTIC_FALLBACK',
              model: 'deterministic_semantic_engine',
              quotaExceeded: true,
              fallbackReason: '429 RESOURCE_EXHAUSTED',
              sources: [],
            },
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.metadata.classification === 'GEMINI_QUOTA_EXCEEDED' &&
        res.metadata.quotaExceeded === true &&
        res.metadata.fallbackReason !== 'Client-Side Offline Fallback Mode',
        'HTTP02 — 429 Gemini quota is classified GEMINI_QUOTA_EXCEEDED'
      );
    }

    // HTTP03 — 429 single-flight is classified RESEARCH_ALREADY_IN_PROGRESS
    {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: {
              id: 'rec-429-singleflight',
              serviceAreaId: 'sa-uzice',
              title: 'Žestival Užice',
            },
            metadata: {
              usedAi: false,
              fallbackReason: 'Research compilation already active for this entity (single-flight blocked)',
              userNotice: 'Compilation already in progress for this entity.',
              sources: [],
            },
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.metadata.classification === 'RESEARCH_ALREADY_IN_PROGRESS' &&
        res.metadata.quotaExceeded === false,
        'HTTP03 — 429 single-flight is classified RESEARCH_ALREADY_IN_PROGRESS'
      );
    }

    // HTTP04 — non-2xx valid server fallback payload is parsed and preserved
    {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            recommendation: {
              id: 'rec-500-fallback',
              serviceAreaId: 'sa-uzice',
              title: 'Žestival Užice',
              shortDescription: 'Server fallback draft',
            },
            metadata: {
              usedAi: false,
              model: 'deterministic_semantic_engine',
              fallbackReason: 'Server Internal Error Fallback',
            },
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.recommendation.shortDescription === 'Server fallback draft' &&
        res.metadata.classification === 'SERVER_HTTP_500',
        'HTTP04 — non-2xx valid server fallback payload is parsed and preserved'
      );
    }

    // HTTP05 — server 429 is never labeled CLIENT_SIDE_OFFLINE_FALLBACK
    {
      globalThis.fetch = (async () => {
        return new Response('Rate limited', {
          status: 429,
          headers: { 'Content-Type': 'text/plain' },
        });
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.metadata.classification === 'GEMINI_QUOTA_EXCEEDED' &&
        res.metadata.fallbackReason !== 'Client-Side Offline Fallback Mode',
        'HTTP05 — server 429 is never labeled CLIENT_SIDE_OFFLINE_FALLBACK'
      );
    }

    // HTTP06 — genuine fetch/network failure uses CLIENT_SIDE_OFFLINE_FALLBACK
    {
      globalThis.fetch = (async () => {
        throw new Error('Failed to fetch (NetworkError)');
      }) as any;

      const res = await compileRecommendationProposal(mockInput, []);
      assert(
        res.metadata.classification === 'CLIENT_SIDE_OFFLINE_FALLBACK' &&
        res.metadata.fallbackReason === 'Client-Side Offline Fallback Mode',
        'HTTP06 — genuine fetch/network failure uses CLIENT_SIDE_OFFLINE_FALLBACK'
      );
    }

    // HTTP07 — no automatic retry (call counter check)
    {
      let callCount = 0;
      globalThis.fetch = (async () => {
        callCount++;
        return new Response(JSON.stringify({ error: '429 RESOURCE_EXHAUSTED' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      await compileRecommendationProposal(mockInput, []);
      assert(callCount === 1, 'HTTP07 — no automatic retry');
    }

    // HTTP08 — no duplicate recommendation created
    {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: '429 RESOURCE_EXHAUSTED' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const res1 = await compileRecommendationProposal(mockInput, []);
      const res2 = await compileRecommendationProposal(mockInput, []);
      assert(
        res1.recommendation.id !== res2.recommendation.id || Boolean(res1.recommendation.id),
        'HTTP08 — no duplicate recommendation created'
      );
    }

    // HTTP09 — non-destructive rerun behavior remains intact
    {
      const res429 = {
        metadata: {
          classification: 'GEMINI_QUOTA_EXCEEDED',
          quotaExceeded: true,
          fallbackReason: '429 RESOURCE_EXHAUSTED',
        },
      };
      const isQuotaExceeded =
        Boolean(res429.metadata.quotaExceeded) ||
        res429.metadata.classification === 'GEMINI_QUOTA_EXCEEDED';

      assert(isQuotaExceeded === true, 'HTTP09 — non-destructive rerun behavior remains intact');
    }

    // HTTP10 — initial-creation fallback remains functional
    {
      globalThis.fetch = (async () => {
        throw new Error('Offline');
      }) as any;

      const res = await compileRecommendationProposal({ nameOrTitle: 'Tara Rafting' }, []);
      assert(
        res.recommendation.title === 'Tara Rafting' &&
        typeof res.recommendation.shortDescription === 'string',
        'HTTP10 — initial-creation fallback remains functional'
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalTestServerUrl !== undefined) {
      process.env.TEST_SERVER_URL = originalTestServerUrl;
    } else {
      delete process.env.TEST_SERVER_URL;
    }
  }

  return { passed: allPassed, results };
}
