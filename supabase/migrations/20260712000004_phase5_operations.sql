-- IDEMO PARTNER ROUTING ENGINE - PHASE 5: OPERATIONS & AUTOMATION MIGRATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.3.0 (Phase 5 Implementation)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. NOTIFICATION OUTBOX PATTERN DEFINITION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(50) NOT NULL, -- 'partner', 'visitor', 'concierge'
    recipient_id UUID,
    channel VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms', 'viber', 'push'
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'queued' NOT NULL, -- 'queued', 'processing', 'sent', 'failed'
    retry_count INT DEFAULT 0 NOT NULL,
    max_retries INT DEFAULT 3 NOT NULL,
    last_error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for high-frequency worker lookups
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_scheduled 
ON public.notification_outbox (status, scheduled_at);

-- Enable RLS to prevent unauthorized client access
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. QUEUE ADVANCEMENT SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.advance_inquiry_queue(p_inquiry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_inquiry_status public.inquiry_status;
    v_active_match_exists BOOLEAN;
    v_next_candidate RECORD;
    v_match_id UUID;
    v_expiry_interval INTERVAL := INTERVAL '2 hours';
BEGIN
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

    -- 3. Find the next queued candidate partner in deterministic queue order
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

        -- Create active offer (inquiry_match)
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
                'queue_order', v_next_candidate.queue_order
            )
        );

        RETURN true;
    ELSE
        -- 5. No queued candidate remains: transition to needs_assistance (Concierge Fallback)
        UPDATE public.inquiries
        SET status = 'needs_assistance'::public.inquiry_status
        WHERE id = p_inquiry_id;

        -- Update any offered candidates to exhausted (if any exist)
        UPDATE public.inquiry_candidates
        SET candidate_status = 'exhausted'::public.candidate_status
        WHERE inquiry_id = p_inquiry_id AND candidate_status = 'queued'::public.candidate_status;

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
                'reason', 'Queue exhausted'
            )
        );

        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. EXPIRY PROCESSING ENGINE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_expired_offers()
RETURNS INT AS $$
DECLARE
    v_match_rec RECORD;
    v_count INT := 0;
