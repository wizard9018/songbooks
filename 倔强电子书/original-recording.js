const recording = window.RECORDING;
const originalAudio = document.createElement('audio');
originalAudio.preload = 'none';
originalAudio.id = 'original-audio';
document.body.append(originalAudio);
const recordingBar = document.createElement('div');
recordingBar.className = 'recording-bar';
const lyricPlay = document.createElement('button');
lyricPlay.id = 'play-original-lyric';
lyricPlay.textContent = '▶ Play this lyric';
lyricPlay.setAttribute('aria-pressed', 'false');
const singer = document.createElement('span');
singer.lang = 'zh-CN';
singer.textContent = recording.artist;
recordingBar.append(lyricPlay, singer);
document.querySelector('.caption').prepend(recordingBar);
let recordingIndex = Number(document.getElementById('page-picker').value);
let recordingRequest = 0;
let recordingPlaying = false;
window.stopOriginalRecording = () => {
  recordingRequest++;
  originalAudio.pause();
  recordingPlaying = false;
  lyricPlay.textContent = '▶ Play this lyric';
  lyricPlay.setAttribute('aria-pressed', 'false');
};
window.updateOriginalLyric = index => {
  window.stopOriginalRecording();
  recordingIndex = index;
};
lyricPlay.addEventListener('click', async () => {
  if (recordingPlaying) { window.stopOriginalRecording(); return; }
  stop();
  const request = ++recordingRequest;
  lyricPlay.textContent = 'Loading…';
  originalAudio.src = recording.lyrics[recordingIndex].src;
  originalAudio.playbackRate = 1;
  try {
    await originalAudio.play();
    if (request !== recordingRequest) return;
    recordingPlaying = true;
    lyricPlay.textContent = '■ Stop recording';
    lyricPlay.setAttribute('aria-pressed', 'true');
  } catch (error) {
    if (request !== recordingRequest) return;
    window.stopOriginalRecording();
    document.getElementById('reading-status').textContent = 'Recording could not play. Keep the complete book folder and try again.';
    lyricPlay.textContent = 'Retry recording';
  }
});
originalAudio.addEventListener('ended', window.stopOriginalRecording);
originalAudio.addEventListener('error', () => {
  if (!recordingPlaying) return;
  window.stopOriginalRecording();
  lyricPlay.textContent = 'Retry recording';
});
window.addEventListener('pagehide', window.stopOriginalRecording);
requestAnimationFrame(fitPage);
