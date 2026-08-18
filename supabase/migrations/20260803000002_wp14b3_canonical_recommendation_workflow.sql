-- IDEMO Canonical Recommendation Workflow Migration
-- Work Package: WP-14B3 Canonical Recommendation Workflow (Gate 4 Final Correction)
-- Migration File: 20260803000002_wp14b3_canonical_recommendation_workflow.sql
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.3.0

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FEATURE FLAG INITIALIZATION (IN public.system_settings)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES 
    ('recommendation_workflow_enabled', 'false', 'Server-authoritative feature flag for WP-14B3 Canonical Recommendation Workflow', timezone('utc'::text, now()))
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. IMMUTABLE RECOMMENDATION WORKFLOW SNAPSHOTS TABLE & TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recommendation_workflow_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    destination_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE RESTRICT,
    recommendation_id UUID NULL,
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('recommendation.create', 'recommendation.amend', 'recommendation.retire')),
    schema_version INT NOT NULL DEFAULT 1 CHECK (schema_version > 0),
    handler_version INT NOT NULL DEFAULT 1 CHECK (handler_version > 0),
    registry_version INT NOT NULL DEFAULT 1 CHECK (registry_version > 0),
    base_content_version INT NOT NULL DEFAULT 1 CHECK (base_content_version > 0),
    recommendation_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    translations_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    category_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    expertise_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_by UUID NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendation_workflow_snapshots_work_item 
