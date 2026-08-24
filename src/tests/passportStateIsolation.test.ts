/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PassportStateIsolationTestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

/**
 * Pure state reducer mimicking PartnersScreen passport form state management.
 */
export interface PassportFormState {
  activePartnerId: string | null;
  passportIntroDraft: string;
  passportPhotoPath: string | null;
  passportPhotoMime: string | null;
  passportPhotoConsent: boolean;
  passportReviewStatus: string;
  passportReviewNote: string | null;
  passportSaving: boolean;
  passportMsg: { type: string; text: string } | null;
  profContactPhone: string;
  profContactEmail: string;
  profContactSaving: boolean;
  profContactMsg: { type: string; text: string } | null;
}

export function createInitialPassportState(): PassportFormState {
  return {
    activePartnerId: null,
    passportIntroDraft: '',
    passportPhotoPath: null,
    passportPhotoMime: null,
    passportPhotoConsent: false,
    passportReviewStatus: 'draft',
    passportReviewNote: null,
    passportSaving: false,
    passportMsg: null,
    profContactPhone: '',
    profContactEmail: '',
    profContactSaving: false,
    profContactMsg: null,
  };
}

export function switchPartnerIdentity(
  state: PassportFormState,
  newPartnerId: string | null,
  authenticatedProfile?: { id: string; contact_phone?: string; contact_email?: string } | null
): PassportFormState {
  const isProfileMatch = authenticatedProfile && authenticatedProfile.id === newPartnerId;

  return {
    ...state,
    activePartnerId: newPartnerId,
    // Mandatory immediate state reset on partner identity change
    passportIntroDraft: '',
    passportPhotoPath: null,
    passportPhotoMime: null,
    passportPhotoConsent: false,
    passportReviewStatus: 'draft',
    passportReviewNote: null,
    passportSaving: false,
    passportMsg: null,
    profContactSaving: false,
    profContactMsg: null,
    profContactPhone: isProfileMatch ? (authenticatedProfile.contact_phone || '') : '',
    profContactEmail: isProfileMatch ? (authenticatedProfile.contact_email || '') : '',
  };
}

export function applyProfileContentFetchResult(
  state: PassportFormState,
  requestPartnerId: string,
  res: {
    success: boolean;
    partner_id?: string;
    content?: {
      intro_draft?: string | null;
      intro_published?: string | null;
      draft_photo_path?: string | null;
      published_photo_path?: string | null;
      draft_photo_mime?: string | null;
      published_photo_mime?: string | null;
      photo_consent_given?: boolean;
      review_status?: string;
      review_note?: string | null;
      draft_contact_phone?: string | null;
      published_contact_phone?: string | null;
      draft_contact_email?: string | null;
      published_contact_email?: string | null;
    } | null;
  },
  authenticatedProfile?: { id: string; public_code: string } | null
): PassportFormState {
  if (state.activePartnerId !== requestPartnerId) {
    return state;
  }

  if (res.success && res.content) {
    const resIdLower = res.partner_id ? res.partner_id.trim().toLowerCase() : '';
    const currIdLower = requestPartnerId ? requestPartnerId.trim().toLowerCase() : '';
    const authIdLower = authenticatedProfile?.id ? authenticatedProfile.id.trim().toLowerCase() : '';
    const authCodeLower = authenticatedProfile?.public_code ? authenticatedProfile.public_code.trim().toLowerCase() : '';

    const isResponseForCurrentPartner =
      !res.partner_id ||
      resIdLower === currIdLower ||
      (authIdLower && resIdLower === authIdLower) ||
      (authCodeLower && resIdLower === authCodeLower);

    if (!isResponseForCurrentPartner) {
      return state;
    }

    return {
      ...state,
      passportIntroDraft: res.content.intro_draft || res.content.intro_published || '',
      passportPhotoPath: res.content.draft_photo_path || res.content.published_photo_path || null,
      passportPhotoMime: res.content.draft_photo_mime || res.content.published_photo_mime || null,
      passportPhotoConsent: res.content.photo_consent_given || false,
      passportReviewStatus: res.content.review_status || 'draft',
      passportReviewNote: res.content.review_note || null,
      profContactPhone: res.content.draft_contact_phone || res.content.published_contact_phone || state.profContactPhone,
      profContactEmail: res.content.draft_contact_email || res.content.published_contact_email || state.profContactEmail,
    };
  }

  // Failed/empty content response maintains clean reset state
  return {
    ...state,
    passportIntroDraft: '',
    passportPhotoPath: null,
    passportPhotoMime: null,
    passportPhotoConsent: false,
    passportReviewStatus: 'draft',
    passportReviewNote: null,
  };
}

