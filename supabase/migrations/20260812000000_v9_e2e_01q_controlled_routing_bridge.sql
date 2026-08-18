-- IDEMO CONTROLLED ROUTING BRIDGE MIGRATION - V9-E2E-01Q
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.0.0 (Minimal Stage-Gated Controlled Routing Implementation)
-- Description: 
--   1. Provisions minimum taxonomy qualification (service area & language) for test partners UNO1 & UNO2.
--   2. Patches create_public_inquiry with a conditional Layer-B routing bridge:
--      - Full SPCC-01R taxonomy + Layer-B explicit eligibility matching when explicit coverage exists.
--      - Legacy taxonomy matching when no explicit coverage exists, server-authoritatively excluding MOCK partners (UNO1, UNO2).

-- =============================================================================
-- 1. PROVISION MINIMUM TEST-PARTNER TAXONOMY QUALIFICATION (UNO1 & UNO2)
-- =============================================================================

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status)
VALUES
    ('a0000000-0000-0000-0000-000000000091', '43ce68cc-5f50-42ba-b3ed-0116adf47b98', 'approved'::public.moderation_status),
    ('a0000000-0000-0000-0000-000000000092', '43ce68cc-5f50-42ba-b3ed-0116adf47b98', 'approved'::public.moderation_status)
ON CONFLICT (partner_id, service_area_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.partner_languages (partner_id, language_id, status)
VALUES
    ('a0000000-0000-0000-0000-000000000091', 'efec46f6-81cb-4942-9b12-d9f75a0192ad', 'approved'::public.moderation_status),
    ('a0000000-0000-0000-0000-000000000092', 'efec46f6-81cb-4942-9b12-d9f75a0192ad', 'approved'::public.moderation_status)
ON CONFLICT (partner_id, language_id) DO UPDATE SET status = EXCLUDED.status;

-- =============================================================================
-- 2. PATCH public.create_public_inquiry WITH ATOMIC CONDITIONAL LAYER-B BRIDGE
-- =============================================================================

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
    v_has_explicit_eligibility BOOLEAN := FALSE;
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

    -- Determine whether explicit approved eligibility exists for target recommendation
    SELECT EXISTS (
        SELECT 1 FROM public.recommendation_partner_eligibility rpe_check
        WHERE rpe_check.recommendation_id = p_recommendation_id::text
          AND rpe_check.qualification_state = 'idemo_selected'::public.qualification_state
          AND rpe_check.routing_state = 'active'::public.routing_pool_state
    ) INTO v_has_explicit_eligibility;

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
    -- LAYER A: Universal Safety & Taxonomy Qualification Gates
    -- CONDITIONAL LAYER B: Explicit Eligibility Gate when coverage exists; Legacy Fallback (excluding MOCK partners) when unmapped.
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
        AND (
            -- CASE 1: Explicit eligibility exists for this recommendation -> Mandatory Layer-B Gate
            (v_has_explicit_eligibility = TRUE AND EXISTS (
                SELECT 1 FROM public.recommendation_partner_eligibility rpe
                WHERE rpe.recommendation_id = p_recommendation_id::text
                  AND rpe.partner_id = p.id::text
                  AND rpe.qualification_state = 'idemo_selected'::public.qualification_state
                  AND rpe.routing_state = 'active'::public.routing_pool_state
            ))
            OR
            -- CASE 2: No explicit eligibility exists -> Legacy Fallback EXCLUDING Mock/Test Partners
            (v_has_explicit_eligibility = FALSE AND p.public_code NOT IN ('UNO1', 'UNO2'))
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
        'client_request_id', p_client_request_id,
        'has_explicit_eligibility', v_has_explicit_eligibility
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
        'expires_at', (pg_catalog.now() + v_expiry_interval)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID, UUID
) TO anon, authenticated, service_role;
