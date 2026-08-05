declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackDailyEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', event, params);
  } catch {
    // analytics is best-effort
  }
}
