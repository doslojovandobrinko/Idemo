import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia/index';

console.log(`Total Recommendations: ${INITIAL_RECOMMENDATIONS.length}\n`);

INITIAL_RECOMMENDATIONS.forEach((rec, idx) => {
  const cats = Array.isArray(rec.category) ? rec.category.join(', ') : rec.category;
  const loc = rec.location || 'Serbia';
  const tagline = rec.tagline || rec.shortDescription || '';
  console.log(`${idx + 1}. **${rec.title}** (ID: ${rec.id})`);
  console.log(`   - **Category:** ${cats}`);
  console.log(`   - **Location:** ${loc}`);
  if (tagline) {
    console.log(`   - **Summary:** ${tagline}`);
  }
  console.log('');
});
