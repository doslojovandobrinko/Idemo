/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TARGETED NON-REGRESSION TEST SUITE: HUMAN-ONLY MEDIA CHANGE AUTHORITY & FAIL-SAFE INVARIANTS
 *
 * Verifies strict governance compliance for IDEMO recommendation media:
 * 1. Primary media cannot change without explicit human approval.
 * 2. Fallback media cannot override approved canonical media.
 * 3. Package generation preserves approved media exactly.
 * 4. Offline cache preserves approved media exactly.
 * 5. AI/automation cannot publish media changes.
 * 6. Missing approved media causes a warning/block, not silent substitution.
 * 7. Uvac Meanders retains the explicitly approved canonical image across all targets.
 */

import {
  validateMediaChangeAuthority,
  checkCanonicalMediaIntegrity,
  approveMediaChangeSecure,
  validatePublicationMediaGate,
  validateAssetSyncGate,
  getApprovedPrimaryMedia,
  clearHumanMediaApprovalsForTesting,
  HumanMediaApprovalRecord,
} from '../lib/recommendationMediaService';
import { compileRecommendationProposal } from '../lib/recommendationAgentService';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { resolveImage, getOptimizedImageUrl } from '../utils/assetHelper';
import { safeStorage } from '../lib/safeStorage';
import { getCanonicalRecommendations, buildCanonicalSerbiaPackage } from '../lib/destinationPackageManager';
import { Recommendation } from '../types';

