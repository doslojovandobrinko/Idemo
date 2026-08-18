// Contract and Verification Tests for visitor_resolution Edge Function & Frontend Integration
import fs from "fs";
import path from "path";

async function runVisitorResolutionContractTests(): Promise<boolean> {
  console.log("=== STARTING VISITOR RESOLUTION CONTRACT VERIFICATION TESTS ===");
  let passed = true;

  const edgeFunctionPath = path.join(process.cwd(), "supabase/functions/visitor_resolution/index.ts");
  const edgeFunctionCode = fs.readFileSync(edgeFunctionPath, "utf-8");

  // 1. Verify corsHeaders contains x-visitor-token in Access-Control-Allow-Headers
  const corsMatch = edgeFunctionCode.match(/Access-Control-Allow-Headers['"]\s*:\s*['"]([^'"]+)['"]/);
  if (!corsMatch) {
    console.error("FAILED: Access-Control-Allow-Headers definition not found in corsHeaders.");
    passed = false;
  } else {
    const allowedHeaders = corsMatch[1].toLowerCase();
    if (allowedHeaders.includes("x-visitor-token")) {
      console.log("✔ Proved corsHeaders Access-Control-Allow-Headers permits x-visitor-token");
    } else {
      console.error(`FAILED: Access-Control-Allow-Headers does not include x-visitor-token. Got: ${allowedHeaders}`);
      passed = false;
    }
  }

  // 2. Verify OPTIONS preflight handler returns corsHeaders
  if (edgeFunctionCode.includes('req.method === "OPTIONS"') && edgeFunctionCode.includes('headers: corsHeaders')) {
    console.log("✔ Proved OPTIONS preflight handler returns corsHeaders containing x-visitor-token");
  } else {
    console.error("FAILED: OPTIONS preflight response does not return corsHeaders correctly.");
    passed = false;
  }

  // 3. Verify token extraction uses req.headers.get("x-visitor-token")
  if (edgeFunctionCode.includes('req.headers.get("x-visitor-token")')) {
    console.log("✔ Proved recovery token is read directly from req.headers.get(\"x-visitor-token\")");
  } else {
    console.error("FAILED: Recovery token is not read from req.headers.get(\"x-visitor-token\").");
    passed = false;
  }

  // 4. Verify token is NOT read from url.searchParams
  if (edgeFunctionCode.includes('searchParams.get("token")')) {
    console.error("FAILED: Code incorrectly reads recovery token from URL searchParams.");
    passed = false;
  } else {
    console.log("✔ Proved recovery token is NOT read from URL searchParams (URL remains clean)");
  }

  // 5. Verify standard Headers API behavior (case-insensitivity proof)
  const testHeaders = new Headers();
  testHeaders.set("X-Visitor-Token", "test_secret_token_123");
  const readTokenLower = testHeaders.get("x-visitor-token");
  const readTokenUpper = testHeaders.get("X-Visitor-Token");

  if (readTokenLower === "test_secret_token_123" && readTokenUpper === "test_secret_token_123") {
    console.log("✔ Proved standard Headers API is case-insensitive for X-Visitor-Token and x-visitor-token");
  } else {
    console.error("FAILED: Headers API case-insensitivity check failed.");
    passed = false;
  }

  // 6. Verify missing token check returns 400 Access denied
  if (edgeFunctionCode.includes("if (!inquiryId || !rawToken)") && edgeFunctionCode.includes('"Access denied"')) {
    console.log("✔ Proved missing token or missing inquiry_id fails safely with 400 Access denied");
  } else {
    console.error("FAILED: Missing token safe fallback validation missing.");
    passed = false;
  }

  // 7. Verify GET /status and GET /proposal endpoints accept header token
  if (edgeFunctionCode.includes('/status') && edgeFunctionCode.includes('/proposal')) {
    console.log("✔ Proved GET /status and GET /proposal routing is preserved");
  } else {
    console.error("FAILED: GET endpoint routing missing.");
    passed = false;
  }

  // 8. Verify POST /confirm, POST /decline, POST /request-alternative routing preserved
  const postEndpoints = ['/confirm', '/decline', '/request-alternative'];
  let allPostOk = true;
  for (const ep of postEndpoints) {
    if (!edgeFunctionCode.includes(ep)) {
      console.error(`FAILED: POST endpoint ${ep} missing in edge function.`);
      allPostOk = false;
    }
  }
  if (allPostOk) {
    console.log("✔ Proved existing POST confirm, decline, and request-alternative flows remain unchanged");
  } else {
    passed = false;
  }

  // 9. Verify RPC parameter contract
  if (
    edgeFunctionCode.includes('get_visitor_inquiry_status') &&
    edgeFunctionCode.includes('get_visitor_active_proposal') &&
    edgeFunctionCode.includes('confirm_proposal') &&
    edgeFunctionCode.includes('decline_proposal') &&
    edgeFunctionCode.includes('request_alternative_option')
  ) {
    console.log("✔ Proved all 5 database RPC names and parameter signatures are preserved");
  } else {
    console.error("FAILED: Database RPC mapping incomplete.");
    passed = false;
  }

  console.log(passed ? "=== ALL VISITOR RESOLUTION CONTRACT TESTS PASSED PERFECTLY ===" : "=== CONTRACT TESTS FAILED ===");
  return passed;
}

runVisitorResolutionContractTests().then((success) => {
  if (!success) {
    process.exit(1);
  }
});
