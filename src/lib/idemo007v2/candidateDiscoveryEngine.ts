/**
 * IDEMO 007 V2 - Candidate Research & FactPack Seeding Agent
 *
 * Discovers candidate entities neutrally based on region, category, and optional subtype.
 * Uses strictly 1 grounded web search call per research run.
 * Resolves Maps coordinates per candidate.
 * Deduplicates existing entities.
 * Creates RESEARCH_CANDIDATE drafts only (no automatic recommendation creation or publication).
 */

import { GoogleGenAI } from '@google/genai';
import { Entity, EntityType, FactPack } from '../../types/idemo007v2';
import { resolveEntityLocation, mapsEvidenceToFactRecord } from './mapsResolver';
import { buildFactPack } from './factPackBuilder';

export interface DiscoveredCandidate {
  id: string;
  canonicalName: string;
  entityType: EntityType;
  subtype?: string;
  location: string;
  address?: string | null;
  summaryNote?: string;
  coordinates?: { lat: number; lng: number } | null;
  mapsPlaceId?: string | null;
  locationResolutionStatus: 'VERIFIED' | 'UNRESOLVED';
  entity: Entity;
  factPack: FactPack;
  verificationStatus: 'RESEARCH_CANDIDATE' | 'PROMOTED' | string;
  researchMode?: 'DISCOVERY' | 'EXACT_PROPOSITION';
}

export interface CandidateDiscoveryInput {
  mode?: 'DISCOVERY' | 'EXACT_PROPOSITION';
  exactProposition?: string; // e.g. "Pršutijada, Mačkat" or "Žestival, Užice"
  region?: string;
  category?: string;
  subtype?: string;
  maxCandidates?: number; // Default 5, capped at 10 (for discovery mode)
  existingEntities?: Array<{ canonicalName: string; location?: string | null }>;
  customGenAI?: any;
  customFetch?: typeof fetch;
}

export interface CandidateDiscoveryOutput {
  success: boolean;
  mode: 'DISCOVERY' | 'EXACT_PROPOSITION';
  region: string;
  category: string;
  subtype?: string;
  exactProposition?: string;
  requestedMax: number;
  discoveredCount: number;
  deduplicatedCount: number;
  searchCallCount: number; // Max 1 per run
  candidates: DiscoveredCandidate[];
  reason?: string;
}

export const PROHIBITED_RANKING_WORDS = [
  'top',
  'best',
  'famous',
  'popular',
  'must-see',
  'highest rated',
  'greatest',
  'leading',
  'recommended',
];

/**
  Maps category input string to canonical EntityType
 */
export function categoryToEntityType(cat: string): EntityType {
  const upper = (cat || '').toUpperCase().trim();
  if (upper === 'ACCOMMODATION' || upper === 'STAY' || upper === 'HOTEL' || upper === 'ACCOMMODATIONS') return 'ACCOMMODATION';
  if (upper === 'RESTAURANT' || upper === 'GASTRONOMY' || upper === 'FOOD' || upper === 'KAFANA' || upper === 'DINING') return 'RESTAURANT';
  if (upper === 'GUIDE' || upper === 'HERITAGE') return 'GUIDE';
  if (upper === 'TRANSPORT' || upper === 'TRANSIT') return 'TRANSPORT';
  if (upper === 'EXPERIENCE_PROVIDER' || upper === 'EXPERIENCE' || upper === 'NATURE' || upper === 'WINERY' || upper === 'ACTIVITIES') return 'EXPERIENCE_PROVIDER';
  return 'PLACE';
}

/**
 * Normalizes entity name for deterministic case/whitespace-insensitive comparison
 */
