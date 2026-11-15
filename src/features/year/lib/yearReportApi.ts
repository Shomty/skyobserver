import type { PlanetPosition } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { YearReading } from './yearEngine';
import type { YearAiSynthesis } from './yearSynthesisFingerprint';
import { withAuthHeader } from '../../../lib/authToken';

export interface YearReportSavePayload {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: BirthInstant;
  snapshot: YearReading;
  positions: PlanetPosition[];
}

export interface YearReportLoadResult {
  hit: boolean;
  reportId?: string;
  email?: string;
  fingerprint?: string;
  snapshot?: YearReading;
  positions?: PlanetPosition[];
  aiSynthesis?: YearAiSynthesis;
  cachedAt?: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  stale?: boolean;
  saved?: boolean;
}

const inflight = new Map<string, Promise<YearReportLoadResult>>();

export async function loadYearReport(email: string, fingerprint: string): Promise<YearReportLoadResult> {
  const key = `load:${email}:${fingerprint}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/year/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, fingerprint }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Year report load failed (${res.status})`);
      }
      return res.json() as Promise<YearReportLoadResult>;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function saveYearReport(
  payload: YearReportSavePayload,
): Promise<{ saved: boolean; reportId: string; cachedAt?: string }> {
  const res = await fetch('/api/year/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Year report save failed (${res.status})`);
  }
  return res.json() as Promise<{ saved: boolean; reportId: string; cachedAt?: string }>;
}

export async function saveYearSynthesis(
  reportId: string,
  email: string,
  synthesis: YearAiSynthesis,
): Promise<void> {
  const res = await withAuthHeader({ 'Content-Type': 'application/json', Accept: 'application/json' }).then((headers) => fetch('/api/year/report', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      reportId,
      aiSynthesis: synthesis,
    }),
  }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Year synthesis save failed (${res.status})`);
  }
}

export async function fetchYearReportById(reportId: string): Promise<YearReportLoadResult | null> {
  const res = await fetch(`/api/year/report/${encodeURIComponent(reportId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Year report fetch failed (${res.status})`);
  }
  return res.json() as Promise<YearReportLoadResult>;
}
