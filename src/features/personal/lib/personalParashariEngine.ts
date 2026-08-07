import type { PersonalReading } from './personalReading';
import {
  agreementNarrative,
  alignmentNarrative,
  blindSpotLabel,
  chapterThemeLong,
  ENERGY_BASELINE,
  ELEMENT_STYLE,
  lifeAreaShort,
  psychFunction,
  signStyle,
  strengthLabel,
  triangulationLayerLabel,
} from './personalPsychLabels';

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
  const outer = `${ELEMENT_STYLE[lagna.element] ?? 'distinctive presence'}, ${ENERGY_BASELINE[lagna.guna] ?? 'with a mixed energy baseline'}`;

  const paragraphs = [
    `Your outer self reads as ${outer}. You meet the world through ${signStyle(lagna.sign)} energy — the first impression and social mask others receive before they know you deeply.`,
    `Your emotional self processes through ${signStyle(moon.sign)} patterns — reactive before reflective when stressed, carrying attachment and memory beneath conscious choice.`,
    `Your core drive expresses ${signStyle(sun.sign)} vitality — the conscious will and sense of purpose that fuels identity when you feel most alive.`,
    alignmentNarrative(alignment),
    `Identity development concentrates on ${lifeAreaShort(lagna.lordHouse)} — how you build selfhood runs through this life domain.`,
  ];

  const bullets: string[] = [];
  if (strengths.length > 0) {
    bullets.push(
      ...strengths.slice(0, 4).map((s) => `${strengthLabel(s.reason)} — especially in ${lifeAreaShort(s.house)}.`),
    );
  }
  if (blindSpots.length > 0) {
    bullets.push(
      ...blindSpots.slice(0, 3).map((b) => {
        const labels = b.reasons.map(blindSpotLabel).join(' and ');
        return `Growth edge: ${labels} — watch for this in ${lifeAreaShort(b.house)}.`;
      }),
    );
  }

  return {
    id: 'personality',
    tier: 'free',
    title: 'Outer Self & Temperament',
    subtitle: 'Outer self · emotional self · core drive',
    teaser: `${signStyle(lagna.sign).split(',')[0]} · ${signStyle(moon.sign).split(',')[0]} · ${signStyle(sun.sign).split(',')[0]}`,
    paragraphs,
    bullets: bullets.length > 0 ? bullets : undefined,
  };
}

function innerSelfSection(reading: PersonalReading): ParashariSection {
  const { vargottama, strengthChecks, relationship } = reading.d9;
  const paragraphs = [
    vargottama.length > 0
      ? 'Certain core traits hold equally in public and private life — what you show and what you are underneath align in key areas, giving unshakeable dignity there.'
      : 'Your inner and outer selves diverge in places — inner strength must be built through conscious practice rather than assumed by default.',
    relationship.upapada.netInfluence === 'benefic'
      ? 'Long-term partnership patterns carry supportive, harmonizing energy — union can stabilize you when chosen with patience.'
      : relationship.upapada.netInfluence === 'malefic'
        ? 'Long-term partnership may face structural tests or delays — patience, clear communication, and realistic expectations matter more than idealized timing.'
        : 'Partnership themes carry mixed signals — both attraction and tests coexist; clarity about needs prevents repeating old patterns.',
    'Intimate bonding style blends devotion with the life areas where you feel most privately yourself — how you attach behind closed doors may differ from how you show up in public.',
  ];

  const hidden = strengthChecks.find((s) => s.verdict === 'hidden-weakness');
  if (hidden) {
    paragraphs.push(
      'Early promise or visible competence may outpace what holds up under sustained pressure — build inner capacity before expecting lasting outer results in that domain.',
    );
  }

  const bullets = strengthChecks.map((s) => {
    if (s.verdict === 'strengthened') {
      return 'Inner resilience forged through early friction — what looked like weakness became a deep reserve.';
    }
    if (s.verdict === 'hidden-weakness') {
      return 'Visible promise exceeds private endurance here — slow down and build foundation.';
    }
    if (s.verdict === 'confirmed') {
      return 'Public and private selves confirm each other — reliable strength.';
    }
    return 'Inner pattern still forming — conscious practice will clarify it.';
  });

  return {
    id: 'd9',
    tier: 'premium',
    title: 'Inner Self & Intimate Bonds',
    subtitle: 'Private identity · attachment · partnership',
    teaser:
      relationship.upapada.netInfluence === 'benefic'
        ? 'Partnership axis supported · inner alignment work available'
        : 'Partnership themes need patience · inner alignment work available',
    paragraphs,
    bullets,
  };
}

