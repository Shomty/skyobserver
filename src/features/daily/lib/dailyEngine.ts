import type { VimshottariDashasResponse } from '../../../services/dashasService';
import { RASHIS, type PlanetPosition, type SignNumber } from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';
import { buildCareerReading } from '../../career/lib/careerReading';
import { withCareerKaalVelas } from '../../career/lib/careerKaalVelas';
import { extractDashaLevels } from '../../personal/lib/dashaPersonalEngine';
import { buildPersonalReading } from '../../personal/lib/personalReading';
import type { DailySnapshot } from '../types';
import { buildDailyForecast } from './dailyForecastEngine';
import { buildDailyParashariAnalysis } from './dailyParashariEngine';
import { buildDailyPsychSeed } from './dailyPsychProfile';

export async function buildDailySnapshot(
  natalPositions: PlanetPosition[],
  positionsWithUpagrahas: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  birthInstant: BirthInstant,
  currentPlace: PlaceResolution,
  now: Date,
): Promise<DailySnapshot> {
  const asc = natalPositions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found in positions');

  const ascSignIndex = RASHIS.indexOf(asc.rashi);
  const ascendantSign = (ascSignIndex + 1) as SignNumber;
  const birthDate = new Date(birthInstant.iso);

  const dashaLevels = extractDashaLevels(natalPositions, birthDate, now, dashas);
  const careerReading = buildCareerReading(
    positionsWithUpagrahas,
    dashas,
    now,
    dashaLevels.pratyantardasha,
  );
  const personalReading = buildPersonalReading(
    natalPositions,
    dashas,
    birthDate,
    now,
    dashaLevels,
  );

  const parashari = buildDailyParashariAnalysis(
    careerReading,
    personalReading,
    ascendantSign,
    natalPositions,
  );

  const forecast = await buildDailyForecast(
    natalPositions,
    currentPlace,
    now,
    careerReading.dasha.current.md.score,
  );

  const snapshotBase = {
    ascendantSign,
    ascendantSignName: asc.rashi,
    currentPlaceLabel: currentPlace.label,
    forecastDate: forecast.days[0]?.date ?? now.toISOString().slice(0, 10),
    dasha: dashaLevels,
    careerReading,
    personalReading,
    parashari,
    forecast,
  };

  return {
    ...snapshotBase,
    psychSeed: buildDailyPsychSeed(snapshotBase),
  };
}

/** Attach Gulika/Maandi for karmic checks in career reading — same as career funnel. */
export function enrichNatalPositions(
  chartPositions: PlanetPosition[],
  birthDate: Date,
  birthPlace: Pick<PlaceResolution, 'latitude' | 'longitude'>,
  offsetMinutes: number,
): PlanetPosition[] {
  return withCareerKaalVelas(
    chartPositions,
    birthDate,
    birthPlace.latitude,
    birthPlace.longitude,
    offsetMinutes,
  );
}
