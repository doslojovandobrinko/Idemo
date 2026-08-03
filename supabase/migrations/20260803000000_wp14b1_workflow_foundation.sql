-- IDEMO Unified Editorial Workflow Foundation Migration
-- Work Package: WP-14B1
-- Migration File: 20260803000000_wp14b1_workflow_foundation.sql
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.0.0

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FEATURE FLAG INITIALIZATION (IN public.system_settings)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
    'editorial_workflow_engine_enabled',
    'false',
    'Server-authoritative feature flag for WP-14 Unified Editorial Workflow Engine foundation',
    timezone('utc'::text, now())
)
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CANONICAL COORDINATION TABLE: public.editorial_work_items
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.editorial_work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    scope_type VARCHAR(50) NOT NULL DEFAULT 'global' CHECK (scope_type IN ('global', 'destination', 'partner', 'recommendation', 'collection')),
    scope_id VARCHAR(100) NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NULL,
    operation VARCHAR(50) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    item_key VARCHAR(255) NOT NULL,
    handler_key VARCHAR(100) NOT NULL,
    handler_version INT NOT NULL DEFAULT 1 CHECK (handler_version > 0),
    registry_version INT NOT NULL DEFAULT 1 CHECK (registry_version > 0),
    minimum_engine_version INT NOT NULL DEFAULT 1 CHECK (minimum_engine_version > 0),
    base_content_version INT NOT NULL DEFAULT 1 CHECK (base_content_version > 0),
    current_value JSONB NULL,
    proposed_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    review_status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (review_status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'withdrawn', 'superseded', 'cancelled', 'expired')),
    application_status VARCHAR(50) NOT NULL DEFAULT 'not_applicable' CHECK (application_status IN ('not_applicable', 'pending_application', 'applied', 'application_failed', 'rolled_back')),
    publication_status VARCHAR(50) NOT NULL DEFAULT 'not_applicable' CHECK (publication_status IN ('not_applicable', 'draft_package', 'scheduled', 'published', 'publication_failed', 'rolled_back')),
    priority VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'high', 'urgent')),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (risk_level IN ('low', 'standard', 'high', 'critical')),
    effect_policy VARCHAR(50) NOT NULL DEFAULT 'no_side_effect' CHECK (effect_policy = 'no_side_effect'),
    submitted_by_type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (submitted_by_type IN ('partner', 'studio', 'system')),
    submitted_by_id UUID NULL,
    assigned_reviewer_id UUID NULL,
    reviewed_by UUID NULL,
    reviewed_at TIMESTAMPTZ NULL,
    reviewer_note TEXT NULL,
    rejection_reason TEXT NULL,
    requested_changes TEXT NULL,
    submitted_at TIMESTAMPTZ NULL DEFAULT timezone('utc'::text, now()),
    effective_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    idempotency_key VARCHAR(255) NOT NULL CHECK (length(trim(idempotency_key)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for Administrative Queue queries
CREATE INDEX IF NOT EXISTS idx_editorial_work_items_review_status 
ON public.editorial_work_items (review_status, created_at DESC);

-- Index for Correlation Tracing
CREATE INDEX IF NOT EXISTS idx_editorial_work_items_correlation_id 
ON public.editorial_work_items (correlation_id);

-- Index for Entity Lookup
CREATE INDEX IF NOT EXISTS idx_editorial_work_items_entity 
ON public.editorial_work_items (entity_type, entity_id);

-- Index for Scoped Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_work_items_idempotency 
ON public.editorial_work_items (submitted_by_type, idempotency_key);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. IMMUTABLE EVENT LEDGER: public.editorial_work_item_events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.editorial_work_item_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    previous_review_status VARCHAR(50) NULL,
    new_review_status VARCHAR(50) NOT NULL,
    previous_application_status VARCHAR(50) NULL,
    new_application_status VARCHAR(50) NOT NULL,
    previous_publication_status VARCHAR(50) NULL,
    new_publication_status VARCHAR(50) NOT NULL,
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('partner', 'studio', 'system')),
    actor_id UUID NULL,
    safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_editorial_work_item_events_item_id 
ON public.editorial_work_item_events (work_item_id, created_at ASC);

-- Immutability Enforcement Function and Trigger
CREATE OR REPLACE FUNCTION public.block_workflow_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Workflow event ledger records are immutable. UPDATE and DELETE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS secure_workflow_events_immutability ON public.editorial_work_item_events;
CREATE TRIGGER secure_workflow_events_immutability
BEFORE UPDATE OR DELETE ON public.editorial_work_item_events
FOR EACH ROW EXECUTE FUNCTION public.block_workflow_event_mutation();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS AND DEFENSE-IN-DEPTH ACCESS CONTROL
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.editorial_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_work_item_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.editorial_work_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.editorial_work_item_events FROM PUBLIC, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FOUNDATIONAL RPCS (SECURITY DEFINER WITH SEARCH_PATH)
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 SUBMIT FOUNDATION WORK ITEM RPC
CREATE OR REPLACE FUNCTION public.submit_foundation_work_item_secure(
    p_actor_type TEXT,
    p_actor_id UUID,
    p_scope_type TEXT DEFAULT 'global',
    p_scope_id TEXT DEFAULT NULL,
    p_entity_type TEXT DEFAULT 'system_setting',
    p_entity_id TEXT DEFAULT NULL,
    p_operation TEXT DEFAULT 'verify',
    p_proposed_value JSONB DEFAULT '{}'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_flag_enabled TEXT;
    v_item_id UUID;
    v_corr_id UUID;
    v_idempotency TEXT;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_result_item public.editorial_work_items%ROWTYPE;
BEGIN
    -- 1. Check server-authoritative feature flag
    SELECT value INTO v_flag_enabled 
    FROM public.system_settings 
    WHERE key = 'editorial_workflow_engine_enabled';

    IF v_flag_enabled IS NULL OR LOWER(TRIM(v_flag_enabled)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Unified Editorial Workflow Engine is currently disabled.'
        );
    END IF;

    -- 2. Validate input parameters
    IF p_actor_type IS NULL OR p_actor_type NOT IN ('partner', 'studio', 'system') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Invalid actor type.');
    END IF;

    v_idempotency := TRIM(COALESCE(p_idempotency_key, ''));
    IF v_idempotency = '' THEN
        v_idempotency := 'sys_idemp_' || gen_random_uuid()::text;
    END IF;

    v_corr_id := COALESCE(p_correlation_id, gen_random_uuid());

    -- 3. Check Idempotency
    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = p_actor_type AND idempotency_key = v_idempotency;

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

    -- 4. Create Work Item Atomically
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
        COALESCE(p_scope_type, 'global'),
        p_scope_id,
        COALESCE(p_entity_type, 'system_setting'),
        p_entity_id,
        COALESCE(p_operation, 'verify'),
        'foundation_item',
        COALESCE(p_entity_type, 'system_setting') || ':' || COALESCE(p_entity_id, 'global'),
        'system.foundation.no_side_effect',
        1,
        1,
        1,
        1,
        NULL,
        COALESCE(p_proposed_value, '{}'::jsonb),
        'submitted',
        'not_applicable',
        'not_applicable',
        'standard',
        'low',
        'no_side_effect',
        p_actor_type,
        p_actor_id,
        v_idempotency,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING * INTO v_result_item;

    -- 5. Record Initial Event in Ledger
    INSERT INTO public.editorial_work_item_events (
        work_item_id,
        event_type,
        previous_review_status,
        new_review_status,
        previous_application_status,
        new_application_status,
        previous_publication_status,
        new_publication_status,
        actor_type,
        actor_id,
        safe_metadata,
        correlation_id,
        created_at
    ) VALUES (
        v_result_item.id,
        'submitted',
        NULL,
        'submitted',
        NULL,
        'not_applicable',
        NULL,
        'not_applicable',
        p_actor_type,
        p_actor_id,
        jsonb_build_object('handler_key', 'system.foundation.no_side_effect', 'effect_policy', 'no_side_effect'),
        v_corr_id,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_result_item.id,
            'correlation_id', v_result_item.correlation_id,
            'handler_key', v_result_item.handler_key,
            'review_status', v_result_item.review_status,
            'application_status', v_result_item.application_status,
            'publication_status', v_result_item.publication_status,
            'submitted_at', v_result_item.submitted_at,
            'created_at', v_result_item.created_at
        )
    );
END;
$$;


-- 5.2 GET ADMINISTRATIVE QUEUE RPC
CREATE OR REPLACE FUNCTION public.get_editorial_work_items_queue_secure(
    p_review_status TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_flag_enabled TEXT;
    v_items JSONB;
    v_total_count INT;
    v_lim INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
    v_off INT := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
    -- Check feature flag
    SELECT value INTO v_flag_enabled 
    FROM public.system_settings 
    WHERE key = 'editorial_workflow_engine_enabled';

    IF v_flag_enabled IS NULL OR LOWER(TRIM(v_flag_enabled)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Unified Editorial Workflow Engine is currently disabled.'
        );
    END IF;

    -- Get Total Count
    SELECT COUNT(*) INTO v_total_count
    FROM public.editorial_work_items
    WHERE (p_review_status IS NULL OR review_status = p_review_status);

    -- Get Items
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', w.id,
            'correlation_id', w.correlation_id,
            'scope_type', w.scope_type,
            'scope_id', w.scope_id,
            'entity_type', w.entity_type,
            'entity_id', w.entity_id,
            'operation', w.operation,
            'handler_key', w.handler_key,
            'review_status', w.review_status,
            'application_status', w.application_status,
            'publication_status', w.publication_status,
            'priority', w.priority,
            'risk_level', w.risk_level,
            'submitted_by_type', w.submitted_by_type,
            'submitted_by_id', w.submitted_by_id,
            'reviewed_by', w.reviewed_by,
            'reviewed_at', w.reviewed_at,
            'reviewer_note', w.reviewer_note,
            'submitted_at', w.submitted_at,
            'created_at', w.created_at
        ) ORDER BY w.created_at DESC
    ), '[]'::jsonb) INTO v_items
    FROM (
        SELECT * FROM public.editorial_work_items
        WHERE (p_review_status IS NULL OR review_status = p_review_status)
        ORDER BY created_at DESC
        LIMIT v_lim OFFSET v_off
    ) w;

    RETURN jsonb_build_object(
        'success', TRUE,
        'total_count', v_total_count,
        'limit', v_lim,
        'offset', v_off,
        'items', v_items
    );
