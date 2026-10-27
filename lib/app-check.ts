import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { firebaseApp } from './firebase';

/**
 * Initializes Firebase App Check with reCAPTCHA v3 if site key is configured.
 */
export function initAppCheck(appInstance?: FirebaseApp | null): void {
  if (typeof window === 'undefined') return;
  const app = appInstance || firebaseApp;
  if (!app) return;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    // App check not configured; skips silently
    return;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Silently skip if App Check fails or already initialized
  }
}
