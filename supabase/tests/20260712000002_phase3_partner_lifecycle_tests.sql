-- IDEMO PARTNER ROUTING ENGINE - PHASE 3: PARTNER OPPORTUNITY LIFECYCLE TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.2.0 (Phase 3 Testing Baseline)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Setup pgTAP plan (23 tests for high validation fidelity)
SELECT plan(23);

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup Mock Data for Phase 3 Verification
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Metadata
INSERT INTO public.service_areas (id, name_en, name_sr) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Belgrade Center', 'Beograd Centar');

INSERT INTO public.languages (id, code, name) 
VALUES ('22222222-2222-2222-2222-222222222222', 'sr', 'Serbian');

INSERT INTO public.capabilities (id, code, label_en, label_sr) VALUES 
('33333333-3333-3333-3333-333333333333', 'cap-01', 'Driver', 'Vozač'),
('33333333-3333-3333-3333-333333333334', 'cap-02', 'English Speaker', 'Govori Engleski');

-- 2. Recommendation
INSERT INTO public.recommendations (id, title_en, title_sr, service_area_id)
VALUES ('44444444-4444-4444-4444-444444444444', 'Savamala Night Walk', 'Savamala noćna šetnja', '11111111-1111-1111-1111-111111111111');

-- Associate required capabilities with recommendation
INSERT INTO public.recommendation_capabilities (recommendation_id, capability_id, requirement_level) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'required'),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333334', 'required');

-- 3. Auth User & Partner (Alpha)
INSERT INTO auth.users (id, email, aud, role) VALUES 
('99999999-9999-9999-9999-999999999999', 'partner-alpha@example.com', 'authenticated', 'authenticated'),
('88888888-8888-8888-8888-888888888888', 'partner-beta@example.com', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.partners (id, auth_user_id, name, status, is_open_for_inquiries) VALUES 
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Partner Alpha', 'active', true),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', 'Partner Beta', 'active', true);

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'approved'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'approved');

INSERT INTO public.partner_languages (partner_id, language_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'approved'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'approved');

INSERT INTO public.partner_capabilities (partner_id, capability_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'approved'),
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333334', 'approved'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'approved'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333334', 'approved');

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 1: Function Existence and Signatures
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_function('public', 'view_opportunity', ARRAY['uuid'], 'view_opportunity(UUID) must exist');
SELECT has_function('public', 'accept_opportunity', ARRAY['uuid', 'text'], 'accept_opportunity(UUID, TEXT) must exist');
SELECT has_function('public', 'propose_alternative_opportunity', ARRAY['uuid', 'text', 'timestamp with time zone', 'timestamp with time zone'], 'propose_alternative_opportunity must exist');
SELECT has_function('public', 'decline_opportunity', ARRAY['uuid', 'text'], 'decline_opportunity(UUID, TEXT) must exist');

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup Active Opportunity (Match)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.inquiries (
    id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
    requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    'd801d801-d801-d801-d801-d801d801d801', '44444444-4444-4444-4444-444444444444', 'matching', 'Need a ride',
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-123-ABC', 'hash', now() + interval '10 days'
);

INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
('d801d801-d801-d801-d801-d801d801d801', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 1, 'offered');

INSERT INTO public.inquiry_matches (id, inquiry_id, partner_id, status, offered_at, expires_at) VALUES 
('e001e001-e001-e001-e001-e001e001e001', 'd801d801-d801-d801-d801-d801d801d801', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'offered', now(), now() + interval '2 hours');

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 2: Caller Authorization and Security Checks
-- ─────────────────────────────────────────────────────────────────────────────

-- Set claims context to a random unauthorized user
SELECT set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);

SELECT throws_ok(
    $$ SELECT public.view_opportunity('e001e001-e001-e001-e001-e001e001e001') $$,
    'Partner profile not found or unauthorized',
    'Must fail view_opportunity if caller does not have an active partner profile'
);

-- Set claims context to Alpha Partner
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 3: Successful view_opportunity Execution
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE t_view_res AS SELECT public.view_opportunity('e001e001-e001-e001-e001-e001e001e001') AS res;

