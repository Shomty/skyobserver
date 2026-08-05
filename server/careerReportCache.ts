import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve(process.cwd(), 'data/career-reports');
const MAX_SNAPSHOT_BYTES = 512_000;

/** URL-safe share id — 16 chars, easy to paste into IM / social posts. */
export function generateReportId(): string {
  return randomBytes(12).toString('base64url');
}

export function isValidReportId(reportId: string): boolean {
  return /^[A-Za-z0-9_-]{12,24}$/.test(reportId);
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

export interface StoredCareerAiSynthesis {
  text: string;
  fingerprint: string;
  generatedAt: string;
}

export type StoredCareerAiPlainSynthesis = StoredCareerAiSynthesis;

export interface StoredCareerReport {
  reportId: string;
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  birthInstant?: { iso: string; offsetMinutes: number };
  snapshot: unknown;
  positions: unknown[];
  /** Premium Gemini synthesis — persisted so reloads never call the API again. */
  aiSynthesis?: StoredCareerAiSynthesis;
  /** Plain-English Gemini synthesis — persisted per email report. */
  aiPlainSynthesis?: StoredCareerAiPlainSynthesis;
  cachedAt: string;
  updatedAt: string;
}

interface EmailIndex {
  email: string;
  reportId: string;
  fingerprint: string;
  updatedAt: string;
}

function reportPath(reportId: string): string {
  return path.join(CACHE_DIR, `${reportId}.json`);
}

function emailIndexPath(email: string): string {
  return path.join(CACHE_DIR, `email-${emailDocId(email)}.json`);
}

export async function readCareerReportById(reportId: string): Promise<StoredCareerReport | null> {
  if (!isValidReportId(reportId)) return null;
  try {
    const raw = await readFile(reportPath(reportId), 'utf8');
    return JSON.parse(raw) as StoredCareerReport;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') return null;
    throw err;
  }
}

async function readEmailIndex(email: string): Promise<EmailIndex | null> {
  try {
    const raw = await readFile(emailIndexPath(email), 'utf8');
    return JSON.parse(raw) as EmailIndex;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeEmailIndex(email: string, reportId: string, fingerprint: string): Promise<void> {
  const now = new Date().toISOString();
  const index: EmailIndex = {
    email: normalizeEmail(email),
    reportId,
    fingerprint,
    updatedAt: now,
  };
  await writeFile(emailIndexPath(email), JSON.stringify(index), 'utf8');
}

export type EmailLookupResult =
  | { hit: true; report: StoredCareerReport }
  | { hit: false; stale?: boolean; reportId?: string; cachedFingerprint?: string };

/** Resolve a saved report for this email when birth details match. */
export async function lookupCareerReportByEmail(
  email: string,
  fingerprint: string,
): Promise<EmailLookupResult> {
  const normalized = normalizeEmail(email);
  const index = await readEmailIndex(normalized);
  if (!index) return { hit: false as const };

  if (index.fingerprint !== fingerprint) {
    return {
      hit: false as const,
      stale: true,
      reportId: index.reportId,
      cachedFingerprint: index.fingerprint,
    };
  }

  const report = await readCareerReportById(index.reportId);
  if (!report) return { hit: false as const };

  return { hit: true as const, report };
}

export async function writeCareerReport(
  entry: Omit<StoredCareerReport, 'reportId' | 'cachedAt' | 'updatedAt'> & {
    reportId?: string;
    cachedAt?: string;
  },
): Promise<StoredCareerReport> {
  await mkdir(CACHE_DIR, { recursive: true });

  const email = normalizeEmail(entry.email);
  if (!isValidEmail(email)) {
    throw new Error('Valid email is required');
  }

  const reportId =
    entry.reportId && isValidReportId(entry.reportId) ? entry.reportId : generateReportId();

  const existing = await readCareerReportById(reportId);
  const now = new Date().toISOString();
  const stored: StoredCareerReport = {
    reportId,
    email,
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

  await writeFile(reportPath(reportId), serialized, 'utf8');
  await writeEmailIndex(email, reportId, entry.fingerprint);
  return stored;
}

export async function updateCareerReportSynthesis(
  reportId: string,
  email: string,
  aiSynthesis: StoredCareerAiSynthesis,
): Promise<StoredCareerReport> {
  if (!isValidReportId(reportId)) {
    throw new Error('Invalid report id');
  }
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Valid email is required');
  }
  if (typeof aiSynthesis.text !== 'string' || aiSynthesis.text.trim().length < 80) {
    throw new Error('Synthesis text is too short');
  }
  if (typeof aiSynthesis.fingerprint !== 'string' || aiSynthesis.fingerprint.length < 8) {
    throw new Error('Synthesis fingerprint is required');
  }

  const existing = await readCareerReportById(reportId);
  if (!existing) {
    throw new Error('Report not found');
  }
  if (existing.email !== normalized) {
    throw new Error('Report does not belong to this email');
  }

  const now = new Date().toISOString();
  const stored: StoredCareerReport = {
    ...existing,
    aiSynthesis: {
      text: aiSynthesis.text.trim(),
      fingerprint: aiSynthesis.fingerprint,
      generatedAt: aiSynthesis.generatedAt || now,
    },
    updatedAt: now,
  };

  const serialized = JSON.stringify(stored);
  if (serialized.length > MAX_SNAPSHOT_BYTES) {
    throw new Error('Report payload too large');
  }

  await writeFile(reportPath(reportId), serialized, 'utf8');
  return stored;
}

export async function updateCareerReportPlainSynthesis(
  reportId: string,
  email: string,
  aiPlainSynthesis: StoredCareerAiPlainSynthesis,
): Promise<StoredCareerReport> {
  if (!isValidReportId(reportId)) {
    throw new Error('Invalid report id');
  }
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Valid email is required');
  }
  if (typeof aiPlainSynthesis.text !== 'string' || aiPlainSynthesis.text.trim().length < 80) {
    throw new Error('Plain synthesis text is too short');
  }
  if (typeof aiPlainSynthesis.fingerprint !== 'string' || aiPlainSynthesis.fingerprint.length < 8) {
    throw new Error('Plain synthesis fingerprint is required');
  }

  const existing = await readCareerReportById(reportId);
  if (!existing) {
    throw new Error('Report not found');
  }
  if (existing.email !== normalized) {
    throw new Error('Report does not belong to this email');
  }

  const now = new Date().toISOString();
  const stored: StoredCareerReport = {
    ...existing,
    aiPlainSynthesis: {
      text: aiPlainSynthesis.text.trim(),
      fingerprint: aiPlainSynthesis.fingerprint,
      generatedAt: aiPlainSynthesis.generatedAt || now,
    },
    updatedAt: now,
  };

  const serialized = JSON.stringify(stored);
  if (serialized.length > MAX_SNAPSHOT_BYTES) {
    throw new Error('Report payload too large');
  }

  await writeFile(reportPath(reportId), serialized, 'utf8');
  return stored;
}
