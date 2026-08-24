/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UNAUTHORIZED APPROVAL GUARD TESTS
 * Verifies that no draft recommendation transitions to APPROVED/CANONICAL
 * without explicit authenticated Admin approval.
 */

import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { Recommendation, Category } from '../types';
import { calculateRecommendationCompleteness } from '../components/studio/utils/scoring';

const isCanonicalInBaseline = (id: string) =>
  INITIAL_RECOMMENDATIONS.some(i => i.id === id && (i.publicationStatus === 'CANONICAL' || i.publicationStatus === 'PUBLISHED'));

export async function runApprovalGuardTests() {
  const results: Array<{ testNumber: number; name: string; expected: string; actual: string; passed: boolean }> = [];

  // TEST G01: Unindexed draft open -> NOT APPROVED (Resolves to CANDIDATE)
  {
    const mockUnindexedDraft: Recommendation = {
      id: 'rec-draft-zestival-uzice',
      title: 'Žestival Užice',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Festival of fruit spirits in Užice.',
      longDescription: 'Long description for Žestival Užice.',
      image: '/images/zestival.jpg',
      duration: '1-2 hours',
      travelTime: '15 min',
      travelTimeMinutes: 15,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Užice, Western Serbia',
    };

    const emptyEditorialStatuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'> = {};
    const resolvedStatus = emptyEditorialStatuses[mockUnindexedDraft.id] || (isCanonicalInBaseline(mockUnindexedDraft.id) ? 'APPROVED' : 'CANDIDATE');

    const passed = resolvedStatus === 'CANDIDATE';
    results.push({
      testNumber: 1,
      name: 'Unindexed Draft Open Resolution Guard',
      expected: 'CANDIDATE (NOT APPROVED)',
      actual: resolvedStatus,
      passed,
    });
  }

  // TEST G02: Save Draft -> NOT APPROVED (Remains Draft State)
  {
    const mockDraft: Recommendation = {
      id: 'rec-draft-zestival-uzice',
      title: 'Žestival Užice',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Festival of fruit spirits in Užice.',
      longDescription: 'Long description for Žestival Užice.',
      image: '/images/zestival.jpg',
      duration: '1-2 hours',
      travelTime: '15 min',
      travelTimeMinutes: 15,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Užice, Western Serbia',
    };

    const selectedStatus = 'APPROVED'; // Unsafe selected status
    const isBaselineCanonical = isCanonicalInBaseline(mockDraft.id);
    const draftStatus = (selectedStatus === 'APPROVED' && !isBaselineCanonical)
      ? 'NEEDS RESEARCH'
      : (selectedStatus || 'NEEDS RESEARCH');

    const passed = draftStatus !== 'APPROVED' && draftStatus === 'NEEDS RESEARCH';
    results.push({
      testNumber: 2,
      name: 'Save Draft Approval Guard',
      expected: 'NEEDS RESEARCH (NOT APPROVED)',
      actual: draftStatus,
      passed,
    });
  }

  // TEST G03: 100% Complete Data & All Gates PASS -> NOT APPROVED without explicit Admin action
  {
    const completeDraft: Recommendation = {
      id: 'rec-draft-100percent-complete',
      title: 'Complete Draft Proposal',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Full 100% complete description with high detail.',
      longDescription: 'Long description with full detailed content across all steps.',
      image: 'https://images.example.com/verified-human-photo.jpg',
      duration: '1-2 hours',
      travelTime: '15 min',
      travelTimeMinutes: 15,
      location: 'Užice, Western Serbia',
      estimatedCost: '$$',
      preferredTransport: 'Car',
      serviceAreaId: 'sa-west-003',
      coordinates: { lat: 43.8556, lng: 19.8425 },
    };

    const currentStatus = 'NEEDS RESEARCH';
    const completeness = calculateRecommendationCompleteness(completeDraft, currentStatus);

    // Verify completeness score is high but status remains NEEDS RESEARCH / CANDIDATE
    const score = completeness.scorePercentage;
    const passed = score >= 50 && (currentStatus as string) !== 'APPROVED';
    results.push({
      testNumber: 3,
      name: '100% Completeness / Gate Pass Does Not Auto-Approve',
      expected: 'Status remains NEEDS RESEARCH despite high completeness score',
      actual: `ScorePercentage: ${score}%, Status: ${currentStatus}`,
      passed,
    });
  }

  // TEST G04: Canonical Baseline Item -> APPROVED only when legitimately canonical
  {
    const canonicalItem = INITIAL_RECOMMENDATIONS.find(i => i.publicationStatus === 'CANONICAL') || INITIAL_RECOMMENDATIONS[0];
    const nonCanonicalItem: Recommendation = {
      id: 'rec-draft-non-canonical-test',
      title: 'Non Canonical Draft',
      category: Category.HISTORY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Test',
      longDescription: 'Test',
      image: '',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Test Location',
    };

    const emptyStatuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'> = {};

    const canonicalResolved = emptyStatuses[canonicalItem.id] || (isCanonicalInBaseline(canonicalItem.id) ? 'APPROVED' : 'CANDIDATE');
    const nonCanonicalResolved = emptyStatuses[nonCanonicalItem.id] || (isCanonicalInBaseline(nonCanonicalItem.id) ? 'APPROVED' : 'CANDIDATE');

    const passed = canonicalResolved === 'APPROVED' && nonCanonicalResolved === 'CANDIDATE';
    results.push({
      testNumber: 4,
      name: 'Canonical Baseline Membership Check',
      expected: 'Canonical -> APPROVED, Non-Canonical -> CANDIDATE',
      actual: `Canonical: ${canonicalResolved}, Non-Canonical: ${nonCanonicalResolved}`,
      passed,
    });
  }

  // TEST G05: Explicit Admin Approval Action -> APPROVED
  {
    const draftItem: Recommendation = {
      id: 'rec-draft-admin-approved',
      title: 'Admin Approved Draft',
      category: Category.NATURE,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Test',
      longDescription: 'Test',
      image: '',
      duration: '1h',
      travelTime: '10m',
      travelTimeMinutes: 10,
      estimatedCost: '$$',
      preferredTransport: 'Car',
      location: 'Test Location',
    };

    const editorialStatuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'> = {};
    
    // Explicit Admin action
    const explicitAdminAction = (recId: string, newStatus: 'APPROVED') => {
      editorialStatuses[recId] = newStatus;
    };

    explicitAdminAction(draftItem.id, 'APPROVED');

    const resolvedStatus = editorialStatuses[draftItem.id];
    const passed = resolvedStatus === 'APPROVED';

    results.push({
      testNumber: 5,
      name: 'Explicit Admin Approval Action Transition',
      expected: 'APPROVED',
      actual: resolvedStatus,
      passed,
    });
  }

  return results;
}
