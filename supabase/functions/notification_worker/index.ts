// IDEMO PARTNER ROUTING ENGINE - PHASE 5: NOTIFICATION WORKER EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Version: v1.3.1 (Phase 5 Secure & Idempotent Implementation)
// Language: TypeScript (Deno)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idemo-worker-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Timing-safe string comparison to prevent side-channel timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  // 1. Handle CORS Preflight Options Request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce HTTP POST requirement for notification_worker
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Enforce Privileged Endpoint Security via custom worker-secret header
    const workerSecretHeader = req.headers.get("x-idemo-worker-secret");
    
    if (!workerSecretHeader) {
      return new Response(
        JSON.stringify({ error: "Missing worker authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const workerSecret = Deno.env.get("NOTIFICATION_WORKER_SECRET") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!workerSecret) {
      console.error("NOTIFICATION_WORKER_SECRET environment variable is not configured.");
      return new Response(
        JSON.stringify({ error: "Server authentication misconfigured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Safety check: Reject if the secret presented is empty or matches the public anon key
    if (workerSecretHeader === "" || (anonKey && safeCompare(workerSecretHeader, anonKey))) {
      return new Response(
        JSON.stringify({ error: "Invalid worker authentication credentials" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!safeCompare(workerSecretHeader, workerSecret)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized operational access" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Initialize Supabase Client with environment service role key
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

    // 4. Atomically dequeue notifications for processing (up to a batch of 10)
    const { data: notifications, error: dequeueError } = await supabase
      .rpc("dequeue_notifications", { p_limit: 10 });

    if (dequeueError) {
      console.error("Failed to dequeue notifications atomically:", dequeueError);
      throw dequeueError;
    }

    const processedResults = [];

    // 5. Process each notification independently
    for (const notification of notifications || []) {
      const { id, channel, recipient_type, recipient_id, payload, retry_count, max_retries } = notification;

      try {
        console.log(`Processing notification ${id}: channel=${channel}, recipient=${recipient_type}:${recipient_id}`);
        
        // 6. Stable Provider Idempotency
        // Retain explicit idempotency_key if set by trigger, otherwise fall back to outbox UUID
        const idempotencyKey = notification.idempotency_key || id;

        // Dispatch with provider-specific idempotency key
        const providerResponse = await dispatchNotificationWithIdempotency(
          supabase,
          notification,
          channel,
          payload,
          idempotencyKey
        );

        if (!providerResponse.success) {
          throw new Error(providerResponse.error || "Delivery failed");
        }

        // 7. Atomic success update (State: sent)
        const { error: successError } = await supabase
          .from("notification_outbox")
          .update({
            status: "sent",
            idempotency_key: idempotencyKey,
            provider_message_id: providerResponse.providerMessageId,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (successError) {
          console.error(`Failed to update status to sent for notification ${id}:`, successError);
        } else {
          processedResults.push({ id, status: "sent", providerMessageId: providerResponse.providerMessageId });
        }

      } catch (err: any) {
        const errorMsg = err?.message || "Unknown error";
        console.error(`Delivery failure on notification ${id}:`, errorMsg);

        // Calculate next scheduled retry time (linear backoff of 5 minutes per retry step)
        const nextRetryCount = retry_count + 1;
        const backoffMinutes = nextRetryCount * 5; // 5, 10, 15 minutes backoff
        const nextScheduledAt = new Date(Date.now() + backoffMinutes * 60000).toISOString();

        // 8. Atomic failure update (State: failed / retry-scheduled)
        const { error: failError } = await supabase
          .from("notification_outbox")
          .update({
            status: nextRetryCount < max_retries ? "failed" : "permanently_failed",
            retry_count: nextRetryCount,
            last_error: errorMsg,
            last_error_code: "DELIVERY_FAILED",
            idempotency_key: notification.idempotency_key || id, // Retain stable idempotency key across retries
            scheduled_at: nextRetryCount < max_retries ? nextScheduledAt : notification.scheduled_at,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (failError) {
          console.error(`Failed to record failure for notification ${id}:`, failError);
        } else {
          processedResults.push({ id, status: "failed", error: errorMsg });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedResults }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Worker process execution failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Dispatches visitor push notifications via OneSignal REST API using database unread count
 * as the absolute badge source of truth, and falls back to non-push channel logging for partner/concierge.
 */
async function dispatchNotificationWithIdempotency(
  supabase: any,
  notification: any,
  channel: string,
  payload: any,
  idempotencyKey: string
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  if (!channel || typeof channel !== "string") {
    return { success: false, error: "Invalid communication channel" };
  }

  if (notification?.recipient_type === "visitor" && channel === "push") {
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")?.trim();
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")?.trim();

    if (!oneSignalAppId || !oneSignalApiKey) {
      return {
        success: false,
        error: "MISSING_ONESIGNAL_CONFIG: ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY must be configured in backend secrets."
      };
    }

    const inquiryId = payload?.inquiry_id || notification?.recipient_id;
    if (!inquiryId) {
      return { success: false, error: "MISSING_INQUIRY_ID: Cannot resolve visitor push context without inquiry_id." };
    }

    const { data: dispatchCtx, error: ctxErr } = await supabase.rpc(
      "get_visitor_push_dispatch_context",
      { p_inquiry_id: inquiryId }
    );

    if (ctxErr || !dispatchCtx?.found) {
      return {
        success: false,
        error: `DISPATCH_CONTEXT_ERROR: ${ctxErr?.message || dispatchCtx?.error || "Inquiry not found"}`
      };
    }

    const visitorExternalId =
      typeof dispatchCtx.visitor_external_id === "string" && dispatchCtx.visitor_external_id.trim() !== ""
        ? dispatchCtx.visitor_external_id.trim()
        : "";

    if (!visitorExternalId) {
      return {
        success: false,
        error: "MISSING_VISITOR_PUSH_IDENTITY: Inquiry has no bound OneSignal external_id."
      };
    }

    const unreadCount = Math.max(0, Number(dispatchCtx.unread_count ?? 1));
    const responseId = dispatchCtx.response_id || payload?.response_id || null;
    const matchId = dispatchCtx.match_id || payload?.match_id || null;

    // Strict UUID validation for OneSignal provider idempotency_key
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!responseId || typeof responseId !== "string" || !uuidRegex.test(responseId)) {
      return {
        success: false,
        error: "INVALID_PROPOSAL_RESPONSE_UUID: Cannot dispatch OneSignal push without a valid proposal response UUID for idempotency_key."
      };
    }

    const oneSignalPayload = {
      app_id: oneSignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: [visitorExternalId]
      },
      headings: {
        en: "IDEMO"
      },
      contents: {
        en: "You have a new partner proposal ready to review."
      },
      ios_badgeType: "SetTo",
      ios_badgeCount: unreadCount,
      idempotency_key: responseId,
      data: {
        inquiry_id: inquiryId,
        match_id: matchId,
        response_id: responseId,
        action: "review_proposal"
      }
    };

    const osResponse = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${oneSignalApiKey}`
      },
      body: JSON.stringify(oneSignalPayload)
    });

    const osBody = await osResponse.json().catch(() => ({}));
    if (!osResponse.ok || !osBody?.id) {
      const errDetail = osBody?.errors ? JSON.stringify(osBody.errors) : `HTTP_${osResponse.status}`;
      return { success: false, error: `ONESIGNAL_DISPATCH_FAILED: ${errDetail}` };
    }

    return { success: true, providerMessageId: String(osBody.id) };
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Generate unique provider tracking ID for non-visitor channels
  const mockRandomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  const providerMessageId = `msg_${channel}_${mockRandomPart}`;

  console.log(`[DISPATCH SUCCESS] [Channel: ${channel}] [Idempotency Key: ${idempotencyKey}] [Provider Message ID: ${providerMessageId}] Dispatching message: "${payload?.title || ""}" -> "${payload?.body || ""}"`);
  
  return { success: true, providerMessageId };
}
