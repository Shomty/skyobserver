import {
  calculateCharakarakas,
  getRashiLord,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import { buildD9PersonalAnalysis, type D9PersonalAnalysis } from './d9PersonalEngine';
import { buildPersonalDashaAnalysis, type PersonalDashaAnalysis } from './dashaPersonalEngine';
import { buildLifeMissionAnalysis, type LifeMissionAnalysis } from './lifeMissionEngine';
import { buildPersonalityWheel, type PersonalityWheelAnalysis } from './personalityEngine';
import { buildShadowAnalysis, type ShadowAnalysis } from './shadowEngine';
import { buildSudarshanaAnalysis, type SudarshanaPersonalAnalysis } from './sudarshanaEngine';
import { signName } from './personalConstants';

export interface PersonalReading {
  personality: PersonalityWheelAnalysis;
  d9: D9PersonalAnalysis;
  lifeMission: LifeMissionAnalysis;
  shadow: ShadowAnalysis;
  sudarshana: SudarshanaPersonalAnalysis;
  dasha: PersonalDashaAnalysis;
  synthesis: {
    primaryThemes: string[];
    innerVsOuter: 'aligned' | 'divergent' | 'mixed';
    confidence: 'high' | 'moderate' | 'low';
  };
}

function detectPrimaryThemes(reading: PersonalReading): string[] {
  const themes: string[] = [];
  if (reading.personality.alignment === 'tension') {
    themes.push('outer presentation and inner emotional world pull in different directions');
  }
  const hiddenWeakness = reading.d9.strengthChecks.find((s) => s.verdict === 'hidden-weakness');
  if (hiddenWeakness) {
    themes.push('visible promise may exceed what endures under pressure');
  }
  const strengthened = reading.d9.strengthChecks.find((s) => s.verdict === 'strengthened');
  if (strengthened) {
    themes.push('inner resilience grows through early-life friction');
  }
  if (reading.sudarshana.triangulation.some((t) => t.agreement === 'affliction')) {
    themes.push('load-bearing life areas need conscious attention across body, mind, and soul');
  }
  if (reading.lifeMission.atmakaraka) {
    themes.push(`soul lesson centered on ${reading.lifeMission.atmakaraka.planet} themes`);
  }
  return themes.slice(0, 4);
}

function resolveInnerVsOuter(reading: PersonalReading): PersonalReading['synthesis']['innerVsOuter'] {
  const d9Divergent = reading.d9.strengthChecks.some(
    (s) => s.verdict === 'hidden-weakness' || s.verdict === 'strengthened',
  );
  const sudarshanaMixed = reading.sudarshana.triangulation.some((t) => t.agreement === 'mixed');
  if (d9Divergent && sudarshanaMixed) return 'divergent';
  if (d9Divergent || sudarshanaMixed) return 'mixed';
  return 'aligned';
}

function resolveConfidence(reading: PersonalReading): PersonalReading['synthesis']['confidence'] {
  const contradictions =
    (reading.personality.alignment === 'tension' ? 1 : 0) +
    reading.d9.strengthChecks.filter((s) => s.verdict === 'hidden-weakness').length +
    reading.sudarshana.triangulation.filter((t) => t.agreement === 'affliction').length;
  if (contradictions >= 3) return 'low';
  if (contradictions >= 1) return 'moderate';
  return 'high';
}

export function buildPersonalReading(
  positions: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  birthDate: Date,
  now: Date,
  dashaLevels: { mahadasha: { planet: string }; antardasha: { planet: string } },
): PersonalReading {
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found');

  const ascSign = (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;
  const lagnaLord = getRashiLord(signName(ascSign));
  const charas = calculateCharakarakas(positions);
  const atmakaraka = charas.AK;

  const d9 = buildD9PersonalAnalysis(positions, ascSign, lagnaLord, atmakaraka);
  const personality = buildPersonalityWheel(positions, ascSign, d9.vargottama);
  const lifeMission = buildLifeMissionAnalysis(positions, ascSign);
  const shadow = buildShadowAnalysis(positions, ascSign, lagnaLord, atmakaraka);
  const sudarshana = buildSudarshanaAnalysis(positions, birthDate, now);
  const dasha = buildPersonalDashaAnalysis(positions, ascSign, dashaLevels);

  const reading: PersonalReading = {
    personality,
    d9,
    lifeMission,
    shadow,
    sudarshana,
    dasha,
    synthesis: {
      primaryThemes: [],
      innerVsOuter: 'aligned',
      confidence: 'high',
    },
  };

  reading.synthesis = {
    primaryThemes: detectPrimaryThemes(reading),
    innerVsOuter: resolveInnerVsOuter(reading),
    confidence: resolveConfidence(reading),
  };

  return reading;
}
