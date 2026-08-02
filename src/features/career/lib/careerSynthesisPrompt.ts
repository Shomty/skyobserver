import type { CareerReading } from './careerReading';
import type { CareerSnapshot } from '../types';

export function buildCareerSynthesisPrompt(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  fullName?: string,
): string {
  const { d1, d9, d10, dasha, nakshatra, synthesis } = reading;

  const facts = {
    subject: fullName?.trim() || 'the native',
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
        nakshatraLord: d1.tenthLord.nakshatraLord,
      },
      amatyakaraka: d1.amk.planet
        ? { planet: d1.amk.planet, house: d1.amk.d1House }
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

  return `You are a master Vedic astrologer (Parashari tradition) writing a premium career synthesis.

The facts below were computed deterministically from D1, D9, D10, Vimshottari dasha, and nakshatra layers. Do NOT invent placements, yogas, or periods not present in the data. When karmic arrays are empty, do not mention Gulika/Maandi. When shakti entries are absent, omit deity/shakti commentary.

STRUCTURED FACTS (JSON):
${JSON.stringify(facts, null, 2)}

Write ONE cohesive career synthesis for ${facts.subject} in 4–6 flowing paragraphs (roughly 500–900 words total). Integrate:
1. D1 foundation — 10th house, 10th lord, Amatyakaraka, Arudha Lagna vs actual livelihood, any karmic friction
2. D9 inner path — vargottama durability, karakamsa vocation, hidden strength vs hidden weakness
3. D10 action chart — execution capacity, authority medium, AmK alignment, upachaya compounding, D10 karmic delay if not "none"
4. Current dasha timing — MD/AD lords, their roles and scores, strongest upcoming window if present
5. Nakshatra temperament — Moon star, Gana tension if any, karma tara grahas, trial stars, verified shakti lines only
6. Overall synthesis — primary fields, job vs business lean, confidence level, named contradictions as tensions to navigate

Tone: precise, warm, authoritative — like a senior Jyotishi in consultation. No bullet lists, no markdown headings, no disclaimers about being an AI. End with one sentence of constructive purushartha (conscious effort) advice aligned to the current antardasha.`;
}
