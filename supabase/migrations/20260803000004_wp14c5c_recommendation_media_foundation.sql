-- IDEMO RECOMMENDATION MEDIA STORAGE & AUTHORIZATION FOUNDATION
-- Additive Migration File: 20260803000004_wp14c5c_recommendation_media_foundation.sql
-- Work Package: WP-14C5C Canonical Recommendation Media Storage Foundation

-- 1. Dedicated Private Storage Bucket: recommendation-media (Safe Deterministic Initialization)
DO $$
DECLARE
  v_bucket storage.buckets%ROWTYPE;
BEGIN
  SELECT * INTO v_bucket FROM storage.buckets WHERE id = 'recommendation-media';
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'recommendation-media',
      'recommendation-media',
      FALSE,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  ELSE
    IF v_bucket.public IS TRUE 
       OR v_bucket.file_size_limit <> 5242880 
       OR v_bucket.allowed_mime_types IS NULL 
       OR NOT (v_bucket.allowed_mime_types @> ARRAY['image/jpeg', 'image/png', 'image/webp'] 
               AND v_bucket.allowed_mime_types <@ ARRAY['image/jpeg', 'image/png', 'image/webp']) THEN
      RAISE EXCEPTION 'STORAGE_BUCKET_CONFIGURATION_CONFLICT: recommendation-media bucket exists with incompatible settings.';
    END IF;
  END IF;
END;
$$;

-- 2. Feature Flag: recommendation_media_upload_enabled
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'recommendation_media_upload_enabled',
  'false',
  'Server-authoritative flag governing canonical recommendation draft media upload authorizations'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Table: public.recommendation_media_assets
