/* Mega Engineering – extra motion effects. */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* heading words rise in one by one */
  $$('.head h2, .sec h2.reveal').forEach(function (h) {
    if (h.children.length || h.dataset.split) return; h.dataset.split = 1;
    var w = h.textContent.trim().split(/\s+/);
    h.innerHTML = w.map(function (x, i) { return '<span class="wd" style="--i:' + i + '"><span>' + x.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></span>'; }).join(' ');
  });

  /* spotlight that follows the pointer on cards */
  var CARD = '.wcard,.vcard,.step,.pt,.fc,.bd__case,.cmd__box,.why,.case';
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest(CARD); if (!c) return;
      var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); c.classList.add('spot');
    }, { passive: true });
  }

  /* floating orbs + scroll driven parallax + marquee speed */
  if (!reduce) {
    var orbs = document.createElement('div'); orbs.className = 'orbs'; orbs.setAttribute('aria-hidden', 'true'); orbs.innerHTML = '<i></i><i></i><i></i>'; document.body.appendChild(orbs);
    var mx = 0, my = 0, sy = window.scrollY, last = sy, vel = 0, tick = false;
    var par = $$('.sec img.par, .about img, .gallery img, .hero__img');
    document.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req(); }, { passive: true });
    window.addEventListener('scroll', function () { sy = window.scrollY; req(); }, { passive: true });
    function req() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
    function frame() {
      tick = false; vel += (Math.abs(sy - last) - vel) * .2; last = sy;
      var o = orbs.children; o[0].style.transform = 'translate(' + (mx * 60) + 'px,' + (my * 40 + sy * .06) + 'px)'; o[1].style.transform = 'translate(' + (-mx * 80) + 'px,' + (-my * 60 - sy * .04) + 'px)'; o[2].style.transform = 'translate(' + (mx * 40) + 'px,' + (sy * .03) + 'px)';
      par.forEach(function (im) { var r = im.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; var k = ((r.top + r.height / 2) / innerHeight - .5) * -26; im.style.transform = 'translate3d(0,' + k.toFixed(1) + 'px,0) scale(1.06)'; });
      var sp = 1 + Math.min(vel / 8, 5); $$('.marq__t').forEach(function (t) { t.style.animationDuration = (t.parentNode.classList.contains('marq--r') ? 70 : 60) / sp + 's'; });
      document.documentElement.style.setProperty('--sy', (sy / Math.max(1, document.body.scrollHeight - innerHeight)).toFixed(3));
      if (vel > .3) req();
    }
    req();
  }

  /* confetti burst (used after publishing a post) */
  function confetti() {
    if (reduce) return;
    var c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var x = c.getContext('2d'), cols = ['#f59e0b', '#0a66c2', '#22c55e', '#ef4444', '#a855f7', '#fff'], ps = [];
    for (var i = 0; i < 140; i++) ps.push({ x: innerWidth / 2, y: innerHeight * .6, vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 4, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function loop(t) {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); x.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(loop); else c.remove();
    })(t0);
  }
  window.MegaFX = { confetti: confetti };
})();
