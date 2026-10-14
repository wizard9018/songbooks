const books = document.getElementById('books');
document.getElementById('book-count').textContent = `${window.SONGBOOKS.length} songbooks`;
for (const song of window.SONGBOOKS) {
  const item = document.createElement('div');
  item.className = 'songbook';
  const link = document.createElement('a');
  link.className = 'book';
  link.href = song.url;
  const cover = document.createElement('div');
  cover.className = 'cover';
  const image = document.createElement('img');
  image.src = song.image;
  image.alt = '';
  image.width = 1280;
  image.height = 720;
  image.loading = 'lazy';
  cover.append(image);
  const title = document.createElement('h2');
  title.lang = 'zh-CN';
  title.textContent = song.title;
  const detail = document.createElement('p');
  detail.textContent = `${song.english} · ${song.pages} pages`;
  link.append(cover, title, detail);
  item.append(link);
  const play = document.createElement('button');
  play.className = 'play-song';
  play.textContent = '▶ Play song';
  play.setAttribute('aria-pressed', 'false');
  play.setAttribute('aria-label', `Play ${song.title}, ${song.artist}`);
  play.addEventListener('click', () => playSong(song, play));
  const artist = document.createElement('span');
  artist.className = 'song-artist';
  artist.lang = 'zh-CN';
  artist.textContent = song.artist;
  const actions = document.createElement('div');
  actions.className = 'song-actions';
  actions.append(play, artist);
  item.append(actions);
  books.append(item);
}

const player = document.createElement('aside');
player.className = 'song-player';
player.hidden = true;
player.setAttribute('aria-label', 'Song player');
const playingTitle = document.createElement('span');
playingTitle.lang = 'zh-CN';
const songAudio = document.createElement('audio');
songAudio.id = 'song-audio';
songAudio.controls = true;
songAudio.preload = 'none';
const closePlayer = document.createElement('button');
closePlayer.textContent = 'Close';
player.append(playingTitle, songAudio, closePlayer);
document.body.append(player);
let playingButton = null;
let songRequest = 0;
function resetSongButton() {
  if (!playingButton) return;
  playingButton.textContent = '▶ Play song';
  playingButton.setAttribute('aria-pressed', 'false');
}
async function playSong(song, button) {
  if (playingButton === button && !songAudio.paused) { songAudio.pause(); return; }
  const request = ++songRequest;
  resetSongButton();
  playingButton = button;
  playingTitle.textContent = `${song.title} · ${song.artist}`;
  player.hidden = false;
  document.body.classList.add('with-player');
  if (songAudio.getAttribute('src') !== song.recording) songAudio.src = song.recording;
  button.textContent = 'Loading…';
  try { await songAudio.play(); }
  catch (error) {
    if (request !== songRequest) return;
    button.textContent = 'Retry song';
    playingTitle.textContent = 'Song could not play. Keep the complete book folder and try again.';
  }
}
songAudio.addEventListener('play', () => {
  playingButton.textContent = 'Ⅱ Pause song';
  playingButton.setAttribute('aria-pressed', 'true');
});
songAudio.addEventListener('pause', resetSongButton);
songAudio.addEventListener('ended', resetSongButton);
closePlayer.addEventListener('click', () => {
  songRequest++;
  songAudio.pause();
  player.hidden = true;
  document.body.classList.remove('with-player');
  playingButton?.focus();
});
window.addEventListener('pagehide', () => songAudio.pause());
