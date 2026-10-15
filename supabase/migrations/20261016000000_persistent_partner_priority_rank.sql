-- IDEMO PARTNER ROUTING ENGINE - AUTHORITATIVE PERSISTENT PRIORITY RANK MIGRATION
-- Migration: 20261016000000_persistent_partner_priority_rank.sql
-- Description: Adds priority_rank column and unique rank index to public.recommendation_partner_eligibility,
-- creates set_partner_coverage_priority_rank_secure RPC with advisory xact lock and quota enforcement,
-- revokes PUBLIC execution, and updates fetch_partner_coverage_matrix_secure.

BEGIN;

-- 1. Schema Patch: Add priority_rank column if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'recommendation_partner_eligibility' 
          AND column_name = 'priority_rank'
    ) THEN
        ALTER TABLE public.recommendation_partner_eligibility 
        ADD COLUMN priority_rank INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Enforce Check Constraint: Only NULL or Ranks 1, 2, 3 permitted
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'public' 
          AND table_name = 'recommendation_partner_eligibility' 
          AND constraint_name = 'chk_rpe_priority_rank'
    ) THEN
        ALTER TABLE public.recommendation_partner_eligibility 
        ADD CONSTRAINT chk_rpe_priority_rank CHECK (priority_rank IS NULL OR priority_rank IN (1, 2, 3));
    END IF;
END $$;

-- Enforce Partial Unique Index: Unique occupied rank per recommendation
CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_partner_eligibility_unique_rank 
ON public.recommendation_partner_eligibility (recommendation_id, priority_rank) 
WHERE priority_rank IS NOT NULL;


-- 2. Atomic Rank Assignment & Collision-Free Swap RPC
CREATE OR REPLACE FUNCTION public.set_partner_coverage_priority_rank_secure(
    p_recommendation_id VARCHAR(100),
    p_partner_id VARCHAR(100),
    p_priority_rank INTEGER,
    p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_role TEXT;
    v_auth_role TEXT;
    v_target_record public.recommendation_partner_eligibility%ROWTYPE;
    v_incumbent_record public.recommendation_partner_eligibility%ROWTYPE;
    v_old_rank INTEGER := NULL;
    v_swapped_partner_id VARCHAR(100) := NULL;
    v_target_tier_count INTEGER := 0;
    v_incumbent_tier_count INTEGER := 0;
BEGIN
    v_auth_role := COALESCE(auth.role(), '');

    -- Authorization Enforcement: service_role or Studio administrative roles
    IF v_auth_role != 'service_role' THEN
        IF auth.uid() IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE, 
                'error', 'UNAUTHORIZED', 
                'message', 'Authentication required for priority rank updates.'
            );
        END IF;

        v_caller_role := COALESCE(
            auth.jwt() -> 'app_metadata' ->> 'role',
            auth.jwt() ->> 'role',
            ''
        );

        IF v_caller_role NOT IN ('super_admin', 'admin', 'editoriallead', 'curator', 'partnermanager') THEN
            RETURN jsonb_build_object(
                'success', FALSE, 
                'error', 'FORBIDDEN', 
                'message', 'Studio administrative authorization required.'
            );
        END IF;
    END IF;

    -- Input Validation: Only ranks 1, 2, 3 or NULL permitted
    IF p_recommendation_id IS NULL OR TRIM(p_recommendation_id) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_REC_ID', 'message', 'Recommendation ID is required.');
    END IF;

    IF p_partner_id IS NULL OR TRIM(p_partner_id) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_PARTNER_ID', 'message', 'Partner ID is required.');
    END IF;

    IF p_priority_rank IS NOT NULL AND p_priority_rank NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_RANK', 'message', 'Priority rank must be 1, 2, 3 or NULL.');
    END IF;

    -- Global Advisory Transaction Lock to serialize priority rank writes and eliminate quota race conditions
    PERFORM pg_advisory_xact_lock(742918374);

    -- Fetch Target Record (Existing assignments only: NEVER insert or mutate routing states)
    SELECT * INTO v_target_record
    FROM public.recommendation_partner_eligibility
    WHERE recommendation_id = TRIM(p_recommendation_id)
      AND partner_id = TRIM(p_partner_id);

    IF v_target_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'RECORD_NOT_FOUND', 
            'message', 'No existing recommendation assignment found for this partner.'
        );
    END IF;

    v_old_rank := v_target_record.priority_rank;

    -- No-op check if target already holds requested rank
    IF (p_priority_rank IS NULL AND v_old_rank IS NULL) OR (p_priority_rank IS NOT NULL AND v_old_rank IS NOT NULL AND p_priority_rank = v_old_rank) THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'recommendation_id', p_recommendation_id,
            'partner_id', p_partner_id,
            'old_rank', v_old_rank,
            'new_rank', p_priority_rank,
            'swapped_partner_id', NULL,
            'message', 'Priority rank is already up to date.'
        );
    END IF;

    -- Quota Check for Target Partner (Max 4 per rank tier)
    IF p_priority_rank IS NOT NULL THEN
        SELECT COUNT(*) INTO v_target_tier_count
        FROM public.recommendation_partner_eligibility
        WHERE partner_id = TRIM(p_partner_id)
          AND priority_rank = p_priority_rank
          AND id != v_target_record.id;

        IF v_target_tier_count >= 4 THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'QUOTA_EXCEEDED',
                'message', format('Partner %s already holds the maximum of 4 recommendations as Priority %s.', p_partner_id, p_priority_rank)
            );
        END IF;
    END IF;

    -- Check if another partner occupies requested rank slot
    IF p_priority_rank IS NOT NULL THEN
        SELECT * INTO v_incumbent_record
        FROM public.recommendation_partner_eligibility
        WHERE recommendation_id = TRIM(p_recommendation_id)
          AND partner_id != TRIM(p_partner_id)
          AND priority_rank = p_priority_rank
        LIMIT 1;
    END IF;

    -- Quota Check for Incumbent Partner if swap is required
    IF v_incumbent_record.id IS NOT NULL AND v_old_rank IS NOT NULL THEN
        SELECT COUNT(*) INTO v_incumbent_tier_count
        FROM public.recommendation_partner_eligibility
        WHERE partner_id = v_incumbent_record.partner_id
          AND priority_rank = v_old_rank
          AND id != v_incumbent_record.id;

        IF v_incumbent_tier_count >= 4 THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'QUOTA_EXCEEDED',
                'message', format('Incumbent partner %s already holds the maximum of 4 recommendations as Priority %s.', v_incumbent_record.partner_id, v_old_rank)
            );
        END IF;
    END IF;

    -- Atomic Swap Execution
    IF v_incumbent_record.id IS NOT NULL THEN
        v_swapped_partner_id := v_incumbent_record.partner_id;

        -- Step A: Set incumbent rank to NULL temporarily to satisfy unique index constraint during swap
        UPDATE public.recommendation_partner_eligibility
        SET priority_rank = NULL,
            updated_at = NOW()
        WHERE id = v_incumbent_record.id;
    END IF;

    -- Step B: Update Target Partner Rank
    UPDATE public.recommendation_partner_eligibility
    SET priority_rank = p_priority_rank,
        updated_at = NOW()
    WHERE id = v_target_record.id;

    -- Step C: Finalize Incumbent Partner Rank (to target's old rank)
    IF v_incumbent_record.id IS NOT NULL THEN
        UPDATE public.recommendation_partner_eligibility
        SET priority_rank = v_old_rank,
            updated_at = NOW()
        WHERE id = v_incumbent_record.id;
    END IF;

    -- Audit Log Insertion
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
            COALESCE(auth.uid(), p_operator_id),
            COALESCE(v_caller_role, 'admin'),
            'UPDATE_PRIORITY_RANK',
            'partner_coverage',
            v_target_record.id,
            'success',
            jsonb_build_object(
                'recommendation_id', p_recommendation_id,
                'partner_id', p_partner_id,
                'old_rank', v_old_rank,
                'new_rank', p_priority_rank,
                'swapped_partner_id', v_swapped_partner_id
            )
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', TRUE,
        'recommendation_id', p_recommendation_id,
        'partner_id', p_partner_id,
        'old_rank', v_old_rank,
        'new_rank', p_priority_rank,
        'swapped_partner_id', v_swapped_partner_id,
        'message', 'Priority rank updated successfully.'
    );
