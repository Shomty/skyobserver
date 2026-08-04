import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { PlanetPosition } from '../../../vedic-utils';
import type { CareerSnapshot } from '../types';
import { getLordInHouseLine } from '../copy/lordInHouse';
import { getTenthHouseParagraph } from '../copy/tenthHouseBySign';
import { t } from '../copy/t';
import { CareerChart } from './CareerChart';
import { CareerFieldChips } from './CareerFieldChips';
import { CareerSynthesisPanel } from './CareerSynthesisPanel';
import { CareerTimeline } from './CareerTimeline';
import { CareerUpsell } from './CareerUpsell';
import { DashaStrip } from './DashaStrip';
import { ParashariVargaPanel } from './ParashariVargaPanel';
import { ScoreCard } from './ScoreCard';

interface Props {
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
  synthesis: {
    synthesis: import('../types').CareerAiSynthesis | null;
    loading: boolean;
    error: string | null;
    fromCache: boolean;
  };
}

export function CareerReportBody({ snapshot, positions, synthesis }: Props) {
  const { theme } = useTheme();
  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
  );

  return (
    <>
      <CareerChart
        positions={positions}
        tenthSign={snapshot.tenthHouse.sign}
        tenthLord={snapshot.tenthLord.planet}
      />

      <DashaStrip dasha={snapshot.dasha} />

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('scores.title')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ScoreCard score={snapshot.scores.tenthHouseStrength} />
          <ScoreCard score={snapshot.scores.leadership} />
          <ScoreCard score={snapshot.scores.careerDrive} />
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('house.title')}</h3>
        <p className="mt-2 font-medium">{t('house.heading', { sign: snapshot.tenthHouse.sign })}</p>
        <p className={cn('mt-3 text-body leading-relaxed', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {getTenthHouseParagraph(snapshot.tenthHouse.sign)}
        </p>
      </section>

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('engine.title')}</h3>
        <p className="mt-2 font-medium">
          {t('engine.heading', {
            lord: snapshot.tenthLord.planet,
            house: snapshot.tenthLord.house,
          })}
        </p>
        <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {getLordInHouseLine(snapshot.tenthLord.planet, snapshot.tenthLord.house)}
        </p>
      </section>

      <CareerTimeline timing={snapshot.timing} />

      <CareerSynthesisPanel
        synthesis={synthesis.synthesis}
        loading={synthesis.loading}
        error={synthesis.error}
        fromCache={synthesis.fromCache}
      />

      <ParashariVargaPanel sections={snapshot.parashari.sections} />

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('yoga.title')}</h3>
        <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {snapshot.wealthYogas.length > 0
            ? t('yoga.count', {
                count: snapshot.wealthYogas.length,
                names: snapshot.wealthYogas
                  .slice(0, 2)
                  .map((y) => y.shortTitle || y.name)
                  .join(', '),
              })
            : t('yoga.none')}
        </p>
      </section>

      <CareerFieldChips fields={snapshot.fields} />
      <CareerUpsell />

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('faq.title')}</h3>
        <dl className="mt-4 space-y-4">
          {(['q1', 'q2', 'q3'] as const).map((q) => (
            <div key={q}>
              <dt className="font-medium">{t(`faq.${q}`)}</dt>
              <dd className={cn('mt-1 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                {t(`faq.a${q.slice(1)}`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
