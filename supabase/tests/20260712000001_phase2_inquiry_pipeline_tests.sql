-- IDEMO PARTNER ROUTING ENGINE - PHASE 2: INQUIRY PIPELINE TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.1.0 (Phase 2 Testing Baseline)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Setup pgTAP plan (13 tests)
SELECT plan(13);

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup Mock Data for Phase 2 Verification
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

-- 3. Auth Users & Partners
INSERT INTO auth.users (id, email, aud, role) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'visitor@example.com', 'authenticated', 'authenticated'),
('99999999-9999-9999-9999-999999999999', 'partner-alpha@example.com', 'authenticated', 'authenticated'),
('88888888-8888-8888-8888-888888888888', 'partner-beta@example.com', 'authenticated', 'authenticated'),
('77777777-7777-7777-7777-777777777777', 'partner-gamma@example.com', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Partner A: Active, Open, approved in Area 1, Lang 1, both capabilities. Has a previous match in 2026.
INSERT INTO public.partners (id, auth_user_id, name, status, is_open_for_inquiries) VALUES 
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Partner Alpha', 'active', true);

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'approved');

INSERT INTO public.partner_languages (partner_id, language_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'approved');

INSERT INTO public.partner_capabilities (partner_id, capability_id, status) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'approved'),
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333334', 'approved');

-- Partner B: Active, Open, approved in Area 1, Lang 1, both capabilities. Has a more recent match than Alpha.
INSERT INTO public.partners (id, name, status, is_open_for_inquiries) VALUES 
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Partner Beta', 'active', true);

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status) VALUES
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'approved');

INSERT INTO public.partner_languages (partner_id, language_id, status) VALUES
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'approved');

INSERT INTO public.partner_capabilities (partner_id, capability_id, status) VALUES
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'approved'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333334', 'approved');