ON public.recommendation_workflow_snapshots (work_item_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_workflow_snapshots_rec 
ON public.recommendation_workflow_snapshots (recommendation_id, submitted_at DESC);

-- Database-level immutability protection for recommendation_workflow_snapshots
CREATE OR REPLACE FUNCTION public.block_recommendation_snapshot_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Recommendation workflow snapshots are immutable. UPDATE and DELETE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS secure_recommendation_snapshots_immutability ON public.recommendation_workflow_snapshots;
CREATE TRIGGER secure_recommendation_snapshots_immutability
BEFORE UPDATE OR DELETE ON public.recommendation_workflow_snapshots
FOR EACH ROW EXECUTE FUNCTION public.block_recommendation_snapshot_mutation();

ALTER TABLE public.recommendation_workflow_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_workflow_snapshots FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INERT RECOMMENDATION PACKAGE CANDIDATES QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recommendation_package_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    destination_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE RESTRICT,
    operation VARCHAR(50) NOT NULL,
    recommendation_id UUID NOT NULL,
    snapshot_id UUID NOT NULL REFERENCES public.recommendation_workflow_snapshots(id) ON DELETE RESTRICT,
    package_impact_type VARCHAR(50) NOT NULL DEFAULT 'recommendation_update' CHECK (package_impact_type IN ('recommendation_create', 'recommendation_update', 'recommendation_retire')),
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    correlation_id UUID NOT NULL,
    content_version INT NOT NULL DEFAULT 1,
    minimum_app_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    queued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_package_candidates_work_item 
ON public.recommendation_package_candidates (work_item_id);

ALTER TABLE public.recommendation_package_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_package_candidates FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INERT REMATCHING-REQUEST QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recommendation_rematching_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    destination_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE RESTRICT,
    recommendation_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    reason TEXT NOT NULL DEFAULT 'recommendation_workflow_approval',
    source_content_version INT NOT NULL DEFAULT 1,
    correlation_id UUID NOT NULL,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_rematching_requests_work_item 
ON public.recommendation_rematching_requests (work_item_id);

ALTER TABLE public.recommendation_rematching_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_rematching_requests FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RECOMMENDATION PAYLOAD VALIDATION HELPER FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_recommendation_payload_secure(
    p_operation TEXT,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_key TEXT;
    v_allowed_keys TEXT[] := ARRAY[
        'destination_id', 'title', 'title_en', 'title_sr', 'title_de', 'title_ru', 'title_es', 'title_zh',
        'category', 'categories',
        'short_description', 'short_description_en', 'short_description_sr', 'short_description_de', 'short_description_ru', 'short_description_es', 'short_description_zh',
        'long_description', 'long_description_en', 'long_description_sr', 'long_description_de', 'long_description_ru', 'long_description_es', 'long_description_zh',
        'location', 'location_en', 'location_sr', 'location_de', 'location_ru', 'location_es', 'location_zh',
        'duration', 'travel_time', 'travel_time_minutes', 'estimated_cost', 'preferred_transport',
        'latitude', 'longitude', 'best_time_to_visit_en', 'best_time_to_visit_sr',
        'insider_tip_en', 'insider_tip_sr', 'moods', 'ranking_score',
        'image_url', 'image_references', 'translations', 'expertise_ids', 'capability_ids',
        'provenance', 'retirement_reason', 'practical_info'
    ];
    v_title TEXT;
    v_short_desc TEXT;
    v_long_desc TEXT;
    v_tip TEXT;
    v_lat NUMERIC;
    v_lon NUMERIC;
    v_rank NUMERIC;
    v_trans_lang TEXT;
    v_allowed_langs TEXT[] := ARRAY['en', 'sr', 'de', 'ru', 'es', 'zh'];
    v_img_url TEXT;
    v_payload_str TEXT;
    v_item_count INT;
    v_pinfo_key TEXT;
    v_allowed_pinfo_keys TEXT[] := ARRAY['opening_hours', 'contact_phone', 'contact_email', 'website', 'admission_fee'];
BEGIN
    IF p_payload IS NULL OR p_payload = '{}'::jsonb THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Payload cannot be empty.');
    END IF;

    -- Payload Size Limit (500KB = 524,288 bytes)
    IF pg_column_size(p_payload) > 524288 THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Payload size exceeds maximum limit of 500KB.');
    END IF;

    v_payload_str := p_payload::text;

    -- Security check: credentials, PINs, tokens, scripts, HTML injections
    IF v_payload_str ILIKE '%<script%' OR v_payload_str ILIKE '%javascript:%' OR 
       v_payload_str ILIKE '%Bearer %' OR v_payload_str ILIKE '%sk_live_%' OR 
       v_payload_str ILIKE '%AIzaSy%' OR v_payload_str ILIKE '%BEGIN PRIVATE KEY%' THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Payload contains forbidden credentials, tokens, or script injections.');
    END IF;

    -- Top-level Whitelist Check
    FOR v_key IN SELECT jsonb_object_keys(p_payload) LOOP
        IF NOT (v_key = ANY(v_allowed_keys)) THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Unsupported top-level field rejected: ' || v_key);
        END IF;
    END LOOP;

    -- Validate Title & String Length Limits
    IF p_operation = 'recommendation.create' THEN
        v_title := COALESCE(p_payload->>'title', p_payload->>'title_en', p_payload->>'title_sr');
        IF v_title IS NULL OR LENGTH(TRIM(v_title)) = 0 THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Title is mandatory for recommendation creation.');
        END IF;
    END IF;

    IF (p_payload->>'title') IS NOT NULL AND LENGTH(p_payload->>'title') > 255 THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Title exceeds maximum length of 255 characters.');
    END IF;

    IF (p_payload->>'short_description') IS NOT NULL AND LENGTH(p_payload->>'short_description') > 500 THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Short description exceeds maximum length of 500 characters.');
    END IF;

    IF (p_payload->>'long_description') IS NOT NULL AND LENGTH(p_payload->>'long_description') > 5000 THEN
        RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Long description exceeds maximum length of 5000 characters.');
    END IF;

    -- Validate Array Lengths
    IF jsonb_typeof(p_payload->'categories') = 'array' THEN
        v_item_count := jsonb_array_length(p_payload->'categories');
        IF v_item_count > 10 THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Categories array exceeds maximum limit of 10 items.');
        END IF;
    END IF;

    IF jsonb_typeof(p_payload->'expertise_ids') = 'array' THEN
        v_item_count := jsonb_array_length(p_payload->'expertise_ids');
        IF v_item_count > 20 THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Expertise array exceeds maximum limit of 20 items.');
        END IF;
    END IF;

    IF jsonb_typeof(p_payload->'image_references') = 'array' THEN
        v_item_count := jsonb_array_length(p_payload->'image_references');
        IF v_item_count > 10 THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Image references array exceeds maximum limit of 10 items.');
        END IF;
    END IF;

    -- Validate Coordinates Range
    IF (p_payload->>'latitude') IS NOT NULL THEN
        BEGIN
            v_lat := (p_payload->>'latitude')::NUMERIC;
            IF v_lat < -90.0 OR v_lat > 90.0 THEN
                RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Latitude out of valid range [-90, 90].');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Invalid latitude numeric format.');
        END;
    END IF;

    IF (p_payload->>'longitude') IS NOT NULL THEN
        BEGIN
            v_lon := (p_payload->>'longitude')::NUMERIC;
            IF v_lon < -180.0 OR v_lon > 180.0 THEN
                RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Longitude out of valid range [-180, 180].');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Invalid longitude numeric format.');
        END;
    END IF;

    -- Validate Ranking Score Range
    IF (p_payload->>'ranking_score') IS NOT NULL THEN
        BEGIN
            v_rank := (p_payload->>'ranking_score')::NUMERIC;
            IF v_rank < 0.0 OR v_rank > 100.0 THEN
                RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Ranking score out of valid range [0, 100].');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Invalid ranking score numeric format.');
        END;
    END IF;

    -- Validate Canonical Languages if translations object provided
    IF jsonb_typeof(p_payload->'translations') = 'object' THEN
        FOR v_trans_lang IN SELECT jsonb_object_keys(p_payload->'translations') LOOP
            IF NOT (v_trans_lang = ANY(v_allowed_langs)) THEN
                RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Unsupported translation language key: ' || v_trans_lang);
            END IF;
        END LOOP;
    END IF;

    -- Validate Practical Info Schema if object provided
    IF jsonb_typeof(p_payload->'practical_info') = 'object' THEN
        FOR v_pinfo_key IN SELECT jsonb_object_keys(p_payload->'practical_info') LOOP
            IF NOT (v_pinfo_key = ANY(v_allowed_pinfo_keys)) THEN
                RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Unsupported practical_info field rejected: ' || v_pinfo_key);
            END IF;
        END LOOP;
    END IF;

    -- Validate Image Security & Signed-URL Rejection
    v_img_url := COALESCE(p_payload->>'image_url', '');
    IF v_img_url <> '' THEN
        IF v_img_url ILIKE '%<script%' OR v_img_url ILIKE '%javascript:%' OR 
           v_img_url ILIKE '%token=%' OR v_img_url ILIKE '%Signature=%' OR v_img_url ILIKE '%X-Amz-Signature=%' THEN
            RETURN jsonb_build_object('valid', FALSE, 'error_code', 'VALIDATION_FAILED', 'message', 'Invalid, unsafe, or signed image URL rejected.');
        END IF;
    END IF;

    RETURN jsonb_build_object('valid', TRUE);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TYPED SUBMISSION RPC: RECOMMENDATION CREATE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_recommendation_create_secure(
    p_author_id UUID,
    p_destination_id UUID,
    p_proposed_recommendation JSONB DEFAULT '{}'::jsonb,
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
    v_rec_flag TEXT;
    v_corr_id UUID;
    v_idempotency TEXT;
    v_validation JSONB;
    v_proposed_uuid UUID;
    v_proposed_id TEXT;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot_id UUID;
BEGIN
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_rec_flag FROM public.system_settings WHERE key = 'recommendation_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_rec_flag IS NULL OR LOWER(TRIM(v_rec_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Canonical Recommendation Workflow is currently disabled.'
        );
    END IF;

    IF p_author_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized author identity is required.');
    END IF;

    -- Destination_id is MANDATORY for recommendation creation
    IF p_destination_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Mandatory destination_id UUID is required for recommendation creation.');
    END IF;

    -- Validate Destination against authoritative service_areas UUID primary key ONLY
    IF NOT EXISTS (
        SELECT 1 FROM public.service_areas WHERE id = p_destination_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_DESTINATION', 'message', 'Unknown or invalid destination_id UUID: ' || p_destination_id::text);
    END IF;

    -- Server payload validation
    v_validation := public.validate_recommendation_payload_secure('recommendation.create', p_proposed_recommendation);
    IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', COALESCE(v_validation->>'error_code', 'VALIDATION_FAILED'),
            'message', COALESCE(v_validation->>'message', 'Recommendation payload validation failed.')
        );
    END IF;

    v_corr_id := COALESCE(p_correlation_id, gen_random_uuid());
    v_idempotency := TRIM(COALESCE(p_idempotency_key, 'rec_create_' || encode(sha256(p_proposed_recommendation::text::bytea), 'hex')));

    -- Idempotency check
    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = 'studio' AND idempotency_key = v_idempotency;

    IF v_existing_item.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_existing_item.id,
                'correlation_id', v_existing_item.correlation_id,
                'handler_key', v_existing_item.handler_key,
                'review_status', v_existing_item.review_status,
                'application_status', v_existing_item.application_status,
                'publication_status', v_existing_item.publication_status,
                'submitted_at', v_existing_item.submitted_at,
                'created_at', v_existing_item.created_at
            )
        );
    END IF;

    -- Canonical Recommendation Identity (UUID)
    v_proposed_uuid := gen_random_uuid();
    v_proposed_id := v_proposed_uuid::text;

    -- Insert Work Item
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
        'destination',
        p_destination_id::text,
        'recommendation',
        v_proposed_id,
        'recommendation.create',
        'recommendation',
        'recommendation:' || v_proposed_id,
        'recommendation.create',
        1, 1, 1, 1,
        NULL,
        p_proposed_recommendation,
        'submitted',
        'not_applicable',
        'not_applicable',
        'standard',
        'standard',
        'no_side_effect',
        'studio',
        p_author_id,
        v_idempotency,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) RETURNING * INTO v_work_item;

    -- Insert Immutable Snapshot with Canonical UUID
    INSERT INTO public.recommendation_workflow_snapshots (
        work_item_id,
        destination_id,
        recommendation_id,
        operation,
        schema_version,
        handler_version,
        registry_version,
        base_content_version,
        recommendation_payload,
        translations_payload,
        category_references,
        expertise_references,
        image_references,
        provenance_metadata,
        submitted_at,
        submitted_by
    ) VALUES (
        v_work_item.id,
        p_destination_id,
        v_proposed_uuid,
        'recommendation.create',
        1, 1, 1, 1,
        p_proposed_recommendation,
        COALESCE(p_proposed_recommendation->'translations', '{}'::jsonb),
        COALESCE(p_proposed_recommendation->'categories', '[]'::jsonb),
        COALESCE(p_proposed_recommendation->'expertise_ids', '[]'::jsonb),
        COALESCE(p_proposed_recommendation->'image_references', '[]'::jsonb),
        COALESCE(p_proposed_recommendation->'provenance', '{}'::jsonb),
        timezone('utc'::text, now()),
        p_author_id
    ) RETURNING id INTO v_snapshot_id;

    -- Record Immutable Events
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.submitted', NULL, 'submitted',
        NULL, 'not_applicable', NULL, 'not_applicable',
        'studio', p_author_id, jsonb_build_object('operation', 'recommendation.create', 'recommendation_id', v_proposed_id, 'destination_id', p_destination_id::text), v_corr_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.validated', 'submitted', 'submitted',
        'not_applicable', 'not_applicable', 'not_applicable', 'not_applicable',
        'system', NULL, jsonb_build_object('validation', v_validation), v_corr_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_work_item.id,
            'correlation_id', v_work_item.correlation_id,
            'recommendation_id', v_proposed_id,
            'snapshot_id', v_snapshot_id,
            'handler_key', v_work_item.handler_key,
            'review_status', v_work_item.review_status,
            'application_status', v_work_item.application_status,
            'publication_status', v_work_item.publication_status,
            'submitted_at', v_work_item.submitted_at,
            'created_at', v_work_item.created_at
        )
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TYPED SUBMISSION RPC: RECOMMENDATION AMEND
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_recommendation_amend_secure(
    p_author_id UUID,
    p_recommendation_id UUID,
    p_proposed_changes JSONB DEFAULT '{}'::jsonb,
    p_base_content_version INT DEFAULT 1,
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
    v_rec_flag TEXT;
    v_corr_id UUID;
    v_idempotency TEXT;
    v_validation JSONB;
    v_rec_row RECORD;
    v_derived_dest_id UUID;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot_id UUID;
    v_current_json JSONB;
BEGIN
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_rec_flag FROM public.system_settings WHERE key = 'recommendation_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_rec_flag IS NULL OR LOWER(TRIM(v_rec_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Canonical Recommendation Workflow is currently disabled.'
        );
    END IF;

    IF p_author_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized author identity is required.');
    END IF;

    IF p_recommendation_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Canonical recommendation UUID is required for amendment.');
    END IF;

    -- Canonical lookup using UUID primary key ONLY
    SELECT * INTO v_rec_row
    FROM public.recommendations
    WHERE id = p_recommendation_id;

    IF v_rec_row.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'RECOMMENDATION_NOT_FOUND', 'message', 'Authoritative recommendation UUID not found: ' || p_recommendation_id::text);
    END IF;

    -- Derive destination exclusively from service_area_id
    v_derived_dest_id := v_rec_row.service_area_id;
    IF v_derived_dest_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'DESTINATION_NOT_ASSIGNED', 'message', 'Authoritative recommendation lacks a canonical service_area_id assignment: ' || p_recommendation_id::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.service_areas WHERE id = v_derived_dest_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_DESTINATION', 'message', 'Recommendation references an invalid service_area_id UUID: ' || v_derived_dest_id::text);
    END IF;

    v_current_json := to_jsonb(v_rec_row);

    -- Validate proposed changes
    v_validation := public.validate_recommendation_payload_secure('recommendation.amend', p_proposed_changes);
    IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', COALESCE(v_validation->>'error_code', 'VALIDATION_FAILED'),
            'message', COALESCE(v_validation->>'message', 'Recommendation amendment payload validation failed.')
        );
    END IF;

    v_corr_id := COALESCE(p_correlation_id, gen_random_uuid());
    v_idempotency := TRIM(COALESCE(p_idempotency_key, 'rec_amend_' || p_recommendation_id::text || '_' || encode(sha256(p_proposed_changes::text::bytea), 'hex')));

    -- Idempotency check
    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = 'studio' AND idempotency_key = v_idempotency;

    IF v_existing_item.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_existing_item.id,
                'correlation_id', v_existing_item.correlation_id,
                'handler_key', v_existing_item.handler_key,
                'review_status', v_existing_item.review_status,
                'application_status', v_existing_item.application_status,
                'publication_status', v_existing_item.publication_status,
                'submitted_at', v_existing_item.submitted_at,
                'created_at', v_existing_item.created_at
            )
        );
    END IF;

    -- Insert Work Item
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
        'destination',
        v_derived_dest_id::text,
        'recommendation',
        p_recommendation_id::text,
        'recommendation.amend',
        'recommendation',
        'recommendation:' || p_recommendation_id::text,
        'recommendation.amend',
        1, 1, 1,
        COALESCE(p_base_content_version, 1),
        v_current_json,
        p_proposed_changes,
        'submitted',
        'not_applicable',
        'not_applicable',
        'standard',
        'standard',
        'no_side_effect',
        'studio',
        p_author_id,
        v_idempotency,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) RETURNING * INTO v_work_item;

    -- Insert Snapshot
    INSERT INTO public.recommendation_workflow_snapshots (
        work_item_id,
        destination_id,
        recommendation_id,
        operation,
        schema_version,
        handler_version,
        registry_version,
        base_content_version,
        recommendation_payload,
        translations_payload,
        category_references,
        expertise_references,
        image_references,
        provenance_metadata,
        submitted_at,
        submitted_by
    ) VALUES (
        v_work_item.id,
        v_derived_dest_id,
        p_recommendation_id,
        'recommendation.amend',
        1, 1, 1,
        COALESCE(p_base_content_version, 1),
        p_proposed_changes,
        COALESCE(p_proposed_changes->'translations', '{}'::jsonb),
        COALESCE(p_proposed_changes->'categories', '[]'::jsonb),
        COALESCE(p_proposed_changes->'expertise_ids', '[]'::jsonb),
        COALESCE(p_proposed_changes->'image_references', '[]'::jsonb),
        COALESCE(p_proposed_changes->'provenance', '{}'::jsonb),
        timezone('utc'::text, now()),
        p_author_id
    ) RETURNING id INTO v_snapshot_id;

    -- Record Events
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.amendment_submitted', NULL, 'submitted',
        NULL, 'not_applicable', NULL, 'not_applicable',
        'studio', p_author_id, jsonb_build_object('operation', 'recommendation.amend', 'recommendation_id', p_recommendation_id::text, 'destination_id', v_derived_dest_id::text), v_corr_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.validated', 'submitted', 'submitted',
        'not_applicable', 'not_applicable', 'not_applicable', 'not_applicable',
        'system', NULL, jsonb_build_object('validation', v_validation), v_corr_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_work_item.id,
            'correlation_id', v_work_item.correlation_id,
            'recommendation_id', p_recommendation_id::text,
            'snapshot_id', v_snapshot_id,
            'handler_key', v_work_item.handler_key,
            'review_status', v_work_item.review_status,
            'application_status', v_work_item.application_status,
            'publication_status', v_work_item.publication_status,
            'submitted_at', v_work_item.submitted_at,
            'created_at', v_work_item.created_at
        )
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TYPED SUBMISSION RPC: RECOMMENDATION RETIRE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_recommendation_retire_secure(
    p_author_id UUID,
    p_recommendation_id UUID,
    p_retirement_reason TEXT,
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
    v_rec_flag TEXT;
    v_corr_id UUID;
    v_idempotency TEXT;
    v_clean_reason TEXT;
    v_rec_row RECORD;
    v_derived_dest_id UUID;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot_id UUID;
    v_current_json JSONB;
BEGIN
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_rec_flag FROM public.system_settings WHERE key = 'recommendation_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_rec_flag IS NULL OR LOWER(TRIM(v_rec_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Canonical Recommendation Workflow is currently disabled.'
        );
    END IF;

    IF p_author_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized author identity is required.');
    END IF;

    IF p_recommendation_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Canonical recommendation UUID is required for retirement.');
    END IF;

    v_clean_reason := TRIM(COALESCE(p_retirement_reason, ''));
    IF v_clean_reason = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Mandatory non-empty retirement reason is required.');
    END IF;

    -- Canonical lookup using UUID primary key ONLY
    SELECT * INTO v_rec_row
    FROM public.recommendations
    WHERE id = p_recommendation_id;

    IF v_rec_row.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'RECOMMENDATION_NOT_FOUND', 'message', 'Authoritative recommendation UUID not found: ' || p_recommendation_id::text);
    END IF;

    -- Derive destination exclusively from service_area_id
    v_derived_dest_id := v_rec_row.service_area_id;
    IF v_derived_dest_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'DESTINATION_NOT_ASSIGNED', 'message', 'Authoritative recommendation lacks a canonical service_area_id assignment: ' || p_recommendation_id::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.service_areas WHERE id = v_derived_dest_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_DESTINATION', 'message', 'Recommendation references an invalid service_area_id UUID: ' || v_derived_dest_id::text);
    END IF;

    v_current_json := to_jsonb(v_rec_row);

    v_corr_id := COALESCE(p_correlation_id, gen_random_uuid());
    v_idempotency := TRIM(COALESCE(p_idempotency_key, 'rec_retire_' || p_recommendation_id::text || '_' || encode(sha256(v_clean_reason::bytea), 'hex')));

    -- Idempotency check
    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = 'studio' AND idempotency_key = v_idempotency;

    IF v_existing_item.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_existing_item.id,
                'correlation_id', v_existing_item.correlation_id,
                'handler_key', v_existing_item.handler_key,
                'review_status', v_existing_item.review_status,
                'application_status', v_existing_item.application_status,
                'publication_status', v_existing_item.publication_status,
                'submitted_at', v_existing_item.submitted_at,
                'created_at', v_existing_item.created_at
            )
        );
    END IF;

    -- Insert Work Item
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
        'destination',
        v_derived_dest_id::text,
        'recommendation',
        p_recommendation_id::text,
        'recommendation.retire',
        'recommendation',
        'recommendation:' || p_recommendation_id::text,
        'recommendation.retire',
        1, 1, 1, 1,
        v_current_json,
        jsonb_build_object('retirement_reason', v_clean_reason),
        'submitted',
        'not_applicable',
        'not_applicable',
        'standard',
        'high',
        'no_side_effect',
        'studio',
        p_author_id,
        v_idempotency,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) RETURNING * INTO v_work_item;

    -- Insert Snapshot
    INSERT INTO public.recommendation_workflow_snapshots (
        work_item_id,
        destination_id,
        recommendation_id,
        operation,
        schema_version,
        handler_version,
        registry_version,
        base_content_version,
        recommendation_payload,
        translations_payload,
        category_references,
        expertise_references,
        image_references,
        provenance_metadata,
        submitted_at,
        submitted_by
    ) VALUES (
        v_work_item.id,
        v_derived_dest_id,
        p_recommendation_id,
        'recommendation.retire',
        1, 1, 1, 1,
        jsonb_build_object('retirement_reason', v_clean_reason),
        '{}'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        timezone('utc'::text, now()),
        p_author_id
    ) RETURNING id INTO v_snapshot_id;

    -- Record Events
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.retirement_submitted', NULL, 'submitted',
        NULL, 'not_applicable', NULL, 'not_applicable',
        'studio', p_author_id, jsonb_build_object('operation', 'recommendation.retire', 'recommendation_id', p_recommendation_id::text, 'reason', v_clean_reason, 'destination_id', v_derived_dest_id::text), v_corr_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.validated', 'submitted', 'submitted',
        'not_applicable', 'not_applicable', 'not_applicable', 'not_applicable',
        'system', NULL, jsonb_build_object('validation', jsonb_build_object('valid', TRUE)), v_corr_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_work_item.id,
            'correlation_id', v_work_item.correlation_id,
            'recommendation_id', p_recommendation_id::text,
            'snapshot_id', v_snapshot_id,
            'handler_key', v_work_item.handler_key,
            'review_status', v_work_item.review_status,
            'application_status', v_work_item.application_status,
            'publication_status', v_work_item.publication_status,
            'submitted_at', v_work_item.submitted_at,
            'created_at', v_work_item.created_at
        )
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RECOMMENDATION APPROVAL RPC WITH ATOMIC REVALIDATION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_recommendation_work_item_secure(
    p_work_item_id UUID,
    p_reviewer_id UUID,
    p_expected_version INT,
    p_reviewer_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_engine_flag TEXT;
    v_rec_flag TEXT;
    v_item public.editorial_work_items%ROWTYPE;
    v_snapshot public.recommendation_workflow_snapshots%ROWTYPE;
    v_clean_note TEXT;
    v_candidate_id UUID;
    v_rematching_id UUID;
    v_impact_type TEXT;
    v_rec_row RECORD;
    v_translations JSONB;
    v_required_langs TEXT[] := ARRAY['en', 'sr', 'de', 'ru', 'es', 'zh'];
    v_lang TEXT;
    v_has_lang BOOLEAN;
BEGIN
    -- DEFECT 6: ATOMIC APPROVAL-TIME REVALIDATION — STEP 1: Feature Flags
    SELECT value INTO v_engine_flag FROM public.system_settings WHERE key = 'editorial_workflow_engine_enabled';
    SELECT value INTO v_rec_flag FROM public.system_settings WHERE key = 'recommendation_workflow_enabled';

    IF v_engine_flag IS NULL OR LOWER(TRIM(v_engine_flag)) <> 'true' OR
       v_rec_flag IS NULL OR LOWER(TRIM(v_rec_flag)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Canonical Recommendation Workflow is currently disabled.'
        );
    END IF;

    IF p_reviewer_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized reviewer identity is required.');
    END IF;

    -- DEFECT 3: p_expected_version is MANDATORY for concurrency control
    IF p_expected_version IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_REQUEST',
            'message', 'p_expected_version is mandatory for administrative approval concurrency control.'
        );
    END IF;

    -- Lock Work Item Row
    SELECT * INTO v_item
    FROM public.editorial_work_items
    WHERE id = p_work_item_id
    FOR UPDATE;

    IF v_item.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'WORK_ITEM_NOT_FOUND', 'message', 'Workflow item not found.');
    END IF;

    -- Idempotent check if already approved
    IF v_item.review_status = 'approved' THEN
        SELECT id INTO v_candidate_id FROM public.recommendation_package_candidates WHERE work_item_id = p_work_item_id;
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item_id', p_work_item_id,
            'review_status', 'approved',
            'package_candidate_id', v_candidate_id
        );
    END IF;

    IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot approve work item from current review status: ' || v_item.review_status);
    END IF;

    -- DEFECT 3: Strictly enforce mutable row_version concurrency
    IF v_item.row_version <> p_expected_version THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VERSION_CONFLICT',
            'message', 'Work item version conflict. Expected row_version ' || p_expected_version || ' but current is ' || v_item.row_version
        );
    END IF;

    -- DEFECT 6: STEP 2: Retrieve Snapshot & Validate Handler/Schema Version
    SELECT * INTO v_snapshot
    FROM public.recommendation_workflow_snapshots
    WHERE work_item_id = p_work_item_id;

    IF v_snapshot.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'SNAPSHOT_NOT_FOUND', 'message', 'Recommendation workflow snapshot missing for work item.');
    END IF;

    IF v_snapshot.schema_version < 1 OR v_snapshot.handler_version < 1 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'SCHEMA_MISMATCH', 'message', 'Snapshot schema or handler version is incompatible.');
    END IF;

    -- STEP 3: Revalidate Destination Existence & Activation
    IF NOT EXISTS (
        SELECT 1 FROM public.service_areas WHERE id::text = v_item.scope_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'STALE_REFERENCE', 'message', 'Destination identity is no longer valid or active: ' || v_item.scope_id);
    END IF;

    -- DEFECT 6: STEP 4: Revalidate Recommendation Existence for Amend & Retire
    IF v_item.operation IN ('recommendation.amend', 'recommendation.retire') THEN
        SELECT * INTO v_rec_row
        FROM public.recommendations
        WHERE id = v_snapshot.recommendation_id;

        IF v_rec_row.id IS NULL THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'RECOMMENDATION_NOT_FOUND', 'message', 'Authoritative recommendation no longer exists for operation ' || v_item.operation);
        END IF;
    END IF;

    -- DEFECT 5 & DEFECT 6: STEP 5: Six-Language Completeness Rule (Rule C: Required before package candidacy)
    IF v_item.operation IN ('recommendation.create', 'recommendation.amend') THEN
        v_translations := v_snapshot.translations_payload;
        FOR v_lang IN SELECT unnest(v_required_langs) LOOP
            v_has_lang := FALSE;
            IF v_translations IS NOT NULL AND jsonb_typeof(v_translations->v_lang) = 'object' AND 
               (v_translations->v_lang->>'title' IS NOT NULL OR v_translations->v_lang->>'short_description' IS NOT NULL) THEN
                v_has_lang := TRUE;
            ELSIF (v_snapshot.recommendation_payload->>( 'title_' || v_lang )) IS NOT NULL OR 
                  (v_snapshot.recommendation_payload->>( 'short_description_' || v_lang )) IS NOT NULL THEN
                v_has_lang := TRUE;
            END IF;

            -- Exception: for legacy baseline in amend, check if base translations exist
            IF NOT v_has_lang AND v_item.operation = 'recommendation.amend' AND v_rec_row.id IS NOT NULL THEN
                IF v_lang = 'en' AND v_rec_row.title_en IS NOT NULL THEN v_has_lang := TRUE; END IF;
                IF v_lang = 'sr' AND v_rec_row.title_sr IS NOT NULL THEN v_has_lang := TRUE; END IF;
            END IF;

            IF NOT v_has_lang THEN
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'error', 'INCOMPLETE_TRANSLATIONS',
                    'message', 'Approval requires complete translations in all six canonical languages (en, sr, de, ru, es, zh). Missing: ' || v_lang
                );
            END IF;
        END LOOP;
    END IF;

    v_clean_note := TRIM(COALESCE(p_reviewer_note, ''));

    -- Determine package impact type
    IF v_item.operation = 'recommendation.create' THEN
        v_impact_type := 'recommendation_create';
    ELSIF v_item.operation = 'recommendation.retire' THEN
        v_impact_type := 'recommendation_retire';
    ELSE
        v_impact_type := 'recommendation_update';
    END IF;

    -- DEFECT 3: Increment row_version atomically during state transition
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

    -- Emit Approved Event
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'recommendation.approved', v_item.review_status, 'approved',
        v_item.application_status, v_item.application_status,
        v_item.publication_status, 'draft_package',
        'studio', p_reviewer_id, jsonb_build_object('action', 'approve', 'row_version', v_item.row_version + 1), v_item.correlation_id, timezone('utc'::text, now())
    );

    -- Enqueue Inert Package Candidate
    INSERT INTO public.recommendation_package_candidates (
        work_item_id,
        destination_id,
        operation,
        recommendation_id,
        snapshot_id,
        package_impact_type,
        status,
        correlation_id,
        content_version,
        minimum_app_version,
        queued_at,
        created_at,
        updated_at
    ) VALUES (
        p_work_item_id,
        v_item.scope_id,
        v_item.operation,
        v_snapshot.recommendation_id,
        v_snapshot.id,
        v_impact_type,
        'queued',
        v_item.correlation_id,
        v_snapshot.base_content_version,
        '1.0.0',
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) ON CONFLICT (work_item_id) DO UPDATE SET
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_candidate_id;

    -- Enqueue Inert Rematching Request
    INSERT INTO public.recommendation_rematching_requests (
        work_item_id,
        destination_id,
        recommendation_id,
        operation,
        status,
        reason,
        source_content_version,
        correlation_id,
        queued_at,
        created_at,
        updated_at
    ) VALUES (
        p_work_item_id,
        v_item.scope_id,
        v_snapshot.recommendation_id,
        v_item.operation,
        'queued',
        'recommendation_workflow_approval',
        v_snapshot.base_content_version,
        v_item.correlation_id,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) ON CONFLICT (work_item_id) DO UPDATE SET
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_rematching_id;

    -- Emit Queue Domain Events
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'recommendation.package_candidate_queued', 'approved', 'approved',
        v_item.application_status, v_item.application_status,
        'draft_package', 'draft_package',
        'system', NULL, jsonb_build_object('package_candidate_id', v_candidate_id, 'impact_type', v_impact_type), v_item.correlation_id, timezone('utc'::text, now())
    );

    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        p_work_item_id, 'recommendation.rematching_requested', 'approved', 'approved',
        v_item.application_status, v_item.application_status,
        'draft_package', 'draft_package',
        'system', NULL, jsonb_build_object('rematching_request_id', v_rematching_id), v_item.correlation_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item_id', p_work_item_id,
        'review_status', 'approved',
        'publication_status', 'draft_package',
        'row_version', v_item.row_version + 1,
        'package_candidate_id', v_candidate_id,
        'rematching_request_id', v_rematching_id
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SERVICE ROLE GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.validate_recommendation_payload_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_recommendation_create_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_recommendation_amend_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_recommendation_retire_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_recommendation_work_item_secure TO service_role;
