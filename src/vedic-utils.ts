import { 
  Body, 
  GeoVector, 
  Ecliptic,
  Observer,
  Equator,
  SiderealTime,
  SearchRiseSet
} from 'astronomy-engine';

// Ayanamsa (Lahiri) - Approximate value for current epoch
export const getAyanamsa = (date: Date): number => {
  const year = date.getFullYear();
  const fraction = (year - 2000) / 100;
  return 23.85 + (1.397 * fraction); // Simplified Lahiri approximation
};

export interface DashaPeriod {
  lord: string;
  start: Date;
  end: Date;
  level: number;
}

export const calculateDashaLevels = (birthDate: Date, moonLongitude: number, targetDate: Date): DashaPeriod[] => {
  const DASHA_SEQ = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const DASHA_YRS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

  const nakshatraIndex = Math.floor(moonLongitude / (13 + 1/3));
  const lordIndex = nakshatraIndex % 9;
  const elapsedFraction = (moonLongitude % (13 + 1/3)) / (13 + 1/3);
  const balanceFraction = 1 - elapsedFraction;

  const YEAR_DAYS = 365.2425;

  // Find Mahadasha
  let currentStart = new Date(birthDate.getTime());
  let mdIndex = lordIndex;
  let mdEnd = new Date(currentStart.getTime() + balanceFraction * DASHA_YRS[mdIndex] * YEAR_DAYS * 24 * 60 * 60 * 1000);

  // Fast forward to target date for MD
  while (targetDate > mdEnd) {
    currentStart = new Date(mdEnd.getTime());
    mdIndex = (mdIndex + 1) % 9;
    mdEnd = new Date(currentStart.getTime() + DASHA_YRS[mdIndex] * YEAR_DAYS * 24 * 60 * 60 * 1000);
  }

  const getSubPeriods = (start: Date, end: Date, parentLordIndex: number, level: number): DashaPeriod[] => {
    if (level > 5) return [];
    const duration = end.getTime() - start.getTime();
    const periods: DashaPeriod[] = [];
    let pStart = new Date(start.getTime());

    for (let i = 0; i < 9; i++) {
      const lIndex = (parentLordIndex + i) % 9;
      const fraction = DASHA_YRS[lIndex] / 120;
      const pEnd = new Date(pStart.getTime() + duration * fraction);
      periods.push({
        lord: DASHA_SEQ[lIndex],
        start: pStart,
        end: pEnd,
        level
      });
      pStart = new Date(pEnd.getTime());
    }
    return periods;
  };

  const activePath: DashaPeriod[] = [];
  let currentLevelStart = currentStart;
  let currentLevelEnd = mdEnd;
  let currentLordIdx = mdIndex;

  activePath.push({ lord: DASHA_SEQ[currentLordIdx], start: currentLevelStart, end: currentLevelEnd, level: 1 });

  for (let level = 2; level <= 5; level++) {
    const subs = getSubPeriods(currentLevelStart, currentLevelEnd, currentLordIdx, level);
    const activeSub = subs.find(s => targetDate >= s.start && targetDate < s.end) || subs[subs.length - 1];
    activePath.push(activeSub);
    currentLevelStart = activeSub.start;
    currentLevelEnd = activeSub.end;
    currentLordIdx = DASHA_SEQ.indexOf(activeSub.lord);
  }

  return activePath;
};

export const getDeeptadiAwastha = (planet: string, rashi: string): string => {
  const exalted = { Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo", Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra", Rahu: "Taurus", Ketu: "Scorpio" };
  const debilitated = { Sun: "Libra", Moon: "Scorpio", Mars: "Cancer", Mercury: "Pisces", Jupiter: "Capricorn", Venus: "Virgo", Saturn: "Aries", Rahu: "Scorpio", Ketu: "Taurus" };
  const own = { Sun: ["Leo"], Moon: ["Cancer"], Mars: ["Aries", "Scorpio"], Mercury: ["Gemini", "Virgo"], Jupiter: ["Sagittarius", "Pisces"], Venus: ["Taurus", "Libra"], Saturn: ["Capricorn", "Aquarius"], Rahu: ["Aquarius"], Ketu: ["Scorpio"] };

  if (exalted[planet as keyof typeof exalted] === rashi) return "Deepta (Exalted) - Full Results, Auspicious";
  if (debilitated[planet as keyof typeof debilitated] === rashi) return "Vikala (Debilitated) - Weak, Inauspicious";
  if (own[planet as keyof typeof own]?.includes(rashi)) return "Swastha (Own Sign) - Comfortable, Wealth/Health";

  return "Shanta (Friendly/Neutral) - Moderate Results";
};

export const RASHI_LORDS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter"
};

export const getRashiLord = (rashi: string): string => {
  return RASHI_LORDS[rashi] || "Unknown";
};

export const getShayanadiAwastha = (planetDegree: number, ascendantDegree: number): string => {
  const pNak = Math.floor(planetDegree / (13 + 1/3)) + 1;
  const pRashi = Math.floor(planetDegree / 30) + 1;
  const aNak = Math.floor(ascendantDegree / (13 + 1/3)) + 1;

  const val = (pNak + pRashi + aNak) % 12;

  const states = [
    "Nidra (Deep Sleep) - Unconscious, delayed results",
    "Shayana (Sleeping) - Inactive, resting",
    "Upaveshana (Sitting) - Observing, learning",
    "Netrapani (Hands on Eyes) - Confused, searching",
    "Prakashana (Glowing) - Famous, visible, active",
    "Gamana (Moving) - Traveling, progressing",
    "Aagamana (Returning) - Coming home, reaping rewards",
    "Sabha (In Assembly) - Social, authoritative",
    "Aagama (Acquiring) - Gaining wealth/knowledge",
    "Bhojana (Eating) - Enjoying worldly pleasures",
    "Nritya Lipsa (Desirous of Dance) - Creative, joyful",
    "Kautuka (Eager) - Curious, anticipating"
  ];

  return states[val];
};

const PLANET_SIGNIFICATIONS: Record<string, string> = {
  Sun: "Soul, Vitality, Authority, Father, Career",
  Moon: "Mind, Emotions, Mother, Comfort, Public",
  Mars: "Energy, Courage, Siblings, Property, Logic",
  Mercury: "Intelligence, Communication, Business, Speech",
  Jupiter: "Wisdom, Wealth, Children, Luck, Spirituality",
  Venus: "Love, Luxury, Arts, Relationships, Vehicles",
  Saturn: "Discipline, Longevity, Hard Work, Obstacles",
  Rahu: "Ambition, Innovation, Obsession, Foreign things",
  Ketu: "Spirituality, Detachment, Liberation, Intuition"
};

export const getDignityInterpretation = (planet: string, dignity: string, rashi: string): { title: string, description: string, type: 'positive' | 'negative' | 'neutral' } | null => {
  if (!dignity) return null;

  const significations = PLANET_SIGNIFICATIONS[planet] || "";

  if (dignity === "Exalted") {
    return {
      title: `${planet} Exalted in ${rashi}`,
      description: `${planet} is at its peak power. Expect exceptional results in ${significations.toLowerCase()}. This is a time of great strength and clarity.`,
      type: 'positive'
    };
  }
  if (dignity === "Debilitated") {
    return {
      title: `${planet} Debilitated in ${rashi}`,
      description: `${planet} is struggling to express its energy. Challenges may arise in ${significations.toLowerCase()}. Requires conscious effort and patience.`,
      type: 'negative'
    };
  }
  if (dignity === "Own Sign") {
    return {
      title: `${planet} in Own Sign (${rashi})`,
      description: `${planet} is very comfortable here, like being in its own home. It provides stable and reliable support for ${significations.toLowerCase()}.`,
      type: 'positive'
    };
  }
  return null;
};

export type SignNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface PranapadalagnaResult {
  pranapadalagnaSignNumber: SignNumber;
  pranapadalagnaDegree: number;
  sunSignNature: 'movable' | 'fixed' | 'dual';
  startingLongitude: number;        
  vighatisSinceSunrise: number;
  baseOffsetDegrees: number;
  isFortunate: boolean;             
  houseFromLagna: number;           
}

export interface GhatiLagnaResult {
  ghatiLagnaSignNumber: SignNumber;
  ghatiLagnaDegree: number;
  fullGhatikasSinceSunrise: number;
  vighatikasFraction: number;
  sunLongitudeAtSunrise: number;
  isDayBirth: boolean;
  baseLongitudeUsed: number;        
}

export interface HoraLagnaResult {
  horaLagnaSignNumber: SignNumber;
  horaLagnaDegree: number;
  totalGhatikasSinceSunrise: number;
  sunLongitudeAtSunrise: number;
  isDayBirth: boolean;
  baseLongitudeUsed: number;
}

export interface BhavaLagnaResult {
  bhavaLagnaSignNumber: SignNumber;
  bhavaLagnaDegree: number;
  totalGhatikasSinceSunrise: number;
  isDayBirth: boolean;
  baseLongitudeUsed: number;
}

export interface ArudhaLagnaResult {
  signNumber: SignNumber;
  house: number;
}

export interface UpapadaLagnaResult {
  signNumber: SignNumber;
  house: number;
}

export interface VarnadaLagnaResult {
  signNumber: SignNumber;
}

export interface SreeLagnaResult {
  signNumber: SignNumber;
}

export interface CharakarakaSetResult {
  AK: string; // Atmakaraka
  AmK: string; // Amatyakaraka
  BK: string; // Bhratrukaraka
  MK: string; // Matrukaraka
  PiK: string; // Pitrukaraka
  PuK: string; // Putrakaraka
  GK: string; // Gnatikaraka
  DK: string; // Darakaraka
}

export interface BeejaSphutaResult {
  signNumber: SignNumber;
  degree: number;
  absoluteLongitude: number;
  isAuspicious: boolean;
}

export interface KsheetraSphutaResult {
  signNumber: SignNumber;
  degree: number;
  absoluteLongitude: number;
  isAuspicious: boolean;
}

export interface TriSphutaResult {
  signNumber: SignNumber;
  degree: number;
  absoluteLongitude: number;
}

export type KaalVelaPlanet =
  | 'Sun' | 'Venus' | 'Mercury' | 'Moon' | 'Saturn' | 'Jupiter' | 'Mars';

export interface KaalVelaSetResult {
  gulika:        { signNumber: SignNumber; longitude: number; portionStartMin: number };
  maandi:        { signNumber: SignNumber; longitude: number; portionMidpointMin: number };
  kaala:         { signNumber: SignNumber; longitude: number };
  mrityu:        { signNumber: SignNumber; longitude: number };
  ardhaprahara:  { signNumber: SignNumber; longitude: number };
  yamaghantaka:  { signNumber: SignNumber; longitude: number };
}

export interface BhriguBinduResult {
  signNumber: SignNumber;
  degree: number;
  absoluteLongitude: number;
  moonLongitude: number;
  rahuLongitude: number;
}

export interface DhoomaChainResult {
  dhooma: { signNumber: SignNumber; degree: number; absoluteLongitude: number };
  vyatipata: { signNumber: SignNumber; degree: number; absoluteLongitude: number };
  parivesha: { signNumber: SignNumber; degree: number; absoluteLongitude: number };
  indraChapa: { signNumber: SignNumber; degree: number; absoluteLongitude: number };
  upaketu: { signNumber: SignNumber; degree: number; absoluteLongitude: number };
}

export interface SpecialPointsResultV2 {
  ghatiLagna:    GhatiLagnaResult;
  bhavaLagna:    BhavaLagnaResult;
  horaLagna:     HoraLagnaResult;
  pranapada:     PranapadalagnaResult;
  arudhaLagna:   ArudhaLagnaResult;
  upapadaLagna:  UpapadaLagnaResult;
  varnadaLagna:  VarnadaLagnaResult;
  sreeLagna:     SreeLagnaResult;
  charakarakas:  CharakarakaSetResult;
  beejaSphuata:  BeejaSphutaResult;
  kshetraSphuta: KsheetraSphutaResult;
  triSphuta:     TriSphutaResult | null;    
  bhriguBindu:   BhriguBinduResult;
  dhoomaChain:   DhoomaChainResult;
  kaalVelas:     KaalVelaSetResult | null;
  ishtaDevata:   string;
  dharmaChakra:  string;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  longitude: number; // Tropical
  siderealLongitude: number;
  rashi: string;
  nakshatra: string;
  pada: number;
  degree: number;
  minute: number;
  isRetrograde: boolean;
  isCombust: boolean;
  color: string;
  dignity?: string;
  house?: number;
}

export type YogaCategory =
  | 'raj'
  | 'dhana'
  | 'daridra'
  | 'nabhasha'
  | 'pancha_mahapurusha'
  | 'lunar'
  | 'solar'
  | 'auspicious'
  | 'inauspicious'
  | 'neechabhanga'
  | 'vipareeta_raj'
  | 'arishta'
  | 'other';

export type YogaStrength = 'strong' | 'moderate' | 'weak';

export interface Yoga {
  name: string;
  category: YogaCategory;
  strength: YogaStrength;
  bphsReference: string;
  planetsInvolved: string[];
  housesInvolved: number[];
  plainDescription: string;
  isActive: boolean;
  shortTitle: string;
  icon: string;
  dashaActivated: boolean;
  description: string;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  planets: string[]; // Existing field
  implication?: string;
}

export interface YogaDetectionResult {
  yogas: Yoga[];
  activeCount: number;
  strongCount: number;
  dominantCategory: YogaCategory;
  detectedAt: string;
}

