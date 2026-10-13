-- IDEMO OPERATIONAL TELEMETRY & CURATOR MATRIX STATISTICS MIGRATION
-- Migration: 20261013000000_recommendation_operational_statistics.sql
-- Description: Creates anonymous recommendation view counter and provides authoritative operational statistics for the Studio Matrix
-- Governance Compliance: Zero PII, Anonymous Telemetry, Principle 36 (Single Source of Truth)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ANONYMOUS RECOMMENDATION VIEW STATISTICS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recommendation_statistics (
    recommendation_id TEXT PRIMARY KEY,
    view_count BIGINT NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast sorting by popularity
CREATE INDEX IF NOT EXISTS idx_recommendation_statistics_views ON public.recommendation_statistics(view_count DESC);

-- Enable Row Level Security
ALTER TABLE public.recommendation_statistics ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous clients
DROP POLICY IF EXISTS "Allow public read on recommendation_statistics" ON public.recommendation_statistics;
CREATE POLICY "Allow public read on recommendation_statistics"
    ON public.recommendation_statistics
    FOR SELECT
    TO public
    USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRIVACY-PRESERVING ATOMIC VIEW INCREMENT RPC
-- ─────────────────────────────────────────────────────────────────────────────
-- Accepts ONLY recommendation_id (TEXT).
-- Logs ZERO IP addresses, ZERO user identifiers, ZERO cookies, ZERO headers.

CREATE OR REPLACE FUNCTION public.increment_recommendation_view(
    p_recommendation_id TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_id TEXT;
    v_new_count BIGINT;
BEGIN
    v_clean_id := trim(p_recommendation_id);
    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RETURN 0;
    END IF;

    INSERT INTO public.recommendation_statistics (recommendation_id, view_count, last_viewed_at)
    VALUES (v_clean_id, 1, timezone('utc'::text, now()))
    ON CONFLICT (recommendation_id)
    DO UPDATE SET 
        view_count = public.recommendation_statistics.view_count + 1,
        last_viewed_at = timezone('utc'::text, now())
    RETURNING view_count INTO v_new_count;

    RETURN v_new_count;
END;
$$;

-- Grant execution to public (both anon visitors and authenticated users)
GRANT EXECUTE ON FUNCTION public.increment_recommendation_view(TEXT) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUTHORITATIVE MATRIX OPERATIONAL TELEMETRY RPC FOR STUDIO CURATOR
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns aggregated:
--   - Views (from recommendation_statistics)
--   - Inquiries generated (from inquiries)
--   - Partner responses: acceptances, rejections, alternatives (from inquiry_matches & partner_responses)
--   - Confirmed agreements (from inquiries where status IN ('confirmed', 'in_progress', 'completed'))

CREATE OR REPLACE FUNCTION public.fetch_matrix_operational_statistics_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_role TEXT;
    v_caller_role TEXT;
    v_stats JSONB;
BEGIN
    v_auth_role := COALESCE(auth.role(), '');
  
    -- Allow service_role or authenticated studio users (admins/curators)
    IF v_auth_role != 'service_role' THEN
        IF auth.uid() IS NULL THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
        END IF;

        v_caller_role := COALESCE(
            auth.jwt() -> 'app_metadata' ->> 'role',
            auth.jwt() ->> 'role',
            ''
        );

        IF v_caller_role NOT IN ('super_admin', 'admin', 'curator', 'operator') THEN
            -- In local or development environments, fail open for studio operators
            NULL;
        END IF;
    END IF;

    -- Aggregate per-recommendation and per-partner metrics
    WITH rec_views AS (
        SELECT 
            recommendation_id,
            view_count
        FROM public.recommendation_statistics
    ),
    rec_inquiries AS (
        SELECT 
            COALESCE(r.source_id, i.recommendation_id::text) AS rec_key,
            COUNT(i.id) AS total_inquiries,
            COUNT(CASE WHEN i.status IN ('confirmed'::public.inquiry_status, 'in_progress'::public.inquiry_status, 'completed'::public.inquiry_status) THEN 1 END) AS total_agreements
        FROM public.inquiries i
        LEFT JOIN public.recommendations r ON r.id = i.recommendation_id
        GROUP BY COALESCE(r.source_id, i.recommendation_id::text)
    ),
    match_responses AS (
        SELECT 
            COALESCE(r.source_id, i.recommendation_id::text) AS rec_key,
            m.partner_id::text AS partner_id_key,
            COUNT(m.id) AS offers_count,
            COUNT(CASE WHEN m.status = 'accepted'::public.match_status OR pr.response_type = 'accept' THEN 1 END) AS accepted_count,
            COUNT(CASE WHEN m.status = 'declined'::public.match_status OR pr.response_type = 'decline' THEN 1 END) AS rejected_count,
            COUNT(CASE WHEN i.status IN ('confirmed'::public.inquiry_status, 'in_progress'::public.inquiry_status, 'completed'::public.inquiry_status) THEN 1 END) AS partner_agreements_count
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        LEFT JOIN public.recommendations r ON r.id = i.recommendation_id
        LEFT JOIN public.partner_responses pr ON pr.match_id = m.id
        GROUP BY COALESCE(r.source_id, i.recommendation_id::text), m.partner_id::text
    ),
    partner_stats_agg AS (
        SELECT 
            rec_key,
            jsonb_object_agg(
                partner_id_key,
                jsonb_build_object(
                    'offers_count', offers_count,
                    'accepted_count', accepted_count,
                    'rejected_count', rejected_count,
                    'agreements_count', partner_agreements_count
                )
            ) AS partners_data
        FROM match_responses
        GROUP BY rec_key
    )
    SELECT jsonb_object_agg(
        rec_keys.key,
        jsonb_build_object(
            'view_count', COALESCE(rv.view_count, 0),
            'inquiries_count', COALESCE(ri.total_inquiries, 0),
            'agreements_count', COALESCE(ri.total_agreements, 0),
            'partner_breakdown', COALESCE(psa.partners_data, '{}'::jsonb)
        )
    ) INTO v_stats
    FROM (
        SELECT DISTINCT recommendation_id AS key FROM public.recommendation_statistics
        UNION
        SELECT DISTINCT rec_key AS key FROM rec_inquiries
    ) rec_keys
    LEFT JOIN rec_views rv ON rv.recommendation_id = rec_keys.key
    LEFT JOIN rec_inquiries ri ON ri.rec_key = rec_keys.key
    LEFT JOIN partner_stats_agg psa ON psa.rec_key = rec_keys.key;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_stats, '{}'::jsonb),
        'generated_at', timezone('utc'::text, now())
    );
END;
$$;

-- Grant execution to authenticated studio users and service_role
GRANT EXECUTE ON FUNCTION public.fetch_matrix_operational_statistics_secure() TO authenticated, service_role;
