import { useEffect, useState } from 'react';
import { trackDailyEvent } from '../lib/analytics';
import { ensureDailyGuidance } from '../lib/dailyGuidanceService';
import type { DailyAiPlainGuidance, DailySnapshot } from '../types';
import type { DailyViewMode } from '../lib/dailyViewMode';

interface Options {
  viewMode: DailyViewMode;
  email: string | null;
  reportFingerprint: string | null;
  reportId: string | null;
  snapshot: DailySnapshot | null;
  cachedGuidance: DailyAiPlainGuidance | null;
}

export function useDailyGuidance({
  viewMode,
  email,
  reportFingerprint,
  reportId,
  snapshot,
  cachedGuidance,
}: Options) {
  const [guidance, setGuidance] = useState<DailyAiPlainGuidance | null>(cachedGuidance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(Boolean(cachedGuidance));

  useEffect(() => {
    setGuidance(cachedGuidance);
    setFromCache(Boolean(cachedGuidance));
  }, [cachedGuidance]);

  useEffect(() => {
    if (viewMode !== 'plain' || !email || !reportFingerprint || !reportId || !snapshot) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ensureDailyGuidance({
          email,
          reportFingerprint,
          reportId,
          snapshot,
          cached: cachedGuidance,
        });
        if (cancelled) return;
        setGuidance(result.guidance);
        setFromCache(result.fromCache);
        trackDailyEvent('daily_plain_guidance_ready', {
          reportId,
          fromCache: result.fromCache,
          saved: result.saved,
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Plain guidance generation failed');
        trackDailyEvent('daily_error', { message: String(e), phase: 'plain_guidance' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewMode, email, reportFingerprint, reportId, snapshot, cachedGuidance]);

  return { guidance, loading, error, fromCache };
}
