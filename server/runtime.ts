import type { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { configureGeminiTransport, type GeminiTransport } from '../src/lib/api-utils.ts';
import { configurePositionsBackend } from '../src/services/positionsService.ts';
import { computePositions, computeTransitIngresses } from './ephemeris.ts';

/**
 * Gemini straight through the SDK. `callGeminiProxy` keeps its retry, backoff
 * and timeout policy on top of this, so server-side reports behave exactly
 * like the browser ones.
 */
export function createSdkGeminiTransport(ai: Pick<GoogleGenAI, 'models'>): GeminiTransport {
  return async (params, signal) => {
    const { config, ...rest } = params as { config?: Record<string, unknown> };
    const response = await ai.models.generateContent({
      ...rest,
      config: { ...(config ?? {}), abortSignal: signal },
    } as GenerateContentParameters);
    const text = response.text;
    if (!text) {
      throw Object.assign(new Error('Gemini returned an empty response'), { status: 502 });
    }
    return text;
  };
}

/**
 * Point the browser-oriented services at in-process implementations so the
 * feature engines and Gemini generators under `src/features` run unchanged in
 * Node. Call once at server startup, before any MCP request is served.
 */
export function installServerRuntime(ai: Pick<GoogleGenAI, 'models'>): void {
  configureGeminiTransport(createSdkGeminiTransport(ai));
  configurePositionsBackend({
    planetPositions: ({ isoDate, lat, lon }) => computePositions(new Date(isoDate), lat, lon),
    transitIngresses: async ({ startDate, endDate, planets }) =>
      computeTransitIngresses(new Date(startDate), new Date(endDate), planets),
  });
}
