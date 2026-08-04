export function trackPersonalEvent(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('personal-analytics', { detail: { event, ...props } }));
  } catch {
    // analytics must never break the funnel
  }
}
