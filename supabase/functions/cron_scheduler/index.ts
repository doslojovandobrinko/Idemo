// IDEMO PARTNER ROUTING ENGINE - PHASE 5: CRON SCHEDULER EDGE FUNCTION
// Target Platform: Supabase Edge Functions (Deno Runtime)
// Version: v1.3.0 (Phase 5 Implementation)
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
    // 2. Initialize Supabase Client with environment keys
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const workerSecret = Deno.env.get("NOTIFICATION_WORKER_SECRET") ?? "";

    if (!supabaseUrl || !supabaseServiceKey || !workerSecret) {
      throw new Error(
        "Missing Supabase or worker authentication environment variables.",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log("Executing scheduled Cron Jobs...");

    // 3. Step A: Run the Operational Watchdog
    // This processes expired offers, recovers stalled inquiries, and escalates to concierge
    console.log("Running Operational Watchdog...");
    const { data: watchdogResult, error: watchdogError } = await supabase.rpc(
      "run_operational_watchdog",
    );
    if (watchdogError) {
      console.error("Operational Watchdog failed:", watchdogError);
    } else {
      console.log(
        `Operational Watchdog completed successfully. Resolved instances: ${watchdogResult}`,
      );
    }

    // 4. Step B: Run System Maintenance
    // Cleans up old rate-limit records and historical notification logs
    console.log("Running System Maintenance...");
    const { error: maintenanceError } = await supabase.rpc(
      "run_system_maintenance",
    );
    if (maintenanceError) {
      console.error("System Maintenance failed:", maintenanceError);
    } else {
      console.log("System Maintenance completed successfully.");
    }

    // 5. Step C: Invoke the Notification Worker
    // Dispatches all queued and retry-eligible notifications
    console.log("Invoking Notification Worker...");
    // We can directly call the notification_worker via edge function url,
    // or call its logic, or make a fetch. Calling fetch is extremely clean:
    const workerUrl = `${supabaseUrl}/functions/v1/notification_worker`;
    let workerResult = "Not Invoked";
    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          "x-idemo-worker-secret": workerSecret,
        },
      });
      const resData = await response.json();
      workerResult = JSON.stringify(resData);
      console.log("Notification Worker finished:", workerResult);
    } catch (err: any) {
      console.error(
        "Failed to invoke Notification Worker via HTTP:",
        err?.message,
      );
      workerResult = `Error: ${err?.message}`;
    }

    // 6. Return successful report summary
    return new Response(
      JSON.stringify({
        success: true,
        watchdog_resolved_instances: watchdogResult ?? 0,
        maintenance: maintenanceError ? "failed" : "success",
        worker_invocation: workerResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Cron scheduler process execution failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
