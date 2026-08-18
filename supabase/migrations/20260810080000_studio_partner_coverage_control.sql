-- IDEMO Studio Partner Coverage Control Migration
-- Migration: 20260810080000_studio_partner_coverage_control.sql

-- 1. Create status enums for Coverage Control dimensions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qualification_state') THEN
    CREATE TYPE public.qualification_state AS ENUM ('research', 'preliminary', 'idemo_selected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participation_state') THEN
    CREATE TYPE public.participation_state AS ENUM ('not_contacted', 'introduction_ready', 'introduced', 'confirmed', 'declined', 'withdrawn');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passport_verification_state') THEN
    CREATE TYPE public.passport_verification_state AS ENUM ('not_started', 'draft', 'submitted', 'under_review', 'partial', 'verified', 'review_required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routing_pool_state') THEN
    CREATE TYPE public.routing_pool_state AS ENUM ('active', 'inactive', 'suspended');
  END IF;
END $$;

-- 2. Create authoritative recommendation-partner eligibility table
CREATE TABLE IF NOT EXISTS public.recommendation_partner_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id VARCHAR(100) NOT NULL,
  partner_id VARCHAR(100) NOT NULL,
  qualification_state public.qualification_state NOT NULL DEFAULT 'preliminary',
  participation_state public.participation_state NOT NULL DEFAULT 'not_contacted',
  passport_state public.passport_verification_state NOT NULL DEFAULT 'not_started',
  routing_state public.routing_pool_state NOT NULL DEFAULT 'inactive',
  contact_email TEXT NULL,
  contact_phone TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rec_partner_eligibility UNIQUE(recommendation_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_partner_eligibility_rec_routing 
ON public.recommendation_partner_eligibility (recommendation_id, routing_state);

CREATE INDEX IF NOT EXISTS idx_rec_partner_eligibility_partner 
ON public.recommendation_partner_eligibility (partner_id);

-- Enable RLS
ALTER TABLE public.recommendation_partner_eligibility ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
DROP POLICY IF EXISTS service_role_all_rec_partner_eligibility ON public.recommendation_partner_eligibility;
CREATE POLICY service_role_all_rec_partner_eligibility ON public.recommendation_partner_eligibility
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated studio users read policy
DROP POLICY IF EXISTS authenticated_read_rec_partner_eligibility ON public.recommendation_partner_eligibility;
CREATE POLICY authenticated_read_rec_partner_eligibility ON public.recommendation_partner_eligibility
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. RPC: Select & Release Partner Coverage
CREATE OR REPLACE FUNCTION public.select_and_release_partner_coverage_secure(
  p_recommendation_id VARCHAR(100),
  p_partner_id VARCHAR(100),
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.recommendation_partner_eligibility%ROWTYPE;
BEGIN
  IF p_recommendation_id IS NULL OR TRIM(p_recommendation_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_REC_ID', 'message', 'Recommendation ID is required.');
  END IF;

  IF p_partner_id IS NULL OR TRIM(p_partner_id) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_PARTNER_ID', 'message', 'Partner ID is required.');
  END IF;

  -- Atomic Insert / Update
  INSERT INTO public.recommendation_partner_eligibility (
    recommendation_id,
    partner_id,
    qualification_state,
    participation_state,
    passport_state,
    routing_state,
    contact_email,
    contact_phone,
    updated_at
  ) VALUES (
    TRIM(p_recommendation_id),
    TRIM(p_partner_id),
    'idemo_selected'::public.qualification_state,
    'introduction_ready'::public.participation_state,
    'not_started'::public.passport_verification_state,
    'active'::public.routing_pool_state,
    NULLIF(TRIM(p_contact_email), ''),
    NULLIF(TRIM(p_contact_phone), ''),
    NOW()
  )
  ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
    qualification_state = 'idemo_selected'::public.qualification_state,
    participation_state = CASE 
      WHEN public.recommendation_partner_eligibility.participation_state = 'declined' THEN 'introduction_ready'::public.participation_state 
      ELSE public.recommendation_partner_eligibility.participation_state 
    END,
    routing_state = 'active'::public.routing_pool_state,
    contact_email = COALESCE(NULLIF(TRIM(p_contact_email), ''), public.recommendation_partner_eligibility.contact_email),
    contact_phone = COALESCE(NULLIF(TRIM(p_contact_phone), ''), public.recommendation_partner_eligibility.contact_phone),
    updated_at = NOW()
  RETURNING * INTO v_record;

  -- Log Audit Event
  BEGIN
    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    ) VALUES (
      p_operator_id,
      'admin',
      'SELECT_AND_RELEASE_COVERAGE',
      'partner_coverage',
      v_record.id,
      'success',
      jsonb_build_object(
        'recommendation_id', p_recommendation_id,
        'partner_id', p_partner_id,
        'routing_state', v_record.routing_state,
        'participation_state', v_record.participation_state
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Continue if audit log table structure or trigger varies
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'record', jsonb_build_object(
      'id', v_record.id,
      'recommendation_id', v_record.recommendation_id,
      'partner_id', v_record.partner_id,
      'qualification_state', v_record.qualification_state,
      'participation_state', v_record.participation_state,
      'passport_state', v_record.passport_state,
      'routing_state', v_record.routing_state,
      'contact_email', v_record.contact_email,
      'contact_phone', v_record.contact_phone,
      'updated_at', v_record.updated_at
    )
  );
END;
$$;

-- 4. RPC: Update Partner Coverage Status
CREATE OR REPLACE FUNCTION public.update_partner_coverage_status_secure(
  p_recommendation_id VARCHAR(100),
  p_partner_id VARCHAR(100),
  p_routing_state public.routing_pool_state DEFAULT NULL,
  p_participation_state public.participation_state DEFAULT NULL,
  p_passport_state public.passport_verification_state DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.recommendation_partner_eligibility%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM public.recommendation_partner_eligibility
  WHERE recommendation_id = TRIM(p_recommendation_id)
    AND partner_id = TRIM(p_partner_id);

  IF v_record.id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND', 'message', 'Eligibility record not found.');
  END IF;

  UPDATE public.recommendation_partner_eligibility
  SET
    routing_state = COALESCE(p_routing_state, routing_state),
    participation_state = COALESCE(p_participation_state, participation_state),
    passport_state = COALESCE(p_passport_state, passport_state),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = v_record.id
  RETURNING * INTO v_record;

  -- Log Audit Event
  BEGIN
    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    ) VALUES (
      p_operator_id,
      'admin',
      'UPDATE_COVERAGE_STATUS',
      'partner_coverage',
      v_record.id,
      'success',
      jsonb_build_object(
        'recommendation_id', p_recommendation_id,
        'partner_id', p_partner_id,
        'new_routing_state', v_record.routing_state,
        'new_participation_state', v_record.participation_state,
        'new_passport_state', v_record.passport_state
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'record', jsonb_build_object(
      'id', v_record.id,
      'recommendation_id', v_record.recommendation_id,
      'partner_id', v_record.partner_id,
      'qualification_state', v_record.qualification_state,
      'participation_state', v_record.participation_state,
      'passport_state', v_record.passport_state,
      'routing_state', v_record.routing_state,
      'updated_at', v_record.updated_at
    )
  );
END;
$$;

-- 5. RPC: Fetch Partner Coverage Matrix
CREATE OR REPLACE FUNCTION public.fetch_partner_coverage_matrix_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'recommendation_id', recommendation_id,
      'partner_id', partner_id,
      'qualification_state', qualification_state,
      'participation_state', participation_state,
      'passport_state', passport_state,
      'routing_state', routing_state,
      'contact_email', contact_email,
      'contact_phone', contact_phone,
      'notes', notes,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_results
  FROM public.recommendation_partner_eligibility;

  RETURN jsonb_build_object(
    'success', TRUE,
    'matrix', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

-- Grant EXECUTE privileges to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.select_and_release_partner_coverage_secure TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_coverage_status_secure TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_partner_coverage_matrix_secure TO service_role, authenticated;
