#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tarlaal — statik site tutarlılık ve bağlantı kontrolü (bağımlılıksız).

Kullanım:  python3 tools/check.py [--no-data] [--warnings-as-errors] [--quiet]

Kökteki her *.html için:
  - <html lang="tr">, charset, viewport, <main id="icerik">
  - tek <h1>
  - <!-- @header --> / <!-- @footer --> blokları var ve partials/ ile birebir aynı
  - <title> (biçim: "… | Tarlaal"), meta description (50–170; DESIGN 140–160 önerir)
  - canonical, favicon, assets/css/style.css, Google Fonts linki
  - script sırası: config.js → data.js → main.js (→ sayfa.js)
  - tüm yerel href/src/poster/onerror-fallback hedefleri diskte mevcut
    (http/https/mailto/tel/data:/javascript: hariç)
  - sayfa içi ve çapraz çapalar: href="#frag" ve href="sayfa.html#frag" için hedef sayfada
    id="frag" var mı (tüm sayfalar tarandıktan sonra; JS ile üretilen id'ler görülmez)
  - href="ilan.html?id=X" → X data.js'deki ilan id'lerinden biri mi (HATA);
    href="ilanlar.html?il=Y" → Y bolgeler listesindeki bir il mi (UYARI). --no-data ile atlanır.
  - her <img> için alt; form[data-form] alanlarında <label for> ya da sarmalayan <label>
Ek olarak:
  - assets/js/data.js: node ile yüklenir; ilan sayısı, benzersiz id, zorunlu alanlar,
    sabit listeler (tur/imar/tapu/durum), foto ID'leri DESIGN §2.1 havuzunda, blog.sayfa dosyaları,
    eklenme/tarih alanları gerçek ISO tarih (2026-13-45 gibi değerler reddedilir).
  - sitemap.xml: XML iyi biçimli (xml.etree ile ayrıştırılır; kaçışsız '&' hata verir), kök
    etiket sitemaps.org urlset; her <loc> gerçek bir sayfaya gidiyor; kökteki sayfalar sitemap'te var;
    sayfaların canonical adresi sitemap'teki <loc> ile birebir eşleşiyor (uyarı); lastmod gerçek tarih.
  - robots.txt: "User-agent: *", "Allow: /" (ya da kök için Disallow yok) ve "Sitemap:" satırı.
Nokta ile başlayan gizli dosyalar (.shot-wrap-*.html, .probe-*.html — shot.sh/probe.sh'nin
geçici kopyaları) taranmaz.
Bulgular "dosya:satır: HATA|UYARI: mesaj" biçiminde yazılır; hata varsa çıkış kodu 1,
bilinmeyen bayrakta kullanım satırı + çıkış kodu 2.
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PARTIALS_DIR = ROOT / "partials"
DATA_JS = ROOT / "assets" / "js" / "data.js"
SITEMAP = ROOT / "sitemap.xml"
SITE_URL = "https://tarlaal.com"

# DESIGN.md §2.1 — doğrulanmış Unsplash foto ID havuzu
FOTO_HAVUZU = {
    "1500382017468-9049fed747ef", "1500937386664-56d1dfef3854", "1472214103451-9374bd1c798e",
    "1444858291040-58f756a3bdd6", "1470071459604-3b5ec3a7fe05", "1506744038136-46273834b3fb",
    "1469474968028-56623f02e42e", "1465146344425-f00d5f5c8f07", "1475924156734-496f6cac6ec1",
    "1501785888041-af3ef285b470", "1502082553048-f009c37129b9", "1518495973542-4542c06a5843",
    "1507525428034-b723cf961d3e", "1495107334309-fcf20504a5ab", "1476231682828-37e571bc172f",
    "1533460004989-cef01064af7e", "1501004318641-b39e6451bec6", "1523348837708-15d4a09cfac2",
    "1542601906990-b4d3fb778b09", "1416879595882-3373a0480b5b", "1466692476868-aef1dfb1e735",
    "1464226184884-fa280b87c399", "1500651230702-0e2d8a49d4ad", "1441974231531-c6227db76b6e",
    "1448375240586-882707db888b", "1426604966848-d7adac402bff", "1510798831971-661eb04b3739",
    "1504280390367-361c6d9f38f4",
}
FOTO_GECERSIZ = {"1473448912268-2022ce9509d6", "1455218873455-21062cc9c0ea"}

TURLER = {"tarla", "arsa", "arazi", "bahce"}
IMARLAR = {"Tarla vasıflı", "Konut imarlı", "Ticari imarlı", "Bağ-bahçe", "Köy yerleşik alanı", "Sanayi imarlı"}
TAPULAR = {"Müstakil tapu", "Hisseli tapu"}
DURUMLAR = {"satista", "rezerve", "satildi"}
SSS_KATEGORI = {"Satın alma", "Satış", "Tapu & İmar", "Ödeme"}

SKIP_SCHEMES = ("http:", "https:", "mailto:", "tel:", "#", "data:", "javascript:", "//", "sms:", "whatsapp:")
SITEMAP_HARIC = {"ilan.html", "404.html"}
CANONICALS = {}  # sayfa adı → <link rel="canonical"> href (sitemap karşılaştırması için)
ID_SET = {}      # sayfa adı → sayfadaki id="…" kümesi (çapa kontrolü için)
ANCHOR_REFS = []  # (kaynak sayfa, satır, hedef sayfa, fragment, ham href)
QUERY_REFS = []   # (kaynak sayfa, satır, hedef sayfa, {param: değer}, ham href)
DATA_IDS = None   # kontrol_data() sonrası: ilan id kümesi (None → veri kontrolü yapılmadı)
DATA_ILLER = None  # kontrol_data() sonrası: bolgeler il adları
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

QUIET = False


class Rapor:
    def __init__(self):
        self.hatalar = []
        self.uyarilar = []
        self.bilgiler = []

    def hata(self, dosya, satir, mesaj):
        self.hatalar.append((dosya, satir, mesaj))

    def uyari(self, dosya, satir, mesaj):
        self.uyarilar.append((dosya, satir, mesaj))

    def bilgi(self, mesaj):
        self.bilgiler.append(mesaj)


R = Rapor()


def rel(p):
    try:
        return str(Path(p).resolve().relative_to(ROOT))
    except ValueError:
        return str(p)


def satir_no(text, pos):
    return text.count("\n", 0, pos) + 1


def iso_tarih(deger):
    """'YYYY-AA-GG' (isteğe bağlı saat eki) gerçek bir takvim tarihi mi? Döndür: hata mesajı | None."""
    if not isinstance(deger, str) or not re.match(r"^\d{4}-\d{2}-\d{2}(?:$|T)", deger):
        return "ISO tarih (YYYY-AA-GG) olmalı: %r" % (deger,)
    try:
        datetime.date.fromisoformat(deger[:10])
    except ValueError:
        return "geçersiz takvim tarihi: %s" % deger
    return None


def attr(tag, name):
    """Bir etiket metninden name="…" / name='…' / name=deger değerini döndürür (yoksa None)."""
    m = re.search(r'(?:^|\s)%s\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'>]+))' % re.escape(name), tag, re.I)
    if not m:
        return None
    return next((g for g in m.groups() if g is not None), "")