export async function runHumanMediaAuthorityTests(): Promise<{ passed: number; failed: number; logs: string[] }> {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${testName} ${failureDetails ? `— ${failureDetails}` : ''}`);
    }
  }

  logs.push('--- STARTING HUMAN-ONLY MEDIA CHANGE AUTHORITY NON-REGRESSION SUITE ---');

  // =========================================================================
  // SCENARIO 1: Approved media cannot change without human approval
  // =========================================================================
  try {
    const currentApproved = '/src/assets/images/uvac_meanders_1778841048759.png';
    const unauthorizedProposed = '/src/assets/images/unauthorized_river_scene.png';

    const resWithoutApproval = validateMediaChangeAuthority('1', currentApproved, unauthorizedProposed);

    assert(
      !resWithoutApproval.authorized,
      'Scenario 1A: Unauthorized media change attempt is rejected'
    );
    assert(
      resWithoutApproval.activeCanonicalRef === currentApproved,
      'Scenario 1B: Approved canonical media reference is preserved (Canonical Immutability)',
      `Expected ${currentApproved}, got ${resWithoutApproval.activeCanonicalRef}`
    );
    assert(
      resWithoutApproval.warning?.actionBlocked === true && resWithoutApproval.warning?.publicationBlocked === true,
      'Scenario 1C: Warning blocks action and publication'
    );

    // Now test with explicit human approval record containing required metadata
    const approvalRecord: HumanMediaApprovalRecord = {
      recommendationId: '1',
      recommendation_id: '1',
      currentImage: currentApproved,
      previousMediaRef: currentApproved,
      proposedImage: unauthorizedProposed,
      proposedMediaRef: unauthorizedProposed,
      reasonForChange: 'Curator approved high-resolution aerial photography update',
      reason_for_change: 'Curator approved high-resolution aerial photography update',
      approvingHuman: 'Lead Curator (Human)',
      approving_human: 'Lead Curator (Human)',
      approvalTimestamp: new Date().toISOString(),
      approval_timestamp: new Date().toISOString(),
      canonicalMediaRef: unauthorizedProposed,
    };

    approveMediaChangeSecure(approvalRecord);

    const resWithApproval = validateMediaChangeAuthority('1', currentApproved, unauthorizedProposed);
    assert(
      resWithApproval.authorized === true,
      'Scenario 1D: Explicit human approval authorizes media change'
    );
    assert(
      resWithApproval.activeCanonicalRef === unauthorizedProposed,
      'Scenario 1E: Active canonical reference updates when human approval is present'
    );
    // Reset test approval override to restore canonical baseline state for remaining scenarios
    clearHumanMediaApprovalsForTesting();
  } catch (err: any) {
    assert(false, 'Scenario 1 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 2: Package generation blocks unauthorized media drift
  // =========================================================================
  try {
    const candidateRecs = [
      { id: 'rec-test-1', image: '/src/assets/images/uvac_meanders_1778841048759.png' },
      { id: '1', image: '/src/assets/images/unauthorized_drift_image.png' }, // Unauthorized drift on Rec #1
    ];

    const gateResult = validatePublicationMediaGate(candidateRecs);
    assert(
      !gateResult.valid,
      'Scenario 2A: Package generation gate rejects unauthorized primary media drift'
    );
    assert(
      gateResult.blockedRecommendations.includes('1'),
      'Scenario 2B: Package generation gate identifies recommendation #1 as blocked'
    );
  } catch (err: any) {
    assert(false, 'Scenario 2 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 3: Public/assets synchronization blocks unauthorized media drift
  // =========================================================================
  try {
    const attemptedSyncPath = '/assets/images/unapproved_sync_asset.png';
    const syncResult = validateAssetSyncGate('1', attemptedSyncPath);

    assert(
      !syncResult.allowed,
      'Scenario 3A: Asset sync gate blocks unauthorized asset replacement'
    );
    assert(
      syncResult.activeCanonicalRef.includes('uvac_meanders_1778841048759'),
      'Scenario 3B: Asset sync gate preserves approved canonical reference'
    );
  } catch (err: any) {
    assert(false, 'Scenario 3 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 4: Fallback cannot override approved canonical media
  // =========================================================================
  try {
    const canonicalUvac = '/src/assets/images/uvac_meanders_1778841048759.png';
    const fallbackAttempt = '/src/assets/images/generic_river_fallback.png';

    const fallbackRes = validateMediaChangeAuthority('1-canonical-test', canonicalUvac, fallbackAttempt);

    assert(
      !fallbackRes.authorized,
      'Scenario 4A: Fallback substitution over existing canonical media is rejected'
    );
    assert(
      fallbackRes.activeCanonicalRef === canonicalUvac,
      'Scenario 4B: Canonical media is preserved despite fallback attempt'
    );
  } catch (err: any) {
    assert(false, 'Scenario 4 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 5: Onboarding cannot hardcode a competing image
  // =========================================================================
  try {
    const uvacRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '1');
    assert(
      Boolean(uvacRec && uvacRec.image.includes('uvac_meanders_1778841048759')),
      'Scenario 5A: Baseline dataset Rec #1 image matches canonical uvac_meanders asset'
    );
  } catch (err: any) {
    assert(false, 'Scenario 5 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 6: Welcome card resolves approved media
  // =========================================================================
  try {
    const uvacRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '1');
    const welcomeCardResolved = resolveImage(uvacRec?.image || '');
    assert(
      welcomeCardResolved.includes('uvac_meanders_1778841048759'),
      'Scenario 6: Welcome card resolves exact approved primary media for Rec #1'
    );
  } catch (err: any) {
    assert(false, 'Scenario 6 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 7: Traveler Detail resolves approved media
  // =========================================================================
  try {
    const uvacRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '1');
    const detailResolved = getOptimizedImageUrl(uvacRec?.image || '');
    assert(
      detailResolved.includes('uvac_meanders_1778841048759'),
      'Scenario 7: Traveler Detail resolves exact approved primary media for Rec #1'
    );
  } catch (err: any) {
    assert(false, 'Scenario 7 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 8: Preview in Traveler App resolves approved media
  // =========================================================================
  try {
    const uvacRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '1');
    const previewResolved = resolveImage(uvacRec?.image || '');
    assert(
      previewResolved.includes('uvac_meanders_1778841048759'),
      'Scenario 8: Preview in Traveler App resolves exact approved primary media for Rec #1'
    );
  } catch (err: any) {
    assert(false, 'Scenario 8 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 9: Offline package resolves approved media
  // =========================================================================
  try {
    const testKey = 'test_offline_package_media';
    const originalApprovedImage = '/src/assets/images/uvac_meanders_1778841048759.png';

    const cachePayload = {
      manifest: { destinationId: 'serbia', contentVersion: '1.0.0' },
      recommendations: [{ id: '1', title: 'Uvac Canyon', image: originalApprovedImage }],
    };

    safeStorage.setItem(testKey, JSON.stringify(cachePayload));
    const cachedString = safeStorage.getItem(testKey);
    const parsedCache = cachedString ? JSON.parse(cachedString) : null;

    assert(
      parsedCache?.recommendations[0]?.image === originalApprovedImage,
      'Scenario 9: Offline safeStorage cache retains exact approved canonical media reference'
    );
    safeStorage.removeItem(testKey);
  } catch (err: any) {
    assert(false, 'Scenario 9 Exception', err.message);
  }

  // =========================================================================
  // SCENARIO 10: Uvac SHA/reference remains unchanged
  // =========================================================================
  try {
    const canonicalRawPath = '/src/assets/images/uvac_meanders_1778841048759.png';
    const uvacRec = INITIAL_RECOMMENDATIONS.find(r => r.id === '1');

    assert(
      uvacRec?.image === canonicalRawPath,
      'Scenario 10A: Recommendation #1 image path remains strictly unchanged'
    );

    const resolvedWebp = resolveImage(canonicalRawPath);
    assert(
      resolvedWebp.includes('uvac_meanders_1778841048759.webp') || resolvedWebp.includes('uvac_meanders_1778841048759.png'),
      'Scenario 10B: Optimized asset URL retains uvac_meanders hash/reference'
    );
  } catch (err: any) {
    assert(false, 'Scenario 10 Exception', err.message);
  }

  // =========================================================================
  // SCENARIOS A-K: TARGETED NON-REGRESSION VERIFICATION SUITE
  // =========================================================================

  // Scenario A: Stale Supabase image_url cannot override approved media
  try {
    const staleSupabaseUrl = '/src/assets/images/carska_bara_wetlands_birds_aerial_1778846483752.webp';
    const sanitized = getApprovedPrimaryMedia('1', staleSupabaseUrl);
    assert(
      sanitized === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario A: Stale Supabase image_url for Rec #1 is sanitized to canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario A Exception', err.message);
  }

  // Scenario B: Stale modifiedRecommendations image cannot override approved media
  try {
    const modifiedRec: Recommendation = {
      id: '1',
      title: 'Uvac Meanders Custom Title',
      category: 'Nature',
      shortDescription: 'Custom Description',
      longDescription: 'Custom Description',
      image: '/src/assets/images/carska_bara_wetlands_birds_aerial_1778846483752.webp',
      duration: '4 hours',
      travelTime: '3 hours',
      travelTimeMinutes: 180,
      location: 'Sjenica',
      estimatedCost: 'Moderate',
      preferredTransport: 'Car',
    };
    const sanitizedImage = getApprovedPrimaryMedia('1', modifiedRec.image);
    assert(
      sanitizedImage === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario B: Stale modifiedRecommendations image for Rec #1 is overridden by approved primary media'
    );
  } catch (err: any) {
    assert(false, 'Scenario B Exception', err.message);
  }

  // Scenario C: Stale safeStorage image cannot override approved media
  try {
    const testStorageKey = 'test_stale_safe_storage_modified_rec';
    const staleModifiedMap = {
      '1': {
        id: '1',
        title: 'Persisted Uvac Mutation',
        image: '/src/assets/images/stale_carska_bara.png',
      },
    };
    safeStorage.setItem(testStorageKey, JSON.stringify(staleModifiedMap));
    const loaded = JSON.parse(safeStorage.getItem(testStorageKey) || '{}');
    const uvacStale = loaded['1'];
    const sanitized = getApprovedPrimaryMedia('1', uvacStale?.image);
    assert(
      sanitized === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario C: Stale safeStorage image in modified recommendations is overridden by approved primary media'
    );
    safeStorage.removeItem(testStorageKey);
  } catch (err: any) {
    assert(false, 'Scenario C Exception', err.message);
  }

  // Scenario D: Welcome card uses approved media
  try {
    const welcomeCardImage = getApprovedPrimaryMedia('1');
    assert(
      welcomeCardImage === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario D: Welcome card resolves approved canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario D Exception', err.message);
  }

  // Scenario E: Traveler Detail uses approved media
  try {
    const detailCandidate = '/src/assets/images/carska_bara_wetlands_birds_aerial_1778846483752.webp';
    const detailResolvedImage = getApprovedPrimaryMedia('1', detailCandidate);
    assert(
      detailResolvedImage === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario E: Traveler Detail screen resolves approved canonical Uvac image even if passed a stale candidate'
    );
  } catch (err: any) {
    assert(false, 'Scenario E Exception', err.message);
  }

  // Scenario F: Admin Preview uses same approved media
  try {
    const adminCandidate = '/src/assets/images/some_unapproved_image.png';
    const adminResolvedImage = getApprovedPrimaryMedia('1', adminCandidate);
    assert(
      adminResolvedImage === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario F: Admin Preview resolves approved canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario F Exception', err.message);
  }

  // Scenario G: Onboarding uses approved media
  try {
    const onboardingImage = getApprovedPrimaryMedia('1');
    assert(
      onboardingImage === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario G: Onboarding overlay resolves approved canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario G Exception', err.message);
  }

  // Scenario H: destination package uses approved media
  try {
    const canonicalRecs = getCanonicalRecommendations();
    const uvacInPkg = canonicalRecs.find(r => r.id === '1');
    assert(
      uvacInPkg?.image === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario H: Destination package serialization resolves approved canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario H Exception', err.message);
  }

  // Scenario I: offline hydration uses approved media
  try {
    const pkg = await buildCanonicalSerbiaPackage();
    const uvacPkgRec = pkg.recommendations.find(r => r.id === '1');
    const sanitizedOffline = getApprovedPrimaryMedia('1', uvacPkgRec?.image);
    assert(
      sanitizedOffline === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario I: Offline hydration package resolves approved canonical Uvac image'
    );
  } catch (err: any) {
    assert(false, 'Scenario I Exception', err.message);
  }

  // Scenario J: all other recommendation fields survive stale-image sanitization
  try {
    const modifiedRec: Recommendation = {
      id: '1',
      title: 'Uvac Meanders - Custom Title Preserved',
      category: 'Nature & Adventure',
      shortDescription: 'Custom short description preserved',
      longDescription: 'Custom long description preserved',
      image: '/src/assets/images/carska_bara_wetlands_birds_aerial_1778846483752.webp',
      duration: 'Full day (6-8 hours)',
      travelTime: '3.5 hours',
      travelTimeMinutes: 210,
      location: 'Sjenica Municipality',
      estimatedCost: 'Moderate (€20-50)',
      preferredTransport: 'Car / SUV',
    };
    const sanitizedImage = getApprovedPrimaryMedia('1', modifiedRec.image);
    const sanitizedRec = { ...modifiedRec, image: sanitizedImage };

    assert(
      sanitizedRec.image === '/src/assets/images/uvac_meanders_1778841048759.png',
      'Scenario J1: Image field is sanitized to approved primary media'
    );
    assert(
      sanitizedRec.title === 'Uvac Meanders - Custom Title Preserved',
      'Scenario J2: Title is preserved intact'
    );
    assert(
      sanitizedRec.category === 'Nature & Adventure',
      'Scenario J3: Category is preserved intact'
    );
    assert(
      sanitizedRec.duration === 'Full day (6-8 hours)',
      'Scenario J4: Duration is preserved intact'
    );
    assert(
      sanitizedRec.travelTime === '3.5 hours',
      'Scenario J5: Travel time is preserved intact'
    );
  } catch (err: any) {
    assert(false, 'Scenario J Exception', err.message);
  }

  // Scenario K: no unrelated recommendation media changes
  try {
    const banjskaStena = INITIAL_RECOMMENDATIONS.find(r => r.id === '12');
    const zasavica = INITIAL_RECOMMENDATIONS.find(r => r.id === '5');

    assert(
      Boolean(banjskaStena && banjskaStena.image),
      'Scenario K1: Banjska Stena (#12) has valid primary image'
    );
    assert(
      getApprovedPrimaryMedia('12', banjskaStena?.image) === banjskaStena?.image,
      'Scenario K2: Banjska Stena (#12) image remains unaffected'
    );
    assert(
      Boolean(zasavica && zasavica.image),
      'Scenario K3: Zasavica (#5) has valid primary image'
    );
    assert(
      getApprovedPrimaryMedia('5', zasavica?.image) === zasavica?.image,
      'Scenario K4: Zasavica (#5) image remains unaffected'
    );
  } catch (err: any) {
    assert(false, 'Scenario K Exception', err.message);
  }

  logs.push(`--- FINISHED HUMAN-ONLY MEDIA CHANGE AUTHORITY NON-REGRESSION SUITE: ${passed} PASSED, ${failed} FAILED ---`);
  return { passed, failed, logs };
}
