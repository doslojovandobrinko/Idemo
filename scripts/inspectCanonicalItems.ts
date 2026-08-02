import { INITIAL_RECOMMENDATIONS } from "../src/data/recommendations/serbia";

const canonical = INITIAL_RECOMMENDATIONS.filter(
  (r) => r.publicationStatus === "CANONICAL",
);
console.log("Total Canonical Items:", canonical.length);

canonical.forEach((r) => {
  console.log(
    `ID: ${r.id} | Category: ${r.category} | Title: "${r.title}" | Loc: "${r.location}"`,
  );
});
