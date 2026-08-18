-- IDEMO Partner Portfolio Workflow Migration
-- Work Package: WP-14B2 Gate 4 Targeted Defect Correction
-- Migration File: 20260803000001_wp14b2_partner_portfolio_workflow.sql
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.2.0

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FEATURE FLAG INITIALIZATION (IN public.system_settings)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES 
    ('partner_portfolio_workflow_enabled', 'false', 'Server-authoritative feature flag for WP-14B2 Partner Portfolio Workflow', timezone('utc'::text, now())),
    ('editorial_workflow_engine_enabled', 'false', 'Server-authoritative feature flag for WP-14 Editorial Workflow Engine', timezone('utc'::text, now()))
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- Ensure mutable concurrency version column exists on public.editorial_work_items
ALTER TABLE public.editorial_work_items
    ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1 CHECK (row_version > 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. IMMUTABLE PORTFOLIO SNAPSHOTS TABLE & TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.partner_portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    partner_id VARCHAR(100) NOT NULL,
    portfolio_version INT NOT NULL DEFAULT 1 CHECK (portfolio_version > 0),
    handler_key VARCHAR(100) NOT NULL DEFAULT 'partner.portfolio.submission',
    handler_version INT NOT NULL DEFAULT 1 CHECK (handler_version > 0),
    registry_version INT NOT NULL DEFAULT 1 CHECK (registry_version > 0),
    minimum_engine_version INT NOT NULL DEFAULT 1 CHECK (minimum_engine_version > 0),
    content_version INT NOT NULL DEFAULT 1 CHECK (content_version > 0),
    portfolio_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_result JSONB NOT NULL DEFAULT '{"valid": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_partner_portfolio_snapshots_partner 
ON public.partner_portfolio_snapshots (partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_portfolio_snapshots_work_item 
ON public.partner_portfolio_snapshots (work_item_id);

-- DEFECT 4: Database-level immutability protection for partner_portfolio_snapshots
CREATE OR REPLACE FUNCTION public.block_portfolio_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Partner portfolio snapshots are immutable. UPDATE and DELETE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS secure_partner_portfolio_snapshots_immutability ON public.partner_portfolio_snapshots;
CREATE TRIGGER secure_partner_portfolio_snapshots_immutability
BEFORE UPDATE OR DELETE ON public.partner_portfolio_snapshots
FOR EACH ROW EXECUTE FUNCTION public.block_portfolio_snapshot_mutation();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. REGISTERED MATCHING MODULE POLICY TABLE & SEEDING (IMMUTABLE POLICY RECORDS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.partner_matching_module_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version INT NOT NULL DEFAULT 1,
    module_id VARCHAR(100) NOT NULL,
    module_version INT NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT true,
    execution_priority INT NOT NULL DEFAULT 10,
    is_hard_constraint BOOLEAN NOT NULL DEFAULT false,
    weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0.00 AND weight <= 1.00),
    required_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(policy_version, module_id)
);

-- DEFECT 6: Immutable Policy rows (DO NOTHING on conflict to prevent in-place mutation)
INSERT INTO public.partner_matching_module_policies (
    policy_version, module_id, module_version, enabled, execution_priority, is_hard_constraint, weight, required_inputs, description
) VALUES
    (1, 'taxonomy_alignment', 1, true, 10, false, 0.30, '["taxonomy", "capability_id"]'::jsonb, 'Matches partner capability IDs against recommendation capability requirement IDs'),
    (1, 'expertise_scope', 1, true, 20, false, 0.30, '["portfolio_items", "capability_id"]'::jsonb, 'Matches partner portfolio item capability IDs against recommendation capabilities'),
    (1, 'service_area_geography', 1, true, 30, false, 0.20, '["service_areas", "service_area_id"]'::jsonb, 'Matches partner service area UUIDs against recommendation service area UUID'),
    (1, 'language_support', 1, true, 40, false, 0.20, '["languages", "language_id"]'::jsonb, 'Matches partner language capability UUIDs/codes against required language UUIDs/codes'),
    (1, 'availability_capacity', 1, false, 50, false, 0.00, '["availability"]'::jsonb, 'Omitted from automatic matching due to missing authoritative backend source')
ON CONFLICT (policy_version, module_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTOMATIC MATCHING RESULTS & IMMUTABLE OVERRIDES TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.partner_matching_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    partner_id VARCHAR(100) NOT NULL,
    recommendation_id VARCHAR(100) NOT NULL,
    original_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (original_score >= 0.00 AND original_score <= 100.00),
    original_confidence NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (original_confidence >= 0.00 AND original_confidence <= 100.00),
    original_explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
    original_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    algorithm_version VARCHAR(50) NOT NULL DEFAULT 'v1.2.0',
    policy_version INT NOT NULL DEFAULT 1,
    source_data_version JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (score >= 0.00 AND score <= 100.00),
    confidence NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (confidence >= 0.00 AND confidence <= 100.00),
    review_required BOOLEAN NOT NULL DEFAULT false,
    explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    module_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_manual_override BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_partner_matching_results_partner 
ON public.partner_matching_results (partner_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_partner_matching_results_work_item 
ON public.partner_matching_results (work_item_id);

CREATE INDEX IF NOT EXISTS idx_partner_matching_results_recommendation 
ON public.partner_matching_results (recommendation_id);

CREATE TABLE IF NOT EXISTS public.partner_matching_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matching_result_id UUID NOT NULL REFERENCES public.partner_matching_results(id) ON DELETE RESTRICT,
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    override_by UUID NOT NULL,
    override_decision VARCHAR(50) NOT NULL DEFAULT 'adjusted' CHECK (override_decision IN ('approved', 'rejected', 'adjusted')),
    original_score NUMERIC(5,2) NOT NULL,
    original_confidence NUMERIC(5,2) NOT NULL,
    new_score NUMERIC(5,2) NOT NULL CHECK (new_score >= 0.00 AND new_score <= 100.00),
    new_confidence NUMERIC(5,2) NOT NULL CHECK (new_confidence >= 0.00 AND new_confidence <= 100.00),
    override_reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_partner_matching_overrides_matching 
ON public.partner_matching_overrides (matching_result_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PORTFOLIO PUBLICATION QUEUE TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portfolio_publication_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    partner_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    index_refresh_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (index_refresh_status IN ('pending', 'completed', 'failed')),
    package_build_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (package_build_status IN ('pending', 'queued', 'completed', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_portfolio_publication_queue_status 
ON public.portfolio_publication_queue (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_portfolio_publication_queue_work_item 
ON public.portfolio_publication_queue (work_item_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY & DEFENSE-IN-DEPTH
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.partner_portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_matching_module_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_matching_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_matching_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_publication_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.partner_portfolio_snapshots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.partner_matching_module_policies FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.partner_matching_results FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.partner_matching_overrides FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.portfolio_publication_queue FROM PUBLIC, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. WORKFLOW RPCS
-- ─────────────────────────────────────────────────────────────────────────────

-- 7.1 SUBMIT PARTNER PORTFOLIO WORK ITEM RPC (STRICT SCHEMA VALIDATION BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.submit_partner_portfolio_work_item_secure(
    p_partner_id TEXT,
    p_portfolio_data JSONB,
    p_idempotency_key TEXT DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_engine_flag TEXT;
    v_portfolio_flag TEXT;
    v_snapshot_id UUID;
    v_corr_id UUID;
    v_idempotency TEXT;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_result_item public.editorial_work_items%ROWTYPE;
    
    -- Validation variables (DEFECT 3)
    v_bus_name TEXT;
    v_languages JSONB;
    v_taxonomy JSONB;
    v_service_areas JSONB;
    v_items JSONB;
    v_errors JSONB := '[]'::jsonb;
    v_key RECORD;
    v_elem JSONB;
    v_item_obj JSONB;
    v_item_key RECORD;
    v_str_data TEXT;
    v_db_count INT;
    v_idx INT;
BEGIN
    -- 1. Check feature flags
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_portfolio_flag FROM public.system_settings WHERE key = 'partner_portfolio_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_portfolio_flag IS NULL OR LOWER(TRIM(v_portfolio_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Partner Portfolio Workflow is currently disabled.'
        );
    END IF;

    -- 2. Validate Input Parameters
    IF p_partner_id IS NULL OR TRIM(p_partner_id) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'partner_id is required.');
    END IF;

    IF p_portfolio_data IS NULL OR jsonb_typeof(p_portfolio_data) <> 'object' OR p_portfolio_data = '{}'::jsonb THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'portfolio_data payload must be a non-empty JSON object.');
    END IF;

    -- DEFECT 3: Payload size limit (Max 100 KB)
    IF pg_column_size(p_portfolio_data) > 102400 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_FAILED',
            'message', 'Portfolio submission payload size exceeds maximum limit of 100KB.'
        );
    END IF;

    -- DEFECT 3: Rejection of credentials, tokens, PINs, secrets, and signed URLs
    v_str_data := LOWER(p_portfolio_data::text);
    IF v_str_data ~ '("token"|"pin"|"password"|"secret"|"signed_url"|"credential"|"api_key")' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_FAILED',
            'message', 'Portfolio payload contains prohibited security tokens or credentials.'
        );
    END IF;

    -- DEFECT 3: Exact allowed top-level keys check
    FOR v_key IN SELECT key FROM jsonb_each(p_portfolio_data) LOOP
        IF v_key.key NOT IN ('business_name', 'languages', 'taxonomy', 'service_areas', 'portfolio_items') THEN
            v_errors := v_errors || jsonb_build_object('field', v_key.key, 'rule', 'allowed_keys', 'message', 'Unsupported top-level key: ' || v_key.key);
        END IF;
    END LOOP;

    -- DEFECT 3: Business name validation
    v_bus_name := TRIM(COALESCE(p_portfolio_data->>'business_name', ''));
    IF length(v_bus_name) < 2 OR length(v_bus_name) > 255 THEN
        v_errors := v_errors || jsonb_build_object('field', 'business_name', 'rule', 'length_2_255', 'message', 'Business name length must be between 2 and 255 characters.');
    END IF;

    -- DEFECT 3: Languages validation
    v_languages := p_portfolio_data->'languages';
    IF v_languages IS NULL OR jsonb_typeof(v_languages) <> 'array' OR jsonb_array_length(v_languages) = 0 OR jsonb_array_length(v_languages) > 20 THEN
        v_errors := v_errors || jsonb_build_object('field', 'languages', 'rule', 'array_length_1_20', 'message', 'Languages must be an array of 1 to 20 elements.');
    ELSE
        -- Check duplicate languages & database existence in public.languages
        FOR v_idx IN 0 .. (jsonb_array_length(v_languages) - 1) LOOP
            v_elem := v_languages->v_idx;
            IF jsonb_typeof(v_elem) <> 'string' THEN
                v_errors := v_errors || jsonb_build_object('field', 'languages', 'rule', 'string_element', 'message', 'Language element must be a string.');
            ELSE
                SELECT COUNT(*) INTO v_db_count FROM public.languages WHERE id::text = (v_elem->>0) OR code = (v_elem->>0);
                IF v_db_count = 0 THEN
                    v_errors := v_errors || jsonb_build_object('field', 'languages', 'rule', 'canonical_id', 'message', 'Unknown language identifier: ' || (v_elem->>0));
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- DEFECT 3: Service Areas validation
    v_service_areas := p_portfolio_data->'service_areas';
    IF v_service_areas IS NULL OR jsonb_typeof(v_service_areas) <> 'array' OR jsonb_array_length(v_service_areas) = 0 OR jsonb_array_length(v_service_areas) > 50 THEN
        v_errors := v_errors || jsonb_build_object('field', 'service_areas', 'rule', 'array_length_1_50', 'message', 'Service areas must be an array of 1 to 50 elements.');
    ELSE
        FOR v_idx IN 0 .. (jsonb_array_length(v_service_areas) - 1) LOOP
            v_elem := v_service_areas->v_idx;
            IF jsonb_typeof(v_elem) <> 'string' THEN
                v_errors := v_errors || jsonb_build_object('field', 'service_areas', 'rule', 'string_element', 'message', 'Service area element must be a string.');
            ELSE
                SELECT COUNT(*) INTO v_db_count FROM public.service_areas WHERE id::text = (v_elem->>0) OR name_en = (v_elem->>0);
                IF v_db_count = 0 THEN
                    v_errors := v_errors || jsonb_build_object('field', 'service_areas', 'rule', 'canonical_id', 'message', 'Unknown service area identifier: ' || (v_elem->>0));
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- DEFECT 3: Taxonomy / Capabilities validation
    v_taxonomy := p_portfolio_data->'taxonomy';
    IF v_taxonomy IS NULL OR jsonb_typeof(v_taxonomy) <> 'array' OR jsonb_array_length(v_taxonomy) = 0 OR jsonb_array_length(v_taxonomy) > 50 THEN
        v_errors := v_errors || jsonb_build_object('field', 'taxonomy', 'rule', 'array_length_1_50', 'message', 'Taxonomy capabilities must be an array of 1 to 50 elements.');
    ELSE
        FOR v_idx IN 0 .. (jsonb_array_length(v_taxonomy) - 1) LOOP
            v_elem := v_taxonomy->v_idx;
            IF jsonb_typeof(v_elem) <> 'string' THEN
                v_errors := v_errors || jsonb_build_object('field', 'taxonomy', 'rule', 'string_element', 'message', 'Taxonomy capability element must be a string.');
            ELSE
                SELECT COUNT(*) INTO v_db_count FROM public.capabilities WHERE id::text = (v_elem->>0) OR code = (v_elem->>0);
                IF v_db_count = 0 THEN
                    v_errors := v_errors || jsonb_build_object('field', 'taxonomy', 'rule', 'canonical_id', 'message', 'Unknown taxonomy/capability identifier: ' || (v_elem->>0));
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- DEFECT 3: Portfolio Items schema validation
    v_items := p_portfolio_data->'portfolio_items';
    IF v_items IS NULL OR jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 OR jsonb_array_length(v_items) > 20 THEN
        v_errors := v_errors || jsonb_build_object('field', 'portfolio_items', 'rule', 'array_length_1_20', 'message', 'Portfolio items must be an array of 1 to 20 elements.');
    ELSE
        FOR v_idx IN 0 .. (jsonb_array_length(v_items) - 1) LOOP
            v_item_obj := v_items->v_idx;
            IF jsonb_typeof(v_item_obj) <> 'object' THEN
                v_errors := v_errors || jsonb_build_object('field', 'portfolio_items', 'rule', 'object_element', 'message', 'Portfolio item must be an object.');
            ELSE
                FOR v_item_key IN SELECT key FROM jsonb_each(v_item_obj) LOOP
                    IF v_item_key.key NOT IN ('title', 'capability_id', 'description') THEN
                        v_errors := v_errors || jsonb_build_object('field', 'portfolio_items.' || v_item_key.key, 'rule', 'allowed_keys', 'message', 'Unsupported key in portfolio item: ' || v_item_key.key);
                    END IF;
                END LOOP;

                IF length(TRIM(COALESCE(v_item_obj->>'title', ''))) < 2 OR length(TRIM(COALESCE(v_item_obj->>'title', ''))) > 255 THEN
                    v_errors := v_errors || jsonb_build_object('field', 'portfolio_items[' || v_idx || '].title', 'rule', 'length_2_255', 'message', 'Portfolio item title length must be between 2 and 255 characters.');
                END IF;

                IF v_item_obj->>'capability_id' IS NOT NULL AND TRIM(v_item_obj->>'capability_id') <> '' THEN
                    SELECT COUNT(*) INTO v_db_count FROM public.capabilities WHERE id::text = (v_item_obj->>'capability_id') OR code = (v_item_obj->>'capability_id');
                    IF v_db_count = 0 THEN
                        v_errors := v_errors || jsonb_build_object('field', 'portfolio_items[' || v_idx || '].capability_id', 'rule', 'canonical_id', 'message', 'Unknown capability_id in portfolio item: ' || (v_item_obj->>'capability_id'));
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END IF;

    IF jsonb_array_length(v_errors) > 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VALIDATION_FAILED',
            'message', 'Portfolio submission failed strict server-side validation.',
            'validation_errors', v_errors
        );
    END IF;

    -- 4. Idempotency & Correlation
    v_idempotency := TRIM(COALESCE(p_idempotency_key, ''));
    IF v_idempotency = '' THEN
        v_idempotency := 'partner_portfolio_idemp_' || gen_random_uuid()::text;
    END IF;

    v_corr_id := COALESCE(p_correlation_id, gen_random_uuid());

    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = 'partner' AND idempotency_key = v_idempotency;

    IF v_existing_item.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_existing_item.id,
                'correlation_id', v_existing_item.correlation_id,
                'review_status', v_existing_item.review_status,
                'application_status', v_existing_item.application_status,
                'publication_status', v_existing_item.publication_status,
                'created_at', v_existing_item.created_at
            )
        );
    END IF;

    -- 5. Create Editorial Work Item
    INSERT INTO public.editorial_work_items (
        correlation_id,
        scope_type,
        scope_id,
        entity_type,
        entity_id,
        operation,
        item_type,
        item_key,
        handler_key,
        handler_version,
        registry_version,
        minimum_engine_version,
        base_content_version,
        row_version,
        current_value,
        proposed_value,
        review_status,
        application_status,
        publication_status,
        priority,
        risk_level,
        effect_policy,
        submitted_by_type,
        submitted_by_id,
        idempotency_key,
        submitted_at,
        created_at,
        updated_at
    ) VALUES (
        v_corr_id,
        'partner',
        p_partner_id,
        'partner_portfolio',
        p_partner_id,
        'submit',
        'partner_portfolio',
        'partner_portfolio:' || p_partner_id,
        'partner.portfolio.submission',
        1,
        1,
        1,
        1,
        1,
        NULL,
        p_portfolio_data,
        'submitted',
        'not_applicable',
        'not_applicable',
        'standard',
        'standard',
        'no_side_effect',
        'partner',
        NULL,
        v_idempotency,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING * INTO v_result_item;

    -- 6. Create Immutable Portfolio Snapshot
    INSERT INTO public.partner_portfolio_snapshots (
        work_item_id,
        partner_id,
        portfolio_version,
        handler_key,
        handler_version,
        registry_version,
        minimum_engine_version,
        content_version,
        portfolio_data,
        validation_result,
        created_at
    ) VALUES (
        v_result_item.id,
        p_partner_id,
        1,
        'partner.portfolio.submission',
        1,
        1,
        1,
        1,
        p_portfolio_data,
        jsonb_build_object('valid', TRUE, 'validated_at', timezone('utc'::text, now())),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_snapshot_id;

    -- 7. Record Events in Ledger
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_result_item.id, 'portfolio.submitted', NULL, 'submitted',
        NULL, 'not_applicable', NULL, 'not_applicable',
        'partner', NULL, jsonb_build_object('partner_id', p_partner_id, 'snapshot_id', v_snapshot_id), v_corr_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_result_item.id, 'portfolio.validated', 'submitted', 'submitted',
        'not_applicable', 'not_applicable', 'not_applicable', 'not_applicable',
        'system', NULL, jsonb_build_object('partner_id', p_partner_id, 'validation_status', 'PASSED'), v_corr_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_result_item.id,
            'correlation_id', v_result_item.correlation_id,
            'handler_key', v_result_item.handler_key,
            'snapshot_id', v_snapshot_id,
            'review_status', v_result_item.review_status,
            'submitted_at', v_result_item.submitted_at
        )
    );
END;
$$;


-- 7.2 SERVER-AUTHORITATIVE REGISTERED MATCHING ENGINE RPC (DEFECT 1, 2, 6, 7, 8)
CREATE OR REPLACE FUNCTION public.execute_partner_matching_engine_secure(
    p_work_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot public.partner_portfolio_snapshots%ROWTYPE;
    v_rec RECORD;
    v_policy RECORD;
    v_matches_count INT := 0;
    
    -- Scoring state
    v_tax_score NUMERIC(5,2);
    v_exp_score NUMERIC(5,2);
    v_geo_score NUMERIC(5,2);
    v_lang_score NUMERIC(5,2);
    
    v_weighted_sum NUMERIC(10,4) := 0.00;
    v_total_weight NUMERIC(5,2) := 0.00;
    v_final_score NUMERIC(5,2) := 0.00;
    v_confidence NUMERIC(5,2) := 0.00;
    v_review_required BOOLEAN := false;
    
    v_explanations JSONB;
    v_warnings JSONB;
    v_module_scores JSONB;
    
    v_p_langs JSONB;
    v_p_areas JSONB;
    v_p_tax JSONB;
    v_p_items JSONB;

    v_rec_cap_count INT;
    v_rec_matching_caps INT;
    v_rec_service_area_uuid UUID;
    v_area_elem JSONB;
    v_geo_matched BOOLEAN;
    v_lang_elem JSONB;
    v_lang_matched BOOLEAN;
    v_db_count INT;
    v_idx INT;
BEGIN
    SELECT * INTO v_work_item FROM public.editorial_work_items WHERE id = p_work_item_id;
    IF v_work_item.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'WORK_ITEM_NOT_FOUND', 'message', 'Work item not found.');
    END IF;

    SELECT * INTO v_snapshot FROM public.partner_portfolio_snapshots WHERE work_item_id = p_work_item_id ORDER BY created_at DESC LIMIT 1;
    IF v_snapshot.id IS NULL THEN
        v_p_langs := COALESCE(v_work_item.proposed_value->'languages', '[]'::jsonb);
        v_p_areas := COALESCE(v_work_item.proposed_value->'service_areas', '[]'::jsonb);
        v_p_tax := COALESCE(v_work_item.proposed_value->'taxonomy', '[]'::jsonb);
        v_p_items := COALESCE(v_work_item.proposed_value->'portfolio_items', '[]'::jsonb);
    ELSE
        v_p_langs := COALESCE(v_snapshot.portfolio_data->'languages', '[]'::jsonb);
        v_p_areas := COALESCE(v_snapshot.portfolio_data->'service_areas', '[]'::jsonb);
        v_p_tax := COALESCE(v_snapshot.portfolio_data->'taxonomy', '[]'::jsonb);
        v_p_items := COALESCE(v_snapshot.portfolio_data->'portfolio_items', '[]'::jsonb);
    END IF;

    DELETE FROM public.partner_matching_results WHERE work_item_id = p_work_item_id AND is_manual_override = FALSE;

    -- Evaluate ONLY published recommendations using authoritative database reference tables
    FOR v_rec IN 
        SELECT id, source_id, title_en, service_area_id, is_published 
        FROM public.recommendations 
        WHERE is_published = TRUE
        LIMIT 100
    LOOP
        v_explanations := '[]'::jsonb;
        v_warnings := '[]'::jsonb;
        v_module_scores := '{}'::jsonb;
        v_weighted_sum := 0.00;
        v_total_weight := 0.00;
        v_review_required := false;

        -- Iterate through active registered policy modules (immutable policy_version = 1)
        FOR v_policy IN
            SELECT module_id, module_version, enabled, execution_priority, weight, required_inputs
            FROM public.partner_matching_module_policies
            WHERE policy_version = 1 AND enabled = true
            ORDER BY execution_priority ASC
        LOOP
            IF v_policy.module_id = 'taxonomy_alignment' THEN
                -- DEFECT 1 & 2: Match against recommendation_capabilities canonical table
                SELECT COUNT(*) INTO v_rec_cap_count
                FROM public.recommendation_capabilities rc
                WHERE rc.recommendation_id = v_rec.id AND rc.requirement_level = 'required';

                IF v_rec_cap_count = 0 THEN
                    v_tax_score := 0.00;
                    v_warnings := v_warnings || jsonb_build_array('Recommendation lacks canonical capability requirement identifiers in recommendation_capabilities.');
                    v_review_required := true;
                ELSE
                    SELECT COUNT(*) INTO v_rec_matching_caps
                    FROM public.recommendation_capabilities rc
                    JOIN public.capabilities c ON c.id = rc.capability_id
                    WHERE rc.recommendation_id = v_rec.id
                      AND (
                           v_p_tax ? c.id::text OR 
                           v_p_tax ? c.code
                      );

                    IF v_rec_matching_caps >= v_rec_cap_count THEN
                        v_tax_score := 100.00;
                        v_explanations := v_explanations || jsonb_build_array('Partner capabilities fully match required recommendation capability identifiers.');
                    ELSIF v_rec_matching_caps > 0 THEN
                        v_tax_score := ROUND((v_rec_matching_caps::numeric / v_rec_cap_count::numeric) * 100.00, 2);
                        v_explanations := v_explanations || jsonb_build_array('Partner capabilities partially match recommendation capability requirements.');
                    ELSE
                        v_tax_score := 0.00;
                        v_warnings := v_warnings || jsonb_build_array('Partner submitted taxonomy does not match required recommendation capabilities.');
                        v_review_required := true;
                    END IF;
                END IF;

                v_module_scores := jsonb_set(v_module_scores, '{taxonomy_alignment}', to_jsonb(v_tax_score));
                v_weighted_sum := v_weighted_sum + (v_tax_score * v_policy.weight);
                v_total_weight := v_total_weight + v_policy.weight;

            ELSIF v_policy.module_id = 'expertise_scope' THEN
                -- DEFECT 1 & 2: Match portfolio item capability_id against recommendation_capabilities
                IF jsonb_array_length(v_p_items) = 0 THEN
                    v_exp_score := 0.00;
                    v_warnings := v_warnings || jsonb_build_array('No validated portfolio items supplied for expertise verification.');
                    v_review_required := true;
                ELSE
                    SELECT COUNT(*) INTO v_rec_matching_caps
                    FROM jsonb_array_elements(v_p_items) item
                    JOIN public.capabilities c ON (c.id::text = (item->>'capability_id') OR c.code = (item->>'capability_id'))
                    JOIN public.recommendation_capabilities rc ON rc.capability_id = c.id
                    WHERE rc.recommendation_id = v_rec.id;

                    IF v_rec_matching_caps > 0 THEN
                        v_exp_score := 90.00;
                        v_explanations := v_explanations || jsonb_build_array('Portfolio items verified against authoritative recommendation capability requirements.');
                    ELSE
                        v_exp_score := 20.00;
                        v_warnings := v_warnings || jsonb_build_array('Portfolio item capability identifiers do not cover this recommendation.');
                        v_review_required := true;
                    END IF;
                END IF;

                v_module_scores := jsonb_set(v_module_scores, '{expertise_scope}', to_jsonb(v_exp_score));
                v_weighted_sum := v_weighted_sum + (v_exp_score * v_policy.weight);
                v_total_weight := v_total_weight + v_policy.weight;

            ELSIF v_policy.module_id = 'service_area_geography' THEN
                -- DEFECT 2 & 8: Authoritative service_area_id UUID matching without text geography
                v_rec_service_area_uuid := v_rec.service_area_id;

                IF v_rec_service_area_uuid IS NULL THEN
                    v_geo_score := 0.00;
                    v_warnings := v_warnings || jsonb_build_array('Recommendation lacks canonical service_area_id identifier.');
                    v_review_required := true;
                ELSE
                    v_geo_matched := FALSE;
                    FOR v_idx IN 0 .. (jsonb_array_length(v_p_areas) - 1) LOOP
                        v_area_elem := v_p_areas->v_idx;
                        SELECT COUNT(*) INTO v_db_count
                        FROM public.service_areas sa
                        WHERE sa.id = v_rec_service_area_uuid
                          AND (sa.id::text = (v_area_elem->>0) OR sa.name_en = (v_area_elem->>0) OR sa.parent_id::text = (v_area_elem->>0));

                        IF v_db_count > 0 THEN
                            v_geo_matched := TRUE;
                            EXIT;
                        END IF;
                    END LOOP;

                    IF v_geo_matched THEN
                        v_geo_score := 100.00;
                        v_explanations := v_explanations || jsonb_build_array('Partner service area matches canonical recommendation service_area_id.');
                    ELSE
                        v_geo_score := 0.00;
                        v_warnings := v_warnings || jsonb_build_array('Recommendation service_area_id is outside partner registered service areas.');
                        v_review_required := true;
                    END IF;
                END IF;

                v_module_scores := jsonb_set(v_module_scores, '{service_area_geography}', to_jsonb(v_geo_score));
                v_weighted_sum := v_weighted_sum + (v_geo_score * v_policy.weight);
                v_total_weight := v_total_weight + v_policy.weight;

            ELSIF v_policy.module_id = 'language_support' THEN
                -- DEFECT 2 & 8: Authoritative language validation against public.languages
                v_lang_matched := FALSE;
                FOR v_idx IN 0 .. (jsonb_array_length(v_p_langs) - 1) LOOP
                    v_lang_elem := v_p_langs->v_idx;
                    SELECT COUNT(*) INTO v_db_count
                    FROM public.languages l
                    WHERE l.id::text = (v_lang_elem->>0) OR l.code = (v_lang_elem->>0);

                    IF v_db_count > 0 THEN
                        v_lang_matched := TRUE;
                    END IF;
                END LOOP;

                IF v_lang_matched THEN
                    v_lang_score := 100.00;
                    v_explanations := v_explanations || jsonb_build_array('Partner language capabilities verified against canonical public.languages table.');
                ELSE
                    v_lang_score := 0.00;
                    v_warnings := v_warnings || jsonb_build_array('No verified canonical language support present in partner portfolio.');
                    v_review_required := true;
                END IF;

                v_module_scores := jsonb_set(v_module_scores, '{language_support}', to_jsonb(v_lang_score));
                v_weighted_sum := v_weighted_sum + (v_lang_score * v_policy.weight);
                v_total_weight := v_total_weight + v_policy.weight;

            ELSIF v_policy.module_id = 'availability_capacity' THEN
                -- DEFECT 7: Omitted due to missing source data -> mark warning & review_required
                v_warnings := v_warnings || jsonb_build_object('module_id', 'availability_capacity', 'warning', 'Authoritative availability source data missing; module omitted from automatic scoring.');
                v_review_required := true;
            END IF;
        END LOOP;

        IF v_total_weight > 0 THEN
            v_final_score := ROUND((v_weighted_sum / v_total_weight)::numeric, 2);
        ELSE
            v_final_score := 0.00;
        END IF;

        v_confidence := v_final_score;
        IF v_confidence < 75.00 OR jsonb_array_length(v_warnings) > 0 THEN
            v_review_required := true;
        END IF;

        INSERT INTO public.partner_matching_results (
            work_item_id,
            partner_id,
            recommendation_id,
            original_score,
            original_confidence,
            original_explanations,
            original_warnings,
            algorithm_version,
            policy_version,
            source_data_version,
            score,
            confidence,
            review_required,
            explanations,
            warnings,
            module_scores,
            is_manual_override,
            created_at,
            updated_at
        ) VALUES (
            p_work_item_id,
            v_work_item.scope_id,
            v_rec.source_id,
            v_final_score,
            v_confidence,
            v_explanations,
            v_warnings,
            'v1.2.0',
            1,
            jsonb_build_object('portfolio_version', COALESCE(v_snapshot.portfolio_version, 1), 'policy_version', 1),
            v_final_score,
            v_confidence,
            v_review_required,
            v_explanations,
            v_warnings,
            v_module_scores,
            FALSE,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );

        v_matches_count := v_matches_count + 1;
    END LOOP;

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'portfolio.matched', v_work_item.review_status, v_work_item.review_status,
        v_work_item.application_status, v_work_item.application_status,
        v_work_item.publication_status, v_work_item.publication_status,
        'system', NULL, jsonb_build_object('matches_generated', v_matches_count, 'algorithm_version', 'v1.2.0', 'policy_version', 1), v_work_item.correlation_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'work_item_id', p_work_item_id,
        'matches_generated', v_matches_count,
        'algorithm_version', 'v1.2.0',
        'policy_version', 1
    );
END;
$$;


-- 7.3 APPROVE PARTNER PORTFOLIO WORK ITEM RPC (DEFECT 5 & DEFECT 9 ATOMIC TRANSACTION)
CREATE OR REPLACE FUNCTION public.approve_partner_portfolio_work_item_secure(
    p_work_item_id UUID,
    p_reviewer_id UUID,
    p_reviewer_note TEXT DEFAULT NULL,
    p_expected_version INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_engine_flag TEXT;
    v_portfolio_flag TEXT;
    v_item public.editorial_work_items%ROWTYPE;
    v_match_res JSONB;
    v_pub_queue_id UUID;
    v_clean_note TEXT;
BEGIN
    -- 1. Check feature flags
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_portfolio_flag FROM public.system_settings WHERE key = 'partner_portfolio_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_portfolio_flag IS NULL OR LOWER(TRIM(v_portfolio_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Partner Portfolio Workflow is currently disabled.'
        );
    END IF;

    -- 2. Lock Row
    SELECT * INTO v_item FROM public.editorial_work_items WHERE id = p_work_item_id FOR UPDATE;

    IF v_item.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'WORK_ITEM_NOT_FOUND', 'message', 'Work item not found.');
    END IF;

    -- DEFECT 5: Check optimistic concurrency version against mutable row_version (not handler_version)
    IF p_expected_version IS NOT NULL AND v_item.row_version <> p_expected_version THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'VERSION_CONFLICT', 'message', 'Version conflict: expected row_version ' || p_expected_version || ' but current is ' || v_item.row_version);
    END IF;

    -- Idempotent approval check
    IF v_item.review_status = 'approved' THEN
        SELECT id INTO v_pub_queue_id FROM public.portfolio_publication_queue WHERE work_item_id = p_work_item_id ORDER BY created_at DESC LIMIT 1;
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item_id', p_work_item_id,
            'review_status', 'approved',
            'publication_queue_id', v_pub_queue_id
        );
    END IF;

    IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Work item cannot be approved from current state ' || v_item.review_status);
    END IF;

    v_clean_note := TRIM(COALESCE(p_reviewer_note, ''));

    -- DEFECT 5: Increment mutable row_version
    UPDATE public.editorial_work_items
    SET
        review_status = 'approved',
        publication_status = 'draft_package',
        row_version = v_item.row_version + 1,
        reviewed_by = p_reviewer_id,
        reviewed_at = timezone('utc'::text, now()),
        reviewer_note = CASE WHEN v_clean_note <> '' THEN v_clean_note ELSE reviewer_note END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_work_item_id;

    -- 4. Record Approved Event
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'portfolio.approved', v_item.review_status, 'approved',
        v_item.application_status, v_item.application_status,
        v_item.publication_status, 'draft_package',
        'studio', p_reviewer_id, jsonb_build_object('action', 'approve', 'row_version', v_item.row_version + 1), v_item.correlation_id, timezone('utc'::text, now())
    );

    -- 5. DEFECT 9: Atomic matching engine execution (raises exception on failure)
    v_match_res := public.execute_partner_matching_engine_secure(p_work_item_id);

    IF (v_match_res->>'success')::boolean IS NOT TRUE THEN
        RAISE EXCEPTION 'Partner matching engine failed: %', COALESCE(v_match_res->>'message', 'Unknown matching error');
    END IF;

    -- 6. Enqueue Inert Downstream Queue Record
    INSERT INTO public.portfolio_publication_queue (
        work_item_id,
        partner_id,
        status,
        index_refresh_status,
        package_build_status,
        created_at,
        updated_at
    ) VALUES (
        p_work_item_id,
        v_item.scope_id,
        'queued',
        'pending',
        'pending',
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_pub_queue_id;

    -- 7. Record Domain Events
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'portfolio.publication_queued', 'approved', 'approved',
        v_item.application_status, v_item.application_status,
        'draft_package', 'scheduled',
        'system', NULL, jsonb_build_object('publication_queue_id', v_pub_queue_id), v_item.correlation_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'portfolio.package_queued', 'approved', 'approved',
        v_item.application_status, v_item.application_status,
        'scheduled', 'scheduled',
        'system', NULL, jsonb_build_object('destination_package', 'SERBIA_V2'), v_item.correlation_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'portfolio.index_refresh_requested', 'approved', 'approved',
        v_item.application_status, v_item.application_status,
        'scheduled', 'scheduled',
        'system', NULL, jsonb_build_object('target_index', 'partner_search_v2'), v_item.correlation_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'work_item_id', p_work_item_id,
        'review_status', 'approved',
        'row_version', v_item.row_version + 1,
        'matches_generated', COALESCE((v_match_res->>'matches_generated')::int, 0),
        'publication_queue_id', v_pub_queue_id
    );
