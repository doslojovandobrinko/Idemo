import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia/index';
import * as fs from 'fs';

function getQuadrant(x: number, y: number): string {
  if (x >= 0 && y >= 0) return 'Active Urban';
  if (x < 0 && y >= 0) return 'Contemplative Urban';
  if (x >= 0 && y < 0) return 'Active Nature';
  return 'Reflective Nature';
}

let table = '| # | ID | Title | X (Sensory) | Y (Spatial) | Quadrant | Category | Location |\n';
table += '|---|---|---|---|---|---|---|---|\n';

let tsv = 'Index\tID\tTitle\tCoordinate_X\tCoordinate_Y\tQuadrant\tCategory\tLocation\n';

INITIAL_RECOMMENDATIONS.forEach((rec, idx) => {
  const x = Number(rec.coordinateX);
  const y = Number(rec.coordinateY);
  const quad = getQuadrant(x, y);
  const cats = Array.isArray(rec.category) ? rec.category.join(', ') : rec.category;
  const loc = rec.location || 'Serbia';

  table += `| ${idx + 1} | ${rec.id} | ${rec.title} | ${x >= 0 ? '+' + x : x} | ${y >= 0 ? '+' + y : y} | ${quad} | ${cats} | ${loc} |\n`;
  tsv += `${idx + 1}\t${rec.id}\t${rec.title}\t${x}\t${y}\t${quad}\t${cats}\t${loc}\n`;
});

fs.writeFileSync('public/recommendations_with_coordinates.tsv', tsv);
fs.writeFileSync('public/recommendations_with_coordinates.md', table);
console.log('Successfully generated public/recommendations_with_coordinates.tsv and .md');
