-- IDEMO COVERAGE CONTROL MATRIX ENRICHMENT MIGRATION
-- Migration: 20261006010000_partner_coverage_display_enrichment.sql
-- Description: Enriches fetch_partner_coverage_matrix_secure with partner_code, partner_name, and priority_rank from public.partners

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

    IF v_caller_role NOT IN ('super_admin', 'admin') THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Studio administrative authorization required.');
    END IF;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', rpe.id,
      'recommendation_id', rpe.recommendation_id,
      'partner_id', rpe.partner_id,
      'partner_code', COALESCE(p.public_code, p.partner_code, rpe.partner_id),
      'partner_name', COALESCE(p.name, p.name_en, rpe.partner_id),
      'priority_rank', COALESCE(rpe.priority_rank, 100),
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

GRANT EXECUTE ON FUNCTION public.fetch_partner_coverage_matrix_secure() TO service_role, authenticated;
