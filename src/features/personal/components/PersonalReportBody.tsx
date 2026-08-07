import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { signStyle, lifeAreaShort } from '../lib/personalPsychLabels';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';
import { t } from '../copy/t';
import { PersonalBlueprintPanel } from './PersonalBlueprintPanel';
import { PersonalDashaStrip } from './PersonalDashaStrip';
import { PersonalGuidancePanel } from './PersonalGuidancePanel';
import { PersonalParashariPanel } from './PersonalParashariPanel';
import { PersonalScoresPanel, PersonalTimingPanel } from './PersonalTimingPanel';
import { PersonalUpsell } from './PersonalUpsell';

interface Props {
  snapshot: PersonalSnapshot;
  guidance: {
    guidance: PersonalAiGuidance | null;
    loading: boolean;
    error: string | null;
    fromCache: boolean;
  };
}

function wheelDisplay(snapshot: PersonalSnapshot) {
  const wheel = snapshot.personalityWheel;
  return {
    outerStyle: wheel.outerStyle ?? signStyle(wheel.lagnaSign).split(',')[0],
    emotionalStyle: wheel.emotionalStyle ?? signStyle(wheel.moonSign).split(',')[0],
    driveStyle: wheel.driveStyle ?? signStyle(wheel.sunSign).split(',')[0],
    identityFocus: wheel.identityFocus ?? lifeAreaShort(wheel.lagnaLordHouse),
  };
}

export function PersonalReportBody({ snapshot, guidance }: Props) {
  const { theme } = useTheme();
  const display = wheelDisplay(snapshot);
  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
  );

  return (
    <>
      <PersonalBlueprintPanel wheel={{ ...snapshot.personalityWheel, ...display }} />
      <PersonalDashaStrip dasha={snapshot.dasha} />
      <PersonalScoresPanel snapshot={snapshot} />

      <section className={cardClass}>
        <h3 className="font-serif text-title">{t('wheel.title')}</h3>
        <p className="mt-2 font-medium">
          {t('wheel.heading', {
            outer: display.outerStyle,
            emotional: display.emotionalStyle,
            drive: display.driveStyle,
          })}
        </p>
        <p className={cn('mt-3 text-body leading-relaxed', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
          {t('wheel.body', { focus: display.identityFocus })}
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
