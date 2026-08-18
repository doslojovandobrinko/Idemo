-- IDEMO DURABLE RECOMMENDATION DRAFT RESERVATION FOUNDATION
-- Additive Migration File: 20260803000005_wp14c5d_durable_recommendation_draft_reservations.sql
-- Work Package: WP-14C5D1 Durable Draft Reservation Implementation

-- 1. Table: public.recommendation_draft_reservations
CREATE TABLE IF NOT EXISTS public.recommendation_draft_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserved_recommendation_id UUID NOT NULL UNIQUE,
  destination_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE RESTRICT,
  reserved_by UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  correlation_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'abandoned', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NULL,
  abandoned_at TIMESTAMPTZ NULL,
  consumed_at TIMESTAMPTZ NULL,
  CONSTRAINT recommendation_draft_res_unique_scope UNIQUE (reserved_by, destination_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_rec_draft_res_reserved_rec ON public.recommendation_draft_reservations(reserved_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_draft_res_dest ON public.recommendation_draft_reservations(destination_id);
CREATE INDEX IF NOT EXISTS idx_rec_draft_res_by ON public.recommendation_draft_reservations(reserved_by);
CREATE INDEX IF NOT EXISTS idx_rec_draft_res_status ON public.recommendation_draft_reservations(status);

ALTER TABLE public.recommendation_draft_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_draft_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.recommendation_draft_reservations TO service_role;

-- 2. RPC: reserve_recommendation_draft_secure
CREATE OR REPLACE FUNCTION public.reserve_recommendation_draft_secure(
  p_destination_id UUID,
  p_reserved_by UUID,
  p_idempotency_key TEXT,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_destination_exists BOOLEAN;
  v_idempotency_key TEXT;
  v_correlation_id UUID;
  v_existing RECORD;
  v_new_reserved_id UUID;
  v_new_id UUID;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- Validate destination existence
  SELECT EXISTS (
    SELECT 1 FROM public.service_areas WHERE id = p_destination_id
  ) INTO v_destination_exists;

  IF NOT v_destination_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_DESTINATION',
      'message', 'Destination ID does not exist in service areas.'
    );
  END IF;

  -- Validate idempotency key
  v_idempotency_key := NULLIF(trim(p_idempotency_key), '');
  IF v_idempotency_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_IDEMPOTENCY_KEY',
      'message', 'Idempotency key is required and cannot be empty.'
    );
  END IF;

  v_correlation_id := COALESCE(p_correlation_id, gen_random_uuid());

  -- Search for existing active reservation for (reserved_by, destination_id, idempotency_key)
  SELECT id, reserved_recommendation_id, destination_id, status, created_at, expires_at
  INTO v_existing
  FROM public.recommendation_draft_reservations
  WHERE reserved_by = p_reserved_by
    AND destination_id = p_destination_id
    AND idempotency_key = v_idempotency_key
    AND status = 'active';

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'reservation_id', v_existing.id,
      'reserved_recommendation_id', v_existing.reserved_recommendation_id,
      'destination_id', v_existing.destination_id,
      'status', v_existing.status,
      'is_idempotent_replay', true,
      'created_at', v_existing.created_at,
      'expires_at', v_existing.expires_at
    );
  END IF;

  -- Generate new reserved UUID and insert
  v_new_reserved_id := gen_random_uuid();
  v_new_id := gen_random_uuid();

  INSERT INTO public.recommendation_draft_reservations (
    id,
    reserved_recommendation_id,
    destination_id,
    reserved_by,
    idempotency_key,
    correlation_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_new_id,
    v_new_reserved_id,
    p_destination_id,
    p_reserved_by,
    v_idempotency_key,
    v_correlation_id,
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (reserved_by, destination_id, idempotency_key)
  DO UPDATE SET updated_at = timezone('utc'::text, now())
  RETURNING id, reserved_recommendation_id, destination_id, status, created_at, expires_at
  INTO v_existing;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_existing.id,
    'reserved_recommendation_id', v_existing.reserved_recommendation_id,
    'destination_id', v_existing.destination_id,
    'status', v_existing.status,
    'is_idempotent_replay', false,
    'created_at', v_existing.created_at,
    'expires_at', v_existing.expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_recommendation_draft_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_recommendation_draft_secure TO service_role;

-- 3. RPC: abandon_recommendation_draft_secure
CREATE OR REPLACE FUNCTION public.abandon_recommendation_draft_secure(
  p_reserved_recommendation_id UUID,
  p_reserved_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_updated INT;
BEGIN
  UPDATE public.recommendation_draft_reservations
  SET status = 'abandoned',
      abandoned_at = v_now,
      updated_at = v_now
  WHERE reserved_recommendation_id = p_reserved_recommendation_id
    AND reserved_by = p_reserved_by
    AND status = 'active';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RESERVATION_NOT_FOUND',
      'message', 'No active draft reservation found for the specified user and reservation ID.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reserved_recommendation_id', p_reserved_recommendation_id,
    'status', 'abandoned',
    'abandoned_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_recommendation_draft_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_recommendation_draft_secure TO service_role;
