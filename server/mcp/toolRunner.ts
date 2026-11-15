import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpClient } from './auth.ts';
import type { ToolKind, UsageLimiter } from './limits.ts';
import { errorResult, QuotaExceededError, ToolInputError } from './toolResult.ts';

export interface ToolContext {
  client: McpClient;
  limiter: UsageLimiter;
}

export interface UsageEvent {
  clientId: string;
  tool: string;
  kind: ToolKind;
  ms: number;
  outcome: 'ok' | 'input_error' | 'quota' | 'error';
  cached?: boolean;
}

/** One structured line per tool call. Never includes birth data or report text. */
export function logUsage(event: UsageEvent): void {
  console.info(`${new Date().toISOString()} [SoulBlueprint:mcp] usage ${JSON.stringify(event)}`);
}

export interface RunOutcome {
  result: CallToolResult;
  cached?: boolean;
}

/**
 * Wraps every tool handler: enforces the calculation rate limit, turns caller
 * mistakes and quota hits into tool errors the client's model can act on, and
 * hides internal failure details behind a generic message.
 *
 * Report tools additionally consume their daily quota inside the handler,
 * because a cache hit should not count against it.
 */
export async function runTool(
  ctx: ToolContext,
  tool: string,
  kind: ToolKind,
  handler: () => Promise<RunOutcome>,
): Promise<CallToolResult> {
  const started = Date.now();
  const log = (outcome: UsageEvent['outcome'], cached?: boolean) =>
    logUsage({ clientId: ctx.client.id, tool, kind, ms: Date.now() - started, outcome, cached });

  try {
    // Every call, report or not, counts toward the per-minute limit: even a
    // cached report still geocodes and resolves a chart.
    ctx.limiter.consume(ctx.client.id, 'calc');
    const { result, cached } = await handler();
    log('ok', cached);
    return result;
  } catch (error: unknown) {
    if (error instanceof ToolInputError) {
      log('input_error');
      return errorResult(error.message);
    }
    if (error instanceof QuotaExceededError) {
      log('quota');
      return errorResult(error.message);
    }
    log('error');
    console.error(`${new Date().toISOString()} [SoulBlueprint:mcp] ${tool} failed`, error instanceof Error ? error.message : error);
    return errorResult(`${tool} failed due to a server error. Please retry shortly.`);
  }
}
