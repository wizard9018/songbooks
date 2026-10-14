const pages = window.BOOK;
const homeLink = document.getElementById('home-link');
if (location.protocol.startsWith('http') && location.hostname === '127.0.0.1' && location.port !== '8784') homeLink.href = 'http://127.0.0.1:8784/index.html';
const picture = document.getElementById('picture');
const lyrics = document.getElementById('lyrics');
const audio = document.getElementById('narrator');
const status = document.getElementById('reading-status');
const picker = document.getElementById('page-picker');
const readButton = document.getElementById('read-page');
let pageIndex = 0;
let active = null;
let wholePage = false;
let currentLine = 0;
let playRequest = 0;
let spellingNextPage = null;
const spellingAnswers = new Map();

function pinyinLetters(value) {
  return value.trim().toLowerCase().normalize('NFD').replace(/u\u0308/g, 'v').replace(/[\u0300-\u036f]/g, '');
}

pages.forEach((page, index) => {
  const option = document.createElement('option');
  option.value = index;
  option.textContent = `${index + 1} / ${pages.length}`;
  picker.append(option);
});

function stop() {
  window.stopOriginalRecording?.();
  playRequest++;
  spellingNextPage = null;
  audio.pause();
  audio.currentTime = 0;
  wholePage = false;
  active?.classList.remove('playing');
  if (active?.matches('button')) active.setAttribute('aria-pressed', 'false');
  active = null;
  readButton.querySelector('span').textContent = 'Read sentence';
  status.textContent = 'Tap a character to listen. Type its pinyin on the line below.';
}

async function playAudio(source, element, message = 'Reading…') {
  const request = ++playRequest;
  window.stopOriginalRecording?.();
  spellingNextPage = null;
  active?.classList.remove('playing');
  if (active?.matches('button')) active.setAttribute('aria-pressed', 'false');
  active = element;
  active.classList.add('playing');
  if (active.matches('button')) active.setAttribute('aria-pressed', 'true');
  status.textContent = message;
  audio.src = source;
  audio.playbackRate = 1;
  try {
    await audio.play();
  } catch (error) {
    if (request !== playRequest) return;
    stop();
    status.textContent = 'Unable to play. Keep the assets folder with the book, then try again.';
  }
}

function playLine(index) {
  currentLine = index;
  const mode = document.getElementById('speed').value;
  const source = pages[pageIndex].lines[index].audio;
  return playAudio(mode === 'normal' ? source : source.replace('/audio/', `/audio/${mode}/`), lyrics.children[index]);
}

function render(index) {
  if (index < 0 || index >= pages.length) return;
  const turnedPage = index !== pageIndex;
  if (turnedPage) window.capturePageTurn(index > pageIndex ? 1 : -1);
  stop();
  pageIndex = index;
  const page = pages[index];
  picture.src = page.image;
  picture.alt = page.title;
  document.getElementById('page-title').textContent = page.title;
  picker.value = index;
  document.getElementById('previous').disabled = index === 0;
  document.getElementById('next').disabled = index === pages.length - 1;
  lyrics.replaceChildren();
  page.lines.forEach((line, lineIndex) => {
    const button = document.createElement('div');
    button.className = 'lyric-line';
    button.setAttribute('role', 'group');
    button.setAttribute('aria-label', line.text);
    Array.from(line.text).forEach((character, characterIndex) => {
      if (!/\p{Script=Han}/u.test(character)) {
        const gap = document.createElement('span');
        gap.className = /\s/u.test(character) ? 'phrase-space' : 'lyric-punctuation';
        if (!/\s/u.test(character)) gap.textContent = character;
        gap.setAttribute('aria-hidden', 'true');
        button.append(gap);
      } else {
        const ruby = document.createElement('ruby');
        ruby.append(document.createTextNode(character));
        const rt = document.createElement('rt');
        rt.textContent = line.syllables[characterIndex];
        rt.setAttribute('aria-hidden', 'true');
        ruby.append(rt);
        const word = document.createElement('button');
        word.className = 'character';
        word.setAttribute('aria-label', `Pronounce ${character}, ${line.syllables[characterIndex]}`);
        word.setAttribute('aria-pressed', 'false');
        word.append(ruby);
        const cell = document.createElement('div');
        cell.className = 'character-cell';
        const spelling = document.createElement('input');
        spelling.className = 'spelling';
        spelling.type = 'text';
        spelling.setAttribute('aria-label', `Spell the pinyin for ${character}`);
        spelling.autocomplete = 'off';
        spelling.setAttribute('autocapitalize', 'off');
        spelling.spellcheck = false;
        spelling.placeholder = Array.from(line.syllables[characterIndex]).map(() => '_').join(' ');
        spelling.style.width = `${Math.max(3, Array.from(line.syllables[characterIndex]).length) * 0.95}em`;
        const answerKey = `${index}:${lineIndex}:${characterIndex}`;
        spelling.value = spellingAnswers.get(answerKey) || '';
        spelling.classList.toggle('correct', pinyinLetters(spelling.value) === pinyinLetters(line.syllables[characterIndex]));
        let completed = false;
        function checkSpelling(event) {
          spellingAnswers.set(answerKey, spelling.value);
          if (event.isComposing) return;
          const matches = pinyinLetters(spelling.value) === pinyinLetters(line.syllables[characterIndex]);
          spelling.classList.toggle("correct", matches);
          if (!matches) { completed = false; return; }
          if (completed) return;
          completed = true;
          stop();
          playAudio(line.characterAudio[characterIndex], word, `Pronunciation: ${character} (${line.syllables[characterIndex]})`);
          const fields = Array.from(lyrics.querySelectorAll('.spelling'));
          const next = fields[fields.indexOf(spelling) + 1];
          if (next) { next.focus(); next.select(); }
          else if (index + 1 < pages.length) spellingNextPage = index + 1;
        }
        spelling.addEventListener('input', checkSpelling);
        spelling.addEventListener('compositionend', checkSpelling);
        cell.append(word, spelling);
        word.addEventListener('click', () => {
          if (active === word && !audio.paused) { stop(); return; }
          stop();
          playAudio(line.characterAudio[characterIndex], word, `Pronunciation: ${character} (${line.syllables[characterIndex]})`);
        });
        button.append(cell);
      }
    });
    lyrics.append(button);
  });
  if (pages[index + 1]) { const preload = new Image(); preload.src = pages[index + 1].image; }
  window.updateOriginalLyric?.(index);
  window.updateLessonProgress?.(index);
  requestAnimationFrame(fitPage);
  if (turnedPage) {
    wholePage = true;
    readButton.querySelector("span").textContent = "Stop reading";
    playLine(0);
  }
}

