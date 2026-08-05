import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import {
  calculateBhriguBindu,
  calculateUpapadaLagna,
  getRashiLord,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { CareerReading } from './careerReading';
import type { CareerSnapshot } from '../types';
import { GRAHAS, houseOfSign, signName, signOfHouse } from './careerConstants';
import { nakshatraFromLongitude } from './nakshatraEngine';

function planetDegree(p: PlanetPosition): string {
  const deg = typeof p.degree === 'number' ? p.degree : p.siderealLongitude % 30;
  return `${deg.toFixed(2)}°`;
}

function buildVargaPlacements(positions: PlanetPosition[], varga: 'D9' | 'D10', ascSign: SignNumber) {
  const chart = computeDivisionalChart(positions, varga);
  const asc = chart.positions.find((p) => p.name === 'Ascendant');
  const vargaAsc = asc ? ((RASHIS.indexOf(asc.rashi) + 1) as SignNumber) : ascSign;

  return chart.positions
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]))
    .map((p) => {
      const signNumber = (RASHIS.indexOf(p.rashi) + 1) as SignNumber;
      return {
        planet: p.name,
        sign: p.rashi,
        house: p.house ?? houseOfSign(signNumber, vargaAsc),
      };
    });
}

function buildD1Ingestion(positions: PlanetPosition[], ascSign: SignNumber) {
  const asc = positions.find((p) => p.name === 'Ascendant');
  const lagnaLord = getRashiLord(signName(ascSign));

  const grahas = positions
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]))
    .map((p) => {
      const nak = nakshatraFromLongitude(p.siderealLongitude);
      return {
        planet: p.name,
        sign: p.rashi,
        degree: planetDegree(p),
        siderealLongitude: Number(p.siderealLongitude.toFixed(2)),
        house: p.house,
        nakshatra: nak.name,
        nakshatraLord: nak.lord,
        dignity: p.dignity ?? null,
        retrograde: Boolean(p.isRetrograde),
      };
    });

  const gulika = positions.find((p) => p.name === 'Gulika');
  const maandi = positions.find((p) => p.name === 'Maandi');

  let bhriguBindu: Record<string, unknown> | null = null;
  try {
    const bb = calculateBhriguBindu(positions);
    bhriguBindu = {
      sign: signName(bb.signNumber),
      degree: Number(bb.degree.toFixed(2)),
      absoluteLongitude: Number(bb.absoluteLongitude.toFixed(2)),
    };
  } catch {
    bhriguBindu = null;
  }

  const upapada = calculateUpapadaLagna(ascSign, positions);
  const d9 = computeDivisionalChart(positions, 'D9');
  const d9Asc = d9.positions.find((p) => p.name === 'Ascendant');
  const d9AscSign = d9Asc ? ((RASHIS.indexOf(d9Asc.rashi) + 1) as SignNumber) : ascSign;
  const d9SeventhSign = signOfHouse(7, d9AscSign);
  const d9SeventhLord = getRashiLord(signName(d9SeventhSign));

  return {
    lagna: {
      sign: asc?.rashi ?? signName(ascSign),
      degree: asc ? planetDegree(asc) : null,
      lord: lagnaLord,
    },
    grahas,
    specialLagnas: {
      arudhaLagna: null as string | null, // filled from reading below
      upapadaLagna: {
        sign: signName(upapada.signNumber),
        houseFromLagna: upapada.house,
        secondFromUl: upapada.secondFromUL,
      },
    },
    specialPoints: {
      bhriguBindu,
      gulika: gulika
        ? { sign: gulika.rashi, degree: planetDegree(gulika), house: gulika.house }
        : null,
      maandi: maandi
        ? { sign: maandi.rashi, degree: planetDegree(maandi), house: maandi.house }
        : null,
    },
    d9RelationshipAxis: {
      seventhHouseSign: signName(d9SeventhSign),
      seventhLord: d9SeventhLord,
      upapadaSign: signName(upapada.signNumber),
    },
  };
}

