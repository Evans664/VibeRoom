import { getFirebase } from './firebase-client.js';
import { auth } from './auth-service.js';

const LOCAL_PLAYLISTS_KEY = 'viberoom_local_playlists';
const LOCAL_ID_PREFIX = 'local_pl_';
const MAX_SONGS = 500;

function playlistError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function toPlaylistError(err) {
  if (err?.code?.startsWith('playlists/')) return err;
  if (err?.code === 'permission-denied') {
    return playlistError('playlists/forbidden', 'You do not have access to this playlist.');
  }
  console.error('Unexpected playlist error:', err);
  return playlistError('playlists/unknown', 'Something went wrong with your playlist. Please try again.');
}

// Shape defined in docs/contracts/PLAYLISTS.md.
function normalizePlaylist(id, data) {
  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    description: data.description || '',
    songIds: Array.isArray(data.songIds) ? [...data.songIds] : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

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

function isLocalId(id) {
  return String(id).startsWith(LOCAL_ID_PREFIX);
}

// Firebase is used only for signed-in users; guests keep local-only playlists.
async function getRemote() {
  const fb = await getFirebase();
  return fb.isAvailable && fb.auth.currentUser ? fb : null;
}

async function updateSongIds(playlistId, change) {
  if (!playlistId) throw playlistError('playlists/invalid', 'Playlist ID is required.');

  const fb = isLocalId(playlistId) ? null : await getRemote();
  if (fb) {
    try {
      const { doc, getDoc, updateDoc } = fb.firestoreModules;
      const ref = doc(fb.db, 'playlists', playlistId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw playlistError('playlists/not-found', 'Playlist not found.');
      const current = normalizePlaylist(snap.id, snap.data());
      const songIds = change(current.songIds);
      const updatedAt = new Date().toISOString();
      await updateDoc(ref, { songIds, updatedAt });
      return { ...current, songIds, updatedAt };
    } catch (err) {
      throw toPlaylistError(err);
    }
  }

  const localLists = getLocalPlaylists();
  const target = localLists.find((p) => p.id === playlistId);
  if (!target) throw playlistError('playlists/not-found', 'Playlist not found.');
  target.songIds = change(target.songIds || []);
  target.updatedAt = new Date().toISOString();
  saveLocalPlaylists(localLists);
  return normalizePlaylist(target.id, target);
}

export const playlists = {
  /**
   * Fetch all playlists owned by the current user (or local guest playlists)
   */
  async getMine() {
    const user = auth.getCurrentUser();
    const fb = user ? await getRemote() : null;
    if (fb) {
      try {
        const { collection, query, where, getDocs } = fb.firestoreModules;
        const q = query(collection(fb.db, 'playlists'), where('ownerId', '==', user.id));
        const snap = await getDocs(q);
        return snap.docs.map((d) => normalizePlaylist(d.id, d.data()));
      } catch (err) {
        console.warn('Failed to fetch playlists from Firestore, falling back to local:', err);
      }
    }

    const ownerId = user ? user.id : 'guest';
    return getLocalPlaylists()
      .filter((p) => p.ownerId === ownerId)
      .map((p) => normalizePlaylist(p.id, p));
  },

  /**
   * Fetch a single playlist by ID, or null
   */
  async getById(id) {
    if (!id) return null;

    const fb = isLocalId(id) ? null : await getFirebase();
    if (fb?.isAvailable) {
      try {
        const { doc, getDoc } = fb.firestoreModules;
        const snap = await getDoc(doc(fb.db, 'playlists', id));
        return snap.exists() ? normalizePlaylist(snap.id, snap.data()) : null;
      } catch (err) {
        if (err?.code === 'permission-denied') return null;
        console.warn('Failed to get playlist from Firestore:', err);
      }
    }

    const local = getLocalPlaylists().find((p) => p.id === id);
    return local ? normalizePlaylist(local.id, local) : null;
  },

  /**
   * Create a new playlist
   */
  async create({ name, description = '' } = {}) {
    if (!name || !name.trim()) throw playlistError('playlists/invalid', 'Playlist name is required.');
    const user = auth.getCurrentUser();
    const now = new Date().toISOString();

    const newPlaylist = {
      ownerId: user ? user.id : 'guest',
      name: name.trim(),
      description: description.trim(),
      songIds: [],
      createdAt: now,
      updatedAt: now
    };

    const fb = user ? await getRemote() : null;
    if (fb) {
      try {
        const { collection, addDoc } = fb.firestoreModules;
        const docRef = await addDoc(collection(fb.db, 'playlists'), newPlaylist);
        return normalizePlaylist(docRef.id, newPlaylist);
      } catch (err) {
        throw toPlaylistError(err);
      }
    }

    const localItem = { id: LOCAL_ID_PREFIX + Date.now().toString(36), ...newPlaylist };
    saveLocalPlaylists([...getLocalPlaylists(), localItem]);
    return normalizePlaylist(localItem.id, localItem);
  },

  /**
   * Add a song ID to a playlist; resolves to the updated playlist
   */
  async addTrack(playlistId, songId) {
    if (!songId) throw playlistError('playlists/invalid', 'Song ID is required.');
    return updateSongIds(playlistId, (songIds) => {
      if (songIds.includes(songId)) return songIds;
      if (songIds.length >= MAX_SONGS) {
        throw playlistError('playlists/full', `A playlist can hold at most ${MAX_SONGS} songs.`);
      }
      return [...songIds, songId];
    });
  },

  /**
   * Remove a song ID from a playlist; resolves to the updated playlist
   */
  async removeTrack(playlistId, songId) {
    if (!songId) throw playlistError('playlists/invalid', 'Song ID is required.');
    return updateSongIds(playlistId, (songIds) => songIds.filter((id) => id !== songId));
  },

  /**
   * Delete a playlist
   */
  async delete(playlistId) {
    if (!playlistId) throw playlistError('playlists/invalid', 'Playlist ID is required.');

    const fb = isLocalId(playlistId) ? null : await getRemote();
    if (fb) {
      try {
        const { doc, deleteDoc } = fb.firestoreModules;
        await deleteDoc(doc(fb.db, 'playlists', playlistId));
        return;
      } catch (err) {
        throw toPlaylistError(err);
      }
    }

    saveLocalPlaylists(getLocalPlaylists().filter((p) => p.id !== playlistId));
  }
};
