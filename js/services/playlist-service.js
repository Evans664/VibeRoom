import { getFirebase } from './firebase-client.js';
import { auth } from './auth-service.js';

const LOCAL_PLAYLISTS_KEY = 'viberoom_local_playlists';

function getLocalPlaylists() {
  try {
    const raw = localStorage.getItem(LOCAL_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPlaylists(lists) {
  try {
    localStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(lists));
  } catch (err) {
    console.warn('LocalStorage error saving playlists:', err);
  }
}

export const playlists = {
  /**
   * Fetch all playlists owned by the current user
   */
  async getMine() {
    const user = auth.getCurrentUser();
    if (!user) return getLocalPlaylists();

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      try {
        const { collection, query, where, getDocs } = fb.firestoreModules;
        const q = query(collection(fb.db, 'playlists'), where('ownerId', '==', user.id));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Failed to fetch playlists from Firestore, falling back to local:', err);
      }
    }

    return getLocalPlaylists().filter((p) => p.ownerId === user.id || !p.ownerId);
  },

  /**
   * Fetch a single playlist by ID
   */
  async getById(id) {
    if (!id) return null;

    const fb = await getFirebase();
    if (fb.isAvailable) {
      try {
        const { doc, getDoc } = fb.firestoreModules;
        const snap = await getDoc(doc(fb.db, 'playlists', id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('Failed to get playlist from Firestore:', err);
      }
    }

    const localLists = getLocalPlaylists();
    return localLists.find((p) => p.id === id) || null;
  },

  /**
   * Create a new playlist
   */
  async create({ name, description = '' }) {
    if (!name || !name.trim()) throw new Error('Playlist name is required.');
    const user = auth.getCurrentUser();

    const newPlaylist = {
      name: name.trim(),
      description: description.trim(),
      ownerId: user ? user.id : 'guest',
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser && user) {
      const { collection, addDoc } = fb.firestoreModules;
      const docRef = await addDoc(collection(fb.db, 'playlists'), newPlaylist);
      return { id: docRef.id, ...newPlaylist };
    }

    const localLists = getLocalPlaylists();
    const localItem = {
      id: 'local_pl_' + Date.now().toString(36),
      ...newPlaylist
    };
    localLists.push(localItem);
    saveLocalPlaylists(localLists);
    return localItem;
  },

  /**
   * Add a track ID to a playlist
   */
  async addTrack(playlistId, songId) {
    if (!playlistId || !songId) throw new Error('Playlist ID and Song ID are required.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, updateDoc, arrayUnion } = fb.firestoreModules;
      await updateDoc(doc(fb.db, 'playlists', playlistId), {
        trackIds: arrayUnion(songId),
        updatedAt: new Date().toISOString()
      });
      return true;
    }

    const localLists = getLocalPlaylists();
    const target = localLists.find((p) => p.id === playlistId);
    if (!target) throw new Error('Playlist not found.');
    if (!target.trackIds.includes(songId)) {
      target.trackIds.push(songId);
      target.updatedAt = new Date().toISOString();
      saveLocalPlaylists(localLists);
    }
    return true;
  },

  /**
   * Remove a track ID from a playlist
   */
  async removeTrack(playlistId, songId) {
    if (!playlistId || !songId) throw new Error('Playlist ID and Song ID are required.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, updateDoc, arrayRemove } = fb.firestoreModules;
      await updateDoc(doc(fb.db, 'playlists', playlistId), {
        trackIds: arrayRemove(songId),
        updatedAt: new Date().toISOString()
      });
      return true;
    }

    const localLists = getLocalPlaylists();
    const target = localLists.find((p) => p.id === playlistId);
    if (!target) throw new Error('Playlist not found.');
    target.trackIds = target.trackIds.filter((id) => id !== songId);
    target.updatedAt = new Date().toISOString();
    saveLocalPlaylists(localLists);
    return true;
  },

  /**
   * Delete a playlist
   */
  async delete(playlistId) {
    if (!playlistId) throw new Error('Playlist ID is required.');

    const fb = await getFirebase();
    if (fb.isAvailable && fb.auth.currentUser) {
      const { doc, deleteDoc } = fb.firestoreModules;
      await deleteDoc(doc(fb.db, 'playlists', playlistId));
      return true;
    }

    const localLists = getLocalPlaylists();
    const filtered = localLists.filter((p) => p.id !== playlistId);
    saveLocalPlaylists(filtered);
    return true;
  }
};
