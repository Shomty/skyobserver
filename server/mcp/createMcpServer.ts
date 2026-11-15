import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCalcTools } from './calcTools.ts';
import { registerReportTools } from './reportTools.ts';
import { registerPrompts, registerResources } from './resources.ts';
import type { ToolContext } from './toolRunner.ts';

const INSTRUCTIONS = [
  'SoulBlueprint: sidereal Vedic astrology (Lahiri ayanamsa, whole-sign houses, Swiss Ephemeris).',
  'Every chart tool takes a local birth date (YYYY-MM-DD), time (HH:mm) and either a place name or latitude/longitude; the timezone is resolved automatically, including historical DST.',
  'get_* tools return raw calculations for you to interpret — read soulblueprint://rules/reading for the methodology.',
  'generate_* tools return finished reports written by SoulBlueprint and count against a daily quota; repeat requests for the same person are served from cache.',
].join(' ');

/** A fresh server per request (stateless transport); tools close over the calling client. */
export function createMcpServer(ctx: ToolContext): McpServer {
  const server = new McpServer(
    { name: 'soulblueprint', title: 'SoulBlueprint Vedic Astrology', version: '1.0.0' },
    { instructions: INSTRUCTIONS },
  );
  registerCalcTools(server, ctx);
  registerReportTools(server, ctx);
  registerResources(server);
  registerPrompts(server);
  return server;
}