export function normalizeEntityName(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Discovers candidates for a target region and category (DISCOVERY mode)
 * OR verifies an exact curator proposition (EXACT_PROPOSITION mode).
 * Uses strictly 1 grounded search call per run.
 */
export async function discoverResearchCandidates(
  input: CandidateDiscoveryInput
): Promise<CandidateDiscoveryOutput> {
  const exactProp = (input.exactProposition || '').trim();
  const isExactMode = Boolean(exactProp || input.mode === 'EXACT_PROPOSITION');
  const activeMode: 'DISCOVERY' | 'EXACT_PROPOSITION' = isExactMode ? 'EXACT_PROPOSITION' : 'DISCOVERY';

  const region = (input.region || '').trim();
  const category = (input.category || 'PLACE').trim();
  const subtype = (input.subtype || '').trim();

  // Cap maxCandidates: default 5, min 1, max 10
  const requestedMax = isExactMode ? 1 : Math.min(Math.max(1, input.maxCandidates ?? 5), 10);

  if (activeMode === 'EXACT_PROPOSITION' && !exactProp) {
    return {
      success: false,
      mode: 'EXACT_PROPOSITION',
      region,
      category,
      subtype,
      exactProposition: exactProp,
      requestedMax: 1,
      discoveredCount: 0,
      deduplicatedCount: 0,
      searchCallCount: 0,
      candidates: [],
      reason: 'MISSING_EXACT_PROPOSITION',
    };
  }

  if (activeMode === 'DISCOVERY' && !region) {
    return {
      success: false,
      mode: 'DISCOVERY',
      region,
      category,
      subtype,
      exactProposition: undefined,
      requestedMax,
      discoveredCount: 0,
      deduplicatedCount: 0,
      searchCallCount: 0,
      candidates: [],
      reason: 'MISSING_REGION',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !input.customGenAI) {
    return {
      success: false,
      mode: activeMode,
      region,
      category,
      subtype,
      exactProposition: exactProp || undefined,
      requestedMax,
      discoveredCount: 0,
      deduplicatedCount: 0,
      searchCallCount: 0,
      candidates: [],
      reason: 'GEMINI_API_KEY_NOT_CONFIGURED',
    };
  }

  const ai =
    input.customGenAI ||
    new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

  const entityType = categoryToEntityType(category);

  let searchCallCount = 0;
  let rawCandidates: any[] = [];

  if (activeMode === 'EXACT_PROPOSITION') {
    // 1 targeted verification search
    const prompt = `Search the live web using Google to verify factual identity for the exact proposition: "${exactProp}".
Extract canonical name, entity type (PLACE, ACCOMMODATION, RESTAURANT, GUIDE, TRANSPORT, EXPERIENCE_PROVIDER), subtype, region/municipality location, street address (if any), and a factual 1-2 sentence description.

RULES:
1. Output valid JSON in this exact structure:
{
  "canonicalName": "${exactProp}",
  "entityType": "${entityType}",
  "subtype": "${subtype || 'Event / Landmark / Entity'}",
  "location": "${region || 'Serbia'}",
  "address": null,
  "summaryNote": "Factual description of ${exactProp}"
}
2. Be strictly factual. No promotional hype.`;

    try {
      searchCallCount = 1;
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const textOutput = response.text || '';
      let cleanedJson = textOutput.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson);
      if (parsed && typeof parsed === 'object') {
        rawCandidates = [
          {
            canonicalName: parsed.canonicalName || exactProp,
            entityType: parsed.entityType || entityType,
            subtype: parsed.subtype || subtype || 'Proposition',
            location: parsed.location || region || exactProp,
            address: parsed.address || null,
            summaryNote: parsed.summaryNote || `Verified proposition for ${exactProp}`,
          },
        ];
      } else {
        rawCandidates = [
          {
            canonicalName: exactProp,
            entityType,
            subtype: subtype || 'Proposition',
            location: region || exactProp,
            summaryNote: `Curator proposition: ${exactProp}`,
          },
        ];
      }
    } catch (err: any) {
      // Fallback to exact proposition scaffold if search throws
      searchCallCount = 1;
      rawCandidates = [
        {
          canonicalName: exactProp,
          entityType,
          subtype: subtype || 'Proposition',
          location: region || exactProp,
          summaryNote: `Curator proposition: ${exactProp}`,
        },
      ];
    }
  } else {
    // DISCOVERY MODE: Construct neutral query without popularity/ranking adjectives
    const querySubject = subtype ? `${category} (${subtype})` : category;
    const prompt = `Search the live web using Google for physical entities located in "${region}", Serbia matching category "${querySubject}".
Find up to ${requestedMax} distinct real physical places or entities in "${region}".

RULES:
1. Neutral discovery only. DO NOT search for subjective ranking scores. Use objective geographic and category classification.
2. Output valid JSON in this exact structure:
{
  "candidates": [
    {
      "canonicalName": "Name of Entity",
      "entityType": "${entityType}",
      "subtype": "${subtype || category}",
      "location": "Town/Municipality, ${region}",
      "address": "Street address if available",
      "summaryNote": "Factual 1-sentence description"
    }
  ]
}
3. Include maximum ${requestedMax} candidates. No promotional claims or subjective ratings.`;

    try {
      searchCallCount = 1;
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const textOutput = response.text || '';
      let cleanedJson = textOutput.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed.candidates)) {
        rawCandidates = parsed.candidates;
      }
    } catch (err: any) {
      return {
        success: false,
        mode: 'DISCOVERY',
        region,
        category,
        subtype,
        exactProposition: undefined,
        requestedMax,
        discoveredCount: 0,
        deduplicatedCount: 0,
        searchCallCount,
        candidates: [],
        reason: err?.message || 'SEARCH_DISCOVERY_FAILED',
      };
    }
  }

  // Deduplication
  const existingSet = new Set<string>();
  if (Array.isArray(input.existingEntities)) {
    for (const e of input.existingEntities) {
      if (e && e.canonicalName) {
        existingSet.add(normalizeEntityName(e.canonicalName));
      }
    }
  }

  const seenInRun = new Set<string>();
  const filteredCandidates: any[] = [];
  let deduplicatedCount = 0;

  for (const cand of rawCandidates) {
    if (!cand || !cand.canonicalName || typeof cand.canonicalName !== 'string') continue;
    const norm = normalizeEntityName(cand.canonicalName);
    if (!norm) continue;

    if (existingSet.has(norm) || seenInRun.has(norm)) {
      deduplicatedCount++;
      continue;
    }

    seenInRun.add(norm);
    filteredCandidates.push(cand);

    if (filteredCandidates.length >= requestedMax) break;
  }

  // Resolve Maps location and build FactPack per candidate
  const discoveredCandidates: DiscoveredCandidate[] = [];

  for (let i = 0; i < filteredCandidates.length; i++) {
    const raw = filteredCandidates[i];
    const candidateId = `cand-${Date.now()}-${i + 1}`;

    const entityScaffold: Entity = {
      id: `entity-${candidateId}`,
      entityType: (raw.entityType as EntityType) || entityType,
      canonicalName: raw.canonicalName.trim(),
      location: raw.location || region || exactProp,
      address: raw.address || null,
      trustLevel: 'UNVERIFIED',
      verificationStatus: 'RESEARCH_CANDIDATE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        subtype: raw.subtype || subtype || category,
        summaryNote: raw.summaryNote || '',
        researchMode: activeMode,
      },
    };

    // Maps resolution attempt
    const mapsResult = await resolveEntityLocation(entityScaffold, input.customFetch);

    let mapsFactRecord = null;
    let locationResolutionStatus: 'VERIFIED' | 'UNRESOLVED' = 'UNRESOLVED';

    if (mapsResult.success && mapsResult.evidence && mapsResult.evidence.latitude != null && mapsResult.evidence.longitude != null) {
      entityScaffold.coordinates = {
        lat: mapsResult.evidence.latitude,
        lng: mapsResult.evidence.longitude,
      };
      if (mapsResult.evidence.formattedAddress) {
        entityScaffold.address = mapsResult.evidence.formattedAddress;
      }
      mapsFactRecord = mapsEvidenceToFactRecord(mapsResult.evidence);
      locationResolutionStatus = 'VERIFIED';
    } else {
      // CRITICAL UNRESOLVED LOCATION RULE:
      // If exact Maps resolution fails: DO NOT substitute regional-center coordinates!
      // Leave coordinates and mapsPlaceId unset (null) and mark as UNRESOLVED.
      entityScaffold.coordinates = null;
      locationResolutionStatus = 'UNRESOLVED';
    }

    const recType =
      entityType === 'PLACE'
        ? 'PLACE'
        : entityType === 'ACCOMMODATION' || entityType === 'RESTAURANT' || entityType === 'EXPERIENCE_PROVIDER'
        ? 'EXPERIENCE'
        : 'PLACE';

    const factPack = buildFactPack({
      recommendationType: recType,
      entities: [entityScaffold],
      facts: mapsFactRecord ? [mapsFactRecord] : [],
      curatorInput: {
        region: region || exactProp,
        category,
        subtype,
        verificationStatus: 'RESEARCH_CANDIDATE',
        researchMode: activeMode,
      },
    });

    discoveredCandidates.push({
      id: candidateId,
      canonicalName: entityScaffold.canonicalName,
      entityType: entityScaffold.entityType,
      subtype: raw.subtype || subtype || category,
      location: entityScaffold.location || region || exactProp,
      address: entityScaffold.address || null,
      summaryNote: raw.summaryNote || '',
      coordinates: entityScaffold.coordinates || null,
      mapsPlaceId: locationResolutionStatus === 'VERIFIED' ? mapsResult.evidence?.providerPlaceId || null : null,
      locationResolutionStatus,
      entity: entityScaffold,
      factPack,
      verificationStatus: 'RESEARCH_CANDIDATE',
      researchMode: activeMode,
    });
  }

  return {
    success: true,
    mode: activeMode,
    region,
    category,
    subtype,
    exactProposition: exactProp || undefined,
    requestedMax,
    discoveredCount: discoveredCandidates.length,
    deduplicatedCount,
    searchCallCount,
    candidates: discoveredCandidates,
  };
}
