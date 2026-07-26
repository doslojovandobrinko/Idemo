// IDEMO PARTNER AUTHENTICATION & OPPORTUNITY RESOLUTION EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Version: v1.0.0 (Slice 6 Implementation)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-partner-session",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_CONFIG_ERROR", message: "Server database configuration missing." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. PUBLIC ENDPOINT: /login
    if (pathname.endsWith("/login") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { public_code, pin } = body;

      if (!public_code || !pin) {
        return new Response(
          JSON.stringify({ success: false, error: "MISSING_FIELDS", message: "Partner code and PIN are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate opaque 256-bit random session token
      const rawSessionToken = `idm_pts_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
      const tokenHash = await sha256Hex(rawSessionToken);

      // Client source hash for rate limiting
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "unknown";
      const sourceHash = await sha256Hex(`${clientIp}:${userAgent}`);
      const partnerCodeHash = await sha256Hex(public_code.trim().toLowerCase());

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.rpc("authenticate_partner_login", {
        p_public_code: public_code.trim(),
        p_pin: pin.trim(),
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
        p_source_hash: sourceHash,
        p_partner_code_hash: partnerCodeHash,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "AUTH_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.success) {
        return new Response(
          JSON.stringify({ success: false, error: data.error_code || "INVALID_CREDENTIALS", message: data.message }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session_token: rawSessionToken,
          partner: {
            id: data.partner_id,
            public_code: data.public_code,
            name: data.name,
            must_change_pin: data.must_change_pin,
          },
          expires_at: data.expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. OPERATIONAL ENDPOINTS (REQUIRE x-partner-session HEADER)
    const rawToken = req.headers.get("x-partner-session");
    if (!rawToken || !rawToken.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Missing x-partner-session header credential." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenHash = await sha256Hex(rawToken.trim());

    // Validate Session
    const { data: sessionData, error: sessionErr } = await supabase.rpc("validate_partner_session", {
      p_token_hash: tokenHash,
    });

    if (sessionErr || !sessionData || !sessionData.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: sessionData?.error_code || "UNAUTHORIZED",
          message: sessionData?.message || "Invalid or expired partner session.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const partnerId = sessionData.partner_id;

    // ENDPOINT: /logout
    if (pathname.endsWith("/logout") && req.method === "POST") {
      await supabase.rpc("revoke_partner_session", { p_token_hash: tokenHash });
      return new Response(
        JSON.stringify({ success: true, message: "Logged out successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /me
    if (pathname.endsWith("/me") && req.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          partner: {
            id: sessionData.partner_id,
            public_code: sessionData.public_code,
            name: sessionData.name,
            must_change_pin: sessionData.must_change_pin,
            expires_at: sessionData.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /change-pin (POST)
    if (pathname.endsWith("/change-pin") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { current_pin, new_pin, confirm_new_pin } = body;

      if (!current_pin || !new_pin || !confirm_new_pin) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "MISSING_FIELDS",
            message: "Trenutni PIN, novi PIN i potvrda novog PIN-a su obavezni.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("change_partner_pin_secure", {
        p_partner_id: partnerId,
        p_current_pin: String(current_pin).trim(),
        p_new_pin: String(new_pin).trim(),
        p_confirm_new_pin: String(confirm_new_pin).trim(),
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /opportunities (GET)
    if (pathname.endsWith("/opportunities") && req.method === "GET") {
      const scope = url.searchParams.get("scope") || "new";
      const { data, error } = await supabase.rpc("get_partner_opportunities_secure", {
        p_partner_id: partnerId,
        p_scope: scope,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, scope, opportunities: data.opportunities || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /opportunities/view (POST)
    if (pathname.endsWith("/opportunities/view") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id } = body;

      if (!match_id) {
        return new Response(
          JSON.stringify({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("view_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /opportunities/accept (POST)
    if (pathname.endsWith("/opportunities/accept") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, message } = body;

      if (!match_id || !message) {
        return new Response(
          JSON.stringify({ success: false, error: "MISSING_FIELDS", message: "match_id and message are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("accept_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_message: message,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /opportunities/decline (POST)
    if (pathname.endsWith("/opportunities/decline") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, message } = body;

      if (!match_id) {
        return new Response(
          JSON.stringify({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("decline_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_message: message || null,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /opportunities/propose (POST)
    if (pathname.endsWith("/opportunities/propose") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, proposed_start_at, proposed_end_at, message } = body;

      if (!match_id || !proposed_start_at || !proposed_end_at || !message) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "MISSING_FIELDS",
            message: "match_id, proposed_start_at, proposed_end_at, and message are required.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("propose_partner_alternative_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_proposed_start: proposed_start_at,
        p_proposed_end: proposed_end_at,
        p_message: message,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "NOT_FOUND", message: `Endpoint '${pathname}' not found.` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_ERROR", message: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
