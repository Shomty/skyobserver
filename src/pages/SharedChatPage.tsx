import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Printer, ExternalLink, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { getSharedChat, SharedChat } from '../services/shareService';
import MessageBubble, { ChatMessageData } from '../components/chat/MessageBubble';
import ChatPrintView from '../components/chat/ChatPrintView';

type LoadState = 'loading' | 'error' | 'not-found' | 'ready';

function toDateSafe(value: unknown): Date | null {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function SharedChatPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [state, setState] = useState<LoadState>('loading');
  const [chat, setChat] = useState<SharedChat | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!shareId) {
      setState('not-found');
      return;
    }
    setState('loading');
    getSharedChat(shareId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setState('not-found');
          return;
        }
        setChat(result);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const messages: ChatMessageData[] = (chat?.messages ?? []).map((m, i) => ({
    id: `shared-${i}`,
    role: m.role,
    content: m.content,
  }));

  const sharedDate = toDateSafe(chat?.createdAt);

  return (
    <div className={cn('min-h-screen font-sans flex flex-col', isDark ? 'bg-[#050505] text-white' : 'bg-white text-slate-900')}>
      <header
        className={cn(
          'sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl print:hidden',
          isDark ? 'bg-mystic-purple/60 border-jyotish-gold/10' : 'bg-white/80 border-slate-200'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-jyotish-gold" />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-widest gold-gradient-text">Jyotish AI</h1>
        </div>

        {state === 'ready' && (
          <button
            onClick={() => window.print()}
            title="Export as PDF"
            className={cn(
              'ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors',
              isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        )}
        <a
          href="/"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors',
            state === 'ready' ? '' : 'ml-auto',
            isDark ? 'text-jyotish-gold hover:bg-jyotish-gold/10' : 'text-amber-600 hover:bg-amber-50'
          )}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open App</span>
        </a>
      </header>

      <main className="flex-1 overflow-y-auto">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-jyotish-gold" />
            <p className={cn('text-xs uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>Loading shared chat…</p>
          </div>
        )}

        {(state === 'not-found' || state === 'error') && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-jyotish-gold" />
            </div>
            <h2 className="text-base font-bold">
              {state === 'error' ? 'Something went wrong' : 'This shared chat is no longer available'}
            </h2>
            <p className={cn('text-sm max-w-sm', isDark ? 'text-white/50' : 'text-slate-500')}>
              {state === 'error'
                ? 'We could not load this conversation. Please try again later.'
                : 'The link may have been revoked by its owner, or it never existed.'}
            </p>
            <a
              href="/"
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/20 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Explore Vedic Sky Observer
            </a>
          </div>
        )}

        {state === 'ready' && chat && (
          <div className="p-4 lg:p-6 max-w-4xl mx-auto w-full">
            {/* Conversation header */}
            <div className={cn('mb-6 pb-4 border-b', isDark ? 'border-white/10' : 'border-slate-200')}>
              <h2 className="text-lg font-bold">{chat.title}</h2>
              <div className={cn('flex items-center gap-2 mt-1.5 text-[11px] uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>
                <Users className="w-3 h-3" />
                <span>{chat.subjectName ?? 'Chart Reading'}</span>
                {sharedDate && <span>· {format(sharedDate, 'MMMM d, yyyy')}</span>}
              </div>
            </div>

            <div className="space-y-4 print:hidden">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} theme={theme} />
              ))}
            </div>

            <p className={cn('mt-8 text-center text-[10px] uppercase tracking-widest print:hidden', isDark ? 'text-white/25' : 'text-slate-300')}>
              Shared from Vedic Sky Observer · Read-only
            </p>
          </div>
        )}
      </main>

      {/* Screen-hidden; revealed only when printing (see index.css) */}
      {state === 'ready' && chat && (
        <ChatPrintView
          title={chat.title}
          subjectName={chat.subjectName}
          date={sharedDate ? format(sharedDate, 'MMMM d, yyyy') : undefined}
          messages={messages.map((m) => ({ role: m.role, content: m.content }))}
        />
      )}
    </div>
  );
}

export default SharedChatPage;
