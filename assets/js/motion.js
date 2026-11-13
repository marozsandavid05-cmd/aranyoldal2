/* Arany Régiség Center · mozgás-gerinc és közös működés.
   A tartalom nem függ a GSAP-tól: a belépők CSS-osztályból jönnek (.js .rv -> .in), reduced-motion vagy hiányzó
   könyvtár alatt natív görgetés és kész állapot. ?motion=1 bekapcsolja a mozgást akkor is, ha a rendszer
   reduced-motiont kér; ?motion=0 kikapcsolja. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var q = new URLSearchParams(location.search);
  try {
    if (q.get('motion') === '1') sessionStorage.setItem('arc-motion', '1');
    if (q.get('motion') === '0') sessionStorage.setItem('arc-motion', '0');
  } catch (e) {}
  var force = null; try { force = sessionStorage.getItem('arc-motion'); } catch (e) {}
  var reduce = force === '1' ? false : force === '0' ? true : matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.remove('no-js');
  doc.classList.add('js', reduce ? 'rm' : 'mo');
  var hasG = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var ARC = window.ARC = { reduce: reduce, lenis: null, gsap: hasG };

  /* ---------- belépők ---------- */
  var els = [].slice.call(document.querySelectorAll('.rv'));
  function show(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in window)) els.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) show(el); }); }, 1600);
  }

  /* ---------- Lenis: saját rAF, nem gsap.ticker ---------- */
  if (!reduce && typeof Lenis !== 'undefined') {
    var lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, syncTouch: false });
    ARC.lenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    if (hasG) lenis.on('scroll', ScrollTrigger.update);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -90 }); }
      });
    });
  }
  if (hasG) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var lastScroll = 0, tries = 0, pend = null;
    addEventListener('scroll', function () { lastScroll = performance.now(); }, { passive: true });
    var queueRefresh = ARC.refresh = function () {
      clearTimeout(pend);
      pend = setTimeout(function () {
        if (performance.now() - lastScroll < 500 && tries++ < 40) return queueRefresh();
        ScrollTrigger.refresh();
      }, 300);
    };
    addEventListener('load', queueRefresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
    setTimeout(queueRefresh, 2500); setTimeout(queueRefresh, 6000);
    document.querySelectorAll('img[loading="lazy"]').forEach(function (i) { if (!i.complete) i.addEventListener('load', queueRefresh, { once: true }); });
  }

  /* ---------- címek: SplitText soronkénti maszk-reveal, a végén visszaáll (az ékezet nem vágódik) ---------- */
  if (hasG && !reduce && typeof SplitText !== 'undefined') {
    var cimek = [].slice.call(document.querySelectorAll('[data-sor]'));
    var futtat = function () {
      cimek.forEach(function (h) {
        var s = new SplitText(h, { type: 'lines', linesClass: 'sline', mask: 'lines' });
        gsap.set(s.lines, { yPercent: 105 });
        var elso = h.getBoundingClientRect().top < innerHeight;
        gsap.to(s.lines, { yPercent: 0, duration: .9, ease: 'power3.out', stagger: .08, delay: elso ? .15 : 0,
          scrollTrigger: elso ? null : { trigger: h, start: 'top 88%', once: true },
          onComplete: function () { s.revert(); } });
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(futtat); else futtat();
  }

  /* ---------- színvilág: a body háttere görgetés-arányosan úszik a szekciók között (reduced-motion alatt is) ---------- */
  var vil = [].slice.call(document.querySelectorAll('[data-vilag]'));
  if (vil.length) {
    var hex = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
    var bs = getComputedStyle(document.body);
    var cols = vil.map(function (s) { var v = s.getAttribute('data-vilag'); if (v.indexOf('--') === 0) v = bs.getPropertyValue(v).trim(); return hex(v); });
    var vf = false;
    var keverd = function () {
      vf = false;
      var mid = innerHeight * .55, i = 0;
      for (var k = 0; k < vil.length; k++) { if (vil[k].getBoundingClientRect().top <= mid) i = k; }
      var c = cols[i], n = cols[Math.min(i + 1, cols.length - 1)];
      var r = vil[i].getBoundingClientRect(), zona = innerHeight * .45;
      var d = r.bottom - mid, t = d < zona ? Math.min(1, Math.max(0, 1 - d / zona)) : 0;
      var m = c.map(function (v, j) { return Math.round(v + (n[j] - v) * t); });
      document.body.style.backgroundColor = 'rgb(' + m.join(',') + ')';
      /* a lap legteteje (Lenis-görgetésnél a kompozitor egy-két kockára felül szabadon hagyja) a felső szekció színét kapja,
         így nincs sötét sáv a fejléc alatt */
      var fent = 'rgb(' + m.join(',') + ')';
      for (var q = 0; q < vil.length; q++) {
        var rq = vil[q].getBoundingClientRect();
        if (rq.top <= 0 && rq.bottom > 0) { var bq = getComputedStyle(vil[q]).backgroundColor; if (bq && bq.indexOf('rgba') !== 0) fent = bq; break; }
      }
      doc.style.backgroundColor = fent;
      document.body.style.setProperty('--vilag', 'rgb(' + m.join(',') + ')');
    };
    addEventListener('scroll', function () { if (!vf) { vf = true; requestAnimationFrame(keverd); } }, { passive: true });
    addEventListener('resize', keverd); keverd();
    document.body.style.transition = 'none';
  }

  /* ---------- fejléc: a hero után tömör, lefelé görgetve elbújik (delta-hiszterézis) ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var lastY = scrollY, acc = 0, nf = false;
    /* sötét nyitókép ([data-fej-sotet]): amíg a fejléc a fotó fölött áll, a tömör fejléc a fotó saját feketéjét kapja
       (a szín a CSS-ben), a fotó alsó 8%-a már a következő szakaszba úszik, ott a szokásos tömör fejléc jön vissza */
    var sotet = document.querySelector('[data-fej-sotet]');
    var navAll = function () {
      nf = false;
      var y = scrollY, d = y - lastY; lastY = y;
      nav.classList.toggle('tomor', y > 40);
      if (sotet) { var rs = sotet.getBoundingClientRect(); nav.classList.toggle('fej-sotet', rs.bottom - rs.height * .08 > nav.offsetHeight); }
      if (doc.classList.contains('menu-nyitva') || nav.querySelector('.nyitva')) { nav.classList.remove('rejtve'); return; }
      if ((d > 0) !== (acc > 0)) acc = 0;
      acc += d;
      if (y < innerHeight * .5 || acc < -60) nav.classList.remove('rejtve');
      else if (acc > 120) nav.classList.add('rejtve');
    };
    addEventListener('scroll', function () { if (!nf) { nf = true; requestAnimationFrame(navAll); } }, { passive: true });
    navAll();
  }

  /* ---------- lenyíló „Mit vásárolunk” ---------- */
  document.querySelectorAll('.lenyilo').forEach(function (li) {
    var btn = li.querySelector('.lenyilo__gomb'), t = 0;
    function set(open) { li.classList.toggle('nyitva', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function () { set(!li.classList.contains('nyitva')); });
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      li.addEventListener('mouseenter', function () { clearTimeout(t); set(true); });
      li.addEventListener('mouseleave', function () { t = setTimeout(function () { set(false); }, 200); });
    }
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) set(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('nyitva')) { set(false); btn.focus(); } });
    document.addEventListener('click', function (e) { if (!li.contains(e.target)) set(false); });
  });

  /* ---------- telefonos menü ---------- */
  var burger = document.querySelector('.burger');
  function menu(open) {
    doc.classList.toggle('menu-nyitva', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (ARC.lenis) open ? ARC.lenis.stop() : ARC.lenis.start();
  }
  if (burger) burger.addEventListener('click', function () { menu(!doc.classList.contains('menu-nyitva')); });
  document.querySelectorAll('.mmenu a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('menu-nyitva')) { menu(false); burger.focus(); } });

  /* ---------- árak az adatfájlból ---------- */
  var A = window.ARC_ARAK;
  function ft(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); }
  if (A) {
    document.querySelectorAll('[data-arak]').forEach(function (tb) {
      var lista = A[tb.getAttribute('data-arak')] || [];
      lista.forEach(function (r, i) {
        var td = tb.querySelector('[data-i="' + i + '"] .ar');
        if (td) td.textContent = ft(r.tol) + '-' + ft(r.ig) + ' ' + (r.egyseg || 'Ft/g');
      });
    });
    document.querySelectorAll('[data-arak-datum]').forEach(function (el) { el.textContent = A.frissitve; });
    document.querySelectorAll('[data-arak-jeloles]').forEach(function (el) { if (A.jeloles) el.textContent = A.jeloles; });
  }

  /* ---------- nyitvatartás: a mai nap ---------- */
  var nap = new Date().getDay();
  document.querySelectorAll('[data-nap]').forEach(function (tr) {
    if (+tr.getAttribute('data-nap') === nap) { tr.classList.add('ma'); var m = tr.querySelector('.ma-jel'); if (m) m.hidden = false; }
  });
})();
