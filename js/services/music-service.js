import { mockMusic } from '../data/mock-music.js';

export async function getSongs() {
  return mockMusic.map((song) => ({ ...song }));
}

export async function getSongById(id) {
  const song = mockMusic.find((item) => item.id === id);
  return song ? { ...song } : null;
}

export async function searchSongs(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return getSongs();
  return mockMusic.filter((song) => [song.title, song.artist, song.album, song.genre]
    .some((field) => field.toLowerCase().includes(normalizedQuery)))
    .map((song) => ({ ...song }));
}

export async function getAlbums() {
  const albums = new Map();
  mockMusic.forEach((song) => {
    if (!albums.has(song.albumId)) {
      albums.set(song.albumId, {
        id: song.albumId,
        title: song.album,
        artist: song.artist,
        artistId: song.artistId,
        cover: song.cover,
        releaseDate: song.releaseDate,
        songIds: []
      });
    }
    albums.get(song.albumId).songIds.push(song.id);
  });
  return [...albums.values()];
}

export async function getAlbumById(id) {
  const albums = await getAlbums();
  return albums.find((album) => album.id === id) ?? null;
}
