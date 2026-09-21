# Architecture

VibeRoom is a static-first application with optional Firebase services. The browser owns presentation and local behavior. Firebase owns authentication and carefully selected persistent user data.

## Layers

1. **Pages** provide page-level markup and entry points.
2. **UI modules** render contract-shaped data and dispatch user intent.
3. **Core modules** hold local state, routing, and shared utilities.
4. **Services** provide stable interfaces for auth, music, playlists, and users.
5. **Firebase** is an implementation detail behind those services.

A frontend page must be able to use mock data when Firebase is unavailable. A backend contributor must be able to test a service against the same contract without a finished page.

## Data flow

Catalog data should normally come from static data or an approved external source. Authenticated user data may be read from Firestore through service modules. UI code must not scatter Firebase SDK calls throughout page files.

## Player boundary

There is one shared player state and, eventually, one browser Audio instance. Pages send commands to the player and subscribe to state changes; they do not create competing audio players.

## Free-first decision rule

Before adding Firebase, document why persistence is needed, the data shape, read frequency, write frequency, ownership/security, and why the feature fits Spark. If the answer depends on Blaze, billing, Cloud Functions, App Hosting, phone auth, or another prohibited service, postpone it and provide a static/local alternative.
