import {
  getSongs,
  searchSongs
} from './services/music-service.js';

import {
  renderSongList
} from './ui/components.js';

import {
  initPlayerUI
} from './ui/player.js';

import {
  player
} from './core/player.js';

initPlayerUI();

let currentSongs = [];

async function loadHomePage() {
  const songList =
    document.querySelector('[data-song-list]');

  if (!songList) {
    return;
  }

  try {
    currentSongs = await getSongs();

    songList.innerHTML =
      renderSongList(currentSongs);

    connectSongInteractions(
      songList,
      () => currentSongs
    );

  } catch (error) {
    console.error(error);

    songList.innerHTML =
      '<p class="empty-state">Unable to load songs.</p>';
  }
}

async function loadSearchPage() {
  const input =
    document.querySelector('[data-search-input]');

  const results =
    document.querySelector('[data-search-results]');

  const status =
    document.querySelector('[data-search-status]');

  if (!input || !results) {
    return;
  }

  try {
    currentSongs =
      await searchSongs('');

    results.innerHTML =
      renderSongList(currentSongs);

    connectSongInteractions(
      results,
      () => currentSongs
    );

  } catch (error) {
    console.error(error);

    results.innerHTML =
      '<p class="empty-state">Unable to load songs.</p>';

    return;
  }

  let searchTimer;

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(
      async () => {
        const query =
          input.value.trim();

        status.textContent =
          query
            ? `Searching for "${query}"...`
            : '';

        try {
          currentSongs =
            await searchSongs(query);

          results.innerHTML =
            renderSongList(currentSongs);

          status.textContent =
            query
              ? `${currentSongs.length} result${currentSongs.length === 1 ? '' : 's'} found.`
              : '';

        } catch (error) {
          console.error(error);

          currentSongs = [];

          results.innerHTML =
            '<p class="empty-state">Search failed. Please try again.</p>';

          status.textContent =
            'Unable to complete search.';
        }
      },
      150
    );
  });

  connectSongInteractions(
    results,
    () => currentSongs
  );
}

function connectSongInteractions(
  container,
  getSongsForList
) {
  if (container.dataset.interactionsBound === 'true') {
    return;
  }

  container.dataset.interactionsBound = 'true';

  container.addEventListener(
    'click',
    async (event) => {
      const button =
        event.target.closest(
          '[data-action="play-song"]'
        );

      if (!button) {
        return;
      }

      const songs =
        getSongsForList();

      const song =
        songs.find(
          (item) =>
            item.id === button.dataset.songId
        );

      if (!song) {
        return;
      }

      const songIndex =
        songs.findIndex(
          (item) =>
            item.id === song.id
        );

      player.setQueue(
        songs,
        songIndex
      );

      try {
        if (
          button.textContent === 'Pause' &&
          player
        ) {
          player.pause();
          return;
        }

        await player.play(song);

      } catch (error) {
        console.error(
          'Playback error:',
          error
        );
      }
    }
  );
}

loadHomePage();
loadSearchPage();