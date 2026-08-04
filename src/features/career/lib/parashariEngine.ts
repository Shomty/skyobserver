import { getAmkWorkNature, getDashaGuidance, getEleventhFromAlAnalysis } from '../copy/parashariCopy';
import { GANA_CAREER_TENDENCY } from '../copy/nakshatraGana';
import type { CareerReading } from './careerReading';
import type { TaraName } from './nakshatraEngine';

export type PremiumTier = 'free' | 'premium';

export interface ParashariSection {
  id: 'd1' | 'd9' | 'd10' | 'dasha' | 'nakshatra';
  tier: PremiumTier;
  title: string;
  subtitle: string;
  teaser: string;
  paragraphs: string[];
  bullets?: string[];
  quote?: string;
}

export interface ParashariAnalysis {
  sections: ParashariSection[];
}

function karmicParagraphs(reading: CareerReading): string[] {
  if (reading.d1.karmic.length === 0) return [];
  return reading.d1.karmic.map(
    (k) =>
      `${k.point} in house ${k.house} (${k.sign}) touches ${k.afflicts.join(', ')} — this signals remediable delay and friction, not fixed failure. Conscious effort and remedial practice transform the pressure into maturity.`,
  );
}

/** Taras the reading rules single out as smoothing professional execution. */
const SMOOTH_TARAS = new Set<TaraName>(['Sadhana', 'Mitra', 'Parama Mitra']);

function shaktiBullets(reading: CareerReading): string[] {
  return reading.nakshatra.shakti
    .filter((s) => s.entry !== undefined)
    .map(
      (s) =>
        `${s.planet} in ${s.nakshatra} — ${s.entry!.shakti}: ${s.entry!.vocationalDomains.join(', ')}`,
    );
}

function karmaTaraParagraph(reading: CareerReading): string | null {
  const planets = reading.nakshatra.taras.filter((t) => t.isKarmaTara).map((t) => t.planet);
  if (planets.length === 0) return null;
  return `${planets.join(', ')} ${planets.length === 1 ? 'occupies' : 'occupy'} the Karma Tara — the 10th nakshatra from your natal Moon. Grahas there trigger work, duty and public output directly, so their periods tend to coincide with visible professional activity.`;
}

function taraTrialParagraph(reading: CareerReading): string {
  const trials = reading.nakshatra.taras.filter((t) => t.quality === 'challenging');
  if (trials.length === 0) {
    return 'No graha falls in the Vipat, Pratyak or Naidhana stars counted from your Moon — professional execution meets little resistance at the nakshatra level.';
  }
  const detail = trials.map((t) => `${t.planet} (${t.tara})`).join(', ');
  return `Trial stars counted from your Moon: ${detail}. These mark friction that responds to remedy — deliberate preparation, humility and timing — rather than a fixed limit on what you can build.`;
}

function taraSupportParagraph(reading: CareerReading): string | null {
  const smooth = reading.nakshatra.taras.filter((t) => SMOOTH_TARAS.has(t.tara));
  if (smooth.length === 0) return null;
  const detail = smooth.map((t) => `${t.planet} (${t.tara})`).join(', ');
  return `Execution runs smoothest through ${detail} — lean on these grahas' periods and significations when you need work to move without friction.`;
}

function ganaParagraph(reading: CareerReading): string {
  const { moonGana, tenthLordGana } = reading.nakshatra;
  const moonLine = `Your Moon sits in ${moonGana} Gana (${GANA_CAREER_TENDENCY[moonGana]}).`;
  if (!tenthLordGana) return moonLine;
  if (tenthLordGana === moonGana) {
    return `${moonLine} The 10th lord's nakshatra shares that Gana, so temperament and professional function pull in the same direction.`;
  }
  return `${moonLine} The 10th lord's nakshatra is ${tenthLordGana} Gana (${GANA_CAREER_TENDENCY[tenthLordGana]}) — temperament and professional function pull differently. Read that as tension to manage, not a contradiction to resolve.`;
}

function hiddenWeaknessParagraph(reading: CareerReading): string | null {
  const check = reading.d9.strength.find((s) => s.verdict === 'hidden-weakness');
  if (!check) return null;
  return `${check.planet} as ${check.role} shows visible D1 promise (${check.d1Dignity ?? 'mixed'}) with weaker D9 delivery (${check.d9Dignity ?? 'neutral'}) — the classic hidden-weakness pattern. Build inner capacity before expecting outer recognition.`;
}

