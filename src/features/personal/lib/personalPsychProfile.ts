import type { PersonalReading } from './personalReading';
import {
  alignmentNarrative,
  blindSpotLabel,
  chapterThemeLong,
  ELEMENT_STYLE,
  ENERGY_BASELINE,
  lifeAreaShort,
  psychFunction,
  signStyle,
  strengthLabel,
} from './personalPsychLabels';

/** Plain-language psychological profile — input to Gemini guidance prompt. No chart terms. */
export interface PersonalPsychProfile {
  temperament: string;
  coreStrengths: string;
  growthEdges: string;
  lifeDirection: string;
  currentChapter: string;
  shadowThemes: string;
}

function temperamentFromReading(reading: PersonalReading): string {
  const { lagna, moon, sun, alignment } = reading.personality;
  const outer = `${ELEMENT_STYLE[lagna.element] ?? 'distinctive'}, ${ENERGY_BASELINE[lagna.guna] ?? 'with a mixed baseline'}`.trim();
  const emotional = `Emotionally you process through ${signStyle(moon.sign)} patterns — instinct and memory often run ahead of logic when stressed.`;
  const vitality = `Your core drive shows up as ${signStyle(sun.sign)} energy — needing to express purpose and vitality through how you show up in daily life.`;
  const triad = alignmentNarrative(alignment);

  return `You come across as ${outer}. ${emotional} ${vitality} ${triad}`;
}

function strengthsFromReading(reading: PersonalReading): string {
  const parts: string[] = [];

  for (const s of reading.personality.strengths.slice(0, 4)) {
    parts.push(`Natural steadiness: ${strengthLabel(s.reason)} — especially in ${lifeAreaShort(s.house)}.`);
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
    parts.push(`Genuine, load-bearing strengths in ${areas} — behavior, emotion, and purpose agree here.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Your strengths are quieter but real — consistency and follow-through matter more than flash.';
}

function growthEdgesFromReading(reading: PersonalReading): string {
  const parts: string[] = [];

  for (const b of reading.personality.blindSpots.slice(0, 3)) {
    const labels = b.reasons.map(blindSpotLabel).join(' and ');
    parts.push(`Watch for ${labels} showing up as recurring friction in ${lifeAreaShort(b.house)}.`);
  }

  for (const d of reading.shadow.dusthanaAfflictions) {
    parts.push(
      'Core identity themes tie to conflict, hidden material, or loss patterns — patterns you have not fully faced tend to repeat until integrated.',
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
      `Fear, self-doubt, or avoidance cluster in ${lifeAreaShort(reading.shadow.saturn.house)} — the same place eventually becomes mastery if faced directly.`,
    );
  }

  const afflictionRings = reading.sudarshana.triangulation.filter((t) => t.agreement === 'affliction');
  if (afflictionRings.length > 0) {
    parts.push(
      'Load-bearing blind spots repeat across how you act, feel, and define purpose — these are patterns worth conscious attention, not minor quirks.',
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
  const { atmakaraka, rahuKetu } = reading.lifeMission;

  if (atmakaraka) {
    parts.push(
      `Your deepest life lesson centers on ${psychFunction(atmakaraka.planet)} — a quality of being to develop, not a job title to collect.`,
    );
  }

  parts.push(
    'Meaning, belief, and guidance enter your story through teachers, philosophy, and the worldview you eventually claim as your own.',
  );

  parts.push(
    `You are pulled to grow into unfamiliar territory around ${lifeAreaShort(rahuKetu.rahu.house)}, while releasing over-reliance on what already feels familiar in ${lifeAreaShort(rahuKetu.ketu.house)}.`,
  );

  return parts.join(' ');
}

function currentChapterFromReading(reading: PersonalReading): string {
  const { dasha, sudarshana } = reading;
  const activeArea = sudarshana.activeYear.lifeArea.split(',')[0].toLowerCase();
  const mdTheme = chapterThemeLong(dasha.mahadashaLord);
  const adTheme = chapterThemeLong(dasha.antardashaLord);

  return `At age ${sudarshana.age}, this stretch of life spotlights ${activeArea}. The broader chapter emphasizes ${mdTheme}; the active window adds ${adTheme}. Decisions, habits, and relationships now are training grounds for that focus — not a detour from your path.`;
}

function shadowThemesFromReading(reading: PersonalReading): string {
  const parts: string[] = [];
  if (reading.shadow.dusthanaAfflictions.length > 0) {
    parts.push('Disowned parts of self likely return through conflict, secrecy, or loss themes until integrated.');
  }
  if (reading.shadow.karmic.length > 0) {
    parts.push('Recurring inner knots suggest the same lesson reappears until patience and inner work replace outward striving.');
  }
  if (reading.personality.blindSpots.some((b) => b.reasons.includes('retrograde'))) {
    parts.push('Some processing happens entirely inside before action — honor the delay without using it to avoid necessary steps.');
  }
  return parts.length > 0
    ? parts.join(' ')
    : 'Hidden patterns are subtle — notice irritation with others, recurring triggers, and where you feel disproportionately reactive.';
}

export function buildPersonalPsychProfile(reading: PersonalReading): PersonalPsychProfile {
  return {
    temperament: temperamentFromReading(reading),
    coreStrengths: strengthsFromReading(reading),
    growthEdges: growthEdgesFromReading(reading),
    lifeDirection: lifeDirectionFromReading(reading),
    currentChapter: currentChapterFromReading(reading),
    shadowThemes: shadowThemesFromReading(reading),
  };
}
