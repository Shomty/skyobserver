import type { PanchangData } from '../../../vedic-utils';
import { NAKSHATRA_DATA } from '../../../vedic-utils';

export interface MoodLedgerRow {
  label: string;
  value: string;
  detail?: string;
}

const PHASE_LABEL: Record<'Shukla' | 'Krishna', string> = {
  Shukla: 'Building phase',
  Krishna: 'Releasing phase',
};

const WEEKDAY_TONE: Record<string, string> = {
  Sunday: 'Renewal and identity',
  Monday: 'Emotional processing',
  Tuesday: 'Direct action',
  Wednesday: 'Curiosity and connection',
  Thursday: 'Growth and meaning',
  Friday: 'Relationship and pleasure',
  Saturday: 'Structure and boundaries',
};

const YOGA_MOOD: Record<string, string> = {
  Vishkumbha: 'Slow start · patience',
  Priti: 'Warmth · harmony',
  Ayushman: 'Vitality · resilience',
  Saubhagya: 'Openness · good flow',
  Shobhana: 'Clarity · refinement',
  Atiganda: 'Intensity · friction',
  Sukarma: 'Constructive action',
  Dhriti: 'Steady persistence',
  Shula: 'Sharp edges · tension',
  Ganda: 'Obstacles · caution',
  Vriddhi: 'Expansion · growth',
  Dhruva: 'Stability · constancy',
  Vyaghata: 'Interruption · reset',
  Harshana: 'Lift · encouragement',
  Vajra: 'Force · breakthrough',
  Siddhi: 'Completion · ease',
  Vyatipata: 'Disruption · surprise',
  Variyan: 'Excellence · focus',
  Parigha: 'Restriction · boundaries',
  Shiva: 'Renewal · release',
  Siddha: 'Flow · alignment',
  Sadhya: 'Achievable · practical',
  Shubha: 'Supportive · favorable',
  Shukla: 'Bright · outward',
  Brahma: 'Creative · generative',
  Indra: 'Leadership · confidence',
  Vaidhriti: 'Pause · recalibration',
};

const KARANA_MOOD: Record<string, string> = {
  Bava: 'Fresh momentum',
  Balava: 'Gentle strength',
  Kaulava: 'Social warmth',
  Taitila: 'Adaptability',
  Gara: 'Grounded effort',
  Vanija: 'Exchange · negotiation',
  Vishti: 'Slow down · caution',
  Shakuni: 'Intuitive read',
  Chatushpada: 'Steady footing',
  Naga: 'Deep focus',
  Kintughna: 'Transition point',
};

const RASHI_CLIMATE: Record<string, string> = {
  Aries: 'Direct · initiating',
  Taurus: 'Steady · comfort-seeking',
  Gemini: 'Curious · restless',
  Cancer: 'Protective · receptive',
  Leo: 'Expressive · confident',
  Virgo: 'Precise · refining',
  Libra: 'Relational · balancing',
  Scorpio: 'Intense · private',
  Sagittarius: 'Expansive · searching',
  Capricorn: 'Structured · ambitious',
  Aquarius: 'Independent · future-minded',
  Pisces: 'Soft · imaginative',
};

function presentLunarDay(panchang: PanchangData): MoodLedgerRow {
  const phase = PHASE_LABEL[panchang.tithi.phase];
  let mood = `Lunar day ${panchang.tithi.number}`;

  if (panchang.tithi.name === 'Purnima') mood = 'Full moon intensity';
  else if (panchang.tithi.name === 'Amavasya') mood = 'Quiet reset';

  return {
    label: 'Lunar rhythm',
    value: mood,
    detail: `${phase} · ${panchang.tithi.phase === 'Shukla' ? 'outward momentum' : 'inward processing'}`,
  };
}

function presentWeekday(panchang: PanchangData): MoodLedgerRow {
  return {
    label: 'Weekday tone',
    value: panchang.vara,
    detail: WEEKDAY_TONE[panchang.vara] ?? 'Social rhythm',
  };
}

function presentEmotionalTone(panchang: PanchangData): MoodLedgerRow {
  const profile = NAKSHATRA_DATA[panchang.nakshatra.name];
  const theme = profile?.characteristics.replace(/\.$/, '') ?? 'Emotional nuance in the moment';

  return {
    label: 'Emotional tone',
    value: theme,
    detail: 'Inner weather for the day',
  };
}

function presentDayQuality(panchang: PanchangData): MoodLedgerRow {
  return {
    label: 'Day quality',
    value: YOGA_MOOD[panchang.yoga.name] ?? 'Mixed · stay observant',
    detail: `Combined mood index ${panchang.yoga.number} of 27`,
  };
}

function presentHalfDayShift(panchang: PanchangData): MoodLedgerRow {
  return {
    label: 'Half-day shift',
    value: KARANA_MOOD[panchang.karana.name] ?? 'Shifting energy',
    detail: `Segment ${panchang.karana.number} of the lunar day`,
  };
}

function presentFeelingClimate(panchang: PanchangData): MoodLedgerRow {
  const climate = RASHI_CLIMATE[panchang.moonRashi] ?? 'Emotional backdrop';

  return {
    label: 'Feeling climate',
    value: climate,
    detail: 'Emotional backdrop for the day',
  };
}

export function presentMoodLedger(panchang: PanchangData): MoodLedgerRow[] {
  return [
    presentLunarDay(panchang),
    presentWeekday(panchang),
    presentEmotionalTone(panchang),
    presentDayQuality(panchang),
    presentHalfDayShift(panchang),
    presentFeelingClimate(panchang),
  ];
}
