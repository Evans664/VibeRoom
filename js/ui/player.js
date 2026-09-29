import { player } from '../player/player.js';
import { formatDuration } from '../core/utils.js';
import { icons } from './icons.js';
import { renderLikeButtons } from './library.js';

const PLACEHOLDER_COVER = '../assets/images/cover-placeholder.svg';
const REPEAT_LABELS = { off: 'Repeat: off', all: 'Repeat: all', one: 'Repeat: one song' };

// Same control markup in the mini bar and the full-screen view; both render the same state.
const controlsMarkup = (extraClass = '') => `
  <div class="player-controls ${extraClass}">
    <button type="button" class="icon-button player-optional" data-player-shuffle aria-label="Shuffle" aria-pressed="false">${icons.shuffle}</button>
    <button type="button" class="icon-button" data-player-previous aria-label="Previous song">${icons.previous}</button>
    <button type="button" class="icon-button icon-button-primary" data-player-toggle aria-label="Play">${icons.play}</button>
    <button type="button" class="icon-button" data-player-next aria-label="Next song">${icons.next}</button>
    <button type="button" class="icon-button player-optional" data-player-repeat aria-label="${REPEAT_LABELS.off}" aria-pressed="false">${icons.repeat}</button>
  </div>`;

const progressMarkup = () => `
  <div class="player-progress">
    <span data-player-current-time>0:00</span>
    <input type="range" min="0" max="0" value="0" step="0.1" data-player-progress aria-label="Song progress">
    <span data-player-duration>0:00</span>
  </div>`;

const volumeMarkup = () => `
  <label class="player-volume">
    <span class="visually-hidden">Volume</span>
    ${icons.volume}
    <input type="range" min="0" max="1" value="1" step="0.01" data-player-volume>
  </label>`;

const barMarkup = () => `
  <button type="button" class="player-track" data-player-expand aria-label="Open now playing" disabled>
    <img class="player-cover" src="${PLACEHOLDER_COVER}" alt="" data-player-cover>
    <span class="player-text">
      <strong data-player-title>No track selected</strong>
      <span data-player-artist></span>
    </span>
  </button>
  ${controlsMarkup()}
  ${progressMarkup()}
  ${volumeMarkup()}
  <p class="visually-hidden" data-player-status aria-live="polite">Nothing playing</p>`;

const sheetMarkup = () => `
  <div class="now-playing" data-now-playing role="dialog" aria-modal="true" aria-labelledby="now-playing-title">
    <div class="now-playing-inner">
      <header class="now-playing-header">
        <button type="button" class="icon-button" data-now-playing-close aria-label="Close now playing">${icons.chevronDown}</button>
        <span class="now-playing-label">Now playing</span>
        <span class="now-playing-spacer" aria-hidden="true"></span>
      </header>
      <img class="now-playing-cover" src="${PLACEHOLDER_COVER}" alt="" data-player-cover>
      <div class="now-playing-meta">
        <div class="now-playing-text">
          <h2 id="now-playing-title" data-player-title>No track selected</h2>
          <p data-player-artist></p>
        </div>
        <button type="button" class="icon-button" data-action="add-to-playlist" data-player-song-action aria-label="Add to playlist">${icons.plus}</button>
        <button type="button" class="icon-button like-button" data-action="like-song" data-player-song-action aria-label="Save to Liked Songs" aria-pressed="false">${icons.heart}</button>
      </div>
      ${progressMarkup()}
      ${controlsMarkup('now-playing-controls')}
      ${volumeMarkup()}
    </div>
  </div>`;