function missionSection(reading: PersonalReading): ParashariSection {
  const { atmakaraka, ninthHouse, rahuKetu } = reading.lifeMission;
  const paragraphs = [
    atmakaraka
      ? `Your deepest life lesson centers on ${psychFunction(atmakaraka.planet)} — not a job title, but a quality of being you are here to develop through lived experience.`
      : 'Core soul-lesson indicators were ambiguous — life purpose reads more through meaning, belief, and where growth pulls you next.',
    'Meaning, mentors, and guiding philosophy enter your story through teachers, worldview, and the beliefs you eventually claim as your own.',
    `You are pulled to grow into unfamiliar territory around ${lifeAreaShort(rahuKetu.rahu.house)}, while releasing over-reliance on what already feels familiar in ${lifeAreaShort(rahuKetu.ketu.house)}.`,
    ninthHouse.occupants.length > 0
      ? `Your belief-and-purpose axis carries active inner factors — fortune and worldview are not passive background but lived themes.`
      : 'Purpose unfolds through experience and reflection rather than a single dramatic calling.',
  ];

  return {
    id: 'mission',
    tier: 'premium',
    title: 'Life Purpose & Direction',
    subtitle: 'Core lesson · meaning · growth edge',
    teaser: atmakaraka
      ? `Central lesson: ${psychFunction(atmakaraka.planet).split(',')[0]}`
      : `Growth edge: ${lifeAreaShort(rahuKetu.rahu.house)}`,
    paragraphs,
  };
}

function shadowSection(reading: PersonalReading): ParashariSection {
  const { dusthanaAfflictions, dusthanaAspectAfflictions, saturn, karmic } = reading.shadow;
  const paragraphs: string[] = [
    dusthanaAfflictions.length > 0
      ? 'Core identity themes tie to conflict, hidden material, or loss patterns — inner work here is not optional; disowned parts of self return through repetition until integrated.'
      : 'Hidden patterns are present but not concentrated on your core triad — still worth watching where you avoid discomfort.',
    dusthanaAspectAfflictions.length > 0
      ? 'Pressure from struggle-oriented life areas reaches into your sense of self — you may absorb stress before you name it, or notice it first in how you react to others.'
      : null,
    saturn.house
      ? `Fear, self-doubt, or avoidance cluster where long-term discipline is required in ${lifeAreaShort(saturn.house)} — the same place eventually becomes mastery if faced directly rather than defended against.`
      : 'Restriction patterns could not be fully mapped — notice where procrastination masks fear.',
  ].filter((p): p is string => Boolean(p));

  if (karmic.length > 0) {
    paragraphs.push(
      'Recurring inner knots — places where patience, inner work, and accepting limits matter more than outward striving — often show up as the same argument, job friction, or relationship loop until the underlying fear is named.',
    );
  }

  return {
    id: 'shadow',
    tier: 'premium',
    title: 'Hidden Patterns & Growth Edges',
    subtitle: 'Blind spots · fear · integration',
    teaser:
      karmic.length > 0
        ? 'Recurring inner knots detected — conscious attention recommended'
        : 'Hidden patterns present — watch avoidance habits',
    paragraphs,
  };
}

function lifeDomainSection(reading: PersonalReading): ParashariSection {
  const { triangulation, activeYear } = reading.sudarshana;
  const paragraphs = [
    'Your life domains are read from three lenses — how you act (body and behavior), how you feel (mind and emotion), and what drives purpose (will and direction). Agreement across all three marks genuine strength; repetition of friction marks load-bearing blind spots.',
    ...triangulation.map((t) => {
      const area = t.lifeArea.split(',')[0];
      return `${area}: ${triangulationLayerLabel('lagna')} — ${t.lagna.influence}; ${triangulationLayerLabel('chandra')} — ${t.chandra.influence}; ${triangulationLayerLabel('surya')} — ${t.surya.influence}. Overall: ${agreementNarrative(t.agreement)}.`;
    }),
    `This year (age ${reading.sudarshana.age}) spotlights ${activeYear.lifeArea.split(',')[0].toLowerCase()} — decisions, habits, and relationships now are training grounds for that focus.`,
  ];

  return {
    id: 'sudarshana',
    tier: 'free',
    title: 'Life Domain Map',
    subtitle: 'Behavior · emotion · purpose',
    teaser: `Current focus: ${activeYear.lifeArea.split(',')[0].toLowerCase()}`,
    paragraphs,
  };
}

function chapterSection(reading: PersonalReading): ParashariSection {
  const { dasha } = reading;
  const mdTheme = chapterThemeLong(dasha.mahadashaLord);
  const adTheme = chapterThemeLong(dasha.antardashaLord);

  return {
    id: 'dasha',
    tier: 'free',
    title: 'Current Life Chapter',
    subtitle: 'Major period · active window · activated domains',
    teaser: `${mdTheme.split('—')[0].trim()} · ${adTheme.split('—')[0].trim()}`,
    paragraphs: [
      `Your major life chapter emphasizes ${mdTheme}. This is the broad backdrop — the themes that color multiple years of decisions, relationships, and identity development.`,
      `Within that chapter, the active window spotlights ${adTheme} — what feels most alive right now sits inside this narrower focus.`,
      `Activated life domains include: ${dasha.activatedLifeAreas.slice(0, 4).map((a) => a.split(',')[0].toLowerCase()).join('; ') || 'general integration themes'}.`,
      'Cross-reference these domains with your current-year focus above — what is most urgent this year may be a subset of the longer chapter you are living through.',
    ],
  };
}

export function buildParashariAnalysis(reading: PersonalReading): ParashariAnalysis {
  return {
    sections: [
      personalitySection(reading),
      innerSelfSection(reading),
      missionSection(reading),
      shadowSection(reading),
      lifeDomainSection(reading),
      chapterSection(reading),
    ],
  };
}
