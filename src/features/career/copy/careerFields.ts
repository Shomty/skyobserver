import type { CareerField } from '../types';

const SIGN_FIELDS: Record<string, string[]> = {
  Aries: ['Entrepreneurship', 'Sports & Fitness', 'Military & Defense', 'Engineering'],
  Taurus: ['Banking & Finance', 'Real Estate', 'Agriculture', 'Luxury Goods'],
  Gemini: ['Media & Journalism', 'Marketing', 'Education', 'IT & Software'],
  Cancer: ['Hospitality', 'Healthcare', 'Food & Beverage', 'Childcare'],
  Leo: ['Entertainment', 'Politics', 'Creative Direction', 'Luxury Brands'],
  Virgo: ['Healthcare', 'Accounting', 'Quality Assurance', 'Research'],
  Libra: ['Law', 'Fashion & Design', 'Diplomacy', 'Counseling'],
  Scorpio: ['Research', 'Psychology', 'Surgery', 'Investigation'],
  Sagittarius: ['Teaching', 'Publishing', 'Travel & Tourism', 'International Trade'],
  Capricorn: ['Management', 'Government', 'Architecture', 'Mining & Infrastructure'],
  Aquarius: ['Technology', 'Social Work', 'Science', 'Aviation'],
  Pisces: ['Arts & Film', 'Spirituality', 'Pharmaceuticals', 'Charity & NGOs'],
};

const LORD_FIELDS: Record<string, string[]> = {
  Sun: ['Government', 'Leadership Roles', 'Medicine'],
  Moon: ['Public Relations', 'Hospitality', 'Psychology'],
  Mars: ['Engineering', 'Sports', 'Real Estate Development'],
  Mercury: ['Writing', 'Trading', 'Software Development'],
  Jupiter: ['Law', 'Finance', 'Academia'],
  Venus: ['Arts', 'Fashion', 'Interior Design'],
  Saturn: ['Manufacturing', 'Labor & Unions', 'Mining'],
  Rahu: ['Technology Startups', 'Foreign Trade', 'Media'],
  Ketu: ['Research', 'Spiritual Counseling', 'Alternative Medicine'],
};

const LORD_HOUSE_BOOST: Record<number, string[]> = {
  2: ['Wealth Management', 'Family Business'],
  6: ['Healthcare Services', 'Competitive Industries'],
  7: ['Consulting', 'Client-Facing Roles'],
  8: ['Insurance', 'Research & Development'],
  10: ['Executive Leadership', 'Public Authority'],
  11: ['Venture Capital', 'Large Organizations'],
};

const AMK_SIGN_FIELDS: Record<string, string[]> = {
  Aries: ['Startup Founder'],
  Taurus: ['Asset Management'],
  Gemini: ['Communications'],
  Cancer: ['Care Services'],
  Leo: ['Brand Leadership'],
  Virgo: ['Operations'],
  Libra: ['Negotiation'],
  Scorpio: ['Strategy'],
  Sagittarius: ['Advisory'],
  Capricorn: ['Administration'],
  Aquarius: ['Innovation'],
  Pisces: ['Creative Healing'],
};

/**
 * Weighted tag union from 10th sign, 10th lord + house, and AmK sign in D10.
 */
export function rankCareerFields(
  tenthSign: string,
  tenthLord: string,
  tenthLordHouse: number,
  amkSign: string | null,
): CareerField[] {
  const weights = new Map<string, { weight: number; sources: Set<string> }>();

  const add = (label: string, weight: number, source: string) => {
    const existing = weights.get(label) ?? { weight: 0, sources: new Set<string>() };
    existing.weight += weight;
    existing.sources.add(source);
    weights.set(label, existing);
  };

  for (const f of SIGN_FIELDS[tenthSign] ?? []) add(f, 3, '10th sign');
  for (const f of LORD_FIELDS[tenthLord] ?? []) add(f, 2, '10th lord');
  for (const f of LORD_HOUSE_BOOST[tenthLordHouse] ?? []) add(f, 1.5, 'lord house');
  if (amkSign) {
    for (const f of AMK_SIGN_FIELDS[amkSign] ?? []) add(f, 1, 'AmK in D10');
  }

  return [...weights.entries()]
    .map(([label, { weight, sources }]) => ({
      label,
      weight,
      sources: [...sources],
    }))
    .sort((a, b) => b.weight - a.weight);
}
