-- IDEMO AUDIT LOG WRITER CONTRACT CORRECTION
-- Additive Forward-Only Migration File: 20260804170000_fix_audit_log_writer_contracts.sql
-- Work Package: WP-14C5I Audit Log Writer Contract Alignment

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

  -- Sanitize original filename for metadata
  IF p_original_filename IS NOT NULL AND pg_catalog.trim(p_original_filename) <> '' THEN
    v_safe_filename := pg_catalog.regexp_replace(pg_catalog.trim(p_original_filename), '[^a-zA-Z0-9._-]', '_', 'g');
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

  -- Validate Alt Text English requirement
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

  -- Validate Attribution
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

  -- Mandatory verification checks
  IF v_asset.alt_text->>'en' IS NULL OR pg_catalog.trim(v_asset.alt_text->>'en') = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'English alt text is required prior to verification.');
  END IF;

  IF v_asset.provenance_source IS NULL OR pg_catalog.trim(v_asset.provenance_source) = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'Provenance source is required prior to verification.');
  END IF;

  IF v_asset.licence_type IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'METADATA_INCOMPLETE', 'message', 'Licence type is required prior to verification.');
  END IF;

  IF v_asset.attribution_required IS TRUE AND (v_asset.attribution_text IS NULL OR pg_catalog.trim(v_asset.attribution_text) = '') THEN
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


-- 7. RPC: issue_partner_profile_upload_authorization_secure
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
    'partner_profile_upload_authorization_issued',
    'partner_profile_upload_authorization',
    v_auth_id,
    'success',
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

REVOKE ALL ON FUNCTION public.issue_partner_profile_upload_authorization_secure(UUID, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_partner_profile_upload_authorization_secure(UUID, TEXT, TEXT, INTEGER, INTEGER) TO service_role;


-- 8. RPC: save_partner_profile_draft_with_authorization_secure
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

REVOKE ALL ON FUNCTION public.save_partner_profile_draft_with_authorization_secure(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_partner_profile_draft_with_authorization_secure(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;


-- 9. RPC: withdraw_partner_profile_v2_secure
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
    'partner_profile_withdrawn',
    'partner_profile_content',
    p_partner_id,
    'success',
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

REVOKE ALL ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_partner_profile_v2_secure(UUID, TEXT) TO service_role;


-- 10. RPC: cleanup_partner_profile_upload_authorizations
CREATE OR REPLACE FUNCTION public.cleanup_partner_profile_upload_authorizations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INT := 0;
  v_corr_id UUID := pg_catalog.gen_random_uuid();
BEGIN
  -- Delete unconsumed authorizations expired over 7 days ago OR consumed authorizations over 30 days old
  DELETE FROM public.partner_profile_upload_authorizations
  WHERE (consumed_at IS NULL AND expires_at < NOW() - INTERVAL '7 days')
     OR (consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- AUDIT EVENT: Authorization cleanup executed
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
    NULL,
    'system_cron',
    'partner_profile_upload_authorizations_cleaned_up',
    'partner_profile_upload_authorizations',
    v_corr_id,
    'success',
    jsonb_build_object(
      'deleted_records', v_deleted_count,
      'correlation_id', v_corr_id
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_records', v_deleted_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_partner_profile_upload_authorizations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_profile_upload_authorizations() TO service_role;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