const NATURAL_BENEFICS: string[] = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
const NATURAL_MALEFICS: string[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
const KENDRA_HOUSES = [1, 4, 7, 10];
const KONA_HOUSES = [1, 5, 9];
const TRIKA_HOUSES = [6, 8, 12];
const UPACHAYA_HOUSES = [3, 6, 10, 11];
const APOKLIMA_HOUSES = [3, 6, 9, 12];
const PANAPHAR_HOUSES = [2, 5, 8, 11];
const NABHASHA_PLANETS: string[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function signToHouse(signNumber: SignNumber, lagnaSign: SignNumber): number {
  return ((signNumber - lagnaSign + 12) % 12) + 1;
}

function advanceSigns(sign: SignNumber, count: number): SignNumber {
  return (((sign - 1 + count - 1) % 12) + 1) as SignNumber;
}

function getPrimaryLord(sign: SignNumber): string {
  const primary: Record<SignNumber, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun',
    6: 'Mercury', 7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn',
    11: 'Saturn', 12: 'Jupiter',
  };
  return primary[sign];
}

function getSignName(sign: SignNumber): string {
  const names: Record<SignNumber, string> = {
    1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo',
    6: 'Virgo', 7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius',
    10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
  };
  return names[sign];
}

function isOwnSign(planet: string, sign: SignNumber): boolean {
  const ownSigns: Partial<Record<string, SignNumber[]>> = {
    Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
    Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
  };
  return ownSigns[planet]?.includes(sign) ?? false;
}

function isExaltationSign(planet: string, sign: SignNumber): boolean {
  const exaltSigns: Partial<Record<string, SignNumber>> = {
    Sun: 1, Moon: 2, Mars: 10, Mercury: 6,
    Jupiter: 4, Venus: 12, Saturn: 7, Rahu: 3, Ketu: 9,
  };
  return exaltSigns[planet] === sign;
}

export const longitudeToSignAndDegree = (longitude: number): { sign: SignNumber; degree: number } => {
  const normalised = ((longitude % 360) + 360) % 360;
  const signNumber = (Math.floor(normalised / 30) + 1) as SignNumber;
  const degree = normalised % 30;
  return { sign: signNumber, degree };
};

export const countSignsBetween = (fromSign: SignNumber, toSign: SignNumber): number => {
  return ((toSign - fromSign + 12) % 12) + 1;
};

export const RASHIS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const RASHI_DATA = [
  { lord: "Mars", element: "Fire", quality: "Movable", symbol: "♈" },
  { lord: "Venus", element: "Earth", quality: "Fixed", symbol: "♉" },
  { lord: "Mercury", element: "Air", quality: "Dual", symbol: "♊" },
  { lord: "Moon", element: "Water", quality: "Movable", symbol: "♋" },
  { lord: "Sun", element: "Fire", quality: "Fixed", symbol: "♌" },
  { lord: "Mercury", element: "Earth", quality: "Dual", symbol: "♍" },
  { lord: "Venus", element: "Air", quality: "Movable", symbol: "♎" },
  { lord: "Mars", element: "Water", quality: "Fixed", symbol: "♏" },
  { lord: "Jupiter", element: "Fire", quality: "Dual", symbol: "♐" },
  { lord: "Saturn", element: "Earth", quality: "Movable", symbol: "♑" },
  { lord: "Saturn", element: "Air", quality: "Fixed", symbol: "♒" },
  { lord: "Jupiter", element: "Water", quality: "Dual", symbol: "♓" }
];

export interface NakshatraDetail {
  deity: string;
  symbol: string;
  characteristics: string;
  lord: string;
}

export const NAKSHATRA_DATA: Record<string, NakshatraDetail> = {
  "Ashwini": { deity: "Ashwini Kumaras", symbol: "Horse's Head", characteristics: "Speed, healing, and new beginnings.", lord: "Ketu" },
  "Bharani": { deity: "Yama", symbol: "Vagina (Yoni)", characteristics: "Transformation, discipline, and creativity.", lord: "Venus" },
  "Krittika": { deity: "Agni", symbol: "Razor or Flame", characteristics: "Purification, sharp intellect, and leadership.", lord: "Sun" },
  "Rohini": { deity: "Brahma", symbol: "Ox Cart", characteristics: "Growth, beauty, and emotional depth.", lord: "Moon" },
  "Mrigashira": { deity: "Soma", symbol: "Deer's Head", characteristics: "Search, curiosity, and gentle nature.", lord: "Mars" },
  "Ardra": { deity: "Rudra", symbol: "Teardrop", characteristics: "Storm, emotional release, and renewal.", lord: "Rahu" },
  "Punarvasu": { deity: "Aditi", symbol: "Quiver of Arrows", characteristics: "Return of light, abundance, and safety.", lord: "Jupiter" },
  "Pushya": { deity: "Brihaspati", symbol: "Cow's Udder", characteristics: "Nourishment, wisdom, and spiritual growth.", lord: "Saturn" },
  "Ashlesha": { deity: "Sarpas (Serpents)", symbol: "Coiled Serpent", characteristics: "Intensity, mystery, and sharp perception.", lord: "Mercury" },
  "Magha": { deity: "Pitris (Ancestors)", symbol: "Royal Throne", characteristics: "Power, tradition, and ancestral pride.", lord: "Ketu" },
  "Purva Phalguni": { deity: "Bhaga", symbol: "Hammock or Bed", characteristics: "Relaxation, love, and artistic expression.", lord: "Venus" },
  "Uttara Phalguni": { deity: "Aryaman", symbol: "Bed or Pillars", characteristics: "Duty, friendship, and social responsibility.", lord: "Sun" },
  "Hasta": { deity: "Savitr", symbol: "Hand or Fist", characteristics: "Skill, craftsmanship, and manifestation.", lord: "Moon" },
  "Chitra": { deity: "Vishwakarma", symbol: "Bright Jewel", characteristics: "Creativity, structure, and visual beauty.", lord: "Mars" },
  "Swati": { deity: "Vayu", symbol: "Young Sprout", characteristics: "Independence, flexibility, and movement.", lord: "Rahu" },
  "Vishakha": { deity: "Indra & Agni", symbol: "Triumphal Arch", characteristics: "Focus, determination, and achievement.", lord: "Jupiter" },
  "Anuradha": { deity: "Mitra", symbol: "Lotus Flower", characteristics: "Friendship, loyalty, and devotion.", lord: "Saturn" },
  "Jyeshtha": { deity: "Indra", symbol: "Umbrella or Earring", characteristics: "Seniority, protection, and inner strength.", lord: "Mercury" },
  "Mula": { deity: "Nirriti", symbol: "Tied Bunch of Roots", characteristics: "Rooting out, destruction, and truth-seeking.", lord: "Ketu" },
  "Purva Ashadha": { deity: "Apah (Water)", symbol: "Winnowing Basket", characteristics: "Invincibility, purification, and flow.", lord: "Venus" },
  "Uttara Ashadha": { deity: "Vishvadevas", symbol: "Elephant's Tusk", characteristics: "Victory, righteousness, and enduring success.", lord: "Sun" },
  "Shravana": { deity: "Vishnu", symbol: "Ear or Three Footprints", characteristics: "Listening, learning, and oral tradition.", lord: "Moon" },
  "Dhanishta": { deity: "Eight Vasus", symbol: "Drum or Flute", characteristics: "Wealth, rhythm, and musical talent.", lord: "Mars" },
  "Shatabhisha": { deity: "Varuna", symbol: "Empty Circle", characteristics: "Healing, secrecy, and philosophical depth.", lord: "Rahu" },
  "Purva Bhadrapada": { deity: "Aja Ekapada", symbol: "Front of a Funeral Cot", characteristics: "Intensity, spiritual fire, and transformation.", lord: "Jupiter" },
  "Uttara Bhadrapada": { deity: "Ahir Budhnya", symbol: "Back of a Funeral Cot", characteristics: "Stability, wisdom, and deep connection.", lord: "Saturn" },
  "Revati": { deity: "Pushan", symbol: "Fish or Drum", characteristics: "Journey, nourishment, and completion.", lord: "Mercury" }
};

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const PLANETS = [
  { id: Body.Sun, name: "Sun", symbol: "☉", color: "#FFD700" },
  { id: Body.Moon, name: "Moon", symbol: "☽", color: "#F0F8FF" },
  { id: Body.Mars, name: "Mars", symbol: "♂", color: "#FF4500" },
  { id: Body.Mercury, name: "Mercury", symbol: "☿", color: "#00CED1" },
  { id: Body.Jupiter, name: "Jupiter", symbol: "♃", color: "#DAA520" },
  { id: Body.Venus, name: "Venus", symbol: "♀", color: "#FF69B4" },
  { id: Body.Saturn, name: "Saturn", symbol: "♄", color: "#708090" },
];

// Calculate mean lunar node (Rahu)
const getMeanRahuLongitude = (date: Date): number => {
  const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const days = (date.getTime() - J2000.getTime()) / 86400000;
  const T = days / 36525.0;
  // Mean longitude of ascending node
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (1/450000) * T * T * T;
  omega = omega % 360;
  if (omega < 0) omega += 360;
  return omega;
};

export const getAscendant = (date: Date, lat: number, lon: number): number => {
  const gast = SiderealTime(date); // in hours
  let last = gast + (lon / 15); // Local Apparent Sidereal Time in hours
  last = last % 24;
  if (last < 0) last += 24;
  
  const ramc = last * 15 * (Math.PI / 180); // RAMC in radians
  const eps = 23.4392911 * (Math.PI / 180); // Obliquity of ecliptic
  const latRad = lat * (Math.PI / 180);

  const y = Math.cos(ramc);
  const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
  
  let ascendant = Math.atan2(y, x) * (180 / Math.PI);
  if (ascendant < 0) ascendant += 360;
  
  return ascendant; // Tropical Ascendant
};

export const HOUSE_DATA: Record<number, { title: string, quality: string, workOn: string }> = {
  1: { 
    title: "Self (Tanu)", 
    quality: "Personality, physical appearance, vitality, and overall health.", 
    workOn: "Focus on self-discipline, physical fitness, and building a strong personal identity." 
  },
  2: { 
    title: "Wealth (Dhana)", 
    quality: "Accumulated wealth, speech, family, and early education.", 
    workOn: "Work on mindful speech, financial planning, and strengthening family bonds." 
  },
  3: { 
    title: "Siblings/Courage (Sahaja)", 
    quality: "Communication, short travels, siblings, and personal initiative.", 
    workOn: "Improve communication skills, take bold initiatives, and nurture sibling relationships." 
  },
  4: { 
    title: "Home/Mother (Bandhu)", 
    quality: "Inner peace, happiness, mother, vehicles, and real estate.", 
    workOn: "Cultivate emotional stability, maintain a peaceful home environment, and connect with maternal roots." 
  },
  5: { 
    title: "Intelligence/Children (Putra)", 
    quality: "Creativity, speculative gains, intelligence, and children.", 
    workOn: "Engage in creative pursuits, continuous learning, and responsible parenting." 
  },
  6: { 
    title: "Service/Enemies (Ari)", 
    quality: "Health, daily routine, service, debt, and obstacles.", 
    workOn: "Maintain a healthy routine, manage debts wisely, and serve others selflessly." 
  },
  7: { 
    title: "Partnerships (Yuvati)", 
    quality: "Marriage, partnerships, public image, and legal matters.", 
    workOn: "Foster balanced relationships, improve collaboration, and maintain a positive social image." 
  },
  8: { 
    title: "Transformation (Randhra)", 
    quality: "Longevity, joint assets, transformation, and hidden knowledge.", 
    workOn: "Embrace life changes, manage shared resources carefully, and explore spiritual or occult interests." 
  },
  9: { 
    title: "Fortune/Wisdom (Dharma)", 
    quality: "Higher wisdom, fortune, father, gurus, and philosophy.", 
    workOn: "Seek higher knowledge, respect mentors, and practice righteous living (Dharma)." 
  },
  10: { 
    title: "Career (Karma)", 
    quality: "Profession, reputation, social status, and public contribution.", 
    workOn: "Set clear professional goals, build a strong reputation, and contribute positively to society." 
  },
  11: { 
    title: "Gains (Labha)", 
    quality: "Income, elder siblings, networking, and fulfillment of desires.", 
    workOn: "Expand social networks, focus on multiple income sources, and align goals with true desires." 
  },
  12: { 
    title: "Solitude/Loss (Vyaya)", 
    quality: "Spirituality, expenses, solitude, and foreign lands.", 
    workOn: "Spend time in introspection, manage expenses for good causes, and pursue spiritual liberation." 
  }
};

export const getDignity = (planet: string, rashiIdx: number): string | undefined => {
  switch (planet) {
    case "Sun":
      if (rashiIdx === 0) return "Exalted";
      if (rashiIdx === 6) return "Debilitated";
      if (rashiIdx === 4) return "Own Sign";
      break;
    case "Moon":
      if (rashiIdx === 1) return "Exalted";
      if (rashiIdx === 7) return "Debilitated";
      if (rashiIdx === 3) return "Own Sign";
      break;
    case "Mars":
      if (rashiIdx === 9) return "Exalted";
      if (rashiIdx === 3) return "Debilitated";
      if (rashiIdx === 0 || rashiIdx === 7) return "Own Sign";
      break;
    case "Mercury":
      if (rashiIdx === 5) return "Exalted";
      if (rashiIdx === 11) return "Debilitated";
      if (rashiIdx === 2) return "Own Sign";
      break;
    case "Jupiter":
      if (rashiIdx === 3) return "Exalted";
      if (rashiIdx === 9) return "Debilitated";
      if (rashiIdx === 8 || rashiIdx === 11) return "Own Sign";
      break;
    case "Venus":
      if (rashiIdx === 11) return "Exalted";
      if (rashiIdx === 5) return "Debilitated";
      if (rashiIdx === 1 || rashiIdx === 6) return "Own Sign";
      break;
    case "Saturn":
      if (rashiIdx === 6) return "Exalted";
      if (rashiIdx === 0) return "Debilitated";
      if (rashiIdx === 9 || rashiIdx === 10) return "Own Sign";
      break;
    case "Rahu":
      if (rashiIdx === 1) return "Exalted";
      if (rashiIdx === 7) return "Debilitated";
      if (rashiIdx === 10) return "Own Sign";
      break;
    case "Ketu":
      if (rashiIdx === 7) return "Exalted";
      if (rashiIdx === 1) return "Debilitated";
      if (rashiIdx === 7) return "Own Sign";
      break;
  }
  return undefined;
};

const formatPlanetPosition = (
  name: string, 
  symbol: string, 
  lon: number, 
  ayanamsa: number, 
  isRetrograde: boolean, 
  color: string,
  isCombust: boolean = false
): PlanetPosition => {
  let siderealLon = (lon - ayanamsa + 360) % 360;
  
  const rashiIdx = Math.floor(siderealLon / 30);
  const degInRashi = siderealLon % 30;
  
  const nakshatraIdx = Math.floor(siderealLon / (360 / 27));
  const degInNak = siderealLon % (360 / 27);
  const pada = Math.floor(degInNak / (360 / (27 * 4))) + 1;
  const dignity = getDignity(name, rashiIdx);

  return {
    name,
    symbol,
    longitude: lon,
    siderealLongitude: siderealLon,
    rashi: RASHIS[rashiIdx],
    nakshatra: NAKSHATRAS[nakshatraIdx],
    pada,
    degree: Math.floor(degInRashi),
    minute: Math.floor((degInRashi % 1) * 60),
    isRetrograde,
    isCombust,
    color,
    dignity
  };
};

export interface Drishti {
  planet: string;
  aspects: string[];
  aspectDetails: { targetName: string; house: number }[];
  aspectedBy: string[];
  aspectedByDetails: { sourceName: string; house: number }[];
  aspectedRashis: string[];
  aspectedRashiDetails: { rashi: string; house: number }[];
  aspectedHouses: { house: number; relativeHouse: number; interpretation: string }[];
}

export const isConjunct = (p1: PlanetPosition, p2: PlanetPosition, orb: number = 5): boolean => {
  let diff = Math.abs(p1.siderealLongitude - p2.siderealLongitude);
  diff = Math.min(diff, 360 - diff);
  return diff <= orb;
};

export const PLANET_HOUSE_INTERPRETATIONS: Record<string, Record<number, string>> = {
  Sun: {
    1: "Vitalizes the self and physical health. Enhances leadership and visibility.",
    2: "Focuses energy on wealth and family values. Can bring clarity to financial matters.",
    3: "Empowers communication and short travels. Strengthens courage and siblings' bonds.",
    4: "Brings light to home and emotional stability. Focus on domestic happiness.",
    5: "Enhances creativity, intelligence, and children's matters. Good for speculative gains.",
    6: "Strengthens ability to overcome obstacles and health issues. Victory over rivals.",
    7: "Brings intensity to partnerships and public life. Focus on balanced relationships.",
    8: "Illuminates hidden matters and transformations. Interest in research or occult.",
    9: "Promotes wisdom, higher learning, and fortune. Strong connection with father or mentors.",
    10: "Boosts career visibility and social status. Success in professional endeavors.",
    11: "Expands social circles and gains. Fulfillment of desires through networking.",
    12: "Focuses on spiritual growth and introspection. Can indicate expenses for good causes."
  },
  Moon: {
    1: "Brings emotional sensitivity and nurturing qualities to the personality.",
    2: "Fluctuating but intuitive approach to wealth. Emotional connection to family.",
    3: "Creative communication and frequent short trips. Emotional bond with siblings.",
    4: "Deep emotional roots in home and mother. Seeking inner peace and comfort.",
    5: "Creative intelligence and emotional bond with children. Love for learning.",
    6: "Emotional focus on service and daily routines. Sensitivity to health matters.",
    7: "Seeking emotional security through partnerships. Public popularity.",
    8: "Deep intuitive insights and emotional transformations. Interest in mysteries.",
    9: "Emotional connection to faith and higher wisdom. Travel for peace.",
    10: "Public image influenced by emotions. Career in nurturing or public service.",
    11: "Emotional fulfillment through friends and community. Gains through social ties.",
    12: "Spiritual sensitivity and vivid dreams. Need for solitude and reflection."
  },
  Mars: {
    1: "Increases energy, drive, and physical vitality. Can make one assertive.",
    2: "Aggressive pursuit of wealth. Possible friction in family speech.",
    3: "Great courage and initiative. Dynamic communication and sibling interactions.",
    4: "Protective of home but possible domestic friction. Strong inner drive.",
    5: "Dynamic creativity and competitive intelligence. Protective of children.",
    6: "Strong ability to defeat enemies and overcome health challenges. Hard worker.",
    7: "Passionate but potentially intense partnerships. Drive in public life.",
    8: "Intense focus on transformation and joint assets. Courage in crises.",
    9: "Dynamic approach to faith and higher learning. Possible friction with mentors.",
    10: "Ambitious drive in career. Success through persistent effort and authority.",
    11: "Active pursuit of goals and gains. Leadership in social groups.",
    12: "Energy spent on spiritual discipline or hidden activities. Possible sleep issues."
  },
  Mercury: {
    1: "Enhances intellectual curiosity and communicative ability. Youthful outlook.",
    2: "Skillful speech and analytical approach to finances. Business acumen.",
    3: "Excellent communication, writing, and logical skills. Close to siblings.",
    4: "Intellectual interests at home. Good for education and mental peace.",
    5: "Sharp intelligence, love for learning, and creative expression. Analytical mind.",
    6: "Analytical approach to health and service. Skill in managing details.",
    7: "Communicative and intellectual partnerships. Success in trade and public relations.",
    8: "Research-oriented mind. Interest in uncovering secrets and deep analysis.",
    9: "Interest in higher philosophy, law, and travel. Communicating wisdom.",
    10: "Success in career through communication and planning. Professional versatility.",
    11: "Gains through networking and intellectual groups. Many acquaintances.",
    12: "Spiritual research and imaginative thinking. Interest in foreign lands."
  },
  Jupiter: {
    1: "Brings wisdom, optimism, and expansion to the personality. Auspicious aura.",
    2: "Enhances wealth, family happiness, and truthful speech. Financial growth.",
    3: "Wise communication and positive sibling relations. Growth through skills.",
    4: "Domestic happiness, comfort, and emotional expansion. Good for property.",
    5: "Great wisdom, creative intelligence, and joy through children. Spiritual merit.",
    6: "Ability to resolve conflicts through wisdom. Protection from health issues.",
    7: "Blessings in partnerships and public life. Wise and supportive spouse.",
    8: "Protection in crises and interest in deep spiritual transformations.",
    9: "Supreme fortune, wisdom, and connection to higher truth. Grace of mentors.",
    10: "Success, honor, and ethical growth in career. Respect in society.",
    11: "Great gains, noble friends, and fulfillment of high aspirations.",
    12: "Spiritual liberation, peaceful solitude, and expenses for noble causes."
  },
  Venus: {
    1: "Brings charm, beauty, and artistic inclination to the personality.",
    2: "Wealth through artistic or luxury items. Sweet speech and family harmony.",
    3: "Artistic communication and pleasant sibling relations. Love for arts.",
    4: "Beautiful home, comforts, and emotional happiness. Love for domestic life.",
    5: "Creative talents, romantic inclinations, and joy through children.",
    6: "Harmonious service and focus on health through balance. Avoiding conflict.",
    7: "Beautiful and loving partnerships. Success in public life and arts.",
    8: "Transformative love and gains through joint assets. Interest in occult beauty.",
    9: "Love for higher wisdom, arts, and spiritual travel. Grace in fortune.",
    10: "Success in career through creativity and social skills. Pleasant workplace.",
    11: "Gains through social circles and artistic pursuits. Popularity.",
    12: "Love for spiritual solitude and artistic imagination. Expenses on luxuries."
  },
  Saturn: {
    1: "Brings discipline, seriousness, and maturity to the personality. Hard worker.",
    2: "Disciplined approach to wealth. Possible delays but stability in family.",
    3: "Serious communication and responsibility toward siblings. Persistence.",
    4: "Emotional depth through discipline. Responsibility at home. Stability.",
    5: "Serious approach to creativity and education. Responsibility toward children.",
    6: "Great discipline in overcoming obstacles and managing health. Service-oriented.",
    7: "Serious and committed partnerships. Stability in public life through effort.",
    8: "Longevity and deep interest in the mysteries of life and death. Discipline.",
    9: "Serious approach to faith and higher learning. Respect for tradition.",
    10: "Great professional responsibility and success through long-term effort.",
    11: "Stable gains and long-lasting friendships. Achievement through persistence.",
    12: "Spiritual discipline and maturity in solitude. Managing hidden matters."
  },
  Rahu: {
    1: "Unconventional personality and strong desires. Seeking unique identity.",
    2: "Unusual approach to wealth and family. Intense desire for material gains.",
    3: "Innovative communication and bold initiative. Unique sibling dynamics.",
    4: "Seeking unconventional comfort at home. Intense emotional desires.",
    5: "Unconventional creativity and intelligence. Unique bond with children.",
    6: "Innovative ways to handle obstacles. Intense focus on service.",
    7: "Unconventional partnerships and public life. Strong desires in relations.",
    8: "Deep interest in the occult and sudden transformations. Intense research.",
    9: "Unconventional faith and higher learning. Seeking unique wisdom.",
    10: "Ambitious and unconventional career path. Seeking high status.",
    11: "Gains through unusual sources and networking. Large social circles.",
    12: "Intense spiritual imagination and interest in foreign lands. Solitude."
  },
  Ketu: {
    1: "Detached personality and spiritual inclination. Seeking inner truth.",
    2: "Detachment from wealth and family speech. Spiritual values over material.",
    3: "Intuitive communication and detachment from siblings. Inner courage.",
    4: "Seeking spiritual peace at home. Detachment from domestic comforts.",
    5: "Intuitive intelligence and spiritual creativity. Detachment in love.",
    6: "Spiritual approach to service and health. Overcoming rivals through non-attachment.",
    7: "Detached approach to partnerships. Seeking spiritual depth in relations.",
    8: "Deep spiritual insights into transformation and the occult. Detachment.",
    9: "Detachment from traditional faith. Seeking direct spiritual experience.",
    10: "Detached approach to career and status. Focus on spiritual work.",
    11: "Detachment from social gains and circles. Seeking inner fulfillment.",
    12: "Spiritual liberation and deep solitude. Detachment from the material world."
  }
};

export const getPlanetInHouseInterpretation = (planet: string, house: number): string => {
  return PLANET_HOUSE_INTERPRETATIONS[planet]?.[house] || "Influences this house through its natural energy and significations.";
};

export const getAspectingHouses = (planetName: string): number[] => {
  switch (planetName) {
    case 'Mars': return [4, 7, 8];
    case 'Jupiter': return [5, 7, 9];
    case 'Saturn': return [3, 7, 10];
    case 'Rahu':
    case 'Ketu': return [5, 7, 9]; // Rahu and Ketu are often given the same special aspects as Jupiter in many traditions
    default: return [7];
  }
};

export const getAspectNature = (planetName: string, relativeHouse: number): string => {
  switch (planetName) {
    case 'Saturn':
      return "Saturn (Shani), known for its heavy, karmic influence, demands patience, hard work, and discipline through this gaze.";
    case 'Mars':
      return "Mars (Mangal) focuses its intense energy and courage through this aspect.";
    case 'Jupiter':
      return "Jupiter (Guru) brings expansion, wisdom, and growth through this benevolent gaze.";
    default:
      return "Influences the matters of this house with its natural qualities.";
  }
};

export const calculateDrishti = (activePlanetName: string, positions: PlanetPosition[]): Drishti => {
  const activePlanet = positions.find(p => p.name === activePlanetName);
  const ascendant = positions.find(p => p.name === "Ascendant");
  
  if (!activePlanet) return { 
    planet: activePlanetName, 
    aspects: [], 
    aspectDetails: [],
    aspectedBy: [], 
    aspectedByDetails: [],
    aspectedRashis: [], 
    aspectedRashiDetails: [],
    aspectedHouses: [] 
  };

  const getSignIndex = (rashi: string) => RASHIS.indexOf(rashi);

  const aspects: string[] = [];
  const aspectedBy: string[] = [];
  const aspectedByDetails: { sourceName: string; house: number }[] = [];
  const aspectedRashis: string[] = [];
  const aspectedHouses: { house: number; relativeHouse: number; interpretation: string }[] = [];

  const activeSignIdx = getSignIndex(activePlanet.rashi);
  const activeAspects = getAspectingHouses(activePlanetName);
  const ascSignIdx = ascendant ? getSignIndex(ascendant.rashi) : -1;

  const aspectDetails: { targetName: string; house: number }[] = [];
  const aspectedRashiDetails: { rashi: string; house: number }[] = [];

  // Calculate aspected Rashis and Houses
  for (const aspect of activeAspects) {
    const targetSignIdx = (activeSignIdx + aspect - 1) % 12;
    const rashi = RASHIS[targetSignIdx];
    aspectedRashis.push(rashi);
    aspectedRashiDetails.push({ rashi, house: aspect });

    if (ascSignIdx !== -1) {
      const house = ((targetSignIdx - ascSignIdx + 12) % 12) + 1;
      const nature = getAspectNature(activePlanetName, aspect);
      const houseMeaning = PLANET_HOUSE_INTERPRETATIONS[activePlanetName]?.[house] || "Influences the matters of this house.";
      const interpretation = `${nature} ${houseMeaning}`;
      aspectedHouses.push({ house, relativeHouse: aspect, interpretation });
    }

    // Check for planets in this Rashi
    positions.forEach(p => {
      if (p.name === activePlanetName) return;
      if (getSignIndex(p.rashi) === targetSignIdx) {
        aspects.push(p.name);
        aspectDetails.push({ targetName: p.name, house: aspect });
      }
    });
  }

  // Calculate who aspects the active planet
  positions.forEach(p => {
    if (p.name === activePlanetName) return;
    const pSignIdx = getSignIndex(p.rashi);
    const pAspects = getAspectingHouses(p.name);
    for (const aspect of pAspects) {
      const targetSignIdx = (pSignIdx + aspect - 1) % 12;
      if (targetSignIdx === activeSignIdx) {
        aspectedBy.push(p.name);
        aspectedByDetails.push({ sourceName: p.name, house: aspect });
        break;
      }
    }
  });

  return {
    planet: activePlanetName,
    aspects,
    aspectDetails,
    aspectedBy,
    aspectedByDetails,
    aspectedRashis,
    aspectedRashiDetails,
    aspectedHouses
  };
};

export const calculatePositions = (date: Date, lat?: number, lon?: number): PlanetPosition[] => {
  const ayanamsa = getAyanamsa(date);
  const observer = (lat !== undefined && lon !== undefined) ? new Observer(lat, lon, 0) : null;
  
  const positions = PLANETS.map(p => {
    // Get vector (Topocentric if observer provided, else Geocentric)
    const vec = observer 
      ? Equator(p.id, date, observer, false, true).vec 
      : GeoVector(p.id, date, true);
      
    // Convert to ecliptic coordinates
    const ecl = Ecliptic(vec);
    const longitude = ecl.elon; // Tropical longitude 0-360
    
    // Retrograde check
    const vecNext = observer 
      ? Equator(p.id, new Date(date.getTime() + 3600000), observer, false, true).vec
      : GeoVector(p.id, new Date(date.getTime() + 3600000), true);
    const lonNext = Ecliptic(vecNext).elon;
    
    let diff = lonNext - longitude;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const isRetrograde = diff < 0;

    return formatPlanetPosition(p.name, p.symbol, longitude, ayanamsa, isRetrograde, p.color);
  });

  // Calculate Rahu (North Node)
  const rahuLon = getMeanRahuLongitude(date);
  positions.push(formatPlanetPosition("Rahu", "☊", rahuLon, ayanamsa, true, "#8A2BE2"));

  // Calculate Ketu (South Node)
  const ketuLon = (rahuLon + 180) % 360;
  positions.push(formatPlanetPosition("Ketu", "☋", ketuLon, ayanamsa, true, "#A9A9A9"));

  // Calculate Ascendant (Lagna) if location provided
  if (lat !== undefined && lon !== undefined) {
    const ascLon = getAscendant(date, lat, lon);
    positions.unshift(formatPlanetPosition("Ascendant", "ASC", ascLon, ayanamsa, false, "#10B981"));
  }

  // Calculate Bhrigu Bindu (Midpoint of Rahu and Moon)
  const moon = positions.find(p => p.name === "Moon");
  const rahu = positions.find(p => p.name === "Rahu");
  const ascendant = positions.find(p => p.name === "Ascendant");

  if (moon && rahu) {
    // Calculate the "Long Arc" midpoint (distance from Rahu forward to Moon)
    // We ensure we take the arc that is > 180 degrees as per user request for "Long Arc"
    let bbLon = (moon.longitude + rahu.longitude) / 2;
    let diff = Math.abs(moon.longitude - rahu.longitude);
    if (diff < 180) {
      bbLon = (bbLon + 180) % 360;
    }
    
    // Nirayana Bhav Chalit Adjustment
    // "if the point degree is >= 27° 30' (the Ascendant degree), slide the point into the 2nd House (Virgo)"
    if (ascendant) {
      const ascDeg = ascendant.longitude % 30;
      const bbDeg = bbLon % 30;
      const bbRashiIdx = Math.floor(bbLon / 30);
      const ascRashiIdx = Math.floor(ascendant.longitude / 30);

      // Apply the user's specific "slide" logic for the Bhrigu Bindu
      if (bbRashiIdx === ascRashiIdx) {
        if (bbDeg >= ascDeg) {
          // "if the point degree is >= 27° 30' (the Ascendant degree), slide the point into the 2nd House (Virgo)"
          bbLon = (bbLon + 30) % 360;
        } else {
          // "Any point before this degree in Leo mathematically 'slides' into the 12th house."
          bbLon = (bbLon - 30 + 360) % 360;
        }
      }
    }
    positions.push(formatPlanetPosition("Bhrigu Bindu", "BB", bbLon, ayanamsa, false, "#FF6B6B"));
  }

  // Calculate Combustion (Asta)
  const sun = positions.find(p => p.name === "Sun");
  if (sun) {
    positions.forEach(p => {
      if (["Sun", "Rahu", "Ketu", "Ascendant"].includes(p.name)) {
        p.isCombust = false;
        return;
      }
      
      let diff = Math.abs(p.siderealLongitude - sun.siderealLongitude);
      if (diff > 180) diff = 360 - diff;
      
      let limit = 0;
      switch (p.name) {
        case "Moon": limit = 12; break;
        case "Mars": limit = 17; break;
        case "Mercury": limit = p.isRetrograde ? 12 : 14; break;
        case "Jupiter": limit = 11; break;
        case "Venus": limit = p.isRetrograde ? 8 : 10; break;
        case "Saturn": limit = 15; break;
      }
      
      p.isCombust = diff <= limit;
    });
  }

  // Calculate Houses (Bhavas) based on Whole Sign system
  if (ascendant) {
    const ascRashiIdx = RASHIS.indexOf(ascendant.rashi);
    positions.forEach(p => {
      if (p.name === "Ascendant") {
        p.house = 1;
      } else {
        const pRashiIdx = RASHIS.indexOf(p.rashi);
        p.house = ((pRashiIdx - ascRashiIdx + 12) % 12) + 1;
      }
    });
  }

  // Ensure unique positions by name (safety check for React keys)
  const uniquePositions: PlanetPosition[] = [];
  const seenNames = new Set<string>();
  
  for (const pos of positions) {
    // Defense: trim and normalize to catch any subtle whitespace or case issues
    const normalizedName = pos.name.trim();
    if (normalizedName && !seenNames.has(normalizedName)) {
      uniquePositions.push({
        ...pos,
        name: normalizedName // Ensure normalized name is used
      });
      seenNames.add(normalizedName);
    }
  }

  return uniquePositions;
};

export interface Ashtakavarga {
  bav: Record<string, number[]>;
  sav: number[];
  trikonReduced?: number[];
  ekadhipatyaReduced?: number[];
  yogPinda?: number;
}

const ASHTAKAVARGA_RULES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Ascendant: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Ascendant: [1, 2, 4, 5, 6, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Ascendant: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Ascendant: [1, 3, 4, 6, 10, 11]
  }
};

