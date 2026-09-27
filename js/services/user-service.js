import { getFirebase } from './firebase-client.js';
import { auth } from './auth-service.js';

const LOCAL_STORAGE_KEY_PREFIX = 'viberoom_user_';

function getLocalData(userId, key, defaultVal) {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData(userId, key, val) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}_${key}`, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

export const userService = {
  /**
   * Retrieve user profile from Firestore or local fallback
   */
  async getProfile() {
    const user = auth.getCurrentUser();
    if (!user) return null;

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      try {
        const { doc, getDoc } = fb.firestoreModules;
        const snap = await getDoc(doc(fb.db, 'users', user.id));
        if (snap.exists()) {
          return { id: user.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('Failed to fetch profile from Firestore, using auth snapshot:', err);
      }
    }

    return getLocalData(user.id, 'profile', user);
  },

  /**
   * Update profile fields (displayName, etc.)
   */
  async updateProfile(fields = {}) {
    const user = auth.getCurrentUser();
    if (!user) throw new Error('Authentication required to update profile.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, setDoc } = fb.firestoreModules;
      await setDoc(doc(fb.db, 'users', user.id), fields, { merge: true });
      if (fields.displayName && fb.auth.currentUser) {
        const { updateProfile: updateFbProfile } = fb.authModules;
        await updateFbProfile(fb.auth.currentUser, { displayName: fields.displayName });
      }
    }

    const updated = { ...user, ...fields };
    if (auth.setCurrentUser) {
      auth.setCurrentUser(updated);
    }
    setLocalData(user.id, 'profile', updated);
    return updated;
  },

  /**
   * Get list of liked song IDs
   */
  async getLikedSongIds() {
    const user = auth.getCurrentUser();
    if (!user) return [];

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      try {
        const { collection, getDocs } = fb.firestoreModules;
        const snap = await getDocs(collection(fb.db, 'likes', user.id, 'songs'));
        return snap.docs.map((d) => d.id);
      } catch (err) {
        console.warn('Failed to fetch liked songs from Firestore:', err);
      }
    }

    return getLocalData(user.id, 'liked_songs', []);
  },

  /**
   * Mark a song as liked
   */
  async likeSong(songId) {
    if (!songId) throw new Error('Song ID is required.');
    const user = auth.getCurrentUser();
    if (!user) throw new Error('Authentication required to like songs.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, setDoc } = fb.firestoreModules;
      await setDoc(doc(fb.db, 'likes', user.id, 'songs', songId), {
        songId,
        likedAt: new Date().toISOString()
      });
    }

    const currentLikes = getLocalData(user.id, 'liked_songs', []);
    if (!currentLikes.includes(songId)) {
      currentLikes.push(songId);
      setLocalData(user.id, 'liked_songs', currentLikes);
    }

    return true;
  },

  /**
   * Remove a song from likes
   */
  async unlikeSong(songId) {
    if (!songId) throw new Error('Song ID is required.');
    const user = auth.getCurrentUser();
    if (!user) throw new Error('Authentication required to unlike songs.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, deleteDoc } = fb.firestoreModules;
      await deleteDoc(doc(fb.db, 'likes', user.id, 'songs', songId));
    }

    const currentLikes = getLocalData(user.id, 'liked_songs', []);
    const updated = currentLikes.filter((id) => id !== songId);
    setLocalData(user.id, 'liked_songs', updated);

    return true;
  },

  /**
   * Save user preferences (theme, audio quality, etc.)
   */
  async savePreferences(preferences = {}) {
    const user = auth.getCurrentUser();
    if (!user) throw new Error('Authentication required to save preferences.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, setDoc } = fb.firestoreModules;
      await setDoc(doc(fb.db, 'users', user.id), { preferences }, { merge: true });
    }

    setLocalData(user.id, 'preferences', preferences);
    return preferences;
  }
};
