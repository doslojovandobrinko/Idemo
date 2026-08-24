/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getSeenProposals,
  isProposalSeen,
  markProposalAsSeen,
  removeSeenProposal,
  checkHasUnreadProposals,
} from '../lib/inquiryStorage';
import { safeStorage } from '../lib/safeStorage';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runMyPlannerUnreadIndicatorTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Cleanup before tests
  safeStorage.removeItem('idemo_seen_proposals_v1');
  safeStorage.removeItem('idemo_inquiries_v2');

  // Test 1: Storage key idemo_seen_proposals_v1 is used
  try {
    markProposalAsSeen('inq_test_1', 'sig_1');
    const raw = safeStorage.getItem('idemo_seen_proposals_v1');
    const parsed = raw ? JSON.parse(raw) : {};
    const passed = parsed['inq_test_1'] === 'sig_1';
    results.push({
      testId: 'MPI-01',
      name: 'Uses canonical idemo_seen_proposals_v1 storage key',
      expected: 'idemo_seen_proposals_v1 contains {"inq_test_1": "sig_1"}',
      actual: JSON.stringify(parsed),
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-01',
      name: 'Uses canonical idemo_seen_proposals_v1 storage key',
      expected: 'Storage written without error',
      actual: err.message,
      passed: false,
    });
  }

  // Test 2: isProposalSeen returns false for unseen proposal signature
  try {
    const isSeen = isProposalSeen('inq_test_2', 'sig_2');
    results.push({
      testId: 'MPI-02',
      name: 'isProposalSeen returns false for unseen signature',
      expected: 'isProposalSeen("inq_test_2", "sig_2") === false',
      actual: `isProposalSeen returned ${isSeen}`,
      passed: isSeen === false,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-02',
      name: 'isProposalSeen returns false for unseen signature',
      expected: 'False',
      actual: err.message,
      passed: false,
    });
  }

  // Test 3: isProposalSeen returns true after markProposalAsSeen
  try {
    markProposalAsSeen('inq_test_2', 'sig_2');
    const isSeen = isProposalSeen('inq_test_2', 'sig_2');
    results.push({
      testId: 'MPI-03',
      name: 'isProposalSeen returns true after marking proposal as seen',
      expected: 'isProposalSeen("inq_test_2", "sig_2") === true',
      actual: `isProposalSeen returned ${isSeen}`,
      passed: isSeen === true,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-03',
      name: 'isProposalSeen returns true after marking proposal as seen',
      expected: 'True',
      actual: err.message,
      passed: false,
    });
  }

  // Test 4: New proposal signature for same inquiry triggers unread
  try {
    const isNewSigSeen = isProposalSeen('inq_test_2', 'sig_3_new');
    results.push({
      testId: 'MPI-04',
      name: 'New proposal signature for same inquiry returns false (unread)',
      expected: 'isProposalSeen("inq_test_2", "sig_3_new") === false',
      actual: `isProposalSeen returned ${isNewSigSeen}`,
      passed: isNewSigSeen === false,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-04',
      name: 'New proposal signature for same inquiry returns false (unread)',
      expected: 'False',
      actual: err.message,
      passed: false,
    });
  }

  // Test 5: checkHasUnreadProposals correctly detects unread cached proposal in idemo_inquiries_v2
  try {
    safeStorage.removeItem('idemo_seen_proposals_v1');
    const sampleInquiries = [
      {
        local_queue_id: 'queue_100',
        server_inquiry_id: 'inq_server_100',
        recommendation_id: 'rec_1',
        recommendation_title: 'Test Location',
        visitor_name: 'Traveler',
        visitor_notes: '',
        requested_start_at: new Date().toISOString(),
        requested_end_at: new Date().toISOString(),
        preferred_date: '',
        preferred_time: '',
        status: 'submitted',
        client_request_id: 'req_100',
        is_server_authoritative: true,
        created_at: new Date().toISOString(),
        cached_proposal: {
          schema_version: 1,
          match_id: 'match_100',
          response_id: 'resp_100',
          response_type: 'accept_as_requested',
          message: 'Ready to welcome you!',
          cached_at: Date.now(),
        },
      },
    ];
    safeStorage.setItem('idemo_inquiries_v2', JSON.stringify(sampleInquiries));

    const hasUnread = checkHasUnreadProposals();
    results.push({
      testId: 'MPI-05',
      name: 'checkHasUnreadProposals returns true when unread proposal exists',
      expected: 'checkHasUnreadProposals() === true',
      actual: `checkHasUnreadProposals returned ${hasUnread}`,
      passed: hasUnread === true,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-05',
      name: 'checkHasUnreadProposals returns true when unread proposal exists',
      expected: 'True',
      actual: err.message,
      passed: false,
    });
  }

  // Test 6: Marking proposal as seen clears checkHasUnreadProposals
  try {
    markProposalAsSeen('inq_server_100', 'match_100_resp_100');
    const hasUnread = checkHasUnreadProposals();
    results.push({
      testId: 'MPI-06',
      name: 'checkHasUnreadProposals returns false after proposal is marked as seen',
      expected: 'checkHasUnreadProposals() === false',
      actual: `checkHasUnreadProposals returned ${hasUnread}`,
      passed: hasUnread === false,
    });
  } catch (err: any) {
    results.push({
      testId: 'MPI-06',
      name: 'checkHasUnreadProposals returns false after proposal is marked as seen',
      expected: 'False',
      actual: err.message,
      passed: false,
    });
  }

  // Cleanup after tests
  safeStorage.removeItem('idemo_seen_proposals_v1');
  safeStorage.removeItem('idemo_inquiries_v2');

  return results;
}
