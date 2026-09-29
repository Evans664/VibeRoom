// Catalog provider: Audius public API (https://docs.audius.org). No key or account needed.
// Pages only use the functions exported here, so swapping providers never touches the UI.
const API_BASE = 'https://api.audius.co/v1';
const APP_NAME = 'VibeRoom';
const PLACEHOLDER_COVER = '../assets/images/cover-placeholder.svg';
const PAGE_SIZE = 20;

// Songs seen in any response, so getSongById and albums don't refetch them.
const songCache = new Map();
const copySong = (song) => ({ ...song, coverFallbacks: [...song.coverFallbacks] });

// allowMissing: ID lookups resolve to null for unknown IDs (Audius answers 400 or 404).
async function request(path, params = {}, { allowMissing = false } = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries({ ...params, app_name: APP_NAME }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (allowMissing && (response.status === 400 || response.status === 404)) return null;
  if (!response.ok) throw new Error(`Audius request failed (${response.status}) for ${path}`);
  const body = await response.json();
  return body.data;
}

// Primary artwork URL first, then the same file on each mirror host (content nodes go down).
function artworkUrls(artwork) {
  const primary = artwork?.['480x480'] || artwork?.['150x150'];
  if (!primary) return [];
  const path = new URL(primary).pathname;
  return [primary, ...(artwork.mirrors || []).map((host) => `${host}${path}`)];
}

// Shape defined in docs/contracts/MUSIC-DATA.md.
function toSong(track) {
  const [cover = PLACEHOLDER_COVER, ...coverFallbacks] = artworkUrls(track.artwork);
  const song = {
    id: track.id,
    title: track.title,
    artist: track.user?.name || 'Unknown artist',
    artistId: track.user?.id || null,
    album: track.album_backlink?.playlist_name || 'Single',
    albumId: track.album_backlink?.playlist_id ? String(track.album_backlink.playlist_id) : null,
    cover,
    coverFallbacks,
    // Audius redirects this to a fresh signed stream URL on every request.
    audioUrl: `${API_BASE}/tracks/${track.id}/stream?app_name=${APP_NAME}`,
    duration: Number(track.duration) || 0,
    genre: track.genre || 'Other',
    releaseDate: (track.release_date || track.created_at || '').slice(0, 10) || null
  };
  songCache.set(song.id, song);
  return copySong(song);
}

function toSongs(tracks) {
  return (tracks || []).filter((track) => track.is_streamable !== false && !track.is_stream_gated).map(toSong);
}

function toAlbum(playlist) {
  const songs = toSongs(playlist.tracks);
  const [cover = songs[0]?.cover || PLACEHOLDER_COVER, ...coverFallbacks] = artworkUrls(playlist.artwork);
  return {
    id: playlist.id,
    title: playlist.playlist_name,
    artist: playlist.user?.name || 'Unknown artist',
    artistId: playlist.user?.id || null,
    cover,
    coverFallbacks,
    releaseDate: (playlist.release_date || playlist.created_at || '').slice(0, 10) || null,
    songIds: songs.map((song) => song.id),
    // Search results list albums without their tracks; the count still comes through.
    trackCount: Number(playlist.track_count) || songs.length
  };
}

export async function getSongs() {
  return toSongs(await request('/tracks/trending', { limit: PAGE_SIZE }));
}

export async function getSongById(id) {
  if (!id) return null;
  if (songCache.has(id)) return copySong(songCache.get(id));
  const track = await request(`/tracks/${encodeURIComponent(id)}`, {}, { allowMissing: true });
  return track ? toSong(track) : null;
}

// Resolves saved song IDs (likes, playlists) in the given order; unknown IDs are skipped.
export async function getSongsByIds(ids = []) {
  const missing = [...new Set(ids)].filter((id) => id && !songCache.has(id));
  for (let start = 0; start < missing.length; start += 50) {
    const batch = missing.slice(start, start + 50);
    const url = `/tracks?${batch.map((id) => `id=${encodeURIComponent(id)}`).join('&')}`;
    toSongs(await request(url, {}, { allowMissing: true }));
  }
  return ids.filter((id) => songCache.has(id)).map((id) => copySong(songCache.get(id)));
}

export async function searchSongs(query) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return getSongs();
  return toSongs(await request('/tracks/search', { query: normalizedQuery, limit: PAGE_SIZE }));
}

export async function searchAlbums(query) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const data = await request('/search/full', { query: normalizedQuery, kind: 'albums', limit: 12 });
  return (data?.albums || [])
    .filter((album) => !album.is_private && !album.is_delete && Number(album.track_count) > 0)
    .map(toAlbum);
}

export async function getAlbums() {
  const playlists = await request('/playlists/trending', { type: 'album', limit: 12 });
  return (playlists || []).map(toAlbum);
}

export async function getAlbumById(id) {
  if (!id) return null;
  const data = await request(`/playlists/${encodeURIComponent(id)}`, {}, { allowMissing: true });
  const playlist = Array.isArray(data) ? data[0] : data;
  if (!playlist) return null;
  const album = toAlbum(playlist);
  const tracks = await request(`/playlists/${encodeURIComponent(id)}/tracks`, {}, { allowMissing: true });
  if (tracks) {
    album.songIds = toSongs(tracks).map((song) => song.id);
    album.trackCount = album.songIds.length;
  }
  return album;
}
