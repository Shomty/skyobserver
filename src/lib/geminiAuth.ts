import { configureGeminiAuth } from './api-utils';
import { getCurrentIdToken } from './authToken';

/** Attach the signed-in user's Firebase ID token to /api/gemini calls. */
export function installGeminiAuth(): void {
  configureGeminiAuth(getCurrentIdToken);
}
