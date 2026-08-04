import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { CareerScore } from '../types';
import { PremiumLock } from './PremiumLock';

interface Props {
  score: CareerScore;
}

export function ScoreCard({ score }: Props) {
  const { theme } = useTheme();
  const card = (
    <div
      className={cn(
        'rounded-xl border p-4',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <p className={cn('text-caption uppercase tracking-wide', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
        {score.label}
      </p>
      <p className="mt-1 font-serif text-3xl text-jyotish-gold">{score.value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-jyotish-gold/60 to-jyotish-gold transition-all"
          style={{ width: `${score.value}%` }}
        />
      </div>
    </div>
  );

  if (score.locked) return <PremiumLock>{card}</PremiumLock>;
  return card;
}
