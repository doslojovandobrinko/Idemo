-- IDEMO PARTNER ROUTING ENGINE - PHASE 5: ADDITIONAL RELIABILITY MIGRATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.3.1 (Phase 5 Final Reliability Implementation with Externalized System Settings)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SYSTEM SETTINGS TYPED HELPERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_system_setting(p_key VARCHAR, p_default TEXT)
RETURNS TEXT AS $$
DECLARE
    v_val TEXT;
BEGIN
    SELECT value INTO v_val
    FROM public.system_settings
    WHERE key = p_key;
    
    RETURN COALESCE(v_val, p_default);
EXCEPTION
    WHEN OTHERS THEN
        RETURN p_default;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_system_setting_interval(p_key VARCHAR, p_default INTERVAL)
RETURNS INTERVAL AS $$
DECLARE
    v_val TEXT;
    v_interval INTERVAL;
BEGIN
    SELECT value INTO v_val
    FROM public.system_settings
    WHERE key = p_key;
    
    IF v_val IS NULL THEN
        RETURN p_default;
    END IF;
    
    BEGIN
        v_interval := v_val::INTERVAL;
        RETURN v_interval;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'System setting lookup failed for key %: invalid_interval. Approved fallback used.', p_key;
        RETURN p_default;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_system_setting_int(p_key VARCHAR, p_default INT)
RETURNS INT AS $$
DECLARE
    v_val TEXT;
    v_int INT;
BEGIN
    SELECT value INTO v_val
    FROM public.system_settings
    WHERE key = p_key;
    
    IF v_val IS NULL THEN
        RETURN p_default;
    END IF;
    
    BEGIN
        v_int := v_val::INT;
        RETURN v_int;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'System setting lookup failed for key %: invalid_integer. Approved fallback used.', p_key;
        RETURN p_default;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke from public roles and grant to service_role for defense-in-depth
