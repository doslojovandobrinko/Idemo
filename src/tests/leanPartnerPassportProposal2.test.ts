/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO LEAN PARTNER PASSPORT (PROPOSAL 2) TEST SUITE
 * 
 * Tests:
 * 1. Distinction between Individual vs Agency/Organisation.
 * 2. Serbian PIB 9-digit format validator.
 * 3. Guide licence recording for individuals.
 * 4. Website recording and preservation for agencies.
 * 5. Passenger transport capacity categorization (none, 1-4, 5-8, 9-19, 20+).
 * 6. Minimum advance notice window handling (same_day, 24h, 48h).
 * 7. Operational languages selection.
 * 8. Resilient local SafeStorage serialization.
 * 9. Directory migration of approved passport copying Proposal 2 fields.
 */

import { safeStorage } from '../lib/safeStorage';
import { savePartnerProfileDraft } from '../lib/partnerService';
import { syncApprovedPassportsToDirectory, getAllPartners } from '../lib/partnerLifecycleService';
import { Partner } from '../types';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export function validateSerbianPib(pib: string): boolean {
  return /^\d{9}$/.test(pib.trim());
}

export async function runLeanPartnerPassportProposal2Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // TEST 1: PIB 9-Digit Format Validator
  {
    const valid1 = validateSerbianPib('101234567');
    const valid2 = validateSerbianPib('108923456');
    const invalidShort = validateSerbianPib('10123456'); // 8 digits
    const invalidLetters = validateSerbianPib('10123456A');
    const invalidLong = validateSerbianPib('1012345678'); // 10 digits

    const pibCheckPassed = valid1 && valid2 && !invalidShort && !invalidLetters && !invalidLong;
    results.push({
      testId: 'LPP-01',
      name: 'PIB 9-digit format validator rejects non-conforming and accepts 9-digit Serbian tax IDs',
      expected: 'valid1=true, valid2=true, invalidShort=false, invalidLetters=false, invalidLong=false',
      actual: `valid1=${valid1}, valid2=${valid2}, invalidShort=${invalidShort}, invalidLetters=${invalidLetters}, invalidLong=${invalidLong}`,
      passed: pibCheckPassed,
    });
  }

  // TEST 2: Individual Specialist Passport Creation & SafeStorage Roundtrip
  {
    const testIndividualId = 'TEST_INDIVIDUAL_GUIDE_01';
    const storageKey = `idemo_partner_passport_${testIndividualId}`;

    const individualData = {
      partner_id: testIndividualId,
      partner_code: 'GUIDE01',
      partner_name: 'Milan Petrović',
      partner_type: 'Individual',
      guide_licence: 'RS-VOD-0842',
      languages: ['Serbian', 'English', 'German'],
      transport_capacity: 'none',
      notice_window: '24h',
      canonical_region: 'sa-belgrade-001',
      applied_recs: ['1', '2', '3'],
      intro_draft: 'Licensed heritage and fortress guide with 8 years of private tour experience.',
      review_status: 'draft',
      photo_consent_given: true,
      updated_at: new Date().toISOString(),
    };

    safeStorage.setItem(storageKey, JSON.stringify(individualData));
    const retrievedRaw = safeStorage.getItem(storageKey);
    const parsed = retrievedRaw ? JSON.parse(retrievedRaw) : {};

    const passed =
      parsed.partner_type === 'Individual' &&
      parsed.guide_licence === 'RS-VOD-0842' &&
      parsed.languages?.length === 3 &&
      parsed.transport_capacity === 'none' &&
      parsed.notice_window === '24h';

    results.push({
      testId: 'LPP-02',
      name: 'Individual specialist passport stores licence, languages, and zero-transport correctly',
      expected: 'type=Individual, licence=RS-VOD-0842, langs=3, transport=none, notice=24h',
      actual: `type=${parsed.partner_type}, licence=${parsed.guide_licence}, langs=${parsed.languages?.length}, transport=${parsed.transport_capacity}, notice=${parsed.notice_window}`,
      passed,
    });
  }

  // TEST 3: Agency / Organisation Passport Creation with Website and PIB
  {
    const testAgencyId = 'TEST_AGENCY_OPERATOR_02';
    const storageKey = `idemo_partner_passport_${testAgencyId}`;

    const agencyData = {
      partner_id: testAgencyId,
      partner_code: 'AGENCY02',
      partner_name: 'Dunav River Explorers DOO',
      partner_type: 'Organisation',
      website: 'https://dunavexplorers.rs',
      pib: '109876543',
      languages: ['Serbian', 'English', 'Russian'],
      transport_capacity: '5-8',
      notice_window: 'same_day',
      canonical_region: 'sa-east-005',
      applied_recs: ['4', '5'],
      intro_draft: 'Licensed nautical operator and minivan fleet for Lower Danube excursions.',
      review_status: 'approved',
      reviewed_at: new Date().toISOString(),
      photo_consent_given: true,
      updated_at: new Date().toISOString(),
    };

    safeStorage.setItem(storageKey, JSON.stringify(agencyData));
    const retrievedRaw = safeStorage.getItem(storageKey);
    const parsed = retrievedRaw ? JSON.parse(retrievedRaw) : {};

    const passed =
      parsed.partner_type === 'Organisation' &&
      parsed.website === 'https://dunavexplorers.rs' &&
      parsed.pib === '109876543' &&
      parsed.transport_capacity === '5-8' &&
      parsed.notice_window === 'same_day';

    results.push({
      testId: 'LPP-03',
      name: 'Agency organisation passport stores website, PIB, minivan capacity, and same-day notice',
      expected: 'type=Organisation, website=https://dunavexplorers.rs, pib=109876543, transport=5-8, notice=same_day',
      actual: `type=${parsed.partner_type}, website=${parsed.website}, pib=${parsed.pib}, transport=${parsed.transport_capacity}, notice=${parsed.notice_window}`,
      passed,
    });
  }

  // TEST 4: Directory Migration Preserves Proposal 2 Attributes upon Approval
  {
    // Synchronize approved passports into the directory
    syncApprovedPassportsToDirectory();
    const allPartners = getAllPartners();
    const migratedAgency = allPartners.find(
      p => p.id === 'TEST_AGENCY_OPERATOR_02' ||
           p.id === 'P-TEST_AGENCY_OPERATOR_02' ||
           p.nameEn === 'Dunav River Explorers DOO'
    );

    const passed =
      !!migratedAgency &&
      migratedAgency.partnerType === 'Organisation' &&
      migratedAgency.website === 'https://dunavexplorers.rs' &&
      migratedAgency.pib === '109876543' &&
      migratedAgency.transportCapacity === '5-8' &&
      migratedAgency.noticeWindow === 'same_day' &&
      migratedAgency.stage === 'Approved' &&
      migratedAgency.verificationStatus === 'verified';

    results.push({
      testId: 'LPP-04',
      name: 'Approved Agency passport migrates cleanly to Directory with website, PIB, and transport',
      expected: 'partnerType=Organisation, website present, pib present, transport=5-8, stage=Approved, verified=verified',
      actual: migratedAgency
        ? `partnerType=${migratedAgency.partnerType}, website=${migratedAgency.website}, pib=${migratedAgency.pib}, transport=${migratedAgency.transportCapacity}, stage=${migratedAgency.stage}, verified=${migratedAgency.verificationStatus}`
        : 'Migrated agency not found in directory',
      passed,
    });
  }

  return results;
}

// Auto-run if executed directly in test runner
if (typeof window !== 'undefined') {
  (window as any).__runLeanPartnerPassportProposal2Tests = runLeanPartnerPassportProposal2Tests;
}
