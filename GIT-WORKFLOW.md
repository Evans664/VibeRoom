# Git and GitHub Workflow

## Branches

Use short-lived branches named by purpose, such as `feat/search-contract`, `fix/player-state`, or `docs/firebase-costs`. Keep unrelated work out of the branch.

## Commits

Write small, imperative commits that describe one coherent change. Avoid generated metadata and unrelated formatting churn.

## Pull requests

A pull request should explain the user or developer problem, affected files, contract changes, test/manual verification, and any Firebase cost or security impact. Include screenshots for visual changes at mobile and desktop sizes.

At least one relevant owner should review the change. Evans owns final integration decisions. Firebase/rules changes require review from Evans and Alliance.

## Merge safety

Resolve conflicts by preserving documented contracts and existing user changes. Do not commit Firebase secrets. Review Firestore rules as carefully as application code.
