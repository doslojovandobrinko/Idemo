-- IDEMO Studio Partner Coverage Control Remediation & Hardening Migration
-- Migration: 20260811000000_spcc_01r_coverage_control_remediation.sql

-- 1. Restrict RLS read policy on recommendation_partner_eligibility to Super Admin, Admin & service_role
DROP POLICY IF EXISTS authenticated_read_rec_partner_eligibility ON public.recommendation_partner_eligibility;
DROP POLICY IF EXISTS studio_admin_read_rec_partner_eligibility ON public.recommendation_partner_eligibility;

CREATE POLICY studio_admin_read_rec_partner_eligibility ON public.recommendation_partner_eligibility
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '') IN (
      'super_admin', 'admin'
    )
  );

-- 2. Secure Fetch Matrix RPC (Super Admin and Admin allowed)
CREATE OR REPLACE FUNCTION public.fetch_partner_coverage_matrix_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_auth_role TEXT;
  v_results JSONB;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  -- Verify Studio Admin Authorization (service_role bypasses)
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    IF v_caller_role NOT IN ('super_admin', 'admin') THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Studio administrative authorization required.');
    END IF;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'recommendation_id', recommendation_id,
      'partner_id', partner_id,
      'qualification_state', qualification_state,
      'participation_state', participation_state,
      'passport_state', passport_state,
      'routing_state', routing_state,
      'contact_email', contact_email,
      'contact_phone', contact_phone,
      'notes', notes,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_results
  FROM public.recommendation_partner_eligibility;

  RETURN jsonb_build_object(
    'success', TRUE,
    'matrix', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

-- 3. Secure Select & Release RPC (Final Production Release: SUPER ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.select_and_release_partner_coverage_secure(
  p_recommendation_id VARCHAR(100),
  p_partner_id VARCHAR(100),
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_auth_role TEXT;
  v_record public.recommendation_partner_eligibility%ROWTYPE;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  -- Verify Super Admin Authorization (service_role bypasses)
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    IF v_caller_role != 'super_admin' THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Super Admin authorization required for final Select & Release.');
    END IF;
  END IF;

  IF p_recommendation_id IS NULL OR TRIM(p_recommendation_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_REC_ID', 'message', 'Recommendation ID is required.');
  END IF;

  IF p_partner_id IS NULL OR TRIM(p_partner_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_PARTNER_ID', 'message', 'Partner ID is required.');
  END IF;

  -- Atomic Insert / Update
  INSERT INTO public.recommendation_partner_eligibility (
    recommendation_id,
    partner_id,
    qualification_state,
    participation_state,
    passport_state,
    routing_state,
    contact_email,
    contact_phone,
    updated_at
  ) VALUES (
    TRIM(p_recommendation_id),
    TRIM(p_partner_id),
    'idemo_selected'::public.qualification_state,
    'introduction_ready'::public.participation_state,
    'not_started'::public.passport_verification_state,
    'active'::public.routing_pool_state,
    NULLIF(TRIM(p_contact_email), ''),
    NULLIF(TRIM(p_contact_phone), ''),
    NOW()
  )
  ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
    qualification_state = 'idemo_selected'::public.qualification_state,
    participation_state = CASE 
      WHEN public.recommendation_partner_eligibility.participation_state = 'declined' THEN 'introduction_ready'::public.participation_state 
      ELSE public.recommendation_partner_eligibility.participation_state 
    END,
    routing_state = 'active'::public.routing_pool_state,
    contact_email = COALESCE(NULLIF(TRIM(p_contact_email), ''), public.recommendation_partner_eligibility.contact_email),
    contact_phone = COALESCE(NULLIF(TRIM(p_contact_phone), ''), public.recommendation_partner_eligibility.contact_phone),
    updated_at = NOW()
  RETURNING * INTO v_record;

  -- Log Audit Event
  BEGIN
    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    ) VALUES (
      COALESCE(auth.uid(), p_operator_id),
      'super_admin',
      'SELECT_AND_RELEASE_COVERAGE',
      'partner_coverage',
      v_record.id,
      'success',
      jsonb_build_object(
        'recommendation_id', p_recommendation_id,
        'partner_id', p_partner_id,
        'routing_state', v_record.routing_state,
        'participation_state', v_record.participation_state
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'record', jsonb_build_object(
      'id', v_record.id,
      'recommendation_id', v_record.recommendation_id,
      'partner_id', v_record.partner_id,
      'qualification_state', v_record.qualification_state,
      'participation_state', v_record.participation_state,
      'passport_state', v_record.passport_state,
      'routing_state', v_record.routing_state,
      'contact_email', v_record.contact_email,
      'contact_phone', v_record.contact_phone,
      'updated_at', v_record.updated_at
    )
  );
END;
$$;

-- 4. Secure Update Coverage Status RPC (Action-level authorization: release states require super_admin; edits/temporary suspension require super_admin or admin)
CREATE OR REPLACE FUNCTION public.update_partner_coverage_status_secure(
  p_recommendation_id VARCHAR(100),
  p_partner_id VARCHAR(100),
  p_routing_state public.routing_pool_state DEFAULT NULL,
  p_participation_state public.participation_state DEFAULT NULL,
  p_passport_state public.passport_verification_state DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_auth_role TEXT;
  v_record public.recommendation_partner_eligibility%ROWTYPE;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  -- Verify Authentication & Roles
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    -- Gate final release states to Super Admin only
    IF p_routing_state = 'active' THEN
      IF v_caller_role != 'super_admin' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Super Admin authorization required to activate routing.');
      END IF;
    ELSE
      -- Edits & temporary operational suspension allowed for super_admin and admin
      IF v_caller_role NOT IN ('super_admin', 'admin') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Studio administrative authorization required.');
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_record
  FROM public.recommendation_partner_eligibility
  WHERE recommendation_id = TRIM(p_recommendation_id)
    AND partner_id = TRIM(p_partner_id);

  IF v_record.id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND', 'message', 'Eligibility record not found.');
  END IF;

  UPDATE public.recommendation_partner_eligibility
  SET
    routing_state = COALESCE(p_routing_state, routing_state),
    participation_state = COALESCE(p_participation_state, participation_state),
    passport_state = COALESCE(p_passport_state, passport_state),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = v_record.id
  RETURNING * INTO v_record;

  -- Log Audit Event
  BEGIN
    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    ) VALUES (
      COALESCE(auth.uid(), p_operator_id),
      COALESCE(v_caller_role, 'admin'),
      'UPDATE_COVERAGE_STATUS',
      'partner_coverage',
      v_record.id,
      'success',
      jsonb_build_object(
        'recommendation_id', p_recommendation_id,
        'partner_id', p_partner_id,
        'new_routing_state', v_record.routing_state,
        'new_participation_state', v_record.participation_state,
        'new_passport_state', v_record.passport_state
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'record', jsonb_build_object(
      'id', v_record.id,
      'recommendation_id', v_record.recommendation_id,
      'partner_id', v_record.partner_id,
      'qualification_state', v_record.qualification_state,
      'participation_state', v_record.participation_state,
      'passport_state', v_record.passport_state,
      'routing_state', v_record.routing_state,
      'updated_at', v_record.updated_at
    )
  );
END;
$$;

-- 5. Atomic Replace Partner Coverage RPC (Single Database Transaction: SUPER ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.replace_partner_coverage_secure(
  p_recommendation_id VARCHAR(100),
  p_outgoing_partner_id VARCHAR(100),
  p_incoming_partner_id VARCHAR(100),
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_operator_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_auth_role TEXT;
  v_outgoing_record public.recommendation_partner_eligibility%ROWTYPE;
  v_incoming_record public.recommendation_partner_eligibility%ROWTYPE;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  -- Verify Super Admin Authorization (service_role bypasses)
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    IF v_caller_role != 'super_admin' THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Super Admin authorization required for final partner replacement.');
    END IF;
  END IF;

  IF p_recommendation_id IS NULL OR TRIM(p_recommendation_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_REC_ID', 'message', 'Recommendation ID is required.');
  END IF;

  IF p_outgoing_partner_id IS NULL OR TRIM(p_outgoing_partner_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_OUTGOING_ID', 'message', 'Outgoing Partner ID is required.');
  END IF;

  IF p_incoming_partner_id IS NULL OR TRIM(p_incoming_partner_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_INCOMING_ID', 'message', 'Incoming Partner ID is required.');
  END IF;

  -- Step A: Suspend outgoing partner relationship for this exact recommendation
  UPDATE public.recommendation_partner_eligibility
  SET
    routing_state = 'suspended'::public.routing_pool_state,
    participation_state = 'withdrawn'::public.participation_state,
    notes = COALESCE(p_notes, 'Replaced by ' || TRIM(p_incoming_partner_id)),
    updated_at = NOW()
  WHERE recommendation_id = TRIM(p_recommendation_id)
    AND partner_id = TRIM(p_outgoing_partner_id)
  RETURNING * INTO v_outgoing_record;

  -- Step B: Select & Release incoming partner relationship
  INSERT INTO public.recommendation_partner_eligibility (
    recommendation_id,
    partner_id,
    qualification_state,
    participation_state,
    passport_state,
    routing_state,
    contact_email,
    contact_phone,
    updated_at
  ) VALUES (
    TRIM(p_recommendation_id),
    TRIM(p_incoming_partner_id),
    'idemo_selected'::public.qualification_state,
    'introduction_ready'::public.participation_state,
    'not_started'::public.passport_verification_state,
    'active'::public.routing_pool_state,
    NULLIF(TRIM(p_contact_email), ''),
    NULLIF(TRIM(p_contact_phone), ''),
    NOW()
  )
  ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
    qualification_state = 'idemo_selected'::public.qualification_state,
    participation_state = CASE 
      WHEN public.recommendation_partner_eligibility.participation_state = 'declined' THEN 'introduction_ready'::public.participation_state 
      ELSE public.recommendation_partner_eligibility.participation_state 
    END,
    routing_state = 'active'::public.routing_pool_state,
    contact_email = COALESCE(NULLIF(TRIM(p_contact_email), ''), public.recommendation_partner_eligibility.contact_email),
    contact_phone = COALESCE(NULLIF(TRIM(p_contact_phone), ''), public.recommendation_partner_eligibility.contact_phone),
    updated_at = NOW()
  RETURNING * INTO v_incoming_record;

  -- Step C: Audit logging inside transaction
  BEGIN
    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    ) VALUES (
      COALESCE(auth.uid(), p_operator_id),
      'super_admin',
      'REPLACE_PARTNER_COVERAGE',
      'partner_coverage',
      v_incoming_record.id,
      'success',
      jsonb_build_object(
        'recommendation_id', p_recommendation_id,
        'outgoing_partner_id', p_outgoing_partner_id,
        'incoming_partner_id', p_incoming_partner_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Partner replacement executed atomically.',
    'outgoing_record', jsonb_build_object(
      'partner_id', v_outgoing_record.partner_id,
      'routing_state', v_outgoing_record.routing_state
    ),
    'incoming_record', jsonb_build_object(
      'partner_id', v_incoming_record.partner_id,
      'routing_state', v_incoming_record.routing_state
    )
  );
END;
$$;

-- Grant EXECUTE privileges to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.select_and_release_partner_coverage_secure TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_coverage_status_secure TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_partner_coverage_secure TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_partner_coverage_matrix_secure TO service_role, authenticated;

-- 6. Patch public.create_public_inquiry with strict stable identifier matching on recommendation_partner_eligibility
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
    -- LAYER A: Operational Qualification Gates
    -- LAYER B: Mandatory Exact Stable Identity Match on recommendation_partner_eligibility
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
        -- MANDATORY LAYER B GATE: Exact Stable Identity Match ONLY
        AND EXISTS (
            SELECT 1 FROM public.recommendation_partner_eligibility rpe
            WHERE rpe.recommendation_id = p_recommendation_id::text
              AND rpe.partner_id = p.id::text
              AND rpe.qualification_state = 'idemo_selected'::public.qualification_state
              AND rpe.routing_state = 'active'::public.routing_pool_state
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
        'expires_at', (pg_catalog.now() + v_expiry_interval)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID, UUID
) TO anon, authenticated, service_role;
