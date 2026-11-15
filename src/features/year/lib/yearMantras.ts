/**
 * Planetary seed mantras are traditional Navagraha formulas.
 * Mindset lines are written for this reading.
 *
 * "The Big Book Of Personal Affirmations and Mantras.pdf" is not in the
 * repository, so challenging periods use this catalog. The consultation must
 * quote these lines and must not invent passages from that book.
 */

export interface PlanetaryRemedy {
  planet: string;
  mantra: string;
  mindset: string;
}

const REMEDIES: Record<string, PlanetaryRemedy> = {
  Sun: {
    planet: 'Sun',
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    mindset:
      'Choose one visible commitment this week and finish it in daylight. Your effort, not the period, decides whether authority becomes warmth or strain.',
  },
  Moon: {
    planet: 'Moon',
    mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    mindset:
      'Name the feeling before you answer it. A short evening pause gives the mind a shore, so mood does not steer the whole day.',
  },
  Mars: {
    planet: 'Mars',
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    mindset:
      'Put heat into a finished task: a workout, a repair, a direct conversation. Courage here is clean action, not a fight you do not need.',
  },
  Mercury: {
    planet: 'Mercury',
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    mindset:
      'Write the decision in one sentence before you discuss it. Clarity is the remedy: fewer threads, truer words, one next step.',
  },
  Jupiter: {
    planet: 'Jupiter',
    mantra: 'Om Graam Greem Graum Sah Gurave Namah',
    mindset:
      'Ask what would still be wise a year from now. Study, teach, or advise someone without keeping score. Meaning grows when you give it a practice.',
  },
  Venus: {
    planet: 'Venus',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    mindset:
      'Repair one bond with a specific kindness, and keep one pleasure that does not cost your self-respect. Harmony is built, not owed to you.',
  },
  Saturn: {
    planet: 'Saturn',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    mindset:
      'Shrink the promise until you can keep it daily. Gulika and Saturn reward the person who stays with the work. Delay is a classroom, not a verdict.',
  },
  Rahu: {
    planet: 'Rahu',
    mantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    mindset:
      'Hunger is information, not a command. Pick one ambition and give it a boundary: a time, a budget, a person you will not manipulate to get there.',
  },
  Ketu: {
    planet: 'Ketu',
    mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah',
    mindset:
      'Let one identity rest. A quiet practice, even ten minutes, returns you to what is already enough. Release is a skill you practice, not a loss you suffer.',
  },
};

/** Stable graha order so repeated calls render the same remedy list. */
const ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function remediesForPlanets(planets: string[]): PlanetaryRemedy[] {
  const wanted = new Set(planets);
  return ORDER.filter((name) => wanted.has(name)).map((name) => REMEDIES[name]);
}
