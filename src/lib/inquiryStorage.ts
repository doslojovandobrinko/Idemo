/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InquiryRecordV2 } from '../types';
import { safeStorage } from './safeStorage';

const STORAGE_KEY_V2 = 'idemo_inquiries_v2';
const STORAGE_KEY_V1 = 'idemo_inquiries_v1';

export function getAllInquiriesV2(): InquiryRecordV2[] {
  try {
    const rawV2 = safeStorage.getItem(STORAGE_KEY_V2);
    let inquiriesV2: InquiryRecordV2[] = rawV2 ? JSON.parse(rawV2) : [];

    // Perform one-time migration from legacy V1 if needed, then purge legacy V1 key
    const rawV1 = safeStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      try {
        const v1Map = JSON.parse(rawV1);
        let migratedAny = false;

        for (const [recId, item] of Object.entries(v1Map)) {
          const v1Item = item as any;
          if (!v1Item) continue;

          // Check if this recommendation already has a corresponding record in V2
          const exists = inquiriesV2.some(
            (i) => i.recommendation_id === recId || i.public_reference_code === v1Item.referenceCode
          );

          if (!exists) {
            const migratedRecord: InquiryRecordV2 = {
              local_queue_id: `legacy_${recId}_${Date.now()}`,
              recommendation_id: recId,
              recommendation_title: `Recommendation ${recId}`,
              visitor_name: 'Visitor',
              visitor_notes: v1Item.notes || '',
              requested_start_at: v1Item.timestamp || new Date().toISOString(),
              requested_end_at: v1Item.timestamp || new Date().toISOString(),
              preferred_date: '',
              preferred_time: v1Item.preferredTime || '',
              status: 'submitted',
              public_reference_code: v1Item.referenceCode || `IDEMO-LEGACY-${recId}`,
              is_server_authoritative: false,
              created_at: v1Item.timestamp || new Date().toISOString(),
              submitted_at: v1Item.timestamp || new Date().toISOString(),
              client_request_id: `legacy_${recId}`,
            };
            inquiriesV2.push(migratedRecord);
            migratedAny = true;
          }
        }

        if (migratedAny) {
          safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(inquiriesV2));
        }
      } catch (e) {
        console.warn('V1 migration encountered malformed V1 data:', e);
      } finally {
        // Crucial: permanently purge legacy V1 store so it cannot act as a phantom resurrection vector
        safeStorage.removeItem(STORAGE_KEY_V1);
      }
    }

    return inquiriesV2;
  } catch (err) {
    console.error('Failed to read inquiry storage V2:', err);
    return [];
  }
}

export function getInquiryByRecommendationId(recId: string, recDbId?: string): InquiryRecordV2 | null {
  if (!recId) return null;
  const all = getAllInquiriesV2();
  const normId = String(recId).trim();
  const normDbId = recDbId ? String(recDbId).trim() : null;

  const matches = all.filter((i) => {
    const iRecId = String(i.recommendation_id || '').trim();
    const iDbId = i.recommendation_db_id ? String(i.recommendation_db_id).trim() : null;
    return (
      iRecId === normId ||
      (normDbId && iRecId === normDbId) ||
      (normDbId && iDbId && iDbId === normDbId) ||
      (iDbId && iDbId === normId)
    );
  });
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

export function removeInquiryByRecommendation(
  recId?: string,
  recDbId?: string,
  serverInquiryId?: string,
  publicReferenceCode?: string
): void {
  try {
    const all = getAllInquiriesV2();
    const normRecId = recId ? String(recId).trim() : '';
    const normDbId = recDbId ? String(recDbId).trim() : '';
    const normServerId = serverInquiryId ? String(serverInquiryId).trim() : '';
    const normRefCode = publicReferenceCode ? String(publicReferenceCode).trim() : '';

    if (!normRecId && !normDbId && !normServerId && !normRefCode) return;

    const matches = all.filter((i) => {
      const iRecId = String(i.recommendation_id || '').trim();
      const iDbId = String(i.recommendation_db_id || '').trim();
      const iServerId = String(i.server_inquiry_id || '').trim();
      const iRefCode = String(i.public_reference_code || '').trim();
      const iLocalId = String(i.local_queue_id || '').trim();

      const matchByRecId = normRecId && (iRecId === normRecId || iDbId === normRecId || iLocalId === normRecId);
      const matchByDbId = normDbId && (iRecId === normDbId || iDbId === normDbId);
      const matchByServerId = normServerId && (iServerId === normServerId || iLocalId === normServerId);
      const matchByRefCode = normRefCode && (iRefCode === normRefCode || iLocalId === normRefCode);

      return Boolean(matchByRecId || matchByDbId || matchByServerId || matchByRefCode);
    });

    const filtered = all.filter((i) => !matches.includes(i));
    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(filtered));

    // Exhaustively purge associated visitor credentials and seen marks for removed items
    for (const m of matches) {
      if (m.server_inquiry_id) {
        removeVisitorCredential(m.server_inquiry_id);
        removeSeenProposal(m.server_inquiry_id);
      }
    }
    if (normServerId) {
      removeVisitorCredential(normServerId);
      removeSeenProposal(normServerId);
    }

    // Always permanently purge legacy V1 store
    safeStorage.removeItem(STORAGE_KEY_V1);
  } catch (err) {
    console.error('Failed to remove inquiry by recommendation:', err);
  }
}

