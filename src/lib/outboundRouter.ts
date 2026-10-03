/**
 * IDEMO Centralized Outbound Link & Intent Router
 *
 * Enforces the IDEMO Governance Outbound Policy:
 * IDEMO FIRST -> BROWSE AND RETURN -> EXECUTE AND RETURN.
 *
 * Classifications:
 * 1. INTERNAL: Completed within IDEMO (zero app exit, zero state loss)
 * 2. WEB: Normal http/https informational content via Native In-App Browser (SFSafariViewController / Chrome Custom Tabs)
 * 3. EXTERNAL_INTENT: Intentional handoff to Maps, WhatsApp, Phone, SMS, Mail, or App Stores
 */

export type OutboundClass = 'INTERNAL' | 'WEB' | 'EXTERNAL_INTENT';

export interface OutboundFallbackData {
  copyText?: string;
  phoneNumber?: string;
  smsBody?: string;
  email?: string;
  fallbackUrl?: string;
  address?: string;
  label?: string;
}

export interface OutboundRequest {
  url?: string;
  type: OutboundClass;
  title?: string;
  fallbackData?: OutboundFallbackData;
  onInternalAction?: () => void;
  onToast?: (message: string) => void;
}

declare global {
  interface Window {
    IDEMONative?: {
      openInAppBrowser?: (url: string) => boolean | Promise<boolean>;
      openExternalBrowser?: (url: string) => boolean | Promise<boolean>;
      launchIntent?: (url: string) => boolean | Promise<boolean>;
    };
    FlutterInAppBrowser?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Copies text to clipboard safely across HTTPS, localhost, and fallback contexts
 */
export async function copyToClipboardSafely(text: string): Promise<boolean> {
  if (!text) return false;
  
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[outboundRouter] Clipboard API failed, attempting execCommand fallback:', err);
    }
  }

  // Fallback for non-secure contexts or legacy browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[outboundRouter] ExecCommand copy failed:', err);
    return false;
  }
}

/**
 * Centralized router function for all outbound user interactions across IDEMO.
 * Enforces strict tiered fallback chains:
 * - Maps: Native Maps app scheme -> Browser Maps URL -> Copy Address
 * - Website: Native In-App-Browser -> External Browser -> Copy Link
 * - Phone: Direct Dial -> Copy & Show Phone Number
 * - SMS: Direct SMS -> Copy & Show Number + Message Body
 */
