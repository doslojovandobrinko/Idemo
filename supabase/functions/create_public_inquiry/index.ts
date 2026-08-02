// IDEMO PARTNER ROUTING ENGINE - PHASE 2: INQUIRY PIPELINE EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Version: v1.1.0 (Phase 2 Implementation)
// Language: TypeScript (Deno)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 1. Handle CORS Preflight Options Request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Read and parse incoming payload
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Missing or invalid required inquiry fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      recommendation_id,
      visitor_notes,
      preferred_language_id,
      service_area_id,
      requested_start_at,
      requested_end_at,
      visitor_name,
      email,
      phone_number,
      consent_text_version,
      consent_purpose,
      consent_channel,
      required_capability_ids,
      client_request_id,
    } = body || {};

    // 3. Pre-RPC Validation
    const isNonEmptyString = (val: any): boolean =>
      typeof val === "string" && val.trim().length > 0;

    const hasValidEmailOrPhone =
      isNonEmptyString(email) || isNonEmptyString(phone_number);

    const isValidInput =
      isNonEmptyString(recommendation_id) &&
      isNonEmptyString(visitor_notes) &&
      isNonEmptyString(preferred_language_id) &&
      isNonEmptyString(service_area_id) &&
      isNonEmptyString(requested_start_at) &&
      isNonEmptyString(requested_end_at) &&
      isNonEmptyString(visitor_name) &&
      hasValidEmailOrPhone &&
      isNonEmptyString(consent_text_version) &&
      isNonEmptyString(consent_purpose) &&
      isNonEmptyString(consent_channel);

    if (!isValidInput) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid required inquiry fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4. Initialize Supabase Client with environment keys
    // Edge functions are injected with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
    // Using service role key is appropriate because create_public_inquiry relies on privileged table inserts.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Extract active user ID if caller is authenticated
    let callerUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) {
        callerUserId = user.id;
      }
    }

    // 6. Invoke the atomic create_public_inquiry PL/pgSQL RPC
    const normalizedEmail = isNonEmptyString(email) ? email : null;
    const normalizedPhone = isNonEmptyString(phone_number)
      ? phone_number
      : null;
    const normalizedCapabilityIds = Array.isArray(required_capability_ids)
      ? required_capability_ids
      : null;

    const { data, error } = await supabase.rpc("create_public_inquiry", {
      p_recommendation_id: recommendation_id,
      p_visitor_notes: visitor_notes,
      p_preferred_language_id: preferred_language_id,
      p_service_area_id: service_area_id,
      p_requested_start_at: requested_start_at,
      p_requested_end_at: requested_end_at,
      p_visitor_name: visitor_name,
      p_email: normalizedEmail,
      p_phone_number: normalizedPhone,
      p_consent_text_version: consent_text_version,
      p_consent_purpose: consent_purpose,
      p_consent_channel: consent_channel,
      p_required_capability_ids: normalizedCapabilityIds,
      p_visitor_auth_user_id: callerUserId,
      p_client_request_id: isNonEmptyString(client_request_id)
        ? client_request_id
        : null,
    });

    if (error) {
      console.error("RPC execution failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Return successful payload (including raw recovery token)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
