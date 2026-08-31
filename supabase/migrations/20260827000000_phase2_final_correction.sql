-- IDEMO PARTNER ROUTING ENGINE - PHASE 2 FINAL CORRECTION MIGRATION
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.3.2 (Phase 2 Live Supabase Remediation)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VISITOR FINAL CONFIRMATION (confirm_proposal)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirm_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_match_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_latest_resp RECORD;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and lock inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Validate current inquiry status (must be awaiting visitor resolution)
    IF v_inquiry.status != 'awaiting_visitor'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not awaiting visitor resolution';
    END IF;

    -- 3. Retrieve and lock target match
    SELECT id, status, partner_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND inquiry_id = p_inquiry_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;

    -- 4. State transition validation & idempotency checks
    IF v_match_rec.status = 'selected'::public.match_status THEN
        RAISE EXCEPTION 'Proposal already accepted';
    ELSIF v_match_rec.status != 'responded'::public.match_status THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 5. Retrieve latest submitted partner response for this match
    SELECT id, response_type, status INTO v_latest_resp
    FROM public.partner_responses
    WHERE match_id = p_match_id AND status = 'submitted'::public.partner_response_status
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_latest_resp.id IS NULL THEN
        RAISE EXCEPTION 'No active partner proposal found to confirm';
    END IF;

    IF v_latest_resp.response_type NOT IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type) THEN
        IF v_latest_resp.response_type = 'counter_by_visitor'::public.response_type THEN
            RAISE EXCEPTION 'Cannot confirm proposal while awaiting partner review of counter-date proposal';
        ELSE
            RAISE EXCEPTION 'Cannot confirm proposal with response type %', v_latest_resp.response_type;
        END IF;
    END IF;

    -- 6. Perform transactional updates
    -- Update match status to selected
    UPDATE public.inquiry_matches
    SET status = 'selected'::public.match_status
    WHERE id = p_match_id;

    -- Update partner response status to accepted_by_visitor
    UPDATE public.partner_responses
    SET status = 'accepted_by_visitor'::public.partner_response_status,
        updated_at = pg_catalog.now()
    WHERE match_id = p_match_id;

    -- Update inquiry status to confirmed
    UPDATE public.inquiries
    SET status = 'confirmed'::public.inquiry_status
    WHERE id = p_inquiry_id;

    -- 7. Insert immutable audit record
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'visitor_anonymous',
        'proposal_confirmed',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'action_type', 'confirm',
            'inquiry_id', p_inquiry_id,
            'match_id', p_match_id,
            'partner_id', v_match_rec.partner_id,
            'result', 'success'
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'inquiry_id', p_inquiry_id,
        'match_id', p_match_id,
        'status', 'confirmed'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. VISITOR CANDIDATE REJECTION (decline_proposal)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decline_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_match_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_latest_resp RECORD;
    v_reason_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and retrieve inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Validate current inquiry status (must be awaiting visitor resolution)
    IF v_inquiry.status != 'awaiting_visitor'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not awaiting visitor response';
    END IF;

    -- 3. Verify match ownership and lock row
    SELECT id, partner_id, status INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND inquiry_id = p_inquiry_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Proposal match not found or access denied';
    END IF;

    -- 4. Validate state (match must be responded)
    IF v_match_rec.status != 'responded'::public.match_status THEN
        RAISE EXCEPTION 'Cannot decline proposal in status %', v_match_rec.status;
    END IF;

    -- 5. Verify latest submitted partner response is a partner-originated proposal
    SELECT id, response_type INTO v_latest_resp
    FROM public.partner_responses
    WHERE match_id = p_match_id AND status = 'submitted'::public.partner_response_status
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_latest_resp.id IS NULL THEN
        RAISE EXCEPTION 'No active partner proposal found to decline';
    END IF;

    IF v_latest_resp.response_type NOT IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type) THEN
        IF v_latest_resp.response_type = 'counter_by_visitor'::public.response_type THEN
            RAISE EXCEPTION 'Cannot decline proposal while awaiting partner review of counter-date proposal';
        ELSE
            RAISE EXCEPTION 'Cannot decline proposal with response type %', v_latest_resp.response_type;
        END IF;
    END IF;

    -- 6. Clean decline reason text
    v_reason_clean := trim(p_reason);
    IF v_reason_clean = '' THEN
        v_reason_clean := NULL;
    END IF;

    -- 7. Perform transactional updates
    -- Update match status to declined
    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = p_match_id;

    -- Update partner response status to declined_by_visitor
    UPDATE public.partner_responses
    SET status = 'declined_by_visitor'::public.partner_response_status,
        updated_at = pg_catalog.now()
    WHERE match_id = p_match_id;

    -- Mark candidate status as skipped
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = p_inquiry_id AND partner_id = v_match_rec.partner_id;

    -- Return inquiry status to 'matching' so queue advances to next candidate
    UPDATE public.inquiries
    SET status = 'matching'::public.inquiry_status
    WHERE id = p_inquiry_id;

    -- 8. Insert immutable audit log
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'visitor_anonymous',
        'proposal_declined',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'action_type', 'decline_candidate',
            'inquiry_id', p_inquiry_id,
            'match_id', p_match_id,
            'partner_id', v_match_rec.partner_id,
            'reason_provided', (v_reason_clean IS NOT NULL),
            'result', 'success'
        )
    );

    -- 9. Advance queue to next candidate partner safely
    PERFORM public.advance_inquiry_queue(p_inquiry_id);

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'message', 'Candidate proposal declined; searching for next available partner.'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VISITOR 3-HOUR RESPONSE WINDOW EXPIRATION (process_expired_offers)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_expired_offers()
RETURNS INT AS $$
DECLARE
    v_match_rec RECORD;
    v_vis_rec RECORD;
    v_visitor_timeout INTERVAL;
    v_count INT := 0;
