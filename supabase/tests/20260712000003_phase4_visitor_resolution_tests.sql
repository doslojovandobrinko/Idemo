-- IDEMO PARTNER ROUTING ENGINE - PHASE 4: VISITOR RESOLUTION TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.4.0 (Phase 4C Security, Durable Recovery, and Audit Hygiene)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Grant temporary EXECUTE privileges on pgTAP assertion functions to anon and authenticated for RLS testing
GRANT EXECUTE ON FUNCTION extensions.throws_ok(text, text, text) TO anon, authenticated;

-- Setup pgTAP plan (36 tests for complete security, rate-limiting, and privacy verification)
SELECT plan(36);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Metadata and Foundational Seed Data
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.service_areas (id, name_en, name_sr) 
VALUES ('11111111-1111-1111-1111-111111111112', 'New Belgrade', 'Novi Beograd')
ON CONFLICT DO NOTHING;

INSERT INTO public.languages (id, code, name) 
VALUES ('22222222-2222-2222-2222-222222222223', 'en', 'English')
ON CONFLICT DO NOTHING;

INSERT INTO public.capabilities (id, code, label_en, label_sr) VALUES 
('33333333-3333-3333-3333-333333333335', 'cap-03', 'Local Expert', 'Lokalni Ekspert')
ON CONFLICT DO NOTHING;

INSERT INTO public.recommendations (id, title_en, title_sr, service_area_id)
VALUES ('44444444-4444-4444-4444-444444444445', 'Ada Ciganlija Tour', 'Ada Ciganlija obilazak', '11111111-1111-1111-1111-111111111112')
ON CONFLICT DO NOTHING;

INSERT INTO public.partners (id, name, status, is_open_for_inquiries) VALUES 
('cccccccc-3333-3333-3333-cccccccccccc', 'Partner Gamma', 'active', true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 1-7: Function and Table Existence
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_function('public', 'get_visitor_inquiry_status', ARRAY['uuid', 'text'], 'get_visitor_inquiry_status must exist');
SELECT has_function('public', 'get_visitor_active_proposal', ARRAY['uuid', 'text'], 'get_visitor_active_proposal must exist');
SELECT has_function('public', 'confirm_proposal', ARRAY['uuid', 'text', 'uuid'], 'confirm_proposal must exist');
SELECT has_function('public', 'decline_proposal', ARRAY['uuid', 'text', 'uuid', 'text'], 'decline_proposal must exist');
SELECT has_function('public', 'request_alternative_option', ARRAY['uuid', 'text', 'uuid', 'text'], 'request_alternative_option must exist');
SELECT has_function('public', 'check_and_increment_rate_limit', ARRAY['varchar', 'integer', 'interval', 'interval'], 'check_and_increment_rate_limit helper must exist');

-- Verify rate limit table exists
SELECT has_table('public', 'recovery_rate_limits', 'recovery_rate_limits table must exist in public schema');

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup Dynamic Mock Inquiry with Cryptographic Recovery Tokens
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_token_alpha TEXT := 'secret_token_alpha';
    v_token_beta TEXT := 'secret_token_beta';
    v_hash_alpha VARCHAR(64);
    v_hash_beta VARCHAR(64);
    
    v_inquiry_id_alpha UUID := 'd901d901-d901-d901-d901-d901d901d901';
    v_inquiry_id_beta UUID := 'd901d901-d901-d901-d901-d901d901d902';
    v_match_id_alpha UUID := 'e101e101-e101-e101-e101-e101e101e101';
BEGIN
    v_hash_alpha := pg_catalog.encode(pg_catalog.sha256(v_token_alpha::bytea), 'hex');
    v_hash_beta := pg_catalog.encode(pg_catalog.sha256(v_token_beta::bytea), 'hex');

    -- Insert Inquiry Alpha (Awaiting Visitor Resolution)
    INSERT INTO public.inquiries (
        id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
        requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
    ) VALUES (
        v_inquiry_id_alpha, '44444444-4444-4444-4444-444444444445', 'awaiting_visitor', 'Ada lake excursion',
        '22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112',
        now() + interval '2 days', now() + interval '2 days 4 hours', 'IDM-789-XYZ', v_hash_alpha, now() + interval '5 hours'
    );

    -- Insert Inquiry Beta (Testing lockout)
    INSERT INTO public.inquiries (
        id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
        requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at, recovery_failed_attempts, recovery_last_failed_at
    ) VALUES (
        v_inquiry_id_beta, '44444444-4444-4444-4444-444444444445', 'awaiting_visitor', 'Ada lake excursion 2',
        '22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112',
        now() + interval '3 days', now() + interval '3 days 4 hours', 'IDM-789-YAA', v_hash_beta, now() + interval '5 hours', 0, NULL
    );

    -- Insert Candidate Queue
    INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
    (v_inquiry_id_alpha, 'cccccccc-3333-3333-3333-cccccccccccc', 1, 'offered');

    -- Insert Responded Opportunity Match
    INSERT INTO public.inquiry_matches (id, inquiry_id, partner_id, status, offered_at, expires_at) VALUES 
    (v_match_id_alpha, v_inquiry_id_alpha, 'cccccccc-3333-3333-3333-cccccccccccc', 'responded', now(), now() + interval '2 hours');

    -- Insert Partner Response Details
    INSERT INTO public.partner_responses (id, match_id, response_type, message, status, proposed_start_at, proposed_end_at) VALUES
    ('f201f201-f201-f201-f201-f201f201f201', v_match_id_alpha, 'accept_as_requested', 'I can guide you at Ada Ciganlija!', 'submitted', now() + interval '2 days', now() + interval '2 days 4 hours');
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 8-11: Direct EXECUTE Permissions (Defense-In-Depth)
-- ─────────────────────────────────────────────────────────────────────────────

-- 8. Verify anon cannot execute status function
SET LOCAL ROLE anon;
SELECT throws_ok(
    $$ SELECT public.get_visitor_inquiry_status('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha') $$,
    'permission denied for function get_visitor_inquiry_status',
    'Anon role must be denied direct execution of public.get_visitor_inquiry_status'
);
RESET ROLE;

-- 9. Verify anon cannot execute internal validation helper
SET LOCAL ROLE anon;
SELECT throws_ok(
    $$ SELECT public.validate_and_get_inquiry('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha') $$,
    'permission denied for function validate_and_get_inquiry',
    'Anon role must be denied direct execution of public.validate_and_get_inquiry'
);
RESET ROLE;

-- 10. Verify ordinary authenticated role cannot execute status function
SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$ SELECT public.get_visitor_inquiry_status('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha') $$,
    'permission denied for function get_visitor_inquiry_status',
    'Ordinary authenticated role must be denied direct execution of public.get_visitor_inquiry_status'
);
RESET ROLE;

