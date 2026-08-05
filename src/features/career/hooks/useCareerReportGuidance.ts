import { useEffect, useRef, useState } from 'react';
import type { PlanetPosition } from '../../../vedic-utils';
import { trackCareerEvent } from '../lib/analytics';
import { ensureCareerPlainSynthesis } from '../lib/careerPlainSynthesisService';
import { ensureCareerSynthesis } from '../lib/careerSynthesisService';
import type { CareerAiPlainSynthesis, CareerAiSynthesis, CareerSnapshot } from '../types';

interface Options {
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
    if (!email || !birthFingerprint || !reportId || !reading || !positions) {
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
        trackCareerEvent('career_synthesis_ready', {
          reportId,
          fromCache: vedicResult.value.fromCache,
          saved: vedicResult.value.saved,
        });
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
        trackCareerEvent('career_plain_synthesis_ready', {
          reportId,
          fromCache: plainResult.value.fromCache,
          saved: plainResult.value.saved,
        });
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
  }, [email, birthFingerprint, reportId, snapshot, positions, fullName]);

  return {
    vedic: {
      synthesis: vedic,
      loading: vedicLoading,
      error: vedicError,
      fromCache: vedicFromCache,
    },
    plain: {
      synthesis: plain,
      loading: plainLoading,
      error: plainError,
      fromCache: plainFromCache,
    },
  };
}
