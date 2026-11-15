import { debugLog } from '../../../lib/debug';
import { trackEvent } from '../../../lib/analytics';

type YearEvent =
  | 'year_page_viewed'
  | 'year_form_submitted'
  | 'year_result_shown'
  | 'year_report_saved'
  | 'year_report_shared'
  | 'year_synthesis_ready'
  | 'year_honeypot_filled'
  | 'year_error';

export function trackYearEvent(event: YearEvent, props: Record<string, unknown> = {}): void {
  debugLog('year-analytics', event, props);
  trackEvent(event, { feature: 'year', ...props });
}
