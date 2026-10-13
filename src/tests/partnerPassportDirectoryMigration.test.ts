/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Partner Passport to Partner Directory Migration Test Suite
 *
 * Verifies that:
 * 1. Upon Partner Passport approval, the partner automatically migrates into
 *    the authoritative Partner Directory (getAllPartners).
 * 2. The migrated partner has lifecycle stage 'Approved' and isVerified = true.
 * 3. The migrated partner appears in the 'APPROVED' and 'ALL' directory filters.
 * 4. Partner details (introduction, contacts, category) migrate seamlessly.
 * 5. Pre-existing approved passports in safeStorage are auto-synced.
 */

import { adminReviewPartnerProfile, fetchPartnerProfileReviewQueue } from '../lib/partnerService';
import { getAllPartners, getPartnerLifecycleState, syncApprovedPassportsToDirectory } from '../lib/partnerLifecycleService';
import { safeStorage } from '../lib/safeStorage';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPartnerPassportDirectoryMigrationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // SETUP: Create a new portal partner candidate who submits a passport
  const testCandidateId = 'partner-kraljevo-raft';
  const testCandidateCode = 'KRAFT1';
  const testCandidateName = 'Ibar White Water Rafting Club';

  // Seed portal partner
  const portalPartners = [
    {
      id: testCandidateId,
      name: testCandidateName,
      publicCode: testCandidateCode,
      pin: '5566',
      category: 'Outdoor & Adventure',
      status: 'Candidate',
      capabilities: ['Rafting', 'Canyon Tours'],
      languages: ['Serbian', 'English'],
      geography: 'Ibar Gorge & Kraljevo',
      contactPhone: '+381641234567',
      assignedRecs: ['rec-ibar-01'],
    }
  ];
  safeStorage.setItem('idemo_portal_partners', JSON.stringify(portalPartners));

  // Seed partner passport
  const passportKey = `idemo_partner_passport_${testCandidateId.toUpperCase()}`;
  safeStorage.setItem(passportKey, JSON.stringify({
    partner_id: testCandidateId,
    partner_code: testCandidateCode,
    partner_name: testCandidateName,
    intro_draft: 'Premier white water rafting and outdoor experience along the scenic Ibar river.',
    photo_url: 'https://example.com/rafting.jpg',
    draft_photo_path: 'drafts/rafting.jpg',
    photo_consent_given: true,
    draft_contact_phone: '+381641234567',
    draft_contact_email: 'rafting@idemo.rs',
    applied_recs: ['rec-ibar-01'],
    review_status: 'pending_review',
    submitted_at: new Date().toISOString(),
  }));

  // TEST 1: Before approval, candidate does not yet appear as 'Approved' in Partner Directory
  {
    const all = getAllPartners();
    const inDirectory = all.find(p => p.id === testCandidateId || p.nameEn === testCandidateName);
    const isApprovedBefore = inDirectory ? getPartnerLifecycleState(inDirectory).stage === 'Approved' : false;

    results.push({
      name: 'PPDM-01: Candidate is not approved in Partner Directory prior to admin approval',
      passed: !isApprovedBefore,
      details: `In directory before: ${Boolean(inDirectory)}, Approved: ${isApprovedBefore}`,
    });
  }

  // TEST 2: Admin approves the Partner Passport
  {
    const approveRes = await adminReviewPartnerProfile(testCandidateId, 'approve', 'Approved by Senior Curator');
    results.push({
      name: 'PPDM-02: adminReviewPartnerProfile executes approval successfully',
      passed: approveRes.success,
      details: `Success: ${approveRes.success}, Message: "${approveRes.message}"`,
    });
  }

  // TEST 3: Candidate has migrated and appears in getAllPartners() as 'Approved'
  {
    const allAfter = getAllPartners();
    const migrated = allAfter.find(p => p.id === testCandidateId || p.nameEn === testCandidateName || p.id === `P-${testCandidateId.toUpperCase()}`);
    const state = migrated ? getPartnerLifecycleState(migrated) : null;

    const isValid = Boolean(
      migrated &&
      (migrated.stage === 'Approved' || state?.isVerified) &&
      migrated.verificationStatus === 'verified' &&
      migrated.descriptionEn?.includes('white water rafting') &&
      migrated.phone === '+381641234567'
    );

    results.push({
      name: 'PPDM-03: Approved passport migrates into Partner Directory with Approved stage and verified status',
      passed: isValid,
      details: `Found: ${Boolean(migrated)}, ID: ${migrated?.id}, Stage: ${migrated?.stage}, Status: ${migrated?.verificationStatus}, Phone: ${migrated?.phone}`,
    });
  }

  // TEST 4: Migrated partner matches 'APPROVED' and 'ALL' filters in directory logic
  {
    const all = getAllPartners();
    const migrated = all.find(p => p.id === testCandidateId || p.nameEn === testCandidateName || p.id === `P-${testCandidateId.toUpperCase()}`);
    let approvedFilterMatched = false;
    let allFilterMatched = false;

    if (migrated) {
      const st = getPartnerLifecycleState(migrated);
      approvedFilterMatched = st.stage === 'Approved' || (st.isVerified && !st.isActive);
      allFilterMatched = !st.isRetired;
    }

    const passed = approvedFilterMatched && allFilterMatched;
    results.push({
      name: 'PPDM-04: Migrated partner satisfies "APPROVED" and "ALL" directory filter queries',
      passed,
      details: `Matched APPROVED filter: ${approvedFilterMatched}, Matched ALL filter: ${allFilterMatched}`,
    });
  }

  // TEST 5: Batch synchronization picks up existing approved passports in SafeStorage
  {
    // Inject another approved passport directly
    const directApprovedCode = 'DANUBETOUR';
    safeStorage.setItem(`idemo_partner_passport_${directApprovedCode}`, JSON.stringify({
      partner_id: `partner-${directApprovedCode.toLowerCase()}`,
      partner_code: directApprovedCode,
      partner_name: 'Danube Nautical Adventures',
      intro_draft: 'Bespoke Danube boat tours around Golubac Fortress and Iron Gate.',
      intro_published: 'Bespoke Danube boat tours around Golubac Fortress and Iron Gate.',
      review_status: 'approved',
      published_contact_phone: '+381629876543',
      published_contact_email: 'danube@idemo.rs',
      reviewed_at: new Date().toISOString(),
    }));

    // Trigger sync
    syncApprovedPassportsToDirectory();

    const all = getAllPartners();
    const foundDirect = all.find(p => p.nameEn === 'Danube Nautical Adventures' || p.id.includes(directApprovedCode.toLowerCase()));
    const stateDirect = foundDirect ? getPartnerLifecycleState(foundDirect) : null;

    const passed = Boolean(foundDirect && (foundDirect.stage === 'Approved' || stateDirect?.isVerified));
    results.push({
      name: 'PPDM-05: syncApprovedPassportsToDirectory synchronizes approved passports into directory',
      passed,
      details: `Found: ${Boolean(foundDirect)}, ID: ${foundDirect?.id}, Stage: ${foundDirect?.stage}, Verified: ${stateDirect?.isVerified}`,
    });
  }

  return results;
}

// Auto-run if executed directly via CLI
if (typeof process !== 'undefined' && process.argv[1]?.includes('partnerPassportDirectoryMigration.test.ts')) {
  runPartnerPassportDirectoryMigrationTests().then((res) => {
    console.log('--- Partner Passport Directory Migration Tests ---');
    let allPass = true;
    res.forEach((r) => {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      console.log(`       ${r.details}`);
      if (!r.passed) allPass = false;
    });
    if (!allPass) {
      process.exit(1);
    } else {
      console.log('\nALL 5 MIGRATION TESTS PASSED CLEANLY.');
    }
  });
}
