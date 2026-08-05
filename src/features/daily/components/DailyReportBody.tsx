import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { PlanetPosition } from '../../../vedic-utils';
import { DashaStrip } from '../../career/components/DashaStrip';
import type { DailyAiPlainGuidance, DailySnapshot } from '../types';
import type { DailyViewMode } from '../lib/dailyViewMode';
import { t } from '../copy/t';
import { DailyChart } from './DailyChart';
import { DailyForecastPanel } from './DailyForecastPanel';
import { DailyParashariPanel } from './DailyParashariPanel';
import { DailyPlainGuidancePanel } from './DailyPlainGuidancePanel';

interface Props {
  snapshot: DailySnapshot;
  positions: PlanetPosition[];
  viewMode: DailyViewMode;
  plainGuidance: {
    guidance: DailyAiPlainGuidance | null;
    loading: boolean;
    error: string | null;
    fromCache: boolean;
  };
}

export function DailyReportBody({ snapshot, positions, viewMode, plainGuidance }: Props) {
  const { theme } = useTheme();
  const isVedic = viewMode === 'vedic';

  return (
    <>
      <DailyForecastPanel
        forecast={snapshot.forecast}
        viewMode={viewMode}
        plainWeekDays={plainGuidance.guidance?.guidance.weekDays}
      />

      <p className={cn('text-caption text-center', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
        {isVedic
          ? `Swiss Ephemeris transits · ${snapshot.currentPlaceLabel}`
          : t('plain.energyNote')}
      </p>

      {!isVedic ? (
        <DailyPlainGuidancePanel
          guidance={plainGuidance.guidance?.guidance ?? null}
          loading={plainGuidance.loading}
          error={plainGuidance.error}
          fromCache={plainGuidance.fromCache}
        />
      ) : null}

      {isVedic ? (
        <>
          <DailyChart positions={positions} ascendantSign={snapshot.ascendantSignName} />
          <DashaStrip dasha={snapshot.dasha} />
          <DailyParashariPanel sections={snapshot.parashari.sections} />
        </>
      ) : null}
    </>
  );
}
