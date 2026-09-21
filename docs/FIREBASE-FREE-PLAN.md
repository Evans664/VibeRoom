# Firebase Spark Plan Policy

VibeRoom must remain on Firebase's no-cost Spark plan. Do not attach a billing account or credit card. Firebase is a supporting service, not the application's default state store.

## Allowed services

- Authentication: email/password. Google authentication may be considered later if it remains free-plan compatible.
- Cloud Firestore: small, user-owned persistent data with intentional reads and writes.
- Storage: only for a clear, legally permitted need that fits Spark limits.
- Hosting: static hosting if useful.

## Prohibited or postponed

Do not use Blaze/pay-as-you-go, Cloud Functions, App Hosting, phone-number authentication, paid Google Cloud services, Admin SDK credentials in the frontend, or any feature that requires billing. Large music catalogs and audio files must not be placed in Firestore. Storage is not assumed to be the catalog solution.

## Documented Spark quotas

The current project reference is 1 GiB stored data, 50,000 document reads/day, 20,000 document writes/day, 20,000 document deletes/day, and 10 GiB/month outbound transfer. These limits can change; verify the Firebase console documentation before launch.

## Usage rules

- Prefer static JavaScript/JSON-style catalog data where practical.
- Keep UI state, guest state, queue, volume, and temporary playback state local.
- Use one-time reads when live updates are unnecessary.
- Do not continuously poll collections or create listeners for static data.
- Do not write listening history on every player event; persist only meaningful playback milestones with deliberate batching/debouncing.
- Keep documents small and store IDs instead of duplicate song records.
- Limit and paginate user lists.
- Do not store large audio bytes in Firestore.

## Feature gate checklist

Before creating any Firebase implementation, document:

1. Why Firebase is needed instead of local/static state.
2. What data is stored and its approximate size.
3. How often it is read.
4. How often it is written.
5. How ownership and security rules prevent unauthorized access.
6. Why the feature fits Spark without billing.

If any answer is unclear, postpone the feature and provide a mock or local alternative. If a Spark quota is exceeded, stop the feature's writes, keep the UI usable with local/mock behavior, inspect usage, and reduce reads/documents before considering any architecture change. Do not solve quota pressure by attaching billing.

## Monitoring

Review Firebase usage and quota dashboards during development and before releases. Watch reads, writes, deletes, stored bytes, and outbound transfer. Test with representative limits and remove unnecessary listeners or duplicate documents.

## Audio and legal content

`audioUrl` may point to an approved external/public audio source where distribution is legally permitted. Firebase Storage is optional and must not be used for unlicensed music. Never commit copyrighted music or artwork without permission.
