/**
 * Firebase Client Adapter
 * Dynamically loads and initializes Firebase SDK from CDN only if a valid
 * js/config/firebase-config.js file is present. Falls back cleanly to null
 * so services can operate in local/mock mode without breaking the app.
 */

// One SDK version for the whole app; bump it here only.
export const FIREBASE_SDK_BASE = 'https://www.gstatic.com/firebasejs/12.19.0';

let initPromise = null;
let initializedState = {
  isAvailable: false,
  app: null,
  auth: null,
  db: null,
  authModules: null,
  firestoreModules: null
};

export async function getFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Try to load local config dynamically (so missing file won't break page load)
      let config = null;
      try {
        const configModule = await import('../config/firebase-config.js');
        config = configModule?.firebaseConfig;
      } catch {
        // Config file not present - expected in local/guest development
        return initializedState;
      }

      // Check if config has placeholders or missing critical fields
      if (!config || !config.apiKey || config.apiKey.includes('REPLACE_ME')) {
        return initializedState;
      }

      // 2. Load the modular Firebase SDK from the official Google CDN
      const [appMod, authMod, firestoreMod] = await Promise.all([
        import(`${FIREBASE_SDK_BASE}/firebase-app.js`),
        import(`${FIREBASE_SDK_BASE}/firebase-auth.js`),
        import(`${FIREBASE_SDK_BASE}/firebase-firestore.js`)
      ]);

      const app = appMod.initializeApp(config);
      const auth = authMod.getAuth(app);
      const db = firestoreMod.getFirestore(app);

      initializedState = {
        isAvailable: true,
        app,
        auth,
        db,
        authModules: authMod,
        firestoreModules: firestoreMod
      };

      return initializedState;
    } catch (err) {
      console.warn('Firebase initialization failed, falling back to local mode:', err);
      return initializedState;
    }
  })();

  return initPromise;
}
