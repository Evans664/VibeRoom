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

Copy `js/config/firebase-config.example.js` to a local configuration file only when needed. The normal Firebase web config is client-side configuration, but rules are still essential. Never commit private keys or service-account JSON. The example file intentionally contains placeholders.

## Security starting point

`firebase/firestore.rules` denies access by default. Rules should be opened only for specific authenticated user-owned paths, with validation appropriate to each document.
