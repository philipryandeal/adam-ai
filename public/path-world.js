// The pause in a path-world: name a feeling, sit with it, then the road opens.
// Nothing typed here leaves the page: it is never stored, logged, or sent.
// Without this script the page still works: the road is simply open.
(function () {
  const pause = document.getElementById('pause');
  const form = document.getElementById('pause-name');
  const sitting = document.getElementById('pause-sitting');
  const opened = document.getElementById('pause-open');
  const door = document.querySelector('.world-door');
  if (!pause || !form || !sitting || !opened || !door) return;

  const seconds = Math.max(5, Number(pause.dataset.seconds) || 30);

  function seal() {
    door.classList.add('is-sealed');
    door.setAttribute('aria-disabled', 'true');
    door.setAttribute('tabindex', '-1');
    door.dataset.href = door.getAttribute('href');
    door.removeAttribute('href');
  }

  function open() {
    door.classList.remove('is-sealed');
    door.removeAttribute('aria-disabled');
    door.removeAttribute('tabindex');
    door.setAttribute('href', door.dataset.href);
    pause.classList.remove('is-sitting');
    pause.classList.add('is-still');
    sitting.hidden = true;
    opened.hidden = false;
    door.focus({ preventScroll: true });
  }

  seal();
  form.hidden = false;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const field = form.querySelector('input');
    const word = document.getElementById('pool-word');
    if (word) word.textContent = field.value.trim();
    field.value = '';
    field.blur();
    form.hidden = true;
    sitting.hidden = false;
    pause.classList.add('is-sitting');
    pause.style.setProperty('--sit', seconds + 's');
    window.setTimeout(open, seconds * 1000);
  });
})();
