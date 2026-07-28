import { calculatePositions, calculateAshtakavarga, performEkadhipatyaShodhana, findMuhurtaWindows, getChandrabala, getChandrabalaPosition, getTaraRemainder } from './src/vedic-utils';
import { computeDivisionalChart } from './src/lib/divisionalChartUtils';
import type { PlanetPosition } from './src/vedic-utils';

const BAV_CANONICAL = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
const birthDate = new Date('1985-03-18T15:09:00Z');
const lat = 44.84;
const lon = 20.40;

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log('=== Ashtakavarga assertions ===\n');

const positions = calculatePositions(birthDate, lat, lon);
const av = calculateAshtakavarga(positions);

for (const [planet, expected] of Object.entries(BAV_CANONICAL)) {
  const actual = av.bav[planet].reduce((a, b) => a + b, 0);
  assert(actual === expected, `${planet} BAV total = ${expected} (got ${actual})`);
}

const savTotal = av.sav.reduce((a, b) => a + b, 0);
assert(savTotal === 337, `SAV total = 337 (got ${savTotal})`);
assert(av.hasAscendant === true, 'hasAscendant true with lat/lon');
assert(Number.isFinite(av.yogPinda), `yogPinda is finite (${av.yogPinda})`);

const positionsNoLoc = calculatePositions(birthDate);
const avNoAsc = calculateAshtakavarga(positionsNoLoc);
assert(avNoAsc.hasAscendant === false, 'hasAscendant false without lat/lon');
const savNoAsc = avNoAsc.sav.reduce((a, b) => a + b, 0);
assert(savNoAsc >= 285 && savNoAsc <= 295, `SAV without Ascendant ≈ 289 (got ${savNoAsc})`);

console.log('\n=== Ekadhipatya assertions ===\n');

// One occupied, equal values: unoccupied goes to 0
const mockScores = [5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0]; // Aries=5, Scorpio=5
const mockPositions: PlanetPosition[] = [{
  name: 'Sun', symbol: 'Su', rashi: 'Aries', siderealLongitude: 0, longitude: 0,
  degree: 0, minute: 0, nakshatra: 'Ashwini', pada: 1, house: 1,
  isRetrograde: false, isCombust: false, color: '#000',
}];
const ekEqual = performEkadhipatyaShodhana(mockScores, mockPositions);
assert(ekEqual[0] === 5 && ekEqual[7] === 0, 'One occupied equal: occupied unchanged, unoccupied → 0');

// One occupied, unequal: only unoccupied reduced to min
const mockScores2 = [8, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0];
const ekUnequal = performEkadhipatyaShodhana(mockScores2, mockPositions);
assert(ekUnequal[0] === 8 && ekUnequal[7] === 3, 'One occupied unequal: occupied unchanged, unoccupied → min');

// Ketu-only in sign = unoccupied for ekadhipatya
const ketuPositions: PlanetPosition[] = [{
  name: 'Ketu', symbol: 'Ke', rashi: 'Scorpio', siderealLongitude: 210, longitude: 210,
  degree: 0, minute: 0, nakshatra: 'Jyeshtha', pada: 1, house: 8,
  isRetrograde: false, isCombust: false, color: '#000',
}];
const ekKetu = performEkadhipatyaShodhana([4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0], ketuPositions);
assert(ekKetu[0] === 0 && ekKetu[7] === 0, 'Ketu-only sign treated as unoccupied (both → 0 when equal)');

console.log('\n=== Varga house assertions ===\n');

const d1 = positions.filter(p => !['Rahu', 'Ketu', 'Bhrigu Bindu'].includes(p.name));
const d9 = computeDivisionalChart(d1, 'D9');
const d1Houses = new Map(d1.map(p => [p.name, p.house]));
let houseDiffers = false;
for (const p of d9.positions) {
  if (p.name === 'Ascendant') continue;
  if (d1Houses.get(p.name) !== p.house) houseDiffers = true;
}
assert(houseDiffers, 'At least one D9 house differs from D1');

