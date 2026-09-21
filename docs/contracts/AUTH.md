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

Guest access is a local application mode and must not require Firebase. Email/password is the initial planned provider. Google sign-in is optional and requires a later compatibility/security decision.
