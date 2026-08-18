/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * WP-14C5D Canonical Recommendation Media Service
 * Manages the client-side state transitions, file validation,
 * signed storage upload, metadata registration, and attachment pipeline.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export type MediaWorkflowState =
  | 'empty'
  | 'selected'
  | 'authorizing'
  | 'uploading'
  | 'confirming'
  | 'uploaded_pending_metadata'
  | 'updating_metadata'
  | 'ready_for_verification'
  | 'verifying'
  | 'verified'
  | 'attaching'
  | 'attached'
  | 'replacing'
  | 'abandoning'
  | 'error';

export interface LocalMediaValidationResult {
  valid: boolean;
  error?: string;
}

export interface RecommendationMediaMetadata {
  altText?: Record<string, string>;
  provenanceSource?: string;
  acquisitionMethod?: string;
  licenceType?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  creatorName?: string;
  sourceUrl?: string;
}

export interface AuthorizeUploadParams {
  destination_id: string;
  reserved_recommendation_id: string;
  mime_type: string;
  file_size_bytes: number;
  original_filename?: string;
  work_item_id?: string;
  replacement_asset_id?: string;
}

export interface AuthorizeUploadResult {
  success: boolean;
  asset_id?: string;
  bucket?: string;
  object_path?: string;
  signed_upload_url?: string;
  token?: string;
  path?: string;
  expires_at?: string;
  canonical_url?: string;
  error?: string;
  message?: string;
}

