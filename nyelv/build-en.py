# -*- coding: utf-8 -*-
"""Arany Régiség Center: az angol oldalak (en/) generálása a 14 magyar oldalból.

Futtatás a weboldal mappájából (minden magyar módosítás után újra):
    python nyelv/build-en.py              # en/*.html + sitemap.xml + nyelvváltó és hreflang a HU oldalakon
    python nyelv/build-en.py --kivonat    # csak a hiányzó fordítások listája (nyelv/hianyzo.json), nem ír oldalt

Mit csinál:
  1. A magyar oldal látható szövegét (szöveg-csomópontok, title, meta description, og, alt, aria-label, title,
     placeholder, data-hiba, űrlap-értékek, a lupe JSON nev és szoveg mezője, JSON-LD nevek és válaszok)
     a nyelv/en.json szótárból cseréli. A kulcs a magyar szöveg szóköz-normalizálva, a számok és dátumok
     helyén {0}, {1} jelölővel; így egy napi árváltozás nem töri el a fordítást.
  2. Ha egy magyar szöveghez nincs fordítás, NEM ír semmit, hanem hibával áll le és a hiányzókat
     a nyelv/hianyzo.json fájlba teszi. Így nem marad csendben magyar szöveg az angol oldalon.
  3. Számok: 19 300 helyett 19,300 (angol ezres-tagolás), 1,31% helyett 1.31%; dátum: 13 November 2026.
  4. Fej: lang="en", canonical és og:url az angol címre, og:locale en_GB, hreflang hu, en, x-default
     minden HU és EN oldalon (az x-default a magyar), JSON-LD WebPage inLanguage "en".
  5. Nyelvváltó: HU oldalon az EN link az angol párra, EN oldalon a HU link a magyar párra mutat.
  6. Relatív utak: az en/ oldal a gyökér assets/ mappáját használja (../assets/), nincs másolat.
  7. sitemap.xml: mind a 28 indexelhető cím xhtml:link alternatívákkal (a 404 kimarad).
"""
import io, os, re, sys, json

GYOKER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SZOTAR = os.path.join(GYOKER, "nyelv", "en.json")
HIANYZO = os.path.join(GYOKER, "nyelv", "hianyzo.json")
SITE = "https://aranyregisegcenter.hu"
OLDALAK = ["index", "arany", "ezust", "platina-palladium", "orak", "regisegek", "ermek", "bunda", "markas-ekszerek",
           "becsles", "rolunk", "kapcsolat", "impresszum", "adatvedelem", "404"]

HONAP = ["január", "február", "március", "április", "május", "június", "július", "augusztus",
         "szeptember", "október", "november", "december"]
HO_ROVID = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."]
EN_HONAP = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
            "October", "November", "December"]
EN_ROVID = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

BETU = re.compile(r"[A-Za-zÀ-ž]")
NBSP = "\u00a0"
IRANYADO = "This English text is a translation for your convenience. If it differs from the Hungarian version, the Hungarian version prevails."

# ---------------------------------------------------------------- tiszta cím, nyelvpár

def tiszta(oldal, nyelv):
    if oldal == "index":
        return SITE + ("/en/" if nyelv == "en" else "/")
    return SITE + ("/en/" if nyelv == "en" else "/") + oldal


def hreflang_blokk(oldal):
    return ("<!--hreflang-->\n"
            f'<link rel="alternate" hreflang="hu" href="{tiszta(oldal, "hu")}">\n'
            f'<link rel="alternate" hreflang="en" href="{tiszta(oldal, "en")}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{tiszta(oldal, "hu")}">\n'
            "<!--/hreflang-->")


def nyelvvalto(oldal, nyelv):
    f = oldal + ".html"
    if nyelv == "hu":
        return ('<div class="nyelv" role="group" aria-label="Nyelv">'
                f'<a href="{f}" lang="hu" hreflang="hu" aria-current="true">HU</a>'
                '<span class="nyelv__per" aria-hidden="true">/</span>'
                f'<a class="nyelv__en" href="en/{f}" lang="en" hreflang="en" title="English">EN</a></div>')
    return ('<div class="nyelv" role="group" aria-label="Language">'
            f'<a href="../{f}" lang="hu" hreflang="hu" title="Magyar">HU</a>'
            '<span class="nyelv__per" aria-hidden="true">/</span>'
            f'<a class="nyelv__en" href="{f}" lang="en" hreflang="en" aria-current="true">EN</a></div>')


NYELV_RE = re.compile(r'<div class="nyelv" role="group" aria-label="[^"]*">.*?</div>', re.S)
HREF_RE = re.compile(r"<!--hreflang-->.*?<!--/hreflang-->", re.S)


