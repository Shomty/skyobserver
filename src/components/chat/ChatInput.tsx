import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
  theme: 'dark' | 'light';
  autoFocus?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Ask about your chart, transits, yogas… (Enter to send)',
  theme,
  autoFocus,
}) => {
  const isDark = theme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div className={cn(
        'flex-1 rounded-2xl border px-4 py-3 transition-colors shadow-sm',
        isDark
          ? 'bg-white/5 border-white/10 focus-within:border-jyotish-gold/40'
          : 'bg-surface-card border-border-gold focus-within:border-jyotish-gold/50 focus-within:ring-2 focus-within:ring-jyotish-gold/15'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'w-full bg-transparent resize-none text-sm outline-none max-h-32',
            isDark
              ? 'text-white placeholder:text-white/40'
              : 'text-ink-primary placeholder:text-ink-faint'
          )}
          style={{ scrollbarWidth: 'none' }}
        />
      </div>
      <button
        onClick={onSend}
        disabled={!value.trim() || isLoading}
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
          value.trim() && !isLoading
            ? 'bg-jyotish-gold text-[#1a0b2e] hover:bg-celestial-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]'
            : isDark
              ? 'bg-white/5 text-white/20'
              : 'bg-surface-muted text-ink-faint border border-border-gold'
        )}
        aria-label="Send message"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ChatInput;