// Wires one region's controls to the player and returns its render(state) function.
function bindRegion(root) {
  const find = (name) => root.querySelector(`[data-player-${name}]`);
  const el = {
    title: find('title'),
    artist: find('artist'),
    cover: find('cover'),
    toggle: find('toggle'),
    previous: find('previous'),
    next: find('next'),
    shuffle: find('shuffle'),
    repeat: find('repeat'),
    progress: find('progress'),
    volume: find('volume'),
    currentTime: find('current-time'),
    duration: find('duration'),
    status: find('status'),
    expand: find('expand')
  };
  let currentState = player.getState();
  let shownTrackId = null;

  el.toggle.addEventListener('click', async () => {
    if (!currentState.currentTrack) return;
    if (currentState.isPlaying) {
      player.pause();
      return;
    }
    try {
      await player.play(currentState.currentTrack);
    } catch (error) {
      console.error('Unable to play track:', error);
      if (el.status) el.status.textContent = 'Unable to play this track.';
    }
  });
  el.previous.addEventListener('click', () => player.previous());
  el.next.addEventListener('click', () => player.next());
  el.shuffle.addEventListener('click', () => player.toggleShuffle());
  el.repeat.addEventListener('click', () => player.toggleRepeat());
  el.progress.addEventListener('input', (event) => player.seek(Number(event.target.value)));
  el.volume.addEventListener('input', (event) => player.setVolume(Number(event.target.value)));

  return (state) => {
    currentState = state;
    const track = state.currentTrack;

    el.title.textContent = track?.title || 'No track selected';
    el.artist.textContent = track ? `${track.artist} · ${track.album}` : '';

    // Only swap artwork when the track changes, so a running mirror fallback isn't reset.
    if ((track?.id ?? null) !== shownTrackId) {
      shownTrackId = track?.id ?? null;
      root.querySelectorAll('[data-player-song-action]').forEach((button) => {
        button.dataset.songId = track?.id || '';
        button.disabled = !track;
      });
      renderLikeButtons(root);
      el.cover.dataset.fallbacks = (track?.coverFallbacks || []).join(' ');
      el.cover.src = track?.cover || PLACEHOLDER_COVER;
    }

    el.toggle.innerHTML = state.isPlaying ? icons.pause : icons.play;
    el.toggle.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
    [el.toggle, el.previous, el.next].forEach((button) => { button.disabled = !track; });
    if (el.expand) el.expand.disabled = !track;

    el.progress.max = String(state.duration || 0);
    el.progress.value = String(Math.min(state.currentTime, state.duration || 0));
    el.volume.value = String(state.volume);
    el.currentTime.textContent = formatDuration(state.currentTime);
    el.duration.textContent = formatDuration(state.duration);

    el.shuffle.setAttribute('aria-pressed', String(state.shuffle));
    el.repeat.setAttribute('aria-pressed', String(state.repeat !== 'off'));
    el.repeat.setAttribute('aria-label', REPEAT_LABELS[state.repeat] || REPEAT_LABELS.off);
    el.repeat.innerHTML = state.repeat === 'one' ? icons.repeatOne : icons.repeat;

    if (el.status) {
      el.status.textContent = !track ? 'Nothing playing' : state.isPlaying ? `Playing ${track.title}` : 'Paused';
    }
  };
}

let sheet = null;
let returnFocusTo = null;

function onSheetKeydown(event) {
  // A dialog opened from here (add to playlist) handles its own Escape.
  if (event.key === 'Escape' && !document.querySelector('dialog[open]')) closeNowPlaying();
}

export function openNowPlaying() {
  if (!sheet || !player.getState().currentTrack || sheet.classList.contains('is-open')) return;
  returnFocusTo = document.activeElement;
  sheet.classList.add('is-open');
  document.body.classList.add('has-now-playing');
  document.querySelector('.app-shell')?.setAttribute('inert', '');
  document.addEventListener('keydown', onSheetKeydown);
  sheet.querySelector('[data-now-playing-close]').focus();
}

export function closeNowPlaying() {
  if (!sheet?.classList.contains('is-open')) return;
  sheet.classList.remove('is-open');
  document.body.classList.remove('has-now-playing');
  document.querySelector('.app-shell')?.removeAttribute('inert');
  document.removeEventListener('keydown', onSheetKeydown);
  const canReturn = returnFocusTo?.isConnected && returnFocusTo !== document.body;
  const target = canReturn ? returnFocusTo : document.querySelector('[data-player-expand]');
  target?.focus();
}

export function initPlayerUI(root = document) {
  const bar = root.querySelector('[data-player]');
  if (!bar) return;

  bar.innerHTML = barMarkup();
  document.body.insertAdjacentHTML('beforeend', sheetMarkup());
  sheet = document.querySelector('[data-now-playing]');

  bar.querySelector('[data-player-expand]').addEventListener('click', openNowPlaying);
  sheet.querySelector('[data-now-playing-close]').addEventListener('click', closeNowPlaying);

  const renderers = [bindRegion(bar), bindRegion(sheet)];
  player.subscribe((state) => {
    renderers.forEach((render) => render(state));
    updateSongButtons(state);
    if (!state.currentTrack) closeNowPlaying();
  });
}

function updateSongButtons(state) {
  document.querySelectorAll('[data-action="play-song"]').forEach((button) => {
    const isCurrent = button.dataset.songId === state.currentTrack?.id;
    const isPlaying = isCurrent && state.isPlaying;
    const title = button.closest('.song-row')?.querySelector('.song-title')?.textContent || 'song';
    button.innerHTML = isPlaying ? icons.pause : icons.play;
    button.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} ${title}`);
    button.closest('.song-row')?.classList.toggle('is-current', isCurrent);
  });
}