BEGIN
    -- Select all active matches that have expired, locking them
    FOR v_match_rec IN
        SELECT id, inquiry_id, partner_id
        FROM public.inquiry_matches
        WHERE status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          AND expires_at < pg_catalog.now()
        FOR UPDATE
    LOOP
        -- 1. Mark candidate skipped
        UPDATE public.inquiry_candidates
        SET candidate_status = 'skipped'::public.candidate_status
        WHERE inquiry_id = v_match_rec.inquiry_id 
          AND partner_id = v_match_rec.partner_id
          AND candidate_status = 'offered'::public.candidate_status;

        -- 2. Expire current offer
        UPDATE public.inquiry_matches
        SET status = 'expired'::public.match_status
        WHERE id = v_match_rec.id;

        -- 3. Write immutable audit entry
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
        
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. STATUS CHANGE AUTOMATION TRIGGER (AUTOMATES QUEUE ADVANCEMENT)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.on_inquiry_match_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If the match was declined or expired, advance the queue automatically
    IF (OLD.status IN ('offered'::public.match_status, 'viewed'::public.match_status) 
        AND NEW.status IN ('declined'::public.match_status, 'expired'::public.match_status)) THEN
        PERFORM public.advance_inquiry_queue(NEW.inquiry_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE TRIGGER trigger_advance_queue_on_status_change
AFTER UPDATE ON public.inquiry_matches
FOR EACH ROW
EXECUTE FUNCTION public.on_inquiry_match_status_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTOMATIC NOTIFICATION TRIGGER (OUTBOX ENQUEUER)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.on_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_pref VARCHAR(100);
    v_ref_code VARCHAR(12);
BEGIN
    -- 1. Notify Partner on New Offer
    IF TG_TABLE_NAME = 'inquiry_matches' THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'offered'::public.match_status) OR
           (TG_OP = 'UPDATE' AND OLD.status != 'offered'::public.match_status AND NEW.status = 'offered'::public.match_status) THEN
            
            -- Fetch partner preference
            SELECT contact_preference INTO v_contact_pref FROM public.partners WHERE id = NEW.partner_id;
            -- Fetch reference code of the inquiry
            SELECT public_reference_code INTO v_ref_code FROM public.inquiries WHERE id = NEW.inquiry_id;
            
            INSERT INTO public.notification_outbox (
                recipient_type,
                recipient_id,
                channel,
                payload
            ) VALUES (
                'partner',
                NEW.partner_id,
                COALESCE(LOWER(v_contact_pref), 'email'),
                pg_catalog.jsonb_build_object(
                    'title', 'New Opportunity Offered',
                    'body', 'You have received a new opportunity (' || COALESCE(v_ref_code, '') || '). Please review and respond before expiration.',
                    'match_id', NEW.id,
                    'inquiry_id', NEW.inquiry_id,
                    'public_reference_code', v_ref_code,
                    'expires_at', NEW.expires_at
                )
            );
        END IF;
    END IF;

    -- 2. Notify on Inquiry Status changes
    IF TG_TABLE_NAME = 'inquiries' THEN
        IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            -- Concierge fallback
            IF NEW.status = 'needs_assistance'::public.inquiry_status THEN
                INSERT INTO public.notification_outbox (
                    recipient_type,
                    recipient_id,
                    channel,
                    payload
                ) VALUES (
                    'concierge',
                    NEW.id,
                    'email',
                    pg_catalog.jsonb_build_object(
                        'title', 'Concierge Intervention Required',
                        'body', 'Inquiry ' || NEW.public_reference_code || ' has been escalated to concierge assistance.',
                        'inquiry_id', NEW.id,
                        'public_reference_code', NEW.public_reference_code
                    )
                );
            -- Awaiting visitor
            ELSIF NEW.status = 'awaiting_visitor'::public.inquiry_status THEN
                INSERT INTO public.notification_outbox (
                    recipient_type,
                    recipient_id,
                    channel,
                    payload
                ) VALUES (
                    'visitor',
                    NEW.id,
                    'email',
                    pg_catalog.jsonb_build_object(
                        'title', 'Partner Response Received',
                        'body', 'A partner has responded to your inquiry ' || NEW.public_reference_code || '. Please review and proceed.',
                        'inquiry_id', NEW.id,
                        'public_reference_code', NEW.public_reference_code
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE TRIGGER trigger_notification_on_match
AFTER INSERT OR UPDATE ON public.inquiry_matches
FOR EACH ROW
EXECUTE FUNCTION public.on_notification_trigger();

CREATE OR REPLACE TRIGGER trigger_notification_on_inquiry
AFTER UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.on_notification_trigger();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. OPERATIONAL WATCHDOG ENGINE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_operational_watchdog()
RETURNS INT AS $$
DECLARE
    v_stalled_rec RECORD;
    v_stuck_rec RECORD;
    v_failed_notif RECORD;
    v_resolved_count INT := 0;
BEGIN
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
          AND i.created_at < pg_catalog.now() - INTERVAL '15 minutes'
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

    -- 4. Detect notification retry exhaustion
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. SYSTEM MAINTENANCE & RETENTION ENGINE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_system_maintenance()
RETURNS VOID AS $$
BEGIN
    -- 1. Cleanup stale recovery rate limits (older than 24 hours)
    DELETE FROM public.recovery_rate_limits
    WHERE updated_at < pg_catalog.now() - INTERVAL '24 hours';

    -- 2. Cleanup Outbox history (older than 30 days)
    DELETE FROM public.notification_outbox
    WHERE status = 'sent' AND processed_at < pg_catalog.now() - INTERVAL '30 days';

    -- 3. Write immutable audit log for maintenance execution
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'system_cron',
        'system_maintenance_executed',
        'system_settings',
        '00000000-0000-0000-0000-000000000000'::uuid,
        'success',
        pg_catalog.jsonb_build_object(
            'executed_at', pg_catalog.now()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. OPERATIONAL METRICS REALTIME VIEW
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.operational_metrics_summary AS
SELECT
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiries), 0) AS inquiries_created,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches), 0) AS offers_issued,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'responded'::public.match_status), 0) AS offers_accepted,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'declined'::public.match_status), 0) AS offers_declined,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'expired'::public.match_status), 0) AS offers_expired,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiries WHERE status = 'needs_assistance'::public.inquiry_status), 0) AS concierge_fallback
;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. DEFENSE-IN-DEPTH SECURITY REVOCATION
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.advance_inquiry_queue(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_expired_offers() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_operational_watchdog() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_system_maintenance() FROM public, anon, authenticated;
