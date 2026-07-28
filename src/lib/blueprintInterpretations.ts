import { getPlanetInHouseInterpretation, RASHIS } from '../vedic-utils';
import type { MuhurtaSearchResult } from '../vedic-utils';

export type KarakaKey = 'AK' | 'AmK' | 'BK' | 'MK' | 'PiK' | 'PuK' | 'GK' | 'DK';

const SIGN_ESSENCE: Record<string, string> = {
  Aries: 'direct, pioneering, and action-oriented',
  Taurus: 'steady, grounded, and value-focused',
  Gemini: 'curious, communicative, and adaptable',
  Cancer: 'nurturing, protective, and emotionally attuned',
  Leo: 'confident, expressive, and heart-centered',
  Virgo: 'analytical, refining, and service-minded',
  Libra: 'harmonizing, relational, and aesthetic',
  Scorpio: 'intense, transformative, and deeply perceptive',
  Sagittarius: 'expansive, philosophical, and freedom-seeking',
  Capricorn: 'disciplined, ambitious, and structure-building',
  Aquarius: 'innovative, humanitarian, and unconventional',
  Pisces: 'intuitive, compassionate, and spiritually receptive',
};

export const KARAKA_DEFINITIONS: Record<KarakaKey, string> = {
  AK: 'Atmakaraka is the planet with the highest degree in your chart — your soul indicator. It reveals the core lesson your spirit came to master and the inner nature you are meant to develop.',
  AmK: 'Amatyakaraka is the planet with the second-highest degree. It governs career, advisors, and how you organize resources in the material world.',
  BK: 'Bhratrukaraka represents siblings, peers, courage, and your immediate social circle — how you relate to equals around you.',
  MK: 'Matrukaraka reflects the mother, emotional roots, inner happiness, and the nurturing foundation of your life.',
  PiK: 'Pitrukaraka shows the father, authority figures, tradition, and the legacy or discipline passed down to you.',
  PuK: 'Putrakaraka governs creativity, children, intelligence, and the knowledge or projects you bring into the world.',
  GK: 'Gnatikaraka marks karmic tests, rivals, disease tendencies, and the obstacles that sharpen your character.',
  DK: 'Darakaraka is the planet with the lowest degree among the seven chara karakas. It describes partnership patterns and the qualities you seek in a spouse.',
};

