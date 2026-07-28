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
import { db } from '../firebase';

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
 * Gets a cached AI report if it exists and hasn't expired.
 */
export async function getCachedReport(uid: string, type: string, cacheKey: string): Promise<any | null> {
  try {
    const q = query(
      collection(db, `users/${uid}/ai_reports`),
      where('cacheKey', '==', cacheKey),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const report = doc.data() as AIReport;
      
      // Check for expiration if applicable
      if (report.expiresAt && report.expiresAt instanceof Timestamp) {
        if (report.expiresAt.toDate() < new Date()) {
          return null;
        }
      }
      
      return report.data;
    }
  } catch (error) {
    console.error("Error fetching cached report:", error);
  }
  return null;
}

/**
 * Saves a generated AI report to the cache.
 */
export async function saveAIReport(uid: string, type: string, cacheKey: string, data: any, ttlHours?: number) {
  try {
    const expiresAt = ttlHours 
      ? Timestamp.fromDate(new Date(Date.now() + ttlHours * 60 * 60 * 1000))
      : null;

    await addDoc(collection(db, `users/${uid}/ai_reports`), {
      uid,
      type,
      cacheKey,
      data,
      createdAt: serverTimestamp(),
      ...(expiresAt && { expiresAt })
    });
  } catch (error) {
    console.error("Error saving AI report to cache:", error);
  }
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
export async function savePerAccountReport(uid: string, docId: string, data: any, fingerprint: string): Promise<boolean> {
  try {
    const ref = doc(db, `users/${uid}/ai_reports`, docId);
    await setDoc(ref, {
      uid,
      docId,
      data: stripUndefined(data),
      fingerprint,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error(`Error saving per-account report "${docId}" — report will be regenerated on next load:`, error);
    return false;
  }
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
