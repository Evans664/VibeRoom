import { getAlbumById, getAlbums, getSongs, getSongsByIds, searchAlbums, searchSongs } from './services/music-service.js';
import { renderAlbumGrid, renderGenreGrid, renderPlaylistGrid, renderSongList, renderState } from './ui/components.js';
import { initPlayerUI, openNowPlaying } from './ui/player.js';
import { player } from './player/player.js';
import { auth } from './services/auth-service.js';
import { playlists } from './services/playlist-service.js';
import { getLikedIds, likesReady, onLikesChanged, openPlaylistPicker, renderLikeButtons, showToast } from './ui/library.js';

const PLACEHOLDER_COVER = '../assets/images/cover-placeholder.svg';

// Remote artwork hosts can be down: try the next mirror, then the placeholder.
document.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !('fallbacks' in img.dataset)) return;
  const [next, ...rest] = img.dataset.fallbacks.split(' ').filter(Boolean);
  if (next) {
    img.dataset.fallbacks = rest.join(' ');
    img.src = next;
  } else {
    delete img.dataset.fallbacks;
    img.src = PLACEHOLDER_COVER;
  }
}, true);

const loadError = {
  type: 'error',
  title: 'Something went wrong',
  message: 'We could not load this section. Refresh the page to try again.'
};

// Each region renders independently so one failing source never blanks the whole page.
async function renderRegion(selector, load, render, emptyState) {
  const target = document.querySelector(selector);
  if (!target) return [];
  target.setAttribute('aria-busy', 'true');
  try {
    const items = await load();
    target.innerHTML = items.length ? render(items) : renderState({ type: 'empty', ...emptyState });
    renderLikeButtons(target);
    return items;
  } catch (error) {
    console.error(`Failed to render ${selector}`, error);
    target.innerHTML = renderState(loadError);
    return [];
  } finally {
    target.removeAttribute('aria-busy');
  }
}

// Rows queue the whole list so next/previous move through it. The small play button only
// plays/pauses; clicking anywhere else on the row also opens the Now Playing view.
function connectSongInteractions(container, getSongsForList) {
  if (!container || container.dataset.interactionsBound === 'true') return;
  container.dataset.interactionsBound = 'true';

  container.addEventListener('click', async (event) => {
    const row = event.target.closest('.song-row');
    // Heart, add and remove buttons have their own handlers.
    if (!row || event.target.closest('[data-action="like-song"], [data-action="add-to-playlist"], [data-action="remove-from-playlist"]')) return;
    const isPlayButton = Boolean(event.target.closest('[data-action="play-song"]'));

    const songs = getSongsForList();
    const songIndex = songs.findIndex((item) => item.id === row.dataset.songId);
    if (songIndex === -1) return;

    const song = songs[songIndex];
    const { currentTrack, isPlaying } = player.getState();
    const isCurrent = currentTrack?.id === song.id;

    if (isPlayButton && isCurrent && isPlaying) {
      player.pause();
      return;
    }

    let playback = null;
    if (!isCurrent || !isPlaying) {
      if (!isCurrent) player.setQueue(songs, songIndex);
      // play() sets the current track synchronously, so the view can open right away.
      playback = player.play(song);
    }
    if (!isPlayButton) openNowPlaying();

    try {
      await playback;
    } catch (error) {
      console.error('Playback error:', error);
    }
  });
}

async function loadHomePage() {
  const songs = await renderRegion('[data-song-list]', getSongs, renderSongList, {
    title: 'No tracks yet',
    message: 'New music will show up here as soon as it lands.'
  });
  connectSongInteractions(document.querySelector('[data-song-list]'), () => songs);

  renderRegion('[data-album-grid]', getAlbums, renderAlbumGrid, {
    title: 'No albums yet',
    message: 'Albums will appear once the catalog grows.'
  });
}

async function loadSearchPage() {
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');
  if (!input || !results) return;

  const albumSection = document.querySelector('[data-album-results-section]');
  const albumResults = document.querySelector('[data-album-results]');
  let currentSongs = [];
  let searchTimer;
  let latestSearch = 0;
  connectSongInteractions(results, () => currentSongs);

  // Albums are a bonus row: hidden for an empty query, when none match, or if the lookup fails.
  async function runAlbumSearch(query, searchId) {
    let albums = [];
    try {
      albums = await searchAlbums(query);
    } catch (error) {
      console.error('Album search failed', error);
    }
    if (searchId !== latestSearch || !albumSection) return;
    albumSection.hidden = !albums.length;
    albumResults.innerHTML = renderAlbumGrid(albums);
  }

  async function runSearch(query) {
    // Typing fast fires several searches; only the newest one may update the page.
    const searchId = ++latestSearch;
    runAlbumSearch(query, searchId);
    try {
      const songs = await searchSongs(query);
      if (searchId !== latestSearch) return;
      currentSongs = songs;
      results.innerHTML = currentSongs.length
        ? renderSongList(currentSongs)
        : renderState({ type: 'empty', title: 'No matches', message: `Nothing found for "${query}". Try another song, artist or genre.` });
      renderLikeButtons(results);
      if (status) {
        status.textContent = query ? `${currentSongs.length} result${currentSongs.length === 1 ? '' : 's'} found.` : '';
      }
    } catch (error) {
      if (searchId !== latestSearch) return;
      console.error('Search failed', error);
      currentSongs = [];
      results.innerHTML = renderState({ type: 'error', title: 'Search failed', message: 'Please try again.' });
      if (status) status.textContent = 'Unable to complete search.';
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value.trim()), 150);
  });

  runSearch('');
}