export function buildParashariAnalysis(reading: CareerReading): ParashariAnalysis {
  const { d1, d9, d10, dasha, nakshatra, synthesis } = reading;
  const amkNature = d1.amk.planet ? getAmkWorkNature(d1.amk.planet) : 'Unknown';

  const eleventhAlInfluencers = [
    ...d1.arudha.eleventhFromAl.occupants,
  ];
  const eleventhSummary = getEleventhFromAlAnalysis(
    d1.arudha.eleventhFromAl.sign,
    d1.arudha.eleventhFromAl.influence === 'benefic',
    eleventhAlInfluencers,
  );

  const mdFavorable = dasha.current.md.score > 0;
  const adFavorable = dasha.current.ad.score > 0;
  const dashaGuidance = getDashaGuidance(
    dasha.current.md.lord,
    dasha.current.ad.lord,
    mdFavorable,
    adFavorable,
  );

  const vargottamaNote =
    d9.vargottama.careerRelevant.length > 0
      ? `Career-relevant Vargottama (${d9.vargottama.resilienceNote} resilience): ${d9.vargottama.careerRelevant.map((v) => `${v.planet} (${v.role})`).join(', ')}. Vargottama makes existing placements durable — it does not erase a difficult dignity.`
      : 'No career-relevant Vargottama planets; fruition follows dasha and conscious effort.';

  const karakamsaNote = d9.karakamsa
    ? `Karakamsa in ${d9.karakamsa.karakamsaSign}; 10th-from-Karakamsa in ${d9.karakamsa.tenthFromKarakamsa.sign} with indicators ${d9.karakamsa.vocationalIndicators.join(', ')}.`
    : null;

  const shakti = shaktiBullets(reading);
  const karmaTara = karmaTaraParagraph(reading);
  const taraSupport = taraSupportParagraph(reading);

  const sections: ParashariSection[] = [
    {
      id: 'd1',
      tier: 'premium',
      title: 'D1 — Rasi Chart · Core Identity',
      subtitle: 'Physical body, vitality, and public material expression',
      teaser: `10th in ${d1.tenth.sign} · lord ${d1.tenthLord.planet} in house ${d1.tenthLord.house} · ${d1.tenthLord.placementClass}`,
      quote:
        'Just as Lord Shiva destroyed the three cities, a strong Lagna Lord in a Kendra or Trikona counteracts evils and brings health, intelligence, and fame. (BPHS)',
      paragraphs: [
        `The 10th house (${d1.tenth.sign}) carries ${d1.tenth.netInfluence} influence${d1.tenth.occupants.length ? ` from ${d1.tenth.occupants.join(', ')}` : ''}. The 10th lord ${d1.tenthLord.planet} sits in house ${d1.tenthLord.house} (${d1.tenthLord.placementClass})${d1.tenthLord.dignity ? `, dignity ${d1.tenthLord.dignity}` : ''}.`,
        `Arudha Lagna (perceived status) falls in ${d1.arudha.alSign} — distinct from actual livelihood in the D1 10th. 10th from AL: ${d1.arudha.tenthFromAl.sign} (${d1.arudha.tenthFromAl.influence}). ${eleventhSummary}`,
        ...karmicParagraphs(reading),
      ].filter(Boolean),
      bullets: [
        `10th lord nakshatra lord: ${d1.tenthLord.nakshatraLord}`,
        ...(d1.amk.planet ? [`Amatyakaraka ${d1.amk.planet} in house ${d1.amk.d1House}`] : []),
        ...(synthesis.contradictions.length
          ? [`Contradictions noted: ${synthesis.contradictions.join('; ')}`]
          : []),
      ],
    },
    {
      id: 'd9',
      tier: 'premium',
      title: 'D9 — Navamsha · Inner Career Path',
      subtitle: 'Inner strength, dharma, and fruition of D1 promises',
      teaser:
        d9.vargottama.all.length > 0
          ? `${d9.vargottama.all.length} Vargottama planet(s): ${d9.vargottama.all.slice(0, 3).join(', ')}`
          : 'Navamsha inner strength analysis',
      quote: 'Vargottama planets possess extraordinary strength, ensuring stable realization of their promises.',
      paragraphs: [
        vargottamaNote,
        ...(karakamsaNote ? [karakamsaNote] : []),
        ...(hiddenWeaknessParagraph(reading) ? [hiddenWeaknessParagraph(reading)!] : []),
      ],
      bullets: d9.strength.map(
        (s) => `${s.planet} (${s.role}): ${s.verdict} — D1 ${s.d1Dignity ?? 'neutral'}, D9 ${s.d9Dignity ?? 'neutral'}`,
      ),
    },
    {
      id: 'd10',
      tier: 'premium',
      title: 'D10 — Dashamsha · Path of Action',
      subtitle: 'Professional soul-purpose and societal service',
      teaser: d1.amk.planet
        ? `Amatyakaraka ${d1.amk.planet} · ${amkNature} · D10 ${d10.amk.alignment}`
        : `D10 10th lord ${d10.tenth.lord} in house ${d10.tenth.lordHouse}`,
      paragraphs: [
        `D10 lagna ${d10.lagna.lagnaSign}; lagna lord ${d10.lagna.lagnaLord} in house ${d10.lagna.lagnaLordHouse} (${d10.lagna.executionCapacity} execution capacity).`,
        `D10 10th in ${d10.tenth.sign}; lord ${d10.tenth.lord} in house ${d10.tenth.lordHouse} — authority arrives through ${d10.tenth.authorityMedium}.`,
        `Upachaya growth profile: ${d10.upachaya.growthProfile} (${d10.upachaya.strongCount} strong graha(s) in 3/6/10/11) — this describes compounding potential over time, not current standing.`,
        ...(d10.karmicDelay !== 'none'
          ? [`D10 karmic delay: ${d10.karmicDelay} — treat as friction to work through, not a closed door.`]
          : []),
      ],
      bullets: [
        `AmK alignment: ${d10.amk.alignment}`,
        `Job vs business: ${synthesis.jobVsBusiness}`,
        `Reading confidence: ${synthesis.confidence}`,
      ],
    },
    {
      id: 'dasha',
      tier: 'premium',
      title: 'Vimshottari Dasha · Current Timing',
      subtitle: 'Parashari focus for Mahadasha and Antardasha lords',
      teaser: `${dasha.current.md.lord} MD (${dasha.current.md.kind}) · ${dasha.current.ad.lord} AD (${dasha.current.ad.kind})`,
      quote: 'The stars impel, they do not compel. Purushartha guided by wisdom is the ultimate key to destiny.',
      paragraphs: [
        ...dashaGuidance.paragraphs,
        ...(nakshatra.dispositorships.length
          ? [
              `Key dispositorship channels: ${nakshatra.dispositorships.map((d) => d.channelNote).join(' · ')}`,
            ]
          : []),
      ],
      bullets: [
        ...dashaGuidance.bullets,
        `MD score: ${dasha.current.md.score} · AD score: ${dasha.current.ad.score}`,
        ...(dasha.upcoming[0]
          ? [`Strongest upcoming window: ${dasha.upcoming[0].lord} (${dasha.upcoming[0].kind}, score ${dasha.upcoming[0].score})`]
          : ['No standout positive antardasha in the next 15 years']),
      ],
    },
    {
      id: 'nakshatra',
      tier: 'premium',
      title: 'Nakshatras · Innate Style and Karmic Timing',
      subtitle: 'The subtle layer beneath the signs — how your energy actually expresses',
      teaser: `Moon in ${nakshatra.moon.name} pada ${nakshatra.moon.pada} (lord ${nakshatra.moon.lord}) · ${nakshatra.moonGana} Gana`,
      quote:
        'The Rashi gives the environment; the Nakshatra decides the direction the energy takes inside it.',
      paragraphs: [
        `Your Moon occupies ${nakshatra.moon.name}, pada ${nakshatra.moon.pada}, ruled by ${nakshatra.moon.lord} — the star that colours how you approach work before any conscious choice is made.`,
        ganaParagraph(reading),
        ...(karmaTara ? [karmaTara] : []),
        taraTrialParagraph(reading),
        ...(taraSupport ? [taraSupport] : []),
      ],
      bullets: [
        ...shakti,
        ...nakshatra.dispositorships.map(
          (d) => `${d.planet} works through ${d.nakshatraLord}'s agenda (${d.nakshatra})`,
        ),
      ],
    },
  ];

  return { sections };
}
