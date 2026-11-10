/* Régiségek: a hagyaték négy lépésének vonala görgetésre telik (egy driver, scrub). GSAP nélkül teli vonal. */
(function () {
  'use strict';
  var ARC = window.ARC || {};
  var ut = document.querySelector('.lakas__ut');
  if (!ut || !ARC.gsap || ARC.reduce) return;
  gsap.fromTo(ut, { '--halad': 0 }, { '--halad': 1, ease: 'none',
    scrollTrigger: { trigger: ut, start: 'top 80%', end: 'bottom 55%', scrub: true } });
})();
