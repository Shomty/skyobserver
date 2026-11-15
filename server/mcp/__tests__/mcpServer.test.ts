import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../createMcpServer.ts';
import { UsageLimiter } from '../limits.ts';
import { installServerRuntime } from '../../runtime.ts';

// Belgrade, 1 Jan 1990 12:00 local (UTC+1). Coordinates and zone are given
// explicitly so the suite never touches the network geocoder.
const BIRTH = { date: '1990-01-01', time: '12:00', latitude: 44.8125, longitude: 20.4612, timezone: 'Europe/Belgrade' };
const LONG_TEXT = 'A grounded paragraph of guidance. '.repeat(80);

const generateContent = vi.fn(async (_params: { model: string }) => ({ text: LONG_TEXT }));
installServerRuntime({ models: { generateContent } } as never);

let client: Client;
let limiter: UsageLimiter;

interface ToolText { content: Array<{ text: string }>; isError?: boolean }

async function call(name: string, args: Record<string, unknown>): Promise<ToolText> {
  return (await client.callTool({ name, arguments: args })) as unknown as ToolText;
}

async function callJson(name: string, args: Record<string, unknown>) {
  const result = await call(name, args);
  expect(result.isError, result.content[0]?.text).toBeFalsy();
  return JSON.parse(result.content[0].text);
}

beforeAll(async () => {
  limiter = new UsageLimiter({ calcPerMinute: 1_000, reportsPerDay: 2 });
  const server = createMcpServer({ client: { id: 'test-client' }, limiter });
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  client = new Client({ name: 'vitest', version: '0' });
  await client.connect(clientSide);
});

afterAll(async () => {
  await client.close();
});

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('discovery', () => {
  it('lists calculation and report tools, resources and prompts', async () => {
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).toEqual(expect.arrayContaining([
      'find_place', 'get_birth_chart', 'get_vimshottari_dashas', 'get_yogas', 'get_panchang',
      'get_ashtakavarga', 'get_divisional_chart', 'get_special_points', 'get_transits',
      'generate_career_report', 'generate_personal_report', 'generate_year_report', 'generate_daily_report',
    ]));
    const resources = (await client.listResources()).resources.map((r) => r.uri);
    expect(resources).toContain('soulblueprint://rules/reading');
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
    expect(prompts).toEqual(['natal_reading', 'career_reading', 'year_ahead']);
  });

  it('serves the reading methodology as markdown', async () => {
    const res = await client.readResource({ uri: 'soulblueprint://rules/reading' });
    expect(res.contents[0]).toMatchObject({ mimeType: 'text/markdown' });
    expect(String((res.contents[0] as { text: string }).text)).toMatch(/Vedic Rasi Chart/);
  });
});

describe('calculation tools (Swiss Ephemeris golden values)', () => {
  it('get_birth_chart resolves local time with historical offset and places grahas', async () => {
    const chart = await callJson('get_birth_chart', BIRTH);
    expect(chart.birth).toMatchObject({ utc: '1990-01-01T11:00:00.000Z', utcOffsetMinutes: 60 });
    const byName = Object.fromEntries(chart.planets.map((p: { name: string }) => [p.name, p]));
    expect(byName.Ascendant).toMatchObject({ sign: 'Aries', degree: 6, nakshatra: 'Ashwini', pada: 2 });
    expect(byName.Sun).toMatchObject({ sign: 'Sagittarius', degree: 17, nakshatra: 'Purva Ashadha', house: 9 });
    expect(byName.Moon).toMatchObject({ sign: 'Aquarius', nakshatra: 'Shatabhisha', house: 11 });
    expect(chart.planets).toHaveLength(10);
    // Compact output: no UI-only fields
    expect(byName.Sun).not.toHaveProperty('color');
  });

  it('get_vimshottari_dashas returns the active periods at a given date', async () => {
    const d = await callJson('get_vimshottari_dashas', { ...BIRTH, at: '2026-10-15T00:00:00Z' });
    expect(d.birthNakshatra).toBe('Shatabhisha');
    expect(d.birthDashaLord).toBe('Rahu');
    expect(d.active.mahadasha.planet).toBe('Saturn');
    expect(d.active.antardasha.planet).toBe('Ketu');
    const withAntardashas = d.mahadashas.filter((m: { antardashas?: unknown[] }) => m.antardashas);
    expect(withAntardashas.map((m: { planet: string }) => m.planet)).toEqual(['Saturn']);
  });

  it('get_panchang, get_ashtakavarga, get_divisional_chart, get_special_points, get_yogas', async () => {
    const p = await callJson('get_panchang', BIRTH);
    expect(p.panchang).toMatchObject({ vara: 'Monday', tithi: { name: 'Panchami' }, moonRashi: 'Aquarius' });

    const a = await callJson('get_ashtakavarga', BIRTH);
    expect(a.ashtakavarga.sav).toHaveLength(12);
    expect(a.ashtakavarga.sav.reduce((s: number, n: number) => s + n, 0)).toBe(337);

    const d9 = await callJson('get_divisional_chart', { ...BIRTH, chart: 'D9' });
    expect(d9.about.name).toBe('Navamsha');
    expect(d9.positions[0]).toMatchObject({ name: 'Ascendant', sign: 'Taurus' });

    const sp = await callJson('get_special_points', BIRTH);
    expect(sp.charakarakas).toMatchObject({ AK: 'Saturn', AmK: 'Sun' });

    const y = await callJson('get_yogas', BIRTH);
    expect(Array.isArray(y.yogas)).toBe(true);
    expect(y).not.toHaveProperty('detectedAt');
  });

  it('get_transits counts transit houses from the natal Lagna', async () => {
    const t = await callJson('get_transits', { ...BIRTH, at: '2026-10-15T00:00:00Z', days: 30 });
    const sun = t.transitPositions.find((p: { name: string }) => p.name === 'Sun');
    expect(sun).toMatchObject({ sign: 'Virgo', house: 6 }); // Virgo is 6th from Aries
    expect(t.transitPositions.some((p: { name: string }) => p.name === 'Ascendant')).toBe(false);
    expect(Array.isArray(t.natalContacts)).toBe(true);
    expect(Array.isArray(t.ingresses)).toBe(true);
  });
});

