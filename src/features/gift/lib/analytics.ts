import { debugLog } from '../../../lib/debug';
import type { GiftSlug } from '../types';

type GiftEvent =
  | 'gift_chooser_viewed'
  | 'gift_card_clicked'
  | 'gift_wizard_started'
  | 'gift_step1_completed'
  | 'gift_step2_completed'
  | 'gift_review_edit_clicked'
  | 'gift_submit_attempted'
  | 'gift_submit_succeeded'
  | 'gift_submit_blocked'
  | 'gift_eligibility_failed'
  | 'gift_fallback_accepted'
  | 'gift_share_clicked'
  | 'gift_verify_landed';

type Props = {
  gift?: GiftSlug | string;
  skipped?: boolean;
  reason?: string;
  channel?: string;
  result?: string;
  [key: string]: unknown;
};

/** Thin wrapper — no analytics SDK in the repo yet; logs via debug channel. */
export function trackGiftEvent(event: GiftEvent, props: Props = {}): void {
  debugLog('gift-analytics', event, props);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gift:analytics', { detail: { event, props } }));
  }
}
