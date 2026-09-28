# Player Contract

VibeRoom has one centralized player state shared by pages:

```js
{
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: "off"      // "off" | "all" | "one"
}
```

`currentTrack` and `queue` items use the song shape from `MUSIC-DATA.md`. `currentTime` and `duration` are seconds. `volume` is clamped to `0`–`1`.

## Expected commands

```js
player.play(track)
player.pause()
player.next()
player.previous()
player.seek(time)
player.setVolume(volume)
player.toggleShuffle()
player.toggleRepeat()   // cycles "off" -> "all" -> "one" -> "off"
player.subscribe(callback)
player.getState()
player.setQueue(tracks, startIndex)
```

`subscribe(callback)` calls `callback` immediately with the current state, then on every change, and returns an unsubscribe function. `getState()` returns a copy; mutating it has no effect.

The implementation should use one browser `Audio` instance. Pages subscribe to state and issue commands; they must not create independent audio players. Temporary queue, volume, and playback position remain local unless a future decision explicitly justifies persistence.

`setQueue(tracks, startIndex)` replaces the queue so a page can play a list (album, search results) rather than a single track; `next()` and `previous()` move through it. Call it before `play(track)`.

The implementation lives in `js/player/player.js`.
