-- IDEMO PARTNER ROUTING ENGINE - PHASE 2 REMEDIATION MIGRATION
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.3.2 (Phase 2 Remediation & Specification Adherence)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VISITOR CANDIDATE REJECTION (decline_proposal)
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
-- 2. EXPLICIT VISITOR INQUIRY CANCELLATION (cancel_inquiry_by_visitor)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_inquiry_by_visitor(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_reason_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and retrieve inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- Lock inquiry for update
    SELECT status INTO v_inquiry.status
    FROM public.inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry.status IN ('completed'::public.inquiry_status, 'canceled'::public.inquiry_status) THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'message', 'Inquiry is already resolved or canceled.'
        );
    END IF;

    v_reason_clean := trim(p_reason);
    IF v_reason_clean = '' THEN
        v_reason_clean := NULL;
    END IF;

    -- Update inquiry status to canceled
    UPDATE public.inquiries
    SET status = 'canceled'::public.inquiry_status
    WHERE id = p_inquiry_id;

    -- Invalidate active/open matches for this inquiry
    UPDATE public.inquiry_matches
    SET status = 'not_selected'::public.match_status
    WHERE inquiry_id = p_inquiry_id
      AND status IN ('offered'::public.match_status, 'viewed'::public.match_status, 'responded'::public.match_status);

    -- Invalidate remaining candidates
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = p_inquiry_id
      AND candidate_status IN ('queued'::public.candidate_status, 'offered'::public.candidate_status);

    -- Insert audit record
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'visitor_anonymous',
        'inquiry_canceled_by_visitor',
        'inquiries',
        p_inquiry_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', p_inquiry_id,
            'reason_provided', (v_reason_clean IS NOT NULL)
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'message', 'Inquiry canceled successfully.'
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
    -- Authoritative T0 = partner_responses.created_at for the LATEST submitted partner response awaiting visitor action.
    -- If the single latest response is 'counter_by_visitor', system is awaiting partner review, so visitor decision timer is dormant.
    -- If partner accepts visitor counter (inserts 'accept_as_requested'), latest_resp becomes that acceptance row, giving visitor a fresh 3h window.
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
-- 4. VISITOR COUNTER-DATE PROPOSAL (counter_proposal_by_visitor)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.counter_proposal_by_visitor(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_match_id UUID,
    p_proposed_start TIMESTAMP WITH TIME ZONE,
    p_proposed_end TIMESTAMP WITH TIME ZONE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_counter_count INT;
    v_response_id UUID;
    v_notes_clean TEXT;
BEGIN
    -- 1. Validate caller identity
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    IF v_inquiry.status != 'awaiting_visitor'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not currently awaiting visitor response';
    END IF;

    -- 2. Validate match
    SELECT id, partner_id, status
    INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND inquiry_id = p_inquiry_id AND status = 'responded'::public.match_status
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Active responded proposal not found for this inquiry';
    END IF;

    -- 3. Enforce maximum of ONE visitor counter per candidate match
    SELECT COUNT(*) INTO v_counter_count
    FROM public.partner_responses
    WHERE match_id = p_match_id AND response_type = 'counter_by_visitor'::public.response_type;

    IF v_counter_count > 0 THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'message', 'Maximum of one counter-date proposal permitted per partner offer.'
        );
    END IF;

    -- Validate dates
    IF p_proposed_start IS NULL OR p_proposed_end IS NULL THEN
        RAISE EXCEPTION 'Proposed start and end times are required.';
    END IF;

    IF p_proposed_end <= p_proposed_start THEN
        RAISE EXCEPTION 'End time must be strictly after start time.';
    END IF;

    v_notes_clean := COALESCE(trim(p_notes), 'Visitor proposed alternative dates');

    -- 4. Insert visitor counter response
    INSERT INTO public.partner_responses (
        match_id,
        response_type,
        message,
        proposed_start_at,
        proposed_end_at,
        status
    ) VALUES (
        p_match_id,
        'counter_by_visitor'::public.response_type,
        v_notes_clean,
        p_proposed_start,
        p_proposed_end,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_response_id;

    -- Inquiry status remains 'awaiting_visitor' and match status remains 'responded'
    -- Insert audit log
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'visitor_anonymous',
        'visitor_counter_date_submitted',
        'partner_responses',
        v_response_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', p_inquiry_id,
            'match_id', p_match_id,
            'partner_id', v_match_rec.partner_id,
            'proposed_start', p_proposed_start,
            'proposed_end', p_proposed_end
        )
    );

    -- Notify partner via outbox
    INSERT INTO public.notification_outbox (
        recipient_type,
        recipient_id,
        channel,
        payload
    ) VALUES (
        'partner',
        v_match_rec.partner_id,
        'email',
        pg_catalog.jsonb_build_object(
            'title', 'Visitor Counter Proposal Received',
            'body', 'The visitor has proposed an alternative date/time for inquiry ' || v_inquiry.public_reference_code || '. Please review and respond in your Partner Portal.',
            'match_id', p_match_id,
            'inquiry_id', p_inquiry_id
        )
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'response_id', v_response_id,
        'message', 'Counter date proposal submitted to partner.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PARTNER ACCEPTS VISITOR COUNTER (accept_partner_counter_offer_secure)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_partner_counter_offer_secure(
    p_partner_id UUID,
    p_match_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_counter_resp RECORD;
    v_new_resp_id UUID;
    v_must_change BOOLEAN;
BEGIN
    SELECT must_change_pin INTO v_must_change FROM public.partners WHERE id = p_partner_id;
    IF v_must_change IS TRUE THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PIN_CHANGE_REQUIRED', 'message', 'You must replace your temporary PIN before continuing.');
    END IF;

    SELECT m.id, m.status, m.inquiry_id
    INTO v_match_rec
    FROM public.inquiry_matches m
    WHERE m.id = p_match_id AND m.partner_id = p_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity not found or access denied.');
    END IF;

    IF v_match_rec.status != 'responded'::public.match_status THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity is not in responded state.');
    END IF;

    -- Fetch latest counter proposal from visitor
    SELECT id, proposed_start_at, proposed_end_at, response_type
    INTO v_counter_resp
    FROM public.partner_responses
    WHERE match_id = p_match_id AND status = 'submitted'::public.partner_response_status
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_counter_resp.id IS NULL OR v_counter_resp.response_type != 'counter_by_visitor'::public.response_type THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'No active visitor counter proposal found for this opportunity.');
    END IF;

    -- Insert partner acceptance response reflecting visitor's counter dates
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
        'Partner accepted visitor proposed counter date/time',
        v_counter_resp.proposed_start_at,
        v_counter_resp.proposed_end_at,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_new_resp_id;

    -- CRITICAL AMENDMENT RULE:
    -- Partner accepting counter does NOT produce MATCH_CONFIRMED.
    -- inquiries.status remains 'awaiting_visitor'
    -- match.status remains 'responded'
    -- Contact details are NOT disclosed until visitor performs final confirm_proposal.

    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'partner',
        'partner_accepted_visitor_counter',
        'partner_responses',
        v_new_resp_id,
        'success',
        pg_catalog.jsonb_build_object(
            'partner_id', p_partner_id,
            'match_id', p_match_id,
            'proposed_start', v_counter_resp.proposed_start_at,
            'proposed_end', v_counter_resp.proposed_end_at
        )
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'response_id', v_new_resp_id,
        'message', 'Counter date proposal accepted. Awaiting final visitor confirmation.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PARTNER REJECTS VISITOR COUNTER (decline_partner_counter_offer_secure)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decline_partner_counter_offer_secure(
    p_partner_id UUID,
    p_match_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_must_change BOOLEAN;
