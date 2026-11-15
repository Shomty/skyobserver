#!/usr/bin/env node
/**
 * create-mcp-key.js
 * Issues an API key for an MCP connector client.
 *
 *   node scripts/create-mcp-key.js <clientId>
 *
 * Prints the key once (hand it to the client) and the `clientId:sha256` entry
 * to append to MCP_API_KEYS on the server. Only the hash is stored server-side,
 * so a lost key cannot be recovered — issue a new one and remove the old entry.
 */
import { createHash, randomBytes } from 'crypto';

const clientId = process.argv[2];
if (!clientId || !/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(clientId)) {
  console.error('Usage: node scripts/create-mcp-key.js <clientId>   (letters, digits, - and _)');
  process.exit(1);
}

const key = `sbk_${randomBytes(32).toString('base64url')}`;
const hash = createHash('sha256').update(key, 'utf8').digest('hex');

console.log(`\nAPI key for "${clientId}" (shown once — send it to the client securely):\n\n  ${key}\n`);
console.log('Append this entry to MCP_API_KEYS (comma-separated) on the server and restart:\n');
console.log(`  ${clientId}:${hash}\n`);
