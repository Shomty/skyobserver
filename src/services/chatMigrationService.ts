/**
 * Migrates legacy flat ai_chats message docs into chat_session documents.
 *
 * Legacy format (pre session model): each message is its own doc:
 *   { uid, role, content, createdAt }
 *
 * Current format: one doc per conversation:
 *   { type: 'chat_session', title, messages: [...], createdAt, updatedAt }
 *
 * The chat history UI filters on type === 'chat_session', so legacy docs are invisible.
 */

import {
  collection,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { debugError, debugLog, debugWarn } from '../lib/debug';
import {
  writeMessagesToSubcollection,
  type StoredChatMessage,
} from './chatSessionService';

const MIGRATION_FLAG = 'migratedIntoSessionId';
const BATCH_LIMIT = 500;
/** localStorage secondary cache only — Firestore `chatMigrationVersion` is source of truth. */
const MIGRATION_DONE_KEY = (uid: string) => `soulblueprint:chatMigration:${uid}`;

type FirestoreTimestampLike = { toMillis?: () => number; seconds?: number };
type LegacyTimestamp = FirestoreTimestampLike | string | null | undefined;

interface LegacyChatDoc {
  id: string;
  role?: unknown;
  content?: unknown;
  createdAt?: LegacyTimestamp;
  type?: unknown;
  migratedIntoSessionId?: unknown;
}

interface FlatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: LegacyTimestamp;
}

function hasLocalMigrated(uid: string): boolean {
  try {
    return window.localStorage.getItem(MIGRATION_DONE_KEY(uid)) === '1';
  } catch {
    return false;
  }
}

function markLocalMigrated(uid: string): void {
  try {
    window.localStorage.setItem(MIGRATION_DONE_KEY(uid), '1');
  } catch {
    /* non-fatal */
  }
}

function toMillis(value: LegacyTimestamp): number {
  if (!value) return 0;
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

function createdAtIso(value: LegacyTimestamp): string {
  const ms = toMillis(value);
  return ms ? new Date(ms).toISOString() : new Date().toISOString();
}

function mapDocToLegacy(d: { id: string; data: () => DocumentData }): LegacyChatDoc {
  const data = d.data();
  return {
    id: d.id,
    role: data.role,
    content: data.content,
    createdAt: data.createdAt as LegacyTimestamp,
    type: data.type,
    migratedIntoSessionId: data[MIGRATION_FLAG],
  };
}

function isFlatMessage(d: LegacyChatDoc): d is LegacyChatDoc & FlatMessage {
  return (
    (d.role === 'user' || d.role === 'assistant') &&
    typeof d.content === 'string' &&
    d.content.trim().length > 0 &&
    d.type !== 'chat_session' &&
    !d.migratedIntoSessionId
  );
}

/** Group consecutive flat messages into conversation turns (gap > 30 min starts a new session). */
function groupIntoSessions(messages: FlatMessage[], gapMs = 30 * 60 * 1000): FlatMessage[][] {
  if (messages.length === 0) return [];
  const groups: FlatMessage[][] = [];
  let current: FlatMessage[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const next = messages[i];
    if (toMillis(next.createdAt) - toMillis(prev.createdAt) > gapMs) {
      groups.push(current);
      current = [next];
    } else {
      current.push(next);
    }
  }
  groups.push(current);
  return groups;
}

async function commitSessionGroup(
  db: Firestore,
  path: string,
  uid: string,
  group: FlatMessage[]
): Promise<string> {
  const sessionRef = doc(collection(db, path));
  const firstUser = group.find((m) => m.role === 'user');
  const title = (firstUser?.content || group[0].content).slice(0, 60);
  const firstAt = group[0].createdAt || serverTimestamp();
  const lastAt = group[group.length - 1].createdAt || serverTimestamp();
  const storedMessages: StoredChatMessage[] = group.map((m, index) => ({
    role: m.role,
    content: m.content,
    createdAt: createdAtIso(m.createdAt),
    seq: index,
  }));
  const lastContent = storedMessages[storedMessages.length - 1]?.content ?? '';

  const sessionPayload = {
    type: 'chat_session',
    messagesFormat: 'subcollection',
    title,
    subjectName: null,
    createdAt: firstAt,
    updatedAt: lastAt,
    lastMessagePreview: lastContent.slice(0, 100),
    messageCount: storedMessages.length,
    nextSeq: storedMessages.length,
    restoredFromIds: group.map((m) => m.id),
    restoredAt: serverTimestamp(),
  };

  if (group.length + 1 <= BATCH_LIMIT) {
    const sessionBatch = writeBatch(db);
    sessionBatch.set(sessionRef, sessionPayload);
    for (const m of group) {
      sessionBatch.update(doc(db, path, m.id), { [MIGRATION_FLAG]: sessionRef.id });
    }
    await sessionBatch.commit();
  } else {
    debugWarn('chat-migration', 'Group exceeds batch limit; splitting mark-updates', {
      messageCount: group.length,
    });
    const sessionBatch = writeBatch(db);
    sessionBatch.set(sessionRef, sessionPayload);
    await sessionBatch.commit();
    for (let i = 0; i < group.length; i += BATCH_LIMIT) {
      const markBatch = writeBatch(db);
      group.slice(i, i + BATCH_LIMIT).forEach((m) => {
        markBatch.update(doc(db, path, m.id), { [MIGRATION_FLAG]: sessionRef.id });
      });
      await markBatch.commit();
    }
  }

  await writeMessagesToSubcollection(db, uid, sessionRef.id, storedMessages);
  return sessionRef.id;
}

async function runMigration(db: Firestore, uid: string): Promise<number> {
  if (hasLocalMigrated(uid)) {
    return 0;
  }

  const path = `users/${uid}/ai_chats`;
  try {
    let snap;
    try {
      snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'asc')));
    } catch {
      snap = await getDocs(collection(db, path));
    }

    const flat: FlatMessage[] = snap.docs
      .map(mapDocToLegacy)
      .filter(isFlatMessage)
      .map(({ id, role, content, createdAt }) => ({ id, role, content, createdAt }))
      .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));

    if (flat.length === 0) {
      debugLog('chat-migration', 'No legacy flat messages to migrate', { uid });
      markLocalMigrated(uid);
      return 0;
    }

    const groups = groupIntoSessions(flat);
    let created = 0;

    for (const group of groups) {
      if (!group.some((m) => m.role === 'assistant')) continue;

      const sessionId = await commitSessionGroup(db, path, uid, group);
      created += 1;
      debugLog('chat-migration', 'Migrated legacy flat chat into session', {
        sessionId,
        messageCount: group.length,
        title: (group.find((m) => m.role === 'user')?.content || group[0].content).slice(0, 60),
      });
    }

    markLocalMigrated(uid);
    return created;
  } catch (error) {
    debugError('chat-migration', 'Legacy chat migration failed', error);
    return 0;
  }
}

const inFlight = new Map<string, Promise<number>>();

/**
 * One-shot migration for a user. Safe to call repeatedly — already-migrated flat docs are skipped.
 * Returns number of new chat_session docs created.
 */
export function migrateLegacyFlatChats(db: Firestore, uid: string): Promise<number> {
  const existing = inFlight.get(uid);
  if (existing) return existing;
  const run = runMigration(db, uid).finally(() => inFlight.delete(uid));
  inFlight.set(uid, run);
  return run;
}
