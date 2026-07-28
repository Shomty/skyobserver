import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padClass = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        padClass,
        'rounded-lg border transition-all duration-300',
        isDark
          ? 'bg-mystic-purple/40 border-jyotish-gold/20 text-jyotish-gold hover:bg-mystic-purple/60'
          : 'bg-surface-card border-border-gold text-jyotish-gold hover:bg-surface-muted shadow-sm',
        className
      )}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
    </button>
  );
}
