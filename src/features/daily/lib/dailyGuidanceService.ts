import type { DailyAiPlainGuidance } from '../types';
import type { DailySnapshot } from '../types';
import { saveDailyGuidance } from './dailyReportApi';
import {
  dailyGuidanceFingerprint,
  isValidDailyPlainGuidance,
} from './dailyGuidanceFingerprint';
import { generateDailyPlainGuidance } from './dailyPsychGuidanceGemini';
import { buildDailyPsychSeed } from './dailyPsychProfile';
import { normalizeDailyEmail } from './dailyFingerprint';

export interface EnsureDailyGuidanceOptions {
  email: string;
  reportFingerprint: string;
  reportId: string;
  snapshot: DailySnapshot;
  cached?: DailyAiPlainGuidance | null;
}

export interface EnsureDailyGuidanceResult {
  guidance: DailyAiPlainGuidance;
  fromCache: boolean;
  saved: boolean;
}

function normalizeGuidance(raw: unknown, expectedFingerprint: string): DailyAiPlainGuidance | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.fingerprint !== expectedFingerprint) return null;
  if (typeof o.generatedAt !== 'string') return null;
  if (!isValidDailyPlainGuidance(o.guidance)) return null;
  return {
    guidance: o.guidance,
    fingerprint: expectedFingerprint,
    generatedAt: o.generatedAt,
  };
}

const resolvedByEmail = new Map<string, DailyAiPlainGuidance>();
const inFlightByEmail = new Map<string, Promise<EnsureDailyGuidanceResult>>();

export async function ensureDailyGuidance(
  options: EnsureDailyGuidanceOptions,
): Promise<EnsureDailyGuidanceResult> {
  const email = normalizeDailyEmail(options.email);
  const guidanceFingerprint = dailyGuidanceFingerprint(options.reportFingerprint);

  const fromServer = normalizeGuidance(options.cached, guidanceFingerprint);
  if (fromServer) {
    resolvedByEmail.set(email, fromServer);
    return { guidance: fromServer, fromCache: true, saved: true };
  }

  const sessionHit = resolvedByEmail.get(email);
  if (sessionHit?.fingerprint === guidanceFingerprint) {
    return { guidance: sessionHit, fromCache: true, saved: true };
  }

  const existing = inFlightByEmail.get(email);
  if (existing) return existing;

  const promise = (async (): Promise<EnsureDailyGuidanceResult> => {
    const seed = options.snapshot.psychSeed ?? buildDailyPsychSeed(options.snapshot);
    const generated = await generateDailyPlainGuidance(seed);
    const guidance: DailyAiPlainGuidance = {
      guidance: generated,
      fingerprint: guidanceFingerprint,
      generatedAt: new Date().toISOString(),
    };

    let saved = false;
    try {
      await saveDailyGuidance({
        email,
        reportId: options.reportId,
        aiGuidance: guidance,
      });
      saved = true;
      resolvedByEmail.set(email, guidance);
    } catch {
      resolvedByEmail.set(email, guidance);
    }

    return { guidance, fromCache: false, saved };
  })().finally(() => {
    inFlightByEmail.delete(email);
  });

  inFlightByEmail.set(email, promise);
  return promise;
}

export function clearDailyGuidanceSession(email?: string): void {
  if (email) {
    resolvedByEmail.delete(normalizeDailyEmail(email));
    inFlightByEmail.delete(normalizeDailyEmail(email));
    return;
  }
  resolvedByEmail.clear();
  inFlightByEmail.clear();
}
