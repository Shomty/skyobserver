import { cn } from '../../../lib/utils';

export function primaryButtonClass(): string {
  return cn(
    'min-h-[44px] rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black',
    'shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-[0.98] transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50'
  );
}

export function secondaryButtonClass(theme: 'light' | 'dark'): string {
  return cn(
    'min-h-[44px] rounded-xl border px-5 text-label font-medium active:scale-[0.98] transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
    theme === 'dark' ? 'border-white/15 text-white/80' : 'border-slate-200 text-slate-700'
  );
}
