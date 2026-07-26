-- IDEMO PARTNER ROUTING ENGINE - PHASE 5: OPERATIONS & AUTOMATION TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.3.0 (Phase 5 Operations and Automation Validation)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Plan 18 tests to verify full operations, automation, outbox triggers, watchdog and metrics view
SELECT plan(18);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Existence and Schema Verification
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify functions exist
SELECT has_function('public', 'advance_inquiry_queue', ARRAY['uuid'], 'advance_inquiry_queue must exist');
SELECT has_function('public', 'process_expired_offers', ARRAY[]::name[], 'process_expired_offers must exist');
SELECT has_function('public', 'run_operational_watchdog', ARRAY[]::name[], 'run_operational_watchdog must exist');
SELECT has_function('public', 'run_system_maintenance', ARRAY[]::name[], 'run_system_maintenance must exist');

-- Verify Outbox table and index exist
SELECT has_table('public', 'notification_outbox', 'notification_outbox table must exist');
SELECT has_index('public', 'notification_outbox', 'idx_notification_outbox_status_scheduled', 'idx_notification_outbox_status_scheduled index must exist');

-- Verify operational metrics view exists
SELECT has_view('public', 'operational_metrics_summary', 'operational_metrics_summary view must exist');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Mock Data and Setup
-- ─────────────────────────────────────────────────────────────────────────────

-- Setup mock service area, languages, capabilities and recommendation if not existing
INSERT INTO public.service_areas (id, name_en, name_sr) 
VALUES ('11111111-1111-1111-1111-111111111155', 'Operations Area', 'Operativna Zona')
ON CONFLICT DO NOTHING;

INSERT INTO public.languages (id, code, name) 
VALUES ('22222222-2222-2222-2222-222222222255', 'ops', 'Operations Language')
ON CONFLICT DO NOTHING;

INSERT INTO public.capabilities (id, code, label_en, label_sr) VALUES 
('33333333-3333-3333-3333-333333333355', 'cap-ops', 'Ops Expert', 'Ekspert za Operative')
ON CONFLICT DO NOTHING;

INSERT INTO public.recommendations (id, title_en, title_sr, service_area_id)
VALUES ('44444444-4444-4444-4444-444444444455', 'Ops Recommendation', 'Preporuka za Ops', '11111111-1111-1111-1111-111111111155')
ON CONFLICT DO NOTHING;

-- Insert two active partners for queue testing
INSERT INTO public.partners (id, name, status, is_open_for_inquiries, contact_preference) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Partner Alpha', 'active', true, 'WhatsApp'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Partner Beta', 'active', true, 'Viber')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 8: Notification Trigger on New Match
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_inquiry_id UUID := '99999999-9999-9999-9999-999999999999';
    v_match_id UUID;
BEGIN
    -- Clear outbox for a clean test
    DELETE FROM public.notification_outbox;

    INSERT INTO public.inquiries (
        id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
        requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
    ) VALUES (
        v_inquiry_id, '44444444-4444-4444-4444-444444444455', 'matching', 'Need ops expert support',
        '22222222-2222-2222-2222-222222222255', '11111111-1111-1111-1111-111111111155',
        now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-OPS-111', 'dummyhash123', now() + interval '1 day'
    );

    -- Insert inquiry candidates
    INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
    (v_inquiry_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'offered'),
    (v_inquiry_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'queued');

    -- Insert the first match offered
    INSERT INTO public.inquiry_matches (inquiry_id, partner_id, status, offered_at, expires_at) VALUES
    (v_inquiry_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'offered', now(), now() + interval '2 hours')
    RETURNING id INTO v_match_id;
END $$;

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.notification_outbox WHERE recipient_type = 'partner' $$,
    $$ VALUES (1) $$,
    'Inserting offered match must trigger insertion in notification_outbox'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 9: Queue Advancement on Partner Decline (Simulation via trigger)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_inquiry_id UUID := '99999999-9999-9999-9999-999999999999';
    v_match_id UUID;
