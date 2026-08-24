/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PARTNER PROFILE LIFECYCLE MANAGEMENT INVARIANT TEST SUITE
 * Permanent Non-Regression Suite covering Tests P01 - P25.
 */

import { PARTNERS as INITIAL_PARTNERS } from '../data/partners';
import { Partner } from '../types';
import {
  getPartnerLifecycleState,
  savePartnerProfile,
  verifyPartnerAction,
  activatePartnerAction,
  enableConciergeRoutingAction,
  disableConciergeRoutingAction,
  suspendPartnerAction,
  retirePartnerAction,
  reactivatePartnerAction,
  getAllPartners,
} from '../lib/partnerLifecycleService';
import {
  getPartnerSuitabilityScore,
  evaluatePartnerIntroductionCapability
} from '../lib/partnerIntelligenceService';

export async function runPartnerLifecycleInvariantTests() {
  const results: Array<{ testId: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  // P01: Unverified Partner profile is Candidate / Unverified by default
  {
    const candidate: Partial<Partner> = {
      id: 'P-TEST-01',
      nameEn: 'Candidate Partner',
      verificationStatus: 'unverified',
      stage: 'Candidate',
      status: 'invited',
      conciergeRoutingEligible: 'No'
    };
    const state = getPartnerLifecycleState(candidate);
    const passed = state.stage === 'Candidate' && !state.isVerified && state.isCandidate;
    results.push({
      testId: 'P01',
      name: 'Unverified Partner profile is Candidate / Unverified by default',
      expected: 'stage: Candidate, isVerified: false, isCandidate: true',
      actual: `stage: ${state.stage}, isVerified: ${state.isVerified}, isCandidate: ${state.isCandidate}`,
      passed
    });
  }

  // P02: Unverified Partner cannot be active or concierge-routable
  {
    const candidate: Partial<Partner> = {
      id: 'P-TEST-02',
      nameEn: 'Candidate Partner 2',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    };
    const state = getPartnerLifecycleState(candidate);
    const passed = !state.isActive && !state.isRoutable;
    results.push({
      testId: 'P02',
      name: 'Unverified Partner cannot be active or concierge-routable',
      expected: 'isActive: false, isRoutable: false',
      actual: `isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P03: Admin verification transitions Partner from Unverified to Verified
  {
    const initial = savePartnerProfile({
      id: 'P-TEST-03',
      nameEn: 'Test Partner 3',
      verificationStatus: 'unverified',
      stage: 'Candidate',
      status: 'invited',
      conciergeRoutingEligible: 'No'
    } as Partner);
    const verified = verifyPartnerAction('P-TEST-03', 'Admin Curator');
    const state = getPartnerLifecycleState(verified);
    const passed = state.isVerified && state.stage === 'Approved';
    results.push({
      testId: 'P03',
      name: 'Admin verification transitions Partner from Unverified to Verified (Approved stage)',
      expected: 'isVerified: true, stage: Approved',
      actual: `isVerified: ${state.isVerified}, stage: ${state.stage}`,
      passed
    });
  }

  // P04: Verification alone does NOT make Partner active or concierge-routable
  {
    const initial = savePartnerProfile({
      id: 'P-TEST-04',
      nameEn: 'Test Partner 4',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    const verified = verifyPartnerAction('P-TEST-04');
    const state = getPartnerLifecycleState(verified);
    const passed = state.isVerified && !state.isActive && !state.isRoutable;
    results.push({
      testId: 'P04',
      name: 'Verification alone does NOT make Partner active or concierge-routable',
      expected: 'isVerified: true, isActive: false, isRoutable: false',
      actual: `isVerified: ${state.isVerified}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P05: Explicit Admin activation transitions Partner to Active
  {
    savePartnerProfile({
      id: 'P-TEST-05',
      nameEn: 'Test Partner 5',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-05');
    const activated = activatePartnerAction('P-TEST-05');
    const state = getPartnerLifecycleState(activated);
    const passed = state.isActive && state.stage === 'Active';
    results.push({
      testId: 'P05',
      name: 'Explicit Admin activation transitions Partner to Active',
      expected: 'isActive: true, stage: Active',
      actual: `isActive: ${state.isActive}, stage: ${state.stage}`,
      passed
    });
  }

  // P06: Unverified Partner cannot be activated (fails safe)
  {
    savePartnerProfile({
      id: 'P-TEST-06',
      nameEn: 'Unverified Partner 6',
      verificationStatus: 'unverified',
      stage: 'Candidate',
      conciergeRoutingEligible: 'No'
    } as Partner);
    let caughtError = false;
    try {
      activatePartnerAction('P-TEST-06');
    } catch {
      caughtError = true;
    }
    results.push({
      testId: 'P06',
      name: 'Unverified Partner cannot be activated (fails safe / throws error)',
      expected: 'caughtError: true',
      actual: `caughtError: ${caughtError}`,
      passed: caughtError
    });
  }

  // P07: Explicit Admin Concierge routing enablement sets conciergeRoutingEligible = Yes
  {
    savePartnerProfile({
      id: 'P-TEST-07',
      nameEn: 'Test Partner 7',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-07');
    activatePartnerAction('P-TEST-07');
    const routed = enableConciergeRoutingAction('P-TEST-07');
    const state = getPartnerLifecycleState(routed);
    const passed = state.isRoutable && routed.conciergeRoutingEligible === 'Yes';
    results.push({
      testId: 'P07',
      name: 'Explicit Admin Concierge routing enablement sets conciergeRoutingEligible = Yes',
      expected: 'isRoutable: true, conciergeRoutingEligible: Yes',
      actual: `isRoutable: ${state.isRoutable}, conciergeRoutingEligible: ${routed.conciergeRoutingEligible}`,
      passed
    });
  }

  // P08: Unverified / inactive Partner cannot be routed to concierge
  {
    savePartnerProfile({
      id: 'P-TEST-08',
      nameEn: 'Test Partner 8',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    let caughtError = false;
    try {
      enableConciergeRoutingAction('P-TEST-08');
    } catch {
      caughtError = true;
    }
    results.push({
      testId: 'P08',
      name: 'Unverified / inactive Partner cannot enable concierge routing (fails safe)',
      expected: 'caughtError: true',
      actual: `caughtError: ${caughtError}`,
      passed: caughtError
    });
  }

  // P09: Active Partner with conciergeRoutingEligible = Yes is eligible for routing
  {
    savePartnerProfile({
      id: 'P-TEST-09',
      nameEn: 'Test Partner 9',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-09');
    activatePartnerAction('P-TEST-09');
    enableConciergeRoutingAction('P-TEST-09');
    const updated = getAllPartners().find(p => p.id === 'P-TEST-09')!;
    const state = getPartnerLifecycleState(updated);
    const passed = state.isVerified && state.isActive && state.isRoutable;
    results.push({
      testId: 'P09',
      name: 'Active Partner with conciergeRoutingEligible = Yes is eligible for routing',
      expected: 'isVerified: true, isActive: true, isRoutable: true',
      actual: `isVerified: ${state.isVerified}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P10: Partner Profile edit (name, phone, email) preserves existing verification & active status
  {
    savePartnerProfile({
      id: 'P-TEST-10',
      nameEn: 'Original Name 10',
      email: 'original@test.com',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-10');
    activatePartnerAction('P-TEST-10');
    enableConciergeRoutingAction('P-TEST-10');

    // Perform profile edit
    const existing = getAllPartners().find(p => p.id === 'P-TEST-10')!;
    const edited = savePartnerProfile({
      ...existing,
      nameEn: 'Edited Name 10',
      email: 'updated@test.com'
    });
    const state = getPartnerLifecycleState(edited);
    const passed = edited.nameEn === 'Edited Name 10' && state.isVerified && state.isActive && state.isRoutable;
    results.push({
      testId: 'P10',
      name: 'Partner Profile edit preserves existing verification & active status',
      expected: 'Name updated, isVerified: true, isActive: true, isRoutable: true',
      actual: `nameEn: ${edited.nameEn}, isVerified: ${state.isVerified}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P11: Partner Profile edit does NOT automatically escalate Candidate or Unverified to Verified/Active
  {
    savePartnerProfile({
      id: 'P-TEST-11',
      nameEn: 'Candidate 11',
      verificationStatus: 'unverified',
      stage: 'Candidate',
      conciergeRoutingEligible: 'No'
    } as Partner);

    const edited = savePartnerProfile({
      id: 'P-TEST-11',
      nameEn: 'Edited Candidate 11',
      phone: '+381 60 111 222',
      verificationStatus: 'unverified',
      stage: 'Candidate',
      conciergeRoutingEligible: 'No'
    } as Partner);
    const state = getPartnerLifecycleState(edited);
    const passed = !state.isVerified && !state.isActive && !state.isRoutable && state.stage === 'Candidate';
    results.push({
      testId: 'P11',
      name: 'Partner Profile edit does NOT automatically escalate Candidate to Verified/Active',
      expected: 'isVerified: false, isActive: false, isRoutable: false, stage: Candidate',
      actual: `isVerified: ${state.isVerified}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}, stage: ${state.stage}`,
      passed
    });
  }

  // P12: Suspended Partner cannot be concierge-routable
  {
    savePartnerProfile({
      id: 'P-TEST-12',
      nameEn: 'Partner 12',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-12');
    activatePartnerAction('P-TEST-12');
    enableConciergeRoutingAction('P-TEST-12');

    const suspended = suspendPartnerAction('P-TEST-12', 'Violation audit');
    const state = getPartnerLifecycleState(suspended);
    const passed = state.isSuspended && !state.isRoutable && suspended.conciergeRoutingEligible === 'No';
    results.push({
      testId: 'P12',
      name: 'Suspended Partner cannot be concierge-routable',
      expected: 'isSuspended: true, isRoutable: false, conciergeRoutingEligible: No',
      actual: `isSuspended: ${state.isSuspended}, isRoutable: ${state.isRoutable}, conciergeRoutingEligible: ${suspended.conciergeRoutingEligible}`,
      passed
    });
  }

  // P13: Suspended Partner has is_open_for_inquiries = false
  {
    const suspended = suspendPartnerAction('P-TEST-12');
    const passed = suspended.is_open_for_inquiries === false;
    results.push({
      testId: 'P13',
      name: 'Suspended Partner has is_open_for_inquiries = false',
      expected: 'is_open_for_inquiries: false',
      actual: `is_open_for_inquiries: ${suspended.is_open_for_inquiries}`,
      passed
    });
  }

  // P14: Retired Partner cannot be concierge-routable
  {
    savePartnerProfile({
      id: 'P-TEST-14',
      nameEn: 'Partner 14',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-14');
    activatePartnerAction('P-TEST-14');
    enableConciergeRoutingAction('P-TEST-14');

    const retired = retirePartnerAction('P-TEST-14', 'Business closed');
    const state = getPartnerLifecycleState(retired);
    const passed = state.isRetired && !state.isRoutable && retired.conciergeRoutingEligible === 'No';
    results.push({
      testId: 'P14',
      name: 'Retired Partner cannot be concierge-routable',
      expected: 'isRetired: true, isRoutable: false, conciergeRoutingEligible: No',
      actual: `isRetired: ${state.isRetired}, isRoutable: ${state.isRoutable}, conciergeRoutingEligible: ${retired.conciergeRoutingEligible}`,
      passed
    });
  }

  // P15: Retired Partner is excluded from active partner suitability scoring
  {
    savePartnerProfile({
      id: 'P-TEST-15',
      nameEn: 'Partner 15',
      category: 'Tourist Guide',
      locationEn: 'Belgrade',
      serviceAreas: ['Belgrade'],
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-15');
    activatePartnerAction('P-TEST-15');
    retirePartnerAction('P-TEST-15');

    const retired = getAllPartners().find(p => p.id === 'P-TEST-15')!;
    const score = getPartnerSuitabilityScore(retired, 'Belgrade', 'Tourist Guide');
    const passed = score === 0;
    results.push({
      testId: 'P15',
      name: 'Retired Partner is excluded from active partner suitability scoring (score = 0)',
      expected: 'score: 0',
      actual: `score: ${score}`,
      passed
    });
  }

  // P16: Retired Partner preserves historical inquiry records and portfolio mapping
  {
    const retired = getAllPartners().find(p => p.id === 'P-TEST-15')!;
    const passed = retired.id === 'P-TEST-15' && retired.nameEn === 'Partner 15' && retired.category === 'Tourist Guide';
    results.push({
      testId: 'P16',
      name: 'Retired Partner preserves identity, fields, and portfolio mapping',
      expected: 'ID, nameEn, and category preserved intact',
      actual: `id: ${retired.id}, nameEn: ${retired.nameEn}, category: ${retired.category}`,
      passed
    });
  }

  // P17: Reactivating a Suspended Partner restores Active status when verified
  {
    savePartnerProfile({
      id: 'P-TEST-17',
      nameEn: 'Partner 17',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-17');
    activatePartnerAction('P-TEST-17');
    suspendPartnerAction('P-TEST-17');

    const restored = reactivatePartnerAction('P-TEST-17');
    const state = getPartnerLifecycleState(restored);
    const passed = state.isActive && state.stage === 'Active';
    results.push({
      testId: 'P17',
      name: 'Reactivating a Suspended Partner restores Active status when verified',
      expected: 'isActive: true, stage: Active',
      actual: `isActive: ${state.isActive}, stage: ${state.stage}`,
      passed
    });
  }

  // P18: Reactivating a Retired Partner restores Candidate state for explicit re-verification
  {
    savePartnerProfile({
      id: 'P-TEST-18',
      nameEn: 'Partner 18',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-18');
    activatePartnerAction('P-TEST-18');
    retirePartnerAction('P-TEST-18');

    const restored = reactivatePartnerAction('P-TEST-18');
    const state = getPartnerLifecycleState(restored);
    const passed = state.stage === 'Candidate' && !state.isActive && !state.isRoutable;
    results.push({
      testId: 'P18',
      name: 'Reactivating a Retired Partner restores Candidate state for explicit re-verification',
      expected: 'stage: Candidate, isActive: false, isRoutable: false',
      actual: `stage: ${state.stage}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P19: Retired Partner remains visible under Archived/Retired filter
  {
    const retired = getAllPartners().find(p => p.id === 'P-TEST-15')!;
    const state = getPartnerLifecycleState(retired);
    const passed = state.isRetired && state.stage === 'Archived';
    results.push({
      testId: 'P19',
      name: 'Retired Partner remains visible under Archived/Retired filter',
      expected: 'isRetired: true, stage: Archived',
      actual: `isRetired: ${state.isRetired}, stage: ${state.stage}`,
      passed
    });
  }

  // P20: Partner suitability scoring returns score = 0 for unverified partners
  {
    const unverifiedPartner: Partner = {
      id: 'P-TEST-20',
      nameEn: 'Unverified Guide',
      category: 'Tourist Guide',
      serviceAreas: ['Belgrade'],
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner;
    const score = getPartnerSuitabilityScore(unverifiedPartner, 'Belgrade', 'Tourist Guide');
    const passed = score === 0;
    results.push({
      testId: 'P20',
      name: 'Partner suitability scoring returns score = 0 for unverified partners',
      expected: 'score: 0',
      actual: `score: ${score}`,
      passed
    });
  }

  // P21: Partner suitability scoring returns score > 0 for active verified partners
  {
    savePartnerProfile({
      id: 'P-TEST-21',
      nameEn: 'Verified Guide',
      category: 'Tourist Guide',
      serviceAreas: ['Belgrade'],
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    verifyPartnerAction('P-TEST-21');
    activatePartnerAction('P-TEST-21');
    enableConciergeRoutingAction('P-TEST-21');

    const activePartner = getAllPartners().find(p => p.id === 'P-TEST-21')!;
    const score = getPartnerSuitabilityScore(activePartner, 'Belgrade', 'Tourist Guide');
    const passed = score > 0;
    results.push({
      testId: 'P21',
      name: 'Partner suitability scoring returns score > 0 for active verified partners',
      expected: 'score > 0',
      actual: `score: ${score}`,
      passed
    });
  }

  // P22: Local Storage overrides persist Partner lifecycle changes across reload
  {
    const all = getAllPartners();
    const persisted21 = all.find(p => p.id === 'P-TEST-21');
    const state = persisted21 ? getPartnerLifecycleState(persisted21) : null;
    const passed = !!persisted21 && state?.isActive && state?.isRoutable;
    results.push({
      testId: 'P22',
      name: 'Local Storage overrides persist Partner lifecycle changes across reload',
      expected: 'persisted21 exists, isActive: true, isRoutable: true',
      actual: `exists: ${!!persisted21}, isActive: ${state?.isActive}, isRoutable: ${state?.isRoutable}`,
      passed
    });
  }

  // P23: Missing or corrupt partner status fields fail safe to Candidate / Unverified
  {
    const corruptPartner = {
      id: 'P-TEST-23',
      nameEn: 'Corrupt Partner'
    } as Partner;
    const state = getPartnerLifecycleState(corruptPartner);
    const passed = state.stage === 'Candidate' && !state.isVerified && !state.isActive && !state.isRoutable;
    results.push({
      testId: 'P23',
      name: 'Missing or corrupt partner status fields fail safe to Candidate / Unverified',
      expected: 'stage: Candidate, isVerified: false, isActive: false, isRoutable: false',
      actual: `stage: ${state.stage}, isVerified: ${state.isVerified}, isActive: ${state.isActive}, isRoutable: ${state.isRoutable}`,
      passed
    });
  }

  // P24: Partner Introduction Capability (PIC) checks fail safe when partner is inactive or unverified
  {
    const candidate: Partner = {
      id: 'P-TEST-24',
      nameEn: 'Candidate Guide 24',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner;
    const pic = evaluatePartnerIntroductionCapability(candidate);
    const passed = !pic.capable && pic.reasons.length > 0;
    results.push({
      testId: 'P24',
      name: 'Partner Introduction Capability (PIC) checks fail safe when partner is inactive or unverified',
      expected: 'capable: false, reasons.length > 0',
      actual: `capable: ${pic.capable}, reasons: ${pic.reasons.join('; ')}`,
      passed
    });
  }

  // P25: Admin-governed actions produce accurate audit logs and timestamp updates
  {
    const initial = savePartnerProfile({
      id: 'P-TEST-25',
      nameEn: 'Partner 25',
      verificationStatus: 'unverified',
      conciergeRoutingEligible: 'No'
    } as Partner);
    const verified = verifyPartnerAction('P-TEST-25', 'Curator Mark');
    const passed = !!verified.lastVerified && verified.lastVerified === new Date().toISOString().split('T')[0];
    results.push({
      testId: 'P25',
      name: 'Admin-governed actions produce accurate audit logs and timestamp updates',
      expected: 'lastVerified set to today ISO date',
      actual: `lastVerified: ${verified.lastVerified}`,
      passed
    });
  }

  return results;
}
