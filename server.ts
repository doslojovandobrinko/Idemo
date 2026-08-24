import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Canonical Category Enum
enum Category {
  GASTRONOMY = 'Gastronomy',
  CULTURE = 'Culture',
  NATURE = 'Nature',
  NIGHTLIFE = 'Nightlife',
  SHOPPING = 'Shopping',
  TRAVEL = 'Travel',
  HISTORY = 'History',
  WELLBEING = 'Wellbeing',
  MEDICAL = 'Medical',
  CLUBBING = 'Clubbing',
}

interface HumanProvidedMedia {
  url: string;
  source?: string;
  license?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  altText?: string;
}

interface ResearchRequestPayload {
  nameOrTitle: string;
  descriptionOrNotes?: string;
  destinationOrLocation?: string;
  referenceUrl?: string;
  humanProvidedMedia?: HumanProvidedMedia;
  additionalCuratorNotes?: string;
  targetServiceAreaId?: string;
  availableServiceAreas?: Array<{ id: string; name: string; destination_code?: string }>;
}

// Agent 007 Quota Safety & Cache Helper Exports
export function getEntityKey(nameOrTitle: string, destinationOrLocation?: string): string {
  const nameClean = (nameOrTitle || '').trim().toLowerCase();
  const locClean = (destinationOrLocation || '').trim().toLowerCase();
  return `${nameClean}::${locClean}`;
}

export const activeResearchRuns = new Set<string>();

export function isResearchRunActive(entityKey: string): boolean {
  return activeResearchRuns.has(entityKey);
}

export interface CachedResearchFindings {
  findings: string;
  searchSources: string[];
  groundingMetadataReceived: boolean;
  searchQueriesCount: number;
  searchChunksCount: number;
  timestamp: number;
}

export const researchCache = new Map<string, CachedResearchFindings>();
export const RESEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCachedResearch(entityKey: string): CachedResearchFindings | null {
  const cached = researchCache.get(entityKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > RESEARCH_CACHE_TTL_MS) {
    researchCache.delete(entityKey);
    return null;
  }
  return cached;
}

export function setCachedResearch(entityKey: string, data: Omit<CachedResearchFindings, 'timestamp'>) {
  if (researchCache.size > 100) {
    const oldestKey = researchCache.keys().next().value;
    if (oldestKey) researchCache.delete(oldestKey);
  }
  researchCache.set(entityKey, { ...data, timestamp: Date.now() });
}

export function clearCachedResearch(entityKey: string) {
  researchCache.delete(entityKey);
}

