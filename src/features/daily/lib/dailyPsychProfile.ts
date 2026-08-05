import type { CareerReading } from '../../career/lib/careerReading';
import { buildPersonalPsychProfile } from '../../personal/lib/personalPsychProfile';
import type { PersonalReading } from '../../personal/lib/personalReading';
import type { DailySnapshot } from '../types';
import type { ParashariSection } from './dailyParashariEngine';
import type { DailyForecast, EnergyLevel } from './dailyForecastEngine';

/** Plain-language seed for Gemini — no Vedic terms in output. */
export interface DailyPsychSeed {
  todayEnergy: string;
  weekPattern: string;
  daySignals: string;
  innerBaseline: string;
  lifeChapter: string;
  locationLabel: string;
}

const PERIOD_THEMES: Record<string, string> = {
  Sun: 'visibility, confidence, and purposeful self-expression',
  Moon: 'emotional processing, home, and inner security',
  Mars: 'drive, conflict, and decisive action',
  Mercury: 'communication, learning, and mental agility',
  Jupiter: 'expansion, wisdom, and long-range growth',
  Venus: 'relationships, pleasure, and values',
  Saturn: 'discipline, responsibility, and slow mastery',
  Rahu: 'ambition, disruption, and unconventional pulls',
  Ketu: 'release, introspection, and letting go',
};

function energyPlain(level: EnergyLevel): string {
  switch (level) {
    case 'high':
      return 'high vitality — favorable for initiative and outward action';
    case 'balanced':
      return 'steady, balanced flow — progress with mindful pacing';
    case 'low':
      return 'quieter tone — rest, routine, and inner work are favored';
    case 'caution':
      return 'heightened friction — move deliberately and protect boundaries';
  }
}

function stripVedicForSeed(text: string): string {
  return text
    .replace(/\b(D1|D9|D10|Navamsha|Dashamsha|Vargottama|Upapada|Lagna|Mahadasha|Antardasha|Purushartha)\b/gi, 'life pattern')
    .replace(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/g, 'inner factor')
    .replace(/\b(in|from)\s+[A-Z][a-z]+(\s+\([^)]+\))?/g, 'in a significant life area')
    .replace(/\b\d+(st|nd|rd|th)\s+house\b/gi, 'a life domain')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parashariToPlain(sections: ParashariSection[]): string {
  return sections
    .filter((s) => s.id !== 'dasha')
    .map((s) => {
      const body = [s.teaser, ...s.paragraphs.slice(0, 2)].join(' ');
      return stripVedicForSeed(body);
    })
    .join('\n\n');
}

function todayEnergyFromForecast(forecast: DailyForecast): string {
  const today = forecast.days[0];
  if (!today) return 'Energy data unavailable for today.';
  const themes = today.highlights
    .slice(1)
    .map(stripVedicForSeed)
    .filter(Boolean)
    .join('; ');
  return `Today (${today.label}): energy index ${today.energyScore}/100 — ${energyPlain(today.energyLevel)}.${themes ? ` Active themes: ${themes}.` : ''}`;
}

function weekPatternFromForecast(forecast: DailyForecast): string {
  return forecast.days
    .map((d) => `${d.label} (${d.date}): ${d.energyScore}/100, ${energyPlain(d.energyLevel)}`)
    .join('\n');
}

function daySignalsFromForecast(forecast: DailyForecast): string {
  return forecast.days
    .map((d) => {
      const factors = d.highlights.slice(1).map(stripVedicForSeed).filter(Boolean).join('; ');
      return `${d.label} (${d.date}): score ${d.energyScore}/100 — ${energyPlain(d.energyLevel)}; weekday ${d.panchang.vara}; underlying timing factors: ${factors || 'neutral baseline'}`;
    })
    .join('\n');
}

function lifeChapterFromDasha(dasha: DailySnapshot['dasha']): string {
  const md = PERIOD_THEMES[dasha.mahadasha.planet] ?? 'major life themes';
  const ad = PERIOD_THEMES[dasha.antardasha.planet] ?? 'current sub-themes';
  return `Broader life chapter emphasizes ${md}. The nearer window spotlights ${ad} — decisions and habits now train that focus.`;
}

function innerBaselineFromReadings(
  career: CareerReading | undefined,
  personal: PersonalReading | undefined,
  sections: ParashariSection[],
): string {
  if (personal) {
    const profile = buildPersonalPsychProfile(personal);
    const careerNote = career
      ? `Professional baseline: structured execution and public contribution matter; current period ${career.dasha.current.md.kind} tone for work themes.`
      : '';
    return [profile.temperament, profile.coreStrengths, careerNote].filter(Boolean).join(' ');
  }
  return parashariToPlain(sections);
}

export function buildDailyPsychSeed(
  snapshot: Pick<
    DailySnapshot,
    | 'forecast'
    | 'parashari'
    | 'dasha'
    | 'currentPlaceLabel'
    | 'careerReading'
    | 'personalReading'
  >,
): DailyPsychSeed {
  return {
    todayEnergy: todayEnergyFromForecast(snapshot.forecast),
    weekPattern: weekPatternFromForecast(snapshot.forecast),
    daySignals: daySignalsFromForecast(snapshot.forecast),
    innerBaseline: innerBaselineFromReadings(
      snapshot.careerReading,
      snapshot.personalReading,
      snapshot.parashari.sections,
    ),
    lifeChapter: lifeChapterFromDasha(snapshot.dasha),
    locationLabel: snapshot.currentPlaceLabel,
  };
}
