/**
 * Migrates chat_session docs with embedded `messages` arrays into per-session
 * subcollections under ai_chats/{sessionId}/messages/{messageId}.
 */

import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { debugError, debugLog } from '../lib/debug';
import {
  finalizeSubcollectionSession,
  markSessionSubcollectionFormat,
  sessionPath,
  writeMessagesToSubcollection,
  type StoredChatMessage,
} from './chatSessionService';

const EMBEDDED_MIGRATION_DONE_KEY = (uid: string) =>
  `soulblueprint:chatEmbeddedMigration:${uid}`;

function hasEmbeddedMigrated(uid: string): boolean {
  try {
    return window.localStorage.getItem(EMBEDDED_MIGRATION_DONE_KEY(uid)) === '1';
  } catch {
    return false;
  }
}

function markEmbeddedMigrated(uid: string): void {
  try {
    window.localStorage.setItem(EMBEDDED_MIGRATION_DONE_KEY(uid), '1');
  } catch {
    /* non-fatal */
  }
}

function parseEmbeddedMessages(raw: unknown): StoredChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const result: StoredChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const m = item as DocumentData;
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    if (typeof m.content !== 'string' || !m.content.trim()) continue;
    const createdAt =
      typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString();
    result.push({
      role: m.role,
      content: m.content,
      createdAt,
      seq: result.length,
      ...(m.isSaved ? { isSaved: true } : {}),
    });
  }
  return result;
}

async function migrateOneSession(
  db: Firestore,
  uid: string,
  sessionId: string,
  embedded: StoredChatMessage[]
): Promise<void> {
  await writeMessagesToSubcollection(db, uid, sessionId, embedded);
  const lastContent = embedded[embedded.length - 1]?.content ?? '';
  await finalizeSubcollectionSession(db, uid, sessionId, lastContent, embedded.length);
}

async function runEmbeddedMigration(db: Firestore, uid: string): Promise<number> {
  if (hasEmbeddedMigrated(uid)) return 0;

  const path = sessionPath(uid);
  let snap;
  try {
    snap = await getDocs(query(collection(db, path), where('type', '==', 'chat_session')));
  } catch {
    snap = await getDocs(collection(db, path));
  }

  let migrated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.type !== 'chat_session') continue;
    if (data.messagesFormat === 'subcollection') continue;

    const embedded = parseEmbeddedMessages(data.messages);
    if (embedded.length === 0) {
      await markSessionSubcollectionFormat(db, uid, docSnap.id);
      continue;
    }

    await migrateOneSession(db, uid, docSnap.id, embedded);
    migrated += 1;
    debugLog('chat-embedded-migration', 'Migrated embedded messages to subcollection', {
      sessionId: docSnap.id,
      messageCount: embedded.length,
    });
  }

  markEmbeddedMigrated(uid);
  return migrated;
}

const inFlight = new Map<string, Promise<number>>();

/** One-shot per user. Returns count of sessions migrated. */
export function migrateEmbeddedMessagesToSubcollection(
  db: Firestore,
  uid: string
): Promise<number> {
  const existing = inFlight.get(uid);
  if (existing) return existing;
  const run = runEmbeddedMigration(db, uid)
    .catch((error) => {
      debugError('chat-embedded-migration', 'Embedded messages migration failed', error);
      return 0;
    })
    .finally(() => inFlight.delete(uid));
  inFlight.set(uid, run);
  return run;
}
