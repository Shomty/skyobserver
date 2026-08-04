import { useEffect, useState } from 'react';
import { trackCareerEvent } from '../lib/analytics';
import { ensureCareerSynthesis } from '../lib/careerSynthesisService';
import type { CareerAiSynthesis, CareerSnapshot } from '../types';

interface Options {
  email: string | null;
  birthFingerprint: string | null;
  reportId: string | null;
  snapshot: CareerSnapshot | null;
  fullName?: string;
  cachedSynthesis: CareerAiSynthesis | null;
  premiumUnlocked: boolean;
}

export function useCareerSynthesis({
  email,
  birthFingerprint,
  reportId,
  snapshot,
  fullName,
  cachedSynthesis,
  premiumUnlocked,
}: Options) {
  const [synthesis, setSynthesis] = useState<CareerAiSynthesis | null>(cachedSynthesis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(Boolean(cachedSynthesis));

  useEffect(() => {
    setSynthesis(cachedSynthesis);
    setFromCache(Boolean(cachedSynthesis));
  }, [cachedSynthesis]);

  useEffect(() => {
    const reading = snapshot?.reading;
    if (!premiumUnlocked || !email || !birthFingerprint || !reportId || !reading) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ensureCareerSynthesis({
          email,
          birthFingerprint,
          reportId,
          reading,
          snapshot: snapshot!,
          fullName,
          cached: cachedSynthesis,
        });
        if (cancelled) return;
        setSynthesis(result.synthesis);
        setFromCache(result.fromCache);
        trackCareerEvent('career_synthesis_ready', {
          reportId,
          fromCache: result.fromCache,
          saved: result.saved,
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Synthesis failed');
        trackCareerEvent('career_error', { message: String(e), phase: 'synthesis' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    premiumUnlocked,
    email,
    birthFingerprint,
    reportId,
    snapshot,
    fullName,
    cachedSynthesis,
  ]);

  return { synthesis, loading, error, fromCache };
}
