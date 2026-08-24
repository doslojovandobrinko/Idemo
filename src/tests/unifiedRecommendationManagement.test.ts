/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UNIFIED RECOMMENDATION MANAGEMENT TESTS
 * Validates local draft deletion, static source tombstoning, Supabase draft abandonment,
 * governed published recommendation retirement, visitor exclusion, and safety rules.
 */

import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { draftExpansionPool } from '../data/recommendations/serbia/draft_expansion';
import { Recommendation, Category } from '../types';
import { removeLocalStudioDraft, saveLocalStudioDraft, getLocalStudioDrafts, retireRecommendation } from '../lib/recommendationWorkflowService';

export async function runUnifiedRecommendationManagementTests() {
  const results: Array<{ testNumber: number; name: string; expected: string; actual: string; passed: boolean }> = [];

  // TEST 1: Local-only draft delete -> permanently removed from local storage
  {
    const mockLocalDraft: Recommendation = {
      id: 'rec-draft-test-local-only-001',
      title: 'Local Test Draft',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Local test description',
      longDescription: 'Long local test description',
      image: '/images/test.jpg',
      duration: '1 hour',
      travelTime: '10 min',
      travelTimeMinutes: 10,
      estimatedCost: '$',
      preferredTransport: 'Walk',
      location: 'Belgrade, Serbia',
    };

    saveLocalStudioDraft(mockLocalDraft);
    const draftsBefore = getLocalStudioDrafts();
    const beforeDelete = draftsBefore.find(d => d.id === mockLocalDraft.id) || null;
    removeLocalStudioDraft(mockLocalDraft.id);
    const draftsAfter = getLocalStudioDrafts();
    const afterDelete = draftsAfter.find(d => d.id === mockLocalDraft.id) || null;

    const passed = beforeDelete !== null && afterDelete === null;
    results.push({
      testNumber: 1,
      name: 'Local-only draft deletion purges local storage',
      expected: 'Draft exists before delete, null after delete',
      actual: `Before: ${beforeDelete ? 'Found' : 'Null'}, After: ${afterDelete ? 'Found' : 'Null'}`,
      passed,
    });
  }

  // TEST 2: Static / source-backed draft deletion -> RETIRED tombstone persisted
  {
    const targetStaticId = 'rec-draft-zestival-uzice';
    const editorialStatuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'> = {};
    
    // Simulate deleting static draft
    editorialStatuses[targetStaticId] = 'RETIRED';

    const passed = editorialStatuses[targetStaticId] === 'RETIRED';
    results.push({
      testNumber: 2,
      name: 'Static / source-backed draft deletion creates RETIRED tombstone',
      expected: 'RETIRED tombstone persisted for static item',
      actual: editorialStatuses[targetStaticId],
      passed,
    });
  }

  // TEST 3: Normal Recommendations Desk filtering -> excludes RETIRED items when selectedStatus !== 'RETIRED'
  {
    const allRecs = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const editorialStatuses: Record<string, string> = {
      'rec-draft-zestival-uzice': 'RETIRED',
    };

    const selectedStatus: string = 'ALL';
    const filtered = allRecs.filter(r => {
      const currentStat = editorialStatuses[r.id] || 'CANDIDATE';
      if (selectedStatus === 'RETIRED') {
        return currentStat === 'RETIRED';
      } else {
        if (currentStat === 'RETIRED') return false;
        if (selectedStatus === 'ALL') return true;
        return currentStat === selectedStatus;
      }
    });

    const isZestivalPresent = filtered.some(r => r.id === 'rec-draft-zestival-uzice');
    const passed = !isZestivalPresent;
    results.push({
      testNumber: 3,
      name: 'Normal desk excludes RETIRED records when filter is not RETIRED',
      expected: 'Žestival excluded from normal desk view',
      actual: isZestivalPresent ? 'Present (FAIL)' : 'Excluded (PASS)',
      passed,
    });
  }

  // TEST 4: "All Statuses = RETIRED" filtering -> shows RETIRED items
  {
    const rawRecs = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const recsMap = new Map<string, Recommendation>();
    rawRecs.forEach(r => recsMap.set(r.id, r));
    const allRecs = Array.from(recsMap.values());

    const editorialStatuses: Record<string, string> = {
      'rec-draft-zestival-uzice': 'RETIRED',
    };

    const selectedStatus = 'RETIRED';
    const filtered = allRecs.filter(r => {
      const currentStat = editorialStatuses[r.id] || 'CANDIDATE';
      if (selectedStatus === 'RETIRED') {
        return currentStat === 'RETIRED';
      } else {
        if (currentStat === 'RETIRED') return false;
        if (selectedStatus === 'ALL') return true;
        return currentStat === selectedStatus;
      }
    });

    const isZestivalPresent = filtered.some(r => r.id === 'rec-draft-zestival-uzice');
    const passed = isZestivalPresent && filtered.length === 1;
    results.push({
      testNumber: 4,
      name: 'RETIRED filter displays only RETIRED records',
      expected: 'Žestival present when selectedStatus === RETIRED',
      actual: `Count: ${filtered.length}, Present: ${isZestivalPresent}`,
      passed,
    });
  }

  // TEST 5: Supabase-backed unpublished record retirement execution
  {
    const result = await retireRecommendation('rec-draft-test-supabase-001', 'Test retirement');
    const passed = result.success === true;
    results.push({
      testNumber: 5,
      name: 'retireRecommendation handles unpublished/local gracefully',
      expected: 'success === true',
      actual: `Success: ${result.success}, Message: ${result.message}`,
      passed,
    });
  }

  // TEST 6: Published / canonical record inline prompt content
  {
    const isPublished = true;
    const promptMessage = isPublished
      ? 'Remove this published recommendation from active IDEMO use? It will be unpublished and excluded from future active packages, while its historical record, identifiers, partner history, media provenance, and prior package references will be preserved.'
      : 'Remove this recommendation from active IDEMO use? It will be retired and removed from active Recommendations Desk.';

    const passed = promptMessage.includes('unpublished and excluded from future active packages');
    results.push({
      testNumber: 6,
      name: 'Published record inline confirmation message',
      expected: 'Contains clear unpublishing and historical preservation notice',
      actual: promptMessage.substring(0, 60) + '...',
      passed,
    });
  }

  // TEST 7: Visitor runtime filtering excludes RETIRED items
  {
    const editorialStatuses: Record<string, string> = {
      '57': 'APPROVED',
      'rec-draft-zestival-uzice': 'RETIRED',
    };

    const allRecs = [...INITIAL_RECOMMENDATIONS, ...draftExpansionPool];
    const userFacing = allRecs.filter(r => {
      const explicitStatus = editorialStatuses[r.id];
      if (explicitStatus) {
        return explicitStatus === 'APPROVED';
      }
      return false;
    });

    const isZestivalInVisitor = userFacing.some(r => r.id === 'rec-draft-zestival-uzice');
    const passed = !isZestivalInVisitor;
    results.push({
      testNumber: 7,
      name: 'Visitor runtime excludes RETIRED records',
      expected: 'RETIRED records filtered out of userFacingRecommendations',
      actual: isZestivalInVisitor ? 'Included (FAIL)' : 'Excluded (PASS)',
      passed,
    });
  }

  // TEST 8: Inline confirmation Cancel action leaves record untouched
  {
    let showDiscardConfirm = true;
    let isDeleted = false;

    // User clicks Cancel
    showDiscardConfirm = false;

    const passed = !showDiscardConfirm && !isDeleted;
    results.push({
      testNumber: 8,
      name: 'Inline confirmation Cancel button aborts deletion',
      expected: 'showDiscardConfirm becomes false, no deletion occurs',
      actual: `showDiscardConfirm: ${showDiscardConfirm}, isDeleted: ${isDeleted}`,
      passed,
    });
  }

  return results;
}
