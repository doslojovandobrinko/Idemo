/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDraftSaveConfirmationMessage } from '../components/studio/utils/saveConfirmation';

export interface SaveConfirmationTestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runSaveConfirmationTests(): Promise<SaveConfirmationTestResult[]> {
  const results: SaveConfirmationTestResult[] = [];

  const record = (
    testId: string,
    name: string,
    expected: string,
    actual: string,
    passed: boolean
  ) => {
    results.push({ testId, name, expected, actual, passed });
  };

  // CONFIRM-01: serverPersisted=true shows "DRAFT SAVED"
  try {
    const feedback = getDraftSaveConfirmationMessage({ serverPersisted: true });
    const passed = feedback.message === 'DRAFT SAVED' && feedback.type === 'success';
    record(
      'CONFIRM-01',
      'serverPersisted=true shows "DRAFT SAVED"',
      'DRAFT SAVED',
      feedback.message,
      passed
    );
  } catch (err: any) {
    record('CONFIRM-01', 'serverPersisted=true shows "DRAFT SAVED"', 'DRAFT SAVED', err?.message || String(err), false);
  }

  // CONFIRM-02: serverPersisted=false and localFallbackPersisted=true shows "DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED"
  try {
    const feedback = getDraftSaveConfirmationMessage({ serverPersisted: false, localFallbackPersisted: true });
    const expectedMsg = 'DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED';
    const passed = feedback.message === expectedMsg && feedback.type === 'error';
    record(
      'CONFIRM-02',
      'serverPersisted=false and localFallbackPersisted=true shows "DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED"',
      expectedMsg,
      feedback.message,
      passed
    );
  } catch (err: any) {
    record(
      'CONFIRM-02',
      'serverPersisted=false and localFallbackPersisted=true shows "DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED"',
      'DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED',
      err?.message || String(err),
      false
    );
  }

  // CONFIRM-03: neither persisted shows "DRAFT SAVE FAILED"
  try {
    const feedback = getDraftSaveConfirmationMessage({ serverPersisted: false, localFallbackPersisted: false });
    const expectedMsg = 'DRAFT SAVE FAILED';
    const passed = feedback.message === expectedMsg && feedback.type === 'error';
    record(
      'CONFIRM-03',
      'neither persisted shows "DRAFT SAVE FAILED"',
      expectedMsg,
      feedback.message,
      passed
    );
  } catch (err: any) {
    record('CONFIRM-03', 'neither persisted shows "DRAFT SAVE FAILED"', 'DRAFT SAVE FAILED', err?.message || String(err), false);
  }

  // CONFIRM-04: plain "DRAFT SAVED" is not shown for local-only fallback
  try {
    const feedback = getDraftSaveConfirmationMessage({ serverPersisted: false, localFallbackPersisted: true });
    const passed = feedback.message !== 'DRAFT SAVED' && feedback.message.startsWith('DRAFT SAVED LOCALLY ONLY');
    record(
      'CONFIRM-04',
      'plain "DRAFT SAVED" is not shown for local-only fallback',
      'Does not equal plain "DRAFT SAVED"',
      `Message: "${feedback.message}"`,
      passed
    );
  } catch (err: any) {
    record('CONFIRM-04', 'plain "DRAFT SAVED" is not shown for local-only fallback', 'Not plain DRAFT SAVED', err?.message || String(err), false);
  }

  return results;
}
