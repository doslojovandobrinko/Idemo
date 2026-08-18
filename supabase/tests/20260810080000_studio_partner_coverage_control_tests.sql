-- IDEMO Studio Partner Coverage Control Migration Test Suite
-- Test File: 20260810080000_studio_partner_coverage_control_tests.sql

BEGIN;

-- 1. Test Select & Release Partner Coverage
DO $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := public.select_and_release_partner_coverage_secure(
    'REC-084',
    'P-001',
    'test@belgradeinsider.rs',
    '+381 64 372 1524'
  );

  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Test 1 Failed: select_and_release_partner_coverage_secure returned failure: %', v_res;
  END IF;

  IF (v_res->'record'->>'qualification_state') <> 'idemo_selected' THEN
    RAISE EXCEPTION 'Test 1 Failed: qualification_state must be idemo_selected';
  END IF;

  IF (v_res->'record'->>'routing_state') <> 'active' THEN
    RAISE EXCEPTION 'Test 1 Failed: routing_state must be active';
  END IF;

  RAISE NOTICE 'Test 1 Passed: select_and_release_partner_coverage_secure succeeded.';
END $$;

-- 2. Test Update Partner Coverage Status (Decline / Suspend)
DO $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := public.update_partner_coverage_status_secure(
    'REC-084',
    'P-001',
    'suspended'::public.routing_pool_state,
    'declined'::public.participation_state,
    NULL,
    'Partner requested suspension for REC-084'
  );

  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Test 2 Failed: update_partner_coverage_status_secure returned failure';
  END IF;

  IF (v_res->'record'->>'routing_state') <> 'suspended' THEN
    RAISE EXCEPTION 'Test 2 Failed: routing_state should be suspended';
  END IF;

  RAISE NOTICE 'Test 2 Passed: update_partner_coverage_status_secure succeeded.';
END $$;

-- 3. Test Fetch Matrix
DO $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := public.fetch_partner_coverage_matrix_secure();

  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Test 3 Failed: fetch_partner_coverage_matrix_secure returned failure';
  END IF;

  IF jsonb_array_length(v_res->'matrix') < 1 THEN
    RAISE EXCEPTION 'Test 3 Failed: matrix should contain at least 1 record';
  END IF;

  RAISE NOTICE 'Test 3 Passed: fetch_partner_coverage_matrix_secure succeeded.';
END $$;

ROLLBACK;
