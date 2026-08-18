-- IDEMO Phase 6B - Slice 4: Atomic Idempotency & Client Request ID
-- Migration: 20260725000000_slice4_atomic_idempotency.sql

-- 1. Add client_request_id column to inquiries
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS client_request_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_client_request_id 
ON public.inquiries (client_request_id) 
WHERE client_request_id IS NOT NULL;

-- 2. Drop existing signatures of create_public_inquiry
DROP FUNCTION IF EXISTS public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID
);

DROP FUNCTION IF EXISTS public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID, UUID
);

-- 3. Create updated create_public_inquiry function with client_request_id & atomic idempotency
CREATE OR REPLACE FUNCTION public.create_public_inquiry(
    p_recommendation_id UUID,
    p_visitor_notes TEXT,
    p_preferred_language_id UUID,
    p_service_area_id UUID,
    p_requested_start_at TIMESTAMP WITH TIME ZONE,
    p_requested_end_at TIMESTAMP WITH TIME ZONE,
    p_visitor_name VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_phone_number VARCHAR DEFAULT NULL,
    p_consent_text_version VARCHAR DEFAULT 'v1.0',
    p_consent_purpose VARCHAR DEFAULT 'concierge_service',
    p_consent_channel VARCHAR DEFAULT 'web_form',
    p_required_capability_ids UUID[] DEFAULT NULL,
    p_visitor_auth_user_id UUID DEFAULT NULL,
    p_client_request_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry_id UUID;
    v_public_ref VARCHAR(20);
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_visitor_notes_clean TEXT;
    v_visitor_auth_id UUID;
    v_cap_ids UUID[];
    v_cap_id UUID;
    v_queue_order INTEGER := 1;
    v_partner_record RECORD;
    v_first_partner_id UUID := NULL;
    v_match_id UUID := NULL;
    v_meta JSONB;
    v_result JSONB;
    v_expiry_interval INTERVAL := INTERVAL '48 hours';
    v_existing_id UUID;
    v_existing_ref VARCHAR(20);
    v_existing_count INTEGER;
BEGIN
    -- 1. Idempotency Check if client_request_id is provided
    IF p_client_request_id IS NOT NULL THEN
        SELECT id, public_reference_code INTO v_existing_id, v_existing_ref
        FROM public.inquiries
        WHERE client_request_id = p_client_request_id;

        IF v_existing_id IS NOT NULL THEN
            SELECT count(*) INTO v_existing_count
            FROM public.inquiry_candidates
            WHERE inquiry_id = v_existing_id;

            RETURN pg_catalog.jsonb_build_object(
                'inquiry_id', v_existing_id,
                'public_reference_code', v_existing_ref,
                'is_duplicate', true,
                'candidates_count', v_existing_count
            );
        END IF;
    END IF;

    -- 2. Input Validation & Cleaning
    v_visitor_notes_clean := trim(p_visitor_notes);
    IF v_visitor_notes_clean IS NULL OR pg_catalog.length(v_visitor_notes_clean) = 0 THEN
        RAISE EXCEPTION 'Visitor notes cannot be empty.' USING ERRCODE = '22000';
    END IF;

    IF p_email IS NULL AND p_phone_number IS NULL THEN
        RAISE EXCEPTION 'Either email or phone number must be provided.' USING ERRCODE = '22000';
    END IF;

    v_visitor_auth_id := p_visitor_auth_user_id;
    IF v_visitor_auth_id IS NULL THEN
        v_visitor_auth_id := auth.uid();
    END IF;

    v_public_ref := public.generate_reference_code();

    v_raw_token := 'idm_rc_' || pg_catalog.replace(gen_random_uuid()::text, '-', '');
    v_token_hash := pg_catalog.encode(pg_catalog.sha256(v_raw_token::bytea), 'hex');

    v_cap_ids := p_required_capability_ids;
    IF v_cap_ids IS NULL OR pg_catalog.array_length(v_cap_ids, 1) IS NULL THEN
        SELECT COALESCE(pg_catalog.array_agg(capability_id), ARRAY[]::uuid[]) INTO v_cap_ids
        FROM public.recommendation_capabilities
        WHERE recommendation_id = p_recommendation_id;
    END IF;

    -- 3. Core Table Writes with Atomic Concurrency Guard
    BEGIN
        INSERT INTO public.inquiries (
            recommendation_id,
            visitor_auth_user_id,
            status,
            visitor_notes,
            preferred_language_id,
            service_area_id,
            requested_start_at,
            requested_end_at,
            public_reference_code,
            recovery_token_hash,
            recovery_token_expires_at,
            client_request_id
        ) VALUES (
            p_recommendation_id,
            v_visitor_auth_id,
            'new'::public.inquiry_status,
            v_visitor_notes_clean,
            p_preferred_language_id,
            p_service_area_id,
            p_requested_start_at,
            p_requested_end_at,
            v_public_ref,
            v_token_hash,
            pg_catalog.now() + INTERVAL '30 days',
            p_client_request_id
        )
        RETURNING id INTO v_inquiry_id;
    EXCEPTION WHEN unique_violation THEN
        IF p_client_request_id IS NOT NULL THEN
            SELECT id, public_reference_code INTO v_existing_id, v_existing_ref
            FROM public.inquiries
            WHERE client_request_id = p_client_request_id;

            SELECT count(*) INTO v_existing_count
            FROM public.inquiry_candidates
            WHERE inquiry_id = v_existing_id;

            RETURN pg_catalog.jsonb_build_object(
                'inquiry_id', v_existing_id,
                'public_reference_code', v_existing_ref,
                'is_duplicate', true,
                'candidates_count', v_existing_count
            );
        ELSE
            RAISE;
        END IF;
    END;

    -- Private Contact details
    INSERT INTO public.inquiry_private_contacts (
        inquiry_id, visitor_name, email, phone_number
    ) VALUES (
        v_inquiry_id, trim(p_visitor_name), trim(p_email), trim(p_phone_number)
    );

    -- Consent recording
    INSERT INTO public.visitor_consents (
        inquiry_id, consent_text_version, purpose, channel
    ) VALUES (
        v_inquiry_id, trim(p_consent_text_version), trim(p_consent_purpose), trim(p_consent_channel)
    );

    -- Required capabilities
    IF pg_catalog.array_length(v_cap_ids, 1) > 0 THEN
        FOREACH v_cap_id IN ARRAY v_cap_ids LOOP
            INSERT INTO public.inquiry_required_capabilities (
                inquiry_id, capability_id, requirement_level
            ) VALUES (
                v_inquiry_id, v_cap_id, 'required'::public.requirement_level
            );
        END LOOP;
    END IF;

    -- 4. Queue Generation & Partner Matching
    FOR v_partner_record IN 
        SELECT p.id
        FROM public.partners p
        WHERE p.status = 'active'::public.partner_status
        AND p.is_open_for_inquiries = true
        AND (p.paused_until IS NULL OR p.paused_until <= pg_catalog.now())
        AND EXISTS (
            SELECT 1 FROM public.partner_service_areas psa
            WHERE psa.partner_id = p.id
              AND psa.service_area_id = p_service_area_id
              AND psa.status = 'approved'::public.moderation_status
        )
        AND EXISTS (
            SELECT 1 FROM public.partner_languages pl
            WHERE pl.partner_id = p.id
              AND pl.language_id = p_preferred_language_id
              AND pl.status = 'approved'::public.moderation_status
        )
        AND (
            pg_catalog.array_length(v_cap_ids, 1) IS NULL OR
            NOT EXISTS (
                SELECT 1 FROM pg_catalog.unnest(v_cap_ids) req_cap_id
                WHERE req_cap_id NOT IN (
                    SELECT pc.capability_id FROM public.partner_capabilities pc
                    WHERE pc.partner_id = p.id
                      AND pc.status = 'approved'::public.moderation_status
                )
            )
        )
        ORDER BY 
            COALESCE(
                (SELECT pg_catalog.max(im.offered_at) FROM public.inquiry_matches im WHERE im.partner_id = p.id),
                '1970-01-01 00:00:00+00'::timestamptz
            ) ASC,
            p.id ASC
    LOOP
        INSERT INTO public.inquiry_candidates (
            inquiry_id, partner_id, queue_order, candidate_status
        ) VALUES (
            v_inquiry_id, v_partner_record.id, v_queue_order, 'queued'::public.candidate_status
        );

        IF v_queue_order = 1 THEN
            v_first_partner_id := v_partner_record.id;
        END IF;

        v_queue_order := v_queue_order + 1;
    END LOOP;

    -- 5. Offer Initialization
    IF v_first_partner_id IS NOT NULL THEN
        INSERT INTO public.inquiry_matches (
            inquiry_id, partner_id, status, offered_at, expires_at
        ) VALUES (
            v_inquiry_id, v_first_partner_id, 'offered'::public.match_status, pg_catalog.now(), pg_catalog.now() + v_expiry_interval
        ) RETURNING id INTO v_match_id;

        UPDATE public.inquiry_candidates
        SET candidate_status = 'offered'::public.candidate_status
        WHERE inquiry_id = v_inquiry_id AND partner_id = v_first_partner_id;

        UPDATE public.inquiries
        SET status = 'matching'::public.inquiry_status
        WHERE id = v_inquiry_id;
    ELSE
        UPDATE public.inquiries
        SET status = 'needs_assistance'::public.inquiry_status
        WHERE id = v_inquiry_id;
    END IF;

    -- 6. Audit Logging
    v_meta := pg_catalog.jsonb_build_object(
        'public_reference_code', v_public_ref,
        'candidates_count', v_queue_order - 1,
        'has_active_offer', (v_first_partner_id IS NOT NULL),
        'matched_partner_id', v_first_partner_id,
        'client_request_id', p_client_request_id
    );

    INSERT INTO public.audit_logs (
        actor_auth_user_id, actor_role, action, resource_type, resource_id, result, safe_metadata
    ) VALUES (
        v_visitor_auth_id,
        CASE WHEN v_visitor_auth_id IS NOT NULL THEN 'visitor_authenticated' ELSE 'visitor_anonymous' END,
        'inquiry_created', 'inquiries', v_inquiry_id, 'success', v_meta
    );

    -- 7. Return Compact Sanitized Payload
    v_result := pg_catalog.jsonb_build_object(
        'inquiry_id', v_inquiry_id,
        'public_reference_code', v_public_ref,
        'raw_recovery_token', v_raw_token,
        'candidates_count', v_queue_order - 1,
        'first_partner_id', v_first_partner_id,
        'first_match_id', v_match_id,
        'is_duplicate', false
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID, UUID
) TO anon, authenticated;
