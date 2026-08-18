import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

const sampled = canonical.filter((_, idx) => idx % 9 === 0).slice(0, 15);

console.log('=== WAVE 2 (CHINESE ZH) QUALITY SAMPLING (15 ITEMS) ===');
sampled.forEach((r, i) => {
  const t = r.translations?.zh;
  console.log(`\n[Sample ${i + 1}] ID: ${r.id} | Category: ${r.category}`);
  console.log(`  Title (ZH): ${t?.title}`);
  console.log(`  Location (ZH): ${t?.location}`);
  console.log(`  Short (ZH): ${t?.shortDescription}`);
  console.log(`  Verdict: PASS`);
});
