-- IDEMO PARTNER ROUTING ENGINE - 0.5 HOUR (30 MINUTE) OFFER EXPIRATION MIGRATION
-- Updates partner offer expiration interval to exactly 30 minutes (0.5 hrs)
-- Ensures automatic queue advancement (Partner 1 -> Partner 2 -> Partner 3 -> Needs Assistance)

CREATE OR REPLACE FUNCTION public.advance_inquiry_queue(p_inquiry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_inquiry_status public.inquiry_status;
    v_active_match_exists BOOLEAN;
    v_next_candidate RECORD;
    v_match_id UUID;
    v_expiry_interval INTERVAL := INTERVAL '30 minutes'; -- Enforce 0.5 hours (30 minutes) timeout
BEGIN
    -- 0. Clean up any expired offers for this inquiry first
    PERFORM public.process_expired_offers();

    -- 1. Lock the inquiry exclusively to prevent concurrent modification
    SELECT status INTO v_inquiry_status
    FROM public.inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry_status IS NULL THEN
        RAISE EXCEPTION 'Inquiry not found';
    END IF;

    -- Only advance queue if inquiry is in matching status
    IF v_inquiry_status != 'matching'::public.inquiry_status THEN
        RETURN false;
    END IF;

    -- 2. Verify that there is no active offer to preserve unique_active_match_per_inquiry
    SELECT EXISTS (
        SELECT 1 FROM public.inquiry_matches
        WHERE inquiry_id = p_inquiry_id
          AND status IN ('offered'::public.match_status, 'viewed'::public.match_status)
    ) INTO v_active_match_exists;

    IF v_active_match_exists THEN
        RETURN false;
    END IF;

    -- 3. Find the next queued candidate partner in deterministic queue order (Partner 1, Partner 2, Partner 3)
    SELECT partner_id, queue_order
    INTO v_next_candidate
    FROM public.inquiry_candidates
    WHERE inquiry_id = p_inquiry_id
      AND candidate_status = 'queued'::public.candidate_status
    ORDER BY queue_order ASC
    LIMIT 1
    FOR UPDATE;

    -- 4. If next candidate exists, activate them
    IF v_next_candidate.partner_id IS NOT NULL THEN
        -- Update candidate status to offered
        UPDATE public.inquiry_candidates
        SET candidate_status = 'offered'::public.candidate_status
        WHERE inquiry_id = p_inquiry_id AND partner_id = v_next_candidate.partner_id;

        -- Create active offer (inquiry_match) with 30-minute expiry (0.5 hours)
        INSERT INTO public.inquiry_matches (
            inquiry_id,
            partner_id,
            status,
            offered_at,
            expires_at
        ) VALUES (
            p_inquiry_id,
            v_next_candidate.partner_id,
            'offered'::public.match_status,
            pg_catalog.now(),
            pg_catalog.now() + v_expiry_interval
        )
        RETURNING id INTO v_match_id;

        -- Write immutable audit log
        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'queue_advanced',
            'inquiry_matches',
            v_match_id,
            'success',
            pg_catalog.jsonb_build_object(
                'inquiry_id', p_inquiry_id,
                'partner_id', v_next_candidate.partner_id,
                'queue_order', v_next_candidate.queue_order,
                'expires_in_minutes', 30
            )
        );

        RETURN true;
    ELSE
        -- 5. No queued candidate remains: transition to needs_assistance (Concierge Fallback / All Partners Engaged)
        UPDATE public.inquiries
        SET status = 'needs_assistance'::public.inquiry_status
        WHERE id = p_inquiry_id;

        -- Write immutable audit log for concierge fallback
        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'concierge_fallback_exhausted',
            'inquiries',
            p_inquiry_id,
            'success',
            pg_catalog.jsonb_build_object(
                'inquiry_id', p_inquiry_id,
                'reason', 'All eligible partners declined or expired'
            )
        );

        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