const RASI_MULTIPLIERS = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];
const PLANET_MULTIPLIERS: Record<string, number> = {
  Sun: 5,
  Moon: 5,
  Mars: 3,
  Mercury: 5,
  Jupiter: 10,
  Venus: 7,
  Saturn: 5
};

export const performTrikonShodhana = (scores: number[]): number[] => {
  const reduced = [...scores];
  const trines = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
  
  for (const trine of trines) {
    const vals = trine.map(idx => reduced[idx]);
    if (vals.includes(0)) continue;
    const min = Math.min(...vals);
    for (const idx of trine) {
      reduced[idx] -= min;
    }
  }
  return reduced;
};

export const performEkadhipatyaShodhana = (scores: number[], positions: PlanetPosition[]): number[] => {
  const reduced = [...scores];
  const pairs = [
    [0, 7], // Aries, Scorpio (Mars)
    [1, 6], // Taurus, Libra (Venus)
    [2, 5], // Gemini, Virgo (Mercury)
    [8, 11], // Sagittarius, Pisces (Jupiter)
    [9, 10]  // Capricorn, Aquarius (Saturn)
  ];

  const planetSigns = positions.reduce((acc, p) => {
    const idx = RASHIS.indexOf(p.rashi);
    if (idx !== -1) acc[idx] = p.name;
    return acc;
  }, {} as Record<number, string>);

  for (const [s1, s2] of pairs) {
    const v1 = reduced[s1];
    const v2 = reduced[s2];
    
    if (v1 === 0 || v2 === 0) continue;
    
    const p1 = planetSigns[s1];
    const p2 = planetSigns[s2];
    
    if (!p1 && !p2) {
      // Both empty
      const min = Math.min(v1, v2);
      reduced[s1] = min;
      reduced[s2] = min;
    } else if (p1 && p2) {
      // Both occupied - no reduction
    } else {
      // One occupied
      if (v1 === v2) {
        // Equal scores
        reduced[s1] = v1;
        reduced[s2] = v2;
      } else {
        const min = Math.min(v1, v2);
        reduced[s1] = min;
        reduced[s2] = min;
      }
    }
  }
  return reduced;
};

export const calculateYogPinda = (reducedScores: number[], positions: PlanetPosition[]): number => {
  let rasiPinda = 0;
  for (let i = 0; i < 12; i++) {
    rasiPinda += reducedScores[i] * RASI_MULTIPLIERS[i];
  }
  
  let grahaPinda = 0;
  const targetPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  for (const pName of targetPlanets) {
    const p = positions.find(pos => pos.name === pName);
    if (p) {
      const rashiIdx = RASHIS.indexOf(p.rashi);
      grahaPinda += reducedScores[rashiIdx] * PLANET_MULTIPLIERS[pName];
    }
  }
  
  return rasiPinda + grahaPinda;
};

export const calculateAshtakavarga = (positions: PlanetPosition[]): Ashtakavarga => {
  const bav: Record<string, number[]> = {};
  const sav: number[] = new Array(12).fill(0);
  
  const targetPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const refPlanets = [...targetPlanets, "Ascendant"];
  
  // Get sign indices for all reference planets
  const refIndices: Record<string, number> = {};
  for (const p of positions) {
    if (refPlanets.includes(p.name)) {
      refIndices[p.name] = RASHIS.indexOf(p.rashi);
    }
  }
  
  for (const target of targetPlanets) {
    bav[target] = new Array(12).fill(0);
    
    for (const ref of refPlanets) {
      const refSignIdx = refIndices[ref];
      if (refSignIdx === undefined) continue;
      
      const houses = ASHTAKAVARGA_RULES[target][ref];
      for (const h of houses) {
        const signIdx = (refSignIdx + h - 1) % 12;
        bav[target][signIdx]++;
        sav[signIdx]++;
      }
    }
  }
  
  const trikonReduced = performTrikonShodhana(sav);
  const ekadhipatyaReduced = performEkadhipatyaShodhana(trikonReduced, positions);
  const yogPinda = calculateYogPinda(ekadhipatyaReduced, positions);
  
  return { bav, sav, trikonReduced, ekadhipatyaReduced, yogPinda };
};

export interface TransitEvent {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  planets: string[];
  startDate?: Date;
  endDate?: Date;
}

export const PLANET_SPEEDS: Record<string, number> = {
  Sun: 0.98,
  Moon: 13.17,
  Mars: 0.524,
  Mercury: 1.38,
  Jupiter: 0.083,
  Venus: 1.2,
  Saturn: 0.033,
  Rahu: 0.052,
  Ketu: 0.052
};

export const getApproxTransitDates = (p: PlanetPosition, date: Date = new Date()) => {
  const speed = PLANET_SPEEDS[p.name] || 1;
  const degreeInRashi = p.siderealLongitude % 30;
  const isRetro = p.isRetrograde || p.name === "Rahu" || p.name === "Ketu";

  let daysSinceStart, daysTillEnd;
  if (isRetro) {
    daysSinceStart = (30 - degreeInRashi) / speed;
    daysTillEnd = degreeInRashi / speed;
  } else {
    daysSinceStart = degreeInRashi / speed;
    daysTillEnd = (30 - degreeInRashi) / speed;
  }

  const start = new Date(date.getTime() - daysSinceStart * 24 * 60 * 60 * 1000);
  const end = new Date(date.getTime() + daysTillEnd * 24 * 60 * 60 * 1000);
  return { start, end };
};

/**
 * A single exact sign-ingress event, sourced from openastrology-library's
 * VedicTransitCalculator (Swiss Ephemeris root-finding — precise to the
 * second, retrograde re-entries included). Mirrors the shape returned by
 * services/positionsService.ts's fetchTransitIngresses().
 */
export interface TransitIngress {
  planet: string;
  sign: string;
  fromSign: string;
  date: Date;
  isRetrograde: boolean;
  longitude: number;
}

/**
 * Find the current-sign transit window (entry/exit dates) for a planet using
 * real ingress data when available, falling back to the PLANET_SPEEDS
 * average-motion estimate when no ingress data covers this date (e.g. not
 * yet fetched, or the planet fell outside the fetched window).
 */
export const getTransitWindow = (
  p: PlanetPosition,
  date: Date = new Date(),
  ingresses: TransitIngress[] = [],
): { start: Date; end: Date } => {
  const relevant = ingresses
    .filter(i => i.planet === p.name)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let start: Date | null = null;
  let end: Date | null = null;
  for (const ing of relevant) {
    if (ing.date.getTime() <= date.getTime()) {
      start = ing.date;
    } else if (!end) {
      end = ing.date;
      break;
    }
  }

  if (start && end) return { start, end };
  return getApproxTransitDates(p, date);
};

export const analyzeTransits = (positions: PlanetPosition[], date: Date = new Date(), ingresses: TransitIngress[] = []): TransitEvent[] => {
  const events: TransitEvent[] = [];

  // 1. Dignities
  for (const p of positions) {
    if (p.name === "Ascendant") continue;

    const { start, end } = getTransitWindow(p, date, ingresses);

    if (p.dignity === "Exalted") {
      events.push({
        title: `${p.name} Exalted in ${p.rashi}`,
        description: `${p.name} is operating at its highest potential, bringing strong positive energy related to its significations.`,
        type: 'positive',
        planets: [p.name],
        startDate: start,
        endDate: end
      });
    } else if (p.dignity === "Debilitated") {
      events.push({
        title: `${p.name} Debilitated in ${p.rashi}`,
        description: `${p.name} is in its weakest sign, potentially causing challenges or requiring extra effort in its domains.`,
        type: 'negative',
        planets: [p.name],
        startDate: start,
        endDate: end
      });
    } else if (p.dignity === "Own Sign") {
      events.push({
        title: `${p.name} in Own Sign (${p.rashi})`,
        description: `${p.name} is comfortable and strong in its own sign, providing stability and positive results.`,
        type: 'positive',
        planets: [p.name],
        startDate: start,
        endDate: end
      });
    }
    
    if (p.isRetrograde && !["Rahu", "Ketu"].includes(p.name)) {
      events.push({
        title: `${p.name} Retrograde`,
        description: `The energy of ${p.name} is directed inward. Past issues related to this planet may resurface for re-evaluation.`,
        type: 'neutral',
        planets: [p.name]
      });
    }
    
    if (p.isCombust) {
      events.push({
        title: `${p.name} Combust`,
        description: `${p.name} is too close to the Sun, potentially diminishing its outward expression or causing frustration.`,
        type: 'negative',
        planets: [p.name, "Sun"]
      });
    }
  }
  
  // 2. Conjunctions (Planets in the same Rashi)
  const rashiMap: Record<string, PlanetPosition[]> = {};
  for (const p of positions) {
    if (p.name === "Ascendant") continue;
    if (!rashiMap[p.rashi]) rashiMap[p.rashi] = [];
    rashiMap[p.rashi].push(p);
  }
  
  for (const [rashi, planetsInSign] of Object.entries(rashiMap)) {
    if (planetsInSign.length >= 3) {
      events.push({
        title: `Stellium in ${rashi}`,
        description: `A powerful concentration of energy in ${rashi} involving ${planetsInSign.map(p => p.name).join(', ')}. This creates a major focal point in the chart.`,
        type: 'neutral',
        planets: planetsInSign.map(p => p.name)
      });
    } else if (planetsInSign.length === 2) {
      const p1 = planetsInSign[0];
      const p2 = planetsInSign[1];
      
      // Check specific important conjunctions
      if (planetsInSign.some(p => p.name === "Rahu" || p.name === "Ketu")) {
        const node = planetsInSign.find(p => p.name === "Rahu" || p.name === "Ketu")!;
        const other = planetsInSign.find(p => p.name !== "Rahu" && p.name !== "Ketu")!;
        events.push({
          title: `${other.name}-${node.name} Conjunction`,
          description: `The karmic node ${node.name} is amplifying or obscuring the energy of ${other.name} in ${rashi}.`,
          type: 'negative',
          planets: [p1.name, p2.name]
        });
      } else {
        events.push({
          title: `${p1.name}-${p2.name} Conjunction`,
          description: `The energies of ${p1.name} and ${p2.name} are blending together in ${rashi}.`,
          type: 'neutral',
          planets: [p1.name, p2.name]
        });
      }
    }
  }
  
  // 3. Major Planet Transits (Jupiter, Saturn, Rahu, Ketu)
  for (const p of positions) {
    if (["Jupiter", "Saturn", "Rahu", "Ketu"].includes(p.name)) {
      // Only add if not already added via dignity
      if (!events.some(e => e.planets.includes(p.name) && e.title.includes(p.name))) {
        const { start, end } = getTransitWindow(p, date, ingresses);
        events.push({
          title: `${p.name} in ${p.rashi}`,
          description: `Major transit of ${p.name} through ${p.rashi}, influencing long-term trends.`,
          type: 'neutral',
          planets: [p.name],
          startDate: start,
          endDate: end
        });
      }
    }
  }
  
  return events;
};

export interface TransitPrediction {
  planet: string;
  type: 'Rashi' | 'Nakshatra' | 'Natal Conjunction' | 'House Change' | 'Natal Aspect';
  from: string;
  to: string;
  date: Date;
  isImportant?: boolean;
  natalPlanet?: string;
  fromHouse?: number;
  toHouse?: number;
  aspectType?: string;
}

