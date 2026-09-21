import { getSongs } from './services/music-service.js';
import { renderSongList } from './ui/components.js';

const songList = document.querySelector('[data-song-list]');

if (songList) {
  getSongs().then((songs) => {
    songList.innerHTML = renderSongList(songs);
  });
}