END;
$$;


-- 7.4 IMMUTABLE MANUAL OVERRIDE PARTNER MATCHING RPC
CREATE OR REPLACE FUNCTION public.override_partner_matching_secure(
    p_matching_id UUID,
    p_reviewer_id UUID,
    p_new_score NUMERIC(5,2),
    p_new_confidence NUMERIC(5,2),
    p_override_reason TEXT,
    p_override_decision VARCHAR(50) DEFAULT 'adjusted',
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_engine_flag TEXT;
    v_portfolio_flag TEXT;
    v_match public.partner_matching_results%ROWTYPE;
    v_clean_reason TEXT;
    v_override_id UUID;
BEGIN
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_portfolio_flag FROM public.system_settings WHERE key = 'partner_portfolio_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_portfolio_flag IS NULL OR LOWER(TRIM(v_portfolio_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Partner Portfolio Workflow is currently disabled.'
        );
    END IF;

    IF p_reviewer_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized reviewer identity is required.');
    END IF;

    v_clean_reason := TRIM(COALESCE(p_override_reason, ''));
    IF v_clean_reason = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Mandatory override reason is required.');
    END IF;

    SELECT * INTO v_match FROM public.partner_matching_results WHERE id = p_matching_id FOR UPDATE;
    IF v_match.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MATCH_NOT_FOUND', 'message', 'Matching record not found.');
    END IF;

    -- Create immutable override record in partner_matching_overrides table
    INSERT INTO public.partner_matching_overrides (
        matching_result_id,
        work_item_id,
        override_by,
        override_decision,
        original_score,
        original_confidence,
        new_score,
        new_confidence,
        override_reason,
        expires_at,
        created_at
    ) VALUES (
        p_matching_id,
        v_match.work_item_id,
        p_reviewer_id,
        COALESCE(p_override_decision, 'adjusted'),
        v_match.original_score,
        v_match.original_confidence,
        p_new_score,
        p_new_confidence,
        v_clean_reason,
        p_expires_at,
        timezone('utc'::text, now())
    ) RETURNING id INTO v_override_id;

    -- Update current result view (preserving original automated score/evidence fields completely untouched)
    UPDATE public.partner_matching_results
    SET
        score = p_new_score,
        confidence = p_new_confidence,
        review_required = FALSE,
        is_manual_override = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_matching_id;

    -- Emit immutable audit log event
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    )
    SELECT
        v_match.work_item_id,
        'portfolio.match_overridden',
        w.review_status,
        w.review_status,
        w.application_status,
        w.application_status,
        w.publication_status,
        w.publication_status,
        'studio',
        p_reviewer_id,
        jsonb_build_object(
            'matching_id', p_matching_id,
            'override_id', v_override_id,
            'original_score', v_match.original_score,
            'new_score', p_new_score,
            'decision', COALESCE(p_override_decision, 'adjusted'),
            'reason', v_clean_reason
        ),
        w.correlation_id,
        timezone('utc'::text, now())
    FROM public.editorial_work_items w
    WHERE w.id = v_match.work_item_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'matching_id', p_matching_id,
        'override_id', v_override_id,
        'original_score', v_match.original_score,
        'new_score', p_new_score,
        'override_reason', v_clean_reason
    );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. SERVICE ROLE GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.submit_partner_portfolio_work_item_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_partner_matching_engine_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_partner_portfolio_work_item_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.override_partner_matching_secure TO service_role;
