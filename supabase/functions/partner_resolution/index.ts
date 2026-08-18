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

function validateImageBinarySignature(bytes: Uint8Array, declaredMime: string): { valid: boolean; detectedMime: string | null; error?: string } {
  if (bytes.length < 12) {
    return { valid: false, detectedMime: null, error: "File binary is too small to contain a valid image header." };
  }

  // Check JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    if (declaredMime && declaredMime !== "image/jpeg") {
      return { valid: false, detectedMime: "image/jpeg", error: `Binary signature is JPEG but declared MIME type is ${declaredMime}` };
    }
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    if (declaredMime && declaredMime !== "image/png") {
      return { valid: false, detectedMime: "image/png", error: `Binary signature is PNG but declared MIME type is ${declaredMime}` };
    }
    return { valid: true, detectedMime: "image/png" };
  }

  // Check WebP: RIFF (bytes 0..3) + WEBP (bytes 8..11)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    if (declaredMime && declaredMime !== "image/webp") {
      return { valid: false, detectedMime: "image/webp", error: `Binary signature is WebP but declared MIME type is ${declaredMime}` };
    }
    return { valid: true, detectedMime: "image/webp" };
  }

  return { valid: false, detectedMime: null, error: "Invalid image file signature or unsupported binary magic bytes." };
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

    // 2. STUDIO / ADMIN ENDPOINT: /admin/profile-review (POST)
    if (pathname.endsWith("/admin/profile-review") && req.method === "POST") {
      // Reject ordinary partner sessions explicitly if Bearer authorization header is missing
      if (req.headers.has("x-partner-session") && !req.headers.has("authorization")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Partner sessions are not authorized to perform administrative or editorial profile reviews.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Studio/admin authentication token is required in Authorization header.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Invalid or expired Studio/admin authentication session.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Derive reviewerId exclusively from validated user.id and check server-authoritative role (editorial_lead or super_admin ONLY)
      const reviewerId = user.id;
      const userRole = String(user.app_metadata?.role || user.role || "").toLowerCase().replace(/[\s_-]+/g, "");
      const isAllowedRole = userRole === "editoriallead" || userRole === "superadmin";

      if (!isAllowedRole) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "FORBIDDEN",
            message: "Insufficient permissions. Only editorial_lead or super_admin roles can review partner profiles.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { partner_id, action, review_note } = body;

      if (!partner_id || !action) {
        return new Response(
          JSON.stringify({ success: false, error: "MISSING_FIELDS", message: "partner_id and action are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("review_partner_profile_secure", {
        p_partner_id: partner_id,
        p_reviewer_id: reviewerId,
        p_action: action,
        p_review_note: review_note || null,
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

    // 2b. STUDIO / ADMIN ENDPOINT: /admin/profile-queue (GET)
    if (pathname.endsWith("/admin/profile-queue") && req.method === "GET") {
      // Reject ordinary partner sessions explicitly if Bearer authorization header is missing
      if (req.headers.has("x-partner-session") && !req.headers.has("authorization")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Partner sessions are not authorized to perform administrative or editorial profile reviews.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Valid Studio authentication is required.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Valid Studio authentication is required.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userRole = String(user.app_metadata?.role || user.role || "").toLowerCase().replace(/[\s_-]+/g, "");
      const isAllowedRole = userRole === "editoriallead" || userRole === "superadmin";

      if (!isAllowedRole) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "FORBIDDEN",
            message: "Editorial review access is restricted.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const urlObj = new URL(req.url);
      const statusParam = (urlObj.searchParams.get("status") || "pending_review").toLowerCase().trim();

      const allowedStatuses = ["pending_review", "changes_requested", "approved", "all"];
      if (!allowedStatuses.includes(statusParam)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_STATUS_FILTER",
            message: "Unsupported Partner Passport review status filter.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabase
        .from("partner_profile_content")
        .select(`
          partner_id,
          intro_draft,
          intro_published,
          draft_photo_path,
          published_photo_path,
          draft_photo_mime,
          published_photo_mime,
          draft_contact_phone,
          draft_contact_email,
          published_contact_phone,
          published_contact_email,
          review_status,
          photo_consent_given,
          photo_consent_at,
          photo_consent_withdrawn_at,
          submitted_at,
          reviewed_at,
          reviewed_by,
          review_note,
          content_version,
          created_at,
          updated_at,
          partners!inner (
            id,
            public_code,
            name,
            status
          )
        `);

      if (statusParam === "all") {
        query = query.in("review_status", ["pending_review", "changes_requested", "approved"]);
      } else {
        query = query.eq("review_status", statusParam);
      }

      const { data: records, error: dbErr } = await query;

      if (dbErr) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "DATABASE_ERROR",
            message: "Failed to fetch partner profile review queue.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const statusPriority: Record<string, number> = {
        pending_review: 1,
        changes_requested: 2,
        approved: 3,
      };

      const profiles = await Promise.all(
        (records || []).map(async (row: any) => {
          const partner = row.partners || {};
          const isApproved = row.review_status === "approved";
          const photoPath = isApproved ? row.published_photo_path : row.draft_photo_path;

          const isConsentGiven = row.photo_consent_given === true;
          const isConsentNotWithdrawn = !row.photo_consent_withdrawn_at;
          const hasPhotoPath = typeof photoPath === "string" && photoPath.trim().length > 0;

          let photoAvailable = false;
          let photoUrl: string | null = null;

          if (isConsentGiven && isConsentNotWithdrawn && hasPhotoPath) {
            try {
              const { data: signedData, error: signedErr } = await supabase.storage
                .from("partner-passports")
                .createSignedUrl(photoPath.trim(), 300);

              if (!signedErr && signedData?.signedUrl) {
                photoAvailable = true;
                photoUrl = signedData.signedUrl;
              }
            } catch {
              photoAvailable = false;
              photoUrl = null;
            }
          }

          const rawIntro = row.intro_draft || row.intro_published || "";
          const cleanIntro = rawIntro.trim();
          const introWordCount = cleanIntro ? cleanIntro.split(/\s+/).filter(Boolean).length : 0;

          return {
            partner_id: row.partner_id,
            partner_code: partner.public_code || "",
            partner_name: partner.name || "",
            partner_status: partner.status || "",
            review_status: row.review_status,
            introduction_draft: row.intro_draft || null,
            introduction_published: row.intro_published || null,
            introduction_word_count: introWordCount,
            photo_consent_given: isConsentGiven,
            photo_consent_withdrawn: !isConsentNotWithdrawn,
            photo_available: photoAvailable,
            photo_url: photoUrl,
            submitted_at: row.submitted_at || null,
            reviewed_at: row.reviewed_at || null,
            reviewer_note: row.review_note || null,
            content_version: row.content_version || 1,
            updated_at: row.updated_at || null,
          };
        })
      );

      profiles.sort((a, b) => {
        const pA = statusPriority[a.review_status] || 99;
        const pB = statusPriority[b.review_status] || 99;
        if (pA !== pB) return pA - pB;

        const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        return (a.partner_code || "").localeCompare(b.partner_code || "");
      });

      return new Response(
        JSON.stringify({
          success: true,
          status_filter: statusParam,
          count: profiles.length,
          profiles,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. OPERATIONAL ENDPOINTS (REQUIRE x-partner-session HEADER)
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
      const { data: partnerRow } = await supabase
        .from("partners")
        .select("id, public_code, name, status, is_open_for_inquiries, contact_preference, must_change_pin, contact_phone, contact_email")
        .eq("id", partnerId)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          partner: {
            id: partnerId,
            public_code: partnerRow?.public_code || sessionData.public_code,
            name: partnerRow?.name || sessionData.name,
            status: partnerRow?.status || sessionData.status || "active",
            is_open_for_inquiries: partnerRow?.is_open_for_inquiries ?? true,
            contact_preference: partnerRow?.contact_preference || "WhatsApp",
            must_change_pin: sessionData.must_change_pin,
            expires_at: sessionData.expires_at,
            contact_phone: partnerRow?.contact_phone || null,
            contact_email: partnerRow?.contact_email || null,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /me/contact (POST)
    if (pathname.endsWith("/me/contact") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { contact_phone, contact_email } = body;

      const { data, error } = await supabase.rpc("update_partner_professional_contact_secure", {
        p_partner_id: partnerId,
        p_contact_phone: contact_phone ? String(contact_phone).trim() : null,
        p_contact_email: contact_email ? String(contact_email).trim() : null,
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

    // ENDPOINT: /profile-content (GET)
    if (pathname.endsWith("/profile-content") && req.method === "GET") {
      const { data: profileContent, error: contentErr } = await supabase
        .from("partner_profile_content")
        .select("*")
        .eq("partner_id", partnerId)
        .maybeSingle();

      if (contentErr) {
        return new Response(
          JSON.stringify({ success: false, error: "DATABASE_ERROR", message: contentErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          partner_id: partnerId,
          content: profileContent || {
            partner_id: partnerId,
            intro_draft: null,
            draft_photo_path: null,
            draft_photo_mime: null,
            intro_published: null,
            published_photo_path: null,
            published_photo_mime: null,
            review_status: "draft",
            photo_consent_given: false,
            photo_consent_at: null,
            photo_consent_withdrawn_at: null,
            submitted_at: null,
            reviewed_at: null,
            reviewed_by: null,
            review_note: null,
            content_version: 1,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /profile-content/upload-authorize (POST)
    if (pathname.endsWith("/profile-content/upload-authorize") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { filename, mime_type, file_size } = body;

      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!mime_type || !allowedMimes.includes(mime_type)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_MIME_TYPE",
            message: "Only JPG, PNG, and WebP images are allowed.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (file_size && file_size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "FILE_TOO_LARGE",
            message: "Image size must not exceed 5 MB.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const ext = mime_type === "image/jpeg" ? "jpg" : mime_type === "image/png" ? "png" : "webp";
      const opaqueRandomId = crypto.randomUUID().replace(/-/g, "");
      const storagePath = `drafts/${opaqueRandomId}.${ext}`;

      // 1. Issue durable authorization in DB FIRST (Option A)
      const { data: issueData, error: issueErr } = await supabase.rpc(
        "issue_partner_profile_upload_authorization_secure",
        {
          p_partner_id: partnerId,
          p_object_path: storagePath,
          p_expected_mime: mime_type,
          p_max_size_bytes: file_size || 5 * 1024 * 1024,
          p_ttl_seconds: 900,
        }
      );

      if (issueErr || !issueData?.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: issueData?.error || "AUTHORIZATION_ISSUE_FAILED",
            message: issueData?.message || issueErr?.message || "Failed to issue upload authorization.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Create signed upload URL SECOND
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("partner-passports")
        .createSignedUploadUrl(storagePath);

      if (uploadErr || !uploadData?.signedUrl) {
        // Guaranteed compensating cleanup: remove orphan authorization record if signed URL creation fails
        if (issueData?.authorization_id) {
          await supabase
            .from("partner_profile_upload_authorizations")
            .delete()
            .eq("id", issueData.authorization_id);
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: "STORAGE_ERROR",
            message: uploadErr?.message || "Failed to generate signed upload URL.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          upload_url: uploadData.signedUrl,
          path: storagePath,
          mime_type,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ENDPOINT: /profile-content/draft (POST)
    if (pathname.endsWith("/profile-content/draft") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { intro_draft, draft_photo_path, draft_photo_mime, photo_consent, draft_contact_phone, draft_contact_email } = body;

      if (draft_photo_path) {
        // Defect 3: Reject NULL / empty draft_photo_mime whenever draft_photo_path is supplied
        if (!draft_photo_mime || !draft_photo_mime.trim()) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "MIME_REQUIRED",
              message: "draft_photo_mime is mandatory when draft_photo_path is provided.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Download uploaded file binary metadata to check byte size and header signature
        const { data: blob, error: downloadErr } = await supabase.storage
          .from("partner-passports")
          .download(draft_photo_path);

        if (downloadErr || !blob) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "STORAGE_READ_ERROR",
              message: downloadErr?.message || "Failed to download uploaded draft image for verification.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const actualSize = blob.size;
        if (actualSize > 5 * 1024 * 1024) {
          await supabase.storage.from("partner-passports").remove([draft_photo_path]);
          return new Response(
            JSON.stringify({
              success: false,
              error: "FILE_TOO_LARGE",
              message: `Actual stored object byte size (${actualSize} bytes) exceeds maximum 5 MB limit.`,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const arrayBuffer = await blob.arrayBuffer();
        const headerBytes = new Uint8Array(arrayBuffer);
        const sigResult = validateImageBinarySignature(headerBytes, draft_photo_mime || "");

        if (!sigResult.valid) {
          await supabase.storage.from("partner-passports").remove([draft_photo_path]);
          return new Response(
            JSON.stringify({
              success: false,
              error: "INVALID_FILE_SIGNATURE",
              message: sigResult.error || "Uploaded file binary magic bytes failed validation.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Save draft with durable authorization validation in DB
      const { data, error } = await supabase.rpc("save_partner_profile_draft_with_authorization_secure", {
        p_partner_id: partnerId,
        p_intro_draft: intro_draft || null,
        p_draft_photo_path: draft_photo_path || null,
        p_draft_photo_mime: draft_photo_mime || null,
        p_photo_consent: !!photo_consent,
        p_draft_contact_phone: draft_contact_phone ? String(draft_contact_phone).trim() : null,
        p_draft_contact_email: draft_contact_email ? String(draft_contact_email).trim() : null,
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

    // ENDPOINT: /profile-content/submit (POST)
    if (pathname.endsWith("/profile-content/submit") && req.method === "POST") {
      const { data, error } = await supabase.rpc("submit_partner_profile_secure", {
        p_partner_id: partnerId,
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

    // ENDPOINT: /profile-content/withdraw (POST)
    if (pathname.endsWith("/profile-content/withdraw") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { scope = "all" } = body;

      const validScopes = ["draft", "introduction", "photo", "consent", "all"];
      if (!validScopes.includes(scope)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_SCOPE",
            message: `Scope must be one of: ${validScopes.join(", ")}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("withdraw_partner_profile_v2_secure", {
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
        JSON.stringify(data),
        { status: data?.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
