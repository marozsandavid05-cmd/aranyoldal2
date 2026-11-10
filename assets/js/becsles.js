/* Becslés: a nyitó négy lépése. Asztalon mozgással a színpad ragad (CSS sticky), és a görgetés helyzete választja ki
   az aktív lépést: a kép és a szám osztállyal vált, az áttűnést a CSS viszi (egy driver). Az előző kép az új alatt
   teljes fedéssel marad, amíg az új be nem úszik, így nincs üres háttér. A lépéslista mutatja, hol tartunk, és
   kattintásra a lépéshez görget. Telefonon, reduced-motion alatt és JS nélkül a négy lépés egymás alatt áll. */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var bs = document.querySelector('.bs');
  if (!bs) return;
  var kepek = [].slice.call(bs.querySelectorAll('.bs__kep'));
  var jegyek = [].slice.call(bs.querySelectorAll('.bs__jegy'));
  var linkek = [].slice.call(bs.querySelectorAll('.bs__index a'));
  var N = kepek.length, aktiv = 0, tiszt = null;
  var asztal = matchMedia('(min-width:981px)');
  function ragad() { return !ARC.reduce && asztal.matches; }
  function lep() { return parseFloat(getComputedStyle(bs).getPropertyValue('--lep')) / 100 * innerHeight || innerHeight * .78; }
  function navH() { var n = document.querySelector('.nav'); return n ? n.offsetHeight : 0; }

  function jelol(i) {
    linkek.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  }
  function valt(i, azonnal) {
    if (i === aktiv && !azonnal) return;
    var regi = aktiv;
    kepek.forEach(function (k, n) {
      k.classList.remove('elozo');
      if (!azonnal && n === regi && n !== i) k.classList.add('elozo');
      k.classList.toggle('aktiv', n === i);
      if (n === i) { k.removeAttribute('data-alszik'); k.dispatchEvent(new CustomEvent('lupe:ebred')); }
      else k.setAttribute('data-alszik', '');
    });
    jegyek.forEach(function (j, n) { j.classList.toggle('aktiv', n === i); });
    jelol(i);
    aktiv = i;
    clearTimeout(tiszt);
    tiszt = setTimeout(function () { kepek.forEach(function (k) { k.classList.remove('elozo'); }); }, 900);
  }

  var f = false;
  function figyel() {
    f = false;
    if (!ragad()) return;
    var off = -bs.getBoundingClientRect().top;
    valt(Math.max(0, Math.min(N - 1, Math.round(off / lep()))));
  }
  function mod() {
    if (ragad()) { valt(aktiv, true); figyel(); }
    else {
      kepek.forEach(function (k) { k.classList.remove('elozo'); k.removeAttribute('data-alszik'); k.dispatchEvent(new CustomEvent('lupe:ebred')); });
      jegyek.forEach(function (j) { j.classList.remove('aktiv'); });
      jelol(-1);
    }
  }
  addEventListener('scroll', function () { if (!f) { f = true; requestAnimationFrame(figyel); } }, { passive: true });
  addEventListener('resize', figyel);
  if (asztal.addEventListener) asztal.addEventListener('change', mod);
  mod();
  /* közvetlen hivatkozás egy lépésre (#lepes-3): ragadós módban a lépés görgetési pontjára */
  var h = /^#lepes-(\d)$/.exec(location.hash);
  if (h && ragad()) setTimeout(function () { window.scrollTo(0, bs.getBoundingClientRect().top + scrollY + (h[1] - 1) * lep() + 2); figyel(); }, 60);
  /* telefonon és reduced-motion alatt az éppen olvasott lépés jelölése (a lista is mutatja, hol tartunk) */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (ragad()) return;
      es.forEach(function (e) { if (e.isIntersecting) jelol(jegyek.indexOf(e.target)); });
    }, { rootMargin: '-40% 0px -40% 0px' });
    jegyek.forEach(function (j) { io.observe(j); });
  }

  /* kattintás a lépésre: ragadós módban a lépés görgetési pontjára, egyébként a lépés képére */
  var nav = bs.querySelector('.bs__index');
  if (nav) nav.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var i = linkek.indexOf(a); if (i < 0) return;
    e.preventDefault(); e.stopPropagation();
    var y = ragad() ? bs.getBoundingClientRect().top + scrollY + i * lep() + 2
                    : kepek[i].getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(kepek[i]).marginTop) ? 0 : navH());
    if (ragad()) valt(i);
    if (ARC.lenis) ARC.lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: ARC.reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#lepes-' + (i + 1));
  }, true);
})();
