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
        'relative group max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-jyotish-gold/10 border border-jyotish-gold/20'
          : isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
      )}>
        {isUser ? (
          <p className={isDark ? 'text-white' : 'text-slate-900'}>{message.content}</p>
        ) : (
          <div className={cn(
            'prose prose-sm max-w-none',
            isDark
              ? 'prose-invert prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold/90 prose-p:text-white/80 prose-li:text-white/80'
              : 'prose-headings:text-amber-700 prose-strong:text-amber-700/90'
          )}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {canSave && (
          <>
            {/* Hover save button (top-right) */}
            <button
              onClick={() => onSave(message.content, message.id)}
              disabled={message.isSaved || isSaving}
              className={cn(
                'absolute -right-8 top-0 p-1.5 rounded-full border opacity-0 group-hover:opacity-100 transition-all',
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm',
                message.isSaved && 'opacity-100 text-green-500'
              )}
              title={message.isSaved ? 'Saved to Profile' : 'Save Interpretation'}
            >
              {message.isSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Bottom save bar */}
            <div className={cn('mt-3 pt-3 border-t flex justify-end', isDark ? 'border-white/5' : 'border-slate-200')}>
              <button
                onClick={() => onSave(message.content, message.id)}
                disabled={message.isSaved || isSaving}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-mono transition-all',
                  message.isSaved
                    ? 'text-green-500 bg-green-500/10'
                    : isDark ? 'text-white/40 hover:text-white/60 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                )}
              >
                {message.isSaved ? (
                  <><CheckCircle2 className="w-3 h-3" />Saved</>
                ) : isSaving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Saving...</>
                ) : (
                  <><Bookmark className="w-3 h-3" />Save Insight</>
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
