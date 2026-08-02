import type { PlanetPosition } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';
import type { CareerSnapshot } from '../types';

export interface CareerReportPayload {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: BirthInstant;
  snapshot?: CareerSnapshot;
  positions?: PlanetPosition[];
}

export interface CareerReportLoadResult {
  hit: boolean;
  reportId?: string;
  fingerprint?: string;
  snapshot?: CareerSnapshot;
  positions?: PlanetPosition[];
  cachedAt?: string;
  fullName?: string;
  stale?: boolean;
}

const inflight = new Map<string, Promise<CareerReportLoadResult>>();

function loadKey(email: string, fingerprint: string): string {
  return `load:${email}:${fingerprint}`;
}

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

export async function saveCareerReport(payload: CareerReportPayload): Promise<{ saved: boolean; cachedAt?: string; reportId?: string }> {
  const res = await fetch('/api/career/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Career report save failed (${res.status})`);
  }
  return res.json() as Promise<{ saved: boolean; cachedAt?: string; reportId?: string }>;
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at <= 1) return '***';
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  return `${local[0]}${'*'.repeat(Math.min(3, local.length - 1))}@${domain}`;
}
