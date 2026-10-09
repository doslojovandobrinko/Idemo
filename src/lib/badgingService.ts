/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IDEMO Web App Badging Service
 * Manages the native OS / PWA Home Screen app badge (navigator.setAppBadge)
 * as well as service worker background badging for unseen responses.
 */

let defaultFaviconHref: string | null = null;

function updateFaviconBadge(hasBadge: boolean): void {
  if (typeof document === 'undefined') return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (!defaultFaviconHref) {
      defaultFaviconHref = link.href || '/favicon.svg';
    }

    if (!hasBadge) {
      if (link.href !== defaultFaviconHref) {
        link.href = defaultFaviconHref;
      }
      return;
    }

    // Lightweight 32x32 canvas for browser tab favicon badge
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, 32, 32);
        // Draw crisp red notification badge dot in upper-right quadrant
        ctx.beginPath();
        ctx.arc(24, 8, 6.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#E53E3E'; // IDEMO accent-red
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        link!.href = canvas.toDataURL('image/png');
      } catch {
        // Safe fallback if cross-origin tainted
      }
    };
    img.onerror = () => {
      // Fallback: draw minimal clean branded emblem with notification badge
      try {
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#23251E';
        ctx.fill();
        // Red badge dot
        ctx.beginPath();
        ctx.arc(24, 8, 6.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#E53E3E';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        link!.href = canvas.toDataURL('image/png');
      } catch {}
    };
    img.src = defaultFaviconHref;
  } catch (err) {
    console.debug('[IDEMO Badging] Favicon badge update ignored:', err);
  }
}

export const badgingService = {
  /**
   * Check if the Web App Badging API is available in the current browser/OS
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'setAppBadge' in navigator;
  },

  /**
   * Update the OS app icon badge and browser favicon with the number of unseen responses
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

      // 2. Browser Tab Favicon dynamic notification badge
      updateFaviconBadge(true);

      // 3. Notify active Service Worker to synchronize badge state
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
   * Clear the OS app icon badge and browser favicon
   */
  async clearBadge(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }

      // Restore clean default browser tab favicon
      updateFaviconBadge(false);

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
