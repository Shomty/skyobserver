import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';

const BEATS = ['ceremony.beat1', 'ceremony.beat2', 'ceremony.beat3', 'ceremony.beat4'] as const;
const BEAT_MS = 500;

interface Props {
  /** When true, request has resolved — finish current beat then signal done. */
  requestDone: boolean;
  onComplete: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SubmitCeremony({ requestDone, onComplete }: Props) {
  const { theme } = useTheme();
  const reduced = prefersReducedMotion();
  const [beat, setBeat] = useState(0);
  const [holding, setHolding] = useState(false);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  };

  useEffect(() => {
    if (reduced) {
      if (requestDone) finish();
      return;
    }

    if (beat >= BEATS.length) {
      if (requestDone) finish();
      else setHolding(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setBeat((b) => b + 1);
    }, BEAT_MS);
    return () => window.clearTimeout(timer);
    // finish/onComplete intentionally omitted — guarded by finished ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, reduced, requestDone]);

  useEffect(() => {
    if (holding && requestDone) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding, requestDone]);

  if (reduced) {
    return (
      <p
        className={cn('text-body-lg', theme === 'dark' ? 'text-white/80' : 'text-slate-700')}
        role="status"
        aria-live="polite"
      >
        {t('ceremony.reduced')}
      </p>
    );
  }

  const visible = Math.min(beat, BEATS.length);

  return (
    <div role="status" aria-live="polite" className="space-y-4 py-4">
      <ul className="space-y-3">
        {BEATS.map((key, i) => {
          const done = i < visible;
          const current = i === visible - 1 && !holding && visible < BEATS.length;
          return (
            <li
              key={key}
              className={cn(
                'flex items-center gap-3 text-body transition-opacity duration-300',
                done || current ? 'opacity-100' : 'opacity-30'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border',
                  done
                    ? 'bg-jyotish-gold/20 border-jyotish-gold text-jyotish-gold'
                    : theme === 'dark'
                      ? 'border-white/20'
                      : 'border-slate-300'
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : null}
              </span>
              <span>{t(key)}</span>
            </li>
          );
        })}
      </ul>
      {holding ? (
        <p
          className={cn(
            'text-caption font-mono uppercase tracking-widest',
            theme === 'dark' ? 'text-white/40' : 'text-slate-500'
          )}
        >
          {t('ceremony.waiting')}
          <span className="inline-block ml-2 h-3 w-3 animate-pulse rounded-full bg-jyotish-gold/70" />
        </p>
      ) : null}
    </div>
  );
}
