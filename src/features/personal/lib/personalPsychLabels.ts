import { lifeAreaForHouse } from './personalConstants';

/** Plain-language sign temperament — derived from traditional sign qualities, no chart jargon. */
export const SIGN_STYLE: Record<string, string> = {
  Aries: 'direct, pioneering, and action-oriented',
  Taurus: 'steady, grounded, and value-focused',
  Gemini: 'curious, communicative, and mentally agile',
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

export const ELEMENT_STYLE: Record<string, string> = {
  Fire: 'energetic, direct, and action-oriented',
  Earth: 'grounded, practical, and steady',
  Air: 'curious, communicative, and mentally agile',
  Water: 'sensitive, intuitive, and emotionally attuned',
};

/** Energy baseline without Sanskrit guna labels. */
export const ENERGY_BASELINE: Record<string, string> = {
  Sattva: 'a calm, clarity-seeking baseline',
  Rajas: 'a restless, achievement-driven baseline',
  Tamas: 'a slow-to-start but deeply persistent baseline',
};

/** Jung-inspired psychological functions mapped from traditional planetary significations. */
export const PSYCH_FUNCTION: Record<string, string> = {
  Sun: 'conscious identity and vitality',
  Moon: 'emotional body and attachment patterns',
  Mars: 'assertion, drive, and boundary-setting',
  Mercury: 'thinking, communication, and adaptation',
  Jupiter: 'meaning-making, faith, and expansion',
  Venus: 'relating, values, and pleasure',
  Saturn: 'the inner hard teacher — structure, fear, and mastery through time and limits',
  Rahu: 'compulsive ambition and the pull toward the unfamiliar',
  Ketu: 'release, detachment, and what must be surrendered',
};

/** Life-chapter themes for major/minor timing periods — no planet names in UI. */
export const CHAPTER_THEME: Record<string, string> = {
  Sun: 'visibility, confidence, and purposeful self-expression',
  Moon: 'emotional processing, belonging, and inner security',
  Mars: 'drive, conflict, and decisive action',
  Mercury: 'communication, learning, and mental agility',
  Jupiter: 'expansion, wisdom, and long-range growth',
  Venus: 'relationships, pleasure, and values',
  Saturn: 'the inner hard teacher — limits, accountability, and mastery earned slowly',
  Rahu: 'restless ambition and the pull toward the unfamiliar',
  Ketu: 'release, introspection, and letting go',
};

/** Elaborated life-chapter narrative for timing panels — never uses planet names. */
export const CHAPTER_THEME_LONG: Record<string, string> = {
  Sun: 'A chapter of visibility and purposeful self-expression — stepping into leadership, confidence, and owning what you contribute to the world.',
  Moon: 'A chapter of emotional processing and belonging — home, security, and learning to meet your needs without abandoning yourself or others.',
  Mars: 'A chapter of drive and decisive action — courage, boundaries, and learning to channel anger and ambition without burning bridges.',
  Mercury: 'A chapter of communication and mental agility — learning, adaptation, and sharpening how you think, speak, and negotiate daily life.',
  Jupiter: 'A chapter of expansion and long-range growth — wisdom, faith, and widening your sense of what is possible through teachers and experience.',
  Venus: 'A chapter of relationships and values — pleasure, partnership, and clarifying what you truly want to give and receive.',
  Saturn:
    'The hard teacher — a long chapter of patience, accountability, and building mastery through limits; progress may feel slow, but what you earn here tends to last.',
  Rahu: 'A chapter of ambition and disruption — unconventional pulls, risk, and growth through territory that feels unfamiliar or unsettling.',
  Ketu: 'A chapter of release and introspection — letting go of over-identification with what no longer serves, and finding meaning in simplicity.',
};

/** Elaborated year-focus narrative keyed by life domain (house). */
export const LIFE_AREA_YEAR_FOCUS: Record<number, string> = {
  1: 'Self-image, vitality, and how you present — this year trains identity, body awareness, and the courage to show up as yourself.',
  2: 'Resources, voice, and belonging — this year focuses on money, family, speech, and what you need to feel materially and emotionally secure.',
  3: 'Effort, courage, and communication — this year highlights initiative, sibling dynamics, and the daily grit of putting yourself out there.',
  4: 'Home, roots, and inner peace — this year asks you to stabilize emotional foundations, private life, and where you feel safe.',
  5: 'Creativity, joy, and self-expression — this year emphasizes play, romance, learning, and the projects that make you feel alive.',
  6: 'Daily friction, health, and service — this year spotlights stress, obligation, routines, and how you handle conflict without losing yourself.',
  7: 'Partnership and the other — this year trains commitment, negotiation, and how you balance your needs with someone else\'s.',
  8: 'Transformation and the hidden — this year brings depth work, shared resources, and change that cannot stay on the surface.',
  9: 'Meaning, belief, and guidance — this year pulls you toward mentors, worldview, and the bigger story you tell about your life.',
  10: 'Career and public action — this year focuses on reputation, responsibility, and how you are seen in the world.',
  11: 'Networks, gains, and aspirations — this year emphasizes friends, income, and the future you are building toward.',
  12: 'Rest, retreat, and the subconscious — this year favors solitude, endings, and clearing what no longer belongs in your life.',
};

/** Short coaching label for activated domain lists (first segment of life area → readable phrase). */
const ACTIVATED_AREA_LABEL: Record<string, string> = {
  Self: 'identity and vitality',
  Wealth: 'resources and security',
  Courage: 'initiative and communication',
  Home: 'roots and inner peace',
  Creativity: 'joy and self-expression',
  Conflict: 'stress, health, and boundaries',
  Partnership: 'committing and relating',
  Transformation: 'depth change and shared resources',
  Meaning: 'belief and life direction',
  Career: 'public role and responsibility',
  Gains: 'networks and aspirations',
  Loss: 'rest, endings, and inner clearing',
};

export function signStyle(sign: string): string {
  return SIGN_STYLE[sign] ?? 'distinctive and hard to categorize at first glance';
}

export function chapterTheme(planet: string): string {
  return CHAPTER_THEME[planet] ?? 'general life development and integration';
}

export function chapterThemeLong(planet: string): string {
  return CHAPTER_THEME_LONG[planet] ?? CHAPTER_THEME[planet] ?? 'A chapter of general life development and integration.';
}

export function lifeAreaYearFocus(house: number): string {
  return LIFE_AREA_YEAR_FOCUS[house] ?? `Life domain ${house} — themes of growth and integration are active this year.`;
}

export function activatedAreaLabel(lifeArea: string): string {
  const head = lifeArea.split(',')[0].trim();
  return ACTIVATED_AREA_LABEL[head] ?? head.toLowerCase();
}

export function psychFunction(planet: string): string {
  return PSYCH_FUNCTION[planet] ?? 'a recurring inner pattern';
}

export function lifeAreaShort(house: number): string {
  return lifeAreaForHouse(house).split(',')[0].toLowerCase();
}

export function strengthLabel(reason: 'exalted' | 'own' | 'mooltrikona' | 'vargottama'): string {
  switch (reason) {
    case 'exalted':
      return 'exceptional natural capacity that holds under pressure';
    case 'own':
      return 'self-assured competence in a core life domain';
    case 'mooltrikona':
      return 'focused mastery you can rely on when stakes are high';
    case 'vargottama':
      return 'public and private self align here — unshakeable dignity';
  }
}

export function blindSpotLabel(reason: 'debilitated' | 'combust' | 'retrograde' | 'dusthana'): string {
  switch (reason) {
    case 'debilitated':
      return 'self-doubt that surfaces under pressure';
    case 'combust':
      return 'ego overshadowing clear judgment';
    case 'retrograde':
      return 'internalized processing that delays outward action';
    case 'dusthana':
      return 'stress patterns tied to conflict, loss, or hidden material';
  }
}

export function alignmentNarrative(alignment: 'aligned' | 'tension' | 'mixed'): string {
  switch (alignment) {
    case 'aligned':
      return 'Your outer presentation, emotional needs, and core drive generally pull together — what people see matches what you feel inside.';
    case 'tension':
      return 'Real tension exists between how you present, what you feel, and what drives you — integration work matters more than forcing one single story.';
    case 'mixed':
      return 'Two of your three inner layers agree; the third adds nuance rather than outright contradiction.';
  }
}

export function triangulationLayerLabel(ring: 'lagna' | 'chandra' | 'surya'): string {
  switch (ring) {
    case 'lagna':
      return 'Body & behavior';
    case 'chandra':
      return 'Mind & emotion';
    case 'surya':
      return 'Purpose & will';
  }
}

export function agreementNarrative(agreement: 'strength' | 'affliction' | 'mixed' | 'neutral'): string {
  switch (agreement) {
    case 'strength':
      return 'genuine, load-bearing strength';
    case 'affliction':
      return 'a recurring blind spot worth conscious attention';
    case 'mixed':
      return 'mixed signals — both gift and friction';
    case 'neutral':
      return 'neutral baseline — neither a standout gift nor a recurring friction point';
  }
}
