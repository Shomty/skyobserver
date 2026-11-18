import { format } from 'date-fns';
import { PlanetPosition, Yoga, TransitEvent, PanchangData, NAKSHATRA_DATA } from '../vedic-utils';

export interface ChatContextProps {
  userProfile?: any;
  subjectName?: string;
  referenceDate: Date;
  locationLabel?: string;
  transitPositions: PlanetPosition[];
  birthPositions: PlanetPosition[] | null;
  birthYogas: Yoga[];
  yogas: Yoga[];
  transits: TransitEvent[];
  birthPanchang: PanchangData | null;
  panchang: PanchangData | null;
  birthSpecialPoints?: any;
}

export function formatReferenceDateBlock(date: Date, locationLabel?: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const local = format(date, "EEEE, MMMM d, yyyy 'at' HH:mm");
  const locationLine = locationLabel ? `\n- Observer location: ${locationLabel}` : '';

  return `REFERENCE DATE & TIME (authoritative — use for all "today", "now", "current", and timing answers):
- ISO: ${date.toISOString()}
- Local: ${local} (${tz})${locationLine}
- The CURRENT TRANSIT CHART, CURRENT PANCHANG, and SIGNIFICANT CURRENT TRANSITS in this block are computed for this exact moment.

TEMPORAL RULES:
- Always interpret "today", "this week/month/year" relative to the REFERENCE DATE above.
- Do not assume 2024 or 2025 unless explicitly stated in birth/historical data.
- When giving forecasts, date them relative to the reference date, not your training cutoff.`;
}

export function formatPositions(pos: PlanetPosition[]) {
  return pos.map(p => {
    const nakData = NAKSHATRA_DATA[p.nakshatra];
    return {
      name: p.name,
      rashi: p.rashi,
      nakshatra: p.nakshatra,
      nakshatraLord: nakData?.lord,
      nakshatraDeity: nakData?.deity,
      pada: p.pada,
      degree: `${p.degree}°${p.minute}'`,
      house: p.house,
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
      dignity: p.dignity,
    };
  });
}

const panchangSummary = (p: PanchangData | null): string =>
  p ? JSON.stringify({ tithi: p.tithi, nakshatra: p.nakshatra, yoga: p.yoga, vara: p.vara }, null, 2) : 'Not available';

/**
 * The part of the chat prompt that only depends on who is being read: persona,
 * subject and natal data. It must not contain anything time-dependent — it is
 * the start of every request in a session, so keeping it byte-identical lets
 * Gemini's implicit prompt cache bill it (and the history after it) at the
 * cached rate. The current sky goes in the latest user turn instead.
 */
export function buildStableSystemInstruction(ctx: ChatContextProps): string {
  const { userProfile, subjectName, birthPositions, birthYogas, birthPanchang, birthSpecialPoints } = ctx;

  const resolvedName = subjectName || userProfile?.name || userProfile?.firstName || 'Unknown';
  const isOtherPerson = !!subjectName && subjectName !== (userProfile?.name || userProfile?.firstName);

  return `You are Jyotish AI, an expert Vedic Astrologer (Jyotishi) with deep knowledge of the Parashari and Jaimini systems.
Your role is to provide profound, accurate, and context-aware astrological interpretations based on the complete birth and transit data provided.
${isOtherPerson ? `\nIMPORTANT: You are currently analyzing ${resolvedName}'s chart, NOT the logged-in user's own chart. All natal interpretations, predictions, and dashas refer to ${resolvedName}.\n` : ''}
SUBJECT OF ANALYSIS:
Name: ${resolvedName}
Gender: ${isOtherPerson ? 'Unknown' : (userProfile?.gender || 'Unknown')}
Date of Birth: ${isOtherPerson ? 'See birth positions below' : (userProfile?.birthDetails?.time ? new Date(userProfile.birthDetails.time).toLocaleDateString() : 'Unknown')}
Birth City: ${isOtherPerson ? 'See birth positions below' : (userProfile?.birthDetails?.city || 'Unknown')}

NATAL CHART (Birth Positions):
${birthPositions ? JSON.stringify(formatPositions(birthPositions), null, 2) : 'Not available'}

BIRTH YOGAS (Active Planetary Combinations):
${JSON.stringify(birthYogas.map(y => ({ name: y.name, description: y.description, planets: y.planets })), null, 2)}

BIRTH PANCHANG:
${panchangSummary(birthPanchang)}

BIRTH BLUEPRINT (Special Points):
${birthSpecialPoints ? JSON.stringify(birthSpecialPoints, null, 2) : 'Not available'}

CURRENT SKY:
- The latest user message starts with a <current_sky> block: the reference date & time, the current transit chart, transit yogas, current panchang and significant transits, computed for that moment.
- That block is authoritative for "today", "now", "current" and all timing answers. Earlier messages may have been asked at other moments.

INTERPRETATION GUIDELINES:
- Use traditional Vedic terminology (Lagna, Rashi, Nakshatra, Bhava, Graha) with clear English explanations.
- Consider planetary dignities (Exalted, Debilitated, Own Sign) as primary indicators of strength.
- Analyze natal-transit relationships for timing insights.
- When discussing current transits, dashas, or timing, anchor all answers to the REFERENCE DATE in the <current_sky> block.
- Format for easy reading in a chat bubble:
  - Open with a 1–2 sentence direct answer, without a heading.
  - Then use "## " headings for each main section and "### " for sub-points when needed.
  - Keep paragraphs short (2–4 sentences) with a blank line between blocks.
  - Use bullet lists for factors, placements or steps, and bold only the key terms.
  - Use a "> " quote line for one standout takeaway when it helps. No tables, no horizontal rules.
- Be professional, compassionate, and insightful.`;
}

/** Time-dependent context, sent inside the latest user turn (see buildStableSystemInstruction). */
export function buildCurrentSkyBlock(ctx: ChatContextProps): string {
  const { referenceDate, locationLabel, transitPositions, yogas, transits, panchang } = ctx;

  return `${formatReferenceDateBlock(referenceDate, locationLabel)}

CURRENT TRANSIT CHART:
${JSON.stringify(formatPositions(transitPositions), null, 2)}

CURRENT TRANSIT YOGAS:
${JSON.stringify(yogas.map(y => ({ name: y.name, description: y.description })), null, 2)}

CURRENT PANCHANG:
${panchangSummary(panchang)}

SIGNIFICANT CURRENT TRANSITS:
${JSON.stringify(transits.slice(0, 10).map(t => ({ title: t.title, type: t.type, planets: t.planets, description: t.description })), null, 2)}`;
}
