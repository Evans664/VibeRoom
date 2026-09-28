import { player } from '../player/player.js';
import { formatDuration } from '../core/utils.js';

export function initPlayerUI(root = document) {
  const playerRoot = root.querySelector('[data-player]');

  if (!playerRoot) {
    return;
  }

  const title =
    playerRoot.querySelector('[data-player-title]');

  const artist =
    playerRoot.querySelector('[data-player-artist]');

  const toggleButton =
    playerRoot.querySelector('[data-player-toggle]');

  const previousButton =
    playerRoot.querySelector('[data-player-previous]');

  const nextButton =
    playerRoot.querySelector('[data-player-next]');

  const shuffleButton =
    playerRoot.querySelector('[data-player-shuffle]');

  const repeatButton =
    playerRoot.querySelector('[data-player-repeat]');

  const progress =
    playerRoot.querySelector('[data-player-progress]');

  const volume =
    playerRoot.querySelector('[data-player-volume]');

  const currentTime =
    playerRoot.querySelector('[data-player-current-time]');

  const duration =
    playerRoot.querySelector('[data-player-duration]');

  const status =
    playerRoot.querySelector('[data-player-status]');

  let currentState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    shuffle: false,
    repeat: 'off'
  };

  toggleButton.addEventListener('click', async () => {
    if (!currentState.currentTrack) {
      return;
    }

    if (currentState.isPlaying) {
      player.pause();
      return;
    }

    try {
      await player.play(currentState.currentTrack);
    } catch (error) {
      console.error('Unable to play track:', error);

      if (status) {
        status.textContent = 'Unable to play this track.';
      }
    }
  });

  previousButton.addEventListener('click', () => {
    player.previous();
  });

  nextButton.addEventListener('click', () => {
    player.next();
  });

  shuffleButton.addEventListener('click', () => {
    player.toggleShuffle();
  });

  repeatButton.addEventListener('click', () => {
    player.toggleRepeat();
  });

  progress.addEventListener('input', (event) => {
    player.seek(Number(event.target.value));
  });

  volume.addEventListener('input', (event) => {
    player.setVolume(Number(event.target.value));
  });

  player.subscribe((state) => {
    currentState = state;

    const track = state.currentTrack;

    title.textContent =
      track?.title || 'No track selected';

    artist.textContent =
      track
        ? `${track.artist} · ${track.album}`
        : '';

    toggleButton.textContent =
      state.isPlaying
        ? 'Pause'
        : 'Play';

    toggleButton.disabled =
      !track;

    previousButton.disabled =
      !track;

    nextButton.disabled =
      !track;

    progress.max =
      String(state.duration || 0);

    progress.value =
      String(
        Math.min(
          state.currentTime,
          state.duration || 0
        )
      );

    volume.value =
      String(state.volume);

    currentTime.textContent =
      formatDuration(state.currentTime);

    duration.textContent =
      formatDuration(state.duration);

    shuffleButton.setAttribute(
      'aria-pressed',
      String(state.shuffle)
    );

    repeatButton.setAttribute(
      'aria-pressed',
      String(state.repeat !== 'off')
    );

    if (state.repeat === 'one') {
      repeatButton.textContent = 'Repeat One';
    } else if (state.repeat === 'all') {
      repeatButton.textContent = 'Repeat All';
    } else {
      repeatButton.textContent = 'Repeat';
    }

    if (!track) {
      status.textContent = 'Nothing playing';
    } else if (state.isPlaying) {
      status.textContent = 'Playing';
    } else {
      status.textContent = 'Paused';
    }

    updateSongButtons(state);
  });
}

function updateSongButtons(state) {
  const buttons =
    document.querySelectorAll(
      '[data-action="play-song"]'
    );

  buttons.forEach((button) => {
    const isCurrent =
      button.dataset.songId ===
      state.currentTrack?.id;

    button.textContent =
      isCurrent && state.isPlaying
        ? 'Pause'
        : 'Play';
  });
}