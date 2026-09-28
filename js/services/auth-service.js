import { getFirebase } from './firebase-client.js';
import { updateState } from '../core/state.js';

// Shape defined in docs/contracts/AUTH.md; never expose a raw Firebase User.
function normalizeFirebaseUser(fbUser, profile = {}) {
  if (!fbUser) return null;
  return {
    id: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || profile.displayName || null,
    photoUrl: fbUser.photoURL || null
  };
}

const SAFE_MESSAGES = {
  'auth/not-configured': 'Accounts are not available right now. You can keep listening in guest mode.',
  'auth/invalid-credentials': 'That email and password do not match.',
  'auth/email-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/network': 'Could not reach the server. Check your connection and try again.',
  'auth/unknown': 'Something went wrong. Please try again.'
};

const FIREBASE_CODES = {
  'auth/invalid-credential': 'auth/invalid-credentials',
  'auth/invalid-email': 'auth/invalid-credentials',
  'auth/wrong-password': 'auth/invalid-credentials',
  'auth/user-not-found': 'auth/invalid-credentials',
  'auth/missing-password': 'auth/invalid-credentials',
  'auth/email-already-in-use': 'auth/email-in-use',
  'auth/weak-password': 'auth/weak-password',
  'auth/network-request-failed': 'auth/network'
};

function authError(code) {
  const error = new Error(SAFE_MESSAGES[code]);
  error.code = code;
  return error;
}

function toAuthError(err) {
  const code = FIREBASE_CODES[err?.code] || 'auth/unknown';
  if (code === 'auth/unknown') console.error('Unexpected auth error:', err);
  return authError(code);
}

let activeUser = null;
let activeFirebase = null;
const authListeners = new Set();

// Single place that changes the current user, so listeners fire once per real change.
function setActiveUser(user) {
  if (JSON.stringify(user) === JSON.stringify(activeUser)) return;
  activeUser = user;
  updateState({
    mode: user ? 'authenticated' : 'guest',
    currentUser: user
  });
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

async function requireFirebase() {
  const fb = await getFirebase();
  if (!fb.isAvailable) throw authError('auth/not-configured');
  activeFirebase = fb;
  return fb;
}

// The only Firebase auth listener; subscribers are notified through setActiveUser.
getFirebase().then((fb) => {
  if (!fb.isAvailable) return;
  activeFirebase = fb;
  fb.authModules.onAuthStateChanged(fb.auth, (fbUser) => {
    setActiveUser(normalizeFirebaseUser(fbUser));
  });
});

export const auth = {
  /**
   * Log in an existing user with email and password
   */
  async login(email, password) {
    const fb = await requireFirebase();
    try {
      const { signInWithEmailAndPassword } = fb.authModules;
      const userCredential = await signInWithEmailAndPassword(fb.auth, email, password);
      const user = normalizeFirebaseUser(userCredential.user);
      setActiveUser(user);
      return user;
    } catch (err) {
      throw toAuthError(err);
    }
  },

  /**
   * Register a new user with email, password, and optional { displayName }
   */
  async register(email, password, profile = {}) {
    const fb = await requireFirebase();
    try {
      const { createUserWithEmailAndPassword, updateProfile } = fb.authModules;
      const { doc, setDoc } = fb.firestoreModules;

      const userCredential = await createUserWithEmailAndPassword(fb.auth, email, password);
      const fbUser = userCredential.user;

      if (profile.displayName) {
        await updateProfile(fbUser, { displayName: profile.displayName });
      }

      const normalized = normalizeFirebaseUser(fbUser, profile);

      // Store initial profile document in Firestore (Spark compliant: small size)
      await setDoc(doc(fb.db, 'users', fbUser.uid), {
        displayName: normalized.displayName,
        email: normalized.email,
        createdAt: new Date().toISOString()
      });

      setActiveUser(normalized);
      return normalized;
    } catch (err) {
      throw toAuthError(err);
    }
  },

  /**
   * Sign out the active user
   */
  async logout() {
    const fb = await getFirebase();
    if (fb.isAvailable) {
      try {
        await fb.authModules.signOut(fb.auth);
      } catch (err) {
        console.error('Error signing out of Firebase:', err);
      }
    }
    setActiveUser(null);
  },

  /**
   * Return current authenticated user synchronously, or null
   */
  getCurrentUser() {
    if (activeUser) return activeUser;
    if (activeFirebase?.isAvailable && activeFirebase.auth?.currentUser) {
      activeUser = normalizeFirebaseUser(activeFirebase.auth.currentUser);
      return activeUser;
    }
    return null;
  },

  /**
   * Update the active cached user (used after profile edits)
   */
  setCurrentUser(user) {
    setActiveUser(user);
  },

  /**
   * Subscribe to auth state changes. Calls back immediately, then on every change.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(callback) {
    authListeners.add(callback);
    callback(this.getCurrentUser());
    return () => {
      authListeners.delete(callback);
    };
  }
};
