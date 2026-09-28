# Authentication Contract

The UI talks to `auth-service.js`, never directly to Firebase Auth.

## Expected interface

```js
auth.login(email, password)
auth.register(email, password, profile)
auth.logout()
auth.getCurrentUser()
auth.onAuthStateChanged(callback)
```

`login` and `register` resolve to a normalized user object or reject with a user-safe error. `getCurrentUser` returns a user object or `null`. The listener returns an unsubscribe function.

## Normalized user object

Every auth implementation (mock or Firebase) returns this shape, never a raw Firebase `User`:

```js
{
  id: "firebase-uid",
  email: "listener@example.com",
  displayName: "Listener",   // may be null
  photoUrl: null             // may be null
}
```

`register(email, password, profile)` accepts `profile` as `{ displayName }`. Additional profile data belongs to the user-data contract, not auth.

## Errors

Rejected promises use an `Error` with a stable `code` and a message that is safe to show in the UI:

| `code` | Meaning |
| --- | --- |
| `auth/not-configured` | No Firebase configuration; the UI should offer guest mode. |
| `auth/invalid-credentials` | Wrong email or password (do not reveal which). |
| `auth/email-in-use` | Registration with an existing email. |
| `auth/weak-password` | Password rejected by the provider. |
| `auth/network` | Offline or provider unreachable. |
| `auth/unknown` | Anything else. Log details to the console, show a generic message. |

Guest access is a local application mode and must not require Firebase. Email/password is the initial planned provider. Google sign-in is optional and requires a later compatibility/security decision.
