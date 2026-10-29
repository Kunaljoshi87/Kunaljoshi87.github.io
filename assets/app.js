/* Mega Engineering showcase – interactions. No external libraries. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var doc = document.documentElement;

  /* ---------- preloader ---------- */
  var pre = $('#pre');
  var t0 = Date.now();
  function hidePre() { if (pre) { pre.classList.add('done'); setTimeout(function () { pre.remove(); }, 800); } }
  window.addEventListener('load', function () { setTimeout(hidePre, Math.max(0, 1000 - (Date.now() - t0))); });
  setTimeout(hidePre, 3500);

  /* ---------- header, progress, back-to-top ---------- */
  var hdr = $('#hdr'), bar = $('#progress i'), totop = $('#totop');
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY || doc.scrollTop;
    var h = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (hdr) {
      hdr.classList.toggle('stuck', y > 40);
      var menuOpen = $('#nav.open') || $('.has-mm:hover');
      hdr.classList.toggle('hide', y > 300 && y > lastY + 4 && !menuOpen);
      if (y < lastY - 4) hdr.classList.remove('hide');
    }
    if (totop) totop.classList.toggle('on', y > 700);
    parallax(y);
    stepsProgress();
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- theme ---------- */
  var themeBtn = $('#theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('mega-theme', next); } catch (e) {}
  });

  /* ---------- nav: burger, mega menu, scrollspy ---------- */
  var burger = $('.burger'), nav = $('#nav'), mmWrap = $('.has-mm'), mmBtn = $('.mm__btn');
  function closeNav() { if (nav) nav.classList.remove('open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); } if (mmWrap) mmWrap.classList.remove('open'); }
  if (burger && nav) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  if (mmBtn && mmWrap) mmBtn.addEventListener('click', function (e) {
    if (window.matchMedia('(max-width: 980px)').matches) { e.preventDefault(); var o = mmWrap.classList.toggle('open'); mmBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  $$('#nav a:not(.mm__btn)').forEach(function (a) { a.addEventListener('click', closeNav); });
  $$('.mm__i').forEach(function (a) { a.addEventListener('click', closeNav); });

  var spyLinks = $$('#nav > a[href^="#"]');
  var spyMap = {};
  spyLinks.forEach(function (a) { spyMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && spyMap[e.target.id]) { spyLinks.forEach(function (l) { l.classList.remove('is-on'); }); spyMap[e.target.id].classList.add('is-on'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- reveal (staggered) ---------- */
  doc.classList.add('js');
  $$('.reveal').forEach(function (el) {
    var sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [el];
    var i = sibs.indexOf(el);
    el.style.setProperty('--d', Math.min(i, 6) * 0.09 + 's');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- counters ---------- */
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    if (reduce) { el.textContent = end; return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1500, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); if (!e.target.closest('.slide')) countUp(e.target); } });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- tilt + magnetic + cursor glow ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .12s ease-out, box-shadow .3s';
        el.style.transform = 'perspective(800px) rotateX(' + (-y * 9).toFixed(2) + 'deg) rotateY(' + (x * 11).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transition = 'transform .5s ease, box-shadow .3s'; el.style.transform = ''; });
    });
    $$('.magnet').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .15s ease-out, background .2s, border-color .2s, color .2s, box-shadow .2s';
        el.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px,' + (y * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transition = 'transform .4s cubic-bezier(.2,.9,.3,1.4), background .2s, border-color .2s, color .2s, box-shadow .2s'; el.style.transform = ''; });
    });
    var glow = $('#glow');
    if (glow) {
      window.addEventListener('pointermove', function (e) { glow.classList.add('on'); glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, { passive: true });
      document.addEventListener('pointerleave', function () { glow.classList.remove('on'); });
    }
  }

  /* ---------- parallax ---------- */
  var statsImg = $('.stats__bg img'), statsSec = $('#stats');
  function parallax(y) {
    if (reduce || !statsImg || !statsSec) return;
    var r = statsSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    statsImg.style.transform = 'translateY(' + ((r.top - window.innerHeight / 2) * -0.12).toFixed(1) + 'px)';
  }

  /* ---------- hero: rotating word, video, particle network ---------- */
  var rot = $('#rot');
  if (rot && !reduce) {
    var words = ['Ethanol', 'Distillery', 'Evaporation', 'Zero Liquid Discharge', 'BioCNG', 'Critical Equipment'], wi = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 350);
    }, 2400);
  }
  var vid = $('.hero__video');
  if (vid) {
    vid.addEventListener('playing', function () { vid.classList.add('on'); });
    vid.addEventListener('error', function () { vid.style.display = 'none'; });
    $$('source', vid).forEach(function (s) { s.addEventListener('error', function () { vid.style.display = 'none'; }); });
    var pp = vid.play && vid.play();
    if (pp && pp.catch) pp.catch(function () {});
  }

  var cv = $('#net');
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), pts = [], mouse = { x: -999, y: -999 }, running = false, heroEl = $('.hero');
    function resize() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(26, Math.min(70, Math.round(W / 22)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .8 });
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { var f = (1 - d2 / 16000) * 0.9; p.vx += dx / Math.sqrt(d2 + 1) * f * 0.06; p.vy += dy / Math.sqrt(d2 + 1) * f * 0.06; }
        p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fillStyle = 'rgba(160,210,255,.75)'; ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], ax = p.x - q.x, ay = p.y - q.y, dd = ax * ax + ay * ay;
          if (dd < 11000) { ctx.strokeStyle = 'rgba(120,190,255,' + (0.28 * (1 - dd / 11000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
        if (md < 24000) { ctx.strokeStyle = 'rgba(255,185,56,' + (0.5 * (1 - md / 24000)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    heroEl.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    heroEl.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { var on = es[0].isIntersecting; if (on && !running) { running = true; frame(); } else if (!on) running = false; }, { threshold: 0 }).observe(heroEl);
    } else { running = true; frame(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else if (!running) { running = true; frame(); } });
  }

  /* ---------- explorer (tabs) + wheel ---------- */
  var tabs = $$('.tab'), panels = $$('.panel');
  function openTab(i, scroll) {
    i = Math.max(0, Math.min(tabs.length - 1, i));
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach(function (p, k) { p.hidden = k !== i; p.classList.toggle('is-active', k === i); });
    if (scroll) { var s = $('#solutions'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    var t = tabs[i]; if (t && t.scrollIntoView && window.matchMedia('(max-width:1100px)').matches) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { openTab(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = i;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = i + 1; else if (k === 'ArrowUp' || k === 'ArrowLeft') n = i - 1; else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1; else return;
      e.preventDefault(); openTab(n); tabs[Math.max(0, Math.min(tabs.length - 1, n))].focus();
    });
  });
  $$('[data-open-tab]').forEach(function (a) { a.addEventListener('click', function () { openTab(parseInt(a.getAttribute('data-open-tab'), 10), false); }); });

  var wcap = $('#wcap');
  var defCap = wcap ? wcap.innerHTML : '';
  $$('.wseg').forEach(function (g) {
    function show() { if (wcap) wcap.innerHTML = '<b>' + g.getAttribute('data-name') + '</b><span>' + g.getAttribute('data-short') + '</span>'; }
    function hide() { if (wcap) wcap.innerHTML = defCap; }
    g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
    g.addEventListener('mouseleave', hide); g.addEventListener('blur', hide);
    function go() { openTab(parseInt(g.getAttribute('data-tab'), 10), true); }
    g.addEventListener('click', go);
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ---------- quote buttons preselect type ---------- */
  var chips = $$('.chip'), wtype = $('#wtype');
  function selectChip(name) {
    chips.forEach(function (c) { var on = c.textContent.trim().toLowerCase() === (name || '').trim().toLowerCase(); c.classList.toggle('on', on); if (on && wtype) wtype.value = c.textContent.trim(); });
  }
  $$('[data-type]').forEach(function (a) { a.addEventListener('click', function () { selectChip(a.getAttribute('data-type')); }); });

  /* ---------- process flow ---------- */
  var nodes = $$('.fnode'), finfo = $('#finfo'), ft = $('#ftitle'), fd = $('#fdesc'), flowEl = $('#flow'), fi = 0, fHover = false;
  function showNode(i) {
    fi = i;
    nodes.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
    var n = nodes[i]; if (!n) return;
    ft.textContent = n.getAttribute('data-t'); fd.textContent = n.getAttribute('data-d');
  }
  nodes.forEach(function (n, i) {
    n.addEventListener('mouseenter', function () { fHover = true; showNode(i); });
    n.addEventListener('mouseleave', function () { fHover = false; });
    n.addEventListener('click', function () { showNode(i); });
    n.addEventListener('focus', function () { showNode(i); });
  });
  if (nodes.length) {
    showNode(0);
    if (!reduce && 'IntersectionObserver' in window) {
      var inView = false;
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(flowEl);
      setInterval(function () { if (inView && !fHover && !document.hidden) showNode((fi + 1) % nodes.length); }, 3600);
    }
  }

  /* ---------- process steps progress ---------- */
  var stepsEl = $('#steps'), fill = $('#stepsfill'), stepItems = $$('.step');
  function stepsProgress() {
    if (!stepsEl || !fill) return;
    var r = stepsEl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.2)));
    fill.style.width = (p * 100).toFixed(1) + '%';
    stepItems.forEach(function (s, i) { s.classList.toggle('lit', p >= (i + 0.35) / stepItems.length); });
  }

  /* ---------- case-study carousel ---------- */
  var slides = $$('.slide'), dots = $$('.dot'), ci = 0, car = $('#car'), carbar = $('#carbar'), carHover = false, carStart = Date.now(), DUR = 7000;
  function goSlide(i) {
    ci = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === ci); s.setAttribute('aria-hidden', k === ci ? 'false' : 'true'); });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === ci); });
    $$('[data-count]', slides[ci]).forEach(countUp);
    carStart = Date.now();
  }
  if (slides.length) {
    var pv = $('#prev'), nx = $('#next');
    if (pv) pv.addEventListener('click', function () { goSlide(ci - 1); });
    if (nx) nx.addEventListener('click', function () { goSlide(ci + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { goSlide(k); }); });
    car.addEventListener('mouseenter', function () { carHover = true; });
    car.addEventListener('mouseleave', function () { carHover = false; carStart = Date.now(); });
    car.addEventListener('focusin', function () { carHover = true; });
    car.addEventListener('focusout', function () { carHover = false; carStart = Date.now(); });
    car.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') goSlide(ci - 1); if (e.key === 'ArrowRight') goSlide(ci + 1); });
    var sx = null;
    car.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) goSlide(ci + (dx < 0 ? 1 : -1)); sx = null; });
    goSlide(0);
    if (!reduce) setInterval(function () {
      if (carHover || document.hidden) { carStart = Date.now(); if (carbar) carbar.style.width = '0'; return; }
      var p = (Date.now() - carStart) / DUR;
      if (carbar) carbar.style.width = Math.min(p, 1) * 100 + '%';
      if (p >= 1) goSlide(ci + 1);
    }, 100);
  }

  /* ---------- lightbox ---------- */
  var LB = window.MEGA_LB || [], lb = $('#lb'), lbi = $('#lbi'), lbc = $('#lbc'), li = 0, lastFocus = null;
  function lbShow(i) {
    li = (i + LB.length) % LB.length;
    var d = LB[li];
    lbi.onerror = function () { lbi.onerror = null; lbi.src = d.f; };
    lbi.src = d.s; lbi.alt = d.c; lbc.textContent = d.c + '  ·  ' + (li + 1) + ' / ' + LB.length;
  }
  function lbOpen(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(i); $('#lbx').focus(); }
  function lbClose() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  if (lb) {
    $$('.g').forEach(function (g) { g.addEventListener('click', function () { lbOpen(parseInt(g.getAttribute('data-lb'), 10)); }); });
    $('#lbx').addEventListener('click', lbClose);
    $('#lbp').addEventListener('click', function () { lbShow(li - 1); });
    $('#lbn').addEventListener('click', function () { lbShow(li + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbShow(li - 1); else if (e.key === 'ArrowRight') lbShow(li + 1);
    });
  }

  /* ---------- enquiry wizard ---------- */
  var form = $('#wiz');
  if (form) {
    var step = 1, wbar = $('#wbar'), wstep = $('#wstep'), wback = $('#wback'), wnext = $('#wnext'), sets = $$('.ws', form);
    chips.forEach(function (c) { c.addEventListener('click', function () { selectChip(c.textContent); var e1 = $('#e1'); if (e1) e1.hidden = true; }); });
    function render() {
      sets.forEach(function (s) { s.classList.toggle('is-on', parseInt(s.getAttribute('data-s'), 10) === step); });
      var shown = Math.min(step, 3);
      wbar.style.width = (step >= 4 ? 100 : shown / 3 * 100) + '%';
      wstep.textContent = step >= 4 ? 'Done' : 'Step ' + shown + ' of 3';
      wback.hidden = step === 1 || step >= 4;
      wnext.hidden = step >= 4;
      wnext.textContent = step === 3 ? 'Send enquiry' : 'Next';
    }
    function val(n) { var el = form.elements[n]; return el ? el.value.trim() : ''; }
    wnext.addEventListener('click', function () {
      if (step === 1) { if (!val('type')) { $('#e1').hidden = false; return; } step = 2; }
      else if (step === 2) { step = 3; }
      else if (step === 3) {
        var ok = val('name') && val('phone') && /^\S+@\S+\.\S+$/.test(val('email'));
        $('#e3').hidden = !!ok;
        if (!ok) return;
        if (form.elements.website && form.elements.website.value) return;
        var body = ['Project type: ' + val('type'), 'Capacity: ' + (val('capacity') || '-'), 'Feedstock: ' + val('feedstock'), 'Location: ' + (val('location') || '-'), 'Timeline: ' + val('timeline'), '',
          'Name: ' + val('name'), 'Company: ' + (val('company') || '-'), 'Phone: ' + val('phone'), 'Email: ' + val('email'), '', val('message')].join('\n');
        step = 4; render();
        window.location.href = 'mailto:sales@mega.tc?subject=' + encodeURIComponent('Project enquiry – ' + val('type') + ' – ' + val('name')) + '&body=' + encodeURIComponent(body);
        return;
      }
      render();
    });
    wback.addEventListener('click', function () { if (step > 1) { step--; render(); } });
    var wreset = $('#wreset');
    if (wreset) wreset.addEventListener('click', function () { form.reset(); chips.forEach(function (c) { c.classList.remove('on'); }); if (wtype) wtype.value = ''; step = 1; render(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); wnext.click(); });
    render();
  }

  onScroll();
})();