function fitPage() {
  const main = document.querySelector('main');
  const caption = document.querySelector('.caption');
  const illustration = document.querySelector('.illustration');
  const maximum = innerWidth <= 600 ? 32 : 36;
  const reserve = Math.min(140, main.clientHeight * 0.25);
  for (let size = maximum; size >= 20; size -= 2) {
    document.documentElement.style.setProperty('--character-size', `${size}px`);
    document.documentElement.style.setProperty('--pinyin-size', `${Math.max(13, Math.round(size * 0.5))}px`);
    document.documentElement.style.setProperty('--spelling-size', `${Math.max(10, Math.round(size * 0.36))}px`);
    if (caption.offsetHeight + reserve <= main.clientHeight) break;
  }
  const navigationHeight = document.querySelector('.page-navigation').offsetHeight;
  const progress = document.querySelector('.lesson-progress');
  const progressStyle = progress && getComputedStyle(progress);
  const progressHeight = progress ? progress.offsetHeight + parseFloat(progressStyle.marginTop) + parseFloat(progressStyle.marginBottom) : 0;
  const borderHeight = 7;
  illustration.style.height = `${Math.max(0, Math.min(main.clientHeight - caption.offsetHeight - navigationHeight - progressHeight - borderHeight, illustration.clientWidth * 9 / 16, innerHeight * 0.5))}px`;
}

audio.addEventListener('ended', () => {
  if (spellingNextPage !== null) {
    render(spellingNextPage);
    const first = lyrics.querySelector('.spelling');
    first?.focus();
    first?.select();
  } else if (wholePage && currentLine + 1 < pages[pageIndex].lines.length) playLine(currentLine + 1);
  else stop();
});
audio.addEventListener('error', () => {
  if (!active) return;
  stop();
  status.textContent = 'Audio could not load. Open the complete book folder and try again.';
});
document.getElementById('previous').addEventListener('click', () => render(pageIndex - 1));
document.getElementById('next').addEventListener('click', () => render(pageIndex + 1));
picker.addEventListener('change', () => render(Number(picker.value)));
document.getElementById('speed').addEventListener('change', stop);
readButton.addEventListener('click', () => {
  if (wholePage && active) { stop(); return; }
  wholePage = true;
  readButton.querySelector('span').textContent = 'Stop reading';
  playLine(0);
});
document.addEventListener('keydown', event => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('select,input,textarea,[contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  if (['d', 's', 'arrowright', 'arrowdown'].includes(key)) { event.preventDefault(); render(pageIndex + 1); }
  if (['a', 'w', 'arrowleft', 'arrowup'].includes(key)) { event.preventDefault(); render(pageIndex - 1); }
});
let touchStart = null;
const swipeSurface = document.querySelector('.book-page');
swipeSurface.addEventListener('touchstart', event => {
  if (event.touches.length !== 1 || event.target.closest('button,input,select,a,textarea,[contenteditable="true"]')) { touchStart = null; return; }
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
}, { passive: true });
swipeSurface.addEventListener('touchend', event => {
  if (!touchStart) return;
  const start = touchStart;
  touchStart = null;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;
  if (performance.now() - start.time < 1000 && Math.abs(deltaX) > 72 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) render(pageIndex + (deltaX < 0 ? 1 : -1));
}, { passive: true });
swipeSurface.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
window.addEventListener('pagehide', stop);
window.addEventListener('resize', () => requestAnimationFrame(fitPage));
document.fonts.ready.then(fitPage);
render(0);
