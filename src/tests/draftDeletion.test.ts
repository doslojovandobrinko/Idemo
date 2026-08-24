/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DRAFT DELETION AUDIT AND FUNCTIONALITY TESTS
 */

import { 
  saveLocalStudioDraft, 
  getLocalStudioDrafts, 
  removeLocalStudioDraft 
} from '../lib/recommendationWorkflowService';
import { Recommendation, Category } from '../types';

export async function runDraftDeletionTests() {
  const results: Array<{ testNumber: number; name: string; expected: string; actual: string; passed: boolean }> = [];

  // TEST D01: Draft Save & Local Retrieval
  {
    const testDraftId = `rec-draft-test-${Date.now()}`;
    const mockDraft: Recommendation = {
      id: testDraftId,
      title: 'Test Draft for Removal',
      category: Category.GASTRONOMY,
      publicationStatus: 'RESEARCH_CANDIDATE',
      shortDescription: 'Temporary test description for draft removal.',
      longDescription: 'Long description for test draft removal.',
      image: '/src/assets/images/distillery_zaric_modern_1778841217471.webp',
      duration: '1-2 hours',
      travelTime: '15 min',
      travelTimeMinutes: 15,
      location: 'Užice, Western Serbia',
      estimatedCost: '$$',
      preferredTransport: 'Car',
    };

    saveLocalStudioDraft(mockDraft);
    const savedDrafts = getLocalStudioDrafts();
    const isSaved = savedDrafts.some(d => d.id === testDraftId);

    results.push({
      testNumber: 1,
      name: 'Unpublished Draft Creation in Local Storage',
      expected: 'Draft present in local storage after save',
      actual: isSaved ? 'DRAFT_PRESENT' : 'DRAFT_MISSING',
      passed: isSaved,
    });

    // TEST D02: Draft Removal Across All Local Keys
    removeLocalStudioDraft(testDraftId);
    const draftsAfterRemoval = getLocalStudioDrafts();
    const isRemoved = !draftsAfterRemoval.some(d => d.id === testDraftId);

    results.push({
      testNumber: 2,
      name: 'Unpublished Draft Removal from All Local Keys',
      expected: 'Draft completely removed from local storage',
      actual: isRemoved ? 'DRAFT_REMOVED' : 'DRAFT_STILL_EXISTS',
      passed: isRemoved,
    });
  }

  return results;
}