export const KARAKA_PLANET_INTERPRETATIONS: Record<KarakaKey, Record<string, string>> = {
  AK: {
    Sun: 'Your soul work centers on leadership, integrity, and learning to shine without ego.',
    Moon: 'Your path unfolds through emotional maturity, empathy, and caring for others.',
    Mars: 'You grow through courage, disciplined action, and mastering raw energy.',
    Mercury: 'Your calling involves learning, communication, and intellectual adaptability.',
    Jupiter: 'Wisdom, teaching, and ethical expansion are the heart of your soul journey.',
    Venus: 'Harmony, devotion, and creative beauty guide your inner evolution.',
    Saturn: 'Patience, responsibility, and selfless service define your deepest lesson.',
    Rahu: 'An unconventional path — breaking old patterns and embracing innovation.',
    Ketu: 'Liberation through detachment, introspection, and spiritual insight.',
  },
  AmK: {
    Sun: 'Career success flows through leadership, administration, and visible authority.',
    Moon: 'Professional fulfillment comes via public connection, care, or creative commerce.',
    Mars: 'You excel in technical, competitive, or action-driven fields.',
    Mercury: 'Communication, strategy, writing, and analytical work suit you.',
    Jupiter: 'Counseling, teaching, finance, or advisory roles bring prosperity.',
    Venus: 'Arts, luxury, diplomacy, and relationship-based work thrive.',
    Saturn: 'Long-term structure, law, industry, or disciplined craft builds success.',
    Rahu: 'Technology, foreign trade, or disruptive innovation opens doors.',
    Ketu: 'Research, spirituality, or specialized niche expertise defines your path.',
  },
  BK: {
    Sun: 'Sibling bonds may involve pride, leadership dynamics, or mutual respect for authority.',
    Moon: 'Emotional closeness with siblings; nurturing or protective peer relationships.',
    Mars: 'Competitive but energizing bonds with brothers, peers, or teammates.',
    Mercury: 'Intellectual rapport with siblings; shared learning and lively exchange.',
    Jupiter: 'Supportive, guiding relationships with siblings or close friends.',
    Venus: 'Harmonious, affectionate bonds with peers and cooperative alliances.',
    Saturn: 'Serious or duty-bound sibling ties; maturity through peer responsibility.',
    Rahu: 'Unusual or distant sibling connections; peers from diverse backgrounds.',
    Ketu: 'Detached or spiritually oriented sibling bonds; fewer but deep ties.',
  },
  MK: {
    Sun: 'Strong maternal influence; happiness tied to confidence and self-expression.',
    Moon: 'Deep emotional bond with mother; inner peace through nurturing environments.',
    Mars: 'Protective maternal energy; happiness through active, assertive care.',
    Mercury: 'Intellectual mother figure; joy through learning and mental stimulation.',
    Jupiter: 'Wise, generous maternal influence; happiness through wisdom and faith.',
    Venus: 'Affectionate, artistic maternal bond; comfort through beauty and harmony.',
    Saturn: 'Responsible or disciplined mother; happiness earned through patience.',
    Rahu: 'Unconventional maternal figure; roots shaped by change or foreign influence.',
    Ketu: 'Spiritual or detached maternal bond; inner peace through solitude.',
  },
  PiK: {
    Sun: 'Authoritative father figure; legacy of confidence and personal standards.',
    Moon: 'Emotionally present father; tradition passed through care and feeling.',
    Mars: 'Disciplined or courageous father; legacy of action and protection.',
    Mercury: 'Intellectual father; tradition of learning, trade, or communication.',
    Jupiter: 'Wise, principled father; guidance through ethics and expansion.',
    Venus: 'Affectionate father; legacy of harmony, values, and refinement.',
    Saturn: 'Strict or hardworking father; discipline and duty as the inheritance.',
    Rahu: 'Unconventional father figure; authority shaped by modern or foreign ideas.',
    Ketu: 'Spiritual or absent father archetype; legacy of detachment and insight.',
  },
  PuK: {
    Sun: 'Creative expression through leadership; children or projects carry your vision.',
    Moon: 'Nurturing creativity; intelligence expressed through emotion and intuition.',
    Mars: 'Bold creative drive; technical skill and passion in what you produce.',
    Mercury: 'Quick, versatile intelligence; creative work through writing or commerce.',
    Jupiter: 'Expansive creativity; teaching, mentoring, or guiding others as output.',
    Venus: 'Artistic gifts; creativity through beauty, relationships, or design.',
    Saturn: 'Disciplined creativity; mastery through patience and structured effort.',
    Rahu: 'Innovative or unconventional creative output; breakthrough ideas.',
    Ketu: 'Abstract or spiritual creativity; specialized, introspective knowledge.',
  },
  GK: {
    Sun: 'Tests around ego, authority conflicts, or challenges from dominant figures.',
    Moon: 'Emotional turbulence, mood-related obstacles, or family friction.',
    Mars: 'Accidents, anger, rivalry, or conflicts requiring courage to resolve.',
    Mercury: 'Miscommunication, nervous strain, or intellectual rivalry.',
    Jupiter: 'Lessons through overconfidence, legal matters, or misplaced trust.',
    Venus: 'Relationship tests, indulgence, or complications in pleasure and comfort.',
    Saturn: 'Heavy karmic burdens, delays, chronic pressure, or isolation.',
    Rahu: 'Sudden upheavals, obsession, or conflicts with unconventional people.',
    Ketu: 'Sudden losses, confusion, or spiritual crises that strip attachments.',
  },
  DK: {
    Sun: 'Partner may be confident, authoritative, or career-focused.',
    Moon: 'Spouse brings emotional warmth, nurturing, or changeable moods.',
    Mars: 'Partner is energetic, assertive, or passionate; dynamic relationship.',
    Mercury: 'Intellectual, communicative partner; witty and adaptable bond.',
    Jupiter: 'Wise, generous spouse; marriage expands your worldview.',
    Venus: 'Harmonious, attractive partner; love and beauty central to union.',
    Saturn: 'Mature, responsible spouse; partnership built on commitment.',
    Rahu: 'Unconventional partner; foreign, modern, or unpredictable union.',
    Ketu: 'Spiritual or detached partner; marriage teaches letting go.',
  },
};

// Shared with Cosmic Report — Ishta & Dharma keys
export const ISHTA_PLANET_INTERPRETATIONS: Record<string, string> = {
  Sun: 'Seek grace through truth, clarity, and inner radiance (Solar/Shiva energy).',
  Moon: 'Find protection through devotion, nurturing, and emotional balance.',
  Mars: 'Draw strength from courage, discipline, and righteous action.',
  Mercury: 'Spiritual progress through knowledge, speech, and mindful learning.',
  Jupiter: 'Wisdom and ethical expansion serve as your spiritual shield.',
  Venus: 'Devotion through beauty, harmony, and heartfelt connection.',
  Saturn: 'Protection through patience, service, and accepting life\'s limits.',
  Rahu: 'Break illusions through fierce inner transformation.',
  Ketu: 'Liberation through detachment, insight, and intuitive knowing.',
};

