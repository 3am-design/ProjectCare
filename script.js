// Project Care — homepage interactions

// Layout grid overlay (Figma column guide) — press "G" to toggle.
// 12 columns, 204px margins, 25px gutter, #FF6200 @ 10%.
(function () {
  var overlay = document.createElement('div');
  overlay.className = 'grid-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  var inner = document.createElement('div');
  inner.className = 'grid-overlay__inner';
  for (var i = 0; i < 12; i++) {
    var col = document.createElement('div');
    col.className = 'grid-overlay__col';
    inner.appendChild(col);
  }
  overlay.appendChild(inner);
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

// Mobile nav — hamburger toggles the dropdown panel.
(function () {
  var header = document.querySelector('.nav');
  var burger = document.querySelector('.nav__burger');
  if (!header || !burger) return;
  function close() { header.classList.remove('nav--open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = header.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // close after tapping a link in the mobile panel
  document.querySelectorAll('.nav__mobile a').forEach(function (a) {
    a.addEventListener('click', close);
  });
})();

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
