# Music Data Contract

All catalog providers, mock or remote, return the same song shape:

```js
{
  id: "song-id",
  title: "Song title",
  artist: "Artist name",
  artistId: "artist-id",
  album: "Album name",
  albumId: "album-id",
  cover: "assets/images/cover-placeholder.svg",
  audioUrl: "https://example.com/approved-audio.mp3",
  duration: 210,
  genre: "Genre",
  releaseDate: "2026-01-01"
}
```

`duration` is seconds. `cover` and `audioUrl` must point to project-owned, licensed, public-domain, or explicitly approved placeholder assets. Never copy copyrighted Spotify data.

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
  songIds: ["song-id"]
}
```

## Service methods

| Method | Returns |
| --- | --- |
| `getSongs()` | `Promise<Song[]>` |
| `getSongById(id)` | `Promise<Song \| null>` |
| `searchSongs(query)` | `Promise<Song[]>`; an empty query returns all songs |
| `getAlbums()` | `Promise<Album[]>` |
| `getAlbumById(id)` | `Promise<Album \| null>` |

All methods return plain objects (copies, safe to mutate) or `null` where documented.
