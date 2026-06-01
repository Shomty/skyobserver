#!/usr/bin/env node
/**
 * backup-db.js
 * Exports all Firestore user documents to a timestamped JSON file.
 * Saves to: /root/soulblueprint/backups/backup-YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/backup-db.js
 * Prompts for Firebase credentials to authenticate.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const PROJECT_ID   = 'gen-lang-client-0197594285';
const DATABASE_ID  = 'ai-studio-2cf60d21-2a74-4491-bf70-81dcb172e048';
const API_KEY      = 'AIzaSyB2AqUzhnb5X9dFymi5O8o4YTZfOZ7toA8';

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    };
    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let input = '';
      process.stdin.on('data', function handler(char) {
        char = char.toString();
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F') {
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      });
    } else {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return {};
  const result = { _path: doc.name };
  for (const [key, val] of Object.entries(doc.fields)) {
    if (val.stringValue  !== undefined) result[key] = val.stringValue;
    else if (val.integerValue  !== undefined) result[key] = Number(val.integerValue);
    else if (val.doubleValue   !== undefined) result[key] = val.doubleValue;
    else if (val.booleanValue  !== undefined) result[key] = val.booleanValue;
    else if (val.nullValue     !== undefined) result[key] = null;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.arrayValue    !== undefined) result[key] = (val.arrayValue.values || []).map(v => parseFirestoreDoc({ fields: { _: v } })._);
    else if (val.mapValue      !== undefined) result[key] = parseFirestoreDoc(val.mapValue);
    else result[key] = val;
  }
  return result;
}

async function listCollection(collectionPath, token) {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collectionPath}`;
  const docs = [];
  let pageToken = null;
  do {
    const url = base + (pageToken ? `?pageToken=${pageToken}` : '');
    const res = await httpsGet(url, token);
    if (res.status !== 200) { console.error(`  ⚠ ${collectionPath} returned ${res.status}`); break; }
    (res.body.documents || []).forEach(d => docs.push(parseFirestoreDoc(d)));
    pageToken = res.body.nextPageToken || null;
  } while (pageToken);
  return docs;
}

async function main() {
  console.log('\n📦 Firestore Backup Tool\n');
  const email    = await prompt('Firebase account email: ');
  const password = await prompt('Password (hidden): ', true);

  console.log('\n⏳ Signing in...');
  const signIn = await httpsPost(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email, password, returnSecureToken: true }
  );

  if (signIn.status !== 200 || !signIn.body.idToken) {
    console.error('❌ Sign-in failed:', signIn.body.error?.message || JSON.stringify(signIn.body));
    process.exit(1);
  }

  const token = signIn.body.idToken;
  console.log('✅ Authenticated\n');

  console.log('⏳ Fetching users collection...');
  const users = await listCollection('users', token);
  console.log(`   Found ${users.length} user documents`);

  const backup = {
    exportedAt: new Date().toISOString(),
    projectId: PROJECT_ID,
    databaseId: DATABASE_ID,
    collections: { users },
  };

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const outPath = path.join(backupDir, `backup-${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup saved to: ${outPath}`);
  console.log(`   ${users.length} user profiles exported\n`);
}

main().catch(console.error);
