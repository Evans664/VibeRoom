# Evans

## Role
Project lead and integration owner.

## Responsibilities
- Project direction and architecture decisions
- Repository management and task coordination
- Reviewing contributions and resolving integration conflicts
- Final project decisions

## Areas owned
Repository conventions, cross-feature contracts, release readiness, and Firebase architecture decisions with Alliance.

## Likely files
Root documentation, `docs/contracts/`, `ARCHITECTURE.md`, `INTEGRATION.md`, `firebase/`, and shared service boundaries.

## Integration and review
Review changes that affect shared contracts, security, cost, routing, or cross-page state. Confirm that Firebase changes remain Spark-compatible and that mock-first development still works.

## Avoid changing unnecessarily
Do not rewrite contributor-owned UI or service internals without a contract or integration reason. Prefer documenting a decision and coordinating a focused change.
