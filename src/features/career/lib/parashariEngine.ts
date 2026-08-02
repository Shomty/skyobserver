import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import {
  analyzeLagnaLord,
  calculateArudhaLagna,
  calculateDrishti,
  getDignity,
  getRashiLord,
  getVargottamaPlanets,
  KENDRA_HOUSES,
  KONA_HOUSES,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import { getAmkWorkNature, getDashaGuidance, getEleventhFromAlAnalysis } from '../copy/parashariCopy';

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
const BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);
const DUSTHANA = [6, 8, 12];

export type PremiumTier = 'free' | 'premium';

export interface ParashariSection {
  id: 'd1' | 'd9' | 'd10' | 'dasha';
  tier: PremiumTier;
  title: string;
  subtitle: string;
  /** Always visible — hooks curiosity */
  teaser: string;
  /** Shown when premium (blurred on free tier) */
  paragraphs: string[];
  bullets?: string[];
  quote?: string;
}

export interface ParashariAnalysis {
  sections: ParashariSection[];
}

function signName(n: SignNumber): string {
  return RASHIS[n - 1];
}

function analyzeEleventhFromAl(
  alSign: SignNumber,
  lagnaSign: SignNumber,
  positions: PlanetPosition[],
): { sign: string; beneficInfluence: boolean; summary: string } {
  const eleventhFromAl = ((alSign - 1 + 10) % 12) + 1 as SignNumber;
  const eleventhSignName = signName(eleventhFromAl);
  const occupants = positions
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]) && RASHIS.indexOf(p.rashi) + 1 === eleventhFromAl)
    .map((p) => p.name);

  const aspecting: string[] = [];
  for (const p of positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, positions);
    if (drishti.aspectedRashis.includes(eleventhSignName)) aspecting.push(p.name);
  }

  const influencers = [...occupants, ...aspecting];
  const beneficCount = influencers.filter((n) => BENEFICS.has(n)).length;
  const maleficCount = influencers.filter((n) => MALEFICS.has(n)).length;
  const beneficInfluence = beneficCount > 0 && beneficCount >= maleficCount;

  return {
    sign: eleventhSignName,
    beneficInfluence,
    summary: getEleventhFromAlAnalysis(eleventhSignName, beneficInfluence, influencers),
  };
}

function summarizePlanetaryStrengths(positions: PlanetPosition[]): {
  strong: string[];
  afflicted: string[];
  summary: string;
} {
  const strong: string[] = [];
  const afflicted: string[] = [];

  for (const p of positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const dignity = getDignity(p.name, RASHIS.indexOf(p.rashi));
    const d = dignity?.toLowerCase() ?? '';
    if (d.includes('exalt') || d.includes('own') || d.includes('moola')) strong.push(p.name);
    if (p.isCombust || d.includes('debil') || d.includes('enemy')) afflicted.push(p.name);
  }

  let summary = '';
  if (strong.length > 0) {
    summary += `Planets with strong baseline dignity (${strong.join(', ')}) deliver their promises more reliably in the physical chart. `;
  }
  if (afflicted.length > 0) {
    summary += `Afflicted grahas (${afflicted.join(', ')}) need conscious Purushartha — effort and timing — to manifest fully.`;
  }
  if (!summary) {
    summary = 'Most grahas sit in mixed dignity; outcomes depend on dasha lords and house placement rather than raw planetary strength alone.';
  }

  return { strong, afflicted, summary };
}

function analyzeD9CareerPath(positions: PlanetPosition[], lagnaSign: SignNumber): {
  vargottama: string[];
  d9TenthSign: string;
  karmicNote: string;
  innerDharma: string;
} {
  const d9 = computeDivisionalChart(positions, 'D9');
  const d9Asc = d9.positions.find((p) => p.name === 'Ascendant');
  const d9AscIdx = d9Asc ? RASHIS.indexOf(d9Asc.rashi) : lagnaSign - 1;
  const d9TenthSign = RASHIS[(d9AscIdx + 9) % 12];

  const vargottama = getVargottamaPlanets(positions);

  const maleficsOnD9Lagna = d9.positions.filter(
    (p) =>
      ['Saturn', 'Rahu', 'Ketu', 'Mars'].includes(p.name) &&
      p.rashi === d9Asc?.rashi,
  );

  let karmicNote =
    'No heavy malefic occupancy on the Navamsha lagna — your inner professional path is relatively unobstructed.';
  if (maleficsOnD9Lagna.length > 0) {
    karmicNote = `${maleficsOnD9Lagna.map((p) => p.name).join(' and ')} influence the Navamsha lagna, indicating past-life karmic weight on inner confidence and vocational dharma. Service, patience, and conscious self-effort transform this into maturity.`;
  }

  const innerDharma = vargottama.length > 0
    ? `Vargottama planets (${vargottama.join(', ')}) hold extraordinary Navamsha strength — their D1 career promises stabilize and resist derailment.`
    : 'No Vargottama planets in this chart; inner fruition follows the Navamsha lordships and dasha periods rather than fixed graha immunity.';

  return { vargottama, d9TenthSign, karmicNote, innerDharma };
}

