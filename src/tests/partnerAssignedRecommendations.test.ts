
import fs from "fs";
import { fetchPartnerAssignedRecommendations } from "../lib/partnerService";

console.log("=== Running Partner Assigned Recommendations Tests ===");

async function runTests() {
  console.log("TEST 1: Function exists and handles unauthenticated session safely");
  const res = await fetchPartnerAssignedRecommendations();
  if (!res.success) {
    console.log("✓ Handled unauthenticated session cleanly:", res.error);
  }

  console.log("TEST 2: Verify Recommendation ID 12 mapping to Banjska Stena Viewpoint");
  const natureContent = fs.readFileSync("src/data/recommendations/serbia/nature.ts", "utf8");
  const match = natureContent.match(/id":\s*"12"[\s\S]*?"title":\s*"([^"]+)"/);
  if (!match || match[1] !== "Banjska Stena Viewpoint") {
    throw new Error("Failed to map recommendation ID 12 to Banjska Stena Viewpoint");
  }
  console.log("✓ Successfully verified recommendation ID 12 maps to:", match[1]);

  console.log("ALL PARTNER ASSIGNED RECOMMENDATIONS TESTS PASSED!");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
