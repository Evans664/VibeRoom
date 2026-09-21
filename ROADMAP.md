# Roadmap

## Foundation

- Repository structure and documentation
- Data, auth, player, playlist, and user contracts
- Mock catalog and static welcome entry point
- Spark-only Firebase boundaries and deny-by-default rules

## Stage 1: product shell

- Welcome, guest entry, navigation, and responsive layout
- Home, search, library, album, artist, and playlist page shells
- Shared design tokens and accessible UI components

## Stage 2: local music experience

- Mock catalog browsing and search
- One centralized browser audio player
- Queue, progress, volume, shuffle, and repeat state

## Stage 3: authentication and persistence

- Email/password authentication behind `auth-service.js`
- User-owned likes, playlists, saved albums, and preferences
- Deliberate, low-frequency recently-played persistence

## Stage 4: integration and hardening

- Firebase rules review and emulator/manual verification where available
- Mobile/accessibility pass
- Spark usage monitoring and documentation
- Deployment to Firebase Hosting only if needed

Anything requiring Blaze, billing, Cloud Functions, App Hosting, phone authentication, or unlicensed media remains postponed.