def hu_fej(html, oldal):
    """A magyar oldalon csak a nyelvváltó és a hreflang-blokk változik (idempotens)."""
    html, n = NYELV_RE.subn(lambda m: nyelvvalto(oldal, "hu"), html)
    if n != 1:
        sys.exit(f"HIBA: {oldal}.html nyelvváltó-blokk {n} db")
    if oldal != "404":
        if HREF_RE.search(html):
            html = HREF_RE.sub(lambda m: hreflang_blokk(oldal), html)
        else:
            html = re.sub(r'(<link rel="canonical" href="[^"]*">)', lambda m: m.group(1) + "\n" + hreflang_blokk(oldal), html, count=1)
    return html

# ---------------------------------------------------------------- normalizálás és sablon


def norm(s):
    s = s.replace("&nbsp;", " ").replace(NBSP, " ").replace("\u202f", " ")
    return re.sub(r"\s+", " ", s).strip()


TAG_SZOKOZ = r"(?:&nbsp;|\u00a0|\u202f)"
ELEM = re.compile(
    r"(?P<dh>(?P<e1>\d{4})\. (?P<h1>" + "|".join(HONAP) + r") (?P<n1>\d{1,2})\.)"
    r"|(?P<dr>(?P<e2>\d{4})\. (?P<h2>" + "|".join(re.escape(h) for h in HO_ROVID) + r") (?P<n2>\d{1,2})\.)"
    r"|(?P<sz>\d+(?:" + TAG_SZOKOZ + r"\d{3})+(?!\d)|\d{1,3}(?: \d{3})+(?=-| Ft)|\d+,\d+|\d+)")


def sablon(nyers):
    """nyers magyar szöveg -> (kulcs, értékek). Dátum és szám helyén {0}, {1}... a szövegbeli sorrendben;
    az érték már angol formában (13 November 2026, 19,300, 1.31)."""
    ertek = []

    def cs(m):
        if m.group("dh"):
            v = f"{int(m.group('n1'))} {EN_HONAP[HONAP.index(m.group('h1'))]} {m.group('e1')}"
        elif m.group("dr"):
            v = f"{int(m.group('n2'))} {EN_ROVID[HO_ROVID.index(m.group('h2'))]} {m.group('e2')}"
        else:
            t = m.group("sz")
            v = t.replace(",", ".") if "," in t else re.sub(TAG_SZOKOZ + "| ", ",", t)
        ertek.append(v)
        return "{%d}" % (len(ertek) - 1)

    return norm(ELEM.sub(cs, nyers)), ertek


class Fordito:
    def __init__(self, szotar):
        self.sz = szotar
        self.hiany = {}
        self.hasznalt = set()

    def __call__(self, nyers, hol, html_kimenet=True):
        if not BETU.search(nyers.replace("&nbsp;", " ")):
            return nyers
        kulcs, ertek = sablon(nyers)
        oldal_kulcs = hol.replace(".html", "") + "|" + kulcs
        if oldal_kulcs in self.sz:
            kulcs = oldal_kulcs
        elif kulcs not in self.sz:
            self.hiany.setdefault(kulcs, set()).add(hol)
            return nyers
        self.hasznalt.add(kulcs)
        en = self.sz[kulcs]
        for i, v in enumerate(ertek):
            en = en.replace("{%d}" % i, v)
        if re.search(r"\{\d+\}", en):
            sys.exit(f"HIBA: a fordításban több jelölő van, mint a magyarban: {kulcs!r}")
        if html_kimenet:
            # a záró rövid szó ne maradjon egyedül (ugyanaz a szokás, mint a magyar &nbsp;)
            en = en.replace("&", "&amp;").replace("&amp;nbsp;", "&nbsp;").replace("&amp;amp;", "&amp;")
        return en

# ---------------------------------------------------------------- HTML-bejárás

TOKEN = re.compile(r"<!--.*?-->|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<(?:[^>\"']|\"[^\"]*\"|'[^']*')+>", re.S)
ATTR = re.compile(r'(\s)(alt|title|aria-label|placeholder|data-hiba|value)="([^"]*)"')
META_SZOVEG = re.compile(r'<meta (?:name="description"|property="og:(?:title|description)")')
CSAK_ERTEK = re.compile(r"<(?:option|input)\b")