describe('input errors are reported to the model', () => {
  it('requires a location', async () => {
    const r = await call('get_birth_chart', { date: '1990-01-01', time: '12:00' });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/place.*latitude/);
  });

  it('rejects an unknown timezone and malformed time', async () => {
    expect((await call('get_birth_chart', { ...BIRTH, timezone: 'Mars/Olympus' })).content[0].text)
      .toMatch(/Unknown timezone/);
    expect((await call('get_birth_chart', { ...BIRTH, time: '25:00' })).isError).toBe(true);
  });

  it('rejects an invalid `at` date', async () => {
    expect((await call('get_vimshottari_dashas', { ...BIRTH, at: 'soon' })).content[0].text)
      .toMatch(/ISO-8601/);
  });
});

describe('report tools', () => {
  it('generates once per fingerprint, serves repeats from cache, and enforces the daily quota', async () => {
    generateContent.mockClear();

    const first = await callJson('generate_year_report', { ...BIRTH, fullName: 'Ana' });
    expect(first.report).toContain('grounded paragraph');
    expect(first).not.toHaveProperty('snapshot');
    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0][0].model).toBe('gemini-3-flash-preview');

    const repeat = await callJson('generate_year_report', { ...BIRTH, fullName: 'Ana' });
    expect(repeat.report).toBe(first.report);
    expect(generateContent).toHaveBeenCalledOnce();

    // Snapshots are only kept when requested, so this is a separate generation.
    const withSnapshot = await callJson('generate_year_report', { ...BIRTH, fullName: 'Ana', includeSnapshot: true });
    expect(withSnapshot.snapshot).toBeTruthy();
    expect(generateContent).toHaveBeenCalledTimes(2);

    const overQuota = await call('generate_career_report', BIRTH);
    expect(overQuota.isError).toBe(true);
    expect(overQuota.content[0].text).toMatch(/Daily report quota/);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('does not charge quota for a failed generation', async () => {
    const local = new UsageLimiter({ calcPerMinute: 1_000, reportsPerDay: 1 });
    const server = createMcpServer({ client: { id: 'refund-client' }, limiter: local });
    const [s, c] = InMemoryTransport.createLinkedPair();
    await server.connect(s);
    const other = new Client({ name: 'vitest-refund', version: '0' });
    await other.connect(c);

    generateContent.mockResolvedValueOnce({ text: 'too short' });
    const failed = (await other.callTool({ name: 'generate_year_report', arguments: BIRTH })) as unknown as ToolText;
    expect(failed.isError).toBe(true);
    expect(failed.content[0].text).toMatch(/server error/);

    const retried = (await other.callTool({ name: 'generate_year_report', arguments: BIRTH })) as unknown as ToolText;
    expect(retried.isError).toBeFalsy();
    await other.close();
  });
});
