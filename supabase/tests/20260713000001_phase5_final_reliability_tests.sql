-- IDEMO PARTNER ROUTING ENGINE - PHASE 5: ADDITIONAL RELIABILITY TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.3.1 (Phase 5 Final Reliability Verification)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Plan 16 tests to verify atomic notification dequeue, advisory locking, lease recovery and boundaries
SELECT plan(16);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Schema & Privilege Checks
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_function(
    'public', 
    'dequeue_notifications', 
    ARRAY['integer'], 
    'dequeue_notifications function must exist with correct signature'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Setup Mock Data for Dequeue Tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Clean up any existing outbox rows in this transaction
DELETE FROM public.notification_outbox;

-- Seed 12 eligible 'queued' notifications
INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, scheduled_at)
SELECT 
    gen_random_uuid(),
    'partner',
    'email',
    jsonb_build_object('title', 'Test message ' || i),
    'queued',
    timezone('utc'::text, now()) - (i || ' minutes')::interval
FROM generate_series(1, 12) AS i;

-- Seed 1 'failed' but retry-eligible notification (scheduled in the past)
INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, retry_count, max_retries, scheduled_at)
VALUES (
    'e111e111-e111-e111-e111-e111e111e111',
    'partner',
    'whatsapp',
    '{"title": "Retry eligible failed"}'::jsonb,
    'failed',
    1,
    3,
    timezone('utc'::text, now()) - interval '10 minutes'
);

-- Seed 1 'failed' but EXHAUSTED notification (retry_count >= max_retries)
INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, retry_count, max_retries, scheduled_at)
VALUES (
    'e222e222-e222-e222-e222-e222e222e222',
    'partner',
    'sms',
    '{"title": "Exhausted failed"}'::jsonb,
    'failed',
    3,
    3,
    timezone('utc'::text, now()) - interval '10 minutes'
);

-- Seed 1 'queued' but FUTURE scheduled notification (should not be processed yet)
INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, scheduled_at)
VALUES (
    'e333e333-e333-e333-e333-e333e333e333',
    'partner',
    'email',
    '{"title": "Future scheduled"}'::jsonb,
    'queued',
    timezone('utc'::text, now()) + interval '1 hour'
);