function lordRulesDusthana(planet: string, lagnaSign: SignNumber, positions: PlanetPosition[]): boolean {
  for (const h of DUSTHANA) {
    const signIdx = (lagnaSign - 1 + h - 1) % 12;
    if (getRashiLord(RASHIS[signIdx]) === planet) return true;
  }
  return false;
}

function isFavorableDashaLord(planet: string, lagnaSign: SignNumber, positions: PlanetPosition[]): boolean {
  const pos = positions.find((p) => p.name === planet);
  if (!pos) return false;
  const house = pos.house ?? 0;
  if (KENDRA_HOUSES.includes(house) || KONA_HOUSES.includes(house)) return true;
  const dignity = getDignity(planet, RASHIS.indexOf(pos.rashi));
  if (dignity?.toLowerCase().includes('exalt') || dignity?.toLowerCase().includes('own')) return true;
  return !lordRulesDusthana(planet, lagnaSign, positions);
}

function analyzeD10AmkAlignment(
  positions: PlanetPosition[],
  amatyakaraka: string | null,
  lagnaSign: SignNumber,
): {
  amkNature: string;
  aligned: boolean;
  d10TenthLord: string;
  d10TenthLordHouse: number;
  paragraphs: string[];
} {
  const d10 = computeDivisionalChart(positions, 'D10');
  const d10Asc = d10.positions.find((p) => p.name === 'Ascendant');
  const d10AscIdx = d10Asc ? RASHIS.indexOf(d10Asc.rashi) : lagnaSign - 1;
  const d10TenthSign = RASHIS[(d10AscIdx + 9) % 12];
  const d10TenthLord = getRashiLord(d10TenthSign);
  const d10TenthLordPos = d10.positions.find((p) => p.name === d10TenthLord);
  const amkPos = amatyakaraka ? d10.positions.find((p) => p.name === amatyakaraka) : undefined;

  const aligned =
    Boolean(amkPos) &&
    (amkPos!.house === 10 ||
      amkPos!.name === d10TenthLord ||
      amkPos!.rashi === d10TenthSign);

  const amkNature = amatyakaraka ? getAmkWorkNature(amatyakaraka) : 'Unknown';

  const paragraphs: string[] = [
    `Dashamsha 10th house falls in ${d10TenthSign}; its lord ${d10TenthLord} occupies the ${d10TenthLordPos?.house ?? '?'} house in D10 — the operational theatre of profession.`,
  ];

  if (amatyakaraka && amatyakaraka !== 'None') {
    paragraphs.push(
      `Amatyakaraka ${amatyakaraka} (${amkNature}) ${aligned ? 'aligns with the D10 10th-house axis — a strong signature of vocational soul-purpose fulfilled through work.' : 'does not tightly conjoin the D10 10th — career may unfold through indirect channels until dasha activates the link.'}`,
    );
  }

  return {
    amkNature,
    aligned,
    d10TenthLord,
    d10TenthLordHouse: d10TenthLordPos?.house ?? 1,
    paragraphs,
  };
}

