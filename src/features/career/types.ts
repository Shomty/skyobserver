import type { SignNumber, Yoga } from '../../vedic-utils';
import type { BirthInstant } from '../gift/lib/birthInstant';
import type { CareerReading } from './lib/careerReading';
import type { ParashariAnalysis } from './lib/parashariEngine';

export type { CareerReading };

/** Cached Gemini career synthesis — one per email report, never re-fetched on reload. */
export interface CareerAiSynthesis {
  text: string;
  fingerprint: string;
  generatedAt: string;
}

export interface CareerInput {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CareerScore {
  value: number;
  label: string;
  locked?: boolean;
}

export interface DashaRef {
  planet: string;
  startDate: string;
  endDate: string;
}

export interface CareerField {
  label: string;
  weight: number;
  sources: string[];
}

export interface CareerSnapshot {
  ascendantSign: SignNumber;
  tenthHouse: { sign: string; signNumber: SignNumber; occupants: string[] };
  tenthLord: {
    planet: string;
    house: number;
    sign: string;
    isRetrograde: boolean;
    isCombust: boolean;
    dignity?: string;
  };
  d10: { ascendantSign: string; tenthLordHouse: number; amkHouse: number | null };
  amatyakaraka: string | null;
  scores: {
    tenthHouseStrength: CareerScore;
    leadership: CareerScore;
    careerDrive: CareerScore;
  };
  dasha: {
    mahadasha: DashaRef;
    antardasha: DashaRef;
    pratyantardasha: DashaRef;
    nextAntardasha: DashaRef;
  };
  timing: {
    opportunityWindow: { from: string; to: string; reason: string } | null;
    peakEarning: { from: string; to: string; reason: string } | null;
    currentPeriodLord: string;
  };
  wealthYogas: Yoga[];
  fields: CareerField[];
  parashari: ParashariAnalysis;
  /** Full structured reading — absent on reports cached before this pipeline shipped. */
  reading?: CareerReading;
}

export type { BirthInstant };