export const DHARMA_PLANET_INTERPRETATIONS: Record<string, string> = {
  Sun: 'Duty expressed through leadership, integrity, and maintaining order.',
  Moon: 'Ethical path centered on care, emotional stability, and public service.',
  Mars: 'Dharma fulfilled through protection, courage, and decisive action.',
  Mercury: 'Moral duty involves knowledge-sharing, fair exchange, and diplomacy.',
  Jupiter: 'Purpose found in teaching, upholding tradition, and guiding others.',
  Venus: 'Ethical mission through harmony, creativity, and balanced relationships.',
  Saturn: 'Duty to community, hard work, and sustaining long-term structures.',
  Rahu: 'Dharma involves innovation and expanding beyond old boundaries.',
  Ketu: 'Moral path focused on research, spirituality, and inner truth.',
};

export const LAGNA_DEFINITIONS: Record<string, string> = {
  'Ghati Lagna': 'Ghati Lagna (Ghatika Lagna) is a time-based ascendant showing power, status, and how authority manifests in your life.',
  'Hora Lagna': 'Hora Lagna is a wealth indicator derived from the Sun\'s position — it reveals financial potential and prosperity patterns.',
  'Bhava Lagna': 'Bhava Lagna marks the physical body, vitality, and the tangible circumstances you navigate daily.',
  'Pranapada Lagna': 'Pranapada Lagna (also called Prana Lagna) reflects the auspiciousness of birth and overall life vitality.',
  'Sree Lagna': 'Sree Lagna is a prosperity point linked to Lakshmi — it shows cumulative wealth and abundance potential.',
  'Arudha Lagna': 'Arudha Lagna (AL) is your public image — how the world perceives you, distinct from your inner self.',
  'Upapada Lagna': 'Upapada Lagna (UL) is the mirror of marriage — it describes partnership quality and spouse characteristics.',
  '2nd from Upapada Lagna': 'The 2nd house from Upapada Lagna shows family after marriage, speech in partnership, and sustained marital resources.',
  Gulika: 'Gulika is a severe upagraha (sub-planet) marking deep karmic entanglement wherever it falls in the chart.',
  Maandi: 'Maandi is the midpoint of Saturn\'s day/night portion — a potent secondary malefic highlighting karmic pressure points.',
  'Beeja Sphuta': 'Beeja Sphuta (male seed) measures creative and procreative vitality from the solar side of fertility.',
  'Ksheetra Sphuta': 'Kshetra Sphuta (female field) measures receptivity and nurturing potential from the lunar side of fertility.',
  'Bhrigu Bindu': 'Bhrigu Bindu is the sensitive midpoint of Moon and Rahu — a destiny hub where karmic events concentrate.',
  Dhooma: 'Dhooma is a shadow point derived from the Sun — fiery, obstructive karma tied to ego and vitality.',
  Vyatipata: 'Vyatipata is a reversal point in the Dhooma chain — sudden misfortune or unexpected reversals.',
  Parivesha: 'Parivesha sits in the eclipse axis of the chain — hidden forces and obscured influences at work.',
  'Indra Chapa': 'Indra Chapa (Indra\'s Bow) is a celestial weapon point — ambition, pride, and divine tests of power.',
  Upaketu: 'Upaketu marks dissolution in the chain — endings, release, and clearing of old karmic residue.',
};

const LAGNA_SIGN_CONTEXT: Record<string, string> = {
  'Ghati Lagna': 'Authority and influence express themselves in a way that is',
  'Hora Lagna': 'Wealth and financial growth tend to unfold in a manner that is',
  'Bhava Lagna': 'Your physical vitality and life circumstances feel',
  'Pranapada Lagna': 'Your birth auspiciousness and life force resonate as',
  'Sree Lagna': 'Cumulative prosperity and abundance flow through channels that are',
  'Arudha Lagna': 'The world sees you as someone who is',
  'Upapada Lagna': 'Partnership and marriage themes unfold in a way that is',
  '2nd from Upapada Lagna': 'Marital family life and shared resources feel',
  Gulika: 'Karmic entanglements and hidden burdens manifest in areas that are',
  Maandi: 'Persistent karmic pressure concentrates where life feels',
  'Beeja Sphuta': 'Creative and procreative vitality expresses itself as',
  'Ksheetra Sphuta': 'Receptive and nurturing potential shows up as',
  'Bhrigu Bindu': 'Destiny events and karmic turning points tend to arise in contexts that are',
  Dhooma: 'Obstructive karma related to ego and power feels',
  Vyatipata: 'Sudden reversals and unexpected challenges emerge where life is',
  Parivesha: 'Hidden or eclipse-like influences operate in spheres that are',
  'Indra Chapa': 'Tests of ambition and pride activate in areas that are',
  Upaketu: 'Karmic dissolution and release happen through experiences that are',
};

