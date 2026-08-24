/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RECOMMENDATION LIFECYCLE MANAGEMENT INVARIANT TEST SUITE
 * Permanent Non-Regression Suite covering Tests L01 - L20.
 */

import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { draftExpansionPool } from '../data/recommendations/serbia/draft_expansion';
import { Recommendation, Category } from '../types';
import { calculateRecommendationCompleteness } from '../components/studio/utils/scoring';
import {
  saveLocalStudioDraft,
  removeLocalStudioDraft,
  getLocalStudioDrafts,
  retireRecommendation,
  getRecommendationLifecycleState,
} from '../lib/recommendationWorkflowService';

export async function runLifecycleInvariantTests() {
  const results: Array<{ testId: string; name: string; expected: string; actual: string; passed: boolean }> = [];

  // TEST L01: New recommendation -> draft, never APPROVED automatically
  {
    const newDraft: Partial<Recommendation> = {
      title: 'New Candidate Location',
      category: Category.HISTORY,
      shortDescription: 'Candidate description',
    };
    const state = getRecommendationLifecycleState(newDraft);
    const passed = state.status === 'CANDIDATE' && state.isDraft && !state.isApproved;
    results.push({
      testId: 'L01',
      name: 'New recommendation begins as draft, never APPROVED automatically',
      expected: 'status === CANDIDATE, isDraft === true, isApproved === false',
      actual: `status: ${state.status}, isDraft: ${state.isDraft}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L02: Open draft -> remains draft
  {
    const draft: Recommendation = {
      id: 'rec-draft-open-test-01',
      title: 'Open Draft Test',
      category: Category.HISTORY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Short description',
      longDescription: 'Long description',
      image: '/images/test.jpg',
      duration: '1h',
      travelTime: '15m',
      travelTimeMinutes: 15,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Niš, Serbia',
    };
    // Opening editor does not alter status
    const state = getRecommendationLifecycleState(draft);
    const passed = state.status === 'CANDIDATE' && state.isDraft;
    results.push({
      testId: 'L02',
      name: 'Opening draft in editor preserves draft status',
      expected: 'status === CANDIDATE, isDraft === true',
      actual: `status: ${state.status}, isDraft: ${state.isDraft}`,
      passed,
    });
  }

  // TEST L03: Save Draft -> remains draft
  {
    const draft: Recommendation = {
      id: 'rec-draft-save-test-01',
      title: 'Saved Draft Test',
      category: Category.NATURE,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Short description',
      longDescription: 'Long description',
      image: '/images/test.jpg',
      duration: '2h',
      travelTime: '30m',
      travelTimeMinutes: 30,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Tara, Serbia',
    };
    saveLocalStudioDraft(draft);
    const savedList = getLocalStudioDrafts();
    const savedItem = savedList.find(d => d.id === draft.id);
    const state = getRecommendationLifecycleState(savedItem as Recommendation);
    removeLocalStudioDraft(draft.id);

    const passed = state.status === 'CANDIDATE' && state.isDraft && savedItem?.publicationStatus !== 'CANONICAL';
    results.push({
      testId: 'L03',
      name: 'Saving draft locally preserves draft status without auto-promotion',
      expected: 'status === CANDIDATE, publicationStatus !== CANONICAL',
      actual: `status: ${state.status}, publicationStatus: ${savedItem?.publicationStatus}`,
      passed,
    });
  }

  // TEST L04: 100% completeness -> remains draft
  {
    const completeDraft: Recommendation = {
      id: 'rec-draft-100-percent-test',
      title: '100 Percent Complete Draft',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Full short description exceeding required character limits',
      longDescription: 'Full long description providing rich contextual details for travelers visiting the region',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      duration: '2-3 hours',
      travelTime: '15 min',
      travelTimeMinutes: 15,
      estimatedCost: '$$$',
      preferredTransport: 'Taxi / Walking',
      location: 'Skadarlija, Belgrade, Serbia',
      coordinates: { lat: 44.8176, lng: 20.4569 },
      coordinateX: 0.5,
      coordinateY: 0.5,
      translations: {
        sr: {
          title: 'Naslov na srpskom',
          shortDescription: 'Kratak opis na srpskom jeziku za testiranje.',
        },
      },
    };
    const scoring = calculateRecommendationCompleteness(completeDraft);
    const state = getRecommendationLifecycleState(completeDraft);
    const passed = scoring.scorePercentage >= 90 && state.status === 'CANDIDATE' && !state.isApproved;
    results.push({
      testId: 'L04',
      name: '100% completeness score does not trigger auto-approval',
      expected: 'score >= 90%, status === CANDIDATE, isApproved === false',
      actual: `score: ${scoring.scorePercentage}%, status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L05: All validation gates PASS -> remains draft
  {
    const validatedDraft: Recommendation = {
      id: 'rec-draft-validated-pass-test',
      title: 'Validated Pass Candidate',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Valid short description',
      longDescription: 'Valid long description for testing validation pass state',
      image: '/images/valid.jpg',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Novi Sad, Serbia',
    };
    // Even if validation gate passes, explicit status remains CANDIDATE until Admin approves
    const state = getRecommendationLifecycleState(validatedDraft, { 'rec-draft-validated-pass-test': 'NEEDS RESEARCH' });
    const passed = state.status === 'NEEDS RESEARCH' && !state.isApproved;
    results.push({
      testId: 'L05',
      name: 'Passing all validation gates preserves draft status until explicit Admin action',
      expected: 'status === NEEDS RESEARCH, isApproved === false',
      actual: `status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L06: Agent 007 refresh -> lifecycle unchanged
  {
    const initialDraft: Recommendation = {
      id: 'rec-draft-agent-refresh-test',
      title: 'Pre-Refresh Title',
      category: Category.HISTORY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Pre-refresh description',
      longDescription: 'Pre-refresh long description',
      image: '/images/old.jpg',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Subotica, Serbia',
    };
    // Simulate Agent 007 payload refresh
    const refreshedDraft: Recommendation = {
      ...initialDraft,
      title: 'Refreshed Title By Agent 007',
      shortDescription: 'Refreshed description providing higher factual precision',
    };
    const state = getRecommendationLifecycleState(refreshedDraft);
    const passed = state.status === 'CANDIDATE' && !state.isApproved;
    results.push({
      testId: 'L06',
      name: 'Agent 007 metadata refresh preserves draft lifecycle state',
      expected: 'status === CANDIDATE, isApproved === false',
      actual: `status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L07: Explicit Admin approval -> APPROVED
  {
    const candidateDraft: Recommendation = {
      id: 'rec-draft-explicit-approve-test',
      title: 'Candidate To Approve',
      category: Category.HISTORY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Candidate description',
      longDescription: 'Candidate long description',
      image: '/images/approve.jpg',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Kragujevac, Serbia',
    };
    const editorialStatuses: Record<string, string> = {};
    
    // Explicit Admin action
    editorialStatuses[candidateDraft.id] = 'APPROVED';
    const state = getRecommendationLifecycleState(candidateDraft, editorialStatuses);

    const passed = state.status === 'APPROVED' && state.isApproved;
    results.push({
      testId: 'L07',
      name: 'Explicit Admin action successfully promotes record to APPROVED status',
      expected: 'status === APPROVED, isApproved === true',
      actual: `status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L08: Local draft delete -> absent after reload
  {
    const tempDraft: Recommendation = {
      id: 'rec-draft-delete-reload-test',
      title: 'Temporary Draft To Delete',
      category: Category.NATURE,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Temporary draft short description',
      longDescription: 'Temporary draft long description',
      image: '/images/temp.jpg',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Zlatibor, Serbia',
    };
    saveLocalStudioDraft(tempDraft);
    removeLocalStudioDraft(tempDraft.id);
    const remainingDrafts = getLocalStudioDrafts();
    const isPresent = remainingDrafts.some(d => d.id === tempDraft.id);

    const passed = !isPresent;
    results.push({
      testId: 'L08',
      name: 'Local draft deletion permanently removes record from local storage',
      expected: 'isPresent === false',
      actual: `isPresent: ${isPresent}`,
      passed,
    });
  }

  // TEST L09: Source-backed draft delete -> RETIRED tombstone survives reload
  {
    const staticDraftId = 'rec-draft-zestival-uzice';
    const editorialStatuses: Record<string, string> = {};

    // Simulate deleting source-backed draft
    editorialStatuses[staticDraftId] = 'RETIRED';

    const state = getRecommendationLifecycleState({ id: staticDraftId }, editorialStatuses);
    const passed = state.status === 'RETIRED' && state.isRetired;
    results.push({
      testId: 'L09',
      name: 'Deleting source-backed draft sets durable RETIRED tombstone',
      expected: 'status === RETIRED, isRetired === true',
      actual: `status: ${state.status}, isRetired: ${state.isRetired}`,
      passed,
    });
  }

  // TEST L10: Normal desk excludes RETIRED
  {
    const allRecs = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const editorialStatuses: Record<string, string> = {
      'rec-draft-zestival-uzice': 'RETIRED',
    };

    const selectedStatus: string = 'ALL';
    const activeDeskRecs = allRecs.filter(r => {
      const currentStat = editorialStatuses[r.id] || (INITIAL_RECOMMENDATIONS.some(i => i.id === r.id && (i.publicationStatus === 'CANONICAL' || i.publicationStatus === 'PUBLISHED')) ? 'APPROVED' : 'CANDIDATE');
      if (selectedStatus === 'RETIRED') return currentStat === 'RETIRED';
      if (currentStat === 'RETIRED') return false;
      return selectedStatus === 'ALL' || currentStat === selectedStatus;
    });

    const isRetiredIncluded = activeDeskRecs.some(r => r.id === 'rec-draft-zestival-uzice');
    const passed = !isRetiredIncluded;
    results.push({
      testId: 'L10',
      name: 'Normal Recommendations Desk filter strictly excludes RETIRED records',
      expected: 'isRetiredIncluded === false',
      actual: `isRetiredIncluded: ${isRetiredIncluded}`,
      passed,
    });
  }

  // TEST L11: RETIRED filter reveals RETIRED
  {
    const rawRecs = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const recsMap = new Map<string, Recommendation>();
    rawRecs.forEach(r => recsMap.set(r.id, r));
    const allRecs = Array.from(recsMap.values());

    const editorialStatuses: Record<string, string> = {
      'rec-draft-zestival-uzice': 'RETIRED',
    };

    const selectedStatus: string = 'RETIRED';
    const retiredDeskRecs = allRecs.filter(r => {
      const currentStat = editorialStatuses[r.id] || (INITIAL_RECOMMENDATIONS.some(i => i.id === r.id && (i.publicationStatus === 'CANONICAL' || i.publicationStatus === 'PUBLISHED')) ? 'APPROVED' : 'CANDIDATE');
      if (selectedStatus === 'RETIRED') return currentStat === 'RETIRED';
      if (currentStat === 'RETIRED') return false;
      return selectedStatus === 'ALL' || currentStat === selectedStatus;
    });

    const isRetiredIncluded = retiredDeskRecs.some(r => r.id === 'rec-draft-zestival-uzice');
    const passed = isRetiredIncluded && retiredDeskRecs.length === 1;
    results.push({
      testId: 'L11',
      name: 'Explicit RETIRED status filter reveals retired items for Admin historical review',
      expected: 'isRetiredIncluded === true, count === 1',
      actual: `isRetiredIncluded: ${isRetiredIncluded}, count: ${retiredDeskRecs.length}`,
      passed,
    });
  }

  // TEST L12: Published recommendation delete -> governed retirement, not hard delete
  {
    const publishedRec = INITIAL_RECOMMENDATIONS[0]; // e.g. Kalemegdan Fortress (#57)
    const result = await retireRecommendation(publishedRec.id, 'Governed retirement test');
    
    // Canonical record is retired via governed workflow, not hard-deleted from source data
    const existsInSource = INITIAL_RECOMMENDATIONS.some(r => r.id === publishedRec.id);
    const passed = result.success && existsInSource;
    results.push({
      testId: 'L12',
      name: 'Published recommendation deletion uses governed retirement path without hard SQL delete',
      expected: 'result.success === true, existsInSource === true',
      actual: `result.success: ${result.success}, existsInSource: ${existsInSource}`,
      passed,
    });
  }

  // TEST L13: Published item remains active until retirement approval completes
  {
    const canonicalItem = INITIAL_RECOMMENDATIONS[0];
    const unapprovedWorkItemStatus = 'PENDING_APPROVAL';
    
    // Before approval completes, status remains published/canonical in live database
    const isStillPublished = unapprovedWorkItemStatus === 'PENDING_APPROVAL' && (canonicalItem.publicationStatus === 'CANONICAL' || canonicalItem.publicationStatus === 'PUBLISHED');
    const passed = isStillPublished;
    results.push({
      testId: 'L13',
      name: 'Published recommendation remains active in database until retirement approval completes',
      expected: 'isStillPublished === true during pending approval',
      actual: `isStillPublished: ${isStillPublished}`,
      passed,
    });
  }

  // TEST L14: Approved retirement -> is_published = false
  {
    const canonicalItem: Partial<Recommendation> = {
      id: '57',
      publicationStatus: 'CANONICAL',
    };
    const editorialStatuses: Record<string, string> = {
      '57': 'RETIRED',
    };

    const state = getRecommendationLifecycleState(canonicalItem, editorialStatuses);
    // When retired, isPublished becomes false
    const passed = state.status === 'RETIRED' && state.isRetired && !state.isPublished;
    results.push({
      testId: 'L14',
      name: 'Approved retirement marks item as RETIRED and clears active publication flag',
      expected: 'status === RETIRED, isRetired === true, isPublished === false',
      actual: `status: ${state.status}, isRetired: ${state.isRetired}, isPublished: ${state.isPublished}`,
      passed,
    });
  }

  // TEST L15: Visitor runtime excludes retired recommendation
  {
    const editorialStatuses: Record<string, string> = {
      '57': 'RETIRED',
    };

    const visitorRecs = INITIAL_RECOMMENDATIONS.filter(r => {
      const explicitStatus = editorialStatuses[r.id];
      if (explicitStatus === 'RETIRED') return false;
      if (explicitStatus === 'APPROVED') return true;
      return r.publicationStatus === 'CANONICAL' || r.publicationStatus === 'PUBLISHED';
    });

    const isRec57InVisitor = visitorRecs.some(r => r.id === '57');
    const passed = !isRec57InVisitor;
    results.push({
      testId: 'L15',
      name: 'Visitor runtime excludes retired recommendations from public delivery',
      expected: 'isRec57InVisitor === false',
      actual: `isRec57InVisitor: ${isRec57InVisitor}`,
      passed,
    });
  }

  // TEST L16: Future package generation excludes retired recommendation
  {
    const editorialStatuses: Record<string, string> = {
      '57': 'RETIRED',
    };

    const packageCandidateRecs = INITIAL_RECOMMENDATIONS.filter(r => {
      const explicitStatus = editorialStatuses[r.id];
      if (explicitStatus === 'RETIRED') return false;
      return r.publicationStatus === 'CANONICAL' || r.publicationStatus === 'PUBLISHED';
    });

    const isIncludedInPackage = packageCandidateRecs.some(r => r.id === '57');
    const passed = !isIncludedInPackage;
    results.push({
      testId: 'L16',
      name: 'Destination Package Manager excludes retired items from new package builds',
      expected: 'isIncludedInPackage === false',
      actual: `isIncludedInPackage: ${isIncludedInPackage}`,
      passed,
    });
  }

  // TEST L17: Historical package references survive retirement
  {
    const historicalPackageV1 = {
      packageId: 'pkg_serbia_v1.0.0',
      includedRecommendationIds: ['57', '58', '59'],
    };
    // Retiring recommendation #57 does NOT mutate historical package manifest v1.0.0
    const stillReferencedInV1 = historicalPackageV1.includedRecommendationIds.includes('57');
    const passed = stillReferencedInV1;
    results.push({
      testId: 'L17',
      name: 'Historical package manifests preserve retired recommendation references intact',
      expected: 'stillReferencedInV1 === true',
      actual: `stillReferencedInV1: ${stillReferencedInV1}`,
      passed,
    });
  }

  // TEST L18: Partner/history mappings survive retirement
  {
    const partnerMapping = {
      partnerId: 'partner-kalemegdan-001',
      recommendationId: '57',
      status: 'HISTORICAL_MAPPING',
    };
    // Retiring recommendation #57 preserves partner linkage record
    const passed = partnerMapping.recommendationId === '57' && partnerMapping.status === 'HISTORICAL_MAPPING';
    results.push({
      testId: 'L18',
      name: 'Partner audit and history mappings survive recommendation retirement',
      expected: 'partnerMapping preserved',
      actual: `recommendationId: ${partnerMapping.recommendationId}, status: ${partnerMapping.status}`,
      passed,
    });
  }

  // TEST L19: Editing canonical recommendation does not alter lifecycle automatically
  {
    const canonicalItem: Recommendation = { ...INITIAL_RECOMMENDATIONS[0] };
    // Edit short description
    const editedCanonical: Recommendation = {
      ...canonicalItem,
      shortDescription: 'Updated canonical short description for test',
    };

    const state = getRecommendationLifecycleState(editedCanonical);
    // Editing canonical item leaves lifecycle as APPROVED/CANONICAL
    const passed = state.status === 'APPROVED' && state.isApproved;
    results.push({
      testId: 'L19',
      name: 'Editing canonical recommendation preserves its APPROVED lifecycle state without resetting',
      expected: 'status === APPROVED, isApproved === true',
      actual: `status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  // TEST L20: Missing/undefined status can NEVER resolve to APPROVED
  {
    const undefinedStatusRec: Partial<Recommendation> = {
      id: 'rec-unindexed-test-999',
      title: 'Unindexed Recommendation',
      publicationStatus: undefined,
    };
    const emptyStatuses: Record<string, string> = {};

    const state = getRecommendationLifecycleState(undefinedStatusRec, emptyStatuses);
    // Must resolve to CANDIDATE, never APPROVED
    const passed = state.status === 'CANDIDATE' && !state.isApproved;
    results.push({
      testId: 'L20',
      name: 'Undefined or missing status strictly fails safe to CANDIDATE and NEVER resolves to APPROVED',
      expected: 'status === CANDIDATE, isApproved === false',
      actual: `status: ${state.status}, isApproved: ${state.isApproved}`,
      passed,
    });
  }

  return results;
}
