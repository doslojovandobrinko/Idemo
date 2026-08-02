import { INITIAL_RECOMMENDATIONS } from "../src/data/recommendations/serbia";
import * as fs from "fs";

const canonical = INITIAL_RECOMMENDATIONS.filter(
  (r) => r.publicationStatus === "CANONICAL",
);
const exportData = canonical.map((r) => ({
  id: r.id,
  category: r.category,
  title: r.title,
  shortDescription: r.shortDescription,
  longDescription: r.longDescription,
  location: r.location,
}));

fs.writeFileSync(
  "./scripts/canonical_scope.json",
  JSON.stringify(exportData, null, 2),
);
console.log(
  `Exported ${exportData.length} canonical records to ./scripts/canonical_scope.json`,
);
