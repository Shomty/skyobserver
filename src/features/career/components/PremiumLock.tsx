import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { useCareerPremiumUnlocked } from '../context/CareerPremiumContext';
import { t } from '../copy/t';

interface Props {
  children: ReactNode;
  className?: string;
}

/** Blur overlay + PREMIUM badge for gated content. */
export function PremiumLock({ children, className }: Props) {
  const { theme } = useTheme();
  const premiumUnlocked = useCareerPremiumUnlocked();

  if (premiumUnlocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="pointer-events-none select-none blur-[3px] opacity-60">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-jyotish-gold/90 px-3 py-1 text-caption font-bold uppercase tracking-wider text-black">
          <Lock className="h-3 w-3" aria-hidden />
          {t('scores.locked')}
        </span>
      </div>
    </div>
  );
}
