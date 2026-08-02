-- IDEMO Partner Passport Introduction & Photo Governance Migration
-- Migration: 20260802000000_partner_passport_intro.sql

-- 1. Create dedicated partner profile review status enum
CREATE TYPE public.partner_profile_review_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'changes_requested',
  'withdrawn'
);

-- 2. Create dedicated partner profile content table
CREATE TABLE IF NOT EXISTS public.partner_profile_content (
  partner_id UUID PRIMARY KEY REFERENCES public.partners(id) ON DELETE CASCADE,
  intro_draft TEXT NULL,
  draft_photo_path TEXT NULL,
  draft_photo_mime TEXT NULL,
  intro_published TEXT NULL,
  published_photo_path TEXT NULL,
  published_photo_mime TEXT NULL,
  review_status public.partner_profile_review_status NOT NULL DEFAULT 'draft',
  photo_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  photo_consent_at TIMESTAMPTZ NULL,
  photo_consent_withdrawn_at TIMESTAMPTZ NULL,
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by UUID NULL,
  review_note TEXT NULL,
  content_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.partner_profile_content ENABLE ROW LEVEL SECURITY;

-- 3. Dedicated Private Storage Bucket Configuration (SQL representation)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-passports',
  'partner-passports',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 4. RPC: Save Partner Profile Draft Secure
CREATE OR REPLACE FUNCTION public.save_partner_profile_draft_secure(
  p_partner_id UUID,
  p_intro_draft TEXT,
  p_draft_photo_path TEXT,
  p_draft_photo_mime TEXT,
  p_photo_consent BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_word_count INT := 0;
  v_clean_intro TEXT;
  v_consent_time TIMESTAMPTZ;
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

  -- Photo requires explicit consent
  IF p_draft_photo_path IS NOT NULL AND (p_photo_consent IS NOT TRUE) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'CONSENT_REQUIRED',
      'message', 'Explicit consent is required to attach a professional photo.'
    );
  END IF;

  IF p_photo_consent IS TRUE THEN
    v_consent_time := NOW();
  ELSE
    v_consent_time := NULL;
  END IF;

  INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    draft_photo_path,
    draft_photo_mime,
    review_status,
    photo_consent_given,
    photo_consent_at,
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
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'draft_saved',
    'message', 'Passport draft successfully saved.'
  );
END;
$$;

-- 5. RPC: Submit Partner Profile Secure
CREATE OR REPLACE FUNCTION public.submit_partner_profile_secure(
  p_partner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record public.partner_profile_content%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM public.partner_profile_content WHERE partner_id = p_partner_id;

  IF v_record.partner_id IS NULL OR (v_record.intro_draft IS NULL AND v_record.draft_photo_path IS NULL) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'EMPTY_SUBMISSION',
      'message', 'Cannot submit an empty passport profile.'
    );
  END IF;

  UPDATE public.partner_profile_content
  SET
    review_status = 'pending_review',
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE partner_id = p_partner_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'submitted',
    'message', 'Passport profile submitted for IDEMO editorial review.'
  );
END;
$$;

-- 6. RPC: Review Partner Profile Secure
CREATE OR REPLACE FUNCTION public.review_partner_profile_secure(
  p_partner_id UUID,
  p_reviewer_id UUID,
  p_action TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record public.partner_profile_content%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM public.partner_profile_content WHERE partner_id = p_partner_id;

  IF v_record.partner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'RECORD_NOT_FOUND',
      'message', 'Partner profile content record not found.'
    );
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.partner_profile_content
    SET
      intro_published = COALESCE(v_record.intro_draft, v_record.intro_published),
      published_photo_path = COALESCE(v_record.draft_photo_path, v_record.published_photo_path),
      published_photo_mime = COALESCE(v_record.draft_photo_mime, v_record.published_photo_mime),
      review_status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      review_note = p_review_note,
      content_version = v_record.content_version + 1,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'approved',
      'message', 'Passport profile approved and published.'
    );

  ELSIF p_action = 'request_changes' THEN
    UPDATE public.partner_profile_content
    SET
      review_status = 'changes_requested',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      review_note = p_review_note,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'changes_requested',
      'message', 'Changes requested for partner passport profile.'
    );

  ELSIF p_action = 'unpublish' THEN
    UPDATE public.partner_profile_content
    SET
      intro_published = NULL,
      published_photo_path = NULL,
      published_photo_mime = NULL,
      review_status = 'withdrawn',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      review_note = p_review_note,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'unpublished',
      'message', 'Passport profile unpublished.'
    );

  ELSE
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'INVALID_ACTION',
      'message', 'Unsupported review action.'
    );
  END IF;
END;
$$;

-- 7. RPC: Withdraw Partner Profile Secure
CREATE OR REPLACE FUNCTION public.withdraw_partner_profile_secure(
  p_partner_id UUID,
  p_scope TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_scope = 'photo_only' THEN
    UPDATE public.partner_profile_content
    SET
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      published_photo_path = NULL,
      published_photo_mime = NULL,
      photo_consent_given = FALSE,
      photo_consent_withdrawn_at = NOW(),
      updated_at = NOW()
    WHERE partner_id = p_partner_id;
  ELSE
    UPDATE public.partner_profile_content
    SET
      intro_published = NULL,
      published_photo_path = NULL,
      published_photo_mime = NULL,
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      review_status = 'withdrawn',
      photo_consent_given = FALSE,
      photo_consent_withdrawn_at = NOW(),
      updated_at = NOW()
    WHERE partner_id = p_partner_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'withdrawn',
    'message', 'Passport profile content withdrawn.'
  );
END;
$$;