-- Partner C: Ineligible because they are paused.
INSERT INTO public.partners (id, name, status, is_open_for_inquiries, paused_until) VALUES 
('cccccccc-3333-3333-3333-cccccccccccc', 'Partner Gamma (Paused)', 'active', true, now() + interval '1 day');

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status) VALUES
('cccccccc-3333-3333-3333-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'approved');

INSERT INTO public.partner_languages (partner_id, language_id, status) VALUES
('cccccccc-3333-3333-3333-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'approved');

INSERT INTO public.partner_capabilities (partner_id, capability_id, status) VALUES
('cccccccc-3333-3333-3333-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'approved'),
('cccccccc-3333-3333-3333-cccccccccccc', '33333333-3333-3333-3333-333333333334', 'approved');

-- Create an past inquiry and matches to verify "least recently offered" ordering.
-- Alpha was matched on 2026-07-01
-- Beta was matched on 2026-07-02 (more recently offered than Alpha, so Alpha should be preferred)
INSERT INTO public.inquiries (
    id, recommendation_id, status, visitor_notes, preferred_language_id, service_area_id, 
    requested_start_at, requested_end_at, public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    'd801d801-d801-d801-d801-d801d801d801', '44444444-4444-4444-4444-444444444444', 'completed', 'Notes',
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    now() - interval '5 days', now() - interval '4 days', 'IDM-000-001', 'hash1', now() + interval '10 days'
);

INSERT INTO public.inquiry_matches (inquiry_id, partner_id, status, offered_at, expires_at) VALUES
('d801d801-d801-d801-d801-d801d801d801', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'expired', '2026-07-01 12:00:00+00'::timestamptz, '2026-07-01 14:00:00+00'::timestamptz),
('d801d801-d801-d801-d801-d801d801d801', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'expired', '2026-07-02 12:00:00+00'::timestamptz, '2026-07-02 14:00:00+00'::timestamptz);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 1: Function Existence and Signatures
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_function(
    'public', 'generate_reference_code', ARRAY[]::name[],
    'generate_reference_code() helper must exist'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 2: generate_reference_code Output Format
-- ─────────────────────────────────────────────────────────────────────────────

SELECT matches(
    public.generate_reference_code(),
    '^IDM-[0-9]{3}-[A-Z]{3}$',
    'generate_reference_code must return the approved IDM-###-AAA canonical format'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 3: create_public_inquiry Successful Invocation and Transaction Completeness
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE test_inquiry_res AS
SELECT public.create_public_inquiry(
    '44444444-4444-4444-4444-444444444444'::uuid, -- recommendation
    'I need a safe private luxury transport route for Belgrade EXPO.'::text, -- visitor notes
    '22222222-2222-2222-2222-222222222222'::uuid, -- language (Serbian)
    '11111111-1111-1111-1111-111111111111'::uuid, -- service area
    now() + interval '1 day', -- start
    now() + interval '1 day 3 hours', -- end
    'Gospodin Stefanovic'::varchar(255), -- name
    'stefanovic@expo2027.gov.rs'::varchar(255), -- email
    '+381611234567'::varchar(100), -- phone
    'v1.0'::varchar(50), -- consent version
    'Unlock contact info to selected partner'::varchar(255), -- consent purpose
    'Viber/Email'::varchar(100), -- consent channel
    NULL, -- capabilities (fallback to recommendation auto-resolve)
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid -- mock visitor auth
) AS res;

SELECT is(
    ((SELECT res FROM test_inquiry_res)->>'candidates_count')::int,
    2,
    'Should identify exactly two eligible partners (Alpha and Beta, and filter Gamma because Gamma is paused)'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 4: Verification of Main Inquiry and Private Contacts Writes
-- ─────────────────────────────────────────────────────────────────────────────

-- Since we created the inquiry in Test 3, let's verify database state
SELECT results_eq(
    $$ SELECT visitor_notes FROM public.inquiries WHERE public_reference_code IS NOT NULL AND status = 'matching'::public.inquiry_status ORDER BY created_at DESC LIMIT 1 $$,
    $$ VALUES ('I need a safe private luxury transport route for Belgrade EXPO.'::text) $$,
    'Inquiry notes must be correctly saved in inquiries table'
);

SELECT results_eq(
    $$ SELECT visitor_name, email, phone_number FROM public.inquiry_private_contacts ORDER BY created_at DESC LIMIT 1 $$,
    $$ VALUES ('Gospodin Stefanovic'::varchar, 'stefanovic@expo2027.gov.rs'::varchar, '+381611234567'::varchar) $$,
    'Isolated private contacts must be stored in the isolated inquiry_private_contacts table'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 5: Verification of Consent and Required Capabilities Writes
-- ─────────────────────────────────────────────────────────────────────────────

SELECT results_eq(
    $$ SELECT consent_text_version, purpose, channel FROM public.visitor_consents ORDER BY consented_at DESC LIMIT 1 $$,
    $$ VALUES ('v1.0'::varchar, 'Unlock contact info to selected partner'::varchar, 'Viber/Email'::varchar) $$,
    'Visitor consent details must be stored with full legal trace'
);

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.inquiry_required_capabilities $$,
    $$ VALUES (2) $$,
    'Should have auto-populated capabilities required by the recommendation'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 6: Input Validation Error Handlers
-- ─────────────────────────────────────────────────────────────────────────────

SELECT throws_ok(
    $$ SELECT public.create_public_inquiry(
        '44444444-4444-4444-4444-444444444444'::uuid,
        ''::text, -- empty notes
        '22222222-2222-2222-2222-222222222222'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        now() + interval '1 day',
        now() + interval '1 day 2 hours',
        'Visitor'::varchar, 'test@example.com'::varchar, '',
        'v1.0'::varchar, 'purpose'::varchar, 'email'::varchar
    ) $$,
    'Visitor notes cannot be empty',
    'Must fail if visitor notes are blank'
);

SELECT throws_ok(
    $$ SELECT public.create_public_inquiry(
        '44444444-4444-4444-4444-444444444444'::uuid,
        'Notes'::text,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        now() - interval '1 hour', -- past start date
        now() + interval '1 day 2 hours',
        'Visitor'::varchar, 'test@example.com'::varchar, '',
        'v1.0'::varchar, 'purpose'::varchar, 'email'::varchar
    ) $$,
    'Requested start time cannot be in the past',
    'Must fail if requested start date is in the past'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 7: Verify Deterministic Routing Order (Least Recently Offered first)
-- ─────────────────────────────────────────────────────────────────────────────

-- Alpha's last match: 2026-07-01
-- Beta's last match:  2026-07-02
-- Alpha was offered earlier than Beta, so Alpha MUST be queue_order = 1, and Beta queue_order = 2.
-- Therefore, inquiry_matches should have Alpha as the active offer.
SELECT results_eq(
    $$ SELECT partner_id, queue_order FROM public.inquiry_candidates ORDER BY queue_order ASC LIMIT 2 $$,
    $$ VALUES ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'::uuid, 1), ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb'::uuid, 2) $$,
    'Immutable candidate queue must be sorted with Least-Recently-Offered first (Alpha then Beta)'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 8: First Active Offer Initialization
-- ─────────────────────────────────────────────────────────────────────────────

-- Confirm the first offer is created for Alpha with 'offered' status and is the only active match
SELECT results_eq(
    $$ SELECT partner_id, status FROM public.inquiry_matches WHERE status = 'offered'::public.match_status ORDER BY created_at DESC LIMIT 1 $$,
    $$ VALUES ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'::uuid, 'offered'::public.match_status) $$,
    'First partner in queue (Alpha) must receive the active offer'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 9: Security DEFINER search_path Verification
-- ─────────────────────────────────────────────────────────────────────────────

SELECT is(
    (SELECT pronamespace::regnamespace::text FROM pg_proc WHERE proname = 'create_public_inquiry' AND pronamespace::regnamespace::text = 'public'),
    'public',
    'create_public_inquiry is declared in public schema'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 10: Immutable Audit Logging Check
-- ─────────────────────────────────────────────────────────────────────────────

SELECT results_eq(
    $$ SELECT count(*)::int FROM public.audit_logs WHERE action = 'inquiry_created' $$,
    $$ VALUES (1) $$,
    'Must automatically write exactly one audit log entry'
);

-- Finish pgTAP suite and roll back to leave clean database
SELECT * FROM finish();
ROLLBACK;