def has_attr(tag, name):
    return re.search(r'(?:^|\s)%s(?:\s*=|\s|/|>|$)' % re.escape(name), tag, re.I) is not None


TAG_RE = re.compile(r"<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>", re.S)


def strip_scripts_styles(text):
    """Inline <script>/<style> içeriğini aynı uzunlukta boşlukla değiştirir (satır numaraları korunur)."""
    def blank(m):
        inner = m.group(2)
        return m.group(1) + re.sub(r"[^\n]", " ", inner) + m.group(3)
    text = re.sub(r"(<script\b[^>]*>)(.*?)(</script>)", blank, text, flags=re.S | re.I)
    text = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)", blank, text, flags=re.S | re.I)
    text = re.sub(r"(<!--)(.*?)(-->)", blank, text, flags=re.S)
    return text


def yerel_hedef(url):
    """Yerel dosya yolu mu? Döndür: temizlenmiş yol | None (dış/özel şema ya da boş)."""
    u = (url or "").strip()
    if not u:
        return None
    low = u.lower()
    if low.startswith(SKIP_SCHEMES):
        return None
    u = u.split("#", 1)[0].split("?", 1)[0]
    if not u:
        return None
    return u


def kontrol_html(page, partials):
    name = page.name
    raw = page.read_text(encoding="utf-8")
    text = strip_scripts_styles(raw)
    tags = [(m.start(), m.group(1).lower(), m.group(0)) for m in TAG_RE.finditer(text)]

    def first(tagname, pred=None):
        for pos, tn, tag in tags:
            if tn == tagname and (pred is None or pred(tag)):
                return pos, tag
        return None, None

    # <html lang="tr">
    pos, html_tag = first("html")
    if html_tag is None:
        R.hata(name, 1, "<html> etiketi yok")
    elif (attr(html_tag, "lang") or "").lower() != "tr":
        R.hata(name, satir_no(text, pos), '<html lang="tr"> olmalı')
    if not re.search(r"<!doctype\s+html", raw, re.I):
        R.hata(name, 1, "<!doctype html> yok")

    # head temel
    if first("meta", lambda t: has_attr(t, "charset"))[1] is None:
        R.hata(name, 1, '<meta charset="utf-8"> yok')
    if first("meta", lambda t: (attr(t, "name") or "").lower() == "viewport")[1] is None:
        R.hata(name, 1, '<meta name="viewport"> yok')

    # title
    m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
    if not m:
        R.hata(name, 1, "<title> yok")
    else:
        t = re.sub(r"\s+", " ", m.group(1)).strip()
        ln = satir_no(text, m.start())
        if not t:
            R.hata(name, ln, "<title> boş")
        elif not t.endswith("| Tarlaal") and name != "404.html":
            R.uyari(name, ln, '<title> biçimi "Sayfa | Tarlaal" olmalı: "%s"' % t)
        elif len(t) > 70:
            R.uyari(name, ln, "<title> %d karakter (60–70 üstü arama sonuçlarında kesilir)" % len(t))

    # description
    pos, d = first("meta", lambda t: (attr(t, "name") or "").lower() == "description")
    if d is None:
        R.hata(name, 1, '<meta name="description"> yok')
    else:
        c = (attr(d, "content") or "").strip()
        ln = satir_no(text, pos)
        if not c:
            R.hata(name, ln, "meta description boş")
        elif not (50 <= len(c) <= 170):
            R.hata(name, ln, "meta description %d karakter; 50–170 arası olmalı" % len(c))
        elif not (140 <= len(c) <= 160):
            R.uyari(name, ln, "meta description %d karakter; DESIGN 140–160 öneriyor" % len(c))

    # canonical
    pos, can = first("link", lambda t: (attr(t, "rel") or "").lower() == "canonical")
    if can is None:
        R.hata(name, 1, '<link rel="canonical"> yok')
    else:
        href = attr(can, "href") or ""
        ln = satir_no(text, pos)
        beklenen = SITE_URL + "/" + ("" if name == "index.html" else name)
        if not href.startswith(SITE_URL + "/"):
            R.hata(name, ln, "canonical %s ile başlamalı: %s" % (SITE_URL, href))
        elif href not in (beklenen, SITE_URL + "/" + name):
            R.uyari(name, ln, "canonical beklenen %s, bulunan %s" % (beklenen, href))
        CANONICALS[name] = (ln, href)

    # favicon
    if first("link", lambda t: "icon" in (attr(t, "rel") or "").lower().split())[1] is None:
        R.hata(name, 1, '<link rel="icon" href="assets/img/favicon.svg"> yok')

    # style.css
    if first("link", lambda t: (attr(t, "rel") or "").lower() == "stylesheet"
             and (attr(t, "href") or "").split("?")[0].endswith("assets/css/style.css"))[1] is None:
        R.hata(name, 1, "assets/css/style.css bağlantısı yok")
    if first("link", lambda t: "fonts.googleapis.com/css2" in (attr(t, "href") or ""))[1] is None:
        R.uyari(name, 1, "Google Fonts (fonts.googleapis.com/css2) linki yok")

    # og
    for og in ("og:title", "og:description", "og:type", "og:url", "og:image"):
        if first("meta", lambda t, og=og: (attr(t, "property") or "").lower() == og)[1] is None:
            R.uyari(name, 1, "Open Graph etiketi eksik: %s" % og)

    # main#icerik
    if first("main", lambda t: attr(t, "id") == "icerik")[1] is None:
        R.hata(name, 1, '<main id="icerik"> yok')

    # tek h1
    h1s = [pos for pos, tn, tag in tags if tn == "h1"]
    if len(h1s) != 1:
        R.hata(name, satir_no(text, h1s[1]) if len(h1s) > 1 else 1,
               "%d adet <h1> var; tam 1 olmalı" % len(h1s))

    # header / footer blokları
    for blok in ("header", "footer"):
        rx = re.compile(r"<!-- @%s -->.*?<!-- @/%s -->" % (blok, blok), re.S)
        m = rx.search(raw)
        if not m:
            R.hata(name, 1, "<!-- @%s --> … <!-- @/%s --> bloğu yok" % (blok, blok))
            continue
        canon = partials.get(blok)
        if canon is None:
            continue
        if m.group(0).strip() != canon.strip():
            R.hata(name, satir_no(raw, m.start()),
                   "@%s bloğu partials/%s.html ile aynı değil (python3 tools/sync_partials.py çalıştırın)" % (blok, blok))
        if raw.count("<!-- @%s -->" % blok) > 1:
            R.hata(name, 1, "@%s bloğu birden fazla kez var" % blok)

    # script sırası (inline <script> içerikleri silindi ama etiketler duruyor)
    scripts = [(pos, attr(tag, "src") or "") for pos, tn, tag in tags if tn == "script"]
    srcs = [s for _, s in scripts]
    def idx(suffix):
        for i, s in enumerate(srcs):
            if s.split("?")[0].endswith(suffix):
                return i
        return None
    ic, idt, im = idx("assets/js/config.js"), idx("assets/js/data.js"), idx("assets/js/main.js")
    if None in (ic, idt, im):
        eksik = [n for n, i in (("config.js", ic), ("data.js", idt), ("main.js", im)) if i is None]
        R.hata(name, 1, "script eksik: %s (sıra: config.js → data.js → main.js)" % ", ".join(eksik))
    elif not (ic < idt < im):
        R.hata(name, satir_no(text, scripts[ic][0]), "script sırası yanlış; config.js → data.js → main.js olmalı")
    else:
        for i, (pos, s) in enumerate(scripts):
            if s and s.split("?")[0].startswith("assets/js/") and i < ic and not s.endswith("config.js"):
                R.uyari(name, satir_no(text, pos), "%s config.js'den önce yükleniyor" % s)
    # head içinde sayfa script'i olmamalı (body sonunda yüklenir)
    head_end = text.lower().find("</head>")
    for pos, s in scripts:
        if s and head_end > -1 and pos < head_end:
            R.uyari(name, satir_no(text, pos), "<head> içinde script: %s (body sonuna taşıyın)" % s)

    # sayfadaki id'ler (çapa kontrolü tüm sayfalar tarandıktan sonra kontrol_capalar ile yapılır)
    ID_SET[name] = {attr(tag, "id") for _, _, tag in tags if attr(tag, "id")}

    # yerel bağlantı hedefleri (aynı eksik hedef sayfada birden çok yerdeyse ilk satır + adet yazılır)
    eksik_hedef = {}

    def hedef_yok(ln, mesaj, anahtar):
        if anahtar in eksik_hedef:
            eksik_hedef[anahtar][1] += 1
        else:
            eksik_hedef[anahtar] = [ln, 1, mesaj]

    for pos, tn, tag in tags:
        ln = satir_no(text, pos)
        for a in ("href", "src", "poster", "data-src"):
            v = attr(tag, a)
            if v is None:
                continue
            if tn == "link" and a == "href" and (attr(tag, "rel") or "").lower() in ("canonical", "preconnect", "dns-prefetch", "alternate"):
                continue
            if a == "href" and v.strip().startswith("#"):
                frag = v.strip()[1:]
                if frag and frag != "!":
                    ANCHOR_REFS.append((name, ln, name, unquote(frag), v))
                continue
            hedef = yerel_hedef(v)
            if hedef is None:
                continue
            if a == "href" and not hedef.startswith("/"):
                parca = urlsplit(v.strip())
                if parca.fragment:
                    ANCHOR_REFS.append((name, ln, hedef, unquote(parca.fragment), v))
                if parca.query and hedef in ("ilan.html", "ilanlar.html"):
                    q = {k: vs[0] for k, vs in parse_qs(parca.query, keep_blank_values=True).items()}
                    QUERY_REFS.append((name, ln, hedef, q, v))
            if hedef.startswith("/"):
                R.hata(name, ln, "%s=\"%s\" kök-mutlak yol; göreli yol kullanın" % (a, v))
                continue
            p = (page.parent / hedef)
            if not p.exists():
                hedef_yok(ln, "%s=\"%s\" hedefi bulunamadı" % (a, v.split("?")[0].split("#")[0]), (a, hedef))
            elif p.is_dir():
                R.uyari(name, ln, "%s=\"%s\" bir klasöre gidiyor" % (a, v))
        # onerror fallback yolu
        oe = attr(tag, "onerror")
        if oe:
            for fb in re.findall(r"""src\s*=\s*['"]([^'"]+)['"]""", oe):
                hedef = yerel_hedef(fb)
                if hedef and not (page.parent / hedef).exists():
                    R.hata(name, ln, "onerror fallback bulunamadı: %s" % fb)
        # srcset
        ss = attr(tag, "srcset")
        if ss:
            for cand in ss.split(","):
                u = cand.strip().split(" ")[0]
                hedef = yerel_hedef(u)
                if hedef and not (page.parent / hedef).exists():
                    R.hata(name, ln, "srcset hedefi bulunamadı: %s" % u)

    for ln, adet, mesaj in eksik_hedef.values():
        R.hata(name, ln, mesaj + ("" if adet == 1 else " (+%d yerde daha)" % (adet - 1)))

    # img alt
    for pos, tn, tag in tags:
        if tn == "img" and not has_attr(tag, "alt"):
            R.hata(name, satir_no(text, pos), "<img> alt özniteliği yok: %s" % (attr(tag, "src") or "")[:60])
        if tn == "iframe" and not has_attr(tag, "title"):
            R.uyari(name, satir_no(text, pos), "<iframe> title özniteliği yok")

    # form[data-form] asgari gereksinimler (statik HTML'de)
    for m in re.finditer(r"<form\b[^>]*\bdata-form\s*=\s*[\"']([^\"']+)[\"'][^>]*>(.*?)</form>", text, re.S | re.I):
        ln = satir_no(text, m.start())
        tip, body = m.group(1), m.group(2)
        if tip not in ("katalog", "bilgi", "satis", "iletisim"):
            R.uyari(name, ln, 'data-form="%s" bilinmeyen tip (katalog|bilgi|satis|iletisim)' % tip)
        if not re.search(r'name\s*=\s*["\']kvkk["\']', body):
            R.hata(name, ln, 'form[data-form="%s"] içinde KVKK onay kutusu (name="kvkk") yok' % tip)
        if not re.search(r'name\s*=\s*["\']website["\']', body):
            R.uyari(name, ln, 'form[data-form="%s"] içinde honeypot (name="website") yok' % tip)
        if not re.search(r'class\s*=\s*["\'][^"\']*form__status', body):
            R.uyari(name, ln, 'form[data-form="%s"] içinde .form__status yok' % tip)
        # label'sız alanlar (id'si olup label[for] olmayan)
        ids = re.findall(r"<(?:input|select|textarea)\b[^>]*\bid\s*=\s*[\"']([^\"']+)[\"']", body)
        fors = set(re.findall(r"<label\b[^>]*\bfor\s*=\s*[\"']([^\"']+)[\"']", body))
        for fid in ids:
            inp = re.search(r"<(?:input|select|textarea)\b[^>]*\bid\s*=\s*[\"']%s[\"'][^>]*>" % re.escape(fid), body)
            t = inp.group(0) if inp else ""
            if (attr(t, "type") or "").lower() in ("hidden", "submit", "button"):
                continue
            # <label>Ad <input id="…"></label> biçiminde sarmalayan label da geçerli:
            # alandan geriye doğru en yakın <label, en yakın </label>'dan sonra açılmışsa sarmalıyor.
            onceki = body[:inp.start()] if inp else ""
            sarili = inp is not None and onceki.lower().rfind("<label") > onceki.lower().rfind("</label>")
            if fid not in fors and not sarili and not has_attr(t, "aria-label") and not has_attr(t, "aria-labelledby"):
                R.uyari(name, ln, 'form alanı #%s için <label for> ya da sarmalayan <label> yok' % fid)


