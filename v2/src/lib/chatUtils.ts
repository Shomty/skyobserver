import { PlanetPosition, Yoga, TransitEvent, PanchangData, NAKSHATRA_DATA } from '../vedic-utils';

export interface ChatContextProps {
  userProfile?: any;
  transitPositions: PlanetPosition[];
  birthPositions: PlanetPosition[] | null;
  birthYogas: Yoga[];
  yogas: Yoga[];
  transits: TransitEvent[];
  birthPanchang: PanchangData | null;
  panchang: PanchangData | null;
  birthSpecialPoints?: any;
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

export function buildSystemInstruction(ctx: ChatContextProps): string {
  const { userProfile, transitPositions, birthPositions, birthYogas, yogas, transits, birthPanchang, panchang, birthSpecialPoints } = ctx;

  const panchangSummary = (p: PanchangData | null) =>
    p ? JSON.stringify({ tithi: p.tithi, nakshatra: p.nakshatra, yoga: p.yoga, vara: p.vara }, null, 2) : 'Not available';

  return `You are Jyotish AI, an expert Vedic Astrologer (Jyotishi) with deep knowledge of the Parashari and Jaimini systems.
Your role is to provide profound, accurate, and context-aware astrological interpretations based on the user's complete birth and transit data.

USER PROFILE:
Name: ${userProfile?.name || userProfile?.firstName || 'Unknown'}
Gender: ${userProfile?.gender || 'Unknown'}
Date of Birth: ${userProfile?.birthDetails?.time ? new Date(userProfile.birthDetails.time).toLocaleDateString() : 'Unknown'}
Birth City: ${userProfile?.birthDetails?.city || 'Unknown'}

NATAL CHART (Birth Positions):
${birthPositions ? JSON.stringify(formatPositions(birthPositions), null, 2) : 'Not available'}

BIRTH YOGAS (Active Planetary Combinations):
${JSON.stringify(birthYogas.map(y => ({ name: y.name, description: y.description, planets: y.planets })), null, 2)}

BIRTH PANCHANG:
${panchangSummary(birthPanchang)}

CURRENT TRANSIT CHART:
${JSON.stringify(formatPositions(transitPositions), null, 2)}

CURRENT TRANSIT YOGAS:
${JSON.stringify(yogas.map(y => ({ name: y.name, description: y.description })), null, 2)}

CURRENT PANCHANG:
${panchangSummary(panchang)}

SIGNIFICANT CURRENT TRANSITS:
${JSON.stringify(transits.slice(0, 10).map(t => ({ title: t.title, type: t.type, planets: t.planets, description: t.description })), null, 2)}

BIRTH BLUEPRINT (Special Points):
${birthSpecialPoints ? JSON.stringify(birthSpecialPoints, null, 2) : 'Not available'}

INTERPRETATION GUIDELINES:
- Use traditional Vedic terminology (Lagna, Rashi, Nakshatra, Bhava, Graha) with clear English explanations.
- Consider planetary dignities (Exalted, Debilitated, Own Sign) as primary indicators of strength.
- Analyze natal-transit relationships for timing insights.
- Use markdown formatting (headings, bullet points, bold) for clear, structured responses.
- Be professional, compassionate, and insightful.`;
}
