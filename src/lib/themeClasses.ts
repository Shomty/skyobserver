import { useTheme } from '../context/ThemeContext';

/**
 * Centralized theme-aware Tailwind class pairs for the Sacred Manuscript palette.
 * Prefer these over scattered `theme === 'dark' ? ... : 'slate-*'` ternaries.
 */
export function useThemeClasses() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    theme,

    /* Surfaces */
    surface: isDark
      ? 'bg-white/[0.03] border-white/5'
      : 'bg-surface-card border-border-gold shadow-sm',
    surfaceMuted: isDark
      ? 'bg-black/20 border-white/5'
      : 'bg-surface-muted border-border-gold',
    surfaceElevated: isDark
      ? 'bg-white/[0.05] border-white/10'
      : 'bg-surface-elevated border-border-gold shadow-sm',
    surfaceOverlay: isDark
      ? 'bg-[#090a0e]/90 border-white/10'
      : 'bg-surface-card/95 border-border-gold shadow-sm',
    surfaceNav: isDark
      ? 'bg-mystic-purple/60 border-jyotish-gold/10'
      : 'bg-surface-card/80 border-border-gold',

    /* Text */
    textPrimary: isDark ? 'text-white' : 'text-ink-primary',
    textSecondary: isDark ? 'text-white/80' : 'text-ink-secondary',
    textMuted: isDark ? 'text-white/50' : 'text-ink-muted',
    textFaint: isDark ? 'text-white/30' : 'text-ink-faint',

    /* Interactive */
    btnGhost: isDark
      ? 'bg-white/5 hover:bg-white/10 text-white/60 border-white/10'
      : 'bg-surface-muted hover:bg-surface-elevated text-ink-muted border-border-gold shadow-sm',
    btnActive: isDark
      ? 'bg-jyotish-gold/20 text-jyotish-gold'
      : 'bg-jyotish-gold/15 text-jyotish-gold font-medium',
    tabInactive: isDark
      ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
      : 'text-ink-muted hover:text-ink-primary hover:bg-surface-muted',

    /* Borders */
    borderSubtle: isDark ? 'border-white/5' : 'border-border-gold',
    borderDefault: isDark ? 'border-white/10' : 'border-border-gold',

    /* Modal / sheet backdrop */
    backdrop: isDark ? 'bg-black/80' : 'bg-ink-primary/20',
    modalSurface: isDark
      ? 'bg-[#0a0a0a] border-white/10'
      : 'bg-surface-card border-border-gold shadow-lg',

    /* Input */
    input: isDark
      ? 'bg-white/5 border-white/10 text-white focus:border-jyotish-gold/50 [color-scheme:dark]'
      : 'bg-surface-card border-border-gold text-ink-primary focus:border-jyotish-gold/50 shadow-sm [color-scheme:light]',
  } as const;
}
