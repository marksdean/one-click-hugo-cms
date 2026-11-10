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
    '<button type="button" data-step="1">next</button><span class="viewer-count"></span></div>';
  document.body.appendChild(viewer);
  const stage = viewer.querySelector('.viewer-stage');
  const big = stage.querySelector('img');
  const count = viewer.querySelector('.viewer-count');
  let current = 0;

  // Tell the browser how wide the photo will be shown so it picks the right file.
  const sizesFor = (thumb) => {
    const ratio = thumb.width / thumb.height;
    const w = Math.min(stage.clientWidth - 40, stage.clientHeight * ratio);
    return Math.max(1, Math.round(w)) + 'px';
  };
  const show = (i) => {
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
  big.addEventListener('load', () => big.classList.remove('loading'));
  big.addEventListener('error', () => big.classList.remove('loading'));

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
    links[current].scrollIntoView({ block: 'center' });
    links[current].focus({ preventScroll: true });
  });
}
