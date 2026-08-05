import type { DailyAiTransitGuidance, DailySnapshot } from '../types';
import { saveDailyTransitGuidance } from './dailyReportApi';
import {
  dailyTransitGuidanceFingerprint,
  isValidDailyTransitGuidance,
} from './dailyTransitFingerprint';
import { generateDailyTransitGuidance } from './dailyTransitGuidanceGemini';
import { buildDailyTransitSeed } from './dailyTransitSeed';
import { normalizeDailyEmail } from './dailyFingerprint';

export interface EnsureDailyTransitGuidanceOptions {
  email: string;
  reportFingerprint: string;
  reportId: string;
  snapshot: DailySnapshot;
  cached?: DailyAiTransitGuidance | null;
}

export interface EnsureDailyTransitGuidanceResult {
  guidance: DailyAiTransitGuidance;
  fromCache: boolean;
  saved: boolean;
}

function normalizeGuidance(raw: unknown, expectedFingerprint: string): DailyAiTransitGuidance | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.fingerprint !== expectedFingerprint) return null;
  if (typeof o.generatedAt !== 'string') return null;
  if (!isValidDailyTransitGuidance(o.guidance)) return null;
  return {
    guidance: o.guidance,
    fingerprint: expectedFingerprint,
    generatedAt: o.generatedAt,
  };
}

const sessionKey = (email: string) => `transit:${normalizeDailyEmail(email)}`;
const resolvedByKey = new Map<string, DailyAiTransitGuidance>();
const inFlightByKey = new Map<string, Promise<EnsureDailyTransitGuidanceResult>>();

export async function ensureDailyTransitGuidance(
  options: EnsureDailyTransitGuidanceOptions,
): Promise<EnsureDailyTransitGuidanceResult> {
  const email = normalizeDailyEmail(options.email);
  const key = sessionKey(email);
  const guidanceFingerprint = dailyTransitGuidanceFingerprint(options.reportFingerprint);

  const fromServer = normalizeGuidance(options.cached, guidanceFingerprint);
  if (fromServer) {
    resolvedByKey.set(key, fromServer);
    return { guidance: fromServer, fromCache: true, saved: true };
  }

  const sessionHit = resolvedByKey.get(key);
  if (sessionHit?.fingerprint === guidanceFingerprint) {
    return { guidance: sessionHit, fromCache: true, saved: true };
  }

  const existing = inFlightByKey.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<EnsureDailyTransitGuidanceResult> => {
    const seed = buildDailyTransitSeed(options.snapshot);
    if (seed.transits.length === 0) {
      const empty: DailyAiTransitGuidance = {
        guidance: { transits: [] },
        fingerprint: guidanceFingerprint,
        generatedAt: new Date().toISOString(),
      };
      return { guidance: empty, fromCache: false, saved: false };
    }

    const generated = await generateDailyTransitGuidance(seed);
    const guidance: DailyAiTransitGuidance = {
      guidance: generated,
      fingerprint: guidanceFingerprint,
      generatedAt: new Date().toISOString(),
    };

    let saved = false;
    try {
      await saveDailyTransitGuidance({
        email,
        reportId: options.reportId,
        aiTransitGuidance: guidance,
      });
      saved = true;
      resolvedByKey.set(key, guidance);
    } catch {
      resolvedByKey.set(key, guidance);
    }

    return { guidance, fromCache: false, saved };
  })().finally(() => {
    inFlightByKey.delete(key);
  });

  inFlightByKey.set(key, promise);
  return promise;
}

export function clearDailyTransitGuidanceSession(email?: string): void {
  if (email) {
    const key = sessionKey(email);
    resolvedByKey.delete(key);
    inFlightByKey.delete(key);
    return;
  }
  for (const key of [...resolvedByKey.keys(), ...inFlightByKey.keys()]) {
    if (key.startsWith('transit:')) {
      resolvedByKey.delete(key);
      inFlightByKey.delete(key);
    }
  }
}
