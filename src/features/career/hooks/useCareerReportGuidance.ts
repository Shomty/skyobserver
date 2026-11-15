import { useEffect, useRef, useState } from 'react';
import type { PlanetPosition } from '../../../vedic-utils';
import { isAuthRequiredError } from '../../../lib/api-utils';
import { funnelAiDocId, saveAiToAccount } from '../../auth/saveAiToAccount';
import { trackCareerEvent } from '../lib/analytics';
import { ensureCareerPlainSynthesis } from '../lib/careerPlainSynthesisService';
import { ensureCareerSynthesis } from '../lib/careerSynthesisService';
import type { CareerAiPlainSynthesis, CareerAiSynthesis, CareerSnapshot } from '../types';

interface Options {
  /** Signed-in user; AI generation needs one, cached interpretations do not. */
  uid: string | null;
  /**
   * Hold generation until the session is restored and the account copy has
   * been checked — otherwise a reload could regenerate a saved interpretation.
   */
  ready?: boolean;
  email: string | null;
  birthFingerprint: string | null;
  reportId: string | null;
  snapshot: CareerSnapshot | null;
  positions: PlanetPosition[] | null;
  fullName?: string;
  cachedVedic: CareerAiSynthesis | null;
  cachedPlain: CareerAiPlainSynthesis | null;
  onVedicSaved?: (synthesis: CareerAiSynthesis) => void;
  onPlainSaved?: (synthesis: CareerAiPlainSynthesis) => void;
}

export function useCareerReportGuidance({
  uid,
  ready = true,
  email,
  birthFingerprint,
  reportId,
  snapshot,
  positions,
  fullName,
  cachedVedic,
  cachedPlain,
  onVedicSaved,
  onPlainSaved,
}: Options) {
  const [vedic, setVedic] = useState<CareerAiSynthesis | null>(cachedVedic);
  const [plain, setPlain] = useState<CareerAiPlainSynthesis | null>(cachedPlain);
  const [vedicLoading, setVedicLoading] = useState(false);
  const [plainLoading, setPlainLoading] = useState(false);
  const [vedicError, setVedicError] = useState<string | null>(null);
  const [plainError, setPlainError] = useState<string | null>(null);
  const [vedicFromCache, setVedicFromCache] = useState(Boolean(cachedVedic));
  const [plainFromCache, setPlainFromCache] = useState(Boolean(cachedPlain));
  const [vedicNeedsAuth, setVedicNeedsAuth] = useState(false);
  const [plainNeedsAuth, setPlainNeedsAuth] = useState(false);

  const cachedVedicRef = useRef(cachedVedic);
  const cachedPlainRef = useRef(cachedPlain);
  const onVedicSavedRef = useRef(onVedicSaved);
  const onPlainSavedRef = useRef(onPlainSaved);

  cachedVedicRef.current = cachedVedic;
  cachedPlainRef.current = cachedPlain;
  onVedicSavedRef.current = onVedicSaved;
  onPlainSavedRef.current = onPlainSaved;

  useEffect(() => {
    setVedic(cachedVedic);
    setVedicFromCache(Boolean(cachedVedic));
  }, [cachedVedic]);

  useEffect(() => {
    setPlain(cachedPlain);
    setPlainFromCache(Boolean(cachedPlain));
  }, [cachedPlain]);

  useEffect(() => {
    const reading = snapshot?.reading;
    if (!ready || !email || !birthFingerprint || !reportId || !reading || !positions) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const vedicCached = cachedVedicRef.current;
      const plainCached = cachedPlainRef.current;

      if (!vedicCached) setVedicLoading(true);
      if (!plainCached) setPlainLoading(true);
      setVedicError(null);
      setPlainError(null);
      setVedicNeedsAuth(false);
      setPlainNeedsAuth(false);

      const [vedicResult, plainResult] = await Promise.allSettled([
        ensureCareerSynthesis({
          email,
          birthFingerprint,
          reportId,
          reading,
          snapshot,
          positions,
          fullName,
          cached: vedicCached,
        }),
        ensureCareerPlainSynthesis({
          email,
          birthFingerprint,
          reportId,
          reading,
          snapshot,
          fullName,
          cached: plainCached,
        }),
      ]);

      if (cancelled) return;

      if (vedicResult.status === 'fulfilled') {
        setVedic(vedicResult.value.synthesis);
        setVedicFromCache(vedicResult.value.fromCache);
        if (vedicResult.value.saved) {
          onVedicSavedRef.current?.(vedicResult.value.synthesis);
        }
        saveAiToAccount(uid, {
          docId: funnelAiDocId('career-synthesis', reportId),
          type: 'career_synthesis',
          fingerprint: vedicResult.value.synthesis.fingerprint,
          data: vedicResult.value.synthesis,
        });
        trackCareerEvent('career_synthesis_ready', {
          reportId,
          fromCache: vedicResult.value.fromCache,
          saved: vedicResult.value.saved,
        });
      } else if (isAuthRequiredError(vedicResult.reason)) {
        setVedicNeedsAuth(true);
      } else {
        setVedicError(
          vedicResult.reason instanceof Error
            ? vedicResult.reason.message
            : 'Vedic synthesis generation failed',
        );
        trackCareerEvent('career_error', {
          message: String(vedicResult.reason),
          phase: 'synthesis',
        });
      }

      if (plainResult.status === 'fulfilled') {
        setPlain(plainResult.value.synthesis);
        setPlainFromCache(plainResult.value.fromCache);
        if (plainResult.value.saved) {
          onPlainSavedRef.current?.(plainResult.value.synthesis);
        }
        saveAiToAccount(uid, {
          docId: funnelAiDocId('career-plain', reportId),
          type: 'career_plain_synthesis',
          fingerprint: plainResult.value.synthesis.fingerprint,
          data: plainResult.value.synthesis,
        });
        trackCareerEvent('career_plain_synthesis_ready', {
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
            : 'Plain synthesis generation failed',
        );
        trackCareerEvent('career_error', {
          message: String(plainResult.reason),
          phase: 'plain_synthesis',
        });
      }

      setVedicLoading(false);
      setPlainLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, uid, email, birthFingerprint, reportId, snapshot, positions, fullName]);

  return {
    vedic: {
      synthesis: vedic,
      loading: vedicLoading,
      error: vedicError,
      fromCache: vedicFromCache,
      needsAuth: vedicNeedsAuth,
    },
    plain: {
      synthesis: plain,
      loading: plainLoading,
      error: plainError,
      fromCache: plainFromCache,
      needsAuth: plainNeedsAuth,
    },
  };
}
