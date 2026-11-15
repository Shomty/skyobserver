import { useEffect, useState } from 'react';
import { getPerAccountReport } from '../../services/aiReportService';

export interface AccountAiCopy<T> {
  data: T | null;
  /** True once the lookup finished — or immediately when there is nothing to look up. */
  ready: boolean;
}

/**
 * The interpretation saved to the signed-in user's account by `saveAiToAccount`.
 * Funnel hooks treat it like the shared-report cache, so a reload never pays
 * for a second generation — including when the share-cache save was refused
 * (signed in with a different email than the report's). Callers still check
 * its fingerprint, so a stale copy is regenerated.
 */
export function useAccountAiCopy<T>(uid: string | null, docId: string | null): AccountAiCopy<T> {
  const key = uid && docId ? `${uid}|${docId}` : null;
  const [loaded, setLoaded] = useState<{ key: string; data: T | null } | null>(null);

  useEffect(() => {
    if (!uid || !docId || !key) return;
    let cancelled = false;
    getPerAccountReport(uid, docId)
      .then((report) => {
        if (!cancelled) setLoaded({ key, data: (report?.data as T | undefined) ?? null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, docId, key]);

  if (!key) return { data: null, ready: true };
  return loaded?.key === key ? { data: loaded.data, ready: true } : { data: null, ready: false };
}
