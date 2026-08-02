// IDEMO PARTNER ROUTING ENGINE - PHASE 4: VISITOR RESOLUTION EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Version: v1.4.0 (Phase 4D Implementation with Fail-Closed Throttling)
// Language: TypeScript (Deno)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-visitor-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Cryptographically secure non-reversible HMAC calculation
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Normalize IPv4 and IPv6 representation before HMAC generation.
// Canonical Normalization Pipeline:
// 1. Trim leading/trailing whitespace
// 2. Convert to lowercase for hex characters in IPv6 addresses
// 3. Strip square brackets [] from IPv6 addresses
// 4. Strip trailing ports if appended (e.g., :8080 or :3000)
// 5. Unpack IPv4-mapped IPv6 addresses (::ffff:x.x.x.x -> x.x.x.x)
// This guarantees one unique canonical string representation before cryptographic hashing.
function normalizeIp(ip: string): string {
  let cleaned = ip.trim().toLowerCase();

  // Remove IPv6 brackets if present, e.g. [2001:db8::1] -> 2001:db8::1
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    cleaned = cleaned.slice(1, -1);
  }

  // Strip port suffix if present (e.g., 192.168.1.1:8080 or [2001:db8::1]:8080)
  const lastColon = cleaned.lastIndexOf(":");
  if (lastColon !== -1) {
    const portPart = cleaned.substring(lastColon + 1);
    if (/^\d+$/.test(portPart)) {
      cleaned = cleaned.substring(0, lastColon);
    }
  }

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.substring(7);
  }
  return cleaned;
}

// In-memory bounded rate limiting map (IP-based secondary backup optimization)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute window
  const maxRequests = 100; // Large threshold to only catch extreme abuse before hitting DB

  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + limitWindow });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + limitWindow });
    return false;
  }

  record.count++;
  if (record.count > maxRequests) {
    return true;
  }
  return false;
}

