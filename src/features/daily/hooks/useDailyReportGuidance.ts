import { useEffect, useRef, useState } from 'react';
import { isAuthRequiredError } from '../../../lib/api-utils';
import { funnelAiDocId, saveAiToAccount } from '../../auth/saveAiToAccount';
import { trackDailyEvent } from '../lib/analytics';
import { ensureDailyGuidance } from '../lib/dailyGuidanceService';
import { ensureDailyTransitGuidance } from '../lib/dailyTransitGuidanceService';
import type { DailyAiPlainGuidance, DailyAiTransitGuidance, DailySnapshot } from '../types';

interface Options {
  /** Signed-in user; AI generation needs one, cached guidance does not. */
  uid: string | null;
  /**
   * Hold generation until the session is restored and the account copy has
   * been checked — otherwise a reload could regenerate a saved interpretation.
   */
  ready?: boolean;
  email: string | null;
  reportFingerprint: string | null;
  reportId: string | null;
  snapshot: DailySnapshot | null;
  cachedPlain: DailyAiPlainGuidance | null;
  cachedTransit: DailyAiTransitGuidance | null;
  onPlainSaved?: (guidance: DailyAiPlainGuidance) => void;
  onTransitSaved?: (guidance: DailyAiTransitGuidance) => void;
}

export function useDailyReportGuidance({
  uid,
  ready = true,
  email,
  reportFingerprint,
  reportId,
  snapshot,
  cachedPlain,
  cachedTransit,
  onPlainSaved,
  onTransitSaved,
}: Options) {
  const [plain, setPlain] = useState<DailyAiPlainGuidance | null>(cachedPlain);
  const [transit, setTransit] = useState<DailyAiTransitGuidance | null>(cachedTransit);
  const [plainLoading, setPlainLoading] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [plainError, setPlainError] = useState<string | null>(null);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [plainFromCache, setPlainFromCache] = useState(Boolean(cachedPlain));
  const [transitFromCache, setTransitFromCache] = useState(Boolean(cachedTransit));
  const [plainNeedsAuth, setPlainNeedsAuth] = useState(false);
  const [transitNeedsAuth, setTransitNeedsAuth] = useState(false);

  const cachedPlainRef = useRef(cachedPlain);
  const cachedTransitRef = useRef(cachedTransit);
  const onPlainSavedRef = useRef(onPlainSaved);
  const onTransitSavedRef = useRef(onTransitSaved);

  cachedPlainRef.current = cachedPlain;
  cachedTransitRef.current = cachedTransit;
  onPlainSavedRef.current = onPlainSaved;
  onTransitSavedRef.current = onTransitSaved;

  useEffect(() => {
    setPlain(cachedPlain);
    setPlainFromCache(Boolean(cachedPlain));
  }, [cachedPlain]);

  useEffect(() => {
    setTransit(cachedTransit);
    setTransitFromCache(Boolean(cachedTransit));
  }, [cachedTransit]);

  useEffect(() => {
    if (!ready || !email || !reportFingerprint || !reportId || !snapshot) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const plainCached = cachedPlainRef.current;
      const transitCached = cachedTransitRef.current;

      if (!plainCached) setPlainLoading(true);
      if (!transitCached) setTransitLoading(true);
      setPlainError(null);
      setTransitError(null);
      setPlainNeedsAuth(false);
      setTransitNeedsAuth(false);

      const [plainResult, transitResult] = await Promise.allSettled([
        ensureDailyGuidance({
          email,
          reportFingerprint,
          reportId,
          snapshot,
          cached: plainCached,
        }),
        ensureDailyTransitGuidance({
          email,
          reportFingerprint,
          reportId,
          snapshot,
          cached: transitCached,
        }),
      ]);

      if (cancelled) return;

      if (plainResult.status === 'fulfilled') {
        setPlain(plainResult.value.guidance);
        setPlainFromCache(plainResult.value.fromCache);
        if (plainResult.value.saved) {
          onPlainSavedRef.current?.(plainResult.value.guidance);
        }
        saveAiToAccount(uid, {
          docId: funnelAiDocId('daily-guidance', reportId),
          type: 'daily_guidance',
          fingerprint: plainResult.value.guidance.fingerprint,
          data: plainResult.value.guidance,
        });
        trackDailyEvent('daily_plain_guidance_ready', {
          reportId,
          fromCache: plainResult.value.fromCache,
          saved: plainResult.value.saved,
        });
      } else if (isAuthRequiredError(plainResult.reason)) {
        setPlainNeedsAuth(true);
      } else {
        setPlainError(
          plainResult.reason instanceof Error
            ? plainResult.reason.message
            : 'Plain guidance generation failed',
        );
        trackDailyEvent('daily_error', {
          message: String(plainResult.reason),
          phase: 'plain_guidance',
        });
      }

      if (transitResult.status === 'fulfilled') {
        setTransit(transitResult.value.guidance);
        setTransitFromCache(transitResult.value.fromCache);
        if (transitResult.value.saved) {
          onTransitSavedRef.current?.(transitResult.value.guidance);
        }
        saveAiToAccount(uid, {
          docId: funnelAiDocId('daily-transits', reportId),
          type: 'daily_transit_guidance',
          fingerprint: transitResult.value.guidance.fingerprint,
          data: transitResult.value.guidance,
        });
        trackDailyEvent('daily_transit_guidance_ready', {
          reportId,
          fromCache: transitResult.value.fromCache,
          saved: transitResult.value.saved,
        });
      } else if (isAuthRequiredError(transitResult.reason)) {
        setTransitNeedsAuth(true);
      } else {
        setTransitError(
          transitResult.reason instanceof Error
            ? transitResult.reason.message
            : 'Transit guidance generation failed',
        );
        trackDailyEvent('daily_error', {
          message: String(transitResult.reason),
          phase: 'transit_guidance',
        });
      }

      setPlainLoading(false);
      setTransitLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, uid, email, reportFingerprint, reportId, snapshot]);

  return {
    plain: {
      guidance: plain,
      loading: plainLoading,
      error: plainError,
      fromCache: plainFromCache,
      needsAuth: plainNeedsAuth,
    },
    transit: {
      guidance: transit,
      loading: transitLoading,
      error: transitError,
      fromCache: transitFromCache,
      needsAuth: transitNeedsAuth,
    },
  };
}
