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
        // Use the outbox UUID 'id' as a stable idempotency key retained across retries
        const idempotencyKey = id;

        // Dispatch with provider-specific idempotency key
        const providerResponse = await dispatchNotificationWithIdempotency(channel, payload, idempotencyKey);

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
            idempotency_key: id, // Retain the stable idempotency key across retries
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
 * Idempotent dispatch simulation layer representing delivery via external SMTP, SMS, or WhatsApp
 */
async function dispatchNotificationWithIdempotency(
  channel: string,
  payload: any,
  idempotencyKey: string
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate minor network latency

  if (!channel || typeof channel !== "string") {
    return { success: false, error: "Invalid communication channel" };
  }

  // Generate unique provider tracking ID
  const mockRandomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  const providerMessageId = `msg_${channel}_${mockRandomPart}`;

  // Log simulated transmission including the stable idempotency key
  console.log(`[DISPATCH SUCCESS] [Channel: ${channel}] [Idempotency Key: ${idempotencyKey}] [Provider Message ID: ${providerMessageId}] Dispatching message: "${payload?.title || ""}" -> "${payload?.body || ""}"`);
  
  return { success: true, providerMessageId };
}
