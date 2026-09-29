# Design System

VibeRoom should feel like its own music product: dark, focused, youthful, and premium without imitating Spotify.

## Visual language

- Near-black background with charcoal surfaces
- Bright green accent used for primary actions and active states
- White primary text and muted secondary text
- Restrained green glow, never glow everywhere
- Rounded cards with consistent spacing
- Mobile-first layouts that scale to wider screens

## Interaction principles

Use familiar icons for compact controls, text for clear commands, visible focus states, sufficient contrast, and touch targets that are comfortable on mobile. Every meaningful state needs loading, empty, and error behavior where applicable.

## Brand

- Accent: spring green `#2ee872`, with `--gradient-accent` for primary buttons only.
- Type: Montserrat (Google Fonts, 400–800) with a system sans fallback, so pages still render offline.
- Logo mark: `assets/icons/logo-mark.svg`. Welcome hero art: `assets/images/hero-headphones.svg`. Both are original project artwork.

## App shell

Every page in `pages/` shares the same `.app-shell` markup: `.app-header` (brand and mode chip), `.app-nav` (Home/Search/Library, with `aria-current="page"` on the active link), and `main#main.app-main`. On mobile the nav is a bottom tab bar; from 900px up, the header and nav become a left sidebar.

## Interaction hooks

UI renders these `data-*` hooks; interaction code attaches behavior to them without changing markup:

| Hook | Where | Purpose |
| --- | --- | --- |
| `data-song-list` | home | Rendered by `renderSongList` |
| `data-song-id` | each `.song-row` | Target for play/like actions |
| `data-album-grid`, `data-album-id` | home | Album cards |
| `data-search-form`, `data-search-input`, `data-search-results` | search | Search behavior (Emmanuel) |
| `data-genre-grid` | search | Genre tiles |

Use `renderState({ type: 'empty' | 'error', title, message, action })` and `renderSkeleton()` from `js/ui/components.js` for loading, empty and error states.

Tokens live in `css/variables.css`. Shared component styles belong in `css/components.css`; page structure belongs in `css/layout.css`.

Do not copy exact Spotify layouts, branding, assets, or proprietary content.
