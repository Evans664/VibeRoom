const audio = new Audio();

const state = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off'
};

const subscribers = new Set();

let queueIndex = -1;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSnapshot() {
  return {
    ...state,
    queue: [...state.queue]
  };
}

function notify() {
  const snapshot = getSnapshot();

  subscribers.forEach((callback) => {
    callback(snapshot);
  });
}

function setQueue(tracks, startIndex = 0) {
  state.queue = Array.isArray(tracks) ? [...tracks] : [];

  if (!state.queue.length) {
    queueIndex = -1;
    notify();
    return;
  }

  queueIndex = clamp(
    Number.isInteger(startIndex) ? startIndex : 0,
    0,
    state.queue.length - 1
  );

  notify();
}

async function play(track) {
  if (!track || !track.audioUrl) {
    throw new Error('This track does not have a playable audio URL.');
  }

  const trackIndex = state.queue.findIndex(
    (item) => item.id === track.id
  );

  if (trackIndex !== -1) {
    queueIndex = trackIndex;
  }

  const isSameTrack =
    state.currentTrack?.id === track.id;

  state.currentTrack = track;

  if (!isSameTrack) {
    audio.src = track.audioUrl;
    audio.currentTime = 0;

    state.currentTime = 0;
    state.duration = Number(track.duration) || 0;
  }

  notify();

  try {
    await audio.play();

    state.isPlaying = true;
    notify();
  } catch (error) {
    state.isPlaying = false;
    notify();

    console.error('Unable to play track:', error);

    throw error;
  }
}

function pause() {
  audio.pause();

  state.isPlaying = false;

  notify();
}

function next() {
  if (!state.queue.length) {
    return;
  }

  let nextIndex;

  if (state.shuffle && state.queue.length > 1) {
    do {
      nextIndex = Math.floor(
        Math.random() * state.queue.length
      );
    } while (nextIndex === queueIndex);
  } else if (queueIndex < state.queue.length - 1) {
    nextIndex = queueIndex + 1;
  } else if (state.repeat === 'all') {
    nextIndex = 0;
  } else {
    pause();
    return;
  }

  queueIndex = nextIndex;

  play(state.queue[queueIndex]).catch(() => {});
}

function previous() {
  if (!state.currentTrack) {
    return;
  }

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    state.currentTime = 0;
    notify();
    return;
  }

  if (!state.queue.length) {
    audio.currentTime = 0;
    state.currentTime = 0;
    notify();
    return;
  }

  if (queueIndex > 0) {
    queueIndex -= 1;
  } else if (state.repeat === 'all') {
    queueIndex = state.queue.length - 1;
  } else {
    audio.currentTime = 0;
    state.currentTime = 0;
    notify();
    return;
  }

  play(state.queue[queueIndex]).catch(() => {});
}

function seek(time) {
  if (!Number.isFinite(time)) {
    return;
  }

  const nextTime = clamp(
    time,
    0,
    Number.isFinite(audio.duration)
      ? audio.duration
      : state.duration
  );

  audio.currentTime = nextTime;
  state.currentTime = nextTime;

  notify();
}

function setVolume(value) {
  const nextVolume = clamp(
    Number(value),
    0,
    1
  );

  audio.volume = nextVolume;
  state.volume = nextVolume;

  notify();
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;

  notify();

  return state.shuffle;
}

function toggleRepeat() {
  const modes = ['off', 'all', 'one'];

  const currentIndex =
    modes.indexOf(state.repeat);

  state.repeat =
    modes[(currentIndex + 1) % modes.length];

  notify();

  return state.repeat;
}

function subscribe(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError(
      'Player subscriber must be a function.'
    );
  }

  subscribers.add(callback);

  callback(getSnapshot());

  return () => {
    subscribers.delete(callback);
  };
}

audio.addEventListener('timeupdate', () => {
  state.currentTime = audio.currentTime;
  notify();
});

audio.addEventListener('loadedmetadata', () => {
  if (Number.isFinite(audio.duration)) {
    state.duration = audio.duration;
  }

  notify();
});

audio.addEventListener('play', () => {
  state.isPlaying = true;
  notify();
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  notify();
});

audio.addEventListener('ended', () => {
  if (state.repeat === 'one') {
    audio.currentTime = 0;

    play(state.currentTrack).catch(() => {});

    return;
  }

  next();
});

audio.addEventListener('error', () => {
  state.isPlaying = false;
  notify();
});

audio.volume = state.volume;

export const player = {
  play,
  pause,
  next,
  previous,
  seek,
  setVolume,
  toggleShuffle,
  toggleRepeat,
  subscribe,

  // Proposed addition to PLAYER.md.
  setQueue
};