# Integration Rules

Parallel work depends on stable contracts.

## Contract-first development

Frontend code consumes plain objects and service methods documented in `docs/contracts/`. Mock implementations must return the same shapes as Firebase-backed implementations. Pages should not need rewrites when a data source changes.

Examples:

- `getSongs()` returns an array of music objects.
- `auth.getCurrentUser()` returns a user object or `null`.
- `player.play(track)` accepts the shared music contract.

## Ownership

Evans coordinates architecture and integration. Evans and Alliance review Firebase and security changes. Ice and Emmanuel own frontend implementation, but may contribute across boundaries when assigned.

## Avoiding collisions

Announce contract changes before implementation. Keep files scoped to the feature. Prefer additive changes and small pull requests. Do not rename shared fields without updating docs, mock data, services, and consumers together.

## Firebase handoff

Every Firebase feature must pass the free-plan checklist before merge. A frontend contributor may use a mock service while the Firebase implementation is developed independently. No page may require a live Firebase project just to render its basic UI.
