import { createHash, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export interface McpClient {
  id: string;
}

interface KeyEntry {
  clientId: string;
  hash: Buffer;
}

const CLIENT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/i;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i;

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Parse `MCP_API_KEYS`: comma-separated `clientId:sha256hex` pairs. Only the
 * hash lives in the environment, so a leaked env file does not leak keys.
 * Malformed entries throw at startup rather than silently locking a client out.
 */
export function parseApiKeys(raw: string | undefined): KeyEntry[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const [clientId, hash, ...rest] = part.split(':');
    if (rest.length > 0 || !clientId || !hash || !CLIENT_ID_PATTERN.test(clientId) || !SHA256_HEX_PATTERN.test(hash)) {
      throw new Error(`Invalid MCP_API_KEYS entry "${part.slice(0, 24)}…" — expected clientId:sha256hex`);
    }
    return { clientId, hash: Buffer.from(hash.toLowerCase(), 'hex') };
  });
}

/** Constant-time lookup across every entry, so timing does not reveal which keys exist. */
export function findClient(entries: KeyEntry[], presentedKey: string): McpClient | null {
  const presented = Buffer.from(hashApiKey(presentedKey), 'hex');
  let match: McpClient | null = null;
  for (const entry of entries) {
    if (timingSafeEqual(entry.hash, presented) && !match) {
      match = { id: entry.clientId };
    }
  }
  return match;
}

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? match[1] : null;
}

function rejectJsonRpc(res: Response, status: number, message: string): void {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32001, message }, id: null });
}

/** Express middleware — sets `res.locals.mcpClient` for the MCP handler. */
export function createApiKeyAuth(entries: KeyEntry[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (entries.length === 0) {
      rejectJsonRpc(res, 503, 'MCP access is not configured on this server');
      return;
    }
    const key = readBearer(req);
    const client = key ? findClient(entries, key) : null;
    if (!client) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="soulblueprint-mcp"');
      rejectJsonRpc(res, 401, 'Missing or invalid API key');
      return;
    }
    res.locals.mcpClient = client;
    next();
  };
}
