import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve(process.cwd(), 'data/daily-reports');
const MAX_SNAPSHOT_BYTES = 768_000;

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

function emailDocId(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

export interface StoredDailyAiGuidance {
  guidance: unknown;
  fingerprint: string;
  generatedAt: string;
}

export interface StoredDailyReport {
  reportId: string;
  email: string;
  fingerprint: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlaceLabel?: string;
  currentPlaceLabel?: string;
  birthInstant?: { iso: string; offsetMinutes: number };
  snapshot: unknown;
  positions: unknown[];
  aiGuidance?: StoredDailyAiGuidance;
  aiTransitGuidance?: StoredDailyAiGuidance;
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

export async function readDailyReportById(reportId: string): Promise<StoredDailyReport | null> {
  if (!isValidReportId(reportId)) return null;
  try {
    const raw = await readFile(reportPath(reportId), 'utf8');
    return JSON.parse(raw) as StoredDailyReport;
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
  | { hit: true; report: StoredDailyReport }
  | { hit: false; stale?: boolean; reportId?: string; cachedFingerprint?: string };

export async function lookupDailyReportByEmail(
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

  const report = await readDailyReportById(index.reportId);
  if (!report) return { hit: false as const };

  return { hit: true as const, report };
}

export async function writeDailyReport(
  entry: Omit<StoredDailyReport, 'reportId' | 'cachedAt' | 'updatedAt'> & {
    reportId?: string;
    cachedAt?: string;
    aiGuidance?: StoredDailyAiGuidance;
    aiTransitGuidance?: StoredDailyAiGuidance;
  },
): Promise<StoredDailyReport> {
  await mkdir(CACHE_DIR, { recursive: true });

  const email = normalizeEmail(entry.email);
  if (!isValidEmail(email)) {
    throw new Error('Valid email is required');
  }

  const existing = entry.reportId && isValidReportId(entry.reportId)
    ? await readDailyReportById(entry.reportId)
    : null;

  const reportId =
    entry.reportId && isValidReportId(entry.reportId) ? entry.reportId : generateReportId();

  const now = new Date().toISOString();
  const stored: StoredDailyReport = {
    reportId,
    email,
    fingerprint: entry.fingerprint,
    fullName: entry.fullName,
    birthDate: entry.birthDate,
    birthTime: entry.birthTime,
    birthPlaceLabel: entry.birthPlaceLabel,
    currentPlaceLabel: entry.currentPlaceLabel,
    birthInstant: entry.birthInstant,
    snapshot: entry.snapshot,
    positions: entry.positions,
    aiGuidance: entry.aiGuidance ?? existing?.aiGuidance,
    aiTransitGuidance: entry.aiTransitGuidance ?? existing?.aiTransitGuidance,
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

export async function updateDailyReportGuidance(
  reportId: string,
  email: string,
  aiGuidance: StoredDailyAiGuidance,
): Promise<StoredDailyReport> {
  if (!isValidReportId(reportId)) {
    throw new Error('Invalid report id');
  }
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Valid email is required');
  }
  if (typeof aiGuidance.fingerprint !== 'string' || aiGuidance.fingerprint.length < 8) {
    throw new Error('Guidance fingerprint is required');
  }

  const existing = await readDailyReportById(reportId);
  if (!existing) {
    throw new Error('Report not found');
  }
  if (existing.email !== normalized) {
    throw new Error('Report does not belong to this email');
  }

  const now = new Date().toISOString();
  const stored: StoredDailyReport = {
    ...existing,
    aiGuidance: {
      guidance: aiGuidance.guidance,
      fingerprint: aiGuidance.fingerprint,
      generatedAt: aiGuidance.generatedAt || now,
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

export async function updateDailyReportTransitGuidance(
  reportId: string,
  email: string,
  aiTransitGuidance: StoredDailyAiGuidance,
): Promise<StoredDailyReport> {
  if (!isValidReportId(reportId)) {
    throw new Error('Invalid report id');
  }
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Valid email is required');
  }
  if (typeof aiTransitGuidance.fingerprint !== 'string' || aiTransitGuidance.fingerprint.length < 8) {
    throw new Error('Transit guidance fingerprint is required');
  }

  const existing = await readDailyReportById(reportId);
  if (!existing) {
    throw new Error('Report not found');
  }
  if (existing.email !== normalized) {
    throw new Error('Report does not belong to this email');
  }

  const now = new Date().toISOString();
  const stored: StoredDailyReport = {
    ...existing,
    aiTransitGuidance: {
      guidance: aiTransitGuidance.guidance,
      fingerprint: aiTransitGuidance.fingerprint,
      generatedAt: aiTransitGuidance.generatedAt || now,
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
