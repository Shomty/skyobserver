import type { PlanetPosition, SignNumber } from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import { RASHIS } from '../../../vedic-utils';
import type { PersonalSnapshot } from '../types';
import { extractDashaLevels } from './dashaPersonalEngine';
import { buildPersonalReading } from './personalReading';
import { buildParashariAnalysis } from './personalParashariEngine';
import { computeInnerStrength, computeLifeClarity, computeRelationshipHarmony } from './personalScores';

export function buildPersonalSnapshot(
  positions: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  birthInstant: BirthInstant,
  now: Date,
): PersonalSnapshot {
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found in positions');

  const ascSignIndex = RASHIS.indexOf(asc.rashi);
  const ascendantSign = (ascSignIndex + 1) as SignNumber;
  const birthDate = new Date(birthInstant.iso);

  const dashaLevels = extractDashaLevels(positions, birthDate, now, dashas);
  const reading = buildPersonalReading(positions, dashas, birthDate, now, dashaLevels);

  const parashari = buildParashariAnalysis(reading);

  return {
    ascendantSign,
    ascendantSignName: asc.rashi,
    personalityWheel: {
      lagnaSign: reading.personality.lagna.sign,
      moonSign: reading.personality.moon.sign,
      sunSign: reading.personality.sun.sign,
      lagnaLord: reading.personality.lagna.lord,
      lagnaLordHouse: reading.personality.lagna.lordHouse,
      element: reading.personality.lagna.element,
      guna: reading.personality.lagna.guna,
    },
    scores: {
      innerStrength: computeInnerStrength(reading),
      relationshipHarmony: computeRelationshipHarmony(reading),
      lifeClarity: computeLifeClarity(reading),
    },
    dasha: dashaLevels,
    timing: {
      activeSudarshanaHouse: reading.sudarshana.activeHouse,
      activeLifeArea: reading.sudarshana.activeLifeArea,
      currentPeriodLord: dashaLevels.mahadasha.planet,
      activatedLifeAreas: reading.dasha.activatedLifeAreas,
    },
    parashari,
    reading,
  };
}
