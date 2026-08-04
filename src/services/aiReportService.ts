import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebase';
import { debugWarn } from '../lib/debug';

export interface AIReport {
  id?: string;
  uid: string;
  cacheKey: string;
  type: string;
  data: any;
  createdAt: any;
  expiresAt?: any;
}

/**
 * Gets a permanent per-account report by a fixed document ID.
 * Returns { data, fingerprint } or null.
 * Use for reports that must survive indefinitely but invalidate when birth details change.
 */
export async function getPerAccountReport(uid: string, docId: string): Promise<{ data: any; fingerprint: string } | null> {
  try {
    const ref = doc(db, `users/${uid}/ai_reports`, docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return { data: d.data, fingerprint: d.fingerprint ?? '' };
    }
  } catch (error) {
    console.error("Error fetching per-account report:", error);
  }
  return null;
}

/**
 * Firestore rejects any `undefined` value in a write. AI responses can omit an
 * optional field, which would abort the whole write and silently disable
 * caching — causing the report to be regenerated on every page load.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

/**
 * Upserts a permanent per-account report (overwrites previous version).
 * Stores the birth fingerprint alongside the data so callers can detect staleness.
 *
 * Returns true only when the write reached Firestore. Callers that show a
 * "cached / saved" state must use this result — a failed write means the next
 * load will regenerate the report.
 */
export async function savePerAccountReport(
  uid: string,
  docId: string,
  data: any,
  fingerprint: string,
  type?: string,
): Promise<boolean> {
  try {
    const ref = doc(db, `users/${uid}/ai_reports`, docId);
    await setDoc(ref, {
      uid,
      docId,
      data: stripUndefined(data),
      fingerprint,
      // `type` and `cacheKey` keep these docs readable by the Journal/Archives
      // views, which were written against the legacy report shape. `createdAt`
      // is required for them to appear at all — `getUserReports` orders by it,
      // and Firestore drops documents that lack the ordered field.
      type: type ?? docId,
      cacheKey: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error(`Error saving per-account report "${docId}" — report will be regenerated on next load:`, error);
    return false;
  }
}

/**
 * Firestore document IDs cannot contain "/" and must not be "." or "..".
 * Report IDs are built from yoga names and ISO timestamps, so normalise them.
 */
function toDocId(rawId: string): string {
  const safe = rawId.replace(/[/\\]/g, '-').trim();
  return safe === '' || safe === '.' || safe === '..' ? `report-${encodeURIComponent(rawId)}` : safe;
}

/**
 * Fingerprint for reports that describe the *current sky* (transits, panchang).
 * Keyed by birth details plus the calendar day, so the report is generated once
 * per day and survives reloads and tab switches within that day.
 */
export function dailyFingerprint(birthFingerprint: string | null | undefined, date: Date): string {
  return `${birthFingerprint ?? 'nob'}|${format(date, 'yyyy-MM-dd')}`;
}

/**
 * Fingerprint for content that depends on neither birth details nor the date
 * (e.g. a generic yoga description). Bump the version to force a refresh.
 */
export const STATIC_FINGERPRINT = 'static-v1';

export interface EnsureReportOptions<T> {
  uid: string;
  /** Fixed document ID — one document per report, overwritten on regeneration. */
  docId: string;
  /** Report type, used for Journal/Archives labelling. */
  type: string;
  /** Regeneration happens only when this value changes. */
  fingerprint: string;
  generate: () => Promise<T>;
  /**
   * Validates/normalises both cached and freshly generated payloads. Returning
   * null for a cached value discards it and triggers regeneration.
   */
  normalize?: (raw: unknown) => T | null;
  /** Bypasses the cache and forces a new Gemini call. */
  force?: boolean;
}

export interface EnsureReportResult<T> {
  data: T;
  /** True when the value came from Firestore and no API call was made. */
  fromCache: boolean;
  /** False when the Firestore write failed — the next load would regenerate. */
  saved: boolean;
}

/**
 * Module-level so that unmounting a component (tab switch, route change) does
 * not drop the in-flight request — two mounts asking for the same report share
 * a single Gemini call.
 */
const inFlightReports = new Map<string, Promise<{ data: unknown; saved: boolean }>>();

/**
 * Survives DataDashboard / page remounts within the same JS session so a
 * natal report already paid for (and/or read from Firestore) is returned
 * synchronously — without a loading flash or a second network round-trip.
 */
const resolvedReports = new Map<string, { data: unknown; fingerprint: string; saved: boolean }>();

function resolvedKey(uid: string, docId: string): string {
  return `${uid}|${docId}`;
}

function rememberResolved(
  uid: string,
  docId: string,
  fingerprint: string,
  data: unknown,
  saved: boolean,
): void {
  resolvedReports.set(resolvedKey(uid, docId), { data, fingerprint, saved });
}

/**
 * Synchronous session-cache peek. Returns null on miss / fingerprint mismatch.
 * Use before setting a loading spinner so remounts can hydrate instantly.
 */
export function peekResolvedReport<T>(
  uid: string,
  docId: string,
  fingerprint: string,
  normalize?: (raw: unknown) => T | null,
): T | null {
  const entry = resolvedReports.get(resolvedKey(uid, toDocId(docId)));
  if (!entry || entry.fingerprint !== fingerprint) return null;
  const normalizeValue = (raw: unknown): T | null =>
    normalize ? normalize(raw) : (raw == null ? null : (raw as T));
  return normalizeValue(entry.data);
}

/**
 * The single entry point for every cached AI report.
 *
 * Reads the document by ID (never a query, so no composite index is involved),
 * returns it when the fingerprint still matches, and otherwise generates once —
 * deduped across concurrent callers — and persists the result before returning.
 */
export async function ensureReport<T>({
  uid,
  docId,
  type,
  fingerprint,
  generate,
  normalize,
  force = false,
}: EnsureReportOptions<T>): Promise<EnsureReportResult<T>> {
  const safeDocId = toDocId(docId);
  const normalizeValue = (raw: unknown): T | null =>
    normalize ? normalize(raw) : (raw == null ? null : (raw as T));

  if (!force) {
    const memory = resolvedReports.get(resolvedKey(uid, safeDocId));
    if (memory && memory.fingerprint === fingerprint) {
      const value = normalizeValue(memory.data);
      if (value !== null) {
        return { data: value, fromCache: true, saved: memory.saved };
      }
    }

    try {
      const cached = await getPerAccountReport(uid, safeDocId);
      if (cached && cached.fingerprint === fingerprint) {
        const value = normalizeValue(cached.data);
        if (value !== null) {
          rememberResolved(uid, safeDocId, fingerprint, value, true);
          return { data: value, fromCache: true, saved: true };
        }
        // A stored report that no longer validates is the other way a cache
        // silently degrades into "regenerate on every load".
        debugWarn('ai-report', 'Cached report failed validation — regenerating', { docId: safeDocId });
      } else if (cached) {
        debugWarn('ai-report', 'Cached report discarded — fingerprint changed', {
          docId: safeDocId,
          cachedFingerprint: cached.fingerprint,
          currentFingerprint: fingerprint,
        });
      }
    } catch {
      // Cache read failure must not block the user — fall through to generation.
    }
  }

  const inFlightKey = `${uid}|${safeDocId}|${fingerprint}`;
  let pending = force ? undefined : inFlightReports.get(inFlightKey);

  if (!pending) {
    // Persist inside the shared task so an already-paid-for response is never
    // discarded unsaved when the component that requested it has unmounted.
    pending = (async () => {
      const generated = await generate();
      const value = normalizeValue(generated);
      // A response that fails validation is still shown to the user, but it is
      // never cached — otherwise a single bad generation would be pinned until
      // the birth details change.
      if (value === null) return { data: generated, saved: false };
      const saved = await savePerAccountReport(uid, safeDocId, value, fingerprint, type);
      rememberResolved(uid, safeDocId, fingerprint, value, saved);
      return { data: value, saved };
    })();

    inFlightReports.set(inFlightKey, pending);
    const clear = () => {
      if (inFlightReports.get(inFlightKey) === pending) inFlightReports.delete(inFlightKey);
    };
    pending.then(clear, clear);
  }

  const { data, saved } = await pending;
  return { data: data as T, fromCache: false, saved };
}

export interface SavedInterpretation {
  id?: string;
  uid: string;
  title: string;
  content: string;
  type: string;
  context?: string;
  createdAt: any;
}

export async function getUserInterpretations(uid: string): Promise<SavedInterpretation[]> {
  try {
    const q = query(
      collection(db, `users/${uid}/interpretations`),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as SavedInterpretation[];
  } catch (error) {
    console.error('Error fetching user interpretations:', error);
    return [];
  }
}

export async function deleteInterpretation(uid: string, interpretationId: string) {
  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, `users/${uid}/interpretations`, interpretationId));
  } catch (error) {
    console.error('Error deleting interpretation:', error);
  }
}