def kontrol_capalar():
    """href="#frag" / "sayfa.html#frag" hedeflerinin ilgili sayfada id olarak bulunduğunu doğrular."""
    gorulen = set()
    for kaynak, ln, hedef, frag, ham in ANCHOR_REFS:
        if hedef not in ID_SET:
            continue  # hedef sayfa yok ya da taranmadı; eksik dosya zaten ayrıca raporlanır
        if frag in ID_SET[hedef]:
            continue
        anahtar = (kaynak, hedef, frag)
        if anahtar in gorulen:
            continue
        gorulen.add(anahtar)
        R.hata(kaynak, ln, 'href="%s": %s içinde id="%s" yok (ölü çapa)' % (ham, hedef, frag))


def kontrol_query_refs():
    """ilan.html?id=X → X data.js'de var mı (HATA); ilanlar.html?il=Y → Y bölge listesinde mi (UYARI)."""
    if DATA_IDS is None:
        return
    gorulen = set()
    for kaynak, ln, hedef, q, ham in QUERY_REFS:
        if hedef == "ilan.html" and "id" in q:
            if q["id"] not in DATA_IDS and (kaynak, "id", q["id"]) not in gorulen:
                gorulen.add((kaynak, "id", q["id"]))
                R.hata(kaynak, ln, 'href="%s": data.js içinde %s id\'li ilan yok' % (ham, q["id"]))
        elif hedef == "ilanlar.html" and "il" in q and DATA_ILLER:
            if q["il"] not in DATA_ILLER and (kaynak, "il", q["il"]) not in gorulen:
                gorulen.add((kaynak, "il", q["il"]))
                R.uyari(kaynak, ln, 'href="%s": %r bolgeler listesinde bir il değil' % (ham, q["il"]))


