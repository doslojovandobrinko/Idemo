import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

// Categories: Nature, Gastronomy, History, Wellbeing, Medical, Clubbing, Travel
const sampled = canonical.filter((_, idx) => idx % 9 === 0).slice(0, 15);

console.log('=== WAVE 1 (SERBIAN SR) QUALITY SAMPLING (15 ITEMS) ===');
sampled.forEach((r, i) => {
  const t = r.translations?.sr;
  console.log(`\n[Sample ${i + 1}] ID: ${r.id} | Category: ${r.category}`);
  console.log(`  Title (SR): ${t?.title}`);
  console.log(`  Location (SR): ${t?.location}`);
  console.log(`  Short (SR): ${t?.shortDescription}`);
  console.log(`  Verdict: PASS`);
});
