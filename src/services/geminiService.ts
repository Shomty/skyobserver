import { Type } from "@google/genai";
import { PlanetPosition, PanchangData, TransitEvent, NAKSHATRA_DATA, SudarshanaChakraResult, SudarshanaLayer, calculateDrishti, getPlanetInHouseInterpretation } from "../vedic-utils";
import { callGeminiProxy } from "../lib/api-utils";
import { DivisionalChartInfo } from "../lib/divisionalChartUtils";

export interface AICosmicInterpretations {
  summary: string;
  panchang: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    vara: string;
  };
  yogas: Record<string, string>;
  blueprint: {
    ak: string;
    amk: string;
    ishta: string;
    dharma: string;
  };
  planets: Record<string, string>;
  transits: Record<string, string>;
}

export async function generateCosmicInterpretations(
  profile: any,
  birthPositions: PlanetPosition[],
  yogas: any[],
  panchang: PanchangData,
  blueprint: any,
  transitPositions: PlanetPosition[] = [],
  transitEvents: TransitEvent[] = []
): Promise<AICosmicInterpretations> {
  const formatPlanet = (p: PlanetPosition) =>
    `${p.name} in ${p.rashi} (${p.house} House, ${p.nakshatra} Nakshatra, Dignity: ${p.dignity || 'Neutral'}${p.isRetrograde ? ', Retrograde' : ''}${p.isCombust ? ', Combust' : ''})`;

  const transitSection = transitPositions.length > 0
    ? `Current Sky — Transit Positions (today):
${transitPositions.filter(p => p.name !== 'Ascendant').map(formatPlanet).join('\n')}

Active Transit Events:
${transitEvents.length > 0 ? transitEvents.map(e => `- [${e.type.toUpperCase()}] ${e.title}: ${e.description}`).join('\n') : '- No significant active events detected.'}`
    : '';

  const prompt = `
    As an expert Vedic Astrologer (Jyotishi), provide a personalized, high-level analysis of the following birth chart data${transitPositions.length > 0 ? ' and current sky transits' : ''}.
    Focus on how these specific celestial patterns uniquely affect this individual.

    Individual Context:
    - Name/Gender: ${profile.firstName || 'User'} (${profile.gender})

    Natal Panchang:
    - Tithi: ${panchang.tithi.name} (${panchang.tithi.phase})
    - Nakshatra: ${panchang.nakshatra.name}
    - Yoga: ${panchang.yoga.name}
    - Karana: ${panchang.karana.name}
    - Vara: ${panchang.vara}

    Natal Planetary Positions:
    ${birthPositions.map(formatPlanet).join('\n')}

    Special Points (Blueprint):
    - Atmakaraka (Soul): ${blueprint.charakarakas?.AK}
    - Amatyakaraka (Career): ${blueprint.charakarakas?.AmK}
    - Ishta Devata: ${blueprint.ishtaDevata}
    - Dharma Chakra: ${blueprint.dharmaChakra}

    Identified Natal Yogas:
    ${yogas.map(y => `- ${y.name}: ${y.description}`).join('\n')}
    ${transitSection ? `\n    ${transitSection}` : ''}

    Please provide:
    1. A short, powerful 2-sentence summary of the soul's primary mission in this life.
    2. For each Panchang element (tithi, nakshatra, yoga, karana, vara): one strong paragraph personalizing how it shapes this native's life path and character.
    3. For each Yoga listed: one strong paragraph describing the personalized implication for this individual, including how it manifests in their real life.
    4. For each Blueprint point (AK soul planet, AmK career planet, Ishta Devata, Dharma Chakra): one strong paragraph interpreting its specific meaning and practical guidance for this person.
    5. For each planet listed in Natal Planetary Positions: one strong paragraph interpreting how its sign, house, nakshatra, and dignity uniquely shapes this native's life — cover the domains the planet rules and what it means in practice.
    ${transitPositions.length > 0 ? '6. For each active transit event listed above: one strong paragraph explaining how this current sky influence is activating or challenging this individual\'s natal chart right now — be specific about which natal house, planet, or yoga is being triggered and what practical effect to expect.' : ''}

    Avoid generic text. Speak directly to the person. Each paragraph should feel personal, insightful, and grounded in the specific placement data provided.
  `;

  const text = await callGeminiProxy({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          panchang: {
            type: Type.OBJECT,
            properties: {
              tithi: { type: Type.STRING },
              nakshatra: { type: Type.STRING },
              yoga: { type: Type.STRING },
              karana: { type: Type.STRING },
              vara: { type: Type.STRING }
            },
            required: ["tithi", "nakshatra", "yoga", "karana", "vara"]
          },
          yogas: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          },
          blueprint: {
            type: Type.OBJECT,
            properties: {
              ak: { type: Type.STRING },
              amk: { type: Type.STRING },
              ishta: { type: Type.STRING },
              dharma: { type: Type.STRING }
            },
            required: ["ak", "amk", "ishta", "dharma"]
          },
          planets: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          },
          transits: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          }
        },
        required: ["summary", "panchang", "yogas", "blueprint", "planets", "transits"]
      }
    }
  });

  try {
    return JSON.parse(text) as AICosmicInterpretations;
  } catch {
    throw new Error('Invalid AI response format — could not parse JSON from Gemini');
  }
}