export const predictTransits = (
  startDate: Date,
  currentPositions: PlanetPosition[],
  natalPositions?: PlanetPosition[],
  ingresses: TransitIngress[] = [],
): TransitPrediction[] => {
  const predictions: TransitPrediction[] = [];
  const daysToPredict = 90; // Increased to 3 months for better foresight
  const endDate = new Date(startDate.getTime() + daysToPredict * 24 * 60 * 60 * 1000);

  // We only predict for major planets
  const majorPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

  // Sign (rashi) changes are sourced directly from the Swiss Ephemeris ingress
  // engine when available — exact to the second, no daily sampling needed.
  // Falls back to the day-by-day walk below only when ingress data wasn't supplied.
  const haveIngresses = ingresses.length > 0;
  if (haveIngresses) {
    for (const ing of ingresses) {
      if (ing.date <= startDate || ing.date > endDate) continue;
      if (!majorPlanets.includes(ing.planet)) continue;
      predictions.push({
        planet: ing.planet,
        type: 'Rashi',
        from: ing.fromSign,
        to: ing.sign,
        date: ing.date,
        isImportant: ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(ing.planet),
      });
    }
  }

  let lastPositions = currentPositions;

  // Use a map to track already added predictions to avoid duplicates
  const seenToday = new Set<string>();

  for (let i = 1; i <= daysToPredict; i++) {
    const checkDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    // Optimization: for long-term transits, checking once a day is sufficient
    const newPositions = calculatePositions(checkDate);

    for (const planetName of majorPlanets) {
      const oldPos = lastPositions.find(p => p.name === planetName);
      const newPos = newPositions.find(p => p.name === planetName);

      if (oldPos && newPos) {
        const pKey = (type: string, to: string) => `${planetName}-${type}-${to}`;

        // 1. Rashi Change — day-walk fallback only; the precise engine path above
        // (haveIngresses) already covers this when ingress data was supplied.
        if (!haveIngresses && oldPos.rashi !== newPos.rashi) {
          const key = pKey('Rashi', newPos.rashi);
          if (!seenToday.has(key)) {
            const isSlowPlanet = ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(planetName);
            predictions.push({
              planet: planetName,
              type: 'Rashi',
              from: oldPos.rashi,
              to: newPos.rashi,
              date: checkDate,
              isImportant: isSlowPlanet
            });
            seenToday.add(key);
          }
        }
        
        // 2. Nakshatra Change
        if (oldPos.nakshatra !== newPos.nakshatra) {
          const key = pKey('Nakshatra', newPos.nakshatra);
          if (!seenToday.has(key)) {
            predictions.push({
              planet: planetName,
              type: 'Nakshatra',
              from: oldPos.nakshatra,
              to: newPos.nakshatra,
              date: checkDate
            });
            seenToday.add(key);
          }
        }

        // 3. Natal Interactions
        if (natalPositions) {
          const natalAsc = natalPositions.find(p => p.name === "Ascendant");
          
          // House Change detection (Whole Sign)
          if (natalAsc) {
            const natalAscRashiIdx = RASHIS.indexOf(natalAsc.rashi);
            const oldRashiIdx = RASHIS.indexOf(oldPos.rashi);
            const newRashiIdx = RASHIS.indexOf(newPos.rashi);
            
            const oldHouse = ((oldRashiIdx - natalAscRashiIdx + 12) % 12) + 1;
            const newHouse = ((newRashiIdx - natalAscRashiIdx + 12) % 12) + 1;
            
            if (oldHouse !== newHouse) {
              const key = pKey('House Change', newHouse.toString());
              if (!seenToday.has(key)) {
                predictions.push({
                  planet: planetName,
                  type: 'House Change',
                  from: `House ${oldHouse}`,
                  to: `House ${newHouse}`,
                  date: checkDate,
                  fromHouse: oldHouse,
                  toHouse: newHouse,
                  isImportant: ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(planetName)
                });
                seenToday.add(key);
              }
            }
          }

          for (const natalP of natalPositions) {
            // Check Conjunction
            const wasConjunct = isConjunct(oldPos, natalP, 3);
            const isNowConjunct = isConjunct(newPos, natalP, 3);
            
            if (!wasConjunct && isNowConjunct) {
              const key = pKey('Natal Conjunction', natalP.name);
              if (!seenToday.has(key)) {
                const isSlowPlanet = ["Jupiter", "Saturn", "Rahu", "Ketu"].includes(planetName);
                const isSelfReturn = planetName === natalP.name;
                
                predictions.push({
                  planet: planetName,
                  type: 'Natal Conjunction',
                  from: '',
                  to: natalP.name,
                  date: checkDate,
                  isImportant: isSlowPlanet || isSelfReturn || natalP.name === "Ascendant" || natalP.name === "Bhrigu Bindu",
                  natalPlanet: natalP.name
                });
                seenToday.add(key);
              }
            }

            // Check Major Aspect (Only for slow planets for less noise)
            const slowOnly = ["Mars", "Jupiter", "Saturn", "Rahu", "Ketu"].includes(planetName);
            if (slowOnly) {
              const prevAsp = getAspectType(oldPos.siderealLongitude, natalP.siderealLongitude, planetName);
              const currAsp = getAspectType(newPos.siderealLongitude, natalP.siderealLongitude, planetName);
              
              if (!prevAsp?.isFull && currAsp?.isFull && currAsp.type !== 'conjunction') {
                const key = pKey('Natal Aspect', natalP.name + '-' + currAsp.type);
                if (!seenToday.has(key)) {
                  predictions.push({
                    planet: planetName,
                    type: 'Natal Aspect',
                    from: '',
                    to: natalP.name,
                    date: checkDate,
                    isImportant: planetName !== "Mars", // Mars aspects are frequent, others more rare
                    natalPlanet: natalP.name,
                    aspectType: currAsp.type
                  });
                  seenToday.add(key);
                }
              }
            }
          }
        }
      }
    }
    lastPositions = newPositions;
  }
  
  return predictions.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export interface NatalComparisonResult {
  planet: string;
  type: 'conjunction' | 'rashi_change' | 'nakshatra_change' | 'aspect';
  description: string;
  interpretation: string;
  actionableAdvice?: string;
  intensity: 'high' | 'medium' | 'low';
  category: 'major' | 'minor';
  startDate?: Date;
  endDate?: Date;
}

export const getAspectType = (lon1: number, lon2: number, planet1: string): { type: string, isFull: boolean } | null => {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;
  
  // All planets aspect the 7th sign (180 degrees)
  if (diff >= 170 && diff <= 190) return { type: '7th house', isFull: true };
  if (diff <= 10) return { type: 'conjunction', isFull: true };

  // Special aspects
  if (planet1 === "Mars") {
    if (diff >= 80 && diff <= 100) return { type: '4th house', isFull: true };
    if (diff >= 200 && diff <= 220) return { type: '8th house', isFull: true };
  }
  if (planet1 === "Jupiter" || planet1 === "Rahu" || planet1 === "Ketu") {
    if (diff >= 110 && diff <= 130) return { type: '5th house', isFull: true };
    if (diff >= 230 && diff <= 250) return { type: '9th house', isFull: true };
  }
  if (planet1 === "Saturn") {
    if (diff >= 50 && diff <= 70) return { type: '3rd house', isFull: true };
    if (diff >= 260 && diff <= 280) return { type: '10th house', isFull: true };
  }

  return null;
};

export const analyzeNatalComparison = (transitPositions: PlanetPosition[], natalPositions: PlanetPosition[], date: Date = new Date(), ingresses: TransitIngress[] = []): NatalComparisonResult[] => {
  const results: NatalComparisonResult[] = [];
  
  const planetInterpretations: Record<string, { conjunction: string, rashi: string, action: string }> = {
    "Sun": {
      conjunction: "A time of self-discovery and renewed vitality. Your core identity is being illuminated.",
      rashi: "Your outward expression and authority are taking on a new quality.",
      action: "Step into leadership roles and express your authentic self confidently."
    },
    "Moon": {
      conjunction: "A sensitive period for emotions and intuition. Your inner needs are coming to the surface.",
      rashi: "Your emotional responses and sense of comfort are adapting to a new environment.",
      action: "Prioritize self-care, listen to your intuition, and nurture your close relationships."
    },
    "Mars": {
      conjunction: "A surge of energy and drive. Good for taking action, but watch for impulsiveness or conflict.",
      rashi: "Your way of asserting yourself and pursuing goals is shifting in style.",
      action: "Channel excess energy into physical activity or a challenging project. Avoid unnecessary arguments."
    },
    "Mercury": {
      conjunction: "Enhanced communication and mental activity. Great for learning, writing, and networking.",
      rashi: "Your thinking patterns and communication style are exploring new territory.",
      action: "Focus on clear communication, organize your thoughts, and learn a new skill."
    },
    "Jupiter": {
      conjunction: "A period of growth, expansion, and wisdom. Opportunities for learning and prosperity may arise.",
      rashi: "Your sense of meaning, belief systems, and areas of growth are evolving.",
      action: "Remain open to new opportunities, seek out mentors, and practice gratitude."
    },
    "Venus": {
      conjunction: "Focus on relationships, beauty, and values. A good time for social harmony and artistic pursuits.",
      rashi: "Your approach to love, pleasure, and financial values is taking a new form.",
      action: "Invest time in creative hobbies, beautify your surroundings, and connect with loved ones."
    },
    "Saturn": {
      conjunction: "A time of responsibility, discipline, and structure. You may face tests that lead to long-term maturity.",
      rashi: "Your sense of duty, boundaries, and areas of hard work are being redefined.",
      action: "Embrace discipline, tackle delayed tasks, and build solid foundations for the future."
    },
    "Rahu": {
      conjunction: "Intense desires and unconventional experiences. Watch for obsession or sudden changes in direction.",
      rashi: "Your areas of worldly ambition and karmic focus are shifting focus.",
      action: "Explore innovative ideas but avoid making impulsive, life-altering decisions."
    },
    "Ketu": {
      conjunction: "A time for detachment, spiritual insight, and letting go. Deep internal shifts are possible.",
      rashi: "Your areas of spiritual release and past-life talents are manifesting differently.",
      action: "Practice meditation, declutter your life, and trust the process of letting go."
    }
  };

  const majorPlanets = ["Jupiter", "Saturn", "Rahu", "Ketu"];
  
  for (const tp of transitPositions) {
    if (tp.name === "Ascendant") continue;
    
    const np = natalPositions.find(p => p.name === tp.name);
    if (!np) continue;
    
    const interpretation = planetInterpretations[tp.name] || { conjunction: "A significant activation of this planet's energy.", rashi: "A shift in the expression of this planet's energy.", action: "Observe how this energy manifests in your daily life." };
    const category = majorPlanets.includes(tp.name) ? 'major' : 'minor';
    const { start, end } = getTransitWindow(tp, date, ingresses);
    
    // 1. Conjunctions
    let diff = Math.abs(tp.siderealLongitude - np.siderealLongitude);
    if (diff > 180) diff = 360 - diff;
    
    if (diff < 5) {
      results.push({
        planet: tp.name,
        type: 'conjunction',
        description: `Transiting ${tp.name} conjunct Natal ${np.name}`,
        interpretation: interpretation.conjunction,
        actionableAdvice: interpretation.action,
        intensity: diff < 2 ? 'high' : 'medium',
        category,
        startDate: start,
        endDate: end
      });
    }
    
    // 2. Rashi Changes
    if (tp.rashi !== np.rashi) {
      results.push({
        planet: tp.name,
        type: 'rashi_change',
        description: `${tp.name} moved from Natal ${np.rashi} to ${tp.rashi}`,
        interpretation: interpretation.rashi,
        actionableAdvice: interpretation.action,
        intensity: category === 'major' ? 'high' : 'medium',
        category,
        startDate: start,
        endDate: end
      });
    }
    
    // 3. Nakshatra Changes
    if (tp.nakshatra !== np.nakshatra) {
      results.push({
        planet: tp.name,
        type: 'nakshatra_change',
        description: `${tp.name} moved from Natal ${np.nakshatra} to ${tp.nakshatra}`,
        interpretation: `A subtle shift in the underlying motivation of ${tp.name} as it visits a different lunar mansion.`,
        actionableAdvice: "Reflect on subtle shifts in your motivations and inner drives.",
        intensity: 'low',
        category,
        startDate: start,
        endDate: end
      });
    }

    // 4. Transit Aspects to Natal Planets
    for (const npOther of natalPositions) {
      if (npOther.name === "Ascendant") continue;
      
      const aspect = getAspectType(tp.siderealLongitude, npOther.siderealLongitude, tp.name);
      if (aspect) {
        results.push({
          planet: tp.name,
          type: 'aspect',
          description: `Transiting ${tp.name} ${aspect.type === 'conjunction' ? 'conjunct' : 'aspecting'} Natal ${npOther.name}`,
          interpretation: `A direct flow of ${tp.name}'s current energy towards your natal ${npOther.name}. This ${aspect.type} aspect stimulates ${npOther.name}'s domains.`,
          actionableAdvice: `Observe how the transit of ${tp.name} influences your natal ${npOther.name} qualities today.`,
          intensity: aspect.isFull ? 'high' : 'medium',
          category,
          startDate: start,
          endDate: end
        });
      }
    }
  }
  
  return results.sort((a, b) => {
    const intensityScore = { high: 3, medium: 2, low: 1 };
    return intensityScore[b.intensity] - intensityScore[a.intensity];
  });
};

export interface PanchangData {
  tithi: { name: string, number: number, phase: 'Shukla' | 'Krishna' };
  vara: string;
  nakshatra: { name: string, lord: string, deity: string };
  yoga: { name: string, number: number };
  karana: { name: string, number: number };
  moonRashi: string;
}

export const TITHIS = [
  "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
];

export const PANCHANG_YOGAS = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
  "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi",
  "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
  "Brahma", "Indra", "Vaidhriti"
];

export const KARANAS = [
  "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
  "Shakuni", "Chatushpada", "Naga", "Kintughna"
];

export const getNavamshaSign = (longitude: number): string => {
  const degInSign = longitude % 30;
  const signIdx = Math.floor(longitude / 30);
  const navIdxInSign = Math.floor(degInSign / (30 / 9));
  
  let startIdx = 0;
  if ([0, 4, 8].includes(signIdx)) startIdx = 0; // Fire -> Aries
  else if ([1, 5, 9].includes(signIdx)) startIdx = 9; // Earth -> Capricorn
  else if ([2, 6, 10].includes(signIdx)) startIdx = 6; // Air -> Libra
  else if ([3, 7, 11].includes(signIdx)) startIdx = 3; // Water -> Cancer
  
  return RASHIS[(startIdx + navIdxInSign) % 12];
};

export const calculateAmK = (positions: PlanetPosition[]): string => {
  const mainPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const degrees = positions
    .filter(p => mainPlanets.includes(p.name))
    .map(p => ({ 
      name: p.name, 
      deg: p.degree + (p.minute / 60) 
    }))
    .sort((a, b) => b.deg - a.deg);
  
  return degrees[1]?.name || degrees[0]?.name;
};

export const calculateUL = (positions: PlanetPosition[]): string => {
  const ascendant = positions.find(p => p.name === "Ascendant");
  if (!ascendant) return "";
  
  const ascSignIdx = RASHIS.indexOf(ascendant.rashi);
  const house12SignIdx = (ascSignIdx + 11) % 12;
  const house12Sign = RASHIS[house12SignIdx];
  
  const lord12Name = RASHI_LORDS[house12Sign];
  const lord12Pos = positions.find(p => p.name === lord12Name);
  if (!lord12Pos) return "";
  
  const lord12SignIdx = RASHIS.indexOf(lord12Pos.rashi);
  const distance = (lord12SignIdx - house12SignIdx + 12) % 12;
  const arudhaSignIdx = (lord12SignIdx + distance) % 12;
  
  return RASHIS[arudhaSignIdx];
};

export interface MuhurtaBaseData {
  natalAscendant: PlanetPosition;
  natalMoon: PlanetPosition;
  natalUL: string;
  natalAmK: string;
  currentDasha: string;
}

export type EventCategory = 'CAREER' | 'MARRIAGE' | 'PROPERTY' | 'GENERAL';

export interface MuhurtaWindow {
  start: Date;
  end: Date;
  /** Normalised 0-100. Safe to render as a percentage. */
  score: number;
  /** Unnormalised globalScore + individualScore. */
  rawScore: number;
  globalScore: number;
  individualScore: number;
  /** Category-specific maximum `rawScore` was normalised against. */
  maxScore: number;
  reasons: string[];
  vargottamaLagna: boolean;
  vargottamaMoon: boolean;
  dashaContext?: string;
  panchang: PanchangData;
}

/** Outcome of a Muhurta search, including how much of the requested range was actually covered. */
export interface MuhurtaSearchResult {
  windows: MuhurtaWindow[];
  /** Sampling granularity used, in minutes. Coarsens automatically for long ranges. */
  stepMinutes: number;
  /** Last instant actually examined. Equals the requested end unless `truncated`. */
  scannedThrough: Date;
  /** True when the sample budget ran out before reaching the requested end date. */
  truncated: boolean;
}

export const calculatePanchang = (date: Date, positions: PlanetPosition[]): PanchangData => {
  const sun = positions.find(p => p.name === "Sun");
  const moon = positions.find(p => p.name === "Moon");
  
  if (!sun || !moon) {
    throw new Error("Sun and Moon positions required for Panchang calculation");
  }

  // 1. Tithi
  let diff = (moon.siderealLongitude - sun.siderealLongitude + 360) % 360;
  const tithiNum = Math.floor(diff / 12) + 1;
  const phase = tithiNum <= 15 ? 'Shukla' : 'Krishna';
  let tithiIdx = (tithiNum - 1) % 15;
  let tithiName = TITHIS[tithiIdx];
  if (tithiNum === 15) tithiName = "Purnima";
  if (tithiNum === 30) tithiName = "Amavasya";

  // 2. Vara
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const vara = weekdays[date.getDay()];

  // 3. Nakshatra (already in moon position)
  const nakshatra = {
    name: moon.nakshatra,
    lord: NAKSHATRA_DATA[moon.nakshatra]?.lord || "",
    deity: NAKSHATRA_DATA[moon.nakshatra]?.deity || ""
  };

  // 4. Yoga
  let yogaSum = (sun.siderealLongitude + moon.siderealLongitude) % 360;
  const yogaIdx = Math.floor(yogaSum / (360 / 27));
  const yoga = {
    name: PANCHANG_YOGAS[yogaIdx],
    number: yogaIdx + 1
  };

  // 5. Karana
  const karanaNum = Math.floor(diff / 6) + 1;
  let karanaName = "";
  if (karanaNum === 1) {
    karanaName = "Kintughna";
  } else if (karanaNum >= 2 && karanaNum <= 57) {
    karanaName = KARANAS[(karanaNum - 2) % 7];
  } else {
    const fixedKaranas = ["Shakuni", "Chatushpada", "Naga"];
    karanaName = fixedKaranas[karanaNum - 58];
  }

  return {
    tithi: { name: tithiName, number: tithiNum, phase },
    vara,
    nakshatra,
    yoga,
    karana: { name: karanaName, number: karanaNum },
    moonRashi: moon.rashi
  };
};

export interface TarabalaResult {
  tara: number;
  name: string;
  quality: string;
  meaning: string;
  score: number;
}

export const getTarabala = (birthNakshatra: string, transitNakshatra: string): TarabalaResult => {
  const birthIdx = NAKSHATRAS.indexOf(birthNakshatra);
  const transitIdx = NAKSHATRAS.indexOf(transitNakshatra);
  if (birthIdx === -1 || transitIdx === -1) {
    return { tara: 0, name: "Unknown", quality: "Unknown", meaning: "Cannot calculate Tarabala.", score: 0 };
  }

  const diff = (transitIdx - birthIdx + 27) % 27 + 1;
  const tara = diff % 9 || 9;

  const taraData = [
    { name: "Janma", quality: "Neutral/Caution", meaning: "Focus on health and self; avoid heavy new risks.", score: 50 },
    { name: "Sampat", quality: "Auspicious", meaning: "Excellent for wealth, gains, and business deals.", score: 100 },
    { name: "Vipat", quality: "Inauspicious", meaning: "High chance of obstacles or losses; delay big moves.", score: 0 },
    { name: "Kshema", quality: "Auspicious", meaning: "Good for well-being, comfort, and security.", score: 100 },
    { name: "Pratyari", quality: "Inauspicious", meaning: "Conflicts or opposition from others likely.", score: 0 },
    { name: "Sadhaka", quality: "Auspicious", meaning: "Excellent for achievement and completing difficult tasks.", score: 100 },
    { name: "Naidhana", quality: "Inauspicious", meaning: "Danger or major setbacks; strictly avoid new ventures.", score: 0 },
    { name: "Mitra", quality: "Auspicious", meaning: "Friendly and helpful energy; good for networking.", score: 100 },
    { name: "Ati-Mitra", quality: "Auspicious", meaning: "Very friendly; ideal for collaborative success.", score: 100 }
  ];

  const data = taraData[tara - 1];
  return { tara, name: data.name, quality: data.quality, meaning: data.meaning, score: data.score };
};

export const getChandrabala = (birthRashi: string, transitRashi: string): { score: number; description: string } => {
  const birthIdx = RASHIS.indexOf(birthRashi);
  const transitIdx = RASHIS.indexOf(transitRashi);
  if (birthIdx === -1 || transitIdx === -1) return { score: 0, description: "Unknown" };

  const diff = (transitIdx - birthIdx + 12) % 12 + 1;
  const favorable = [1, 3, 6, 7, 10, 11];
  
  if (favorable.includes(diff)) {
    return { score: 100, description: "Favorable" };
  } else {
    return { score: 0, description: "Unfavorable" };
  }
};

export function detectNabhashaYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];

  // Filter to only the 7 classical planets
  const classical = planets.filter(p => NABHASHA_PLANETS.includes(p.name));
  const signs = classical.map(p => longitudeToSignAndDegree(p.siderealLongitude).sign);
  const houses = classical.map(p => signToHouse(longitudeToSignAndDegree(p.siderealLongitude).sign, lagnaSign));

  // ASRAYA YOGAS
  const allMovable = signs.every(s => [1,4,7,10].includes(s));
  const allFixed   = signs.every(s => [2,5,8,11].includes(s));
  const allDual    = signs.every(s => [3,6,9,12].includes(s));

  if (allMovable) yogas.push({
    name: 'Rajju Yoga',
    shortTitle: 'Rajju — The Rope',
    category: 'nabhasha',
    strength: 'strong',
    bphsReference: 'BPHS Ch.35 v.3',
    planetsInvolved: NABHASHA_PLANETS,
    housesInvolved: [...new Set(houses)],
    icon: '🌀',
    plainDescription: 'All planets occupy movable signs. Life is defined by movement, travel, change of residence, and a restless drive to initiate. Struggle to stay still produces great momentum but also difficulty with completion.',
    isActive: true,
    dashaActivated: false,
    description: 'All planets in movable signs.',
    type: 'auspicious',
    planets: NABHASHA_PLANETS
  });

  if (allFixed) yogas.push({
    name: 'Musala Yoga',
    shortTitle: 'Musala — The Pestle',
    category: 'nabhasha',
    strength: 'strong',
    bphsReference: 'BPHS Ch.35 v.4',
    planetsInvolved: NABHASHA_PLANETS,
    housesInvolved: [...new Set(houses)],
    icon: '🏛️',
    plainDescription: 'All planets occupy fixed signs. The nature is stable, determined, and resistant to change. Strong will and persistence. Can become rigid when flexibility is required. Wealth tends to accumulate and hold.',
    isActive: true,
    dashaActivated: false,
    description: 'All planets in fixed signs.',
    type: 'auspicious',
    planets: NABHASHA_PLANETS
  });

  if (allDual) yogas.push({
    name: 'Nala Yoga',
    shortTitle: 'Nala — The Reed',
    category: 'nabhasha',
    strength: 'strong',
    bphsReference: 'BPHS Ch.35 v.5',
    planetsInvolved: NABHASHA_PLANETS,
    housesInvolved: [...new Set(houses)],
    icon: '⚖️',
    plainDescription: 'All planets occupy dual signs. A versatile, communicative nature with skill in multiple fields. Adaptable and intellectually agile. Tendency toward duality in career and relationships — doing two things at once.',
    isActive: true,
    dashaActivated: false,
    description: 'All planets in dual signs.',
    type: 'auspicious',
    planets: NABHASHA_PLANETS
  });

  // DALA YOGAS
  const planetsInKendra = classical.filter(p => KENDRA_HOUSES.includes(signToHouse(longitudeToSignAndDegree(p.siderealLongitude).sign, lagnaSign)));
  const beneficsInKendra = planetsInKendra.filter(p => NATURAL_BENEFICS.includes(p.name));
  const maleficsInKendra = planetsInKendra.filter(p => NATURAL_MALEFICS.includes(p.name));

  const beneficKendraHouses = [...new Set(beneficsInKendra.map(p => signToHouse(longitudeToSignAndDegree(p.siderealLongitude).sign, lagnaSign)))];
  if (beneficKendraHouses.length >= 3 && maleficsInKendra.length === 0) {
    yogas.push({
      name: 'Maal Yoga',
      shortTitle: 'Maal — The Garland',
      category: 'nabhasha',
      strength: 'strong',
      bphsReference: 'BPHS Ch.35 v.6',
      planetsInvolved: beneficsInKendra.map(p => p.name),
      housesInvolved: beneficKendraHouses,
      icon: '🌸',
      plainDescription: 'Benefic planets dominate the angular houses with no malefic obstruction. Life flows with grace and support. Relationships, finances, and reputation tend to develop without major resistance. Natural magnetism.',
      isActive: true,
      dashaActivated: false,
      description: 'Only benefics in Kendras.',
      type: 'auspicious',
      planets: beneficsInKendra.map(p => p.name)
    });
  }

  const maleficKendraHouses = [...new Set(maleficsInKendra.map(p => signToHouse(longitudeToSignAndDegree(p.siderealLongitude).sign, lagnaSign)))];
  if (maleficKendraHouses.length >= 3 && beneficsInKendra.length === 0) {
    yogas.push({
      name: 'Sarpa Yoga',
      shortTitle: 'Sarpa — The Serpent',
      category: 'nabhasha',
      strength: 'strong',
      bphsReference: 'BPHS Ch.35 v.7',
      planetsInvolved: maleficsInKendra.map(p => p.name),
      housesInvolved: maleficKendraHouses,
      icon: '🐍',
      plainDescription: 'Malefic planets dominate the angular houses. Obstacles and adversity shape the personality through challenge rather than support. The benefit: exceptional resilience. Life teaches through friction.',
      isActive: true,
      dashaActivated: false,
      description: 'Only malefics in Kendras.',
      type: 'inauspicious',
      planets: maleficsInKendra.map(p => p.name)
    });
  }

  // SANKHYA YOGAS
  const uniqueSignCount = new Set(signs).size;

  const sankhyaMap: Record<number, { name: string; shortTitle: string; desc: string; icon: string }> = {
    7: { name: 'Veena Yoga (Vallaki)', shortTitle: 'Veena — The Lute', icon: '🎸',
         desc: 'All 7 planets in 7 different signs. Maximum dispersal of planetary energy — a multifaceted personality with interests and capabilities across every life domain.' },
    6: { name: 'Daam Yoga (Daamini)', shortTitle: 'Daam — The Cord', icon: '🔗',
         desc: '7 planets spread across 6 signs. Near-maximum dispersal. Broad interests with slight concentration in one sign. Generous nature.' },
    5: { name: 'Paash Yoga', shortTitle: 'Paash — The Noose', icon: '🔒',
         desc: '7 planets in 5 signs. Moderate concentration. Relationships and obligations tend to bind the native to specific paths.' },
    4: { name: 'Kedara Yoga', shortTitle: 'Kedara — The Field', icon: '🌱',
         desc: '7 planets in 4 signs. Significant concentration. Life energy focused in specific areas like a cultivated field.' },
    3: { name: 'Sool Yoga', shortTitle: 'Sool — The Trident', icon: '🔱',
         desc: '7 planets in 3 signs. High concentration — three main life arenas dominate completely. Extremely focused.' },
    2: { name: 'Yuga Yoga', shortTitle: 'Yuga — The Pair', icon: '☯️',
         desc: '7 planets in 2 signs. Near-total concentration. Life defined by a single axis — intense, singular focus.' },
    1: { name: 'Gola Yoga', shortTitle: 'Gola — The Ball', icon: '🔴',
         desc: '7 planets in 1 sign. All planetary energy in a single sign. Extraordinary concentration of purpose in one house.' },
  };

  if (sankhyaMap[uniqueSignCount]) {
    const s = sankhyaMap[uniqueSignCount];
    yogas.push({
      name: s.name,
      shortTitle: s.shortTitle,
      category: 'nabhasha',
      strength: uniqueSignCount <= 2 ? 'strong' : uniqueSignCount <= 4 ? 'moderate' : 'weak',
      bphsReference: `BPHS Ch.36 v.${8 - uniqueSignCount + 1}`,
      planetsInvolved: classical.map(p => p.name),
      housesInvolved: [...new Set(houses)],
      icon: s.icon,
      plainDescription: s.desc,
      isActive: true,
      dashaActivated: false,
      description: s.desc,
      type: uniqueSignCount >= 6 ? 'auspicious' : 'neutral',
      planets: classical.map(p => p.name)
    });
  }

  return yogas;
}

