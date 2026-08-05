import { trackEvent } from '../../../lib/analytics';

export function trackPersonalEvent(event: string, props?: Record<string, unknown>): void {
  trackEvent(event, { feature: 'personal', ...props });
}
