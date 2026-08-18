-- IDEMO Work Package CLT-001C Forward Migration: Minimal Governance Correction
-- Migration: 20260810070000_clt_001_minimal_governance_correction.sql

-- 1. Add governed contact draft and published columns to partner_profile_content table
ALTER TABLE public.partner_profile_content
  ADD COLUMN IF NOT EXISTS draft_contact_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS draft_contact_email TEXT NULL,
  ADD COLUMN IF NOT EXISTS published_contact_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS published_contact_email TEXT NULL;

-- 2. Deprecate public.partners.contact_phone and contact_email (columns retained for backward compatibility, unread by visitor resolution)
COMMENT ON COLUMN public.partners.contact_phone IS 'DEPRECATED: Visitor-visible professional contact details are governed inside partner_profile_content (draft_contact_phone / published_contact_phone).';
COMMENT ON COLUMN public.partners.contact_email IS 'DEPRECATED: Visitor-visible professional contact details are governed inside partner_profile_content (draft_contact_email / published_contact_email).';

-- 3. Replace save_partner_profile_draft_with_authorization_secure to accept draft contact info
CREATE OR REPLACE FUNCTION public.save_partner_profile_draft_with_authorization_secure(
  p_partner_id UUID,
  p_intro_draft TEXT,
  p_draft_photo_path TEXT,
  p_draft_photo_mime TEXT,
  p_photo_consent BOOLEAN,
  p_draft_contact_phone TEXT DEFAULT NULL,
  p_draft_contact_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_word_count INT := 0;
  v_clean_intro TEXT;
  v_clean_phone TEXT;
  v_clean_email TEXT;
  v_consent_time TIMESTAMPTZ;
  v_auth_record public.partner_profile_upload_authorizations%ROWTYPE;
BEGIN
  -- 1. Word count validation (max 200 words)
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

  v_clean_phone := CASE WHEN p_draft_contact_phone IS NOT NULL AND TRIM(p_draft_contact_phone) <> '' THEN TRIM(p_draft_contact_phone) ELSE NULL END;
  v_clean_email := CASE WHEN p_draft_contact_email IS NOT NULL AND TRIM(p_draft_contact_email) <> '' THEN TRIM(p_draft_contact_email) ELSE NULL END;

  -- 2. Photo authorization validation (if photo path is supplied)
  IF p_draft_photo_path IS NOT NULL THEN
    IF (p_photo_consent IS NOT TRUE) THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'CONSENT_REQUIRED',
        'message', 'Explicit consent is required to attach a professional photo.'
      );
    END IF;

    SELECT * INTO v_auth_record
    FROM public.partner_profile_upload_authorizations
    WHERE partner_id = p_partner_id
      AND object_path = p_draft_photo_path
      AND consumed_at IS NULL
      AND expires_at > NOW();

    IF v_auth_record.id IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'UNAUTHORIZED_PHOTO_PATH',
        'message', 'Draft photo path is not authorized, expired, or has already been consumed.'
      );
    END IF;

    IF p_draft_photo_mime IS DISTINCT FROM v_auth_record.expected_mime THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'MIME_MISMATCH',
        'message', 'Provided photo MIME type does not match authorized expected MIME.'
      );
    END IF;
  END IF;

  IF p_photo_consent IS TRUE THEN
    v_consent_time := NOW();
  ELSE
    v_consent_time := NULL;
  END IF;

  -- 3. Save draft to partner_profile_content
  INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    draft_photo_path,
    draft_photo_mime,
    draft_contact_phone,
    draft_contact_email,
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
    v_clean_phone,
    v_clean_email,
    'draft',
    COALESCE(p_photo_consent, FALSE),
    v_consent_time,
    NOW()
  )
  ON CONFLICT (partner_id) DO UPDATE SET
    intro_draft = EXCLUDED.intro_draft,
    draft_photo_path = EXCLUDED.draft_photo_path,
    draft_photo_mime = EXCLUDED.draft_photo_mime,
    draft_contact_phone = COALESCE(EXCLUDED.draft_contact_phone, partner_profile_content.draft_contact_phone),
    draft_contact_email = COALESCE(EXCLUDED.draft_contact_email, partner_profile_content.draft_contact_email),
    review_status = CASE 
      WHEN partner_profile_content.review_status IN ('pending_review', 'approved', 'changes_requested') THEN partner_profile_content.review_status
      ELSE 'draft'::public.partner_profile_review_status
    END,
    photo_consent_given = EXCLUDED.photo_consent_given,
    photo_consent_at = COALESCE(EXCLUDED.photo_consent_at, partner_profile_content.photo_consent_at),
    updated_at = NOW();

  -- 4. Mark authorization consumed if photo path exists
  IF p_draft_photo_path IS NOT NULL AND v_auth_record.id IS NOT NULL THEN
    UPDATE public.partner_profile_upload_authorizations
    SET consumed_at = NOW()
    WHERE id = v_auth_record.id;

    INSERT INTO public.audit_logs (
      actor_auth_user_id,
      actor_partner_id,
      actor_role,
      action,
      resource_type,
      resource_id,
      result,
      safe_metadata
    )
    VALUES (
      NULL,
      p_partner_id,
      'partner',
      'partner_profile_upload_authorization_consumed',
      'partner_profile_upload_authorization',
      v_auth_record.id,
      'success',
      jsonb_build_object(
        'object_path', p_draft_photo_path,
        'mime', p_draft_photo_mime
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'draft_saved',
    'message', 'Passport draft successfully saved.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_partner_profile_draft_with_authorization_secure(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_partner_profile_draft_with_authorization_secure(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO service_role;

-- 4. Replace update_partner_professional_contact_secure to write into partner_profile_content draft fields
CREATE OR REPLACE FUNCTION public.update_partner_professional_contact_secure(
  p_partner_id UUID,
  p_contact_phone TEXT,
  p_contact_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
  v_clean_email TEXT;
BEGIN
  v_clean_phone := CASE WHEN p_contact_phone IS NOT NULL AND TRIM(p_contact_phone) <> '' THEN TRIM(p_contact_phone) ELSE NULL END;
  v_clean_email := CASE WHEN p_contact_email IS NOT NULL AND TRIM(p_contact_email) <> '' THEN TRIM(p_contact_email) ELSE NULL END;

  INSERT INTO public.partner_profile_content (
    partner_id,
    draft_contact_phone,
    draft_contact_email,
    review_status,
    updated_at
  )
  VALUES (
    p_partner_id,
    v_clean_phone,
    v_clean_email,
    'draft',
    NOW()
  )
  ON CONFLICT (partner_id) DO UPDATE SET
    draft_contact_phone = EXCLUDED.draft_contact_phone,
    draft_contact_email = EXCLUDED.draft_contact_email,
    updated_at = NOW();

  -- Note: Do NOT update published_contact_phone or published_contact_email here. IDEMO review is required to publish.
  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'draft_saved',
    'message', 'Professional contact details saved as draft for IDEMO review.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_partner_professional_contact_secure(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_professional_contact_secure(UUID, TEXT, TEXT) TO service_role;

-- 5. Replace review_partner_profile_secure to publish draft contact details on approval
CREATE OR REPLACE FUNCTION public.review_partner_profile_secure(
  p_partner_id UUID,
  p_reviewer_id UUID,
  p_action TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      published_contact_phone = COALESCE(v_record.draft_contact_phone, v_record.published_contact_phone),
      published_contact_email = COALESCE(v_record.draft_contact_email, v_record.published_contact_email),
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
      published_contact_phone = NULL,
      published_contact_email = NULL,
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

REVOKE ALL ON FUNCTION public.review_partner_profile_secure(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_partner_profile_secure(UUID, UUID, TEXT, TEXT) TO service_role;

-- 6. Replace withdraw_partner_profile_v2_secure
CREATE OR REPLACE FUNCTION public.withdraw_partner_profile_v2_secure(
  p_partner_id UUID,
  p_scope TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_scope NOT IN ('draft', 'introduction', 'photo', 'consent', 'all') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'INVALID_SCOPE',
      'message', 'Scope must be one of: draft, introduction, photo, consent, all.'
    );
  END IF;

  IF p_scope = 'draft' THEN
    UPDATE public.partner_profile_content
    SET
      intro_draft = NULL,
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      draft_contact_phone = NULL,
      draft_contact_email = NULL,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

  ELSIF p_scope = 'introduction' THEN
    UPDATE public.partner_profile_content
    SET
      intro_draft = NULL,
      intro_published = NULL,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

  ELSIF p_scope = 'photo' THEN
    UPDATE public.partner_profile_content
    SET
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      published_photo_path = NULL,
      published_photo_mime = NULL,
      updated_at = NOW()
    WHERE partner_id = p_partner_id;

  ELSIF p_scope = 'consent' THEN
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

  ELSIF p_scope = 'all' THEN
    UPDATE public.partner_profile_content
    SET
      intro_published = NULL,
      published_photo_path = NULL,
      published_photo_mime = NULL,
      published_contact_phone = NULL,
      published_contact_email = NULL,
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      draft_contact_phone = NULL,
      draft_contact_email = NULL,
      intro_draft = NULL,
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

REVOKE ALL ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) TO service_role;