export function detectMahapurushaYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];

  const MAHAPURUSHA_CONFIGS = [
    {
      planet: 'Mars', yogaName: 'Ruchaka Yoga', shortTitle: 'Ruchaka — Mars Power',
      ownSigns: [1, 8], exaltSign: 10, icon: '🔴',
      desc: 'Mars in its own sign or exaltation in an angular house. Exceptional courage, physical vitality, leadership, and competitive drive.',
      bphs: 'BPHS Ch.37 v.2',
    },
    {
      planet: 'Mercury', yogaName: 'Bhadra Yoga', shortTitle: 'Bhadra — Mercury Power',
      ownSigns: [3, 6], exaltSign: 6, icon: '💚',
      desc: 'Mercury in its own sign or exaltation in an angular house. Exceptional intellect, analytical skill, communication, and commercial acumen.',
      bphs: 'BPHS Ch.37 v.3',
    },
    {
      planet: 'Jupiter', yogaName: 'Hamsa Yoga', shortTitle: 'Hamsa — Jupiter Grace',
      ownSigns: [9, 12], exaltSign: 4, icon: '🌟',
      desc: 'Jupiter in its own sign or exaltation in an angular house. Profound wisdom, spiritual grace, generosity, and natural authority.',
      bphs: 'BPHS Ch.37 v.4',
    },
    {
      planet: 'Venus', yogaName: 'Malavya Yoga', shortTitle: 'Malavya — Venus Grace',
      ownSigns: [2, 7], exaltSign: 12, icon: '💎',
      desc: 'Venus in its own sign or exaltation in an angular house. Exceptional beauty, artistic talent, sensory refinement, and social grace.',
      bphs: 'BPHS Ch.37 v.5',
    },
    {
      planet: 'Saturn', yogaName: 'Sasa Yoga', shortTitle: 'Sasa — Saturn Discipline',
      ownSigns: [10, 11], exaltSign: 7, icon: '⚫',
      desc: 'Saturn in its own sign or exaltation in an angular house. Exceptional discipline, endurance, administrative skill, and longevity of achievement.',
      bphs: 'BPHS Ch.37 v.6',
    },
  ];

  for (const config of MAHAPURUSHA_CONFIGS) {
    const pos = planets.find(p => p.name === config.planet);
    if (!pos) continue;

    const signNum = longitudeToSignAndDegree(pos.siderealLongitude).sign;
    const inOwnSign   = config.ownSigns.includes(signNum);
    const inExaltSign = signNum === config.exaltSign;
    const houseNum    = signToHouse(signNum, lagnaSign);
    const inKendra    = KENDRA_HOUSES.includes(houseNum);

    if ((inOwnSign || inExaltSign) && inKendra) {
      const isBroken = pos.isCombust;
      yogas.push({
        name: config.yogaName,
        shortTitle: config.shortTitle,
        category: 'pancha_mahapurusha',
        strength: inExaltSign ? 'strong' : 'moderate',
        bphsReference: config.bphs,
        planetsInvolved: [config.planet],
        housesInvolved: [houseNum],
        icon: config.icon,
        plainDescription: `${config.planet} in ${inExaltSign ? 'exaltation' : 'own sign'} in the ${houseNum}th house (Kendra). ${config.desc}`,
        isActive: !isBroken,
        dashaActivated: false,
        description: config.desc,
        type: 'auspicious',
        planets: [config.planet]
      });
    }
  }

  return yogas;
}

export function detectLunarYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];

  const moon = planets.find(p => p.name === 'Moon');
  if (!moon) return yogas;

  const moonSign = longitudeToSignAndDegree(moon.siderealLongitude).sign;
  const secondFromMoon  = advanceSigns(moonSign, 2);
  const twelfthFromMoon = advanceSigns(moonSign, 12);

  const planetsIn2nd  = planets.filter(p => p.name !== 'Sun' && longitudeToSignAndDegree(p.siderealLongitude).sign === secondFromMoon);
  const planetsIn12th = planets.filter(p => p.name !== 'Sun' && longitudeToSignAndDegree(p.siderealLongitude).sign === twelfthFromMoon);

  const has2nd  = planetsIn2nd.length > 0;
  const has12th = planetsIn12th.length > 0;

  if (has2nd && !has12th) {
    yogas.push({
      name: 'Sunapha Yoga',
      shortTitle: 'Sunapha — Moon Ahead',
      category: 'lunar',
      strength: 'moderate',
      bphsReference: 'BPHS Ch.38 v.2',
      planetsInvolved: ['Moon', ...planetsIn2nd.map(p => p.name)],
      housesInvolved: [signToHouse(moonSign, lagnaSign), signToHouse(secondFromMoon, lagnaSign)],
      icon: '🌙',
      plainDescription: 'Planets support the Moon from 2nd from Moon. Confidence in expression and ability to earn.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 2nd from Moon.',
      type: 'auspicious',
      planets: ['Moon', ...planetsIn2nd.map(p => p.name)]
    });
  }

  if (has12th && !has2nd) {
    yogas.push({
      name: 'Anapha Yoga',
      shortTitle: 'Anapha — Moon Behind',
      category: 'lunar',
      strength: 'moderate',
      bphsReference: 'BPHS Ch.38 v.3',
      planetsInvolved: ['Moon', ...planetsIn12th.map(p => p.name)],
      housesInvolved: [signToHouse(moonSign, lagnaSign), signToHouse(twelfthFromMoon, lagnaSign)],
      icon: '🌛',
      plainDescription: 'Planets support the Moon from 12th from Moon. Strong foundations and self-respect.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 12th from Moon.',
      type: 'auspicious',
      planets: ['Moon', ...planetsIn12th.map(p => p.name)]
    });
  }

  if (has2nd && has12th) {
    yogas.push({
      name: 'Duradhara Yoga',
      shortTitle: 'Duradhara — Moon Flanked',
      category: 'lunar',
      strength: 'strong',
      bphsReference: 'BPHS Ch.38 v.4',
      planetsInvolved: ['Moon', ...planetsIn2nd.map(p => p.name), ...planetsIn12th.map(p => p.name)],
      housesInvolved: [signToHouse(moonSign, lagnaSign), signToHouse(secondFromMoon, lagnaSign), signToHouse(twelfthFromMoon, lagnaSign)],
      icon: '🌕',
      plainDescription: 'Planets on both sides of the Moon. Emotional stability and material resourcefulness.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 2nd and 12th from Moon.',
      type: 'auspicious',
      planets: ['Moon', ...planetsIn2nd.map(p => p.name), ...planetsIn12th.map(p => p.name)]
    });
  }

  if (!has2nd && !has12th) {
    const planetsInKendra = planets.filter(p => 
      p.name !== 'Moon' && KENDRA_HOUSES.includes(signToHouse(longitudeToSignAndDegree(p.siderealLongitude).sign, lagnaSign))
    );
    if (planetsInKendra.length === 0) {
      yogas.push({
        name: 'Kemadruma Yoga',
        shortTitle: 'Kemadruma — Isolated Moon',
        category: 'lunar',
        strength: 'strong',
        bphsReference: 'BPHS Ch.38 v.5',
        planetsInvolved: ['Moon'],
        housesInvolved: [signToHouse(moonSign, lagnaSign)],
        icon: '🌑',
        plainDescription: 'The Moon is isolated. Can indicate self-reliance by necessity and emotional isolation.',
        isActive: true,
        dashaActivated: false,
        description: 'Moon isolated from planets and Kendras.',
        type: 'inauspicious',
        planets: ['Moon']
      });
    }
  }

  return yogas;
}

export function detectSolarYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];

  const sun = planets.find(p => p.name === 'Sun');
  if (!sun) return yogas;

  const sunSign = longitudeToSignAndDegree(sun.siderealLongitude).sign;
  const secondFromSun  = advanceSigns(sunSign, 2);
  const twelfthFromSun = advanceSigns(sunSign, 12);

  const planetsIn2nd  = planets.filter(p => p.name !== 'Moon' && longitudeToSignAndDegree(p.siderealLongitude).sign === secondFromSun);
  const planetsIn12th = planets.filter(p => p.name !== 'Moon' && longitudeToSignAndDegree(p.siderealLongitude).sign === twelfthFromSun);

  if (planetsIn2nd.length > 0 && planetsIn12th.length === 0) {
    yogas.push({
      name: 'Vesi Yoga',
      shortTitle: 'Vesi — Solar Forward',
      category: 'solar',
      strength: 'moderate',
      bphsReference: 'BPHS Ch.39 v.2',
      planetsInvolved: ['Sun', ...planetsIn2nd.map(p => p.name)],
      housesInvolved: [signToHouse(sunSign, lagnaSign), signToHouse(secondFromSun, lagnaSign)],
      icon: '☀️',
      plainDescription: 'Planets in 2nd from Sun. Visible confidence and success in public endeavors.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 2nd from Sun.',
      type: 'auspicious',
      planets: ['Sun', ...planetsIn2nd.map(p => p.name)]
    });
  }

  if (planetsIn12th.length > 0 && planetsIn2nd.length === 0) {
    yogas.push({
      name: 'Vosi Yoga',
      shortTitle: 'Vosi — Solar Behind',
      category: 'solar',
      strength: 'moderate',
      bphsReference: 'BPHS Ch.39 v.3',
      planetsInvolved: ['Sun', ...planetsIn12th.map(p => p.name)],
      housesInvolved: [signToHouse(sunSign, lagnaSign), signToHouse(twelfthFromSun, lagnaSign)],
      icon: '🌤️',
      plainDescription: 'Planets in 12th from Sun. Strong in spiritual or behind-the-scenes domains.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 12th from Sun.',
      type: 'auspicious',
      planets: ['Sun', ...planetsIn12th.map(p => p.name)]
    });
  }

  if (planetsIn2nd.length > 0 && planetsIn12th.length > 0) {
    yogas.push({
      name: 'Ubhayachari Yoga',
      shortTitle: 'Ubhayachari — Solar Flanked',
      category: 'solar',
      strength: 'strong',
      bphsReference: 'BPHS Ch.39 v.4',
      planetsInvolved: ['Sun', ...planetsIn2nd.map(p => p.name), ...planetsIn12th.map(p => p.name)],
      housesInvolved: [signToHouse(sunSign, lagnaSign), signToHouse(secondFromSun, lagnaSign), signToHouse(twelfthFromSun, lagnaSign)],
      icon: '🌞',
      plainDescription: 'Planets on both sides of the Sun. Leadership, wealth, and recognition.',
      isActive: true,
      dashaActivated: false,
      description: 'Planets in 2nd and 12th from Sun.',
      type: 'auspicious',
      planets: ['Sun', ...planetsIn2nd.map(p => p.name), ...planetsIn12th.map(p => p.name)]
    });
  }

  return yogas;
}

export function detectNeechabhangaRajYoga(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const PLANET_DEBIL_SIGN: Partial<Record<string, SignNumber>> = {
    Sun: 7, Moon: 8, Mars: 4, Mercury: 12,
    Jupiter: 10, Venus: 6, Saturn: 1,
  };
  const EXALTED_IN_SIGN: Partial<Record<SignNumber, string>> = {
    7:  'Saturn', 8:  'Jupiter', 4:  'Jupiter', 12: 'Venus',
    10: 'Mars', 6:  'Mercury', 1:  'Sun',
  };

  for (const [planetName, debilSign] of Object.entries(PLANET_DEBIL_SIGN) as Array<[string, SignNumber]>) {
    const planetPos = planets.find(p => p.name === planetName);
    if (!planetPos) continue;
    const currentSign = longitudeToSignAndDegree(planetPos.siderealLongitude).sign;
    if (currentSign !== debilSign) continue;

    const debilSignLord = getPrimaryLord(debilSign);
    const lordPos = planets.find(p => p.name === debilSignLord);
    const lordInKendra = lordPos && KENDRA_HOUSES.includes(signToHouse(longitudeToSignAndDegree(lordPos.siderealLongitude).sign, lagnaSign));

    const exaltedPlanetName = EXALTED_IN_SIGN[debilSign];
    const exaltedPlanetPos  = exaltedPlanetName ? planets.find(p => p.name === exaltedPlanetName) : undefined;
    const moonPos = planets.find(p => p.name === 'Moon');

    const exaltedInKendraFromLagna = exaltedPlanetPos &&
      KENDRA_HOUSES.includes(signToHouse(longitudeToSignAndDegree(exaltedPlanetPos.siderealLongitude).sign, lagnaSign));
    const exaltedInKendraFromMoon  = exaltedPlanetPos && moonPos &&
      KENDRA_HOUSES.includes(signToHouse(longitudeToSignAndDegree(exaltedPlanetPos.siderealLongitude).sign, longitudeToSignAndDegree(moonPos.siderealLongitude).sign));

    if (lordInKendra || exaltedInKendraFromLagna || exaltedInKendraFromMoon) {
      yogas.push({
        name: `Neechabhanga Raj Yoga (${planetName})`,
        shortTitle: `Neechabhanga — ${planetName} Redeemed`,
        category: 'neechabhanga',
        strength: lordInKendra && (exaltedInKendraFromLagna || exaltedInKendraFromMoon) ? 'strong' : 'moderate',
        bphsReference: 'BPHS Ch.43 v.5-8',
        planetsInvolved: [planetName, ...(lordPos ? [debilSignLord] : [])],
        housesInvolved: [signToHouse(debilSign, lagnaSign)],
        icon: '♻️',
        plainDescription: `${planetName} is debilitated, but the debilitation is cancelled. Can produce strong results that overcompensate for the debilitation.`,
        isActive: true,
        dashaActivated: false,
        description: `Debilitation of ${planetName} is cancelled.`,
        type: 'auspicious',
        planets: [planetName, ...(lordPos ? [debilSignLord] : [])]
      });
    }
  }

  return yogas;
}

export function detectViparitaRajYoga(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const dusthanaHouses = [6, 8, 12];

  for (const sourceHouse of dusthanaHouses) {
    const houseSign = advanceSigns(lagnaSign, sourceHouse);
    const houseLord = getPrimaryLord(houseSign);
    const lordPos   = planets.find(p => p.name === houseLord);
    if (!lordPos) continue;

    const lordCurrentHouse = signToHouse(longitudeToSignAndDegree(lordPos.siderealLongitude).sign, lagnaSign);
    if (dusthanaHouses.includes(lordCurrentHouse) && lordCurrentHouse !== sourceHouse) {
      const viparitaNames: Record<number, string> = { 6: 'Harsha Yoga', 8: 'Sarala Yoga', 12: 'Vimala Yoga' };
      const viparitaDescs: Record<number, string> = {
        6: 'The 6th lord in another Dusthana. Harsha Yoga brings health and victory over enemies.',
        8: 'The 8th lord in another Dusthana. Sarala Yoga brings fearlessness and longevity.',
        12: 'The 12th lord in another Dusthana. Vimala Yoga brings virtuous character and spiritual depth.'
      };
      yogas.push({
        name: viparitaNames[sourceHouse] ?? `Vipareeta Raj Yoga (${sourceHouse}th)`,
        shortTitle: `${viparitaNames[sourceHouse]} — Reversal Power`,
        category: 'vipareeta_raj',
        strength: 'moderate',
        bphsReference: `BPHS Ch.35 v.${sourceHouse === 6 ? 1 : sourceHouse === 8 ? 2 : 3}`,
        planetsInvolved: [houseLord],
        housesInvolved: [sourceHouse, lordCurrentHouse],
        icon: '🔃',
        plainDescription: viparitaDescs[sourceHouse],
        isActive: true,
        dashaActivated: false,
        description: viparitaDescs[sourceHouse],
        type: 'auspicious',
        planets: [houseLord]
      });
    }
  }

  return yogas;
}

export function detectAuspiciousYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const houseOf = (p: string) => {
    const pos = planets.find(x => x.name === p);
    return pos ? signToHouse(longitudeToSignAndDegree(pos.siderealLongitude).sign, lagnaSign) : null;
  };

  const moon    = planets.find(p => p.name === 'Moon');
  const jupiter = planets.find(p => p.name === 'Jupiter');

  if (moon && jupiter) {
    const moonSign = longitudeToSignAndDegree(moon.siderealLongitude).sign;
    const jupSign = longitudeToSignAndDegree(jupiter.siderealLongitude).sign;
    const jupHouseFromMoon = countSignsBetween(moonSign, jupSign);
    if ([1, 4, 7, 10].includes(jupHouseFromMoon) && jupSign !== 10 && !jupiter.isCombust) {
      yogas.push({
        name: 'Gaj Kesari Yoga',
        shortTitle: 'Gaj Kesari — Elephant-Lion',
        category: 'auspicious',
        strength: 'strong',
        bphsReference: 'BPHS Ch.40 v.1',
        planetsInvolved: ['Jupiter', 'Moon'],
        housesInvolved: [houseOf('Moon')!, houseOf('Jupiter')!],
        icon: '🦁',
        plainDescription: 'Jupiter in an angular house from the Moon. Grants wisdom, fame, and generosity.',
        isActive: true,
        dashaActivated: false,
        description: 'Jupiter in Kendra from Moon.',
        type: 'auspicious',
        planets: ['Jupiter', 'Moon']
      });
    }
  }

  // Amal Yoga
  const planetsIn10thLagna = planets.filter(p => houseOf(p.name) === 10);
  if (planetsIn10thLagna.length > 0 && planetsIn10thLagna.every(p => NATURAL_BENEFICS.includes(p.name))) {
    yogas.push({
      name: 'Amal Yoga (from Lagna)',
      shortTitle: 'Amal — Pure Tenth',
      category: 'auspicious',
      strength: 'moderate',
      bphsReference: 'BPHS Ch.40 v.3',
      planetsInvolved: planetsIn10thLagna.map(p => p.name),
      housesInvolved: [10],
      icon: '🌿',
      plainDescription: 'Only benefics occupy the 10th house from Lagna. Grants spotless reputation.',
      isActive: true,
      dashaActivated: false,
      description: 'Only benefics in 10th from Lagna.',
      type: 'auspicious',
      planets: planetsIn10thLagna.map(p => p.name)
    });
  }

  // Lakshmi Yoga
  const ninthHouseSign = advanceSigns(lagnaSign, 9);
  const ninthLord = getPrimaryLord(ninthHouseSign);
  const ninthLordPos = planets.find(p => p.name === ninthLord);
  const lagnaLord = getPrimaryLord(lagnaSign);
  const lagnaLordPos = planets.find(p => p.name === lagnaLord);

  if (ninthLordPos && lagnaLordPos) {
    const ninthLordHouse = houseOf(ninthLord)!;
    const ninthLordStrong = isOwnSign(ninthLord, longitudeToSignAndDegree(ninthLordPos.siderealLongitude).sign) || isExaltationSign(ninthLord, longitudeToSignAndDegree(ninthLordPos.siderealLongitude).sign);
    const lagnaLordHouse = houseOf(lagnaLord)!;
    const lagnaLordStrong = KENDRA_HOUSES.includes(lagnaLordHouse) || KONA_HOUSES.includes(lagnaLordHouse) || isOwnSign(lagnaLord, longitudeToSignAndDegree(lagnaLordPos.siderealLongitude).sign) || isExaltationSign(lagnaLord, longitudeToSignAndDegree(lagnaLordPos.siderealLongitude).sign);

    if (KENDRA_HOUSES.includes(ninthLordHouse) && ninthLordStrong && lagnaLordStrong) {
      yogas.push({
        name: 'Lakshmi Yoga',
        shortTitle: 'Lakshmi — Goddess of Wealth',
        category: 'auspicious',
        strength: 'strong',
        bphsReference: 'BPHS Ch.40 v.5',
        planetsInvolved: [ninthLord, lagnaLord],
        housesInvolved: [ninthLordHouse, lagnaLordHouse],
        icon: '💰',
        plainDescription: '9th lord in strength in Kendra and strong Lagna lord. Material prosperity.',
        isActive: !ninthLordPos.isCombust,
        dashaActivated: false,
        description: 'Strong 9th lord in Kendra with strong Lagna lord.',
        type: 'auspicious',
        planets: [ninthLord, lagnaLord]
      });
    }
  }

  return yogas;
}

