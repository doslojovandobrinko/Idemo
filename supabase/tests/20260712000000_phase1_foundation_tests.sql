-- IDEMO PARTNER ROUTING ENGINE - PHASE 1: DATABASE TESTS (pgTAP Spec)
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.0.0 (Phase 1 Baseline)
-- Language: PL/pgSQL / SQL (pgTAP)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SET LOCAL search_path = public, extensions, pg_catalog;

-- Grant temporary EXECUTE privileges on pgTAP assertion functions to anon and authenticated for RLS testing
GRANT EXECUTE ON FUNCTION extensions.is_empty(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION extensions.results_eq(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION extensions.throws_ok(text, character, text, text) TO anon, authenticated;

-- Setup pgTAP plan (11 tests)
SELECT plan(11);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 1 & 2: Row Level Security (RLS) Activation Verification
-- ─────────────────────────────────────────────────────────────────────────────

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inquiries'::regclass $$,
    $$ VALUES (true) $$,
    'RLS must be active on inquiries table'
);
SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inquiry_private_contacts'::regclass $$,
    $$ VALUES (true) $$,
    'RLS must be active on inquiry_private_contacts table'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Setup Mock Data for Access Control and Constraints Tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Create a mock Service Area and Language
INSERT INTO public.service_areas (id, name_en, name_sr) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Belgrade Center', 'Beograd Centar');

INSERT INTO public.languages (id, code, name) 
VALUES ('22222222-2222-2222-2222-222222222222', 'sr', 'Serbian');

INSERT INTO public.capabilities (id, code, label_en, label_sr)
VALUES ('33333333-3333-3333-3333-333333333333', 'cap-01', 'Driver', 'Vozač');

-- Create a mock Recommendation
INSERT INTO public.recommendations (id, title_en, title_sr, service_area_id)
VALUES ('44444444-4444-4444-4444-444444444444', 'Savamala Night Walk', 'Savamala noćna šetnja', '11111111-1111-1111-1111-111111111111');

-- Create mock Auth Users
INSERT INTO auth.users (id, email, aud, role) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'visitor@example.com', 'authenticated', 'authenticated'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'partner@example.com', 'authenticated', 'authenticated'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'other_visitor@example.com', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create mock Partner
INSERT INTO public.partners (id, auth_user_id, name, status)
VALUES ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Branko VIP Transport', 'active');

-- Create mock Inquiry
INSERT INTO public.inquiries (
    id, recommendation_id, visitor_auth_user_id, status, visitor_notes, 
    preferred_language_id, service_area_id, requested_start_at, requested_end_at, 
    public_reference_code, recovery_token_hash, recovery_token_expires_at
) VALUES (
    '99999999-9999-9999-9999-999999999999', 
    '44444444-4444-4444-4444-444444444444', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    'new', 
    'Looking for local food recommendations', 
    '22222222-2222-2222-2222-222222222222', 
    '11111111-1111-1111-1111-111111111111', 
    now() + interval '1 day', 
    now() + interval '1 day 2 hours',
    'IDM-123-ABC',
    'f6e0a1e2acbc...',
    now() + interval '24 hours'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 3: RLS SELECT test for unauthenticated anonymous users (role: anon)
-- ─────────────────────────────────────────────────────────────────────────────

SET LOCAL ROLE anon;
SELECT throws_ok(
    $$ SELECT * FROM public.inquiries $$,
    '42501'::character(5),
    NULL,
    'Anonymous visitors must have ZERO direct select access to the inquiries table'
);
RESET ROLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 4: RLS SELECT test for anonymous Auth visitor (role: authenticated)
-- ─────────────────────────────────────────────────────────────────────────────

-- Set role to authenticated and simulate Visitor A (who owns the inquiry)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT results_eq(
    $$ SELECT id FROM public.inquiries $$,
    $$ VALUES ('99999999-9999-9999-9999-999999999999'::uuid) $$,
    'Visitor can see their own inquiry'
);
RESET ROLE;

-- Simulate Visitor B (different authenticated user)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
SELECT is_empty(
    $$ SELECT * FROM public.inquiries $$,
    'An authenticated visitor cannot view inquiries belonging to another user'
);
RESET ROLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 5: Restrict direct client access to system_settings
-- ─────────────────────────────────────────────────────────────────────────────

SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$ SELECT * FROM public.system_settings $$,
    '42501'::character(5),
    NULL,
    'System settings must never be readable directly by clients'
);
RESET ROLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 6: Trigger Verification - Mutability Block on Audit Logs
-- ─────────────────────────────────────────────────────────────────────────────

-- Populate initial audit log record
INSERT INTO public.audit_logs (
    id, actor_role, action, resource_type, resource_id
) VALUES (
    'defdefde-fdef-defd-efde-fdefdefdefde', 'partner', 'test_action', 'inquiries', '99999999-9999-9999-9999-999999999999'
);

SELECT throws_ok(
    $$ UPDATE public.audit_logs SET action = 'illegal_mutation' WHERE id = 'defdefde-fdef-defd-efde-fdefdefdefde' $$,
    'Audit zapisi su trajni i nepromenljivi. UPDATE i DELETE operacije su strogo zabranjene.',
    'Database trigger must block any updates to the audit_logs table'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 7: Unique Active Match Per Inquiry (Routing Safety Constraint)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT throws_ok(
    $$ INSERT INTO public.inquiry_matches (inquiry_id, partner_id, status, expires_at) 
       VALUES 
       ('99999999-9999-9999-9999-999999999999'::uuid, '77777777-7777-7777-7777-777777777777'::uuid, 'offered'::public.match_status, now() + interval '2 hours'),
       ('99999999-9999-9999-9999-999999999999'::uuid, '77777777-7777-7777-7777-777777777777'::uuid, 'viewed'::public.match_status, now() + interval '2 hours') $$,
    '23505'::character(5),
    NULL,
    'Unique partial index must block having multiple active offered/viewed matches on the same inquiry'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 8: Partner Portfolio Integrity Rule - Approved capabilities deletion block
-- ─────────────────────────────────────────────────────────────────────────────

-- Add approved capability to partner portfolio
INSERT INTO public.partner_capabilities (partner_id, capability_id, status)
VALUES ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'approved');

-- Standard RLS delete policy limits deletion to status = 'proposed'
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT is_empty(
    $$ DELETE FROM public.partner_capabilities WHERE partner_id = '77777777-7777-7777-7777-777777777777' RETURNING * $$,
    'RLS policy must silently prevent deletion of approved partner portfolio capabilities'
);
RESET ROLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test 9 & 10: Implicit Grants Matrix - Client Denial Tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify that unauthenticated or authenticated user has zero grant access to sensitive tables
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT throws_ok(
    $$ SELECT * FROM public.inquiry_candidates $$,
    '42501'::character(5),
    NULL,
    'Direct SELECT on inquiry_candidates table must be blocked by explicit REVOKE grants'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT throws_ok(
    $$ SELECT * FROM public.inquiry_private_contacts $$,
    '42501'::character(5),
    NULL,
    'Direct SELECT on inquiry_private_contacts table must be blocked by explicit REVOKE grants'
);
RESET ROLE;

-- Complete pgTAP test suite run
SELECT * FROM finish();
ROLLBACK;
