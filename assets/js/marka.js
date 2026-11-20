/* Márkás ékszerek: a márkanevek görgetésre egymás után teljes színt kapnak, mintha valaki végigolvasná a névsort.
   Egy driver (scrub). GSAP nélkül vagy csökkentett mozgásnál minden név teljes színű (a CSS alapállapota). */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var sor = document.querySelector('.mk-markak__sor');
  if (!sor || !ARC.gsap || ARC.reduce) return;
  var nevek = [].slice.call(sor.children);
  nevek.forEach(function (li) { li.style.setProperty('--kesz', 0); });
  gsap.to(nevek, {
    '--kesz': 1, ease: 'none', stagger: 0.5, duration: 1,
    scrollTrigger: { trigger: sor, start: 'top 85%', end: 'bottom 55%', scrub: true }
  });
})();
