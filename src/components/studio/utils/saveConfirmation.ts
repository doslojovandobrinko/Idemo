/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SaveConfirmationFeedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

export function getDraftSaveConfirmationMessage(res: {
  serverPersisted?: boolean;
  localFallbackPersisted?: boolean;
  message?: string;
  error?: string;
}): SaveConfirmationFeedback {
  if (res.serverPersisted === true) {
    return {
      type: 'success',
      message: 'DRAFT SAVED',
    };
  }

  if (res.localFallbackPersisted === true) {
    return {
      type: 'error',
      message: 'DRAFT SAVED LOCALLY ONLY — SERVER SAVE FAILED',
    };
  }

  return {
    type: 'error',
    message: 'DRAFT SAVE FAILED',
  };
}
