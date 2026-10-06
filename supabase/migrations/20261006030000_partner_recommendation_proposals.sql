-- IDEMO PARTNER RECOMMENDATION CANDIDATE PROPOSALS
-- Migration: 20261006030000_partner_recommendation_proposals.sql
-- Description:
-- Adds recommendation proposal fields to partner_profile_content table
-- Updates fetch_partner_profile_review_queue_secure to include recommendation candidate proposals for Agent 007 and Studio Curators

-- 1. Add proposal columns to partner_profile_content if absent
ALTER TABLE public.partner_profile_content 
  ADD COLUMN IF NOT EXISTS proposed_rec_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS proposed_rec_category TEXT NULL,
  ADD COLUMN IF NOT EXISTS proposed_rec_location TEXT NULL,
  ADD COLUMN IF NOT EXISTS proposed_rec_rationale TEXT NULL;

-- 2. Update fetch_partner_profile_review_queue_secure RPC to include proposal fields
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
        'proposed_rec_title', ppc.proposed_rec_title,
        'proposed_rec_category', ppc.proposed_rec_category,
        'proposed_rec_location', ppc.proposed_rec_location,
        'proposed_rec_rationale', ppc.proposed_rec_rationale,
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

GRANT EXECUTE ON FUNCTION public.fetch_partner_profile_review_queue_secure(TEXT) TO anon, authenticated, service_role;
