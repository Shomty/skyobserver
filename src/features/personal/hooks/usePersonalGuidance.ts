import { useEffect, useState } from 'react';
import { trackPersonalEvent } from '../lib/analytics';
import { ensurePersonalGuidance } from '../lib/personalGuidanceService';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';

interface Options {
  email: string | null;
  birthFingerprint: string | null;
  reportId: string | null;
  snapshot: PersonalSnapshot | null;
  cachedGuidance: PersonalAiGuidance | null;
  premiumUnlocked: boolean;
}

export function usePersonalGuidance({
  email,
  birthFingerprint,
  reportId,
  snapshot,
  cachedGuidance,
  premiumUnlocked,
}: Options) {
  const [guidance, setGuidance] = useState<PersonalAiGuidance | null>(cachedGuidance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(Boolean(cachedGuidance));

  useEffect(() => {
    setGuidance(cachedGuidance);
    setFromCache(Boolean(cachedGuidance));
  }, [cachedGuidance]);

  useEffect(() => {
    const reading = snapshot?.reading;
    if (!premiumUnlocked || !email || !birthFingerprint || !reportId || !reading || !snapshot) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ensurePersonalGuidance({
          email,
          birthFingerprint,
          reportId,
          reading,
          cached: cachedGuidance,
        });
        if (cancelled) return;
        setGuidance(result.guidance);
        setFromCache(result.fromCache);
        trackPersonalEvent('personal_guidance_ready', {
          reportId,
          fromCache: result.fromCache,
          saved: result.saved,
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Guidance generation failed');
        trackPersonalEvent('personal_error', { message: String(e), phase: 'guidance' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [premiumUnlocked, email, birthFingerprint, reportId, snapshot, cachedGuidance]);

  return { guidance, loading, error, fromCache };
}
