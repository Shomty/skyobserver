import { ensureReport } from '../../services/aiReportService';
import { debugWarn } from '../../lib/debug';

export type FunnelAiKind =
  | 'career-synthesis'
  | 'career-plain'
  | 'personal-guidance'
  | 'daily-guidance'
  | 'daily-transits'
  | 'year-horoscope-funnel';

/** One account document per funnel report and AI kind — shared by save and load. */
export function funnelAiDocId(kind: FunnelAiKind, reportId: string): string {
  return `${kind}-${reportId}`;
}

export interface AccountReport {
  /** Fixed per-report document id, e.g. `career-synthesis-<reportId>`. */
  docId: string;
  /** Journal/Archives type label key. */
  type: string;
  /** The feature's AI fingerprint — a changed fingerprint replaces the stored copy. */
  fingerprint: string;
  data: unknown;
}

/**
 * Keep a funnel's AI interpretation in the signed-in user's account
 * (`users/{uid}/ai_reports`) so it appears in the dashboard Archives.
 * `ensureReport` reads first and writes only when the document is missing or
 * stale, so calling this on every render of a cached result costs one read.
 * Fire-and-forget: a failed save never blocks showing the interpretation.
 */
export function saveAiToAccount(uid: string | null | undefined, report: AccountReport): void {
  if (!uid) return;
  ensureReport({
    uid,
    docId: report.docId,
    type: report.type,
    fingerprint: report.fingerprint,
    generate: async () => report.data,
  }).catch((error: unknown) => {
    debugWarn('ai-report', 'Could not save funnel interpretation to account', {
      docId: report.docId,
      message: error instanceof Error ? error.message : String(error),
    });
  });
}
