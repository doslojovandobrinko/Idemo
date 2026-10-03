/**
 * IDEMO 007 V2 - Targeted Search Research Engine
 * Performs gap-specific factual research using @google/genai Search Grounding.
 * Strictly limited to missing/stale facts. NO recommendation prose, NO narrative.
 */

import { Entity, FactRecord, FactSourceType } from '../../types/idemo007v2';
import { GoogleGenAI } from '@google/genai';

export interface ResearchedFactItem {
  factKey: string;
  value: any;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceType?: FactSourceType;
  confidence?: number;
}

export interface SearchResearchResult {
  success: boolean;
  facts: ResearchedFactItem[];
  unresolvedGaps: Array<{ factKey: string; reason: string }>;
  searchQueriesCount: number;
  reason?: string;
}

/**
 * Known official domain suffix / pattern allowlist.
 * Deterministic domain recognition - Gemini output cannot self-promote.
 */
export const OFFICIAL_DOMAIN_ALLOWLIST = [
  '.gov.rs',
  '.org.rs',
  'unesco.org',
  'serbia.travel',
  'srbija.travel',
  'sanu.ac.rs',
  'turizam.gov.rs',
];

/**
 * Evaluates whether a source URL belongs to an official domain.
 */
export function classifySourceTypeFromUrl(sourceUrl?: string): FactSourceType {
  if (!sourceUrl) return 'SEARCH_GROUNDED';

  try {
    const urlObj = new URL(sourceUrl);
    const hostname = urlObj.hostname.toLowerCase();

    const isOfficial = OFFICIAL_DOMAIN_ALLOWLIST.some((domain) =>
      domain.startsWith('.') ? hostname.endsWith(domain) : hostname.includes(domain)
    );

    return isOfficial ? 'PRIMARY_OFFICIAL' : 'SEARCH_GROUNDED';
  } catch {
    return 'SEARCH_GROUNDED';
  }
}

export interface PerformTargetedSearchInput {
  entity: Entity;
  missingFactKeys: string[];
  staleFactKeys: string[];
  runId?: string;
  customGenAI?: any; // For unit testing / mocking
}

/**
 * Executes a gap-specific research request against Gemini Search Grounding.
 * HARD BUDGET: Maximum 1 Gemini grounded research call per compilation.
 */
export async function performTargetedSearch(
  input: PerformTargetedSearchInput
): Promise<SearchResearchResult> {
  const { entity, missingFactKeys = [], staleFactKeys = [], customGenAI } = input;
  const targetFactKeys = Array.from(new Set([...missingFactKeys, ...staleFactKeys]));

  if (targetFactKeys.length === 0) {
    return {
      success: true,
      facts: [],
      unresolvedGaps: [],
      searchQueriesCount: 0,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !customGenAI) {
    return {
      success: false,
      facts: [],
      unresolvedGaps: targetFactKeys.map((k) => ({ factKey: k, reason: 'GEMINI_API_KEY_NOT_CONFIGURED' })),
      searchQueriesCount: 0,
      reason: 'GEMINI_API_KEY_NOT_CONFIGURED',
    };
  }

  const ai =
    customGenAI ||
    new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

  const prompt = `Search the live web using Google for verified practical facts about entity "${entity.canonicalName}" in "${entity.location || 'Serbia'}".

TARGET FACT KEYS TO VERIFY ONLY:
${targetFactKeys.map((k) => `- ${k}`).join('\n')}

RULES:
1. Return ONLY verified factual information matching the requested fact keys.
2. DO NOT write recommendation titles, overview prose, narratives, or marketing copy.
3. If a fact cannot be verified, list it under "unresolved".
4. Output MUST be valid JSON in this exact structure:
{
  "facts": [
    {
      "factKey": "opening_hours",
      "value": "08:00 - 20:00",
      "sourceUrl": "https://official-site.rs",
      "sourceTitle": "Official Site"
    }
  ],
  "unresolved": [
    {
      "factKey": "ticket_price",
      "reason": "Official admission price not found on web"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const searchQueriesCount = groundingMetadata?.webSearchQueries?.length || 0;

    const textOutput = response.text || '';
    let cleanedJson = textOutput.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      return {
        success: false,
        facts: [],
        unresolvedGaps: targetFactKeys.map((k) => ({ factKey: k, reason: 'FAILED_TO_PARSE_RESEARCH_JSON' })),
        searchQueriesCount,
        reason: 'FAILED_TO_PARSE_RESEARCH_JSON',
      };
    }

    const rawFacts = Array.isArray(parsed.facts) ? parsed.facts : [];
    const rawUnresolved = Array.isArray(parsed.unresolved) ? parsed.unresolved : [];

    // Filter facts to ensure only requested fact keys are accepted (Zero arbitrary extra fact insertion)
    const validFacts: ResearchedFactItem[] = rawFacts
      .filter((f: any) => f && f.factKey && targetFactKeys.includes(f.factKey) && f.value != null)
      .map((f: any) => ({
        factKey: f.factKey,
        value: f.value,
        sourceUrl: f.sourceUrl || (groundingMetadata?.groundingChunks?.[0]?.web?.uri || null),
        sourceTitle: f.sourceTitle || 'Web Research',
        sourceType: classifySourceTypeFromUrl(f.sourceUrl || groundingMetadata?.groundingChunks?.[0]?.web?.uri),
        confidence: 0.9,
      }));

    return {
      success: true,
      facts: validFacts,
      unresolvedGaps: rawUnresolved,
      searchQueriesCount,
    };
  } catch (err: any) {
    return {
      success: false,
      facts: [],
      unresolvedGaps: targetFactKeys.map((k) => ({ factKey: k, reason: err?.message || String(err) })),
      searchQueriesCount: 0,
      reason: err?.message || String(err),
    };
  }
}
