import { formatDuration } from '../core/utils.js';

export function renderSongList(songs) {
  return songs.map((song) => `
    <article class="song-row">
      <img src="${song.cover}" alt="${song.album} cover">
      <div><strong>${song.title}</strong><span>${song.artist} · ${song.album}</span></div>
      <time>${formatDuration(song.duration)}</time>
    </article>
  `).join('');
}
