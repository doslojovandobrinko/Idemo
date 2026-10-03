-- Phase 3: IDEMO 007 Resource Metering & Baseline Instrumentation Schema
-- Stores exact per-call telemetry for Agent 007 executions

CREATE TABLE IF NOT EXISTS public.agent_007_resource_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL,
    parent_run_id TEXT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('RESEARCH', 'SYNTHESIS', 'LOCALIZATION')),
    model TEXT NOT NULL DEFAULT 'gemini-3.7-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER NOT NULL,
    search_grounding_used BOOLEAN NOT NULL DEFAULT FALSE,
    research_cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
    preflight_input_tokens INTEGER NULL,
    prompt_token_count INTEGER NULL,
    candidate_token_count INTEGER NULL,
    total_token_count INTEGER NULL,
    thoughts_token_count INTEGER NULL,
    cached_content_token_count INTEGER NULL,
    tool_use_prompt_token_count INTEGER NULL,
    input_character_count INTEGER NOT NULL DEFAULT 0,
    output_character_count INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_code TEXT NULL
);

-- Index for fast correlation queries by run_id
CREATE INDEX IF NOT EXISTS idx_agent_007_telemetry_run_id ON public.agent_007_resource_telemetry(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_007_telemetry_created_at ON public.agent_007_resource_telemetry(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_007_resource_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated Studio admins
CREATE POLICY "Allow authenticated read on agent_007_resource_telemetry"
    ON public.agent_007_resource_telemetry
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Allow service_role insert access for server endpoints
CREATE POLICY "Allow service_role insert on agent_007_resource_telemetry"
    ON public.agent_007_resource_telemetry
    FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- Allow anon insert access when server uses anon key
CREATE POLICY "Allow anon insert on agent_007_resource_telemetry"
    ON public.agent_007_resource_telemetry
    FOR INSERT
    TO anon
    WITH CHECK (TRUE);