def html_ki(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("&amp;nbsp;", "&nbsp;")


def html_be(s):
    return s.replace("&quot;", '"').replace("&amp;", "&").replace("&#39;", "'")


def tag_fordit(tag, F, hol):
    if tag.startswith("</") or tag.startswith("<!"):
        return tag
    if META_SZOVEG.match(tag):
        return re.sub(r'content="([^"]*)"', lambda m: 'content="' + html_ki(F(html_be(m.group(1)), hol, False)) + '"', tag)

    def a(m):
        nev, ert = m.group(2), m.group(3)
        if nev == "value" and not CSAK_ERTEK.match(tag):
            return m.group(0)
        if nev == "title" and ert in ("WhatsApp", "Viber", "E-mail"):
            return m.group(0) if ert != "E-mail" else m.group(1) + 'title="Email"'
        return m.group(1) + nev + '="' + html_ki(F(html_be(ert), hol, False)) + '"'

    tag = ATTR.sub(a, tag)
    if "data-lupe='" in tag:
        tag = re.sub(r"data-lupe='([^']*)'", lambda m: "data-lupe='" + lupe_fordit(m.group(1), F, hol) + "'", tag)
    return tag


def lupe_fordit(s, F, hol):
    j = json.loads(html_be(s))

    def lista(x):
        return [F(v, hol, False) for v in x]

    for k in ("nev", "szoveg"):
        if k in j:
            j[k] = lista(j[k])
    for k in ("d", "m"):
        if isinstance(j.get(k), dict):
            for kk in ("nev", "szoveg"):
                if kk in j[k]:
                    j[k][kk] = lista(j[k][kk])
    return json.dumps(j, ensure_ascii=False, separators=(",", ":")).replace("&", "&amp;").replace("'", "&#39;")


def ld_fordit(szoveg, F, hol, oldal):
    j = json.loads(szoveg)
    graf = j.get("@graph", [])

    def bejar(x):
        if isinstance(x, dict):
            for k, v in list(x.items()):
                if k in ("name", "text", "description") and isinstance(v, str):
                    x[k] = F(v, hol, False)
                elif k == "item" and isinstance(v, str) and v.startswith(SITE):
                    ut = v[len(SITE):].strip("/")
                    x[k] = tiszta(ut or "index", "en")
                elif k == "inLanguage":
                    x[k] = ["hu", "en"] if x.get("@type") == "WebSite" else "en"
                else:
                    bejar(v)
        elif isinstance(x, list):
            for v in x:
                bejar(v)

    bejar(graf)
    if oldal != "404":
        graf.append({"@type": "WebPage", "@id": tiszta(oldal, "en") + "#oldal", "url": tiszta(oldal, "en"),
                     "inLanguage": "en", "isPartOf": {"@id": SITE + "/#web"}, "about": {"@id": SITE + "/#uzlet"}})
    return json.dumps(j, ensure_ascii=False, separators=(",", ":"))


def szoveg_fordit(t, F, hol):
    if not t.strip():
        return t
    if not BETU.search(t.replace("&nbsp;", " ")):
        # csak szám (0,1, 999,9, 1,31%): angol tizedespont; az ezres-tagolás (3 jegy) nem változik
        return re.sub(r"(?<![\d,])(\d+),(\d{1,2})(?![\d,])", r"\1.\2", t)
    ele = t[: len(t) - len(t.lstrip())]
    vege = t[len(t.rstrip()):]
    return ele + F(html_be(t.strip()), hol, True) + vege


def en_oldal(hu, oldal, F):
    hol = oldal + ".html"
    hu = NYELV_RE.sub("<!--NYELVVALTO-->", hu)
    ki, poz = [], 0
    for m in TOKEN.finditer(hu):
        ki.append(szoveg_fordit(hu[poz:m.start()], F, hol))
        tok = m.group(0)
        if tok.startswith("<script") and 'application/ld+json' in tok[:60]:
            nyit = tok[: tok.index(">") + 1]
            ki.append(nyit + ld_fordit(tok[len(nyit):-9], F, hol, oldal) + "</script>")
        elif tok.startswith("<script") or tok.startswith("<style") or tok.startswith("<!--"):
            ki.append(tok)
        else:
            ki.append(tag_fordit(tok, F, hol))
        poz = m.end()
    ki.append(szoveg_fordit(hu[poz:], F, hol))
    html = "".join(ki)

    # fej
    html = html.replace('<html lang="hu"', '<html lang="en"', 1)
    html = html.replace('<meta property="og:locale" content="hu_HU">',
                        '<meta property="og:locale" content="en_GB">\n<meta property="og:locale:alternate" content="hu_HU">', 1)
    html = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{tiszta(oldal, "en")}">', html, count=1)
    if oldal != "404":
        html = html.replace('<meta property="og:type"', f'<meta property="og:url" content="{tiszta(oldal, "en")}">\n<meta property="og:type"', 1)
    html = html.replace("<!--NYELVVALTO-->", nyelvvalto(oldal, "en"), 1)
    # telefonszám nemzetközi alakban, nyitvatartás órával (10:00-17:00), angol olvasónak egyértelműbb
    html = html.replace("06 20 620 1377", "+36 20 620 1377").replace("06&nbsp;20&nbsp;620&nbsp;1377", "+36&nbsp;20&nbsp;620&nbsp;1377")
    html = re.sub(r"<td>(\d{1,2})-(\d{1,2})</td>", r"<td>\1:00-\2:00</td>", html)
    # Órák nyitókép: a nagy „Órák” szó a számlap-képpel egy kompozíció (a számlap az Ó betű), pixelre marad;
    # az angol címet a képernyőolvasó kapja (sr: Watches), a díszszó lang="hu" jelölést kap
    if oldal == "orak":
        for a, b in (('<span class="o-betu" aria-hidden="true">', '<span class="o-betu" aria-hidden="true" lang="hu">'),
                     ('<span aria-hidden="true">rák</span>', '<span aria-hidden="true" lang="hu">rák</span>')):
            if html.count(a) != 1:
                sys.exit("HIBA: az Órák nyitókép szerkezete változott: " + a)
            html = html.replace(a, b)
    # jogi oldalak: a magyar változat az irányadó
    if oldal in ("impresszum", "adatvedelem"):
        jel = '<aside class="jog__oldal">'
        if html.count(jel) != 1:
            sys.exit(f"HIBA: {oldal} jog__oldal hiányzik")
        html = html.replace(jel, jel + "\n      <p>" + IRANYADO + "</p>", 1)
    # szkriptek nyelve (arfolyam.js, grafikon.js, kapcsolat.js a <html lang> szerint vált)
    # relatív utak: assets/ -> ../assets/
    html = re.sub(r'(?<=["\'(\s,])assets/', "../assets/", html)
    return html

# ---------------------------------------------------------------- sitemap


def sitemap():
    sor = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for o in OLDALAK:
        if o == "404":
            continue
        for l in ("hu", "en"):
            sor.append("  <url>")
            sor.append(f"    <loc>{tiszta(o, l)}</loc>")
            for h, ll in (("hu", "hu"), ("en", "en"), ("x-default", "hu")):
                sor.append(f'    <xhtml:link rel="alternate" hreflang="{h}" href="{tiszta(o, ll)}"/>')
            sor.append("  </url>")
    sor.append("</urlset>")
    return "\n".join(sor) + "\n"


def olvas(ut):
    return io.open(ut, encoding="utf-8", newline="").read().replace("\r\n", "\n")


def ir(ut, s):
    os.makedirs(os.path.dirname(ut), exist_ok=True)
    regi = olvas(ut) if os.path.exists(ut) else None
    if regi == s:
        return False
    with io.open(ut, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(s)
    return True


if __name__ == "__main__":
    kivonat = "--kivonat" in sys.argv
    szotar = json.load(io.open(SZOTAR, encoding="utf-8")) if os.path.exists(SZOTAR) else {}
    szotar = {norm(k): v for k, v in szotar.items() if not k.startswith("//")}
    F = Fordito(szotar)
    kesz = {}
    for o in OLDALAK:
        hu = olvas(os.path.join(GYOKER, o + ".html"))
        hu2 = hu_fej(hu, o)
        kesz[o] = (hu2, en_oldal(hu2, o, F))
    if F.hiany:
        json.dump({k: sorted(v) for k, v in sorted(F.hiany.items())}, io.open(HIANYZO, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print(f"{'KIVONAT' if kivonat else 'HIBA'}: {len(F.hiany)} magyar szöveghez nincs fordítás, lista: nyelv/hianyzo.json")
        sys.exit(0 if kivonat else 1)
    if os.path.exists(HIANYZO):
        os.remove(HIANYZO)
    if kivonat:
        print("Minden szöveg fordítva.")
        sys.exit(0)
    fol = sorted(set(szotar) - F.hasznalt)
    valt = 0
    for o, (hu2, en) in kesz.items():
        valt += ir(os.path.join(GYOKER, o + ".html"), hu2)
        valt += ir(os.path.join(GYOKER, "en", o + ".html"), en)
    valt += ir(os.path.join(GYOKER, "sitemap.xml"), sitemap())
    print(f"Kész: {len(OLDALAK)} HU + {len(OLDALAK)} EN oldal, sitemap; {valt} fájl változott.")
    if fol:
        print(f"Megjegyzés: {len(fol)} szótár-bejegyzést egyik oldal sem használ (régi szöveg), lásd a szótárt.")