export function buildCareerSynthesisPrompt(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  positions: PlanetPosition[],
  fullName?: string,
): string {
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found');
  const ascSign = (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;

  const { d1, d9, d10, dasha, nakshatra, synthesis } = reading;
  const d1Ingestion = buildD1Ingestion(positions, ascSign);
  d1Ingestion.specialLagnas.arudhaLagna = d1.arudha.alSign;

  const facts = {
    subject: fullName?.trim() || 'the native',
    d1Ingestion,
    d9Placements: buildVargaPlacements(positions, 'D9', ascSign),
    d10Placements: buildVargaPlacements(positions, 'D10', ascSign),
    d1: {
      tenthHouse: {
        sign: d1.tenth.sign,
        occupants: d1.tenth.occupants,
        netInfluence: d1.tenth.netInfluence,
      },
      tenthLord: {
        planet: d1.tenthLord.planet,
        house: d1.tenthLord.house,
        sign: d1.tenthLord.sign,
        placementClass: d1.tenthLord.placementClass,
        dignity: d1.tenthLord.dignity,
        nakshatra: d1.tenthLord.nakshatra,
        nakshatraLord: d1.tenthLord.nakshatraLord,
      },
      amatyakaraka: d1.amk.planet
        ? {
            planet: d1.amk.planet,
            house: d1.amk.d1House,
            sign: d1.amk.d1Sign,
            dignity: d1.amk.d1Dignity,
            isVargottama: d1.amk.isVargottama,
          }
        : null,
      arudha: {
        alSign: d1.arudha.alSign,
        tenthFromAl: d1.arudha.tenthFromAl,
        eleventhFromAl: d1.arudha.eleventhFromAl,
      },
      karmicAfflictions: d1.karmic,
    },
    d9: {
      vargottama: d9.vargottama,
      karakamsa: d9.karakamsa,
      strengthVerdicts: d9.strength.map((s) => ({
        planet: s.planet,
        role: s.role,
        verdict: s.verdict,
        d1Dignity: s.d1Dignity,
        d9Dignity: s.d9Dignity,
      })),
    },
    d10: {
      lagna: d10.lagna,
      tenth: d10.tenth,
      amk: d10.amk,
      upachaya: d10.upachaya,
      karmicDelay: d10.karmicDelay,
    },
    dasha: {
      current: {
        mahadasha: {
          lord: dasha.current.md.lord,
          kind: dasha.current.md.kind,
          score: dasha.current.md.score,
          roles: dasha.current.md.roles,
        },
        antardasha: {
          lord: dasha.current.ad.lord,
          kind: dasha.current.ad.kind,
          score: dasha.current.ad.score,
          roles: dasha.current.ad.roles,
        },
      },
      strongestUpcoming: dasha.upcoming[0]
        ? {
            lord: dasha.upcoming[0].lord,
            kind: dasha.upcoming[0].kind,
            score: dasha.upcoming[0].score,
            from: dasha.upcoming[0].from,
            to: dasha.upcoming[0].to,
          }
        : null,
    },
    nakshatra: {
      moon: nakshatra.moon,
      moonGana: nakshatra.moonGana,
      tenthLordGana: nakshatra.tenthLordGana,
      shakti: nakshatra.shakti.filter((s) => s.entry),
      karmaTaraPlanets: nakshatra.taras.filter((t) => t.isKarmaTara).map((t) => t.planet),
      challengingTaras: nakshatra.taras
        .filter((t) => t.quality === 'challenging')
        .map((t) => ({ planet: t.planet, tara: t.tara })),
      dispositorships: nakshatra.dispositorships.map((d) => d.channelNote),
    },
    synthesis: {
      primaryFields: synthesis.primaryField,
      jobVsBusiness: synthesis.jobVsBusiness,
      confidence: synthesis.confidence,
      contradictions: synthesis.contradictions,
    },
    timing: snapshot.timing,
    topCareerFields: snapshot.fields.slice(0, 5).map((f) => f.label),
  };

  return `System/Role Prompt:
You are Gem, a compassionate and highly skilled Jyotish consultant.

Philosophical Stance: Treat the horoscope as a blueprint of potential, prioritizing Purushartha (conscious human effort and free will) over rigid determinism.
Tone: Empathetic, professional, supportive, and grounded.
Veracity: Never invent statistics, citations, or unverified claims. If an astrological factor is ambiguous or unverified, explicitly state your uncertainty.

Input Data Ingestion Protocol:
The facts below were computed deterministically. Do NOT invent placements, yogas, or periods not present in the data. When karmic arrays are empty, do not mention Gulika or Maandi. When shakti entries are absent, omit deity/shakti commentary. When bhriguBindu is null, omit Bhrigu Bindu commentary.

STRUCTURED FACTS (JSON):
${JSON.stringify(facts, null, 2)}

Varga Synthesis & Analytical Rules:
Rule 3.1 (D1 & D9): Identify Vargottama planets (identical sign in D1 and D9). Use D1 for initial promises and D9 for fruit of karma.
Rule 3.2 (D10): Examine D10 10th house and its ruler. Analyze Amatyakaraka (AmK) placement in D10 for career trajectory and soul-level professional purpose.
Rule 3.3 (Relationship Axis): Synthesize Upapada Lagna (UL) with D9 7th house and 7th lord for partnership indicators relevant to career-life balance.
Rule 3.4 (Karmic Audit): Inspect Gulika and Maandi afflictions in D9 or D10. Frame upagraha friction as areas requiring spiritual awareness and remedial effort, not fatalism.
Rule 3.5 (Remedies): Recommend targeted mantras or affirmations aligned to the current dasha lords.

Output Formatting - use these exact Markdown headings in order:
## The Core Identity (D1)
Analyze Lagna, Lagna lord, key placements, Nakshatras, physical vitality, innate temperament, and Arudha Lagna (AL) for public image.

## The Inner Path & Union (D9)
Detail Navamsha dispositions and Vargottama. Synthesize Upapada Lagna and D9 indicators for relationship dynamics affecting career. Note Gulika or Maandi in D9 if present in facts.

## The Path of Action (D10)
Detail Dashamsha 10th house, 10th lord, and AmK alignment. Identify professional potential, public status, and career challenges.

## Current Timing (Dasha)
Analyze active Vimshottari Mahadasha and Antardasha lords, dignity, and house lordships. Provide practical advice, constructive remedies, and supportive affirmations/mantras for the current timing.

Constraint Checklist:
- Do NOT use the em dash symbol. Use hyphens, colons, or parentheses instead.
- Attach [cite: 1] or [cite: 2] to classical rules or factual statements derived from the structured facts.
- Use LaTeX only for complex mathematical expressions; render plain numbers as standard text.
- Write 800-1400 words total across all four sections.
- No disclaimers about being an AI.
- Address ${facts.subject} directly where natural.`;
}