export function buildParashariAnalysis(
  positions: PlanetPosition[],
  lagnaSign: SignNumber,
  amatyakaraka: string | null,
  mahadashaLord: string,
  antardashaLord: string,
): ParashariAnalysis {
  const lagnaLord = analyzeLagnaLord(positions);
  const al = calculateArudhaLagna(lagnaSign, positions);
  const alSignName = signName(al.signNumber);
  const eleventhAl = analyzeEleventhFromAl(al.signNumber, lagnaSign, positions);
  const strengths = summarizePlanetaryStrengths(positions);
  const d9 = analyzeD9CareerPath(positions, lagnaSign);
  const d10 = analyzeD10AmkAlignment(positions, amatyakaraka, lagnaSign);

  const mdFavorable = isFavorableDashaLord(mahadashaLord, lagnaSign, positions);
  const adFavorable = isFavorableDashaLord(antardashaLord, lagnaSign, positions);
  const dashaGuidance = getDashaGuidance(mahadashaLord, antardashaLord, mdFavorable, adFavorable);

  const asc = positions.find((p) => p.name === 'Ascendant');

  const sections: ParashariSection[] = [
    {
      id: 'd1',
      tier: 'premium',
      title: 'D1 — Rasi Chart · Core Identity',
      subtitle: 'Physical body, vitality, and public material expression',
      teaser: lagnaLord
        ? `Lagna ${asc?.rashi ?? ''} · lord ${lagnaLord.lord} in house ${lagnaLord.house}${lagnaLord.isProtective ? ' · protective placement' : ''}`
        : `Lagna ${asc?.rashi ?? ''}`,
      quote: 'Just as Lord Shiva destroyed the three cities, a strong Lagna Lord in a Kendra or Trikona counteracts evils and brings health, intelligence, and fame. (BPHS)',
      paragraphs: [
        lagnaLord?.summary ??
          'Lagna lord analysis requires a computed Ascendant.',
        strengths.summary,
        `Arudha Lagna (public image) falls in ${alSignName} (house ${al.house} from lagna). ${eleventhAl.summary}`,
      ],
      bullets: [
        ...(strengths.strong.length ? [`Strong dignity: ${strengths.strong.join(', ')}`] : []),
        ...(strengths.afflicted.length ? [`Needs effort: ${strengths.afflicted.join(', ')}`] : []),
        `11th from AL: ${eleventhAl.sign}${eleventhAl.beneficInfluence ? ' · benefic support for gains' : ' · mixed/malefic — steady effort for recognition'}`,
      ],
    },
    {
      id: 'd9',
      tier: 'premium',
      title: 'D9 — Navamsha · Inner Career Path',
      subtitle: 'Inner strength, dharma, and fruition of D1 promises',
      teaser:
        d9.vargottama.length > 0
          ? `${d9.vargottama.length} Vargottama planet(s): ${d9.vargottama.slice(0, 3).join(', ')}`
          : `Navamsha 10th in ${d9.d9TenthSign} — inner vocational tone`,
      quote: 'Vargottama planets possess extraordinary strength, ensuring stable realization of their promises.',
      paragraphs: [d9.innerDharma, d9.karmicNote, `Navamsha 10th house (${d9.d9TenthSign}) colours the spiritual tone of career success — the fruit of professional karma.`],
      bullets: d9.vargottama.length ? d9.vargottama.map((p) => `Vargottama: ${p}`) : undefined,
    },
    {
      id: 'd10',
      tier: 'premium',
      title: 'D10 — Dashamsha · Path of Action',
      subtitle: 'Professional soul-purpose and societal service',
      teaser: amatyakaraka
        ? `Amatyakaraka ${amatyakaraka} · ${d10.amkNature}${d10.aligned ? ' · aligned with D10 10th' : ''}`
        : 'Dashamsha career axis',
      paragraphs: d10.paragraphs,
      bullets: [
        `D10 10th lord: ${d10.d10TenthLord} in house ${d10.d10TenthLordHouse}`,
        ...(amatyakaraka ? [`AmK work signature: ${d10.amkNature}`] : []),
      ],
    },
    {
      id: 'dasha',
      tier: 'premium',
      title: 'Vimshottari Dasha · Current Timing',
      subtitle: 'Parashari focus for Mahadasha and Antardasha lords',
      teaser: `${mahadashaLord} MD · ${antardashaLord} AD · ${mdFavorable && adFavorable ? ' broadly supportive' : mdFavorable || adFavorable ? ' mixed support' : ' remedial period'}`,
      quote: 'The stars impel, they do not compel. Purushartha guided by wisdom is the ultimate key to destiny.',
      paragraphs: dashaGuidance.paragraphs,
      bullets: dashaGuidance.bullets,
    },
  ];

  return { sections };
}
