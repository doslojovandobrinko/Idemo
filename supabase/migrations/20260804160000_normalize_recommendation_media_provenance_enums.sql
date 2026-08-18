-- IDEMO RECOMMENDATION MEDIA PROVENANCE ENUM NORMALIZATION
-- Additive Migration File: 20260804160000_normalize_recommendation_media_provenance_enums.sql

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
    event_type, actor_type, actor_id, resource_type, resource_id, payload, correlation_id
  )
  VALUES (
    'recommendation_media_metadata_updated', 'studio_user', p_author_id::text, 'recommendation_media_asset', p_asset_id::text,
    pg_catalog.jsonb_build_object('licence_type', v_lic_type, 'acquisition_method', v_acq_method, 'attribution_required', p_attribution_required), v_corr_id
  );

  RETURN pg_catalog.jsonb_build_object('success', TRUE, 'asset_id', p_asset_id, 'message', 'Metadata updated successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.update_recommendation_media_metadata_secure(
  uuid,
  uuid,
  jsonb,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  uuid
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_recommendation_media_metadata_secure(
  uuid,
  uuid,
  jsonb,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  uuid
)
TO service_role;
