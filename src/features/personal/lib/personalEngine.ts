import type { PlanetPosition, SignNumber } from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import { RASHIS } from '../../../vedic-utils';
import type { PersonalSnapshot } from '../types';
import { extractDashaLevels } from './dashaPersonalEngine';
import { buildPersonalReading } from './personalReading';
import { buildParashariAnalysis } from './personalParashariEngine';
import { chapterThemeLong, lifeAreaShort, lifeAreaYearFocus, signStyle } from './personalPsychLabels';
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
      outerStyle: signStyle(reading.personality.lagna.sign).split(',')[0],
      emotionalStyle: signStyle(reading.personality.moon.sign).split(',')[0],
      driveStyle: signStyle(reading.personality.sun.sign).split(',')[0],
      identityFocus: lifeAreaShort(reading.personality.lagna.lordHouse),
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
      currentChapterTheme: chapterThemeLong(dashaLevels.mahadasha.planet),
      activeYearFocus: lifeAreaYearFocus(reading.sudarshana.activeHouse),
      activatedLifeAreas: reading.dasha.activatedLifeAreas,
    },
    parashari,
    reading,
  };
}

/** Refresh user-facing derived fields from stored reading — fixes stale cached parashari copy. */
export function rehydratePersonalSnapshot(snapshot: PersonalSnapshot): PersonalSnapshot {
  const reading = snapshot.reading;
  if (!reading) return snapshot;

  const wheel = snapshot.personalityWheel;
  const dasha = snapshot.dasha;

  return {
    ...snapshot,
    personalityWheel: {
      ...wheel,
      outerStyle: wheel.outerStyle ?? signStyle(reading.personality.lagna.sign).split(',')[0],
      emotionalStyle: wheel.emotionalStyle ?? signStyle(reading.personality.moon.sign).split(',')[0],
      driveStyle: wheel.driveStyle ?? signStyle(reading.personality.sun.sign).split(',')[0],
      identityFocus: wheel.identityFocus ?? lifeAreaShort(reading.personality.lagna.lordHouse),
    },
    scores: {
      innerStrength: computeInnerStrength(reading),
      relationshipHarmony: computeRelationshipHarmony(reading),
      lifeClarity: computeLifeClarity(reading),
    },
    timing: {
      activeSudarshanaHouse: reading.sudarshana.activeHouse,
      activeLifeArea: reading.sudarshana.activeLifeArea,
      currentPeriodLord: dasha.mahadasha.planet,
      currentChapterTheme: chapterThemeLong(dasha.mahadasha.planet),
      activeYearFocus: lifeAreaYearFocus(reading.sudarshana.activeHouse),
      activatedLifeAreas: reading.dasha.activatedLifeAreas,
    },
    parashari: buildParashariAnalysis(reading),
  };
}
