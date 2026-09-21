# Development Guide

## Principles

- Keep the application understandable to a small student/developer team.
- Prefer small, composable HTML/CSS/JavaScript modules over abstractions without a clear job.
- Keep static catalog data and temporary UI/player state local.
- Keep Firebase behind service boundaries.
- Build mobile-first and preserve keyboard accessibility.
- Do not add a dependency, service, or toolchain without documenting why it is needed.

## Local development

VibeRoom is a static web application. `index.html` can be opened directly in a browser. A local static server is recommended when testing module imports or browser security behavior.

There is no package manager, compile step, or required runtime. Do not introduce one casually.

## JavaScript conventions

- Use ES modules where browser support and page setup allow it.
- Use descriptive names and small functions.
- Keep DOM querying and event wiring in UI modules.
- Keep Firebase calls in `js/services/`.
- Use the documented data contracts at module boundaries.
- Never put secrets, service-account data, or privileged credentials in frontend files.

## Change checklist

Before opening a pull request, verify the affected page at mobile and desktop widths, keyboard navigation, empty/loading/error states, and the relevant contract. For Firebase changes, complete the Spark-plan checklist in [FIREBASE.md](FIREBASE.md) and [docs/FIREBASE-FREE-PLAN.md](docs/FIREBASE-FREE-PLAN.md).
