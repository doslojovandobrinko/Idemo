// IDEMO UNIFIED EDITORIAL WORKFLOW ENGINE - DEDICATED EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Work Package: WP-14B3 Canonical Recommendation Workflow
// Version: v1.2.0

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id, x-idempotency-key, x-partner-session",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ALLOWED_STUDIO_ROLES = new Set([
  "editorial_lead",
  "super_admin",
]);

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
    // 1. ROUTE: POST /foundation/submit (WP-14B1 Foundation Route)
    if (pathname.endsWith("/foundation/submit") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const {
        actor_type = "system",
        actor_id = null,
        scope_type = "global",
        scope_id = null,
        entity_type = "system_setting",
        entity_id = null,
        operation = "verify",
        proposed_value = {},
        idempotency_key = null,
        correlation_id = null,
      } = body;

      const { data, error } = await supabase.rpc("submit_foundation_work_item_secure", {
        p_actor_type: actor_type,
        p_actor_id: actor_id,
        p_scope_type: scope_type,
        p_scope_id: scope_id,
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_operation: operation,
        p_proposed_value: proposed_value,
        p_idempotency_key: idempotency_key,
        p_correlation_id: correlation_id,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
        return new Response(
          JSON.stringify(data),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1B. ROUTE: POST /portfolio/submit (WP-14B2 Authenticated Partner Portfolio Submission)
    if (pathname.endsWith("/portfolio/submit") && req.method === "POST") {
      // MANDATORY CORRECTION 1: Require x-partner-session header credential
      const rawPartnerToken = req.headers.get("x-partner-session");
      if (!rawPartnerToken || !rawPartnerToken.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Missing x-partner-session header credential.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await sha256Hex(rawPartnerToken.trim());

      // Validate partner session via existing server-side RPC contract
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

      // Server-derived authenticated partner ID
      const partnerId = sessionData.partner_id;

      const body = await req.json().catch(() => ({}));
      const {
        portfolio_data,
        idempotency_key = null,
        correlation_id = null,
      } = body;

      // Note: Body parameters partner_id, submitted_by, actor_id, role, or reviewer identity are strictly IGNORED.
      const { data, error } = await supabase.rpc("submit_partner_portfolio_work_item_secure", {
        p_partner_id: partnerId,
        p_portfolio_data: portfolio_data,
        p_idempotency_key: idempotency_key,
        p_correlation_id: correlation_id,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
        return new Response(
          JSON.stringify(data),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1C. ROUTES: POST /recommendations/* (WP-14B3 Recommendation Workflow Submissions)
    if (pathname.includes("/recommendations/")) {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Missing or invalid authorization header." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);

      if (userErr || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Invalid access token." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userRole = user.app_metadata?.role;
      if (!userRole || !ALLOWED_STUDIO_ROLES.has(userRole)) {
        return new Response(
          JSON.stringify({ success: false, error: "FORBIDDEN", message: "Insufficient permissions for recommendation operations." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/reserve-draft (WP-14C5D1 Durable Draft Reservation)
      if (pathname.endsWith("/recommendations/reserve-draft") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          destination_id,
          idempotency_key = null,
          correlation_id = null,
        } = body;

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!destination_id || typeof destination_id !== "string" || !destination_id.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "destination_id is mandatory for draft reservation." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!UUID_REGEX.test(destination_id.trim())) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_DESTINATION", message: "destination_id must be a valid canonical UUID." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const effectiveIdempotencyKey = (idempotency_key && typeof idempotency_key === "string" && idempotency_key.trim())
          ? idempotency_key.trim()
          : `reserve_${destination_id.trim()}_${user.id}`;

        const effectiveCorrelationId = (correlation_id && UUID_REGEX.test(correlation_id))
          ? correlation_id
          : crypto.randomUUID();

        const { data, error } = await supabase.rpc("reserve_recommendation_draft_secure", {
          p_destination_id: destination_id.trim(),
          p_reserved_by: user.id,
          p_idempotency_key: effectiveIdempotencyKey,
          p_correlation_id: effectiveCorrelationId,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/abandon-draft (WP-14C5D1 Abandon Draft Reservation)
      if (pathname.endsWith("/recommendations/abandon-draft") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { reserved_recommendation_id, reason = null } = body;

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!reserved_recommendation_id || typeof reserved_recommendation_id !== "string" || !UUID_REGEX.test(reserved_recommendation_id.trim())) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "reserved_recommendation_id must be a valid UUID." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("abandon_recommendation_draft_secure", {
          p_reserved_recommendation_id: reserved_recommendation_id.trim(),
          p_reserved_by: user.id,
          p_reason: reason,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/submit
      if (pathname.endsWith("/recommendations/submit") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          destination_id,
          proposed_recommendation = body.recommendation_data || body.proposed_recommendation || {},
          idempotency_key = null,
          correlation_id = null,
          reserved_recommendation_id = body.reserved_recommendation_id || proposed_recommendation?.reserved_recommendation_id || proposed_recommendation?.id || null,
        } = body;

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!destination_id || typeof destination_id !== "string" || !destination_id.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "destination_id is mandatory for recommendation submission." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!UUID_REGEX.test(destination_id.trim())) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_DESTINATION", message: "destination_id must be a valid canonical UUID." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("submit_recommendation_create_secure", {
          p_author_id: user.id,
          p_destination_id: destination_id.trim(),
          p_proposed_recommendation: proposed_recommendation,
          p_idempotency_key: idempotency_key,
          p_correlation_id: correlation_id,
          p_reserved_recommendation_id: reserved_recommendation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/amend
      if (pathname.endsWith("/recommendations/amend") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          recommendation_id,
          proposed_changes = body.proposed_changes || body.changes || {},
          base_content_version = 1,
          idempotency_key = null,
          correlation_id = null,
        } = body;

        if (!recommendation_id) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "recommendation_id is required for amendment." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("submit_recommendation_amend_secure", {
          p_author_id: user.id,
          p_recommendation_id: recommendation_id,
          p_proposed_changes: proposed_changes,
          p_base_content_version: base_content_version,
          p_idempotency_key: idempotency_key,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let status = 200;
        if (!data.success) {
          if (data.error === "RECOMMENDATION_NOT_FOUND") {
            status = 404;
          } else if (data.error === "VERSION_CONFLICT") {
            status = 409;
          } else {
            status = 400;
          }
        }

        return new Response(
          JSON.stringify(data),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/retire
      if (pathname.endsWith("/recommendations/retire") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          recommendation_id,
          retirement_reason = null,
          idempotency_key = null,
          correlation_id = null,
        } = body;

        if (!recommendation_id || !retirement_reason) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "recommendation_id and mandatory retirement_reason are required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("submit_recommendation_retire_secure", {
          p_author_id: user.id,
          p_recommendation_id: recommendation_id,
          p_retirement_reason: retirement_reason,
          p_idempotency_key: idempotency_key,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/authorize-upload (WP-14C5C Upload Authorization)
      if (pathname.endsWith("/recommendations/media/authorize-upload") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          destination_id,
          reserved_recommendation_id,
          mime_type,
          file_size_bytes,
          original_filename = null,
          work_item_id = null,
          replacement_asset_id = null,
          idempotency_key = null,
          correlation_id = null,
        } = body;

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (
          !reserved_recommendation_id ||
          typeof reserved_recommendation_id !== "string" ||
          !reserved_recommendation_id.trim() ||
          !UUID_REGEX.test(reserved_recommendation_id.trim())
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "INVALID_RESERVATION_ID",
              message: "reserved_recommendation_id must be a valid UUID",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const normReservedRecId = reserved_recommendation_id.trim();

        // Defensively normalize optional UUID inputs
        const normWorkItemId =
          typeof work_item_id === "string" && work_item_id.trim() && UUID_REGEX.test(work_item_id.trim())
            ? work_item_id.trim()
            : null;

        const normReplacementAssetId =
          typeof replacement_asset_id === "string" && replacement_asset_id.trim() && UUID_REGEX.test(replacement_asset_id.trim())
            ? replacement_asset_id.trim()
            : null;

        const normCorrelationId =
          typeof correlation_id === "string" && correlation_id.trim() && UUID_REGEX.test(correlation_id.trim())
            ? correlation_id.trim()
            : null;

        const { data: resRow } = await supabase
          .from("recommendation_draft_reservations")
          .select("id, status, reserved_by, destination_id")
          .eq("reserved_recommendation_id", normReservedRecId)
          .maybeSingle();

        if (resRow && (resRow.status !== "active" || resRow.reserved_by !== user.id || resRow.destination_id !== destination_id)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "MEDIA_AUTHORIZATION_INVALID",
              message: "Draft reservation is inactive or actor/destination mismatched."
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("issue_recommendation_media_upload_authorization_secure", {
          p_author_id: user.id,
          p_destination_id: destination_id,
          p_reserved_recommendation_id: normReservedRecId,
          p_mime_type: mime_type,
          p_file_size_bytes: file_size_bytes,
          p_original_filename: original_filename,
          p_work_item_id: normWorkItemId,
          p_replacement_asset_id: normReplacementAssetId,
          p_idempotency_key: idempotency_key,
          p_correlation_id: normCorrelationId,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.success && data.object_path) {
          const { data: signedData, error: signedErr } = await supabase.storage
            .from("recommendation-media")
            .createSignedUploadUrl(data.object_path);

          if (signedErr) {
            return new Response(
              JSON.stringify({ success: false, error: "STORAGE_AUTHORIZATION_FAILED", message: signedErr.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          let expiresAtIso: string;
          if (data.expires_at) {
            const rawStr = String(data.expires_at).trim();
            if (rawStr.includes("T")) {
              expiresAtIso = (!rawStr.endsWith("Z") && !rawStr.includes("+")) ? rawStr + "Z" : rawStr;
            } else if (rawStr.includes(" ")) {
              expiresAtIso = rawStr.replace(" ", "T") + "Z";
            } else {
              expiresAtIso = new Date(data.expires_at).toISOString();
            }
          } else {
            expiresAtIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }

          return new Response(
            JSON.stringify({
              ...data,
              bucket: data.bucket || "recommendation-media",
              allowed_mime_type: data.allowed_mime_type || mime_type,
              maximum_size_bytes: data.maximum_size_bytes || 5242880,
              expires_at: expiresAtIso,
              signed_upload_url: signedData?.signedUrl,
              token: signedData?.token,
              path: signedData?.path || data.object_path,
              object_path: data.object_path,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/confirm-upload
      if (pathname.endsWith("/recommendations/media/confirm-upload") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { asset_id, correlation_id = null } = body;

        if (!asset_id) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_ARGUMENTS", message: "asset_id parameter is required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 1. Load authoritative asset record from DB
        const { data: asset, error: fetchError } = await supabase
          .from("recommendation_media_assets")
          .select("id, bucket_name, object_path, mime_type, file_size_bytes, status")
          .eq("id", asset_id)
          .maybeSingle();

        if (fetchError) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: fetchError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!asset) {
          return new Response(
            JSON.stringify({ success: false, error: "ASSET_NOT_FOUND", message: "Recommendation media asset record not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (asset.status !== "authorized") {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_STATE_TRANSITION", message: "Asset is not in authorized status." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 2. Verify Storage Object Existence and Metadata in Supabase Storage
        const folderPath = asset.object_path.substring(0, asset.object_path.lastIndexOf("/"));
        const fileName = asset.object_path.substring(asset.object_path.lastIndexOf("/") + 1);

        const { data: fileList, error: storageErr } = await supabase.storage
          .from(asset.bucket_name)
          .list(folderPath, { search: fileName });

        if (storageErr) {
          return new Response(
            JSON.stringify({ success: false, error: "STORAGE_ERROR", message: storageErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const matchingFile = fileList?.find((f) => f.name === fileName);

        if (!matchingFile) {
          return new Response(
            JSON.stringify({ success: false, error: "UPLOAD_OBJECT_NOT_FOUND", message: "Object does not exist in storage." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const actualSize = matchingFile.metadata?.size ?? (matchingFile as { size?: number }).size;
        const actualMime = matchingFile.metadata?.mimetype ?? (matchingFile as { mimetype?: string }).mimetype;

        if (actualSize !== undefined && actualSize !== null) {
          const sizeDiff = Math.abs(Number(actualSize) - Number(asset.file_size_bytes));
          if (sizeDiff > 1024 || Number(actualSize) > 5242880) {
            return new Response(
              JSON.stringify({ success: false, error: "UPLOAD_METADATA_MISMATCH", message: "Uploaded object size conflicts with authorized asset record." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        if (actualMime && actualMime !== asset.mime_type) {
          return new Response(
            JSON.stringify({ success: false, error: "UPLOAD_METADATA_MISMATCH", message: "Uploaded object mime type conflicts with authorized asset record." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 3. State-Transition RPC Call
        const { data, error } = await supabase.rpc("confirm_recommendation_media_upload_secure", {
          p_author_id: user.id,
          p_asset_id: asset_id,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/update-metadata
      if (pathname.endsWith("/recommendations/media/update-metadata") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          asset_id,
          alt_text = {},
          provenance_source = null,
          acquisition_method = null,
          licence_type = null,
          attribution_required = false,
          attribution_text = null,
          creator_name = null,
          source_url = null,
          correlation_id = null,
        } = body;

        const { data, error } = await supabase.rpc("update_recommendation_media_metadata_secure", {
          p_author_id: user.id,
          p_asset_id: asset_id,
          p_alt_text: alt_text,
          p_provenance_source: provenance_source,
          p_acquisition_method: acquisition_method,
          p_licence_type: licence_type,
          p_attribution_required: attribution_required,
          p_attribution_text: attribution_text,
          p_creator_name: creator_name,
          p_source_url: source_url,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/verify
      if (pathname.endsWith("/recommendations/media/verify") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { asset_id, correlation_id = null } = body;

        const { data, error } = await supabase.rpc("verify_recommendation_media_asset_secure", {
          p_author_id: user.id,
          p_asset_id: asset_id,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/attach
      if (pathname.endsWith("/recommendations/media/attach") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { asset_id, work_item_id = null, correlation_id = null } = body;

        const { data, error } = await supabase.rpc("attach_recommendation_media_asset_secure", {
          p_author_id: user.id,
          p_asset_id: asset_id,
          p_work_item_id: work_item_id,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /recommendations/media/abandon
      if (pathname.endsWith("/recommendations/media/abandon") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { asset_id, reason = null, correlation_id = null } = body;

        const { data, error } = await supabase.rpc("abandon_recommendation_media_asset_secure", {
          p_author_id: user.id,
          p_asset_id: asset_id,
          p_reason: reason,
          p_correlation_id: correlation_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. ADMIN AUTHENTICATION GUARD FOR /admin/*
    if (pathname.includes("/admin/")) {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Missing or invalid authorization header." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);

      if (userErr || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Invalid access token." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userRole = user.app_metadata?.role;
      if (!userRole || !ALLOWED_STUDIO_ROLES.has(userRole)) {
        return new Response(
          JSON.stringify({ success: false, error: "FORBIDDEN", message: "Insufficient permissions for Studio operations." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ROUTE: GET /admin/queue (WP-14B1 Foundation Queue Route)
      if (pathname.endsWith("/admin/queue") && req.method === "GET") {
        const review_status = url.searchParams.get("review_status") || null;
        const limit = parseInt(url.searchParams.get("limit") || "50", 10);
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);

        const { data, error } = await supabase.rpc("get_editorial_work_items_queue_secure", {
          p_review_status: review_status,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ROUTE: GET /admin/work-item (WP-14B1 Foundation Detail Route)
      if (pathname.endsWith("/admin/work-item") && req.method === "GET") {
        const work_item_id = url.searchParams.get("id");
        if (!work_item_id) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "Work item ID is required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("get_editorial_work_item_detail_secure", {
          p_work_item_id: work_item_id,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data.success ? 200 : 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ROUTE: POST /admin/portfolio/override-match (WP-14B2 Match Override)
      if (pathname.endsWith("/admin/portfolio/override-match") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const {
          matching_id,
          new_score,
          new_confidence = new_score,
          override_reason,
        } = body;

        if (!matching_id || new_score === undefined || !override_reason) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "matching_id, new_score, and override_reason are required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase.rpc("override_partner_matching_secure", {
          p_matching_id: matching_id,
          p_reviewer_id: user.id,
          p_new_score: new_score,
          p_new_confidence: new_confidence,
          p_override_reason: override_reason,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ROUTE: POST /admin/action (WP-14B1 Foundation Action & WP-14B2 Portfolio Approval Dispatcher)
      if (pathname.endsWith("/admin/action") && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { work_item_id, action, reviewer_note = null, expected_version = null } = body;

        if (!work_item_id || !action) {
          return new Response(
            JSON.stringify({ success: false, error: "INVALID_REQUEST", message: "work_item_id and action are required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if work item uses partner.portfolio.submission handler when approving
        if (action === "approve") {
          const { data: itemData } = await supabase
            .from("editorial_work_items")
            .select("handler_key")
            .eq("id", work_item_id)
            .maybeSingle();

          if (itemData?.handler_key === "partner.portfolio.submission") {
            const { data, error } = await supabase.rpc("approve_partner_portfolio_work_item_secure", {
              p_work_item_id: work_item_id,
              p_reviewer_id: user.id,
              p_reviewer_note: reviewer_note,
              p_expected_version: expected_version,
            });

            if (error) {
              return new Response(
                JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
              return new Response(
                JSON.stringify(data),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            let status = 200;
            if (!data.success) {
              if (data.error === "VERSION_CONFLICT" || data.error === "INVALID_STATE_TRANSITION") {
                status = 409;
              } else if (data.error === "WORK_ITEM_NOT_FOUND") {
                status = 404;
              } else {
                status = 400;
              }
            }

            return new Response(
              JSON.stringify(data),
              { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else if (
            itemData?.handler_key === "recommendation.create" ||
            itemData?.handler_key === "recommendation.amend" ||
            itemData?.handler_key === "recommendation.retire"
          ) {
            const { data, error } = await supabase.rpc("approve_recommendation_work_item_secure", {
              p_work_item_id: work_item_id,
              p_reviewer_id: user.id,
              p_reviewer_note: reviewer_note,
              p_expected_version: expected_version,
            });

            if (error) {
              return new Response(
                JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
              return new Response(
                JSON.stringify(data),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            let status = 200;
            if (!data.success) {
              if (data.error === "VERSION_CONFLICT" || data.error === "INVALID_STATE_TRANSITION") {
                status = 409;
              } else if (data.error === "WORK_ITEM_NOT_FOUND" || data.error === "SNAPSHOT_NOT_FOUND") {
                status = 404;
              } else {
                status = 400;
              }
            }

            return new Response(
              JSON.stringify(data),
              { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        const { data, error } = await supabase.rpc("review_editorial_work_item_secure", {
          p_work_item_id: work_item_id,
          p_reviewer_id: user.id,
          p_action: action,
          p_reviewer_note: reviewer_note,
          p_expected_version: expected_version,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "DATABASE_ERROR", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data && data.error === "WORKFLOW_ENGINE_DISABLED") {
          return new Response(
            JSON.stringify(data),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let status = 200;
        if (!data.success) {
          if (data.error === "VERSION_CONFLICT" || data.error === "INVALID_STATE_TRANSITION") {
            status = 409;
          } else if (data.error === "WORK_ITEM_NOT_FOUND") {
            status = 404;
          } else {
            status = 400;
          }
        }

        return new Response(
          JSON.stringify(data),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "NOT_FOUND", message: `Route '${pathname}' not found.` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_ERROR", message: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
