import { Type } from "@google/genai";
import { PlanetPosition, PanchangData, TransitEvent, NAKSHATRA_DATA, SudarshanaChakraResult, SudarshanaLayer, calculateDrishti, getPlanetInHouseInterpretation, analyzeLagnaLord, getVargottamaPlanets, injectKaalVelaPoints, RASHIS } from "../vedic-utils";
import { callGeminiProxy } from "../lib/api-utils";
import { DivisionalChartInfo, computeDivisionalChart } from "../lib/divisionalChartUtils";

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
    lagnaLord?: string;
    vargottama?: string;
    arudhaLagna?: string;
    upapadaLagna?: string;
    secondFromUL?: string;
    gulikaMandi?: string;
    amkD10?: string;
  };
  planets: Record<string, string>;
  transits: Record<string, string>;
}

function buildParashariPromptSection(
  birthPositions: PlanetPosition[],
  blueprint: any,
): string {
  const lines: string[] = [];
  const lagnaLord = analyzeLagnaLord(birthPositions);
  if (lagnaLord) {
    lines.push(`Lagna Lord Analysis: ${lagnaLord.lord} in ${lagnaLord.sign} (house ${lagnaLord.house}), dignity ${lagnaLord.dignity ?? 'neutral'}, Kendra=${lagnaLord.isKendra}, Kona=${lagnaLord.isKona}, protective=${lagnaLord.isProtective}.`);
  }

  const vargottama = getVargottamaPlanets(birthPositions);
  if (vargottama.length > 0) {
    lines.push(`Vargottama planets (D1=D9, unshakeable strength): ${vargottama.join(', ')}.`);
  }

  if (blueprint?.arudhaLagna) {
    lines.push(`Arudha Lagna (public image): sign ${RASHIS[blueprint.arudhaLagna.signNumber - 1]}, house ${blueprint.arudhaLagna.house} from Lagna.`);
  }
  if (blueprint?.upapadaLagna) {
    lines.push(`Upapada Lagna (marriage/spouse): sign ${RASHIS[blueprint.upapadaLagna.signNumber - 1]}, house ${blueprint.upapadaLagna.house} from Lagna.`);
    if (blueprint.upapadaLagna.secondFromUL) {
      const s = blueprint.upapadaLagna.secondFromUL;
      lines.push(`2nd from UL (marital sustenance): ${s.signName}, lord ${s.lord}, occupants [${s.occupants.join(', ')}], aspects [${s.aspectingPlanets.join(', ')}], influence=${s.influence}.`);
    }
  }

  const enriched = blueprint?.kaalVelas
    ? injectKaalVelaPoints(birthPositions, blueprint.kaalVelas)
    : birthPositions;
  const d9 = computeDivisionalChart(enriched, 'D9');
  const d10 = computeDivisionalChart(enriched, 'D10');

  const gulika = enriched.find(p => p.name === 'Gulika');
  const maandi = enriched.find(p => p.name === 'Maandi');
  if (gulika) {
    const g9 = d9.positions.find(p => p.name === 'Gulika');
    const g10 = d10.positions.find(p => p.name === 'Gulika');
    lines.push(`Gulika (karmic debt): D1 ${gulika.rashi} H${gulika.house}${g9 ? `, D9 ${g9.rashi} H${g9.house}` : ''}${g10 ? `, D10 ${g10.rashi} H${g10.house}` : ''}.`);
  }
  if (maandi) {
    const m9 = d9.positions.find(p => p.name === 'Maandi');
    const m10 = d10.positions.find(p => p.name === 'Maandi');
    lines.push(`Maandi (secondary malefic): D1 ${maandi.rashi} H${maandi.house}${m9 ? `, D9 ${m9.rashi} H${m9.house}` : ''}${m10 ? `, D10 ${m10.rashi} H${m10.house}` : ''}.`);
  }

  const amk = blueprint?.charakarakas?.AmK;
  if (amk) {
    const amkD10 = d10.positions.find(p => p.name === amk);
    if (amkD10) {
      lines.push(`Amatyakaraka (${amk}) in D10: ${amkD10.rashi}, house ${amkD10.house} — professional soul-purpose.`);
    }
  }

  return lines.length > 0 ? `\n    Parashari Special Points:\n    ${lines.join('\n    ')}` : '';
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
    ${buildParashariPromptSection(birthPositions, blueprint)}
    ${transitSection ? `\n    ${transitSection}` : ''}

    Please provide:
    1. A short, powerful 2-sentence summary of the soul's primary mission in this life.
    2. For each Panchang element (tithi, nakshatra, yoga, karana, vara): one strong paragraph personalizing how it shapes this native's life path and character.
    3. For each Yoga listed: one strong paragraph describing the personalized implication for this individual, including how it manifests in their real life.
    4. For each Blueprint point (AK, AmK, Ishta Devata, Dharma Chakra): one strong paragraph with practical guidance.
    5. For Parashari points if provided (Lagna lord, Vargottama, Arudha Lagna, Upapada + 2nd from UL, Gulika/Mandi, AmK in D10): one strong paragraph each explaining meaning and life impact using the doc framing (protective shield, marital sustenance, karmic debt, professional soul-purpose).
    6. For each planet listed in Natal Planetary Positions: one strong paragraph interpreting how its sign, house, nakshatra, and dignity uniquely shapes this native's life.
    ${transitPositions.length > 0 ? '7. For each active transit event listed above: one strong paragraph explaining how this current sky influence is activating or challenging this individual\'s natal chart right now.' : ''}

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
              dharma: { type: Type.STRING },
              lagnaLord: { type: Type.STRING },
              vargottama: { type: Type.STRING },
              arudhaLagna: { type: Type.STRING },
              upapadaLagna: { type: Type.STRING },
              secondFromUL: { type: Type.STRING },
              gulikaMandi: { type: Type.STRING },
              amkD10: { type: Type.STRING },
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
    (p) => !['Bhrigu Bindu', 'Gulika', 'Maandi'].includes(p.name),
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
  threefoldCore: string;
  careerActionAxis: string;
  relationshipsPeaceOfMind: string;
  activeSudarshanaYear: string;
  remedialGrowthGuidance: string;
}

