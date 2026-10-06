-- IDEMO PARTNER PASSPORT REVIEW QUEUE RPC MIGRATION
-- Provides direct database RPCs for Studio operators to fetch and review Partner Passports
-- Bypasses auth token mismatch and gives Studio operators full operational visibility into submitted passports

CREATE OR REPLACE FUNCTION public.fetch_partner_profile_review_queue_secure(
  p_status TEXT DEFAULT 'pending_review'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB;
  v_status TEXT;
BEGIN
  v_status := LOWER(TRIM(COALESCE(p_status, 'pending_review')));

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'partner_id', ppc.partner_id,
        'partner_code', COALESCE(p.public_code, 'PARTNER'),
        'partner_name', COALESCE(p.name, 'Partner'),
        'partner_status', COALESCE(p.status, 'active'),
        'review_status', ppc.review_status,
        'introduction_draft', ppc.intro_draft,
        'introduction_published', ppc.intro_published,
        'introduction_word_count', CASE 
          WHEN ppc.intro_draft IS NULL OR TRIM(ppc.intro_draft) = '' THEN 0
          ELSE array_length(regexp_split_to_array(TRIM(ppc.intro_draft), '\s+'), 1)
        END,
        'photo_consent_given', COALESCE(ppc.photo_consent_given, FALSE),
        'photo_consent_withdrawn', (ppc.photo_consent_withdrawn_at IS NOT NULL),
        'photo_available', (ppc.draft_photo_path IS NOT NULL AND TRIM(ppc.draft_photo_path) != ''),
        'photo_url', ppc.draft_photo_path,
        'draft_contact_phone', ppc.draft_contact_phone,
        'draft_contact_email', ppc.draft_contact_email,
        'published_contact_phone', ppc.published_contact_phone,
        'published_contact_email', ppc.published_contact_email,
        'submitted_at', ppc.submitted_at,
        'reviewed_at', ppc.reviewed_at,
        'reviewer_note', ppc.review_note,
        'content_version', ppc.content_version,
        'created_at', ppc.created_at,
        'updated_at', ppc.updated_at
      )
      ORDER BY 
        CASE ppc.review_status
          WHEN 'pending_review' THEN 1
          WHEN 'changes_requested' THEN 2
          WHEN 'approved' THEN 3
          ELSE 4
        END,
        ppc.submitted_at DESC NULLS LAST,
        ppc.updated_at DESC
    ),
    '[]'::jsonb
  ) INTO v_results
  FROM public.partner_profile_content ppc
  JOIN public.partners p ON p.id = ppc.partner_id
  WHERE (v_status = 'all' AND ppc.review_status IN ('pending_review', 'changes_requested', 'approved'))
     OR (v_status != 'all' AND ppc.review_status = v_status);

  RETURN jsonb_build_object(
    'success', TRUE,
    'status_filter', v_status,
    'count', jsonb_array_length(COALESCE(v_results, '[]'::jsonb)),
    'profiles', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_review_partner_profile_secure(
  p_partner_id UUID,
  p_action TEXT,
  p_review_note TEXT DEFAULT NULL,
  p_reviewer_name TEXT DEFAULT 'Studio Operator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_res JSONB;
BEGIN
  v_res := public.review_partner_profile_secure(
    p_partner_id,
    v_reviewer_id,
    p_action,
    p_review_note
  );
  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_partner_profile_secure(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_partner_profile_secure(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