function errorResponse(
  status: number,
  publicMessage: string,
  logMessage?: string,
) {
  if (logMessage) {
    console.error(`[Edge Gateway Error] ${logMessage}`);
  }
  return new Response(
    JSON.stringify({ success: false, error: publicMessage }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

serve(async (req) => {
  // 1. Handle CORS Preflight OPTIONS Request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Extract Client IP securely using platform-approved client-address headers.
  // SECURITY NOTE ON SOURCE TRUST:
  // These headers ('x-real-ip' and 'cf-connecting-ip') are trusted ONLY because they are written and guaranteed
  // by the platform's edge gateway (Supabase Edge Network / Cloudflare) which intercepts and sanitizes incoming traffic,
  // discarding any client-supplied spoofed headers. No arbitrary caller-supplied header from the request body or
  // query string is ever trusted. If the deployment platform or proxy configuration changes, this source header list
  // must be adjusted/configured accordingly to match the new trusted proxy boundary.
  const rawIp =
    req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
  if (!rawIp) {
    return errorResponse(
      500,
      "Your request cannot be checked at this moment. Please try again shortly.",
      "Untrusted or missing client source identity.",
    );
  }

  const clientIp = normalizeIp(rawIp);
  if (!clientIp || clientIp === "unknown" || clientIp === "") {
    return errorResponse(
      500,
      "Your request cannot be checked at this moment. Please try again shortly.",
      "Invalid client source identity.",
    );
  }

  // Check fast in-memory limiter to guard against massive visual spam (secondary optimization)
  if (isRateLimited(clientIp)) {
    return errorResponse(
      429,
      "Too many requests. Please slow down.",
      "In-memory backup rate limit exceeded.",
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");

    // 3. Initialize Supabase Client with Service Role (Privileged Server Environment)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse(
        500,
        "Internal gateway misconfiguration.",
        "Missing environment keys on edge runtime.",
      );
    }

    // Key-separation: RECOVERY_LIMIT_SECRET is strictly required for HMAC generation.
    // Do NOT fall back to service-role key or any other secret.
    const secret = Deno.env.get("RECOVERY_LIMIT_SECRET") ?? "";
    if (!secret) {
      return errorResponse(
        500,
        "Your request cannot be checked at this moment. Please try again shortly.",
        "Server misconfiguration: RECOVERY_LIMIT_SECRET is absent.",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 4. Parse request parameters based on Endpoint
    // Canonical Credential Transport: x-visitor-token HTTP header ONLY
    let inquiryId = "";
    const rawToken = req.headers.get("x-visitor-token") ?? "";
    let matchId = "";
    let reason = "";

    if (req.method === "GET") {
      inquiryId = url.searchParams.get("inquiry_id") ?? "";
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      inquiryId = body.inquiry_id ?? "";
      matchId = body.match_id ?? "";
      reason = body.reason ?? "";
    } else {
      return errorResponse(405, "Method not allowed.");
    }

    // Strict structural validation
    if (!inquiryId || !rawToken) {
      return errorResponse(
        400,
        "Access denied",
        "Missing required parameters inquiry_id or token.",
      );
    }

    // UUID format check to prevent SQL or format exceptions
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inquiryId)) {
      return errorResponse(
        400,
        "Access denied",
        "Invalid inquiry UUID format.",
      );
    }

    if (matchId && !uuidRegex.test(matchId)) {
      return errorResponse(400, "Access denied", "Invalid match UUID format.");
    }

    // 5. Cryptographic Non-Reversible Rate Limit Bucket Generation (Throttling occurs before DB lookup)
    const sourceHash = await hmacSha256(secret, clientIp);
    const targetHash = await hmacSha256(secret, `${clientIp}:${inquiryId}`);

    // Execute PostgreSQL-backed durable rate limiter inside one atomic transaction
    const { data: limitAllowed, error: limitError } = await supabase.rpc(
      "check_and_increment_rate_limits",
      {
        p_source_bucket: sourceHash,
        p_source_max: 30,
        p_source_window: "1 minute",
        p_source_cooldown: "5 minutes",
        p_target_bucket: targetHash,
        p_target_max: 5,
        p_target_window: "15 minutes",
        p_target_cooldown: "15 minutes",
      },
    );

    // FAIL-CLOSED behavior: Block processing if the durable limiter is unavailable, times out, or errors out.
    if (limitError || limitAllowed === null || limitAllowed === undefined) {
      return errorResponse(
        500,
        "Your request cannot be checked at this moment. Please try again shortly.",
        `Durable rate limiter check failed or returned invalid response: ${limitError?.message || "No response data"}`,
      );
    } else if (!limitAllowed) {
      return errorResponse(
        429,
        "Too many requests. Please slow down.",
        "Durable rate limit blocked hashes.",
      );
    }

    // 6. Route handling & safe RPC invocation
    let rpcName = "";
    let rpcParams: Record<string, any> = {
      p_inquiry_id: inquiryId,
      p_raw_token: rawToken,
    };

    if (path.endsWith("/status")) {
      rpcName = "get_visitor_inquiry_status";
    } else if (path.endsWith("/proposal")) {
      rpcName = "get_visitor_active_proposal";
    } else if (path.endsWith("/confirm")) {
      if (!matchId)
        return errorResponse(
          400,
          "Access denied",
          "Missing match_id for confirmation.",
        );
      rpcName = "confirm_proposal";
      rpcParams.p_match_id = matchId;
    } else if (path.endsWith("/decline")) {
      if (!matchId)
        return errorResponse(
          400,
          "Access denied",
          "Missing match_id for decline.",
        );
      rpcName = "decline_proposal";
      rpcParams.p_match_id = matchId;
      rpcParams.p_reason = reason;
    } else if (path.endsWith("/request-alternative")) {
      if (!matchId)
        return errorResponse(
          400,
          "Access denied",
          "Missing match_id for alternative request.",
        );
      rpcName = "request_alternative_option";
      rpcParams.p_match_id = matchId;
      rpcParams.p_reason = reason;
    } else if (path.endsWith("/partner-introduction")) {
      // 1. Validate visitor token credential
      const { data: valData, error: valErr } = await supabase.rpc(
        "validate_and_get_inquiry",
        {
          p_inquiry_id: inquiryId,
          p_raw_token: rawToken,
        },
      );

      if (valErr || !valData) {
        return errorResponse(
          403,
          "Access denied",
          `Visitor validation failed: ${valErr?.message || "Invalid credential"}`,
        );
      }

      // 2. Query eligible match for this inquiry
      const { data: matches, error: matchErr } = await supabase
        .from("inquiry_matches")
        .select("id, partner_id, status, inquiries!inner(status)")
        .eq("inquiry_id", inquiryId)
        .in("status", ["responded", "selected"])
        .in("inquiries.status", [
          "awaiting_visitor",
          "confirmed",
          "in_progress",
        ]);

      if (matchErr || !matches || matches.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            introduction_available: false,
            message: "No eligible partner match found for this inquiry.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const match = matches[0];
      const partnerId = match.partner_id;

      // 3. Fetch partner info and published profile content
      const [{ data: partnerRow }, { data: profileRow }] = await Promise.all([
        supabase
          .from("partners")
          .select("id, name, public_code")
          .eq("id", partnerId)
          .single(),
        supabase
          .from("partner_profile_content")
          .select("*")
          .eq("partner_id", partnerId)
          .single(),
      ]);

      if (
        !profileRow ||
        profileRow.review_status !== "approved" ||
        !profileRow.intro_published
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            introduction_available: false,
            partner_name: partnerRow?.name || "Verified Partner",
            partner_code: partnerRow?.public_code || "IDM-PTR",
            message:
              "Partner profile introduction is pending or not yet published.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // 4. Generate signed photo URL if published_photo_path exists and consent is active
      let signedPhotoUrl: string | null = null;

      if (
        profileRow.published_photo_path &&
        profileRow.photo_consent_given !== false
      ) {
        const { data: signedData } = await supabase.storage
          .from("partner-passports")
          .createSignedUrl(profileRow.published_photo_path, 300); // 5 minutes signed expiration
        signedPhotoUrl = signedData?.signedUrl || null;
      }

      return new Response(
        JSON.stringify({
          success: true,
          introduction_available: true,
          partner_name: partnerRow?.name || "Verified Partner",
          partner_code: partnerRow?.public_code || "IDM-PTR",
          introduction: profileRow.intro_published,
          photo_available: !!profileRow.published_photo_path,
          photo_url: signedPhotoUrl,
          content_version: profileRow.content_version,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      return errorResponse(404, "Endpoint not found.");
    }

    // Execute database RPC
    const { data, error } = await supabase.rpc(rpcName, rpcParams);

    if (error) {
      const errMsg = error.message;

      // Map technical database errors to calm generic messages
      if (
        errMsg.includes("Inquiry not found") ||
        errMsg.includes("Invalid secure recovery token") ||
        errMsg.includes("Secure token has expired") ||
        errMsg.includes("Secure token has been revoked") ||
        errMsg.includes("Access denied")
      ) {
        return errorResponse(403, "Access denied", `Auth failure: ${errMsg}`);
      }

      if (errMsg.includes("Inquiry is not awaiting visitor resolution")) {
        return errorResponse(
          400,
          "The request is not in a resolvable state.",
          `State mismatch: ${errMsg}`,
        );
      }

      if (errMsg.includes("Proposal already accepted")) {
        return errorResponse(
          400,
          "This offer has already been accepted.",
          `Idempotency block: ${errMsg}`,
        );
      }

      if (
        errMsg.includes("Proposal already declined") ||
        errMsg.includes("Proposal details not found or already resolved")
      ) {
        return errorResponse(
          400,
          "This offer has already been resolved.",
          `Idempotency block: ${errMsg}`,
        );
      }

      if (errMsg.includes("Alternative option already requested")) {
        return errorResponse(
          400,
          "An alternative option has already been requested.",
          `Idempotency block: ${errMsg}`,
        );
      }

      // Default fallback error
      return errorResponse(
        400,
        "An error occurred while processing your request. Please try again.",
        `Database RPC exception: ${errMsg}`,
      );
    }

    // 7. Return successful response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return errorResponse(
      500,
      "An unexpected error occurred. Please try again.",
      `Internal crash: ${err.message}`,
    );
  }
});
