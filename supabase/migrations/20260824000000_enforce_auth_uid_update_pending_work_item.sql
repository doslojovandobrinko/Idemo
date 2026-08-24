-- IDEMO ENFORCE AUTH UID ON UPDATE PENDING RECOMMENDATION WORK ITEM
-- Additive Forward Migration: 20260824000000_enforce_auth_uid_update_pending_work_item.sql
-- Description: Enforces auth.uid() verification in update_pending_recommendation_work_item_secure to prevent client spoofing.

CREATE OR REPLACE FUNCTION public.update_pending_recommendation_work_item_secure(
    p_author_id UUID,
    p_work_item_id UUID,
    p_proposed_recommendation JSONB,
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
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot_id UUID;
    v_existing_event_id UUID;
    v_dest_uuid UUID;
    v_rec_uuid UUID;
    v_caller_uid UUID;
BEGIN
    -- Check workflow feature flags
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

    -- Authenticated Caller Verification via JWT context
    v_caller_uid := auth.uid();

    IF v_caller_uid IS NOT NULL THEN
        -- When called from authenticated context, p_author_id MUST match auth.uid()
        IF p_author_id IS NOT NULL AND p_author_id <> v_caller_uid THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'AUTHOR_IDENTITY_MISMATCH',
                'message', 'Provided author_id does not match authenticated identity.'
            );
        END IF;
        p_author_id := v_caller_uid;
    ELSIF p_author_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized author identity is required.');
    END IF;

    IF p_work_item_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Mandatory work_item_id UUID is required.');
    END IF;

    -- Load public.editorial_work_items FOR UPDATE
    SELECT * INTO v_work_item
    FROM public.editorial_work_items
    WHERE id = p_work_item_id
    FOR UPDATE;

    IF v_work_item.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORK_ITEM_NOT_FOUND',
            'message', 'Editorial work item not found.'
        );
    END IF;

    -- Validate Entity Type and Operation
    IF v_work_item.entity_type <> 'recommendation' OR v_work_item.operation <> 'recommendation.create' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_WORK_ITEM_TYPE',
            'message', 'Work item is not a recommendation create proposal.'
        );
    END IF;

    -- Validate Pre-Canonical / Pending Review State
    IF v_work_item.review_status IN ('approved', 'canonical', 'rejected', 'withdrawn', 'superseded', 'cancelled', 'expired') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'WORK_ITEM_FINALIZED',
            'message', 'Work item is already finalized or approved and cannot be revised.'
        );
    END IF;

    -- Actor Authorization: Verified p_author_id must match work_item's submitted_by_id
    IF v_work_item.submitted_by_id IS NOT NULL AND v_work_item.submitted_by_id <> p_author_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'UNAUTHORIZED_ACTOR',
            'message', 'Work item belongs to another author.'
        );
    END IF;

    -- Server Payload Validation
    v_validation := public.validate_recommendation_payload_secure('recommendation.create', p_proposed_recommendation);
    IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', COALESCE(v_validation->>'error_code', 'VALIDATION_FAILED'),
            'message', COALESCE(v_validation->>'message', 'Recommendation payload validation failed.')
        );
    END IF;

    v_corr_id := COALESCE(p_correlation_id, v_work_item.correlation_id, gen_random_uuid());
    v_idempotency := TRIM(COALESCE(p_idempotency_key, 'rec_update_' || encode(sha256((p_work_item_id::text || p_proposed_recommendation::text)::bytea), 'hex')));

    -- Idempotency Replay Check
    SELECT id INTO v_existing_event_id
    FROM public.editorial_work_item_events
    WHERE work_item_id = p_work_item_id
      AND safe_metadata->>'idempotency_key' = v_idempotency;

    IF v_existing_event_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_work_item.id,
                'correlation_id', v_work_item.correlation_id,
                'recommendation_id', v_work_item.entity_id,
                'handler_key', v_work_item.handler_key,
                'review_status', v_work_item.review_status,
                'application_status', v_work_item.application_status,
                'publication_status', v_work_item.publication_status,
                'submitted_at', v_work_item.submitted_at,
                'updated_at', v_work_item.updated_at
            )
        );
    END IF;

    -- Work Item Update
    UPDATE public.editorial_work_items
    SET proposed_value = p_proposed_recommendation,
        updated_at = timezone('utc'::text, now()),
        row_version = row_version + 1
    WHERE id = p_work_item_id
    RETURNING * INTO v_work_item;

    -- Extract destination and recommendation UUIDs safely
    v_dest_uuid := CASE 
        WHEN v_work_item.scope_id IS NOT NULL AND v_work_item.scope_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
        THEN v_work_item.scope_id::uuid 
        ELSE NULL 
    END;

    v_rec_uuid := CASE 
        WHEN v_work_item.entity_id IS NOT NULL AND v_work_item.entity_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
        THEN v_work_item.entity_id::uuid 
        ELSE NULL 
    END;

    -- Insert Immutable Snapshot
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
        v_dest_uuid,
        v_rec_uuid,
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

    -- Append Immutable Audit Event
    INSERT INTO public.editorial_work_item_events (
        work_item_id, event_type, previous_review_status, new_review_status,
        previous_application_status, new_application_status,
        previous_publication_status, new_publication_status,
        actor_type, actor_id, safe_metadata, correlation_id, created_at
    ) VALUES (
        v_work_item.id, 'recommendation.updated_before_approval',
        v_work_item.review_status, v_work_item.review_status,
        v_work_item.application_status, v_work_item.application_status,
        v_work_item.publication_status, v_work_item.publication_status,
        'studio', p_author_id,
        jsonb_build_object(
            'operation', 'recommendation.create',
            'recommendation_id', v_work_item.entity_id,
            'work_item_id', v_work_item.id::text,
            'destination_id', v_work_item.scope_id,
            'idempotency_key', v_idempotency,
            'snapshot_id', v_snapshot_id::text,
            'revision_action', 'update_pending'
        ),
        v_corr_id, timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'is_idempotent_replay', FALSE,
        'work_item', jsonb_build_object(
            'id', v_work_item.id,
            'correlation_id', v_work_item.correlation_id,
            'recommendation_id', v_work_item.entity_id,
            'snapshot_id', v_snapshot_id,
            'handler_key', v_work_item.handler_key,
            'review_status', v_work_item.review_status,
            'application_status', v_work_item.application_status,
            'publication_status', v_work_item.publication_status,
            'submitted_at', v_work_item.submitted_at,
            'updated_at', v_work_item.updated_at
        )
    );
END;
$$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure::text AS func_sig
        FROM pg_proc
        WHERE proname = 'update_pending_recommendation_work_item_secure'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION ' || r.func_sig || ' FROM PUBLIC, anon;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.func_sig || ' TO service_role, authenticated;';
    END LOOP;
END $$;
