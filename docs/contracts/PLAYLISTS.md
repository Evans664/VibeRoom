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

Methods return normalized playlist objects and predictable errors. A playlist belongs to its authenticated owner; guest users may use a local-only playlist implementation if that feature is offered.

Store song IDs and small metadata rather than full song objects. Reads should be explicit and limited; writes should happen only after a user action.
