import { useEffect, useState } from 'react';
import { isAuthRequiredError } from '../../../lib/api-utils';
import { funnelAiDocId, saveAiToAccount } from '../../auth/saveAiToAccount';
import { trackYearEvent } from '../lib/analytics';
import type { YearReading } from '../lib/yearEngine';
import { ensureYearSynthesis, type YearAiSynthesis } from '../lib/yearSynthesisService';

interface Options {
  /** Signed-in user; AI generation needs one, a cached consultation does not. */
  uid: string | null;
  /**
   * Hold generation until the session is restored and the account copy has
   * been checked — otherwise a reload could regenerate a saved interpretation.
   */
  ready?: boolean;
  email: string | null;
  reportFingerprint: string | null;
  reportId: string | null;
  reading: YearReading | null;
  fullName?: string;
  cached: YearAiSynthesis | null;
  onSaved?: (synthesis: YearAiSynthesis) => void;
}

export function useYearGuidance({
  uid,
  ready = true,
  email,
  reportFingerprint,
  reportId,
  reading,
  fullName,
  cached,
  onSaved,
}: Options) {
  const [synthesis, setSynthesis] = useState<YearAiSynthesis | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    setSynthesis(cached);
  }, [cached]);

  useEffect(() => {
    if (!ready || !email || !reportFingerprint || !reportId || !reading) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeedsAuth(false);

    ensureYearSynthesis({
      email,
      reportFingerprint,
      reportId,
      reading,
      fullName,
      cached,
    })
      .then((result) => {
        if (cancelled) return;
        setSynthesis(result.synthesis);
        setLoading(false);
        if (!result.fromCache) onSaved?.(result.synthesis);
        saveAiToAccount(uid, {
          docId: funnelAiDocId('year-horoscope-funnel', reportId),
          type: 'year_horoscope',
          fingerprint: result.synthesis.fingerprint,
          data: result.synthesis,
        });
        trackYearEvent('year_synthesis_ready', { fromCache: result.fromCache, reportId });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoading(false);
        if (isAuthRequiredError(err)) {
          setNeedsAuth(true);
          return;
        }
        setError(err instanceof Error ? err.message : 'The written consultation could not be prepared.');
        trackYearEvent('year_error', { phase: 'synthesis', message: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, uid, email, reportFingerprint, reportId, reading, fullName, cached, onSaved]);

  return { synthesis, loading, error, needsAuth };
}