def yukle_partials():
    out = {}
    for blok in ("header", "footer"):
        p = PARTIALS_DIR / ("%s.html" % blok)
        if not p.exists():
            R.hata("partials/%s.html" % blok, 1, "partial dosyası yok")
            continue
        t = p.read_text(encoding="utf-8")
        if "<!-- @%s -->" % blok not in t or "<!-- @/%s -->" % blok not in t:
            R.hata("partials/%s.html" % blok, 1, "partial @%s işaretleriyle başlayıp bitmeli" % blok)
        out[blok] = t
    return out


def node_yukle_data():
    """data.js'yi node ile sahte window içinde çalıştırır ve TARLAAL_DATA'yı JSON olarak döndürür."""
    js = r"""
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(process.argv[1],'utf8');
const win={};win.window=win;win.document={};
const sb={window:win,document:win.document,console:console};
vm.createContext(sb);
vm.runInContext(code,sb,{filename:'data.js'});
process.stdout.write(JSON.stringify(win.TARLAAL_DATA===undefined?null:win.TARLAAL_DATA));
"""
    try:
        r = subprocess.run(["node", "-e", js, str(DATA_JS)], capture_output=True, text=True, timeout=30)
    except FileNotFoundError:
        R.uyari("assets/js/data.js", 1, "node bulunamadı; data.js içerik doğrulaması atlandı")
        return None
    except subprocess.TimeoutExpired:
        R.hata("assets/js/data.js", 1, "node 30 sn içinde yanıt vermedi")
        return None
    if r.returncode != 0:
        msg = (r.stderr or "").strip().splitlines()
        R.hata("assets/js/data.js", 1, "node ile yüklenemedi: %s" % (msg[-1] if msg else "bilinmeyen hata"))
        return None
    try:
        return json.loads(r.stdout or "null")
    except ValueError:
        R.hata("assets/js/data.js", 1, "node çıktısı JSON değil")
        return None