const d9Asc = d9.positions.find(p => p.name === 'Ascendant');
if (d9Asc) {
  const lagnaSignPlanets = d9.positions.filter(p => p.rashi === d9Asc.rashi && p.name !== 'Ascendant');
  for (const p of lagnaSignPlanets) {
    assert(p.house === 1, `${p.name} in D9 Lagna sign has house === 1`);
  }
}

console.log('\n=== Muhurta regression (smoke) ===\n');

// Chandrabala correctness: 6th is favorable, 4th is unfavorable
assert(getChandrabalaPosition('Cancer', 'Sagittarius') === 6, 'Chandrabala 6th position computed correctly');
const ch6 = getChandrabala('Cancer', 'Sagittarius');
assert(ch6.score === 100 && ch6.description === 'Favorable', '6th from natal Moon is favorable Chandrabala');
const ch4 = getChandrabala('Cancer', 'Libra');
assert(ch4.score === 0 && ch4.description === 'Unfavorable', '4th from natal Moon is unfavorable Chandrabala');
const chNeutral = getChandrabala('Cancer', 'Leo');
assert(chNeutral.score === 50 && chNeutral.description.includes('Neutral'), '2nd from natal Moon is neutral Chandrabala');

// Tarabala Janma is remainder 1
assert(getTaraRemainder('Ashwini', 'Ashwini') === 1, 'Same nakshatra yields Janma Tara (1)');

const muhurtaStart = new Date('2026-07-28T06:00:00Z');
const muhurtaEnd = new Date(muhurtaStart.getTime() + 30 * 24 * 60 * 60 * 1000);
for (const category of ['MARRIAGE', 'CAREER', 'PROPERTY', 'GENERAL'] as const) {
  const result = findMuhurtaWindows(positions, muhurtaStart, muhurtaEnd, category, lat, lon, 'Jupiter/Venus');
  assert(result.windows.length > 0, `${category} muhurta generates windows (${result.windows.length})`);
  if (result.windows.length > 0) {
    const w = result.windows[0];
    assert(!!w.tarabala.name, `${category} window includes Tarabala label`);
    assert(!!w.chandrabala.description, `${category} window includes Chandrabala label`);
  }
}

// Reference chart (1985-03-18) returns top 5 windows for 30-day GENERAL
const refResult = findMuhurtaWindows(positions, muhurtaStart, muhurtaEnd, 'GENERAL', lat, lon, 'Jupiter/Venus');
assert(refResult.windows.length === 5, `Reference chart returns 5 GENERAL windows (got ${refResult.windows.length})`);
assert(!!refResult.funnelStats, 'Successful search includes funnel diagnostics');

// Missing Ascendant yields explicit empty reason
const noAscPositions = calculatePositions(new Date('1990-05-15T14:00:00Z'));
const noAscResult = findMuhurtaWindows(noAscPositions, muhurtaStart, muhurtaEnd, 'GENERAL', lat, lon, 'Jupiter/Venus');
assert(noAscResult.emptyReason === 'missing_natal_data', 'Missing Ascendant sets emptyReason missing_natal_data');
assert(noAscResult.windows.length === 0, 'Missing Ascendant returns no windows');

// Inverted range yields invalid_range
const invertedResult = findMuhurtaWindows(positions, muhurtaEnd, muhurtaStart, 'GENERAL', lat, lon, 'Jupiter/Venus');
assert(invertedResult.emptyReason === 'invalid_range', 'Inverted date range sets emptyReason invalid_range');

// Previously empty chart (1975-11-21 Paris) now finds windows within 30 days
const parisLat = 48.85;
const parisLon = 2.35;
const hardChart = calculatePositions(new Date(1975, 10, 21, 6, 15, 0), parisLat, parisLon);
const hardResult = findMuhurtaWindows(hardChart, muhurtaStart, muhurtaEnd, 'GENERAL', parisLat, parisLon, 'Saturn/Rahu');
assert(hardResult.windows.length > 0, `1975 Paris chart finds GENERAL windows in 30 days (${hardResult.windows.length})`);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
