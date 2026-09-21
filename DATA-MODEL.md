# Data Model

The data model separates static catalog content from user-owned persistent data. This keeps reads small and lets the guest experience work without Firebase.

## Music contract

A song has `id`, `title`, `artist`, `artistId`, `album`, `albumId`, `cover`, `audioUrl`, `duration`, `genre`, and `releaseDate`. See [docs/contracts/MUSIC-DATA.md](docs/contracts/MUSIC-DATA.md).

Catalog records should remain static or come from a permitted catalog source whenever practical. Do not duplicate a complete song record into every user document.

## Planned collections

- `users/{userId}`: small profile and preference fields owned by that user.
- `playlists/{playlistId}`: playlist metadata and owner ID; membership must be authorized by owner/collaborator rules.
- `likes/{userId}/songs/{songId}`: compact references to liked catalog IDs.
- `recentlyPlayed/{userId}/tracks/{trackId}`: compact track references with a last-played timestamp; write only after meaningful playback and batch/debounce where appropriate.
- `savedAlbums/{userId}/albums/{albumId}`: compact album references.

The final path layout may change after a rules review. Every path needs explicit ownership checks; unauthenticated users must not read or write private data.

## Efficiency

Use one-time reads when real-time updates are unnecessary. Paginate or limit lists. Store IDs and small metadata instead of large duplicated documents. Do not store audio bytes or large artwork in Firestore. Keep transient queue, volume, and playback position local.
