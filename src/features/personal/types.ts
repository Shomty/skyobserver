import type { SignNumber } from '../../vedic-utils';
import type { BirthInstant } from '../gift/lib/birthInstant';
import type { PersonalReading } from './lib/personalReading';
import type { ParashariAnalysis } from './lib/personalParashariEngine';

export type { PersonalReading };

/** Cached Gemini secular guidance (Section 8) — one per email report. */
export interface PersonalPsychGuidanceFields {
  selfUnderstanding: string;
  copingStrategies: string;
  dailyPractices: string;
  currentChapterGuidance: string;
  whenToSeekSupport: string;
}

export interface PersonalAiGuidance {
  guidance: PersonalPsychGuidanceFields;
  fingerprint: string;
  generatedAt: string;
}

/** @deprecated Legacy Vedic prose synthesis — replaced by PersonalAiGuidance. */
export interface PersonalAiSynthesis {
  text: string;
  fingerprint: string;
  generatedAt: string;
}

export type PersonalAiSynthesisOrGuidance = PersonalAiGuidance | PersonalAiSynthesis;

export interface PersonalScore {
  value: number;
  label: string;
  locked?: boolean;
}

export interface DashaRef {
  planet: string;
  startDate: string;
  endDate: string;
}

export interface PersonalSnapshot {
  ascendantSign: SignNumber;
  ascendantSignName: string;
  personalityWheel: {
    lagnaSign: string;
    moonSign: string;
    sunSign: string;
    lagnaLord: string;
    lagnaLordHouse: number;
    element: string;
    guna: string;
  };
  scores: {
    innerStrength: PersonalScore;
    relationshipHarmony: PersonalScore;
    lifeClarity: PersonalScore;
  };
  dasha: {
    mahadasha: DashaRef;
    antardasha: DashaRef;
    pratyantardasha: DashaRef;
    nextAntardasha: DashaRef;
  };
  timing: {
    activeSudarshanaHouse: number;
    activeLifeArea: string;
    currentPeriodLord: string;
    activatedLifeAreas: string[];
  };
  parashari: ParashariAnalysis;
  /** Full structured reading — absent on reports cached before this pipeline shipped. */
  reading?: PersonalReading;
}

export type { BirthInstant };