/** Normalize cached Sudarshana data (current or legacy schema) for display. */
export function normalizeCachedSudarshanaInterpretation(data: unknown): SudarshanaChakraInterpretations | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.threefoldCore === 'string') {
    return {
      threefoldCore: d.threefoldCore,
      careerActionAxis: typeof d.careerActionAxis === 'string' ? d.careerActionAxis : '',
      relationshipsPeaceOfMind: typeof d.relationshipsPeaceOfMind === 'string' ? d.relationshipsPeaceOfMind : '',
      activeSudarshanaYear: typeof d.activeSudarshanaYear === 'string' ? d.activeSudarshanaYear : '',
      remedialGrowthGuidance: typeof d.remedialGrowthGuidance === 'string' ? d.remedialGrowthGuidance : '',
    };
  }
  // Legacy cache format — still valid when birth fingerprint matches; no regen needed.
  if (typeof d.overview === 'string') {
    return {
      threefoldCore: [d.overview, d.lagnaChakra].filter(v => typeof v === 'string').join('\n\n'),
      careerActionAxis: typeof d.suryaChakra === 'string' ? d.suryaChakra : '',
      relationshipsPeaceOfMind: typeof d.chandraChakra === 'string' ? d.chandraChakra : '',
      activeSudarshanaYear: typeof d.crossLayerHighlights === 'string' ? d.crossLayerHighlights : '',
      remedialGrowthGuidance: '',
    };
  }
  return null;
}

function formatSudarshanaLayerDetailed(layer: SudarshanaLayer): string {
  const lines: string[] = [
    `${layer.label} — Reference: ${layer.referenceSign} (${layer.referencePlanet}, sign index ${layer.referenceSignIndex + 1})`,
  ];
  for (let h = 1; h <= 12; h++) {
    const houseSign = RASHIS[(layer.referenceSignIndex + h - 1) % 12];
    const planets = layer.houses[h]?.planets
      .map(p => {
        const parts = [
          p.name,
          `in ${p.rashi}`,
          p.siderealLongitude != null ? `${p.siderealLongitude.toFixed(2)}°` : null,
          p.dignity ? `(${p.dignity})` : null,
          p.isRetrograde ? 'Rx' : null,
        ].filter(Boolean);
        return parts.join(' ');
      })
      .join('; ') || 'Empty';
    lines.push(`  House ${h} (${houseSign}): ${planets}`);
  }
  return lines.join('\n');
}

function formatSudarshanaActiveHouse(chakra: SudarshanaChakraResult, activeHouse: number): string {
  const lagna = chakra.lagnaChakra.houses[activeHouse]?.planets.map(p => p.name).join(', ') || 'Empty';
  const chandra = chakra.chandraChakra.houses[activeHouse]?.planets.map(p => p.name).join(', ') || 'Empty';
  const surya = chakra.suryaChakra.houses[activeHouse]?.planets.map(p => p.name).join(', ') || 'Empty';
  return `Active House ${activeHouse}: Lagna[${lagna}] | Chandra[${chandra}] | Surya[${surya}]`;
}

/**
 * Generates AI interpretation of a Sudarshana Chakra reading.
 *
 * CACHING: Callers must check getPerAccountReport first (fingerprint match → skip API).
 * Always savePerAccountReport immediately after a successful response.
 * Regenerate only when birth fingerprint changes or cache is missing.
 */
