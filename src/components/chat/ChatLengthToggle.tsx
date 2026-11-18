import { useCallback, useState } from 'react';
import { AlignLeft, ScrollText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CHAT_LENGTH_CONFIG, isChatLength, type ChatLength } from '../../lib/chatLength';
import { debugWarn } from '../../lib/debug';

const storageKey = (uid: string | undefined) => `sb.chatLength.${uid ?? 'anon'}`;

function readStoredLength(uid: string | undefined): ChatLength {
  try {
    const stored = window.localStorage.getItem(storageKey(uid));
    return isChatLength(stored) ? stored : 'standard';
  } catch {
    return 'standard';
  }
}

/** The user's chosen reply length, remembered per account in this browser. Defaults to Standard. */
export function useChatLength(uid: string | undefined): [ChatLength, (length: ChatLength) => void] {
  const [length, setLength] = useState<ChatLength>(() => readStoredLength(uid));
  const update = useCallback((next: ChatLength) => {
    setLength(next);
    try {
      window.localStorage.setItem(storageKey(uid), next);
    } catch (err) {
      debugWarn('chat-length', 'Could not persist reply length', err);
    }
  }, [uid]);
  return [length, update];
}

interface ChatLengthToggleProps {
  value: ChatLength;
  onChange: (length: ChatLength) => void;
  theme: 'dark' | 'light';
  disabled?: boolean;
}

const OPTIONS: ReadonlyArray<{ value: ChatLength; icon: typeof AlignLeft; hint: string }> = [
  { value: 'standard', icon: AlignLeft, hint: 'Standard reply — uses 1 daily AI message' },
  { value: 'in_depth', icon: ScrollText, hint: `Longer, in-depth report — uses ${CHAT_LENGTH_CONFIG.in_depth.quotaUnits} daily AI messages` },
];

export function ChatLengthToggle({ value, onChange, theme, disabled }: ChatLengthToggleProps) {
  const isDark = theme === 'dark';
  return (
    <div
      role="radiogroup"
      aria-label="Reply length"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border p-0.5',
        isDark ? 'border-white/10 bg-white/5' : 'border-border-gold bg-surface-card'
      )}
    >
      {OPTIONS.map(({ value: option, icon: Icon, hint }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            title={hint}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-all disabled:opacity-50',
              active
                ? 'bg-jyotish-gold/15 text-jyotish-gold'
                : isDark
                  ? 'text-white/40 hover:text-white/70'
                  : 'text-ink-muted hover:text-ink-primary'
            )}
          >
            <Icon className="h-3 w-3" />
            {CHAT_LENGTH_CONFIG[option].label}
          </button>
        );
      })}
    </div>
  );
}
