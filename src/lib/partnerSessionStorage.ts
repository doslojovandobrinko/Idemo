/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from './safeStorage';

const PARTNER_SESSION_STORAGE_KEY = 'idemo_partner_session_v1';

export interface PartnerSessionData {
  sessionToken: string;
  partnerId: string;
  publicCode: string;
  name: string;
  mustChangePin?: boolean;
  expiresAt: string;
  createdAt: string;
}

export const partnerSessionStorage = {
  getPartnerSession(): PartnerSessionData | null {
    try {
      const raw = safeStorage.getItem(PARTNER_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const data: PartnerSessionData = JSON.parse(raw);
      if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
        partnerSessionStorage.clearPartnerSession();
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  savePartnerSession(session: PartnerSessionData): void {
    try {
      safeStorage.setItem(PARTNER_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn('[IDEMO Partner Session] Failed to save partner session:', err);
    }
  },

  clearPartnerSession(): void {
    safeStorage.removeItem(PARTNER_SESSION_STORAGE_KEY);
  },

  hasActiveSession(): boolean {
    return partnerSessionStorage.getPartnerSession() !== null;
  },
};
