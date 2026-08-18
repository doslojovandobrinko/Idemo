import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

const langs = ['sr', 'zh', 'de', 'ru', 'es'] as const;

console.log('--- AUTHENTIC COVERAGE AUDIT ---');
langs.forEach(lang => {
  const complete = canonical.filter(r => {
    const t = r.translations?.[lang];
    if (!t) return false;
    if (!t.title || !t.shortDescription || !t.longDescription || !t.location) return false;
    if (t.shortDescription.trim() === r.shortDescription.trim()) return false;
    if (t.longDescription.trim() === r.longDescription.trim()) return false;
    return true;
  });

  console.log(`${lang.toUpperCase()}: ${complete.length}/${canonical.length} authentic translations (${canonical.length - complete.length} missing/fallback)`);
});
