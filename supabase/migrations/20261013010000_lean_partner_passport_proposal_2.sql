-- IDEMO LEAN PARTNER PASSPORT & OPERATIONAL MATCHING PROFILE (PROPOSAL 2)
-- Migration: 20261013010000_lean_partner_passport_proposal_2.sql
-- Description: Enriches partner_profile_content with Agency vs Individual distinction,
--              website, guide licence, PIB, languages, transport capacity, and notice window,
--              and updates fetch_partner_profile_review_queue_secure with explicit enum-to-text comparison.
--              Partner draft saves remain governed by the partner_resolution Edge Function
--              using established x-partner-session authentication.

-- 1. Extend public.partner_profile_content table with Proposal 2 fields
ALTER TABLE public.partner_profile_content
  ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'Individual',
  ADD COLUMN IF NOT EXISTS website TEXT NULL,
  ADD COLUMN IF NOT EXISTS guide_licence TEXT NULL,
  ADD COLUMN IF NOT EXISTS pib TEXT NULL,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS transport_capacity TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS notice_window TEXT DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS applied_recs TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS applied_recs_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS canonical_region TEXT NULL;

-- Ensure column default is '{}' even if the column was previously created with another default
ALTER TABLE public.partner_profile_content
  ALTER COLUMN languages SET DEFAULT '{}'::TEXT[];

-- 2. Update fetch_partner_profile_review_queue_secure to include Proposal 2 fields,
--    enforce editorial_lead / super_admin / service_role authorization,
--    and fix enum-to-text comparison (ppc.review_status::TEXT = v_status)
CREATE OR REPLACE FUNCTION public.fetch_partner_profile_review_queue_secure(
  p_status TEXT DEFAULT 'pending_review'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_role TEXT;
  v_caller_role TEXT;
  v_results JSONB;
  v_status TEXT;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');

  -- Enforce Curator / Studio Authorization (service_role bypasses; authenticated requires editorial_lead or super_admin)
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'UNAUTHORIZED',
        'message', 'Authentication required.'
      );
    END IF;

    v_caller_role := COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    );

    IF v_caller_role NOT IN ('editorial_lead', 'super_admin') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'FORBIDDEN',
        'message', 'Editorial review access is restricted.'
      );
    END IF;
  END IF;

  v_status := LOWER(TRIM(COALESCE(p_status, 'pending_review')));

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'partner_id', ppc.partner_id,
        'partner_code', COALESCE(p.public_code, 'PARTNER'),
        'partner_name', COALESCE(p.name, 'Partner'),
        'partner_status', COALESCE(p.status, 'active'),
        'partner_type', COALESCE(ppc.partner_type, 'Individual'),
        'website', ppc.website,
        'guide_licence', ppc.guide_licence,
        'pib', ppc.pib,
        'languages', COALESCE(ppc.languages, '{}'::TEXT[]),
        'transport_capacity', COALESCE(ppc.transport_capacity, 'none'),
        'notice_window', COALESCE(ppc.notice_window, '24h'),
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
        'canonical_region', ppc.canonical_region,
        'applied_recs', ppc.applied_recs,
        'applied_recs_note', ppc.applied_recs_note,
        'proposed_rec_title', to_jsonb(ppc)->>'proposed_rec_title',
        'proposed_rec_category', to_jsonb(ppc)->>'proposed_rec_category',
        'proposed_rec_location', to_jsonb(ppc)->>'proposed_rec_location',
        'proposed_rec_rationale', to_jsonb(ppc)->>'proposed_rec_rationale',
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
     OR (v_status != 'all' AND ppc.review_status::TEXT = v_status);

  RETURN jsonb_build_object(
    'success', TRUE,
    'status_filter', v_status,
    'count', jsonb_array_length(COALESCE(v_results, '[]'::jsonb)),
    'profiles', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) TO authenticated, service_role;

