import { escapeHtml, formatDuration } from '../core/utils.js';
import { icons } from './icons.js';

// Song rows expose data-song-id so interaction code can attach actions without changing markup.
// options.removable adds a "remove from playlist" button (playlist page).
export function renderSongList(songs, { removable = false } = {}) {
  const rows = songs.map((song, index) => `
    <li class="song-row" data-song-id="${escapeHtml(song.id)}">
      <span class="song-index" aria-hidden="true">${index + 1}</span>
      <img src="${escapeHtml(song.cover)}" alt="" loading="lazy" data-fallbacks="${escapeHtml((song.coverFallbacks || []).join(' '))}">
      <button type="button" class="song-open" data-action="open-song" data-song-id="${escapeHtml(song.id)}">
        <span class="song-title">${escapeHtml(song.title)}</span>
        <span class="song-meta">${escapeHtml(song.artist)} · ${escapeHtml(song.album)}</span>
      </button>
      <time datetime="PT${song.duration}S" aria-label="Duration ${formatDuration(song.duration)}">${formatDuration(song.duration)}</time>
      <button type="button" class="icon-button like-button" data-action="like-song" data-song-id="${escapeHtml(song.id)}" aria-label="Save to Liked Songs" aria-pressed="false">${icons.heart}</button>
      ${removable
        ? `<button type="button" class="icon-button song-secondary" data-action="remove-from-playlist" data-song-id="${escapeHtml(song.id)}" aria-label="Remove ${escapeHtml(song.title)} from playlist">${icons.remove}</button>`
        : `<button type="button" class="icon-button song-secondary" data-action="add-to-playlist" data-song-id="${escapeHtml(song.id)}" aria-label="Add ${escapeHtml(song.title)} to playlist">${icons.plus}</button>`}
      <button type="button" class="icon-button song-play-button" data-action="play-song" data-song-id="${escapeHtml(song.id)}" aria-label="Play ${escapeHtml(song.title)}">${icons.play}</button>
    </li>
  `).join('');
  return `<ol class="song-list">${rows}</ol>`;
}

export function renderAlbumGrid(albums) {
  return albums.map((album) => `
    <a class="album-card" href="album.html?id=${encodeURIComponent(album.id)}" data-album-id="${escapeHtml(album.id)}">
      <img src="${escapeHtml(album.cover)}" alt="" loading="lazy" data-fallbacks="${escapeHtml((album.coverFallbacks || []).join(' '))}">
      <h3>${escapeHtml(album.title)}</h3>
      <p>${escapeHtml(album.artist)}</p>
    </a>
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

export function renderPlaylistGrid(items) {
  return items.map((playlist) => `
    <a class="playlist-card" href="playlist.html?id=${encodeURIComponent(playlist.id)}">
      <span class="playlist-card-art" aria-hidden="true">${icons.playlist}</span>
      <h3>${escapeHtml(playlist.name)}</h3>
      <p>${playlist.songIds.length} song${playlist.songIds.length === 1 ? '' : 's'}</p>
    </a>
  `).join('');
}

export function renderSkeleton(kind = 'row', count = 4) {
  return Array.from({ length: count }, () => `<div class="skeleton skeleton-${kind}"></div>`).join('');
}