BEGIN
    SELECT must_change_pin INTO v_must_change FROM public.partners WHERE id = p_partner_id;
    IF v_must_change IS TRUE THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PIN_CHANGE_REQUIRED', 'message', 'You must replace your temporary PIN before continuing.');
    END IF;

    SELECT m.id, m.status, m.inquiry_id
    INTO v_match_rec
    FROM public.inquiry_matches m
    WHERE m.id = p_match_id AND m.partner_id = p_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity not found or access denied.');
    END IF;

    IF v_match_rec.status != 'responded'::public.match_status THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity is not in responded state.');
    END IF;

    -- Set match status to declined
    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = p_match_id;

    -- Update partner response status to withdrawn (partner rejected counter)
    UPDATE public.partner_responses
    SET status = 'withdrawn'::public.partner_response_status,
        updated_at = pg_catalog.now()
    WHERE match_id = p_match_id;

    -- Skip candidate
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_match_rec.inquiry_id AND partner_id = p_partner_id;

    -- Revert inquiry status to matching
    UPDATE public.inquiries
    SET status = 'matching'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'partner',
        'partner_declined_visitor_counter',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'partner_id', p_partner_id,
            'match_id', p_match_id,
            'reason', p_reason
        )
    );

    -- Advance queue to next candidate
    PERFORM public.advance_inquiry_queue(v_match_rec.inquiry_id);

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'message', 'Counter date proposal declined. Searching for next available partner.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PARTNER WITHDRAWAL BEFORE VISITOR CONFIRMATION (withdraw_partner_opportunity_secure)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.withdraw_partner_opportunity_secure(
    p_partner_id UUID,
    p_match_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_inquiry_rec RECORD;
    v_must_change BOOLEAN;
