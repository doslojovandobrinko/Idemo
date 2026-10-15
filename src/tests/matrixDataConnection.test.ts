
import { resolvePartnerDisplayInfo } from "../components/studio/StudioPartnerCoverage";

console.log("=== Running Matrix Data Connection Invariants Test ===");

// 1. Database partner names/codes
const info1 = resolvePartnerDisplayInfo("partner-123", undefined, {
  id: "rec-1",
  recommendation_id: "1",
  partner_id: "partner-123",
  partner_code: "REAL_CODE",
  partner_name: "Real Database Partner Name",
  qualification_state: "idemo_selected",
  participation_state: "introduction_ready",
  passport_state: "verified",
  routing_state: "active",
  updated_at: new Date().toISOString()
});

if (info1.partnerCode !== "REAL_CODE" || info1.partnerName !== "Real Database Partner Name") {
  throw new Error("Failed TEST 1: Database partner names/codes");
}

// 2. IDEMO mapping
const info2 = resolvePartnerDisplayInfo("a0000000-0000-0000-0000-000000000099");
if (info2.partnerCode !== "IDEMO") {
  throw new Error("Failed TEST 2: IDEMO partner code resolution");
}

// 3. Priority rank non-invention
const info3 = resolvePartnerDisplayInfo("partner-456", undefined, {
  id: "rec-2",
  recommendation_id: "2",
  partner_id: "partner-456",
  qualification_state: "idemo_selected",
  participation_state: "introduction_ready",
  passport_state: "verified",
  routing_state: "active",
  updated_at: new Date().toISOString()
});

if (info3.priorityRank !== undefined) {
  throw new Error("Failed TEST 3: Default priority rank was invented");
}

console.log("✓ ALL MATRIX DATA CONNECTION INVARIANT TESTS PASSED!");