SELECT is(
    (SELECT res->>'status' FROM t_view_res),
    'viewed',
    'Opportunity status should transition to viewed'
);

SELECT results_eq(
    $$ SELECT status FROM public.inquiry_matches WHERE id = 'e001e001-e001-e001-e001-e001e001e001' $$,
    $$ VALUES ('viewed'::public.match_status) $$,
    'Database match status must be viewed'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.audit_logs WHERE action = 'opportunity_viewed' AND resource_id = 'e001e001-e001-e001-e001-e001e001e001' $$,
    $$ VALUES (1) $$,
    'Exactly one audit log entry must be written on opportunity view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 4: Idempotent call to view_opportunity
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE t_view_idem AS SELECT public.view_opportunity('e001e001-e001-e001-e001-e001e001e001') AS res;

SELECT is(
    (SELECT res->>'message' FROM t_view_idem),
    'Opportunity already marked as viewed',
    'Viewing a viewed opportunity should be idempotent'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 5: Successful accept_opportunity Execution
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE t_accept_res AS SELECT public.accept_opportunity('e001e001-e001-e001-e001-e001e001e001', 'Gladly accepted!') AS res;

SELECT is(
    (SELECT res->>'status' FROM t_accept_res),
    'responded',
    'Match status should transition to responded upon acceptance'
);

SELECT results_eq(
    $$ SELECT status FROM public.inquiry_matches WHERE id = 'e001e001-e001-e001-e001-e001e001e001' $$,
    $$ VALUES ('responded'::public.match_status) $$,
    'Database match status must be responded after acceptance'
);

SELECT results_eq(
    $$ SELECT status FROM public.inquiries WHERE id = 'd801d801-d801-d801-d801-d801d801d801' $$,
    $$ VALUES ('awaiting_visitor'::public.inquiry_status) $$,
    'Associated inquiry status must transition to awaiting_visitor'
);

SELECT results_eq(
    $$ SELECT response_type, message, proposed_start_at, proposed_end_at FROM public.partner_responses WHERE match_id = 'e001e001-e001-e001-e001-e001e001e001' $$,
    $$ SELECT 'accept_as_requested'::public.response_type, 'Gladly accepted!'::text, requested_start_at, requested_end_at FROM public.inquiries WHERE id = 'd801d801-d801-d801-d801-d801d801d801' $$,
    'Response entry must have correct type, message and match original requested dates'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.audit_logs WHERE action = 'opportunity_accepted' AND resource_id = 'e001e001-e001-e001-e001-e001e001e001' $$,
    $$ VALUES (1) $$,
    'Exactly one audit log entry must be written on opportunity acceptance'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 6: Illegal state transitions on already responded opportunity
-- ─────────────────────────────────────────────────────────────────────────────

SELECT throws_ok(
    $$ SELECT public.accept_opportunity('e001e001-e001-e001-e001-e001e001e001', 'Try again') $$,
    'Illegal state transition from responded',
    'Must block accept_opportunity if match status is not offered or viewed'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 7: Successful propose_alternative_opportunity Execution
-- ─────────────────────────────────────────────────────────────────────────────

-- Create second opportunity
INSERT INTO public.inquiries (
    id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
    requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    'd801d801-d801-d801-d801-d801d801d802', '44444444-4444-4444-4444-444444444444', 'matching', 'Alternative requested',
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-456-XYZ', 'hash2', now() + interval '10 days'
);

INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
('d801d801-d801-d801-d801-d801d801d802', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 1, 'offered');

INSERT INTO public.inquiry_matches (id, inquiry_id, partner_id, status, offered_at, expires_at) VALUES 
('e001e001-e001-e001-e001-e001e001e002', 'd801d801-d801-d801-d801-d801d801d802', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'offered', now(), now() + interval '2 hours');

CREATE TEMP TABLE t_alt_res AS SELECT public.propose_alternative_opportunity(
    'e001e001-e001-e001-e001-e001e001e002',
    'Can we start 2 hours later?',
    now() + interval '1 day 2 hours',
    now() + interval '1 day 4 hours'
) AS res;

SELECT is(
    (SELECT res->>'status' FROM t_alt_res),
    'responded',
    'Match status should transition to responded upon alternative proposal'
);

SELECT results_eq(
    $$ SELECT response_type, message, proposed_start_at, proposed_end_at FROM public.partner_responses WHERE match_id = 'e001e001-e001-e001-e001-e001e001e002' $$,
    $$ SELECT 'propose_alternative'::public.response_type, 'Can we start 2 hours later?'::text, now() + interval '1 day 2 hours', now() + interval '1 day 4 hours' $$,
    'Response entry must have correct alternative type and proposed start/end dates'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 8: Propose Alternative Error Handlers (Dates Validation)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create third opportunity
INSERT INTO public.inquiries (
    id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
    requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    'd801d801-d801-d801-d801-d801d801d803', '44444444-4444-4444-4444-444444444444', 'matching', 'Need third ride',
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-123-111', 'hash3', now() + interval '10 days'
);

INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
('d801d801-d801-d801-d801-d801d801d803', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 1, 'offered');

INSERT INTO public.inquiry_matches (id, inquiry_id, partner_id, status, offered_at, expires_at) VALUES 
('e001e001-e001-e001-e001-e001e001e003', 'd801d801-d801-d801-d801-d801d801d803', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'offered', now(), now() + interval '2 hours');

SELECT throws_ok(
    $$ SELECT public.propose_alternative_opportunity(
        'e001e001-e001-e001-e001-e001e001e003',
        'End before start',
        now() + interval '2 days',
        now() + interval '1 day'
    ) $$,
    'Proposed end time must be after start time',
    'Must fail propose_alternative if proposed end is before proposed start'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 9: Successful decline_opportunity Execution
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE t_decline_res AS SELECT public.decline_opportunity('e001e001-e001-e001-e001-e001e001e003', 'Too busy with Belgrade EXPO preparations') AS res;

SELECT is(
    (SELECT res->>'status' FROM t_decline_res),
    'declined',
    'Match status should transition to declined upon decline'
);

SELECT results_eq(
    $$ SELECT status FROM public.inquiry_matches WHERE id = 'e001e001-e001-e001-e001-e001e001e003' $$,
    $$ VALUES ('declined'::public.match_status) $$,
    'Database match status must be declined'
);

SELECT results_eq(
    $$ SELECT candidate_status FROM public.inquiry_candidates WHERE inquiry_id = 'd801d801-d801-d801-d801-d801d801d803' AND partner_id = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa' $$,
    $$ VALUES ('skipped'::public.candidate_status) $$,
    'Candidate queue status must transition to skipped'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.audit_logs WHERE action = 'opportunity_declined' AND resource_id = 'e001e001-e001-e001-e001-e001e001e003' $$,
    $$ VALUES (1) $$,
    'Exactly one audit log entry must be written on opportunity decline'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 10: Decline or View Expired Match Error Handling
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.inquiries (
    id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
    requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    'd801d801-d801-d801-d801-d801d801d804', '44444444-4444-4444-4444-444444444444', 'matching', 'Need fourth ride',
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    now() + interval '1 day', now() + interval '1 day 2 hours', 'IDM-123-222', 'hash4', now() + interval '10 days'
);

INSERT INTO public.inquiry_candidates (inquiry_id, partner_id, queue_order, candidate_status) VALUES 
('d801d801-d801-d801-d801-d801d801d804', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 1, 'offered');

INSERT INTO public.inquiry_matches (id, inquiry_id, partner_id, status, offered_at, expires_at) VALUES 
('e001e001-e001-e001-e001-e001e001e004', 'd801d801-d801-d801-d801-d801d801d804', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'offered', now() - interval '3 hours', now() - interval '1 hour');

SELECT throws_ok(
    $$ SELECT public.view_opportunity('e001e001-e001-e001-e001-e001e001e004') $$,
    'Opportunity has expired',
    'Must fail view_opportunity if match has expired'
);

-- Finish pgTAP suite and roll back to leave clean database
SELECT * FROM finish();
ROLLBACK;
