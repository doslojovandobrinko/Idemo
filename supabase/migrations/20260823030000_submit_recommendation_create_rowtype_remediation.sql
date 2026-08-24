-- IDEMO SUBMIT RECOMMENDATION CREATE ROWTYPE REMEDIATION
-- Additive Migration File: 20260823030000_submit_recommendation_create_rowtype_remediation.sql
-- Work Package: Recommendation Create Typed Reservation Variable Remediation

CREATE OR REPLACE FUNCTION public.submit_recommendation_create_secure(
    p_author_id UUID,
    p_destination_id UUID,
    p_proposed_recommendation JSONB DEFAULT '{}'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL,
    p_reserved_recommendation_id UUID DEFAULT NULL
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
    v_reserved_rec_id UUID;
    v_reservation public.recommendation_draft_reservations%ROWTYPE;
    v_proposed_uuid UUID;
    v_proposed_id TEXT;
    v_existing_item public.editorial_work_items%ROWTYPE;
    v_work_item public.editorial_work_items%ROWTYPE;
    v_snapshot_id UUID;
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

    IF p_author_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authorized author identity is required.');
    END IF;

    -- Destination_id is MANDATORY for recommendation creation
    IF p_destination_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_REQUEST', 'message', 'Mandatory destination_id UUID is required for recommendation creation.');
    END IF;

    -- Validate Destination against service_areas UUID primary key
    IF NOT EXISTS (
        SELECT 1 FROM public.service_areas WHERE id = p_destination_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_DESTINATION', 'message', 'Unknown or invalid destination_id UUID: ' || p_destination_id::text);
    END IF;

    -- Extract reserved_recommendation_id
    v_reserved_rec_id := p_reserved_recommendation_id;
    IF v_reserved_rec_id IS NULL AND p_proposed_recommendation IS NOT NULL THEN
        IF p_proposed_recommendation->>'reserved_recommendation_id' IS NOT NULL AND p_proposed_recommendation->>'reserved_recommendation_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
            v_reserved_rec_id := (p_proposed_recommendation->>'reserved_recommendation_id')::uuid;
        ELSIF p_proposed_recommendation->>'id' IS NOT NULL AND p_proposed_recommendation->>'id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
            v_reserved_rec_id := (p_proposed_recommendation->>'id')::uuid;
        END IF;
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

    -- If a draft reservation is supplied, lock and validate it
    IF v_reserved_rec_id IS NOT NULL THEN
        SELECT * INTO v_reservation
        FROM public.recommendation_draft_reservations
        WHERE reserved_recommendation_id = v_reserved_rec_id
        FOR UPDATE;

        IF v_reservation.id IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'RESERVATION_NOT_FOUND',
                'message', 'Draft reservation does not exist.'
            );
        END IF;

        IF v_reservation.reserved_by <> p_author_id THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'RESERVATION_ACTOR_MISMATCH',
                'message', 'Draft reservation belongs to another actor.'
            );
        END IF;

        IF v_reservation.destination_id <> p_destination_id THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'RESERVATION_DESTINATION_MISMATCH',
                'message', 'Draft reservation destination mismatch.'
            );
        END IF;

        IF v_reservation.status = 'consumed' THEN
            -- Check for idempotent replay with same idempotency_key or work_item
            SELECT * INTO v_existing_item
            FROM public.editorial_work_items
            WHERE submitted_by_type = 'studio'
              AND submitted_by_id = p_author_id
              AND (idempotency_key = v_idempotency OR entity_id = v_reserved_rec_id::text);

            IF v_existing_item.id IS NOT NULL AND v_existing_item.idempotency_key = v_idempotency THEN
                RETURN jsonb_build_object(
                    'success', TRUE,
                    'is_idempotent_replay', TRUE,
                    'work_item', jsonb_build_object(
                        'id', v_existing_item.id,
                        'correlation_id', v_existing_item.correlation_id,
                        'recommendation_id', v_existing_item.entity_id,
                        'handler_key', v_existing_item.handler_key,
                        'review_status', v_existing_item.review_status,
                        'application_status', v_existing_item.application_status,
                        'publication_status', v_existing_item.publication_status,
                        'submitted_at', v_existing_item.submitted_at,
                        'created_at', v_existing_item.created_at
                    )
                );
            ELSE
                RETURN jsonb_build_object(
                    'success', FALSE,
                    'error', 'RESERVATION_ALREADY_CONSUMED',
                    'message', 'Draft reservation has already been consumed.'
                );
            END IF;
        END IF;

        IF v_reservation.status <> 'active' THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'RESERVATION_INACTIVE',
                'message', 'Draft reservation is no longer active.'
            );
        END IF;
    END IF;

    -- Idempotency check on work items
    SELECT * INTO v_existing_item
    FROM public.editorial_work_items
    WHERE submitted_by_type = 'studio' AND idempotency_key = v_idempotency;

    IF v_existing_item.id IS NOT NULL THEN
        -- Mark reservation consumed if active reservation existed
        IF v_reserved_rec_id IS NOT NULL AND v_reservation.id IS NOT NULL AND v_reservation.status = 'active' THEN
            UPDATE public.recommendation_draft_reservations
            SET status = 'consumed',
                consumed_at = timezone('utc'::text, now()),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_reservation.id;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'is_idempotent_replay', TRUE,
            'work_item', jsonb_build_object(
                'id', v_existing_item.id,
                'correlation_id', v_existing_item.correlation_id,
                'recommendation_id', v_existing_item.entity_id,
                'handler_key', v_existing_item.handler_key,
                'review_status', v_existing_item.review_status,
                'application_status', v_existing_item.application_status,
                'publication_status', v_existing_item.publication_status,
                'submitted_at', v_existing_item.submitted_at,
                'created_at', v_existing_item.created_at
            )
        );
    END IF;

    -- Determine Canonical Recommendation Identity
    IF v_reserved_rec_id IS NOT NULL THEN
        v_proposed_uuid := v_reserved_rec_id;
    ELSE
        v_proposed_uuid := gen_random_uuid();
    END IF;
    v_proposed_id := v_proposed_uuid::text;

    -- Insert Editorial Work Item
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

    -- Insert Immutable Work Item Events
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

    -- Mark reservation consumed atomically
    IF v_reserved_rec_id IS NOT NULL AND v_reservation.id IS NOT NULL THEN
        UPDATE public.recommendation_draft_reservations
        SET status = 'consumed',
            consumed_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_reservation.id;
    END IF;

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

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure::text AS func_sig
        FROM pg_proc
        WHERE proname = 'submit_recommendation_create_secure'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION ' || r.func_sig || ' FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.func_sig || ' TO service_role;';
    END LOOP;
END $$;
