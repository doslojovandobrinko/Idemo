import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

// Sample 20 across categories
const categories = ['Nature', 'Gastronomy', 'History', 'Clubbing', 'Wellbeing', 'Travel'];
const sampledMap = new Map<string, any>();

categories.forEach(cat => {
  const items = canonical.filter(r => r.category === cat || r.category.includes(cat));
  items.slice(0, 4).forEach(item => {
    if (sampledMap.size < 20) {
      sampledMap.set(item.id, item);
    }
  });
});

canonical.forEach(r => {
  if (sampledMap.size < 20) {
    sampledMap.set(r.id, r);
  }
});

const sampled = Array.from(sampledMap.values());

console.log(`================================================================`);
console.log(`DETAILED QA AUDIT MATRIX FOR 20 SAMPLED CANONICAL ITEMS`);
console.log(`================================================================\n`);

sampled.forEach((r, idx) => {
  console.log(`ITEM ${idx + 1}: ID ${r.id} | Category: ${r.category}`);
  console.log(`  EN: Title="${r.title}" | Loc="${r.location}"`);
  console.log(`      Short: "${r.shortDescription}"`);
  
  ['sr', 'zh', 'de', 'ru', 'es'].forEach(lang => {
    const t = r.translations?.[lang];
    const sameTitle = t?.title === r.title;
    const sameShort = t?.shortDescription === r.shortDescription;
    console.log(`  ${lang.toUpperCase()}: Title="${t?.title}" [SameTitle:${sameTitle}] | Loc="${t?.location}"`);
    console.log(`      Short: "${t?.shortDescription}" [SameShort:${sameShort}]`);
  });
  console.log(`----------------------------------------------------------------\n`);
});
