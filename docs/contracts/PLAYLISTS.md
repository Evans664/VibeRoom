# Playlist Contract

Playlist methods hide the persistence provider from UI code.

```js
playlists.getMine()
playlists.getById(id)
playlists.create({ name, description })
playlists.addTrack(playlistId, songId)
playlists.removeTrack(playlistId, songId)
playlists.delete(playlistId)
```

## Normalized playlist object

```js
{
  id: "playlist-id",
  ownerId: "firebase-uid",      // "guest" for a local-only playlist
  name: "Late night drive",
  description: "",
  songIds: ["song-id"],          // ordered; resolve to songs through the music service
  createdAt: "2026-09-25T12:00:00.000Z",
  updatedAt: "2026-09-25T12:00:00.000Z"
}
```

Timestamps are ISO strings, not Firestore `Timestamp` objects. `getMine()` returns an array (possibly empty). `getById()` returns a playlist or `null`. Mutating methods resolve to the updated playlist (`delete` resolves to `undefined`).

Methods return normalized playlist objects and predictable errors (`Error` with a `code`: `playlists/invalid`, `playlists/not-found`, `playlists/forbidden`, `playlists/full`, `playlists/unknown`). A playlist belongs to its authenticated owner; guest users may use a local-only playlist implementation if that feature is offered.

Store song IDs and small metadata rather than full song objects. Reads should be explicit and limited; writes should happen only after a user action. A playlist holds at most 500 song IDs to keep documents small.
