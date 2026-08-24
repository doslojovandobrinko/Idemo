-- IDEMO SINGLE PRIMARY MEDIA INVARIANT MIGRATION
-- Additive Migration File: 20260823020000_single_primary_media_invariant.sql
-- Work Package: Single Primary Media Invariant Enforcement & Žestival Remediation

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
  v_prev_asset public.recommendation_media_assets%ROWTYPE;
  v_corr_id UUID := COALESCE(p_correlation_id, pg_catalog.gen_random_uuid());
  v_replaced_asset_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT value INTO v_rec_media_flag FROM public.system_settings WHERE key = 'recommendation_media_upload_enabled';
  IF COALESCE(v_rec_media_flag, 'false') <> 'true' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'WORKFLOW_ENGINE_DISABLED', 'message', 'Recommendation media upload workflow is currently disabled.');
  END IF;

  -- 1. Lock target asset row
  SELECT * INTO v_asset FROM public.recommendation_media_assets WHERE id = p_asset_id FOR UPDATE;
  IF v_asset.id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'ASSET_NOT_FOUND', 'message', 'Recommendation media asset record not found.');
  END IF;

  IF v_asset.status <> 'verified' AND v_asset.status <> 'attached' THEN
    RETURN pg_catalog.jsonb_build_object('success', FALSE, 'error', 'UNVERIFIED_ASSET_CANNOT_ATTACH', 'message', 'Asset must be verified before attaching to recommendation workflow.');
  END IF;

  -- 2. Identify and retire any OTHER attached asset for the same recommendation draft
  FOR v_prev_asset IN
    SELECT *
    FROM public.recommendation_media_assets
    WHERE reserved_recommendation_id = v_asset.reserved_recommendation_id
      AND status = 'attached'
      AND id <> p_asset_id
    FOR UPDATE
  LOOP
    UPDATE public.recommendation_media_assets
    SET
      status = 'replaced',
      replaced_by = p_asset_id,
      updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
    WHERE id = v_prev_asset.id;

    v_replaced_asset_ids := pg_catalog.array_append(v_replaced_asset_ids, v_prev_asset.id);
  END LOOP;

  -- 3. Mark target asset as attached
  UPDATE public.recommendation_media_assets
  SET
    status = 'attached',
    work_item_id = COALESCE(p_work_item_id, work_item_id),
    updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
  WHERE id = p_asset_id;

  -- 4. Log Audit Event with replaced asset metadata
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
      'correlation_id', v_corr_id,
      'replaced_asset_ids', v_replaced_asset_ids
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

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure::text AS func_sig
        FROM pg_proc
        WHERE proname = 'attach_recommendation_media_asset_secure'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION ' || r.func_sig || ' FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.func_sig || ' TO service_role;';
    END LOOP;
END $$;

-- 5. Non-destructive data remediation for Žestival draft duplicate state
UPDATE public.recommendation_media_assets
SET
  status = 'replaced',
  replaced_by = '1ca112a5-ddf9-4c62-a933-1f0dedc8de52'::uuid,
  updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
WHERE id = '216c14ee-1aec-4902-9eff-9457c78a0877'::uuid
  AND reserved_recommendation_id = 'c813ec58-84b0-487f-9c67-49f71a88230b'::uuid
  AND status = 'attached';
