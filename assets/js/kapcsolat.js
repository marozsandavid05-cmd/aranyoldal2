/* Kapcsolat: térkép (MapLibre lokálisan + OpenFreeMap sötét stílus, a palettára színezve, lusta betöltés)
   és az üzenet-űrlap (ellenőrzés, majd a levelezőprogram nyílik a kitöltött levéllel). */
(function () {
  'use strict';
  var tk = document.querySelector('.terkep');
  if (tk) {
    var start = function () {
      if (typeof maplibregl === 'undefined') return;
      var el = tk.querySelector('.map');
      fetch('https://tiles.openfreemap.org/styles/dark').then(function (r) { return r.json(); }).then(function (st) {
        (st.layers || []).forEach(function (l) {
          var p = l.paint || (l.paint = {}), id = l.id || '';
          if (l.type === 'background') p['background-color'] = '#0F0D0B';
          else if (l.type === 'fill' && /water/.test(id)) p['fill-color'] = '#121815';
          else if (l.type === 'fill' && /building/.test(id)) { p['fill-color'] = '#1D1A16'; p['fill-outline-color'] = '#26221D'; }
          else if (l.type === 'fill') p['fill-color'] = '#13110E';
          else if (l.type === 'line' && /water|river/.test(id)) p['line-color'] = '#18201C';
          else if (l.type === 'line') p['line-color'] = /primary|trunk|motorway|secondary/.test(id) ? '#5E574D' : '#36312A';
          else if (l.type === 'symbol') { p['text-color'] = '#A39B8F'; p['text-halo-color'] = '#0F0D0B'; p['text-halo-width'] = 1.2; if (l.layout && l.layout['icon-image']) p['icon-opacity'] = 0; }
        });
        var map = new maplibregl.Map({ container: el, style: st, center: [19.06071, 47.50765], zoom: 15.6, attributionControl: { compact: true }, cooperativeGestures: matchMedia('(pointer:coarse)').matches });
        map.scrollZoom.disable();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('styleimagemissing', function (e) { if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) }); });
        var jel = document.createElement('div'); jel.className = 'terkep-jel'; jel.setAttribute('aria-hidden', 'true');
        new maplibregl.Marker({ element: jel }).setLngLat([19.06071, 47.50765]).addTo(map);
        map.on('load', function () { tk.classList.add('betoltve'); });
      }).catch(function () {});
    };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { tio.disconnect(); start(); } }, { rootMargin: '300px' });
      tio.observe(tk);
    } else start();
  }

  var f = document.querySelector('.urlap');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      f.querySelectorAll('[required]').forEach(function (inp) {
        var hiba = f.querySelector('#' + inp.id + '-hiba');
        var rossz = !inp.value.trim() || (inp.type === 'tel' && inp.value.replace(/\D/g, '').length < 8);
        inp.setAttribute('aria-invalid', rossz ? 'true' : 'false');
        if (hiba) hiba.textContent = rossz ? inp.getAttribute('data-hiba') : '';
        if (rossz && ok) { inp.focus(); ok = false; }
      });
      if (!ok) return;
      var v = function (n) { var x = f.querySelector('[name="' + n + '"]:checked') || f.querySelector('[name="' + n + '"]'); return x ? x.value.trim() : ''; };
      var body = 'Név: ' + v('nev') + '\nTelefon: ' + v('telefon') + '\nHol nézzük meg: ' + v('hol') + '\nTárgy: ' + v('targy') + '\nMikor hívhatjuk: ' + v('mikor') + '\n\n' + v('uzenet');
      location.href = 'mailto:aranyregisegcenter@gmail.com?subject=' + encodeURIComponent('Becslést kérek: ' + (v('targy') || 'tárgy')) + '&body=' + encodeURIComponent(body);
      var st = f.querySelector('.allapot');
      if (st) st.textContent = 'Megnyílt a levelezőprogramja a kitöltött levéllel. Ha nem nyílt meg, hívjon minket: 06 20 620 1377.';
    });
  }
})();
