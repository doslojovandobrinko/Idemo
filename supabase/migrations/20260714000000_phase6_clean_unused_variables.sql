-- Phase 6 — Clean Unused Variable Warnings
-- Removes unused variables in PL/pgSQL functions identified during database linting.

-- 1. get_visitor_active_proposal: Remove unused v_inquiry variable, use PERFORM for validation call
CREATE OR REPLACE FUNCTION public.get_visitor_active_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_response_rec RECORD;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and retrieve inquiry
    PERFORM public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Query the single active match currently in 'responded' state
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

    -- 3. Retrieve proposal parameters (completely protecting partner identification details to prevent PII leaks)
    SELECT id, response_type, message, proposed_start_at, proposed_end_at
    INTO v_response_rec
    FROM public.partner_responses
    WHERE match_id = v_match_rec.id AND status = 'submitted'::public.partner_response_status;

    IF v_response_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'proposal_found', false,
            'message', 'Proposal details not found or already resolved'
        );
    END IF;

    -- 4. Construct safe response
    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'proposal_found', true,
        'match_id', v_match_rec.id,
        'response_id', v_response_rec.id,
        'response_type', v_response_rec.response_type,
        'message', v_response_rec.message,
        'proposed_start_at', v_response_rec.proposed_start_at,
        'proposed_end_at', v_response_rec.proposed_end_at
    );

    -- [RULE EXCLUSION] Polling read operations are excluded from the immutable governance audit ledger.

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) TO service_role;


-- 2. dequeue_notifications: Remove unused v_lease_timeout and v_max_retries variables
CREATE OR REPLACE FUNCTION public.dequeue_notifications(p_limit integer)
RETURNS SETOF public.notification_outbox AS $$
DECLARE
    v_limit integer := p_limit;