export async function generateSudarshanaChakraInterpretation(
  chakra: SudarshanaChakraResult,
  profile: { firstName?: string; gender?: string },
  context: { currentAge: number; activeHouse: number; birthPositions?: PlanetPosition[] }
): Promise<SudarshanaChakraInterpretations> {
  const asc = context.birthPositions?.find(p => p.name === 'Ascendant');
  const moon = context.birthPositions?.find(p => p.name === 'Moon');
  const sun = context.birthPositions?.find(p => p.name === 'Sun');

  const janmaLagna = asc
    ? `${asc.rashi} at ${asc.siderealLongitude?.toFixed(2) ?? '?'}°`
    : `${chakra.lagnaChakra.referenceSign} (reference sign)`;
  const chandraLagna = moon
    ? `${moon.rashi} at ${moon.siderealLongitude?.toFixed(2) ?? '?'}°`
    : `${chakra.chandraChakra.referenceSign} (reference sign)`;
  const suryaLagna = sun
    ? `${sun.rashi} at ${sun.siderealLongitude?.toFixed(2) ?? '?'}°`
    : `${chakra.suryaChakra.referenceSign} (reference sign)`;

  const prompt = `System/Role Prompt:
You are "Jyotish Gem," an expert Vedic Astrologer operating under the strict classical principles of Maharishi Parashara (Brihat Parashara Hora Shastra). You are specialized in performing a complete Sudarshana Chakra analysis (evaluating the nativity simultaneously from Janma Lagna, Chandra Lagna, and Surya Lagna).

Task Context:
Analyze the birth chart using the Sudarshana Chakra technique to evaluate the core pillars of life (Health/Identity, Wealth, Mind/Relationships, and Career) and time the current annual activation cycle.

Native: ${profile.firstName || 'the native'} (${profile.gender || 'unspecified'})

Input Data:
- Janma Lagna: ${janmaLagna}
- Chandra Lagna: ${chandraLagna}
- Surya Lagna: ${suryaLagna}
- Current Exact Age: ${context.currentAge} years
- Active Sudarshana House (this year): ${context.activeHouse}
  Formula: (Age mod 12) + 1; if remainder is 0, house 12 applies.

LAGNA CHAKRA (Janma Lagna ring):
${formatSudarshanaLayerDetailed(chakra.lagnaChakra)}

CHANDRA CHAKRA (Chandra Lagna ring):
${formatSudarshanaLayerDetailed(chakra.chandraChakra)}

SURYA CHAKRA (Surya Lagna ring):
${formatSudarshanaLayerDetailed(chakra.suryaChakra)}

ACTIVE YEAR FOCUS:
${formatSudarshanaActiveHouse(chakra, context.activeHouse)}

Evaluation Guidelines:
1. Triangulated House Analysis (The Three Rings):
   - Analyze the 1st House (Self/Health) simultaneously from Lagna, Chandra, and Surya.
   - Analyze the 10th House (Action/Career/Karma) simultaneously from Lagna, Chandra, and Surya.
   - Analyze the 7th House (Union/Relationships) simultaneously from Lagna, Chandra, and Surya.
   - Analyze the 2nd/11th Houses (Wealth & Inflow) simultaneously from Lagna, Chandra, and Surya.

2. Sudarshana Dasha Timing:
   - The active house is ${context.activeHouse} for age ${context.currentAge}.
   - Examine this activated house in all three rings for the current year.
   - Synthesize planetary influences (occupants, lords, aspects) across the three vantage points.

3. Tone & Formatting:
   - Grounded, authentic, respectful, clear, and insightful.
   - Do NOT use em dashes. Avoid overly dramatic or fatalistic language. Frame challenges through constructive effort (Purushartha).
   - Speak directly to the native using "your" language.
   - Reference specific planet names, house numbers, signs, and dignities from the data above.
   - No generic astrology; every sentence must tie to the provided placements.

Return JSON with these five fields (each field is markdown prose, 2-4 paragraphs):
1. threefoldCore — "## I. The Threefold Core (Sudarshana Triangulation)": Health/Identity (1st house triangulation), Wealth themes (2nd/11th triangulation), and overall three-ring synthesis.
2. careerActionAxis — "## II. Career & Action Axis (10th House Triangulation)": 10th house analysis from Lagna, Chandra, and Surya rings.
3. relationshipsPeaceOfMind — "## III. Relationships & Peace of Mind (7th & Moon Triangulation)": 7th house and Moon/Chandra ring emphasis on mind and relationships.
4. activeSudarshanaYear — "## IV. Active Sudarshana Year Analysis (Timing & Activation)": Deep analysis of house ${context.activeHouse} across all three rings for the current year at age ${context.currentAge}.
5. remedialGrowthGuidance — "## V. Remedial & Growth Guidance": Practical, constructive remedial and growth guidance aligned with Parashari principles.`;

  const text = await callGeminiProxy({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          threefoldCore: { type: Type.STRING },
          careerActionAxis: { type: Type.STRING },
          relationshipsPeaceOfMind: { type: Type.STRING },
          activeSudarshanaYear: { type: Type.STRING },
          remedialGrowthGuidance: { type: Type.STRING },
        },
        required: [
          "threefoldCore",
          "careerActionAxis",
          "relationshipsPeaceOfMind",
          "activeSudarshanaYear",
          "remedialGrowthGuidance",
        ],
      },
    },
  });

  try {
    return JSON.parse(text) as SudarshanaChakraInterpretations;
  } catch {
    throw new Error('Invalid AI response format — could not parse Sudarshana Chakra interpretation JSON');
  }
}