renderRegion('[data-genre-grid]', async () => [...new Set((await getSongs()).map((song) => song.genre))],
  renderGenreGrid, { title: 'No genres yet' });

function displayNameOf(user) {
  return user.displayName || user.email?.split('@')[0] || 'Listener';
}

// Header account area: guest chip + sign-in link, or the user's name + sign-out.
function renderAccount(user) {
  const chip = document.querySelector('.mode-chip');
  if (!chip) return;
  let account = chip.closest('.account');
  if (!account) {
    account = document.createElement('div');
    account.className = 'account';
    chip.replaceWith(account);
    account.append(chip);
  }
  account.querySelector('.account-action')?.remove();
  chip.textContent = user ? displayNameOf(user) : 'Guest mode';
  if (user) {
    const signOut = document.createElement('button');
    signOut.type = 'button';
    signOut.className = 'account-action';
    signOut.textContent = 'Sign out';
    signOut.addEventListener('click', () => auth.logout());
    account.append(signOut);
  } else {
    account.insertAdjacentHTML('beforeend', '<a class="account-action" href="auth.html?mode=signin">Sign in</a>');
  }
}

auth.onAuthStateChanged(renderAccount);
const formatCount = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

async function loadLibraryPage() {
  const root = document.querySelector('[data-library]');
  if (!root) return;
  await auth.ready();
  const user = auth.getCurrentUser();
  root.querySelector('[data-library-eyebrow]').textContent = user ? `${displayNameOf(user)}'s room` : 'Guest mode';

  const grid = root.querySelector('[data-playlist-grid]');
  const renderPlaylists = async () => {
    try {
      const mine = await playlists.getMine();
      grid.innerHTML = mine.length
        ? renderPlaylistGrid(mine)
        : renderState({ type: 'empty', title: 'No playlists yet', message: 'Create one here, or tap + on any song.' });
    } catch (error) {
      console.error('Failed to load playlists', error);
      grid.innerHTML = renderState(loadError);
    }
  };
  root.querySelector('[data-create-playlist]').addEventListener('click', () => openPlaylistPicker(null));
  document.addEventListener('playlists:changed', renderPlaylists);
  renderPlaylists();

  const likedList = root.querySelector('[data-liked-list]');
  const likedCount = root.querySelector('[data-liked-count]');
  if (!user) {
    likedList.innerHTML = renderState({
      type: 'empty',
      title: 'Save songs you love',
      message: 'Sign in and tap the heart on any song to keep it here.',
      action: { label: 'Sign in', href: 'auth.html?mode=signin' }
    });
    return;
  }

  let likedSongs = [];
  connectSongInteractions(likedList, () => likedSongs);
  const renderLiked = async () => {
    try {
      likedSongs = await getSongsByIds(getLikedIds());
      likedCount.textContent = likedSongs.length ? formatCount(likedSongs.length, 'song') : '';
      likedList.innerHTML = likedSongs.length
        ? renderSongList(likedSongs)
        : renderState({ type: 'empty', title: 'No liked songs yet', message: 'Tap the heart on any song to save it here.', action: { label: 'Find music', href: 'search.html' } });
      renderLikeButtons(likedList);
    } catch (error) {
      console.error('Failed to load liked songs', error);
      likedList.innerHTML = renderState(loadError);
    }
  };
  await likesReady;
  onLikesChanged(renderLiked);
  renderLiked();
}

