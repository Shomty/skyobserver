import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCareerSnapshot } from '../../src/features/career/lib/careerEngine.ts';
import { careerBirthFingerprint } from '../../src/features/career/lib/careerFingerprint.ts';
import { generateCareerSynthesisText } from '../../src/features/career/lib/careerSynthesisGemini.ts';
import { careerSynthesisFingerprint } from '../../src/features/career/lib/careerSynthesisFingerprint.ts';
import { generateCareerPlainSynthesisText } from '../../src/features/career/lib/careerPlainSynthesisGemini.ts';
import { careerPlainSynthesisFingerprint } from '../../src/features/career/lib/careerPlainSynthesisFingerprint.ts';
import { buildPersonalSnapshot } from '../../src/features/personal/lib/personalEngine.ts';
import { personalBirthFingerprint } from '../../src/features/personal/lib/personalFingerprint.ts';
import { personalGuidanceFingerprint } from '../../src/features/personal/lib/personalGuidanceFingerprint.ts';
import { buildPersonalPsychProfile } from '../../src/features/personal/lib/personalPsychProfile.ts';
import { generatePersonalPsychGuidance } from '../../src/features/personal/lib/personalPsychGuidanceGemini.ts';
import { buildYearReading } from '../../src/features/year/lib/yearEngine.ts';
import { yearReportFingerprint } from '../../src/features/year/lib/yearFingerprint.ts';
import { yearSynthesisFingerprint } from '../../src/features/year/lib/yearSynthesisFingerprint.ts';
import { generateYearSynthesisText } from '../../src/features/year/lib/yearSynthesisGemini.ts';
import { buildDailySnapshot } from '../../src/features/daily/lib/dailyEngine.ts';
import { dailyReportFingerprint } from '../../src/features/daily/lib/dailyFingerprint.ts';
import { dailyGuidanceFingerprint } from '../../src/features/daily/lib/dailyGuidanceFingerprint.ts';
import { generateDailyPlainGuidance } from '../../src/features/daily/lib/dailyPsychGuidanceGemini.ts';
import { dailyTransitGuidanceFingerprint } from '../../src/features/daily/lib/dailyTransitFingerprint.ts';
import { generateDailyTransitGuidance } from '../../src/features/daily/lib/dailyTransitGuidanceGemini.ts';
import { buildDailyTransitSeed } from '../../src/features/daily/lib/dailyTransitSeed.ts';
import { buildDailyPsychSeed } from '../../src/features/daily/lib/dailyPsychProfile.ts';
import { getChartContext, type ChartContext } from './chartContext.ts';
import { momentShape, resolveMoment, resolvePlace, type MomentInput } from './moment.ts';
import { runTool, type RunOutcome, type ToolContext } from './toolRunner.ts';
import { jsonResult } from './toolResult.ts';
import { TtlCache } from './ttlCache.ts';

/** What a report tool produced: the AI text/payload plus the computed reading behind it. */
interface ReportPayload {
  report: unknown;
  snapshot?: unknown;
}

// Reports are deterministic for a fingerprint, so a repeat request for the same
// person (by the same client) is served without another Gemini call.
const reportCache = new TtlCache<ReportPayload>(1_000, 24 * 60 * 60 * 1000);

const reportShape = {
  ...momentShape,
  fullName: z.string().trim().min(1).max(80).optional()
    .describe('First name or full name to address the reader by'),
  includeSnapshot: z.boolean().optional()
    .describe('Also return the structured reading the report was written from (large)'),
};

const REPORT_ANNOTATIONS = { readOnlyHint: true, openWorldHint: true, idempotentHint: true } as const;

async function loadChart(input: MomentInput): Promise<ChartContext> {
  return getChartContext(await resolveMoment(input));
}

/**
 * Serve from cache, or charge one unit of the client's daily report quota and
 * generate. The charge happens inside the cached computation, so concurrent
 * identical requests share — and pay for — a single generation. Snapshots are
 * large, so they are only kept when the caller asked for one.
 */
async function cachedReport(
  ctx: ToolContext,
  key: string,
  includeSnapshot: boolean | undefined,
  generate: () => Promise<ReportPayload>,
): Promise<RunOutcome> {
  const withSnapshot = includeSnapshot === true;
  const cacheKey = `${ctx.client.id}|${withSnapshot ? 'full' : 'text'}|${key}`;
  const cached = reportCache.has(cacheKey);
  const payload = await reportCache.getOrCreate(cacheKey, async () => {
    const window = ctx.limiter.consume(ctx.client.id, 'report');
    try {
      const { report, snapshot } = await generate();
      return withSnapshot ? { report, snapshot } : { report };
    } catch (error: unknown) {
      // A failed generation should not cost the client a report.
      ctx.limiter.refund(ctx.client.id, 'report', window);
      throw error;
    }
  });
  return { cached, result: jsonResult(payload) };
}

