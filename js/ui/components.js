import { escapeHtml, formatDuration } from '../core/utils.js';

// Song rows expose data-song-id so interaction code can attach actions without changing markup.
export function renderSongList(songs) {
  const rows = songs.map((song, index) => `
    <li class="song-row" data-song-id="${escapeHtml(song.id)}">
      <span class="song-index" aria-hidden="true">${index + 1}</span>
      <img src="${escapeHtml(song.cover)}" alt="" loading="lazy">
      <div>
        <span class="song-title">${escapeHtml(song.title)}</span>
        <span class="song-meta">${escapeHtml(song.artist)} · ${escapeHtml(song.album)}</span>
      </div>
      <time datetime="PT${song.duration}S" aria-label="Duration ${formatDuration(song.duration)}">${formatDuration(song.duration)}</time>
      <button type="button" class="song-play-button" data-action="play-song" data-song-id="${escapeHtml(song.id)}" aria-label="Play ${escapeHtml(song.title)}">Play</button>
    </li>
  `).join('');
  return `<ol class="song-list">${rows}</ol>`;
}

export function renderAlbumGrid(albums) {
  return albums.map((album) => `
    <article class="album-card" data-album-id="${escapeHtml(album.id)}">
      <img src="${escapeHtml(album.cover)}" alt="${escapeHtml(album.title)} cover" loading="lazy">
      <h3>${escapeHtml(album.title)}</h3>
      <p>${escapeHtml(album.artist)}</p>
    </article>
  `).join('');
}

export function renderGenreGrid(genres) {
  return genres.map((genre) => `<div class="genre-tile" role="listitem">${escapeHtml(genre)}</div>`).join('');
}

// type: 'empty' | 'error'. action: optional { label, href }.
export function renderState({ type = 'empty', title, message, action }) {
  const actionMarkup = action
    ? `<a class="button button-outline" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
    : '';
  return `
    <div class="state state-${type}" ${type === 'error' ? 'role="alert"' : ''}>
      <h3>${escapeHtml(title)}</h3>
      ${message ? `<p>${escapeHtml(message)}</p>` : ''}
      ${actionMarkup}
    </div>
  `;
}

export function renderSkeleton(kind = 'row', count = 4) {
  return Array.from({ length: count }, () => `<div class="skeleton skeleton-${kind}"></div>`).join('');
}
