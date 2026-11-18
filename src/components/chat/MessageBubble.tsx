import React, { useRef } from 'react';
import { Bot, Bookmark, Check, CheckCircle2, Copy, Loader2, ScrollText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCopyToClipboard } from '../../lib/useCopyToClipboard';
import type { ChatLength } from '../../lib/chatLength';
import ChatMarkdown from './ChatMarkdown';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isSaved?: boolean;
  length?: ChatLength;
}

interface MessageBubbleProps {
  message: ChatMessageData;
  theme: 'dark' | 'light';
  onSave?: (content: string, id: string) => void;
  isSaving?: boolean;
  /** Re-asks the question this reply answered as an In-depth report. */
  onGoDeeper?: (id: string) => void;
  /** True while any reply is being generated. */
  isBusy?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme, onSave, isSaving, onGoDeeper, isBusy }) => {
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';
  const canSave = !!onSave && !isUser && message.id !== 'initial';
  const isWelcome = message.id === 'initial';
  const isInDepth = message.length === 'in_depth';
  const canGoDeeper = !!onGoDeeper && !isUser && !isInDepth && message.id !== 'initial';
  const proseRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useCopyToClipboard();
  const handleCopy = () => void copy(message.content, proseRef.current?.innerHTML);
  const footerBtn = isDark
    ? 'text-white/40 hover:text-white/60 hover:bg-white/5'
    : 'text-ink-muted hover:text-ink-primary hover:bg-surface-muted';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-jyotish-gold" />
        </div>
      )}
      <div className={cn(
        'relative group rounded-2xl shadow-sm',
        isUser
          ? 'max-w-[85%] lg:max-w-[75%] px-4 py-3 text-sm leading-relaxed'
          : 'max-w-[92%] lg:max-w-[80%] px-5 py-4 sm:px-6 sm:py-5',
        isUser
          ? 'bg-jyotish-gold/12 border border-jyotish-gold/25'
          : isDark
            ? 'bg-white/5 border border-white/10'
            : 'bg-surface-card border border-border-gold'
      )}>
        {isUser ? (
          <p className={cn('whitespace-pre-wrap', isDark ? 'text-white/95' : 'text-ink-primary')}>{message.content}</p>
        ) : (
          <ChatMarkdown ref={proseRef} content={message.content} theme={theme} />
        )}

        {canSave && (
          <button
            onClick={() => onSave(message.content, message.id)}
            disabled={message.isSaved || isSaving}
            className={cn(
              'absolute -right-8 top-0 p-1.5 rounded-full border opacity-0 group-hover:opacity-100 transition-all',
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                : 'bg-surface-card border-border-gold hover:bg-surface-muted shadow-sm',
              message.isSaved && 'opacity-100 text-green-600'
            )}
            title={message.isSaved ? 'Saved to Journal' : 'Save to Journal'}
          >
            {message.isSaved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {!isUser && !isWelcome && (
          <div className={cn('mt-4 pt-3 border-t flex flex-wrap items-center justify-end gap-1', isDark ? 'border-white/5' : 'border-border-gold')}>
            {isInDepth && (
              <span className="mr-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-mono text-jyotish-gold bg-jyotish-gold/10">
                <ScrollText className="w-3 h-3" />In-depth
              </span>
            )}
            {canGoDeeper && (
              <button
                type="button"
                onClick={() => onGoDeeper(message.id)}
                disabled={isBusy}
                title="Rewrite this answer as an in-depth report (uses 2 daily AI messages)"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all disabled:opacity-40',
                  footerBtn
                )}
              >
                <Sparkles className="w-3 h-3" />Go deeper
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy response"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all',
                copied ? 'text-green-600 bg-green-500/10' : footerBtn
              )}
            >
              {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
            </button>
            {canSave && (
              <button
                type="button"
                onClick={() => onSave(message.content, message.id)}
                disabled={message.isSaved || isSaving}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all',
                  message.isSaved ? 'text-green-600 bg-green-500/10' : footerBtn
                )}
              >
                {message.isSaved ? (
                  <><CheckCircle2 className="w-3 h-3" />Saved</>
                ) : isSaving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Saving...</>
                ) : (
                  <><Bookmark className="w-3 h-3" />Save to Journal</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