export interface MediaOperationResult {
  success: boolean;
  status?: string;
  asset_id?: string;
  object_path?: string;
  canonical_url?: string;
  verification_status?: string;
  error?: string;
  message?: string;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates selected image file locally before requesting upload authorization.
 */
export function validateLocalMediaFile(file: File): LocalMediaValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Only JPEG, PNG, and WebP are permitted.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum permitted limit of 5.00 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Derives canonical private reference for an object path in recommendation-media bucket.
 * Format: recommendation-media/<object_path> or <object_path>
 */
export function getCanonicalMediaReference(objectPath: string): string {
  if (!objectPath) return '';
  const cleanPath = objectPath.replace(/^\/+/, '');
  if (cleanPath.startsWith('recommendation-media/')) {
    return cleanPath;
  }
  return `recommendation-media/${cleanPath}`;
}

/**
 * Helper to call editorial_workflow_engine Edge Function routes.
 */
async function callWorkflowEngineRoute(route: string, body: Record<string, any>): Promise<any> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'MEDIA_SERVICE_UNAVAILABLE', message: 'Supabase is not configured in this environment.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'MEDIA_SERVICE_UNAVAILABLE', message: 'Supabase client is uninitialized.' };
  }

  const sessionRes = await supabase.auth.getSession();
  const token = sessionRes.data?.session?.access_token;
  if (!token) {
    return { success: false, error: 'MEDIA_AUTH_REQUIRED', message: 'Studio user session access token is required to perform media operations.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const endpointPath = route.startsWith('/') ? route.replace(/^\//, '') : `recommendations/media/${route}`;
  const url = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/editorial_workflow_engine/${endpointPath}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'x-correlation-id': crypto.randomUUID ? crypto.randomUUID() : `corr-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.error) {
      return {
        success: false,
        error: data.error || `HTTP_${res.status}`,
        message: data.message || `Edge function returned status ${res.status}`,
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'MEDIA_SERVICE_UNAVAILABLE',
      message: err?.message || 'Editorial workflow engine backend is unavailable.',
    };
  }
}

/**
 * Server-authoritative draft reservation.
 */
export async function reserveRecommendationDraft(
  destinationId: string,
  idempotencyKey?: string,
  correlationId?: string
): Promise<{
  success: boolean;
  reservation_id?: string;
  reserved_recommendation_id?: string;
  destination_id?: string;
  status?: string;
  is_idempotent_replay?: boolean;
  created_at?: string;
  expires_at?: string | null;
  error?: string;
  message?: string;
}> {
  return callWorkflowEngineRoute('/recommendations/reserve-draft', {
    destination_id: destinationId,
    idempotency_key: idempotencyKey || `reserve_${destinationId}`,
    correlation_id: correlationId,
  });
}

/**
 * Server-authoritative draft abandonment.
 */
export async function abandonRecommendationDraft(
  reservedRecommendationId: string,
  reason?: string
): Promise<{
  success: boolean;
  reserved_recommendation_id?: string;
  status?: string;
  abandoned_at?: string;
  error?: string;
  message?: string;
}> {
  return callWorkflowEngineRoute('/recommendations/abandon-draft', {
    reserved_recommendation_id: reservedRecommendationId,
    reason,
  });
}

/**
 * Phase 1: Request Upload Authorization
 */
export async function authorizeRecommendationMediaUpload(
  params: AuthorizeUploadParams
): Promise<AuthorizeUploadResult> {
  const result = await callWorkflowEngineRoute('authorize-upload', params);
  if (!result.success) {
    return result;
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const objectPath = result.object_path || result.path;

  // DEFECT 2: Fail-closed validation of server authorization response
  if (
    !result.bucket ||
    result.bucket !== 'recommendation-media' ||
    !objectPath ||
    !result.asset_id ||
    !UUID_REGEX.test(result.asset_id) ||
    !result.token ||
    (result.path && result.object_path && result.path !== result.object_path)
  ) {
    return {
      success: false,
      error: 'MEDIA_AUTHORIZATION_INVALID',
      message: 'Server authorization payload is missing required fields (bucket, object_path, asset_id, token) or bucket/path/token/asset_id is invalid.',
    };
  }

  if (result.expires_at) {
    const expiryTime = new Date(result.expires_at).getTime();
    if (isNaN(expiryTime) || expiryTime <= Date.now()) {
      return {
        success: false,
        error: 'MEDIA_AUTHORIZATION_INVALID',
        message: 'Upload authorization token has expired.',
      };
    }
  }

  if (result.object_path && !result.canonical_url) {
    result.canonical_url = getCanonicalMediaReference(result.object_path);
  }

  return result;
}

/**
 * Phase 2: Perform Signed Storage Upload
 * Uses official uploadToSignedUrl contract with upsert: false.
 * Note: Tokens and signed URLs are handled transiently in memory and never persisted.
 */
export async function uploadFileToSignedUrl(
  file: File,
  bucket: string,
  path: string,
  token: string,
  signedUploadUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!bucket || !path || !token) {
    return { success: false, error: 'MEDIA_AUTHORIZATION_INVALID: Missing required storage upload parameters (bucket, path, or token).' };
  }
  if (bucket !== 'recommendation-media') {
    return { success: false, error: 'MEDIA_AUTHORIZATION_INVALID: Unauthorized storage bucket target.' };
  }

  try {
    const supabase = getSupabaseClient();
    if (supabase && token && path) {
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        return { success: true };
      }
      return { success: false, error: `Storage upload failed: ${error.message}` };
    }

    if (signedUploadUrl) {
      const res = await fetch(signedUploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (res.ok) {
        return { success: true };
      }
      const errText = await res.text().catch(() => '');
      return { success: false, error: `Storage upload failed (${res.status}): ${errText || res.statusText}` };
    }

    return { success: false, error: 'No valid signed upload token, path, or URL provided.' };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Phase 3: Confirm Upload
 */
export async function confirmRecommendationMediaUpload(assetId: string): Promise<MediaOperationResult> {
  const result = await callWorkflowEngineRoute('confirm-upload', { asset_id: assetId });
  if (result.success && result.object_path) {
    result.canonical_url = getCanonicalMediaReference(result.object_path);
  }
  return result;
}

/**
 * Phase 4: Update Metadata & Provenance
 */
export async function updateRecommendationMediaMetadata(
  assetId: string,
  metadata: RecommendationMediaMetadata
): Promise<MediaOperationResult> {
  const payload = {
    asset_id: assetId,
    alt_text: metadata.altText || {},
    provenance_source: metadata.provenanceSource || null,
    acquisition_method: metadata.acquisitionMethod || null,
    licence_type: metadata.licenceType || null,
    attribution_required: Boolean(metadata.attributionRequired),
    attribution_text: metadata.attributionText || null,
    creator_name: metadata.creatorName || null,
    source_url: metadata.sourceUrl || null,
  };
  return callWorkflowEngineRoute('update-metadata', payload);
}

/**
 * Phase 5: Verify Media Asset
 */
export async function verifyRecommendationMediaAsset(assetId: string): Promise<MediaOperationResult> {
  return callWorkflowEngineRoute('verify', { asset_id: assetId });
}

/**
 * Phase 6: Attach Media Asset
 */
export async function attachRecommendationMediaAsset(
  assetId: string,
  workItemId?: string
): Promise<MediaOperationResult> {
  const result = await callWorkflowEngineRoute('attach', {
    asset_id: assetId,
    work_item_id: workItemId || null,
  });
  if (result.success && result.object_path) {
    result.canonical_url = getCanonicalMediaReference(result.object_path);
  }
  return result;
}

/**
 * Optional: Abandon Asset
 */
export async function abandonRecommendationMediaAsset(
  assetId: string,
  reason?: string
): Promise<MediaOperationResult> {
  return callWorkflowEngineRoute('abandon', {
    asset_id: assetId,
    abandonment_reason: reason || 'User abandoned draft upload',
  });
}
