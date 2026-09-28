# Firebase Foundation

Firebase is optional during frontend development. The application must still run with mock data and guest access when no Firebase configuration is present.

## Allowed on Spark

- Firebase Authentication using email/password; Google sign-in may be evaluated later if it remains Spark-compatible.
- Cloud Firestore for small, user-owned persistent data.
- Firebase Storage only when there is a clear, legally permitted, quota-safe need.
- Firebase Hosting if hosting is needed.

## Prohibited or postponed

No billing account, Blaze/pay-as-you-go, Cloud Functions, App Hosting, phone-number authentication, Admin SDK in the browser, service-account keys, or paid Google Cloud services.

## Before implementation

For every Firebase-backed feature, document: why Firebase is needed, what is stored, expected reads, expected writes, ownership/security, and why the usage remains within Spark. See [docs/FIREBASE-FREE-PLAN.md](docs/FIREBASE-FREE-PLAN.md).

## Configuration

The project is `viberoom-74420` (Spark). Copy `js/config/firebase-config.example.js` to `js/config/firebase-config.js` (gitignored) and fill in the web config shared privately by Evans. The normal Firebase web config is client-side configuration, but rules are still essential. Never commit private keys or service-account JSON. The example file intentionally contains placeholders.

Services get the app through `getFirebaseApp()` in `js/services/firebase-app.js`, which loads the pinned SDK from the gstatic CDN on first use and resolves to `null` when no config exists. Import other Firebase products from the same `FIREBASE_SDK_BASE` so versions never mix. We use Cloud Firestore; the Realtime Database is not used. See `docs/decisions/2026-09-25-contract-review.md`.

## Security starting point

`firebase/firestore.rules` denies access by default. Rules should be opened only for specific authenticated user-owned paths, with validation appropriate to each document.