END;
$$;


-- 3. Update Matrix RPC to return priority_rank using verified live partners schema
CREATE OR REPLACE FUNCTION public.fetch_partner_coverage_matrix_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_auth_role TEXT;
  v_results JSONB;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    IF v_caller_role NOT IN ('super_admin', 'admin', 'editoriallead', 'curator', 'partnermanager') THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Studio administrative authorization required.');
    END IF;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', rpe.id,
      'recommendation_id', rpe.recommendation_id,
      'partner_id', rpe.partner_id,
      'partner_code', COALESCE(p.public_code, rpe.partner_id),
      'partner_name', COALESCE(p.name, rpe.partner_id),
      'priority_rank', rpe.priority_rank,
      'qualification_state', rpe.qualification_state,
      'participation_state', rpe.participation_state,
      'passport_state', rpe.passport_state,
      'routing_state', rpe.routing_state,
      'contact_email', rpe.contact_email,
      'contact_phone', rpe.contact_phone,
      'notes', rpe.notes,
      'created_at', rpe.created_at,
      'updated_at', rpe.updated_at
    )
    ORDER BY COALESCE(rpe.priority_rank, 100) ASC, rpe.updated_at DESC
  ) INTO v_results
  FROM public.recommendation_partner_eligibility rpe
  LEFT JOIN public.partners p ON (p.id::text = rpe.partner_id OR p.public_code = rpe.partner_id);

  RETURN jsonb_build_object(
    'success', TRUE,
    'matrix', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

-- 4. Revoke PUBLIC & Grant Explicit Authenticated/Service Role Permissions
REVOKE EXECUTE ON FUNCTION public.set_partner_coverage_priority_rank_secure(VARCHAR, VARCHAR, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_partner_coverage_priority_rank_secure TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.fetch_partner_coverage_matrix_secure() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_partner_coverage_matrix_secure TO authenticated, service_role;

COMMIT;
