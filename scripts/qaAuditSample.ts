import { INITIAL_RECOMMENDATIONS } from "../src/data/recommendations/serbia";

const canonical = INITIAL_RECOMMENDATIONS.filter(
  (r) => r.publicationStatus === "CANONICAL",
);

// Categories represented in Canonical scope
const categories = Array.from(new Set(canonical.map((r) => r.category)));

// Sample 20 Canonical recommendations across categories
const sampleMap = new Map<string, any>();

categories.forEach((cat) => {
  const items = canonical.filter((r) => r.category === cat);
  items.slice(0, 4).forEach((item) => {
    if (sampleMap.size < 20) {
      sampleMap.set(item.id, item);
    }
  });
});

// Fill to 20 if needed
if (sampleMap.size < 20) {
  canonical.forEach((item) => {
    if (sampleMap.size < 20) {
      sampleMap.set(item.id, item);
    }
  });
}

const sampled = Array.from(sampleMap.values());

console.log(`================================================================`);
console.log(
  `WORK PACKAGE WP-09A: LOCALIZATION QA AUDIT SAMPLE MATRIX (20 ITEMS)`,
);
console.log(
  `================================================================\n`,
);

let passCount = 0;
let minorIssueCount = 0;
let majorIssueCount = 0;
let blockingIssueCount = 0;

sampled.forEach((r, idx) => {
  console.log(
    `[Item ${idx + 1}/20] ID: ${r.id} | Category: ${r.category} | Title: "${r.title}"`,
  );
  console.log(`  Location (EN): ${r.location}`);
  console.log(`  Location (SR): ${r.translations?.sr?.location}`);
  console.log(`  Location (ZH): ${r.translations?.zh?.location}`);
  console.log(`  Location (DE): ${r.translations?.de?.location}`);
  console.log(`  Location (RU): ${r.translations?.ru?.location}`);
  console.log(`  Location (ES): ${r.translations?.es?.location}`);
  console.log(`  EN Title: "${r.title}"`);
  console.log(`  SR Title: "${r.translations?.sr?.title}"`);
  console.log(`  ZH Title: "${r.translations?.zh?.title}"`);
  console.log(`  DE Title: "${r.translations?.de?.title}"`);
  console.log(`  RU Title: "${r.translations?.ru?.title}"`);
  console.log(`  ES Title: "${r.translations?.es?.title}"`);
  console.log(`  EN Short: "${r.shortDescription}"`);
  console.log(`  SR Short: "${r.translations?.sr?.shortDescription}"`);
  console.log(`  ZH Short: "${r.translations?.zh?.shortDescription}"`);
  console.log(`  DE Short: "${r.translations?.de?.shortDescription}"`);
  console.log(`  RU Short: "${r.translations?.ru?.shortDescription}"`);
  console.log(`  ES Short: "${r.translations?.es?.shortDescription}"`);
  console.log(
    `----------------------------------------------------------------\n`,
  );
});
