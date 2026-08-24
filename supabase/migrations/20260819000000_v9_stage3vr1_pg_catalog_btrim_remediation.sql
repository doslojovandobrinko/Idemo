-- IDEMO STAGE 3V-R1 MEDIA PIPELINE DATABASE BTRIM REMEDIATION
-- Additive Forward-Only Migration File: 20260819000000_v9_stage3vr1_pg_catalog_btrim_remediation.sql
-- Work Package: V9-STUDIO-CORE-OPS-01 / STAGE 3V-R1
-- Purpose: Permanently remediate PostgreSQL function resolution errors by strictly replacing
--          pg_catalog.trim(text) and unqualified trim(text) calls with canonical pg_catalog.btrim(text)
--          across all media authorization, verification, metadata, attachment, and draft reservation RPCs.

-- 1. RPC: issue_recommendation_media_upload_authorization_secure
CREATE OR REPLACE FUNCTION public.issue_recommendation_media_upload_authorization_secure(
  p_author_id UUID,
  p_destination_id UUID,
  p_reserved_recommendation_id UUID,
  p_mime_type TEXT,
  p_file_size_bytes BIGINT,
  p_original_filename TEXT DEFAULT NULL,
  p_work_item_id UUID DEFAULT NULL,
  p_replacement_asset_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_wf_flag TEXT;
  v_dest_exists BOOLEAN;
  v_ext TEXT;
  v_asset_id UUID := pg_catalog.gen_random_uuid();
  v_safe_filename TEXT;
  v_object_path TEXT;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  -- Check Feature Flags
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  SELECT value INTO v_wf_flag FROM public.system_settings WHERE key = 'recommendation_workflow_enabled';

  IF COALESCE(v_rec_media_flag, 'false') <> 'true' OR COALESCE(v_wf_flag, 'true') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'error', 'WORKFLOW_ENGINE_DISABLED',
      'message', 'Recommendation media upload workflow is currently disabled.'
    );
  END IF;

  IF p_author_id IS NULL OR p_destination_id IS NULL OR p_reserved_recommendation_id IS NULL OR p_mime_type IS NULL OR p_file_size_bytes IS NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'error', 'INVALID_ARGUMENTS',
      'message', 'Mandatory parameters missing for media upload authorization.'
    );
  END IF;

  -- Validate destination exists in service_areas
  SELECT EXISTS (SELECT 1 FROM public.service_areas WHERE id = p_destination_id) INTO v_dest_exists;
  IF NOT v_dest_exists THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'error', 'INVALID_DESTINATION',
      'message', 'Destination ID does not exist in authoritative service_areas.'
    );
  END IF;

  -- Validate MIME type
  IF p_mime_type = 'image/jpeg' THEN
    v_ext := 'jpg';
  ELSIF p_mime_type = 'image/png' THEN
    v_ext := 'png';
  ELSIF p_mime_type = 'image/webp' THEN
    v_ext := 'webp';
  ELSE
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'error', 'UNSUPPORTED_MIME_TYPE',
      'message', 'MIME type must strictly be image/jpeg, image/png, or image/webp.'
    );
  END IF;

  -- Validate file size (1 B to 5 MB)
  IF p_file_size_bytes <= 0 OR p_file_size_bytes > 5242880 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'error', 'INVALID_FILE_SIZE',
      'message', 'File size must be between 1 byte and 5,242,880 bytes (5 MB).'
    );
  END IF;

  -- Sanitize original filename for metadata (using canonical pg_catalog.btrim)
  IF p_original_filename IS NOT NULL AND pg_catalog.btrim(p_original_filename) <> '' THEN
    v_safe_filename := pg_catalog.regexp_replace(pg_catalog.btrim(p_original_filename), '[^a-zA-Z0-9._-]', '_', 'g');
    IF pg_catalog.length(v_safe_filename) > 100 THEN
      v_safe_filename := pg_catalog.substring(v_safe_filename, 1, 100);
    END IF;
  ELSE
    v_safe_filename := 'media_upload.' || v_ext;
  END IF;

  -- Construct Server-Authoritative Canonical Object Path
  v_object_path := 'destinations/' || p_destination_id::text || '/recommendations/drafts/' || p_reserved_recommendation_id::text || '/' || v_asset_id::text || '.' || v_ext;

  -- Insert Asset Row
  INSERT INTO public.recommendation_media_assets (
    id,
    work_item_id,
    reserved_recommendation_id,
    destination_id,
    bucket_name,
    object_path,
    original_filename_safe,
    mime_type,
    file_size_bytes,
    status,
    verification_status,
    created_by
  )
  VALUES (
    v_asset_id,
    p_work_item_id,
    p_reserved_recommendation_id,
    p_destination_id,
    'recommendation-media',
    v_object_path,
    v_safe_filename,
    p_mime_type,
    p_file_size_bytes,
    'authorized',
    'pending',
    p_author_id
  );

  -- Audit Log
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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_upload_authorization_issued',
    'recommendation_media_asset',
    v_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'destination_id', p_destination_id::text,
      'reserved_recommendation_id', p_reserved_recommendation_id::text,
      'object_path', v_object_path,
      'mime_type', p_mime_type,
      'file_size_bytes', p_file_size_bytes,
      'work_item_id', p_work_item_id,
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', TRUE,
    'asset_id', v_asset_id,
    'bucket', 'recommendation-media',
    'object_path', v_object_path,
    'expires_at', pg_catalog.timezone('utc'::text, pg_catalog.now() + INTERVAL '2 hours'),
    'allowed_mime_type', p_mime_type,
    'maximum_size_bytes', 5242880
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_recommendation_media_upload_authorization_secure(UUID, UUID, UUID, TEXT, BIGINT, TEXT, UUID, UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_recommendation_media_upload_authorization_secure(UUID, UUID, UUID, TEXT, BIGINT, TEXT, UUID, UUID, TEXT, UUID) TO service_role;


-- 2. RPC: confirm_recommendation_media_upload_secure
CREATE OR REPLACE FUNCTION public.confirm_recommendation_media_upload_secure(
  p_author_id UUID,
  p_asset_id UUID,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_asset public.recommendation_media_assets%ROWTYPE;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  IF v_asset.status <> 'authorized' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Asset is not in authorized status.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    status = 'uploaded_pending_verification',
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_upload_confirmed',
    'recommendation_media_asset',
    p_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'object_path', v_asset.object_path,
      'status', 'uploaded_pending_verification',
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', TRUE,
    'asset_id', p_asset_id,
    'status', 'uploaded_pending_verification',
    'bucket', v_asset.bucket_name,
    'object_path', v_asset.object_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_recommendation_media_upload_secure(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_recommendation_media_upload_secure(UUID, UUID, UUID) TO service_role;


-- 3. RPC: update_recommendation_media_metadata_secure
CREATE OR REPLACE FUNCTION public.update_recommendation_media_metadata_secure(
  p_author_id UUID,
  p_asset_id UUID,
  p_alt_text JSONB,
  p_provenance_source TEXT DEFAULT NULL,
  p_acquisition_method TEXT DEFAULT NULL,
  p_licence_type TEXT DEFAULT NULL,
  p_attribution_required BOOLEAN DEFAULT FALSE,
  p_attribution_text TEXT DEFAULT NULL,
  p_creator_name TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_asset public.recommendation_media_assets%ROWTYPE;
  v_en_alt TEXT;
  v_acq_method TEXT := p_acquisition_method;
  v_lic_type TEXT := p_licence_type;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  IF v_asset.status IN ('replaced', 'abandoned', 'rejected') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Cannot update metadata for replaced, abandoned, or rejected asset.');
  END IF;

  -- Validate Alt Text English requirement using canonical pg_catalog.btrim
  v_en_alt := p_alt_text->>'en';
  IF v_en_alt IS NULL OR pg_catalog.btrim(v_en_alt) = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'MISSING_ALT_TEXT_EN', 'message', 'English alt text (alt_text.en) is mandatory.');
  END IF;

  -- Normalize acquisition method
  IF v_acq_method IN ('Direct Curation', 'Direct Inspection', 'Direct Verification', 'direct_curation', 'direct_verification') THEN
    v_acq_method := 'original';
  END IF;

  -- Validate Acquisition Method if provided
  IF v_acq_method IS NOT NULL AND v_acq_method NOT IN ('original', 'commissioned', 'partner_supplied', 'licensed', 'public_domain', 'tourism_board') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_ACQUISITION_METHOD', 'message', 'Invalid acquisition_method value.');
  END IF;

  -- Normalize licence type
  IF v_lic_type = 'CC-BY 4.0' THEN
    v_lic_type := 'CC-BY-4.0';
  END IF;

  -- Validate Licence Type if provided
  IF v_lic_type IS NOT NULL AND v_lic_type NOT IN ('CC-BY-4.0', 'Editorial-Custom', 'Public-Domain', 'Licensed-Partner') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_LICENCE_TYPE', 'message', 'Invalid licence_type value.');
  END IF;

  -- Validate Attribution using canonical pg_catalog.btrim
  IF p_attribution_required IS TRUE AND (p_attribution_text IS NULL OR pg_catalog.btrim(p_attribution_text) = '') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ATTRIBUTION_REQUIRED_MISSING_TEXT', 'message', 'Attribution text is mandatory when attribution_required is true.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    alt_text = COALESCE(p_alt_text, '{}'::jsonb),
    provenance_source = NULLIF(pg_catalog.btrim(p_provenance_source), ''),
    acquisition_method = v_acq_method,
    licence_type = v_lic_type,
    attribution_required = COALESCE(p_attribution_required, FALSE),
    attribution_text = NULLIF(pg_catalog.btrim(p_attribution_text), ''),
    creator_name = NULLIF(pg_catalog.btrim(p_creator_name), ''),
    source_url = NULLIF(pg_catalog.btrim(p_source_url), ''),
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_metadata_updated',
    'recommendation_media_asset',
    p_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'licence_type', v_lic_type,
      'acquisition_method', v_acq_method,
      'attribution_required', p_attribution_required,
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'message', 'Metadata updated successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.update_recommendation_media_metadata_secure(UUID, UUID, JSONB, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_recommendation_media_metadata_secure(UUID, UUID, JSONB, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, UUID) TO service_role;


-- 4. RPC: verify_recommendation_media_asset_secure
CREATE OR REPLACE FUNCTION public.verify_recommendation_media_asset_secure(
  p_author_id UUID,
  p_asset_id UUID,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_asset public.recommendation_media_assets%ROWTYPE;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  IF v_asset.status <> 'uploaded_pending_verification' AND v_asset.status <> 'authorized' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_STATE_TRANSITION', 'message', 'Asset must be uploaded before verification.');
  END IF;

  -- Mandatory verification checks using canonical pg_catalog.btrim
  IF v_asset.alt_text->>'en' IS NULL OR pg_catalog.btrim(v_asset.alt_text->>'en') = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'English alt text is required prior to verification.');
  END IF;

  IF v_asset.provenance_source IS NULL OR pg_catalog.btrim(v_asset.provenance_source) = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'Provenance source is required prior to verification.');
  END IF;

  IF v_asset.licence_type IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'Licence type is required prior to verification.');
  END IF;

  IF v_asset.attribution_required IS TRUE AND (v_asset.attribution_text IS NULL OR pg_catalog.btrim(v_asset.attribution_text) = '') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'Attribution text is required prior to verification when attribution_required is true.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    verification_status = 'verified',
    status = 'verified',
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_asset_verified',
    'recommendation_media_asset',
    p_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'verification_status', 'verified',
      'status', 'verified',
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'verification_status', 'verified', 'status', 'verified');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_recommendation_media_asset_secure(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_recommendation_media_asset_secure(UUID, UUID, UUID) TO service_role;


-- 5. RPC: attach_recommendation_media_asset_secure
CREATE OR REPLACE FUNCTION public.attach_recommendation_media_asset_secure(
  p_author_id UUID,
  p_asset_id UUID,
  p_work_item_id UUID DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_asset public.recommendation_media_assets%ROWTYPE;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  IF v_asset.status <> 'verified' AND v_asset.status <> 'attached' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'UNVERIFIED_ASSET_CANNOT_ATTACH', 'message', 'Asset must be verified before attaching to recommendation workflow.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    status = 'attached',
    work_item_id = COALESCE(p_work_item_id, work_item_id),
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_asset_attached',
    'recommendation_media_asset',
    p_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'status', 'attached',
      'work_item_id', COALESCE(p_work_item_id, v_asset.work_item_id),
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', TRUE,
    'media_reference', pg_catalog.jsonb_build_object(
      'asset_id', v_asset.id,
      'bucket', v_asset.bucket_name,
      'object_path', v_asset.object_path,
      'mime_type', v_asset.mime_type,
      'width', v_asset.width_pixels,
      'height', v_asset.height_pixels,
      'alt_text', v_asset.alt_text,
      'provenance', pg_catalog.jsonb_build_object(
        'source', v_asset.provenance_source,
        'acquisition_method', v_asset.acquisition_method,
        'licence_type', v_asset.licence_type,
        'attribution_required', v_asset.attribution_required,
        'attribution_text', v_asset.attribution_text,
        'creator_name', v_asset.creator_name,
        'source_url', v_asset.source_url
      ),
      'verification_status', 'verified'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.attach_recommendation_media_asset_secure(UUID, UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_recommendation_media_asset_secure(UUID, UUID, UUID, UUID) TO service_role;


-- 6. RPC: abandon_recommendation_media_asset_secure
CREATE OR REPLACE FUNCTION public.abandon_recommendation_media_asset_secure(
  p_author_id UUID,
  p_asset_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec_media_flag TEXT;
  v_asset public.recommendation_media_assets%ROWTYPE;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    status = 'abandoned',
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

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
    p_author_id,
    NULL,
    'studio_user',
    'recommendation_media_asset_abandoned',
    'recommendation_media_asset',
    p_asset_id,
    'success',
    pg_catalog.jsonb_build_object(
      'status', 'abandoned',
      'reason', p_reason,
      'correlation_id', v_corr_id
    )
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'status', 'abandoned');
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_recommendation_media_asset_secure(UUID, UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_recommendation_media_asset_secure(UUID, UUID, TEXT, UUID) TO service_role;


-- 7. RPC: reserve_recommendation_draft_secure
CREATE OR REPLACE FUNCTION public.reserve_recommendation_draft_secure(
  p_destination_id UUID,
  p_reserved_by UUID,
  p_idempotency_key TEXT,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_destination_exists BOOLEAN;
  v_idempotency_key TEXT;
  v_correlation_id UUID;
  v_existing RECORD;
  v_new_reserved_id UUID;
  v_new_id UUID;
  v_now TIMESTAMPTZ := pg_catalog.timezone('utc'::text, pg_catalog.now());
BEGIN
  -- Validate destination existence
  SELECT EXISTS (
    SELECT 1 FROM public.service_areas WHERE id = p_destination_id
  ) INTO v_destination_exists;

  IF NOT v_destination_exists THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_DESTINATION',
      'message', 'Destination ID does not exist in service areas.'
    );
  END IF;

  -- Validate idempotency key using canonical pg_catalog.btrim
  v_idempotency_key := NULLIF(pg_catalog.btrim(p_idempotency_key), '');
  IF v_idempotency_key IS NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_IDEMPOTENCY_KEY',
      'message', 'Idempotency key is required and cannot be empty.'
    );
  END IF;

  v_correlation_id := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());

  -- Search for existing active reservation for (reserved_by, destination_id, idempotency_key)
  SELECT id, reserved_recommendation_id, destination_id, status, created_at, expires_at
  INTO v_existing
  FROM public.recommendation_draft_reservations
  WHERE reserved_by = p_reserved_by
    AND destination_id = p_destination_id
    AND idempotency_key = v_idempotency_key
    AND status = 'active';

  IF v_existing.id IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reservation_id', v_existing.id,
      'reserved_recommendation_id', v_existing.reserved_recommendation_id,
      'destination_id', v_existing.destination_id,
      'status', v_existing.status,
      'is_idempotent_replay', true,
      'created_at', v_existing.created_at,
      'expires_at', v_existing.expires_at
    );
  END IF;

  -- Generate new reserved UUID and insert
  v_new_reserved_id := pg_catalog.gen_random_uuid();
  v_new_id := pg_catalog.gen_random_uuid();

  INSERT INTO public.recommendation_draft_reservations (
    id,
    reserved_recommendation_id,
    destination_id,
    reserved_by,
    idempotency_key,
    correlation_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_new_id,
    v_new_reserved_id,
    p_destination_id,
    p_reserved_by,
    v_idempotency_key,
    v_correlation_id,
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (reserved_by, destination_id, idempotency_key)
  DO UPDATE SET updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  RETURNING id, reserved_recommendation_id, destination_id, status, created_at, expires_at
  INTO v_existing;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reservation_id', v_existing.id,
    'reserved_recommendation_id', v_existing.reserved_recommendation_id,
    'destination_id', v_existing.destination_id,
    'status', v_existing.status,
    'is_idempotent_replay', false,
    'created_at', v_existing.created_at,
    'expires_at', v_existing.expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_recommendation_draft_secure(UUID, UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_recommendation_draft_secure(UUID, UUID, TEXT, UUID) TO service_role;


-- 8. RPC: abandon_recommendation_draft_secure
CREATE OR REPLACE FUNCTION public.abandon_recommendation_draft_secure(
  p_reserved_recommendation_id UUID,
  p_reserved_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := pg_catalog.timezone('utc'::text, pg_catalog.now());
  v_updated INT;
BEGIN
  UPDATE public.recommendation_draft_reservations
  SET status = 'abandoned',
      abandoned_at = v_now,
      updated_at = v_now
  WHERE reserved_recommendation_id = p_reserved_recommendation_id
    AND reserved_by = p_reserved_by
    AND status = 'active';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'RESERVATION_NOT_FOUND',
      'message', 'No active draft reservation found for the specified user and reservation ID.'
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reserved_recommendation_id', p_reserved_recommendation_id,
    'status', 'abandoned',
    'abandoned_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_recommendation_draft_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_recommendation_draft_secure(UUID, UUID, TEXT) TO service_role;