CREATE TABLE IF NOT EXISTS public.recommendation_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NULL REFERENCES public.editorial_work_items(id) ON DELETE RESTRICT,
  reserved_recommendation_id UUID NOT NULL,
  destination_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE RESTRICT,
  bucket_name TEXT NOT NULL CHECK (bucket_name = 'recommendation-media'),
  object_path TEXT NOT NULL UNIQUE,
  original_filename_safe TEXT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  width_pixels INTEGER NULL CHECK (width_pixels IS NULL OR width_pixels > 0),
  height_pixels INTEGER NULL CHECK (height_pixels IS NULL OR height_pixels > 0),
  status TEXT NOT NULL CHECK (status IN ('authorized', 'uploaded_pending_verification', 'verified', 'attached', 'replaced', 'abandoned', 'rejected')),
  alt_text JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance_source TEXT NULL,
  acquisition_method TEXT NULL CHECK (acquisition_method IS NULL OR acquisition_method IN ('original', 'commissioned', 'partner_supplied', 'licensed', 'public_domain', 'tourism_board')),
  licence_type TEXT NULL CHECK (licence_type IS NULL OR licence_type IN ('CC-BY-4.0', 'Editorial-Custom', 'Public-Domain', 'Licensed-Partner')),
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  attribution_text TEXT NULL,
  creator_name TEXT NULL,
  source_url TEXT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_by UUID NOT NULL,
  replaced_by UUID NULL REFERENCES public.recommendation_media_assets(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rec_media_work_item ON public.recommendation_media_assets(work_item_id);
CREATE INDEX IF NOT EXISTS idx_rec_media_reserved_rec ON public.recommendation_media_assets(reserved_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_media_dest ON public.recommendation_media_assets(destination_id);
CREATE INDEX IF NOT EXISTS idx_rec_media_status ON public.recommendation_media_assets(status);

ALTER TABLE public.recommendation_media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_media_assets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.recommendation_media_assets TO service_role;

-- 4. Trigger Function: Prevent modification of immutable fields on recommendation_media_assets
CREATE OR REPLACE FUNCTION public.prevent_rec_media_asset_immutable_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.id <> NEW.id THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: id cannot be changed.';
  END IF;
  IF OLD.reserved_recommendation_id <> NEW.reserved_recommendation_id THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: reserved_recommendation_id cannot be changed.';
  END IF;
  IF OLD.destination_id <> NEW.destination_id THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: destination_id cannot be changed.';
  END IF;
  IF OLD.bucket_name <> NEW.bucket_name THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: bucket_name cannot be changed.';
  END IF;
  IF OLD.object_path <> NEW.object_path THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: object_path cannot be changed.';
  END IF;
  IF OLD.mime_type <> NEW.mime_type THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: mime_type cannot be changed.';
  END IF;
  IF OLD.file_size_bytes <> NEW.file_size_bytes THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: file_size_bytes cannot be changed.';
  END IF;
  IF OLD.created_by <> NEW.created_by THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: created_by cannot be changed.';
  END IF;
  IF OLD.created_at <> NEW.created_at THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_IMMUTABLE_FIELD: created_at cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_rec_media_asset_immutable ON public.recommendation_media_assets;
CREATE TRIGGER trg_prevent_rec_media_asset_immutable
  BEFORE UPDATE ON public.recommendation_media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_rec_media_asset_immutable_field_changes();

-- 5. RPC: Issue Recommendation Media Upload Authorization Secure
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
      v_safe_filename := pg_catalog.substring(v_safe_filename FROM 1 FOR 100);
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
    event_type,
    actor_type,
    actor_id,
    resource_type,
    resource_id,
    payload,
    correlation_id
  )
  VALUES (
    'recommendation_media_upload_authorization_issued',
    'studio_user',
    p_author_id::text,
    'recommendation_media_asset',
    v_asset_id::text,
    pg_catalog.jsonb_build_object(
      'destination_id', p_destination_id::text,
      'reserved_recommendation_id', p_reserved_recommendation_id::text,
      'object_path', v_object_path,
      'mime_type', p_mime_type,
      'file_size_bytes', p_file_size_bytes,
      'work_item_id', p_work_item_id
    ),
    v_corr_id
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

REVOKE ALL ON FUNCTION public.issue_recommendation_media_upload_authorization_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_recommendation_media_upload_authorization_secure TO service_role;

-- 6. RPC: Confirm Recommendation Media Upload Secure
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
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_upload_confirmed', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('object_path', v_asset.object_path, 'status', 'uploaded_pending_verification'), v_corr_id
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

REVOKE ALL ON FUNCTION public.confirm_recommendation_media_upload_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_recommendation_media_upload_secure TO service_role;

-- 7. RPC: Update Recommendation Media Metadata Secure
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
  IF v_en_alt IS NULL OR pg_catalog.trim(v_en_alt) = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'MISSING_ALT_TEXT_EN', 'message', 'English alt text (alt_text.en) is mandatory.');
  END IF;

  -- Validate Acquisition Method if provided
  IF p_acquisition_method IS NOT NULL AND p_acquisition_method NOT IN ('original', 'commissioned', 'partner_supplied', 'licensed', 'public_domain', 'tourism_board') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_ACQUISITION_METHOD', 'message', 'Invalid acquisition_method value.');
  END IF;

  -- Validate Licence Type if provided
  IF p_licence_type IS NOT NULL AND p_licence_type NOT IN ('CC-BY-4.0', 'Editorial-Custom', 'Public-Domain', 'Licensed-Partner') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'INVALID_LICENCE_TYPE', 'message', 'Invalid licence_type value.');
  END IF;

  -- Validate Attribution
  IF p_attribution_required IS TRUE AND (p_attribution_text IS NULL OR pg_catalog.trim(p_attribution_text) = '') THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ATTRIBUTION_REQUIRED_MISSING_TEXT', 'message', 'Attribution text is mandatory when attribution_required is true.');
  END IF;

  UPDATE public.recommendation_media_assets
  SET
    alt_text = COALESCE(p_alt_text, '{}'::jsonb),
    provenance_source = NULLIF(pg_catalog.trim(p_provenance_source), ''),
    acquisition_method = p_acquisition_method,
    licence_type = p_licence_type,
    attribution_required = COALESCE(p_attribution_required, FALSE),
    attribution_text = NULLIF(pg_catalog.trim(p_attribution_text), ''),
    creator_name = NULLIF(pg_catalog.trim(p_creator_name), ''),
    source_url = NULLIF(pg_catalog.trim(p_source_url), ''),
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

  INSERT INTO public.audit_logs (
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_metadata_updated', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('licence_type', p_licence_type, 'acquisition_method', p_acquisition_method, 'attribution_required', p_attribution_required), v_corr_id
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'message', 'Metadata updated successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.update_recommendation_media_metadata_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_recommendation_media_metadata_secure TO service_role;

-- 8. RPC: Verify Recommendation Media Asset Secure
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
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_asset_verified', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('verification_status', 'verified', 'status', 'verified'), v_corr_id
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'verification_status', 'verified', 'status', 'verified');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_recommendation_media_asset_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_recommendation_media_asset_secure TO service_role;

-- 9. RPC: Attach Recommendation Media Asset Secure
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
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_asset_attached', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('status', 'attached', 'work_item_id', COALESCE(p_work_item_id, v_asset.work_item_id)), v_corr_id
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

REVOKE ALL ON FUNCTION public.attach_recommendation_media_asset_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_recommendation_media_asset_secure TO service_role;

-- 10. RPC: Abandon Recommendation Media Asset Secure
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
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_asset_abandoned', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('status', 'abandoned', 'reason', p_reason), v_corr_id
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'status', 'abandoned');
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_recommendation_media_asset_secure FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_recommendation_media_asset_secure TO service_role;