async function loadPlaylistPage() {
  const root = document.querySelector('[data-playlist-page]');
  if (!root) return;
  await auth.ready();
  const id = new URLSearchParams(location.search).get('id');
  let playlist = id ? await playlists.getById(id) : null;
  const list = root.querySelector('[data-playlist-songs]');

  if (!playlist) {
    root.querySelector('[data-playlist-name]').textContent = 'Playlist not found';
    root.querySelector('[data-playlist-actions]').hidden = true;
    list.innerHTML = renderState({ type: 'empty', title: 'We could not find that playlist', message: 'It may have been deleted.', action: { label: 'Back to Library', href: 'library.html' } });
    return;
  }

  const isOwner = playlist.ownerId === (auth.getCurrentUser()?.id ?? 'guest');
  const playButton = root.querySelector('[data-playlist-play]');
  const deleteButton = root.querySelector('[data-playlist-delete]');
  deleteButton.hidden = !isOwner;
  let songs = [];

  const render = async () => {
    songs = await getSongsByIds(playlist.songIds);
    document.title = `VibeRoom | ${playlist.name}`;
    root.querySelector('[data-playlist-name]').textContent = playlist.name;
    const minutes = Math.round(songs.reduce((total, song) => total + song.duration, 0) / 60);
    root.querySelector('[data-playlist-meta]').textContent = songs.length ? `${formatCount(songs.length, 'song')} · ${minutes} min` : 'No songs yet';
    playButton.disabled = !songs.length;
    list.innerHTML = songs.length
      ? renderSongList(songs, { removable: isOwner })
      : renderState({ type: 'empty', title: 'This playlist is empty', message: 'Tap + on any song to add it here.', action: { label: 'Find music', href: 'search.html' } });
    renderLikeButtons(list);
  };

  connectSongInteractions(list, () => songs);
  list.addEventListener('click', async (event) => {
    const remove = event.target.closest('[data-action="remove-from-playlist"]');
    if (!remove) return;
    try {
      playlist = await playlists.removeTrack(playlist.id, remove.dataset.songId);
      await render();
      showToast(`Removed from ${playlist.name}`);
    } catch (error) {
      console.error('Remove failed', error);
      showToast('Could not remove that song. Try again.');
    }
  });

  playButton.addEventListener('click', () => {
    if (!songs.length) return;
    player.setQueue(songs, 0);
    player.play(songs[0]).catch((error) => console.error('Playback error:', error));
  });

  deleteButton.addEventListener('click', async () => {
    if (!confirm(`Delete "${playlist.name}"? This cannot be undone.`)) return;
    try {
      await playlists.delete(playlist.id);
      location.replace('library.html');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Could not delete the playlist. Try again.');
    }
  });

  // e.g. a song added to this playlist from Now Playing
  document.addEventListener('playlists:changed', async () => {
    playlist = (await playlists.getById(playlist.id)) || playlist;
    render();
  });

  render();
}

async function loadAlbumPage() {
  const root = document.querySelector('[data-album-page]');
  if (!root) return;
  const list = root.querySelector('[data-album-songs]');
  const playButton = root.querySelector('[data-album-play]');
  const id = new URLSearchParams(location.search).get('id');

  let album = null;
  try {
    album = id ? await getAlbumById(id) : null;
  } catch (error) {
    console.error('Failed to load album', error);
    root.querySelector('[data-album-title]').textContent = 'Album';
    list.innerHTML = renderState(loadError);
    return;
  }
  if (!album) {
    root.querySelector('[data-album-title]').textContent = 'Album not found';
    root.querySelector('[data-album-actions]').hidden = true;
    list.innerHTML = renderState({ type: 'empty', title: 'We could not find that album', message: 'It may have been removed by the artist.', action: { label: 'Back to Home', href: 'home.html' } });
    return;
  }

  const songs = await getSongsByIds(album.songIds);
  document.title = `VibeRoom | ${album.title}`;
  const cover = root.querySelector('[data-album-cover]');
  cover.dataset.fallbacks = (album.coverFallbacks || []).join(' ');
  cover.src = album.cover;
  cover.alt = `${album.title} cover`;
  root.querySelector('[data-album-title]').textContent = album.title;
  const minutes = Math.round(songs.reduce((total, song) => total + song.duration, 0) / 60);
  const year = album.releaseDate?.slice(0, 4);
  root.querySelector('[data-album-meta]').textContent = [album.artist, year, formatCount(songs.length, 'song'), songs.length ? `${minutes} min` : null]
    .filter(Boolean).join(' · ');

  list.innerHTML = songs.length
    ? renderSongList(songs)
    : renderState({ type: 'empty', title: 'No playable songs', message: 'The artist has not made these tracks available to stream.' });
  renderLikeButtons(list);
  connectSongInteractions(list, () => songs);

  playButton.disabled = !songs.length;
  playButton.addEventListener('click', () => {
    player.setQueue(songs, 0);
    player.play(songs[0]).catch((error) => console.error('Playback error:', error));
  });
}

initPlayerUI();
loadHomePage();
loadSearchPage();
loadLibraryPage();
loadPlaylistPage();
loadAlbumPage();