export function registerReportTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool('generate_career_report', {
    title: 'Career report (AI)',
    description: 'Written career reading from the SoulBlueprint engine (D1/D10/D9, 10th house and lord, Parashari and nakshatra analysis, dasha timing). style "consultation" is an in-depth astrologer-voice report; "plain" is jargon-free coaching. Counts against the daily report quota unless cached.',
    inputSchema: { ...reportShape, style: z.enum(['consultation', 'plain']).optional() },
    annotations: REPORT_ANNOTATIONS,
  }, (input) => runTool(ctx, 'generate_career_report', 'report', async () => {
    const chart = await loadChart(input);
    const style = input.style ?? 'consultation';
    const birthFp = careerBirthFingerprint(chart.instant, chart.place);
    const fp = style === 'plain' ? careerPlainSynthesisFingerprint(birthFp) : careerSynthesisFingerprint(birthFp);
    return cachedReport(ctx, `career|${style}|${fp}|${input.fullName ?? ''}`, input.includeSnapshot, async () => {
      const snapshot = buildCareerSnapshot(chart.positionsWithUpagrahas, chart.dashas, chart.instant, new Date());
      if (!snapshot.reading) throw new Error('Career reading missing from snapshot');
      const report = style === 'plain'
        ? await generateCareerPlainSynthesisText(snapshot.reading, snapshot, input.fullName)
        : await generateCareerSynthesisText(snapshot.reading, snapshot, chart.positions, input.fullName);
      return { report, snapshot };
    });
  }));

  server.registerTool('generate_personal_report', {
    title: 'Personal / soul blueprint report (AI)',
    description: 'Plain-language personal guidance: personality (Lagna, Moon, Sun), relationships (D9), life mission, shadow work and the current life chapter, returned as structured sections. Counts against the daily report quota unless cached.',
    inputSchema: reportShape,
    annotations: REPORT_ANNOTATIONS,
  }, (input) => runTool(ctx, 'generate_personal_report', 'report', async () => {
    const chart = await loadChart(input);
    const fp = personalGuidanceFingerprint(personalBirthFingerprint(chart.instant, chart.place));
    return cachedReport(ctx, `personal|${fp}`, input.includeSnapshot, async () => {
      const snapshot = buildPersonalSnapshot(chart.positionsWithUpagrahas, chart.dashas, chart.instant, new Date());
      if (!snapshot.reading) throw new Error('Personal reading missing from snapshot');
      const report = await generatePersonalPsychGuidance(buildPersonalPsychProfile(snapshot.reading));
      return { report, snapshot };
    });
  }));

  server.registerTool('generate_year_report', {
    title: 'Year-ahead report (AI)',
    description: 'Year horoscope for the current calendar year: dasha chapter, key transits, strongest and most demanding periods, and practical focus. Counts against the daily report quota unless cached.',
    inputSchema: reportShape,
    annotations: REPORT_ANNOTATIONS,
  }, (input) => runTool(ctx, 'generate_year_report', 'report', async () => {
    const chart = await loadChart(input);
    const now = new Date();
    const fp = yearSynthesisFingerprint(yearReportFingerprint(
      chart.instant,
      chart.place,
      now.getUTCFullYear(),
      chart.dashas.current.mahadasha?.planet ?? 'Unknown',
      chart.dashas.current.antardasha?.planet ?? 'Unknown',
    ));
    return cachedReport(ctx, `year|${fp}|${input.fullName ?? ''}`, input.includeSnapshot, async () => {
      const snapshot = buildYearReading(chart.positionsWithUpagrahas, chart.dashas, now);
      const report = await generateYearSynthesisText(snapshot, input.fullName);
      return { report, snapshot };
    });
  }));

  server.registerTool('generate_daily_report', {
    title: 'Daily guidance (AI)',
    description: 'Guidance for today where the person is now. focus "day" gives plain-language energy and practical advice; "transits" interprets today\'s transit hits to the birth chart. Counts against the daily report quota unless cached.',
    inputSchema: {
      ...reportShape,
      currentPlace: z.string().min(2).max(200).optional()
        .describe('Where the person is today; defaults to the birthplace'),
      focus: z.enum(['day', 'transits']).optional(),
    },
    annotations: REPORT_ANNOTATIONS,
  }, (input) => runTool(ctx, 'generate_daily_report', 'report', async () => {
    const chart = await loadChart(input);
    const here = input.currentPlace ? await resolvePlace({ place: input.currentPlace }) : chart.place;
    const now = new Date();
    const focus = input.focus ?? 'day';
    const reportFp = dailyReportFingerprint(chart.instant, chart.place, here, now);
    const fp = focus === 'transits' ? dailyTransitGuidanceFingerprint(reportFp) : dailyGuidanceFingerprint(reportFp);
    return cachedReport(ctx, `daily|${focus}|${fp}`, input.includeSnapshot, async () => {
      const snapshot = await buildDailySnapshot(
        chart.positions,
        chart.positionsWithUpagrahas,
        chart.dashas,
        chart.instant,
        here,
        now,
      );
      const report = focus === 'transits'
        ? await generateDailyTransitGuidance(buildDailyTransitSeed(snapshot))
        : await generateDailyPlainGuidance(snapshot.psychSeed ?? buildDailyPsychSeed(snapshot));
      return { report, snapshot };
    });
  }));
}
