/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO PARTNER RESPONSE TRANSLATION SERVICE
 * Ensures all partner responses, proposals, notes, and terms are delivered in English.
 * Supports synchronous instant dictionary translation and asynchronous server-side AI translation.
 */

// Common Serbian partner phrases mapped directly to professional concierge English
const EXACT_PHRASE_TRANSLATIONS: Record<string, string> = {
  // Acceptance defaults
  'upit prihvaćen. radujem se saradnji.': 'Inquiry accepted. Looking forward to hosting you.',
  'upit prihvacen. radujem se saradnji.': 'Inquiry accepted. Looking forward to hosting you.',
  'upit prihvaćen. radujem se saradnji': 'Inquiry accepted. Looking forward to hosting you.',
  'upit prihvacen. radujem se saradnji': 'Inquiry accepted. Looking forward to hosting you.',
  'upit prihvaćen': 'Inquiry accepted.',
  'upit prihvacen': 'Inquiry accepted.',
  'upit prihvaćen!': 'Inquiry accepted!',
  'upit prihvacen!': 'Inquiry accepted!',
  'prihvaćen predlog putnika': 'Traveler counter-offer accepted.',
  'prihvacen predlog putnika': 'Traveler counter-offer accepted.',
  'prihvaćen predlog putnika!': 'Traveler counter-offer accepted!',
  'prihvacen predlog putnika!': 'Traveler counter-offer accepted!',
  'accepted via partner portal': 'Accepted via Partner Portal',
  'counter offer accepted': 'Counter offer accepted',
  
  // Greetings & welcomes
  'radujem se saradnji': 'Looking forward to collaborating with you.',
  'radujem se vašem dolasku': 'Looking forward to your arrival.',
  'radujem se vasem dolasku': 'Looking forward to your arrival.',
  'dobrodošli u srbiju': 'Welcome to Serbia.',
  'dobrodosli u srbiju': 'Welcome to Serbia.',
  'dobrodošli': 'Welcome.',
  'dobrodosli': 'Welcome.',
  'vidimo se': 'See you then.',
  'vidimo se uskoro': 'See you soon.',
  'sve je u redu': 'Everything is confirmed and set.',
  'sve je dogovoreno': 'Everything is agreed and arranged.',
  'potvrđujem dolazak': 'I confirm our meeting.',
  'potvrdjujem dolazak': 'I confirm our meeting.',
  'potvrđujem termin': 'I confirm the scheduled time.',
  'potvrdjujem termin': 'I confirm the scheduled time.',
  'dogovoreno': 'Agreed and confirmed.',
  'u redu': 'All set.',
};

// Common Serbian travel & scheduling vocabulary replacements
const PARTIAL_TRANSLATIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^predložen zamenski termin:\s*/i, replacement: 'Alternative proposed time: ' },
  { pattern: /^predlozen zamenski termin:\s*/i, replacement: 'Alternative proposed time: ' },
  { pattern: /^zamenski termin:\s*/i, replacement: 'Alternative time: ' },
  { pattern: /\bupit prihvaćen\b/gi, replacement: 'inquiry accepted' },
  { pattern: /\bupit prihvacen\b/gi, replacement: 'inquiry accepted' },
  { pattern: /\bradujem se saradnji\b/gi, replacement: 'looking forward to our collaboration' },
  { pattern: /\bradujem se vašem dolasku\b/gi, replacement: 'looking forward to your arrival' },
  { pattern: /\bradujem se vasem dolasku\b/gi, replacement: 'looking forward to your arrival' },
  { pattern: /\bvidimo se uskoro\b/gi, replacement: 'see you soon' },
  { pattern: /\bvidimo se u\b/gi, replacement: 'see you at' },
  { pattern: /\bmožemo se naći u\b/gi, replacement: 'we can meet at' },
  { pattern: /\bmozemo se naci u\b/gi, replacement: 'we can meet at' },
  { pattern: /\bmogu da vas dočekam\b/gi, replacement: 'I can welcome you' },
  { pattern: /\bmogu da vas docekam\b/gi, replacement: 'I can welcome you' },
  { pattern: /\bpotvrđujem termin\b/gi, replacement: 'I confirm the time' },
  { pattern: /\bpotvrdjujem termin\b/gi, replacement: 'I confirm the time' },
  { pattern: /\bsve je spremno\b/gi, replacement: 'everything is ready' },
  { pattern: /\bsve je u redu\b/gi, replacement: 'everything is in order' },
  { pattern: /\bsrdečan pozdrav\b/gi, replacement: 'warm regards' },
  { pattern: /\bsrdacan pozdrav\b/gi, replacement: 'warm regards' },
  { pattern: /\bhvala vam\b/gi, replacement: 'thank you' },
  { pattern: /\bhvala\b/gi, replacement: 'thank you' },
];

