// Single entry point for the Firebase app instance.
// Services call getFirebaseApp(); pages and UI modules never import Firebase directly.
// Nothing is downloaded until a service asks for Firebase, so guest/mock mode stays free.

export const FIREBASE_SDK_VERSION = '12.19.0';
export const FIREBASE_SDK_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

let appPromise = null;

async function loadConfig() {
  try {
    const { firebaseConfig } = await import('../config/firebase-config.js');
    const isPlaceholder = !firebaseConfig?.apiKey || firebaseConfig.apiKey === 'REPLACE_ME';
    return isPlaceholder ? null : firebaseConfig;
  } catch {
    return null;
  }
}

// Resolves to the initialized Firebase app, or null when no local config exists.
// Callers must fall back to mock/local behavior when this resolves to null.
export function getFirebaseApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const config = await loadConfig();
      if (!config) return null;
      const { initializeApp } = await import(`${FIREBASE_SDK_BASE}/firebase-app.js`);
      return initializeApp(config);
    })();
  }
  return appPromise;
}

export async function isFirebaseConfigured() {
  return (await loadConfig()) !== null;
}