-- 11. Verify client roles cannot access the rate limits table
SET LOCAL ROLE anon;
SELECT throws_ok(
    $$ SELECT * FROM public.recovery_rate_limits $$,
    'permission denied for table recovery_rate_limits',
    'Anon role must be completely denied direct SELECT on public.recovery_rate_limits'
);
RESET ROLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 12-13: Token Disclosure & Enumeration Security
-- ─────────────────────────────────────────────────────────────────────────────

-- 12. Invalid token for existing inquiry returns safe generic 'Access denied'
SELECT throws_ok(
    $$ SELECT public.get_visitor_inquiry_status('d901d901-d901-d901-d901-d901d901d901', 'wrong_token') $$,
    'Access denied',
    'Invalid token for existing inquiry must throw generic "Access denied" to prevent token guessing'
);

-- 13. Querying non-existent inquiry returns identical generic 'Access denied'
SELECT throws_ok(
    $$ SELECT public.get_visitor_inquiry_status('00000000-0000-0000-0000-000000000000', 'wrong_token') $$,
    'Access denied',
    'Querying non-existent inquiry must return identical generic "Access denied" to prevent ID enumeration'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 14-15: Lockout DOS Elimination Proof
-- ─────────────────────────────────────────────────────────────────────────────

-- 14. Failed attempts on validate_and_get_inquiry must NOT mutate the inquiry table
-- We verify that trying to validate with an incorrect token does not increment the failed count on inquiries
SELECT throws_ok(
    $$ SELECT public.validate_and_get_inquiry('d901d901-d901-d901-d901-d901d901d901', 'wrong_token') $$,
    'Access denied'
);

SELECT is(
    (SELECT recovery_failed_attempts FROM public.inquiries WHERE id = 'd901d901-d901-d901-d901-d901d901d901'),
    0,
    'Failed anonymous attempts must no longer mutate recovery_failed_attempts in the inquiries table'
);

-- 15. Known inquiry UUID cannot be anonymously locked out
-- Since recovery_failed_attempts is not mutated, subsequent valid tokens always succeed
SELECT lives_ok(
    $$ SELECT public.validate_and_get_inquiry('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha') $$,
    'Inquiry must remain completely accessible to valid owner even after arbitrary invalid attempts'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 16-17: Durable Throttling Design & Behavior (including Dual-Bucket Evaluation)
-- ─────────────────────────────────────────────────────────────────────────────

-- 16. Verify single-bucket postgres-backed atomic rate limiting works
SELECT is(
    public.check_and_increment_rate_limit('test_bucket_hash_1', 2, '1 minute', '5 minutes'),
    true,
    'First rate-limited request is permitted'
);

SELECT is(
    public.check_and_increment_rate_limit('test_bucket_hash_1', 2, '1 minute', '5 minutes'),
    true,
    'Second rate-limited request is permitted'
);

SELECT is(
    public.check_and_increment_rate_limit('test_bucket_hash_1', 2, '1 minute', '5 minutes'),
    false,
    'Third rate-limited request exceeds threshold of 2 and is blocked'
);

-- 16B. Verify dual-bucket atomic evaluation (succeeds when both buckets are within limits)
SELECT is(
    public.check_and_increment_rate_limits('source_ok', 5, '1 minute', '5 minutes', 'target_ok', 3, '1 minute', '5 minutes'),
    true,
    'Dual-bucket evaluation permits request when both source and target are under limits'
);

-- 16C. Verify dual-bucket atomic evaluation blocks when source-wide bucket is exceeded
SELECT is(
    public.check_and_increment_rate_limits('source_blocked', 1, '1 minute', '5 minutes', 'target_any', 5, '1 minute', '5 minutes'),
    true,
    'First request on source-limited bucket is allowed'
);

SELECT is(
    public.check_and_increment_rate_limits('source_blocked', 1, '1 minute', '5 minutes', 'target_any', 5, '1 minute', '5 minutes'),
    false,
    'Second request is blocked because source-wide bucket limit of 1 is exceeded'
);

-- 16D. Verify dual-bucket atomic evaluation blocks when target-specific bucket is exceeded
SELECT is(
    public.check_and_increment_rate_limits('source_many', 10, '1 minute', '5 minutes', 'target_blocked', 1, '1 minute', '5 minutes'),
    true,
    'First request on target-limited bucket is allowed'
);

SELECT is(
    public.check_and_increment_rate_limits('source_many', 10, '1 minute', '5 minutes', 'target_blocked', 1, '1 minute', '5 minutes'),
    false,
    'Second request is blocked because target-specific bucket limit of 1 is exceeded'
);

-- 17. Verify raw IP addresses are not stored in the rate limits table
SELECT is(
    (SELECT count(*)::int FROM pg_attribute WHERE attrelid = 'public.recovery_rate_limits'::regclass AND attname IN ('ip', 'ip_address', 'client_ip', 'raw_ip')),
    0,
    'Rate-limiting table must not contain any raw IP address column names'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 18-20: Status Polling Optimization (Audit Log Exclusion)
-- ─────────────────────────────────────────────────────────────────────────────

-- 18. Check status label mapping
SELECT is(
    (public.get_visitor_inquiry_status('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha'))->>'visitor_status_label',
    'Waiting for confirmation',
    'Awaiting visitor internal status maps correctly to calm friendly label'
);

-- 19. Verify polling does not create audit-log entries
SELECT is(
    (SELECT count(*)::int FROM public.audit_logs WHERE action = 'visitor_retrieved_status'),
    0,
    'Status polling must never write routine read events into the governance audit logs'
);

-- 20. Verify active proposal contains expected safe details and no leaks
SELECT is(
    (public.get_visitor_active_proposal('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha'))->>'proposal_found',
    'true',
    'Active proposal details are found successfully'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tests 21-23: Atomic Proposal Confirmation
-- ─────────────────────────────────────────────────────────────────────────────

-- 21. Confirm transitions inquiry to 'confirmed'
SELECT is(
    (public.confirm_proposal('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha', 'e101e101-e101-e101-e101-e101e101e101'))->>'status',
    'confirmed',
    'Proposal confirmation successfully updates and returns confirmed'
);

-- 22. Verify match table selection state
SELECT results_eq(
    $$ SELECT status FROM public.inquiry_matches WHERE id = 'e101e101-e101-e101-e101-e101e101e101' $$,
    $$ VALUES ('selected'::public.match_status) $$,
    'Current match status transitions to selected'
);

-- 23. Verify confirm writes a single clean audit log
SELECT is(
    (SELECT count(*)::int FROM public.audit_logs WHERE action = 'proposal_confirmed' AND resource_id = 'e101e101-e101-e101-e101-e101e101e101'),
    1,
    'One proposal_confirmed governance event must be logged securely'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 24-25: Distinct Decline Semantics & Audit Hygiene (No free-text reason)
-- ─────────────────────────────────────────────────────────────────────────────

-- Reset state for decline test
UPDATE public.inquiries SET status = 'awaiting_visitor' WHERE id = 'd901d901-d901-d901-d901-d901d901d901';
UPDATE public.inquiry_matches SET status = 'responded' WHERE id = 'e101e101-e101-e101-e101-e101e101e101';
UPDATE public.partner_responses SET status = 'submitted' WHERE match_id = 'e101e101-e101-e101-e101-e101e101e101';
UPDATE public.inquiry_candidates SET candidate_status = 'offered' WHERE inquiry_id = 'd901d901-d901-d901-d901-d901d901d901';

CREATE TEMP TABLE t_decline_prop AS
SELECT public.decline_proposal('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha', 'e101e101-e101-e101-e101-e101e101e101', 'Too expensive') AS res;

-- 24. Verify inquiry canceled
SELECT is(
    (SELECT res->>'status' FROM t_decline_prop),
    'canceled',
    'Decline proposal cancels the request'
);

-- 25. Verify metadata contains NO free-text reason
SELECT is(
    ((SELECT safe_metadata FROM public.audit_logs WHERE action = 'proposal_declined' ORDER BY created_at DESC LIMIT 1) ? 'decline_reason' OR
     (SELECT safe_metadata FROM public.audit_logs WHERE action = 'proposal_declined' ORDER BY created_at DESC LIMIT 1) ? 'skip_reason'),
    false,
    'Decline audit metadata must never store free-text decline_reason or skip_reason strings'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 26-27: Alternative Option Semantics & Audit Hygiene (No free-text reason)
-- ─────────────────────────────────────────────────────────────────────────────

-- Reset state for request alternative test
UPDATE public.inquiries SET status = 'awaiting_visitor' WHERE id = 'd901d901-d901-d901-d901-d901d901d901';
UPDATE public.inquiry_matches SET status = 'responded' WHERE id = 'e101e101-e101-e101-e101-e101e101e101';
UPDATE public.partner_responses SET status = 'submitted' WHERE match_id = 'e101e101-e101-e101-e101-e101e101e101';
UPDATE public.inquiry_candidates SET candidate_status = 'offered' WHERE inquiry_id = 'd901d901-d901-d901-d901-d901d901d901';

CREATE TEMP TABLE t_alt_prop AS
SELECT public.request_alternative_option('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha', 'e101e101-e101-e101-e101-e101e101e101', 'Change date') AS res;

-- 26. Verify inquiry returned to matching
SELECT is(
    (SELECT res->>'status' FROM t_alt_prop),
    'matching',
    'Alternative request transitions inquiry status to matching'
);

-- 27. Verify metadata contains reason_provided: true instead of free-text skip reason
SELECT is(
    (SELECT (safe_metadata->>'reason_provided')::boolean FROM public.audit_logs WHERE action = 'proposal_alternative_requested' ORDER BY created_at DESC LIMIT 1),
    true,
    'Alternative request audit metadata contains reason_provided boolean indicator'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 28: Repetitive Action Prevention (Idempotency and State Violations)
-- ─────────────────────────────────────────────────────────────────────────────

-- Since inquiry status is 'matching', calling confirm_proposal must throw and abort atomically
SELECT throws_ok(
    $$ SELECT public.confirm_proposal('d901d901-d901-d901-d901-d901d901d901', 'secret_token_alpha', 'e101e101-e101-e101-e101-e101e101e101') $$,
    'Inquiry is not awaiting visitor resolution',
    'Must reject repeated or out-of-order actions on already resolved status'
);

-- Finish pgTAP tests
SELECT * FROM finish();
ROLLBACK;
