/* Mega Engineering – Blog feed, post viewer and hidden admin (publishes via the GitHub API). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CATS = ['News', 'Projects', 'Technology', 'Awards', 'Events', 'Careers', 'Blog'];
  var BIZN = (window.MEGA_BIZ || []).map(function (b) { return b.name; });
  var CFG = window.MEGA_CFG || { owner: '', repo: '', branch: 'main' };
  var LOGO = 'assets/img/logo.png';

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var store = {
    get: function (k, d, sess) { try { var v = (sess ? sessionStorage : localStorage).getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v, sess) { try { (sess ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} }
  };
  function safeSrc(u) { u = String(u || ''); return /^(assets\/|https:\/\/|data:image\/)/.test(u) ? u : ''; }
  function imgTag(u, alt, cls, extra) {
    u = safeSrc(u); if (!u) return '';
    var name = u.split('/').pop(), rem = (window.MEGA_REMOTE || {})[name];
    var oe = rem ? ' onerror="this.onerror=null;this.src=\'' + rem + '\'"' : '';
    return '<img src="' + esc(u) + '" alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + ' loading="lazy"' + (extra || '') + oe + '>';
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function ytId(u) { var m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function toast(msg) { var t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2800); }
  window.MegaToast = toast;
  function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'post'; }

  /* lightweight, safe markdown */
  function inline(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>')
      .replace(/(^|\s)#([A-Za-z0-9_]{2,})/g, '$1<a href="#blog" class="tag" data-tag="$2">#$2</a>');
  }
  function md(text) {
    var lines = esc(text || '').split('\n'), out = [], para = [], list = false;
    function flush() { if (para.length) { out.push('<p>' + inline(para.join('<br>')) + '</p>'); para = []; } }
    function endList() { if (list) { out.push('</ul>'); list = false; } }
    lines.forEach(function (l) {
      var m;
      if (/^\s*$/.test(l)) { flush(); endList(); return; }
      if ((m = l.match(/^#{1,3}\s+(.+)/))) { flush(); endList(); out.push('<h4>' + inline(m[1]) + '</h4>'); return; }
      if ((m = l.match(/^\s*[-*]\s+(.+)/))) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      endList(); para.push(l);
    });
    flush(); endList();
    return out.join('');
  }
  function plain(text, n) { var t = String(text || '').replace(/[#*>\[\]\(\)]|https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t; }

  /* ---------------- data ---------------- */
  var posts = [];
  function norm(p) {
    return {
      id: String(p.id || slugify(p.title) + '-' + Date.now().toString(36)), title: String(p.title || 'Untitled'), cat: String(p.cat || 'News'), body: String(p.body || ''),
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [], video: String(p.video || ''), date: p.date || new Date().toISOString(),
      pinned: !!p.pinned, draft: !!p.draft, sample: !!p.sample
    };
  }
  function setPosts(arr) { posts = (arr || []).map(norm); }
  try { setPosts(JSON.parse($('#seed').textContent)); } catch (e) { posts = []; }
  function loadRemotePosts() {
    return fetch('posts.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (a) { if (Array.isArray(a)) { setPosts(a); render(); routeFromHash(); } }).catch(function () { render(); routeFromHash(); });
  }
  function pub() { return posts.filter(function (p) { return !p.draft; }).sort(function (a, b) { return (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date)); }); }

  /* ---------------- likes / saves ---------------- */
  function has(k, id) { return store.get(k, []).indexOf(id) > -1; }
  function flip(k, id) { var a = store.get(k, []), i = a.indexOf(id); if (i > -1) a.splice(i, 1); else a.push(id); store.set(k, a); return i === -1; }
  var HEART = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5.5 5.5 0 00-7.8 0L12 6.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>';
  var MARK = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  var SHARE = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3L11 14M22 3l-7 19-4-8-8-4z"/></svg>';
  function actsHtml(p) {
    return '<div class="acts" data-id="' + esc(p.id) + '"><button type="button" class="act act--like' + (has('mega-likes', p.id) ? ' on' : '') + '" data-a="like" aria-label="Like" aria-pressed="' + has('mega-likes', p.id) + '">' + HEART + '</button>' +
      '<button type="button" class="act" data-a="share" aria-label="Share">' + SHARE + '</button><button type="button" class="act act--save' + (has('mega-saved', p.id) ? ' on' : '') + '" data-a="save" aria-label="Save" aria-pressed="' + has('mega-saved', p.id) + '">' + MARK + '</button></div>';
  }
  function postUrl(id) { return location.origin + location.pathname + '#post/' + id; }
  function share(p) {
    var url = postUrl(p.id);
    if (navigator.share) { navigator.share({ title: p.title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { toast(url); });
    else toast(url);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.act'); if (!b) return;
    var id = b.parentNode.getAttribute('data-id'), p = posts.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var a = b.getAttribute('data-a');
    if (a === 'like') { var on = flip('mega-likes', id); $$('.acts[data-id="' + id + '"] .act--like').forEach(function (x) { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); if (on) { x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); } }); }
    else if (a === 'save') { var s = flip('mega-saved', id); $$('.acts[data-id="' + id + '"] .act--save').forEach(function (x) { x.classList.toggle('on', s); x.setAttribute('aria-pressed', s); }); toast(s ? 'Saved on this device' : 'Removed from saved'); }
    else if (a === 'share') share(p);
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.tag'); if (!t) return;
    e.preventDefault(); closeViewer(true); state.q = '#' + t.getAttribute('data-tag'); state.n = 9; var q = $('#bq'); if (q) q.value = state.q; render();
    var s = $('#blog'); if (s) s.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------------- media carousel ---------------- */
  function mediaHtml(p) {
    var s = p.images.map(function (u) { return '<div class="mc__s">' + imgTag(u, p.title) + '</div>'; });
    var v = ytId(p.video);
    if (v) s.push('<div class="mc__s mc__v" data-yt="' + v + '"><img src="https://img.youtube.com/vi/' + v + '/hqdefault.jpg" alt="Video: ' + esc(p.title) + '" loading="lazy"><button type="button" class="mc__play" aria-label="Play video"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>');
    if (!s.length) return '';
    var multi = s.length > 1;
    return '<div class="mc" data-n="' + s.length + '"><div class="mc__t">' + s.join('') + '</div>' +
      (multi ? '<button type="button" class="mc__b mc__b--p" aria-label="Previous image">‹</button><button type="button" class="mc__b mc__b--n" aria-label="Next image">›</button><div class="mc__d">' + s.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div><span class="mc__c">1/' + s.length + '</span>' : '') + '</div>';
  }
  function initMedia(root) {
    $$('.mc', root).forEach(function (m) {
      if (m._i) return; m._i = 1;
      var n = +m.getAttribute('data-n'), i = 0, t = $('.mc__t', m), sx = null;
      function go(k) { i = (k + n) % n; t.style.transform = 'translateX(' + (-i * 100) + '%)'; $$('.mc__d i', m).forEach(function (d, j) { d.classList.toggle('on', j === i); }); var c = $('.mc__c', m); if (c) c.textContent = (i + 1) + '/' + n; }
      var pb = $('.mc__b--p', m), nb = $('.mc__b--n', m);
      if (pb) pb.addEventListener('click', function (e) { e.stopPropagation(); go(i - 1); });
      if (nb) nb.addEventListener('click', function (e) { e.stopPropagation(); go(i + 1); });
      m.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      m.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40 && n > 1) go(i + (dx < 0 ? 1 : -1)); sx = null; });
      $$('.mc__v', m).forEach(function (v) {
        v.addEventListener('click', function () { var id = v.getAttribute('data-yt'); v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'; }, { once: true });
      });
    });
  }

  /* ---------------- feed ---------------- */
  var state = { cat: 'All', q: '', view: store.get('mega-view', 'grid'), n: 9 }, shown = [];
  function matches(p) {
    if (state.cat !== 'All' && p.cat !== state.cat) return false;
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    return (p.title + ' ' + p.body + ' ' + p.cat).toLowerCase().indexOf(q) > -1;
  }
  function coverOf(p) { if (p.images[0]) return p.images[0]; var v = ytId(p.video); return v ? 'https://img.youtube.com/vi/' + v + '/hqdefault.jpg' : ''; }
  function tileHtml(p) {
    var c = coverOf(p), multi = p.images.length + (ytId(p.video) ? 1 : 0) > 1;
    var badges = (p.pinned ? '<i title="Pinned">📌</i>' : '') + (ytId(p.video) ? '<i title="Video">▶</i>' : '') + (multi ? '<i title="Multiple images">❐</i>' : '');
    return '<button type="button" class="pt" data-id="' + esc(p.id) + '" aria-label="Open post: ' + esc(p.title) + '">' +
      (c ? imgTag(c, '') : '<span class="pt__txt">' + esc(p.title) + '</span>') + '<span class="pt__b">' + badges + '</span>' +
      '<span class="pt__ov"><b>' + esc(p.title) + '</b><small>' + esc(p.cat) + ' · ' + fmtDate(p.date) + '</small></span></button>';
  }
  function cardHtml(p) {
    var media = mediaHtml(p);
    return '<article class="fc" data-id="' + esc(p.id) + '"><header class="fc__h"><img src="' + LOGO + '" alt="" onerror="this.onerror=null;this.src=\'' + ((window.MEGA_REMOTE || {})['logo.png'] || '') + '\'"><div><b>Mega Engineering</b><small>' + esc(p.cat) + ' · ' + fmtDate(p.date) + '</small></div>' + (p.sample ? '<span class="chip-s">Sample</span>' : '') + '</header>' +
      (media ? '<div class="fc__m">' + media + '</div>' : '') + actsHtml(p) +
      '<div class="fc__b"><b>' + esc(p.title) + '</b><p>' + esc(plain(p.body, 150)) + '</p><button type="button" class="fc__more" data-id="' + esc(p.id) + '">Read full post</button></div></article>';
  }
  function storiesHtml() {
    var used = {}; pub().forEach(function (p) { used[p.cat] = 1; });
    var cats = ['All'].concat(CATS.filter(function (c) { return used[c]; })).concat(Object.keys(used).filter(function (c) { return CATS.indexOf(c) < 0; }));
    return cats.map(function (c) { return '<button type="button" class="story' + (c === state.cat ? ' on' : '') + '" role="tab" aria-selected="' + (c === state.cat) + '" data-c="' + esc(c) + '"><span class="story__r"><span class="story__i">' + esc(c === 'All' ? '★' : c.charAt(0)) + '</span></span><em>' + esc(c) + '</em></button>'; }).join('');
  }
  function render() {
    var feed = $('#feed'), st = $('#stories'); if (!feed) return;
    st.innerHTML = storiesHtml();
    shown = pub().filter(matches);
    var part = shown.slice(0, state.n);
    feed.className = 'feed feed--' + state.view;
    feed.innerHTML = part.length ? part.map(state.view === 'grid' ? tileHtml : cardHtml).join('') : '<div class="feed__empty"><b>No posts found</b><p>Try another category or search.</p></div>';
    initMedia(feed);
    var more = $('#bmore'); if (more) more.hidden = shown.length <= state.n;
    $$('.vt__b').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === state.view); });
    var bar = $('#adminbar'); if (bar) bar.hidden = !A.token;
    var fab = $('#adfab'); if (!fab) { fab = document.createElement('button'); fab.id = 'adfab'; fab.type = 'button'; fab.className = 'adfab'; fab.setAttribute('aria-label', 'New post'); fab.innerHTML = '<b>+</b><span>New post</span>'; fab.addEventListener('click', function () { openAdmin(); }); document.body.appendChild(fab); }
    fab.hidden = !A.token;
  }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.story'); if (s) { state.cat = s.getAttribute('data-c'); state.n = 9; render(); return; }
    var t = e.target.closest('.pt, .fc__more'); if (t) { openPost(t.getAttribute('data-id')); return; }
    var v = e.target.closest('.vt__b'); if (v) { state.view = v.getAttribute('data-v'); store.set('mega-view', state.view); render(); return; }
    if (e.target.closest('#bmore')) { state.n += 9; render(); }
  });
  var bq = $('#bq'); if (bq) bq.addEventListener('input', function () { state.q = bq.value.trim(); state.n = 9; render(); });

  /* ---------------- viewer ---------------- */
  var cur = null;
  function viewerHtml(p) {
    var media = mediaHtml(p);
    return (media ? '<div class="pv__media">' + media + '</div>' : '') +
      '<div class="pv__side"><header class="fc__h"><img src="' + LOGO + '" alt="" onerror="this.onerror=null;this.src=\'' + ((window.MEGA_REMOTE || {})['logo.png'] || '') + '\'"><div><b>Mega Engineering</b><small>' + esc(p.cat) + ' · ' + fmtDate(p.date) + '</small></div>' + (p.sample ? '<span class="chip-s">Sample</span>' : '') + '</header>' +
      '<div class="pv__body"><h3>' + esc(p.title) + '</h3><div class="md">' + md(p.body) + '</div></div>' + actsHtml(p) +
      '<div class="pv__foot"><a href="https://wa.me/?text=' + encodeURIComponent(p.title + ' ' + postUrl(p.id)) + '" target="_blank" rel="noopener">Share on WhatsApp</a><button type="button" class="pv__copy" data-id="' + esc(p.id) + '">Copy link</button></div></div>';
  }
  function openPost(id, silent) {
    var list = pub(), p = list.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    cur = id;
    var box = $('#pvbox'); box.className = 'pv__box' + (mediaHtml(p) ? '' : ' pv__box--text'); box.innerHTML = viewerHtml(p); initMedia(box);
    var v = $('#pv'); v.hidden = false; document.body.style.overflow = 'hidden'; $('#pvx').focus();
    if (!silent) try { history.replaceState(null, '', location.pathname + location.search + '#post/' + id); } catch (e) {}
    document.title = p.title + ' | Mega Engineering';
  }
  function closeViewer(keepHash) {
    var v = $('#pv'); if (!v || v.hidden) return; v.hidden = true; document.body.style.overflow = ''; cur = null;
    document.title = 'Mega Engineering | Ethanol Plant EPC Company in India';
    if (!keepHash) try { history.replaceState(null, '', location.pathname + location.search + '#blog'); } catch (e) {}
    $$('#pvbox iframe').forEach(function (f) { f.remove(); });
  }
  function step(d) { var l = shown.length ? shown : pub(), i = l.map(function (x) { return x.id; }).indexOf(cur); if (i < 0) return; openPost(l[(i + d + l.length) % l.length].id); }
  var pvx = $('#pvx'); if (pvx) {
    pvx.addEventListener('click', function () { closeViewer(); });
    $('#pvp').addEventListener('click', function () { step(-1); });
    $('#pvn').addEventListener('click', function () { step(1); });
    $('#pv').addEventListener('click', function (e) { if (e.target.id === 'pv') closeViewer(); });
    $('#pvbox').addEventListener('click', function (e) { var c = e.target.closest('.pv__copy'); if (c) { var p = posts.filter(function (x) { return x.id === c.getAttribute('data-id'); })[0]; if (p) share(p); } });
  }
  document.addEventListener('keydown', function (e) {
    var v = $('#pv'); if (!v || v.hidden) return;
    if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  });
  function routeFromHash() {
    var h = location.hash || '';
    if (h.indexOf('#post/') === 0) openPost(decodeURIComponent(h.slice(6)), true);
    else if (h === '#admin') openAdmin();
  }
  window.addEventListener('hashchange', routeFromHash);

  /* =====================================================================
     ADMIN  (hidden: open with #admin, Ctrl+Shift+A, or click © five times)
     Publishes by committing posts.json and images to the GitHub repo.
     ===================================================================== */
  var A = { token: '', cfg: { owner: CFG.owner, repo: CFG.repo, branch: CFG.branch }, work: [], dirty: {}, deleted: {}, E: null, built: false };
  (function loadSaved() { var s = store.get('mega-adm', null, true) || store.get('mega-adm', null, false); if (s && s.token) { A.token = s.token; A.cfg = { owner: s.owner || CFG.owner, repo: s.repo || CFG.repo, branch: s.branch || CFG.branch }; } })();

  function gh(method, path, body) {
    var c = A.cfg;
    return fetch('https://api.github.com/repos/' + c.owner + '/' + c.repo + path, {
      method: method, headers: { 'Authorization': 'Bearer ' + A.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.message || ('HTTP ' + r.status)); er.status = r.status; throw er; } return j; }); });
  }
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function unb64(s) { return decodeURIComponent(escape(atob(String(s).replace(/\s/g, '')))); }
  function getRemote() {
    return gh('GET', '/contents/posts.json?ref=' + encodeURIComponent(A.cfg.branch) + '&t=' + Date.now()).then(function (j) { return { sha: j.sha, list: JSON.parse(unb64(j.content)) }; })
      .catch(function (e) { if (e.status === 404) return { sha: null, list: null }; throw e; });
  }
  function fileToJpeg(file, max) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read image')); }; img.src = url;
    });
  }
  function setSt(m, bad) { var s = $('#admst'); if (s) { s.textContent = m || ''; s.className = 'adm__st' + (bad ? ' bad' : ''); } }
  function dirtyCount() { return Object.keys(A.dirty).length + Object.keys(A.deleted).length; }

  function buildAdmin() {
    var catOpts = CATS.concat(BIZN).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    $('#adm').innerHTML =
      '<div class="adm__top"><b>Mega Admin</b><div class="adm__tabs" role="tablist"><button data-t="posts" role="tab">Posts</button><button data-t="edit" role="tab">New post</button><button data-t="conn" role="tab">Connection</button><button data-t="help" role="tab">Help</button></div><span class="adm__st" id="admst"></span><button class="adm__x" id="admx" aria-label="Close admin">×</button></div>' +
      '<div class="adm__body">' +
      '<section data-p="conn"><h3>Connect to GitHub</h3><p class="adm__note">Posts are saved by committing <code>posts.json</code> and images to your repo, so everyone sees them. Use a <b>fine-grained token</b> limited to this one repo with <b>Contents: Read and write</b>. The token stays in this browser only.</p>' +
      '<div class="afg"><label>Owner<input id="aco" value="' + esc(A.cfg.owner) + '"></label><label>Repository<input id="acr" value="' + esc(A.cfg.repo) + '"></label><label>Branch<input id="acb" value="' + esc(A.cfg.branch) + '"></label><label class="full">Token<input id="act" type="password" autocomplete="off" placeholder="github_pat_…" value="' + esc(A.token) + '"></label></div>' +
      '<label class="achk"><input type="checkbox" id="acm" checked> Remember on this device</label><div class="arow"><button class="btn btn--accent" id="acgo" type="button">Connect</button><button class="btn btn--ghost-d" id="acout" type="button">Disconnect</button></div></section>' +
      '<section data-p="posts"><div class="arow"><button class="btn btn--accent" id="apub" type="button">Publish changes</button><button class="btn btn--ghost-d" id="anew" type="button">+ New post</button><button class="btn btn--ghost-d" id="arel" type="button">Reload from GitHub</button><button class="btn btn--ghost-d" id="adl" type="button">Download posts.json</button><label class="btn btn--ghost-d afile">Import posts.json<input type="file" id="aimp" accept="application/json" hidden></label></div><div id="alist" class="alist"></div></section>' +
      '<section data-p="edit"><div class="aed"><form id="aform" class="aform" novalidate><h3 id="aet">New post</h3>' +
      '<label>Title<input id="aft" maxlength="140" required></label>' +
      '<div class="afg"><label>Category<select id="afc">' + catOpts + '</select></label><label>Date &amp; time<input id="afd" type="datetime-local"></label></div>' +
      '<div class="atool" role="toolbar" aria-label="Formatting"><button type="button" data-m="**">B</button><button type="button" data-m="*"><i>I</i></button><button type="button" data-m="## ">H</button><button type="button" data-m="- ">• List</button><button type="button" data-m="link">Link</button><button type="button" data-m="#">#Tag</button></div>' +
      '<label>Caption / article<textarea id="afb" rows="9" placeholder="Write your post. Supports **bold**, *italic*, ## headings, - lists, [links](https://…) and #hashtags"></textarea></label>' +
      '<div class="adrop" id="adrop"><b>Images</b><span>Drop images here or</span><label class="btn btn--sm btn--ghost-d">Choose files<input type="file" id="afi" accept="image/*" multiple hidden></label><small>Resized automatically · up to 10</small><div id="athumbs" class="athumbs"></div></div>' +
      '<label>YouTube link (optional)<input id="afv" placeholder="https://www.youtube.com/watch?v=…"></label>' +
      '<div class="achks"><label class="achk"><input type="checkbox" id="afp"> Pin to top</label><label class="achk"><input type="checkbox" id="afdr"> Draft (hidden from visitors)</label></div>' +
      '<div class="arow"><button class="btn btn--accent" id="afsave" type="button">Save &amp; publish</button><button class="btn btn--ghost-d" id="afadd" type="button">Save to list only</button><button class="btn btn--ghost-d" id="afcancel" type="button">Cancel</button></div></form>' +
      '<div class="aprev"><b>Live preview</b><div id="aprev"></div></div></div></section>' +
      '<section data-p="help"><h3>How it works</h3><ol class="ahelp"><li><b>Create a token:</b> GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Select only the <code>' + esc(CFG.repo) + '</code> repo, permission <b>Contents: Read and write</b>.</li><li><b>Connect</b> here, paste the token and press Connect.</li><li><b>New post:</b> write, add images, press <b>Save &amp; publish</b>. It is committed to GitHub and goes live in about a minute.</li><li><b>Edit / delete / pin</b> from the Posts tab, then press <b>Publish changes</b>.</li><li>No token? Use <b>Save to list only</b>, then <b>Download posts.json</b> and upload that file to the repo root.</li></ol><p class="adm__note">Drafts are hidden from the page but still sit inside <code>posts.json</code> in your public repo, so do not put secrets in them. Likes and saves are remembered per visitor device only.</p></section></div>';
    A.built = true; wireAdmin();
  }
  function showTab(t) {
    $$('#adm .adm__tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    $$('#adm [data-p]').forEach(function (s) { s.hidden = s.getAttribute('data-p') !== t; });
    if (t === 'posts') renderList();
    if (t === 'edit' && !A.E) startEdit(null);
  }
  function openAdmin(tab) {
    if (!A.built) buildAdmin();
    $('#adm').hidden = false; document.body.style.overflow = 'hidden';
    if (!A.work.length) A.work = posts.map(function (p) { return JSON.parse(JSON.stringify(p)); });
    if (!tab && A.token) { startEdit(null); } else showTab(tab || 'conn');
    if (A.token && !A.loaded) loadFromGitHub(true);
  }
  function closeAdmin() { $('#adm').hidden = true; document.body.style.overflow = ''; if (location.hash === '#admin') try { history.replaceState(null, '', location.pathname + location.search + '#blog'); } catch (e) {} }
  function loadFromGitHub(quiet) {
    setSt('Loading…');
    return getRemote().then(function (r) {
      A.loaded = true;
      if (r.list) { A.work = r.list.map(norm); setPosts(r.list); render(); A.dirty = {}; A.deleted = {}; }
      setSt(quiet ? '' : 'Loaded ' + A.work.length + ' posts'); renderList();
    }).catch(function (e) { setSt(e.status === 401 ? 'Token rejected. Reconnect.' : 'Could not load: ' + e.message, true); });
  }
  function renderList() {
    var el = $('#alist'); if (!el) return;
    var list = A.work.slice().sort(function (a, b) { return (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date)); });
    $('#apub').textContent = 'Publish changes' + (dirtyCount() ? ' (' + dirtyCount() + ')' : '');
    el.innerHTML = list.length ? list.map(function (p) {
      var c = coverOf(p);
      return '<div class="arowi" data-id="' + esc(p.id) + '"><div class="arowi__t">' + (c ? imgTag(c, '') : '<span>Aa</span>') + '</div><div class="arowi__m"><b>' + esc(p.title) + '</b><small>' + esc(p.cat) + ' · ' + fmtDate(p.date) + (p.pinned ? ' · 📌 pinned' : '') + (p.draft ? ' · DRAFT' : '') + (A.dirty[p.id] ? ' · unpublished changes' : '') + '</small></div>' +
        '<div class="arowi__b"><button type="button" data-x="edit">Edit</button><button type="button" data-x="pin">' + (p.pinned ? 'Unpin' : 'Pin') + '</button><button type="button" data-x="del" class="danger">Delete</button></div></div>';
    }).join('') : '<p class="adm__note">No posts yet. Press “+ New post”.</p>';
  }
  function readForm() {
    var E = A.E, body = $('#afb').value, d = $('#afd').value;
    return norm({ id: E.id, title: $('#aft').value.trim(), cat: $('#afc').value, body: body, images: E.images.slice(), video: $('#afv').value.trim(), date: d ? new Date(d).toISOString() : new Date().toISOString(), pinned: $('#afp').checked, draft: $('#afdr').checked, sample: false });
  }
  function toLocalInput(iso) { var d = new Date(iso), pad = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function startEdit(p) {
    A.E = p ? { id: p.id, images: p.images.slice(), isNew: false } : { id: slugify('post') + '-' + Date.now().toString(36), images: [], isNew: true };
    $('#aet').textContent = p ? 'Edit post' : 'New post';
    $('#aft').value = p ? p.title : ''; $('#afc').value = p ? p.cat : 'News'; $('#afd').value = toLocalInput(p ? p.date : new Date().toISOString());
    $('#afb').value = p ? p.body : ''; $('#afv').value = p ? p.video : ''; $('#afp').checked = !!(p && p.pinned); $('#afdr').checked = !!(p && p.draft);
    renderThumbs(); preview(); showTab('edit');
  }
  function renderThumbs() {
    $('#athumbs').innerHTML = A.E.images.map(function (u, i) { return '<div class="ath" data-i="' + i + '">' + imgTag(u, '') + '<span>' + (i === 0 ? 'Cover' : i + 1) + '</span><button type="button" data-x="l" aria-label="Move left">‹</button><button type="button" data-x="r" aria-label="Move right">›</button><button type="button" data-x="d" aria-label="Remove">×</button></div>'; }).join('');
  }
  function preview() { var p = readForm(); var el = $('#aprev'); if (el) { el.innerHTML = cardHtml(p); initMedia(el); } }
  async function addFiles(files) {
    var room = 10 - A.E.images.length; var list = Array.prototype.slice.call(files).filter(function (f) { return /^image\//.test(f.type); }).slice(0, room);
    for (var i = 0; i < list.length; i++) { try { A.E.images.push(await fileToJpeg(list[i], 1600)); } catch (e) { toast('Could not read ' + list[i].name); } }
    renderThumbs(); preview();
  }
  function saveToList(publishAfter) {
    var p = readForm();
    if (!p.title) { var fl = (p.body || '').split('\n').filter(function (x) { return x.trim(); })[0] || ''; fl = fl.replace(/[#*_>\-\[\]]/g, '').trim(); p.title = fl.length > 70 ? fl.slice(0, 67) + '…' : fl; }
    if (!p.title && p.images.length) p.title = 'New photo post';
    if (!p.title) { toast('Write something or add a photo'); $('#afb').focus(); return; }
    if (!p.body.trim() && !p.images.length && !ytId(p.video)) { toast('Add some text, an image or a video'); return; }
    var i = A.work.map(function (x) { return x.id; }).indexOf(p.id);
    if (i > -1) A.work[i] = p; else A.work.push(p);
    A.dirty[p.id] = true; delete A.deleted[p.id]; A.E = null;
    renderList(); showTab('posts'); setSt('Saved to list. Not published yet.');
    if (publishAfter) publish();
  }
  async function publish() {
    if (!A.token) { toast('Connect to GitHub first'); showTab('conn'); return; }
    if (!dirtyCount()) { toast('Nothing to publish'); return; }
    try {
      var ids = Object.keys(A.dirty);
      for (var a = 0; a < ids.length; a++) {
        var p = A.work.filter(function (x) { return x.id === ids[a]; })[0]; if (!p) continue;
        for (var k = 0; k < p.images.length; k++) {
          if (/^data:image\//.test(p.images[k])) {
            setSt('Uploading image ' + (k + 1) + ' of ' + p.images.length + '…');
            var path = 'assets/posts/' + p.id + '-' + (k + 1) + '-' + Date.now().toString(36) + '.jpg';
            await gh('PUT', '/contents/' + path, { message: 'Add post image', content: p.images[k].split(',')[1], branch: A.cfg.branch });
            p.images[k] = path;
          }
        }
      }
      setSt('Saving posts.json…');
      var remote = await getRemote();
      var base = (remote.list || []).map(norm).filter(function (x) { return !A.deleted[x.id] && !A.dirty[x.id]; });
      var merged = base.concat(A.work.filter(function (x) { return A.dirty[x.id]; }));
      if (!remote.list) merged = A.work.filter(function (x) { return !A.deleted[x.id]; });
      var body = { message: 'Update posts', content: b64(JSON.stringify(merged.map(function (x) { var o = JSON.parse(JSON.stringify(x)); delete o.sample; return o; }), null, 2) + '\n'), branch: A.cfg.branch };
      if (remote.sha) body.sha = remote.sha;
      await gh('PUT', '/contents/posts.json', body);
      A.work = merged.map(norm); setPosts(merged); A.dirty = {}; A.deleted = {}; render(); renderList();
      setSt('Published. Live in about a minute.'); toast('Published to GitHub ✔');
      if (window.MegaFX) window.MegaFX.confetti();
      setTimeout(function () { closeAdmin(); var b = $('#blog'); if (b) b.scrollIntoView({ behavior: 'smooth' }); }, 1400);
    } catch (e) { setSt('Publish failed: ' + e.message + (e.status === 401 || e.status === 403 ? ' (check token permissions)' : ''), true); toast('Publish failed'); }
  }
  function wireAdmin() {
    var adm = $('#adm');
    $('#admx').addEventListener('click', closeAdmin);
    adm.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAdmin(); });
    $$('.adm__tabs button', adm).forEach(function (b) { b.addEventListener('click', function () { var t = b.getAttribute('data-t'); if (t === 'edit') startEdit(null); else showTab(t); }); });
    $('#acgo').addEventListener('click', function () {
      A.cfg = { owner: $('#aco').value.trim(), repo: $('#acr').value.trim(), branch: $('#acb').value.trim() || 'main' }; A.token = $('#act').value.trim();
      if (!A.token) { setSt('Paste your token', true); return; }
      setSt('Checking…');
      gh('GET', '').then(function (r) {
        if (r.permissions && !r.permissions.push) throw new Error('This token cannot write to the repo');
        var rec = { token: A.token, owner: A.cfg.owner, repo: A.cfg.repo, branch: A.cfg.branch };
        store.del('mega-adm'); store.set('mega-adm', rec, !$('#acm').checked);
        setSt('Connected to ' + r.full_name); toast('Connected'); A.loaded = false; var bar = $('#adminbar'); if (bar) bar.hidden = false; var fb = $('#adfab'); if (fb) fb.hidden = false; showTab('posts'); loadFromGitHub(true);
      }).catch(function (e) { A.token = ''; setSt(e.status === 401 ? 'Token rejected' : (e.status === 404 ? 'Repo not found or no access' : e.message), true); });
    });
    $('#acout').addEventListener('click', function () { store.del('mega-adm'); A.token = ''; var fb2 = $('#adfab'); if (fb2) fb2.hidden = true; A.loaded = false; $('#act').value = ''; var bar = $('#adminbar'); if (bar) bar.hidden = true; setSt('Disconnected'); });
    $('#apub').addEventListener('click', publish);
    $('#anew').addEventListener('click', function () { startEdit(null); });
    $('#arel').addEventListener('click', function () { if (!A.token) { toast('Connect first'); return; } A.loaded = false; loadFromGitHub(); });
    $('#adl').addEventListener('click', function () { var blob = new Blob([JSON.stringify(A.work.map(function (x) { var o = JSON.parse(JSON.stringify(x)); delete o.sample; return o; }), null, 2) + '\n'], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'posts.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); });
    $('#aimp').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var a = JSON.parse(r.result); if (!Array.isArray(a)) throw 0; A.work = a.map(norm); A.work.forEach(function (p) { A.dirty[p.id] = true; }); renderList(); toast('Imported ' + a.length + ' posts'); } catch (x) { toast('That file is not a valid posts.json'); } };
      r.readAsText(f); e.target.value = '';
    });
    $('#alist').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var row = b.closest('.arowi'), id = row.getAttribute('data-id'), p = A.work.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      var x = b.getAttribute('data-x');
      if (x === 'edit') startEdit(p);
      else if (x === 'pin') { p.pinned = !p.pinned; A.dirty[id] = true; renderList(); }
      else if (x === 'del' && confirm('Delete “' + p.title + '”? Press Publish changes afterwards to apply.')) { A.work = A.work.filter(function (y) { return y.id !== id; }); A.deleted[id] = true; delete A.dirty[id]; renderList(); }
    });
    var form = $('#aform');
    form.addEventListener('input', function () { clearTimeout(form._t); form._t = setTimeout(preview, 150); });
    $('#afi').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
    var drop = $('#adrop');
    ['dragover', 'dragenter'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('over'); if (n === 'drop' && e.dataTransfer) addFiles(e.dataTransfer.files); }); });
    $('#athumbs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var i = +b.closest('.ath').getAttribute('data-i'), im = A.E.images, x = b.getAttribute('data-x');
      if (x === 'd') im.splice(i, 1); else if (x === 'l' && i > 0) { var t = im[i]; im[i] = im[i - 1]; im[i - 1] = t; } else if (x === 'r' && i < im.length - 1) { var t2 = im[i]; im[i] = im[i + 1]; im[i + 1] = t2; }
      renderThumbs(); preview();
    });
    $$('.atool button', adm).forEach(function (b) {
      b.addEventListener('click', function () {
        var ta = $('#afb'), s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, sel = v.slice(s, en), m = b.getAttribute('data-m'), ins;
        if (m === '**' || m === '*') ins = m + (sel || 'text') + m; else if (m === 'link') ins = '[' + (sel || 'link text') + '](https://)'; else if (m === '#') ins = ' #Tag'; else ins = m + (sel || 'text');
        ta.value = v.slice(0, s) + ins + v.slice(en); ta.focus(); preview();
      });
    });
    $('#afsave').addEventListener('click', function () { saveToList(true); });
    $('#afadd').addEventListener('click', function () { saveToList(false); });
    $('#afcancel').addEventListener('click', function () { A.E = null; showTab('posts'); });
  }

  /* hidden entry points */
  var clicks = 0, ct;
  var copy = $('#copy'); if (copy) copy.addEventListener('click', function () { clicks++; clearTimeout(ct); ct = setTimeout(function () { clicks = 0; }, 2500); if (clicks >= 5) { clicks = 0; openAdmin(); } });
  document.addEventListener('keydown', function (e) { if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); openAdmin(); } });
  var al = $('#adminlink'); if (al) al.addEventListener('click', function () { openAdmin(); });
  var an = $('#adminnew'), ao = $('#adminopen');
  if (an) an.addEventListener('click', function () { openAdmin('edit'); });
  if (ao) ao.addEventListener('click', function () { openAdmin('posts'); });

  /* public API */
  window.MegaBlog = {
    all: pub, open: openPost, openAdmin: openAdmin,
    addLocal: function (p) { p = norm(p); posts = posts.filter(function (x) { return x.id !== p.id; }).concat(p); state.n = Math.max(state.n, 9); render(); },
    postsFor: function (name) { var n = String(name).toLowerCase(); return pub().filter(function (p) { return p.cat.toLowerCase() === n || (p.title + ' ' + p.body).toLowerCase().indexOf(n) > -1; }); },
    cardMini: function (p) { return tileHtml(p); }
  };

  render();
  loadRemotePosts();
})();
