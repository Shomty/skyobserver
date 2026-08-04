import type { PersonalReading } from './personalReading';
import { lifeAreaForHouse } from './personalConstants';

export type PremiumTier = 'free' | 'premium';

export interface ParashariSection {
  id: 'personality' | 'd9' | 'mission' | 'shadow' | 'sudarshana' | 'dasha';
  tier: PremiumTier;
  title: string;
  subtitle: string;
  teaser: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ParashariAnalysis {
  sections: ParashariSection[];
}

function personalitySection(reading: PersonalReading): ParashariSection {
  const { lagna, moon, sun, alignment, strengths, blindSpots } = reading.personality;
  const paragraphs = [
    `Your Ascendant in ${lagna.sign} (${lagna.element}, ${lagna.guna} guna) shapes how you meet the world physically. Lagna lord ${lagna.lord} in the ${lagna.lordHouse} house orients identity around ${lifeAreaForHouse(lagna.lordHouse).toLowerCase()}.`,
    `Moon in ${moon.sign} (house ${moon.house}, ${moon.nakshatra ?? '—'} nakshatra) governs emotional needs and instinctual reactions. Sun in ${sun.sign} (house ${sun.house}) carries vitality, ego, and soul-purpose expression.`,
    alignment === 'aligned'
      ? 'Lagna, Moon, and Sun share compatible tones — outer presentation, emotional world, and core vitality pull together.'
      : alignment === 'tension'
        ? 'Lagna, Moon, and Sun sit in distinct signs — the Personality Wheel shows real inner/outer tension to integrate rather than force into one story.'
        : 'Two of the three Personality Wheel layers agree; the third adds nuance rather than contradiction.',
  ];

  const bullets: string[] = [];
  if (strengths.length > 0) {
    bullets.push(
      ...strengths.slice(0, 4).map((s) => `${s.planet}: ${s.reason} (house ${s.house})`),
    );
  }
  if (blindSpots.length > 0) {
    bullets.push(
      ...blindSpots.slice(0, 3).map((b) => `${b.planet}: ${b.reasons.join(', ')} (house ${b.house})`),
    );
  }

  return {
    id: 'personality',
    tier: 'free',
    title: 'Personality Wheel',
    subtitle: 'D1 · Lagna, Moon, Sun triad',
    teaser: `${lagna.sign} rising · Moon ${moon.sign} · Sun ${sun.sign}`,
    paragraphs,
    bullets: bullets.length > 0 ? bullets : undefined,
  };
}

function d9Section(reading: PersonalReading): ParashariSection {
  const { vargottama, strengthChecks, relationship } = reading.d9;
  const paragraphs = [
    vargottama.length > 0
      ? `Vargottama planets (${vargottama.join(', ')}) hold identical signs in D1 and D9 — extraordinary resilience and unshakeable dignity in those themes.`
      : 'No Vargottama planets in this chart — inner strength must be built through conscious practice rather than default grace.',
    `Upapada Lagna in ${relationship.upapada.sign} (house ${relationship.upapada.house}) carries ${relationship.upapada.netInfluence} influence for marriage and long-term union.`,
    `D9 7th house in ${relationship.d9Seventh.sign} — lord ${relationship.d9Seventh.lord}${relationship.d9Seventh.lordHouse ? ` in house ${relationship.d9Seventh.lordHouse}` : ''} describes the spouse's enduring nature.`,
  ];

  const hidden = strengthChecks.find((s) => s.verdict === 'hidden-weakness');
  if (hidden) {
    paragraphs.push(
      `${hidden.planet} as ${hidden.role} shows visible D1 promise with weaker D9 delivery — build inner capacity before expecting outer recognition in that area.`,
    );
  }

  return {
    id: 'd9',
    tier: 'premium',
    title: 'Inner Self & Marital Destiny',
    subtitle: 'D9 Navamsha · Upapada Lagna',
    teaser: `UL ${relationship.upapada.sign} · D9 7th ${relationship.d9Seventh.sign}`,
    paragraphs,
    bullets: strengthChecks.map((s) => `${s.planet} (${s.role}): ${s.verdict}`),
  };
}

function missionSection(reading: PersonalReading): ParashariSection {
  const { atmakaraka, ninthHouse, rahuKetu } = reading.lifeMission;
  const paragraphs = [
    atmakaraka
      ? `Atmakaraka ${atmakaraka.planet} in ${atmakaraka.sign} (house ${atmakaraka.house}${atmakaraka.d9Sign ? `; D9 ${atmakaraka.d9Sign}${atmakaraka.d9Dignity ? `, ${atmakaraka.d9Dignity}` : ''}` : ''}) marks the soul's core lesson — the drive you are here to work through, by traditional Jaimini convention.`
      : 'Atmakaraka could not be resolved — life-mission read relies more on the 9th house and nodes.',
    `9th house (dharma) in ${ninthHouse.sign} — lord ${ninthHouse.lord} in house ${ninthHouse.lordHouse} points to how belief, teachers, and fortune enter your story.`,
    `Rahu in the ${rahuKetu.rahu.house} house pulls growth toward ${lifeAreaForHouse(rahuKetu.rahu.house).toLowerCase()}; Ketu in the ${rahuKetu.ketu.house} house marks what is already familiar and may be over-relied upon.`,
  ];

  return {
    id: 'mission',
    tier: 'premium',
    title: 'Life Mission',
    subtitle: 'Atmakaraka · 9th house · Rahu–Ketu axis',
    teaser: atmakaraka ? `AK ${atmakaraka.planet} · Rahu house ${rahuKetu.rahu.house}` : `Rahu house ${rahuKetu.rahu.house}`,
    paragraphs,
  };
}

function shadowSection(reading: PersonalReading): ParashariSection {
  const { dusthanaAfflictions, dusthanaAspectAfflictions, saturn, karmic } = reading.shadow;
  const paragraphs = [
    dusthanaAfflictions.length > 0
      ? `Key identity planets in dusthana houses: ${dusthanaAfflictions.map((d) => `${d.planet} (${d.role}, house ${d.house})`).join('; ')} — shadow material tied to those themes.`
      : 'No Lagna lord, Moon, Sun, or AK sits in a dusthana — shadow work is present but not concentrated on the core triad.',
    dusthanaAspectAfflictions.length > 0
      ? `Dusthana pressure reaches key planets via aspect: ${dusthanaAspectAfflictions.map((a) => `${a.planet} aspected from house ${a.fromDusthana} by ${a.aspectedBy}`).join('; ')}.`
      : null,
    saturn.house
      ? `Saturn in house ${saturn.house} marks where fear, restriction, and eventual mastery concentrate${saturn.aspectedHouses.length ? ` — aspects houses ${saturn.aspectedHouses.join(', ')}` : ''}.`
      : 'Saturn placement unavailable.',
  ];

  if (karmic.length > 0) {
    paragraphs.push(
      ...karmic.map(
        (k) =>
          `${k.point} (${k.chart}) in house ${k.house} touches ${k.afflicts.join(', ')} — karmic knots where patience and inner work matter more than outward striving.`,
      ),
    );
  }

  return {
    id: 'shadow',
    tier: 'premium',
    title: 'Shadow Work',
    subtitle: 'Dusthanas · Saturn · Gulika/Maandi',
    teaser: karmic.length > 0 ? `${karmic.length} upagraha knot(s) detected` : 'Core triad largely clear of dusthana placement',
    paragraphs: paragraphs.filter((p): p is string => Boolean(p)),
  };
}

function ringDetailSummary(detail: { lord: string; occupants: string[]; aspecting: string[]; influence: string }): string {
  const parts: string[] = [`lord ${detail.lord}`];
  if (detail.occupants.length) parts.push(`occupants ${detail.occupants.join(', ')}`);
  if (detail.aspecting.length) parts.push(`aspected by ${detail.aspecting.join(', ')}`);
  parts.push(detail.influence);
  return parts.join('; ');
}

function sudarshanaSection(reading: PersonalReading): ParashariSection {
  const { triangulation, activeYear } = reading.sudarshana;
  const paragraphs = [
    'Sudarshana Chakra reads the same life areas from Lagna (body), Moon (mind), and Sun (soul). Agreement across all three rings marks genuine strength; affliction repeating marks load-bearing blind spots.',
    ...triangulation.map((t) => {
      return `H${t.house} (${t.lifeArea.split(',')[0]}): Lagna ${ringDetailSummary(t.lagna)} | Chandra ${ringDetailSummary(t.chandra)} | Surya ${ringDetailSummary(t.surya)} → ${t.agreement}`;
    }),
    `Active Sudarshana year (age ${reading.sudarshana.age}): house ${activeYear.house} — ${activeYear.lifeArea.split(',')[0]}. Lagna: ${ringDetailSummary(activeYear.lagna)}; Chandra: ${ringDetailSummary(activeYear.chandra)}; Surya: ${ringDetailSummary(activeYear.surya)}.`,
  ];

  return {
    id: 'sudarshana',
    tier: 'free',
    title: 'Sudarshana Life Areas',
    subtitle: 'Lagna · Chandra · Surya triangulation',
    teaser: `Active year: house ${activeYear.house}`,
    paragraphs,
  };
}

function dashaSection(reading: PersonalReading): ParashariSection {
  const { dasha } = reading;
  return {
    id: 'dasha',
    tier: 'free',
    title: 'Timing · Vimshottari Dasha',
    subtitle: 'Active Mahadasha and Antardasha life areas',
    teaser: `${dasha.mahadashaLord} MD · ${dasha.antardashaLord} AD`,
    paragraphs: [
      `Mahadasha lord ${dasha.mahadashaLord} activates (D1): ${dasha.mahadashaLifeAreas.join('; ') || 'general themes'}.`,
      `Antardasha lord ${dasha.antardashaLord} triggers (D1): ${dasha.antardashaLifeAreas.join('; ') || 'supporting themes'} within that major period.`,
      `D9 lordship adds inner themes — MD: ${dasha.mahadashaLifeAreasD9.join('; ') || '—'}; AD: ${dasha.antardashaLifeAreasD9.join('; ') || '—'}.`,
      'Cross-reference these areas with the Sudarshana active house for what is most alive this year versus the lifelong baseline.',
    ],
  };
}

export function buildParashariAnalysis(reading: PersonalReading): ParashariAnalysis {
  return {
    sections: [
      personalitySection(reading),
      d9Section(reading),
      missionSection(reading),
      shadowSection(reading),
      sudarshanaSection(reading),
      dashaSection(reading),
    ],
  };
}
