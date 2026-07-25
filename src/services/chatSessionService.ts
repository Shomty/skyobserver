/**
 * Chat session persistence — messages live in a per-session subcollection:
 *   users/{uid}/ai_chats/{sessionId}/messages/{messageId}
 *
 * Session parent docs hold metadata only (title, subjectName, timestamps, preview).
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  deleteField,
  increment,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import type { ChatMessageData } from '../components/chat/MessageBubble';

export type ChatRole = 'user' | 'assistant';

export interface StoredChatMessage {
  role: ChatRole;
  content: string;
  createdAt: string;
  isSaved?: boolean;
  seq?: number;
}

export interface SessionMetadata {
  title: string;
  subjectName: string | null;
  shareId?: string | null;
}

const BATCH_LIMIT = 500;

export function sessionPath(uid: string): string {
  return `users/${uid}/ai_chats`;
}

export function messagesPath(uid: string, sessionId: string): string {
  return `${sessionPath(uid)}/${sessionId}/messages`;
}

function preview(content: string): string {
  return content.slice(0, 100);
}

function mapEmbeddedMessage(m: DocumentData, index: number): ChatMessageData | null {
  if (m.role !== 'user' && m.role !== 'assistant') return null;
  if (typeof m.content !== 'string') return null;
  const createdAt = typeof m.createdAt === 'string' ? m.createdAt : String(index);
  return {
    id: `embedded-${index}-${createdAt}`,
    role: m.role,
    content: m.content,
    isSaved: Boolean(m.isSaved),
  };
}

export function mapEmbeddedMessages(raw: unknown): ChatMessageData[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m, i) => mapEmbeddedMessage(m as DocumentData, i))
    .filter((m): m is ChatMessageData => m !== null);
}

export function mapMessageDoc(id: string, data: DocumentData): ChatMessageData | null {
  if (data.role !== 'user' && data.role !== 'assistant') return null;
  if (typeof data.content !== 'string') return null;
  return {
    id,
    role: data.role,
    content: data.content,
    isSaved: Boolean(data.isSaved),
  };
}

function sortMessageDocs(
  docs: Array<{ id: string; data: () => DocumentData }>
): ChatMessageData[] {
  const withMeta = docs
    .map((d) => {
      const data = d.data();
      const mapped = mapMessageDoc(d.id, data);
      if (!mapped) return null;
      return {
        mapped,
        seq: typeof data.seq === 'number' ? data.seq : null,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const allHaveSeq = withMeta.every((m) => m.seq !== null);
  withMeta.sort((a, b) => {
    if (allHaveSeq && a.seq !== null && b.seq !== null) return a.seq - b.seq;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return withMeta.map((m) => m.mapped);
}

/** Create a new chat_session parent doc (no embedded messages). */
export async function createChatSession(
  db: Firestore,
  uid: string,
  input: { title: string; subjectName: string | null }
): Promise<string> {
  const ref = await addDoc(collection(db, sessionPath(uid)), {
    type: 'chat_session',
    messagesFormat: 'subcollection',
    title: input.title,
    subjectName: input.subjectName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0,
    nextSeq: 0,
  });
  return ref.id;
}

/**
 * Append one message to the subcollection and update session metadata atomically.
 * Assigns a monotonic `seq` from the session's `nextSeq`.
 */
export async function appendChatMessage(
  db: Firestore,
  uid: string,
  sessionId: string,
  message: StoredChatMessage
): Promise<string> {
  const sessionRef = doc(db, sessionPath(uid), sessionId);
  const msgRef = doc(collection(db, messagesPath(uid, sessionId)));

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const data = sessionSnap.data() ?? {};
    const nextSeq = typeof data.nextSeq === 'number' ? data.nextSeq : 0;

    tx.set(msgRef, {
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      seq: nextSeq,
      serverCreatedAt: serverTimestamp(),
      ...(message.isSaved ? { isSaved: true } : {}),
    });

    tx.update(sessionRef, {
      updatedAt: serverTimestamp(),
      lastMessagePreview: preview(message.content),
      messageCount: increment(1),
      nextSeq: nextSeq + 1,
    });
  });

  return msgRef.id;
}

