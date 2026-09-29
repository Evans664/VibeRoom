// Inline SVG icons (24x24, currentColor) shared by the player and song lists.
// Buttons that use them must carry their own aria-label; icons are hidden from assistive tech.
const svg = (body, { filled = false } = {}) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${
  filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
}>${body}</svg>`;

export const icons = {
  play: svg('<path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.1-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/>', { filled: true }),
  pause: svg('<rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/>', { filled: true }),
  next: svg('<path d="M5 5.5v13a1 1 0 0 0 1.55.83L16 13v5.5a1 1 0 0 0 2 0v-13a1 1 0 0 0-2 0V11L6.55 4.67A1 1 0 0 0 5 5.5z"/>', { filled: true }),
  previous: svg('<path d="M19 5.5v13a1 1 0 0 1-1.55.83L8 13v5.5a1 1 0 0 1-2 0v-13a1 1 0 0 1 2 0V11l9.45-6.33A1 1 0 0 1 19 5.5z"/>', { filled: true }),
  shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  repeat: svg('<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  repeatOne: svg('<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>'),
  chevronDown: svg('<path d="M6 9l6 6 6-6"/>'),
  heart: svg('<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.4 3.5 4.3 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'),
  heartFilled: svg('<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.4 3.5 4.3 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>', { filled: true }),
  plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  remove: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  playlist: svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  volume: svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>')
};
