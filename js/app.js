import { getAlbums, getSongs } from './services/music-service.js';
import { renderAlbumGrid, renderGenreGrid, renderSongList, renderState } from './ui/components.js';

// Each region renders independently so one failing source never blanks the whole page.
async function renderRegion(selector, load, render, emptyState) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.setAttribute('aria-busy', 'true');
  try {
    const items = await load();
    target.innerHTML = items.length ? render(items) : renderState({ type: 'empty', ...emptyState });
  } catch (error) {
    console.error(`Failed to render ${selector}`, error);
    target.innerHTML = renderState({
      type: 'error',
      title: 'Something went wrong',
      message: 'We could not load this section. Refresh the page to try again.'
    });
  } finally {
    target.removeAttribute('aria-busy');
  }
}

renderRegion('[data-song-list]', getSongs, renderSongList, {
  title: 'No tracks yet',
  message: 'New music will show up here as soon as it lands.'
});

renderRegion('[data-album-grid]', getAlbums, renderAlbumGrid, {
  title: 'No albums yet',
  message: 'Albums will appear once the catalog grows.'
});

renderRegion('[data-genre-grid]', async () => [...new Set((await getSongs()).map((song) => song.genre))],
  renderGenreGrid, { title: 'No genres yet' });