export async function getUserReports(uid: string): Promise<AIReport[]> {
  try {
    const q = query(
      collection(db, `users/${uid}/ai_reports`),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AIReport[];
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return [];
  }
}

/**
 * Deletes an AI report.
 */
export async function deleteAIReport(uid: string, reportId: string) {
  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, `users/${uid}/ai_reports`, reportId));
  } catch (error) {
    console.error("Error deleting AI report:", error);
  }
}

// ─── Backup & Restore ────────────────────────────────────────────────────────

export interface AIReportBackup {
  id?: string;
  type: string;
  data: any;
  createdAt: any;
}

/**
 * Creates a backup snapshot of AI data to users/{uid}/ai_report_backups.
 */
export async function backupAIReport(uid: string, type: string, data: any): Promise<string | null> {
  try {
    const ref = await addDoc(collection(db, `users/${uid}/ai_report_backups`), {
      type,
      data,
      createdAt: serverTimestamp()
    });
    return ref.id;
  } catch (error) {
    console.error("Error creating AI report backup:", error);
    return null;
  }
}

/**
 * Returns the most recent N backups for a given type (sorted newest first).
 */
export async function getAIReportBackups(uid: string, type: string, maxCount = 5): Promise<AIReportBackup[]> {
  try {
    const q = query(
      collection(db, `users/${uid}/ai_report_backups`),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AIReportBackup[];
  } catch (error) {
    console.error("Error fetching AI report backups:", error);
    return [];
  }
}

/**
 * Fetches the data from a specific backup doc.
 */
export async function restoreAIReport(uid: string, backupId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, `users/${uid}/ai_report_backups`, backupId));
    if (snap.exists()) return (snap.data() as AIReportBackup).data;
  } catch (error) {
    console.error("Error restoring AI report backup:", error);
  }
  return null;
}
