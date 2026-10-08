/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { badgingService } from '../lib/badgingService';
import { 
  checkPartnerHasUnseenInquiries, 
  markPartnerInquiriesAsSeen, 
  getPartnerSeenInquiryIds,
  checkAnyPartnerUnseenBadge,
  getPartnerSeenMessageCount,
  markPartnerMessagesAsSeen
} from '../lib/partnerBadgeStorage';
import { partnerSessionStorage } from '../lib/partnerSessionStorage';
import { safeStorage } from '../lib/safeStorage';

export async function runBadgingTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];

  // Test 1: badgingService does not crash in headless/node environments
  try {
    await badgingService.setBadge(3);
    await badgingService.clearBadge();
    results.push('PASS: badgingService setBadge and clearBadge execute cleanly');
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

  // Test 4: partner messages tracking
  const initialSeen = getPartnerSeenMessageCount('UNO1');
  markPartnerMessagesAsSeen('UNO1', 5);
  const updatedSeen = getPartnerSeenMessageCount('UNO1');
  if (initialSeen === 0 && updatedSeen === 5) {
    results.push('PASS: partner messages seen count accurately persists in safeStorage');
  } else {
    results.push(`FAIL: partner message tracking mismatch (initial: ${initialSeen}, updated: ${updatedSeen})`);
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