/**
 * Fast synchronous heuristic to detect if text is predominantly English
 */
export function isEnglishText(text: string): boolean {
  if (!text || !text.trim()) return true;
  const trimmed = text.trim();

  // If contains Serbian Cyrillic characters, definitely non-English
  if (/[\u0400-\u04FF]/.test(trimmed)) return false;

  // If contains Serbian Latin diacritics (č, ć, ž, š, đ)
  if (/[čćžšđČĆŽŠĐ]/.test(trimmed)) return false;

  // Check for common Serbian words that do not exist in English
  const serbianMarkerWords = /\b(sam|smo|ste|su|smo|nismo|nisam|niste|nisu|biće|bice|bilo|bila|ovaj|ovom|ovog|ovde|tamo|kada|kako|zasto|zašto|drago|mi|nam|vam|im|vas|nama|vama|putnika|radujem|saradnji|prihvacen|prihvaćen|upit|ponuda|lokacije|termin|vreme|dan|sutra|danas|vidimo|dogovoreno)\b/i;
  if (serbianMarkerWords.test(trimmed)) return false;

  return true;
}

/**
 * Synchronous dictionary & rule-based translation to ensure instant English output without lag
 */
export function ensureEnglishSync(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // 1. Check exact dictionary matches
  if (EXACT_PHRASE_TRANSLATIONS[lower]) {
    return EXACT_PHRASE_TRANSLATIONS[lower];
  }

  // 2. Check if already English
  if (isEnglishText(trimmed)) {
    return trimmed;
  }

  // 3. Apply pattern replacements
  let translated = trimmed;
  for (const { pattern, replacement } of PARTIAL_TRANSLATIONS) {
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, replacement);
    }
  }

  // If the translation was successful and removed non-English traits, return it
  if (translated !== trimmed) {
    return translated;
  }

  // If it's a known alternative proposal date pattern (e.g. "Predložen termin 2026-10-15 14:00")
  if (/predlo[žz]en/i.test(trimmed) && /\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.replace(/predlo[žz]en\s*(zamenski)?\s*termin:?/i, 'Alternative proposed time:');
  }

  // Default clean English fallback for untranslated Serbian affirmative responses
  if (/prihva[ćc]en/i.test(trimmed)) {
    return 'Inquiry accepted. Looking forward to hosting you.';
  }

  return translated;
}

/**
 * Asynchronous translation: uses server-side Gemini translation with instantaneous fallback
 */
export async function ensureEnglishPartnerResponse(text: string | null | undefined): Promise<string> {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If already clean English, return immediately
  if (isEnglishText(trimmed)) {
    return trimmed;
  }

  // Check exact dictionary match first
  const exact = EXACT_PHRASE_TRANSLATIONS[trimmed.toLowerCase()];
  if (exact) {
    return exact;
  }

  // Attempt server-side Gemini translation
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch('/api/translate-to-english', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translatedText && typeof data.translatedText === 'string') {
        return data.translatedText.trim();
      }
    }
  } catch {
    // Graceful fallback to synchronous dictionary translation
  }

  return ensureEnglishSync(trimmed);
}
