import { detectNeechabhangaRajYoga, type SignNumber } from '../../../vedic-utils';
import { getAmkWorkNature, getDashaGuidance } from '../../career/copy/parashariCopy';
import type { CareerReading } from '../../career/lib/careerReading';
import { lifeAreaForHouse } from '../../personal/lib/personalConstants';
import type { PersonalReading } from '../../personal/lib/personalReading';

export interface ParashariSection {
  id: 'd1' | 'd9' | 'd10' | 'dasha' | 'guidance';
  title: string;
  subtitle: string;
  teaser: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ParashariAnalysis {
  sections: ParashariSection[];
}

function neechabhangaNote(positions: Parameters<typeof detectNeechabhangaRajYoga>[0], ascSign: SignNumber): string | null {
  const yogas = detectNeechabhangaRajYoga(positions, ascSign);
  if (yogas.length === 0) return null;
  return yogas
    .map(
      (y) =>
        `${y.planetsInvolved.join(' & ')} — ${y.plainDescription}`,
    )
    .join(' ');
}

function d1Section(
  personal: PersonalReading,
  ascSign: SignNumber,
  positions: Parameters<typeof detectNeechabhangaRajYoga>[0],
): ParashariSection {
  const { lagna, sun, moon } = personal.personality;
  const lagnaLordHouse = lagna.lordHouse;
  const mokshaNote =
    lagnaLordHouse === 8 || lagnaLordHouse === 12
      ? `Having your Lagna Lord (${lagna.lord}) in the ${lagnaLordHouse} house naturally inclines your life path toward deep research, transformational cycles, and working behind the scenes.`
      : `Lagna lord ${lagna.lord} in the ${lagnaLordHouse} house orients identity around ${lifeAreaForHouse(lagnaLordHouse).toLowerCase()}.`;

  const sunLine = `Sun in ${sun.sign} (${sun.house} house) carries vitality and soul-purpose expression${sun.dignity ? ` — dignity: ${sun.dignity}` : ''}.`;
  const moonLine =
    moon.house === 6
      ? `Moon in ${moon.sign} (6th house) gives a serious, pragmatic emotional nature — daily routines, problem-solving, and structured logic dominate the mindset.`
      : `Moon in ${moon.sign} (${moon.house} house) governs emotional needs and instinctual reactions in ${lifeAreaForHouse(moon.house).toLowerCase()}.`;

  const neechabhanga = neechabhangaNote(positions, ascSign);
  const paragraphs = [
    `At birth, the sidereal ${lagna.sign} Ascendant was rising, making ${lagna.lord} your primary ruler (Lagna Lord). ${mokshaNote}`,
    sunLine,
    moonLine,
    ...(neechabhanga ? [neechabhanga] : []),
  ];

  const occupants8 = positions
    .filter((p) => p.house === 8 && !['Ascendant', 'Rahu', 'Ketu'].includes(p.name))
    .map((p) => p.name);
  const bullets: string[] = [];
  if (occupants8.length >= 2) {
    bullets.push(`8th house cluster: ${occupants8.join(', ')} — moksha/transformation themes`);
  }
  if (personal.personality.strengths.length > 0) {
    bullets.push(
      ...personal.personality.strengths.slice(0, 3).map((s) => `${s.planet}: ${s.reason} (house ${s.house})`),
    );
  }

  return {
    id: 'd1',
    title: 'D1 — Main Chart · Core Identity',
    subtitle: 'Ascendant, solar core & lunar foundation',
    teaser: `${lagna.sign} rising · Sun ${sun.sign} · Moon ${moon.sign}`,
    paragraphs,
    bullets: bullets.length > 0 ? bullets : undefined,
  };
}

function d9Section(personal: PersonalReading): ParashariSection {
  const { vargottama, relationship, strengthChecks } = personal.d9;
  const paragraphs = [
    vargottama.length > 0
      ? `Vargottama planets (${vargottama.join(', ')}) occupy identical signs in D1 and D9 — extraordinary psychological resilience and unshakeable dignity in those themes.`
      : 'Navamsha reveals the fruit of karma — inner strength that may differ from outer presentation in D1.',
    `Upapada Lagna in ${relationship.upapada.sign} (house ${relationship.upapada.house}) represents the karmic manifestation of marriage and partnership.`,
    `D9 7th house in ${relationship.d9Seventh.sign} — lord ${relationship.d9Seventh.lord} describes enduring union qualities. Venus and Jupiter influence over the relationship axis supports wisdom, grace, and long-term dedication.`,
  ];

  const exaltedVargottama = vargottama.filter((p) =>
    strengthChecks.some((s) => s.planet === p && s.d1Dignity?.toLowerCase().includes('exalt')),
  );
  if (exaltedVargottama.length > 0) {
    paragraphs.push(
      `Exalted Vargottama ${exaltedVargottama.join(', ')} ensures that despite external stresses, core ideals regarding harmony and devotion remain stable.`,
    );
  }

  return {
    id: 'd9',
    title: 'D9 Navamsha · Inner Path & Union',
    subtitle: 'Fruit of karma & relationship axis',
    teaser: `UL ${relationship.upapada.sign}${vargottama.length ? ` · Vargottama ${vargottama.join(', ')}` : ''}`,
    paragraphs,
    bullets: strengthChecks.slice(0, 4).map((s) => `${s.planet} (${s.role}): ${s.verdict}`),
  };
}

function d10Section(career: CareerReading): ParashariSection {
  const { d1, d10 } = career;
  const amk = d1.amk.planet;
  const amkNature = amk ? getAmkWorkNature(amk) : 'professional execution';

  const paragraphs = [
    `D10 lagna ${d10.lagna.lagnaSign}; 10th house in ${d10.tenth.sign}. ${d10.tenth.lord} as 10th lord in house ${d10.tenth.lordHouse} — authority through ${d10.tenth.authorityMedium}.`,
    d10.tenth.lordDignity?.toLowerCase().includes('exalt')
      ? `Exalted ${d10.tenth.lord} in the D10 10th house marks an authoritative, structured professional archetype — long-term endurance and mastery over complex operations.`
      : `D10 10th lord ${d10.tenth.lord} (${d10.tenth.lordDignity ?? 'mixed dignity'}) shapes public standing and executive action.`,
    amk
      ? `${amk} as Amatyakaraka (${amkNature}) bridges technical strategy with disciplined corporate frameworks when aligned with D10 Saturn-like structure.`
      : 'Amatyakaraka analysis requires birth time accuracy.',
  ];

  if (d1.karmic.length > 0) {
    paragraphs.push(
      `Gulika/Mandi (${d1.karmic.map((k) => k.point).join(', ')}) highlight workload boundaries — rely on systematic delegation rather than over-allocating personal energy to organizational friction.`,
    );
  }

  return {
    id: 'd10',
    title: 'D10 Dashamsha · Path of Action',
    subtitle: 'Career & public life',
    teaser: amk ? `AmK ${amk} · D10 ${d10.tenth.sign}` : `D10 10th · ${d10.tenth.sign}`,
    paragraphs,
    bullets: [
      `D10 execution capacity: ${d10.lagna.executionCapacity}`,
      `AmK alignment: ${d10.amk.alignment}`,
      `Upachaya growth: ${d10.upachaya.growthProfile}`,
    ],
  };
}

function dashaSection(career: CareerReading): ParashariSection {
  const { dasha } = career;
  const mdFavorable = dasha.current.md.score > 0;
  const adFavorable = dasha.current.ad.score > 0;
  const guidance = getDashaGuidance(
    dasha.current.md.lord,
    dasha.current.ad.lord,
    mdFavorable,
    adFavorable,
  );

  return {
    id: 'dasha',
    title: 'Vimshottari Dasha · Current Timing',
    subtitle: 'Major period themes',
    teaser: `${dasha.current.md.lord} Mahadasha · ${dasha.current.ad.lord} Antardasha`,
    paragraphs: [
      `Active ${dasha.current.md.lord} Mahadasha (${dasha.current.md.kind}) — a major epoch for expansion, wisdom, and consolidating long-term stability.`,
      ...guidance.paragraphs,
    ],
    bullets: [
      ...guidance.bullets,
      `MD score ${dasha.current.md.score} · AD score ${dasha.current.ad.score}`,
    ],
  };
}

function guidanceSection(career: CareerReading, personal: PersonalReading): ParashariSection {
  const bullets = [
    'Embrace the 8th house gift — channel density into research, optimizing intricate systems, and mastering complex frameworks.',
    'Lead with structure — lean into D10 exalted Saturn themes: clear processes, operational discipline, calm authority.',
    'Cultivate inner harmony — leverage Vargottama or strong Venus/Jupiter themes through art, family harmony, and spiritual devotion under work pressure.',
  ];

  if (personal.d9.vargottama.length > 0) {
    bullets[2] = `Cultivate inner harmony — your Vargottama ${personal.d9.vargottama.join(', ')} stabilizes devotion and creative taste when external stress rises.`;
  }

  if (career.synthesis.primaryField.length > 0) {
    bullets.push(`Professional focus areas: ${career.synthesis.primaryField.slice(0, 3).join(', ')}.`);
  }

  return {
    id: 'guidance',
    title: 'Synthesized Guidance · Purushartha',
    subtitle: 'Conscious human effort',
    teaser: 'The stars impel — effort guided by wisdom completes the map',
    paragraphs: [
      'Your birth chart maps technical capability, resilience, and emotional depth. Classical Jyotish emphasizes Purushartha — conscious effort aligned with your strongest varga promises.',
      personal.synthesis.primaryThemes.length > 0
        ? `Primary themes: ${personal.synthesis.primaryThemes.join('; ')}.`
        : 'Integrate D1 presentation, D9 inner dharma, and D10 professional action as one living practice.',
    ],
    bullets,
  };
}

export function buildDailyParashariAnalysis(
  career: CareerReading,
  personal: PersonalReading,
  ascSign: SignNumber,
  positions: Parameters<typeof detectNeechabhangaRajYoga>[0],
): ParashariAnalysis {
  return {
    sections: [
      d1Section(personal, ascSign, positions),
      d9Section(personal),
      d10Section(career),
      dashaSection(career),
      guidanceSection(career, personal),
    ],
  };
}
