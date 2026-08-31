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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

async function invokeRpc(supabase: any, rpcName: string, params: Record<string, any>) {
  const { data, error } = await supabase.rpc(rpcName, params);
  if (error) {
    return jsonResponse({ success: false, error: "DATABASE_ERROR", message: error.message }, 500);
  }
  return jsonResponse(data, data?.success ? 200 : 400);
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
    return jsonResponse({ success: false, error: "SERVER_CONFIG_ERROR", message: "Server database configuration missing." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. PUBLIC ENDPOINT: /login
    if (pathname.endsWith("/login") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { public_code, pin } = body;

      if (!public_code || !pin) {
        return jsonResponse({ success: false, error: "MISSING_FIELDS", message: "Partner code and PIN are required." }, 400);
      }

      const rawSessionToken = `idm_pts_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
      const tokenHash = await sha256Hex(rawSessionToken);

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
        return jsonResponse({ success: false, error: "AUTH_ERROR", message: error.message }, 500);
      }

      if (!data.success) {
        return jsonResponse({ success: false, error: data.error_code || "INVALID_CREDENTIALS", message: data.message }, 401);
      }

      return jsonResponse({
        success: true,
        session_token: rawSessionToken,
        partner: {
          id: data.partner_id,
          public_code: data.public_code,
          name: data.name,
          must_change_pin: data.must_change_pin,
        },
        expires_at: data.expires_at,
      });
    }

    // 2. STUDIO / ADMIN ENDPOINT: /admin/profile-review (POST)
    if (pathname.endsWith("/admin/profile-review") && req.method === "POST") {
      if (req.headers.has("x-partner-session") && !req.headers.has("authorization")) {
        return jsonResponse({
          success: false,
          error: "UNAUTHORIZED",
          message: "Partner sessions are not authorized to perform administrative or editorial profile reviews.",
        }, 403);
      }

      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return jsonResponse({
          success: false,
          error: "UNAUTHORIZED",
          message: "Studio/admin authentication token is required in Authorization header.",
        }, 401);
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return jsonResponse({
          success: false,
          error: "UNAUTHORIZED",
          message: "Invalid or expired Studio/admin authentication session.",
        }, 401);
      }

      const reviewerId = user.id;
      const userRole = String(user.app_metadata?.role || user.role || "").toLowerCase().replace(/[\s_-]+/g, "");
      const isAllowedRole = userRole === "editoriallead" || userRole === "superadmin";

      if (!isAllowedRole) {
        return jsonResponse({
          success: false,
          error: "FORBIDDEN",
          message: "Insufficient permissions. Only editorial_lead or super_admin roles can review partner profiles.",
        }, 403);
      }

      const body = await req.json().catch(() => ({}));
      const { partner_id, action, review_note } = body;

      if (!partner_id || !action) {
        return jsonResponse({ success: false, error: "MISSING_FIELDS", message: "partner_id and action are required." }, 400);
      }

      return invokeRpc(supabase, "review_partner_profile_secure", {
        p_partner_id: partner_id,
        p_reviewer_id: reviewerId,
        p_action: action,
        p_review_note: review_note || null,
      });
    }

    // 2b. STUDIO / ADMIN ENDPOINT: /admin/profile-queue (GET)
    if (pathname.endsWith("/admin/profile-queue") && req.method === "GET") {
      if (req.headers.has("x-partner-session") && !req.headers.has("authorization")) {
        return jsonResponse({
          success: false,
          error: "UNAUTHORIZED",
          message: "Partner sessions are not authorized to perform administrative or editorial profile reviews.",
        }, 403);
      }

      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return jsonResponse({ success: false, error: "UNAUTHORIZED", message: "Valid Studio authentication is required." }, 401);
      }

      const token = authHeader.substring(7).trim();
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return jsonResponse({ success: false, error: "UNAUTHORIZED", message: "Valid Studio authentication is required." }, 401);
      }

      const userRole = String(user.app_metadata?.role || user.role || "").toLowerCase().replace(/[\s_-]+/g, "");
      const isAllowedRole = userRole === "editoriallead" || userRole === "superadmin";

      if (!isAllowedRole) {
        return jsonResponse({ success: false, error: "FORBIDDEN", message: "Editorial review access is restricted." }, 403);
      }

      const statusParam = (url.searchParams.get("status") || "pending_review").toLowerCase().trim();
      const allowedStatuses = ["pending_review", "changes_requested", "approved", "all"];
      if (!allowedStatuses.includes(statusParam)) {
        return jsonResponse({ success: false, error: "INVALID_STATUS_FILTER", message: "Unsupported Partner Passport review status filter." }, 400);
      }

      let query = supabase
        .from("partner_profile_content")
        .select(`
          partner_id, intro_draft, intro_published, draft_photo_path, published_photo_path,
          draft_photo_mime, published_photo_mime, review_status, photo_consent_given,
          photo_consent_at, photo_consent_withdrawn_at, submitted_at, reviewed_at, reviewed_by,
          review_note, content_version, created_at, updated_at,
          partners!inner ( id, public_code, name, status )
        `);

      if (statusParam === "all") {
        query = query.in("review_status", ["pending_review", "changes_requested", "approved"]);
      } else {
        query = query.eq("review_status", statusParam);
      }

      const { data: records, error: dbErr } = await query;
      if (dbErr) {
        return jsonResponse({ success: false, error: "DATABASE_ERROR", message: "Failed to fetch partner profile review queue." }, 500);
      }

      const statusPriority: Record<string, number> = { pending_review: 1, changes_requested: 2, approved: 3 };

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

      return jsonResponse({
        success: true,
        status_filter: statusParam,
        count: profiles.length,
        profiles,
      });
    }

    // 3. OPERATIONAL ENDPOINTS (REQUIRE x-partner-session HEADER)
    const rawToken = req.headers.get("x-partner-session");
    if (!rawToken || !rawToken.trim()) {
      return jsonResponse({ success: false, error: "UNAUTHORIZED", message: "Missing x-partner-session header credential." }, 401);
    }

    const tokenHash = await sha256Hex(rawToken.trim());

    const { data: sessionData, error: sessionErr } = await supabase.rpc("validate_partner_session", { p_token_hash: tokenHash });
    if (sessionErr || !sessionData || !sessionData.valid) {
      return jsonResponse({
        success: false,
        error: sessionData?.error_code || "UNAUTHORIZED",
        message: sessionData?.message || "Invalid or expired partner session.",
      }, 401);
    }

    const partnerId = sessionData.partner_id;

    // ENDPOINT: /logout
    if (pathname.endsWith("/logout") && req.method === "POST") {
      await supabase.rpc("revoke_partner_session", { p_token_hash: tokenHash });
      return jsonResponse({ success: true, message: "Logged out successfully." });
    }

    // ENDPOINT: /me
    if (pathname.endsWith("/me") && req.method === "GET") {
      const { data: partnerRow } = await supabase
        .from("partners")
        .select("id, public_code, name, status, is_open_for_inquiries, contact_preference, must_change_pin, contact_phone, contact_email")
        .eq("id", partnerId)
        .single();

      return jsonResponse({
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
      });
    }

    // ENDPOINT: /me/contact (POST)
    const cleanPathName = pathname.toLowerCase();
    if ((cleanPathName.endsWith("/me/contact") || cleanPathName.endsWith("/me/contact/")) && req.method.toUpperCase() === "POST") {
      return jsonResponse({
        success: false,
        error: "ENDPOINT_DISABLED",
        message: "Direct contact updating via /me/contact is disabled on this database version.",
      }, 501);
    }

    // ENDPOINT: /change-pin (POST)
    if (pathname.endsWith("/change-pin") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { current_pin, new_pin, confirm_new_pin } = body;

      if (!current_pin || !new_pin || !confirm_new_pin) {
        return jsonResponse({
          success: false,
          error: "MISSING_FIELDS",
          message: "Trenutni PIN, novi PIN i potvrda novog PIN-a su obavezni.",
        }, 400);
      }

      return invokeRpc(supabase, "change_partner_pin_secure", {
        p_partner_id: partnerId,
        p_current_pin: String(current_pin).trim(),
        p_new_pin: String(new_pin).trim(),
        p_confirm_new_pin: String(confirm_new_pin).trim(),
      });
    }

    // ENDPOINT: /opportunities (GET)
    if (pathname.endsWith("/opportunities") && req.method === "GET") {
      const scope = url.searchParams.get("scope") || "new";
      const { data, error } = await supabase.rpc("get_partner_opportunities_secure", {
        p_partner_id: partnerId,
        p_scope: scope,
      });

      if (error) {
        return jsonResponse({ success: false, error: "DATABASE_ERROR", message: error.message }, 500);
      }

      return jsonResponse({ success: true, scope, opportunities: data.opportunities || [] });
    }

    // ENDPOINT: /opportunities/view (POST)
    if (pathname.endsWith("/opportunities/view") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id } = body;

      if (!match_id) {
        return jsonResponse({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }, 400);
      }

      return invokeRpc(supabase, "view_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
      });
    }

    // ENDPOINT: /profile-content (GET)
    if ((pathname.endsWith("/profile-content") || pathname.endsWith("/profile-content/")) && req.method === "GET") {
      try {
        const { data: profileContent, error: contentErr } = await supabase
          .from("partner_profile_content")
          .select("*")
          .eq("partner_id", partnerId)
          .maybeSingle();

        if (contentErr) {
          return jsonResponse({ success: false, error: "DATABASE_ERROR", message: contentErr.message }, 500);
        }

        let draftPhotoSignedUrl: string | null = null;
        let publishedPhotoSignedUrl: string | null = null;

        if (profileContent?.draft_photo_path) {
          try {
            const { data: signedData, error: signedErr } = await supabase.storage
              .from("partner-passports")
              .createSignedUrl(profileContent.draft_photo_path, 3600);
            if (!signedErr && signedData?.signedUrl) {
              draftPhotoSignedUrl = signedData.signedUrl;
            }
          } catch {
            draftPhotoSignedUrl = null;
          }
        }

        if (profileContent?.published_photo_path) {
          try {
            const { data: signedData, error: signedErr } = await supabase.storage
              .from("partner-passports")
              .createSignedUrl(profileContent.published_photo_path, 3600);
            if (!signedErr && signedData?.signedUrl) {
              publishedPhotoSignedUrl = signedData.signedUrl;
            }
          } catch {
            publishedPhotoSignedUrl = null;
          }
        }

        const defaultContent = {
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
          draft_contact_phone: null,
          draft_contact_email: null,
          published_contact_phone: null,
          published_contact_email: null,
          content_version: 1,
        };

        const mergedContent = profileContent ? { ...defaultContent, ...profileContent } : defaultContent;

        return jsonResponse({
          success: true,
          partner_id: partnerId,
          content: {
            ...mergedContent,
            draft_photo_signed_url: draftPhotoSignedUrl,
            published_photo_signed_url: publishedPhotoSignedUrl,
          },
        });
      } catch (err: any) {
        return jsonResponse({
          success: false,
          error: "SERVER_ERROR",
          message: err?.message || "Internal server error fetching partner profile content.",
        }, 500);
      }
    }

    // ENDPOINT: /profile-content/upload-authorize (POST)
    if (pathname.endsWith("/profile-content/upload-authorize") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { mime_type, file_size } = body;

      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!mime_type || !allowedMimes.includes(mime_type)) {
        return jsonResponse({ success: false, error: "INVALID_MIME_TYPE", message: "Only JPG, PNG, and WebP images are allowed." }, 400);
      }

      if (file_size && file_size > 5 * 1024 * 1024) {
        return jsonResponse({ success: false, error: "FILE_TOO_LARGE", message: "Image size must not exceed 5 MB." }, 400);
      }

      const ext = mime_type === "image/jpeg" ? "jpg" : mime_type === "image/png" ? "png" : "webp";
      const opaqueRandomId = crypto.randomUUID().replace(/-/g, "");
      const storagePath = `drafts/${opaqueRandomId}.${ext}`;

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
        return jsonResponse({
          success: false,
          error: issueData?.error || "AUTHORIZATION_ISSUE_FAILED",
          message: issueData?.message || issueErr?.message || "Failed to issue upload authorization.",
        }, 400);
      }

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("partner-passports")
        .createSignedUploadUrl(storagePath);

      if (uploadErr || !uploadData?.signedUrl) {
        if (issueData?.authorization_id) {
          await supabase.from("partner_profile_upload_authorizations").delete().eq("id", issueData.authorization_id);
        }
        return jsonResponse({ success: false, error: "STORAGE_ERROR", message: uploadErr?.message || "Failed to generate signed upload URL." }, 500);
      }

      return jsonResponse({
        success: true,
        upload_url: uploadData.signedUrl,
        path: storagePath,
        mime_type,
      });
    }

    // ENDPOINT: /profile-content/draft (POST)
    if (pathname.endsWith("/profile-content/draft") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { intro_draft, draft_photo_path, draft_photo_mime, photo_consent, photo_consent_given } = body;

      if (draft_photo_path) {
        if (!draft_photo_mime || !draft_photo_mime.trim()) {
          return jsonResponse({ success: false, error: "MIME_REQUIRED", message: "draft_photo_mime is mandatory when draft_photo_path is provided." }, 400);
        }

        const { data: blob, error: downloadErr } = await supabase.storage
          .from("partner-passports")
          .download(draft_photo_path);

        if (downloadErr || !blob) {
          return jsonResponse({ success: false, error: "STORAGE_READ_ERROR", message: downloadErr?.message || "Failed to download uploaded draft image for verification." }, 400);
        }

        if (blob.size > 5 * 1024 * 1024) {
          await supabase.storage.from("partner-passports").remove([draft_photo_path]);
          return jsonResponse({ success: false, error: "FILE_TOO_LARGE", message: `Actual stored object byte size (${blob.size} bytes) exceeds maximum 5 MB limit.` }, 400);
        }

        const arrayBuffer = await blob.arrayBuffer();
        const headerBytes = new Uint8Array(arrayBuffer);
        const sigResult = validateImageBinarySignature(headerBytes, draft_photo_mime || "");

        if (!sigResult.valid) {
          await supabase.storage.from("partner-passports").remove([draft_photo_path]);
          return jsonResponse({ success: false, error: "INVALID_FILE_SIGNATURE", message: sigResult.error || "Uploaded file binary magic bytes failed validation." }, 400);
        }
      }

      return invokeRpc(supabase, "save_partner_profile_draft_with_authorization_secure", {
        p_partner_id: partnerId,
        p_intro_draft: intro_draft || null,
        p_draft_photo_path: draft_photo_path || null,
        p_draft_photo_mime: draft_photo_mime || null,
        p_photo_consent: !!(photo_consent ?? photo_consent_given),
      });
    }

    // ENDPOINT: /profile-content/submit (POST)
    if (pathname.endsWith("/profile-content/submit") && req.method === "POST") {
      return invokeRpc(supabase, "submit_partner_profile_secure", { p_partner_id: partnerId });
    }

    // ENDPOINT: /profile-content/withdraw (POST)
    if (pathname.endsWith("/profile-content/withdraw") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { scope = "all" } = body;

      const validScopes = ["draft", "introduction", "photo", "consent", "all"];
      if (!validScopes.includes(scope)) {
        return jsonResponse({ success: false, error: "INVALID_SCOPE", message: `Scope must be one of: ${validScopes.join(", ")}` }, 400);
      }

      return invokeRpc(supabase, "withdraw_partner_profile_v2_secure", {
        p_partner_id: partnerId,
        p_scope: scope,
      });
    }

    // ENDPOINT: /opportunities/accept (POST)
    if (pathname.endsWith("/opportunities/accept") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, message } = body;

      if (!match_id || !message) {
        return jsonResponse({ success: false, error: "MISSING_FIELDS", message: "match_id and message are required." }, 400);
      }

      return invokeRpc(supabase, "accept_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_message: message,
      });
    }

    // ENDPOINT: /opportunities/decline (POST)
    if (pathname.endsWith("/opportunities/decline") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, message } = body;

      if (!match_id) {
        return jsonResponse({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }, 400);
      }

      return invokeRpc(supabase, "decline_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_message: message || null,
      });
    }

    // ENDPOINT: /opportunities/propose (POST)
    if (pathname.endsWith("/opportunities/propose") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, proposed_start_at, proposed_end_at, message } = body;

      if (!match_id || !proposed_start_at || !proposed_end_at || !message) {
        return jsonResponse({
          success: false,
          error: "MISSING_FIELDS",
          message: "match_id, proposed_start_at, proposed_end_at, and message are required.",
        }, 400);
      }

      return invokeRpc(supabase, "propose_partner_alternative_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_proposed_start: proposed_start_at,
        p_proposed_end: proposed_end_at,
        p_message: message,
      });
    }

    // ENDPOINT: /opportunities/accept-counter (POST)
    if (pathname.endsWith("/opportunities/accept-counter") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id } = body;

      if (!match_id) {
        return jsonResponse({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }, 400);
      }

      return invokeRpc(supabase, "accept_partner_counter_offer_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
      });
    }

    // ENDPOINT: /opportunities/decline-counter (POST)
    if (pathname.endsWith("/opportunities/decline-counter") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, reason } = body;

      if (!match_id) {
        return jsonResponse({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }, 400);
      }

      return invokeRpc(supabase, "decline_partner_counter_offer_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_reason: reason || null,
      });
    }

    // ENDPOINT: /opportunities/withdraw (POST)
    if (pathname.endsWith("/opportunities/withdraw") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { match_id, reason } = body;

      if (!match_id) {
        return jsonResponse({ success: false, error: "MISSING_MATCH_ID", message: "match_id is required." }, 400);
      }

      return invokeRpc(supabase, "withdraw_partner_opportunity_secure", {
        p_partner_id: partnerId,
        p_match_id: match_id,
        p_reason: reason || null,
      });
    }

    return jsonResponse({ success: false, error: "NOT_FOUND", message: `Endpoint '${pathname}' not found.` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: "SERVER_ERROR", message: err.message || "Internal server error." }, 500);
  }
});