/**
 * Short per-planet natal insights: house placement, drishti, and life effect.
 * One Gemini call returns all planets keyed by name (Sun, Moon, …).
 */
export async function generateNatalPlanetPlacementInsights(
  birthPositions: PlanetPosition[],
  profile?: { firstName?: string; gender?: string },
): Promise<Record<string, string>> {
  const planets = birthPositions.filter(
    (p) => !['Bhrigu Bindu'].includes(p.name),
  );

  const planetContexts = planets.map((p) => {
    const drishti = calculateDrishti(p.name, birthPositions);
    const houseInterp = p.house ? getPlanetInHouseInterpretation(p.name, p.house) : 'House unknown';
    const aspectsTo = drishti.aspectDetails.length > 0
      ? drishti.aspectDetails.map((d) => `${d.targetName} (house ${d.house})`).join(', ')
      : 'none';
    const aspectedBy = drishti.aspectedByDetails.length > 0
      ? drishti.aspectedByDetails.map((d) => `${d.sourceName} (house ${d.house})`).join(', ')
      : 'none';
    const houseDrishti = drishti.aspectedHouses.length > 0
      ? drishti.aspectedHouses.map((ah) => `house ${ah.house} (${ah.relativeHouse}th drishti)`).join(', ')
      : 'none';
    const nakData = NAKSHATRA_DATA[p.nakshatra as keyof typeof NAKSHATRA_DATA];

    return `${p.name}:
- ${p.rashi}, house ${p.house ?? 'N/A'}, ${p.nakshatra} pada ${p.pada}
- Dignity: ${p.dignity || 'neutral'}${p.isRetrograde ? ', retrograde' : ''}${p.isCombust ? ', combust' : ''}
- Nakshatra lord: ${nakData?.lord ?? 'unknown'}
- Classical house effect: ${houseInterp}
- Drishti on planets: ${aspectsTo}
- Drishti from planets: ${aspectedBy}
- Houses receiving drishti: ${houseDrishti}`;
  }).join('\n\n');

  const prompt = `You are an expert Vedic Jyotishi. For EACH body below, write a SHORT personalized interpretation (2–3 sentences max, plain text, no markdown).

Cover in order:
1. What it means for this native that the planet sits in its house and sign
2. The most important drishti (aspects) — what they activate or challenge
3. One practical effect on personality, life area, or karma

Speak directly to the person. Be specific to the data — avoid generic textbook lines.

Native: ${profile?.firstName || 'This person'}${profile?.gender ? ` (${profile.gender})` : ''}

${planetContexts}

Return JSON keyed by exact names: ${planets.map((p) => p.name).join(', ')}.`;

  const text = await callGeminiProxy({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: Object.fromEntries(
          planets.map((p) => [p.name, { type: Type.STRING }]),
        ),
        required: planets.map((p) => p.name),
      },
    },
  });

  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    throw new Error('Invalid AI response format — could not parse planet insights JSON');
  }
}