BEGIN
    -- Get current active match ID
    SELECT id INTO v_match_id FROM public.inquiry_matches WHERE inquiry_id = v_inquiry_id AND status = 'offered';

    -- Simulate Partner Decline by updating match status to declined and candidate status to skipped
    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = v_match_id;

    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_inquiry_id AND partner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
END $$;

SELECT is(
    (SELECT partner_id FROM public.inquiry_matches WHERE inquiry_id = '99999999-9999-9999-9999-999999999999' AND status = 'offered'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Decline of first offer must automatically advance queue to activate Partner Beta'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 10: Queue Advancement on Expiry Processing
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    UPDATE public.inquiry_matches
    SET expires_at = now() - interval '1 second'
    WHERE inquiry_id = '99999999-9999-9999-9999-999999999999' AND status = 'offered';
END $$;

SELECT is(
    public.process_expired_offers(),
    1,
    'process_expired_offers must successfully detect and expire the expired match'
);

SELECT is(
    (SELECT status FROM public.inquiries WHERE id = '99999999-9999-9999-9999-999999999999'),
    'needs_assistance'::public.inquiry_status,
    'Exhausting the queue after offer expiry must fallback to needs_assistance status'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 11-15: Operational Watchdog Verification
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    INSERT INTO public.inquiries (
        id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
        requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at, created_at
    ) VALUES (
        '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444455', 'matching', 'Stalled inquiry notes',
        '22222222-2222-2222-2222-222222222255', '11111111-1111-1111-1111-111111111155',
        now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-OPS-222', 'dummyhash124', now() + interval '1 day',
        now() - interval '20 minutes'
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
    ('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'queued')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inquiries (
        id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
        requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
    ) VALUES (
        '77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444455', 'matching', 'Stuck inquiry notes',
        '22222222-2222-2222-2222-222222222255', '11111111-1111-1111-1111-111111111155',
        now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-OPS-333', 'dummyhash125', now() + interval '1 day'
    ) ON CONFLICT DO NOTHING;

    PERFORM public.run_operational_watchdog();
END $$;

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.inquiry_matches WHERE inquiry_id = '88888888-8888-8888-8888-888888888888' AND status = 'offered' $$,
    $$ VALUES (1) $$,
    'Watchdog must detect stalled inquiry and automatically activate next queued candidate'
);

SELECT is(
    (SELECT status FROM public.inquiries WHERE id = '77777777-7777-7777-7777-777777777777'),
    'needs_assistance'::public.inquiry_status,
    'Watchdog must transition stuck inquiry with empty queue to needs_assistance'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 16-18: System Maintenance Cleanup Verification
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    -- Seed stale recovery rate limit
    INSERT INTO public.recovery_rate_limits (bucket_hash, request_count, updated_at)
    VALUES ('stale_bucket_hash_123', 5, now() - interval '25 hours');

    -- Seed stale notification outbox entry
    INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, processed_at)
    VALUES ('f111f111-f111-f111-f111-f111f111f111', 'partner', 'email', '{"title":"old"}'::jsonb, 'sent', now() - interval '31 days');

    -- Run maintenance
    PERFORM public.run_system_maintenance();
END $$;

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.recovery_rate_limits WHERE bucket_hash = 'stale_bucket_hash_123' $$,
    $$ VALUES (0) $$,
    'System maintenance must clean up stale rate limits older than 24 hours'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.notification_outbox WHERE id = 'f111f111-f111-f111-f111-f111f111f111' $$,
    $$ VALUES (0) $$,
    'System maintenance must prune historical outbox records older than 30 days'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.audit_logs WHERE action = 'system_maintenance_executed' $$,
    $$ VALUES (1) $$,
    'System maintenance execution must write an immutable audit log entry'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 19-20: Operational Metrics Realtime View Verification
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify view values are aggregate integers and match real counts
SELECT col_type_is('public', 'operational_metrics_summary', 'inquiries_created', 'integer', 'inquiries_created must be integer');
SELECT col_type_is('public', 'operational_metrics_summary', 'offers_issued', 'integer', 'offers_issued must be integer');

SELECT * FROM finish();
ROLLBACK;
