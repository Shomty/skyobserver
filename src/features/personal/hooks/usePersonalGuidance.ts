import { useEffect, useState } from 'react';
import { isAuthRequiredError } from '../../../lib/api-utils';
import { funnelAiDocId, saveAiToAccount } from '../../auth/saveAiToAccount';
import { trackPersonalEvent } from '../lib/analytics';
import { ensurePersonalGuidance } from '../lib/personalGuidanceService';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';

interface Options {
  /** Signed-in user; AI generation needs one, cached guidance does not. */
  uid: string | null;
  /**
   * Hold generation until the session is restored and the account copy has
   * been checked — otherwise a reload could regenerate a saved interpretation.
   */
  ready?: boolean;
  email: string | null;
  birthFingerprint: string | null;
  reportId: string | null;
  snapshot: PersonalSnapshot | null;
  cachedGuidance: PersonalAiGuidance | null;
  premiumUnlocked: boolean;
}

export function usePersonalGuidance({
  uid,
  ready = true,
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
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    setGuidance(cachedGuidance);
    setFromCache(Boolean(cachedGuidance));
  }, [cachedGuidance]);

  useEffect(() => {
    const reading = snapshot?.reading;
    if (!ready || !premiumUnlocked || !email || !birthFingerprint || !reportId || !reading || !snapshot) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      setNeedsAuth(false);
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
        saveAiToAccount(uid, {
          docId: funnelAiDocId('personal-guidance', reportId),
          type: 'personal_guidance',
          fingerprint: result.guidance.fingerprint,
          data: result.guidance,
        });
        trackPersonalEvent('personal_guidance_ready', {
          reportId,
          fromCache: result.fromCache,
          saved: result.saved,
        });
      } catch (e) {
        if (cancelled) return;
        if (isAuthRequiredError(e)) {
          setNeedsAuth(true);
          return;
        }
        setError(e instanceof Error ? e.message : 'Guidance generation failed');
        trackPersonalEvent('personal_error', { message: String(e), phase: 'guidance' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, uid, premiumUnlocked, email, birthFingerprint, reportId, snapshot, cachedGuidance]);

  return { guidance, loading, error, fromCache, needsAuth };
}
