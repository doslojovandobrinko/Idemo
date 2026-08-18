import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import { srCanonicalTranslations } from '../src/data/translations/serbia/srTranslations';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

const missingOrFallbackSR: string[] = [];
canonical.forEach(r => {
  const t = srCanonicalTranslations[r.id];
  if (!t || t.shortDescription.trim() === r.shortDescription.trim()) {
    missingOrFallbackSR.push(r.id);
  }
});

console.log(`SR Missing/Fallback Count: ${missingOrFallbackSR.length} / 135`);
console.log('Missing IDs:', missingOrFallbackSR);
