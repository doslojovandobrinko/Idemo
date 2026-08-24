/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * WP-14C5D Canonical Recommendation Media Service
 * Manages the client-side state transitions, file validation,
 * signed storage upload, metadata registration, and attachment pipeline.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { resolveServiceAreaUuid } from './recommendationWorkflowService';

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

export const CANONICAL_ACQUISITION_METHODS = [
  'original',
  'commissioned',
  'partner_supplied',
  'licensed',
  'public_domain',
  'tourism_board',
] as const;

export type CanonicalAcquisitionMethod = typeof CANONICAL_ACQUISITION_METHODS[number];

/**
 * Normalizes input acquisition method to authoritative database enum or null.
 * Prevents non-media research descriptors (e.g. ai_grounded_research, editorial_research)
 * from being submitted to the database media RPC.
 */
export function normalizeAcquisitionMethod(method?: string | null): CanonicalAcquisitionMethod | null {
  if (!method) return null;
  const trimmed = method.trim().toLowerCase();
  if ((CANONICAL_ACQUISITION_METHODS as readonly string[]).includes(trimmed)) {
    return trimmed as CanonicalAcquisitionMethod;
  }
  return null;
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

export interface HumanMediaApprovalRecord {
  recommendationId: string;
  recommendation_id?: string;
  currentImage: string;
  previousMediaRef?: string;
  proposedImage: string;
  proposedMediaRef?: string;
  reasonForChange: string;
  reason_for_change?: string;
  changeNote?: string;
  approvingHuman: string;
  approving_human?: string;
  approvalTimestamp: string;
  approval_timestamp?: string;
  canonicalMediaRef: string;
  canonical_media_ref?: string;
}

export interface MediaIntegrityWarning {
  code: 'MEDIA_MISSING_OR_BROKEN' | 'UNAUTHORIZED_MEDIA_CHANGE_ATTEMPT' | 'FALLBACK_OVERRIDE_BLOCKED';
  recommendationId: string;
  approvedReference: string;
  attemptedReference?: string;
  message: string;
  actionBlocked: boolean;
  publicationBlocked: boolean;
}

export interface MediaAuthorityValidationResult {
  authorized: boolean;
  activeCanonicalRef: string;
  warning?: MediaIntegrityWarning;
  approvalRecord?: HumanMediaApprovalRecord | null;
}

export interface MediaIntegrityCheckResult {
  valid: boolean;
  canonicalRef: string;
  warning?: MediaIntegrityWarning;
}

export interface PublicationMediaGateResult {
  valid: boolean;
  blockedRecommendations: string[];
  errors: string[];
}

export interface AssetSyncGateResult {
  allowed: boolean;
  activeCanonicalRef: string;
  error?: string;
}

// In-memory SSOT store for human media approvals
const humanMediaApprovals = new Map<string, HumanMediaApprovalRecord>();

/**
 * Resets human media approval store (used for test isolation).
 */
export function clearHumanMediaApprovalsForTesting(): void {
  humanMediaApprovals.clear();
}

/**
 * Returns the currently human-approved primary media for a recommendation.
 */
export function getApprovedPrimaryMedia(recommendationId: string, defaultImage?: string): string {
  const approvalRecord = humanMediaApprovals.get(recommendationId);
  if (approvalRecord) {
    return approvalRecord.canonicalMediaRef || approvalRecord.proposedImage || approvalRecord.proposedMediaRef || '';
  }
  if (recommendationId === '1' || recommendationId === 'rec-uvac-1') {
    return '/src/assets/images/uvac_meanders_1778841048759.png';
  }
  return defaultImage || '';
}

/**
 * Registers an explicit human approval action for a media change in IDEMO Studio.
 */
export function approveMediaChangeSecure(rawRecord: Omit<HumanMediaApprovalRecord, 'canonicalMediaRef'> & { canonicalMediaRef?: string; [key: string]: any }): { success: boolean; record: HumanMediaApprovalRecord } {
  const recId = rawRecord.recommendationId || rawRecord.recommendation_id;
  const currentImg = rawRecord.currentImage || rawRecord.previousMediaRef || rawRecord.previous_media_ref || '';
  const proposedImg = rawRecord.proposedImage || rawRecord.proposedMediaRef || rawRecord.proposed_media_ref || '';
  const approvingHuman = rawRecord.approvingHuman || rawRecord.approving_human || '';
  const approvalTimestamp = rawRecord.approvalTimestamp || rawRecord.approval_timestamp || new Date().toISOString();
  const reason = rawRecord.reasonForChange || rawRecord.reason_for_change || rawRecord.changeNote || 'Explicit human media approval';

  if (!recId || !proposedImg || !approvingHuman || !approvalTimestamp) {
    throw new Error('HUMAN_MEDIA_APPROVAL_INVALID: Missing required approval metadata (recommendationId, proposedImage, approvingHuman, approvalTimestamp).');
  }

  const canonicalRef = rawRecord.canonicalMediaRef || rawRecord.canonical_media_ref || getCanonicalMediaReference(proposedImg) || proposedImg;

  const fullRecord: HumanMediaApprovalRecord = {
    recommendationId: recId,
    recommendation_id: recId,
    currentImage: currentImg,
    previousMediaRef: currentImg,
    proposedImage: proposedImg,
    proposedMediaRef: proposedImg,
    reasonForChange: reason,
    reason_for_change: reason,
    changeNote: reason,
    approvingHuman: approvingHuman,
    approving_human: approvingHuman,
    approvalTimestamp: approvalTimestamp,
    approval_timestamp: approvalTimestamp,
    canonicalMediaRef: canonicalRef,
    canonical_media_ref: canonicalRef,
  };

  humanMediaApprovals.set(recId, fullRecord);
  return { success: true, record: fullRecord };
}

/**
 * Validates whether a media change or substitution attempt has explicit human approval authority.
 * Prevents AI models, automated scripts, or fallbacks from modifying approved canonical media.
 */
export function validateMediaChangeAuthority(
  recommendationId: string,
  currentApprovedRef: string | null | undefined,
  proposedRef: string,
  approvalRecord?: HumanMediaApprovalRecord | null
): MediaAuthorityValidationResult {
  const activeApproved = currentApprovedRef || getApprovedPrimaryMedia(recommendationId);

  // If no current approved media exists or proposed matches current, no change attempt
  if (!activeApproved || activeApproved.trim() === '' || proposedRef === activeApproved) {
    return {
      authorized: true,
      activeCanonicalRef: proposedRef || activeApproved || '',
      approvalRecord: approvalRecord || null,
    };
  }

  // A media change is requested on an existing approved media reference.
  // Check for explicit human approval record (passed in or registered in SSOT store)
  const existingRecord = approvalRecord || humanMediaApprovals.get(recommendationId);

  const isValidHumanApproval = Boolean(
    existingRecord &&
    existingRecord.recommendationId === recommendationId &&
    existingRecord.approvingHuman &&
    existingRecord.approvingHuman.trim().length > 0 &&
    existingRecord.approvalTimestamp &&
    (existingRecord.proposedImage === proposedRef || existingRecord.proposedMediaRef === proposedRef || existingRecord.canonicalMediaRef === proposedRef)
  );

  if (!isValidHumanApproval) {
    return {
      authorized: false,
      activeCanonicalRef: activeApproved, // CANONICAL IMMUTABILITY: Preserve approved reference
      warning: {
        code: 'UNAUTHORIZED_MEDIA_CHANGE_ATTEMPT',
        recommendationId,
        approvedReference: activeApproved,
        attemptedReference: proposedRef,
        message: `UNAUTHORIZED_MEDIA_CHANGE: Image modification from "${activeApproved}" to "${proposedRef}" rejected. No explicit human approval record found for recommendation "${recommendationId}". Automated media changes are strictly prohibited under IDEMO Governance.`,
        actionBlocked: true,
        publicationBlocked: true,
      },
    };
  }

  return {
    authorized: true,
    activeCanonicalRef: existingRecord?.canonicalMediaRef || proposedRef,
    approvalRecord: existingRecord,
  };
}

/**
 * Validation Gate 4: Validation gate before publication / package generation.
 * If canonical primary media differs from last human-approved media mapping, publication is BLOCKED.
 */
export function validatePublicationMediaGate(
  recommendations: Array<{ id: string; image?: string; dbId?: string }>
): PublicationMediaGateResult {
  const blockedRecommendations: string[] = [];
  const errors: string[] = [];

  for (const rec of recommendations) {
    if (!rec || !rec.id) continue;
    const currentApproved = getApprovedPrimaryMedia(rec.id, rec.image);
    const candidateImage = rec.image || '';

    if (candidateImage && currentApproved && candidateImage !== currentApproved) {
      const authorityRes = validateMediaChangeAuthority(rec.id, currentApproved, candidateImage);
      if (!authorityRes.authorized) {
        blockedRecommendations.push(rec.id);
        errors.push(
          `PUBLICATION_BLOCKED: Primary media drift detected on recommendation "${rec.id}". Attempted image "${candidateImage}" differs from approved canonical image "${currentApproved}" without an explicit human approval record.`
        );
      }
    }
  }

  return {
    valid: blockedRecommendations.length === 0,
    blockedRecommendations,
    errors,
  };
}

/**
 * Validation Gate 5: Validation gate for static/public asset synchronization.
 * Copying or replacing a visitor-visible recommendation asset is allowed ONLY when its reference/hash
 * matches the currently human-approved media mapping.
 */
export function validateAssetSyncGate(
  recommendationId: string,
  attemptedAssetPath: string,
  attemptedAssetHash?: string
): AssetSyncGateResult {
  const approvedRef = getApprovedPrimaryMedia(recommendationId);

  if (!approvedRef || attemptedAssetPath === approvedRef || attemptedAssetPath.includes(approvedRef) || approvedRef.includes(attemptedAssetPath)) {
    return {
      allowed: true,
      activeCanonicalRef: approvedRef || attemptedAssetPath,
    };
  }

  const authorityCheck = validateMediaChangeAuthority(recommendationId, approvedRef, attemptedAssetPath);
  if (!authorityCheck.authorized) {
    return {
      allowed: false,
      activeCanonicalRef: approvedRef,
      error: `ASSET_SYNC_BLOCKED: Asset synchronization for recommendation "${recommendationId}" attempted path "${attemptedAssetPath}" which conflicts with human-approved canonical asset "${approvedRef}". Sync blocked under IDEMO Governance.`,
    };
  }

  return {
    allowed: true,
    activeCanonicalRef: authorityCheck.activeCanonicalRef,
  };
}

/**
 * Fail-Safe Rule: Checks whether an approved canonical media asset is available/valid.
 * If broken/missing/unavailable, preserves the approved media reference, surfaces a warning, and blocks publication.
 * Prohibits silent fallback substitution.
 */
export function checkCanonicalMediaIntegrity(
  recommendationId: string,
  approvedRef: string,
  isAssetAvailable: boolean
): MediaIntegrityCheckResult {
  if (isAssetAvailable) {
    return {
      valid: true,
      canonicalRef: approvedRef,
    };
  }

  // Asset is missing or broken
  return {
    valid: false,
    canonicalRef: approvedRef, // FAIL-SAFE RULE 1: Preserve approved media reference
    warning: {
      code: 'MEDIA_MISSING_OR_BROKEN',
      recommendationId,
      approvedReference: approvedRef,
      message: `MEDIA_INTEGRITY_WARNING: Approved canonical media "${approvedRef}" for recommendation "${recommendationId}" is unavailable or unresolvable. Silent fallback substitution is strictly prohibited by IDEMO Governance. Publication is blocked until human review and approval.`,
      actionBlocked: true, // FAIL-SAFE RULE 3: block automated action
      publicationBlocked: true, // FAIL-SAFE RULE 3: block publication
    },
  };
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
  const destUuid = await resolveServiceAreaUuid(destinationId);
  if (!destUuid) {
    return {
      success: false,
      error: 'CANONICAL_SERVICE_AREA_UNRESOLVED',
      message: 'Canonical service area UUID could not be resolved.',
    };
  }

  return callWorkflowEngineRoute('/recommendations/reserve-draft', {
    destination_id: destUuid,
    idempotency_key: idempotencyKey || `reserve_${destUuid}`,
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    !params.reserved_recommendation_id ||
    typeof params.reserved_recommendation_id !== 'string' ||
    !params.reserved_recommendation_id.trim() ||
    !UUID_REGEX.test(params.reserved_recommendation_id.trim())
  ) {
    return {
      success: false,
      error: 'INVALID_RESERVATION_ID',
      message: 'reserved_recommendation_id must be a valid UUID',
    };
  }

  let destUuid = params.destination_id;
  if (destUuid) {
    const resolved = await resolveServiceAreaUuid(destUuid);
    if (!resolved) {
      return {
        success: false,
        error: 'CANONICAL_SERVICE_AREA_UNRESOLVED',
        message: 'Canonical service area UUID could not be resolved.',
      };
    }
    destUuid = resolved;
  }

  const updatedParams = { ...params, destination_id: destUuid };
  const result = await callWorkflowEngineRoute('authorize-upload', updatedParams);
  if (!result.success) {
    return result;
  }

  // Normalize paths for consistent comparison
  const normalizePath = (p?: string) => (p ? p.replace(/^\/+/, '').replace(/^recommendation-media\//, '') : '');
  const cleanPath = normalizePath(result.path);
  const cleanObjectPath = normalizePath(result.object_path);
  const objectPath = cleanObjectPath || cleanPath;

  // Fail-closed validation of server authorization response
  if (
    !result.bucket ||
    result.bucket !== 'recommendation-media' ||
    !objectPath ||
    !result.asset_id ||
    !UUID_REGEX.test(result.asset_id) ||
    !result.token ||
    (cleanPath && cleanObjectPath && cleanPath !== cleanObjectPath)
  ) {
    const missingFields: string[] = [];
    if (!result.bucket || result.bucket !== 'recommendation-media') missingFields.push('valid bucket (recommendation-media)');
    if (!objectPath) missingFields.push('object_path');
    if (!result.asset_id || !UUID_REGEX.test(result.asset_id)) missingFields.push('valid UUID asset_id');
    if (!result.token) missingFields.push('storage upload token');
    if (cleanPath && cleanObjectPath && cleanPath !== cleanObjectPath) missingFields.push('matching path/object_path');

    return {
      success: false,
      error: 'MEDIA_AUTHORIZATION_INVALID',
      message: `Server authorization payload validation failed: [${missingFields.join(', ')}].`,
    };
  }

  if (result.expires_at) {
    let dateStr = String(result.expires_at).trim();
    if (!dateStr.includes('T') && dateStr.includes(' ')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    } else if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr + 'Z';
    }
    const expiryTime = new Date(dateStr).getTime();
    if (isNaN(expiryTime) || expiryTime <= Date.now()) {
      return {
        success: false,
        error: 'MEDIA_AUTHORIZATION_INVALID',
        message: `Upload authorization token has expired (expires_at: ${result.expires_at}).`,
      };
    }
  }

  if (objectPath && !result.canonical_url) {
    result.canonical_url = getCanonicalMediaReference(objectPath);
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
    acquisition_method: normalizeAcquisitionMethod(metadata.acquisitionMethod),
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

// Re-export media resolution authority from assetHelper (SSOT)
export { resolveMediaDisplayUrl, invalidateMediaCache } from '../utils/assetHelper';

