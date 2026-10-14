-- IDEMO LEAN PARTNER PASSPORT & OPERATIONAL MATCHING PROFILE (PROPOSAL 2)
-- Migration: 20261013010000_lean_partner_passport_proposal_2.sql
-- Description: Enriches partner_profile_content with Agency vs Individual distinction,
--              website, guide licence, PIB, languages, transport capacity, and notice window.

-- 1. Extend public.partner_profile_content table with Proposal 2 fields
ALTER TABLE public.partner_profile_content
  ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'Individual',
  ADD COLUMN IF NOT EXISTS website TEXT NULL,
  ADD COLUMN IF NOT EXISTS guide_licence TEXT NULL,
  ADD COLUMN IF NOT EXISTS pib TEXT NULL,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English', 'Serbian'],
  ADD COLUMN IF NOT EXISTS transport_capacity TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS notice_window TEXT DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS applied_recs TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS applied_recs_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS canonical_region TEXT NULL;

-- 2. Create Lean Save RPC
CREATE OR REPLACE FUNCTION public.save_partner_profile_draft_lean_secure(
  p_partner_id UUID,
  p_intro_draft TEXT,
  p_draft_photo_path TEXT,
  p_draft_photo_mime TEXT,
  p_photo_consent BOOLEAN,
  p_contact_phone TEXT,
  p_contact_email TEXT,
  p_partner_type TEXT DEFAULT 'Individual',
  p_website TEXT DEFAULT NULL,
  p_guide_licence TEXT DEFAULT NULL,
  p_pib TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT ARRAY['English', 'Serbian'],
  p_transport_capacity TEXT DEFAULT 'none',
  p_notice_window TEXT DEFAULT '24h',
  p_canonical_region TEXT DEFAULT NULL,
  p_applied_recs TEXT[] DEFAULT NULL,
  p_applied_recs_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_word_count INT := 0;
  v_clean_intro TEXT;
  v_consent_time TIMESTAMPTZ;
  v_partner_type TEXT;
BEGIN
  -- Word count validation (max 200 words)
  IF p_intro_draft IS NOT NULL AND TRIM(p_intro_draft) <> '' THEN
    v_clean_intro := TRIM(p_intro_draft);
    v_word_count := CARDINALITY(REGEXP_SPLIT_TO_ARRAY(v_clean_intro, '\s+'));
    IF v_word_count > 200 THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'WORD_LIMIT_EXCEEDED',
        'message', 'Introduction text cannot exceed 200 words.'
      );
    END IF;
  ELSE
    v_clean_intro := NULL;
  END IF;

  IF p_photo_consent IS TRUE THEN
    v_consent_time := NOW();
  ELSE
    v_consent_time := NULL;
  END IF;

  v_partner_type := CASE 
    WHEN LOWER(TRIM(COALESCE(p_partner_type, 'Individual'))) = 'organisation' THEN 'Organisation'
    ELSE 'Individual'
  END;

  INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    draft_photo_path,
    draft_photo_mime,
    review_status,
    photo_consent_given,
    photo_consent_at,
    draft_contact_phone,
    draft_contact_email,
    partner_type,
    website,
    guide_licence,
    pib,
    languages,
    transport_capacity,
    notice_window,
    canonical_region,
    applied_recs,
    applied_recs_note,
    updated_at
  )
  VALUES (
    p_partner_id,
    v_clean_intro,
    p_draft_photo_path,
    p_draft_photo_mime,
    'draft',
    COALESCE(p_photo_consent, FALSE),
    v_consent_time,
    NULLIF(TRIM(p_contact_phone), ''),
    NULLIF(TRIM(p_contact_email), ''),
    v_partner_type,
    NULLIF(TRIM(p_website), ''),
    NULLIF(TRIM(p_guide_licence), ''),
    NULLIF(TRIM(p_pib), ''),
    COALESCE(p_languages, ARRAY['English', 'Serbian']),
    COALESCE(p_transport_capacity, 'none'),
    COALESCE(p_notice_window, '24h'),
    NULLIF(TRIM(p_canonical_region), ''),
    p_applied_recs,
    NULLIF(TRIM(p_applied_recs_note), ''),
    NOW()
  )
  ON CONFLICT (partner_id) DO UPDATE SET
    intro_draft = EXCLUDED.intro_draft,
    draft_photo_path = EXCLUDED.draft_photo_path,
    draft_photo_mime = EXCLUDED.draft_photo_mime,
    review_status = CASE 
      WHEN partner_profile_content.review_status IN ('pending_review', 'approved', 'changes_requested') THEN partner_profile_content.review_status
      ELSE 'draft'::public.partner_profile_review_status
    END,
    photo_consent_given = EXCLUDED.photo_consent_given,
    photo_consent_at = COALESCE(EXCLUDED.photo_consent_at, partner_profile_content.photo_consent_at),
    draft_contact_phone = EXCLUDED.draft_contact_phone,
    draft_contact_email = EXCLUDED.draft_contact_email,
    partner_type = EXCLUDED.partner_type,
    website = EXCLUDED.website,
    guide_licence = EXCLUDED.guide_licence,
    pib = EXCLUDED.pib,
    languages = EXCLUDED.languages,
    transport_capacity = EXCLUDED.transport_capacity,
    notice_window = EXCLUDED.notice_window,
    canonical_region = COALESCE(EXCLUDED.canonical_region, partner_profile_content.canonical_region),
    applied_recs = COALESCE(EXCLUDED.applied_recs, partner_profile_content.applied_recs),
    applied_recs_note = COALESCE(EXCLUDED.applied_recs_note, partner_profile_content.applied_recs_note),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'draft_saved',
    'message', 'Lean partner passport draft successfully saved.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_partner_profile_draft_lean_secure(
  UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT[], TEXT
) TO anon, authenticated, service_role;

-- 3. Update fetch_partner_profile_review_queue_secure to include Proposal 2 fields
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
        'partner_type', COALESCE(ppc.partner_type, 'Individual'),
        'website', ppc.website,
        'guide_licence', ppc.guide_licence,
        'pib', ppc.pib,
        'languages', COALESCE(ppc.languages, ARRAY['English', 'Serbian']),
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