function signName(signNumber: number): string {
  return RASHIS[signNumber - 1] ?? 'Unknown';
}

function houseFromSign(signNumber: number, ascSignNumber: number): number {
  return ((signNumber - ascSignNumber + 12) % 12) + 1;
}

function placementLine(signNumber: number, ascSignNumber?: number, planet?: string): string {
  const sign = signName(signNumber);
  const essence = SIGN_ESSENCE[sign] ?? 'distinctive and unique';
  let line = `Placed in ${sign}, this energy is ${essence}.`;

  if (planet && ascSignNumber) {
    const house = houseFromSign(signNumber, ascSignNumber);
    const houseNote = getPlanetInHouseInterpretation(planet, house);
    line += ` In your ${ordinal(house)} house: ${houseNote}`;
  } else if (ascSignNumber) {
    const house = houseFromSign(signNumber, ascSignNumber);
    line += ` This falls in your ${ordinal(house)} house from the Ascendant.`;
  }

  return line;
}

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function getKarakaInterpretation(
  key: KarakaKey,
  planet: string,
  signNumber: number,
  ascSignNumber?: number,
): string {
  const planetNote = KARAKA_PLANET_INTERPRETATIONS[key][planet]
    ?? `As ${planet}, this karaka expresses through the planet's natural qualities.`;
  return `${planetNote} ${placementLine(signNumber, ascSignNumber, planet)}`;
}

export function getLagnaInterpretation(
  lagnaName: string,
  signNumber: number,
  ascSignNumber?: number,
): string {
  const context = LAGNA_SIGN_CONTEXT[lagnaName] ?? 'This point manifests in a way that is';
  const sign = signName(signNumber);
  const essence = SIGN_ESSENCE[sign] ?? 'distinctive';
  let text = `${context} ${essence}.`;

  if (ascSignNumber) {
    const house = houseFromSign(signNumber, ascSignNumber);
    text += ` It occupies your ${ordinal(house)} house, coloring that area of life with its themes.`;
  }

  return text;
}

export function getSphutaInterpretation(
  name: 'Beeja Sphuta' | 'Ksheetra Sphuta',
  signNumber: number,
  isAuspicious: boolean,
  ascSignNumber?: number,
): string {
  const strength = isAuspicious
    ? 'This placement is considered strong — creative and fertile potential flows more easily.'
    : 'This placement is moderate — conscious effort helps unlock its full creative potential.';
  return `${getLagnaInterpretation(name, signNumber, ascSignNumber)} ${strength}`;
}

export function getDhoomaInterpretation(
  pointName: keyof typeof LAGNA_DEFINITIONS,
  signNumber: number,
  ascSignNumber?: number,
): string {
  return getLagnaInterpretation(pointName, signNumber, ascSignNumber);
}

export function getIshtaInterpretation(
  planet: string,
  signNumber: number,
  ascSignNumber?: number,
): string {
  const planetNote = ISHTA_PLANET_INTERPRETATIONS[planet]
    ?? 'Your spiritual protector guides through this planet\'s natural qualities.';
  return `${planetNote} ${placementLine(signNumber, ascSignNumber, planet)}`;
}

export function getDharmaInterpretation(
  planet: string,
  signNumber: number,
  ascSignNumber?: number,
): string {
  const planetNote = DHARMA_PLANET_INTERPRETATIONS[planet]
    ?? 'Your dharma expresses through this planet\'s natural significations.';
  return `${planetNote} ${placementLine(signNumber, ascSignNumber, planet)}`;
}

/** Legacy export shape for CosmicReport */
export const KARAKA_INTERPRETATIONS = {
  AK: KARAKA_PLANET_INTERPRETATIONS.AK,
  AmK: KARAKA_PLANET_INTERPRETATIONS.AmK,
  Ishta: ISHTA_PLANET_INTERPRETATIONS,
  Dharma: DHARMA_PLANET_INTERPRETATIONS,
};

