import { GoogleGenAI } from '@google/genai';
import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

const canonicalRecs = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

interface TranslationRecord {
  title: string;
  shortDescription: string;
  longDescription: string;
  location: string;
}

const targetLangs = [
  { code: 'sr', name: 'Serbian', wave: 'Wave 1' },
  { code: 'zh', name: 'Chinese Simplified', wave: 'Wave 2' },
  { code: 'de', name: 'German', wave: 'Wave 3' },
  { code: 'ru', name: 'Russian', wave: 'Wave 4' },
  { code: 'es', name: 'Spanish', wave: 'Wave 5' },
];

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function translateBatchWithRetry(items: any[], langName: string, langCode: string, retries = 5): Promise<Record<string, TranslationRecord>> {
  const promptItems = items.map(item => ({
    id: item.id,
    title: item.title,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    location: item.location,
    existing: item.translations?.[langCode] || null
  }));

  const prompt = `You are an expert editorial translator for the IDEMO Concierge Serbia application.
Translate the following ${items.length} Serbia recommendation items from English into ${langName} (${langCode}).

RULES:
1. Preserve factual meaning.
2. Preserve official names, institution names, personal names and protected cultural terminology.
3. Do not invent facts, prices, schedules, awards, services or historical claims.
4. Maintain IDEMO editorial style: factual, concise, culturally informed, understated, natural, free of promotional exaggeration.
5. If an existing translation for ${langCode} is provided and already accurate and complete, preserve and refine it.
6. Return a JSON object mapping each recommendation ID string to an object with keys: title, shortDescription, longDescription, location.
7. Output valid raw JSON only.

Input Items:
${JSON.stringify(promptItems, null, 2)}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (err: any) {
      console.warn(`Attempt ${attempt} failed for ${langCode}: ${err.message || err}`);
      if (attempt === retries) throw err;
      const wait = 15000 * attempt;
      console.log(`Waiting ${wait / 1000}s before retrying...`);
      await sleep(wait);
    }
  }
  return {};
}

async function runWaveForLang(target: { code: string; name: string; wave: string }) {
  const outDir = path.join(process.cwd(), 'src', 'data', 'translations', 'serbia');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, `${target.code}Translations.ts`);

  console.log(`\n============================================`);
  console.log(`STARTING ${target.wave}: ${target.name} (${target.code.toUpperCase()})`);
  console.log(`============================================`);

  const langDict: Record<string, TranslationRecord> = {};

  // Batch size 25 items per request to minimize API calls (135 items / 25 = 6 requests)
  const batchSize = 25;

  for (let i = 0; i < canonicalRecs.length; i += batchSize) {
    const batch = canonicalRecs.slice(i, i + batchSize);
    console.log(`Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(canonicalRecs.length / batchSize)} (${target.code.toUpperCase()})...`);

    const res = await translateBatchWithRetry(batch, target.name, target.code);

    for (const item of batch) {
      if (res[item.id] && res[item.id].title && res[item.id].shortDescription && res[item.id].longDescription && res[item.id].location) {
        langDict[item.id] = {
          title: res[item.id].title,
          shortDescription: res[item.id].shortDescription,
          longDescription: res[item.id].longDescription,
          location: res[item.id].location
        };
      } else {
        console.warn(`Missing generated translation for ID ${item.id} in ${target.code}`);
        langDict[item.id] = {
          title: item.translations?.[target.code]?.title || item.title,
          shortDescription: item.translations?.[target.code]?.shortDescription || item.shortDescription,
          longDescription: item.translations?.[target.code]?.longDescription || item.longDescription,
          location: item.translations?.[target.code]?.location || item.location
        };
      }
    }

    // Pacing delay between requests to stay under rate limit
    if (i + batchSize < canonicalRecs.length) {
      console.log(`Pacing sleep 12s...`);
      await sleep(12000);
    }
  }

  const fileContent = `/**
 * IDEMO Canonical Serbia Baseline v2 — ${target.name} (${target.code.toUpperCase()}) Translations
 * Work Package: WP-09
 */

export const ${target.code}CanonicalTranslations: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = ${JSON.stringify(langDict, null, 2)};
`;

  fs.writeFileSync(filePath, fileContent);
  console.log(`Successfully generated and saved ${target.code}Translations.ts with ${Object.keys(langDict).length} items.`);
}

async function runSingleWave() {
  const langArg = process.argv[2] || 'sr';
  const target = targetLangs.find(t => t.code === langArg) || targetLangs[0];
  await runWaveForLang(target);
}

runSingleWave().catch(console.error);
