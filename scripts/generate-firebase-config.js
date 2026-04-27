/**
 * Generates firebase-applet-config.json from environment variables.
 * Runs automatically via the "prebuild" npm hook before `npm run build`.
 *
 * Local dev: skipped when the file already exists (use firebase-applet-config.example.json as a template).
 * Railway / CI: generates the file from FIREBASE_* environment variables.
 */
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outPath = resolve(__dirname, '..', 'firebase-applet-config.json');
const isCi = !!process.env.CI || !!process.env.RAILWAY_ENVIRONMENT;

// Local dev: skip if file already exists
if (existsSync(outPath) && !isCi) {
  console.log('firebase-applet-config.json already exists — skipping generation.');
  process.exit(0);
}

const config = {
  projectId:           process.env.FIREBASE_PROJECT_ID            || '',
  appId:               process.env.FIREBASE_APP_ID                || '',
  apiKey:              process.env.FIREBASE_API_KEY               || '',
  authDomain:          process.env.FIREBASE_AUTH_DOMAIN           || '',
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID           || '',
  storageBucket:       process.env.FIREBASE_STORAGE_BUCKET        || '',
  messagingSenderId:   process.env.FIREBASE_MESSAGING_SENDER_ID   || '',
  measurementId:       process.env.FIREBASE_MEASUREMENT_ID        || '',
};

// Validate required vars in CI/Railway
if (isCi) {
  const required = {
    projectId:         'FIREBASE_PROJECT_ID',
    appId:             'FIREBASE_APP_ID',
    apiKey:            'FIREBASE_API_KEY',
    authDomain:        'FIREBASE_AUTH_DOMAIN',
    storageBucket:     'FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  };
  const missing = Object.entries(required)
    .filter(([key]) => !config[key])
    .map(([, envVar]) => envVar);
  if (missing.length > 0) {
    console.error('❌ Missing required Firebase environment variables:', missing.join(', '));
    process.exit(1);
  }
}

writeFileSync(outPath, JSON.stringify(config, null, 2));
console.log('✅ firebase-applet-config.json generated from environment variables.');
