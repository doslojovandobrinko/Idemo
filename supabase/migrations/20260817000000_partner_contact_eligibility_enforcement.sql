-- ============================================================================
-- IDEMO GOVERNANCE MIGRATION: 20260817000000_partner_contact_eligibility_enforcement.sql
-- Work Package: Partner Passport V1 - Controlled Contact Eligibility & Withdrawal Gate
-- Governance: IDEMO Platform Constitution & Editorial Operations Standard
-- ============================================================================

-- 1. Replace review_partner_profile_secure with operational contact validation gate
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
  v_effective_phone TEXT;
  v_effective_email TEXT;
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
    v_effective_phone := COALESCE(v_record.draft_contact_phone, v_record.published_contact_phone);
    v_effective_email := COALESCE(v_record.draft_contact_email, v_record.published_contact_email);

    -- Gate: At least one operational contact method (phone or email) is mandatory for approval
    IF v_effective_phone IS NULL AND v_effective_email IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'OPERATIONAL_CONTACT_REQUIRED',
        'message', 'Partner must have at least one approved contact channel (phone or email) before profile can be approved.'
      );
    END IF;

    UPDATE public.partner_profile_content
    SET
      intro_published = COALESCE(v_record.intro_draft, v_record.intro_published),
      published_photo_path = COALESCE(v_record.draft_photo_path, v_record.published_photo_path),
      published_photo_mime = COALESCE(v_record.draft_photo_mime, v_record.published_photo_mime),
      published_contact_phone = v_effective_phone,
      published_contact_email = v_effective_email,
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

    -- Automatically close inquiry routing when profile is unpublished
    UPDATE public.partners
    SET is_open_for_inquiries = FALSE
    WHERE id = p_partner_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'unpublished',
      'message', 'Passport profile unpublished and inquiry routing paused.'
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

-- 2. Replace withdraw_partner_profile_v2_secure with atomic inquiry routing pause on full withdrawal
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

    -- Atomically pause inquiry routing when all profile credentials and contact channels are withdrawn
    UPDATE public.partners
    SET is_open_for_inquiries = FALSE
    WHERE id = p_partner_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'withdrawn',
    'message', 'Passport profile content withdrawn and routing synchronized.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) TO service_role;
