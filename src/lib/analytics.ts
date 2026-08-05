import { SITE } from './siteConfig';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 custom event via gtag. Best-effort — never throws. */
export function trackEvent(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', event, params);
  } catch {
    // analytics is best-effort
  }
}

/** Notify GA4 of a SPA navigation. */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const location = window.location.href;
    window.gtag?.('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle ?? document.title,
      page_location: location,
    });
    window.gtag?.('config', SITE.gaMeasurementId, {
      page_path: pagePath,
      page_title: pageTitle ?? document.title,
    });
  } catch {
    // analytics is best-effort
  }
}
