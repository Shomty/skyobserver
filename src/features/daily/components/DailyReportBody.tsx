import { useEffect, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { PlanetPosition } from '../../../vedic-utils';
import { DashaStrip } from '../../career/components/DashaStrip';
import type { DailyAiPlainGuidance, DailyAiTransitGuidance, DailySnapshot } from '../types';
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
  transitGuidance: {
    guidance: DailyAiTransitGuidance | null;
    loading: boolean;
    error: string | null;
    fromCache: boolean;
  };
}

export function DailyReportBody({ snapshot, positions, viewMode, plainGuidance, transitGuidance }: Props) {
  const { theme } = useTheme();
  const isVedic = viewMode === 'vedic';
  const [selectedDayIndex, setSelectedDayIndex] = useState(snapshot.forecast.todayIndex);
  const selectedDay = snapshot.forecast.days[selectedDayIndex] ?? snapshot.forecast.days[0] ?? null;
  const plainPayload = plainGuidance.guidance?.guidance ?? null;
  const transitPayload = transitGuidance.guidance?.guidance ?? null;

  useEffect(() => {
    setSelectedDayIndex(snapshot.forecast.todayIndex);
  }, [snapshot.forecastDate, snapshot.forecast.todayIndex]);

  return (
    <>
      <DailyForecastPanel
        forecast={snapshot.forecast}
        viewMode={viewMode}
        plainGuidance={plainPayload}
        plainGuidanceLoading={!isVedic && plainGuidance.loading}
        transitGuidance={transitPayload}
        transitGuidanceLoading={isVedic && transitGuidance.loading}
        selectedIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
      />

      {isVedic && transitGuidance.error ? (
        <p className={cn('text-caption text-center text-amber-400/90', theme === 'dark' ? '' : '')} role="alert">
          {transitGuidance.error}
        </p>
      ) : null}

      <p className={cn('text-caption text-center', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
        {isVedic
          ? `Swiss Ephemeris transits · ${snapshot.currentPlaceLabel}`
          : t('plain.energyNote')}
      </p>

      {!isVedic ? (
        <DailyPlainGuidancePanel
          guidance={plainPayload}
          loading={plainGuidance.loading}
          error={plainGuidance.error}
          fromCache={plainGuidance.fromCache}
          selectedDay={selectedDay}
          selectedDayIndex={selectedDayIndex}
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