export function detectRajYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const getLordOfHouse = (h: number) => getPrimaryLord(advanceSigns(lagnaSign, h));
  
  const kendraLords = [1, 4, 7, 10].map(getLordOfHouse);
  const konaLords = [5, 9].map(getLordOfHouse); 
  
  for (const kendraLord of kendraLords) {
    for (const konaLord of konaLords) {
      if (kendraLord === konaLord) continue;
      
      const pos1 = planets.find(p => p.name === kendraLord);
      const pos2 = planets.find(p => p.name === konaLord);
      
      if (pos1 && pos2) {
        const sign1 = longitudeToSignAndDegree(pos1.siderealLongitude).sign;
        const sign2 = longitudeToSignAndDegree(pos2.siderealLongitude).sign;
        
        if (sign1 === sign2) {
          yogas.push({
            name: `Raj Yoga (${kendraLord} & ${konaLord})`,
            shortTitle: 'Raj Yoga — Power & Status',
            category: 'raj',
            strength: 'strong',
            bphsReference: 'BPHS Ch.34 v.11',
            planetsInvolved: [kendraLord, konaLord],
            housesInvolved: [signToHouse(sign1, lagnaSign)],
            icon: '👑',
            plainDescription: `Lord of Kendra (${kendraLord}) and lord of Kona (${konaLord}) are conjunct. Powerful combination for authority and success.`,
            isActive: !pos1.isCombust && !pos2.isCombust,
            dashaActivated: false,
            description: `Conjunction of ${kendraLord} and ${konaLord}.`,
            type: 'auspicious',
            planets: [kendraLord, konaLord]
          });
        }
      }
    }
  }
  return yogas;
}

export function detectDhanaYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const getLordOfHouse = (h: number) => getPrimaryLord(advanceSigns(lagnaSign, h));
  
  const secondLord = getLordOfHouse(2);
  const eleventhLord = getLordOfHouse(11);
  const ninthLord = getLordOfHouse(9);
  const fifthLord = getLordOfHouse(5);
  const lagnaLord = getLordOfHouse(1);
  
  const wealthLords = [secondLord, eleventhLord, ninthLord, fifthLord, lagnaLord];
  
  // High level: if any two of these are conjunct
  for (let i = 0; i < wealthLords.length; i++) {
    for (let j = i + 1; j < wealthLords.length; j++) {
      const p1 = wealthLords[i];
      const p2 = wealthLords[j];
      const pos1 = planets.find(p => p.name === p1);
      const pos2 = planets.find(p => p.name === p2);
      
      if (pos1 && pos2 && longitudeToSignAndDegree(pos1.siderealLongitude).sign === longitudeToSignAndDegree(pos2.siderealLongitude).sign) {
        const sign = longitudeToSignAndDegree(pos1.siderealLongitude).sign;
        yogas.push({
          name: `Dhana Yoga (${p1} & ${p2})`,
          shortTitle: 'Dhana — Wealth Flow',
          category: 'dhana',
          strength: 'moderate',
          bphsReference: 'BPHS Ch.41',
          planetsInvolved: [p1, p2],
          housesInvolved: [signToHouse(sign, lagnaSign)],
          icon: '💰',
          plainDescription: `The lords of wealth-producing houses (${p1} and ${p2}) are conjunct. Indicates strong potential for financial success.`,
          isActive: !pos1.isCombust && !pos2.isCombust,
          dashaActivated: false,
          description: `Wealth lords ${p1} and ${p2} are conjunct.`,
          type: 'auspicious',
          planets: [p1, p2]
        });
      }
    }
  }
  return yogas;
}

export function detectDaridraYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const getLordOfHouse = (h: number) => getPrimaryLord(advanceSigns(lagnaSign, h));
  
  const lagnaLord = getLordOfHouse(1);
  const sixLord = getLordOfHouse(6);
  const eightLord = getLordOfHouse(8);
  const twelveLord = getLordOfHouse(12);
  
  const posL = planets.find(p => p.name === lagnaLord);
  if (posL) {
    const lHouse = signToHouse(longitudeToSignAndDegree(posL.siderealLongitude).sign, lagnaSign);
    if ([6, 8, 12].includes(lHouse)) {
      yogas.push({
        name: 'Daridra Yoga (Lagna Lord in Dusthana)',
        shortTitle: 'Daridra — Resource Challenge',
        category: 'daridra',
        strength: 'moderate',
        bphsReference: 'BPHS Ch.42',
        planetsInvolved: [lagnaLord],
        housesInvolved: [lHouse],
        icon: '⚠️',
        plainDescription: 'The Lagna lord is in a difficult house (6, 8, or 12). May indicate struggles with health or finances requiring extra effort.',
        isActive: true,
        dashaActivated: false,
        description: 'Lagna lord in 6th, 8th or 12th house.',
        type: 'inauspicious',
        planets: [lagnaLord]
      });
    }
  }
  return yogas;
}

export function detectInauspiciousYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const getHouseOf = (p: string) => {
    const pos = planets.find(x => x.name === p);
    return pos ? signToHouse(longitudeToSignAndDegree(pos.siderealLongitude).sign, lagnaSign) : null;
  };
  
  // 1. Guru-Chandaal Yoga (Jupiter conjunct Rahu or Ketu)
  const jupiter = planets.find(p => p.name === 'Jupiter');
  const rahu = planets.find(p => p.name === 'Rahu');
  const ketu = planets.find(p => p.name === 'Ketu');
  
  if (jupiter && (rahu || ketu)) {
    const jupSign = longitudeToSignAndDegree(jupiter.siderealLongitude).sign;
    if ((rahu && longitudeToSignAndDegree(rahu.siderealLongitude).sign === jupSign) ||
        (ketu && longitudeToSignAndDegree(ketu.siderealLongitude).sign === jupSign)) {
      yogas.push({
        name: 'Guru-Chandaal Yoga',
        shortTitle: 'Guru-Chandaal — Wisdom Eclipse',
        category: 'inauspicious',
        strength: 'moderate',
        bphsReference: 'Common tradition',
        planetsInvolved: ['Jupiter', rahu ? 'Rahu' : 'Ketu'],
        housesInvolved: [getHouseOf('Jupiter')!],
        icon: '👺',
        plainDescription: 'Jupiter conjunct Rahu or Ketu. Can bring rebellion or unorthodox spiritual/wisdom paths.',
        isActive: true,
        dashaActivated: false,
        description: 'Jupiter conjunct node.',
        type: 'inauspicious',
        planets: ['Jupiter', rahu ? 'Rahu' : 'Ketu']
      });
    }
  }

  // 2. Shani-Rahu (Shapit Dosh)
  const saturn = planets.find(p => p.name === 'Saturn');
  if (saturn && rahu) {
    if (longitudeToSignAndDegree(saturn.siderealLongitude).sign === longitudeToSignAndDegree(rahu.siderealLongitude).sign) {
      yogas.push({
        name: 'Shapit Dosh',
        shortTitle: 'Shapit — Cursed Link',
        category: 'inauspicious',
        strength: 'strong',
        bphsReference: 'Common tradition',
        planetsInvolved: ['Saturn', 'Rahu'],
        housesInvolved: [getHouseOf('Saturn')!],
        icon: '🔗',
        plainDescription: 'Saturn conjunct Rahu. Indicates karmic burdens or sudden obstacles in life.',
        isActive: true,
        dashaActivated: false,
        description: 'Saturn conjunct Rahu.',
        type: 'inauspicious',
        planets: ['Saturn', 'Rahu']
      });
    }
  }

  // 3. Shakata Yoga (Moon in 6, 8, or 12 from Jupiter)
  const moon = planets.find(p => p.name === 'Moon');
  if (moon && jupiter) {
    const moonSign = longitudeToSignAndDegree(moon.siderealLongitude).sign;
    const jupSign = longitudeToSignAndDegree(jupiter.siderealLongitude).sign;
    const dist = countSignsBetween(jupSign, moonSign);
    if ([6, 8, 12].includes(dist)) {
      yogas.push({
        name: 'Shakata Yoga',
        shortTitle: 'Shakata — Wagon Wheel',
        category: 'inauspicious',
        strength: 'moderate',
        bphsReference: 'BPHS Ch.36',
        planetsInvolved: ['Moon', 'Jupiter'],
        housesInvolved: [getHouseOf('Moon')!, getHouseOf('Jupiter')!],
        icon: '🎡',
        plainDescription: 'Moon in 6/8/12 from Jupiter. Fluctuating fortune, often like a moving wagon wheel.',
        isActive: true,
        dashaActivated: false,
        description: 'Moon in 6/8/12 from Jupiter.',
        type: 'inauspicious',
        planets: ['Moon', 'Jupiter']
      });
    }
  }

  // 4. Angaraka Yoga (Mars conjunct Rahu or Ketu)
  const mars = planets.find(p => p.name === 'Mars');
  if (mars && (rahu || ketu)) {
    const marsSign = longitudeToSignAndDegree(mars.siderealLongitude).sign;
    if ((rahu && longitudeToSignAndDegree(rahu.siderealLongitude).sign === marsSign) ||
        (ketu && longitudeToSignAndDegree(ketu.siderealLongitude).sign === marsSign)) {
      yogas.push({
        name: 'Angaraka Yoga',
        shortTitle: 'Angaraka — Burning Blade',
        category: 'inauspicious',
        strength: 'moderate',
        bphsReference: 'Common tradition',
        planetsInvolved: ['Mars', rahu ? 'Rahu' : 'Ketu'],
        housesInvolved: [getHouseOf('Mars')!],
        icon: '🔥',
        plainDescription: 'Mars conjunct node. Intense energy that can manifest as anger or impulsive action.',
        isActive: true,
        dashaActivated: false,
        description: 'Mars conjunct node.',
        type: 'inauspicious',
        planets: ['Mars', rahu ? 'Rahu' : 'Ketu']
      });
    }
  }

  return yogas;
}

export function detectBudhadityaAndAdhiYogas(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const houseOf = (p: string) => {
    const pos = planets.find(x => x.name === p);
    return pos ? signToHouse(longitudeToSignAndDegree(pos.siderealLongitude).sign, lagnaSign) : null;
  };

  // 1. Budhaditya Yoga (Sun + Mercury)
  const sun = planets.find(p => p.name === 'Sun');
  const mercury = planets.find(p => p.name === 'Mercury');
  if (sun && mercury) {
    if (longitudeToSignAndDegree(sun.siderealLongitude).sign === longitudeToSignAndDegree(mercury.siderealLongitude).sign) {
      yogas.push({
        name: 'Budhaditya Yoga',
        shortTitle: 'Budhaditya — Solar Intelligence',
        category: 'auspicious',
        strength: 'moderate',
        bphsReference: 'Common tradition',
        planetsInvolved: ['Sun', 'Mercury'],
        housesInvolved: [houseOf('Sun')!],
        icon: '💡',
        plainDescription: 'Sun and Mercury conjunct. Brilliant intellect, learning, and communicative power.',
        isActive: !mercury.isCombust,
        dashaActivated: false,
        description: 'Sun conjunct Mercury.',
        type: 'auspicious',
        planets: ['Sun', 'Mercury']
      });
    }
  }

  // 2. Chandradhi Yoga (Benefics in 6, 7, 8 from Moon)
  const moon = planets.find(p => p.name === 'Moon');
  if (moon) {
    const moonSign = longitudeToSignAndDegree(moon.siderealLongitude).sign;
    const benefics = ['Jupiter', 'Venus', 'Mercury'];
    const adhiHouses = [6, 7, 8];
    const presentIn = benefics.filter(pName => {
      const p = planets.find(x => x.name === pName);
      if (!p) return false;
      const hFromMoon = countSignsBetween(moonSign, longitudeToSignAndDegree(p.siderealLongitude).sign);
      return adhiHouses.includes(hFromMoon);
    });

    if (presentIn.length >= 2) {
      yogas.push({
        name: 'Chandradhi Yoga',
        shortTitle: 'Chandradhi — Lunar Grace',
        category: 'auspicious',
        strength: presentIn.length === 3 ? 'strong' : 'moderate',
        bphsReference: 'BPHS Ch.36 v.1',
        planetsInvolved: ['Moon', ...presentIn],
        housesInvolved: [houseOf('Moon')!, ...presentIn.map(p => houseOf(p)!).filter(Boolean)],
        icon: '🐚',
        plainDescription: 'Benefics in 6/7/8 from Moon. Command, wealth, and soft power.',
        isActive: true,
        dashaActivated: false,
        description: 'Benefics in 6/7/8 from Moon.',
        type: 'auspicious',
        planets: ['Moon', ...presentIn]
      });
    }
  }

  return yogas;
}

export function detectKalaSarpaYoga(
  planets: PlanetPosition[]
): Yoga[] {
  const yogas: Yoga[] = [];
  const rahu = planets.find(p => p.name === 'Rahu');
  const ketu = planets.find(p => p.name === 'Ketu');
  if (!rahu || !ketu) return yogas;

  const rLon = rahu.siderealLongitude;
  const kLon = ketu.siderealLongitude;
  
  const mainPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const posList = mainPlanets.map(name => planets.find(p => p.name === name)).filter(Boolean) as PlanetPosition[];
  
  if (posList.length < 7) return yogas;

  let clockwiseOk = true;
  let antiClockwiseOk = true;

  for (const p of posList) {
    const pLon = p.siderealLongitude;
    
    // Clockwise check
    let isBetweenKandR = false;
    if (kLon < rLon) {
      isBetweenKandR = (pLon >= kLon && pLon <= rLon);
    } else {
      isBetweenKandR = (pLon >= kLon || pLon <= rLon);
    }
    if (!isBetweenKandR) clockwiseOk = false;

    // Anti-clockwise check
    let isBetweenRandK = false;
    if (rLon < kLon) {
      isBetweenRandK = (pLon >= rLon && pLon <= kLon);
    } else {
      isBetweenRandK = (pLon >= rLon || pLon <= kLon);
    }
    if (!isBetweenRandK) antiClockwiseOk = false;
  }

  if (clockwiseOk || antiClockwiseOk) {
    yogas.push({
      name: 'Kaala Sarpa Yoga',
      shortTitle: 'Kaala Sarpa — Serpent of Time',
      category: 'nabhasha',
      strength: 'strong',
      bphsReference: 'Common Tradition',
      planetsInvolved: ['Rahu', 'Ketu', ...mainPlanets],
      housesInvolved: [],
      icon: '🐍',
      plainDescription: 'All planets hemmed between Rahu and Ketu. Intense karmic cycles and destined transformation.',
      isActive: true,
      dashaActivated: false,
      description: 'All planets between Node axis.',
      type: 'neutral',
      planets: ['Rahu', 'Ketu', ...mainPlanets]
    });
  }

  return yogas;
}

export function detectSaraswatiYoga(
  planets: PlanetPosition[],
  lagnaSign: SignNumber
): Yoga[] {
  const yogas: Yoga[] = [];
  const houseOf = (p: string) => {
    const pos = planets.find(x => x.name === p);
    return pos ? signToHouse(longitudeToSignAndDegree(pos.siderealLongitude).sign, lagnaSign) : null;
  };

  const mercury = planets.find(p => p.name === 'Mercury');
  const jupiter = planets.find(p => p.name === 'Jupiter');
  const venus   = planets.find(p => p.name === 'Venus');

  if (mercury && jupiter && venus) {
    const hM = houseOf('Mercury')!;
    const hJ = houseOf('Jupiter')!;
    const hV = houseOf('Venus')!;
    
    const validHouses = [1, 4, 7, 10, 2, 5, 9];
    if (validHouses.includes(hM) && validHouses.includes(hJ) && validHouses.includes(hV)) {
      const jupSign = longitudeToSignAndDegree(jupiter.siderealLongitude).sign;
      if (isOwnSign('Jupiter', jupSign) || isExaltationSign('Jupiter', jupSign) || jupSign === 2) {
        yogas.push({
          name: 'Saraswati Yoga',
          shortTitle: 'Saraswati — Divine Wisdom',
          category: 'auspicious',
          strength: 'strong',
          bphsReference: 'Standard classical texts',
          planetsInvolved: ['Mercury', 'Jupiter', 'Venus'],
          housesInvolved: [hM, hJ, hV],
          icon: '🪕',
          plainDescription: 'Jupiter, Mercury, and Venus all in Kendra, Trikona, or 2nd house. Grants refined intellect, speech, and wisdom.',
          isActive: true,
          dashaActivated: false,
          description: 'Jupiter, Mercury, and Venus strong in key houses.',
          type: 'auspicious',
          planets: ['Mercury', 'Jupiter', 'Venus']
        });
      }
    }
  }

  return yogas;
}

export function detectAllYogas(
  positions: PlanetPosition[],
  currentMahadasha?: string,
  currentAntardasha?: string
): YogaDetectionResult {
  const arc = positions.find(p => p.name === "Ascendant");
  if (!arc) return { yogas: [], activeCount: 0, strongCount: 0, dominantCategory: 'other', detectedAt: new Date().toISOString() };
  
  const lagnaSign = longitudeToSignAndDegree(arc.siderealLongitude).sign;
  
  const allYogas: Yoga[] = [
    ...detectNabhashaYogas(positions, lagnaSign),
    ...detectMahapurushaYogas(positions, lagnaSign),
    ...detectLunarYogas(positions, lagnaSign),
    ...detectSolarYogas(positions, lagnaSign),
    ...detectRajYogas(positions, lagnaSign),
    ...detectDhanaYogas(positions, lagnaSign),
    ...detectDaridraYogas(positions, lagnaSign),
    ...detectNeechabhangaRajYoga(positions, lagnaSign),
    ...detectViparitaRajYoga(positions, lagnaSign),
    ...detectAuspiciousYogas(positions, lagnaSign),
    ...detectInauspiciousYogas(positions, lagnaSign),
    ...detectBudhadityaAndAdhiYogas(positions, lagnaSign),
    ...detectKalaSarpaYoga(positions),
    ...detectSaraswatiYoga(positions, lagnaSign),
  ];

  // Tag Dasha Activated
  const dashaLords = [currentMahadasha, currentAntardasha].filter(Boolean) as string[];
  const taggedYogas = allYogas.map(y => ({
    ...y,
    dashaActivated: dashaLords.some(lord => y.planetsInvolved.includes(lord)),
  }));

  // Unique by name
  const seen = new Set<string>();
  const unique = taggedYogas.filter(y => {
    if (seen.has(y.name)) return false;
    seen.add(y.name);
    return true;
  });

  const activeYogas = unique.filter(y => y.isActive);
  
  const catCount = activeYogas.reduce<Record<string, number>>((acc, y) => {
    acc[y.category] = (acc[y.category] ?? 0) + 1;
    return acc;
  }, {});
  
  const dominantCategory = (
    Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other'
  ) as YogaCategory;

  return {
    yogas: unique,
    activeCount: activeYogas.length,
    strongCount: unique.filter(y => y.strength === 'strong').length,
    dominantCategory,
    detectedAt: new Date().toISOString(),
  };
}

export const detectYogas = (positions: PlanetPosition[]): Yoga[] => {
  return detectAllYogas(positions).yogas;
};

// --- Advanced Muhurta Engine ---

const getNakshatraCount = (startNak: string, endNak: string): number => {
  const startIdx = NAKSHATRAS.indexOf(startNak);
  const endIdx = NAKSHATRAS.indexOf(endNak);
  return ((endIdx - startIdx + 27) % 27) + 1;
};

export const getRiseSetInfo = (date: Date, lat: number, lon: number) => {
  const obs = new Observer(lat, lon, 0);
  
  // Try to find the next sunrise
  let sunrise = SearchRiseSet(Body.Sun, obs, 1, date, 1)?.date;
  
  // If the next sunrise is after the date, or not found, we need the previous one
  if (!sunrise || sunrise > date) {
    const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    sunrise = SearchRiseSet(Body.Sun, obs, 1, yesterday, 2)?.date;
  }
  
  // If still not found (e.g. polar regions), fallback to start of calendar day
  if (!sunrise) {
    sunrise = new Date(date);
    sunrise.setHours(6, 0, 0, 0);
  }

  // Sunset should be the one following this sunrise to define the "Vedic Day" span
  let sunset = SearchRiseSet(Body.Sun, obs, -1, sunrise, 1)?.date;
  if (!sunset) {
    sunset = new Date(sunrise);
    sunset.setHours(sunrise.getHours() + 12);
  }

  return { sunrise, sunset };
};

