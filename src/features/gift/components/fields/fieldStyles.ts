import { cn } from '../../../../lib/utils';

export function inputClass(theme: 'light' | 'dark', invalid?: boolean): string {
  return cn(
    'w-full min-h-[44px] rounded-xl border px-3 py-2 text-body transition-colors duration-300',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50 focus-visible:border-jyotish-gold/60',
    theme === 'dark'
      ? 'bg-white/[0.04] border-white/10 text-white/90 placeholder:text-white/30'
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
    invalid &&
      (theme === 'dark'
        ? 'border-red-400/60 focus-visible:ring-red-400/40'
        : 'border-red-500/60 focus-visible:ring-red-500/40')
  );
}

export function labelClass(theme: 'light' | 'dark'): string {
  return cn(
    'block text-label font-medium mb-1.5',
    theme === 'dark' ? 'text-white/80' : 'text-slate-700'
  );
}

export function helpClass(theme: 'light' | 'dark'): string {
  return cn('mt-1 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-500');
}

export function errorClass(theme: 'light' | 'dark'): string {
  return cn('mt-1 text-caption', theme === 'dark' ? 'text-red-400' : 'text-red-500');
}
