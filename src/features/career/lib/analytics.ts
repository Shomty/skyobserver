import { debugLog } from '../../../lib/debug';

type CareerEvent =
  | 'career_page_viewed'
  | 'career_form_submitted'
  | 'career_result_shown'
  | 'career_upsell_clicked'
  | 'career_error';

type Props = Record<string, unknown>;

export function trackCareerEvent(event: CareerEvent, props: Props = {}): void {
  debugLog('career-analytics', event, props);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('career:analytics', { detail: { event, props } }));
  }
}
