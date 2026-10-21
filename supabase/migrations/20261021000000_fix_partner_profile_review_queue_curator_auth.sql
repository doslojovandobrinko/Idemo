-- IDEMO STUDIO CURATOR AUTHORIZATION & PASSPORT REVIEW QUEUE REMEDIATION
-- Migration: 20261021000000_fix_partner_profile_review_queue_curator_auth.sql
-- Purpose:
--   1. Provision/synchronize the canonical IDEMO Studio operator account (office@idemo.group)
--      in auth.users and auth.identities with app_metadata.role = 'super_admin' so StudioAuthShell
--      signInWithPassword establishes an authenticated JWT session instead of falling back to anon.
--   2. Align public.fetch_partner_profile_review_queue_secure internal authorization checks with
--      canonical Studio roles ('superadmin', 'editoriallead', 'curator', 'partnermanager') while
--      preserving strict EXECUTE revocation from PUBLIC and anon.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Provision or synchronize canonical Studio operator in auth.users & auth.identities
DO $$
DECLARE
  v_studio_user_id UUID;
BEGIN
  SELECT id INTO v_studio_user_id
  FROM auth.users
  WHERE LOWER(email) = 'office@idemo.group'
  LIMIT 1;

  IF v_studio_user_id IS NULL THEN
    v_studio_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_studio_user_id,
      'authenticated',
      'authenticated',
      'office@idemo.group',
      extensions.crypt('!2006Isabella100!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb,
      '{"name":"IDEMO Studio Operator","full_name":"IDEMO Studio Operator"}'::jsonb,
      FALSE,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt('!2006Isabella100!', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name":"IDEMO Studio Operator","full_name":"IDEMO Studio Operator"}'::jsonb,
      aud = 'authenticated',
      role = 'authenticated',
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      updated_at = now()
    WHERE id = v_studio_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_studio_user_id
      AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_studio_user_id,
      v_studio_user_id::text,
      jsonb_build_object(
        'sub', v_studio_user_id::text,
        'email', 'office@idemo.group',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- 2. Replace fetch_partner_profile_review_queue_secure with aligned Curator/Studio role check
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
  v_raw_role JSONB;
  v_caller_role TEXT;
  v_normalized_role TEXT;
  v_results JSONB;
  v_status TEXT;
BEGIN
  v_auth_role := COALESCE(auth.role(), '');

  -- Enforce Curator / Studio Authorization:
  -- service_role bypasses; authenticated requires a verified Studio role in app_metadata.role
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'UNAUTHORIZED',
        'message', 'Authentication required.'
      );
    END IF;

    v_raw_role := auth.jwt() -> 'app_metadata' -> 'role';
    IF v_raw_role IS NOT NULL AND jsonb_typeof(v_raw_role) = 'array' AND jsonb_array_length(v_raw_role) > 0 THEN
      v_caller_role := COALESCE(v_raw_role ->> 0, '');
    ELSE
      v_caller_role := COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() ->> 'role',
        ''
      );
    END IF;

    v_normalized_role := LOWER(REGEXP_REPLACE(v_caller_role, '[\s_-]+', '', 'g'));

    IF v_normalized_role NOT IN ('editoriallead', 'superadmin', 'curator', 'partnermanager') THEN
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

COMMIT;
