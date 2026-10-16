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
    inquiryIds.forEach(id => {
      if (id) existing.add(id);
    });
    safeStorage.setItem(PARTNER_SEEN_INQUIRIES_KEY, JSON.stringify(Array.from(existing)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('idemo_partner_badge_change'));
    }
  } catch (err) {
    console.debug('[IDEMO Partner Badge] Failed to save seen inquiries:', err);
  }
}

export function unmarkPartnerInquiriesAsSeen(inquiryIds: string[]): void {
  try {
    const existing = new Set(getPartnerSeenInquiryIds());
    inquiryIds.forEach(id => {
      if (id) {
        existing.delete(id);
        existing.delete(`confirmed_${id}`);
      }
    });
    safeStorage.setItem(PARTNER_SEEN_INQUIRIES_KEY, JSON.stringify(Array.from(existing)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('idemo_partner_badge_change'));
    }
  } catch (err) {
    console.debug('[IDEMO Partner Badge] Failed to unmark seen inquiries:', err);
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
 * Helper to compute the badge tracking key for an inquiry (distinguishes initial dispatch from visitor confirmation)
 */
export function getPartnerInquiryBadgeKey(inq: any): string {
  const baseId = inq?.id || inq?.inquiryId || inq?.local_queue_id || inq?.matchId || '';
  if (!baseId) return '';
  const isConfirmed = Boolean(
    inq?.visitorConfirmed === true ||
    inq?.status === 'Confirmed by Traveler' ||
    inq?.status === 'Arrangement Confirmed' ||
    inq?.status === 'selected' ||
    inq?.matchStatus === 'selected' ||
    inq?.rawMatchStatus === 'selected' ||
    inq?.inquiryStatus === 'confirmed'
  );
  return isConfirmed ? `confirmed_${baseId}` : String(baseId);
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

function getAssignedRecIdsForPartner(partnerId?: string | null): Set<string> {
  const recIds = new Set<string>();
  if (!partnerId) return recIds;
  if (partnerId.toLowerCase() === '556035b0-8926-42c9-8cb9-2bb83b67c795') {
    recIds.add('12');
    recIds.add('5c4826be-cca5-4128-a546-c6e045f594a2');
  }
  try {
    const raw = safeStorage.getItem(`idemo_partner_assigned_recs_${partnerId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.recId) recIds.add(String(item.recId));
          if (typeof item === 'string') recIds.add(item);
        }
      }
    }
  } catch {}
  return recIds;
}

function getClearedPortalInquiryIds(): Set<string> {
  try {
    const raw = safeStorage.getItem('idemo_cleared_portal_inquiry_ids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set();
}

/**
 * Mark all active inquiries for the currently authenticated partner as seen
 */
export function markAllActivePartnerInquiriesSeen(): void {
  try {
    const session = partnerSessionStorage.getPartnerSession();
    if (!session || !session.partnerId) return;
    const partnerIdLower = session.partnerId.toLowerCase();
    const codeLower = (session.publicCode || '').toLowerCase();
    const nameLower = (session.name || '').toLowerCase();
    const assignedRecIds = getAssignedRecIdsForPartner(session.partnerId);
    const activeIds: string[] = [];

    const rawInq = safeStorage.getItem('idemo_portal_inquiries');
    if (rawInq) {
      const inqs = JSON.parse(rawInq);
      if (Array.isArray(inqs)) {
        for (const inq of inqs) {
          const pId = (inq.partnerId || '').toLowerCase();
          const pName = (inq.partnerName || '').toLowerCase();
          const recMatch = inq.recId && assignedRecIds.has(String(inq.recId));
          if (pId === partnerIdLower || (codeLower && pId === codeLower) || (nameLower && pName === nameLower) || recMatch) {
            const id = inq.id || inq.inquiryId || inq.local_queue_id;
            const isConfirmed = Boolean(
              inq.visitorConfirmed === true ||
              inq.status === 'Confirmed by Traveler' ||
              inq.status === 'Arrangement Confirmed' ||
              inq.status === 'selected' ||
              inq.matchStatus === 'selected' ||
              inq.rawMatchStatus === 'selected' ||
              inq.inquiryStatus === 'confirmed'
            );
            if (id) {
              activeIds.push(id);
              // Only mark confirmed_<id> as seen if the Partner has explicitly acknowledged the confirmation
              if (isConfirmed && inq.partnerAcknowledgedConfirmation) {
                const badgeKey = getPartnerInquiryBadgeKey(inq);
                if (badgeKey) activeIds.push(badgeKey);
              }
            }
          }
        }
      }
    }

    const rawV2 = safeStorage.getItem('idemo_inquiries_v2');
    if (rawV2) {
      const v2List = JSON.parse(rawV2);
      if (Array.isArray(v2List)) {
        for (const vInq of v2List) {
          const recId = String(vInq.recommendation_id || '');
          const dbId = String(vInq.recommendation_db_id || '');
          if (assignedRecIds.has(recId) || (dbId && assignedRecIds.has(dbId))) {
            const vId = vInq.server_inquiry_id || vInq.local_queue_id;
            if (vId) {
              activeIds.push(vId);
              if (vInq.local_queue_id) activeIds.push(vInq.local_queue_id);
            }
          }
        }
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
        const key = inq.id || inq.inquiryId || inq.local_queue_id || inq.match_id || inq.matchId;
        if (key) existingMap.set(key, inq);
      });

      let changed = false;
      for (const opp of combined) {
        const key = opp.match_id || opp.inquiry_id;
        if (!key) continue;
        const isConfirmedOnServer = opp.match_status === 'selected' || opp.inquiry_status === 'confirmed';
        const existing = existingMap.get(key) || existingInqs.find(i => i.inquiryId === opp.inquiry_id || i.matchId === opp.match_id);

        if (!existing) {
          existingMap.set(key, {
            id: key,
            matchId: opp.match_id,
            inquiryId: opp.inquiry_id,
            recId: opp.recommendation_id,
            recTitle: opp.recommendation_title,
            partnerId: partnerIdLower,
            matchStatus: opp.match_status || 'dispatched',
            rawMatchStatus: opp.match_status || 'dispatched',
            inquiryStatus: opp.inquiry_status || 'Active',
            status: isConfirmedOnServer ? 'Confirmed by Traveler' : (opp.inquiry_status || 'Active'),
            visitorConfirmed: isConfirmedOnServer,
            visitorConfirmedAt: isConfirmedOnServer ? Date.now() : undefined,
            visitorName: opp.visitor_contact?.visitor_name || 'Verified Traveler',
            query: opp.visitor_notes || 'Traveler requested direct partner assistance via IDEMO dispatch.',
            createdAt: opp.created_at || new Date().toISOString(),
            requestedStartAt: opp.requested_start_at,
            requestedEndAt: opp.requested_end_at,
          });
          changed = true;
        } else {
          const wasConfirmed = Boolean(
            existing.visitorConfirmed === true ||
            existing.status === 'Confirmed by Traveler' ||
            existing.matchStatus === 'selected' ||
            existing.inquiryStatus === 'confirmed'
          );
          if (isConfirmedOnServer && !wasConfirmed) {
            existing.status = 'Confirmed by Traveler';
            existing.matchStatus = 'selected';
            existing.rawMatchStatus = 'selected';
            existing.inquiryStatus = 'confirmed';
            existing.visitorConfirmed = true;
            existing.visitorConfirmedAt = Date.now();
            changed = true;
          } else if (opp.match_status && opp.match_status !== existing.matchStatus && !wasConfirmed) {
            existing.matchStatus = opp.match_status;
            existing.rawMatchStatus = opp.match_status;
            existing.inquiryStatus = opp.inquiry_status || existing.inquiryStatus;
            changed = true;
          }
        }
      }

      if (changed) {
        safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(Array.from(existingMap.values())));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('idemo_partner_badge_change'));
          window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
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
 * or newly dispatched visitor inquiries awaiting partner review.
 */
export function checkAnyPartnerUnseenBadge(): boolean {
  try {
    const session = partnerSessionStorage.getPartnerSession();
    const hasSession = Boolean(session && session.partnerId);
    const partnerIdLower = hasSession ? session!.partnerId.toLowerCase() : '';
    const codeLower = hasSession ? (session!.publicCode || '').toLowerCase() : '';
    const nameLower = hasSession ? (session!.name || '').toLowerCase() : '';
    const assignedRecIds = hasSession ? getAssignedRecIdsForPartner(session!.partnerId) : new Set<string>();
    const clearedIds = getClearedPortalInquiryIds();
    const seen = new Set(getPartnerSeenInquiryIds());
    const activeBadgeKeys: string[] = [];

    // 1. Check partner inquiries in idemo_portal_inquiries (including unseen visitor confirmations)
    const rawInq = safeStorage.getItem('idemo_portal_inquiries');
    if (rawInq) {
      const inqs = JSON.parse(rawInq);
      if (Array.isArray(inqs)) {
        for (const inq of inqs) {
          const baseId = inq.id || inq.inquiryId || inq.local_queue_id;
          if (!baseId || ['INQ-2001', 'INQ-2002', 'INQ-2003', 'INQ-2004'].includes(String(baseId))) continue;
          if (clearedIds.has(String(baseId))) continue;

          const pId = (inq.partnerId || '').toLowerCase();
          const pName = (inq.partnerName || '').toLowerCase();
          if (!hasSession && (pId === 'uno1' || pId === 'uno2')) continue;

          const matchesPartner = !hasSession
            ? true
            : (
                pId === partnerIdLower ||
                (codeLower && pId === codeLower) ||
                (nameLower && pName === nameLower) ||
                Boolean(inq.recId && assignedRecIds.has(String(inq.recId)))
              );

          if (matchesPartner) {
            const isConfirmedByVisitor = Boolean(
              inq.visitorConfirmed === true ||
              inq.status === 'Confirmed by Traveler' ||
              inq.status === 'Arrangement Confirmed' ||
              inq.status === 'selected' ||
              inq.matchStatus === 'selected' ||
              inq.rawMatchStatus === 'selected' ||
              inq.inquiryStatus === 'confirmed'
            );
            const isCounter = inq.matchStatus === 'counter_by_visitor';
            const isClosed =
              inq.status === 'Completed' ||
              inq.status === 'Answered / Completed' ||
              inq.status === 'Declined' ||
              inq.status === 'closed' ||
              inq.status === 'canceled' ||
              inq.status === 'Released' ||
              inq.matchStatus === 'not_selected' ||
              inq.matchStatus === 'declined';
            const isAcceptedPendingVisitor =
              !isConfirmedByVisitor &&
              (inq.status === 'Locked / Accepted' ||
                inq.status === 'Alternative Proposed' ||
                inq.status === 'accepted' ||
                inq.status === 'responded' ||
                inq.matchStatus === 'responded');

            if (isConfirmedByVisitor && !inq.partnerAcknowledgedConfirmation) {
              const badgeKey = getPartnerInquiryBadgeKey(inq);
              if (badgeKey) activeBadgeKeys.push(badgeKey);
            } else if (isCounter || (!isClosed && !isAcceptedPendingVisitor && !isConfirmedByVisitor)) {
              activeBadgeKeys.push(String(baseId));
            }
          }
        }
      }
    }

    // 2. Also check idemo_inquiries_v2 so inquiries created for assigned recommendations (e.g. Banjska Stena #12)
    // trigger the Partner Red Dot even if idemo_portal_inquiries was reset by a server sync
    const rawV2 = safeStorage.getItem('idemo_inquiries_v2');
    if (rawV2) {
      const v2List = JSON.parse(rawV2);
      if (Array.isArray(v2List)) {
        for (const vInq of v2List) {
          const vId = vInq.server_inquiry_id || vInq.local_queue_id;
          if (!vId || clearedIds.has(String(vId))) continue;
          if (vInq.status === 'failed' || vInq.status === 'canceled' || vInq.status === 'closed') continue;

          const recId = String(vInq.recommendation_id || '');
          const dbId = String(vInq.recommendation_db_id || '');
          const matchesRec = !hasSession
            ? true
            : (assignedRecIds.has(recId) || (dbId && assignedRecIds.has(dbId)));

          if (matchesRec && !vInq.cached_proposal) {
            activeBadgeKeys.push(String(vId));
          }
        }
      }
    }

    if (activeBadgeKeys.some(id => !seen.has(id))) {
      return true;
    }

    // 3. Check partner messages when session is active
    if (hasSession) {
      const rawMessages = safeStorage.getItem('idemo_partner_portal_messages_v1');
      if (rawMessages) {
        const threads = JSON.parse(rawMessages);
        const currentMessages = threads[session!.partnerId] || [];
        const seenCount = getPartnerSeenMessageCount(session!.partnerId);
        if (currentMessages.length > seenCount) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}


