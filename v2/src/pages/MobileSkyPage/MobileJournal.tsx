import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trash2, BookOpen } from 'lucide-react';
import type { User } from 'firebase/auth';
import { db, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from '../../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  text: string;
  createdAt: any;
}

interface MobileJournalProps {
  user: User;
}

const MobileJournal: React.FC<MobileJournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'journal'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<JournalEntry, 'id'>) })));
    });
    return unsub;
  }, [user.uid]);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'journal'), {
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setText('');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'users', user.uid, 'journal', id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 14px 0' }}>
      {/* Compose area */}
      <div style={{
        background: 'var(--ms-surface)',
        border: '1px solid var(--ms-border)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Record a cosmic observation…"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--ms-fg)',
            fontSize: 14,
            fontFamily: 'inherit',
            lineHeight: 1.55,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              background: text.trim() ? 'var(--ms-gold)' : 'var(--ms-s2)',
              color: text.trim() ? '#0a0514' : 'var(--ms-muted)',
              border: 'none', borderRadius: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: '.07em',
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'background .15s, color .15s',
            }}
          >
            <PlusCircle size={13} />
            {saving ? 'SAVING…' : 'ADD ENTRY'}
          </button>
        </div>
      </div>

      {/* Entry list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 14 }}>
        {entries.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 48, gap: 10, color: 'var(--ms-muted)',
          }}>
            <BookOpen size={32} opacity={0.4} />
            <p style={{ fontSize: 12, letterSpacing: '.07em' }}>NO ENTRIES YET</p>
          </div>
        )}
        {entries.map(entry => (
          <div key={entry.id} style={{
            background: 'var(--ms-surface)',
            border: '1px solid var(--ms-border)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ms-fg)', flex: 1, whiteSpace: 'pre-wrap' }}>
                {entry.text}
              </p>
              <button
                onClick={() => remove(entry.id)}
                style={{
                  background: 'none', border: 'none', padding: 4,
                  color: 'var(--ms-muted)', cursor: 'pointer', flexShrink: 0,
                }}
                aria-label="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {entry.createdAt?.toDate && (
              <p style={{ fontSize: 9.5, color: 'var(--ms-muted)', marginTop: 6, letterSpacing: '.06em' }}>
                {format(entry.createdAt.toDate(), 'MMM d, yyyy · h:mm a')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileJournal;