def unsplash_id(url):
    m = re.search(r"images\.unsplash\.com/photo-([0-9]+-[0-9a-f]+)", url or "")
    return m.group(1) if m else None


def kontrol_data():
    global DATA_IDS, DATA_ILLER
    name = "assets/js/data.js"
    if not DATA_JS.exists():
        R.hata(name, 1, "dosya yok")
        return
    src = DATA_JS.read_text(encoding="utf-8")

    gorulen_id = {}

    def satir(id_):
        # aynı id birden çok kez geçiyorsa k. geçtiği satırı döndür
        k = gorulen_id.get(id_, 0)
        gorulen_id[id_] = k + 1
        ms = list(re.finditer(r"""id:\s*["']%s["']""" % re.escape(id_), src))
        return satir_no(src, ms[min(k, len(ms) - 1)].start()) if ms else 1

    data = node_yukle_data()
    if data is None:
        if "window.TARLAAL_DATA" not in src:
            R.hata(name, 1, "window.TARLAAL_DATA tanımı bulunamadı")
        return
    if not isinstance(data, dict):
        R.hata(name, 1, "window.TARLAAL_DATA bir nesne değil")
        return

    for key in ("bolgeler", "ilanlar", "danismanlar", "yorumlar", "sss", "blog"):
        if not isinstance(data.get(key), list):
            R.hata(name, 1, "TARLAAL_DATA.%s dizi değil veya yok" % key)
    ilanlar = data.get("ilanlar") if isinstance(data.get("ilanlar"), list) else []

    n = len(ilanlar)
    R.bilgi("data.js: %d ilan, %d bölge, %d danışman, %d yorum, %d SSS, %d blog" % (
        n, len(data.get("bolgeler") or []), len(data.get("danismanlar") or []),
        len(data.get("yorumlar") or []), len(data.get("sss") or []), len(data.get("blog") or [])))
    if n == 0:
        R.hata(name, 1, "hiç ilan yok")
    elif not (28 <= n <= 32):
        R.uyari(name, 1, "%d ilan; DESIGN §4 28–32 ilan öneriyor" % n)

    ids, slugs = {}, {}
    danisman_adlari = {d.get("ad") for d in (data.get("danismanlar") or []) if isinstance(d, dict)}
    iller = {b.get("il") for b in (data.get("bolgeler") or []) if isinstance(b, dict)}
    DATA_ILLER = {i for i in iller if isinstance(i, str)}
    DATA_IDS = set()
    one_cikan = 0
    for i, il in enumerate(ilanlar):
        if not isinstance(il, dict):
            R.hata(name, 1, "ilanlar[%d] nesne değil" % i)
            continue
        id_ = il.get("id")
        ln = satir(id_) if isinstance(id_, str) else 1
        ref = id_ if isinstance(id_, str) and id_ else "ilanlar[%d]" % i
        if not isinstance(id_, str) or not re.match(r"^TR-\d{4}-\d{4}$", id_):
            R.hata(name, ln, "%s: id biçimi TR-YYYY-NNNN olmalı" % ref)
        if id_ in ids:
            R.hata(name, ln, "%s: id tekrar ediyor (ilk: satır %d)" % (ref, ids[id_]))
        ids[id_] = ln
        if isinstance(id_, str) and id_:
            DATA_IDS.add(id_)
        for alan, tip in (("slug", str), ("baslik", str), ("tur", str), ("il", str), ("ilce", str),
                          ("m2", (int, float)), ("fiyat", (int, float)), ("imar", str), ("tapu", str),
                          ("durum", str), ("rozetler", list), ("ozellikler", list), ("aciklama", str),
                          ("foto", str), ("fotolar", list), ("koordinat", dict), ("eklenme", str)):
            v = il.get(alan)
            if v is None or not isinstance(v, tip) or (isinstance(v, (str, list)) and len(v) == 0 and alan != "rozetler"):
                R.hata(name, ln, "%s: zorunlu alan eksik/boş: %s" % (ref, alan))
        slug_ = il.get("slug")
        if isinstance(slug_, str):
            if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", slug_):
                R.hata(name, ln, "%s: slug yalnızca a-z, 0-9 ve tire içermeli: %s" % (ref, slug_))
            if slug_ in slugs:
                R.hata(name, ln, "%s: slug tekrar ediyor: %s" % (ref, slug_))
            slugs[slug_] = ln
        if il.get("tur") not in TURLER:
            R.hata(name, ln, "%s: tur %s değil: %r" % (ref, "|".join(sorted(TURLER)), il.get("tur")))
        if il.get("imar") not in IMARLAR:
            R.hata(name, ln, "%s: imar sabit listede değil: %r" % (ref, il.get("imar")))
        if il.get("tapu") not in TAPULAR:
            R.hata(name, ln, "%s: tapu sabit listede değil: %r" % (ref, il.get("tapu")))
        if il.get("durum") not in DURUMLAR:
            R.hata(name, ln, "%s: durum satista|rezerve|satildi değil: %r" % (ref, il.get("durum")))
        if isinstance(il.get("m2"), (int, float)) and not (100 <= il["m2"] <= 500000):
            R.uyari(name, ln, "%s: m2 olağan dışı: %s" % (ref, il["m2"]))
        if isinstance(il.get("fiyat"), (int, float)):
            if il["fiyat"] <= 0:
                R.hata(name, ln, "%s: fiyat pozitif olmalı" % ref)
            elif il["fiyat"] != int(il["fiyat"]):
                R.hata(name, ln, "%s: fiyat tam sayı olmalı" % ref)
        if iller and il.get("il") not in iller:
            R.uyari(name, ln, "%s: il bölge listesinde yok: %r" % (ref, il.get("il")))
        if isinstance(il.get("rozetler"), list) and len(il["rozetler"]) > 3:
            R.uyari(name, ln, "%s: %d rozet; en fazla 3 önerilir" % (ref, len(il["rozetler"])))
        if bool(il.get("taksit")) != ("Taksit İmkânı" in (il.get("rozetler") or [])):
            R.uyari(name, ln, "%s: taksit alanı ile 'Taksit İmkânı' rozeti uyumsuz" % ref)
        ko = il.get("koordinat")
        if isinstance(ko, dict):
            lat, lng = ko.get("lat"), ko.get("lng")
            if not (isinstance(lat, (int, float)) and isinstance(lng, (int, float))):
                R.hata(name, ln, "%s: koordinat.lat/lng sayı olmalı" % ref)
            elif not (35 <= lat <= 43 and 25 <= lng <= 45):
                R.uyari(name, ln, "%s: koordinat Türkiye dışında görünüyor (%s, %s)" % (ref, lat, lng))
        ek = il.get("eklenme")
        if isinstance(ek, str):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", ek):
                R.hata(name, ln, "%s: eklenme ISO tarih (YYYY-AA-GG) olmalı: %s" % (ref, ek))
            elif iso_tarih(ek):
                R.hata(name, ln, "%s: eklenme %s" % (ref, iso_tarih(ek)))
        # fotoğraflar
        foto, fotolar = il.get("foto"), il.get("fotolar")
        if isinstance(fotolar, list):
            if isinstance(foto, str) and fotolar and fotolar[0] != foto:
                R.hata(name, ln, "%s: fotolar[0] foto ile aynı olmalı" % ref)
            if len(fotolar) != len(set(fotolar)):
                R.uyari(name, ln, "%s: fotolar içinde tekrar var" % ref)
            if not (1 <= len(fotolar) <= 6):
                R.uyari(name, ln, "%s: %d foto; 3–4 önerilir" % (ref, len(fotolar)))
        for u in ([foto] if isinstance(foto, str) else []) + (fotolar if isinstance(fotolar, list) else []):
            if not isinstance(u, str):
                R.hata(name, ln, "%s: foto URL string değil" % ref)
                continue
            fid = unsplash_id(u)
            if fid:
                if fid in FOTO_GECERSIZ:
                    R.hata(name, ln, "%s: geçersiz (DESIGN'da yasaklı) foto ID: %s" % (ref, fid))
                elif fid not in FOTO_HAVUZU:
                    R.hata(name, ln, "%s: foto ID DESIGN §2.1 havuzunda değil: %s" % (ref, fid))
                if "auto=format" not in u or "w=" not in u:
                    R.uyari(name, ln, "%s: Unsplash URL'sinde ?auto=format&fit=crop&w=…&q=… parametreleri yok" % ref)
            elif u.startswith(("http://", "https://")):
                R.uyari(name, ln, "%s: Unsplash dışı foto: %s" % (ref, u[:60]))
            else:
                if not (ROOT / u.split("?")[0]).exists():
                    R.hata(name, ln, "%s: yerel foto bulunamadı: %s" % (ref, u))
        dn = il.get("danisman")
        if dn and danisman_adlari and dn not in danisman_adlari:
            R.uyari(name, ln, "%s: danisman listede yok: %s" % (ref, dn))
        if il.get("oneCikan"):
            one_cikan += 1
            if il.get("durum") != "satista":
                R.uyari(name, ln, "%s: oneCikan ama satışta değil" % ref)
    if ilanlar and one_cikan != 6:
        R.uyari(name, 1, "oneCikan ilan sayısı %d; ana sayfa 6 bekler" % one_cikan)

    # bölgeler / blog / sss fotoğrafları ve dosyaları
    for b in (data.get("bolgeler") or []):
        if not isinstance(b, dict):
            continue
        for alan in ("il", "slug", "foto", "ozet"):
            if not b.get(alan):
                R.hata(name, 1, "bolgeler %r: alan eksik: %s" % (b.get("il"), alan))
        fid = unsplash_id(b.get("foto"))
        if fid and fid not in FOTO_HAVUZU:
            R.hata(name, 1, "bolgeler %r: foto ID havuzda değil: %s" % (b.get("il"), fid))
    for bl in (data.get("blog") or []):
        if not isinstance(bl, dict):
            continue
        m = re.search(r"""slug:\s*["']%s["']""" % re.escape(bl.get("slug") or "\0"), src)
        ln = satir_no(src, m.start()) if m else 1
        for alan in ("slug", "baslik", "ozet", "tarih", "kategori", "foto", "okuma"):
            if not bl.get(alan):
                R.hata(name, ln, "blog %r: alan eksik: %s" % (bl.get("slug"), alan))
        if bl.get("tarih") and iso_tarih(bl.get("tarih")):
            R.hata(name, ln, "blog %r: tarih %s" % (bl.get("slug"), iso_tarih(bl.get("tarih"))))
        if "sayfa" not in bl:
            R.hata(name, ln, "blog %r: sayfa alanı yok (dosya adı veya null)" % bl.get("slug"))
        elif bl.get("sayfa"):
            if not (ROOT / bl["sayfa"]).exists():
                R.hata(name, ln, "blog %r: sayfa dosyası yok: %s" % (bl.get("slug"), bl["sayfa"]))
        fid = unsplash_id(bl.get("foto"))
        if fid and fid not in FOTO_HAVUZU:
            R.hata(name, ln, "blog %r: foto ID havuzda değil: %s" % (bl.get("slug"), fid))
    for s in (data.get("sss") or []):
        if isinstance(s, dict) and s.get("kategori") not in SSS_KATEGORI:
            R.uyari(name, 1, "sss %r: kategori sabit listede değil: %r" % ((s.get("soru") or "")[:40], s.get("kategori")))
    for y in (data.get("yorumlar") or []):
        if isinstance(y, dict):
            for alan in ("ad", "sehir", "tip", "metin", "puan"):
                if y.get(alan) in (None, ""):
                    R.hata(name, 1, "yorumlar %r: alan eksik: %s" % (y.get("ad"), alan))
    for dn in (data.get("danismanlar") or []):
        if isinstance(dn, dict):
            for alan in ("ad", "unvan", "bolge", "tel"):
                if not dn.get(alan):
                    R.hata(name, 1, "danismanlar %r: alan eksik: %s" % (dn.get("ad"), alan))

    # tüm dosyadaki Unsplash ID'leri (yorum satırları dahil değil — yalnızca string'ler)
    for m in re.finditer(r"images\.unsplash\.com/photo-([0-9]+-[0-9a-f]+)", src):
        if m.group(1) in FOTO_GECERSIZ:
            R.hata(name, satir_no(src, m.start()), "geçersiz foto ID: %s" % m.group(1))