BEGIN
    -- 1. Expiry of unresponded partner offers
    FOR v_match_rec IN
        SELECT id, inquiry_id, partner_id
        FROM public.inquiry_matches
        WHERE status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          AND expires_at < pg_catalog.now()
        FOR UPDATE
    LOOP
        UPDATE public.inquiry_candidates
        SET candidate_status = 'skipped'::public.candidate_status
        WHERE inquiry_id = v_match_rec.inquiry_id 
          AND partner_id = v_match_rec.partner_id
          AND candidate_status = 'offered'::public.candidate_status;

        UPDATE public.inquiry_matches
        SET status = 'expired'::public.match_status
        WHERE id = v_match_rec.id;

        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'offer_expired',
            'inquiry_matches',
            v_match_rec.id,
            'success',
            pg_catalog.jsonb_build_object(
                'inquiry_id', v_match_rec.inquiry_id,
                'partner_id', v_match_rec.partner_id
            )
        );

        -- Deterministic queue advancement for partner offer timeout
        PERFORM public.advance_inquiry_queue(v_match_rec.inquiry_id);

        v_count := v_count + 1;
    END LOOP;

    -- 2. Expiry of 3-hour visitor decision window after partner response
    v_visitor_timeout := public.get_system_setting_interval('visitor_response_timeout', INTERVAL '3 hours');

    FOR v_vis_rec IN
        SELECT m.id AS match_id, m.inquiry_id, m.partner_id, latest_resp.created_at AS response_t0
        FROM public.inquiries i
        JOIN public.inquiry_matches m ON m.inquiry_id = i.id
        CROSS JOIN LATERAL (
            SELECT pr.id, pr.response_type, pr.status, pr.created_at
            FROM public.partner_responses pr
            WHERE pr.match_id = m.id AND pr.status = 'submitted'::public.partner_response_status
            ORDER BY pr.created_at DESC, pr.id DESC
            LIMIT 1
        ) latest_resp
        WHERE i.status = 'awaiting_visitor'::public.inquiry_status
          AND m.status = 'responded'::public.match_status
          AND latest_resp.response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
          AND latest_resp.created_at < pg_catalog.now() - v_visitor_timeout
        FOR UPDATE OF m
    LOOP
        -- Expire current offer match
        UPDATE public.inquiry_matches
        SET status = 'expired'::public.match_status
        WHERE id = v_vis_rec.match_id;

        -- Update partner response status to withdrawn (system timeout, not visitor decline)
        UPDATE public.partner_responses
        SET status = 'withdrawn'::public.partner_response_status,
            updated_at = pg_catalog.now()
        WHERE match_id = v_vis_rec.match_id;

        -- Skip candidate
        UPDATE public.inquiry_candidates
        SET candidate_status = 'skipped'::public.candidate_status
        WHERE inquiry_id = v_vis_rec.inquiry_id AND partner_id = v_vis_rec.partner_id;

        -- Revert inquiry to matching
        UPDATE public.inquiries
        SET status = 'matching'::public.inquiry_status
        WHERE id = v_vis_rec.inquiry_id;

        -- Audit log
        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'visitor_response_window_expired',
            'inquiry_matches',
            v_vis_rec.match_id,
            'success',
            pg_catalog.jsonb_build_object(
                'inquiry_id', v_vis_rec.inquiry_id,
                'partner_id', v_vis_rec.partner_id,
                'response_t0', v_vis_rec.response_t0,
                'timeout', v_visitor_timeout
            )
        );

        -- Advance queue to next candidate
        PERFORM public.advance_inquiry_queue(v_vis_rec.inquiry_id);

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. EXPLICIT PRIVILEGE REVOCATION & SERVICE_ROLE GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_expired_offers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_offers() TO service_role;