export const getBirthInfo = (date: Date, lat: number, lon: number) => {
  const rs = getRiseSetInfo(date, lat, lon);
  const sunrise = rs.sunrise;
  const sunset = rs.sunset;
  
  const sunAtSunrise = calculatePositionsLite(sunrise, lat, lon).find(p => p.name === "Sun")!;
  const minutesSinceSunrise = (date.getTime() - sunrise.getTime()) / (1000 * 60);
  const isDayBirth = date.getTime() >= sunrise.getTime() && date.getTime() <= sunset.getTime();
  const dayDurationMinutes = (sunset.getTime() - sunrise.getTime()) / (1000 * 60);
  const dayOfWeek = sunrise.getDay();
  
  return {
    sunAbsoluteLongitudeAtSunrise: sunAtSunrise.siderealLongitude,
    minutesSinceSunrise,
    isDayBirth,
    daytimeDurationMinutes: dayDurationMinutes,
    dayOfWeek,
    sunrise,
    sunset
  };
};

const isRahuKaalActive = (date: Date, sunrise: Date, sunset: Date): boolean => {
  const dayDuration = sunset.getTime() - sunrise.getTime();
  const partDuration = dayDuration / 8;
  const weekday = date.getDay();
  
  const RA_PARTS = [8, 2, 7, 5, 6, 4, 3]; // Order: Sun=8, Mon=2, Tue=7, Wed=5, Thu=6, Fri=4, Sat=3
  const part = RA_PARTS[weekday];
  
  const start = sunrise.getTime() + (part - 1) * partDuration;
  const end = start + partDuration;
  
  const t = date.getTime();
  return t >= start && t <= end;
};

const isRiktaTithiActive = (tithiNum: number): boolean => {
  const num = tithiNum % 15;
  const val = num === 0 ? 15 : num;
  return [4, 9, 14].includes(val);
};

export const calculatePositionsLite = (date: Date, lat: number, lon: number): PlanetPosition[] => {
  const ayanamsa = getAyanamsa(date);
  const observer = new Observer(lat, lon, 0);
  
  const positions = PLANETS.map(p => {
    const vec = Equator(p.id, date, observer, false, true).vec;
    const ecl = Ecliptic(vec);
    return formatPlanetPosition(p.name, p.symbol, ecl.elon, ayanamsa, false, p.color);
  });

  const rahuLon = getMeanRahuLongitude(date);
  positions.push(formatPlanetPosition("Rahu", "☊", rahuLon, ayanamsa, true, "#8A2BE2"));
  const ketuLon = (rahuLon + 180) % 360;
  positions.push(formatPlanetPosition("Ketu", "☋", ketuLon, ayanamsa, true, "#A9A9A9"));

  const ascLon = getAscendant(date, lat, lon);
  positions.unshift(formatPlanetPosition("Ascendant", "ASC", ascLon, ayanamsa, false, "#10B981"));

  // Ensure unique positions by name (safety check for React keys)
  const uniquePositionsLite: PlanetPosition[] = [];
  const seenNamesLite = new Set<string>();
  
  for (const pos of positions) {
    // Defense: trim and normalize to catch any subtle whitespace or case issues
    const normalizedName = pos.name.trim();
    if (normalizedName && !seenNamesLite.has(normalizedName)) {
      uniquePositionsLite.push({
        ...pos,
        name: normalizedName // Ensure normalized name is used
      });
      seenNamesLite.add(normalizedName);
    }
  }

  return uniquePositionsLite;
};

const getDashamshaSign = (longitude: number): string => {
  const degreeInSign = longitude % 30;
  const signIdx = Math.floor(longitude / 30);
  const division = Math.floor(degreeInSign / 3);
  
  let resultIdx;
  if (signIdx % 2 === 0) {
    resultIdx = (signIdx + division) % 12;
  } else {
    resultIdx = (signIdx + 8 + division) % 12;
  }
  return RASHIS[resultIdx];
};

/**
 * Maximum attainable Panchang (global) score: Auspicious Tithi (10) + Supportive Vara (10).
 * Used to normalise the headline score onto a 0-100 scale.
 */
export const MUHURTA_GLOBAL_MAX = 20;

/**
 * Maximum attainable individual (Janma Kundali) score per event category.
 *
 * Shared base = Ascendant lord well placed (20) + three benefics in a transit kendra (45)
 *             + Vargottama Ascendant (30) + Vargottama Moon (20) = 115.
 * CAREER adds  = D10 kendra (20) + Jupiter/Venus aspecting the Amatyakaraka (20 + 20) = 60.
 * MARRIAGE adds= Jupiter/Venus in the D9 kendra (20 + 20) + Jupiter aspecting the Upapada (25) = 65.
 *
 * NOTE: PROPERTY and GENERAL currently have no category-specific rules, so they share the base.
 */
const MUHURTA_INDIVIDUAL_MAX: Record<EventCategory, number> = {
  CAREER: 175,
  MARRIAGE: 180,
  PROPERTY: 115,
  GENERAL: 115,
};

export interface MuhurtaScore {
  /** Normalised 0-100 score, safe for percentage display. */
  score: number;
  /** Unnormalised globalScore + individualScore. Retained for thresholding and debugging. */
  rawScore: number;
  globalScore: number;
  individualScore: number;
  /** Category-specific maximum the raw score was normalised against. */
  maxScore: number;
  reasons: string[];
  vargottamaLagna: boolean;
  vargottamaMoon: boolean;
}

const scoreMuhurtaTime = (
  transitPositions: PlanetPosition[],
  natalData: MuhurtaBaseData,
  category: EventCategory,
  /** Panchang for THIS candidate instant. Must be computed by the caller from the
   *  candidate time — `vara` is date-derived and cannot be recovered from positions. */
  pan: PanchangData
): MuhurtaScore => {
  const maxScore = MUHURTA_GLOBAL_MAX + MUHURTA_INDIVIDUAL_MAX[category];
  let globalScore = 0;
  let individualScore = 0;
  const reasons: string[] = [];

  const tAsc = transitPositions.find(p => p.name === "Ascendant");
  const tMoon = transitPositions.find(p => p.name === "Moon");

  if (!tAsc || !tMoon) return { score: 0, rawScore: -100, globalScore: -100, individualScore: 0, maxScore, reasons: ["Missing transit data"], vargottamaLagna: false, vargottamaMoon: false };

  // 1. Global Foundation (Panchang)

  // Tithi quality
  if ([1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15].includes(pan.tithi.number % 15 || 15)) {
    globalScore += 10;
    reasons.push(`Auspicious Tithi: ${pan.tithi.name}`);
  }

  // Weekday (Vara)
  if (['Monday', 'Wednesday', 'Thursday', 'Friday'].includes(pan.vara)) {
    globalScore += 10;
    reasons.push(`Supportive Weekday: ${pan.vara}`);
  }

  // 2. Individual Resonance (Janma Kundali)
  
  // Ascendant Fortification
  const tAscSign = tAsc.rashi;
  const tAscLord = RASHI_LORDS[tAscSign];
  const tAscLordPos = transitPositions.find(p => p.name === tAscLord);
  
  if (tAscLordPos) {
    const tAscSignIdx = RASHIS.indexOf(tAscSign);
    const tAscLordSignIdx = RASHIS.indexOf(tAscLordPos.rashi);
    const house = ((tAscLordSignIdx - tAscSignIdx + 12) % 12) + 1;
    
    if ([1, 4, 7, 10, 5, 9].includes(house)) {
      individualScore += 20;
      reasons.push("Personal Harmony: Ascendant Lord is in an auspicious house.");
    }
  }

  const benefics = ["Jupiter", "Venus", "Mercury"];
  transitPositions.forEach(p => {
    const tAscSignIdx = RASHIS.indexOf(tAscSign);
    const pSignIdx = RASHIS.indexOf(p.rashi);
    const house = ((pSignIdx - tAscSignIdx + 12) % 12) + 1;

    if (benefics.includes(p.name)) {
      if ([1, 4, 7, 10].includes(house)) {
        individualScore += 15;
        reasons.push(`Benefic ${p.name} strengthens a Transit Kendra.`);
      }
    }
    if (["Saturn", "Mars", "Rahu", "Ketu"].includes(p.name)) {
      if (house === 1 || house === 7) {
        individualScore -= 15;
        reasons.push(`Transit Conflict: Malefic ${p.name} in Ascendant or 7th House.`);
      }
    }
  });

  // Strength Check
  const lagnaD1 = tAsc.rashi;
  const lagnaD9 = getNavamshaSign(tAsc.siderealLongitude);
  const vargottamaLagna = lagnaD1 === lagnaD9;
  if (vargottamaLagna) {
    individualScore += 30;
    reasons.push("Vargottama Ascendant - exceptional foundational strength.");
  }

  const moonD1 = tMoon.rashi;
  const moonD9 = getNavamshaSign(tMoon.siderealLongitude);
  const vargottamaMoon = moonD1 === moonD9;
  if (vargottamaMoon) {
    individualScore += 20;
    reasons.push("Vargottama Moon - mental and emotional alignment.");
  }

  // Contextual Event Scoring
  if (category === 'CAREER') {
    const amkPlanet = transitPositions.find(p => p.name === natalData.natalAmK);
    const amkSignIdx = RASHIS.indexOf(amkPlanet?.rashi || "");
    
    const tTenLord = RASHI_LORDS[RASHIS[(RASHIS.indexOf(tAscSign) + 9) % 12]];
    const tTenLordPos = transitPositions.find(p => p.name === tTenLord);
    if (tTenLordPos) {
       const tAscD10 = getDashamshaSign(tAsc.siderealLongitude);
       const tTenLordD10 = getDashamshaSign(tTenLordPos.siderealLongitude);
       const tAscD10Idx = RASHIS.indexOf(tAscD10);
       const tTenLordD10Idx = RASHIS.indexOf(tTenLordD10);
       const houseD10 = ((tTenLordD10Idx - tAscD10Idx + 12) % 12) + 1;
       if ([1, 4, 7, 10].includes(houseD10)) {
           individualScore += 20;
           reasons.push("Career Anchor: Transit 10th Lord is in a D10 Kendra.");
       }
    }

    ["Jupiter", "Venus"].forEach(pName => {
      const p = transitPositions.find(pos => pos.name === pName);
      if (p) {
        const aspects = getAspectingHouses(pName);
        const pSignIdx = RASHIS.indexOf(p.rashi);
        for (const aspHouse of aspects) {
          if ((pSignIdx + aspHouse - 1) % 12 === amkSignIdx) {
            individualScore += 20;
            reasons.push(`Favorable Aspect: Transit ${pName} aspects your Amatyakaraka.`);
            break;
          }
        }
      }
    });
  } else if (category === 'MARRIAGE') {
    const jupiter = transitPositions.find(p => p.name === "Jupiter");
    const ulSignIdx = RASHIS.indexOf(natalData.natalUL);
    
    ["Jupiter", "Venus"].forEach(pName => {
        const p = transitPositions.find(pos => pos.name === pName);
        if (p) {
            const tAscD9 = getNavamshaSign(tAsc.siderealLongitude);
            const pD9 = getNavamshaSign(p.siderealLongitude);
            const houseD9 = ((RASHIS.indexOf(pD9) - RASHIS.indexOf(tAscD9) + 12) % 12) + 1;
            if ([1, 4, 7, 10].includes(houseD9)) {
                individualScore += 20;
                reasons.push(`Alignment: ${pName} strengthens the Transit D9 Kendra.`);
            }
        }
    });

    if (jupiter) {
      const aspects = getAspectingHouses("Jupiter");
      const jupSignIdx = RASHIS.indexOf(jupiter.rashi);
      for (const aspHouse of aspects) {
        if ((jupSignIdx + aspHouse - 1) % 12 === ulSignIdx) {
          individualScore += 25;
          reasons.push("Jupiter blessing your natal Upapada Lagna.");
          break;
        }
      }
    }
  }

  const rawScore = globalScore + individualScore;

  return {
    score: Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100))),
    rawScore,
    globalScore,
    individualScore,
    maxScore,
    reasons,
    vargottamaLagna,
    vargottamaMoon
  };
};

// --- Time-based Lagnas & Sphutas (BPHS v2) ---

const MOVABLE_SIGNS_PP = new Set<SignNumber>([1, 4, 7, 10]);
const FIXED_SIGNS_PP   = new Set<SignNumber>([2, 5, 8, 11]);

export function calculatePranapada(
  sunAbsoluteLongitudeAtSunrise: number,
  minutesSinceSunrise: number,
  lagnaSignNumber: SignNumber
): PranapadalagnaResult {
  if (minutesSinceSunrise < 0)
    throw new Error('[calculatePranapada] minutesSinceSunrise must be >= 0');

  const vighatikas    = minutesSinceSunrise * 2.5;   // 1 min = 2.5 Vighatikas
  const offsetDegrees = vighatikas / 15;

  const sunSign = longitudeToSignAndDegree(sunAbsoluteLongitudeAtSunrise).sign;

  let startingLongitude: number;
  let sunSignNature: 'movable' | 'fixed' | 'dual';

  if (MOVABLE_SIGNS_PP.has(sunSign)) {
    startingLongitude = sunAbsoluteLongitudeAtSunrise;
    sunSignNature = 'movable';
  } else if (FIXED_SIGNS_PP.has(sunSign)) {
    startingLongitude = sunAbsoluteLongitudeAtSunrise + 240;
    sunSignNature = 'fixed';
  } else {
    startingLongitude = sunAbsoluteLongitudeAtSunrise + 120;
    sunSignNature = 'dual';
  }

  const rawLongitude        = startingLongitude + offsetDegrees;
  const normalisedLongitude = ((rawLongitude % 360) + 360) % 360;
  const { sign, degree }    = longitudeToSignAndDegree(normalisedLongitude);

  const FORTUNATE_HOUSES = new Set([2, 4, 5, 9, 10, 11]);
  const houseFromLagna   = countSignsBetween(lagnaSignNumber, sign);
  const isFortunate      = FORTUNATE_HOUSES.has(houseFromLagna);

  return {
    pranapadalagnaSignNumber: sign,
    pranapadalagnaDegree:     Math.round(degree * 1000) / 1000,
    sunSignNature,
    startingLongitude:        ((startingLongitude % 360) + 360) % 360,
    vighatisSinceSunrise:     Math.round(vighatikas * 100) / 100,
    baseOffsetDegrees:        Math.round(offsetDegrees * 1000) / 1000,
    isFortunate,
    houseFromLagna,
  };
}

export function calculateGhatiLagna(
  sunAbsoluteLongitudeAtSunrise: number,
  minutesSinceSunrise: number,
  isDayBirth: boolean,
  lagnaAbsoluteLongitude: number
): GhatiLagnaResult {
  const adjMinutes = Math.max(0, minutesSinceSunrise);
  
  const baseLongitude = isDayBirth
    ? sunAbsoluteLongitudeAtSunrise
    : lagnaAbsoluteLongitude;

  // BPHS / JH standard: Ghati Lagna traverses 1.25 signs (37.5 deg) per Ghati (24 minutes)
  const totalGhatis = adjMinutes / 24;
  const degreesTraversed = totalGhatis * 37.5;

  const { sign, degree } = longitudeToSignAndDegree(baseLongitude + degreesTraversed);

  return {
    ghatiLagnaSignNumber:     sign,
    ghatiLagnaDegree:         Math.round(degree * 1000) / 1000,
    fullGhatikasSinceSunrise: Math.floor(adjMinutes / 24),
    vighatikasFraction:       Math.round(((adjMinutes / 24) % 1) * 60 * 100) / 100,
    sunLongitudeAtSunrise:    sunAbsoluteLongitudeAtSunrise,
    isDayBirth,
    baseLongitudeUsed:        baseLongitude,
  };
}

export function calculateHoraLagna(
  sunAbsoluteLongitudeAtSunrise: number,
  minutesSinceSunrise: number,
  isDayBirth: boolean,
  lagnaAbsoluteLongitude: number
): HoraLagnaResult {
  if (minutesSinceSunrise < 0)
    throw new Error('[calculateHoraLagna] minutesSinceSunrise must be >= 0');

  const baseLongitude = isDayBirth
    ? sunAbsoluteLongitudeAtSunrise
    : lagnaAbsoluteLongitude;

  const GHATIKAS_PER_SIGN  = 2.5; // 1 sign per 60 min
  const totalGhatikas      = minutesSinceSunrise / 24;
  const signsTraversed     = totalGhatikas / GHATIKAS_PER_SIGN;
  const degrees            = signsTraversed * 30;

  const { sign, degree } = longitudeToSignAndDegree(baseLongitude + degrees);

  return {
    horaLagnaSignNumber:       sign,
    horaLagnaDegree:           Math.round(degree * 1000) / 1000,
    totalGhatikasSinceSunrise: Math.round(totalGhatikas * 1000) / 1000,
    sunLongitudeAtSunrise:     sunAbsoluteLongitudeAtSunrise,
    isDayBirth,
    baseLongitudeUsed:         baseLongitude,
  };
}

export function calculateBhavaLagna(
  sunAbsoluteLongitudeAtSunrise: number,
  minutesSinceSunrise: number,
  isDayBirth: boolean,
  lagnaAbsoluteLongitude: number
): BhavaLagnaResult {
  if (minutesSinceSunrise < 0)
    throw new Error('[calculateBhavaLagna] minutesSinceSunrise must be >= 0');

  const baseLongitude = isDayBirth
    ? sunAbsoluteLongitudeAtSunrise
    : lagnaAbsoluteLongitude;

  const GHATIKAS_PER_SIGN  = 5; // 1 sign per 120 min
  const totalGhatikas      = minutesSinceSunrise / 24;
  const signsTraversed     = totalGhatikas / GHATIKAS_PER_SIGN;
  const degrees            = signsTraversed * 30;

  const { sign, degree } = longitudeToSignAndDegree(baseLongitude + degrees);

  return {
    bhavaLagnaSignNumber:      sign,
    bhavaLagnaDegree:          Math.round(degree * 1000) / 1000,
    totalGhatikasSinceSunrise: Math.round(totalGhatikas * 1000) / 1000,
    isDayBirth,
    baseLongitudeUsed:         baseLongitude,
  };
}

export function calculateBeejaSphuata(planets: PlanetPosition[]): BeejaSphutaResult {
  const sun = planets.find(p => p.name === "Sun")!.siderealLongitude;
  const venus = planets.find(p => p.name === "Venus")!.siderealLongitude;
  const jupiter = planets.find(p => p.name === "Jupiter")!.siderealLongitude;
  
  const long = (sun + venus + jupiter) % 360;
  const { sign, degree } = longitudeToSignAndDegree(long);
  
  // Auspicious if in odd sign
  const isAuspicious = sign % 2 !== 0;
  
  return {
    signNumber: sign,
    degree: Math.round(degree * 1000) / 1000,
    absoluteLongitude: Math.round(long * 1000) / 1000,
    isAuspicious
  };
}

export function calculateKshetraSphuta(planets: PlanetPosition[]): KsheetraSphutaResult {
  const moon = planets.find(p => p.name === "Moon")!.siderealLongitude;
  const mars = planets.find(p => p.name === "Mars")!.siderealLongitude;
  const jupiter = planets.find(p => p.name === "Jupiter")!.siderealLongitude;
  
  const long = (moon + mars + jupiter) % 360;
  const { sign, degree } = longitudeToSignAndDegree(long);
  
  // Auspicious if in even sign
  const isAuspicious = sign % 2 === 0;
  
  return {
    signNumber: sign,
    degree: Math.round(degree * 1000) / 1000,
    absoluteLongitude: Math.round(long * 1000) / 1000,
    isAuspicious
  };
}

export function calculateTriSphuta(lagnaSign: SignNumber, planets: PlanetPosition[], gulikaLong: number): TriSphutaResult {
  const moonLong = planets.find(p => p.name === "Moon")!.siderealLongitude;
  const ascLong = planets.find(p => p.name === "Ascendant")!.siderealLongitude;
  
  const long = (moonLong + ascLong + gulikaLong) % 360;
  const { sign, degree } = longitudeToSignAndDegree(long);
  
  return {
    signNumber: sign,
    degree: Math.round(degree * 1000) / 1000,
    absoluteLongitude: Math.round(long * 1000) / 1000
  };
}

// --- Arudha & Relationship Lagnas ---

export function calculateArudhaLagna(lagnaSign: SignNumber, planets: PlanetPosition[]): ArudhaLagnaResult {
  const lagnaLord = RASHI_LORDS[RASHIS[lagnaSign - 1]];
  const lordPos = planets.find(p => p.name === lagnaLord);
  if (!lordPos) return { signNumber: lagnaSign, house: 1 };

  const lordSign = (RASHIS.indexOf(lordPos.rashi) + 1) as SignNumber;
  const distance = ((lordSign - lagnaSign + 12) % 12);
  let arudhaSign = ((lordSign + distance - 1) % 12) + 1;

  // Exceptions (BPHS): Arudha cannot be in 1st or 7th from source
  if (arudhaSign === lagnaSign) {
    arudhaSign = ((lagnaSign + 9 - 1) % 12) + 1; // 10th house
  } else if (((arudhaSign - lagnaSign + 12) % 12) + 1 === 7) {
    arudhaSign = ((lagnaSign + 3 - 1) % 12) + 1; // 4th house
  }

  return { signNumber: arudhaSign as SignNumber, house: ((arudhaSign - lagnaSign + 12) % 12) + 1 };
}

