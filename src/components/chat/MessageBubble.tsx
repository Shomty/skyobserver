import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Bookmark, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isSaved?: boolean;
}

interface MessageBubbleProps {
  message: ChatMessageData;
  theme: 'dark' | 'light';
  onSave?: (content: string, id: string) => void;
  isSaving?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme, onSave, isSaving }) => {
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';
  const canSave = !!onSave && !isUser && message.id !== 'initial';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-jyotish-gold" />
        </div>
      )}
      <div className={cn(
        'relative group max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
        isUser
          ? 'bg-jyotish-gold/12 border border-jyotish-gold/25'
          : isDark
            ? 'bg-white/5 border border-white/10'
            : 'bg-surface-card border border-border-gold'
      )}>
        {isUser ? (
          <p className={isDark ? 'text-white/95' : 'text-ink-primary'}>{message.content}</p>
        ) : (
          <div className={cn(
            'prose prose-sm max-w-none',
            isDark
              ? 'prose-invert prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold/90 prose-p:text-white/80 prose-li:text-white/80'
              : 'prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold prose-p:text-ink-secondary prose-li:text-ink-secondary prose-a:text-cosmic-deep'
          )}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {canSave && (
          <>
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

            <div className={cn('mt-3 pt-3 border-t flex justify-end', isDark ? 'border-white/5' : 'border-border-gold')}>
              <button
                onClick={() => onSave(message.content, message.id)}
                disabled={message.isSaved || isSaving}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all',
                  message.isSaved
                    ? 'text-green-600 bg-green-500/10'
                    : isDark
                      ? 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-muted'
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
