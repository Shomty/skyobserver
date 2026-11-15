import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import {
  calculateCharakarakas,
  getDignity,
  getRashiLord,
  getVargottamaPlanets,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import { getChartLords } from '../../career/lib/d1Engine';
import { buildD10Analysis } from '../../career/lib/d10Engine';
import { isUpagrahaAssociated } from '../../career/lib/karmicChecks';
import { nakshatraFromLongitude } from '../../career/lib/nakshatraEngine';
import { GRAHAS, houseOfSign, signName, signOfHouse } from '../../career/lib/careerConstants';
import { buildD9PersonalAnalysis } from '../../personal/lib/d9PersonalEngine';
import { remediesForPlanets, type PlanetaryRemedy } from './yearMantras';
import { alertnessFromDignity, strengthWeight, type Alertness } from './yearStrength';

/** Houses where Gulika or Mandi in D10 is read as a career-growth assignment. */
const D10_CAREER_HOUSES = new Set([1, 6, 10, 11]);

const LAGNA_THEMES: Record<string, { felicity: string; intellect: string; nature: string }> = {
  Aries: {
    felicity: 'The body likes a clean start and tires when movement is blocked.',
    intellect: 'The mind decides quickly and learns by doing.',
    nature: 'Innately initiating, candid, and impatient with delay.',
  },
  Taurus: {
    felicity: 'The body steadies through rhythm, food, and familiar comfort.',
    intellect: 'The mind trusts what it can touch, build, and repeat.',
    nature: 'Innately loyal, sensual, and slow to abandon what it values.',
  },
  Gemini: {
    felicity: 'The body stays bright when the day has conversation and variety.',
    intellect: 'The mind links ideas and needs more than one thread.',
    nature: 'Innately curious, adaptable, and restless if boxed in.',
  },
  Cancer: {
    felicity: 'The body softens in safe rooms and tightens when care is uncertain.',
    intellect: 'The mind remembers through feeling before it reasons.',
    nature: 'Innately protective, tidal, and devoted to its people.',
  },
  Leo: {
    felicity: 'The body warms when effort is seen and purpose is named.',
    intellect: 'The mind thinks in scenes, pride, and creative risk.',
    nature: 'Innately generous, dignified, and hungry to matter.',
  },
  Virgo: {
    felicity: 'The body responds to order, useful work, and modest routines.',
    intellect: 'The mind sorts, improves, and notices the unfinished detail.',
    nature: 'Innately precise, helpful, and uneasy with mess it cannot tend.',
  },
  Libra: {
    felicity: 'The body eases in fair exchange and strains in ugly conflict.',
    intellect: 'The mind weighs both sides before it commits.',
    nature: 'Innately relational, aesthetic, and oriented toward accord.',
  },
  Scorpio: {
    felicity: 'The body holds intensity and recovers in privacy, not in noise.',
    intellect: 'The mind searches for what is concealed and will not stay shallow.',
    nature: 'Innately penetrating, loyal in private, and slow to trust.',
  },
  Sagittarius: {
    felicity: 'The body wants range: a path, a teacher, or a horizon.',
    intellect: 'The mind looks for the principle underneath the fact.',
    nature: 'Innately hopeful, blunt, and aimed at a larger meaning.',
  },
  Capricorn: {
    felicity: 'The body respects load it has agreed to carry.',
    intellect: 'The mind plans in steps and distrusts unearned praise.',
    nature: 'Innately responsible, reserved, and built for the long climb.',
  },
  Aquarius: {
    felicity: 'The body needs air between itself and the crowd it still serves.',
    intellect: 'The mind experiments and cares about the system, not only the self.',
    nature: 'Innately independent, future-facing, and loyal to an idea.',
  },
  Pisces: {
    felicity: 'The body absorbs atmosphere and needs a shore to return to.',
    intellect: 'The mind knows by image, empathy, and imagination.',
    nature: 'Innately permeable, compassionate, and in need of a boundary.',
  },
};

export interface PlanetSpot {
  planet: string;
  sign: string;
  house: number;
  dignity: string | null;
  alertness: Alertness;
}

export interface YearGraha {
  planet: string;
  sign: string;
  degree: string;
  house: number;
  nakshatra: string;
  nakshatraLord: string;
  dignity: string | null;
  isVargottama: boolean;
  strengthWeight: number;
}

export interface UpagrahaNote {
  point: 'Gulika' | 'Mandi';
  chart: 'D9' | 'D10';
  sign: string;
  house: number;
  touches: string;
  framing: string;
}

export interface DashaLordYear {
  level: 'mahadasha' | 'antardasha';
  lord: string;
  from: string;
  to: string;
  d1: PlanetSpot | null;
  d9: PlanetSpot | null;
  d10: PlanetSpot | null;
  /** Awake in own sign or exaltation in the birth chart. */
  favorable: boolean;
  challenging: boolean;
  gulikaAssociated: boolean;
  mandiAssociated: boolean;
}

export interface YearReading {
  year: number;
  stance: string;
  d1: {
    lagna: {
      sign: string;
      degree: string;
      nakshatra: string;
      nakshatraLord: string;
      lord: string;
      felicity: string;
      intellect: string;
      nature: string;
    };
    grahas: YearGraha[];
  };
  vargottama: {
    planets: string[];
    maxWeight: number;
    note: string;
  };
  d9: {
    lagnaSign: string;
    seventh: {
      sign: string;
      lord: string;
      lordHouse: number | null;
      lordDignity: string | null;
      occupants: string[];
    };
    upapada: {
      sign: string;
      houseFromLagna: number;
      d9PlanetsInSign: string[];
      netInfluence: string;
    };
    relationshipNotes: UpagrahaNote[];
  };
  d10: {
    lagnaSign: string;
    tenth: {
      sign: string;
      lord: string;
      lordHouse: number;
      occupants: string[];
    };
    amatyakaraka: {
      planet: string | null;
      d1Sign: string;
      d1House: number;
      d10Sign: string | null;
      d10House: number | null;
      conjunctOrInfluencingTenth: boolean;
      soulPurpose: string;
    };
    careerNotes: UpagrahaNote[];
  };
  dasha: {
    system: 'vimshottari';
    mahadasha: DashaLordYear;
    antardasha: DashaLordYear;
    positivePredictive: boolean;
    needsRemedy: boolean;
  };
  remedies: PlanetaryRemedy[];
}

function formatDegree(longitude: number): string {
  const degFloat = ((longitude % 30) + 30) % 30;
  const deg = Math.floor(degFloat);
  const min = Math.floor((degFloat - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'`;
}

function chartPositions(positions: PlanetPosition[], chart: 'D1' | 'D9' | 'D10') {
  const source = chart === 'D1' ? positions : computeDivisionalChart(positions, chart).positions;
  const asc = source.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error(`${chart} ascendant not found`);
  const ascSign = (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;
  return { source, asc, ascSign };
}

function placePlanet(
  source: PlanetPosition[],
  ascSign: SignNumber,
  name: string,
): PlanetSpot | null {
  const planet = source.find((p) => p.name === name);
  if (!planet) return null;
  const signIdx = RASHIS.indexOf(planet.rashi);
  const signNumber = (signIdx + 1) as SignNumber;
  const dignity =
    name === 'Gulika' || name === 'Maandi'
      ? null
      : (getDignity(name, signIdx) ?? planet.dignity ?? null);
  return {
    planet: name,
    sign: planet.rashi,
    house: planet.house ?? houseOfSign(signNumber, ascSign),
    dignity,
    alertness: alertnessFromDignity(dignity),
  };
}

function displayPoint(name: 'Gulika' | 'Maandi'): 'Gulika' | 'Mandi' {
  return name === 'Maandi' ? 'Mandi' : 'Gulika';
}

function relationshipFrame(point: 'Gulika' | 'Mandi'): string {
  return `${point} on the Navamsha relationship axis marks a tender karmic lesson in partnership. Meet it with patience and honesty. It is not a sentence against love.`;
}

function careerFrame(point: 'Gulika' | 'Mandi'): string {
  return `${point} in a key Dashamsha career house is a spiritual growth assignment: slower trust, cleaner motives, and steadier craft. Treat the delay as practice.`;
}

function lordPeriod(
  level: DashaLordYear['level'],
  period: { planet: string; startDate: string; endDate: string } | null,
  contexts: {
    d1: ReturnType<typeof chartPositions>;
    d9: ReturnType<typeof chartPositions>;
    d10: ReturnType<typeof chartPositions>;
  },
  positions: PlanetPosition[],
  now: Date,
): DashaLordYear {
  const lord = period?.planet ?? 'Unknown';
  const d1 = lord === 'Unknown' ? null : placePlanet(contexts.d1.source, contexts.d1.ascSign, lord);
  const heavyHouse = d1 ? d1.house === 8 || d1.house === 12 : false;
  const gulikaAssociated = lord !== 'Unknown' && isUpagrahaAssociated('Gulika', lord, positions);
  const mandiAssociated = lord !== 'Unknown' && isUpagrahaAssociated('Maandi', lord, positions);
  const favorable = d1?.alertness === 'jagrata';
  const challenging = d1?.alertness === 'heavy' || heavyHouse || gulikaAssociated || mandiAssociated;

  return {
    level,
    lord,
    from: period?.startDate ?? now.toISOString(),
    to: period?.endDate ?? now.toISOString(),
    d1,
    d9: lord === 'Unknown' ? null : placePlanet(contexts.d9.source, contexts.d9.ascSign, lord),
    d10: lord === 'Unknown' ? null : placePlanet(contexts.d10.source, contexts.d10.ascSign, lord),
    favorable: Boolean(favorable),
    challenging,
    gulikaAssociated,
    mandiAssociated,
  };
}

export function buildYearReading(
  positions: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  now: Date,
): YearReading {
  const d1 = chartPositions(positions, 'D1');
  const d9 = chartPositions(positions, 'D9');
  const d10 = chartPositions(positions, 'D10');
  const lagnaSign = d1.asc.rashi;
  const theme = LAGNA_THEMES[lagnaSign] ?? LAGNA_THEMES.Aries;
  const nak = nakshatraFromLongitude(d1.asc.siderealLongitude);
  const lords = getChartLords(d1.ascSign);
  const vargottama = getVargottamaPlanets(positions);

  const grahas: YearGraha[] = positions
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]))
    .map((p) => {
      const planetNak = nakshatraFromLongitude(p.siderealLongitude);
      const dignity = getDignity(p.name, RASHIS.indexOf(p.rashi)) ?? p.dignity ?? null;
      const isVargottama = vargottama.includes(p.name);
      return {
        planet: p.name,
        sign: p.rashi,
        degree: formatDegree(p.siderealLongitude),
        house: p.house ?? houseOfSign((RASHIS.indexOf(p.rashi) + 1) as SignNumber, d1.ascSign),
        nakshatra: planetNak.name,
        nakshatraLord: planetNak.lord,
        dignity,
        isVargottama,
        strengthWeight: strengthWeight(isVargottama, dignity),
      };
    });

  const charas = calculateCharakarakas(positions);
  const personalD9 = buildD9PersonalAnalysis(positions, d1.ascSign, lords.lagnaLord, charas.AK);
  const d10Analysis = buildD10Analysis(positions, charas.AmK !== 'None' ? charas.AmK : null);

  const seventhSign = signName(signOfHouse(7, d9.ascSign));
  const seventhLord = getRashiLord(seventhSign);
  const seventhLordSpot = placePlanet(d9.source, d9.ascSign, seventhLord);
  const axisSigns = new Set(
    [d9.asc.rashi, seventhSign, seventhLordSpot?.sign].filter((s): s is string => Boolean(s)),
  );

  const relationshipNotes: UpagrahaNote[] = [];
  for (const point of ['Gulika', 'Maandi'] as const) {
    const spot = placePlanet(d9.source, d9.ascSign, point);
    if (!spot) continue;
    const onAxis = spot.house === 1 || spot.house === 7 || axisSigns.has(spot.sign);
    if (!onAxis) continue;
    const label = displayPoint(point);
    relationshipNotes.push({
      point: label,
      chart: 'D9',
      sign: spot.sign,
      house: spot.house,
      touches: spot.house === 7 ? 'D9 7th house' : spot.house === 1 ? 'D9 lagna' : 'D9 relationship axis',
      framing: relationshipFrame(label),
    });
  }

  const ulSign = personalD9.relationship.upapada.sign;
  const d9PlanetsInUl = d9.source
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]) && p.rashi === ulSign)
    .map((p) => p.name);

  const careerNotes: UpagrahaNote[] = [];
  for (const point of ['Gulika', 'Maandi'] as const) {
    const spot = placePlanet(d10.source, d10.ascSign, point);
    if (!spot || !D10_CAREER_HOUSES.has(spot.house)) continue;
    const label = displayPoint(point);
    careerNotes.push({
      point: label,
      chart: 'D10',
      sign: spot.sign,
      house: spot.house,
      touches: `D10 house ${spot.house}`,
      framing: careerFrame(label),
    });
  }

  const amkName = charas.AmK !== 'None' ? charas.AmK : null;
  const amkD10 = amkName ? placePlanet(d10.source, d10.ascSign, amkName) : null;
  const amkInfluencesTenth =
    Boolean(amkName) &&
    (d10Analysis.amk.connectsTenth || d10Analysis.tenth.occupants.includes(amkName!));

  const mahadasha = lordPeriod('mahadasha', dashas.current.mahadasha, { d1, d9, d10 }, positions, now);
  const antardasha = lordPeriod('antardasha', dashas.current.antardasha, { d1, d9, d10 }, positions, now);
  const positivePredictive = mahadasha.favorable || antardasha.favorable;
  const karmicLoad = relationshipNotes.length > 0 || careerNotes.length > 0;
  const needsRemedy = mahadasha.challenging || antardasha.challenging || karmicLoad;

  const remedyPlanets: string[] = [];
  if (mahadasha.challenging) remedyPlanets.push(mahadasha.lord);
  if (antardasha.challenging) remedyPlanets.push(antardasha.lord);
  if (karmicLoad || mahadasha.gulikaAssociated || antardasha.gulikaAssociated || mahadasha.mandiAssociated || antardasha.mandiAssociated) {
    remedyPlanets.push('Saturn');
  }

  return {
    year: now.getUTCFullYear(),
    stance:
      'This chart is a map of potential. Purushartha, your conscious effort, decides how the year is lived. Nothing here is a fixed fate.',
    d1: {
      lagna: {
        sign: lagnaSign,
        degree: formatDegree(d1.asc.siderealLongitude),
        nakshatra: nak.name,
        nakshatraLord: nak.lord,
        lord: lords.lagnaLord,
        felicity: theme.felicity,
        intellect: theme.intellect,
        nature: theme.nature,
      },
      grahas,
    },
    vargottama: {
      planets: vargottama,
      maxWeight: 100,
      note:
        vargottama.length > 0
          ? `${vargottama.join(', ')} occupy the same sign in D1 and D9. That match receives the maximum strength weight: extraordinary strength and inner alignment.`
          : 'No planet is Vargottama. Strength is read from dignity alone, without the maximum D1-D9 weight.',
    },
    d9: {
      lagnaSign: d9.asc.rashi,
      seventh: {
        sign: seventhSign,
        lord: seventhLord,
        lordHouse: seventhLordSpot?.house ?? personalD9.relationship.d9Seventh.lordHouse,
        lordDignity: seventhLordSpot?.dignity ?? personalD9.relationship.d9Seventh.lordDignity,
        occupants: personalD9.relationship.d9Seventh.occupants,
      },
      upapada: {
        sign: ulSign,
        houseFromLagna: personalD9.relationship.upapada.house,
        d9PlanetsInSign: d9PlanetsInUl,
        netInfluence: personalD9.relationship.upapada.netInfluence,
      },
      relationshipNotes,
    },
    d10: {
      lagnaSign: d10.asc.rashi,
      tenth: {
        sign: d10Analysis.tenth.sign,
        lord: d10Analysis.tenth.lord,
        lordHouse: d10Analysis.tenth.lordHouse,
        occupants: d10Analysis.tenth.occupants,
      },
      amatyakaraka: {
        planet: amkName,
        d1Sign: amkName ? (positions.find((p) => p.name === amkName)?.rashi ?? '') : '',
        d1House: amkName
          ? (positions.find((p) => p.name === amkName)?.house ??
            houseOfSign(
              (RASHIS.indexOf(positions.find((p) => p.name === amkName)!.rashi) + 1) as SignNumber,
              d1.ascSign,
            ))
          : 0,
        d10Sign: amkD10?.sign ?? null,
        d10House: amkD10?.house ?? null,
        conjunctOrInfluencingTenth: amkInfluencesTenth,
        soulPurpose: amkName
          ? `${amkName} is Amatyakaraka, the planet with the next-highest degree after the Atmakaraka. In the Dashamsha it describes the professional soul-purpose of this year: the work that feels like yours when you do it cleanly.`
          : 'Amatyakaraka could not be resolved from the available degrees.',
      },
      careerNotes,
    },
    dasha: {
      system: 'vimshottari',
      mahadasha,
      antardasha,
      positivePredictive,
      needsRemedy,
    },
    remedies: needsRemedy ? remediesForPlanets(remedyPlanets) : [],
  };
}
