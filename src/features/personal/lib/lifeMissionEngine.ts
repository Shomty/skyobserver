import {
  calculateCharakarakas,
  calculateDrishti,
  getDignity,
  getRashiLord,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import { GRAHAS, houseOfSign, signName, signOfHouse } from './personalConstants';

export interface LifeMissionAnalysis {
  atmakaraka: {
    planet: string;
    sign: string;
    house: number;
    dignity: string | null;
    d9Sign: string | null;
    d9House: number | null;
    d9Dignity: string | null;
  } | null;
  ninthHouse: {
    sign: string;
    lord: string;
    lordHouse: number;
    lordSign: string;
    lordDignity: string | null;
    occupants: string[];
  };
  rahuKetu: {
    rahu: { sign: string; house: number };
    ketu: { sign: string; house: number };
  };
}

export function buildLifeMissionAnalysis(
  positions: PlanetPosition[],
  ascSign: SignNumber,
): LifeMissionAnalysis {
  const charas = calculateCharakarakas(positions);
  const ak = charas.AK;
  const d9 = computeDivisionalChart(positions, 'D9');
  const d9AscPos = d9.positions.find((p) => p.name === 'Ascendant');
  const d9Asc = d9AscPos
    ? ((RASHIS.indexOf(d9AscPos.rashi) + 1) as SignNumber)
    : ascSign;

  let atmakaraka: LifeMissionAnalysis['atmakaraka'] = null;
  if (ak !== 'None') {
    const akPos = positions.find((p) => p.name === ak);
    if (akPos) {
      const signNumber = (RASHIS.indexOf(akPos.rashi) + 1) as SignNumber;
      const d9Pos = d9.positions.find((p) => p.name === ak);
      const d9SignNumber = d9Pos
        ? ((RASHIS.indexOf(d9Pos.rashi) + 1) as SignNumber)
        : null;
      atmakaraka = {
        planet: ak,
        sign: akPos.rashi,
        house: akPos.house ?? houseOfSign(signNumber, ascSign),
        dignity: getDignity(ak, RASHIS.indexOf(akPos.rashi)) ?? null,
        d9Sign: d9Pos?.rashi ?? null,
        d9House: d9SignNumber ? houseOfSign(d9SignNumber, d9Asc) : null,
        d9Dignity: d9Pos ? getDignity(ak, RASHIS.indexOf(d9Pos.rashi)) ?? null : null,
      };
    }
  }

  const ninthSign = signOfHouse(9, ascSign);
  const ninthLord = getRashiLord(signName(ninthSign));
  const ninthLordPos = positions.find((p) => p.name === ninthLord);
  const ninthOccupants = positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === ninthSign,
    )
    .map((p) => p.name);

  const rahuPos = positions.find((p) => p.name === 'Rahu');
  const ketuPos = positions.find((p) => p.name === 'Ketu');

  return {
    atmakaraka,
    ninthHouse: {
      sign: signName(ninthSign),
      lord: ninthLord,
      lordHouse: ninthLordPos
        ? (ninthLordPos.house ??
          houseOfSign((RASHIS.indexOf(ninthLordPos.rashi) + 1) as SignNumber, ascSign))
        : 0,
      lordSign: ninthLordPos?.rashi ?? '',
      lordDignity: ninthLordPos
        ? getDignity(ninthLord, RASHIS.indexOf(ninthLordPos.rashi)) ?? null
        : null,
      occupants: ninthOccupants,
    },
    rahuKetu: {
      rahu: rahuPos
        ? {
            sign: rahuPos.rashi,
            house:
              rahuPos.house ??
              houseOfSign((RASHIS.indexOf(rahuPos.rashi) + 1) as SignNumber, ascSign),
          }
        : { sign: '', house: 0 },
      ketu: ketuPos
        ? {
            sign: ketuPos.rashi,
            house:
              ketuPos.house ??
              houseOfSign((RASHIS.indexOf(ketuPos.rashi) + 1) as SignNumber, ascSign),
          }
        : { sign: '', house: 0 },
    },
  };
}

/** Saturn's house and planets it aspects — shadow-work anchor. */
export function analyzeSaturnShadow(
  positions: PlanetPosition[],
  ascSign: SignNumber,
): { sign: string; house: number; aspectedHouses: number[] } {
  const saturn = positions.find((p) => p.name === 'Saturn');
  if (!saturn) return { sign: '', house: 0, aspectedHouses: [] };

  const signNumber = (RASHIS.indexOf(saturn.rashi) + 1) as SignNumber;
  const house = saturn.house ?? houseOfSign(signNumber, ascSign);
  const drishti = calculateDrishti('Saturn', positions);
  const aspectedHouses = drishti.aspectedRashis
    .map((r) => houseOfSign((RASHIS.indexOf(r) + 1) as SignNumber, ascSign))
    .filter((h) => h > 0);

  return { sign: saturn.rashi, house, aspectedHouses };
}