/** Patch session metadata (title, shareId, updatedAt). */
export async function touchChatSession(
  db: Firestore,
  uid: string,
  sessionId: string,
  patch: Partial<{ title: string; shareId: string | null }>
): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.shareId === null) update.shareId = deleteField();
  else if (patch.shareId !== undefined) update.shareId = patch.shareId;
  await updateDoc(doc(db, sessionPath(uid), sessionId), update);
}

/** Mark a subcollection message as saved to interpretations. */
export async function markChatMessageSaved(
  db: Firestore,
  uid: string,
  sessionId: string,
  messageId: string
): Promise<void> {
  await updateDoc(doc(db, messagesPath(uid, sessionId), messageId), { isSaved: true });
}

/** Read messages — subcollection first (seq, then createdAt), embedded array as fallback. */
export async function fetchChatMessages(
  db: Firestore,
  uid: string,
  sessionId: string,
  sessionData?: DocumentData
): Promise<ChatMessageData[]> {
  const msgsCol = collection(db, messagesPath(uid, sessionId));

  try {
    const bySeq = await getDocs(query(msgsCol, orderBy('seq', 'asc')));
    if (!bySeq.empty) {
      return bySeq.docs
        .map((d) => mapMessageDoc(d.id, d.data()))
        .filter((m): m is ChatMessageData => m !== null);
    }
  } catch {
    /* missing index or field — fall through */
  }

  try {
    const byCreated = await getDocs(query(msgsCol, orderBy('createdAt', 'asc')));
    if (!byCreated.empty) {
      return byCreated.docs
        .map((d) => mapMessageDoc(d.id, d.data()))
        .filter((m): m is ChatMessageData => m !== null);
    }
  } catch {
    const unordered = await getDocs(msgsCol);
    if (!unordered.empty) return sortMessageDocs(unordered.docs);
  }

  const embedded = sessionData?.messages;
  if (!Array.isArray(embedded)) return [];

  return embedded
    .map((m, i) => mapEmbeddedMessage(m as DocumentData, i))
    .filter((m): m is ChatMessageData => m !== null);
}

/** Delete all messages in a session subcollection, then the session doc. */
export async function deleteChatSession(
  db: Firestore,
  uid: string,
  sessionId: string
): Promise<void> {
  const msgsSnap = await getDocs(collection(db, messagesPath(uid, sessionId)));
  for (let i = 0; i < msgsSnap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    msgsSnap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, sessionPath(uid), sessionId));
}

/** Write multiple messages to subcollection in batches (used by migrations). */
export async function writeMessagesToSubcollection(
  db: Firestore,
  uid: string,
  sessionId: string,
  messages: StoredChatMessage[]
): Promise<void> {
  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = messages.slice(i, i + BATCH_LIMIT);
    for (let j = 0; j < chunk.length; j++) {
      const m = chunk[j];
      const seq = typeof m.seq === 'number' ? m.seq : i + j;
      const ref = doc(collection(db, messagesPath(uid, sessionId)));
      batch.set(ref, {
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        seq,
        serverCreatedAt: serverTimestamp(),
        ...(m.isSaved ? { isSaved: true } : {}),
      });
    }
    await batch.commit();
  }
}

/** Finalize a session after migrating embedded messages to subcollection. */
export async function finalizeSubcollectionSession(
  db: Firestore,
  uid: string,
  sessionId: string,
  lastContent: string,
  messageCount = 0
): Promise<void> {
  await updateDoc(doc(db, sessionPath(uid), sessionId), {
    messagesFormat: 'subcollection',
    messages: deleteField(),
    lastMessagePreview: preview(lastContent),
    messageCount,
    nextSeq: messageCount,
    updatedAt: serverTimestamp(),
  });
}

/** Mark an empty legacy session as subcollection-ready. */
export async function markSessionSubcollectionFormat(
  db: Firestore,
  uid: string,
  sessionId: string
): Promise<void> {
  await updateDoc(doc(db, sessionPath(uid), sessionId), {
    messagesFormat: 'subcollection',
    messages: deleteField(),
    messageCount: 0,
    nextSeq: 0,
  });
}
