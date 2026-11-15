import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HOUSE_DATA, NAKSHATRA_DATA, RASHI_DATA } from '../../src/vedic-utils.ts';
import { DIVISIONAL_CHART_INFO } from '../../src/lib/divisionalChartUtils.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const READING_RULES_PATH = path.join(repoRoot, 'vedic-reading-rules.md');

export const READING_RULES_URI = 'soulblueprint://rules/reading';

function jsonResource(uri: string, data: unknown) {
  return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
}

export function registerResources(server: McpServer): void {
  server.registerResource('reading-rules', READING_RULES_URI, {
    title: 'SoulBlueprint reading methodology',
    description: 'How to turn D1/D9, Sudarshana Chakra and Vimshottari dasha data into a personal reading. Follow it when interpreting chart tool output.',
    mimeType: 'text/markdown',
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: await readFile(READING_RULES_PATH, 'utf8') }],
  }));

  const tables: Array<[string, string, string, unknown]> = [
    ['signs', 'soulblueprint://reference/signs', 'The twelve rashis: element, quality, ruler and themes', RASHI_DATA],
    ['nakshatras', 'soulblueprint://reference/nakshatras', 'The 27 nakshatras: lord, deity, symbol and qualities', NAKSHATRA_DATA],
    ['houses', 'soulblueprint://reference/houses', 'Significations of the twelve bhavas', HOUSE_DATA],
    ['divisional-charts', 'soulblueprint://reference/divisional-charts', 'Purpose of each varga D1…D60', DIVISIONAL_CHART_INFO],
  ];
  for (const [name, uri, description, data] of tables) {
    server.registerResource(name, uri, { title: description, description, mimeType: 'application/json' },
      async () => jsonResource(uri, data));
  }
}

const birthArgs = {
  date: z.string().describe('Birth date, YYYY-MM-DD'),
  time: z.string().describe('Birth time, HH:mm (24h)'),
  place: z.string().describe('Birthplace, e.g. "Belgrade, Serbia"'),
};

function userPrompt(text: string) {
  return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] };
}

/** Prompt templates that steer the client's own model through the calculation tools. */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt('natal_reading', {
    title: 'Natal chart reading',
    description: 'Interpret a birth chart in your own words using SoulBlueprint calculations and methodology.',
    argsSchema: birthArgs,
  }, ({ date, time, place }) => userPrompt(
    `Write a Vedic natal reading for someone born ${date} at ${time} in ${place}.\n` +
    `1. Read the resource ${READING_RULES_URI} and follow its method.\n` +
    '2. Call get_birth_chart, get_divisional_chart (chart "D9"), get_special_points, get_yogas and get_vimshottari_dashas with the same date, time and place.\n' +
    '3. Structure the reading as: core identity (Lagna, Moon, Sun), relationships (D9), life mission (Atmakaraka, 9th house, nodes), strengths (yogas), and the current dasha chapter.\n' +
    'Base every claim on the tool output; do not invent placements.',
  ));

  server.registerPrompt('career_reading', {
    title: 'Career reading',
    description: 'Career analysis from D1/D10 and dasha timing, written by your own model.',
    argsSchema: birthArgs,
  }, ({ date, time, place }) => userPrompt(
    `Write a Vedic career reading for someone born ${date} at ${time} in ${place}.\n` +
    'Call get_birth_chart, get_divisional_chart (chart "D10"), get_special_points (Amatyakaraka) and get_vimshottari_dashas. ' +
    'Cover the 10th house and its lord, D10 emphasis, suitable fields, and timing from the active and next antardasha. ' +
    'If a finished report is preferred instead, call generate_career_report.',
  ));

  server.registerPrompt('year_ahead', {
    title: 'Year ahead',
    description: 'Outlook for the next twelve months from dashas and transits.',
    argsSchema: birthArgs,
  }, ({ date, time, place }) => userPrompt(
    `Give a year-ahead outlook for someone born ${date} at ${time} in ${place}.\n` +
    'Call get_vimshottari_dashas and get_transits (days: 365). Describe the dasha chapter, the major ingresses and natal contacts by month, and practical focus areas. ' +
    'If a finished report is preferred instead, call generate_year_report.',
  ));
}
