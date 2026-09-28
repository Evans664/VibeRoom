import { getAlbums, getSongs, searchSongs } from './services/music-service.js';
import { renderAlbumGrid, renderGenreGrid, renderSongList, renderState } from './ui/components.js';
import { initPlayerUI } from './ui/player.js';
import { player } from './player/player.js';

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
    return items;
  } catch (error) {
    console.error(`Failed to render ${selector}`, error);
    target.innerHTML = renderState(loadError);
    return [];
  } finally {
    target.removeAttribute('aria-busy');
  }
}

// Play buttons in a song list queue the whole list, so next/previous move through it.
function connectSongInteractions(container, getSongsForList) {
  if (!container || container.dataset.interactionsBound === 'true') return;
  container.dataset.interactionsBound = 'true';

  container.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="play-song"]');
    if (!button) return;

    const songs = getSongsForList();
    const songIndex = songs.findIndex((item) => item.id === button.dataset.songId);
    if (songIndex === -1) return;

    const song = songs[songIndex];
    const { currentTrack, isPlaying } = player.getState();
    if (currentTrack?.id === song.id && isPlaying) {
      player.pause();
      return;
    }

    player.setQueue(songs, songIndex);
    try {
      await player.play(song);
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

  let currentSongs = [];
  let searchTimer;
  connectSongInteractions(results, () => currentSongs);

  async function runSearch(query) {
    try {
      currentSongs = await searchSongs(query);
      results.innerHTML = currentSongs.length
        ? renderSongList(currentSongs)
        : renderState({ type: 'empty', title: 'No matches', message: `Nothing found for "${query}". Try another song, artist or genre.` });
      if (status) {
        status.textContent = query ? `${currentSongs.length} result${currentSongs.length === 1 ? '' : 's'} found.` : '';
      }
    } catch (error) {
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

initPlayerUI();
loadHomePage();
loadSearchPage();
