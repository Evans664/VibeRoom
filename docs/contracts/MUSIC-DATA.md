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

Expected service methods include `getSongs()`, `getSongById(id)`, `searchSongs(query)`, and optional `getAlbumById(id)`. They return plain objects or `null` where documented.