BEGIN
    -- Bounded batch limit checking & clamping
    IF v_limit IS NULL OR v_limit <= 0 THEN
        v_limit := 10;
    ELSIF v_limit > 100 THEN
        v_limit := 100;
    END IF;

    RETURN QUERY
    WITH selected AS (
        SELECT id
        FROM public.notification_outbox
        WHERE (
            (status = 'queued' AND scheduled_at <= pg_catalog.now())
            OR (status = 'failed' AND retry_count < max_retries AND scheduled_at <= pg_catalog.now())
          )
        ORDER BY created_at ASC
        LIMIT v_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.notification_outbox o
    SET status = 'processing',
        updated_at = pg_catalog.now()
    FROM selected s
    WHERE o.id = s.id
    RETURNING o.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.dequeue_notifications(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dequeue_notifications(integer) TO service_role;


-- 3. run_operational_watchdog: Remove unused v_max_retries variable
CREATE OR REPLACE FUNCTION public.run_operational_watchdog()
RETURNS INT AS $$
DECLARE
    -- Stable, dedicated advisory lock key for IDEMO Operational Watchdog: 135792468
    v_lock_acquired BOOLEAN;
    v_stalled_rec RECORD;
    v_stuck_rec RECORD;
    v_failed_notif RECORD;
    v_resolved_count INT := 0;
    v_stalled_threshold INTERVAL;
    v_lease_timeout INTERVAL;
    v_retry_delay INTERVAL;
    v_next_retry INT;
    v_backoff INTERVAL;
BEGIN
    -- Acquire transaction-scoped advisory lock. Key represents the unique IDEMO watchdog lock.
    SELECT pg_catalog.pg_try_advisory_xact_lock(135792468) INTO v_lock_acquired;
    
    IF NOT v_lock_acquired THEN
        -- Exit safely without running any watchdog operations or writing successful run logs
        RETURN 0;
    END IF;

    -- Fetch dynamic operational settings from database
    v_stalled_threshold := public.get_system_setting_interval('stalled_inquiry_threshold', INTERVAL '15 minutes');
    v_lease_timeout := public.get_system_setting_interval('processing_lease_timeout', INTERVAL '10 minutes');
    v_retry_delay := public.get_system_setting_interval('notification_retry_delay', INTERVAL '5 minutes');

    -- 1. Automatically run the Expiry Processing first to clean up expired offers
    v_resolved_count := v_resolved_count + public.process_expired_offers();

    -- 2. Detect stalled inquiries (status 'matching' with no active offer but queued candidates remain)
    FOR v_stalled_rec IN
        SELECT i.id, i.public_reference_code
        FROM public.inquiries i
        WHERE i.status = 'matching'::public.inquiry_status
          AND NOT EXISTS (
              SELECT 1 FROM public.inquiry_matches m
              WHERE m.inquiry_id = i.id
                AND m.status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          )
          AND EXISTS (
              SELECT 1 FROM public.inquiry_candidates c
              WHERE c.inquiry_id = i.id
                AND c.candidate_status = 'queued'::public.candidate_status
          )
          AND i.created_at < pg_catalog.now() - v_stalled_threshold
    LOOP
        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'watchdog_stalled_inquiry_detected',
            'inquiries',
            v_stalled_rec.id,
            'success',
            pg_catalog.jsonb_build_object(
                'public_reference_code', v_stalled_rec.public_reference_code,
                'message', 'Inquiry was found in matching status with no active offer but queued candidates remain. Attempting recovery.'
            )
        );

        -- Attempt recovery by advancing queue
        PERFORM public.advance_inquiry_queue(v_stalled_rec.id);
        v_resolved_count := v_resolved_count + 1;
    END LOOP;

    -- 3. Detect failed queue advancement (status 'matching' but no active offer and NO candidate is queued/offered)
    FOR v_stuck_rec IN
        SELECT i.id, i.public_reference_code
        FROM public.inquiries i
        WHERE i.status = 'matching'::public.inquiry_status
          AND NOT EXISTS (
              SELECT 1 FROM public.inquiry_matches m
              WHERE m.inquiry_id = i.id
                AND m.status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.inquiry_candidates c
              WHERE c.inquiry_id = i.id
                AND c.candidate_status IN ('queued'::public.candidate_status, 'offered'::public.candidate_status)
          )
    LOOP
        -- Transition to needs_assistance (Concierge Fallback)
        UPDATE public.inquiries
        SET status = 'needs_assistance'::public.inquiry_status
        WHERE id = v_stuck_rec.id;

        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'watchdog_failed_advancement_fallback',
            'inquiries',
            v_stuck_rec.id,
            'success',
            pg_catalog.jsonb_build_object(
                'public_reference_code', v_stuck_rec.public_reference_code,
                'message', 'Inquiry has matching status but zero queued/offered candidates and no active offer. Escalated.'
            )
        );
        v_resolved_count := v_resolved_count + 1;
    END LOOP;

    -- 4. Detect notification retry exhaustion or expired processing leases
    -- Expired processing lease detection & recovery
    FOR v_failed_notif IN
        SELECT n.id, n.retry_count, n.max_retries, n.recipient_type, n.recipient_id, n.channel
        FROM public.notification_outbox n
        WHERE n.status = 'processing'
          AND n.updated_at < pg_catalog.now() - v_lease_timeout
    LOOP
        v_next_retry := v_failed_notif.retry_count + 1;
        
        IF v_next_retry >= v_failed_notif.max_retries THEN
            -- Transition to terminal failure
            UPDATE public.notification_outbox
            SET status = 'permanently_failed',
                retry_count = v_next_retry,
                last_error_code = 'LEASE_EXPIRED_TERMINAL',
                last_error = 'Processing lease expired and retry limit reached.',
                updated_at = pg_catalog.now()
            WHERE id = v_failed_notif.id;

            INSERT INTO public.audit_logs (
                actor_role,
                action,
                resource_type,
                resource_id,
                result,
                safe_metadata
            ) VALUES (
                'system_cron',
                'watchdog_notification_exhausted_alert',
                'notification_outbox',
                v_failed_notif.id,
                'success',
                pg_catalog.jsonb_build_object(
                    'recipient_type', v_failed_notif.recipient_type,
                    'recipient_id', v_failed_notif.recipient_id,
                    'channel', v_failed_notif.channel,
                    'message', 'Notification processing lease expired and retry limit reached.'
                )
            );
        ELSE
            -- Bounded next retry with backoff delay
            v_backoff := v_next_retry * v_retry_delay;
            UPDATE public.notification_outbox
            SET status = 'failed',
                retry_count = v_next_retry,
                scheduled_at = pg_catalog.now() + v_backoff,
                last_error_code = 'LEASE_EXPIRED_RETRY',
                last_error = 'Processing lease expired. Scheduled for retry.',
                updated_at = pg_catalog.now()
            WHERE id = v_failed_notif.id;
        END IF;

        v_resolved_count := v_resolved_count + 1;
    END LOOP;

    -- Detect standard failed notifications that have exhausted their retry limits
    FOR v_failed_notif IN
        SELECT n.id, n.recipient_type, n.recipient_id, n.channel
        FROM public.notification_outbox n
        WHERE n.status = 'failed'
          AND n.retry_count >= n.max_retries
          AND NOT EXISTS (
              SELECT 1 FROM public.audit_logs a
              WHERE a.action = 'watchdog_notification_exhausted_alert'
                AND a.resource_id = n.id
          )
    LOOP
        -- Transition to terminal failure status to complete outbox state machine
        UPDATE public.notification_outbox
        SET status = 'permanently_failed',
            last_error_code = 'RETRY_LIMIT_EXHAUSTED',
            updated_at = pg_catalog.now()
        WHERE id = v_failed_notif.id;

        INSERT INTO public.audit_logs (
            actor_role,
            action,
            resource_type,
            resource_id,
            result,
            safe_metadata
        ) VALUES (
            'system_cron',
            'watchdog_notification_exhausted_alert',
            'notification_outbox',
            v_failed_notif.id,
            'success',
            pg_catalog.jsonb_build_object(
                'recipient_type', v_failed_notif.recipient_type,
                'recipient_id', v_failed_notif.recipient_id,
                'channel', v_failed_notif.channel,
                'message', 'Notification retry limit exhausted.'
            )
        );
        v_resolved_count := v_resolved_count + 1;
    END LOOP;

    RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.run_operational_watchdog() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_operational_watchdog() TO service_role;
