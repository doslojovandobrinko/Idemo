/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InquiryRecordV2 } from "../types";
import { safeStorage } from "./safeStorage";

const STORAGE_KEY_V2 = "idemo_inquiries_v2";
const STORAGE_KEY_V1 = "idemo_inquiries_v1";

export function getAllInquiriesV2(): InquiryRecordV2[] {
  try {
    const rawV2 = safeStorage.getItem(STORAGE_KEY_V2);
    let inquiriesV2: InquiryRecordV2[] = rawV2 ? JSON.parse(rawV2) : [];

    // Perform non-destructive migration from V1 if needed
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
            (i) =>
              i.recommendation_id === recId ||
              i.public_reference_code === v1Item.referenceCode,
          );

          if (!exists) {
            const migratedRecord: InquiryRecordV2 = {
              local_queue_id: `legacy_${recId}_${Date.now()}`,
              recommendation_id: recId,
              recommendation_title: `Recommendation ${recId}`,
              visitor_name: "Visitor",
              visitor_notes: v1Item.notes || "",
              requested_start_at: v1Item.timestamp || new Date().toISOString(),
              requested_end_at: v1Item.timestamp || new Date().toISOString(),
              preferred_date: "",
              preferred_time: v1Item.preferredTime || "",
              status: "submitted",
              public_reference_code:
                v1Item.referenceCode || `IDEMO-LEGACY-${recId}`,
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
        console.warn(
          "Non-destructive V1 migration encountered malformed V1 data:",
          e,
        );
      }
    }

    return inquiriesV2;
  } catch (err) {
    console.error("Failed to read inquiry storage V2:", err);
    return [];
  }
}

export function getInquiryByRecommendationId(
  recId: string,
): InquiryRecordV2 | null {
  const all = getAllInquiriesV2();
  // Return the most recent inquiry for this recommendation
  const matches = all.filter(
    (i) => i.recommendation_id === recId || i.recommendation_db_id === recId,
  );
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

export function saveInquiryRecordV2(record: InquiryRecordV2): void {
  try {
    const all = getAllInquiriesV2();
    const existingIndex = all.findIndex(
      (i) => i.local_queue_id === record.local_queue_id,
    );

    // Sanitize to guarantee raw_recovery_token is NEVER stored
    const sanitizedRecord: InquiryRecordV2 = { ...record };

    if (existingIndex >= 0) {
      all[existingIndex] = sanitizedRecord;
    } else {
      all.push(sanitizedRecord);
    }

    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save inquiry record to V2 storage:", err);
  }
}

export function clearInquiryHistory(): void {
  try {
    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify([]));
  } catch (err) {
    console.error("Failed to clear inquiry history:", err);
  }
}

export function removeInquiryRecordV2(id: string): void {
  try {
    const all = getAllInquiriesV2();
    const filtered = all.filter(
      (i) =>
        i.local_queue_id !== id &&
        i.server_inquiry_id !== id &&
        i.recommendation_id !== id,
    );
    safeStorage.setItem(STORAGE_KEY_V2, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to remove inquiry record:", err);
  }
}

/* ============================================================================
 * ISOLATED VISITOR CREDENTIAL STORE (Hardened Mode A)
 * Storage Key: idemo_visitor_credentials_v1
 * Structure: Record<inquiry_id, raw_recovery_token>
 * Completely isolated from InquiryRecordV2 / idemo_inquiries_v2
 * ============================================================================ */

const VISITOR_CREDENTIALS_KEY = "idemo_visitor_credentials_v1";

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
    console.error("Failed to save visitor credential:", err);
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
    console.error("Failed to read visitor credential:", err);
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
    console.error("Failed to remove visitor credential:", err);
  }
}

export function clearExpiredVisitorCredentials(
  activeInquiryIds?: string[],
): void {
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
    console.error("Failed to clear expired visitor credentials:", err);
  }
}
