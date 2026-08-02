const LORD_TRAITS: Record<string, string> = {
  Sun: 'authority and visibility',
  Moon: 'public sentiment and adaptability',
  Mars: 'drive and competitive edge',
  Mercury: 'communication and commerce',
  Jupiter: 'wisdom and expansion',
  Venus: 'creativity and partnership',
  Saturn: 'structure and long-term mastery',
  Rahu: 'unconventional ambition',
  Ketu: 'detachment and specialized skill',
};

const HOUSE_AREAS: Record<number, string> = {
  1: 'self-directed ventures and personal branding',
  2: 'wealth-building and resource management',
  3: 'media, sales, and short journeys',
  4: 'property, homeland ventures, and foundations',
  5: 'creative enterprise and speculative gains',
  6: 'service industries, health, and daily work',
  7: 'partnerships, clients, and public contracts',
  8: 'research, transformation, and shared resources',
  9: 'teaching, law, and long-distance enterprise',
  10: 'direct command of profession and reputation',
  11: 'networks, gains, and large-scale goals',
  12: 'foreign connections, retreat, and institutional work',
};

const LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

function buildLine(lord: string, house: number): string {
  const trait = LORD_TRAITS[lord] ?? 'career influence';
  const area = HOUSE_AREAS[house] ?? 'professional matters';
  return `Your 10th lord ${lord} in the ${house}${ordinal(house)} house channels ${trait} through ${area}.`;
}

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/** 12 lords × 12 houses — generated once, stable copy. */
const CACHE: Record<string, string> = {};
for (const lord of LORDS) {
  for (let house = 1; house <= 12; house++) {
    CACHE[`${lord}|${house}`] = buildLine(lord, house);
  }
}

export function getLordInHouseLine(lord: string, house: number): string {
  return CACHE[`${lord}|${house}`] ?? buildLine(lord, house);
}
