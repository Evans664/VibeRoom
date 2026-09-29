import { auth } from '../services/auth-service.js';
import { userService } from '../services/user-service.js';
import { playlists } from '../services/playlist-service.js';
import { escapeHtml } from '../core/utils.js';
import { icons } from './icons.js';

// ---------- Toast ----------
let toastTimer;

export function showToast(message, action) {
  let toast = document.querySelector('[data-toast]');
  if (!toast) {
    document.body.insertAdjacentHTML('beforeend', '<div class="toast" data-toast role="status" aria-live="polite"></div>');
    toast = document.querySelector('[data-toast]');
  }
  toast.innerHTML = `<span>${escapeHtml(message)}</span>${
    action ? `<a href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>` : ''
  }`;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

const SIGN_IN = { href: 'auth.html?mode=signin', label: 'Sign in' };

// ---------- Likes ----------
let likedIds = new Set();
const likeListeners = new Set();
let resolveLikesReady;
// Resolves after the first load of the user's liked songs (empty for guests).
export const likesReady = new Promise((resolve) => { resolveLikesReady = resolve; });

function notifyLikes() {
  renderLikeButtons();
  likeListeners.forEach((callback) => callback(likedIds));
}

export function onLikesChanged(callback) {
  likeListeners.add(callback);
  return () => likeListeners.delete(callback);
}

export function getLikedIds() {
  return [...likedIds];
}

// Liked IDs belong to the signed-in user; reload whenever the account changes.
auth.onAuthStateChanged(async () => {
  await auth.ready();
  try {
    likedIds = new Set(auth.getCurrentUser() ? await userService.getLikedSongIds() : []);
  } catch (error) {
    console.error('Could not load liked songs', error);
    likedIds = new Set();
  }
  notifyLikes();
  resolveLikesReady();
});

export async function toggleLike(songId) {
  if (!songId) return;
  await auth.ready();
  if (!auth.getCurrentUser()) {
    showToast('Sign in to save songs you love.', SIGN_IN);
    return;
  }
  const wasLiked = likedIds.has(songId);
  // Optimistic: flip the heart now, roll back if the write fails.
  if (wasLiked) likedIds.delete(songId); else likedIds.add(songId);
  notifyLikes();
  try {
    await (wasLiked ? userService.unlikeSong(songId) : userService.likeSong(songId));
    showToast(wasLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
  } catch (error) {
    console.error('Like failed', error);
    if (wasLiked) likedIds.add(songId); else likedIds.delete(songId);
    notifyLikes();
    showToast('Could not update Liked Songs. Try again.');
  }
}

export function renderLikeButtons(root = document) {
  root.querySelectorAll('[data-action="like-song"]').forEach((button) => {
    const liked = likedIds.has(button.dataset.songId);
    button.setAttribute('aria-pressed', String(liked));
    button.setAttribute('aria-label', liked ? 'Remove from Liked Songs' : 'Save to Liked Songs');
    button.innerHTML = liked ? icons.heartFilled : icons.heart;
  });
}

// ---------- Add to playlist ----------
let dialog = null;
let pendingSongId = null;

function ensureDialog() {
  if (dialog) return dialog;
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="picker" data-playlist-picker aria-labelledby="picker-title">
      <div class="picker-header">
        <h2 id="picker-title">Add to playlist</h2>
        <button type="button" class="icon-button" data-picker-close aria-label="Close">${icons.close}</button>
      </div>
      <form class="picker-create" data-picker-create>
        <label class="visually-hidden" for="picker-name">New playlist name</label>
        <input id="picker-name" name="name" type="text" maxlength="100" placeholder="New playlist name" autocomplete="off" required>
        <button class="button button-primary" type="submit">Create</button>
      </form>
      <ul class="picker-list" data-picker-list></ul>
    </dialog>`);
  dialog = document.querySelector('[data-playlist-picker]');

  dialog.querySelector('[data-picker-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close(); // backdrop click
  });

  dialog.querySelector('[data-picker-create]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = event.target.name;
    const name = input.value.trim();
    if (!name) return;
    try {
      const playlist = await playlists.create({ name });
      input.value = '';
      if (pendingSongId) {
        await addTo(playlist);
      } else {
        dialog.close();
        showToast(`Created ${playlist.name}`);
      }
      document.dispatchEvent(new CustomEvent('playlists:changed'));
    } catch (error) {
      console.error('Create playlist failed', error);
      showToast(error.message || 'Could not create the playlist.');
    }
  });

  dialog.querySelector('[data-picker-list]').addEventListener('click', async (event) => {
    const option = event.target.closest('[data-playlist-id]');
    if (!option) return;
    const playlist = (await playlists.getMine()).find((item) => item.id === option.dataset.playlistId);
    if (playlist) await addTo(playlist);
  });
  return dialog;
}

async function addTo(playlist) {
  try {
    await playlists.addTrack(playlist.id, pendingSongId);
    dialog.close();
    showToast(`Added to ${playlist.name}`);
    document.dispatchEvent(new CustomEvent('playlists:changed'));
  } catch (error) {
    console.error('Add to playlist failed', error);
    showToast(error.message || 'Could not add to the playlist.');
  }
}

// songId null opens the picker just to create a playlist.
export async function openPlaylistPicker(songId = null) {
  await auth.ready();
  pendingSongId = songId;
  const picker = ensureDialog();
  picker.querySelector('#picker-title').textContent = songId ? 'Add to playlist' : 'New playlist';
  const list = picker.querySelector('[data-picker-list]');
  list.hidden = !songId;
  if (songId) {
    list.innerHTML = '<li class="picker-empty">Loading playlists…</li>';
    const mine = await playlists.getMine();
    list.innerHTML = mine.length
      ? mine.map((playlist) => `
          <li><button type="button" class="picker-option" data-playlist-id="${escapeHtml(playlist.id)}">
            <span class="picker-icon">${icons.playlist}</span>
            <span><strong>${escapeHtml(playlist.name)}</strong><small>${playlist.songIds.length} song${playlist.songIds.length === 1 ? '' : 's'}</small></span>
          </button></li>`).join('')
      : '<li class="picker-empty">No playlists yet. Name one above to create it.</li>';
  }
  picker.showModal();
  picker.querySelector('#picker-name').focus();
  if (!auth.getCurrentUser()) showToast('Guest playlists are saved on this device only.', SIGN_IN);
}

// Heart and + buttons work anywhere (song rows, Now Playing) through one delegated listener.
document.addEventListener('click', (event) => {
  const like = event.target.closest('[data-action="like-song"]');
  if (like) {
    toggleLike(like.dataset.songId);
    return;
  }
  const add = event.target.closest('[data-action="add-to-playlist"]');
  if (add) openPlaylistPicker(add.dataset.songId);
});
