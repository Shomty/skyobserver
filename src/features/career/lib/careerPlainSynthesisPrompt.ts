import type { CareerReading } from './careerReading';
import type { CareerSnapshot } from '../types';

/** Plain-language seed derived from the deterministic career reading. */
export function buildCareerPlainSeed(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  fullName?: string,
): string {
  const { d1, d9, d10, dasha, synthesis } = reading;
  const name = fullName?.trim() || 'this person';

  const lines = [
    `Subject: ${name}`,
    '',
    'Professional foundation:',
    `- Career house (10th) sign: ${d1.tenth.sign}; influence tone: ${d1.tenth.netInfluence}`,
    `- Career engine planet ${d1.tenthLord.planet} in house ${d1.tenthLord.house} (${d1.tenthLord.placementClass})`,
    `- Leadership / public image (Arudha): ${d1.arudha.alSign}`,
    d1.amk.planet
      ? `- Soul-level work planet (AmK): ${d1.amk.planet} in house ${d1.amk.d1House}`
      : '- Soul-level work planet: not resolved',
    '',
    'Inner strengths and delivery:',
    `- Vargottama durability planets: ${d9.vargottama.all.join(', ') || 'none flagged'}`,
    `- D9 strength checks: ${d9.strength.map((s) => `${s.planet} (${s.verdict})`).join('; ') || 'none'}`,
    d9.karakamsa
      ? `- Inner vocation indicators: ${d9.karakamsa.vocationalIndicators.join(', ')}`
      : '- Inner vocation: not resolved from karakamsa',
    '',
    'Execution and public role:',
    `- D10 execution capacity: ${d10.lagna.executionCapacity}`,
    `- D10 authority channel: ${d10.tenth.authorityMedium}`,
    `- AmK alignment in action chart: ${d10.amk.alignment}`,
    `- Upachaya growth profile: ${d10.upachaya.growthProfile}`,
    d10.karmicDelay !== 'none' ? `- D10 karmic delay: ${d10.karmicDelay}` : '',
    '',
    'Current life chapter:',
    `- Mahadasha lord: ${dasha.current.md.lord} (${dasha.current.md.kind}, score ${dasha.current.md.score})`,
    `- Antardasha lord: ${dasha.current.ad.lord} (${dasha.current.ad.kind}, score ${dasha.current.ad.score})`,
    dasha.upcoming[0]
      ? `- Strongest upcoming window: ${dasha.upcoming[0].lord} (${dasha.upcoming[0].from} to ${dasha.upcoming[0].to})`
      : '',
    '',
    'Synthesis signals:',
    `- Primary field lean: ${synthesis.primaryField.join(', ') || snapshot.fields.slice(0, 3).map((f) => f.label).join(', ')}`,
    `- Job vs business lean: ${synthesis.jobVsBusiness}`,
    `- Confidence: ${synthesis.confidence}`,
    synthesis.contradictions.length
      ? `- Tensions to navigate: ${synthesis.contradictions.join('; ')}`
      : '',
    snapshot.timing.opportunityWindow
      ? `- Opportunity window: ${snapshot.timing.opportunityWindow.from} to ${snapshot.timing.opportunityWindow.to} (${snapshot.timing.opportunityWindow.reason})`
      : '',
    snapshot.timing.peakEarning
      ? `- Peak earning window: ${snapshot.timing.peakEarning.from} to ${snapshot.timing.peakEarning.to}`
      : '',
  ];

  return lines.filter(Boolean).join('\n');
}

export function buildCareerPlainSynthesisPrompt(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  fullName?: string,
): string {
  const seed = buildCareerPlainSeed(reading, snapshot, fullName);
  const name = fullName?.trim() || 'the reader';

  return `System/Role Prompt:
You are a grounded career coach and workplace psychologist. You do NOT use astrology, Vedic terminology, planet names, house numbers, Sanskrit words, charts, dashas, or destiny language. Speak warmly, directly, and practically.

Task:
Turn the structured career profile below into an in-depth plain-English career consultation for ${name}. Ground every sentence in the profile. Do not diagnose. This is coaching, not therapy.

Career profile (already translated out of astrological jargon):
${seed}

Output Format - use these exact Markdown headings:
## Who You Are at Work
Core temperament, natural strengths, and how others perceive your professional identity.

## Inner Drive & Working Style
Hidden strengths, blind spots, and how inner motivation meets day-to-day execution.

## Your Career Direction
Best-fit roles, leadership vs specialist lean, job vs entrepreneurial fit, and public standing.

## Your Current Chapter
What this life phase asks of you professionally, practical moves, and affirmations for the next 6-18 months.

Constraints:
- Do NOT use the em dash symbol. Use hyphens, colons, or parentheses instead.
- 700-1100 words total across all four sections.
- No bullet lists inside sections; use flowing paragraphs.
- No disclaimers about being an AI.`;
}