END;
$$;


-- 5.3 GET WORK ITEM DETAIL RPC
CREATE OR REPLACE FUNCTION public.get_editorial_work_item_detail_secure(
    p_work_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_flag_enabled TEXT;
    v_item public.editorial_work_items%ROWTYPE;
    v_events JSONB;
BEGIN
    -- Check feature flag
    SELECT value INTO v_flag_enabled 
    FROM public.system_settings 
    WHERE key = 'editorial_workflow_engine_enabled';

    IF v_flag_enabled IS NULL OR LOWER(TRIM(v_flag_enabled)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Unified Editorial Workflow Engine is currently disabled.'
        );
    END IF;

    SELECT * INTO v_item
    FROM public.editorial_work_items
    WHERE id = p_work_item_id;

    IF v_item.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORK_ITEM_NOT_FOUND',
            'message', 'Workflow item not found.'
        );
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'event_type', e.event_type,
            'previous_review_status', e.previous_review_status,
            'new_review_status', e.new_review_status,
            'previous_application_status', e.previous_application_status,
            'new_application_status', e.new_application_status,
            'previous_publication_status', e.previous_publication_status,
            'new_publication_status', e.new_publication_status,
            'actor_type', e.actor_type,
            'actor_id', e.actor_id,
            'safe_metadata', e.safe_metadata,
            'created_at', e.created_at
        ) ORDER BY e.created_at ASC
    ), '[]'::jsonb) INTO v_events
    FROM public.editorial_work_item_events e
    WHERE e.work_item_id = p_work_item_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'work_item', jsonb_build_object(
            'id', v_item.id,
            'correlation_id', v_item.correlation_id,
            'scope_type', v_item.scope_type,
            'scope_id', v_item.scope_id,
            'entity_type', v_item.entity_type,
            'entity_id', v_item.entity_id,
            'operation', v_item.operation,
            'handler_key', v_item.handler_key,
            'handler_version', v_item.handler_version,
            'current_value', v_item.current_value,
            'proposed_value', v_item.proposed_value,
            'review_status', v_item.review_status,
            'application_status', v_item.application_status,
            'publication_status', v_item.publication_status,
            'priority', v_item.priority,
            'risk_level', v_item.risk_level,
            'effect_policy', v_item.effect_policy,
            'submitted_by_type', v_item.submitted_by_type,
            'submitted_by_id', v_item.submitted_by_id,
            'reviewed_by', v_item.reviewed_by,
            'reviewed_at', v_item.reviewed_at,
            'reviewer_note', v_item.reviewer_note,
            'submitted_at', v_item.submitted_at,
            'created_at', v_item.created_at,
            'updated_at', v_item.updated_at
        ),
        'events', v_events
    );
