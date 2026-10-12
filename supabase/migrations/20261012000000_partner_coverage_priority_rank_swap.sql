-- IDEMO PARTNER ROUTING ENGINE - ATOMIC PRIORITY RANK SWAP
-- Migration: 20261012000000_partner_coverage_priority_rank_swap.sql
-- Description:
-- Provides atomic 1-action rank updating and collision-free swapping
-- (1st = 1, 2nd = 2, 3rd = 3) in public.recommendation_partner_eligibility with audit logging.

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
    v_old_rank INTEGER;
    v_swapped_partner_id VARCHAR(100) := NULL;
BEGIN
    v_auth_role := COALESCE(auth.role(), '');

    -- Verify Authorization (service_role bypasses)
    IF v_auth_role != 'service_role' THEN
        IF auth.uid() IS NULL THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
        END IF;

        v_caller_role := COALESCE(
            auth.jwt() -> 'app_metadata' ->> 'role',
            auth.jwt() ->> 'role',
            ''
        );

        IF v_caller_role NOT IN ('super_admin', 'admin') THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Studio administrative authorization required.');
        END IF;
    END IF;

    -- Validate Inputs
    IF p_recommendation_id IS NULL OR TRIM(p_recommendation_id) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_REC_ID', 'message', 'Recommendation ID is required.');
    END IF;

    IF p_partner_id IS NULL OR TRIM(p_partner_id) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MISSING_PARTNER_ID', 'message', 'Partner ID is required.');
    END IF;

    IF p_priority_rank IS NULL OR p_priority_rank < 1 OR p_priority_rank > 10 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_RANK', 'message', 'Priority rank must be between 1 and 10.');
    END IF;

    -- Fetch Target Record
    SELECT * INTO v_target_record
    FROM public.recommendation_partner_eligibility
    WHERE recommendation_id = TRIM(p_recommendation_id)
      AND partner_id = TRIM(p_partner_id);

    -- If record does not exist yet, create it as idemo_selected
    IF v_target_record.id IS NULL THEN
        INSERT INTO public.recommendation_partner_eligibility (
            recommendation_id,
            partner_id,
            qualification_state,
            participation_state,
            passport_state,
            routing_state,
            priority_rank,
            updated_at
        ) VALUES (
            TRIM(p_recommendation_id),
            TRIM(p_partner_id),
            'idemo_selected'::public.qualification_state,
            'introduction_ready'::public.participation_state,
            'not_started'::public.passport_verification_state,
            'active'::public.routing_pool_state,
            p_priority_rank,
            NOW()
        )
        RETURNING * INTO v_target_record;
        v_old_rank := 100;
    ELSE
        v_old_rank := COALESCE(v_target_record.priority_rank, 100);
    END IF;

    -- Check if another partner already holds the requested rank for this recommendation
    SELECT * INTO v_incumbent_record
    FROM public.recommendation_partner_eligibility
    WHERE recommendation_id = TRIM(p_recommendation_id)
      AND partner_id != TRIM(p_partner_id)
      AND priority_rank = p_priority_rank
    LIMIT 1;

    -- Atomic Collision-Free Swap
    IF v_incumbent_record.id IS NOT NULL THEN
        v_swapped_partner_id := v_incumbent_record.partner_id;
        
        -- Move incumbent to target's old rank (or fallback rank if old rank was unassigned)
        UPDATE public.recommendation_partner_eligibility
        SET priority_rank = CASE 
                WHEN v_old_rank <= 10 THEN v_old_rank 
                ELSE p_priority_rank + 1 
            END,
            updated_at = NOW()
        WHERE id = v_incumbent_record.id;
    END IF;

    -- Update target partner to the new rank
    UPDATE public.recommendation_partner_eligibility
    SET priority_rank = p_priority_rank,
        routing_state = 'active'::public.routing_pool_state,
        qualification_state = 'idemo_selected'::public.qualification_state,
        updated_at = NOW()
    WHERE id = v_target_record.id;

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

GRANT EXECUTE ON FUNCTION public.set_partner_coverage_priority_rank_secure TO authenticated, service_role;
