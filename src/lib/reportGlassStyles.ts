import { cn } from './utils';

/** Glass panel shell for report result headers on /personal, /career, /daily. */
export function reportGlassPanelClass(theme: 'light' | 'dark'): string {
  return cn(
    'relative overflow-hidden rounded-2xl border backdrop-blur-xl',
    'before:pointer-events-none before:absolute before:inset-0',
    theme === 'dark'
      ? cn(
          'border-jyotish-gold/15 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-jyotish-gold/[0.04]',
          'before:bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.12),transparent_55%)]',
          'shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
        )
      : cn(
          'border-jyotish-gold/20 bg-gradient-to-br from-white/90 via-white/75 to-amber-50/50',
          'before:bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.14),transparent_55%)]',
          'shadow-[0_16px_40px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]',
        ),
  );
}

/** Frosted footer strip inside report headers. */
export function reportGlassActionBarClass(theme: 'light' | 'dark'): string {
  return cn(
    'flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
    theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-jyotish-gold/10 bg-white/40',
  );
}

/** Subtle glassmorphism button for report toolbars. */
export function reportGlassButtonClass(theme: 'light' | 'dark', primary?: boolean): string {
  if (primary) {
    return cn(
      'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border px-4 text-label font-semibold',
      'backdrop-blur-md transition hover:scale-[1.02] active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
      theme === 'dark'
        ? 'border-jyotish-gold/40 bg-jyotish-gold/15 text-jyotish-gold hover:bg-jyotish-gold/25'
        : 'border-jyotish-gold/50 bg-jyotish-gold/10 text-amber-900 hover:bg-jyotish-gold/20',
    );
  }

  return cn(
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border px-3.5 text-label font-medium',
    'backdrop-blur-md transition hover:scale-[1.02] active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/40',
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.05] text-white/80 hover:border-jyotish-gold/30 hover:bg-white/[0.08] hover:text-white'
      : 'border-slate-200/80 bg-white/60 text-slate-700 hover:border-jyotish-gold/40 hover:bg-white/80',
  );
}

/** Compact meta pill inside report headers. */
export function reportGlassBadgeClass(theme: 'light' | 'dark', accent?: 'gold' | 'emerald'): string {
  return cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption backdrop-blur-sm',
    accent === 'gold'
      ? theme === 'dark'
        ? 'border-jyotish-gold/30 bg-jyotish-gold/10 text-jyotish-gold/90'
        : 'border-jyotish-gold/35 bg-jyotish-gold/10 text-amber-900'
      : accent === 'emerald'
        ? theme === 'dark'
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300/90'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
        : theme === 'dark'
          ? 'border-white/8 bg-white/[0.04] text-white/50'
          : 'border-slate-200/70 bg-white/50 text-slate-500',
  );
}

/** Glass segmented control track (view mode toggles). */
export function reportGlassSegmentTrackClass(theme: 'light' | 'dark'): string {
  return cn(
    'inline-flex rounded-full border p-1 backdrop-blur-md',
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.04]'
      : 'border-slate-200/80 bg-white/55',
  );
}
