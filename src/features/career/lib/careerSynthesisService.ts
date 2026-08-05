import type { PlanetPosition } from '../../../vedic-utils';
import type { CareerAiSynthesis, CareerSnapshot } from '../types';
import type { CareerReading } from './careerReading';
import { saveCareerSynthesis } from './careerReportApi';
import { generateCareerSynthesisText } from './careerSynthesisGemini';
import {
  careerSynthesisFingerprint,
  isValidCareerSynthesisText,
} from './careerSynthesisFingerprint';
import { normalizeCareerEmail } from './careerFingerprint';

export interface EnsureCareerSynthesisOptions {
  email: string;
  birthFingerprint: string;
  reportId: string;
  reading: CareerReading;
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
  fullName?: string;
  cached?: CareerAiSynthesis | null;
}

export interface EnsureCareerSynthesisResult {
  synthesis: CareerAiSynthesis;
  fromCache: boolean;
  saved: boolean;
}

function normalizeSynthesis(raw: unknown, expectedFingerprint: string): CareerAiSynthesis | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.fingerprint !== expectedFingerprint) return null;
  if (!isValidCareerSynthesisText(o.text)) return null;
  if (typeof o.generatedAt !== 'string') return null;
  return {
    text: o.text.trim(),
    fingerprint: expectedFingerprint,
    generatedAt: o.generatedAt,
  };
}

/** Session cache — survives remounts; keyed by email (unique per report). */
const resolvedByEmail = new Map<string, CareerAiSynthesis>();
const inFlightByEmail = new Map<string, Promise<EnsureCareerSynthesisResult>>();

export function peekCareerSynthesis(
  email: string,
  synthesisFingerprint: string,
): CareerAiSynthesis | null {
  const entry = resolvedByEmail.get(normalizeCareerEmail(email));
  if (!entry || entry.fingerprint !== synthesisFingerprint) return null;
  return entry;
}

/**
 * Returns a cached synthesis when available; otherwise calls Gemini once,
 * persists to the email-scoped report file, and never re-fetches on reload.
 */
export async function ensureCareerSynthesis(
  options: EnsureCareerSynthesisOptions,
): Promise<EnsureCareerSynthesisResult> {
  const email = normalizeCareerEmail(options.email);
  const synthesisFingerprint = careerSynthesisFingerprint(options.birthFingerprint);

  const fromServer = normalizeSynthesis(options.cached, synthesisFingerprint);
  if (fromServer) {
    resolvedByEmail.set(email, fromServer);
    return { synthesis: fromServer, fromCache: true, saved: true };
  }

  const peeked = peekCareerSynthesis(email, synthesisFingerprint);
  if (peeked) {
    return { synthesis: peeked, fromCache: true, saved: true };
  }

  const existing = inFlightByEmail.get(email);
  if (existing) return existing;

  const promise = (async (): Promise<EnsureCareerSynthesisResult> => {
    const text = await generateCareerSynthesisText(
      options.reading,
      options.snapshot,
      options.positions,
      options.fullName,
    );
    const synthesis: CareerAiSynthesis = {
      text,
      fingerprint: synthesisFingerprint,
      generatedAt: new Date().toISOString(),
    };

    let saved = false;
    try {
      await saveCareerSynthesis({
        email,
        reportId: options.reportId,
        aiSynthesis: synthesis,
      });
      saved = true;
      resolvedByEmail.set(email, synthesis);
    } catch {
      // Show the text even when persistence fails — next reload may regenerate.
      resolvedByEmail.set(email, synthesis);
    }

    return { synthesis, fromCache: false, saved };
  })().finally(() => {
    inFlightByEmail.delete(email);
  });

  inFlightByEmail.set(email, promise);
  return promise;
}

export function clearCareerSynthesisSession(email?: string): void {
  if (email) {
    resolvedByEmail.delete(normalizeCareerEmail(email));
    inFlightByEmail.delete(normalizeCareerEmail(email));
    return;
  }
  resolvedByEmail.clear();
  inFlightByEmail.clear();
}