export function logGeminiUsage(params: {
  callType: 'grounding' | 'structuring';
  response?: any;
  startTime: number;
  error?: any;
}): string {
  const durationMs = Date.now() - params.startTime;
  if (params.error) {
    const errStr = typeof params.error === 'string' ? params.error : (params.error?.message || JSON.stringify(params.error));
    const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
    const retryDelay = params.error?.details?.[0]?.retryDelay || undefined;
    
    // Sanitize error string to ensure no API keys or sensitive credentials appear in logs
    const sanitizedErr = is429
      ? '429 RESOURCE_EXHAUSTED: Gemini API quota exceeded. Clean fallback to deterministic research activated.'
      : errStr
          .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]')
          .replace(/AIzaSy[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
          .substring(0, 200);

    const logEntry = JSON.stringify({
      event: 'AGENT_007_GEMINI_CALL',
      callType: params.callType,
      status: is429 ? '429_RESOURCE_EXHAUSTED' : 'ERROR',
      durationMs,
      error: sanitizedErr,
      retryDelay,
    });
    console.log(logEntry);
    return logEntry;
  } else if (params.response) {
    const usage = params.response.usageMetadata || {};
    const logEntry = JSON.stringify({
      event: 'AGENT_007_GEMINI_CALL',
      callType: params.callType,
      status: 'SUCCESS',
      durationMs,
      promptTokenCount: usage.promptTokenCount ?? usage.inputTokenCount ?? 0,
      candidatesTokenCount: usage.candidatesTokenCount ?? usage.outputTokenCount ?? 0,
      cachedContentTokenCount: usage.cachedContentTokenCount ?? 0,
      totalTokenCount: usage.totalTokenCount ?? 0,
    });
    console.log(logEntry);
    return logEntry;
  }
  return '';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      service: 'IDEMO Studio API',
      timestamp: new Date().toISOString(),
    });
  });

  // Server-Side Proposal Agent Research Endpoint
  app.post('/api/studio/recommendation-agent/research', async (req: Request, res: Response) => {
    const body: ResearchRequestPayload = req.body;
    const {
      nameOrTitle,
      descriptionOrNotes,
      destinationOrLocation,
      referenceUrl,
      humanProvidedMedia,
      additionalCuratorNotes,
      targetServiceAreaId,
      availableServiceAreas = [],
    } = body;

    if (!nameOrTitle || !nameOrTitle.trim()) {
      return res.status(400).json({ error: 'nameOrTitle is required for research' });
    }

    const entityKey = getEntityKey(nameOrTitle, destinationOrLocation);

    // Single-Flight Guard: if research is already active for this entity key, block duplicate request
    if (activeResearchRuns.has(entityKey)) {
      console.warn(`[research-endpoint] Single-flight blocked: research run already active for key "${entityKey}"`);
      const fallback = generateDeterministicSemanticResearch(
        nameOrTitle,
        destinationOrLocation,
        referenceUrl,
        descriptionOrNotes,
        additionalCuratorNotes
      );
      const proposal = processAndAuditResearchData(
        body,
        fallback,
        availableServiceAreas,
        false,
        [],
        {
          geminiRequestAttempted: false,
          fallbackReason: 'Research compilation already active for this entity (single-flight blocked)',
          groundingMetadataReceived: false,
          searchQueriesCount: 0,
          searchChunksCount: 0,
        }
      );
      if (proposal.metadata) {
        proposal.metadata.userNotice = 'Compilation already in progress for this entity.';
        proposal.metadata.executionMode = 'DETERMINISTIC_FALLBACK';
      }
      return res.status(429).json(proposal);
    }

    activeResearchRuns.add(entityKey);

    const abortController = new AbortController();
    let clientDisconnected = false;

    const onCloseHandler = () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
        abortController.abort();
        console.log(`[research-endpoint] Client connection closed for "${nameOrTitle}". Signalling abort.`);
      }
    };

    req.on('close', onCloseHandler);

    try {
      const ai = getGeminiClient();
      let researchedData: any = null;
      let usedGemini = false;
      let geminiRequestAttempted = false;
      let fallbackReason = 'NONE';
      let searchSources: string[] = [];
      let groundingMetadataReceived = false;
      let searchQueriesCount = 0;
      let searchChunksCount = 0;

      if (ai) {
        geminiRequestAttempted = true;

        try {
          let researchFindings = '';
          const cachedResearch = getCachedResearch(entityKey);

          if (cachedResearch) {
            console.log(`[research-endpoint] Reusing cached research findings for "${entityKey}" (skipping live grounding call)`);
            researchFindings = cachedResearch.findings;
            searchSources = cachedResearch.searchSources;
            groundingMetadataReceived = cachedResearch.groundingMetadataReceived;
            searchQueriesCount = cachedResearch.searchQueriesCount;
            searchChunksCount = cachedResearch.searchChunksCount;
          } else {
            // STEP 1: Live Grounded Web Research via Google Search tool
            const searchInquiry = `Search the live web using Google for verified official information about "${nameOrTitle}" in "${destinationOrLocation || 'Serbia'}".
Official URL: "${referenceUrl || ''}"
Curator notes: "${[descriptionOrNotes, additionalCuratorNotes].filter(Boolean).join(' | ')}"

Find and list the genuine verified facts:
1. Exact location, address, and GPS coordinates (latitude, longitude).
2. Official website, contact phone number, contact email.
3. Current opening hours and admission fees / pricing.
4. Editorial overview, background story, and key features.
Important: State only verified facts found in sources. Do not fabricate missing information.`;

            const startTimeGrounding = Date.now();
            try {
              const searchResponse = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: searchInquiry,
                config: {
                  tools: [{ googleSearch: {} }],
                  abortSignal: abortController.signal,
                },
              });
              logGeminiUsage({ callType: 'grounding', response: searchResponse, startTime: startTimeGrounding });

              const searchCandidate = searchResponse.candidates?.[0];
              const groundingMetadata = searchCandidate?.groundingMetadata;

              if (groundingMetadata) {
                groundingMetadataReceived = true;
                if (groundingMetadata.webSearchQueries) {
                  searchQueriesCount = groundingMetadata.webSearchQueries.length;
                  searchSources.push(...groundingMetadata.webSearchQueries);
                }
                if (groundingMetadata.groundingChunks) {
                  searchChunksCount = groundingMetadata.groundingChunks.length;
                  for (const chunk of groundingMetadata.groundingChunks) {
                    if (chunk.web?.uri) {
                      searchSources.push(chunk.web.uri);
                    }
                  }
                }
              }

              researchFindings = searchResponse.text || '';

              if (researchFindings) {
                setCachedResearch(entityKey, {
                  findings: researchFindings,
                  searchSources,
                  groundingMetadataReceived,
                  searchQueriesCount,
                  searchChunksCount,
                });
              }
            } catch (groundingErr: any) {
              logGeminiUsage({ callType: 'grounding', error: groundingErr, startTime: startTimeGrounding });
              throw groundingErr;
            }
          }

          if (abortController.signal.aborted || clientDisconnected) {
            console.warn(`[research-endpoint] Execution aborted for "${entityKey}": client disconnected`);
            return;
          }

          // STEP 2: Canonical 6-Step Structuring from Grounded Evidence
          const structuringPrompt = `
You are the authoritative IDEMO Travel Intelligence Research Agent for Serbia.
Your task is to structure the verified factual research into the canonical IDEMO 6-Step schema.

INPUT ENTITY:
- Name/Title: "${nameOrTitle}"
- Destination/Location: "${destinationOrLocation || ''}"
- Official Reference / Verification URL: "${referenceUrl || ''}"

GROUNDED RESEARCH FINDINGS:
${researchFindings}

RESEARCH & TAXONOMY INSTRUCTIONS:
1. ZERO FABRICATION DIRECTIVE:
   - Extract REAL, verified practical details (opening hours, contact phone, contact email, official website, admission fee / pricing).
   - If a practical field (e.g. phone, email, hours, pricing) was not verified, return an empty string ("") or null. NEVER invent synthetic numbers or emails.
2. REAL GEOLOCATION:
   - Identify the exact latitude and longitude coordinates for "${nameOrTitle}" in "${destinationOrLocation || 'Serbia'}".
   - For venues in Bogatić / Mačva, coordinates must be in the Bogatić region (~44.84-44.88 N, ~19.45-19.52 E). NEVER default to Belgrade Republic Square.
3. CANONICAL TAXONOMY:
   - Primary category must be exactly one of: Gastronomy, Culture, Nature, Nightlife, Shopping, Travel, History, Wellbeing.
   - For thermal spas, aqua parks, hot springs, thermal baths, wellness centers -> Category: Wellbeing, primary expertiseId: "exp-wellness-thermal".
   - Select 1-3 appropriate expertiseIds from canonical IDEMO expertise taxonomy:
     ["exp-wellness-thermal", "exp-wellness-spa", "exp-gastronomy-fine", "exp-gastronomy-traditional", "exp-gastronomy-wine", "exp-nature-hiking", "exp-nature-nationalparks", "exp-history-monasteries", "exp-history-fortresses", "exp-culture-museums", "exp-culture-festivals", "exp-nightlife-clubs", "exp-shopping-artisanal"]
4. EDITORIAL CONTENT (IDEMO LUXURY EDITORIAL VOICE):
   - Write a refined, understated, elegant English short overview (~40-60 words).
   - Write an English long story & curator advice (~120-250 words) providing context, atmosphere, and practical insider guidance.
   - Provide a Serbian (Cyrillic) title, Serbian location, Serbian short overview, and Serbian long story.
   - DO NOT generate German (de), Russian (ru), Spanish (es), or Simplified Chinese (zh) translations in this initial synchronous compile. Omit de, ru, es, zh translations.
5. 2D MOOD ORBIT CALIBRATION:
   - X axis (-5.0 Serene/Tranquil to +5.0 Vibrant/High Energy)
   - Y axis (-5.0 Remote Nature/Heritage to +5.0 Metropolitan/Urban)
   - Dimensional attributes [0.0 to 1.0]: energy, social, luxury, urbanity, nature, weatherDependency.
   - Mood tags: 2-3 tags from ["Serene", "Tranquil", "Thermal", "Wellness", "Gastronomic", "Vibrant", "Historic", "Scenic", "Romantic", "Epicurean"].

OUTPUT FORMAT:
Return a strictly valid JSON object (no markdown code blocks, just raw JSON or json markdown) with the following structure:
{
  "titleEn": "...",
  "titleSr": "...",
  "primaryCategory": "Wellbeing | Gastronomy | Nature | Culture | History | Nightlife | Shopping | Travel",
  "categories": ["Wellbeing", ...],
  "expertiseIds": ["exp-wellness-thermal", ...],
  "capabilityIds": ["cap-english-fluent"],
  "locationEn": "...",
  "locationSr": "...",
  "coordinates": { "lat": 44.867, "lng": 19.495 },
  "shortDescriptionEn": "...",
  "shortDescriptionSr": "...",
  "longDescriptionEn": "...",
  "longDescriptionSr": "...",
  "bestTimeToVisitEn": "...",
  "insiderTipEn": "...",
  "duration": "2-4 hours",
  "travelTime": "...",
  "travelTimeMinutes": 30,
  "estimatedCost": "€€",
  "preferredTransport": "Car / Regional Transit",
  "moodOrbit": {
    "coordinateX": -3.5,
    "coordinateY": -2.0,
    "energy": 0.3,
    "social": 0.5,
    "luxury": 0.6,
    "urbanity": 0.2,
    "nature": 0.7,
    "weatherDependency": 0.4,
    "seasonality": "all",
    "familySuitability": true,
    "accessibility": true,
    "premiumLevel": "standard",
    "budgetLevel": "moderate",
    "moods": ["Serene", "Thermal", "Wellness"]
  },
  "practicalInfo": {
    "opening_hours": "...",
    "contact_phone": "...",
    "contact_email": "...",
    "website": "...",
    "admission_fee": "..."
  },
  "translations": {
    "en": { "title": "...", "shortDescription": "...", "longDescription": "...", "location": "..." },
    "sr": { "title": "...", "shortDescription": "...", "longDescription": "...", "location": "..." }
  },
  "verifiedFacts": ["..."],
  "supportedFacts": ["..."],
  "unresolvedFields": ["..."],
  "sources": ["..."]
}
`;

          const startTimeStruct = Date.now();
          try {
            const structResponse = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: structuringPrompt,
              config: {
                abortSignal: abortController.signal,
              },
            });
            logGeminiUsage({ callType: 'structuring', response: structResponse, startTime: startTimeStruct });

            const textOutput = structResponse.text || '';
            if (textOutput) {
              // Extract JSON from output
              let cleanedJson = textOutput.trim();
              if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
              } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
              }

              try {
                researchedData = JSON.parse(cleanedJson);
                usedGemini = true;
              } catch (jsonErr) {
                console.error('[research-endpoint] Failed to parse model JSON:', jsonErr);
                fallbackReason = 'Failed to parse model JSON structured output';
              }
            }
          } catch (structErr: any) {
            logGeminiUsage({ callType: 'structuring', error: structErr, startTime: startTimeStruct });
            throw structErr;
          }
        } catch (apiErr: any) {
          const errStr = typeof apiErr === 'string' ? apiErr : (apiErr?.message || JSON.stringify(apiErr));
          const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
          if (isQuota) {
            console.warn('[research-endpoint] Live Gemini research request quota exceeded (429 RESOURCE_EXHAUSTED). Deterministic research fallback activated.');
            fallbackReason = '429 RESOURCE_EXHAUSTED (Quota Exceeded)';
          } else {
            console.warn('[research-endpoint] Live Gemini research request failed:', errStr.substring(0, 200));
            fallbackReason = `Gemini API invocation error: ${errStr.substring(0, 200)}`;
          }
        }
      } else {
        fallbackReason = 'GEMINI_API_KEY not configured on server';
      }

      if (clientDisconnected || abortController.signal.aborted) {
        return;
      }

      // If researchedData is not available, run strictly hardened deterministic semantic fallback
      if (!researchedData) {
        researchedData = generateDeterministicSemanticResearch(
          nameOrTitle,
          destinationOrLocation,
          referenceUrl,
          descriptionOrNotes,
          additionalCuratorNotes
        );
      }

      // Process and validate research data against canonical IDEMO rules
      const finalProposal = processAndAuditResearchData(
        body,
        researchedData,
        availableServiceAreas,
        usedGemini,
        searchSources,
        {
          geminiRequestAttempted,
          fallbackReason,
          groundingMetadataReceived,
          searchQueriesCount,
          searchChunksCount,
        }
      );

      return res.json(finalProposal);
    } catch (err: any) {
      console.error('[research-endpoint] Unexpected endpoint error:', err);
      const fallback = generateDeterministicSemanticResearch(
        nameOrTitle,
        destinationOrLocation,
        referenceUrl,
        descriptionOrNotes,
        additionalCuratorNotes
      );
      const finalProposal = processAndAuditResearchData(
        body,
        fallback,
        availableServiceAreas,
        false,
        [],
        {
          geminiRequestAttempted: false,
          fallbackReason: `Endpoint exception: ${err?.message || String(err)}`,
          groundingMetadataReceived: false,
          searchQueriesCount: 0,
          searchChunksCount: 0,
        }
      );
      return res.json(finalProposal);
    } finally {
      activeResearchRuns.delete(entityKey);
      req.removeListener('close', onCloseHandler);
    }
  });

  // Controlled Deferred Localization Endpoint
  app.post('/api/studio/recommendation-agent/localize', async (req: Request, res: Response) => {
    try {
      const { recommendation, targetLanguages } = req.body || {};
      if (!recommendation || !recommendation.id) {
        return res.status(400).json({ error: 'Valid recommendation object required' });
      }

      const langsToGenerate = targetLanguages && Array.isArray(targetLanguages) && targetLanguages.length > 0
        ? targetLanguages
        : ['de', 'ru', 'es', 'zh'];

      const existingTranslations = recommendation.translations || {};
      const langsNeeded = langsToGenerate.filter((l: string) => {
        const trans = existingTranslations[l];
        return !trans || !trans.shortDescription || trans.shortDescription === 'PENDING LOCALIZATION';
      });

      if (langsNeeded.length === 0) {
        return res.json({
          success: true,
          translations: existingTranslations,
          recommendation: recommendation,
          message: 'Requested localizations are already complete.',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are IDEMO's Luxury Concierge Translation Agent.
Translate the following Serbian/English tourism recommendation into localized versions for: ${langsNeeded.join(', ')}.

TITLE (EN): ${recommendation.title || ''}
TITLE (SR): ${recommendation.titleSr || ''}
LOCATION (EN): ${recommendation.location || ''}
LOCATION (SR): ${recommendation.locationSr || ''}
SHORT OVERVIEW (EN): ${recommendation.shortDescription || ''}
LONG STORY (EN): ${recommendation.longDescription || ''}

For each requested language code (${langsNeeded.join(', ')}), output a JSON object containing:
- title
- location
- shortDescription
- longDescription

OUTPUT FORMAT: Return raw JSON mapping each requested language code to its translated object:
{
  ${langsNeeded.map((l: string) => `"${l}": { "title": "...", "location": "...", "shortDescription": "...", "longDescription": "..." }`).join(',\n  ')}
}
`;

      const startTime = Date.now();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });
      logGeminiUsage({ callType: 'structuring', response, startTime });

      let textOutput = response.text || '';
      if (textOutput.startsWith('```json')) {
        textOutput = textOutput.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (textOutput.startsWith('```')) {
        textOutput = textOutput.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedTranslations = JSON.parse(textOutput.trim());

      const updatedTranslations = { ...existingTranslations };
      for (const lang of langsNeeded) {
        if (parsedTranslations[lang] && parsedTranslations[lang].shortDescription) {
          updatedTranslations[lang] = {
            title: parsedTranslations[lang].title || recommendation.title || '',
            location: parsedTranslations[lang].location || recommendation.location || '',
            shortDescription: parsedTranslations[lang].shortDescription || '',
            longDescription: parsedTranslations[lang].longDescription || '',
          };
        }
      }

      const updatedRecommendation = {
        ...recommendation,
        translations: updatedTranslations,
      };

      return res.json({
        success: true,
        translations: updatedTranslations,
        recommendation: updatedRecommendation,
      });
    } catch (err: any) {
      console.error('[localize-endpoint] Localization error:', err);
      const isQuota = String(err?.message || err).includes('429') || String(err?.message || err).includes('RESOURCE_EXHAUSTED');
      return res.status(isQuota ? 429 : 500).json({
        error: err?.message || String(err),
        quotaExceeded: isQuota,
      });
    }
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IDEMO Server] Running on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

/**
 * Deterministic Semantic Research Fallback (Strict Zero-Fabrication)
 * Used if Gemini API is unreachable or offline, ensuring ZERO fake data injection.
 * Coordinates, travel times, transport, and descriptions remain strictly unresearched.
 */
export function generateDeterministicSemanticResearch(
  nameOrTitle: string,
  destinationOrLocation?: string,
  referenceUrl?: string,
  descriptionOrNotes?: string,
  additionalCuratorNotes?: string
) {
  const textCombined = `${nameOrTitle} ${destinationOrLocation || ''} ${descriptionOrNotes || ''} ${additionalCuratorNotes || ''}`.toLowerCase();

  // Semantic Category Detection with Serbian / International linguistic support
  let primaryCategory = Category.CULTURE;
  let expertiseIds = ['exp-culture-museums'];
  let categories: string[] = ['Culture'];

  if (
    textCombined.includes('thermal') ||
    textCombined.includes('termaln') ||
    textCombined.includes('rivijer') ||
    textCombined.includes('spa') ||
    textCombined.includes('wellness') ||
    textCombined.includes('banja') ||
    textCombined.includes('kupališt') ||
    textCombined.includes('bazen') ||
    textCombined.includes('geotermal') ||
    textCombined.includes('spring') ||
    textCombined.includes('mineral water')
  ) {
    primaryCategory = Category.WELLBEING;
    expertiseIds = ['exp-wellness-thermal', 'exp-wellness-spa'];
    categories = ['Wellbeing', 'Travel'];
  } else if (
    textCombined.includes('restaurant') ||
    textCombined.includes('restoran') ||
    textCombined.includes('kafana') ||
    textCombined.includes('vino') ||
    textCombined.includes('wine') ||
    textCombined.includes('winery') ||
    textCombined.includes('vinarija') ||
    textCombined.includes('rakia') ||
    textCombined.includes('rakija') ||
    textCombined.includes('food') ||
    textCombined.includes('dining') ||
    textCombined.includes('gastronom')
  ) {
    primaryCategory = Category.GASTRONOMY;
    expertiseIds = ['exp-gastronomy-traditional'];
    categories = ['Gastronomy'];
  } else if (
    textCombined.includes('national park') ||
    textCombined.includes('nacionalni park') ||
    textCombined.includes('mountain') ||
    textCombined.includes('planina') ||
    textCombined.includes('hiking') ||
    textCombined.includes('canyon') ||
    textCombined.includes('kanjon') ||
    textCombined.includes('lake') ||
    textCombined.includes('jezero') ||
    textCombined.includes('river') ||
    textCombined.includes('reka')
  ) {
    primaryCategory = Category.NATURE;
    expertiseIds = ['exp-nature-nationalparks'];
    categories = ['Nature'];
  } else if (
    textCombined.includes('monastery') ||
    textCombined.includes('manastir') ||
    textCombined.includes('fortress') ||
    textCombined.includes('tvrdjava') ||
    textCombined.includes('tvrđava') ||
    textCombined.includes('heritage') ||
    textCombined.includes('istorij') ||
    textCombined.includes('archaeolog') ||
    textCombined.includes('arheolo')
  ) {
    primaryCategory = Category.HISTORY;
    expertiseIds = ['exp-history-monasteries'];
    categories = ['History', 'Culture'];
  }

  // Location string preservation without synthetic coordinate fabrication
  const locationEn = destinationOrLocation || '';
  const locationSr = destinationOrLocation || '';

  // Bespoke unresearched structural markers
  const titleEn = nameOrTitle;
  const titleSr = nameOrTitle;

  const shortDescriptionEn = `[Unresearched Structural Draft] ${nameOrTitle}${locationEn ? ` (${locationEn})` : ''}. Live research unavailable; curator verification required.`;
  const shortDescriptionSr = `[Нацрт без истраживања] ${nameOrTitle}${locationSr ? ` (${locationSr})` : ''}. Потребно је унети кураторски опис након истраживања.`;
  const longDescriptionEn = `[Unresearched Structural Draft] Live destination research was unavailable at proposal compilation time. Curator research and factual verification required for ${nameOrTitle}.`;
  const longDescriptionSr = `[Нацрт без истраживања] Аутоматско истраживање дестинације није било доступно. Потребно је унети аутентичне чињенице и кураторски опис за ${nameOrTitle}.`;

  return {
    titleEn,
    titleSr,
    primaryCategory,
    categories,
    expertiseIds,
    capabilityIds: ['cap-english-fluent'],
    locationEn: locationEn || nameOrTitle,
    locationSr: locationSr || nameOrTitle,
    coordinates: null, // ZERO FABRICATION: Do not inject regional or municipal centroids
    shortDescriptionEn,
    shortDescriptionSr,
    longDescriptionEn,
    longDescriptionSr,
    bestTimeToVisitEn: '',
    insiderTipEn: '',
    duration: '',
    travelTime: '',
    travelTimeMinutes: 0,
    estimatedCost: '',
    preferredTransport: '',
    moodOrbit: {
      coordinateX: primaryCategory === Category.WELLBEING ? -3.5 : 0.0,
      coordinateY: primaryCategory === Category.WELLBEING ? -2.0 : 0.0,
      energy: primaryCategory === Category.WELLBEING ? 0.3 : 0.5,
      social: 0.5,
      luxury: 0.5,
      urbanity: 0.5,
      nature: primaryCategory === Category.WELLBEING ? 0.6 : 0.5,
      weatherDependency: 0.3,
      seasonality: 'all',
      familySuitability: true,
      accessibility: true,
      premiumLevel: 'standard',
      budgetLevel: 'moderate',
      moods: primaryCategory === Category.WELLBEING ? ['Serene', 'Thermal', 'Wellness'] : ['Cultural', 'Authentic'],
    },
    practicalInfo: {
      opening_hours: '',
      contact_phone: '',
      contact_email: '',
      website: referenceUrl || '',
      admission_fee: '',
    },
    translations: {
      en: { title: titleEn, shortDescription: shortDescriptionEn, longDescription: longDescriptionEn, location: locationEn },
      sr: { title: titleSr, shortDescription: shortDescriptionSr, longDescription: longDescriptionSr, location: locationSr },
      de: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      ru: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      es: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      zh: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
    },
    verifiedFacts: [referenceUrl ? `Official website reference: ${referenceUrl}` : `Entity identification: ${nameOrTitle}`],
    supportedFacts: [`Primary category: ${primaryCategory}`, `Taxonomy: ${expertiseIds.join(', ')}`],
    unresolvedFields: ['coordinates', 'preferredTransport', 'travelTime', 'opening_hours', 'contact_phone', 'contact_email', 'admission_fee', 'shortDescription', 'longDescription'],
    sources: referenceUrl ? [referenceUrl] : [],
  };
}

/**
 * Process, Cleanse, Audit, and Map Researched Data to Canonical AgentCompilationResult
 */
export function processAndAuditResearchData(
  input: ResearchRequestPayload,
  researched: any,
  availableServiceAreas: Array<{ id: string; name: string; destination_code?: string }>,
  usedAi: boolean,
  sources: string[],
  provenanceMeta?: {
    geminiRequestAttempted: boolean;
    fallbackReason: string;
    groundingMetadataReceived: boolean;
    searchQueriesCount: number;
    searchChunksCount: number;
  }
) {
  // 1. Authoritative Service Area Resolution
  let resolvedServiceAreaId = input.targetServiceAreaId || '';
  let serviceAreaName = '';
  let isResolved = false;
  let resolutionNote = '';

  const locationQuery = `${input.destinationOrLocation || ''} ${input.nameOrTitle} ${researched.locationEn || ''}`.toLowerCase();

  if (resolvedServiceAreaId) {
    const matched = availableServiceAreas.find((sa) => sa.id === resolvedServiceAreaId);
    if (matched) {
      serviceAreaName = (matched as any).name_en || (matched as any).name_sr || matched.name || matched.id;
      isResolved = true;
      resolutionNote = `Explicitly targeted service area: ${serviceAreaName}`;
    }
  }

  if (!isResolved && availableServiceAreas.length > 0) {
    // Attempt strict match across active service areas
    for (const sa of availableServiceAreas) {
      const saName = ((sa as any).name_en || (sa as any).name_sr || sa.name || '').toLowerCase();
      const code = (sa.destination_code || '').toLowerCase();
      const saId = sa.id.toLowerCase();

      // 1. Western Serbia & Podrinje (sa-west-003) - Bogatić, Mačva, Šabac, Zlatibor, Tara
      if (
        (saId === 'sa-west-003' || saName.includes('west') || saName.includes('podrinje') || saName.includes('zlatibor') || saName.includes('tara')) &&
        (locationQuery.includes('bogatić') || locationQuery.includes('bogatic') || locationQuery.includes('mačva') || locationQuery.includes('macva') || locationQuery.includes('šabac') || locationQuery.includes('sabac') || locationQuery.includes('loznica') || locationQuery.includes('zlatibor') || locationQuery.includes('tara') || locationQuery.includes('mokra gora') || locationQuery.includes('valjevo') || locationQuery.includes('podrinje'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Western Serbia & Podrinje';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }

      // 2. Belgrade Metropolitan Area (sa-belgrade-001)
      if (
        (saId === 'sa-belgrade-001' || saName.includes('belgrade') || code === 'beg') &&
        (locationQuery.includes('belgrade') || locationQuery.includes('beograd') || locationQuery.includes('zemun') || locationQuery.includes('dorcol') || locationQuery.includes('dorćol') || locationQuery.includes('vračar') || locationQuery.includes('vracar'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Belgrade';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }

      // 3. Novi Sad & Vojvodina (sa-novisad-002)
      if (
        (saId === 'sa-novisad-002' || saName.includes('novi sad') || code === 'ns') &&
        (locationQuery.includes('novi sad') || locationQuery.includes('petrovaradin') || locationQuery.includes('subotica') || locationQuery.includes('palić') || locationQuery.includes('palic'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Novi Sad & Vojvodina';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }

      // 4. Šumadija & Central Serbia (sa-sumadija-004)
      if (
        (saId === 'sa-sumadija-004' || saName.includes('šumadija') || saName.includes('sumadija') || saName.includes('central')) &&
        (locationQuery.includes('kragujevac') || locationQuery.includes('kraljevo') || locationQuery.includes('vrnjačka banja') || locationQuery.includes('vrnjacka banja') || locationQuery.includes('topola') || locationQuery.includes('arandjelovac'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Šumadija & Central Serbia';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }

      // 5. Eastern Serbia & Lower Danube (sa-east-005)
      if (
        (saId === 'sa-east-005' || saName.includes('east') || saName.includes('danube')) &&
        (locationQuery.includes('golubac') || locationQuery.includes('kladovo') || locationQuery.includes('majdanpek') || locationQuery.includes('djerdap') || locationQuery.includes('đerdap') || locationQuery.includes('zaječar') || locationQuery.includes('sokobanja'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Eastern Serbia & Lower Danube';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }

      // 6. Niš & Southern Serbia (sa-south-006)
      if (
        (saId === 'sa-south-006' || saName.includes('south') || saName.includes('niš') || saName.includes('nis')) &&
        (locationQuery.includes('niš') || locationQuery.includes('nis') || locationQuery.includes('leskovac') || locationQuery.includes('vranje') || locationQuery.includes('pirot') || locationQuery.includes('stara planina'))
      ) {
        resolvedServiceAreaId = sa.id;
        serviceAreaName = (sa as any).name_en || sa.name || 'Niš & Southern Serbia';
        isResolved = true;
        resolutionNote = `Matched authoritative service area: ${serviceAreaName}`;
        break;
      }
    }
  }

  if (!isResolved) {
    resolvedServiceAreaId = '';
    serviceAreaName = 'UNRESOLVED';
    resolutionNote = `Location "${input.destinationOrLocation || input.nameOrTitle}" does not match an active destination service area in IDEMO. Admin action required.`;
  }

  // 2. Media Handling (Human Media Precedence)
  let mediaHandlingType: 'HUMAN_MANDATORY' | 'AGENT_CURATED' | 'RESEARCH_CANDIDATE' = 'RESEARCH_CANDIDATE';
  let finalImageUrl = '';
  let precedenceEnforced = false;
  let provenanceSource = 'Studio Editorial Research';
  let provenanceLicense = 'CC-BY-4.0';
  let provenanceStatus = 'Unverified';

  if (input.humanProvidedMedia?.url) {
    mediaHandlingType = 'HUMAN_MANDATORY';
    finalImageUrl = input.humanProvidedMedia.url;
    precedenceEnforced = true;
    provenanceSource = input.humanProvidedMedia.source || 'Curator Submission';
    provenanceLicense = input.humanProvidedMedia.license || 'Proprietary / Human Provided';
    provenanceStatus = 'Verified';
  } else {
    // No human media provided: Leave image UNRESOLVED / empty for Admin action!
    // NEVER attach fake stock photos of rakia bars to thermal spas.
    finalImageUrl = '';
    mediaHandlingType = 'RESEARCH_CANDIDATE';
    precedenceEnforced = false;
    provenanceSource = 'Pending Human Upload';
    provenanceStatus = 'Unverified';
  }

  // 3. Coordinate validation (Strict Zero-Fabrication)
  let coordinates: { lat: number; lng: number } | undefined = undefined;
  if (
    researched.coordinates &&
    typeof researched.coordinates.lat === 'number' &&
    typeof researched.coordinates.lng === 'number'
  ) {
    const lat = researched.coordinates.lat;
    const lng = researched.coordinates.lng;
    // Note: exact {0,0} is Null Island sentinel (invalid/unresolved).
    // Legitimate zeroes (e.g. lat=0, lng=30 or lat=45, lng=0) are preserved.
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      !(lat === 0 && lng === 0) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      coordinates = { lat, lng };
    }
  }

  // 4. Practical info cleansing (Strict Zero-Fabrication)
  const rawPractical = researched.practicalInfo || {};
  const cleanPractical = {
    opening_hours: sanitizeString(rawPractical.opening_hours),
    contact_phone: sanitizeString(rawPractical.contact_phone),
    contact_email: sanitizeString(rawPractical.contact_email),
    website: sanitizeString(rawPractical.website) || input.referenceUrl || '',
    admission_fee: sanitizeString(rawPractical.admission_fee),
  };

  // 5. Descriptions cleansing
  const isUnresearchedDraft =
    !usedAi ||
    (typeof researched.shortDescriptionEn === 'string' && researched.shortDescriptionEn.includes('[Unresearched')) ||
    (typeof researched.longDescriptionEn === 'string' && researched.longDescriptionEn.includes('[Unresearched'));

  // 6. Evidence Audit Tracking
  const verifiedFields: string[] = [];
  const supportedFields: string[] = [];
  const unresolvedFields: string[] = [];
  const fieldStatuses: Array<{ fieldName: string; status: 'VERIFIED' | 'SUPPORTED' | 'UNRESOLVED'; sourceOrRationale: string }> = [];

  // Track Title & Identity
  verifiedFields.push('title');
  fieldStatuses.push({ fieldName: 'title', status: 'VERIFIED', sourceOrRationale: 'Supplied by Curator / Verified entity' });

  // Track Category
  if (researched.primaryCategory) {
    verifiedFields.push('category', 'expertiseIds');
    fieldStatuses.push({ fieldName: 'category', status: 'VERIFIED', sourceOrRationale: `Semantic classification: ${researched.primaryCategory}` });
  }

  // Track Coordinates
  if (coordinates) {
    supportedFields.push('coordinates');
    fieldStatuses.push({ fieldName: 'coordinates', status: 'SUPPORTED', sourceOrRationale: `Geocoded to ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` });
  } else {
    unresolvedFields.push('coordinates');
    fieldStatuses.push({ fieldName: 'coordinates', status: 'UNRESOLVED', sourceOrRationale: 'Precise venue coordinates could not be resolved without live research' });
  }

  // Track Service Area
  if (isResolved) {
    verifiedFields.push('serviceAreaId');
    fieldStatuses.push({ fieldName: 'serviceAreaId', status: 'VERIFIED', sourceOrRationale: serviceAreaName });
  } else {
    unresolvedFields.push('serviceAreaId');
    fieldStatuses.push({ fieldName: 'serviceAreaId', status: 'UNRESOLVED', sourceOrRationale: resolutionNote });
  }

  // Track Media
  if (input.humanProvidedMedia?.url) {
    verifiedFields.push('image');
    fieldStatuses.push({ fieldName: 'image', status: 'VERIFIED', sourceOrRationale: 'Human-provided media attached' });
  } else {
    unresolvedFields.push('image');
    fieldStatuses.push({ fieldName: 'image', status: 'UNRESOLVED', sourceOrRationale: 'No verified human media supplied. Awaiting Admin image upload' });
  }

  // Track Descriptions
  if (!isUnresearchedDraft && researched.shortDescriptionEn) {
    supportedFields.push('shortDescription');
    fieldStatuses.push({ fieldName: 'shortDescription', status: 'SUPPORTED', sourceOrRationale: 'Synthesized from verified live research' });
  } else {
    unresolvedFields.push('shortDescription');
    fieldStatuses.push({ fieldName: 'shortDescription', status: 'UNRESOLVED', sourceOrRationale: 'Unresearched structural draft — requires curator verification' });
  }

  if (!isUnresearchedDraft && researched.longDescriptionEn) {
    supportedFields.push('longDescription');
    fieldStatuses.push({ fieldName: 'longDescription', status: 'SUPPORTED', sourceOrRationale: 'Synthesized from verified live research' });
  } else {
    unresolvedFields.push('longDescription');
    fieldStatuses.push({ fieldName: 'longDescription', status: 'UNRESOLVED', sourceOrRationale: 'Unresearched structural draft — requires curator verification' });
  }

  // Track Preferred Transport
  if (researched.preferredTransport && sanitizeString(researched.preferredTransport)) {
    supportedFields.push('preferredTransport');
    fieldStatuses.push({ fieldName: 'preferredTransport', status: 'SUPPORTED', sourceOrRationale: researched.preferredTransport });
  } else {
    unresolvedFields.push('preferredTransport');
    fieldStatuses.push({ fieldName: 'preferredTransport', status: 'UNRESOLVED', sourceOrRationale: 'Transit options unresearched' });
  }

  // Track Practical Details
  if (cleanPractical.opening_hours) {
    supportedFields.push('practicalInfo.opening_hours');
    fieldStatuses.push({ fieldName: 'practicalInfo.opening_hours', status: 'SUPPORTED', sourceOrRationale: cleanPractical.opening_hours });
  } else {
    unresolvedFields.push('practicalInfo.opening_hours');
    fieldStatuses.push({ fieldName: 'practicalInfo.opening_hours', status: 'UNRESOLVED', sourceOrRationale: 'Not found in official source' });
  }

  if (cleanPractical.contact_phone) {
    supportedFields.push('practicalInfo.contact_phone');
    fieldStatuses.push({ fieldName: 'practicalInfo.contact_phone', status: 'SUPPORTED', sourceOrRationale: cleanPractical.contact_phone });
  } else {
    unresolvedFields.push('practicalInfo.contact_phone');
    fieldStatuses.push({ fieldName: 'practicalInfo.contact_phone', status: 'UNRESOLVED', sourceOrRationale: 'Not found in official source' });
  }

  if (cleanPractical.contact_email) {
    supportedFields.push('practicalInfo.contact_email');
    fieldStatuses.push({ fieldName: 'practicalInfo.contact_email', status: 'SUPPORTED', sourceOrRationale: cleanPractical.contact_email });
  } else {
    unresolvedFields.push('practicalInfo.contact_email');
    fieldStatuses.push({ fieldName: 'practicalInfo.contact_email', status: 'UNRESOLVED', sourceOrRationale: 'Not found in official source' });
  }

  if (cleanPractical.admission_fee) {
    supportedFields.push('practicalInfo.admission_fee');
    fieldStatuses.push({ fieldName: 'practicalInfo.admission_fee', status: 'SUPPORTED', sourceOrRationale: cleanPractical.admission_fee });
  } else {
    unresolvedFields.push('practicalInfo.admission_fee');
    fieldStatuses.push({ fieldName: 'practicalInfo.admission_fee', status: 'UNRESOLVED', sourceOrRationale: 'Not found in official source' });
  }

  // Build canonical Recommendation object
  const canonicalRec = {
    id: `rec-candidate-${Date.now()}`,
    serviceAreaId: resolvedServiceAreaId,
    title: researched.titleEn || input.nameOrTitle,
    titleSr: researched.titleSr || input.nameOrTitle,
    category: researched.primaryCategory || Category.GASTRONOMY,
    categories: researched.categories || [researched.primaryCategory || Category.GASTRONOMY],
    expertiseIds: researched.expertiseIds || ['exp-culture-museums'],
    capabilityIds: researched.capabilityIds || ['cap-english-fluent'],
    shortDescription: researched.shortDescriptionEn || '',
    shortDescriptionSr: researched.shortDescriptionSr || '',
    longDescription: researched.longDescriptionEn || '',
    longDescriptionSr: researched.longDescriptionSr || '',
    location: researched.locationEn || input.destinationOrLocation || '',
    locationSr: researched.locationSr || input.destinationOrLocation || '',
    bestTimeToVisitEn: researched.bestTimeToVisitEn || '',
    insiderTipEn: researched.insiderTipEn || '',
    duration: researched.duration || '',
    travelTime: researched.travelTime || '',
    travelTimeMinutes: researched.travelTimeMinutes || 0,
    estimatedCost: researched.estimatedCost || '',
    preferredTransport: sanitizeString(researched.preferredTransport),
    image: finalImageUrl,
    coordinates: coordinates || undefined,
    coordinateX: researched.moodOrbit?.coordinateX ?? 0,
    coordinateY: researched.moodOrbit?.coordinateY ?? 0,
    energy: researched.moodOrbit?.energy ?? 0.5,
    social: researched.moodOrbit?.social ?? 0.5,
    luxury: researched.moodOrbit?.luxury ?? 0.5,
    urbanity: researched.moodOrbit?.urbanity ?? 0.5,
    nature: researched.moodOrbit?.nature ?? 0.5,
    weatherDependency: researched.moodOrbit?.weatherDependency ?? 0.3,
    seasonality: researched.moodOrbit?.seasonality ?? 'all',
    familySuitability: researched.moodOrbit?.familySuitability ?? true,
    accessibility: researched.moodOrbit?.accessibility ?? true,
    premiumLevel: researched.moodOrbit?.premiumLevel ?? 'standard',
    budgetLevel: researched.moodOrbit?.budgetLevel ?? 'moderate',
    moods: researched.moodOrbit?.moods || ['Serene', 'Thermal'],
    website: cleanPractical.website,
    phone: cleanPractical.contact_phone,
    practicalInfo: cleanPractical,
    provenance: {
      source: provenanceSource,
      method: input.humanProvidedMedia?.url ? 'original' : undefined,
      license: provenanceLicense,
      attributionRequired: false,
      attributionText: 'IDEMO Serbia Concierge',
      verificationStatus: provenanceStatus,
      altText: researched.titleEn || input.nameOrTitle,
    },
    translations: {
      en: researched.translations?.en || { title: researched.titleEn || input.nameOrTitle, shortDescription: researched.shortDescriptionEn || '', longDescription: researched.longDescriptionEn || '', location: researched.locationEn || '' },
      sr: researched.translations?.sr || { title: researched.titleSr || input.nameOrTitle, shortDescription: researched.shortDescriptionSr || '', longDescription: researched.longDescriptionSr || '', location: researched.locationSr || '' },
      de: (researched.translations?.de && researched.translations.de.shortDescription && researched.translations.de.shortDescription !== 'PENDING LOCALIZATION') ? researched.translations.de : { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      ru: (researched.translations?.ru && researched.translations.ru.shortDescription && researched.translations.ru.shortDescription !== 'PENDING LOCALIZATION') ? researched.translations.ru : { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      es: (researched.translations?.es && researched.translations.es.shortDescription && researched.translations.es.shortDescription !== 'PENDING LOCALIZATION') ? researched.translations.es : { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      zh: (researched.translations?.zh && researched.translations.zh.shortDescription && researched.translations.zh.shortDescription !== 'PENDING LOCALIZATION') ? researched.translations.zh : { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
    },
  };

  // Partner Intelligence evaluation (uncontaminated)
  const partnerEvaluation = {
    hasSuitablePartner: false,
    partnerCount: 0,
    topMatch: null,
    matches: [],
    suitabilityScore: 0,
    reasons: isResolved
      ? [`Evaluated against ${canonicalRec.category} offerings in ${serviceAreaName}.`]
      : ['Service area unresolved; partner matching deferred until destination is mapped.'],
  };

  const isQuotaExceeded =
    provenanceMeta?.fallbackReason?.includes('429') ||
    provenanceMeta?.fallbackReason?.includes('RESOURCE_EXHAUSTED') ||
    false;

  return {
    recommendation: canonicalRec,
    evidenceReport: {
      verifiedFields,
      supportedFields,
      unresolvedFields,
      fieldStatuses,
      serviceAreaResolution: {
        isResolved,
        serviceAreaId: resolvedServiceAreaId,
        serviceAreaName,
        requiresAdminReview: !isResolved,
        resolutionNote,
      },
      mediaHandling: {
        type: mediaHandlingType,
        mediaUrl: finalImageUrl,
        precedenceEnforced,
        provenanceSource,
        provenanceLicense,
      },
      lifecycleStatus: usedAi && isResolved ? 'CANDIDATE' : 'NEEDS RESEARCH',
      headerVisualState: 'AMBER',
    },
    partnerIntelligence: partnerEvaluation,
    metadata: {
      usedAi,
      executionMode: usedAi ? 'GEMINI_GROUNDED' : 'DETERMINISTIC_FALLBACK',
      model: usedAi ? 'gemini-3.7-flash' : 'deterministic_semantic_engine',
      geminiRequestAttempted: provenanceMeta?.geminiRequestAttempted ?? false,
      geminiRequestSucceeded: usedAi,
      fallbackInvoked: !usedAi,
      fallbackReason: provenanceMeta?.fallbackReason || (usedAi ? 'NONE' : 'Live research unavailable'),
      googleSearchGroundingMetadataReceived: provenanceMeta?.groundingMetadataReceived ?? false,
      groundingWebSearchQueriesCount: provenanceMeta?.searchQueriesCount ?? 0,
      groundingChunksCount: provenanceMeta?.searchChunksCount ?? 0,
      quotaExceeded: isQuotaExceeded,
      userNotice: usedAi
        ? undefined
        : 'LIVE RESEARCH UNAVAILABLE. Proposal preserved as AMBER draft. Unverified fields remain unresolved.',
      sources: [...new Set([...sources, ...(researched.sources || [])])],
    },
  };
}

function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim();
  // Filter out known banned placeholders
  if (
    trimmed === '+381 11 328 1234' ||
    trimmed === 'concierge@experience.rs' ||
    trimmed === 'https://experience.rs' ||
    trimmed === '09:00 - 22:00 Daily' ||
    trimmed === 'Free entry / Ala carte' ||
    trimmed === 'Taxi / Walking' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none' ||
    trimmed.toLowerCase() === 'unknown'
  ) {
    return '';
  }
  return trimmed;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
