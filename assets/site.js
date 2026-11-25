/* Digital Peak Productions — site interactions */
(function () {
  'use strict';
  var CFG = window.DP || {};
  var FORM_TO = CFG.formTo || 'info@digitalpeakproductions.com';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- tracking: one helper fans out to Meta Pixel + GA4 (+ Google Ads via GA4 import) ---- */
  function track(meta, ga, params, custom) {
    params = params || {};
    try { if (window.fbq) fbq(custom ? 'trackCustom' : 'track', meta, params); } catch (e) {}
    try { if (window.gtag) gtag('event', ga, params); } catch (e) {}
  }
  window.dpTrack = track;
  var PAGE = document.body.dataset.page || location.pathname;
  if (/\/(project|blog)\//.test(location.pathname) || /hospitality|transport|watersports|realestate|weddings|website/.test(location.pathname))
    track('ViewContent', 'view_item', { content_name: document.title.replace(/\s*\|.*$/, ''), content_category: PAGE });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button'); if (!a) return;
    var href = a.getAttribute('href') || '', label = (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 60);
    if (/^tel:/.test(href)) track('Contact', 'contact', { method: 'phone', label: label });
    else if (/^mailto:/.test(href)) track('Contact', 'contact', { method: 'email', label: label });
    else if (/^sms:/.test(href)) track('Contact', 'contact', { method: 'text', label: label });
    else if (/#contact$|#book$/.test(href) || a.classList.contains('shutter')) track('BookItClick', 'cta_click', { label: label || 'Book it', page: PAGE }, true);
    else if (a.hasAttribute('data-trust')) track('EasterEgg', 'easter_egg', { name: 'trust-wall' }, true);
    else if (a.classList.contains('gradebtn')) track('EasterEgg', 'easter_egg', { name: 'grade-it' }, true);
    else if (/^https?:/.test(href) && href.indexOf(location.host) < 0) track('OutboundClick', 'click', { link_url: href, label: label }, true);
  }, true);

  /* ---- nav ---- */
  var nav = $('.nav');
  if (nav) window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); mnav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  if (mnav) $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); document.body.style.overflow = ''; }); });
  $$('.drop > button').forEach(function (b) {
    b.addEventListener('click', function () { var d = b.parentNode, o = !d.classList.contains('open'); d.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
  });
  document.addEventListener('click', function (e) { $$('.drop.open').forEach(function (d) { if (!d.contains(e.target)) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } }); });

  /* ---- media: swap placeholders for real files when they exist ---- */
  var conn = navigator.connection || {};
  var lite = reduce || conn.saveData || /(^|-)2g/.test(conn.effectiveType || '');
  function wake(el) {
    if (el.dataset.bg && !el.dataset.bgOn) { el.style.backgroundImage = 'url("' + el.dataset.bg + '")'; el.dataset.bgOn = '1'; }
    if (!lite && el.dataset.vbg && !el.dataset.vbgOn) {
      el.dataset.vbgOn = '1';
      var f = document.createElement('iframe');
      f.className = 'vbg'; f.allow = 'autoplay; fullscreen'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.title = '';
      f.src = 'https://player.vimeo.com/video/' + el.dataset.vbg + '?background=1&autoplay=1&loop=1&muted=1&dnt=1';
      var fit = function () { var r = el.getBoundingClientRect(), w = Math.max(r.width, r.height * 16 / 9); f.style.width = w + 'px'; f.style.height = (w * 9 / 16) + 'px'; };
      fit(); addEventListener('resize', fit); el.insertBefore(f, el.firstChild);
      f.addEventListener('load', function () { setTimeout(function () { el.classList.add('playing'); }, 900); });
    }
    if (lite || !el.dataset.video) return;
    var v = el.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.addEventListener('loadeddata', function () { el.classList.add('has-media', 'playing'); }, { once: true });
      v.addEventListener('error', function () { v.remove(); }, true);
      v.src = (innerWidth < 760 || /(^|-)3g/.test(conn.effectiveType || '')) ? el.dataset.video.replace(/\.mp4$/, '-m.mp4') : el.dataset.video; el.insertBefore(v, el.firstChild);
    }
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function sleep(el) { var v = el.querySelector('video'); if (v && !v.paused) v.pause(); }
  var lazy = $$('[data-video],[data-bg]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? wake(e.target) : sleep(e.target); }); }, { rootMargin: '250px 0px' });
    lazy.forEach(function (el) { io.observe(el); });
  } else lazy.forEach(wake);
  function photo(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    var i = new Image(); i.alt = el.dataset.alt || ''; i.decoding = 'async';
    i.onload = function () { el.insertBefore(i, el.firstChild); el.classList.add('has-media'); };
    i.src = el.dataset.img;
  }
  var phs = $$('.ph[data-img]');
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { photo(e.target); pio.unobserve(e.target); } }); }, { rootMargin: '400px 0px' });
    phs.forEach(function (el) { pio.observe(el); });
  } else phs.forEach(photo);

  /* ---- bursts / flash / toast ---- */
  var COLS = ['#02aab4', '#ff4800', '#ffffff', '#3d63d6', '#ffb347', '#5fe0a0'];
  function burst(x, y, n, spread) {
    if (reduce) return;
    n = n || 22; spread = spread || 120;
    var b = document.createElement('div'); b.className = 'burst'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < n; k++) {
      var i = document.createElement('i');
      i.style.setProperty('--a', (k * 360 / n + Math.random() * 12) + 'deg');
      i.style.setProperty('--d', (spread * (0.45 + Math.random() * 0.9)) + 'px');
      i.style.setProperty('--s', (4 + Math.random() * 9) + 'px');
      i.style.setProperty('--c', COLS[k % COLS.length]);
      b.appendChild(i);
    }
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 1000);
  }
  var flash = document.createElement('div'); flash.className = 'flash'; flash.setAttribute('aria-hidden', 'true'); document.body.appendChild(flash);
  function pop() { if (reduce) return; flash.classList.add('on'); setTimeout(function () { flash.classList.remove('on'); }, 70); }
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('on'); }, 3400); }

  /* ---- shutter: flash, burst, then the contact form ---- */
  $$('.shutter').forEach(function (s) {
    s.addEventListener('click', function (e) {
      var r = s.getBoundingClientRect(); pop(); burst(r.left + r.width / 2, r.top + r.height / 2, 26, 150);
      var target = document.getElementById((s.getAttribute('href') || '#contact').slice(1));
      if (target) { e.preventDefault(); setTimeout(function () { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); var f = $('input:not(.hp)', target); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 700); }, 220); }
    });
  });
  $$('.proof .pitem').forEach(function (p) {
    var last = 0; p.addEventListener('mouseenter', function (e) { var n = Date.now(); if (n - last < 900) return; last = n; burst(e.clientX, e.clientY, 14, 80); });
  });

  /* ---- hero: cursor spotlight + side curtains ---- */
  $$('.hero').forEach(function (h) {
    setTimeout(function () { h.classList.add('open'); }, reduce ? 0 : 500);
    if (reduce) return;
    var raf = 0;
    h.addEventListener('pointermove', function (e) {
      var r = h.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { h.style.setProperty('--x', x + '%'); h.style.setProperty('--y', y + '%'); });
    });
  });

  /* ---- View the Proof: drag-to-scroll reel ---- */
  $$('.reel').forEach(function (reel) {
    var down = false, sx = 0, sl = 0, moved = 0;
    reel.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = reel.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 6) reel.classList.add('drag'); reel.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { reel.classList.remove('drag'); }, 0); });
    reel.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    $$('a,img', reel).forEach(function (a) { a.setAttribute('draggable', 'false'); });
    var nav = reel.parentNode.parentNode.querySelector('.reelnav');
    if (nav) $$('button', nav).forEach(function (b) { b.addEventListener('click', function () { var c = reel.querySelector('.cell'); var w = c ? c.getBoundingClientRect().width + 16 : 400; reel.scrollBy({ left: (b.dataset.dir === 'prev' ? -1 : 1) * w, behavior: 'smooth' }); }); });
  });

  /* ---- guarantee tape (tap to peel on touch) ---- */
  $$('.peel').forEach(function (p) {
    var sx = 0, sy = 0, dragging = false, dist = 0;
    function fly(dx, dy) {
      var len = Math.max(1, Math.hypot(dx, dy)); p.style.setProperty('--fx', (dx / len * 700) + 'px'); p.style.setProperty('--fy', (dy / len * 500 - 200) + 'px');
      p.style.transform = ''; p.classList.add('off');
      var r = p.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 24, 160);
    }
    p.addEventListener('pointerdown', function (e) { dragging = true; dist = 0; sx = e.clientX; sy = e.clientY; p.classList.add('dragging'); p.setPointerCapture(e.pointerId); });
    p.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - sx, dy = e.clientY - sy; dist = Math.hypot(dx, dy);
      p.style.transform = 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) rotate(' + (-4 + dx / 18) + 'deg)';
    });
    p.addEventListener('pointerup', function (e) {
      if (!dragging) return; dragging = false; p.classList.remove('dragging');
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) > 110) fly(dx, dy); else p.style.transform = '';
    });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fly(1, -1); } });
  });

  /* ---- generic Grade-it buttons (e.g. "Who we make it for") ---- */
  $$('.gradebtn[data-grade]').forEach(function (g) {
    var t = document.getElementById(g.dataset.grade); if (!t) return;
    g.addEventListener('click', function (e) {
      var flat = t.classList.toggle('flat'); g.setAttribute('aria-pressed', String(!flat)); $('span', g).textContent = flat ? 'Grade it' : 'Graded';
      if (!flat) { burst(e.clientX, e.clientY, 34, 220); say('Color, applied. That’s what we do to every frame.'); }
    });
  });

  /* ---- easter egg: who trusts us ---- */
  var trust = document.getElementById('trust');
  if (trust && trust.showModal) {
    $$('[data-trust]').forEach(function (b) { b.addEventListener('click', function (e) { trust.showModal(); burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 40, 260); }); });
    $$('.x,[data-close]', trust).forEach(function (b) { b.addEventListener('click', function () { trust.close(); }); });
    trust.addEventListener('click', function (e) { if (e.target === trust) trust.close(); });
  }

  /* ---- editing timeline: scrub + Grade-it easter egg ---- */
  $$('.tl').forEach(function (tl) {
    var lanes = $('.lanes', tl), steps = JSON.parse(tl.dataset.steps || '[]'), clips = $$('.lane.v1 .clip', tl);
    var big = $('.stepd .big', tl), wk = $('.stepd .wk', tl), h = $('.stepd h3', tl), p = $('.stepd p', tl), cur = -1;
    function set(pct) {
      pct = Math.max(0, Math.min(.995, pct)); tl.style.setProperty('--p', pct.toFixed(4));
      var i = Math.min(steps.length - 1, Math.floor(pct * steps.length)); if (i === cur) return; cur = i;
      clips.forEach(function (c, k) { c.classList.toggle('dim', k !== i); });
      var s = steps[i]; if (!s) return; big.textContent = s.n; wk.textContent = s.w; h.textContent = s.t; p.textContent = s.d;
    }
    set(.12);
    var bars = $$('.lane.audio i', tl), aud = $('.lane.audio', tl), mx = null, raf = 0, t0 = 0;
    var PAL = ['#ff4800', '#02aab4', '#3d63d6'];
    function peak(t) {
      raf = 0; if (mx === null) return;
      var r = aud.getBoundingClientRect(), live = false;
      bars.forEach(function (b, i) {
        var br = b.getBoundingClientRect(), dx = (br.left + br.width / 2 - mx) / 46;
        var k = Math.exp(-dx * dx);                                   /* taper: gaussian falloff from the cursor */
        if (k < .04) { if (b.style.transform) { b.style.transform = ''; b.style.background = ''; } return; }
        live = true;
        var wob = .72 + .28 * Math.sin(t / 95 + i * 1.7) * Math.sin(t / 61 + i * .9);  /* a little "playing" movement */
        b.style.transform = 'scaleY(' + (1 + k * 2.1 * wob).toFixed(3) + ')';
        b.style.background = k > .62 ? PAL[0] : k > .3 ? PAL[1] : PAL[2];
      });
      if (live && !reduce) raf = requestAnimationFrame(peak);
    }
    function aim(e) { mx = e.clientX; if (!raf) raf = requestAnimationFrame(peak); }
    if (lanes) {
      lanes.addEventListener('pointermove', aim);
      lanes.addEventListener('pointerleave', function () { mx = null; bars.forEach(function (b) { b.style.transform = ''; b.style.background = ''; }); });
    }
    if (lanes) {
      lanes.addEventListener('pointermove', function (e) { var r = lanes.getBoundingClientRect(); set((e.clientX - r.left - 64) / (r.width - 64)); });
      lanes.addEventListener('pointerdown', function (e) { var r = lanes.getBoundingClientRect(); set((e.clientX - r.left - 64) / (r.width - 64)); });
    }
    var g = $('.gradebtn', tl);
    if (g) g.addEventListener('click', function (e) {
      var flat = tl.classList.toggle('flat'); g.setAttribute('aria-pressed', String(!flat));
      $('span', g).textContent = flat ? 'Grade it' : 'Graded';
      if (!flat) { burst(e.clientX, e.clientY, 34, 200); setTimeout(function () { burst(e.clientX, e.clientY, 20, 110); }, 140); say('You found the grade. Every frame we deliver gets this treatment.'); }
    });
  });

  /* ---- contact form: 4 fields → FormSubmit (AJAX), mailto fallback ---- */
  $$('form.dp-form').forEach(function (f) {
    var goal = $('input[name=goal]', f), err = $('.err', f);
    $$('.chip', f).forEach(function (c) {
      c.addEventListener('click', function () { $$('.chip', f).forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); }); goal.value = c.dataset.v; err.textContent = ''; });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {}, bad = null;
      ['name', 'contact', 'property'].forEach(function (k) { var i = f.elements[k]; var v = (i.value || '').trim(); data[k] = v; i.setAttribute('aria-invalid', v ? 'false' : 'true'); if (!v && !bad) bad = i; });
      data.goal = goal.value;
      if (bad || !data.goal) { err.textContent = 'Please fill in all four so we can come back with something useful.'; if (bad) bad.focus(); return; }
      if (f.elements._honey && f.elements._honey.value) return;
      var btn = $('button[type=submit]', f); btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…';
      var page = document.title.replace(/\s*\|.*$/, '');
      var q = f.dataset.q || 'Details'; var payload = { 'Name': data.name, 'Email or phone': data.contact, 'Property / business & location': data.property }; payload[q] = data.goal; Object.assign(payload, { 'Page': page, '_subject': (f.dataset.subject ? f.dataset.subject + ': ' + data.name : 'New shoot-day request: ' + data.property), '_template': 'table', '_captcha': 'false' });
      function done() {
        var r = f.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 80, 36, 220); pop();
        f.hidden = true; var ok = f.parentNode.querySelector('.ok'); if (ok) { ok.hidden = false; ok.focus(); }
        if (f.dataset.subject) track('SubmitApplication', 'crew_application', { role: data.goal });
        else track('Lead', 'generate_lead', { content_name: page, vision: data.goal, currency: 'USD', value: 1 });
      }
      function fallback() {
        var body = 'Name: ' + data.name + '\nEmail or phone: ' + data.contact + '\nProperty / business: ' + data.property + '\n' + (f.dataset.q || 'Details') + ' ' + data.goal + '\nPage: ' + page;
        btn.disabled = false; btn.textContent = label;
        err.innerHTML = 'Our form couldn’t connect. <a href="mailto:' + FORM_TO + '?subject=' + encodeURIComponent('Shoot day request: ' + data.property) + '&body=' + encodeURIComponent(body) + '">Send it by email instead</a> and it lands in the same inbox.';
      }
      fetch('https://formsubmit.co/ajax/' + FORM_TO, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function (j) { if (j && (j.success === true || j.success === 'true')) done(); else fallback(); })
        .catch(fallback);
    });
  });

  /* ---- Vimeo click-to-play (keeps pages light until someone hits play) ---- */
  $$('.vplay[data-src]').forEach(function (b) {
    b.addEventListener('click', function () {
      track('ViewContent', 'video_start', { content_name: b.dataset.track || 'film', content_type: 'video' });
      var f = document.createElement('iframe'); f.src = b.dataset.src; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = b.getAttribute('aria-label') || 'Video';
      b.parentNode.appendChild(f); b.remove();
    });
  });

  /* ---- web builds: typed URL + real screenshots when they exist ---- */
  $$('[data-typer]').forEach(function (el) {
    var list = JSON.parse(el.dataset.typer || '[]'), i = 0; if (reduce || !list.length) return;
    function type(word, k) { el.textContent = word.slice(0, k); if (k < word.length) setTimeout(function () { type(word, k + 1); }, 70); else setTimeout(erase, 1800); }
    function erase() { var w = el.textContent; if (w.length) { el.textContent = w.slice(0, -1); setTimeout(erase, 30); } else { i = (i + 1) % list.length; type(list[i], 1); } }
    setTimeout(erase, 1400);
  });
  $$('[data-shot]').forEach(function (el) {
    var im = new Image(); im.onload = function () { el.style.cssText += ";background:url(\"" + el.dataset.shot + "\") top center/cover"; el.classList.add('shot'); }; im.src = el.dataset.shot;
  });

  /* ---- web builds: spray-paint cursor over dark sections ---- */
  var spray = document.getElementById('spray');
  if (spray && !reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var ctx = spray.getContext('2d'), dots = [], dpr = Math.min(2, devicePixelRatio || 1), run = 0, lx = null, ly = null;
    var COL = ['255,72,0', '2,170,180', '61,99,214'];
    function size() { spray.width = innerWidth * dpr; spray.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    var hue = 0;
    document.addEventListener('pointermove', function (e) {
      var t = e.target;
      if (t.closest && t.closest('.card, input, textarea, .chips, .bw .scr, body.light')) { lx = null; return; }
      var dx = lx === null ? 0 : e.clientX - lx, dy = ly === null ? 0 : e.clientY - ly, sp = Math.min(40, Math.hypot(dx, dy));
      lx = e.clientX; ly = e.clientY; hue = (hue + sp / 260) % 3;
      var col = COL[Math.floor(hue)], n = 6 + sp * .6;
      for (var k = 0; k < n; k++) {
        var a = Math.random() * 6.283, r = Math.pow(Math.random(), 1.8) * (10 + sp * .9);
        dots.push({ x: e.clientX + Math.cos(a) * r, y: e.clientY + Math.sin(a) * r, s: Math.random() * 1.9 + .5, life: 1, c: col, vy: Math.random() * .25 });
      }
      if (dots.length > 2600) dots.splice(0, dots.length - 2600);
      if (!run) run = requestAnimationFrame(draw);
    });
    function draw() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = dots.length - 1; i >= 0; i--) {
        var d = dots[i]; d.life -= .012 + (1 - d.life) * .01; d.y += d.vy; d.s *= .997;   /* dissolve: fades, drips a hair, shrinks */
        if (d.life <= 0) { dots.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(' + d.c + ',' + (d.life * .85).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, 6.283); ctx.fill();
      }
      run = dots.length ? requestAnimationFrame(draw) : 0;
    }
  }

  /* ---- film pop-up: watch a client film without leaving the site ---- */
  var box;
  function openFilm(src, label) {
    if (!box) {
      box = document.createElement('dialog'); box.className = 'filmbox';
      box.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><div class="fb-frame"></div>';
      document.body.appendChild(box);
      box.querySelector('.x').addEventListener('click', function () { box.close(); });
      box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
      box.addEventListener('close', function () { box.querySelector('.fb-frame').innerHTML = ''; });
    }
    var f = document.createElement('iframe'); f.src = src; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = label || 'Film';
    box.querySelector('.fb-frame').appendChild(f);
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
    track('ViewContent', 'video_start', { content_name: label || 'film', content_type: 'video', placement: 'popup' });
  }
  $$('[data-film]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      e.preventDefault(); openFilm(a.dataset.film, ($('h3', a) || a).textContent);
    });
  });

  /* ---- hero: line the shutter button up with the last line of the headline ---- */
  function alignShot() {
    $$('.hin').forEach(function (h) {
      var col = $('.shotcol', h), s = $('.shutter', h), h1 = $('.h1', h);
      if (!col || !s || !h1) return;
      col.style.translate = '';
      if (innerWidth < 900) return;
      var r = document.createRange(); r.selectNodeContents(h1);
      var lines = r.getClientRects(); if (!lines.length) return;
      var last = lines[lines.length - 1], sr = s.getBoundingClientRect();
      col.style.translate = '0 ' + Math.round((last.top + last.height / 2) - (sr.top + sr.height / 2)) + 'px';
    });
  }
  alignShot(); addEventListener('resize', alignShot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignShot);

  /* ---- footer year ---- */
  $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
