import type { PersonalReading } from './personalReading';

/** Plain-language psychological profile — input to Section 8 Gemini prompt. No Vedic terms. */
export interface PersonalPsychProfile {
  temperament: string;
  coreStrengths: string;
  growthEdges: string;
  lifeDirection: string;
  currentChapter: string;
}

const ELEMENT_TRAITS: Record<string, string> = {
  Fire: 'energetic, direct, and action-oriented',
  Earth: 'grounded, practical, and steady',
  Air: 'curious, communicative, and mentally agile',
  Water: 'sensitive, intuitive, and emotionally attuned',
};

const GUNA_TRAITS: Record<string, string> = {
  Sattva: 'with a calm, clarity-seeking baseline',
  Rajas: 'with a restless, achievement-driven baseline',
  Tamas: 'with a slow-to-start but deeply persistent baseline',
};

function temperamentFromReading(reading: PersonalReading): string {
  const { lagna, moon, sun, alignment } = reading.personality;
  const outer = `${ELEMENT_TRAITS[lagna.element] ?? 'distinctive'} ${GUNA_TRAITS[lagna.guna] ?? ''}`.trim();
  const emotional = moon.nakshatra
    ? `Emotionally you process through ${moon.nakshatra}-like instincts — reactive before reflective when stressed.`
    : 'Your emotional world runs on instinct and memory before logic catches up.';
  const vitality = `Your core drive shows up as needing to express authority and purpose through how you show up in daily life.`;

  const triad =
    alignment === 'aligned'
      ? 'Your outer presentation, emotional needs, and inner drive generally pull in the same direction — what people see matches what you feel inside.'
      : alignment === 'tension'
        ? 'There is real tension between how you present, what you feel, and what drives you — integration work matters more than forcing one single story.'
        : 'Two of your three inner layers agree; the third adds nuance rather than outright contradiction.';

  return `You come across as ${outer}. ${emotional} ${vitality} ${triad}`;
}

function strengthsFromReading(reading: PersonalReading): string {
  const parts: string[] = [];

  for (const s of reading.personality.strengths.slice(0, 4)) {
    const label =
      s.reason === 'exalted'
        ? 'exceptional natural ability'
        : s.reason === 'own'
          ? 'self-assured competence'
          : s.reason === 'mooltrikona'
            ? 'focused mastery'
            : 'unshakeable inner dignity';
    parts.push(`Natural steadiness in ${label} — you can rely on this under pressure.`);
  }

  if (reading.d9.vargottama.length > 0) {
    parts.push(
      'Certain core traits hold up equally in public and private life — what you show and what you are underneath align in those areas, giving unshakeable dignity there.',
    );
  }

  for (const check of reading.d9.strengthChecks.filter((s) => s.verdict === 'strengthened')) {
    parts.push(
      'You have built real inner resilience through early friction — what looked like a weakness on the surface has become a deep reserve of strength underneath.',
    );
    void check;
  }

  const strengthTriangulation = reading.sudarshana.triangulation.filter((t) => t.agreement === 'strength');
  if (strengthTriangulation.length > 0) {
    const areas = strengthTriangulation.map((t) => t.lifeArea.split(',')[0].toLowerCase()).join(', ');
    parts.push(`Genuine, load-bearing strengths in ${areas} — body, mind, and deeper purpose agree here.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Your strengths are quieter but real — consistency and follow-through matter more than flash.';
}

function growthEdgesFromReading(reading: PersonalReading): string {
  const parts: string[] = [];

  for (const b of reading.personality.blindSpots.slice(0, 3)) {
    const labels = b.reasons.map((r) =>
      r === 'debilitated'
        ? 'self-doubt under pressure'
        : r === 'combust'
          ? 'ego overshadowing clear judgment'
          : r === 'retrograde'
            ? 'internalized processing that delays outward action'
            : 'patterns tied to conflict or hidden stress',
    );
    parts.push(`Watch for ${labels.join(' and ')} showing up as recurring friction in daily life.`);
  }

  for (const d of reading.shadow.dusthanaAfflictions) {
    parts.push(
      'Core identity themes tie to conflict, hidden material, or loss patterns — shadow work is not optional here, it is woven into how you meet the world.',
    );
    void d;
  }

  for (const a of reading.shadow.dusthanaAspectAfflictions.slice(0, 2)) {
    parts.push(
      'Pressure from struggle-oriented life areas reaches into your sense of self — you may absorb stress before you name it.',
    );
    void a;
  }

  if (reading.shadow.saturn.house) {
    parts.push(
      'Fear, self-doubt, or avoidance cluster where long-term discipline is required — the same place eventually becomes mastery if faced directly.',
    );
  }

  const afflictionRings = reading.sudarshana.triangulation.filter((t) => t.agreement === 'affliction');
  if (afflictionRings.length > 0) {
    parts.push(
      'Load-bearing blind spots repeat across how you act, feel, and define purpose — these are not minor quirks but patterns worth conscious attention.',
    );
  }

  const hidden = reading.d9.strengthChecks.find((s) => s.verdict === 'hidden-weakness');
  if (hidden) {
    parts.push(
      'Early promise or visible competence may outpace what holds up under sustained pressure — build inner capacity before expecting lasting outer results.',
    );
  }

  if (reading.d9.relationship.upapada.netInfluence === 'malefic') {
    parts.push(
      'Long-term partnership may face structural tests or delays — patience and clear communication matter more than idealized timing.',
    );
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Growth edges are present but diffuse — pay attention to where you avoid discomfort rather than where you already struggle openly.';
}

function lifeDirectionFromReading(reading: PersonalReading): string {
  const parts: string[] = [];
  const { atmakaraka, ninthHouse, rahuKetu } = reading.lifeMission;

  if (atmakaraka) {
    parts.push(
      'Your deepest life lesson centers on mastering the themes of your soul-significator — not a job title, but a quality of being you are here to develop.',
    );
  }

  parts.push(
    `Meaning, belief, and guidance enter your story through themes of ${ninthHouse.lord ? 'teachers, philosophy, and fortune' : 'higher purpose'}.`,
  );

  parts.push(
    `You are pulled to grow into unfamiliar territory around ${reading.sudarshana.triangulation.find((t) => t.house === 1)?.lifeArea.split(',')[0].toLowerCase() ?? 'self-definition'}, while releasing over-reliance on what already feels familiar.`,
  );

  void rahuKetu;

  return parts.join(' ');
}

function currentChapterFromReading(reading: PersonalReading): string {
  const { dasha, sudarshana } = reading;
  const activeArea = sudarshana.activeYear.lifeArea.split(',')[0].toLowerCase();
  const dashaAreas = [...new Set([...dasha.mahadashaLifeAreas, ...dasha.antardashaLifeAreas])]
    .slice(0, 3)
    .map((a) => a.split(',')[0].toLowerCase())
    .join(', ');

  return `At age ${sudarshana.age}, this stretch of life spotlights ${activeArea}. The broader period emphasizes ${dashaAreas || 'general life themes'}. Decisions, habits, and relationships now are training grounds for that focus — not a detour from your path.`;
}

export function buildPersonalPsychProfile(reading: PersonalReading): PersonalPsychProfile {
  return {
    temperament: temperamentFromReading(reading),
    coreStrengths: strengthsFromReading(reading),
    growthEdges: growthEdgesFromReading(reading),
    lifeDirection: lifeDirectionFromReading(reading),
    currentChapter: currentChapterFromReading(reading),
  };
}
