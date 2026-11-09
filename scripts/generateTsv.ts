import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia/index';
import * as fs from 'fs';

let tsv = 'ID\tTitle\tCategory\tLocation\tSummary\n';
INITIAL_RECOMMENDATIONS.forEach(rec => {
  const cats = (Array.isArray(rec.category) ? rec.category.join(', ') : rec.category).replace(/\t/g, ' ');
  const loc = (rec.location || 'Serbia').replace(/\t/g, ' ');
  const tagline = (rec.tagline || rec.shortDescription || '').replace(/\r?\n|\r|\t/g, ' ');
  tsv += `${rec.id}\t${rec.title}\t${cats}\t${loc}\t${tagline}\n`;
});

fs.writeFileSync('public/recommendations.tsv', tsv);
console.log('Saved public/recommendations.tsv with', INITIAL_RECOMMENDATIONS.length, 'records.');
