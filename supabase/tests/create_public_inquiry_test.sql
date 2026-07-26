-- IDEMO Phase 6B - Slice 4: Acceptance Tests for create_public_inquiry RPC
-- Test file: supabase/tests/create_public_inquiry_test.sql

BEGIN;

-- Setup test variables
DO $$
DECLARE
    v_rec_id UUID;
    v_lang_id UUID;
    v_area_id UUID;
    v_client_req_id UUID := gen_random_uuid();
    v_res1 JSONB;
    v_res2 JSONB;
BEGIN
    SELECT id INTO v_rec_id FROM public.recommendations LIMIT 1;
    SELECT id INTO v_lang_id FROM public.languages LIMIT 1;
    SELECT id INTO v_area_id FROM public.service_areas LIMIT 1;

    IF v_rec_id IS NULL OR v_lang_id IS NULL OR v_area_id IS NULL THEN
        RAISE NOTICE 'Test skipped: Seed data missing.';
        RETURN;
    END IF;

    -- Test 1: Initial creation with client_request_id
    v_res1 := public.create_public_inquiry(
        p_recommendation_id := v_rec_id,
        p_visitor_notes := 'Test Slice 4 inquiry notes',
        p_preferred_language_id := v_lang_id,
        p_service_area_id := v_area_id,
        p_requested_start_at := now() + interval '1 day',
        p_requested_end_at := now() + interval '1 day 2 hours',
        p_visitor_name := 'Test Visitor',
        p_email := 'test.visitor@idemo.app',
        p_client_request_id := v_client_req_id
    );

    IF (v_res1->>'is_duplicate')::boolean IS NOT FALSE THEN
        RAISE EXCEPTION 'Test 1 Failed: Initial request should not be duplicate.';
    END IF;

    -- Test 2: Idempotent replay with same client_request_id
    v_res2 := public.create_public_inquiry(
        p_recommendation_id := v_rec_id,
        p_visitor_notes := 'Test Slice 4 inquiry notes duplicate',
        p_preferred_language_id := v_lang_id,
        p_service_area_id := v_area_id,
        p_requested_start_at := now() + interval '1 day',
        p_requested_end_at := now() + interval '1 day 2 hours',
        p_visitor_name := 'Test Visitor',
        p_email := 'test.visitor@idemo.app',
        p_client_request_id := v_client_req_id
    );

    IF (v_res2->>'is_duplicate')::boolean IS NOT TRUE THEN
        RAISE EXCEPTION 'Test 2 Failed: Replayed request should return is_duplicate = true.';
    END IF;

    IF (v_res1->>'inquiry_id') <> (v_res2->>'inquiry_id') THEN
        RAISE EXCEPTION 'Test 3 Failed: Idempotent response must return matching inquiry_id.';
    END IF;

    RAISE NOTICE 'All create_public_inquiry acceptance tests PASSED successfully.';
END $$;

ROLLBACK;