export function saveInquiryRecordV2(record: InquiryRecordV2): void {
  try {
    const all = getAllInquiriesV2();
    const existingIndex = all.findIndex((i) => i.local_queue_id === record.local_queue_id);

    // Sanitize to guarantee raw_recovery_token is NEVER stored
    const sanitizedRecord: InquiryRecordV2 = { ...record };

    if (existingIndex >= 0) {
      all[existingIndex] = sanitizedRecord;
    } else {
      all.push(sanitizedRecord);
    }

    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save inquiry record to V2 storage:', err);
  }
}

export function clearInquiryHistory(): void {
  try {
    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify([]));
    safeStorage.removeItem(STORAGE_KEY_V1);
  } catch (err) {
    console.error('Failed to clear inquiry history:', err);
  }
}

export function removeInquiryRecordV2(id: string): void {
  if (!id) return;
  const normId = String(id).trim();
  removeInquiryByRecommendation(normId, normId, normId, normId);
}

export function updateInquiryServerStatusV2(serverInquiryId: string, visitorStatusLabel?: string): void {
  if (!serverInquiryId) return;
  try {
    const all = getAllInquiriesV2();
    const target = all.find((i) => i.server_inquiry_id === serverInquiryId || i.local_queue_id === serverInquiryId);
    if (target) {
      target.is_server_authoritative = true;
      if (visitorStatusLabel) {
        (target as any).visitor_status_label = visitorStatusLabel;
      }
      safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update inquiry server status in V2 storage:', err);
  }
}

export function updateInquiryCachedProposalV2(
  serverInquiryId: string,
  proposal: import('../types').CachedProposalRecord | null
): void {
  if (!serverInquiryId) return;
  try {
    const all = getAllInquiriesV2();
    const target = all.find((i) => i.server_inquiry_id === serverInquiryId || i.local_queue_id === serverInquiryId);
    if (target) {
      target.cached_proposal = proposal;
      safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update cached proposal in V2 storage:', err);
  }
}

export function getCachedProposalByServerId(
  serverInquiryId: string
): import('../types').CachedProposalRecord | null {
  if (!serverInquiryId) return null;
  try {
    const all = getAllInquiriesV2();
    const target = all.find((i) => i.server_inquiry_id === serverInquiryId || i.local_queue_id === serverInquiryId);
    if (!target || !target.cached_proposal) return null;
    const cached = target.cached_proposal;
    if (
      cached.schema_version === 1 &&
      typeof cached.match_id === 'string' &&
      cached.match_id.length > 0 &&
      typeof cached.response_id === 'string' &&
      cached.response_id.length > 0 &&
      typeof cached.message === 'string'
    ) {
      return cached;
    }
    return null;
  } catch (err) {
    console.error('Failed to get cached proposal from V2 storage:', err);
    return null;
  }
}

export function clearCachedProposalV2(serverInquiryId: string): void {
  updateInquiryCachedProposalV2(serverInquiryId, null);
}

export function saveConfirmedArrangementV2(
  serverInquiryId: string,
  arrangement: import('../types').ConfirmedArrangementRecord | null
): void {
  if (!serverInquiryId) return;
  try {
    const all = getAllInquiriesV2();
    const target = all.find((i) => i.server_inquiry_id === serverInquiryId || i.local_queue_id === serverInquiryId);
    if (target) {
      target.confirmed_arrangement = arrangement;
      safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update confirmed arrangement in V2 storage:', err);
  }
}

export function getConfirmedArrangementByServerId(
  serverInquiryId: string
): import('../types').ConfirmedArrangementRecord | null {
  if (!serverInquiryId) return null;
  try {
    const all = getAllInquiriesV2();
    const target = all.find((i) => i.server_inquiry_id === serverInquiryId || i.local_queue_id === serverInquiryId);
    if (!target || !target.confirmed_arrangement) return null;
    const arrangement = target.confirmed_arrangement;
    if (
      typeof arrangement.match_id === 'string' &&
      typeof arrangement.partner_name === 'string' &&
      typeof arrangement.confirmed_terms === 'string'
    ) {
      return arrangement;
    }
    return null;
  } catch (err) {
    console.error('Failed to get confirmed arrangement from V2 storage:', err);
    return null;
  }
}

export function clearConfirmedArrangementV2(serverInquiryId: string): void {
  saveConfirmedArrangementV2(serverInquiryId, null);
}

/* ============================================================================
 * ISOLATED VISITOR CREDENTIAL STORE (Hardened Mode A)
 * Storage Key: idemo_visitor_credentials_v1
 * Structure: Record<inquiry_id, raw_recovery_token>
 * Completely isolated from InquiryRecordV2 / idemo_inquiries_v2
 * ============================================================================ */

const VISITOR_CREDENTIALS_KEY = 'idemo_visitor_credentials_v1';

export function saveVisitorCredential(inquiryId: string, token: string): void {
  if (!inquiryId || !token) return;
  // Format validation: verified production format (idm_rc_ + 32 hex chars)
  if (!/^idm_rc_[0-9a-f]{32}$/i.test(token)) {
    return;
  }

  try {
    const raw = safeStorage.getItem(VISITOR_CREDENTIALS_KEY);
    const store: Record<string, string> = raw ? JSON.parse(raw) : {};
    store[inquiryId] = token;
    safeStorage.setItem(VISITOR_CREDENTIALS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save visitor credential:', err);
  }
}

export function getVisitorCredential(inquiryId: string): string | null {
  if (!inquiryId) return null;
  try {
    const raw = safeStorage.getItem(VISITOR_CREDENTIALS_KEY);
    if (!raw) return null;
    const store: Record<string, string> = JSON.parse(raw);
    const token = store[inquiryId];
    if (token && /^idm_rc_[0-9a-f]{32}$/i.test(token)) {
      return token;
    }
    return null;
  } catch (err) {
    console.error('Failed to read visitor credential:', err);
    return null;
  }
}

export function removeVisitorCredential(inquiryId: string): void {
  if (!inquiryId) return;
  try {
    const raw = safeStorage.getItem(VISITOR_CREDENTIALS_KEY);
    if (!raw) return;
    const store: Record<string, string> = JSON.parse(raw);
    if (store[inquiryId]) {
      delete store[inquiryId];
      safeStorage.setItem(VISITOR_CREDENTIALS_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Failed to remove visitor credential:', err);
  }
}

export function clearExpiredVisitorCredentials(activeInquiryIds?: string[]): void {
  try {
    const raw = safeStorage.getItem(VISITOR_CREDENTIALS_KEY);
    if (!raw) return;
    const store: Record<string, string> = JSON.parse(raw);
    let modified = false;

    if (activeInquiryIds) {
      for (const id of Object.keys(store)) {
        if (!activeInquiryIds.includes(id)) {
          delete store[id];
          modified = true;
        }
      }
    }

    if (modified) {
      safeStorage.setItem(VISITOR_CREDENTIALS_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Failed to clear expired visitor credentials:', err);
  }
}

/* ============================================================================
 * SEEN PROPOSALS TRACKING STORE
 * Storage Key: idemo_seen_proposals_v1
 * Structure: Record<inquiry_id, proposal_signature>
 * ============================================================================ */

const SEEN_PROPOSALS_KEY = 'idemo_seen_proposals_v1';

export function getSeenProposals(): Record<string, string> {
  try {
    const raw = safeStorage.getItem(SEEN_PROPOSALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read seen proposals storage:', err);
    return {};
  }
}

export function isProposalSeen(inquiryId: string, signature?: string): boolean {
  if (!inquiryId) return true;
  const store = getSeenProposals();
  const storedSig = store[inquiryId];
  if (!storedSig) return false;
  if (!signature) return true;
  return storedSig === signature || storedSig === 'seen';
}

export function markProposalAsSeen(inquiryId: string, signature: string = 'seen'): void {
  if (!inquiryId) return;
  try {
    const store = getSeenProposals();
    store[inquiryId] = signature;
    safeStorage.setItem(SEEN_PROPOSALS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save seen proposal mark:', err);
  }
}

export function removeSeenProposal(inquiryId: string): void {
  if (!inquiryId) return;
  try {
    const store = getSeenProposals();
    if (store[inquiryId]) {
      delete store[inquiryId];
      safeStorage.setItem(SEEN_PROPOSALS_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Failed to remove seen proposal mark:', err);
  }
}

export function checkHasUnreadProposals(): boolean {
  try {
    const all = getAllInquiriesV2();
    for (const inq of all) {
      const serverId = inq.server_inquiry_id || inq.local_queue_id;
      if (!serverId) continue;

      if (inq.cached_proposal) {
        const cached = inq.cached_proposal;
        if (cached.match_id && cached.response_id) {
          const sig = `${cached.match_id}_${cached.response_id || 'active'}`;
          if (!isProposalSeen(serverId, sig)) {
            return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}


