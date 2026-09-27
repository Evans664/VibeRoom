import { formatDuration } from '../core/utils.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return entities[character];
  });
}

export function renderSongList(songs) {
  if (!songs.length) {
    return '<p class="empty-state">No songs found.</p>';
  }

  return songs.map((song) => `
    <article class="song-row" data-song-id="${escapeHtml(song.id)}">
      <img
        src="${escapeHtml(song.cover)}"
        alt="${escapeHtml(song.album)} cover"
      >

      <div class="song-info">
        <strong>${escapeHtml(song.title)}</strong>
        <span>${escapeHtml(song.artist)} · ${escapeHtml(song.album)}</span>
      </div>

      <time>${formatDuration(song.duration)}</time>

      <button
        type="button"
        class="song-play-button"
        data-action="play-song"
        data-song-id="${escapeHtml(song.id)}"
        aria-label="Play ${escapeHtml(song.title)}"
      >
        Play
      </button>
    </article>
  `).join('');
}