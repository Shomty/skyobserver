import type { PlanetPosition } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { CareerAiPlainSynthesis, CareerAiSynthesis, CareerSnapshot } from '../types';

export interface CareerReportSavePayload {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: BirthInstant;
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
}

export interface CareerReportLoadResult {
  hit: boolean;
  reportId?: string;
  /** Owner of the report — returned by the by-id endpoint, used for the test-account unlock. */
  email?: string;
  fingerprint?: string;
  snapshot?: CareerSnapshot;
  positions?: PlanetPosition[];
  aiSynthesis?: CareerAiSynthesis;
  aiPlainSynthesis?: CareerAiPlainSynthesis;
  cachedAt?: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  stale?: boolean;
  saved?: boolean;
}

export interface CareerReportRecord extends CareerReportLoadResult {
  reportId: string;
  fingerprint?: string;
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
  aiSynthesis?: CareerAiSynthesis;
  aiPlainSynthesis?: CareerAiPlainSynthesis;
}

const inflight = new Map<string, Promise<CareerReportLoadResult>>();
const synthesisInflight = new Map<string, Promise<{ saved: boolean; aiSynthesis: CareerAiSynthesis }>>();
const plainSynthesisInflight = new Map<
  string,
  Promise<{ saved: boolean; aiPlainSynthesis: CareerAiPlainSynthesis }>
>();

function loadKey(email: string, fingerprint: string): string {
  return `load:${email}:${fingerprint}`;
}

/** Look up a cached report by email + birth fingerprint (no recalculation). */
export async function loadCareerReport(
  email: string,
  fingerprint: string,
): Promise<CareerReportLoadResult> {
  const key = loadKey(email, fingerprint);
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/career/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, fingerprint }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Career report load failed (${res.status})`);
      }
      return res.json() as Promise<CareerReportLoadResult>;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function saveCareerReport(
  payload: CareerReportSavePayload,
): Promise<{ saved: boolean; reportId: string; cachedAt?: string }> {
  const res = await fetch('/api/career/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Career report save failed (${res.status})`);
  }
  return res.json() as Promise<{ saved: boolean; reportId: string; cachedAt?: string }>;
}

/** Persist the premium AI synthesis on the email-owned report — no Gemini re-call on reload. */
export async function saveCareerSynthesis(payload: {
  email: string;
  reportId: string;
  aiSynthesis: CareerAiSynthesis;
}): Promise<{ saved: boolean; aiSynthesis: CareerAiSynthesis; cachedAt?: string }> {
  const key = `syn:${payload.email}:${payload.reportId}`;
  const existing = synthesisInflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/career/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Career synthesis save failed (${res.status})`);
      }
      return res.json() as Promise<{
        saved: boolean;
        aiSynthesis: CareerAiSynthesis;
        cachedAt?: string;
      }>;
    })
    .finally(() => {
      synthesisInflight.delete(key);
    });

  synthesisInflight.set(key, promise);
  return promise;
}

/** Persist plain-English AI synthesis on the email-owned report. */
export async function saveCareerPlainSynthesis(payload: {
  email: string;
  reportId: string;
  aiPlainSynthesis: CareerAiPlainSynthesis;
}): Promise<{ saved: boolean; aiPlainSynthesis: CareerAiPlainSynthesis; cachedAt?: string }> {
  const key = `plain-syn:${payload.email}:${payload.reportId}`;
  const existing = plainSynthesisInflight.get(key);
  if (existing) return existing;

  const promise = fetch('/api/career/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Career plain synthesis save failed (${res.status})`);
      }
      return res.json() as Promise<{
        saved: boolean;
        aiPlainSynthesis: CareerAiPlainSynthesis;
        cachedAt?: string;
      }>;
    })
    .finally(() => {
      plainSynthesisInflight.delete(key);
    });

  plainSynthesisInflight.set(key, promise);
  return promise;
}

export async function fetchCareerReportById(reportId: string): Promise<CareerReportRecord | null> {
  const res = await fetch(`/api/career/report/${encodeURIComponent(reportId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Career report load failed (${res.status})`);
  }
  return res.json() as Promise<CareerReportRecord>;
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at <= 1) return '***';
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  return `${local[0]}${'*'.repeat(Math.min(3, local.length - 1))}@${domain}`;
}
