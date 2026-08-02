-- IDEMO PARTNER PASSPORT — DURABLE UPLOAD AUTHORIZATIONS & AUDIT RETENTION
-- Additive Migration File: 20260802000001_partner_upload_authorizations.sql

-- 1. Table: public.partner_profile_upload_authorizations
CREATE TABLE IF NOT EXISTS public.partner_profile_upload_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_path TEXT NOT NULL UNIQUE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  expected_mime TEXT NOT NULL,
  max_size_bytes INTEGER NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_expected_mime CHECK (expected_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT chk_max_size CHECK (max_size_bytes > 0 AND max_size_bytes <= 5242880),
  CONSTRAINT chk_expires_after_issued CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS idx_partner_upload_auth_partner_id ON public.partner_profile_upload_authorizations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_upload_auth_expires_at ON public.partner_profile_upload_authorizations(expires_at);

ALTER TABLE public.partner_profile_upload_authorizations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.partner_profile_upload_authorizations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.partner_profile_upload_authorizations TO service_role;

-- 2. Additive RPC: Issue Upload Authorization
CREATE OR REPLACE FUNCTION public.issue_partner_profile_upload_authorization_secure(
  p_partner_id UUID,
  p_object_path TEXT,
  p_expected_mime TEXT,
  p_max_size_bytes INTEGER DEFAULT 5242880,
  p_ttl_seconds INTEGER DEFAULT 900
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID;
  v_issued_at TIMESTAMPTZ := NOW();
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_partner_id IS NULL OR p_object_path IS NULL OR p_expected_mime IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_ARGUMENTS', 'message', 'Required parameters missing.');
  END IF;

  IF p_expected_mime NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_MIME_TYPE', 'message', 'Only image/jpeg, image/png, and image/webp are allowed.');
  END IF;

  IF p_max_size_bytes <= 0 OR p_max_size_bytes > 5242880 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_SIZE_LIMIT', 'message', 'Max size limit must be between 1 and 5242880 bytes.');
  END IF;

  IF p_ttl_seconds <= 0 OR p_ttl_seconds > 3600 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_TTL', 'message', 'TTL seconds must be between 1 and 3600 seconds.');
  END IF;

  IF p_object_path NOT LIKE 'drafts/%' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN_PATH_PREFIX', 'message', 'Upload object path must strictly begin with drafts/.');
  END IF;

  v_expires_at := v_issued_at + (p_ttl_seconds || ' seconds')::INTERVAL;

  INSERT INTO public.partner_profile_upload_authorizations (
    object_path,
    partner_id,
    expected_mime,
    max_size_bytes,
    issued_at,
    expires_at
  )
  VALUES (
    p_object_path,
    p_partner_id,
    p_expected_mime,
    p_max_size_bytes,
    v_issued_at,
    v_expires_at
  )
  RETURNING id INTO v_auth_id;

  -- AUDIT EVENT: Upload authorization issued
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    resource_type,
    resource_id,
    payload
  )
  VALUES (
    'partner_profile_upload_authorization_issued',
    'partner',
    p_partner_id::text,
    'partner_profile_upload_authorization',
    v_auth_id::text,
    jsonb_build_object(
      'object_path', p_object_path,
      'expected_mime', p_expected_mime,
      'max_size_bytes', p_max_size_bytes,
      'expires_at', v_expires_at
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'authorization_id', v_auth_id,
    'object_path', p_object_path,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_partner_profile_upload_authorization_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_partner_profile_upload_authorization_secure TO service_role;

-- 3. Additive RPC: Save Draft With Authorization (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.save_partner_profile_draft_with_authorization_secure(
  p_partner_id UUID,
  p_intro_draft TEXT DEFAULT NULL,
  p_draft_photo_path TEXT DEFAULT NULL,
  p_draft_photo_mime TEXT DEFAULT NULL,
  p_photo_consent BOOLEAN DEFAULT FALSE
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

  -- 2. Mandatory MIME and Authorization check if photo path is provided
  IF p_draft_photo_path IS NOT NULL THEN
    IF p_draft_photo_mime IS NULL OR TRIM(p_draft_photo_mime) = '' THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'MIME_REQUIRED',
        'message', 'draft_photo_mime is mandatory when draft_photo_path is provided.'
      );
    END IF;

    IF p_draft_photo_mime NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'INVALID_MIME_TYPE',
        'message', 'Only image/jpeg, image/png, and image/webp MIME types are allowed.'
      );
    END IF;

    IF p_photo_consent IS NOT TRUE THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'CONSENT_REQUIRED',
        'message', 'Explicit consent is required to attach a professional photo.'
      );
    END IF;

    IF p_draft_photo_path NOT LIKE 'drafts/%' THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'FORBIDDEN_PATH_PREFIX',
        'message', 'Upload path must strictly begin with drafts/.'
      );
    END IF;

    -- Lock authorization record for UPDATE
    SELECT * INTO v_auth_record
    FROM public.partner_profile_upload_authorizations
    WHERE object_path = p_draft_photo_path
    FOR UPDATE;

    IF v_auth_record.id IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'UNAUTHORIZED_UPLOAD_PATH',
        'message', 'Upload authorization record not found or path was not issued by server.'
      );
    END IF;

    IF v_auth_record.partner_id <> p_partner_id THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'FORBIDDEN_PATH_OWNERSHIP',
        'message', 'Upload authorization path does not belong to the authenticated partner.'
      );
    END IF;

    IF v_auth_record.consumed_at IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'PATH_ALREADY_CONSUMED',
        'message', 'Upload authorization path has already been consumed.'
      );
    END IF;

    IF v_auth_record.expires_at <= NOW() THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'PATH_EXPIRED',
        'message', 'Upload authorization path has expired.'
      );
    END IF;

    IF p_draft_photo_mime <> v_auth_record.expected_mime THEN
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

  -- 4. Mark authorization consumed inside SAME atomic transaction ONLY after draft save succeeds
  IF p_draft_photo_path IS NOT NULL AND v_auth_record.id IS NOT NULL THEN
    UPDATE public.partner_profile_upload_authorizations
    SET consumed_at = NOW()
    WHERE id = v_auth_record.id;

    -- AUDIT EVENT: Upload authorization consumed
    INSERT INTO public.audit_logs (
      event_type,
      actor_type,
      actor_id,
      resource_type,
      resource_id,
      payload
    )
    VALUES (
      'partner_profile_upload_authorization_consumed',
      'partner',
      p_partner_id::text,
      'partner_profile_upload_authorization',
      v_auth_record.id::text,
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

REVOKE ALL ON FUNCTION public.save_partner_profile_draft_with_authorization_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_partner_profile_draft_with_authorization_secure TO service_role;

-- 4. Additive RPC: Withdrawal V2 Secure
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
      draft_photo_path = NULL,
      draft_photo_mime = NULL,
      intro_draft = NULL,
      review_status = 'withdrawn',
      photo_consent_given = FALSE,
      photo_consent_withdrawn_at = NOW(),
      updated_at = NOW()
    WHERE partner_id = p_partner_id;
  END IF;

  -- AUDIT EVENT: Partner profile content withdrawn
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    resource_type,
    resource_id,
    payload
  )
  VALUES (
    'partner_profile_withdrawn',
    'partner',
    p_partner_id::text,
    'partner_profile_content',
    p_partner_id::text,
    jsonb_build_object(
      'scope', p_scope
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'withdrawn',
    'message', 'Passport profile content withdrawn.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_partner_profile_v2_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_partner_profile_v2_secure TO service_role;

-- 5. Maintenance / Retention RPC
CREATE OR REPLACE FUNCTION public.cleanup_partner_profile_upload_authorizations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INT := 0;
BEGIN
  -- Delete unconsumed authorizations expired over 7 days ago OR consumed authorizations over 30 days old
  DELETE FROM public.partner_profile_upload_authorizations
  WHERE (consumed_at IS NULL AND expires_at < NOW() - INTERVAL '7 days')
     OR (consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- AUDIT EVENT: Authorization cleanup executed
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    resource_type,
    resource_id,
    payload
  )
  VALUES (
    'partner_profile_upload_authorizations_cleaned_up',
    'system',
    'partner_profile_cleanup',
    'partner_profile_upload_authorizations',
    'partner_profile_cleanup',
    jsonb_build_object(
      'deleted_records', v_deleted_count
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_records', v_deleted_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_partner_profile_upload_authorizations FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_profile_upload_authorizations TO service_role;
