#!/usr/bin/env node
/**
 * make-admin.js
 * Signs in with Firebase Auth REST API and sets role: 'admin'
 * on the matching user document in Firestore.
 *
 * Usage:
 *   node scripts/make-admin.js
 * It will prompt for email and password (password input is hidden).
 */

const https = require('https');
const readline = require('readline');

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

function httpsPatch(url, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
      },
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

async function main() {
  console.log('\n🔐 Firebase Admin Bootstrap\n');
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

  const uid     = signIn.body.localId;
  const idToken = signIn.body.idToken;
  console.log(`✅ Signed in  uid=${uid}  email=${email}`);

  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/users/${uid}` +
    `?updateMask.fieldPaths=role`;

  console.log('⏳ Setting role: admin in Firestore...');
  const patch = await httpsPatch(firestoreUrl, {
    fields: { role: { stringValue: 'admin' } }
  }, idToken);

  if (patch.status === 200) {
    console.log(`\n✅ Success! User ${email} (${uid}) is now an admin.`);
    console.log('   Refresh the app — the Admin Panel link will appear in the header.\n');
  } else {
    console.error('❌ Firestore update failed:', JSON.stringify(patch.body, null, 2));
    process.exit(1);
  }
}

main().catch(console.error);