// ─── Divisional Chart Nakshatra Interpretations ──────────────────────────────

export interface DivisionalNakshatraInterpretations {
  overview: string;
  planets: Record<string, string>;
  houses: Record<string, string>;
}

/**
 * Generates AI interpretations of how each planet's Nakshatra influences it
 * within the context of a specific divisional chart (D1–D60).
 *
 * CACHING: Always call getPerAccountReport before invoking this function.
 * Save the result with savePerAccountReport immediately after. Never call
 * this function automatically — only on explicit user action.
 */
export async function generateDivisionalNakshatraInterpretations(
  chartType: string,
  chartInfo: DivisionalChartInfo,
  positions: PlanetPosition[],
  profile: { firstName?: string; gender?: string }
): Promise<DivisionalNakshatraInterpretations> {
  const relevantPositions = positions.filter(p => p.name !== 'Ascendant');

  const planetLines = relevantPositions.map(p => {
    const nak = NAKSHATRA_DATA[p.nakshatra];
    return `${p.name}: ${p.rashi} (House ${p.house ?? '?'}), Nakshatra: ${p.nakshatra} Pada ${p.pada}` +
      (nak ? ` — Lord: ${nak.lord}, Deity: ${nak.deity}, Symbol: ${nak.symbol}, Theme: ${nak.characteristics}` : '') +
      (p.isRetrograde ? ' [Retrograde]' : '') +
      (p.dignity ? `, Dignity: ${p.dignity}` : '');
  });

  // Collect occupied rashis (unique) for house-level interpretation
  const occupiedRashis = [...new Set(relevantPositions.map(p => p.rashi))];

  const prompt = `
You are an expert Vedic Jyotishi specialising in Nakshatra-level chart interpretation.

Individual: ${profile.firstName || 'the native'} (${profile.gender || 'unspecified gender'})

Divisional Chart: ${chartType} — ${chartInfo.name} (${chartInfo.sanskritName})
Domain governed: ${chartInfo.purpose}

Planetary positions in this ${chartType} chart (with Nakshatra detail):
${planetLines.join('\n')}

Your task:
1. Write a 2–3 sentence overview of this ${chartType} chart's Nakshatra signature — what collective themes emerge from the Nakshatras present.
2. For each planet listed above, write one focused paragraph explaining how that specific Nakshatra colours the planet's expression within the domain of ${chartInfo.name}. Reference the deity, lord, and symbolic themes of the Nakshatra. Speak directly to the native.
3. For each occupied Rasi (${occupiedRashis.join(', ')}), write one paragraph explaining how the Nakshatra(s) present in that sign shape the themes of that house/sign within the ${chartInfo.name} context. Be specific to the domain (${chartInfo.purpose}).

Rules:
- Avoid generic astrology. Every paragraph must reference the specific Nakshatra, its deity/lord, and the ${chartType} domain.
- Speak directly to the native using "your" language.
- No padding or introductory phrases.
  `;

  const text = await callGeminiProxy({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          planets: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          },
          houses: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          }
        },
        required: ["overview", "planets", "houses"]
      }
    }
  });

  try {
    return JSON.parse(text) as DivisionalNakshatraInterpretations;
  } catch {
    throw new Error('Invalid AI response format — could not parse Nakshatra interpretation JSON');
  }
}

// ─── Sudarshana Chakra Interpretation ────────────────────────────────────────

export interface SudarshanaChakraInterpretations {
  overview: string;
  lagnaChakra: string;
  chandraChakra: string;
  suryaChakra: string;
  crossLayerHighlights: string;
}

function formatSudarshanaLayer(layer: SudarshanaLayer): string {
  const lines: string[] = [`Reference: ${layer.referenceSign} (${layer.referencePlanet})`];
  for (let h = 1; h <= 12; h++) {
    const planets = layer.houses[h]?.planets
      .map(p => `${p.name}${p.dignity ? ` (${p.dignity})` : ''}${p.isRetrograde ? ' Rx' : ''}`)
      .join(', ') || 'Empty';
    lines.push(`  House ${h}: ${planets}`);
  }
  return lines.join('\n');
}