def kontrol_sitemap(pages):
    name = "sitemap.xml"
    if not SITEMAP.exists():
        R.uyari(name, 1, "sitemap.xml yok")
        return
    t = SITEMAP.read_text(encoding="utf-8")
    # 1) XML iyi biçimli mi? (Search Console bozuk XML'i tamamen reddeder.) Regex taraması bunu görmez.
    try:
        kok = ET.fromstring(t.encode("utf-8"))
    except ET.ParseError as e:
        ln = e.position[0] if getattr(e, "position", None) else 1
        ipucu = ""
        if re.search(r"&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)", t):
            ipucu = " (ipucu: <loc> içindeki '&' karakterleri '&amp;' olarak kaçışlanmalı)"
        R.hata(name, ln, "XML geçersiz: %s%s" % (e, ipucu))
        return
    if kok.tag != "{%s}urlset" % SITEMAP_NS:
        R.hata(name, 1, "kök etiket <urlset xmlns=\"%s\"> olmalı; bulunan: %s" % (SITEMAP_NS, kok.tag))
    for url in kok:
        if url.tag != "{%s}url" % SITEMAP_NS:
            R.uyari(name, 1, "<urlset> altında beklenmeyen etiket: %s" % url.tag)
        elif url.find("{%s}loc" % SITEMAP_NS) is None:
            R.hata(name, 1, "<url> girdisinde <loc> yok")
    # 2) Satır numaralı denetimler için ham metin (XML artık doğrulandı).
    locs = [(m.start(), m.group(1).strip()) for m in re.finditer(r"<loc>\s*(.*?)\s*</loc>", t, re.S)]
    if not locs:
        R.hata(name, 1, "<loc> girdisi yok")
    gorulen = set()
    loc_set = set()
    for pos, loc in locs:
        ln = satir_no(t, pos)
        if not loc.startswith(SITE_URL + "/"):
            R.hata(name, ln, "URL %s ile başlamalı: %s" % (SITE_URL, loc))
            continue
        loc_set.add(loc)
        yol = loc[len(SITE_URL) + 1:].split("?")[0].split("#")[0] or "index.html"
        gorulen.add(yol)
        if yol in SITEMAP_HARIC:
            R.hata(name, ln, "%s sitemap'te olmamalı" % yol)
        elif not (ROOT / yol).exists():
            R.hata(name, ln, "sayfa dosyası yok: %s" % yol)
    for p in pages:
        if p.name not in SITEMAP_HARIC and p.name not in gorulen:
            R.uyari(name, 1, "sitemap'te eksik sayfa: %s" % p.name)
        elif p.name in CANONICALS and p.name not in SITEMAP_HARIC:
            ln, href = CANONICALS[p.name]
            if href not in loc_set:
                R.uyari(p.name, ln, "canonical (%s) sitemap.xml'deki <loc> ile birebir aynı değil; "
                        "arama motorlarına tek tercih edilen URL verin" % href)
    for m in re.finditer(r"<lastmod>\s*(.*?)\s*</lastmod>", t):
        hata = iso_tarih(m.group(1))
        if hata:
            R.hata(name, satir_no(t, m.start()), "lastmod %s" % hata)
    rb = ROOT / "robots.txt"
    if rb.exists():
        rt = rb.read_text(encoding="utf-8")
        if "Sitemap:" not in rt:
            R.uyari("robots.txt", 1, "Sitemap: satırı yok")
        elif SITE_URL + "/sitemap.xml" not in rt:
            R.uyari("robots.txt", 1, "Sitemap: satırı %s/sitemap.xml adresini göstermiyor" % SITE_URL)
        if not re.search(r"(?mi)^\s*User-agent:\s*\*\s*$", rt):
            R.uyari("robots.txt", 1, '"User-agent: *" satırı yok')
        if re.search(r"(?mi)^\s*Disallow:\s*/\s*$", rt):
            R.hata("robots.txt", 1, '"Disallow: /" tüm siteyi taramadan kapatır')
        elif not re.search(r"(?mi)^\s*Allow:\s*/\s*$", rt):
            R.uyari("robots.txt", 1, '"Allow: /" satırı yok')
    else:
        R.uyari("robots.txt", 1, "robots.txt yok")


