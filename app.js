(function () {
  'use strict';
  var root = document.documentElement;
  var header = document.getElementById('header');
  var gsapOK = !!(window.gsap && window.ScrollTrigger);
  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var EASE = 'cubic-bezier(0.16,1,0.3,1)'; // expo-out — the premium settle

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
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !String(f.value || '').trim();
        f.classList.toggle('is-error', bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      var done = document.getElementById('formDone');
      form.hidden = true;
      if (done) { done.hidden = false; done.focus && done.focus(); }
    });
    form.querySelectorAll('[required]').forEach(function (f) {
      f.addEventListener('input', function () { f.classList.remove('is-error'); });
    });
  }

  /* ---------- no motion: reveal everything, stop ---------- */
  if (!gsapOK || reduced) { root.classList.remove('anim'); return; }

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  gsap.defaults({ ease: 'expo.out' });
  root.classList.add('gsap-ready');

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
    window.scrollTo({ top: y, behavior: (animate && !far) ? 'smooth' : 'auto' });
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

  /* headline mask-reveal: wrap content in an overflow-clip, wipe the inner up */
  gsap.utils.toArray('[data-mask]').forEach(function (el) {
    var inner = document.createElement('span');
    inner.className = 'mask-inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    el.classList.add('mask-clip');
    gsap.fromTo(inner, { yPercent: 115 }, {
      yPercent: 0, duration: 1.0, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* quiet fades for supporting content (moves LESS than headlines = hierarchy) */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* image clip-reveals (unveil, don't fade) */
  gsap.utils.toArray('[data-reveal-img]').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  /* parallax — smoothed scrub everywhere for weight */
  gsap.to('#heroImg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.fromTo('#statementImg', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  var whyImg = document.getElementById('whyImg');
  if (whyImg) gsap.fromTo(whyImg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  /* intro stats count up */
  ScrollTrigger.create({
    trigger: '.stats', start: 'top 82%', once: true,
    onEnter: function () { document.querySelectorAll('.stats [data-count]').forEach(countUp); }
  });

  /* ---------- THREE STATES: pinned horizontal pan + progress + per-panel counters ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', function () {
    root.classList.add('gsap-horizontal');
    var track = document.getElementById('statesTrack');
    var viewport = document.getElementById('statesViewport');
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

  /* ---------- G23 cruising the bottom of the viewport, scrubbed to page scroll ---------- */
  var rig = document.getElementById('cruiseRig');
  var cruise = document.getElementById('cruise');
  if (rig) {
    gsap.fromTo(rig,
      { x: function () { return -(rig.offsetWidth + 40); } },
      {
        x: function () { return window.innerWidth + 60; }, ease: 'none',
        scrollTrigger: { start: 'top top', end: 'max', scrub: 0.8, invalidateOnRefresh: true }
      });
    var ft = document.querySelector('.footer');
    if (ft && cruise) {
      ScrollTrigger.create({
        trigger: ft, start: 'top bottom',
        onEnter: function () { cruise.style.opacity = '0'; },
        onLeaveBack: function () { cruise.style.opacity = '1'; }
      });
    }
  }

  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    if (location.hash) setTimeout(function () { goToHash(location.hash, false); }, 80);
  });
})();
