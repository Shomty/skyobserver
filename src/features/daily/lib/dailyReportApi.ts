import type { PlanetPosition } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { DailyAiPlainGuidance, DailySnapshot } from '../types';

export interface DailyReportSavePayload {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  currentPlaceLabel?: string;
  birthInstant?: BirthInstant;
  snapshot: DailySnapshot;
  positions: PlanetPosition[];
}

export interface DailyReportLoadResult {
  hit: boolean;
  reportId?: string;
  email?: string;
  fingerprint?: string;
  snapshot?: DailySnapshot;
  positions?: PlanetPosition[];
  aiGuidance?: DailyAiPlainGuidance;
  cachedAt?: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  currentPlaceLabel?: string;
  stale?: boolean;
  saved?: boolean;
}

export interface DailyReportRecord extends DailyReportLoadResult {
  reportId: string;
  snapshot: DailySnapshot;
  positions: PlanetPosition[];
  aiGuidance?: DailyAiPlainGuidance;
}

const inflight = new Map<string, Promise<DailyReportLoadResult>>();
const guidanceInflight = new Map<string, Promise<{ saved: boolean; aiGuidance: DailyAiPlainGuidance }>>();

function loadKey(email: string, fingerprint: string): string {
  return `load:${email}:${fingerprint}`;
}

export async function loadDailyReport(
  email: string,
  fingerprint: string,
): Promise<DailyReportLoadResult> {
  const key = loadKey(email, fingerprint);
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/daily/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, fingerprint }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 404) {
          throw new Error(
            'Daily report API not found — restart the dev server (npm run dev) so new /api/daily routes load.',
          );
        }
        throw new Error(err.error || `Daily report load failed (${res.status})`);
      }
      return res.json() as Promise<DailyReportLoadResult>;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function saveDailyReport(
  payload: DailyReportSavePayload,
): Promise<{ saved: boolean; reportId: string; cachedAt?: string }> {
  const res = await fetch('/api/daily/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error(
        'Daily report API not found — restart the dev server (npm run dev) so new /api/daily routes load.',
      );
    }
    throw new Error(err.error || `Daily report save failed (${res.status})`);
  }
  return res.json() as Promise<{ saved: boolean; reportId: string; cachedAt?: string }>;
}

export async function saveDailyGuidance(payload: {
  email: string;
  reportId: string;
  aiGuidance: DailyAiPlainGuidance;
}): Promise<{ saved: boolean; aiGuidance: DailyAiPlainGuidance; cachedAt?: string }> {
  const key = `guide:${payload.email}:${payload.reportId}`;
  const existing = guidanceInflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/daily/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Daily guidance save failed (${res.status})`);
      }
      return res.json() as Promise<{
        saved: boolean;
        aiGuidance: DailyAiPlainGuidance;
        cachedAt?: string;
      }>;
    })
    .finally(() => {
      guidanceInflight.delete(key);
    });

  guidanceInflight.set(key, promise);
  return promise;
}

export async function fetchDailyReportById(reportId: string): Promise<DailyReportRecord | null> {
  const res = await fetch(`/api/daily/report/${encodeURIComponent(reportId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Daily report load failed (${res.status})`);
  }
  return res.json() as Promise<DailyReportRecord>;
}
