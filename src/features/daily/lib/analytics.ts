import { trackEvent } from '../../../lib/analytics';

export function trackDailyEvent(event: string, params?: Record<string, unknown>): void {
  trackEvent(event, { feature: 'daily', ...params });
}
