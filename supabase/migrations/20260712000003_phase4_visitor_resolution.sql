-- IDEMO PARTNER ROUTING ENGINE - PHASE 4: VISITOR RESOLUTION MIGRATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.4.0 (Phase 4C Security, Durable Recovery Throttling, and Audit Hygiene)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. SCHEMA PATCh: ADD TEMPORARY LOCKOUT COOLDOWN COLUMN (FOR COMPATIBILITY)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS recovery_last_failed_at TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0B. DURABLE THROTTLING SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recovery_rate_limits (
    bucket_hash VARCHAR(64) PRIMARY KEY,
    window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT pg_catalog.now(),
    request_count INT NOT NULL DEFAULT 1,
    blocked_until TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT pg_catalog.now()
);

-- Enable RLS on rate limits table to satisfy defense-in-depth requirements
ALTER TABLE public.recovery_rate_limits ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DURABLE RATE-LIMIT HELPER RPCs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_bucket_hash VARCHAR(64),
    p_max_requests INT,
    p_window_interval INTERVAL,
    p_cooldown_interval INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_rec RECORD;
    v_now TIMESTAMP WITH TIME ZONE;
BEGIN
    v_now := pg_catalog.now();

    -- Ensure the row exists by inserting with ON CONFLICT DO NOTHING
    INSERT INTO public.recovery_rate_limits (
        bucket_hash,
        window_started_at,
        request_count,
        blocked_until,
        updated_at
    )
    VALUES (
        p_bucket_hash,
        v_now,
        0,
        NULL,
        v_now
    )
    ON CONFLICT (bucket_hash) DO NOTHING;

    -- Concurrency-Safe Exclusive Row Lock
    SELECT * INTO v_rec
    FROM public.recovery_rate_limits
    WHERE bucket_hash = p_bucket_hash
    FOR UPDATE;

    -- 1. Check if currently blocked
    IF v_rec.blocked_until IS NOT NULL AND v_rec.blocked_until > v_now THEN
        RETURN FALSE;
    END IF;

    -- 2. Check if window has expired, reset count if so
    IF v_now > (v_rec.window_started_at + p_window_interval) THEN
        UPDATE public.recovery_rate_limits
        SET window_started_at = v_now,
            request_count = 1,
            blocked_until = NULL,
            updated_at = v_now
        WHERE bucket_hash = p_bucket_hash;
        
        -- Delete only the directly related stale bucket record if fully expired (window + cooldown has passed)
        -- Global stale-record cleanup belongs to Phase 5 maintenance/retention process (OUT OF CURRENT PHASE).
        DELETE FROM public.recovery_rate_limits
        WHERE bucket_hash = p_bucket_hash
          AND updated_at < v_now - (p_window_interval + p_cooldown_interval);

        RETURN TRUE;
    END IF;

    -- 3. Check threshold limit
    IF v_rec.request_count >= p_max_requests THEN
        UPDATE public.recovery_rate_limits
        SET blocked_until = v_now + p_cooldown_interval,
            updated_at = v_now
        WHERE bucket_hash = p_bucket_hash;
        
        RETURN FALSE;
    ELSE
        UPDATE public.recovery_rate_limits
        SET request_count = v_rec.request_count + 1,
            updated_at = v_now
        WHERE bucket_hash = p_bucket_hash;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limits(
    p_source_bucket VARCHAR(64),
    p_source_max INT,
    p_source_window INTERVAL,
    p_source_cooldown INTERVAL,
    p_target_bucket VARCHAR(64),
    p_target_max INT,
    p_target_window INTERVAL,
    p_target_cooldown INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_source_rec RECORD;
    v_target_rec RECORD;
    v_now TIMESTAMP WITH TIME ZONE;
    v_source_allowed BOOLEAN;
    v_target_allowed BOOLEAN;
BEGIN
    v_now := pg_catalog.now();

    -- Ensure both bucket rows exist in the table so we can lock them
    INSERT INTO public.recovery_rate_limits (bucket_hash, window_started_at, request_count, blocked_until, updated_at)
    VALUES (p_source_bucket, v_now, 0, NULL, v_now)
    ON CONFLICT (bucket_hash) DO NOTHING;

    INSERT INTO public.recovery_rate_limits (bucket_hash, window_started_at, request_count, blocked_until, updated_at)
    VALUES (p_target_bucket, v_now, 0, NULL, v_now)
    ON CONFLICT (bucket_hash) DO NOTHING;

    -- Concurrency-Safe Alphabetical Row Locking to prevent deadlocks.
    -- DEADLOCK PREVENTION GUARANTEE:
    -- In high-concurrency environments, if Transaction A locks Bucket X then tries to lock Bucket Y,
    -- while Transaction B locks Bucket Y then tries to lock Bucket X, a deadlock occurs.
    -- To completely prevent this, we always sort the hashes and obtain row-level exclusive locks (FOR UPDATE)
    -- in strict, deterministic alphabetical order (lesser hash first, greater hash second).
    -- This guarantees that no concurrent process can ever lock these resources in reverse order, eliminating
    -- any possibility of circular wait or deadlock.
    IF p_source_bucket < p_target_bucket THEN
        SELECT * INTO v_source_rec FROM public.recovery_rate_limits WHERE bucket_hash = p_source_bucket FOR UPDATE;
        SELECT * INTO v_target_rec FROM public.recovery_rate_limits WHERE bucket_hash = p_target_bucket FOR UPDATE;
    ELSE
        SELECT * INTO v_target_rec FROM public.recovery_rate_limits WHERE bucket_hash = p_target_bucket FOR UPDATE;
        SELECT * INTO v_source_rec FROM public.recovery_rate_limits WHERE bucket_hash = p_source_bucket FOR UPDATE;
    END IF;

    -- Evaluate Source Bucket
    IF v_source_rec.blocked_until IS NOT NULL AND v_source_rec.blocked_until > v_now THEN
        v_source_allowed := FALSE;
    ELSE
        IF v_now > (v_source_rec.window_started_at + p_source_window) THEN
            v_source_allowed := TRUE;
        ELSIF v_source_rec.request_count >= p_source_max THEN
            v_source_allowed := FALSE;
        ELSE
            v_source_allowed := TRUE;
        END IF;
    END IF;

    -- Evaluate Target Bucket
    IF v_target_rec.blocked_until IS NOT NULL AND v_target_rec.blocked_until > v_now THEN
        v_target_allowed := FALSE;
    ELSE
        IF v_now > (v_target_rec.window_started_at + p_target_window) THEN
            v_target_allowed := TRUE;
        ELSIF v_target_rec.request_count >= p_target_max THEN
            v_target_allowed := FALSE;
        ELSE
            v_target_allowed := TRUE;
        END IF;
    END IF;

    -- Atomic updates - increments only committed if BOTH allow the request
    IF v_source_allowed AND v_target_allowed THEN
        -- Source Increment/Reset
        IF v_now > (v_source_rec.window_started_at + p_source_window) THEN
            UPDATE public.recovery_rate_limits
            SET window_started_at = v_now,
                request_count = 1,
                blocked_until = NULL,
                updated_at = v_now
            WHERE bucket_hash = p_source_bucket;
        ELSE
            UPDATE public.recovery_rate_limits
            SET request_count = request_count + 1,
                updated_at = v_now
            WHERE bucket_hash = p_source_bucket;
        END IF;

        -- Target Increment/Reset
        IF v_now > (v_target_rec.window_started_at + p_target_window) THEN
            UPDATE public.recovery_rate_limits
            SET window_started_at = v_now,
                request_count = 1,
                blocked_until = NULL,
                updated_at = v_now
            WHERE bucket_hash = p_target_bucket;
        ELSE
            UPDATE public.recovery_rate_limits
            SET request_count = request_count + 1,
                updated_at = v_now
            WHERE bucket_hash = p_target_bucket;
        END IF;

        -- Delete only directly related stale bucket records where fully expired (window + cooldown has passed)
        -- Global stale-record cleanup belongs to Phase 5 maintenance/retention process (OUT OF CURRENT PHASE).
        DELETE FROM public.recovery_rate_limits
        WHERE bucket_hash IN (p_source_bucket, p_target_bucket)
          AND updated_at < v_now - (p_source_window + p_source_cooldown)
          AND updated_at < v_now - (p_target_window + p_target_cooldown);

        RETURN TRUE;
    ELSE
        -- Cooldown triggering on failure
        IF NOT v_source_allowed THEN
            IF (v_source_rec.blocked_until IS NULL OR v_source_rec.blocked_until <= v_now) 
               AND v_source_rec.request_count >= p_source_max 
               AND NOT (v_now > (v_source_rec.window_started_at + p_source_window)) THEN
                UPDATE public.recovery_rate_limits
                SET blocked_until = v_now + p_source_cooldown,
                    updated_at = v_now
                WHERE bucket_hash = p_source_bucket;
            ELSE
                UPDATE public.recovery_rate_limits
                SET updated_at = v_now
                WHERE bucket_hash = p_source_bucket;
            END IF;
        END IF;

        IF NOT v_target_allowed THEN
            IF (v_target_rec.blocked_until IS NULL OR v_target_rec.blocked_until <= v_now) 
               AND v_target_rec.request_count >= p_target_max 
               AND NOT (v_now > (v_target_rec.window_started_at + p_target_window)) THEN
                UPDATE public.recovery_rate_limits
                SET blocked_until = v_now + p_target_cooldown,
                    updated_at = v_now
                WHERE bucket_hash = p_target_bucket;
            ELSE
                UPDATE public.recovery_rate_limits
                SET updated_at = v_now
                WHERE bucket_hash = p_target_bucket;
            END IF;
        END IF;

        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1B. VISITOR VALIDATION AND SECURITY HELPER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_and_get_inquiry(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS public.inquiries AS $$
DECLARE
    v_token_hash VARCHAR(64);
    v_inquiry public.inquiries;
BEGIN
    -- 1. Compute secure token hash using cryptographically secure SHA-256
    v_token_hash := pg_catalog.encode(pg_catalog.sha256(p_raw_token::bytea), 'hex');

    -- 2. Query and lock inquiry to prevent race conditions or parallel state mutations
    SELECT * INTO v_inquiry
    FROM public.inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    -- 3. Strict validation: If inquiry does not exist, return generic Access denied error to prevent enumeration
    IF v_inquiry.id IS NULL THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 4. Recovery token hash validation (No longer mutates inquiry row to avoid lockout DOS)
    IF v_inquiry.recovery_token_hash != v_token_hash THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 5. Expiry check
    IF v_inquiry.recovery_token_expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 6. Revocation check
    IF v_inquiry.recovery_token_revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN v_inquiry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RETRIEVE CURRENT INQUIRY STATUS (Routine Polling - Excluded from Audit Logs)
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
    -- 1. Validate caller identity and retrieve inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Map internal status to calm visitor-friendly editorial status
    v_visitor_status := CASE v_inquiry.status
        WHEN 'new' THEN 'Preparing your request'
        WHEN 'matching' THEN 'Finding suitable local assistance'
        WHEN 'awaiting_visitor' THEN 'Waiting for confirmation'
        WHEN 'confirmed' THEN 'Your arrangement request has been accepted'
        WHEN 'in_progress' THEN 'Your arrangement is in progress'
        WHEN 'completed' THEN 'Completed'
        WHEN 'canceled' THEN 'Canceled'
        WHEN 'needs_assistance' THEN 'IDEMO Concierge will personally assist you'
        WHEN 'closed' THEN 'IDEMO Concierge will personally assist you'
        ELSE 'Processing your request'
    END;

    -- 3. Construct clean and safe JSONB payload (excluding system logs and queues)
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

    -- [RULE EXCLUSION] Polling read operations are excluded from the immutable governance audit ledger.

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RETRIEVE ACTIVE PARTNER PROPOSAL (Routine Polling - Excluded from Audit Logs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_visitor_active_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_response_rec RECORD;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and retrieve inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONFIRM PROPOSAL (State-Changing - Audit Logged)
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
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and lock inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Validate current inquiry status (must be awaiting resolution)
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

    -- 5. Perform transactional updates
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

    -- 6. Insert immutable audit record (completely clean of PII or raw tokens)
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
-- 5. DECLINE PROPOSAL (State-Changing - Audit Logged)
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
    v_reason_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and lock inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Validate current inquiry status (must be awaiting resolution)
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
    IF v_match_rec.status = 'declined'::public.match_status THEN
        RAISE EXCEPTION 'Proposal already declined';
    ELSIF v_match_rec.status != 'responded'::public.match_status THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 5. Clean decline reason text
    v_reason_clean := trim(p_reason);
    IF v_reason_clean = '' THEN
        v_reason_clean := NULL;
    END IF;

    -- 6. Perform transactional updates
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

    -- Update inquiry status to canceled (visitor ends the request)
    UPDATE public.inquiries
    SET status = 'canceled'::public.inquiry_status
    WHERE id = p_inquiry_id;

    -- 7. Insert immutable audit record (strictly clean of free-text decline reason to maintain compliance)
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
            'action_type', 'decline',
            'inquiry_id', p_inquiry_id,
            'match_id', p_match_id,
            'partner_id', v_match_rec.partner_id,
            'reason_provided', (v_reason_clean IS NOT NULL),
            'result', 'success'
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'inquiry_id', p_inquiry_id,
        'match_id', p_match_id,
        'status', 'canceled'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REQUEST ALTERNATIVE OPTION (State-Changing - Audit Logged)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.request_alternative_option(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_match_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_reason_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Validate caller identity and lock inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    -- 2. Validate current inquiry status (must be awaiting resolution)
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
    IF v_match_rec.status = 'not_selected'::public.match_status THEN
        RAISE EXCEPTION 'Alternative option already requested';
    ELSIF v_match_rec.status != 'responded'::public.match_status THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 5. Clean reason text
    v_reason_clean := trim(p_reason);
    IF v_reason_clean = '' THEN
        v_reason_clean := NULL;
    END IF;

    -- 6. Perform transactional updates
    -- Update match status to not_selected
    UPDATE public.inquiry_matches
    SET status = 'not_selected'::public.match_status
    WHERE id = p_match_id;

    -- Update partner response status to declined_by_visitor
    UPDATE public.partner_responses
    SET status = 'declined_by_visitor'::public.partner_response_status,
        updated_at = pg_catalog.now()
    WHERE match_id = p_match_id;

    -- Mark candidate status as skipped (this is a simple status transition of the candidate, membership and order are unchanged!)
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = p_inquiry_id AND partner_id = v_match_rec.partner_id;

    -- Return inquiry status back to matching (Signals the background scheduler/job to process next candidates in Phase 5)
    UPDATE public.inquiries
    SET status = 'matching'::public.inquiry_status
    WHERE id = p_inquiry_id;

    -- 7. Insert immutable audit record (strictly clean of free-text skip reason to maintain compliance)
    INSERT INTO public.audit_logs (
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        'visitor_anonymous',
        'proposal_alternative_requested',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'action_type', 'request_alternative',
            'inquiry_id', p_inquiry_id,
            'match_id', p_match_id,
            'partner_id', v_match_rec.partner_id,
            'reason_provided', (v_reason_clean IS NOT NULL),
            'result', 'success'
        )
    );

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'inquiry_id', p_inquiry_id,
        'match_id', p_match_id,
        'status', 'matching'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. EXPLICIT GRANTS MATRIX AND DEFENSE-IN-DEPTH
-- ─────────────────────────────────────────────────────────────────────────────

-- 7.1. Revoke all direct permissions on all Phase 4 functions from general database roles
REVOKE EXECUTE ON FUNCTION public.validate_and_get_inquiry(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_visitor_inquiry_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_alternative_option(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(VARCHAR, INT, INTERVAL, INTERVAL) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limits(VARCHAR, INT, INTERVAL, INTERVAL, VARCHAR, INT, INTERVAL, INTERVAL) FROM PUBLIC, anon, authenticated;

-- 7.2. Grant execute strictly and exclusively to service_role (the role used by secure Edge Gateway functions)
GRANT EXECUTE ON FUNCTION public.validate_and_get_inquiry(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_visitor_inquiry_status(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_proposal(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.decline_proposal(UUID, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_alternative_option(UUID, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(VARCHAR, INT, INTERVAL, INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limits(VARCHAR, INT, INTERVAL, INTERVAL, VARCHAR, INT, INTERVAL, INTERVAL) TO service_role;
