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
  repeat: "off"
}
```

## Expected commands

```js
player.play(track)
player.pause()
player.next()
player.previous()
player.seek(time)
player.setVolume(volume)
player.toggleShuffle()
player.toggleRepeat()
player.subscribe(callback)
player.setQueue(tracks, startIndex)
```

The implementation should use one browser `Audio` instance. Pages subscribe to state and issue commands; they must not create independent audio players. Temporary queue, volume, and playback position remain local unless a future decision explicitly justifies persistence.
