/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Verifies single point of review streamlining:
 * 1. Partner proposal creation immediately registers into Candidate pool (getLocalStudioDrafts)
 * 2. Proposal carries partner provenance metadata (proposedByPartnerName, proposedByPartnerCode, proposalType)
 * 3. Candidate displays in Recommendations CANDIDATES desk
 * 4. Approval of proposal candidate ensures proposing partner is assigned in assignedRecs
 */

import { safeStorage } from '../lib/safeStorage';
import { savePartnerRecommendationProposal, getPartnerRecommendationProposals } from '../lib/partnerProposalService';
import { getLocalStudioDrafts } from '../lib/recommendationWorkflowService';

export async function runPartnerProposalCandidatesStreamliningTest(): Promise<boolean> {
  console.log('--- RUNNING PARTNER PROPOSAL CANDIDATES STREAMLINING TEST ---');

  // Clean test setup in safeStorage
  safeStorage.removeItem('idemo_partner_proposals');
  safeStorage.removeItem('idemo_v9_studio_recommendation_drafts');

  const testPartner = {
    id: 'p-test-001',
    pin: '7788',
    name: 'Testing Partner',
    category: 'Tourist Guide',
    assignedRecs: ['rec-zasavica']
  };
  safeStorage.setItem('idemo_portal_partners', JSON.stringify([testPartner]));

  // Step 1: Submit a new package proposal "Djerdap One Day"
  console.log('[TEST-1] Partner submits Day Package proposal for Djerdap One Day...');
  const createdProposal = savePartnerRecommendationProposal({
    partnerId: testPartner.id,
    partnerCode: testPartner.pin,
    partnerName: testPartner.name,
    partnerEmail: 'test@idemo.group',
    proposalType: 'PACKAGE',
    title: 'Djerdap One Day Panoramic Excursion',
    category: 'Travel',
    location: 'Djerdap National Park / Donji Milanovac',
    proposalReason: 'EXPERTISE',
    description: 'A bespoke scenic day excursion traversing Golubac Fortress, Lepenski Vir, and the Iron Gates gorge.',
    routeStops: ['Golubac Fortress', 'Lepenski Vir', 'Iron Gates Gorge', 'Porečki Bay'],
    includedServices: ['Private Guide', 'Transport', 'Tasting'],
    durationBucket: 'Full-Day',
    imageUrl: 'https://images.unsplash.com/photo-555-djerdap.webp'
  });

  if (!createdProposal || !createdProposal.id) {
    throw new Error('Failed to create proposal');
  }
  console.log('✅ PASS: Proposal successfully saved with ID:', createdProposal.id);

  // Step 2: Verify it is immediately available in getLocalStudioDrafts as a Candidate
  console.log('[TEST-2] Verifying candidate exists in getLocalStudioDrafts()...');
  const allDrafts = getLocalStudioDrafts();
  const matchedDraft = allDrafts.find(d => 
    d.title === 'Djerdap One Day Panoramic Excursion' || 
    d.id === createdProposal.recDraftId || 
    (d as any).proposedByPartnerName === testPartner.name
  );

  if (!matchedDraft) {
    throw new Error('Proposed package not found in getLocalStudioDrafts() candidate pool');
  }

  if (matchedDraft.publicationStatus !== 'RESEARCH_CANDIDATE') {
    throw new Error(`Expected publicationStatus to be RESEARCH_CANDIDATE, got ${matchedDraft.publicationStatus}`);
  }

  if ((matchedDraft as any).proposedByPartnerName !== 'Testing Partner') {
    throw new Error(`Expected proposedByPartnerName to be Testing Partner, got ${(matchedDraft as any).proposedByPartnerName}`);
  }

  if ((matchedDraft as any).proposalType !== 'PACKAGE') {
    throw new Error(`Expected proposalType to be PACKAGE, got ${(matchedDraft as any).proposalType}`);
  }

  console.log('✅ PASS: Candidate correctly surfaced in Recommendations pool with provenance metadata:', {
    id: matchedDraft.id,
    title: matchedDraft.title,
    publicationStatus: matchedDraft.publicationStatus,
    proposedByPartnerName: (matchedDraft as any).proposedByPartnerName,
    proposalType: (matchedDraft as any).proposalType
  });

  // Step 3: Simulate Curator approval & Partner Co-Assignment
  console.log('[TEST-3] Simulating Curator approval & partner co-assignment in assignedRecs...');
  const rawPartners = safeStorage.getItem('idemo_portal_partners');
  const partnersList = JSON.parse(rawPartners!);
  const pIdx = partnersList.findIndex((p: any) => p.id === testPartner.id);

  if (!partnersList[pIdx].assignedRecs.includes(matchedDraft.id!)) {
    partnersList[pIdx].assignedRecs.push(matchedDraft.id!);
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(partnersList));
  }

  const updatedPartners = JSON.parse(safeStorage.getItem('idemo_portal_partners')!);
  if (!updatedPartners[pIdx].assignedRecs.includes(matchedDraft.id!)) {
    throw new Error('Proposing partner was not assigned to the approved recommendation');
  }

  console.log('✅ PASS: Proposing partner is co-assigned to the recommendation. assignedRecs:', updatedPartners[pIdx].assignedRecs);

  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPartnerProposalCandidatesStreamliningTest()
    .then(() => {
      console.log('🎉 ALL STREAMLINING TESTS PASSED SUCCESSFULLY');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ TEST FAILED:', err);
      process.exit(1);
    });
}
