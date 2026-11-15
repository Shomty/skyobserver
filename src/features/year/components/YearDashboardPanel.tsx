import { useEffect, useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { ensureReport } from '../../../services/aiReportService';
import {
  calculateDashaLevels,
  type DashaPeriod,
  type PlanetPosition,
} from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import { withCareerKaalVelas } from '../../career/lib/careerKaalVelas';
import { zoneOffsetMinutes } from '../../gift/lib/birthInstant';
import { YearExplanation } from '../components/YearExplanation';
import { YearReportBody } from '../components/YearReportBody';
import { buildYearReading, type YearReading } from '../lib/yearEngine';
import { generateYearSynthesisText } from '../lib/yearSynthesisGemini';
import { isValidYearSynthesisText, type YearAiSynthesis } from '../lib/yearSynthesisFingerprint';

interface Props {
  birthPositions: PlanetPosition[];
  birthTime: Date;
  placeLat: number | null;
  placeLon: number | null;
  placeTimezone: string | null;
  userId: string;
  fullName?: string;
  /** Distinguishes the signed-in chart from a saved person on the same account. */
  profileKey: string;
  birthFingerprint: string | null;
}

function vimshottariFromLevels(levels: DashaPeriod[]): VimshottariDashasResponse {
  const mahadasha = levels.find((period) => period.level === 1);
  const antardasha = levels.find((period) => period.level === 2);
  const toPeriod = (period: DashaPeriod | undefined) =>
    period
      ? { planet: period.lord, startDate: period.start.toISOString(), endDate: period.end.toISOString() }
      : null;
  return {
    dashaPeriods: [],
    current: {
      mahadasha: toPeriod(mahadasha),
      antardasha: toPeriod(antardasha),
    },
    birthNakshatra: '',
    birthDashaLord: mahadasha?.lord ?? '',
  };
}

function enrichPositions(
  positions: PlanetPosition[],
  birthTime: Date,
  lat: number | null,
  lon: number | null,
  timezone: string | null,
): PlanetPosition[] {
  if (lat == null || lon == null || !timezone) return positions;
  const offsetMinutes = zoneOffsetMinutes(birthTime, timezone);
  if (offsetMinutes == null) return positions;
  return withCareerKaalVelas(positions, birthTime, lat, lon, offsetMinutes);
}

export function YearDashboardPanel({
  birthPositions,
  birthTime,
  placeLat,
  placeLon,
  placeTimezone,
  userId,
  fullName,
  profileKey,
  birthFingerprint,
}: Props) {
  const { theme } = useTheme();
  const [synthesis, setSynthesis] = useState<YearAiSynthesis | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const reading = useMemo<YearReading>(() => {
    const moon = birthPositions.find((planet) => planet.name === 'Moon');
    const levels = moon ? calculateDashaLevels(birthTime, moon.siderealLongitude, new Date()) : [];
    return buildYearReading(
      enrichPositions(birthPositions, birthTime, placeLat, placeLon, placeTimezone),
      vimshottariFromLevels(levels),
      new Date(),
    );
  }, [birthPositions, birthTime, placeLat, placeLon, placeTimezone]);

  const fingerprint = [
    'year-dashboard-v1',
    birthFingerprint ?? birthTime.toISOString(),
    reading.year,
    reading.dasha.mahadasha.lord,
    reading.dasha.antardasha.lord,
  ].join('|');

  useEffect(() => {
    let cancelled = false;
    setSynthesis(null);
    setSynthesisLoading(true);
    setSynthesisError(null);

    ensureReport<YearAiSynthesis>({
      uid: userId,
      docId: `year-horoscope-${profileKey}`,
      type: 'year_horoscope',
      fingerprint,
      generate: async () => {
        const text = await generateYearSynthesisText(reading, fullName);
        return { text, fingerprint, generatedAt: new Date().toISOString() };
      },
      normalize: (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const entry = raw as { text?: unknown; generatedAt?: unknown };
        if (!isValidYearSynthesisText(entry.text)) return null;
        return {
          text: entry.text.trim(),
          fingerprint,
          generatedAt: typeof entry.generatedAt === 'string' ? entry.generatedAt : new Date().toISOString(),
        };
      },
    })
      .then((result) => {
        if (cancelled) return;
        setSynthesis(result.data);
        setSynthesisLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSynthesisLoading(false);
        setSynthesisError(error instanceof Error ? error.message : 'The written consultation could not be prepared.');
      });

    return () => {
      cancelled = true;
    };
  }, [userId, profileKey, fingerprint, reading, fullName]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className={cn('text-[10px] font-mono uppercase tracking-[0.2em] text-jyotish-gold')}>Your chart</p>
        <h2 className={cn('font-serif text-2xl', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
          Year horoscope {reading.year}
        </h2>
      </div>
      <YearExplanation />
      <YearReportBody
        reading={reading}
        synthesis={synthesis}
        synthesisLoading={synthesisLoading}
        synthesisError={synthesisError}
      />
    </div>
  );
}

export function YearDashboardEmpty() {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Compass className={cn('mb-4 h-12 w-12', theme === 'dark' ? 'text-white/20' : 'text-ink-faint')} />
      <p className={theme === 'dark' ? 'text-white/40' : 'text-ink-muted'}>
        Save your birth details to read this year from your chart.
      </p>
    </div>
  );
}
