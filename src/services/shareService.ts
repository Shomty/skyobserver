import { serverTimestamp } from 'firebase/firestore';
import { db, collection, addDoc, doc, getDoc, deleteDoc } from '../firebase';
import { withRetry } from '../lib/api-utils';

/**
 * A single message inside a shared chat snapshot. This is a deliberately
 * minimal projection of the in-app chat message — only `role` and `content`
 * are ever published (no `isSaved`, no birth data, no system context).
 */
export interface SharedChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

/** A publicly shared, immutable snapshot of a chat conversation. */
export interface SharedChat {
  id: string;
  ownerUid: string;
  sourceChatId: string;
  title: string;
  subjectName: string | null;
  messages: SharedChatMessage[];
  createdAt: unknown;
}

export interface CreateSharedChatInput {
  sourceChatId: string;
  title: string;
  subjectName: string | null;
  messages: SharedChatMessage[];
}

const SHARED_CHATS = 'sharedChats';

/**
 * Publish a snapshot copy of a conversation to the public `sharedChats`
 * collection. The generated document id is an unguessable capability token
 * that becomes the shareable link. Returns the new shareId.
 *
 * Only `role`/`content`/`createdAt` are copied from each message — anything
 * else (e.g. `isSaved`) is intentionally stripped.
 */
export async function createSharedChat(uid: string, input: CreateSharedChatInput): Promise<string> {
  const messages: SharedChatMessage[] = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.createdAt ? { createdAt: m.createdAt } : {}),
  }));

  const ref = await withRetry(() =>
    addDoc(collection(db, SHARED_CHATS), {
      ownerUid: uid,
      sourceChatId: input.sourceChatId,
      title: input.title,
      subjectName: input.subjectName ?? null,
      messages,
      createdAt: serverTimestamp(),
    })
  );

  return ref.id;
}

/**
 * Revoke a shared link by deleting its snapshot document. Firestore rules
 * enforce that only the owner (or an admin) can delete; `uid` is accepted for
 * a clear call-site contract.
 */
export async function revokeSharedChat(shareId: string, _uid: string): Promise<void> {
  await withRetry(() => deleteDoc(doc(db, SHARED_CHATS, shareId)));
}

/**
 * Fetch a shared chat snapshot by its id. Returns `null` when the document
 * does not exist (never shared, or already revoked).
 */
export async function getSharedChat(shareId: string): Promise<SharedChat | null> {
  const snap = await getDoc(doc(db, SHARED_CHATS, shareId));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    ownerUid: data.ownerUid,
    sourceChatId: data.sourceChatId,
    title: data.title ?? 'Shared Chat',
    subjectName: data.subjectName ?? null,
    messages: Array.isArray(data.messages) ? (data.messages as SharedChatMessage[]) : [],
    createdAt: data.createdAt,
  };
}
