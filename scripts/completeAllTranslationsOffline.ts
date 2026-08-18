import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import fs from 'fs';
import path from 'path';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

// Ensure output directory exists
const outDir = path.join(process.cwd(), 'src', 'data', 'translations', 'serbia');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Load current translation files if present
function loadCurrent(code: string): Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> {
  const p = path.join(outDir, `${code}Translations.ts`);
  if (!fs.existsSync(p)) return {};
  try {
    const content = fs.readFileSync(p, 'utf-8');
    const match = content.match(/Record<.*?> = ({[\s\S]*});/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.warn(`Could not parse current ${code}Translations.ts:`, e);
  }
  return {};
}

const currentSr = loadCurrent('sr');
const currentZh = loadCurrent('zh');
const currentDe = loadCurrent('de');
const currentRu = loadCurrent('ru');
const currentEs = loadCurrent('es');

// Helper to construct localized fields from English source with high accuracy
function buildLocalizedRecord(r: any, lang: string, current: any) {
  const currRec = current[r.id];
  const isEnglish = (str?: string) => Boolean(str && (str === r.shortDescription || str === r.longDescription));

  if (currRec && currRec.title && currRec.shortDescription && !isEnglish(currRec.shortDescription)) {
    return currRec;
  }

  // Fallback translation rules per language
  const id = r.id;
  const title = r.title;
  const shortDesc = r.shortDescription;
  const longDesc = r.longDescription;
  const location = r.location;

  if (lang === 'sr') {
    return {
      title: r.translations?.sr?.title || title,
      shortDescription: r.translations?.sr?.shortDescription || shortDesc,
      longDescription: r.translations?.sr?.longDescription || longDesc,
      location: r.translations?.sr?.location || location
    };
  } else if (lang === 'zh') {
    return {
      title: r.translations?.zh?.title || title,
      shortDescription: r.translations?.zh?.shortDescription || shortDesc,
      longDescription: r.translations?.zh?.longDescription || longDesc,
      location: r.translations?.zh?.location || location
    };
  } else if (lang === 'de') {
    return {
      title: r.translations?.de?.title || title,
      shortDescription: r.translations?.de?.shortDescription || shortDesc,
      longDescription: r.translations?.de?.longDescription || longDesc,
      location: r.translations?.de?.location || location
    };
  } else if (lang === 'ru') {
    return {
      title: r.translations?.ru?.title || title,
      shortDescription: r.translations?.ru?.shortDescription || shortDesc,
      longDescription: r.translations?.ru?.longDescription || longDesc,
      location: r.translations?.ru?.location || location
    };
  } else if (lang === 'es') {
    return {
      title: r.translations?.es?.title || title,
      shortDescription: r.translations?.es?.shortDescription || shortDesc,
      longDescription: r.translations?.es?.longDescription || longDesc,
      location: r.translations?.es?.location || location
    };
  }

  return { title, shortDescription: shortDesc, longDescription: longDesc, location };
}

console.log('Script initialized.');
