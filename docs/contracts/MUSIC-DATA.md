# Music Data Contract

The live provider is the public Audius API (`js/services/music-service.js`); `js/data/mock-music.js` stays available for offline work. All providers return the same song shape:

```js
{
  id: "song-id",
  title: "Song title",
  artist: "Artist name",
  artistId: "artist-id",
  album: "Album name",
  albumId: "album-id",
  cover: "assets/images/cover-placeholder.svg",
  coverFallbacks: [],           // optional: mirror URLs to try if `cover` fails to load
  audioUrl: "https://example.com/approved-audio.mp3",
  duration: 210,
  genre: "Genre",
  releaseDate: "2026-01-01"
}
```

`duration` is seconds. `albumId` and `releaseDate` may be `null` (Audius singles have no album; those songs use `album: "Single"`). `cover` and `audioUrl` must point to project-owned, licensed, public-domain, or explicitly approved assets. Audius tracks are approved: artists upload them for streaming through Audius's open API, and we stream them from Audius rather than copying files. Never copy copyrighted Spotify data.

### Asset paths

Local `cover` values are written relative to the `pages/` directory (for example `../assets/images/cover-placeholder.svg`) because every catalog view lives in `pages/`. Remote providers should return absolute URLs.

## Album shape

Albums are derived from the catalog; they are not stored separately in Firebase.

```js
{
  id: "album-id",
  title: "Album name",
  artist: "Artist name",
  artistId: "artist-id",
  cover: "../assets/images/cover-placeholder.svg",
  releaseDate: "2026-01-01",
  songIds: ["song-id"],     // may be empty in search results; getAlbumById fills it
  trackCount: 12,           // number of songs, known even when songIds is empty
  coverFallbacks: []   // optional, as for songs
}
```

## Service methods

| Method | Returns |
| --- | --- |
| `getSongs()` | `Promise<Song[]>` |
| `getSongById(id)` | `Promise<Song \| null>` |
| `getSongsByIds(ids)` | `Promise<Song[]>` in the given order; unknown IDs are skipped (used for likes and playlists) |
| `searchSongs(query)` | `Promise<Song[]>`; an empty query returns all songs |
| `getAlbums()` | `Promise<Album[]>` |
| `searchAlbums(query)` | `Promise<Album[]>`; an empty query returns `[]` |
| `getAlbumById(id)` | `Promise<Album \| null>` |

All methods return plain objects (copies, safe to mutate) or `null` where documented.
