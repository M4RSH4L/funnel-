/**
 * Unified Analytics & Campaign Attribution Layer for LQMTM.
 * Captures and preserves UTM parameters, coordinates Meta Pixel, GA4 and first-party event tracking.
 */

import {
  initMetaPixel,
  trackPixelPageView,
  trackPixelLead,
  trackPixelContact,
  trackPixelViewContent,
  trackPixelCustom,
} from './metaPixel';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
}

export type FunnelEventName =
  | 'landing_view'
  | 'form_start'
  | 'form_validation_error'
  | 'form_submit'
  | 'registration_success'
  | 'registration_error'
  | 'first_purchase_offer_view'
  | 'whatsapp_click'
  | 'product_view'
  | 'product_whatsapp_click';

const UTM_STORAGE_KEY = 'lqmtm_campaign_utm';
const CONSENT_STORAGE_KEY = 'lqmtm_cookie_consent';

/**
 * Extracts UTM parameters from a URL search string or Window location.
 */
export function extractUtmParams(search: string): UtmParams {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const utms: UtmParams = {};

  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  const content = params.get('utm_content');
  const term = params.get('utm_term');
  const fbclid = params.get('fbclid');

  if (source) utms.utm_source = source.slice(0, 100);
  if (medium) utms.utm_medium = medium.slice(0, 100);
  if (campaign) utms.utm_campaign = campaign.slice(0, 100);
  if (content) utms.utm_content = content.slice(0, 100);
  if (term) utms.utm_term = term.slice(0, 100);
  if (fbclid) utms.fbclid = fbclid.slice(0, 100);

  return utms;
}

/**
 * Persists UTM parameters in sessionStorage so they are retained throughout the user journey.
 */
export function captureAndStoreUtm(): UtmParams {
  if (typeof window === 'undefined') return {};

  const currentUtms = extractUtmParams(window.location.search);

  try {
    const storedRaw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    const existingUtms = storedRaw ? JSON.parse(storedRaw) : {};

    // Combine, prioritizing active URL parameters
    const merged = { ...existingUtms, ...currentUtms };

    if (Object.keys(merged).length > 0) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return currentUtms;
  }
}

/**
 * Retrieves stored UTM parameters.
 */
export function getStoredUtm(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const storedRaw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    return storedRaw ? JSON.parse(storedRaw) : {};
  } catch {
    return {};
  }
}

/**
 * Consent state management
 */
export function hasUserConsentedToTracking(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    // Default to true for anonymous campaign analytics, but can be explicitly rejected
    return val !== 'declined';
  } catch {
    return true;
  }
}

export function setUserConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'declined');
  } catch {
    // ignore storage restrictions
  }
}

/**
 * Central event tracking function
 */
export async function trackEvent(
  eventName: FunnelEventName,
  eventData: Record<string, any> = {}
): Promise<void> {
  const utms = getStoredUtm();
  const consent = hasUserConsentedToTracking();

  // 1. First-party internal analytics endpoint
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventData,
        utms,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Non-blocking fail-safe
    });
  } catch {
    // Ignore network errors for telemetry
  }

  // 2. Dispatch to Meta Pixel if consent is granted
  if (consent) {
    switch (eventName) {
      case 'landing_view':
        trackPixelPageView();
        trackPixelViewContent({
          content_name: 'Sorteo 1 Año Alimento',
          content_category: 'Campaign Landing',
        });
        break;

      case 'registration_success':
        // Strict deduplication ID passed from backend
        trackPixelLead(eventData.registrationId);
        trackPixelCustom('RegistrationSuccess', {
          pet_type: eventData.petType,
        });
        break;

      case 'whatsapp_click':
      case 'product_whatsapp_click':
        trackPixelContact({
          content_name: eventData.productName || 'Consulta WhatsApp',
          channel: 'WhatsApp',
        });
        trackPixelCustom('WhatsAppClick', {
          origin: eventData.origin || 'first_purchase_card',
        });
        break;

      case 'form_start':
        trackPixelCustom('FormStart');
        break;

      case 'form_validation_error':
        trackPixelCustom('FormValidationError', {
          field: eventData.field,
        });
        break;

      case 'product_view':
        if (eventData.productName) {
          trackPixelViewContent({
            content_name: eventData.productName,
            content_category: eventData.brand || 'Alimento Mascota',
            value: eventData.price,
            currency: 'ARS',
          });
        }
        break;

      default:
        break;
    }
  }

  // 3. Dispatch to Google Analytics (gtag) if present
  if (consent && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      ...eventData,
      ...utms,
    });
  }
}