export function calculateUpapadaLagna(lagnaSign: SignNumber, planets: PlanetPosition[]): UpapadaLagnaResult {
  const house12Sign = ((lagnaSign + 11 - 1) % 12) + 1;
  const house12Lord = RASHI_LORDS[RASHIS[house12Sign - 1]];
  const lordPos = planets.find(p => p.name === house12Lord);
  if (!lordPos) return { signNumber: house12Sign as SignNumber, house: 12 };

  const lordSign = (RASHIS.indexOf(lordPos.rashi) + 1) as SignNumber;
  const distance = ((lordSign - house12Sign + 12) % 12);
  let upapadaSign = ((lordSign + distance - 1) % 12) + 1;

  // Exceptions (BPHS): Same as AL
  if (upapadaSign === house12Sign) {
    upapadaSign = ((house12Sign + 9 - 1) % 12) + 1;
  } else if (((upapadaSign - house12Sign + 12) % 12) + 1 === 7) {
    upapadaSign = ((house12Sign + 3 - 1) % 12) + 1;
  }

  return { signNumber: upapadaSign as SignNumber, house: ((upapadaSign - lagnaSign + 12) % 12) + 1 };
}

export function calculateVarnadaLagna(
  lagnaSignNumber: number,
  lagnaDegree: number,
  horaLagnaSignNumber: number
): VarnadaLagnaResult {
  // BPHS: Calc based on count from Aries/Pisces depending on odd/even nature
  const isLagnaOdd = lagnaSignNumber % 2 !== 0;
  const c1 = isLagnaOdd ? lagnaSignNumber : (13 - lagnaSignNumber);
  const c2 = horaLagnaSignNumber % 2 !== 0 ? horaLagnaSignNumber : (13 - horaLagnaSignNumber);
  
  const sum = (c1 + c2) % 12 || 12;
  const resultSign = isLagnaOdd ? sum : (13 - sum);
  const finalSign = (resultSign % 12) || 12;

  // Use natal lagna degree for Varnada point
  return { signNumber: finalSign as SignNumber };
}

export function calculateSreeLagna(
  lagnaAbsoluteLongitude: number,
  moonAbsoluteLongitude: number
): SreeLagnaResult {
  // Standard BPHS method: Sree Lagna = Lagna + (Fraction of Moon's Nakshatra elapsed * 360)
  const nakshatraSize = 360 / 27;
  const fractionElapsed = (moonAbsoluteLongitude % nakshatraSize) / nakshatraSize;
  const sreeLong = (lagnaAbsoluteLongitude + fractionElapsed * 360) % 360;
  
  const { sign } = longitudeToSignAndDegree(sreeLong);
  return { signNumber: sign };
}

export function calculateDhoomaChain(planets: PlanetPosition[]): DhoomaChainResult {
  const sun = planets.find(p => p.name === "Sun")!.siderealLongitude;
  
  const dhooma = (sun + 133.333333) % 360;
  const vyatipata = (360 - dhooma) % 360;
  const parivesha = (vyatipata + 180) % 360;
  const indraChapa = (360 - parivesha) % 360;
  const upaketu = (indraChapa + 16.666667) % 360;
  
  const getOutput = (long: number) => {
    const { sign, degree } = longitudeToSignAndDegree(long);
    return { signNumber: sign, degree: Math.round(degree * 1000) / 1000, absoluteLongitude: Math.round(long * 1000) / 1000 };
  };
  
  return {
    dhooma: getOutput(dhooma),
    vyatipata: getOutput(vyatipata),
    parivesha: getOutput(parivesha),
    indraChapa: getOutput(indraChapa),
    upaketu: getOutput(upaketu)
  };
}

// --- Charakarakas, Kaal Velas & Aggregator ---

export function calculateCharakarakas(planets: PlanetPosition[]): CharakarakaSetResult {
  const mainPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"];
  const pool = planets
    .filter(p => mainPlanets.includes(p.name))
    .map(p => {
      let deg = p.degree + (p.minute / 60);
      // Rahu inversion (30 - longitude)
      if (p.name === "Rahu") {
        deg = 30 - (p.degree % 30 + (p.minute / 60));
      }
      return { name: p.name, deg };
    })
    .sort((a, b) => b.deg - a.deg);
    
  const keys = ["AK", "AmK", "BK", "MK", "PiK", "PuK", "GK", "DK"];
  const result: any = {};
  keys.forEach((key, i) => {
    result[key] = pool[i]?.name || "None";
  });
  
  return result as CharakarakaSetResult;
}

export function calculateBhriguBindu(planets: PlanetPosition[]): BhriguBinduResult {
  const moon = planets.find(p => p.name === 'Moon');
  const rahu = planets.find(p => p.name === 'Rahu');

  if (!moon || !rahu) throw new Error('[calculateBhriguBindu] Moon or Rahu not found');

  const moonLong = moon.siderealLongitude;
  const rahuLong = rahu.siderealLongitude;

  const diff = Math.abs(moonLong - rahuLong);
  let midpoint = (moonLong + rahuLong) / 2;

  // Long Arc Midpoint logic: ensures the point is in the arc > 180deg
  if (diff < 180) {
    midpoint = (midpoint + 180) % 360;
  }

  midpoint = ((midpoint % 360) + 360) % 360;
  const { sign, degree } = longitudeToSignAndDegree(midpoint);

  return {
    signNumber: sign as SignNumber,
    degree: Math.round(degree * 1000) / 1000,
    absoluteLongitude: Math.round(midpoint * 1000) / 1000,
    moonLongitude: Math.round(moonLong * 1000) / 1000,
    rahuLongitude: Math.round(rahuLong * 1000) / 1000,
  };
}

export function calculateKaalVelas(
  birthDate: Date,
  daytimeDurationMinutes: number,
  isDayBirth: boolean,
  dayOfWeek: number,
  lat: number,
  lon: number,
  sunrise: Date,
  sunset: Date
): KaalVelaSetResult | null {
  if (daytimeDurationMinutes <= 0) return null;

  const duration = isDayBirth ? daytimeDurationMinutes : (24 * 60 - daytimeDurationMinutes);
  const startTime = isDayBirth ? sunrise : sunset;
  const portionDuration = duration / 8;
  
  const WEEKDAY_LORD_ORDER: KaalVelaPlanet[] = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
  const DAY_RULER: Record<number, KaalVelaPlanet> = { 0: 'Sun', 1: 'Moon', 2: 'Mars', 3: 'Mercury', 4: 'Jupiter', 5: 'Venus', 6: 'Saturn' };

  const startIndex = WEEKDAY_LORD_ORDER.indexOf(DAY_RULER[dayOfWeek]);
  
  const getPortionPos = (idx: number, isMidpoint: boolean) => {
    let mins = idx * portionDuration;
    if (isMidpoint) mins += portionDuration / 2;
    
    const time = new Date(startTime.getTime() + mins * 60 * 1000);
    const pos = calculatePositionsLite(time, lat, lon);
    const asc = pos.find(p => p.name === 'Ascendant')!;
    
    const { sign } = longitudeToSignAndDegree(asc.siderealLongitude);
    return { signNumber: sign as SignNumber, longitude: asc.siderealLongitude, portionStartMin: mins };
  };

  const getPlanetPortion = (pName: KaalVelaPlanet) => {
    for (let i = 0; i < 8; i++) {
        if (WEEKDAY_LORD_ORDER[(startIndex + i) % 7] === pName) return i;
    }
    return 0;
  };

  const saturnIdx = getPlanetPortion('Saturn');
  const gulika = getPortionPos(saturnIdx, false);
  const maandi = getPortionPos(saturnIdx, true);
  
  const sunIdx = getPlanetPortion('Sun');
  const marsIdx = getPlanetPortion('Mars');
  const mercIdx = getPlanetPortion('Mercury');
  const jupIdx = getPlanetPortion('Jupiter');

  return {
    gulika,
    maandi: { ...maandi, portionMidpointMin: maandi.portionStartMin },
    kaala: getPortionPos(sunIdx, false),
    mrityu: getPortionPos(marsIdx, false),
    ardhaprahara: getPortionPos(mercIdx, false),
    yamaghantaka: getPortionPos(jupIdx, false)
  };
}

// --- Special Points Helpers ---

function calculateIshtaDevata(planets: PlanetPosition[], charakarakas: CharakarakaSetResult): string {
  const akPlanetName = charakarakas.AK;
  const akPlanet = planets.find(p => p.name === akPlanetName);
  if (!akPlanet) return "Sun";

  const navSignName = getNavamshaSign(akPlanet.siderealLongitude);
  const navSign = RASHIS.indexOf(navSignName);
  // 12th from Karakamsa (Navamsha sign of AK)
  const ishtaSign = (navSign + 11) % 12;
  
  // Find planet in that navamsha sign or its lord
  // Simplified: return the lord of the 12th from Karakamsa
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  return signLords[ishtaSign];
}

function calculateDharmaChakra(planets: PlanetPosition[], charakarakas: CharakarakaSetResult): string {
  // Simplified: 9th from Karakamsa
  const akPlanetName = charakarakas.AK;
  const akPlanet = planets.find(p => p.name === akPlanetName);
  if (!akPlanet) return "Jupiter";

  const navSignName = getNavamshaSign(akPlanet.siderealLongitude);
  const navSign = RASHIS.indexOf(navSignName);
  const dharmaSign = (navSign + 8) % 12;
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  return signLords[dharmaSign];
}

export function calculateSpecialPointsV2(
  lagnaSignNumber: SignNumber,
  lagnaAbsoluteLongitude: number,
  planets: PlanetPosition[],
  sunAbsoluteLongitudeAtSunrise: number,
  minutesSinceSunrise: number,
  isDayBirth: boolean,
  daytimeDurationMinutes: number,
  dayOfWeek: number,
  birthDate: Date,
  lat: number,
  lon: number,
  sunrise: Date,
  sunset: Date
): SpecialPointsResultV2 {
  // Time-based Lagnas
  const ghatiLagna = calculateGhatiLagna(sunAbsoluteLongitudeAtSunrise, minutesSinceSunrise, isDayBirth, lagnaAbsoluteLongitude);
  const bhavaLagna = calculateBhavaLagna(sunAbsoluteLongitudeAtSunrise, minutesSinceSunrise, isDayBirth, lagnaAbsoluteLongitude);
  const horaLagna  = calculateHoraLagna(sunAbsoluteLongitudeAtSunrise, minutesSinceSunrise, isDayBirth, lagnaAbsoluteLongitude);
  const pranapada  = calculatePranapada(sunAbsoluteLongitudeAtSunrise, minutesSinceSunrise, lagnaSignNumber);

  // Relationship Lagnas
  const arudhaLagna  = calculateArudhaLagna(lagnaSignNumber, planets);
  const upapadaLagna = calculateUpapadaLagna(lagnaSignNumber, planets);
  const varnadaLagna = calculateVarnadaLagna(lagnaSignNumber, 0, horaLagna.horaLagnaSignNumber);
  const moonLong     = planets.find(p => p.name === "Moon")?.siderealLongitude || 0;
  const sreeLagna    = calculateSreeLagna(lagnaAbsoluteLongitude, moonLong);

  // Karakas
  const charakarakas = calculateCharakarakas(planets);

  // Sphutas
  const beejaSphuata  = calculateBeejaSphuata(planets);
  const kshetraSphuta = calculateKshetraSphuta(planets);
  
  const kaalVelas = calculateKaalVelas(birthDate, daytimeDurationMinutes, isDayBirth, dayOfWeek, lat, lon, sunrise, sunset);
  const triSphuta = kaalVelas ? calculateTriSphuta(lagnaSignNumber, planets, kaalVelas.gulika.longitude) : null;

  const bhriguBindu = calculateBhriguBindu(planets);
  const dhoomaChain = calculateDhoomaChain(planets);

  const ishtaDevata = calculateIshtaDevata(planets, charakarakas);
  const dharmaChakra = calculateDharmaChakra(planets, charakarakas);

  return {
    ghatiLagna, bhavaLagna, horaLagna, pranapada,
    arudhaLagna, upapadaLagna, varnadaLagna, sreeLagna,
    charakarakas,
    beejaSphuata, kshetraSphuta, triSphuta, bhriguBindu,
    dhoomaChain,
    kaalVelas,
    ishtaDevata,
    dharmaChakra
  };
}

/**
 * Compute budget for a single search, in samples. Each sample runs a full
 * `calculatePositionsLite`, so this bounds how long the main thread blocks.
 * A 30-day range at the finest (5-minute) granularity needs 8641 samples
 * (inclusive of both endpoints); the headroom here keeps that an exact fit.
 */
const MUHURTA_MAX_SAMPLES = 8700;

/** Granularities the search may fall back to, coarsest-last. */
const MUHURTA_STEP_LADDER_MINUTES = [5, 10, 15, 30, 60];

/**
 * Pick the finest granularity that covers `rangeMs` within the sample budget.
 * Guarantees the whole requested range is examined rather than silently cutting it short.
 */
const chooseMuhurtaStepMinutes = (rangeMs: number): number => {
  for (const minutes of MUHURTA_STEP_LADDER_MINUTES) {
    if (Math.ceil(rangeMs / (minutes * 60 * 1000)) <= MUHURTA_MAX_SAMPLES) return minutes;
  }
  return MUHURTA_STEP_LADDER_MINUTES[MUHURTA_STEP_LADDER_MINUTES.length - 1];
};

export const findMuhurtaWindows = (
  natalPositions: PlanetPosition[],
  startDate: Date,
  endDate: Date,
  category: EventCategory,
  lat: number,
  lon: number,
  currentDasha: string
): MuhurtaSearchResult => {
  const natalAscendant = natalPositions.find(p => p.name === "Ascendant");
  const natalMoon = natalPositions.find(p => p.name === "Moon");

  // Both are required by every veto below; bail out cleanly instead of throwing on `undefined.rashi`.
  if (!natalAscendant || !natalMoon) {
    return { windows: [], stepMinutes: 0, scannedThrough: new Date(startDate), truncated: false };
  }

  const natalData: MuhurtaBaseData = {
    natalAscendant,
    natalMoon,
    natalUL: calculateUL(natalPositions),
    natalAmK: calculateAmK(natalPositions),
    currentDasha
  };

  const stepMinutes = chooseMuhurtaStepMinutes(endDate.getTime() - startDate.getTime());
  const stepMs = stepMinutes * 60 * 1000;
  const windows: MuhurtaWindow[] = [];

  let current = new Date(startDate);
  let sunriseSunset: { sunrise: Date, sunset: Date } | null = null;
  let lastDay = -1;

  // Hard safety cap. The step ladder above sizes `stepMs` so this is normally not reached;
  // it only bites on extreme custom ranges (beyond ~360 days).
  let steps = 0;
  let scannedThrough = new Date(startDate);

  while (current <= endDate && steps < MUHURTA_MAX_SAMPLES) {
    scannedThrough = new Date(current);
    if (current.getDate() !== lastDay) {
      sunriseSunset = getRiseSetInfo(current, lat, lon);
      lastDay = current.getDate();
    }

    const tPos = calculatePositionsLite(current, lat, lon);
    const tMoon = tPos.find(p => p.name === "Moon")!;
    const tAsc = tPos.find(p => p.name === "Ascendant")!;

    // Vetoes
    const tCount = getNakshatraCount(natalData.natalMoon.nakshatra, tMoon.nakshatra);
    if ([3, 5, 7].includes(tCount % 9)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    const nMIdx = RASHIS.indexOf(natalData.natalMoon.rashi);
    const tMIdx = RASHIS.indexOf(tMoon.rashi);
    if ([6, 8, 12].includes(((tMIdx - nMIdx + 12) % 12) + 1)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    const nAIdx = RASHIS.indexOf(natalData.natalAscendant.rashi);
    const tAIdx = RASHIS.indexOf(tAsc.rashi);
    if ([8, 12].includes(((tAIdx - nAIdx + 12) % 12) + 1)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    if (sunriseSunset && isRahuKaalActive(current, sunriseSunset.sunrise, sunriseSunset.sunset)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    const pan = calculatePanchang(current, tPos);
    // Universal Vetoes (Panchang)
    if (isRiktaTithiActive(pan.tithi.number)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    // Yoga Vetoes (Vyatipata=17, Vaidhriti=27)
    if ([17, 27].includes(pan.yoga.number)) {
      current = new Date(current.getTime() + stepMs);
      steps++;
      continue;
    }

    // Karana Vetoes (Vishti/Bhadra = Karana 7 if repeating, or fixed 59-60)
    if (pan.karana.name === "Vishti") {
        current = new Date(current.getTime() + stepMs);
        steps++;
        continue;
    }

    // `pan` is derived from `current`, so Vara is the candidate's weekday — not today's.
    const res = scoreMuhurtaTime(tPos, natalData, category, pan);
    // Gate on the unnormalised score so the candidate set matches the pre-normalisation behaviour.
    if (res.rawScore > 20) {
      windows.push({
        start: new Date(current),
        end: new Date(current.getTime() + stepMs),
        score: res.score,
        rawScore: res.rawScore,
        globalScore: res.globalScore,
        individualScore: res.individualScore,
        maxScore: res.maxScore,
        reasons: res.reasons,
        vargottamaLagna: res.vargottamaLagna,
        vargottamaMoon: res.vargottamaMoon,
        panchang: pan
      });
    }

    current = new Date(current.getTime() + stepMs);
    steps++;
  }

  // Consolidate contiguous blocks
  const consolidated: MuhurtaWindow[] = [];
  if (windows.length > 0) {
    let currentBlock = { ...windows[0] };
    for (let i = 1; i < windows.length; i++) {
        const w = windows[i];
        if (w.start.getTime() === currentBlock.end.getTime() && Math.abs(w.score - currentBlock.score) < 10) {
            currentBlock.end = w.end;
            currentBlock.score = Math.max(currentBlock.score, w.score);
            currentBlock.rawScore = Math.max(currentBlock.rawScore, w.rawScore);
            currentBlock.globalScore = Math.max(currentBlock.globalScore, w.globalScore);
            currentBlock.individualScore = Math.max(currentBlock.individualScore, w.individualScore);
            currentBlock.reasons = Array.from(new Set([...currentBlock.reasons, ...w.reasons]));
        } else {
            consolidated.push(currentBlock);
            currentBlock = { ...w };
        }
    }
    consolidated.push(currentBlock);
  }

  return {
    windows: consolidated.sort((a, b) => b.score - a.score).slice(0, 5),
    stepMinutes,
    scannedThrough,
    // Strict `<`: a run that stops with `current` exactly on `endDate` covered the whole range.
    truncated: steps >= MUHURTA_MAX_SAMPLES && current.getTime() < endDate.getTime(),
  };
}

export const getDashaWarning = (dasha: string): string => {
    if (dasha.includes("Saturn")) {
        return `Note: You are in a ${dasha} period. While this Muhurta is mathematically strong, Saturn requires patience and structured effort for success.`;
    } else if (dasha.includes("Rahu")) {
        return `Note: You are in a ${dasha} period. Expect unconventional outcomes; stay grounded as nodes can create illusions.`;
    } else if (dasha.includes("Mars") || dasha.includes("Sun")) {
        return `Note: You are in a ${dasha} period. Energy is high, but avoid impulsiveness and ego confrontations during this endeavor.`;
    }
    return `Note: You are currently in a ${dasha} period. This Muhurta is well-aligned with your planetary cycle.`;
};

// ─── Sudarshana Chakra ────────────────────────────────────────────────────────

export interface SudarshanaHouse {
  houseNumber: number;
  planets: PlanetPosition[];
}

export interface SudarshanaLayer {
  label: string;
  description: string;
  referencePlanet: string;
  referenceSign: string;
  referenceSignIndex: number;
  houses: Record<number, SudarshanaHouse>;
}

export interface SudarshanaChakraResult {
  lagnaChakra: SudarshanaLayer;
  chandraChakra: SudarshanaLayer;
  suryaChakra: SudarshanaLayer;
}

const SUDARSHANA_EXCLUDED = new Set(['Ascendant', 'Bhrigu Bindu']);

function buildSudarshanaLayer(
  label: string,
  description: string,
  referencePlanet: string,
  referenceSign: string,
  birthPositions: PlanetPosition[]
): SudarshanaLayer {
  const refSignIndex = RASHIS.indexOf(referenceSign);
  const houses: Record<number, SudarshanaHouse> = {};
  for (let i = 1; i <= 12; i++) {
    houses[i] = { houseNumber: i, planets: [] };
  }
  birthPositions
    .filter(p => !SUDARSHANA_EXCLUDED.has(p.name))
    .forEach(p => {
      const pSignIndex = RASHIS.indexOf(p.rashi);
      const houseNumber = ((pSignIndex - refSignIndex + 12) % 12) + 1;
      houses[houseNumber].planets.push(p);
    });
  return { label, description, referencePlanet, referenceSign, referenceSignIndex: refSignIndex, houses };
}

export const calculateSudarshanaChakra = (birthPositions: PlanetPosition[]): SudarshanaChakraResult => {
  const ascendant = birthPositions.find(p => p.name === 'Ascendant');
  const moon = birthPositions.find(p => p.name === 'Moon');
  const sun = birthPositions.find(p => p.name === 'Sun');

  if (!ascendant || !moon || !sun) {
    throw new Error('Sudarshana Chakra requires Ascendant, Moon, and Sun positions');
  }

  return {
    lagnaChakra: buildSudarshanaLayer(
      'Lagna Chakra',
      'Inner Layer — Physical life, body, personal experiences',
      'Ascendant',
      ascendant.rashi,
      birthPositions
    ),
    chandraChakra: buildSudarshanaLayer(
      'Chandra Chakra',
      'Middle Layer — Mind, emotions, mental state',
      'Moon',
      moon.rashi,
      birthPositions
    ),
    suryaChakra: buildSudarshanaLayer(
      'Surya Chakra',
      'Outer Layer — Soul, power, authority, father',
      'Sun',
      sun.rashi,
      birthPositions
    ),
  };
};
