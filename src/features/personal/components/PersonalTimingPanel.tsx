import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { ScoreCard } from '../../career/components/ScoreCard';
import { activatedAreaLabel, chapterThemeLong, lifeAreaYearFocus } from '../lib/personalPsychLabels';
import { t } from '../copy/t';
import type { PersonalSnapshot } from '../types';

interface Props {
  timing: PersonalSnapshot['timing'];
}

function resolveYearFocus(timing: PersonalSnapshot['timing']): string {
  return timing.activeYearFocus ?? lifeAreaYearFocus(timing.activeSudarshanaHouse);
}

function resolveMajorChapter(timing: PersonalSnapshot['timing']): string {
  return timing.currentChapterTheme ?? chapterThemeLong(timing.currentPeriodLord);
}

export function PersonalTimingPanel({ timing }: Props) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/70' : 'text-slate-600';

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <h3 className="font-serif text-title">{t('timing.title')}</h3>
      <div className="mt-4 space-y-5">
        <div>
          <p className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
            {t('timing.activeFocus')}
          </p>
          <p className={cn('mt-2 text-body leading-relaxed', muted)}>{resolveYearFocus(timing)}</p>
        </div>
        <div>
          <p className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
            {t('timing.current')}
          </p>
          <p className={cn('mt-2 text-body leading-relaxed text-jyotish-gold')}>{resolveMajorChapter(timing)}</p>
        </div>
        {timing.activatedLifeAreas.length > 0 ? (
          <div>
            <p className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
              {t('timing.chapterThemes')}
            </p>
            <p className={cn('mt-2 text-body leading-relaxed', muted)}>
              {timing.activatedLifeAreas.map(activatedAreaLabel).join(' · ')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PersonalScoresPanel({ snapshot }: { snapshot: PersonalSnapshot }) {
  const { theme } = useTheme();
  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
  );

  return (
    <section className={cardClass}>
      <h3 className="font-serif text-title">{t('scores.title')}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ScoreCard score={snapshot.scores.innerStrength} />
        <ScoreCard score={snapshot.scores.relationshipHarmony} />
        <ScoreCard score={snapshot.scores.lifeClarity} />
      </div>
    </section>
  );
}
