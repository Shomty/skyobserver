#!/usr/bin/env node
/**
 * make-admin.js
 * Sets role: 'admin' on a user's Firestore document.
 *
 * Two modes:
 *
 * 1. Email/password (only works if the account has a password set):
 *      node scripts/make-admin.js
 *
 * 2. Token mode (works for Google OAuth accounts):
 *      node scripts/make-admin.js --token
 *    → Opens the app in a browser, open DevTools Console and run:
 *        (await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'))
 *    → Actually easier: in the app, open DevTools → Network tab →
 *      filter by "firestore" → click any request → copy the
 *      "Authorization: Bearer <token>" value → paste here.
 *    OR use the --uid flag to skip sign-in entirely (requires manual Firestore edit):
 *      node scripts/make-admin.js --uid <uid>  --token <token>
 */

import https from 'https';
import readline from 'readline';

const PROJECT_ID   = 'gen-lang-client-0197594285';
const DATABASE_ID  = 'ai-studio-2cf60d21-2a74-4491-bf70-81dcb172e048';
const API_KEY      = 'AIzaSyB2AqUzhnb5X9dFymi5O8o4YTZfOZ7toA8';

// Parse CLI args: --uid <value> --token <value> --token-mode
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
const CLI_UID        = getArg('--uid');
const CLI_TOKEN      = getArg('--token');
const TOKEN_MODE     = args.includes('--token-mode') || !!CLI_TOKEN;

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
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

async function resolveUidFromToken(idToken) {
  const res = await httpsPost(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    { idToken }
  );
  if (res.status === 200 && res.body.users?.[0]?.localId) {
    return { uid: res.body.users[0].localId, email: res.body.users[0].email };
  }
  return null;
}

async function main() {
  console.log('\n🔐 Firebase Admin Bootstrap\n');

  let idToken, uid, email;

  if (TOKEN_MODE) {
    // ── Token mode: user pastes a Firebase ID token obtained from the browser ──
    console.log('TOKEN MODE — get your Firebase ID token from the browser:');
    console.log('  1. Open the app and sign in');
    console.log('  2. Open DevTools → Network tab');
    console.log('  3. Filter requests by "googleapis"');
    console.log('  4. Click any Firestore/Auth request');
    console.log('  5. Look in Request Headers for:  Authorization: Bearer <token>');
    console.log('  6. Copy just the token part (starts with "ey...")\n');

    idToken = CLI_TOKEN || await prompt('Paste your Firebase ID token: ');
    idToken = idToken.trim().replace(/^Bearer\s+/i, '');

    if (CLI_UID) {
      uid = CLI_UID;
      email = '(from --uid flag)';
    } else {
      console.log('⏳ Looking up user from token...');
      const info = await resolveUidFromToken(idToken);
      if (!info) {
        console.error('❌ Could not look up user from token. Try passing --uid <uid> explicitly.');
        process.exit(1);
      }
      ({ uid, email } = info);
    }
    console.log(`✅ User identified  uid=${uid}  email=${email}`);

  } else {
    // ── Email/password mode ──
    email    = await prompt('Firebase account email: ');
    const password = await prompt('Password (hidden): ', true);

    console.log('\n⏳ Signing in...');
    const signIn = await httpsPost(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      { email, password, returnSecureToken: true }
    );

    if (signIn.status !== 200 || !signIn.body.idToken) {
      const msg = signIn.body.error?.message || '';
      console.error('❌ Sign-in failed:', msg);
      if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('EMAIL_NOT_FOUND')) {
        console.error('\n💡 You probably signed up with Google OAuth (not email/password).');
        console.error('   Re-run with token mode instead:\n');
        console.error('     node scripts/make-admin.js --token-mode\n');
        console.error('   OR set role directly in Firebase Console:');
        console.error('   https://console.firebase.google.com/project/gen-lang-client-0197594285/firestore/databases/ai-studio-2cf60d21-2a74-4491-bf70-81dcb172e048/data\n');
        console.error('   Navigate to users → <your UID> → add field  role = "admin"\n');
      }
      process.exit(1);
    }

    uid     = signIn.body.localId;
    idToken = signIn.body.idToken;
    console.log(`✅ Signed in  uid=${uid}  email=${email}`);
  }

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
