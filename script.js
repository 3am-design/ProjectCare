// Project Care — homepage interactions

// Layout grid overlay (Figma column guide) — press "G" to toggle.
// 12 columns, 204px margins, 25px gutter, #FF6200 @ 10%.
(function () {
  var overlay = document.createElement('div');
  overlay.className = 'grid-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  var cap = document.createElement('div');
  cap.className = 'grid-overlay__cap';
  var inner = document.createElement('div');
  inner.className = 'grid-overlay__inner';
  for (var i = 0; i < 12; i++) {
    var col = document.createElement('div');
    col.className = 'grid-overlay__col';
    inner.appendChild(col);
  }
  cap.appendChild(inner);
  overlay.appendChild(cap);
  document.body.appendChild(overlay);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'g' && e.key !== 'G') return;
    // ignore while typing in a field
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    overlay.classList.toggle('is-on');
  });
})();

// Mobile nav — hamburger toggles a full-screen panel that radiates out from
// the hamburger's own screen position (circle clip-path, see style.css).
(function () {
  var header = document.querySelector('.nav');
  var burger = document.querySelector('.nav__burger');
  var mobile = document.querySelector('.nav__mobile');
  if (!header || !burger) return;
  function placeOrigin() {
    if (!mobile) return;
    var r = burger.getBoundingClientRect();
    mobile.style.setProperty('--mnav-x', (r.left + r.width / 2) + 'px');
    mobile.style.setProperty('--mnav-y', (r.top + r.height / 2) + 'px');
  }
  function close() {
    header.classList.remove('nav--open');
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('nav-lock');
    document.body.classList.remove('nav-lock');
  }
  burger.addEventListener('click', function () {
    var open = header.classList.contains('nav--open');
    if (!open) placeOrigin();   // measure before revealing, so the circle starts exactly at the icon
    header.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', open ? 'false' : 'true');
    document.documentElement.classList.toggle('nav-lock', !open);
    document.body.classList.toggle('nav-lock', !open);
  });
  // close after tapping a link in the mobile panel
  document.querySelectorAll('.nav__mobile a').forEach(function (a) {
    a.addEventListener('click', close);
  });
})();

// Tab components — About 架構與管理 (.org-tab) + Services 重點服務 (.svc-tab)
(function () {
  var tabs = document.querySelectorAll('.org-tab, .svc-tab');
  if (!tabs.length) return;
  function select(tab) {
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = (t !== tab);
    });
  }
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { select(tab); });
  });
  // deep link: #panel-cmte / #panel-ride etc. opens that tab
  var target = location.hash && document.querySelector('.org-tab[aria-controls="' + location.hash.slice(1) + '"], .svc-tab[aria-controls="' + location.hash.slice(1) + '"]');
  if (target) select(target);
})();

// Card sliders with prev/next buttons — About 服務發展 + Services 申請及退出手續.
// A slider is a scroll container with data-slider="name" whose first child is
// the card track; its buttons carry data-slider-prev/next="name".
document.querySelectorAll('[data-slider]').forEach(function (track) {
  var name = track.getAttribute('data-slider');
  var prev = document.querySelector('[data-slider-prev="' + name + '"]');
  var next = document.querySelector('[data-slider-next="' + name + '"]');
  if (!prev || !next) return;
  var inner = track.firstElementChild;
  var card = inner && inner.firstElementChild;
  function step() {
    if (!card) return track.clientWidth * 0.8;
    var style = getComputedStyle(inner);
    return card.getBoundingClientRect().width + parseFloat(style.columnGap || style.gap || 0);
  }
  function updateDisabled() {
    var max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  }
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  track.addEventListener('scroll', updateDisabled, { passive: true });
  window.addEventListener('resize', updateDisabled);
  updateDisabled();
});

document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Photo zoom frames. Keep every image's existing positioning/sizing classes
// on a fixed outer frame and scale only the nested bitmap on hover.
document.querySelectorAll('img.photo, img.n-card__img, img.n-feat__img').forEach(function (img) {
  var frame = document.createElement('span');
  frame.className = img.className + ' photo-frame';
  function setPhotoRatio() {
    if (img.naturalWidth && img.naturalHeight) {
      frame.style.setProperty('--photo-ratio', img.naturalWidth + ' / ' + img.naturalHeight);
    }
  }
  frame.style.setProperty('--photo-ratio', '3 / 2');
  if (img.complete) setPhotoRatio();
  else img.addEventListener('load', setPhotoRatio, { once: true });
  img.className = 'photo-frame__img';
  img.parentNode.insertBefore(frame, img);
  frame.appendChild(img);
});

