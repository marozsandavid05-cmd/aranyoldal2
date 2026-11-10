/* Főoldal: a becslés ragadós köre a lépéseket követi (lépésenként saját kép: nagyító, mérleg, forint),
   telefonon az a lépés aktív, amelyik a ragadós kör alatt, olvasható helyen áll;
   a „Negyven év” lap képe görgetésre halkan csúszik. A lépés-kiemelés IntersectionObserverrel megy, GSAP nélkül is. */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var kor = document.querySelector('.becs__kor');
  var lepesek = [].slice.call(document.querySelectorAll('.lepes'));
  if (kor && lepesek.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        lepesek.forEach(function (l) { l.classList.toggle('most', l === e.target); });
        kor.setAttribute('data-lepes', e.target.getAttribute('data-lepes'));
      });
    }, { rootMargin: matchMedia('(max-width:980px)').matches ? '-58% 0px -30% 0px' : '-45% 0px -45% 0px' });
    lepesek.forEach(function (l) { io.observe(l); });
  }
  if (ARC.gsap && !ARC.reduce) {
    var img = document.querySelector('.negyven__img');
    if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: '.negyven', start: 'top bottom', end: 'top top', scrub: true } });
    var tel = document.querySelector('.hivas__tel');
    if (tel) ScrollTrigger.create({ trigger: tel, start: 'top 80%', once: true, onEnter: function () { tel.style.backgroundPosition = '100% 0'; } });
  }
})();