def parse_args(argv):
    ap = argparse.ArgumentParser(
        prog="tools/check.py",
        description="Tarlaal statik site tutarlılık ve bağlantı kontrolü (bağımlılıksız).",
        epilog="Çıkış kodu: 0 temiz · 1 hata (veya --warnings-as-errors ile uyarı) · 2 bilinmeyen bayrak.")
    ap.add_argument("--no-data", action="store_true",
                    help="assets/js/data.js içerik doğrulamasını ve ilan.html?id= / ilanlar.html?il= denetimini atla")
    ap.add_argument("--warnings-as-errors", action="store_true", help="uyarı varsa da HATALI ile çık (kod 1)")
    ap.add_argument("--quiet", action="store_true", help="uyarı ve bilgi satırlarını gizle (hatalar yazılır)")
    return ap.parse_args(argv)  # bilinmeyen bayrak → argparse kullanım satırı basar, exit 2


def main():
    global QUIET
    args = parse_args(sys.argv[1:])
    QUIET = args.quiet
    partials = yukle_partials()
    # shot.sh / probe.sh kökte geçici gizli sayfalar bırakabilir (.shot-wrap-*.html, .probe-*.html);
    # nokta ile başlayan dosyalar taranmaz ve sitemap karşılaştırmasına girmez.
    pages = [p for p in sorted(ROOT.glob("*.html")) if not p.name.startswith(".")]
    if not pages:
        R.uyari(".", 1, "kök dizinde hiç *.html yok")
    for page in pages:
        try:
            kontrol_html(page, partials)
        except Exception as e:  # tek sayfa çökse de diğerleri taransın
            R.hata(page.name, 1, "kontrol sırasında istisna: %r" % (e,))
    kontrol_capalar()
    if not args.no_data:
        kontrol_data()
        kontrol_query_refs()
    kontrol_sitemap(pages)

    warn_as_err = args.warnings_as_errors
    for d, ln, m in sorted(R.hatalar):
        print("%s:%d: HATA: %s" % (d, ln, m))
    # --quiet uyarıları gizler; ama --warnings-as-errors ile uyarılar sonucu HATALI yapıyorsa
    # nedenini de göster.
    if not QUIET or warn_as_err:
        for d, ln, m in sorted(R.uyarilar):
            print("%s:%d: UYARI: %s" % (d, ln, m))
    if not QUIET:
        for b in R.bilgiler:
            print("BİLGİ:", b)
    print("—")
    print("%d sayfa tarandı · %d hata · %d uyarı" % (len(pages), len(R.hatalar), len(R.uyarilar)))
    fail = bool(R.hatalar) or (warn_as_err and R.uyarilar)
    print("SONUÇ:", "HATALI" if fail else "TEMİZ")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
