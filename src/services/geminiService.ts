import { Type } from "@google/genai";
import { PlanetPosition, PanchangData, TransitEvent } from "../vedic-utils";
import { callGeminiProxy } from "../lib/api-utils";

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
