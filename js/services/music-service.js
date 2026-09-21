import { mockMusic } from '../data/mock-music.js';

export async function getSongs() {
  return [...mockMusic];
}

export async function searchSongs(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return getSongs();
  return mockMusic.filter((song) => [song.title, song.artist, song.album, song.genre]
    .some((field) => field.toLowerCase().includes(normalizedQuery)));
}
