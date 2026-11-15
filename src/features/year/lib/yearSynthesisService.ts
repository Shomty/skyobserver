import type { YearReading } from './yearEngine';
import { normalizeYearEmail } from './yearFingerprint';
import { saveYearSynthesis } from './yearReportApi';
import { generateYearSynthesisText } from './yearSynthesisGemini';
import {
  isValidYearSynthesisText,
  yearSynthesisFingerprint,
  type YearAiSynthesis,
} from './yearSynthesisFingerprint';

export type { YearAiSynthesis };

export interface EnsureYearSynthesisOptions {
  email: string;
  reportFingerprint: string;
  reportId: string;
  reading: YearReading;
  fullName?: string;
  cached?: YearAiSynthesis | null;
}

export interface EnsureYearSynthesisResult {
  synthesis: YearAiSynthesis;
  fromCache: boolean;
  saved: boolean;
}

function normalizeSynthesis(raw: unknown, expectedFingerprint: string): YearAiSynthesis | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;
  if (entry.fingerprint !== expectedFingerprint) return null;
  if (!isValidYearSynthesisText(entry.text)) return null;
  if (typeof entry.generatedAt !== 'string') return null;
  return {
    text: entry.text.trim(),
    fingerprint: expectedFingerprint,
    generatedAt: entry.generatedAt,
  };
}

const resolvedByEmail = new Map<string, YearAiSynthesis>();
const inFlightByEmail = new Map<string, Promise<EnsureYearSynthesisResult>>();

export function clearYearSynthesisSession(email?: string): void {
  if (!email) {
    resolvedByEmail.clear();
    return;
  }
  resolvedByEmail.delete(normalizeYearEmail(email));
}

export async function ensureYearSynthesis(options: EnsureYearSynthesisOptions): Promise<EnsureYearSynthesisResult> {
  const email = normalizeYearEmail(options.email);
  const fingerprint = yearSynthesisFingerprint(options.reportFingerprint);

  const fromServer = normalizeSynthesis(options.cached, fingerprint);
  if (fromServer) {
    resolvedByEmail.set(email, fromServer);
    return { synthesis: fromServer, fromCache: true, saved: true };
  }

  const peeked = resolvedByEmail.get(email);
  if (peeked?.fingerprint === fingerprint) {
    return { synthesis: peeked, fromCache: true, saved: true };
  }

  const existing = inFlightByEmail.get(email);
  if (existing) return existing;

  const promise = (async (): Promise<EnsureYearSynthesisResult> => {
    const text = await generateYearSynthesisText(options.reading, options.fullName);
    const synthesis: YearAiSynthesis = {
      text,
      fingerprint,
      generatedAt: new Date().toISOString(),
    };
    resolvedByEmail.set(email, synthesis);
    try {
      await saveYearSynthesis(options.reportId, email, synthesis);
      return { synthesis, fromCache: false, saved: true };
    } catch {
      return { synthesis, fromCache: false, saved: false };
    }
  })().finally(() => {
    inFlightByEmail.delete(email);
  });

  inFlightByEmail.set(email, promise);
  return promise;
}
