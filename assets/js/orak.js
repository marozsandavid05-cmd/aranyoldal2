/* Órák: a cím „Ó” betűjében egy Vacheron Constantin számlapja, rajta a másodpercmutató a pontos idő szerint jár.
   Automata szerkezet módjára másodpercenként 8 apró lépéssel halad (28 800 rezgés/óra), a tengely a számlap közepén van.
   Reduced-motion: a mutató a betöltés pillanatában áll. A görgetés halkan közelít a számlapra (egy driver). */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var m = document.getElementById('mpmutato');
  if (!m) return;
  var fut = false, lathato = true, id = 0;
  function beallit() {
    var d = new Date();
    var lep = Math.floor(d.getMilliseconds() / 125);
    var fok = (d.getSeconds() + lep / 8) * 6;
    m.style.setProperty('--mp', fok.toFixed(2) + 'deg');
  }
  beallit();
  if (ARC.reduce) return;
  function tick() {
    if (!lathato) { fut = false; return; }
    beallit();
    id = setTimeout(tick, 125 - (Date.now() % 125) + 2);
  }
  function indit() { if (!fut && lathato) { fut = true; tick(); } }
  indit();
  var kor = document.querySelector('.o-kor');
  if ('IntersectionObserver' in window && kor) new IntersectionObserver(function (es) {
    lathato = es[0].isIntersecting; if (lathato) indit(); else { clearTimeout(id); fut = false; }
  }).observe(kor);
  document.addEventListener('visibilitychange', function () { lathato = !document.hidden; if (lathato) indit(); else { clearTimeout(id); fut = false; } });
  if (ARC.gsap && kor) {
    var img = kor.querySelector('img');
    gsap.fromTo([img, kor.querySelector('.o-sik')], { scale: 1.0 }, { scale: 1.22, ease: 'none',
      scrollTrigger: { trigger: '.oh', start: 'top top', end: 'bottom top', scrub: true } });
  }
})();
