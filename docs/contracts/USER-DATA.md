# User Data Contract

User data is optional and authenticated. UI code consumes normalized objects rather than Firebase snapshots.

```js
{
  id: "user-id",
  displayName: "Listener",
  email: "listener@example.com",
  photoUrl: null,
  preferences: {
    theme: "dark"
  }
}
```

Expected service methods include `getProfile()`, `updateProfile(fields)`, `getLikedSongIds()`, `likeSong(songId)`, `unlikeSong(songId)`, and `savePreferences(preferences)`.

Writes require an authenticated owner and should happen on explicit actions or deliberate debounced saves, never on every render or playback tick.