// ============================================================
// MOTION SYSTEM — shared by every page.
// Everything rises in on scroll with the VC-site recipe (30px / 2.2s
// ease-out-quint, no artificial stagger); background blobs/doodles are
// JS-driven so they reveal by opacity only.
// ============================================================
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // If the head failsafe already lifted the pre-paint veil (this script
  // arrived >3s late — cold cache / cloud-synced disk), the page is already
  // painted visible. Hiding it now would replay the whole entrance in
  // reverse first (text sinks down, then rises) — skip the reveals entirely
  // for this load; background motion below still runs.
  var late = document.documentElement.classList.contains('fx-marked');
  document.documentElement.classList.add('js-fx');

  // ---------- scroll reveal ----------
  // every visible content element rises in: text, images, buttons,
  // form fields, pills, cards — nothing gets left behind.
  var sel = '.sec__inner .disp, .sec__inner .t, .sec__inner .img, ' +
            '.sec__inner .ming, .sec__inner .sans, .sec__inner .num, .sec__inner .photo, ' +
            '.sec__inner button, .sec__inner input, .sec__inner select, .sec__inner textarea, ' +
            '.sec__inner .div-line, .su-pill, .c-pill, .c-map, .n-card, .n-feat, ' +
            // whole cards rise as one unit (their inner text is filtered out below)
            '.p-card, .cbox, .cmte-card, .member-card, ' +
            '.annual__cover, .annual__txt, .org-lockup, .role-label, .org-divider, ' +
            '.chart__lines, .chome__chips, .p-unit-chip, .su-family, .s-tags, .a-tagline, .nd-wrap > *, ' +
            // horizontal sliders (服務發展/申請及退出手續): reveal the whole rail
            // once, never per-card — individual cards only enter the page
            // viewport as the user drags the slider, so revealing them one at
            // a time made cards visibly fade/rise WHILE being scrolled into
            // view horizontally, which read as "cropping" mid-drag.
            '.a-tl, .p-app';
  var targets = Array.prototype.slice.call(document.querySelectorAll(sel))
    // the footer just appears — no reveal there
    .filter(function (el) { return !el.closest('.sec--footer'); })
    // skip anything nested inside another target (e.g. .t inside .n-card)
    .filter(function (el) { return !(el.parentElement && el.parentElement.closest(sel)); });
  if (late) targets = [];

  // Sequencing: a light cascade — each element in a batch starts 80ms after
  // the previous one (capped), while the 2.2s glide keeps them overlapping.
  // Short delays + long ease = 先後感 without the stop-start feel.
  var io = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) {
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    batch.forEach(function (e, i) {
      e.target.style.setProperty('--fx-d', Math.min(i * 80, 560) + 'ms');
      // Give the browser one complete paint to promote the element before
      // changing its end state. Promoting and animating in the same frame is
      // the small but visible hitch at the start of each reveal.
      e.target.classList.add('fx-live');
      e.target.addEventListener('transitionend', function tidyReveal() {
        e.target.classList.remove('fx-live');
      }, { once: true });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          e.target.classList.add('fx-in');
        });
      });
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  // hide targets right away, but only start revealing once the page has
  // actually painted (window load, capped at 2.5s) — otherwise image-heavy
  // pages finish the whole entrance before anything is visible
  targets.forEach(function (el) { el.classList.add('fx-r'); });
  // marking done — lift the pre-paint veil (see style.css .fx-marked note)
  document.documentElement.classList.add('fx-marked');
  var started = false;
  function begin() {
    // arm the transitions only now — hidden marking earlier was instant, so
    // no ordering of slow CSS/JS can ever show content sinking away
    document.documentElement.classList.add('fx-armed');
    requestAnimationFrame(function () {
      targets.forEach(function (el) { io.observe(el); });
    });
  }
  // The entrance must not run before the page is actually visible: gate on
  // window load (image-heavy pages first-paint late; ungated, the whole
  // sequence finished before paint and content "just appeared"). After load,
  // wait briefly for type metrics so the font swap doesn't land mid-rise.
  function start() {
    if (started) return;
    started = true;
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var cap = new Promise(function (res) { setTimeout(res, 700); });
    Promise.race([fonts, cap]).then(function () {
      requestAnimationFrame(begin);
    }, begin);
  }
  if (document.readyState === 'complete') { start(); }
  else {
    var startCap = setTimeout(start, 2500);
    window.addEventListener('load', function () { clearTimeout(startCap); start(); }, { once: true });
  }

  // ---------- lightweight background motion ----------
  // Only blurred blobs and small doodles participate. Large photos/hero art
  // stay out of this loop. Updates are capped at 30fps; the motion is slow
  // enough to remain fluid while leaving alternate frames free for scrolling.
  var blobs = [];
  document.querySelectorAll('img[class*="blob"], .bleed__canvas > img[src*="color_"], .annual__blob').forEach(function (el, i) {
    blobs.push({
      el: el, active: false, phase: i * 1.37,
      ampX: 7 + (i % 3) * 4, ampY: 10 + (i % 4) * 4,
      par: (0.025 + (i % 3) * 0.015) * (i % 2 ? 1 : -1),
      pointer: (9 + (i % 3) * 5) * (i % 2 ? -1 : 1),
      center: 0, appliedY: 0, px: 0, py: 0
    });
    el.classList.add('fx-bg-motion');
  });

  var doodles = [];
  document.querySelectorAll('.i-star1,.i-star2,.i-heart,.i-earth,.a-earth,.n-doodle,.i-svc-family,.i-svc-bike,.s-hands,.i-supjar').forEach(function (el, i) {
    doodles.push({
      el: el, active: false, phase: i * 1.71,
      pointer: (14 + (i % 4) * 7) * (i % 2 ? -1 : 1),
      px: 0, py: 0
    });
    el.classList.add('fx-bg-motion');
  });

  // hero art: same lerp/pointer-follow as doodles, but a much smaller
  // amplitude since these are large full-bleed images, not small icons.
  document.querySelectorAll('.i-hero-hand,.i-hands').forEach(function (el, i) {
    doodles.push({
      el: el, active: false, phase: i * 1.71,
      pointer: (5 + (i % 2) * 2) * (i % 2 ? -1 : 1),
      px: 0, py: 0
    });
    el.classList.add('fx-bg-motion');
  });

  if (!blobs.length && !doodles.length) return;

  var mx = 0, my = 0, targetScroll = window.scrollY;
  var smoothScroll = targetScroll, vh = window.innerHeight;
  var finePointer = window.matchMedia('(pointer:fine)').matches;

  function measureMotion() {
    var sy = window.scrollY;
    blobs.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      b.center = sy + r.top + r.height / 2 - b.appliedY;
    });
  }
  measureMotion();

  var motionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      blobs.concat(doodles).forEach(function (item) {
        if (item.el === entry.target) item.active = entry.isIntersecting;
      });
      entry.target.classList.toggle('fx-motion-active', entry.isIntersecting);
    });
  }, { rootMargin: '280px 0px', threshold: 0 });
  blobs.forEach(function (b) { motionIO.observe(b.el); });
  doodles.forEach(function (d) { motionIO.observe(d.el); });

  if (finePointer) {
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / vh - 0.5;
    }, { passive: true });
  }
  window.addEventListener('scroll', function () { targetScroll = window.scrollY; }, { passive: true });
  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    measureMotion();
  });

  var lastFrame = 0;
  function motionFrame(now) {
    requestAnimationFrame(motionFrame);
    if (document.hidden || now - lastFrame < 32) return;
    lastFrame = now;
    smoothScroll += (targetScroll - smoothScroll) * 0.16;

    blobs.forEach(function (b) {
      if (!b.active) return;
      // eased pointer-follow so the blobs lean toward the cursor, softly
      b.px += (mx * b.pointer - b.px) * 0.10;
      b.py += (my * b.pointer - b.py) * 0.10;
      var x = Math.sin(now * 0.00024 + b.phase) * b.ampX + b.px;
      var floatY = Math.cos(now * 0.00019 + b.phase) * b.ampY;
      var parallaxY = (smoothScroll + vh / 2 - b.center) * b.par;
      b.appliedY = floatY + parallaxY + b.py;
      b.el.style.translate = x.toFixed(1) + 'px ' + b.appliedY.toFixed(1) + 'px';
    });
    doodles.forEach(function (d) {
      if (!d.active) return;
      d.px += (mx * d.pointer - d.px) * 0.14;
      d.py += (my * d.pointer - d.py) * 0.14;
      var idle = Math.sin(now * 0.00042 + d.phase) * 3;
      d.el.style.translate = d.px.toFixed(1) + 'px ' + (d.py + idle).toFixed(1) + 'px';
    });
  }
  requestAnimationFrame(motionFrame);
})();
