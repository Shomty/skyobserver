import { PlanetPosition, RASHIS } from '../vedic-utils';

// ─── Pure-math divisional chart engine ───────────────────────────────────────
// Ported from openastrology-library formulas to avoid the swisseph native-addon
// dependency that crashes in the browser.

type SignType = 'movable' | 'fixed' | 'dual';

function getSignType(signIndex: number): SignType {
  switch (signIndex % 3) {
    case 0: return 'movable';
    case 1: return 'fixed';
    default: return 'dual';
  }
}

type Element = 'fire' | 'earth' | 'air' | 'water';
const SIGN_ELEMENTS: Record<string, Element> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};
const SIGN_NAMES_LC = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
];
function getSignElement(signIdx: number): Element {
  return SIGN_ELEMENTS[SIGN_NAMES_LC[signIdx]] ?? 'fire';
}

/** Returns a normalised longitude (0–360) for each chart type */
const FORMULAS: Record<string, (lon: number) => number> = {
  D1: (lon) => lon,
  D2: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const isOdd = sign % 2 === 0;
    if (isOdd) return deg < 15 ? 120 + deg * 2 : 90 + (deg - 15) * 2;
    return deg < 15 ? 90 + deg * 2 : 120 + (deg - 15) * 2;
  },
  D3: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const d = Math.floor(deg / 10);
    const r = deg % 10;
    if (d === 0) return sign * 30 + r * 3;
    if (d === 1) return (sign + 4) % 12 * 30 + r * 3;
    return (sign + 8) % 12 * 30 + r * 3;
  },
  D4: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 7.5);
    const r = deg % 7.5;
    const offsets = [0, 3, 6, 9];
    return (sign + offsets[part]) % 12 * 30 + r * 4;
  },
  D5: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 6);
    const r = deg % 6;
    const odd  = [0, 10, 8, 2, 6];
    const even = [1, 5, 11, 9, 7];
    const rs = sign % 2 === 0 ? odd[part] : even[part];
    return rs * 30 + r * 5;
  },
  D6: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 5);
    const r = deg % 5;
    const rs = sign % 2 === 0 ? part : 6 + part;
    return rs * 30 + r * 6;
  },
  D7: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const size = 30 / 7;
    const part = Math.floor(deg / size);
    const r = deg % size;
    const rs = sign % 2 === 0
      ? (sign + part) % 12
      : (sign + 6 + part) % 12;
    return rs * 30 + r * 7;
  },
  D8: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 3.75);
    const r = deg % 3.75;
    const starts: Record<SignType, number> = { movable: 0, fixed: 8, dual: 4 };
    const rs = (starts[getSignType(sign)] + part) % 12;
    return rs * 30 + r * 8;
  },
  D9: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const nav = Math.floor(deg / (30 / 9));
    const offsets: Record<SignType, number> = { movable: 0, fixed: 8, dual: 4 };
    const rs = (sign + offsets[getSignType(sign)] + nav) % 12;
    return rs * 30 + deg % (30 / 9) * 9;
  },
  D10: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 3);
    const rs = sign % 2 === 0 ? (sign + part) % 12 : (sign + 8 + part) % 12;
    return rs * 30 + deg % 3 * 10;
  },
  D11: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const size = 30 / 11;
    const part = Math.floor(deg / size);
    const rs = ((12 - sign) + part) % 12;
    return rs * 30 + deg % size * 11;
  },
  D12: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 2.5);
    const r = deg % 2.5;
    const rs = (sign + part) % 12;
    return rs * 30 + (r / 2.5) * 30;
  },
  D16: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 1.875);
    const starts: Record<SignType, number> = { movable: 0, fixed: 4, dual: 8 };
    const rs = (starts[getSignType(sign)] + part) % 12;
    return rs * 30 + deg % 1.875 * 16;
  },
  D20: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 1.5);
    const starts: Record<SignType, number> = { movable: 0, fixed: 8, dual: 4 };
    const rs = (starts[getSignType(sign)] + part) % 12;
    return rs * 30 + deg % 1.5 * 20;
  },
  D24: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const part = Math.floor(deg / 1.25);
    const start = sign % 2 === 0 ? 4 : 3;
    return (start + part) % 12 * 30 + deg % 1.25 * 24;
  },
  D27: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const size = 30 / 27;
    const part = Math.floor(deg / size);
    const starts: Record<Element, number> = { fire: 0, earth: 3, air: 6, water: 9 };
    const rs = (starts[getSignElement(sign)] + part) % 12;
    return rs * 30 + deg % size * 27;
  },
  D30: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const r = deg % 1;
    const isOdd = sign % 2 === 0;
    let rs: number;
    if (isOdd) {
      rs = deg < 5 ? 0 : deg < 10 ? 10 : deg < 18 ? 8 : deg < 25 ? 2 : 6;
    } else {
      rs = deg < 5 ? 1 : deg < 12 ? 5 : deg < 20 ? 11 : deg < 25 ? 9 : 7;
    }
    return rs * 30 + r * 30;
  },
  D40: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const size = 0.75;
    const part = Math.floor(deg / size);
    const start = sign % 2 === 0 ? 0 : 6;
    const rs = (start + part % 12) % 12;
    return rs * 30 + deg % size * 40;
  },
  D45: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const size = 40 / 60;
    const part = Math.floor(deg / size);
    const starts: Record<SignType, number> = { movable: 0, fixed: 4, dual: 8 };
    const rs = (starts[getSignType(sign)] + part % 12) % 12;
    return rs * 30 + deg % size * 45;
  },
  D60: (lon) => {
    const sign = Math.floor(lon / 30);
    const deg = lon % 30;
    const partNum = Math.floor(deg * 2) + 1;
    const rs = (sign + partNum - 1) % 12;
    return rs * 30 + deg % 0.5 * 60;
  },
};

