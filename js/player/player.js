const playerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off'
};

const REPEAT_CYCLE = { off: 'all', all: 'one', one: 'off' };

const listeners = new Set();

export const player = {
  getState() { return { ...playerState }; },
  subscribe(callback) { listeners.add(callback); callback(this.getState()); return () => listeners.delete(callback); },
  play(track) { playerState.currentTrack = track; playerState.isPlaying = true; notify(); },
  pause() { playerState.isPlaying = false; notify(); },
  next() {},
  previous() {},
  seek(time) { playerState.currentTime = time; notify(); },
  setVolume(volume) { playerState.volume = Math.max(0, Math.min(1, volume)); notify(); },
  toggleShuffle() { playerState.shuffle = !playerState.shuffle; notify(); },
  toggleRepeat() { playerState.repeat = REPEAT_CYCLE[playerState.repeat] ?? 'off'; notify(); }
};

function notify() { listeners.forEach((callback) => callback(player.getState())); }
