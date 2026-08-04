import type { PlanetPosition } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';

export interface PersonalReportSavePayload {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: BirthInstant;
  snapshot: PersonalSnapshot;
  positions: PlanetPosition[];
}

export interface PersonalReportLoadResult {
  hit: boolean;
  reportId?: string;
  email?: string;
  fingerprint?: string;
  snapshot?: PersonalSnapshot;
  positions?: PlanetPosition[];
  aiSynthesis?: PersonalAiGuidance;
  cachedAt?: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  stale?: boolean;
  saved?: boolean;
}

export interface PersonalReportRecord extends PersonalReportLoadResult {
  reportId: string;
  fingerprint?: string;
  snapshot: PersonalSnapshot;
  positions: PlanetPosition[];
  aiSynthesis?: PersonalAiGuidance;
}

const inflight = new Map<string, Promise<PersonalReportLoadResult>>();
const synthesisInflight = new Map<string, Promise<{ saved: boolean; aiSynthesis: PersonalAiGuidance }>>();

function loadKey(email: string, fingerprint: string): string {
  return `load:${email}:${fingerprint}`;
}

export async function loadPersonalReport(
  email: string,
  fingerprint: string,
): Promise<PersonalReportLoadResult> {
  const key = loadKey(email, fingerprint);
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/personal/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, fingerprint }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Personal report load failed (${res.status})`);
      }
      return res.json() as Promise<PersonalReportLoadResult>;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function savePersonalReport(
  payload: PersonalReportSavePayload,
): Promise<{ saved: boolean; reportId: string; cachedAt?: string }> {
  const res = await fetch('/api/personal/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Personal report save failed (${res.status})`);
  }
  return res.json() as Promise<{ saved: boolean; reportId: string; cachedAt?: string }>;
}

export async function savePersonalSynthesis(payload: {
  email: string;
  reportId: string;
  aiSynthesis: PersonalAiGuidance;
}): Promise<{ saved: boolean; aiSynthesis: PersonalAiGuidance; cachedAt?: string }> {
  const key = `syn:${payload.email}:${payload.reportId}`;
  const existing = synthesisInflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/personal/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Personal synthesis save failed (${res.status})`);
      }
      return res.json() as Promise<{
        saved: boolean;
        aiSynthesis: PersonalAiGuidance;
        cachedAt?: string;
      }>;
    })
    .finally(() => {
      synthesisInflight.delete(key);
    });

  synthesisInflight.set(key, promise);
  return promise;
}

export async function fetchPersonalReportById(reportId: string): Promise<PersonalReportRecord | null> {
  const res = await fetch(`/api/personal/report/${encodeURIComponent(reportId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Personal report load failed (${res.status})`);
  }
  return res.json() as Promise<PersonalReportRecord>;
}
