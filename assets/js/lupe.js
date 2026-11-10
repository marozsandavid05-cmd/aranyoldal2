/* Arany Régiség Center · ékszerész-lupe (minden oldal nyitóképén ugyanez a motor, más tárggyal).
   Beállítás a [data-lupe] elem JSON-attribútumából:
   { "d": { "src": nagy kép, "w": szélesség, "h": magasság, "p": [[x, y], ...] },   asztali kép, pontok arányban
     "m": { ... } (nem kötelező, telefonos kép és pontok, saját "nev" listával is), "nev": [címkék], "z": legnagyobb nagyítás, "mq": telefonos media query }
   Egér: a lupe követi. Érintés: a koppintás helyére megy. Üresjárat: lassan vándorol a részletek között.
   Ugyanaz a rAF viszi a kép halk sodródását és a lámpa fényét (egy driver elemenként), csak látható nyitókép alatt.
   Reduced-motion: a lupe az első részleten áll, sodródás nélkül. */
(function () {
  'use strict';
  var RM = window.ARC && window.ARC.reduce;
  var finom = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* object-position egy tengelye arányként; kulcsszó (left, center, top...) és képpont is (a szabad hely arányában) */
  var KULCS = { left: 0, top: 0, center: .5, right: 1, bottom: 1 };
  function pos(v, i, szabad) {
    var p = (v || '50% 50%').trim().split(/\s+/)[i] || '50%';
    if (p in KULCS) return KULCS[p];
    if (p.indexOf('%') > -1) return parseFloat(p) / 100;
    if (p.indexOf('px') > -1) return szabad ? parseFloat(p) / szabad : .5;
    return .5;
  }

  function init(ter) {
    var cfg; try { cfg = JSON.parse(ter.getAttribute('data-lupe')); } catch (e) { return; }
    var img = ter.querySelector('.lupe-kep');
    var mozgo = ter.querySelector('.lupe-mozgo') || img;
    var feny = ter.querySelector('.lupe-feny');
    if (!img) return;
    var lencse = document.createElement('div'); lencse.className = 'lencse'; lencse.setAttribute('aria-hidden', 'true');
    var lk = document.createElement('div'); lk.className = 'lencse__kep'; lencse.appendChild(lk);
    /* a felirat a lupe sötét foglalatába vésve, ívben (SVG textPath), nagyítási szám és doboz nélkül */
    var SN = 'http://www.w3.org/2000/svg', BEZ = 24;
    var cimke = document.createElementNS(SN, 'svg'); cimke.setAttribute('class', 'lencse__cimke'); cimke.setAttribute('aria-hidden', 'true');
    var ivUt = document.createElementNS(SN, 'path'); ivUt.setAttribute('id', 'iv-' + ter.id); ivUt.setAttribute('fill', 'none');
    var ivTx = document.createElementNS(SN, 'text'), ivTp = document.createElementNS(SN, 'textPath');
    ivTp.setAttribute('href', '#iv-' + ter.id); ivTp.setAttribute('startOffset', '50%'); ivTx.setAttribute('text-anchor', 'middle');
    ivTx.appendChild(ivTp); cimke.appendChild(ivUt); cimke.appendChild(ivTx); lencse.appendChild(cimke);
    ter.appendChild(lencse);
    var gombok = [].slice.call(document.querySelectorAll('[data-lupe-gomb="' + ter.id + '"]'));
    var szoveg = document.querySelector('[data-lupe-szoveg="' + ter.id + '"]');
    var mq = cfg.mq ? matchMedia(cfg.mq) : null;
    var horgony = document.querySelector('[data-lupe-horgony="' + ter.id + '"]'), vonal = null, vl = null, vp = null;
    if (horgony) {
      var NS = 'http://www.w3.org/2000/svg';
      vonal = document.createElementNS(NS, 'svg'); vonal.setAttribute('class', 'lupe-vonal'); vonal.setAttribute('aria-hidden', 'true');
      vl = document.createElementNS(NS, 'line'); vp = document.createElementNS(NS, 'circle'); vp.setAttribute('r', '3');
      vonal.appendChild(vl); vonal.appendChild(vp); ter.appendChild(vonal);
    }
    var mod = '', K = cfg.d, Z = 3, R = 110, aktiv = 0;
    var geo = { s: 1, ox: 0, oy: 0 };
    var cel = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, eger = false, utolso = 0, lathato = true, fut = false, t0 = performance.now(), betoltve = false;
    var kez = false, cimkeAkt = -1;

    function kepValt() {
      var m = mq && mq.matches && cfg.m ? 'm' : 'd';
      if (m === mod) return;
      mod = m; K = cfg[m];
      aktiv = aktiv % K.p.length;
      var pre = new Image();
      pre.onload = function () { lk.style.backgroundImage = 'url("' + K.src + '")'; };
      pre.src = K.src;
    }
    /* a nagyított kép a renderelt kép tényleges object-fit és object-position szerinti dobozához igazodik
       (a transzformált, sodródó képpel együtt), így a lencse pontosan azt mutatja, ami alatta van */
    var opRaw = '50% 50%', utolsoS = 0, fit = 'cover';
    function geom() {
      var r = ter.getBoundingClientRect(), b = img.getBoundingClientRect();
      geo.s = (fit === 'contain' ? Math.min : Math.max)(b.width / K.w, b.height / K.h);
      var fx = b.width - K.w * geo.s, fy = b.height - K.h * geo.s;
      geo.ox = b.left - r.left + fx * pos(opRaw, 0, fx);
      geo.oy = b.top - r.top + fy * pos(opRaw, 1, fy);
      if (Math.abs(geo.s - utolsoS) > geo.s * .002) { utolsoS = geo.s; lk.style.backgroundSize = (K.w * geo.s * Z) + 'px ' + (K.h * geo.s * Z) + 'px'; }
      return r;
    }
    function meret() {
      kepValt();
      var cs = getComputedStyle(img); opRaw = cs.objectPosition; fit = cs.objectFit;
      var r = geom();
      var kicsi = Math.min(r.width, r.height);
      R = Math.round(Math.max(66, Math.min(cfg.rmax || 150, kicsi * (mod === 'm' ? (cfg.rkm || .2) : (cfg.rk || .13)))));
      /* a nagyítás nem mehet a forrás natív felbontása fölé (különben a lencse homályosabb, mint a fotó) */
      Z = Math.max(cfg.zmin || 2, Math.min((mod === 'm' && cfg.zm) || cfg.z || 4, (cfg.nat || 1) / geo.s));
      Z = Math.max(cfg.zmin || 2, cfg.zmin ? Math.floor(Z * 10) / 10 : Math.floor(Z * 2) / 2);
      lencse.style.setProperty('--r', R + 'px');
      lk.style.backgroundSize = (K.w * geo.s * Z) + 'px ' + (K.h * geo.s * Z) + 'px';
      felirat();
    }
    function felirat() {
      /* a felirat csak azt a részletet nevezi meg, ami tényleg a lencsében van (egérrel vagy kitérés után is) */
      var n = cimkeAkt < 0 ? '' : ((K.nev || cfg.nev || [])[cimkeAkt] || '').toLocaleUpperCase('hu');
      var D = 2 * (R + BEZ + 1), c = D / 2, rr = R + 17;
      cimke.setAttribute('width', D); cimke.setAttribute('height', D); cimke.setAttribute('viewBox', '0 0 ' + D + ' ' + D);
      /* az alsó félköríven balról jobbra, így a betű álló és befelé néz */
      ivUt.setAttribute('d', 'M ' + (c - rr) + ' ' + c + ' A ' + rr + ' ' + rr + ' 0 0 0 ' + (c + rr) + ' ' + c);
      ivTp.textContent = n; ivTx.style.letterSpacing = ''; ivTx.style.fontSize = '';
      lencse.setAttribute('data-nagyitas', String(Z).replace('.', ','));
      /* ha a felirat hosszabb, mint a félív 80%-a, a ritkítás és a méret enged */
      try {
        var max = Math.PI * rr * .8, h = ivTx.getComputedTextLength();
        if (h > max) { ivTx.style.letterSpacing = '.06em'; h = ivTx.getComputedTextLength(); }
        if (h > max) ivTx.style.fontSize = Math.max(9, 11.5 * max / h).toFixed(1) + 'px';
      } catch (e) {}
    }
    function pontXY(i) { var p = K.p[i % K.p.length]; return { x: geo.ox + p[0] * K.w * geo.s, y: geo.oy + p[1] * K.h * geo.s }; }
    /* a lencse csak a nyitókép betöltéskor látható téglalapján belül járhat: a fejléc alatt, a hajtás fölött,
       a címkével együtt; a címke a lencse fölé kerül, ha alul nincs neki hely */
    var CIMKE = 0, PAD = 12, ALJ = 26, cimkeW = 0;
    var tiltott = [].slice.call((cfg.tiltott ? document : ter.parentNode).querySelectorAll(cfg.tiltott || '.lupe-tiltott, .ut'));
    function hatar() {
      var r = ter.getBoundingClientRect(), docTop = r.top + scrollY;
      var navH = (document.querySelector('.nav') || { offsetHeight: 0 }).offsetHeight;
      /* ragadós (sticky) vagy egymás alatti képeknél a határ a kép saját téglalapja, felül a fejléc és a morzsamenü helyével */
      if (cfg.ragad) {
        var utH = (document.querySelector('main > .ut') || { offsetHeight: 0 }).offsetHeight;
        var mt = parseFloat(getComputedStyle(ter).marginTop) || 0, fel = mt > 0 ? Math.max(0, navH + utH - mt) : 0;
        return { x0: PAD, x1: r.width - PAD, y0: (mod === 'm' ? 0 : fel) + PAD, y1: r.height - ALJ, r: r };
      }
      var ut = document.querySelector('main > .ut'); if (ut) navH = Math.max(navH, ut.getBoundingClientRect().bottom + scrollY);
      var fent = Math.max(0, navH - docTop) + PAD, lent = Math.min(r.height, innerHeight - docTop) - ALJ;
      /* maszkolt (alfába futó) sáv a kép tetején és alján: a lencse ide nem megy, különben a lencse belseje élesebb és
         világosabb, mint a körülötte elhalványuló fotó, és a peremen törés látszik. [asztali, telefonos] */
      var mi = (cfg.hmq ? matchMedia(cfg.hmq).matches : (mq && mq.matches)) ? 1 : 0;
      if (cfg.fent) fent = Math.max(fent, cfg.fent[mi] + PAD);
      if (cfg.lent) lent = Math.min(lent, r.height * (1 - cfg.lent[mi]) - PAD);
      return { x0: PAD, x1: r.width - PAD, y0: fent, y1: lent, r: r };
    }
    /* a lencse és a címke nem lóghat rá a nyitókép kártyáira, panelére (lupe-tiltott): a legkisebb elmozdítással kitér */
    function kiter(x, y, h, fel) {
      for (var k = 0; k < tiltott.length; k++) {
        var q = tiltott[k].getBoundingClientRect(); if (!q.width) continue;
        var m = +(tiltott[k].getAttribute('data-tav') || 16);
        var t = { l: q.left - h.r.left - m, r: q.right - h.r.left + m, t: q.top - h.r.top - m, b: q.bottom - h.r.top + m };
        var RR = R + BEZ, w2 = RR, bt = y - RR, bb = y + RR;
        if (x + w2 <= t.l || x - w2 >= t.r || bb <= t.t || bt >= t.b) continue;
        var j = [{ x: t.l - w2, y: y }, { x: t.r + w2, y: y }, { x: x, y: t.t - (bb - y) }, { x: x, y: t.b + (y - bt) }];
        j = j.filter(function (c) { return c.x - w2 >= h.x0 && c.x + w2 <= h.x1 && c.y - (y - bt) >= h.y0 && c.y + (bb - y) <= h.y1; });
        if (!j.length) continue;
        j.sort(function (a, c) { return (Math.abs(a.x - x) + Math.abs(a.y - y)) - (Math.abs(c.x - x) + Math.abs(c.y - y)); });
        x = j[0].x; y = j[0].y;
      }
      return { x: x, y: y };
    }
    function szorit(x, y) {
      var h = hatar(), RR = R + BEZ;
      var x0 = h.x0 + RR, x1 = h.x1 - RR; if (x1 < x0) x0 = x1 = (h.x0 + h.x1) / 2;
      x = Math.min(x1, Math.max(x0, x));
      var y0 = h.y0 + RR, y1 = h.y1 - RR;
      if (y1 < y0) y0 = y1 = (h.y0 + h.y1) / 2;
      var kt = kiter(x, Math.min(y1, Math.max(y0, y)), h, false);
      return { x: kt.x, y: kt.y };
    }
    function vonalRajz(x, y) {
      if (!vonal) return;
      var r = ter.getBoundingClientRect(), h = horgony.getBoundingClientRect();
      if (!h.width) return;
      var ax = h.left - r.left - 18, ay = h.top - r.top + h.height / 2;
      var dx = ax - x, dy = ay - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var bx = x + dx / d * (R + BEZ + 8), by = y + dy / d * (R + BEZ + 8);
      vl.setAttribute('x1', bx.toFixed(1)); vl.setAttribute('y1', by.toFixed(1)); vl.setAttribute('x2', ax.toFixed(1)); vl.setAttribute('y2', ay.toFixed(1));
      vp.setAttribute('cx', ax.toFixed(1)); vp.setAttribute('cy', ay.toFixed(1));
      vonal.style.opacity = d > R + BEZ + 40 ? '1' : '0';
    }
    function rajzol(x, y) {
      var sz = szorit(x, y); x = sz.x; y = sz.y;
      vonalRajz(x, y);
      lencse.style.setProperty('--lx', (x - R) + 'px');
      lencse.style.setProperty('--ly', (y - R) + 'px');
      lk.style.backgroundPosition = (-((x - geo.ox) * Z - R)) + 'px ' + (-((y - geo.oy) * Z - R)) + 'px';
      /* melyik megnevezett részlet van a lencse belső körén belül (a nagyított képen is látszik) */
      var leg = -1, ld = R * .85 / Z;
      for (var k = 0; k < K.p.length; k++) { var q = pontXY(k), d = Math.sqrt((q.x - x) * (q.x - x) + (q.y - y) * (q.y - y)); if (d < ld) { ld = d; leg = k; } }
      if (leg !== cimkeAkt) { cimkeAkt = leg; felirat(); }
    }
    function valaszt(i, kezzel) {
      aktiv = i; kez = false;
      gombok.forEach(function (g, k) { g.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (szoveg && cfg.szoveg) szoveg.textContent = cfg.szoveg[i];
      felirat();
      var p = pontXY(i); cel.x = p.x; cel.y = p.y;
      if (kezzel) { eger = false; utolso = performance.now(); }
      if (RM) { cur.x = cel.x; cur.y = cel.y; rajzol(cur.x, cur.y); }
      indit();
    }
    gombok.forEach(function (g, k) { g.addEventListener('click', function () { valaszt(k, true); }); });

    if (finom && !RM) {
      ter.addEventListener('pointermove', function (e) {
        if (e.target.closest && e.target.closest('a, button, .lupe-tiltott')) { if (eger) { eger = false; valaszt(aktiv); } return; }
        var r = ter.getBoundingClientRect();
        cel.x = e.clientX - r.left; cel.y = e.clientY - r.top; eger = true; utolso = performance.now(); indit();
      });
      ter.addEventListener('pointerleave', function () { eger = false; valaszt(aktiv); });
    } else if (!RM) {
      ter.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' || (e.target.closest && e.target.closest('a, button'))) return;
        var r = ter.getBoundingClientRect();
        cel.x = e.clientX - r.left; cel.y = e.clientY - r.top; kez = true; utolso = performance.now() + 4000; indit();
      });
    }

    /* data-alszik: takart réteg (például a Becslés lépés-színpadán a nem aktív kép), a rAF áll; lupe:ebred indítja újra */
    function lep(t) {
      fut = false;
      if (!lathato || RM || ter.hasAttribute('data-alszik')) return;
      var most = performance.now(), s = (t - t0) / 1000;
      if (!eger && most - utolso > 5600) { utolso = most; valaszt((aktiv + 1) % K.p.length); }
      /* sodródás és lámpa: lassú, alig látható, transform */
      if (mozgo) mozgo.style.transform = 'translate3d(' + (Math.sin(s * .11) * 7).toFixed(2) + 'px,' + (Math.cos(s * .09) * 5).toFixed(2) + 'px,0) scale(1.035)';
      if (feny) feny.style.transform = 'translate3d(' + (Math.sin(s * .07) * 9).toFixed(2) + '%,' + (Math.cos(s * .05) * 6).toFixed(2) + '%,0)';
      geom();
      if (!eger && !kez) { var pc = pontXY(aktiv); cel.x = pc.x; cel.y = pc.y; }
      var k = eger ? .18 : .05;
      cur.x += (cel.x - cur.x) * k; cur.y += (cel.y - cur.y) * k;
      var lx = cur.x, ly = cur.y;
      if (!eger) { lx += Math.sin(s * .8) * 3; ly += Math.cos(s * .6) * 2.5; }
      rajzol(lx, ly);
      indit();
    }
    function indit() { if (!fut && !RM && lathato && betoltve && !ter.hasAttribute('data-alszik')) { fut = true; requestAnimationFrame(lep); } }
    ter.addEventListener('lupe:ebred', function () { if (betoltve) { meret(); var p = pontXY(aktiv); cel.x = p.x; cel.y = p.y; } indit(); });

    function start() {
      if (betoltve) return;
      betoltve = true;
      if (mozgo && !RM) mozgo.style.transform = 'scale(1.035)';
      meret(); valaszt(aktiv);
      var p = pontXY(aktiv); cur.x = p.x; cur.y = p.y; rajzol(cur.x, cur.y);
      lencse.classList.add('be');
      utolso = performance.now(); indit();
    }
    if (img.complete && img.naturalWidth) start(); else img.addEventListener('load', start, { once: true });
    setTimeout(start, 2500);
    addEventListener('resize', function () { meret(); valaszt(aktiv); if (RM) rajzol(cel.x, cel.y); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { lathato = es[0].isIntersecting; indit(); }).observe(ter);
    }
    document.addEventListener('visibilitychange', function () { lathato = !document.hidden; indit(); });
  }
  document.querySelectorAll('[data-lupe]').forEach(init);
})();
