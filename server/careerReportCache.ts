import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve(process.cwd(), 'data/career-reports');
const MAX_SNAPSHOT_BYTES = 512_000;

export interface StoredCareerReport {
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: { iso: string; offsetMinutes: number };
  snapshot: unknown;
  positions: unknown[];
  cachedAt: string;
  updatedAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const n = normalizeEmail(email);
  return n.length >= 3 && n.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n);
}

export function emailDocId(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function cachePath(email: string): string {
  return path.join(CACHE_DIR, `${emailDocId(email)}.json`);
}

export async function readCareerReport(email: string): Promise<StoredCareerReport | null> {
  try {
    const raw = await readFile(cachePath(email), 'utf8');
    return JSON.parse(raw) as StoredCareerReport;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeCareerReport(
  email: string,
  entry: Omit<StoredCareerReport, 'email' | 'cachedAt' | 'updatedAt'> & { cachedAt?: string },
): Promise<StoredCareerReport> {
  await mkdir(CACHE_DIR, { recursive: true });

  const existing = await readCareerReport(email);
  const now = new Date().toISOString();
  const stored: StoredCareerReport = {
    email: normalizeEmail(email),
    fingerprint: entry.fingerprint,
    fullName: entry.fullName,
    birthDate: entry.birthDate,
    birthTime: entry.birthTime,
    birthPlaceLabel: entry.birthPlaceLabel,
    birthInstant: entry.birthInstant,
    snapshot: entry.snapshot,
    positions: entry.positions,
    cachedAt: existing?.cachedAt ?? entry.cachedAt ?? now,
    updatedAt: now,
  };

  const serialized = JSON.stringify(stored);
  if (serialized.length > MAX_SNAPSHOT_BYTES) {
    throw new Error('Report payload too large');
  }

  await writeFile(cachePath(email), serialized, 'utf8');
  return stored;
}
