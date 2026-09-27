import { getFirebase } from './firebase-client.js';
import { updateState } from '../core/state.js';

function normalizeFirebaseUser(fbUser, profile = {}) {
  if (!fbUser) return null;
  return {
    id: fbUser.uid,
    displayName: fbUser.displayName || profile.displayName || fbUser.email?.split('@')[0] || 'Listener',
    email: fbUser.email,
    photoUrl: fbUser.photoURL || null,
    preferences: profile.preferences || { theme: 'dark' }
  };
}

let activeUser = null;
let activeFirebase = null;
const authListeners = new Set();

function notifyListeners(user) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

// Automatically bind Firebase auth state listener when Firebase initializes
getFirebase().then((fb) => {
  if (fb.isAvailable) {
    activeFirebase = fb;
    const { onAuthStateChanged } = fb.authModules;
    onAuthStateChanged(fb.auth, (fbUser) => {
      activeUser = normalizeFirebaseUser(fbUser);
      updateState({
        mode: activeUser ? 'authenticated' : 'guest',
        currentUser: activeUser
      });
      notifyListeners(activeUser);
    });
  }
});

export const auth = {
  /**
   * Log in an existing user with email and password
   */
  async login(email, password) {
    const fb = await getFirebase();
    if (fb.isAvailable) {
      activeFirebase = fb;
      try {
        const { signInWithEmailAndPassword } = fb.authModules;
        const userCredential = await signInWithEmailAndPassword(fb.auth, email, password);
        const user = normalizeFirebaseUser(userCredential.user);
        activeUser = user;
        updateState({ mode: 'authenticated', currentUser: user });
        notifyListeners(user);
        return user;
      } catch (err) {
        throw new Error(err.message || 'Failed to log in. Please check your credentials.');
      }
    }

    // Local fallback when Firebase is not configured
    if (!email || !password) throw new Error('Email and password are required.');
    activeUser = {
      id: 'local-' + btoa(email).replace(/=/g, '').slice(0, 10),
      displayName: email.split('@')[0] || 'Listener',
      email,
      photoUrl: null,
      preferences: { theme: 'dark' }
    };
    updateState({ mode: 'authenticated', currentUser: activeUser });
    notifyListeners(activeUser);
    return activeUser;
  },

  /**
   * Register a new user with email, password, and optional profile info
   */
  async register(email, password, profile = {}) {
    const fb = await getFirebase();
    if (fb.isAvailable) {
      activeFirebase = fb;
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
          createdAt: new Date().toISOString(),
          preferences: normalized.preferences
        });

        activeUser = normalized;
        updateState({ mode: 'authenticated', currentUser: normalized });
        notifyListeners(normalized);
        return normalized;
      } catch (err) {
        throw new Error(err.message || 'Registration failed. Please try again.');
      }
    }

    // Local fallback when Firebase is not configured
    if (!email || !password) throw new Error('Email and password are required.');
    activeUser = {
      id: 'local-' + btoa(email).replace(/=/g, '').slice(0, 10),
      displayName: profile.displayName || email.split('@')[0] || 'Listener',
      email,
      photoUrl: null,
      preferences: profile.preferences || { theme: 'dark' }
    };
    updateState({ mode: 'authenticated', currentUser: activeUser });
    notifyListeners(activeUser);
    return activeUser;
  },

  /**
   * Sign out the active user
   */
  async logout() {
    const fb = await getFirebase();
    if (fb.isAvailable) {
      try {
        const { signOut } = fb.authModules;
        await signOut(fb.auth);
      } catch (err) {
        console.error('Error signing out of Firebase:', err);
      }
    }
    activeUser = null;
    updateState({ mode: 'guest', currentUser: null });
    notifyListeners(null);
  },

  /**
   * Return current authenticated or local user synchronously
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
   * Update the active cached user
   */
  setCurrentUser(user) {
    activeUser = user;
    updateState({
      mode: user ? 'authenticated' : 'guest',
      currentUser: user
    });
    notifyListeners(user);
  },

  /**
   * Subscribe to auth state changes. Returns an unsubscribe function.
   */
  onAuthStateChanged(callback) {
    authListeners.add(callback);

    // Initial sync trigger
    callback(this.getCurrentUser());

    // If Firebase is active, listen to native state changes
    let unsubscribeFb = () => {};
    getFirebase().then((fb) => {
      if (fb.isAvailable) {
        activeFirebase = fb;
        const { onAuthStateChanged: fbOnAuthStateChanged } = fb.authModules;
        unsubscribeFb = fbOnAuthStateChanged(fb.auth, (fbUser) => {
          activeUser = normalizeFirebaseUser(fbUser);
          updateState({
            mode: activeUser ? 'authenticated' : 'guest',
            currentUser: activeUser
          });
          callback(activeUser);
        });
      }
    });

    return () => {
      authListeners.delete(callback);
      unsubscribeFb();
    };
  }
};
