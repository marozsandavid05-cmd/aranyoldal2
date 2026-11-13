/* Arany Régiség Center · árfolyam-grafikon az ártáblák mellé.
   Adat: a figure-be égetett <script type="application/json" class="arf__adat"> (file:// alatt is működik),
   http(s) alatt frissebb adat az assets/data/arfolyam-tortenet.json-ból, ha az újabb.
   A figure-be égetett [data-arf-nezet] tartalom akkor is látszik, ha ez a fájl nem fut le. */
(function () {
  'use strict';
  var TORTENET_URL = 'https://aranyregiseg-arfolyam.marozsandavid05.workers.dev/tortenet';
  var HONAP = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HO_ROVID = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
  var NEV = { arany: 'Arany', ezust: 'Ezüst', platina: 'Platina', palladium: 'Palládium' };
  var NEV_KIS = { arany: 'az arany', ezust: 'az ezüst', platina: 'a platina', palladium: 'a palládium' };
  var TAVOK = { '1': 'egy hónap', '3': 'három hónap', '12': 'egy év' };
  var EZELOTT = { '1': 'egy hónapja', '3': 'három hónapja', '12': 'egy éve' };
  var VALT = [['napi', 'Nap'], ['heti', 'Hét'], ['havi', 'Hónap'], ['eves', 'Év']];
  var W = 1000, H = 320;

  function ezres(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  function ft(v) { return ezres(Math.round(v)); }
  function szaz(v) { return Math.abs(v).toFixed(2).replace('.', ','); }
  function datum(iso) { var p = iso.split('-'); return p[0] + '. ' + HONAP[+p[1] - 1] + ' ' + (+p[2]) + '.'; }
  function datumRovid(iso) { var p = iso.split('-'); return p[0] + '. ' + HO_ROVID[+p[1] - 1] + ' ' + (+p[2]) + '.'; }
  function nap(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
  function irany(v) { return v > 0.004 ? 'fel' : v < -0.004 ? 'le' : 'all'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function nyil(ir) {
    if (ir === 'all') return '<svg class="arf__nyil" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5h8"/></svg>';
    return '<svg class="arf__nyil" viewBox="0 0 10 10" aria-hidden="true"><path d="' + (ir === 'fel' ? 'M5 1.5 9 8H1z' : 'M5 8.5 1 2h8z') + '"/></svg>';
  }
  function iranySzo(ir) { return ir === 'fel' ? 'emelkedett' : ir === 'le' ? 'csökkent' : 'változatlan'; }

  /* a teljes JSON (napok tömb) átalakítása a figure-ben tárolt tömör formára */
  function tomorit(j) {
    var n = j.napok || [];
    var o = { frissitve: j.frissitve, napok: n.map(function (x) { return x.d; }), valtozas: j.valtozas, usdHuf: n.map(function (x) { return x.usdHuf; }) };
    Object.keys(NEV).forEach(function (f) { o[f] = n.map(function (x) { return x[f]; }); });
    return o;
  }

  function szep(min, max, db) {
    var nyers = (max - min) / db, hatv = Math.pow(10, Math.floor(Math.log10(nyers))), lepes = hatv;
    [1, 2, 2.5, 5, 10].some(function (m) { lepes = m * hatv; return lepes >= nyers; });
    var t = [], v = Math.ceil(min / lepes) * lepes;
    for (; v <= max + 1e-9; v += lepes) t.push(Math.round(v * 100) / 100);
    return t;
  }

  function hatar(iso, honap) {
    var e = +iso.slice(0, 4), h = +iso.slice(5, 7), n = +iso.slice(8, 10), ossz = e * 12 + (h - 1) - honap;
    var ev = Math.floor(ossz / 12), ho = ossz % 12, utolso = new Date(Date.UTC(ev, ho + 1, 0)).getUTCDate();
    return Date.UTC(ev, ho, Math.min(n, utolso)) / 864e5;
  }

  /* kezdőpont: az utolsó meglévő nap, amely legfeljebb 1, 3 vagy 12 naptári hónappal korábbi (a változás-számmal egyezően) */
  function kivag(adat, fem, honap) {
    var d = adat.napok, v = adat[fem], vege = d.length - 1, cel = hatar(d[vege], honap), k = 0;
    for (var i = vege; i >= 0; i--) { if (nap(d[i]) <= cel && typeof v[i] === 'number') { k = i; break; } }
    var p = [];
    for (i = k; i <= vege; i++) if (typeof v[i] === 'number') p.push({ d: d[i], v: v[i], t: nap(d[i]) });
    return p;
  }

  function xCimkek(p, tav) {
    var out = [], t0 = p[0].t, t1 = p[p.length - 1].t, span = t1 - t0 || 1, seen = {};
    if (tav <= 1) {
      for (var i = p.length - 1; i >= 0; i -= 5) out.unshift({ x: (p[i].t - t0) / span, s: HO_ROVID[+p[i].d.slice(5, 7) - 1] + ' ' + (+p[i].d.slice(8, 10)) + '.' });
      return out.filter(function (c) { return c.x > 0.04 && c.x < 0.97; });
    }
    var lep = tav > 3 ? 2 : 1;
    p.forEach(function (q) {
      var ev = q.d.slice(0, 4), ho = +q.d.slice(5, 7), kulcs = ev + '-' + ho;
      if (seen[kulcs]) return; seen[kulcs] = 1;
      if (q === p[0] || (ho - 1) % lep) return;
      out.push({ x: (q.t - t0) / span, s: ho === 1 ? ev : HO_ROVID[ho - 1] });
    });
    return out.filter(function (c) { return c.x > 0.03 && c.x < 0.97; });
  }

  function rajzol(fig, adat) {
    var fem = fig.getAttribute('data-arf-aktiv'), tav = +fig.getAttribute('data-arf-tav');
    var p = kivag(adat, fem, tav);
    if (p.length < 2) return;
    var vals = p.map(function (q) { return q.v; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi - lo) * 0.12 || hi * 0.02;
    var y0 = lo - pad, y1 = hi + pad, t0 = p[0].t, span = p[p.length - 1].t - t0 || 1;
    var X = function (t) { return (t - t0) / span * W; }, Y = function (v) { return H - (v - y0) / (y1 - y0) * H; };
    var vonal = p.map(function (q, i) { return (i ? 'L' : 'M') + X(q.t).toFixed(1) + ' ' + Y(q.v).toFixed(1); }).join('');
    var ter = vonal + 'L' + W + ' ' + H + 'L0 ' + H + 'Z';
    var kezd = p[0], utolso = p[p.length - 1], valt = (utolso.v / kezd.v - 1) * 100, ir = irany(valt);
    var ticks = szep(lo, hi, 4).filter(function (v) { return v > y0 && v < y1; });
    var maxP = p[vals.indexOf(hi)], minP = p[vals.indexOf(lo)];
    var vk = (adat.valtozas && adat.valtozas[fem]) || {};
    var kulcs = tav === 1 ? 'havi' : tav === 12 ? 'eves' : null;
    if (kulcs && typeof vk[kulcs] === 'number') { valt = vk[kulcs]; ir = irany(valt); }
    var tavSzo = TAVOK[String(tav)];

    var racs = ticks.map(function (v) { return '<line x1="0" x2="' + W + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>'; }).join('');
    var yc = ticks.map(function (v) { return '<span style="top:' + (Y(v) / H * 100).toFixed(2) + '%">' + ft(v) + '</span>'; }).join('');
    var xc = xCimkek(p, tav).map(function (c) { return '<span style="left:' + (c.x * 100).toFixed(2) + '%">' + c.s + '</span>'; }).join('');
    var kezdoY = (Y(kezd.v) / H * 100).toFixed(2);

    var valtHtml = VALT.map(function (k) {
      var v = vk[k[0]]; if (typeof v !== 'number') return '';
      var i = irany(v);
      return '<div class="arf__v arf__v--' + i + '"><dt>' + k[1] + '</dt><dd>' + nyil(i) + '<span class="sr">' + iranySzo(i) + ' </span>' + szaz(v) + '%</dd></div>';
    }).join('');

    var osszeg = 'Az elmúlt ' + tavSzo + ' alatt ' + NEV_KIS[fem] + ' piaci ára forintban ' +
      (ir === 'all' ? 'nem változott érdemben' : szaz(valt) + '%-kal ' + (ir === 'fel' ? 'emelkedett' : 'csökkent')) +
      ': ' + ft(kezd.v) + ' Ft/g-ról ' + ft(utolso.v) + ' Ft/g-ra. Legmagasabb ' + ft(hi) + ' Ft/g (' + datumRovid(maxP.d) + '), legalacsonyabb ' + ft(lo) + ' Ft/g (' + datumRovid(minP.d) + ').';

    var nezet = fig.querySelector('[data-arf-nezet]');
    nezet.innerHTML =
      '<div class="arf__stat">' +
        '<p class="arf__ar"><span class="arf__ar-szam">' + ft(utolso.v) + '</span> <span class="arf__ar-egys">Ft/g</span></p>' +
        '<p class="arf__ar-cim">' + NEV[fem] + ', 999-es finomság, világpiaci ár forintban · ' + datum(utolso.d) + '</p>' +
        '<dl class="arf__valt">' + valtHtml + '</dl>' +
      '</div>' +
      '<div class="arf__rajz arf__rajz--' + ir + '">' +
        '<div class="arf__terulet" tabindex="0" role="img" aria-label="' + esc(NEV[fem] + ' piaci ára forintban, ' + tavSzo + ': ' + osszeg.replace(/^[^:]*: /, '')) + '">' +
          '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
            '<g class="arf__racs">' + racs + '</g>' +
            '<line class="arf__alap" x1="0" x2="' + W + '" y1="' + kezdoY * H / 100 + '" y2="' + kezdoY * H / 100 + '"/>' +
            '<path class="arf__ter" d="' + ter + '"/>' +
            '<path class="arf__vonal" d="' + vonal + '" vector-effect="non-scaling-stroke"/>' +
          '</svg>' +
          '<span class="arf__veg" style="top:' + (Y(utolso.v) / H * 100).toFixed(2) + '%" aria-hidden="true"></span>' +
          '<div class="arf__kurzor" hidden aria-hidden="true"><span class="arf__pont"></span><span class="arf__buborek"><b></b><span></span></span></div>' +
        '</div>' +
        '<div class="arf__y" aria-hidden="true">' + yc + '</div>' +
        '<div class="arf__x" aria-hidden="true">' + xc + '</div>' +
        '<p class="arf__jel" aria-hidden="true"><span class="arf__jel-alap"></span>Szaggatott vonal: az ár ' + EZELOTT[String(tav)] + ', ' + ft(kezd.v) + ' Ft/g</p>' +
      '</div>' +
      '<p class="arf__osszeg">' + osszeg + '</p>';

    fig._arf = { p: p, X: X, Y: Y, fem: fem };
    kurzor(fig);
  }

  function kurzor(fig) {
    var ter = fig.querySelector('.arf__terulet'), k = fig.querySelector('.arf__kurzor'), elo = fig.querySelector('.arf__elo');
    if (!ter || !k) return;
    var pont = k.querySelector('.arf__pont'), bub = k.querySelector('.arf__buborek'), idx = -1, ujj = 0;
    function mutat(i, bemond) {
      var s = fig._arf, q = s.p[i]; if (!q) return;
      idx = i;
      var x = s.X(q.t) / W * 100, y = s.Y(q.v) / H * 100;
      k.hidden = false;
      k.style.left = x + '%';
      pont.style.top = y + '%';
      bub.firstChild.textContent = ft(q.v) + ' Ft/g';
      bub.lastChild.textContent = datumRovid(q.d);
      bub.className = 'arf__buborek' + (x > 62 ? ' arf__buborek--bal' : '') + (y < 30 ? ' arf__buborek--le' : '');
      if (bemond && elo) elo.textContent = datum(q.d) + ': ' + ft(q.v) + ' forint grammonként';
    }
    function rejt() { k.hidden = true; idx = -1; }
    function hol(cx) {
      var r = ter.getBoundingClientRect(), s = fig._arf, f = Math.min(1, Math.max(0, (cx - r.left) / r.width));
      var t = s.p[0].t + f * (s.p[s.p.length - 1].t - s.p[0].t), best = 0, bd = 1e9;
      s.p.forEach(function (q, i) { var dd = Math.abs(q.t - t); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    ter.addEventListener('pointermove', function (e) { mutat(hol(e.clientX), false); });
    ter.addEventListener('pointerdown', function (e) { ujj = Date.now(); mutat(hol(e.clientX), false); });
    ter.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') rejt(); });
    ter.addEventListener('blur', function () { if (Date.now() - ujj > 400) rejt(); });
    ter.addEventListener('focus', function () { if (Date.now() - ujj > 400) mutat(fig._arf.p.length - 1, true); });
    ter.addEventListener('keydown', function (e) {
      var n = fig._arf.p.length, i = idx < 0 ? n - 1 : idx;
      if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
      else if (e.key === 'ArrowRight') i = Math.min(n - 1, i + 1);
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      else if (e.key === 'Escape') { rejt(); return; }
      else return;
      e.preventDefault(); mutat(i, true);
    });
  }

  function gombok(fig) {
    Array.prototype.forEach.call(fig.querySelectorAll('[data-tav],[data-fem]'), function (b) {
      b.addEventListener('click', function () {
        var attr = b.hasAttribute('data-tav') ? 'data-tav' : 'data-fem';
        fig.setAttribute(attr === 'data-tav' ? 'data-arf-tav' : 'data-arf-aktiv', b.getAttribute(attr));
        Array.prototype.forEach.call(fig.querySelectorAll('[' + attr + ']'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        try { rajzol(fig, fig._adat); } catch (e) { /* a korábbi nézet marad */ }
      });
    });
  }

  function indit() {
    var figs = document.querySelectorAll('.arf[data-arf-aktiv]');
    if (!figs.length) return;
    Array.prototype.forEach.call(figs, function (fig) {
      var el = fig.querySelector('.arf__adat');
      try { fig._adat = JSON.parse(el.textContent); } catch (e) { return; }
      fig.classList.add('arf--el');
      gombok(fig);
      try { rajzol(fig, fig._adat); } catch (e) { /* a beégetett nézet marad */ }
    });
    if (location.protocol === 'file:' || typeof fetch !== 'function') return;
    fetch(TORTENET_URL, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.napok || !j.napok.length) return;
      var uj = tomorit(j);
      Array.prototype.forEach.call(figs, function (fig) {
        if (!fig._adat || uj.frissitve <= fig._adat.frissitve) return;
        fig._adat = uj;
        try { rajzol(fig, uj); } catch (e) {}
      });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', indit);
  else indit();
})();
