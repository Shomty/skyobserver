import type { PersonalAiGuidance } from '../types';
import type { PersonalReading } from './personalReading';
import { savePersonalSynthesis } from './personalReportApi';
import { buildPersonalPsychProfile } from './personalPsychProfile';
import { generatePersonalPsychGuidance } from './personalPsychGuidanceGemini';
import {
  isValidPersonalGuidance,
  personalGuidanceFingerprint,
} from './personalGuidanceFingerprint';
import { normalizePersonalEmail } from './personalFingerprint';

export interface EnsurePersonalGuidanceOptions {
  email: string;
  birthFingerprint: string;
  reportId: string;
  reading: PersonalReading;
  cached?: PersonalAiGuidance | null;
}

export interface EnsurePersonalGuidanceResult {
  guidance: PersonalAiGuidance;
  fromCache: boolean;
  saved: boolean;
}

function normalizeGuidance(raw: unknown, expectedFingerprint: string): PersonalAiGuidance | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.fingerprint !== expectedFingerprint) return null;
  if (typeof o.generatedAt !== 'string') return null;

  // New structured format
  if (isValidPersonalGuidance(o.guidance)) {
    return {
      guidance: o.guidance,
      fingerprint: expectedFingerprint,
      generatedAt: o.generatedAt,
    };
  }

  return null;
}

const resolvedByEmail = new Map<string, PersonalAiGuidance>();
const inFlightByEmail = new Map<string, Promise<EnsurePersonalGuidanceResult>>();

export async function ensurePersonalGuidance(
  options: EnsurePersonalGuidanceOptions,
): Promise<EnsurePersonalGuidanceResult> {
  const email = normalizePersonalEmail(options.email);
  const guidanceFingerprint = personalGuidanceFingerprint(options.birthFingerprint);

  const fromServer = normalizeGuidance(options.cached, guidanceFingerprint);
  if (fromServer) {
    resolvedByEmail.set(email, fromServer);
    return { guidance: fromServer, fromCache: true, saved: true };
  }

  const existing = inFlightByEmail.get(email);
  if (existing) return existing;

  const promise = (async (): Promise<EnsurePersonalGuidanceResult> => {
    const profile = buildPersonalPsychProfile(options.reading);
    const generated = await generatePersonalPsychGuidance(profile);
    const guidance: PersonalAiGuidance = {
      guidance: generated,
      fingerprint: guidanceFingerprint,
      generatedAt: new Date().toISOString(),
    };

    let saved = false;
    try {
      await savePersonalSynthesis({
        email,
        reportId: options.reportId,
        aiSynthesis: guidance,
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

export function clearPersonalGuidanceSession(email?: string): void {
  if (email) {
    resolvedByEmail.delete(normalizePersonalEmail(email));
    inFlightByEmail.delete(normalizePersonalEmail(email));
    return;
  }
  resolvedByEmail.clear();
  inFlightByEmail.clear();
}
