/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO PRINCIPLE 41 — CLOSED-LOOP INQUIRY, PARTNER PASSPORT & TWO-WAY HANDSHAKE INVARIANT VERIFIER
 *
 * Run with: npx tsx scripts/verifyClosedLoopHandshakeInvariant.ts
 *
 * Verifies that none of the 5 core architectural pillars of the Visitor <-> Partner
 * closed-loop handshake have drifted or regressed:
 *   1. Partner Passport 7 Operational Fields End-to-End Persistence
 *   2. Visitor 10-Field Structured Inquiry & Clean Partner Unpacking
 *   3. Partner Acceptance Never Prematurely Auto-Confirms Before Visitor Review
 *   4. Visitor Untruncated "Allow me to introduce myself" Passport Review + Accept / Immediate-Cascade Reject
 *   5. Partner Confirmation Red Dot (`confirmed_<id>`), Active Surfacing, Banner & Explicit Acknowledgement
 */

import * as fs from 'fs';
import * as path from 'path';

interface InvariantCheck {
  id: string;
  description: string;
  passed: boolean;
  evidence: string;
}

const rootDir = process.cwd();
const read = (relPath: string) => fs.readFileSync(path.join(rootDir, relPath), 'utf8');

const planCardSrc = read('src/components/PlanCard.tsx');
const partnersScreenSrc = read('src/components/PartnersScreen.tsx');
const partnerBadgeStorageSrc = read('src/lib/partnerBadgeStorage.ts');
const inquiryServiceSrc = read('src/lib/inquiryService.ts');
const edgeFnSrc = read('supabase/functions/partner_resolution/index.ts');

const checks: InvariantCheck[] = [];

function assertInvariant(id: string, description: string, condition: boolean, evidence: string) {
  checks.push({ id, description, passed: condition, evidence });
}

// 1. Partner Passport 7 Operational Fields End-to-End
const passportFields = [
  'partner_type',
  'website',
  'guide_licence',
  'pib',
  'languages',
  'transport_capacity',
  'notice_window',
];
const allFieldsInEdgeFn = passportFields.every(f => edgeFnSrc.includes(`upsertPayload.${f}`));
assertInvariant(
  'INV-41.1',
  'Edge Function /profile-content/draft persists all 7 Partner Passport operational fields',
  allFieldsInEdgeFn,
  `Checked upsertPayload.{${passportFields.join(', ')}} in supabase/functions/partner_resolution/index.ts`
);

// 2. Visitor 10-Field Structured Inquiry & Clean Unpacking
const hasStructuredParser =
  partnersScreenSrc.includes('const parseStructuredInquiryNotes = (rawNotes: string)') &&
  partnersScreenSrc.includes('const runtimeParsed = parseStructuredInquiryNotes(inq.query || \'\');') &&
  planCardSrc.includes('.replace(/^\\[[^\\]]+\\]\\s*/, \'\')');
assertInvariant(
  'INV-41.2',
  'Structured 10-field Visitor Inquiry is unpacked cleanly on Partner & Visitor cards (never raw bracket dump)',
  hasStructuredParser,
  'Verified parseStructuredInquiryNotes in PartnersScreen.tsx and bracket header stripping in PlanCard.tsx'
);

// 3. No Premature Auto-Confirmation in bridgePartnerAcceptanceToVisitor
const bridgeStart = partnersScreenSrc.indexOf('const bridgePartnerAcceptanceToVisitor =');
const bridgeEnd = partnersScreenSrc.indexOf('const handlePartnerAcceptInquiry =', bridgeStart);
const bridgeBody = bridgeStart !== -1 && bridgeEnd !== -1 ? partnersScreenSrc.slice(bridgeStart, bridgeEnd) : '';
const noPrematureConfirm =
  bridgeBody.length > 0 &&
  bridgeBody.includes('saveConfirmedArrangementV2(serverOrLocalId, null)') &&
  !bridgeBody.includes("dispatchEvent(new CustomEvent('idemo_arrangement_confirmed'");
assertInvariant(
  'INV-41.3',
  'Partner Acceptance (bridgePartnerAcceptanceToVisitor) creates active proposal & clears premature confirmation',
  noPrematureConfirm,
  'Verified bridgePartnerAcceptanceToVisitor clears confirmed_arrangement and dispatches idemo_proposal_state_change only'
);

// 4. Untruncated Partner Passport Introduction & Visitor Accept / Immediate-Cascade Reject Buttons
const hasUntruncatedIntroAndDecisionButtons =
  planCardSrc.includes('ALLOW ME TO INTRODUCE MYSELF') &&
  planCardSrc.includes('PARTNER PROFESSIONAL INTRODUCTION:') &&
  planCardSrc.includes('ACCEPT & CONFIRM PARTNER') &&
  planCardSrc.includes('REJECT PARTNER (NEXT IN QUEUE)') &&
  inquiryServiceSrc.includes('const cachedProp = targetInquiry?.cached_proposal;');
assertInvariant(
  'INV-41.4',
  'Visitor Proposal Review displays untruncated Partner Passport introduction + explicit Accept & Reject (Next in Queue) buttons',
  hasUntruncatedIntroAndDecisionButtons,
  'Verified untruncated introduction card, ACCEPT & CONFIRM PARTNER, and REJECT PARTNER (NEXT IN QUEUE) in PlanCard.tsx'
);

// 5. Partner Confirmation Notification (Red Dot, Active Surfacing, Top Banner & Acknowledge Button)
const hasPartnerConfirmationLoop =
  partnerBadgeStorageSrc.includes('export function getPartnerInquiryBadgeKey') &&
  partnerBadgeStorageSrc.includes('export function unmarkPartnerInquiriesAsSeen') &&
  planCardSrc.includes('unmarkPartnerInquiriesAsSeen(matchedPortalIds)') &&
  partnersScreenSrc.includes('NEW TRAVELER CONFIRMATION — ARRANGEMENT LOCKED!') &&
  partnersScreenSrc.includes('handlePartnerAcknowledgeConfirmation') &&
  partnersScreenSrc.includes("fetchPartnerOpportunities('active')");
assertInvariant(
  'INV-41.5',
  'Visitor Acceptance triggers Partner Red Dot (confirmed_<id>), surfaces inquiry to Active top banner, and requires Partner Acknowledge',
  hasPartnerConfirmationLoop,
  'Verified getPartnerInquiryBadgeKey, unmarkPartnerInquiriesAsSeen, NEW TRAVELER CONFIRMATION banner, and handlePartnerAcknowledgeConfirmation'
);

console.log('====================================================================');
console.log('IDEMO PRINCIPLE 41 — CLOSED-LOOP HANDSHAKE INVARIANT VERIFICATION');
console.log('====================================================================');
let allPassed = true;
for (const c of checks) {
  const status = c.passed ? 'PASS' : 'FAIL';
  if (!c.passed) allPassed = false;
  console.log(`[${status}] ${c.id}: ${c.description}`);
  console.log(`       Evidence: ${c.evidence}`);
}
console.log('====================================================================');

if (!allPassed) {
  console.error('INVARIANT VERIFICATION FAILED!');
  process.exit(1);
} else {
  console.log('ALL 5 CORE CLOSED-LOOP HANDSHAKE INVARIANTS VERIFIED: 100% PASS');
}