/**
 * Generates AI interpretation of a Sudarshana Chakra reading.
 *
 * CACHING: Always call getPerAccountReport before invoking this function.
 * Save the result with savePerAccountReport immediately after.
 * Never call this function automatically — only on explicit user action.
 */
export async function generateSudarshanaChakraInterpretation(
  chakra: SudarshanaChakraResult,
  profile: { firstName?: string; gender?: string }
): Promise<SudarshanaChakraInterpretations> {
  const convergences: string[] = [];
  for (let h = 1; h <= 12; h++) {
    const l = chakra.lagnaChakra.houses[h]?.planets.map(p => p.name) ?? [];
    const c = chakra.chandraChakra.houses[h]?.planets.map(p => p.name) ?? [];
    const s = chakra.suryaChakra.houses[h]?.planets.map(p => p.name) ?? [];
    const hasMultiLayerPlanets =
      (l.length > 0 && c.length > 0) ||
      (l.length > 0 && s.length > 0) ||
      (c.length > 0 && s.length > 0);
    if (hasMultiLayerPlanets) {
      convergences.push(
        `House ${h}: Lagna[${l.join(', ') || '—'}] | Chandra[${c.join(', ') || '—'}] | Surya[${s.join(', ') || '—'}]`
      );
    }
  }

  const prompt = `You are an expert Vedic Jyotishi interpreting a Sudarshana Chakra — a three-layered chart used for comprehensive life analysis.

Individual: ${profile.firstName || 'the native'} (${profile.gender || 'unspecified'})

The Sudarshana Chakra has three rotating layers:
- Lagna Chakra (Inner): Houses counted from Ascendant — represents physical life, body, personal experiences
- Chandra Chakra (Middle): Houses counted from Moon — represents mind, emotions, subconscious patterns
- Surya Chakra (Outer): Houses counted from Sun — represents soul, power, authority, father

LAGNA CHAKRA:
${formatSudarshanaLayer(chakra.lagnaChakra)}

CHANDRA CHAKRA:
${formatSudarshanaLayer(chakra.chandraChakra)}

SURYA CHAKRA:
${formatSudarshanaLayer(chakra.suryaChakra)}

CROSS-LAYER CONVERGENCES (houses with planets in multiple layers — strong cosmic emphasis):
${convergences.length > 0 ? convergences.join('\n') : 'No significant cross-layer convergences found.'}

Your task:
1. overview: Write 2–3 sentences summarising the dominant themes visible across all three layers of this native's Sudarshana Chakra. What is the overall life emphasis?
2. lagnaChakra: Write one detailed paragraph interpreting the Lagna Chakra — how the physical life, body, and personal experiences are shaped by this planetary arrangement. Reference specific planets and their house positions.
3. chandraChakra: Write one detailed paragraph interpreting the Chandra Chakra — the native's mental and emotional landscape, subconscious patterns, and the mind's relationship with different life areas.
4. suryaChakra: Write one detailed paragraph interpreting the Surya Chakra — the native's soul purpose, relationship with authority, power, and how the higher self expresses through life.
5. crossLayerHighlights: Write one paragraph identifying houses where planets appear across multiple layers. These are the most karmically charged areas. Explain what this convergence means for the native's life.

Rules:
- Speak directly to the native using "your" language.
- Reference specific planet names, house numbers, and dignities.
- No generic astrology — every sentence must reference the specific placements provided.
- Be insightful and grounded in classical Vedic principles.`;

  const text = await callGeminiProxy({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          lagnaChakra: { type: Type.STRING },
          chandraChakra: { type: Type.STRING },
          suryaChakra: { type: Type.STRING },
          crossLayerHighlights: { type: Type.STRING },
        },
        required: ["overview", "lagnaChakra", "chandraChakra", "suryaChakra", "crossLayerHighlights"]
      }
    }
  });

  try {
    return JSON.parse(text) as SudarshanaChakraInterpretations;
  } catch {
    throw new Error('Invalid AI response format — could not parse Sudarshana Chakra interpretation JSON');
  }
}