export async function runPassportStateIsolationTests(): Promise<PassportStateIsolationTestResult[]> {
  const results: PassportStateIsolationTestResult[] = [];

  const record = (
    testId: string,
    name: string,
    expected: string,
    actual: string,
    passed: boolean
  ) => {
    results.push({ testId, name, expected, actual, passed });
  };

  const uno1Uuid = 'a0000000-0000-0000-0000-000000000091';
  const uno1Code = 'UNO1';
  const uno2Uuid = 'a0000000-0000-0000-0000-000000000092';
  const uno2Code = 'UNO2';

  // TEST A: State is cleared on partner change.
  try {
    let state = createInitialPassportState();
    state = switchPartnerIdentity(state, uno1Uuid);
    state.passportIntroDraft = 'Temporary unpersisted bio for UNO1';
    state.passportPhotoPath = 'temp/uno1.png';

    // Switch to UNO2
    state = switchPartnerIdentity(state, uno2Uuid);

    const isCleared =
      state.passportIntroDraft === '' &&
      state.passportPhotoPath === null &&
      state.activePartnerId === uno2Uuid;

    record(
      'PASSPORT-REHYDRATION-A',
      'State is cleared on partner change',
      'true',
      String(isCleared),
      isCleared
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-A', 'State cleared on partner change', 'true', String(err), false);
  }

  // TEST B: THEN the new partner\'s authoritative biography hydrates.
  try {
    let state = createInitialPassportState();
    state = switchPartnerIdentity(state, uno1Uuid);
    state.passportIntroDraft = 'Stale UNO1 Draft';

    // Switch to UNO2
    state = switchPartnerIdentity(state, uno2Uuid);
    // Apply UNO2 fetch
    state = applyProfileContentFetchResult(state, uno2Uuid, {
      success: true,
      partner_id: uno2Uuid,
      content: {
        intro_published: 'Authoritative UNO2 Tour Guide Biography',
        review_status: 'approved',
      },
    });

    const isHydrated =
      state.passportIntroDraft === 'Authoritative UNO2 Tour Guide Biography' &&
      state.passportReviewStatus === 'approved';

    record(
      'PASSPORT-REHYDRATION-B',
      'THEN the new partner authoritative biography hydrates',
      'Authoritative UNO2 Tour Guide Biography',
      state.passportIntroDraft,
      isHydrated
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-B', 'New partner biography hydrates', 'Authoritative UNO2 Tour Guide Biography', String(err), false);
  }

  // TEST C: Refresh with UNO1 active hydrates UNO1 biography.
  try {
    let state = createInitialPassportState();
    const profileUno1 = { id: uno1Uuid, public_code: uno1Code };
    state = switchPartnerIdentity(state, uno1Uuid, profileUno1);

    // Backend returns public_code 'UNO1' in response payload on refresh
    state = applyProfileContentFetchResult(
      state,
      uno1Uuid,
      {
        success: true,
        partner_id: 'UNO1',
        content: {
          intro_draft: 'UNO1 Licensed Belgrade Guide Official Biography',
          draft_photo_path: 'partner-photos/uno1_official.jpg',
          review_status: 'pending_review',
        },
      },
      profileUno1
    );

    const isUno1Hydrated =
      state.passportIntroDraft === 'UNO1 Licensed Belgrade Guide Official Biography' &&
      state.passportPhotoPath === 'partner-photos/uno1_official.jpg' &&
      state.passportReviewStatus === 'pending_review';

    record(
      'PASSPORT-REHYDRATION-C',
      'Refresh with UNO1 active hydrates UNO1 biography',
      'UNO1 Licensed Belgrade Guide Official Biography',
      state.passportIntroDraft,
      isUno1Hydrated
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-C', 'Refresh with UNO1 active hydrates UNO1 biography', 'UNO1 Licensed Belgrade Guide Official Biography', String(err), false);
  }

  // TEST D: Refresh with UNO2 active hydrates UNO2 biography.
  try {
    let state = createInitialPassportState();
    const profileUno2 = { id: uno2Uuid, public_code: uno2Code };
    state = switchPartnerIdentity(state, uno2Uuid, profileUno2);

    // Backend returns UUID in response payload on refresh
    state = applyProfileContentFetchResult(
      state,
      uno2Uuid,
      {
        success: true,
        partner_id: uno2Uuid,
        content: {
          intro_published: 'UNO2 Uvac Navigators Premier Kayaking Guide',
          published_photo_path: 'partner-photos/uno2_published.png',
          review_status: 'approved',
        },
      },
      profileUno2
    );

    const isUno2Hydrated =
      state.passportIntroDraft === 'UNO2 Uvac Navigators Premier Kayaking Guide' &&
      state.passportPhotoPath === 'partner-photos/uno2_published.png' &&
      state.passportReviewStatus === 'approved';

    record(
      'PASSPORT-REHYDRATION-D',
      'Refresh with UNO2 active hydrates UNO2 biography',
      'UNO2 Uvac Navigators Premier Kayaking Guide',
      state.passportIntroDraft,
      isUno2Hydrated
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-D', 'Refresh with UNO2 active hydrates UNO2 biography', 'UNO2 Uvac Navigators Premier Kayaking Guide', String(err), false);
  }

  // TEST E: null photo path does NOT prevent biography/review-status hydration.
  try {
    let state = createInitialPassportState();
    state = switchPartnerIdentity(state, uno1Uuid);

    state = applyProfileContentFetchResult(state, uno1Uuid, {
      success: true,
      partner_id: uno1Uuid,
      content: {
        intro_draft: 'Biography exists without an attached photo',
        draft_photo_path: null,
        published_photo_path: null,
        review_status: 'changes_requested',
      },
    });

    const isBioHydratedWithNullPhoto =
      state.passportIntroDraft === 'Biography exists without an attached photo' &&
      state.passportPhotoPath === null &&
      state.passportReviewStatus === 'changes_requested';

    record(
      'PASSPORT-REHYDRATION-E',
      'null photo path does NOT prevent biography/review-status hydration',
      'Biography exists without an attached photo',
      state.passportIntroDraft,
      isBioHydratedWithNullPhoto
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-E', 'null photo path does NOT prevent hydration', 'Biography exists without an attached photo', String(err), false);
  }

  // TEST F: late previous-partner response is discarded.
  try {
    let state = createInitialPassportState();
    state = switchPartnerIdentity(state, uno1Uuid);

    // User switches to UNO2 while UNO1 fetch is in flight
    state = switchPartnerIdentity(state, uno2Uuid);

    // Late UNO1 response resolves
    state = applyProfileContentFetchResult(state, uno1Uuid, {
      success: true,
      partner_id: uno1Uuid,
      content: {
        intro_draft: 'LATE STALE UNO1 BIO',
        review_status: 'approved',
      },
    });

    const isDiscarded =
      state.activePartnerId === uno2Uuid &&
      state.passportIntroDraft === '';

    record(
      'PASSPORT-REHYDRATION-F',
      'late previous-partner response is discarded',
      '',
      state.passportIntroDraft,
      isDiscarded
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-F', 'late previous-partner response is discarded', '', String(err), false);
  }

  // TEST G: valid current-partner response is NOT discarded.
  try {
    let state = createInitialPassportState();
    const profileUno1 = { id: uno1Uuid, public_code: uno1Code };
    state = switchPartnerIdentity(state, uno1Uuid, profileUno1);

    // Response has public_code 'UNO1' while request used UUID
    state = applyProfileContentFetchResult(
      state,
      uno1Uuid,
      {
        success: true,
        partner_id: 'UNO1',
        content: {
          intro_draft: 'Valid UNO1 biography matched via public_code',
          review_status: 'approved',
        },
      },
      profileUno1
    );

    const isAccepted = state.passportIntroDraft === 'Valid UNO1 biography matched via public_code';

    record(
      'PASSPORT-REHYDRATION-G',
      'valid current-partner response is NOT discarded when matching public_code or UUID',
      'Valid UNO1 biography matched via public_code',
      state.passportIntroDraft,
      isAccepted
    );
  } catch (err: any) {
    record('PASSPORT-REHYDRATION-G', 'valid current-partner response is NOT discarded', 'Valid UNO1 biography matched via public_code', String(err), false);
  }

  return results;
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runPassportStateIsolationTests().then((results) => {
    console.log('\n--- PASSPORT STATE ISOLATION TEST RESULTS ---');
    let allPassed = true;
    for (const r of results) {
      const status = r.passed ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${r.testId}: ${r.name}`);
      if (!r.passed) {
        allPassed = false;
        console.log(`   Expected: ${r.expected}`);
        console.log(`   Actual:   ${r.actual}`);
      }
    }
    process.exit(allPassed ? 0 : 1);
  });
}
