/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IDEMO Web App Badging Service
 * Manages the native OS / PWA Home Screen app badge (navigator.setAppBadge)
 * as well as service worker background badging for unseen responses.
 */

export const badgingService = {
  /**
   * Check if the Web App Badging API is available in the current browser/OS
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'setAppBadge' in navigator;
  },

  /**
   * Update the OS app icon badge with the number of unseen responses
   * @param count Total number of unseen responses (0 to clear)
   */
  async setBadge(count: number): Promise<void> {
    try {
      if (count <= 0) {
        await this.clearBadge();
        return;
      }

      // 1. Direct Web App Badging API (Android PWA, iOS 16.4+ Web App, macOS/Windows PWA)
      if (this.isSupported()) {
        await (navigator as any).setAppBadge(count);
      }

      // 2. Notify active Service Worker to synchronize badge state
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_BADGE',
          count: count
        });
      }
    } catch (err) {
      // Graceful fallback: silently ignore if browser permissions or OS policies restrict badging
      console.debug('[IDEMO Badging] setBadge ignored or not permitted:', err);
    }
  },

  /**
   * Clear the OS app icon badge
   */
  async clearBadge(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }

      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_BADGE'
        });
      }
    } catch (err) {
      console.debug('[IDEMO Badging] clearBadge ignored:', err);
    }
  }
};
