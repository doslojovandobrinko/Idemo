/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from './safeStorage';
import { partnerSessionStorage } from './partnerSessionStorage';
import { fetchPartnerOpportunities } from './partnerService';

const PARTNER_SEEN_INQUIRIES_KEY = 'idemo_partner_seen_inquiries_v1';
const PARTNER_SEEN_MESSAGES_KEY = 'idemo_partner_seen_messages_v1';

export function getPartnerSeenInquiryIds(): string[] {
  try {
    const raw = safeStorage.getItem(PARTNER_SEEN_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPartnerInquiriesAsSeen(inquiryIds: string[]): void {
  try {
    const existing = new Set(getPartnerSeenInquiryIds());
    inquiryIds.forEach(id => existing.add(id));
    safeStorage.setItem(PARTNER_SEEN_INQUIRIES_KEY, JSON.stringify(Array.from(existing)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('idemo_partner_badge_change'));
    }
  } catch (err) {
    console.debug('[IDEMO Partner Badge] Failed to save seen inquiries:', err);
  }
}

export function getPartnerSeenMessageCount(partnerId: string): number {
  try {
    const raw = safeStorage.getItem(`${PARTNER_SEEN_MESSAGES_KEY}_${partnerId}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function markPartnerMessagesAsSeen(partnerId: string, currentCount: number): void {
  try {
    safeStorage.setItem(`${PARTNER_SEEN_MESSAGES_KEY}_${partnerId}`, String(currentCount));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('idemo_partner_badge_change'));
    }
  } catch (err) {
    console.debug('[IDEMO Partner Badge] Failed to mark messages seen:', err);
  }
}

/**
 * Check if the currently authenticated partner has any unseen opportunities or inquiries
 */
export function checkPartnerHasUnseenInquiries(activeInquiryIds: string[]): boolean {
  if (!partnerSessionStorage.hasActiveSession() || activeInquiryIds.length === 0) {
    return false;
  }
  const seen = new Set(getPartnerSeenInquiryIds());
  return activeInquiryIds.some(id => !seen.has(id));
}

/**
 * Mark all active inquiries for the currently authenticated partner as seen
 */
export function markAllActivePartnerInquiriesSeen(): void {
  try {
    const session = partnerSessionStorage.getPartnerSession();
    if (!session || !session.partnerId) return;
    const rawInq = safeStorage.getItem('idemo_portal_inquiries');
    if (!rawInq) return;
    const inqs = JSON.parse(rawInq);
    const partnerIdLower = session.partnerId.toLowerCase();
    const codeLower = (session.publicCode || '').toLowerCase();
    const activeIds: string[] = [];
    for (const inq of inqs) {
      const pId = (inq.partnerId || '').toLowerCase();
      if (pId === partnerIdLower || (codeLower && pId === codeLower)) {
        const id = inq.id || inq.inquiryId || inq.local_queue_id;
        if (id) activeIds.push(id);
      }
    }
    if (activeIds.length > 0) {
      markPartnerInquiriesAsSeen(activeIds);
    }
  } catch (err) {
    console.debug('[IDEMO Partner Badge] markAllActivePartnerInquiriesSeen error:', err);
  }
}

/**
 * Background inquiry synchronization for authenticated partners
 */
export async function refreshPartnerOpportunitiesBackground(): Promise<boolean> {
  try {
    if (!partnerSessionStorage.hasActiveSession()) {
      return false;
    }
    const session = partnerSessionStorage.getPartnerSession();
    if (!session || !session.partnerId) return false;

    const [newOppsRes, activeOppsRes] = await Promise.all([
      fetchPartnerOpportunities('new'),
      fetchPartnerOpportunities('active'),
    ]);

    const combined: any[] = [];
    const seen = new Set<string>();
    if (newOppsRes.success && newOppsRes.opportunities) {
      for (const o of newOppsRes.opportunities) {
        const k = o.match_id || o.inquiry_id;
        if (!seen.has(k)) { seen.add(k); combined.push(o); }
      }
    }
    if (activeOppsRes.success && activeOppsRes.opportunities) {
      for (const o of activeOppsRes.opportunities) {
        const k = o.match_id || o.inquiry_id;
        if (!seen.has(k)) { seen.add(k); combined.push(o); }
      }
    }

    if (combined.length > 0) {
      const partnerIdLower = session.partnerId.toLowerCase();
      const rawInq = safeStorage.getItem('idemo_portal_inquiries');
      const existingInqs: any[] = rawInq ? JSON.parse(rawInq) : [];
      const existingMap = new Map<string, any>();
      existingInqs.forEach(inq => {
        const key = inq.id || inq.inquiryId || inq.local_queue_id || inq.match_id;
        if (key) existingMap.set(key, inq);
      });

      let changed = false;
      for (const opp of combined) {
        const key = opp.match_id || opp.inquiry_id;
        if (!key) continue;
        if (!existingMap.has(key)) {
          existingMap.set(key, {
            id: key,
            partnerId: partnerIdLower,
            matchStatus: opp.match_status || 'dispatched',
            status: opp.inquiry_status || 'Active',
            visitorName: opp.visitor_contact?.visitor_name || 'Verified Traveler',
            query: opp.visitor_notes || 'Traveler requested direct partner assistance via IDEMO dispatch.',
            createdAt: opp.created_at || new Date().toISOString(),
            requestedStartAt: opp.requested_start_at,
            requestedEndAt: opp.requested_end_at,
          });
          changed = true;
        }
      }

      if (changed) {
        safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(Array.from(existingMap.values())));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('idemo_partner_badge_change'));
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.debug('[IDEMO Partner Badge] Background sync error:', err);
    return false;
  }
}

/**
 * Check whether any unseen inquiries or messages exist for the current active partner session
 */
export function checkAnyPartnerUnseenBadge(): boolean {
  try {
    const session = partnerSessionStorage.getPartnerSession();
    if (!session || !session.partnerId) return false;

    // 1. Check partner inquiries
    const rawInq = safeStorage.getItem('idemo_portal_inquiries');
    if (rawInq) {
      const inqs = JSON.parse(rawInq);
      const partnerIdLower = session.partnerId.toLowerCase();
      const codeLower = (session.publicCode || '').toLowerCase();
      const activeIds: string[] = [];

      for (const inq of inqs) {
        const pId = (inq.partnerId || '').toLowerCase();
        if (pId === partnerIdLower || (codeLower && pId === codeLower)) {
          const isCounter = inq.matchStatus === 'counter_by_visitor';
          const isClosed = inq.status === 'Completed' || inq.status === 'Declined' || inq.status === 'closed';
          if (isCounter || !isClosed) {
            const id = inq.id || inq.inquiryId || inq.local_queue_id;
            if (id) activeIds.push(id);
          }
        }
      }

      if (checkPartnerHasUnseenInquiries(activeIds)) {
        return true;
      }
    }

    // 2. Check partner messages
    const rawMessages = safeStorage.getItem('idemo_partner_portal_messages_v1');
    if (rawMessages) {
      const threads = JSON.parse(rawMessages);
      const currentMessages = threads[session.partnerId] || [];
      const seenCount = getPartnerSeenMessageCount(session.partnerId);
      if (currentMessages.length > seenCount) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

