import type { PersonalReading } from './personalReading';
import type { PersonalScore } from '../types';

export function computeInnerStrength(reading: PersonalReading): PersonalScore {
  let score = 50;
  score += reading.personality.strengths.length * 6;
  score += reading.d9.vargottama.length * 5;
  score += reading.d9.strengthChecks.filter((s) => s.verdict === 'confirmed' || s.verdict === 'strengthened').length * 8;
  score -= reading.personality.blindSpots.length * 4;
  score -= reading.d9.strengthChecks.filter((s) => s.verdict === 'hidden-weakness').length * 10;
  score -= reading.shadow.dusthanaAfflictions.length * 6;

  const value = Math.max(15, Math.min(95, score));
  let label = 'Developing inner resilience';
  if (value >= 75) label = 'Strong inner foundation';
  else if (value >= 55) label = 'Mixed — promise and friction coexist';
  else label = 'Shadow work is load-bearing now';

  return { value, label };
}

export function computeRelationshipHarmony(reading: PersonalReading): PersonalScore {
  let score = 50;
  const ul = reading.d9.relationship.upapada;
  if (ul.netInfluence === 'benefic') score += 20;
  if (ul.netInfluence === 'malefic') score -= 15;
  if (ul.netInfluence === 'mixed') score += 0;
  score += ul.beneficOccupants.length * 8;
  score -= ul.maleficOccupants.length * 8;

  const seventh = reading.sudarshana.triangulation.find((t) => t.house === 7);
  if (seventh?.agreement === 'strength') score += 15;
  if (seventh?.agreement === 'affliction') score -= 15;

  const value = Math.max(15, Math.min(95, score));
  let label = 'Partnership themes need patience';
  if (value >= 75) label = 'Relationship axis well supported';
  else if (value >= 55) label = 'Union carries both support and tests';

  return { value, label, locked: false };
}

export function computeLifeClarity(reading: PersonalReading): PersonalScore {
  let score = 50;
  if (reading.lifeMission.atmakaraka?.dignity) {
    const d = reading.lifeMission.atmakaraka.dignity.toLowerCase();
    if (d.includes('exalt') || d.includes('own')) score += 15;
    if (d.includes('debil')) score -= 12;
  }
  if (reading.lifeMission.ninthHouse.occupants.includes('Jupiter')) score += 12;
  if (reading.lifeMission.ninthHouse.occupants.some((p) => ['Saturn', 'Rahu', 'Ketu'].includes(p))) {
    score -= 8;
  }
  if (reading.synthesis.confidence === 'high') score += 10;
  if (reading.synthesis.confidence === 'low') score -= 10;

  const value = Math.max(15, Math.min(95, score));
  let label = 'Dharma direction still forming';
  if (value >= 75) label = 'Clear life-mission themes';
  else if (value >= 55) label = 'Purpose visible, path uneven';

  return { value, label, locked: false };
}
