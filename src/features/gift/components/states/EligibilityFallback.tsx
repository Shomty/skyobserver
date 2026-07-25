import { useEffect, useRef } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';

interface Props {
  open: boolean;
  onAccept: () => void;
  onCorrect: () => void;
}

export function EligibilityFallback({ open, onAccept, onCorrect }: Props) {
  const { theme } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCorrect();
        return;
      }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onCorrect]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCorrect();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligibility-title"
        className={cn(
          'w-full max-w-md rounded-2xl border p-6 shadow-2xl',
          theme === 'dark'
            ? 'bg-mystic-purple border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        <h2 id="eligibility-title" className="font-serif text-title">
          {t('eligibility.title')}
        </h2>
        <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/65' : 'text-slate-600')}>
          {t('eligibility.body')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="min-h-[44px] rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
          >
            {t('eligibility.accept')}
          </button>
          <button
            type="button"
            onClick={onCorrect}
            className={cn(
              'min-h-[44px] rounded-xl border px-5 text-label font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
              theme === 'dark' ? 'border-white/15' : 'border-slate-200'
            )}
          >
            {t('eligibility.correct')}
          </button>
        </div>
      </div>
    </div>
  );
}