function applyFormula(siderealLon: number, chartType: string): number {
  const fn = FORMULAS[chartType];
  if (!fn) return siderealLon;
  const raw = fn(siderealLon);
  return (raw % 360 + 360) % 360;
}

function getNakshatraFromLon(lon: number): { nakshatra: string; pada: number } {
  const NAKSHATRAS = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
    'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
    'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha',
    'Purva Bhadrapada','Uttara Bhadrapada','Revati',
  ];
  const idx = Math.floor((lon % 360) / (360 / 27));
  const pada = Math.floor(((lon % 360) % (360 / 27)) / (360 / 27 / 4)) + 1;
  return { nakshatra: NAKSHATRAS[idx] ?? 'Ashwini', pada };
}

export type DivisionalChartType =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10'
  | 'D11' | 'D12' | 'D16' | 'D20' | 'D24' | 'D27' | 'D30' | 'D40' | 'D45' | 'D60';

export const DIVISIONAL_CHART_TYPES: DivisionalChartType[] = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
  'D11', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60',
];

export interface DivisionalChartInfo {
  name: string;
  sanskritName: string;
  purpose: string;
}

export const DIVISIONAL_CHART_INFO: Record<DivisionalChartType, DivisionalChartInfo> = {
  D1:  { name: 'Rashi',           sanskritName: 'Rashi Chart',           purpose: 'Main birth chart — all areas of life' },
  D2:  { name: 'Hora',            sanskritName: 'Hora Chart',            purpose: 'Wealth, finances & material resources' },
  D3:  { name: 'Drekkana',        sanskritName: 'Drekkana Chart',        purpose: 'Siblings, courage & life force' },
  D4:  { name: 'Chaturthamsha',   sanskritName: 'Chaturthamsha Chart',   purpose: 'Property, fortune & fixed assets' },
  D5:  { name: 'Panchamsha',      sanskritName: 'Panchamsha Chart',      purpose: 'Past-life merit, spiritual gifts' },
  D6:  { name: 'Shashthamsha',    sanskritName: 'Shashthamsha Chart',    purpose: 'Health, enemies & obstacles' },
  D7:  { name: 'Saptamsha',       sanskritName: 'Saptamsha Chart',       purpose: 'Children, creativity & progeny' },
  D8:  { name: 'Ashtamsha',       sanskritName: 'Ashtamsha Chart',       purpose: 'Longevity, transformation & hidden matters' },
  D9:  { name: 'Navamsha',        sanskritName: 'Navamsha Chart',        purpose: 'Marriage, dharma & spiritual path (most important)' },
  D10: { name: 'Dashamsha',       sanskritName: 'Dashamsha Chart',       purpose: 'Career, profession & public life' },
  D11: { name: 'Ekadashamsha',    sanskritName: 'Ekadashamsha Chart',    purpose: 'Income, gains & social benefits' },
  D12: { name: 'Dvadashamsha',    sanskritName: 'Dvadashamsha Chart',    purpose: 'Parents & ancestral heritage' },
  D16: { name: 'Shodashamsha',    sanskritName: 'Shodashamsha Chart',    purpose: 'Vehicles, comforts & luxuries' },
  D20: { name: 'Vimshamsha',      sanskritName: 'Vimshamsha Chart',      purpose: 'Spiritual progress & worship' },
  D24: { name: 'Chaturvimshamsha',sanskritName: 'Chaturvimshamsha Chart',purpose: 'Education, learning & knowledge' },
  D27: { name: 'Saptavimshamsha', sanskritName: 'Saptavimshamsha Chart', purpose: 'Strengths, weaknesses & vitality' },
  D30: { name: 'Trimsamsha',      sanskritName: 'Trimsamsha Chart',      purpose: 'Misfortune, ill-health & moral character' },
  D40: { name: 'Khavedamsha',     sanskritName: 'Khavedamsha Chart',     purpose: 'Auspicious & inauspicious effects' },
  D45: { name: 'Akshavedamsha',   sanskritName: 'Akshavedamsha Chart',   purpose: 'General welfare across all life areas' },
  D60: { name: 'Shashtyamsha',    sanskritName: 'Shashtyamsha Chart',    purpose: 'Overall wellbeing & past-life karma' },
};

function capitalizeSign(signIdx: number): string {
  return RASHIS[signIdx] ?? 'Aries';
}

/**
 * Compute divisional chart positions from a set of birth positions.
 * Returns the same PlanetPosition[] shape so NorthIndianChart can render it directly.
 * For D1, returns the input unchanged.
 */
export function computeDivisionalChart(
  birthPositions: PlanetPosition[],
  chartType: DivisionalChartType,
): PlanetPosition[] {
  if (chartType === 'D1') return birthPositions;

  const divisionalPositions: PlanetPosition[] = [];

  for (const p of birthPositions) {
    const newLon = applyFormula(p.siderealLongitude, chartType);
    const signIdx = Math.floor(newLon / 30) % 12;
    const degFloat = newLon % 30;
    const deg = Math.floor(degFloat);
    const min = Math.round((degFloat - deg) * 60);
    const { nakshatra, pada } = getNakshatraFromLon(newLon);

    divisionalPositions.push({
      ...p,
      siderealLongitude: newLon,
      rashi: capitalizeSign(signIdx),
      degree: deg,
      minute: min,
      nakshatra,
      pada,
    });
  }

  return divisionalPositions;
}
