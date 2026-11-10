// Mobile menu toggle.
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
}
// After accepting a CMS invite or password reset on the home page, go to the admin.
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', (user) => {
    if (!user) {
      window.netlifyIdentity.on('login', () => { document.location.href = '/admin/'; });
    }
  });
}

// Large view: click a photo to see it full-screen, with prev / next.
const links = [...document.querySelectorAll('.gallery-item a')];
if (links.length && typeof HTMLDialogElement !== 'undefined') {
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-label', 'Photo viewer');
  viewer.innerHTML =
    '<button class="viewer-close" type="button" aria-label="Close">×</button>' +
    '<div class="viewer-stage"><img alt=""></div>' +
    '<div class="viewer-controls"><button type="button" data-step="-1">prev</button><span aria-hidden="true">/</span>' +
    '<button type="button" data-step="1">next</button>' +
    '<button type="button" class="viewer-play" aria-pressed="false">slideshow</button><span class="viewer-count"></span></div>';
  document.body.appendChild(viewer);
  const stage = viewer.querySelector('.viewer-stage');
  const big = stage.querySelector('img');
  const count = viewer.querySelector('.viewer-count');
  const playBtn = viewer.querySelector('.viewer-play');
  const SLIDE_MS = 4000; // time each photo stays up during a slideshow
  let current = 0;
  let playing = false;
  let timer = null;

  const setPlaying = (on) => {
    playing = on;
    clearTimeout(timer);
    playBtn.textContent = on ? 'pause' : 'slideshow';
    playBtn.setAttribute('aria-pressed', String(on));
    if (on && big.complete && !big.classList.contains('loading')) queueNext();
  };
  // During a slideshow, the clock for a photo starts once it has loaded.
  const queueNext = () => {
    clearTimeout(timer);
    if (playing) timer = setTimeout(() => show(current + 1), SLIDE_MS);
  };

  // Tell the browser how wide the photo will be shown so it picks the right file.
  const sizesFor = (thumb) => {
    const ratio = thumb.width / thumb.height;
    const w = Math.min(stage.clientWidth - 40, stage.clientHeight * ratio);
    return Math.max(1, Math.round(w)) + 'px';
  };
  const show = (i) => {
    clearTimeout(timer);
    current = (i + links.length) % links.length;
    const link = links[current];
    const thumb = link.querySelector('img');
    big.classList.add('loading');
    big.sizes = sizesFor(thumb);
    big.srcset = link.dataset.srcset;
    big.src = link.href;
    big.alt = thumb.alt;
    big.width = thumb.width;
    big.height = thumb.height;
    count.textContent = (current + 1) + ' / ' + links.length;
    // Warm up the next photo.
    const next = links[(current + 1) % links.length];
    const pre = new Image();
    pre.sizes = sizesFor(next.querySelector('img'));
    pre.srcset = next.dataset.srcset;
  };
  big.addEventListener('load', () => { big.classList.remove('loading'); queueNext(); });
  big.addEventListener('error', () => { big.classList.remove('loading'); queueNext(); });
  playBtn.addEventListener('click', () => setPlaying(!playing));
  document.querySelectorAll('.slideshow-start').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => { viewer.showModal(); setPlaying(true); show(0); });
  });

  links.forEach((link, i) => link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open the file in a new tab
    e.preventDefault();
    viewer.showModal();
    show(i);
  }));
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelectorAll('[data-step]').forEach((b) =>
    b.addEventListener('click', () => show(current + Number(b.dataset.step))));
  stage.addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  // Swipe left / right on touch screens.
  let startX = null;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { e.preventDefault(); show(current + (dx < 0 ? 1 : -1)); }
  });
  // Scroll the page to the photo that was last viewed.
  viewer.addEventListener('close', () => {
    setPlaying(false);
    links[current].scrollIntoView({ block: 'center' });
    links[current].focus({ preventScroll: true });
  });
}

// Theme picker: white (default), black or gray background, remembered per visitor.
const picker = document.querySelector('.theme-picker');
if (picker) {
  const root = document.documentElement;
  const buttons = [...picker.querySelectorAll('[data-theme-set]')];
  const mark = () => {
    const now = root.dataset.theme || 'white';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === now)));
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.themeSet;
    if (t === 'white') delete root.dataset.theme; else root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode: just don't remember */ }
    mark();
  }));
  picker.hidden = false;
  mark();
}
