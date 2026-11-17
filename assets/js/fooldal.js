/* Főoldal: a becslés ragadós köre asztalon a lépéseket követi (lépésenként saját kép: nagyító, mérleg, forint).
   Telefonon nincs ragadós kör: minden lépés mellett a saját kis kerek képe áll (CSS), ezért itt csak asztalon fut a követés.
   A „Készpénzért vásárolunk” szalag tartalma egyszer duplázódik (végtelen sor, a varrat a margin-right miatt pixelpontos),
   a sebesség a sor szélességéből jön (kb. 38 px/s), reduced-motion alatt áll.
   A „Negyven év” lap képe görgetésre halkan csúszik. A lépés-kiemelés IntersectionObserverrel megy, GSAP nélkül is. */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var kor = document.querySelector('.becs__kor');
  var lepesek = [].slice.call(document.querySelectorAll('.lepes'));
  var asztal = matchMedia('(min-width:981px)');
  if (kor && lepesek.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!asztal.matches) return;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        lepesek.forEach(function (l) { l.classList.toggle('most', l === e.target); });
        kor.setAttribute('data-lepes', e.target.getAttribute('data-lepes'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    lepesek.forEach(function (l) { io.observe(l); });
  }

  var sor = document.querySelector('.szalag__sor');
  if (sor && !ARC.reduce) {
    [].slice.call(sor.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); sor.appendChild(c); });
    var ido = function () { sor.style.setProperty('--szalag-ido', Math.max(30, Math.round(sor.scrollWidth / 2 / 38)) + 's'); };
    ido(); sor.classList.add('fut');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ido);
    /* a nem látható szalag nem fut */
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sor.style.animationPlayState = es[0].isIntersecting ? 'running' : 'paused'; }).observe(sor);
  }

  if (ARC.gsap && !ARC.reduce) {
    var img = document.querySelector('.negyven__img');
    if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: '.negyven', start: 'top bottom', end: 'top top', scrub: true } });
    var tel = document.querySelector('.hivas__tel');
    if (tel) ScrollTrigger.create({ trigger: tel, start: 'top 80%', once: true, onEnter: function () { tel.style.backgroundPosition = '100% 0'; } });
  }
})();