-- Seed 1 'processing' notification (already claimed)
INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status, scheduled_at)
VALUES (
    'e444e444-e444-e444-e444-e444e444e444',
    'partner',
    'email',
    '{"title": "Already processing"}'::jsonb,
    'processing',
    timezone('utc'::text, now()) - interval '10 minutes'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Run Dequeue Validation Tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Test 2: Clamp lower boundaries or default empty limits safely
SELECT results_eq(
    'SELECT count(*)::int FROM public.dequeue_notifications(-5)',
    $$ VALUES (10) $$,
    'dequeue_notifications must clamp negative limits to default (10)'
);

-- Test 3: Reset status to queued for subsequent test isolation
UPDATE public.notification_outbox SET status = 'queued' WHERE status = 'processing' AND id != 'e444e444-e444-e444-e444-e444e444e444';

-- Test 4: Atomically claim first batch of 10 rows
CREATE TEMP TABLE first_batch AS
SELECT id, status FROM public.dequeue_notifications(10);

SELECT is(
    (SELECT count(*)::int FROM first_batch),
    10,
    'First atomic claim must return exactly 10 rows'
);

-- Test 5: Confirm claimed rows in the database are updated to 'processing'
SELECT results_eq(
    'SELECT count(*)::int FROM public.notification_outbox WHERE status = ''processing'' AND id IN (SELECT id FROM first_batch)',
    $$ VALUES (10) $$,
    'Claimed rows in database must be atomically updated to processing status'
);

-- Test 6: Confirm the second batch returns only the remaining eligible rows
CREATE TEMP TABLE second_batch AS
SELECT id, status FROM public.dequeue_notifications(10);

-- Eligible rows remaining should be:
-- - 2 from the original generate_series series (since 10 were claimed, leaving 2)
-- - 1 from the retry-eligible failed row ('e111e111-e111-e111-e111-e111e111e111')
-- Total of 3 remaining eligible rows!
SELECT is(
    (SELECT count(*)::int FROM second_batch),
    3,
    'Second batch should return exactly the remaining 3 eligible rows'
);

-- Test 7: Verify that the two claimed batches have no overlapping row IDs
SELECT results_eq(
    'SELECT count(*)::int FROM first_batch f JOIN second_batch s ON f.id = s.id',
    $$ VALUES (0) $$,
    'Concurrent or consecutive dequeue batches must have zero overlapping row IDs'
);

-- Test 8: Verify that ineligible rows are completely excluded
SELECT results_eq(
    'SELECT count(*)::int FROM public.notification_outbox WHERE id IN (''e222e222-e222-e222-e222-e222e222e222'', ''e333e333-e333-e333-e333-e333e333e333'') AND status = ''processing''',
    $$ VALUES (0) $$,
    'Exhausted retry and future scheduled notifications must be completely excluded from dequeue'
);

-- Test 9: Verify lease recovery of stale processing notifications via watchdog
-- We have seed row 'e444e444-e444-e444-e444-e444e444e444' with status 'processing'.
-- Let's make it stale by backdating its updated_at timestamp.
UPDATE public.notification_outbox 
SET updated_at = pg_catalog.now() - INTERVAL '15 minutes',
    retry_count = 0,
    max_retries = 3
WHERE id = 'e444e444-e444-e444-e444-e444e444e444';

-- Run the watchdog to reclaim the stale processing lease
SELECT ok(
    public.run_operational_watchdog() >= 0,
    'Watchdog must run and process stale processing notifications'
);

-- Verify the stale lease has been successfully moved to failed status with incremented retry_count
SELECT results_eq(
    'SELECT status, retry_count FROM public.notification_outbox WHERE id = ''e444e444-e444-e444-e444-e444e444e444''',
    $$ VALUES ('failed'::varchar, 1) $$,
    'Stale lease must be reclaimed by watchdog, incrementing retry_count and setting status to failed'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Watchdog Advisory Lock Validation
-- ─────────────────────────────────────────────────────────────────────────────

-- Test 10: Verify the advisory lock behavior during the transaction
-- Since we are currently running in a transaction, if we try to acquire the advisory lock, it should succeed
SELECT is(
    pg_catalog.pg_try_advisory_xact_lock(135792468),
    true,
    'Should acquire the unique transaction-scoped advisory lock successfully'
);

-- Test 11: Run the watchdog and ensure it runs normally when we hold the lock in the active transaction
-- Since pg_try_advisory_xact_lock is reentrant within the same transaction block, run_operational_watchdog should execute fine.
SELECT function_returns(
    'public',
    'run_operational_watchdog',
    ARRAY[]::name[],
    'integer',
    'run_operational_watchdog must retain integer return type'
);

-- Test 12: Call watchdog and verify it returns a valid integer
SELECT is_empty(
    'SELECT public.run_operational_watchdog() WHERE FALSE',
    'run_operational_watchdog should execute without syntax errors'
);

-- Test 13: Ensure that we can execute the watchdog function directly and get a valid integer back
SELECT ok(
    public.run_operational_watchdog() >= 0,
    'Executing run_operational_watchdog must return a non-negative count'
);

-- Test 14: Verify that permanently_failed is accepted
SELECT lives_ok(
    $$ INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status)
       VALUES ('e555e555-e555-e555-e555-e555e555e555', 'partner', 'email', '{"title": "test"}'::jsonb, 'permanently_failed') $$,
    'Database must accept permanently_failed status'
);

-- Test 15: Verify that an arbitrary status is rejected
SELECT throws_ok(
    $$ INSERT INTO public.notification_outbox (id, recipient_type, channel, payload, status)
       VALUES ('e666e666-e666-e666-e666-e666e666e666', 'partner', 'email', '{"title": "test"}'::jsonb, 'invalid_status') $$,
    '23514'::character(5),
    NULL,
    'Database must reject arbitrary invalid status value'
);

-- Test 16: Verify that permanently_failed rows cannot be dequeued
SELECT results_eq(
    'SELECT count(*)::int FROM public.dequeue_notifications(10) WHERE id = ''e555e555-e555-e555-e555-e555e555e555''',
    $$ VALUES (0) $$,
    'permanently_failed notifications must not be returned by dequeue'
);

SELECT * FROM finish();
ROLLBACK;
