const ARAK_URL = '';
/* Arany Régiség Center · napi tájékoztató árak a táblákba.
   ARAK_URL üresen: a helyi assets/data/arak.json (élesítéskor ide kerül a Worker /arak címe).
   Kitölti a <td class="ar" data-ar-fem="arany" data-ar-fin="585"> cellákat és a <span data-arak-datum> elemeket.
   Hiba, hiányzó adat vagy file:// alatti helyi fájl esetén nem nyúl semmihez: a HTML-be égetett érték marad.
   Betöltés: <script src="assets/js/arfolyam.js" defer></script> */
(function () {
  'use strict';
  var HONAPOK = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

  function ezres(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }

  function magyarDatum(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    var ho = Number(m[2]);
    var nap = Number(m[3]);
    if (ho < 1 || ho > 12 || nap < 1 || nap > 31) return null;
    return m[1] + '. ' + HONAPOK[ho - 1] + ' ' + nap + '.';
  }

  function joSav(s) {
    return Array.isArray(s) && s.length === 2 &&
      Number.isInteger(s[0]) && Number.isInteger(s[1]) && s[0] > 0 && s[0] <= s[1];
  }

  function kitolt(adat) {
    var datum = magyarDatum(adat && adat.datum);
    if (!datum) return;
    var cellak = document.querySelectorAll('[data-ar-fem][data-ar-fin]');
    Array.prototype.forEach.call(cellak, function (td) {
      var fem = adat[td.getAttribute('data-ar-fem')];
      var s = fem && fem[td.getAttribute('data-ar-fin')];
      if (joSav(s)) td.textContent = ezres(s[0]) + '-' + ezres(s[1]) + ' Ft/g';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-arak-datum]'), function (el) {
      el.textContent = datum;
    });
  }

  function betolt() {
    var url = ARAK_URL || 'assets/data/arak.json';
    // file:// alatt a böngésző a helyi JSON-t úgyis letiltja; a Worker címe viszont CORS-szal mehet.
    if (!ARAK_URL && window.location && window.location.protocol === 'file:') return Promise.resolve();
    if (typeof window.fetch !== 'function') return Promise.resolve();
    return window.fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (adat) { if (adat) kitolt(adat); })
      .catch(function () { /* csendben a beégetett érték marad */ });
  }

  try {
    window.ARC_ARFOLYAM_KESZ = betolt();
  } catch (e) {
    window.ARC_ARFOLYAM_KESZ = Promise.resolve();
  }
})();
