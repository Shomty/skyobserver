import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createApiKeyAuth, parseApiKeys, type McpClient } from './auth.ts';
import { createMcpServer } from './createMcpServer.ts';
import { limitsFromEnv, UsageLimiter } from './limits.ts';

function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).set('Allow', 'POST').json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed — this server is stateless; use POST.' },
    id: null,
  });
}

/**
 * Streamable HTTP endpoint in stateless mode: each POST gets its own server and
 * transport, so there is no session store to grow or lose on restart.
 */
export function createMcpRouter(env: NodeJS.ProcessEnv = process.env): Router {
  const router = express.Router();
  const auth = createApiKeyAuth(parseApiKeys(env.MCP_API_KEYS));
  const limiter = new UsageLimiter(limitsFromEnv(env));

  // Authenticate before reading the body, so anonymous callers cannot make the
  // server buffer and parse payloads. Tool arguments are small.
  router.post('/', auth, express.json({ limit: '64kb' }), async (req: Request, res: Response) => {
    const client = res.locals.mcpClient as McpClient;
    const server = createMcpServer({ client, limiter });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error: unknown) {
      console.error(`${new Date().toISOString()} [SoulBlueprint:mcp] request failed`, error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
  });
  router.get('/', methodNotAllowed);
  router.delete('/', methodNotAllowed);

  // Malformed or oversized JSON → JSON-RPC parse error instead of Express's HTML page.
  router.use((err: { status?: number; type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent || !err?.type?.startsWith('entity.')) {
      next(err);
      return;
    }
    res.status(err.status ?? 400).json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null });
  });

  return router;
}
