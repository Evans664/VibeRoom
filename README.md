# VibeRoom

VibeRoom is a music streaming web application built by **The Dev Room**. It is an original product inspired by the general experience of modern music services, not a copy of Spotify.

## Foundation status

This repository is at the foundation stage. It contains the project structure, contracts, mock music data, design direction, and Firebase boundaries. Product features are intentionally not complete yet.

## Technology rules

- HTML, CSS, and vanilla JavaScript only
- Firebase services only where they add genuine persistent value
- No frontend framework, backend server, build tool, or paid Firebase service
- Firebase must remain on the no-cost Spark plan
- No copyrighted music or artwork without permission

## Start locally

Serve the folder with any static file server and open it in the browser, for example `python -m http.server 8000` then http://localhost:8000, or VS Code's Live Server extension. Opening `index.html` directly from disk does not work, because browsers block JavaScript modules on `file://` pages. No install step or build step is required.

Sign-in, liked songs and playlists need `js/config/firebase-config.js`. It is git-ignored, so ask Evans for the file and place it in `js/config/`. Without it the app still runs in guest mode, and music, search and albums all work.

The catalog streams live from the public [Audius API](https://docs.audius.org) through `js/services/music-service.js` (no key needed). For offline work, build against `js/data/mock-music.js` and the documented contracts.

## Read first

1. [DEVELOPMENT.md](DEVELOPMENT.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [INTEGRATION.md](INTEGRATION.md)
4. [docs/FIREBASE-FREE-PLAN.md](docs/FIREBASE-FREE-PLAN.md)
5. [GIT-WORKFLOW.md](GIT-WORKFLOW.md)

## Team

- Evans: project lead and integration owner
- Alliance: Firebase/backend ownership with Evans
- Ice: frontend and visual implementation
- Emmanuel: frontend interactions and assigned backend contributions

See the individual files in `docs/team/` for working boundaries.
