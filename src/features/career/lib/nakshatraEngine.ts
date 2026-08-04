import { debugWarn } from '../../../lib/debug';
import {
  getDignity,
  getRashiLord,
  NAKSHATRA_DATA,
  NAKSHATRAS,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { Gana } from '../copy/nakshatraGana';
import { NAKSHATRA_GANA } from '../copy/nakshatraGana';
import type { ShaktiEntry } from '../copy/nakshatraShakti';
import { NAKSHATRA_SHAKTI } from '../copy/nakshatraShakti';

export interface NakshatraPosition {
  index: number;
  name: string;
  pada: 1 | 2 | 3 | 4;
  lord: string;
  degreesInto: number;
}

export function nakshatraFromLongitude(siderealLongitude: number): NakshatraPosition {
  const norm = ((siderealLongitude % 360) + 360) % 360;
  const totalMilliArcmin = Math.round(norm * 60 * 1000);
  const index = Math.min(26, Math.floor(totalMilliArcmin / 800_000));
  const remainder = totalMilliArcmin - index * 800_000;
  const pada = (Math.floor(remainder / 200_000) + 1) as 1 | 2 | 3 | 4;
  const name = NAKSHATRAS[index];
  return {
    index,
    name,
    pada,
    lord: NAKSHATRA_DATA[name].lord,
    degreesInto: remainder / 60_000,
  };
}

export interface Dispositorship {
  planet: string;
  nakshatra: string;
  nakshatraLord: string;
  lordHouse: number | null;
  lordSign: string | null;
  lordDignity: string | null;
  channelNote: string;
}

export function resolveDispositorship(
  planet: string,
  positions: PlanetPosition[],
  ascSign: SignNumber,
): Dispositorship | null {
  const pos = positions.find((p) => p.name === planet);
  if (!pos) return null;

  const computed = nakshatraFromLongitude(pos.siderealLongitude);
  if (pos.nakshatra && pos.nakshatra !== computed.name) {
    debugWarn('career', `Nakshatra mismatch for ${planet}: stored=${pos.nakshatra}, computed=${computed.name}`);
  }

  const nakshatraLord = NAKSHATRA_DATA[computed.name].lord;
  let effectiveLord = nakshatraLord;
  let extraHop = '';

  if (nakshatraLord === 'Rahu' || nakshatraLord === 'Ketu') {
    const nodePos = positions.find((p) => p.name === nakshatraLord);
    if (nodePos) {
      effectiveLord = getRashiLord(nodePos.rashi);
      extraHop = ` via ${nakshatraLord} dispositor ${effectiveLord}`;
    }
  }

  const lordPos = positions.find((p) => p.name === effectiveLord);
  const lordSign = lordPos?.rashi ?? null;
  const lordHouse = lordPos?.house ?? null;
  const lordDignity = lordPos
    ? (getDignity(effectiveLord, RASHIS.indexOf(lordPos.rashi)) ?? null)
    : null;

  const channelNote = `${planet} delivers through ${nakshatraLord}${extraHop}${
    lordHouse != null ? ` in house ${lordHouse}` : ''
  }`;

  return {
    planet,
    nakshatra: computed.name,
    nakshatraLord,
    lordHouse,
    lordSign,
    lordDignity,
    channelNote,
  };
}

export type TaraName =
  | 'Janma'
  | 'Sampat'
  | 'Vipat'
  | 'Kshema'
  | 'Pratyak'
  | 'Sadhana'
  | 'Naidhana'
  | 'Mitra'
  | 'Parama Mitra';

export const TARA_SEQUENCE: TaraName[] = [
  'Janma',
  'Sampat',
  'Vipat',
  'Kshema',
  'Pratyak',
  'Sadhana',
  'Naidhana',
  'Mitra',
  'Parama Mitra',
];

export const TARA_QUALITY: Record<TaraName, 'favorable' | 'challenging' | 'mixed'> = {
  Janma: 'mixed',
  Sampat: 'favorable',
  Vipat: 'challenging',
  Kshema: 'favorable',
  Pratyak: 'challenging',
  Sadhana: 'favorable',
  Naidhana: 'challenging',
  Mitra: 'favorable',
  'Parama Mitra': 'favorable',
};

export function taraFromMoon(moonNakIndex: number, targetNakIndex: number): {
  count: number;
  cycle: 1 | 2 | 3;
  tara: TaraName;
  quality: 'favorable' | 'challenging' | 'mixed';
  isKarmaTara: boolean;
} {
  const count = ((targetNakIndex - moonNakIndex + 27) % 27) + 1;
  const cycle = Math.ceil(count / 9) as 1 | 2 | 3;
  const tara = TARA_SEQUENCE[(count - 1) % 9];
  return {
    count,
    cycle,
    tara,
    quality: TARA_QUALITY[tara],
    isKarmaTara: count === 10,
  };
}

export function getPlanetGana(planet: string, positions: PlanetPosition[]): Gana | undefined {
  const pos = positions.find((p) => p.name === planet);
  if (!pos) return undefined;
  const nak = nakshatraFromLongitude(pos.siderealLongitude);
  return NAKSHATRA_GANA[nak.name];
}

export function getPlanetShakti(
  planet: string,
  positions: PlanetPosition[],
): { planet: string; nakshatra: string; entry: ShaktiEntry | undefined } | null {
  const pos = positions.find((p) => p.name === planet);
  if (!pos) return null;
  const nak = nakshatraFromLongitude(pos.siderealLongitude);
  return {
    planet,
    nakshatra: nak.name,
    entry: NAKSHATRA_SHAKTI[nak.name],
  };
}
