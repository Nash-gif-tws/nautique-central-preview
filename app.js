(function () {
  'use strict';
  var root = document.documentElement;
  var header = document.getElementById('header');
  var pre = document.getElementById('preloader');
  var gsapOK = !!(window.gsap && window.ScrollTrigger);
  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // Inside the Storyblok Visual Editor the preview runs in an iframe where scroll-trigger
  // reveals don't fire — so show all content statically (no blank/black preview).
  try { if (/[?&]_storyblok/.test(location.search)) reduced = true; } catch (e) {}

  var EASE = 'cubic-bezier(0.16,1,0.3,1)'; // expo-out — the premium settle

  /* ---------- always-on: cross-document view transitions ---------- */
  // Arriving via a view transition: the preloader curtain would cover the morph — skip it.
  var preSkip = false;
  window.addEventListener('pagereveal', function (e) {
    if (e.viewTransition) { preSkip = true; if (pre) pre.style.display = 'none'; }
  });
  // Clicking a range card names its image "boat-hero" so it morphs into the
  // model-page hero (which carries the same name in CSS). The current page's
  // hero gives the name up first — names must be unique per snapshot.
  document.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('a.mcard') : null;
    if (!card) return;
    document.querySelectorAll('.mcard__media img').forEach(function (i) { i.style.viewTransitionName = ''; });
    var img = card.querySelector('.mcard__media img');
    if (img) {
      img.style.viewTransitionName = 'boat-hero';
      var ownHero = document.querySelector('.mhero__media img');
      if (ownHero) ownHero.style.viewTransitionName = 'none';
    }
  });
  // bfcache restore: clear stale names so a second navigation can't double up
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    document.querySelectorAll('.mcard__media img').forEach(function (i) { i.style.viewTransitionName = ''; });
    var ownHero = document.querySelector('.mhero__media img');
    if (ownHero) ownHero.style.viewTransitionName = '';
  });

  /* ---------- always-on: button label roll (CSS does the motion, fine-pointer only) ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    for (var n = btn.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.textContent.trim()) {
        var label = n.textContent.trim();
        var wrap = document.createElement('span');
        wrap.className = 'btn__txt';
        var a = document.createElement('span'); a.textContent = label;
        var b = document.createElement('span'); b.textContent = label; b.setAttribute('aria-hidden', 'true');
        wrap.appendChild(a); wrap.appendChild(b);
        btn.replaceChild(wrap, n);
        break;
      }
    }
  });

  /* ---------- always-on: mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var mnav = document.getElementById('mnav');
  function closeNav() {
    if (!mnav) return;
    mnav.classList.remove('open');
    document.body.style.overflow = '';
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.querySelectorAll('[data-mclose]').forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------- always-on: header solid + sticky mobile bar (IntersectionObserver) ---------- */
  var stickybar = document.getElementById('stickybar');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      var off = !entries[0].isIntersecting;
      header.classList.toggle('scrolled', off);
      if (stickybar) stickybar.classList.toggle('show', off);
    }).observe(sentinel);
  }

  /* ---------- always-on: enquiry form (validate + success state) ---------- */
  var form = document.getElementById('demoForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // NOTE: wire this to a real handler (Formspree / CRM / email) before launch.
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (f) {
        // checkValidity() still runs with novalidate — it only suppresses the native submit UI
        var bad = !String(f.value || '').trim() || !f.checkValidity();
        f.classList.toggle('is-error', bad);
        if (bad) { f.setAttribute('aria-invalid', 'true'); } else { f.removeAttribute('aria-invalid'); }
        var err = document.getElementById(f.id + '-err');
        if (err) err.hidden = !bad;
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) { firstBad.focus(); return; }
      var done = document.getElementById('formDone');
      form.hidden = true;
      if (done) { done.hidden = false; done.focus && done.focus(); }
    });
    form.querySelectorAll('[required]').forEach(function (f) {
      f.addEventListener('input', function () {
        f.classList.remove('is-error');
        f.removeAttribute('aria-invalid');
        var err = document.getElementById(f.id + '-err');
        if (err) err.hidden = true;
      });
    });
  }

  /* ---------- no motion: reveal everything, stop ---------- */
  if (!gsapOK || reduced) {
    root.classList.remove('anim');
    if (pre) pre.style.display = 'none';
    // no count-up will run — write the final counter values directly so stats don't sit at "0"
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  gsap.defaults({ ease: 'expo.out' });
  root.classList.add('gsap-ready');

  /* ---------- Lenis inertial smooth scroll, wired to the GSAP ticker — the premium "feel" ---------- */
  var lenis = null;
  try {
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      /* hide-on-scroll-down / reveal-on-scroll-up nav (barely-there chrome) */
      if (header) {
        var lastSY = 0;
        lenis.on('scroll', function (o) {
          var sc = (o && typeof o.scroll === 'number') ? o.scroll : window.pageYOffset;
          if (Math.abs(sc - lastSY) < 6) return;
          header.classList.toggle('header--hidden', sc > lastSY && sc > 280 && !(mnav && mnav.classList.contains('open')));
          lastSY = sc;
        });
      }
    }
  } catch (e) { lenis = null; }

  /* ---------- preloader curtain → reveal (lifts on load, hard cap 2.2s) ---------- */
  if (pre) {
    var pbar = pre.querySelector('.preloader__bar i');
    var lifted = false;
    var liftPre = function () {
      if (lifted) return; lifted = true;
      if (preSkip) { pre.style.display = 'none'; return; }
      gsap.timeline({ onComplete: function () { pre.style.display = 'none'; } })
        .to(pbar, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' })
        .to(pre, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '+=0.05');
    };
    if (document.readyState === 'complete') liftPre();
    else { window.addEventListener('load', liftPre); setTimeout(liftPre, 2200); }
  }

  /* in-page anchors that respect the pinned section's added scroll length */
  function goToHash(hash, animate) {
    if (!hash || hash.length < 2) return false;
    var t;
    try { t = document.querySelector(hash); } catch (e) { return false; }
    if (!t) return false;
    // fixed numeric target computed once — avoids ScrollToPlugin drift when the
    // tween passes through the pinned section (live element targets re-measure mid-tween)
    var y = Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - 60);
    // native scroll (GSAP scrollTo is suppressed by the pinned ScrollTrigger here);
    // long jumps that cross the pinned section go instant so they don't whip the pan
    var far = Math.abs(y - window.pageYOffset) > window.innerHeight * 2;
    var smooth = animate && !far;
    if (lenis) lenis.scrollTo(y, { duration: smooth ? 1 : 0, immediate: !smooth });
    else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    if (goToHash(hash, true)) { e.preventDefault(); if (history.replaceState) history.replaceState(null, '', hash); closeNav(); }
  });

  /* ---------- helpers ---------- */
  function countUp(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', obj = { v: 0 };
    var dur = target > 20 ? 1.4 : 0.9;
    gsap.to(obj, {
      v: target, duration: dur, ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
      onComplete: function () { el.textContent = target + suffix; }
    });
  }

  /* Scroll-reveal/mask/parallax motion runs on desktop only. On phones & tablets
     these stay static so content is NEVER left hidden if a trigger misfires
     (iOS Safari's changing viewport height can break ScrollTrigger starts). */
  var motionOK = matchMedia('(min-width: 981px)').matches;
  if (motionOK) {
  /* headline mask-reveal: wrap content in an overflow-clip; the reveal itself is driven
     by an IntersectionObserver + CSS transition (NOT ScrollTrigger). IO uses real
     geometry, so it survives refreshes and deep-links through the pinned section —
     no headline line ever gets left clipped. */
  gsap.utils.toArray('[data-mask]').forEach(function (el) {
    // split on <br> so each headline line gets its own clip and the lines cascade
    var lines = [[]];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    lines = lines.filter(function (l) { return l.length; });
    if (lines.length > 1) {
      el.textContent = '';
      lines.forEach(function (nodes, i) {
        var clip = document.createElement('span');
        clip.className = 'mask-clip';
        var inner = document.createElement('span');
        inner.className = 'mask-inner';
        inner.style.transitionDelay = (i * 0.09) + 's';
        nodes.forEach(function (n) { inner.appendChild(n); });
        clip.appendChild(inner);
        el.appendChild(clip);
      });
      el.classList.add('mask-lines');
    } else {
      var inner = document.createElement('span');
      inner.className = 'mask-inner';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add('mask-clip');
    }
  });
  /* reveal all lines of one headline together (delays do the cascade) */
  if ('IntersectionObserver' in window) {
    var maskIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var parent = en.target.parentElement;
        if (parent && parent.classList.contains('mask-lines')) {
          parent.querySelectorAll('.mask-clip').forEach(function (c) { c.classList.add('is-revealed'); maskIO.unobserve(c); });
        } else {
          en.target.classList.add('is-revealed'); maskIO.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.mask-clip').forEach(function (el) { maskIO.observe(el); });
  } else {
    document.querySelectorAll('.mask-clip').forEach(function (el) { el.classList.add('is-revealed'); });
  }

  /* quiet fades for supporting content (moves LESS than headlines = hierarchy) */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    // range brand groups: header fades, the card grid gets its own cascade below
    if (el.classList.contains('brand-group')) {
      el.removeAttribute('data-reveal');
      var bgHead = el.querySelector('.brand-group__head');
      if (bgHead) gsap.fromTo(bgHead, { opacity: 0, y: 18 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform',
        scrollTrigger: { trigger: bgHead, start: 'top 88%', once: true }
      });
      return;
    }
    // spec sheet: rows cascade in line by line instead of one block fade
    if (el.classList.contains('specgroups')) {
      el.removeAttribute('data-reveal');
      var rows = el.querySelectorAll('.specgroup h4, .specrow');
      if (rows.length) gsap.fromTo(rows, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.045, clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
      return;
    }
    // home range tiles: opacity-only cascade (tile #2 keeps its CSS offset + hover lift)
    if (el.classList.contains('rtile')) {
      el.removeAttribute('data-reveal');
      gsap.set(el, { clearProps: 'transform' });
      return; // animated as a group below
    }
    gsap.fromTo(el, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* card grids cascade: model cards rise in sequence; transforms cleared so hover lifts survive */
  gsap.utils.toArray('.models-grid').forEach(function (grid) {
    if (!grid.children.length) return;
    gsap.fromTo(grid.children, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07, clearProps: 'transform',
      scrollTrigger: { trigger: grid, start: 'top 88%', once: true }
    });
  });
  gsap.utils.toArray('.range-grid').forEach(function (grid) {
    if (!grid.children.length) return;
    gsap.fromTo(grid.children, { opacity: 0 }, {
      opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: grid, start: 'top 86%', once: true }
    });
  });

  /* image clip-reveals (unveil, don't fade) */
  gsap.utils.toArray('[data-reveal-img]').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  /* ---------- cinematic hero intro: focus pull (blur -> sharp) + line cascade.
     The scale settle lives on the media CONTAINER so it never fights the
     scrubbed parallax, which owns the img's scale. ---------- */
  var heroEl = document.querySelector('.hero');
  var heroImgEl = document.getElementById('heroImg');
  if (heroEl && heroImgEl) {
    root.classList.add('hero-cine');
    var heroItems = heroEl.querySelectorAll('[data-hero]');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo('.hero__media', { scale: 1.08 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
      .fromTo(heroImgEl, { filter: 'blur(14px) brightness(0.7)' }, {
        filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'power2.out',
        onComplete: function () { gsap.set(heroImgEl, { clearProps: 'filter' }); }
      }, 0)
      .fromTo(heroItems, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1.0, stagger: 0.1 }, 0.45);
  }

  /* parallax — smoothed scrub everywhere for weight */
  if (heroImgEl) gsap.fromTo(heroImgEl, { scale: 1.12, yPercent: 0 }, { scale: 1, yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  var stmtImg = document.getElementById('statementImg');
  if (stmtImg) gsap.fromTo(stmtImg, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  var whyImg = document.getElementById('whyImg');
  if (whyImg) gsap.fromTo(whyImg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  var mstImg = document.querySelector('.mstatement__media img');
  if (mstImg) gsap.fromTo(mstImg, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.mstatement', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  /* scroll-velocity shear: grids lean with the scroll's momentum and settle on stop */
  if (lenis) {
    var shearEls = gsap.utils.toArray('.models-grid, .range-grid, .proof__grid, .mgallery__grid, .mfeat__grid');
    if (shearEls.length) {
      var shearTo = shearEls.map(function (el) { return gsap.quickTo(el, 'skewY', { duration: 0.55, ease: 'power3.out' }); });
      lenis.on('scroll', function (o) {
        var v = gsap.utils.clamp(-2.2, 2.2, (o && o.velocity ? o.velocity : 0) * 0.045);
        shearTo.forEach(function (fn) { fn(v); });
      });
    }
  }
  /* ---------- G23 cruising the bottom of the viewport, scrubbed to page scroll.
     Always visible while it crosses (pointer-events: none, so it never blocks
     a click); it exits stage right before the page bottoms out. ---------- */
  var rig = document.getElementById('cruiseRig');
  if (rig) {
    gsap.fromTo(rig,
      { x: function () { return -(rig.offsetWidth + 40); } },
      {
        x: function () { return window.innerWidth + 60; }, ease: 'none',
        scrollTrigger: { start: 'top top', end: 'max', scrub: 0.8, invalidateOnRefresh: true }
      });
  }
  } /* end motionOK */

  /* model-page stat bar: numbers count up in place ("7.09 m" -> 0.00 m ... 7.09 m) */
  gsap.utils.toArray('.mstat__val').forEach(function (el) {
    var m = String(el.textContent).match(/^([^0-9]*)([\d,]+(?:\.\d+)?)([\s\S]*)$/);
    if (!m) return;
    var num = parseFloat(m[2].replace(/,/g, ''));
    if (!num) return;
    var dec = (m[2].split('.')[1] || '').length;
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: num, duration: 1.1, ease: 'power2.out',
          onUpdate: function () { el.textContent = m[1] + obj.v.toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3]; },
          onComplete: function () { el.textContent = m[1] + m[2] + m[3]; }
        });
      }
    });
  });

  /* intro stats count up */
  if (document.querySelector('.stats')) ScrollTrigger.create({
    trigger: '.stats', start: 'top 82%', once: true,
    onEnter: function () { document.querySelectorAll('.stats [data-count]').forEach(countUp); }
  });

  /* ---------- THREE STATES: pinned horizontal pan + progress + per-panel counters ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', function () {
    var track = document.getElementById('statesTrack');
    var viewport = document.getElementById('statesViewport');
    if (!track || !viewport) return;
    root.classList.add('gsap-horizontal');
    var bar = document.getElementById('statesBar');
    var panels = gsap.utils.toArray('.state-panel');
    var nums = panels.map(function (p) { return p.querySelector('.state-panel__num'); });
    var fired = [];
    var distance = function () { return track.scrollWidth - window.innerWidth; };
    gsap.to(track, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: {
        trigger: viewport, pin: true, scrub: 1, start: 'top top',
        end: function () { return '+=' + distance(); }, invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
          var active = Math.min(panels.length - 1, Math.floor(self.progress * panels.length + 0.0001));
          panels.forEach(function (p, i) { p.classList.toggle('is-active', i === active); });
          if (!fired[active]) { fired[active] = true; countUp(nums[active]); }
        }
      }
    });
    return function () { root.classList.remove('gsap-horizontal'); };
  });
  mm.add('(max-width: 980px)', function () {
    gsap.utils.toArray('.state-panel__num').forEach(function (num) {
      ScrollTrigger.create({ trigger: num, start: 'top 85%', once: true, onEnter: function () { countUp(num); } });
    });
  });

  /* ---------- magnetic primary CTA (desktop, fine pointer only) ---------- */
  try {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.btn--primary').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'expo.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'expo.out' });
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      });
    }
  } catch (e) {}

  /* ---------- PDP hero: subtle cursor-parallax (desktop, fine pointer) ---------- */
  try {
    var mheroEl = document.querySelector('.mhero');
    var mheroImg = document.querySelector('.mhero__media img');
    if (mheroEl && mheroImg && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      gsap.set(mheroImg, { scale: 1.07, transformOrigin: '50% 50%' });
      var mhx = gsap.quickTo(mheroImg, 'x', { duration: 0.8, ease: 'power3' });
      var mhy = gsap.quickTo(mheroImg, 'y', { duration: 0.8, ease: 'power3' });
      mheroEl.addEventListener('pointermove', function (e) {
        var r = mheroEl.getBoundingClientRect();
        mhx(((e.clientX - (r.left + r.width / 2)) / r.width) * -22);
        mhy(((e.clientY - (r.top + r.height / 2)) / r.height) * -16);
      }, { passive: true });
      mheroEl.addEventListener('pointerleave', function () { mhx(0); mhy(0); });
    }
  } catch (e) {}

  /* "Design your Nautique" boat: subtle cursor parallax (desktop, fine pointer) */
  try {
    var bboat = document.getElementById('buildBoat');
    if (bboat && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var bx = gsap.quickTo(bboat, 'x', { duration: 0.6, ease: 'expo.out' });
      var brot = gsap.quickTo(bboat, 'rotation', { duration: 0.7, ease: 'expo.out' });
      var bstage = bboat.closest('.build');
      bstage.addEventListener('pointermove', function (e) {
        var r = bstage.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        bx(dx * 38); brot(dx * 3);
      });
      bstage.addEventListener('pointerleave', function () { bx(0); brot(0); });
    }
  } catch (e) {}

  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    if (location.hash) setTimeout(function () { goToHash(location.hash, false); }, 80);
  });
})();
