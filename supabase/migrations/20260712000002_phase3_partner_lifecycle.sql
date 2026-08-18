-- IDEMO PARTNER ROUTING ENGINE - PHASE 3: PARTNER OPPORTUNITY LIFECYCLE MIGRATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.2.0 (Phase 3 Implementation)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VIEW OPPORTUNITY FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.view_opportunity(p_match_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_partner_id UUID;
    v_partner_status public.partner_status;
    v_match_rec RECORD;
    v_result JSONB;
BEGIN
    -- 1. Authentication and caller partner resolution
    v_partner_id := public.get_current_partner_id();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Partner profile not found or unauthorized';
    END IF;

    -- 2. Partner status verification
    SELECT status INTO v_partner_status FROM public.partners WHERE id = v_partner_id;
    IF v_partner_status IS NULL OR v_partner_status != 'active'::public.partner_status THEN
        RAISE EXCEPTION 'Partner is not in active status';
    END IF;

    -- 3. Match retrieval, ownership verification and locking
    SELECT id, status, expires_at, inquiry_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND partner_id = v_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;

    -- 4. Expiration check
    IF v_match_rec.expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Opportunity has expired';
    END IF;

    -- 5. Idempotent state transition validation
    IF v_match_rec.status = 'viewed'::public.match_status THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'match_id', p_match_id,
            'status', 'viewed',
            'message', 'Opportunity already marked as viewed'
        );
    ELSIF v_match_rec.status != 'offered'::public.match_status THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 6. Perform status update
    UPDATE public.inquiry_matches
    SET status = 'viewed'::public.match_status,
        viewed_at = pg_catalog.now()
    WHERE id = p_match_id;

    -- 7. Strict immutable audit log write
    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_partner_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        auth.uid(),
        v_partner_id,
        'partner',
        'opportunity_viewed',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', v_match_rec.inquiry_id,
            'partner_id', v_partner_id
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'viewed'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ACCEPT OPPORTUNITY FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_opportunity(p_match_id UUID, p_message TEXT)
RETURNS JSONB AS $$
DECLARE
    v_partner_id UUID;
    v_partner_status public.partner_status;
    v_match_rec RECORD;
    v_inquiry_rec RECORD;
    v_message_clean TEXT;
    v_response_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Authentication and caller partner resolution
    v_partner_id := public.get_current_partner_id();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Partner profile not found or unauthorized';
    END IF;

    -- 2. Partner status verification
    SELECT status INTO v_partner_status FROM public.partners WHERE id = v_partner_id;
    IF v_partner_status IS NULL OR v_partner_status != 'active'::public.partner_status THEN
        RAISE EXCEPTION 'Partner is not in active status';
    END IF;

    -- 3. Match retrieval, ownership verification and locking
    SELECT id, status, expires_at, inquiry_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND partner_id = v_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;

    -- 4. Expiration check
    IF v_match_rec.expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Opportunity has expired';
    END IF;

    -- 5. Match status validation (must be offered or viewed)
    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 6. Associated inquiry retrieval and lock
    SELECT id, status, requested_start_at, requested_end_at INTO v_inquiry_rec
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    -- 7. Inquiry status validation
    IF v_inquiry_rec.status != 'matching'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not in matching phase';
    END IF;

    -- 8. Message validation
    v_message_clean := trim(p_message);
    IF v_message_clean IS NULL OR v_message_clean = '' THEN
        RAISE EXCEPTION 'Response message cannot be empty';
    END IF;

    IF pg_catalog.length(v_message_clean) > 2000 THEN
        RAISE EXCEPTION 'Response message exceeds maximum limit of 2000 characters';
    END IF;

    -- 9. Insert Partner Response
    INSERT INTO public.partner_responses (
        match_id,
        response_type,
        message,
        proposed_start_at,
        proposed_end_at,
        status
    ) VALUES (
        p_match_id,
        'accept_as_requested'::public.response_type,
        v_message_clean,
        v_inquiry_rec.requested_start_at,
        v_inquiry_rec.requested_end_at,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_response_id;

    -- 10. Update match status to 'responded'
    UPDATE public.inquiry_matches
    SET status = 'responded'::public.match_status
    WHERE id = p_match_id;

    -- 11. Update inquiry status to 'awaiting_visitor'
    UPDATE public.inquiries
    SET status = 'awaiting_visitor'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    -- 12. Strict immutable audit log write
    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_partner_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        auth.uid(),
        v_partner_id,
        'partner',
        'opportunity_accepted',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', v_match_rec.inquiry_id,
            'partner_id', v_partner_id,
            'response_id', v_response_id
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'response_id', v_response_id,
        'status', 'responded'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROPOSE ALTERNATIVE OPPORTUNITY FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.propose_alternative_opportunity(
    p_match_id UUID,
    p_message TEXT,
    p_proposed_start TIMESTAMP WITH TIME ZONE,
    p_proposed_end TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB AS $$
DECLARE
    v_partner_id UUID;
    v_partner_status public.partner_status;
    v_match_rec RECORD;
    v_inquiry_status public.inquiry_status;
    v_message_clean TEXT;
    v_response_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Authentication and caller partner resolution
    v_partner_id := public.get_current_partner_id();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Partner profile not found or unauthorized';
    END IF;

    -- 2. Partner status verification
    SELECT status INTO v_partner_status FROM public.partners WHERE id = v_partner_id;
    IF v_partner_status IS NULL OR v_partner_status != 'active'::public.partner_status THEN
        RAISE EXCEPTION 'Partner is not in active status';
    END IF;

    -- 3. Match retrieval, ownership verification and locking
    SELECT id, status, expires_at, inquiry_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND partner_id = v_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;

    -- 4. Expiration check
    IF v_match_rec.expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Opportunity has expired';
    END IF;

    -- 5. Match status validation (must be offered or viewed)
    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 6. Associated inquiry retrieval and lock
    SELECT status INTO v_inquiry_status
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    -- 7. Inquiry status validation
    IF v_inquiry_status != 'matching'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not in matching phase';
    END IF;

    -- 8. Message validation
    v_message_clean := trim(p_message);
    IF v_message_clean IS NULL OR v_message_clean = '' THEN
        RAISE EXCEPTION 'Response message cannot be empty';
    END IF;

    IF pg_catalog.length(v_message_clean) > 2000 THEN
        RAISE EXCEPTION 'Response message exceeds maximum limit of 2000 characters';
    END IF;

    -- 9. Proposed dates validation
    IF p_proposed_start IS NULL OR p_proposed_end IS NULL THEN
        RAISE EXCEPTION 'Proposed dates cannot be null';
    END IF;

    IF p_proposed_start < pg_catalog.now() - INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Proposed start time cannot be in the past';
    END IF;

    IF p_proposed_end <= p_proposed_start THEN
        RAISE EXCEPTION 'Proposed end time must be after start time';
    END IF;

    -- 10. Insert Partner Response
    INSERT INTO public.partner_responses (
        match_id,
        response_type,
        message,
        proposed_start_at,
        proposed_end_at,
        status
    ) VALUES (
        p_match_id,
        'propose_alternative'::public.response_type,
        v_message_clean,
        p_proposed_start,
        p_proposed_end,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_response_id;

    -- 11. Update match status to 'responded'
    UPDATE public.inquiry_matches
    SET status = 'responded'::public.match_status
    WHERE id = p_match_id;

    -- 12. Update inquiry status to 'awaiting_visitor'
    UPDATE public.inquiries
    SET status = 'awaiting_visitor'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    -- 13. Strict immutable audit log write
    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_partner_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        auth.uid(),
        v_partner_id,
        'partner',
        'opportunity_alternative_proposed',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', v_match_rec.inquiry_id,
            'partner_id', v_partner_id,
            'response_id', v_response_id,
            'proposed_start_at', p_proposed_start,
            'proposed_end_at', p_proposed_end
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'response_id', v_response_id,
        'status', 'responded'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DECLINE OPPORTUNITY FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decline_opportunity(p_match_id UUID, p_message TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_partner_id UUID;
    v_partner_status public.partner_status;
    v_match_rec RECORD;
    v_inquiry_status public.inquiry_status;
    v_message_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Authentication and caller partner resolution
    v_partner_id := public.get_current_partner_id();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Partner profile not found or unauthorized';
    END IF;

    -- 2. Partner status verification
    SELECT status INTO v_partner_status FROM public.partners WHERE id = v_partner_id;
    IF v_partner_status IS NULL OR v_partner_status != 'active'::public.partner_status THEN
        RAISE EXCEPTION 'Partner is not in active status';
    END IF;

    -- 3. Match retrieval, ownership verification and locking
    SELECT id, status, expires_at, inquiry_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND partner_id = v_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;

    -- 4. Expiration check
    IF v_match_rec.expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Opportunity has expired';
    END IF;

    -- 5. Match status validation (must be offered or viewed)
    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 6. Associated inquiry retrieval and lock
    SELECT status INTO v_inquiry_status
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    -- 7. Inquiry status validation
    IF v_inquiry_status != 'matching'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not in matching phase';
    END IF;

    -- 8. Clean decline message if provided
    v_message_clean := trim(p_message);
    IF v_message_clean = '' THEN
        v_message_clean := NULL;
    END IF;

    -- 9. Update match status to 'declined'
    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = p_match_id;

    -- 10. Update candidate status in public.inquiry_candidates to 'skipped'
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_match_rec.inquiry_id AND partner_id = v_partner_id;

    -- 11. Strict immutable audit log write
    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_partner_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        auth.uid(),
        v_partner_id,
        'partner',
        'opportunity_declined',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', v_match_rec.inquiry_id,
            'partner_id', v_partner_id,
            'decline_reason', v_message_clean
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'declined'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EXPLICIT GRANTS MATRIX AND DEFENSE-IN-DEPTH
-- ─────────────────────────────────────────────────────────────────────────────

-- Explicitly revoke execute from public to guarantee absolute security
REVOKE EXECUTE ON FUNCTION public.view_opportunity(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_opportunity(UUID, TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.propose_alternative_opportunity(UUID, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decline_opportunity(UUID, TEXT) FROM public, anon, authenticated;

-- Grant execution to authenticated users only (partners)
GRANT EXECUTE ON FUNCTION public.view_opportunity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_opportunity(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_alternative_opportunity(UUID, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_opportunity(UUID, TEXT) TO authenticated;
