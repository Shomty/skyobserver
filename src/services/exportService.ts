import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches all Firestore data for a user and returns it as a plain JS object.
 * Collections included:
 *   - users/{uid} (profile document)
 *   - users/{uid}/savedCharts
 *   - users/{uid}/ai_reports
 *   - users/{uid}/ai_report_backups
 *   - users/{uid}/ai_chats  (type === 'chat_session' entries include embedded messages array)
 *   - users/{uid}/interpretations
 */
export async function exportUserData(uid: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    uid
  };

  // Profile document
  try {
    const profileSnap = await getDoc(doc(db, `users/${uid}`));
    result.profile = profileSnap.exists() ? profileSnap.data() : null;
  } catch {
    result.profile = null;
  }

  // Helper: fetch a simple top-level collection
  async function fetchCollection(path: string): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  }

  result.savedCharts = await fetchCollection(`users/${uid}/savedCharts`);
  result.ai_reports = await fetchCollection(`users/${uid}/ai_reports`);
  result.ai_report_backups = await fetchCollection(`users/${uid}/ai_report_backups`);
  result.interpretations = await fetchCollection(`users/${uid}/interpretations`);

  // Chat sessions (stored in ai_chats with type === 'chat_session', messages embedded)
  try {
    const sessionsSnap = await getDocs(
      query(collection(db, `users/${uid}/ai_chats`), orderBy('updatedAt', 'desc'))
    );
    result.chat_sessions = sessionsSnap.docs
      .map(d => ({ _id: d.id, ...d.data() }))
      .filter((d: any) => d.type === 'chat_session');
  } catch {
    result.chat_sessions = [];
  }

  return result;
}

/**
 * Triggers a browser download of the exported data as a JSON file.
 */
export function downloadExportAsJSON(data: Record<string, any>, uid: string): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `soulblueprint-export-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