export async function routeOutboundAction(req: OutboundRequest): Promise<void> {
  const { url, type, fallbackData, onInternalAction, onToast } = req;

  // 1. INTERNAL: Completed inside IDEMO
  if (type === 'INTERNAL') {
    if (onInternalAction) {
      onInternalAction();
    } else {
      console.warn('[outboundRouter] INTERNAL action requested without onInternalAction handler.');
    }
    return;
  }

  // Sanitize target URL if present
  const targetUrl = (url || '').trim();

  // 2. WEB: In-App Browser surface for normal web content
  // Tier 1: Native In-App-Browser -> Tier 2: External Browser -> Tier 3: Copy Link
  if (type === 'WEB') {
    if (!targetUrl) {
      if (onToast) onToast('Neispravan veb link / Invalid web URL');
      return;
    }

    if (typeof window !== 'undefined') {
      // Tier 1: Native App Bridge (SFSafariViewController / Chrome Custom Tabs)
      if (window.IDEMONative?.openInAppBrowser) {
        try {
          const handled = await window.IDEMONative.openInAppBrowser(targetUrl);
          if (handled) return;
        } catch (e) {
          console.warn('[outboundRouter] Native in-app browser bridge error:', e);
        }
      }

      if (window.FlutterInAppBrowser?.postMessage) {
        try {
          window.FlutterInAppBrowser.postMessage(JSON.stringify({ action: 'openInAppBrowser', url: targetUrl }));
          return;
        } catch (e) {
          console.warn('[outboundRouter] Flutter bridge error:', e);
        }
      }

      // Tier 1.5: Explicit Native External Browser Bridge if available
      if (window.IDEMONative?.openExternalBrowser) {
        try {
          const handled = await window.IDEMONative.openExternalBrowser(targetUrl);
          if (handled) return;
        } catch (e) {
          console.warn('[outboundRouter] Native external browser bridge error:', e);
        }
      }

      // Tier 2: Open in external browser window/tab
      // Note: `noopener,noreferrer` causes window.open to return null by specification.
      // Therefore, execution without a thrown exception indicates browser navigation initiated.
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch (err) {
        console.warn('[outboundRouter] window.open external browser failed or blocked:', err);
      }
    }

    // Tier 3: Copy link to clipboard if browser launch throws exception
    copyToClipboardSafely(targetUrl).then((copied) => {
      if (onToast) {
        onToast(copied ? `Link kopiran u međuspremnik: ${targetUrl}` : 'Neuspelo otvaranje veb stranice');
      }
    });
    return;
  }

  // 3. EXTERNAL_INTENT: Handoff to native system handlers
  if (type === 'EXTERNAL_INTENT') {
    if (!targetUrl) {
      if (onToast) onToast('Neispravan intent zahtev');
      return;
    }

    const scheme = targetUrl.split(':')[0]?.toLowerCase() || '';

    // A. Phone calls (tel:)
    // Tier 1: Direct Dial -> Tier 2: Show & Copy Phone Number
    if (scheme === 'tel' || fallbackData?.phoneNumber) {
      const phoneNumber = fallbackData?.phoneNumber || targetUrl.replace(/^tel:/i, '').trim();
      
      // Attempt deterministic native wrapper launch first
      if (typeof window !== 'undefined' && window.IDEMONative?.launchIntent) {
        try {
          const launched = await window.IDEMONative.launchIntent(`tel:${phoneNumber}`);
          if (launched) return;
        } catch (e) {
          console.warn('[outboundRouter] Native tel launch error:', e);
        }
      }

      // Web browser direct scheme invocation
      try {
        window.location.href = `tel:${phoneNumber}`;
      } catch (err) {
        console.warn('[outboundRouter] Direct tel: launch failed:', err);
      }

      // Execute Tier 2 copy feedback for phone
      copyToClipboardSafely(phoneNumber).then((copied) => {
        if (onToast) {
          onToast(copied ? `Broj telefona kopiran: ${phoneNumber}` : `Broj telefona: ${phoneNumber}`);
        }
      });
      return;
    }

    // B. SMS payment & messaging (sms:)
    // Tier 1: Direct SMS App -> Tier 2: Show & Copy Number + Message Body
    if (scheme === 'sms' || fallbackData?.smsBody) {
      const phoneNumber = fallbackData?.phoneNumber || targetUrl.match(/sms:([^?&]+)/)?.[1] || '';
      const smsBody = fallbackData?.smsBody || decodeURIComponent(targetUrl.match(/body=([^&]+)/)?.[1] || '');
      const smsCopyContent = fallbackData?.copyText || 
        (phoneNumber && smsBody ? `Broj: ${phoneNumber} | Poruka: ${smsBody}` : phoneNumber || smsBody || targetUrl);

      // Attempt deterministic native wrapper launch first
      if (typeof window !== 'undefined' && window.IDEMONative?.launchIntent) {
        try {
          const launched = await window.IDEMONative.launchIntent(targetUrl);
          if (launched) return;
        } catch (e) {
          console.warn('[outboundRouter] Native sms launch error:', e);
        }
      }

      // Web browser direct scheme invocation
      try {
        window.location.href = targetUrl;
      } catch (err) {
        console.warn('[outboundRouter] Direct sms: launch failed:', err);
      }

      // Execute Tier 2 copy feedback for SMS
      copyToClipboardSafely(smsCopyContent).then((copied) => {
        if (onToast) {
          const toastLabel = phoneNumber && smsBody 
            ? `SMS primalac i tekst kopirani: ${phoneNumber} (${smsBody})` 
            : `SMS podaci kopirani: ${smsCopyContent}`;
          onToast(copied ? toastLabel : 'SMS detalji nisu mogli biti kopirani');
        }
      });
      return;
    }

    // C. Turn-by-Turn GPS Maps (maps://, geo:, google.com/maps, comgooglemaps:)
    // Preserves explicit provider intent:
    // - Apple Maps CTA -> Apple Maps native/web -> Copy Address
    // - Google Maps CTA -> Google Maps native/web -> Copy Address
    if (scheme === 'maps' || scheme === 'geo' || targetUrl.includes('maps.google.com') || targetUrl.includes('google.com/maps') || scheme === 'comgooglemaps' || targetUrl.includes('maps.apple.com')) {
      const addressToCopy = fallbackData?.address || fallbackData?.copyText || targetUrl;

      // 1. Attempt deterministic native wrapper launch
      if (typeof window !== 'undefined' && window.IDEMONative?.launchIntent) {
        try {
          const launched = await window.IDEMONative.launchIntent(targetUrl);
          if (launched) return;
        } catch (e) {
          console.warn('[outboundRouter] Native map launch error:', e);
        }
      }

      const isAppleMapsIntent = scheme === 'maps' || targetUrl.includes('maps.apple.com');
      const isGoogleMapsIntent = scheme === 'geo' || scheme === 'comgooglemaps' || targetUrl.includes('google.com/maps') || targetUrl.includes('maps.google.com');

      // 2. Handle Apple Maps CTA
      if (isAppleMapsIntent) {
        if (typeof window !== 'undefined') {
          try {
            if (scheme === 'maps') {
              window.location.href = targetUrl;
            } else {
              const appleWebUrl = targetUrl.startsWith('http') ? targetUrl : `https://maps.apple.com/?q=${encodeURIComponent(addressToCopy)}`;
              window.open(appleWebUrl, '_blank', 'noopener,noreferrer');
            }
            return;
          } catch (e) {
            console.warn('[outboundRouter] Apple Maps launch failed:', e);
          }
        }

        copyToClipboardSafely(addressToCopy).then((copied) => {
          if (onToast) {
            onToast(copied ? `Adresa kopirana u međuspremnik: ${addressToCopy}` : 'Adresa nije mogla biti kopirana');
          }
        });
        return;
      }

      // 3. Handle Google Maps CTA / Default Maps
      if (isGoogleMapsIntent || targetUrl.startsWith('http')) {
        const googleWebUrl = targetUrl.startsWith('http') ? targetUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToCopy)}`;

        if (typeof window !== 'undefined') {
          try {
            if (scheme === 'geo' || scheme === 'comgooglemaps') {
              window.location.href = targetUrl;
            } else {
              window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
            }
            return;
          } catch (e) {
            console.warn('[outboundRouter] Google Maps launch failed:', e);
          }
        }

        copyToClipboardSafely(addressToCopy).then((copied) => {
          if (onToast) {
            onToast(copied ? `Adresa kopirana u međuspremnik: ${addressToCopy}` : 'Adresa nije mogla biti kopirana');
          }
        });
        return;
      }
    }

    // D. Mail (mailto:)
    if (scheme === 'mailto') {
      const emailAddr = fallbackData?.email || targetUrl.replace(/^mailto:/i, '').split('?')[0];
      try {
        window.location.href = targetUrl;
      } catch (err) {
        console.warn('[outboundRouter] Direct mailto: launch failed:', err);
      }
      copyToClipboardSafely(emailAddr).then((copied) => {
        if (onToast) onToast(copied ? `Email adresa kopirana: ${emailAddr}` : `Email: ${emailAddr}`);
      });
      return;
    }

    // E. WhatsApp (wa.me) & Viber (viber://)
    if (targetUrl.includes('wa.me') || targetUrl.includes('whatsapp') || scheme === 'viber') {
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch (err) {
        console.warn('[outboundRouter] Messaging app launch failed:', err);
      }

      const textToCopy = fallbackData?.copyText || fallbackData?.phoneNumber || targetUrl;
      copyToClipboardSafely(textToCopy).then((copied) => {
        if (onToast) onToast('Tekst i kontakt su kopirani u međuspremnik');
      });
      return;
    }

    // F. App Stores & General External Intents (play.google.com, apps.apple.com)
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    } catch (err) {
      console.warn('[outboundRouter] External intent launch failed:', err);
    }

    // Ultimate fallback: Copy text / URL to clipboard
    const copyTarget = fallbackData?.copyText || targetUrl;
    copyToClipboardSafely(copyTarget).then((copied) => {
      if (onToast) onToast('Poveznica je kopirana u međuspremnik');
    });
  }
}