REVOKE EXECUTE ON FUNCTION public.get_system_setting(VARCHAR, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_setting(VARCHAR, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_system_setting_interval(VARCHAR, INTERVAL) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_setting_interval(VARCHAR, INTERVAL) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_system_setting_int(VARCHAR, INT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_setting_int(VARCHAR, INT) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. OUTBOX METADATA & SYSTEM SEED
-- ─────────────────────────────────────────────────────────────────────────────

-- Expand outbox with reliable metadata, category codes, and idempotency support
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS last_error_code VARCHAR(50);
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(100);
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- Enforce strict status column constraint on notification_outbox table
-- First, drop any prior constraint with the same responsibility to ensure deterministic application
ALTER TABLE public.notification_outbox DROP CONSTRAINT IF EXISTS check_notification_outbox_status;

-- Validate that existing rows contain only supported statuses. Do not silently rewrite or hide incompatible production data.
DO $$
DECLARE
    v_invalid_count INT;
BEGIN
    SELECT count(*) INTO v_invalid_count
    FROM public.notification_outbox
    WHERE status NOT IN ('queued', 'processing', 'sent', 'failed', 'permanently_failed');

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: public.notification_outbox contains % row(s) with invalid status values. Explicit remediation is required.', v_invalid_count;
    END IF;
END;
$$;

-- Add the final constraint permitting exactly the approved states
ALTER TABLE public.notification_outbox ADD CONSTRAINT check_notification_outbox_status CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'permanently_failed'));

-- Populate default values to externalize operational business constants
INSERT INTO public.system_settings (key, value, description) VALUES
('partner_response_timeout', '2 hours', 'How long a partner has to respond to an offer before it expires'),
('stalled_inquiry_threshold', '15 minutes', 'Age threshold at which an active matching inquiry with no offer is considered stalled'),
('notification_max_retries', '3', 'Maximum number of delivery attempts for an outbox notification'),
('notification_retry_delay', '5 minutes', 'Interval added to retry scheduling per attempt multiplier'),
('processing_lease_timeout', '10 minutes', 'Duration after which a notification stuck in processing is reclaimed'),
('outbox_retention_period', '30 days', 'Time after which processed notifications are purged'),
('recovery_rate_limit_retention', '24 hours', 'Duration after which stale recovery rate limit buckets are purged'),
('maintenance_batch_size', '1000', 'Maximum number of records purged in a single system maintenance run')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ATOMIC NOTIFICATION DEQUEUE FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dequeue_notifications(p_limit integer)
RETURNS SETOF public.notification_outbox AS $$
DECLARE
    v_limit integer := p_limit;
    v_lease_timeout INTERVAL;
    v_max_retries INT;
BEGIN
    -- Pull configurations dynamically from system settings
    v_lease_timeout := public.get_system_setting_interval('processing_lease_timeout', INTERVAL '10 minutes');
    v_max_retries := public.get_system_setting_int('notification_max_retries', 3);

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

-- Revoke execute from public roles and grant to service_role
REVOKE EXECUTE ON FUNCTION public.dequeue_notifications(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dequeue_notifications(integer) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SINGLETON OPERATIONAL WATCHDOG WITH TRANSACTION-SCOPED ADVISORY LOCK
-- ─────────────────────────────────────────────────────────────────────────────

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
    v_max_retries INT;
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
    v_max_retries := public.get_system_setting_int('notification_max_retries', 3);

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

-- Revoke execute on the updated function and grant to service_role
REVOKE EXECUTE ON FUNCTION public.run_operational_watchdog() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_operational_watchdog() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RE-BUILT SYSTEM MAINTENANCE & RETENTION ENGINE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_system_maintenance()
RETURNS VOID AS $$
DECLARE
    v_rate_limit_retention INTERVAL;
    v_outbox_retention INTERVAL;
    v_batch_size INT;
BEGIN
    -- Pull settings from system settings dynamically
    v_rate_limit_retention := public.get_system_setting_interval('recovery_rate_limit_retention', INTERVAL '24 hours');
    v_outbox_retention := public.get_system_setting_interval('outbox_retention_period', INTERVAL '30 days');
    v_batch_size := public.get_system_setting_int('maintenance_batch_size', 1000);

    -- 1. Cleanup stale recovery rate limits (older than threshold retention) with batch limits
    DELETE FROM public.recovery_rate_limits
    WHERE bucket_hash IN (
        SELECT bucket_hash
        FROM public.recovery_rate_limits
        WHERE updated_at < pg_catalog.now() - v_rate_limit_retention
        ORDER BY updated_at
        LIMIT v_batch_size
    );

    -- 2. Cleanup Outbox history (older than threshold retention) with batch limits
    -- Includes both 'sent' and 'permanently_failed' outbox notifications
    DELETE FROM public.notification_outbox
    WHERE id IN (
        SELECT id FROM public.notification_outbox
        WHERE status IN ('sent', 'permanently_failed') AND processed_at < pg_catalog.now() - v_outbox_retention
        LIMIT v_batch_size
    );

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
            'executed_at', pg_catalog.now(),
            'rate_limit_retention', v_rate_limit_retention,
            'outbox_retention', v_outbox_retention,
            'batch_size', v_batch_size
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.run_system_maintenance() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_system_maintenance() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. BULLETPROOF STATUS CHANGE AUTOMATION TRIGGER (AUTOMATES QUEUE ADVANCEMENT)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.on_inquiry_match_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_inquiry_status public.inquiry_status;
    v_response_exists BOOLEAN;
BEGIN
    -- 1. Fetch the inquiry status
    SELECT status INTO v_inquiry_status
    FROM public.inquiries
    WHERE id = NEW.inquiry_id;

    -- 2. Verify if a partner response already exists for this match
    SELECT EXISTS (
        SELECT 1 FROM public.partner_responses
        WHERE match_id = NEW.id
    ) INTO v_response_exists;

    -- 3. Queue advancement conditions:
    --    - Inquiry must be in 'matching' status (only active matching can advance)
    --    - NEW.status must be 'declined' or 'expired'
    --    - OLD.status must be 'offered' or 'viewed' (cannot be 'responded' or subsequent statuses)
    --    - No partner response must be present (prevents advancing if the partner had already responded)
    IF (v_inquiry_status = 'matching'::public.inquiry_status
        AND OLD.status IN ('offered'::public.match_status, 'viewed'::public.match_status)
        AND NEW.status IN ('declined'::public.match_status, 'expired'::public.match_status)
        AND NOT v_response_exists) THEN
        
        PERFORM public.advance_inquiry_queue(NEW.inquiry_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Recreate trigger to use the updated function
DROP TRIGGER IF EXISTS trigger_advance_queue_on_status_change ON public.inquiry_matches;
CREATE TRIGGER trigger_advance_queue_on_status_change
AFTER UPDATE ON public.inquiry_matches
FOR EACH ROW
EXECUTE FUNCTION public.on_inquiry_match_status_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CORRECTED OPERATIONAL METRICS REALTIME VIEW
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.operational_metrics_summary;

CREATE OR REPLACE VIEW public.operational_metrics_summary AS
SELECT
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiries), 0) AS inquiries_created,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches), 0) AS offers_issued,
    COALESCE((SELECT COUNT(*)::INT FROM public.partner_responses), 0) AS partner_responses_submitted,
    COALESCE((SELECT COUNT(*)::INT FROM public.partner_responses WHERE response_type = 'accept_as_requested'::public.response_type), 0) AS accepted_as_requested,
    COALESCE((SELECT COUNT(*)::INT FROM public.partner_responses WHERE response_type = 'propose_alternative'::public.response_type), 0) AS alternatives_proposed,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'selected'::public.match_status), 0) AS visitor_confirmed,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'declined'::public.match_status), 0) AS offers_declined,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiry_matches WHERE status = 'expired'::public.match_status), 0) AS offers_expired,
    COALESCE((SELECT COUNT(*)::INT FROM public.inquiries WHERE status = 'needs_assistance'::public.inquiry_status), 0) AS concierge_fallbacks
;
