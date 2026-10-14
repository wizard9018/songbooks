const playbackControls = document.querySelector('.recording-bar');
playbackControls.prepend(document.getElementById('read-page'));
playbackControls.setAttribute('role', 'group');
playbackControls.setAttribute('aria-label', 'Sentence audio');
document.querySelector('.book-page').append(playbackControls);
const lessonProgress = document.createElement('progress');
lessonProgress.className = 'lesson-progress';
lessonProgress.max = window.BOOK.length;
lessonProgress.setAttribute('aria-label', 'Songbook page progress');
document.querySelector('.book-page').prepend(lessonProgress);
window.updateLessonProgress = index => { lessonProgress.value = index + 1; };
window.updateLessonProgress(Number(document.getElementById('page-picker').value));
requestAnimationFrame(fitPage);

let fullViewportHeight = window.innerHeight;
let viewportWidth = window.innerWidth;
let viewportFrame = null;
window.ensurePracticeInputVisible = () => {
  const field = document.activeElement;
  if (!field?.matches('.spelling') || !(document.body.classList.contains('keyboard-open') || document.body.classList.contains('compact-reader'))) return;
  const viewport = window.visualViewport;
  if (viewport && Math.abs(viewport.scale - 1) > .05) return;
  const main = document.querySelector('main');
  const bounds = main.getBoundingClientRect();
  const input = field.closest('.character-cell').getBoundingClientRect();
  const top = Math.max(bounds.top, viewport?.offsetTop || 0) + 8;
  const bottom = Math.min(bounds.bottom, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight)) - playbackControls.offsetHeight - 12;
  if (input.top < top) main.scrollTop += input.top - top;
  else if (input.bottom > bottom) main.scrollTop += input.bottom - bottom;
};
function updateReaderViewport() {
  const viewport = window.visualViewport;
  if (viewport && Math.abs(viewport.scale - 1) > .05) return;
  const typing = document.activeElement?.matches('.spelling');
  const height = viewport?.height || window.innerHeight;
  if (!typing || viewportWidth !== window.innerWidth) {
    fullViewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
  }
  const keyboardOpen = typing && Math.max(window.innerHeight, fullViewportHeight) - height > 120;
  document.documentElement.style.setProperty('--reader-height', `${Math.floor(height)}px`);
  document.body.classList.toggle('keyboard-open', Boolean(keyboardOpen));
  if (!keyboardOpen) document.querySelector('main').scrollTop = 0;
  fitPage();
  window.ensurePracticeInputVisible();
}
function scheduleViewportUpdate() {
  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(updateReaderViewport);
}
window.visualViewport?.addEventListener('resize', scheduleViewportUpdate);
window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate);
window.addEventListener('resize', scheduleViewportUpdate);
document.addEventListener('focusin', scheduleViewportUpdate);
document.addEventListener('focusout', scheduleViewportUpdate);
scheduleViewportUpdate();
