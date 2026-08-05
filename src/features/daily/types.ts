import type { SignNumber } from '../../vedic-utils';
import type { BirthInstant } from '../gift/lib/birthInstant';
import type { CareerReading } from '../career/lib/careerReading';
import type { PersonalReading } from '../personal/lib/personalReading';
import type { DailyPlainGuidancePayload } from './lib/dailyGuidanceFingerprint';
import type { DailyPsychSeed } from './lib/dailyPsychProfile';
import type { ParashariAnalysis } from './lib/dailyParashariEngine';
import type { DailyForecast } from './lib/dailyForecastEngine';

export type { CareerReading, PersonalReading, DailyForecast, ParashariAnalysis, DailyPlainGuidancePayload };

export interface DailyAiPlainGuidance {
  guidance: DailyPlainGuidancePayload;
  fingerprint: string;
  generatedAt: string;
}

export interface DashaRef {
  planet: string;
  startDate: string;
  endDate: string;
}

export interface DailySnapshot {
  ascendantSign: SignNumber;
  ascendantSignName: string;
  currentPlaceLabel: string;
  forecastDate: string;
  dasha: {
    mahadasha: DashaRef;
    antardasha: DashaRef;
    pratyantardasha: DashaRef;
    nextAntardasha: DashaRef;
  };
  /** Full readings — present in memory after calculation; omitted from disk cache. */
  careerReading?: CareerReading;
  personalReading?: PersonalReading;
  parashari: ParashariAnalysis;
  forecast: DailyForecast;
  /** Plain-language seed for Gemini — persisted so shared reports can regenerate plain text. */
  psychSeed?: DailyPsychSeed;
}

export type { BirthInstant };
