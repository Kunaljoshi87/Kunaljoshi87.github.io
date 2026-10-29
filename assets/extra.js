/* Mega Engineering – business detail drawer + command palette. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BIZ = window.MEGA_BIZ || [], CASES = window.MEGA_CASES || [], REM = window.MEGA_REMOTE || {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(u, alt, cls) { var n = String(u).split('/').pop(), r = REM[n]; return '<img src="' + esc(u) + '" alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + ' loading="lazy"' + (r ? ' onerror="this.onerror=null;this.src=\'' + r + '\'"' : '') + '>'; }

  var KW = { distillery: ['ethanol', 'distillery', 'ena'], evaporation: ['evaporation', 'mee', 'dryer'], zld: ['zld', 'zero liquid', 'water recovery'], solvent: ['solvent'], skid: ['skid', 'modular'], critical: ['critical process'], biocng: ['biocng', 'biogas'], co2: ['co₂', 'co2'], brewery: ['brewery', 'brewing'] };
  var STEPS = [['Consultation', 'Analysis of your requirements and feasibility studies'], ['Design', 'Custom engineering design and detailed project planning'], ['Procurement', 'Strategic sourcing of premium materials and equipment'], ['Construction', 'Expert installation and rigorous quality control'], ['Commissioning', 'Complete testing, training and successful handover']];
  var WHY = [['Modular skid-mounted supply', 'Cuts project execution time and site work'], ['110+ engineers & professionals', 'Tailor-made, efficient solutions'], ['Punctual delivery', 'Plants delivered well before schedule']];

  /* ---------------- business drawer ---------------- */
  var bd = $('#bd'), panel = $('#bdpanel'), curBiz = -1, lastFocus = null;
  function related(b) {
    if (!window.MegaBlog) return [];
    var kws = KW[b.id] || [b.name.toLowerCase()];
    return window.MegaBlog.all().filter(function (p) {
      var t = (p.title + ' ' + p.body).toLowerCase();
      return p.cat === b.name || kws.some(function (k) { return t.indexOf(k) > -1; });
    }).slice(0, 3);
  }
  function openBiz(id, silent) {
    var i = BIZ.map(function (b) { return b.id; }).indexOf(id); if (i < 0) return;
    curBiz = i; var b = BIZ[i], c = b.case != null ? CASES[b.case] : null, rel = related(b);
    var prev = BIZ[(i + BIZ.length - 1) % BIZ.length], next = BIZ[(i + 1) % BIZ.length];
    panel.innerHTML =
      '<button class="bd__x" id="bdx" aria-label="Close">×</button>' +
      '<div class="bd__hero">' + img(b.img, b.name) + '<div class="bd__hg"><span class="kicker">Business line ' + (i + 1) + ' of ' + BIZ.length + '</span><h2>' + esc(b.name) + '</h2><p>' + esc(b.short) + '</p></div></div>' +
      '<div class="bd__c">' +
      '<section><h3>Overview</h3><p>' + esc(b.desc) + '</p></section>' +
      '<section><h3>What we deliver</h3><ul class="bd__pts">' + b.pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></section>' +
      '<section><h3>How we deliver</h3><ol class="bd__steps">' + STEPS.map(function (s, k) { return '<li><span>' + (k + 1) + '</span><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div></li>'; }).join('') + '</ol></section>' +
      (c ? '<section><h3>Proven result</h3><div class="bd__case">' + img('assets/img/' + c.img, c.title) + '<div><div class="bd__num">' + esc(c.num) + '</div><small>' + esc(c.lab) + '</small><b>' + esc(c.title) + '</b><p>' + esc(c.txt) + '</p></div></div></section>' : '') +
      '<section><h3>Why Mega</h3><div class="bd__why">' + WHY.map(function (w) { return '<div><b>' + w[0] + '</b><small>' + w[1] + '</small></div>'; }).join('') + '</div></section>' +
      (rel.length ? '<section><h3>Latest posts about this</h3><div class="bd__rel">' + rel.map(window.MegaBlog.cardMini).join('') + '</div></section>' : '') +
      '<div class="bd__cta"><a class="btn btn--accent" href="#contact" data-type="' + esc(b.name) + '" id="bdq">Request a quote for ' + esc(b.name) + '</a></div>' +
      '<div class="bd__nav"><button type="button" data-b="' + prev.id + '">‹ ' + esc(prev.name) + '</button><button type="button" data-b="' + next.id + '">' + esc(next.name) + ' ›</button></div>' +
      '</div>';
    lastFocus = document.activeElement; bd.hidden = false; document.body.style.overflow = 'hidden'; panel.scrollTop = 0; requestAnimationFrame(function () { bd.classList.add('on'); }); $('#bdx').focus();
    if (!silent) try { history.replaceState(null, '', location.pathname + location.search + '#biz/' + id); } catch (e) {}
  }
  function closeBiz() {
    if (!bd || bd.hidden) return; bd.classList.remove('on'); document.body.style.overflow = '';
    setTimeout(function () { bd.hidden = true; }, 350);
    if (location.hash.indexOf('#biz/') === 0) try { history.replaceState(null, '', location.pathname + location.search + '#solutions'); } catch (e) {}
    if (lastFocus) lastFocus.focus();
  }
  if (bd) {
    bd.addEventListener('click', function (e) {
      if (e.target.id === 'bdback' || e.target.closest('#bdx')) { closeBiz(); return; }
      var n = e.target.closest('[data-b]'); if (n) { openBiz(n.getAttribute('data-b')); return; }
      var q = e.target.closest('#bdq'); if (q) {
        closeBiz();
        var name = q.getAttribute('data-type'); $$('.chip').forEach(function (c) { var on = c.textContent.trim() === name; c.classList.toggle('on', on); if (on) { var h = $('#wtype'); if (h) h.value = name; } });
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bd.hidden && $('#pv').hidden && $('#cmd').hidden) closeBiz(); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-biz]'); if (t) { e.preventDefault(); openBiz(t.getAttribute('data-biz')); }
  });
  function route() { var h = location.hash || ''; if (h.indexOf('#biz/') === 0) openBiz(decodeURIComponent(h.slice(5)), true); }
  window.addEventListener('hashchange', route);
  setTimeout(route, 250);
  window.MegaBiz = { open: openBiz };

  /* ---------------- command palette ---------------- */
  var cmd = $('#cmd'), cq = $('#cmdq'), cl = $('#cmdl'), items = [], sel = 0;
  function gather() {
    var out = [];
    [['Home', '#home'], ['About Mega', '#about'], ['Business areas', '#solutions'], ['How a plant works', '#process'], ['Case studies', '#cases'], ['Why choose Mega', '#why'], ['Projects gallery', '#projects'], ['Blog', '#blog'], ['Contact / Get a quote', '#contact']].forEach(function (s) {
      out.push({ g: 'Go to', t: s[0], f: function () { location.hash = s[1]; } });
    });
    BIZ.forEach(function (b) { out.push({ g: 'Business line', t: b.name, s: b.short, f: function () { openBiz(b.id); } }); });
    if (window.MegaBlog) window.MegaBlog.all().forEach(function (p) { out.push({ g: 'Post', t: p.title, s: p.cat, f: function () { window.MegaBlog.open(p.id); } }); });
    out.push({ g: 'Action', t: 'Toggle dark mode', f: function () { var t = $('#theme'); if (t) t.click(); } });
    out.push({ g: 'Action', t: 'Chat on WhatsApp', f: function () { window.open('https://wa.me/917276011520', '_blank', 'noopener'); } });
    return out;
  }
  function draw() {
    var q = cq.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var all = gather();
    items = all.filter(function (it) { var h = (it.t + ' ' + (it.s || '') + ' ' + it.g).toLowerCase(); return q.every(function (w) { return h.indexOf(w) > -1; }); }).slice(0, 12);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    cl.innerHTML = items.length ? items.map(function (it, i) { return '<li class="' + (i === sel ? 'on' : '') + '" data-i="' + i + '"><span class="cmd__g">' + esc(it.g) + '</span><b>' + esc(it.t) + '</b>' + (it.s ? '<small>' + esc(it.s) + '</small>' : '') + '</li>'; }).join('') : '<li class="none">No results</li>';
  }
  function openCmd() { if (!cmd) return; cmd.hidden = false; cq.value = ''; sel = 0; draw(); setTimeout(function () { cq.focus(); }, 30); }
  function closeCmd() { cmd.hidden = true; }
  function run(i) { var it = items[i]; if (!it) return; closeCmd(); setTimeout(it.f, 60); }
  if (cmd) {
    cq.addEventListener('input', function () { sel = 0; draw(); });
    cq.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { closeCmd(); }
    });
    cl.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) run(+li.getAttribute('data-i')); });
    cmd.addEventListener('click', function (e) { if (e.target === cmd) closeCmd(); });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openCmd(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && cmd && cmd.hidden) { e.preventDefault(); openCmd(); }
  });
  var btn = $('#cmdk'); if (btn) btn.addEventListener('click', openCmd);
})();
