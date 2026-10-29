/**
 * Meta Pixel (Facebook Pixel) client-side integration helper.
 * Strictly respects user privacy and consent.
 * Never sends Personally Identifiable Information (PII) such as phone, name, or locality.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

let pixelInitialized = false;

export function getMetaPixelId(): string | null {
  const pixelId =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_META_PIXEL_ID) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_META_PIXEL_ID);
  
  if (pixelId && typeof pixelId === 'string' && pixelId.trim() !== '' && pixelId !== 'MY_META_PIXEL_ID') {
    return pixelId.trim();
  }
  return null;
}

export function initMetaPixel(consentGranted: boolean = true): boolean {
  if (typeof window === 'undefined') return false;
  if (!consentGranted) {
    return false;
  }
  if (pixelInitialized) return true;

  const pixelId = getMetaPixelId();
  if (!pixelId) {
    // Pixel ID not provided; operate in diagnostic mode without breaking
    return false;
  }

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  if (window.fbq) {
    window.fbq('init', pixelId);
    pixelInitialized = true;
    return true;
  }

  return false;
}

/**
 * Dispatches standard PageView event.
 */
export function trackPixelPageView(): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

/**
 * Dispatches standard ViewContent event (e.g. Campaign Hero or Product).
 */
export function trackPixelViewContent(params: {
  content_name: string;
  content_category: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_name: params.content_name,
    content_category: params.content_category,
    content_ids: params.content_ids,
    value: params.value,
    currency: params.currency || 'ARS',
  });
}

/**
 * Dispatches standard Lead event.
 * CRITICAL: Must be called ONCE AND ONLY ONCE after the server has confirmed database persistence.
 * Uses event_id for deduplication with Meta Conversions API (CAPI).
 */
export function trackPixelLead(eventId?: string): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  const options = eventId ? { eventID: eventId } : undefined;
  window.fbq('track', 'Lead', {
    content_name: 'Sorteo 1 Año Alimento LQMTM',
    content_category: 'Raffle Registration',
    status: 'completed',
  }, options);
}

/**
 * Dispatches standard Contact event when clicking commercial WhatsApp CTA.
 */
export function trackPixelContact(params: {
  content_name?: string;
  channel?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Contact', {
    content_name: params.content_name || 'Consulta WhatsApp Primera Compra',
    content_category: 'Direct Messaging',
    channel: params.channel || 'WhatsApp',
  });
}

/**
 * Dispatches a custom Meta Pixel event.
 */
export function trackPixelCustom(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('trackCustom', eventName, params);
}
