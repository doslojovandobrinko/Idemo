/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { badgingService } from '../lib/badgingService';
import { 
  checkPartnerHasUnseenInquiries, 
  markPartnerInquiriesAsSeen, 
  markAllActivePartnerInquiriesSeen,
  getPartnerSeenInquiryIds,
  checkAnyPartnerUnseenBadge,
  getPartnerSeenMessageCount,
  markPartnerMessagesAsSeen
} from '../lib/partnerBadgeStorage';
import {
  getUnreadProposalsCount,
  checkHasUnreadProposals,
  markProposalAsSeen,
  saveVisitorCredential,
  removeVisitorCredential,
  getAuthenticatedVisitorInquiriesPayload
} from '../lib/inquiryStorage';
import { partnerSessionStorage } from '../lib/partnerSessionStorage';
import { safeStorage } from '../lib/safeStorage';

export async function runBadgingTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];

  // Test 1: badgingService does not crash in headless/node environments and tracks lastAppliedCount
  try {
    await badgingService.setBadge(3);
    const afterSet3 = badgingService.getLastAppliedCount();
    await badgingService.clearBadge();
    const afterClear = badgingService.getLastAppliedCount();
    const perm = await badgingService.requestNotificationPermission();
    const hasPerm = badgingService.hasNotificationPermission();
    const bridgeStatus = badgingService.getNativeWrapperBridgeStatus();
    if (afterSet3 === 3 && afterClear === 0 && bridgeStatus.nativeWrapperBridgeConfigured === false) {
      results.push('PASS: badgingService setBadge, clearBadge, count tracking, and non-speculative bridge status execute cleanly');
    } else {
      results.push(`FAIL: badgingService state mismatch (afterSet3=${afterSet3}, afterClear=${afterClear})`);
    }
  } catch (err: any) {
    results.push(`FAIL: badgingService error: ${err.message}`);
  }

  // Test 2: partner unseen inquiries detection
  safeStorage.clear();
  partnerSessionStorage.savePartnerSession({
    sessionToken: 'test_token',
    partnerId: 'UNO1',
    publicCode: 'UNO1',
    name: 'Uno Guide',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString()
  });

  const inquiryIds = ['inq_1', 'inq_2'];
  const hasUnseenBefore = checkPartnerHasUnseenInquiries(inquiryIds);
  if (hasUnseenBefore === true) {
    results.push('PASS: checkPartnerHasUnseenInquiries correctly identifies unseen inquiries');
  } else {
    results.push('FAIL: checkPartnerHasUnseenInquiries failed to identify unseen inquiries');
  }

  // Test 3: marking inquiries as seen
  markPartnerInquiriesAsSeen(inquiryIds);
  const hasUnseenAfter = checkPartnerHasUnseenInquiries(inquiryIds);
  if (hasUnseenAfter === false) {
    results.push('PASS: markPartnerInquiriesAsSeen correctly marks inquiries as seen');
  } else {
    results.push('FAIL: markPartnerInquiriesAsSeen did not clear unseen status');
  }

  // Test 4: markAllActivePartnerInquiriesSeen functionality
  safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([
    { id: 'inq_batch_1', partnerId: 'uno1', status: 'Active' },
    { id: 'inq_batch_2', partnerId: 'uno1', status: 'Active' }
  ]));
  const hasUnseenBatchBefore = checkPartnerHasUnseenInquiries(['inq_batch_1', 'inq_batch_2']);
  markAllActivePartnerInquiriesSeen();
  const hasUnseenBatchAfter = checkPartnerHasUnseenInquiries(['inq_batch_1', 'inq_batch_2']);
  if (hasUnseenBatchBefore && !hasUnseenBatchAfter) {
    results.push('PASS: markAllActivePartnerInquiriesSeen successfully cleared all active portal inquiries');
  } else {
    results.push('FAIL: markAllActivePartnerInquiriesSeen did not clear batch');
  }

  // Test 5: partner messages tracking
  const initialSeen = getPartnerSeenMessageCount('UNO1');
  markPartnerMessagesAsSeen('UNO1', 5);
  const updatedSeen = getPartnerSeenMessageCount('UNO1');
  if (initialSeen === 0 && updatedSeen === 5) {
    results.push('PASS: partner messages seen count accurately persists in safeStorage');
  } else {
    results.push(`FAIL: partner message tracking mismatch (initial: ${initialSeen}, updated: ${updatedSeen})`);
  }

  // Test 6: Visitor unread partner proposals badge progression (2 unread -> badge 2, read 1 -> badge 1, read last -> badge 0 / cleared)
  safeStorage.clear();
  const inq1Id = '11111111-1111-4111-8111-111111111111';
  const inq2Id = '22222222-2222-4222-8222-222222222222';
  safeStorage.setItem('idemo_inquiries_v2', JSON.stringify([
    {
      local_queue_id: 'loc_1',
      server_inquiry_id: inq1Id,
      recommendation_id: 'rec_1',
      recommendation_title: 'Belgrade Fortress',
      visitor_name: 'Ana',
      visitor_notes: 'Notes 1',
      requested_start_at: new Date().toISOString(),
      requested_end_at: new Date().toISOString(),
      preferred_date: '2026-10-15',
      preferred_time: '10:00',
      status: 'submitted',
      is_server_authoritative: true,
      created_at: new Date().toISOString(),
      client_request_id: 'req_1',
      cached_proposal: {
        schema_version: 1,
        match_id: 'match_1',
        response_id: 'resp_1',
        response_type: 'accept_as_requested',
        message: 'Proposal 1',
        visitor_read_at: null,
        cached_at: Date.now()
      }
    },
    {
      local_queue_id: 'loc_2',
      server_inquiry_id: inq2Id,
      recommendation_id: 'rec_2',
      recommendation_title: 'Zemun Walk',
      visitor_name: 'Ana',
      visitor_notes: 'Notes 2',
      requested_start_at: new Date().toISOString(),
      requested_end_at: new Date().toISOString(),
      preferred_date: '2026-10-16',
      preferred_time: '14:00',
      status: 'submitted',
      is_server_authoritative: true,
      created_at: new Date().toISOString(),
      client_request_id: 'req_2',
      cached_proposal: {
        schema_version: 1,
        match_id: 'match_2',
        response_id: 'resp_2',
        response_type: 'propose_alternative',
        message: 'Proposal 2',
        visitor_read_at: null,
        cached_at: Date.now()
      }
    }
  ]));

  const countStep1 = getUnreadProposalsCount();
  await badgingService.setBadge(countStep1);
  const badgeStep1 = badgingService.getLastAppliedCount();

  // Read first proposal
  markProposalAsSeen(inq1Id, 'match_1_resp_1');
  const countStep2 = getUnreadProposalsCount();
  await badgingService.setBadge(countStep2);
  const badgeStep2 = badgingService.getLastAppliedCount();

  // Read second (last) proposal via server visitor_read_at timestamp
  const rawList = JSON.parse(safeStorage.getItem('idemo_inquiries_v2') || '[]');
  rawList[1].cached_proposal.visitor_read_at = new Date().toISOString();
  safeStorage.setItem('idemo_inquiries_v2', JSON.stringify(rawList));
  const countStep3 = getUnreadProposalsCount();
  await badgingService.setBadge(countStep3);
  const badgeStep3 = badgingService.getLastAppliedCount();

  if (
    countStep1 === 2 && badgeStep1 === 2 &&
    countStep2 === 1 && badgeStep2 === 1 &&
    countStep3 === 0 && badgeStep3 === 0 && !checkHasUnreadProposals()
  ) {
    results.push('PASS: Visitor unread proposal count and badge progress 2 -> 1 -> 0 (cleared)');
  } else {
    results.push(`FAIL: Unread proposal badge progression mismatch (${countStep1}/${badgeStep1} -> ${countStep2}/${badgeStep2} -> ${countStep3}/${badgeStep3})`);
  }

  // Test 7: Recipient credential isolation and logout/account-switch unbinding
  safeStorage.clear();
  saveVisitorCredential(inq1Id, 'idm_rc_0123456789abcdef0123456789abcdef');
  saveVisitorCredential(inq2Id, 'idm_rc_fedcba9876543210fedcba9876543210');
  const authPayloadBefore = getAuthenticatedVisitorInquiriesPayload();
  removeVisitorCredential(inq1Id);
  const authPayloadAfter = getAuthenticatedVisitorInquiriesPayload();
  if (authPayloadBefore.length === 2 && authPayloadAfter.length === 1 && authPayloadAfter[0].inquiry_id === inq2Id) {
    results.push('PASS: Visitor credential payload isolates authenticated inquiries and removes unbound credentials');
  } else {
    results.push('FAIL: Visitor credential isolation failed');
  }

  // Test 8: Static verification of PlanCard explicit read persistence & backend OneSignal push invariants
  try {
    const planCardSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PlanCard.tsx'), 'utf8');
    const partnerResSrc = fs.readFileSync(path.resolve(process.cwd(), 'supabase/functions/partner_resolution/index.ts'), 'utf8');
    const notifWorkerSrc = fs.readFileSync(path.resolve(process.cwd(), 'supabase/functions/notification_worker/index.ts'), 'utf8');
    const visitorResSrc = fs.readFileSync(path.resolve(process.cwd(), 'supabase/functions/visitor_resolution/index.ts'), 'utf8');

    const hasExplicitReadHandler =
      planCardSrc.includes('markProposalReadOnBackend(serverId, activeProposal.response_id)') &&
      planCardSrc.includes('data-testid="mark-proposal-read-btn"');
    const hasBackendOneSignalSetTo =
      partnerResSrc.includes('ios_badgeType: "SetTo"') &&
      partnerResSrc.includes('ios_badgeCount: unreadCount') &&
      partnerResSrc.includes('external_id: [visitorExternalId]') &&
      notifWorkerSrc.includes('ios_badgeType: "SetTo"') &&
      notifWorkerSrc.includes('ios_badgeCount: unreadCount');
    const hasVisitorReadEndpoint =
      visitorResSrc.includes('mark_visitor_proposal_read') &&
      visitorResSrc.includes('bind_visitor_push_identity') &&
      visitorResSrc.includes('unbind_visitor_push_identity');

    if (hasExplicitReadHandler && hasBackendOneSignalSetTo && hasVisitorReadEndpoint) {
      results.push('PASS: PlanCard explicit read persistence and backend OneSignal SetTo badge/alias invariants verified');
    } else {
      results.push(`FAIL: Static invariant check failed (explicitRead=${hasExplicitReadHandler}, oneSignal=${hasBackendOneSignalSetTo}, visitorEndpoints=${hasVisitorReadEndpoint})`);
    }
  } catch (err: any) {
    results.push(`FAIL: Static source verification error: ${err.message}`);
  }

  partnerSessionStorage.clearPartnerSession();
  safeStorage.clear();

  const allPassed = results.every(r => r.startsWith('PASS'));
  return { passed: allPassed, results };
}

runBadgingTests().then(({ passed, results }) => {
  console.log('--- Badging Test Results ---');
  results.forEach(r => console.log(r));
  if (!passed) process.exit(1);
});

