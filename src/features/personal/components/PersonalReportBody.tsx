import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { PlanetPosition } from '../../../vedic-utils';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';
import { t } from '../copy/t';
import { PersonalChart } from './PersonalChart';
import { PersonalDashaStrip } from './PersonalDashaStrip';
import { PersonalGuidancePanel } from './PersonalGuidancePanel';
import { PersonalParashariPanel } from './PersonalParashariPanel';
import { PersonalScoresPanel, PersonalTimingPanel } from './PersonalTimingPanel';
import { PersonalUpsell } from './PersonalUpsell';

interface Props {
  snapshot: PersonalSnapshot;
  positions: PlanetPosition[];
  guidance: {
    guidance: PersonalAiGuidance | null;
    loading: boolean;
    error: string | null;
    fromCache: boolean;
  };
}

export function PersonalReportBody({ snapshot, positions, guidance }: Props) {
  const { theme } = useTheme();
  const wheel = snapshot.personalityWheel;
  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
  );

  return (
    <>
      <PersonalChart positions={positions} ascendantSign={snapshot.ascendantSignName} />
      <PersonalDashaStrip dasha={snapshot.dasha} />
      <PersonalScoresPanel snapshot={snapshot} />

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('wheel.title')}</h3>
        <p className="mt-2 font-medium">
          {t('wheel.heading', { lagna: wheel.lagnaSign, moon: wheel.moonSign, sun: wheel.sunSign })}
        </p>
        <p className={cn('mt-3 text-body leading-relaxed', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {t('wheel.body', {
            lord: wheel.lagnaLord,
            house: wheel.lagnaLordHouse,
            element: wheel.element,
            guna: wheel.guna,
          })}
        </p>
      </section>

      <PersonalTimingPanel timing={snapshot.timing} />

      <PersonalGuidancePanel
        guidance={guidance.guidance}
        loading={guidance.loading}
        error={guidance.error}
        fromCache={guidance.fromCache}
      />

      <PersonalParashariPanel sections={snapshot.parashari.sections} />
      <PersonalUpsell />
    </>
  );
}
