/**
 * IDEMO 007 V2 - Candidate Research & FactPack Seeding Agent Test Suite
 * Verifies input constraints, 1 grounded search call budget, neutral query generation,
 * deduplication logic, Maps resolution, FactPack seeding, and RESEARCH_CANDIDATE draft state.
 */

import {
  discoverResearchCandidates,
  categoryToEntityType,
  normalizeEntityName,
  PROHIBITED_RANKING_WORDS,
  CandidateDiscoveryInput,
} from '../lib/idemo007v2/candidateDiscoveryEngine';
import { TestResult } from './idemo007V2Slice4.test';

export async function runCandidateDiscoveryTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function addResult(testId: string, name: string, expected: string, actual: string, passed: boolean) {
    results.push({ testId, name, expected, actual, passed });
  }

  console.log('--- RUNNING CANDIDATE DISCOVERY AGENT TESTS ---');

  // =========================================================================
  // 1. INPUT CONSTRAINTS & SANITIZATION
  // =========================================================================

  // CD-01: Default maxCandidates is 5
  const mockAI = {
    models: {
      generateContent: async (params: any) => ({
        text: JSON.stringify({
          candidates: [
            { canonicalName: 'Monastery Hopovo', entityType: 'PLACE', subtype: 'Monastery', location: 'Irig, Fruška Gora', summaryNote: '16th century monastery' },
          ],
        }),
      }),
    },
  };

  const mockFetchSuccess = (async () => {
    return {
      ok: true,
      json: async () => ({
        status: 'OK',
        candidates: [{ name: 'Monastery Hopovo', formatted_address: 'Hopovo Rd, Irig', geometry: { location: { lat: 45.128, lng: 19.849 } } }],
      }),
    } as any;
  }) as typeof fetch;

  const resDefaultMax = await discoverResearchCandidates({
    region: 'Fruška Gora',
    category: 'PLACE',
    customGenAI: mockAI,
    customFetch: mockFetchSuccess,
  });
  addResult(
    'CD-01',
    'Default maxCandidates is 5 when omitted',
    '5',
    String(resDefaultMax.requestedMax),
    resDefaultMax.requestedMax === 5
  );

  // CD-02: Capped maxCandidates at 10
  const resCapMax = await discoverResearchCandidates({
    region: 'Fruška Gora',
    category: 'PLACE',
    maxCandidates: 25,
    customGenAI: mockAI,
    customFetch: mockFetchSuccess,
  });
  addResult(
    'CD-02',
    'maxCandidates capped at 10 when value > 10 requested',
    '10',
    String(resCapMax.requestedMax),
    resCapMax.requestedMax === 10
  );

  // CD-03: Missing region returns MISSING_REGION with 0 search calls
  const resMissingRegion = await discoverResearchCandidates({
    region: '   ',
    category: 'PLACE',
    customGenAI: mockAI,
  });
  addResult(
    'CD-03',
    'Missing region returns MISSING_REGION error with 0 search calls',
    'success: false, searchCallCount: 0',
    `success: ${resMissingRegion.success}, searchCallCount: ${resMissingRegion.searchCallCount}`,
    !resMissingRegion.success && resMissingRegion.reason === 'MISSING_REGION' && resMissingRegion.searchCallCount === 0
  );

  // =========================================================================
  // 2. SEARCH CALL BUDGET & QUERY NEUTRALITY
  // =========================================================================

  // CD-04: Grounded Search call count is strictly <= 1
  let promptCaptured = '';
  const mockAIPromptCapture = {
    models: {
      generateContent: async (params: any) => {
        promptCaptured = params.contents || '';
        return {
          text: JSON.stringify({
            candidates: [
              { canonicalName: 'Novo Hopovo', entityType: 'PLACE', location: 'Irig' },
              { canonicalName: 'Staro Hopovo', entityType: 'PLACE', location: 'Irig' },
            ],
          }),
        };
      },
    },
  };

  const resBudget = await discoverResearchCandidates({
    region: 'Fruška Gora',
    category: 'PLACE',
    subtype: 'Monastery',
    customGenAI: mockAIPromptCapture,
    customFetch: mockFetchSuccess,
  });

  addResult(
    'CD-04',
    'Grounded search call count strictly <= 1 per discovery run',
    '1',
    String(resBudget.searchCallCount),
    resBudget.searchCallCount === 1
  );

  // CD-05: Discovery query contains zero prohibited ranking/popularity words
  const lowerPrompt = promptCaptured.toLowerCase();
  const foundRankingWords = PROHIBITED_RANKING_WORDS.filter((w) => lowerPrompt.includes(w));
  addResult(
    'CD-05',
    'Discovery query neutrally constructed without popularity/ranking terms',
    '0 prohibited words',
    `found (${foundRankingWords.length}): ${foundRankingWords.join(', ') || 'none'}`,
    foundRankingWords.length === 0
  );

  // =========================================================================
  // 3. DEDUPLICATION LOGIC
  // =========================================================================

  // CD-06: Existing entities deduplicated case-insensitively
  const mockAIDup = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          candidates: [
            { canonicalName: 'Monastery Hopovo', entityType: 'PLACE', location: 'Irig' }, // Duplicate
            { canonicalName: 'Monastery Vrdnik', entityType: 'PLACE', location: 'Vrdnik' }, // New
          ],
        }),
      }),
    },
  };

  const resDup = await discoverResearchCandidates({
    region: 'Fruška Gora',
    category: 'PLACE',
    existingEntities: [
      { canonicalName: 'MONASTERY HOPOVO', location: 'Irig' },
    ],
    customGenAI: mockAIDup,
    customFetch: mockFetchSuccess,
  });

  const namesDiscovered = resDup.candidates.map((c) => c.canonicalName);
  addResult(
    'CD-06',
    'Existing entity deduplicated case-insensitively',
    '["Monastery Vrdnik"]',
    JSON.stringify(namesDiscovered),
    resDup.deduplicatedCount === 1 && namesDiscovered.length === 1 && namesDiscovered[0] === 'Monastery Vrdnik'
  );

  // =========================================================================
  // 4. MAPS RESOLUTION & FACTPACK SEEDING
  // =========================================================================

  // CD-07: Maps resolution attaches coordinates and FactPack
  const candSample = resDup.candidates[0];
  const hasCoords = candSample && candSample.coordinates?.lat === 45.128 && candSample.coordinates?.lng === 19.849;
  const hasFactPack = candSample && Boolean(candSample.factPack) && candSample.factPack.facts.length > 0;

  addResult(
    'CD-07',
    'Maps resolution resolves coordinates and creates FactPack for candidate',
    'coords: (45.128, 19.849), hasFactPack: true',
    `coords: (${candSample?.coordinates?.lat}, ${candSample?.coordinates?.lng}), hasFactPack: ${hasFactPack}`,
    Boolean(hasCoords && hasFactPack)
  );

  // CD-08: Candidate status is strictly RESEARCH_CANDIDATE & trust is UNVERIFIED
  const isResearchCandidate = candSample?.verificationStatus === 'RESEARCH_CANDIDATE';
  const isUnverified = candSample?.entity.trustLevel === 'UNVERIFIED';

  addResult(
    'CD-08',
    'Candidate verification status is strictly RESEARCH_CANDIDATE & trust is UNVERIFIED',
    'RESEARCH_CANDIDATE & UNVERIFIED',
    `${candSample?.verificationStatus} & ${candSample?.entity.trustLevel}`,
    Boolean(isResearchCandidate && isUnverified)
  );

  // =========================================================================
  // 5. EXACT PROPOSITION MODE & UNRESOLVED LOCATION RULES
  // =========================================================================

  // CD-09: Exact Proposition Mode takes priority and executes 1 targeted search call
  const mockAIExact = {
    models: {
      generateContent: async (params: any) => ({
        text: JSON.stringify({
          canonicalName: 'Pršutijada',
          entityType: 'EXPERIENCE_PROVIDER',
          subtype: 'Gastronomy Festival',
          location: 'Mačkat, Čajetina',
          summaryNote: 'Traditional cured meat festival held annually in Mačkat village.',
        }),
      }),
    },
  };

  const resExactMode = await discoverResearchCandidates({
    mode: 'EXACT_PROPOSITION',
    exactProposition: 'Pršutijada, Mačkat',
    category: 'GASTRONOMY',
    customGenAI: mockAIExact,
    customFetch: mockFetchSuccess,
  });

  addResult(
    'CD-09',
    'Exact Proposition Mode resolves exact entity with 1 targeted search call',
    'mode: EXACT_PROPOSITION, candidate: Pršutijada, searchCalls: 1',
    `mode: ${resExactMode.mode}, candidate: ${resExactMode.candidates[0]?.canonicalName}, searchCalls: ${resExactMode.searchCallCount}`,
    resExactMode.mode === 'EXACT_PROPOSITION' &&
      resExactMode.candidates.length === 1 &&
      resExactMode.candidates[0]?.canonicalName === 'Pršutijada' &&
      resExactMode.searchCallCount === 1
  );

  // CD-10: Failed Maps resolution leaves coordinates null, mapsPlaceId null, and marks UNRESOLVED (No Regional Center Substitution)
  const mockFetchFail = (async () => {
    return {
      ok: true,
      json: async () => ({
        status: 'ZERO_RESULTS',
        candidates: [],
      }),
    } as any;
  }) as typeof fetch;

  const resUnresolvedLoc = await discoverResearchCandidates({
    mode: 'EXACT_PROPOSITION',
    exactProposition: 'Žestival, Užice',
    category: 'GASTRONOMY',
    customGenAI: mockAIExact,
    customFetch: mockFetchFail,
  });

  const candUnresolved = resUnresolvedLoc.candidates[0];
  const isCoordsNull = candUnresolved?.coordinates === null && candUnresolved?.entity?.coordinates == null;
  const isPlaceIdNull = candUnresolved?.mapsPlaceId === null;
  const isUnresolvedStatus = candUnresolved?.locationResolutionStatus === 'UNRESOLVED';

  addResult(
    'CD-10',
    'Failed Maps resolution leaves coordinates/placeId null and marks UNRESOLVED (No regional center substitution)',
    'coords: null, mapsPlaceId: null, status: UNRESOLVED',
    `coords: ${JSON.stringify(candUnresolved?.coordinates)}, mapsPlaceId: ${candUnresolved?.mapsPlaceId}, status: ${candUnresolved?.locationResolutionStatus}`,
    Boolean(isCoordsNull && isPlaceIdNull && isUnresolvedStatus)
  );

  // CD-11: Successful Maps resolution marks status VERIFIED with coordinates
  const candVerifiedLoc = resExactMode.candidates[0];
  addResult(
    'CD-11',
    'Successful Maps resolution marks status VERIFIED with valid coordinates',
    'status: VERIFIED, coords: (45.128, 19.849)',
    `status: ${candVerifiedLoc?.locationResolutionStatus}, coords: (${candVerifiedLoc?.coordinates?.lat}, ${candVerifiedLoc?.coordinates?.lng})`,
    candVerifiedLoc?.locationResolutionStatus === 'VERIFIED' && candVerifiedLoc?.coordinates?.lat === 45.128
  );

  return results;
}