/** Educational copy for the Muhurta (electional astrology) feature. */
export const MUHURTA_OVERVIEW =
  'Muhurta is electional astrology — selecting the most auspicious moment to begin an activity. The chart cast for the exact inception moment acts as the birth chart of that event, shaping its success and obstacles.';

export const MUHURTA_PANCHANGA_COPY = {
  tithi: 'Tithi (lunar day) reflects the Sun–Moon angle. Nanda, Bhadra, Jaya, and Purna groups are constructive; Rikta tithis (4th, 9th, 14th) are avoided for new beginnings.',
  vaara: 'Vaara (weekday) carries planetary tone. Sunday through Friday are generally benefic; Tuesday and Saturday are reserved unless the work aligns with Mars or Saturn.',
  nakshatra: 'Nakshatra quality matters: Sthira (fixed) for building, Chara (movable) for travel, Mridu (gentle) for marriage, Kshipra (swift) for trade and medicine.',
  yoga: 'The 27 sol-lunar Yogas modulate the day. Siddhi, Sukarma, Shubha, and Brahma are favored; Vishkumbha, Atiganda, Vyaghata, Vyatipata, and Vaidhriti are avoided.',
  karana: 'Karana is half a tithi. Vishti (Bhadra) karana causes obstruction and is strictly avoided for new ventures.',
};

export const MUHURTA_PERSONAL_COPY = {
  tarabala: 'Tarabala counts from your birth nakshatra to the Muhurta Moon nakshatra (mod 9). Janma, Vipat, Pratyak, and Naidhana are rejected; Sampat, Kshema, Sadhana, Mitra, and Parama Mitra are welcomed.',
  chandrabala: 'Chandrabala measures the Muhurta Moon from your natal Moon sign. Positions 1, 3, 6, 7, 10, and 11 are favorable; 4, 8, and 12 are rejected; 2, 5, and 9 are neutral if Tarabala is strong.',
  dasha: 'Your active Mahadasha sets the backdrop. Benefic dasha lords amplify a good Muhurta; challenging periods demand an exceptionally fortified Muhurta Lagna.',
};

export const MUHURTA_LAGNA_COPY =
  'The Muhurta Lagna (hour chart) must have a strong, unafflicted Lagna lord and a completely vacant 8th house (Ashtama Shuddhi). Event houses are aligned: 10th/11th for career, 7th/Venus for marriage, 4th/Mars–Jupiter for property.';

export const MUHURTA_TRANSIT_COPY =
  'Gochara (transits) are checked against your natal chart: benefics in 1, 5, 9, or 11 from Moon or Lagna add grace; malefic afflictions to natal Lagna lord, Moon, or dasha lord are rejected.';

export const MUHURTA_ENGINE_NOTE =
  'Four-tier funnel: (1) Day — eclipse, Sankranti, Tithi, Yoga, Karana, Vaara at sunrise; (2) Per-sample — Tarabala & Chandrabala at each candidate Moon; (3) Hour — Ashtama Shuddhi (no malefics in the Muhurta 8th as Lagna rotates); (4) Minute — Lagna lord dignity/combustion, tight-degree malefic hits (±5°), and weighted scoring. If no windows appear in a short range, the search auto-expands up to 180 days. Broad sign aspects deduct points; benefic dasha or Jupiter/Venus Gochara can buffer transit pressure.';

/** User-facing explanation when a Muhurta search returns no windows. */
export function getMuhurtaEmptyMessage(search: MuhurtaSearchResult): string {
  if (search.emptyReason === 'missing_natal_data') {
    return 'Birth time and place are required to calculate Muhurta (natal Ascendant missing). Enter your birth city in the Natal tab and try again.';
  }
  if (search.emptyReason === 'invalid_range') {
    return 'The end date must be after the start date. Adjust your custom range and recalculate.';
  }

  const stats = search.funnelStats;
  if (!stats) {
    return 'No windows passed all electional filters in this range. Try a longer window (60+ days) or a different event category.';
  }

  const vetoTotal =
    stats.rejected.lagnaClash +
    stats.rejected.ashtama +
    stats.rejected.lagnaLordVeto +
    stats.rejected.natalMaleficVeto;

  return `${stats.daysTier1Pass} of ${stats.daysScanned} days passed Panchanga filters; ${stats.daysTier2Pass} had at least one favorable Tarabala/Chandrabala slot. ${vetoTotal} time slots were blocked by Lagna clash, Ashtama Shuddhi, or transit vetoes. Try expanding to 60+ days or switching category.`;
}