END;
$$;


-- 5.4 REVIEW ACTION RPC
CREATE OR REPLACE FUNCTION public.review_editorial_work_item_secure(
    p_work_item_id UUID,
    p_reviewer_id UUID,
    p_action TEXT,
    p_reviewer_note TEXT DEFAULT NULL,
    p_expected_version INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_flag_enabled TEXT;
    v_item public.editorial_work_items%ROWTYPE;
    v_new_review_status VARCHAR(50);
    v_clean_note TEXT;
BEGIN
    -- 1. Check Feature Flag
    SELECT value INTO v_flag_enabled 
    FROM public.system_settings 
    WHERE key = 'editorial_workflow_engine_enabled';

    IF v_flag_enabled IS NULL OR LOWER(TRIM(v_flag_enabled)) <> 'true' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORKFLOW_ENGINE_DISABLED',
            'message', 'Unified Editorial Workflow Engine is currently disabled.'
        );
    END IF;

    -- 2. Lock Row For Concurrency
    SELECT * INTO v_item
    FROM public.editorial_work_items
    WHERE id = p_work_item_id
    FOR UPDATE;

    IF v_item.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'WORK_ITEM_NOT_FOUND', 'message', 'Workflow item not found.');
    END IF;

    -- 3. Version Concurrency Check
    IF p_expected_version IS NOT NULL AND v_item.handler_version <> p_expected_version THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'VERSION_CONFLICT',
            'message', 'Workflow item has been modified by another process.'
        );
    END IF;

    v_clean_note := TRIM(COALESCE(p_reviewer_note, ''));

    -- 4. Validate State Transitions
    IF p_action = 'start_review' THEN
        IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot start review from current status.');
        END IF;
        v_new_review_status := 'under_review';

    ELSIF p_action = 'request_changes' THEN
        IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot request changes from current status.');
        END IF;
        IF v_clean_note = '' THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Reviewer note is required when requesting changes.');
        END IF;
        v_new_review_status := 'changes_requested';

    ELSIF p_action = 'approve' THEN
        IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot approve item from current status.');
        END IF;
        v_new_review_status := 'approved';

    ELSIF p_action = 'reject' THEN
        IF v_item.review_status NOT IN ('submitted', 'under_review') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot reject item from current status.');
        END IF;
        IF v_clean_note = '' THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Reviewer note is required when rejecting an item.');
        END IF;
        v_new_review_status := 'rejected';

    ELSIF p_action = 'cancel' THEN
        IF v_item.review_status IN ('approved', 'rejected', 'cancelled', 'expired', 'superseded') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Terminal items cannot be cancelled.');
        END IF;
        v_new_review_status := 'cancelled';

    ELSE
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Unsupported review action.');
    END IF;

    -- 5. Update Coordination Record (NO DOMAIN SIDE EFFECTS IN WP-14B1)
    UPDATE public.editorial_work_items
    SET
        review_status = v_new_review_status,
        reviewed_by = p_reviewer_id,
        reviewed_at = timezone('utc'::text, now()),
        reviewer_note = CASE WHEN v_clean_note <> '' THEN v_clean_note ELSE reviewer_note END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_work_item_id;

    -- 6. Insert Event into Immutable Ledger
    INSERT INTO public.editorial_work_item_events (
        work_item_id,
        event_type,
        previous_review_status,
        new_review_status,
        previous_application_status,
        new_application_status,
        previous_publication_status,
        new_publication_status,
        actor_type,
        actor_id,
        safe_metadata,
        correlation_id,
        created_at
    ) VALUES (
        p_work_item_id,
        p_action,
        v_item.review_status,
        v_new_review_status,
        v_item.application_status,
        v_item.application_status,
        v_item.publication_status,
        v_item.publication_status,
        'studio',
        p_reviewer_id,
        jsonb_build_object('action', p_action, 'note_provided', v_clean_note <> ''),
        v_item.correlation_id,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'work_item_id', p_work_item_id,
        'action', p_action,
        'previous_review_status', v_item.review_status,
        'new_review_status', v_new_review_status
    );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. GRANTS FOR SERVICE ROLE ONLY
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.submit_foundation_work_item_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.get_editorial_work_items_queue_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.get_editorial_work_item_detail_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.review_editorial_work_item_secure TO service_role;
