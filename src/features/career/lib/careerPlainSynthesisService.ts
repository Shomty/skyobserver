import type { CareerAiPlainSynthesis, CareerSnapshot } from '../types';
import type { CareerReading } from './careerReading';
import { saveCareerPlainSynthesis } from './careerReportApi';
import { generateCareerPlainSynthesisText } from './careerPlainSynthesisGemini';
import {
  careerPlainSynthesisFingerprint,
  isValidCareerPlainSynthesisText,
} from './careerPlainSynthesisFingerprint';
import { normalizeCareerEmail } from './careerFingerprint';

export interface EnsureCareerPlainSynthesisOptions {
  email: string;
  birthFingerprint: string;
  reportId: string;
  reading: CareerReading;
  snapshot: CareerSnapshot;
  fullName?: string;
  cached?: CareerAiPlainSynthesis | null;
}

export interface EnsureCareerPlainSynthesisResult {
  synthesis: CareerAiPlainSynthesis;
  fromCache: boolean;
  saved: boolean;
}

function normalizePlainSynthesis(raw: unknown, expectedFingerprint: string): CareerAiPlainSynthesis | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.fingerprint !== expectedFingerprint) return null;
  if (!isValidCareerPlainSynthesisText(o.text)) return null;
  if (typeof o.generatedAt !== 'string') return null;
  return {
    text: o.text.trim(),
    fingerprint: expectedFingerprint,
    generatedAt: o.generatedAt,
  };
}

const resolvedByEmail = new Map<string, CareerAiPlainSynthesis>();
const inFlightByEmail = new Map<string, Promise<EnsureCareerPlainSynthesisResult>>();

export async function ensureCareerPlainSynthesis(
  options: EnsureCareerPlainSynthesisOptions,
): Promise<EnsureCareerPlainSynthesisResult> {
  const email = normalizeCareerEmail(options.email);
  const synthesisFingerprint = careerPlainSynthesisFingerprint(options.birthFingerprint);

  const fromServer = normalizePlainSynthesis(options.cached, synthesisFingerprint);
  if (fromServer) {
    resolvedByEmail.set(email, fromServer);
    return { synthesis: fromServer, fromCache: true, saved: true };
  }

  const sessionHit = resolvedByEmail.get(email);
  if (sessionHit?.fingerprint === synthesisFingerprint) {
    return { synthesis: sessionHit, fromCache: true, saved: true };
  }

  const existing = inFlightByEmail.get(email);
  if (existing) return existing;

  const promise = (async (): Promise<EnsureCareerPlainSynthesisResult> => {
    const text = await generateCareerPlainSynthesisText(
      options.reading,
      options.snapshot,
      options.fullName,
    );
    const synthesis: CareerAiPlainSynthesis = {
      text,
      fingerprint: synthesisFingerprint,
      generatedAt: new Date().toISOString(),
    };

    let saved = false;
    try {
      await saveCareerPlainSynthesis({
        email,
        reportId: options.reportId,
        aiPlainSynthesis: synthesis,
      });
      saved = true;
      resolvedByEmail.set(email, synthesis);
    } catch {
      resolvedByEmail.set(email, synthesis);
    }

    return { synthesis, fromCache: false, saved };
  })().finally(() => {
    inFlightByEmail.delete(email);
  });

  inFlightByEmail.set(email, promise);
  return promise;
}

export function clearCareerPlainSynthesisSession(email?: string): void {
  if (email) {
    resolvedByEmail.delete(normalizeCareerEmail(email));
    inFlightByEmail.delete(normalizeCareerEmail(email));
    return;
  }
  resolvedByEmail.clear();
  inFlightByEmail.clear();
}