BEGIN
    SELECT must_change_pin INTO v_must_change FROM public.partners WHERE id = p_partner_id;
    IF v_must_change IS TRUE THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PIN_CHANGE_REQUIRED', 'message', 'You must replace your temporary PIN before continuing.');
    END IF;

    SELECT m.id, m.status, m.inquiry_id
    INTO v_match_rec
    FROM public.inquiry_matches m
    WHERE m.id = p_match_id AND m.partner_id = p_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity not found or access denied.');
    END IF;

    -- Check inquiry status
    SELECT id, status INTO v_inquiry_rec
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    -- Partner withdrawal allowed ONLY before visitor confirmation (inquiry in awaiting_visitor phase)
    IF v_inquiry_rec.status != 'awaiting_visitor'::public.inquiry_status OR v_match_rec.status != 'responded'::public.match_status THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Withdrawal is permitted only before visitor confirmation.');
    END IF;

    -- Update match status to withdrawn
    UPDATE public.inquiry_matches
    SET status = 'withdrawn'::public.match_status
    WHERE id = p_match_id;

    -- Update partner responses status
    UPDATE public.partner_responses
    SET status = 'withdrawn'::public.partner_response_status,
        updated_at = pg_catalog.now()
    WHERE match_id = p_match_id;

    -- Skip candidate
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_match_rec.inquiry_id AND partner_id = p_partner_id;

    -- Revert inquiry to matching phase
    UPDATE public.inquiries
    SET status = 'matching'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'partner',
        'partner_withdrew_accepted_opportunity',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'partner_id', p_partner_id,
            'match_id', p_match_id,
            'reason', p_reason
        )
    );

    -- Advance queue to next candidate
    PERFORM public.advance_inquiry_queue(v_match_rec.inquiry_id);

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'message', 'Opportunity withdrawn successfully. Queue advanced to next candidate.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VISITOR FINAL CONFIRMATION (confirm_proposal)
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
-- 9. EDITORIAL LABEL FOR CANDIDATE EXHAUSTION & GET ACTIVE PROPOSAL UPDATE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_visitor_inquiry_status(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_visitor_status TEXT;
    v_result JSONB;
BEGIN
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    v_visitor_status := CASE v_inquiry.status
        WHEN 'new' THEN 'Preparing your request'
        WHEN 'matching' THEN 'Finding suitable local assistance'
        WHEN 'awaiting_visitor' THEN 'Waiting for confirmation'
        WHEN 'confirmed' THEN 'Your arrangement request has been accepted'
        WHEN 'in_progress' THEN 'Your arrangement is in progress'
        WHEN 'completed' THEN 'Completed'
        WHEN 'canceled' THEN 'Canceled'
        WHEN 'needs_assistance' THEN 'All suitable partners are currently engaged. Please try again later.'
        WHEN 'closed' THEN 'All suitable partners are currently engaged. Please try again later.'
        ELSE 'Processing your request'
    END;

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'inquiry_id', v_inquiry.id,
        'public_reference_code', v_inquiry.public_reference_code,
        'status', v_inquiry.status,
        'visitor_status_label', v_visitor_status,
        'requested_start_at', v_inquiry.requested_start_at,
        'requested_end_at', v_inquiry.requested_end_at,
        'created_at', v_inquiry.created_at
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_visitor_active_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_response_rec RECORD;
    v_has_countered BOOLEAN := false;
    v_result JSONB;
BEGIN
    PERFORM public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    SELECT id, status INTO v_match_rec
    FROM public.inquiry_matches
    WHERE inquiry_id = p_inquiry_id AND status = 'responded'::public.match_status
    LIMIT 1;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'proposal_found', false,
            'message', 'No active proposal found'
        );
    END IF;

    -- Fetch latest active response for this match
    SELECT id, response_type, message, proposed_start_at, proposed_end_at, created_at
    INTO v_response_rec
    FROM public.partner_responses
    WHERE match_id = v_match_rec.id AND status = 'submitted'::public.partner_response_status
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_response_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'proposal_found', false,
            'message', 'Proposal details not found or already resolved'
        );
    END IF;

    -- Check if visitor has already submitted 1 counter date proposal for this match
    SELECT EXISTS (
        SELECT 1 FROM public.partner_responses
        WHERE match_id = v_match_rec.id AND response_type = 'counter_by_visitor'::public.response_type
    ) INTO v_has_countered;

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'proposal_found', true,
        'match_id', v_match_rec.id,
        'response_id', v_response_rec.id,
        'response_type', v_response_rec.response_type,
        'message', v_response_rec.message,
        'proposed_start_at', v_response_rec.proposed_start_at,
        'proposed_end_at', v_response_rec.proposed_end_at,
        'created_at', v_response_rec.created_at, -- Authoritative T0 timestamp for 3-hour countdown
        'has_countered', v_has_countered
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. EXPLICIT PRIVILEGE REVOCATION & SERVICE_ROLE GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cancel_inquiry_by_visitor(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_inquiry_by_visitor(UUID, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_expired_offers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_offers() TO service_role;

REVOKE EXECUTE ON FUNCTION public.counter_proposal_by_visitor(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.counter_proposal_by_visitor(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.accept_partner_counter_offer_secure(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_partner_counter_offer_secure(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.decline_partner_counter_offer_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_partner_counter_offer_secure(UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.withdraw_partner_opportunity_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_partner_opportunity_secure(UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_visitor_inquiry_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_inquiry_status(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) TO service_role;
