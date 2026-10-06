/* ==========================================================================
   Tarlaal — ortak JS (main.js)
   Bağımlılık yok. Yükleme sırası: config.js → data.js → main.js → <sayfa>.js
   Global ad alanı: window.TARLAAL

   API
   ---
   Veri
     TARLAAL.data()                      → window.TARLAAL_DATA (eksik alanlar [] ile tamamlanır)
     TARLAAL.bolgeSayilari()             → { "İstanbul": 5, … } (durum !== 'satildi')
     TARLAAL.ilanBul(id)                 → ilan nesnesi | null
   Biçim
     TARLAAL.formatFiyat(1850000)        → "1.850.000 ₺"
     TARLAAL.formatSayi(2450)            → "2.450"
     TARLAAL.formatM2(2450)              → "2.450 m²"
     TARLAAL.formatBirim(fiyat, m2)      → "755 ₺/m²"
     TARLAAL.formatTarih("2026-09-18")   → "18 Eylül 2026"
     TARLAAL.turAdi("bahce")             → "Bağ-Bahçe"
     TARLAAL.durumAdi("rezerve")         → "Rezerve"
     TARLAAL.konum(ilan)                 → "Mürefte, Şarköy / Tekirdağ"
     TARLAAL.esc(str) · TARLAAL.slug(str) · TARLAAL.basHarf("Ayşe Demir") → "AD"
   URL
     TARLAAL.ilanUrl(ilan)               → "ilan.html?id=TR-2026-0142"
     TARLAAL.fallbackFoto(ilan)          → "assets/img/ilan/fallback-3.svg"
     TARLAAL.getQuery()                  → URLSearchParams
     TARLAAL.setQuery({tur:'tarla', sayfa:null}, {replace:true}) → URL'yi history ile günceller
     TARLAAL.whatsappUrl(mesaj)          → "https://wa.me/90…?text=…"
   Render
     TARLAAL.ilanKarti(ilan)             → .card HTML string'i
     TARLAAL.renderIlanlar(el, dizi)     → kartları basar, favori + reveal bağlar
     TARLAAL.rozet(ad)                   → .badge HTML'i
     TARLAAL.refresh(root)               → yeni eklenen içerikte reveal/favori/sayaç bağlar
   Favori
     TARLAAL.favoriler() · TARLAAL.isFavori(id) · TARLAAL.toggleFavori(id)
   UI
     TARLAAL.toast(mesaj, 'ok'|'err'|'', sureMs=3800; 0=kalıcı) · TARLAAL.copy(text) · TARLAAL.setTitle(baslik, aciklama)
   Otomatik (DOMContentLoaded)
     nav/alt menü/aria-current, [data-site]/[data-site-href], cookie-bar, to-top, header .is-scrolled,
     .reveal, [data-count], .faq tek-açık, form[data-form], [data-year], favori butonları,
     [data-render="yorumlar|sss|blog|danismanlar|bolgeler|ilanlar"]
   Ek ayar
     window.TARLAAL_BASE = "../"  → göreli yolların önüne eklenir (alt klasörden test için)
   ========================================================================== */
(function (w, d) {
  'use strict';

  var SITE = w.SITE || {};
  var BASE = (typeof w.TARLAAL_BASE === 'string') ? w.TARLAAL_BASE : '';
  var LS_FAV = 'tarlaal:favoriler';
  var LS_CEREZ = 'tarlaal:cerez';
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var TURLER = { tarla: 'Tarla', arsa: 'Arsa', arazi: 'Arazi', bahce: 'Bağ-Bahçe' };
  var DURUMLAR = { satista: 'Satışta', rezerve: 'Rezerve', satildi: 'Satıldı' };
  var reduceMotion = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- yardımcılar ---------- */
  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function num(x) { var n = Number(x); return isFinite(n) ? n : 0; }
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    var map = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', I: 'i', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return String(s || '').replace(/[çğıiöşüÇĞIİÖŞÜ]/g, function (c) { return map[c]; })
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function lsGet(key) { try { return w.localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, val) { try { w.localStorage.setItem(key, val); } catch (e) { /* özel mod */ } }
  function hash(str) { var h = 0, s = String(str || ''); for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  function basHarf(ad) {
    return String(ad || '').trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0).toLocaleUpperCase('tr'); }).join('');
  }

  /* ---------- veri ---------- */
  function data() {
    var x = w.TARLAAL_DATA || {};
    return {
      bolgeler: arr(x.bolgeler), ilanlar: arr(x.ilanlar), danismanlar: arr(x.danismanlar),
      yorumlar: arr(x.yorumlar), sss: arr(x.sss), blog: arr(x.blog)
    };
  }
  function ilanBul(id) {
    var list = data().ilanlar;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id === id) return list[i]; }
    return null;
  }
  function bolgeSayilari() {
    var out = {};
    data().ilanlar.forEach(function (il) {
      if (!il || il.durum === 'satildi' || !il.il) return;
      out[il.il] = (out[il.il] || 0) + 1;
    });
    return out;
  }

  /* ---------- biçim ---------- */
  function formatSayi(n) {
    n = Math.round(num(n));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function formatFiyat(n) { return formatSayi(n) + ' ₺'; }
  function formatM2(n) { return formatSayi(n) + ' m²'; }
  function formatBirim(fiyat, m2) {
    m2 = num(m2); if (!m2) return '';
    return formatSayi(num(fiyat) / m2) + ' ₺/m²';
  }
  function parseTarih(s) {
    if (s instanceof Date) return s;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (!m) { var t = new Date(s); return isNaN(t) ? null : t; }
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  function formatTarih(s) {
    var t = parseTarih(s); if (!t) return '';
    return t.getDate() + ' ' + AYLAR[t.getMonth()] + ' ' + t.getFullYear();
  }
  function turAdi(tur) { return TURLER[tur] || (tur ? String(tur) : ''); }
  function durumAdi(durum) { return DURUMLAR[durum] || DURUMLAR.satista; }
  function konum(ilan) {
    ilan = ilan || {};
    var parts = [];
    if (ilan.mahalle) parts.push(ilan.mahalle);
    if (ilan.ilce) parts.push(ilan.ilce);
    var s = parts.join(', ');
    if (ilan.il) s += (s ? ' / ' : '') + ilan.il;
    return s;
  }

  /* ---------- URL ---------- */
  function ilanUrl(ilan) { return BASE + 'ilan.html?id=' + encodeURIComponent(ilan && ilan.id ? ilan.id : ''); }
  function fallbackFoto(ilan) {
    var list = data().ilanlar, idx = list.indexOf(ilan);
    var n = (idx >= 0 ? idx : hash(ilan && ilan.id)) % 6 + 1;
    return BASE + 'assets/img/ilan/fallback-' + n + '.svg';
  }
  function getQuery() { return new URLSearchParams(w.location.search); }
  function setQuery(obj, opts) {
    opts = opts || {};
    var q = getQuery();
    Object.keys(obj || {}).forEach(function (k) {
      var v = obj[k];
      if (v === null || v === undefined || v === '' || v === false) q.delete(k); else q.set(k, String(v));
    });
    var qs = q.toString();
    var url = w.location.pathname + (qs ? '?' + qs : '') + (opts.hash !== undefined ? opts.hash : w.location.hash);
    try { w.history[opts.replace ? 'replaceState' : 'pushState'](null, '', url); } catch (e) { /* file:// vb. */ }
    return q;
  }
  function whatsappUrl(mesaj) {
    return 'https://wa.me/' + (SITE.whatsapp || '') + (mesaj ? '?text=' + encodeURIComponent(mesaj) : '');
  }

  /* ---------- SVG ikonlar ---------- */
  var ICON = {
    pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    area: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/></svg>',
    doc: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    stamp: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22h14M5 18h14a1 1 0 0 0 1-1v-2a3 3 0 0 0-3-3h-3l1-5a3 3 0 1 0-6 0l1 5H7a3 3 0 0 0-3 3v2a1 1 0 0 0 1 1z"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    phone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    alert: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
  };

  /* ---------- favoriler ---------- */
  function favoriler() {
    try { var v = JSON.parse(lsGet(LS_FAV) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function isFavori(id) { return favoriler().indexOf(id) !== -1; }
  function toggleFavori(id) {
    var list = favoriler(), i = list.indexOf(id), added = i === -1;
    if (added) list.push(id); else list.splice(i, 1);
    lsSet(LS_FAV, JSON.stringify(list));
    $$('[data-fav]').forEach(function (btn) {
      if (btn.getAttribute('data-fav') === id) paintFav(btn, added);
    });
    d.dispatchEvent(new CustomEvent('tarlaal:favori', { detail: { id: id, added: added, list: list } }));
    return added;
  }
  function paintFav(btn, active) {
    btn.classList.toggle('is-active', !!active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', active ? 'Favorilerden çıkar' : 'Favorilere ekle');
    btn.title = active ? 'Favorilerden çıkar' : 'Favorilere ekle';
  }
  function bindFavs(root) {
    var favs = favoriler();
    $$('[data-fav]', root).forEach(function (btn) { paintFav(btn, favs.indexOf(btn.getAttribute('data-fav')) !== -1); });
  }

  /* ---------- rozet / kart ---------- */
  function rozet(ad) {
    var s = String(ad || ''), cls = 'badge';
    var k = slug(s);
    if (k === 'yeni') cls += ' badge--new';
    else if (k === 'firsat') cls += ' badge--deal';
    else if (k === 'satildi') cls += ' badge--sold';
    else if (k === 'rezerve') cls += ' badge--reserved';
    else cls += ' badge--info'; // bilgi rozeti (deniz manzaralı, taksit, yola cepheli): soluk ince stil
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }
  // Kart rozeti öncelik sırası: durum (Fırsat/Yeni) önce, bilgi rozetleri sonra.
  function rozetOncelik(ad) {
    var k = slug(ad);
    if (k === 'firsat') return 0;
    if (k === 'yeni') return 1;
    return 2;
  }
  function ilanKarti(ilan) {
    ilan = ilan || {};
    var url = ilanUrl(ilan);
    var durum = ilan.durum || 'satista';
    var cls = 'card card--ilan' + (durum === 'satildi' ? ' card--sold' : durum === 'rezerve' ? ' card--reserved' : '');
    var foto = ilan.foto || fallbackFoto(ilan);
    var fb = fallbackFoto(ilan);
    var rozetler = arr(ilan.rozetler);
    if (durum === 'satildi') rozetler = rozetler.filter(function (r) { return slug(r) !== 'yeni' && slug(r) !== 'firsat'; });
    // En fazla 2 rozet: önce durum (Fırsat/Yeni), sonra bilgi rozeti — görsel gürültüyü kır.
    rozetler = rozetler.slice().sort(function (a, b) { return rozetOncelik(a) - rozetOncelik(b); }).slice(0, 2);
    var badges = rozetler.map(rozet).join('');
    var ribbon = durum === 'satildi' ? '<span class="card__ribbon">SATILDI</span>' : durum === 'rezerve' ? '<span class="card__ribbon">REZERVE</span>' : '';
    var chips = [];
    if (ilan.m2) chips.push('<li class="chip">' + ICON.area + esc(formatM2(ilan.m2)) + '</li>');
    if (ilan.imar) chips.push('<li class="chip">' + ICON.doc + esc(ilan.imar) + '</li>');
    if (ilan.tapu) chips.push('<li class="chip">' + ICON.stamp + esc(ilan.tapu) + '</li>');
    if (ilan.taksit && durum !== 'satildi') chips.push('<li class="chip chip--accent">Taksit</li>');
    var birim = formatBirim(ilan.fiyat, ilan.m2);
    var baslik = esc(ilan.baslik || (turAdi(ilan.tur) + ' — ' + konum(ilan)));
    return (
      '<article class="' + cls + '" data-id="' + esc(ilan.id) + '" data-tur="' + esc(ilan.tur) + '" data-il="' + esc(ilan.il) + '">' +
        '<a class="card__media" href="' + esc(url) + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(foto) + '" alt="' + baslik + '" width="800" height="600" loading="lazy" decoding="async" ' +
            'onerror="this.onerror=null;this.src=\'' + esc(fb) + '\'">' +
          (badges ? '<div class="card__badges">' + badges + '</div>' : '') +
          ribbon +
        '</a>' +
        '<button class="card__fav" type="button" data-fav="' + esc(ilan.id) + '" aria-pressed="false" aria-label="Favorilere ekle">' + ICON.heart + '</button>' +
        '<div class="card__body">' +
          '<p class="card__kicker"><span class="card__type">' + esc(turAdi(ilan.tur)) + '</span><span class="card__id">' + esc(ilan.id || '') + '</span></p>' +
          '<h3 class="card__title"><a href="' + esc(url) + '">' + baslik + '</a></h3>' +
          '<p class="card__meta">' + ICON.pin + '<span>' + esc(konum(ilan)) + '</span></p>' +
          (chips.length ? '<ul class="card__chips">' + chips.join('') + '</ul>' : '') +
          '<div class="card__footer">' +
            '<div class="card__price">' +
              '<span class="price">' + esc(formatFiyat(ilan.fiyat)) + '</span>' +
              (birim ? '<span class="price__unit">' + esc(birim) + '</span>' : '') +
            '</div>' +
            '<a class="btn btn--primary btn--sm" href="' + esc(url) + '" aria-label="' + baslik + ' — ilanı incele">' + (durum === 'satildi' ? 'Detay' : 'İlanı İncele') + '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }
  function renderIlanlar(el, list) {
    if (!el) return;
    list = arr(list);
    if (!list.length) {
      el.innerHTML = '<div class="empty"><h3>Bu kriterlere uygun ilan bulunamadı</h3><p>Filtreleri genişletmeyi deneyin ya da bize yazın; portföyümüze yeni ilanlar her hafta ekleniyor.</p></div>';
      return;
    }
    el.innerHTML = list.map(function (ilan, i) {
      return ilanKarti(ilan).replace('<article class="', '<article class="reveal reveal--delay-' + ((i % 3) + 1) + ' ');
    }).join('');
    refresh(el);
  }

  /* ---------- data-render yardımcıları ---------- */
  function yorumHTML(y) {
    y = y || {};
    var puan = Math.max(0, Math.min(5, Math.round(num(y.puan))));
    var stars = puan ? '<span class="testimonial__stars" aria-label="' + puan + ' / 5 puan">' + new Array(puan + 1).join('★') + '</span>' : '';
    return (
      '<figure class="testimonial reveal">' +
        '<blockquote><p>' + esc(y.metin) + '</p></blockquote>' +
        '<figcaption>' +
          '<span class="testimonial__avatar" aria-hidden="true">' + esc(basHarf(y.ad)) + '</span>' +
          '<span><span class="testimonial__name">' + esc(y.ad) + '</span>' +
          '<span class="testimonial__meta">' + esc([y.sehir, y.tip].filter(Boolean).join(' · ')) + '</span></span>' +
          stars +
        '</figcaption>' +
      '</figure>'
    );
  }
  function sssHTML(s) {
    s = s || {};
    var cevap = String(s.cevap || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    return (
      '<details class="faq__item">' +
        '<summary>' + esc(s.soru) + '</summary>' +
        '<div class="faq__body">' + cevap + '</div>' +
      '</details>'
    );
  }
  function blogKarti(b) {
    b = b || {};
    var href = b.sayfa ? BASE + b.sayfa : null;
    var fb = BASE + 'assets/img/ilan/fallback-' + (hash(b.slug || b.baslik) % 6 + 1) + '.svg';
    var media = '<img src="' + esc(b.foto || fb) + '" alt="' + esc(b.baslik) + '" width="800" height="500" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(fb) + '\'">' +
      '<div class="card__badges">' + (b.kategori ? '<span class="badge">' + esc(b.kategori) + '</span>' : '') + (href ? '' : '<span class="badge badge--soon">Yakında</span>') + '</div>';
    var meta = [formatTarih(b.tarih), b.okuma ? b.okuma + ' okuma' : ''].filter(Boolean).join(' · ');
    return (
      '<article class="card card--post reveal' + (href ? '' : ' card--soon') + '">' +
        (href ? '<a class="card__media" href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' + media + '</a>' : '<div class="card__media">' + media + '</div>') +
        '<div class="card__body">' +
          '<h3 class="card__title">' + (href ? '<a href="' + esc(href) + '">' + esc(b.baslik) + '</a>' : esc(b.baslik)) + '</h3>' +
          (b.ozet ? '<p class="card__text">' + esc(b.ozet) + '</p>' : '') +
          '<p class="card__date">' + esc(meta) + '</p>' +
        '</div>' +
      '</article>'
    );
  }
  function danismanKarti(k) {
    k = k || {};
    var telHref = 'tel:+' + String(k.tel || SITE.telefon || '').replace(/\D/g, '');
    return (
      '<div class="feature feature--person reveal">' +
        '<span class="feature__icon" aria-hidden="true">' + esc(basHarf(k.ad)) + '</span>' +
        '<div>' +
          '<h3 class="feature__title">' + esc(k.ad) + '<span class="feature__role">' + esc(k.unvan) + '</span></h3>' +
          '<ul class="feature__meta">' +
            (k.bolge ? '<li>' + ICON.pin + esc(k.bolge) + '</li>' : '') +
            (k.tel ? '<li>' + ICON.phone + '<a href="' + esc(telHref) + '">' + esc(k.tel) + '</a></li>' : '') +
          '</ul>' +
        '</div>' +
      '</div>'
    );
  }
  function bolgeKarti(b, sayi) {
    b = b || {};
    var fb = BASE + 'assets/img/ilan/fallback-' + (hash(b.il) % 6 + 1) + '.svg';
    var n = num(sayi);
    return (
      '<a class="region-card reveal" href="' + esc(BASE + 'ilanlar.html?il=' + encodeURIComponent(b.il || '')) + '" data-il="' + esc(b.il) + '" aria-label="' + esc(b.il) + ' ilanlarını gör">' +
        '<img src="' + esc(b.foto || fb) + '" alt="" width="800" height="533" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(fb) + '\'">' +
        '<span class="region-card__body">' +
          '<span><span class="region-card__name">' + esc(b.il) + '</span>' +
          '<span class="region-card__count">' + (n ? n + ' İLAN' : 'YAKINDA') + '</span></span>' +
          '<span class="region-card__arrow" aria-hidden="true">' + ICON.arrow + '</span>' +
        '</span>' +
      '</a>'
    );
  }
  function limitOf(el, list) {
    var lim = parseInt(el.getAttribute('data-limit'), 10);
    return lim > 0 ? list.slice(0, lim) : list;
  }
  function initRenders(root) {
    var D = data();
    $$('[data-render]', root).forEach(function (el) {
      var type = el.getAttribute('data-render');
      if (el.getAttribute('data-rendered') === '1') return;
      var list, html = '';
      switch (type) {
        case 'yorumlar':
          list = D.yorumlar;
          if (el.getAttribute('data-tip')) { var tip = el.getAttribute('data-tip'); list = list.filter(function (y) { var t = String(y.tip || '').toLocaleLowerCase('tr'); return t === tip.toLocaleLowerCase('tr') || t.indexOf(tip.toLocaleLowerCase('tr')) > -1; }); }
          html = limitOf(el, list).map(yorumHTML).join('');
          break;
        case 'sss':
          list = D.sss;
          if (el.getAttribute('data-kategori')) { var kat = el.getAttribute('data-kategori'); list = list.filter(function (s) { return s.kategori === kat; }); }
          if (!el.classList.contains('faq')) el.classList.add('faq');
          html = limitOf(el, list).map(sssHTML).join('');
          break;
        case 'blog':
          html = limitOf(el, D.blog).map(blogKarti).join('');
          break;
        case 'danismanlar':
          html = limitOf(el, D.danismanlar).map(danismanKarti).join('');
          break;
        case 'bolgeler':
          var sayilar = bolgeSayilari();
          html = limitOf(el, D.bolgeler).map(function (b) { return bolgeKarti(b, sayilar[b.il]); }).join('');
          break;
        case 'ilanlar':
          list = D.ilanlar;
          var filt = el.getAttribute('data-filter'), il = el.getAttribute('data-il'), tur = el.getAttribute('data-tur');
          if (filt === 'oneCikan') list = list.filter(function (x) { return x.oneCikan && x.durum !== 'satildi'; });
          if (il) list = list.filter(function (x) { return x.il === il; });
          if (tur) list = list.filter(function (x) { return x.tur === tur; });
          renderIlanlar(el, limitOf(el, list));
          el.setAttribute('data-rendered', '1');
          return;
        default:
          return;
      }
      el.innerHTML = html;
      el.setAttribute('data-rendered', '1');
      if (!html && el.getAttribute('data-empty')) el.innerHTML = '<p class="muted">' + esc(el.getAttribute('data-empty')) + '</p>';
      refresh(el);
    });
  }

  /* ---------- reveal / sayaç ---------- */
  var revealIO = null, countIO = null;
  function initReveal(root) {
    var els = $$('.reveal:not(.is-visible)', root);
    if (!els.length) return;
    if (!('IntersectionObserver' in w) || reduceMotion) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); } });
      }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    }
    els.forEach(function (e) { revealIO.observe(e); });
  }
  function animateCount(el) {
    var target = num(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix') || '';
    var sfx = suffix ? '<span class="suffix">' + esc(suffix) + '</span>' : '';
    if (reduceMotion || !target) { el.innerHTML = formatSayi(target) + sfx; return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = formatSayi(target * e) + sfx;
      if (p < 1) w.requestAnimationFrame(step);
    }
    w.requestAnimationFrame(step);
  }
  function initCounters(root) {
    var els = $$('[data-count]:not([data-counted])', root);
    if (!els.length) return;
    els.forEach(function (e) { e.setAttribute('data-counted', '1'); });
    if (!('IntersectionObserver' in w)) { els.forEach(animateCount); return; }
    if (!countIO) {
      countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); } });
      }, { threshold: .3 });
    }
    els.forEach(function (e) { countIO.observe(e); });
  }
  function refresh(root) { bindFavs(root); initReveal(root); initCounters(root); }

  /* ---------- toast ---------- */
  var toastStack = null;
  function toast(mesaj, tip, sure) {
    if (!toastStack) { toastStack = d.createElement('div'); toastStack.className = 'toast-stack'; toastStack.setAttribute('aria-live', 'polite'); d.body.appendChild(toastStack); }
    var t = d.createElement('div');
    t.className = 'toast' + (tip === 'ok' ? ' toast--ok' : tip === 'err' ? ' toast--err' : '');
    t.setAttribute('role', 'status');
    t.innerHTML = (tip === 'ok' ? ICON.check : tip === 'err' ? ICON.alert : '') + '<span>' + esc(mesaj) + '</span>';
    toastStack.appendChild(t);
    sure = (sure === undefined) ? 3800 : num(sure);
    if (sure > 0) w.setTimeout(function () { t.classList.add('is-leaving'); w.setTimeout(function () { t.remove(); }, 320); }, sure);
    return t;
  }
  function copy(text) {
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) return w.navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = d.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      d.body.appendChild(ta); ta.select();
      try { d.execCommand('copy'); res(); } catch (e) { rej(e); }
      ta.remove();
    });
  }
  function setTitle(baslik, aciklama) {
    if (baslik) {
      d.title = baslik + ' | ' + (SITE.ad || 'Tarlaal');
      var og = $('meta[property="og:title"]'); if (og) og.setAttribute('content', d.title);
    }
    if (aciklama) {
      var m = $('meta[name="description"]'); if (m) m.setAttribute('content', aciklama);
      var ogd = $('meta[property="og:description"]'); if (ogd) ogd.setAttribute('content', aciklama);
    }
  }

  /* ---------- header / nav ---------- */
  function initNav() {
    var header = $('#site-header') || $('.site-header');
    var nav = $('#nav') || $('.nav');
    var toggle = $('.nav-toggle');
    var navbar = header ? $('.navbar', header) : null;
    if (!nav || !toggle) return;

    function setTop() {
      if (navbar) nav.style.setProperty('--nav-top', Math.max(0, Math.round(navbar.getBoundingClientRect().bottom)) + 'px');
    }
    function open(state) {
      if (state) setTop();
      nav.classList.toggle('is-open', state);
      toggle.classList.toggle('is-active', state);
      toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      d.body.classList.toggle('nav-open', state);
      var label = $('.nav-toggle__label', toggle); if (label) label.textContent = state ? 'Kapat' : 'Menü';
    }
    toggle.addEventListener('click', function () { open(!nav.classList.contains('is-open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { open(false); toggle.focus(); } });
    w.addEventListener('resize', function () {
      if (w.innerWidth >= 900 && nav.classList.contains('is-open')) open(false);
      else if (nav.classList.contains('is-open')) setTop();
    });
    w.addEventListener('scroll', function () { if (nav.classList.contains('is-open')) setTop(); }, { passive: true });

    /* alt menü butonları */
    $$('.has-sub', nav).forEach(function (li) {
      var btn = $('.sub-toggle', li);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = li.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        $$('.has-sub.is-open', nav).forEach(function (o) { if (o !== li) { o.classList.remove('is-open'); var ob = $('.sub-toggle', o); if (ob) ob.setAttribute('aria-expanded', 'false'); } });
      });
      li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('is-open')) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    });
    d.addEventListener('click', function (e) {
      if (w.innerWidth < 900) return;
      $$('.has-sub.is-open', nav).forEach(function (li) {
        if (!li.contains(e.target)) { li.classList.remove('is-open'); var b = $('.sub-toggle', li); if (b) b.setAttribute('aria-expanded', 'false'); }
      });
    });

    /* aria-current */
    var path = w.location.pathname.split('/').pop() || 'index.html';
    try { path = decodeURIComponent(path); } catch (e) { /* yok say */ }
    var search = w.location.search || '';
    $$('a[href]', nav).forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      var file = href.replace(/^(\.\.\/|\.\/)+/, '').split('#')[0];
      var q = file.indexOf('?') !== -1 ? file.slice(file.indexOf('?')) : '';
      file = file.split('?')[0] || 'index.html';
      if (file !== path) return;
      var inSub = !!a.closest('.sub');
      if (inSub) { if (q === search) a.setAttribute('aria-current', 'page'); }
      else if (!q) a.setAttribute('aria-current', 'page');
    });

    /* scroll gölgesi */
    if (header) {
      var ticking = false;
      function onScroll() {
        if (ticking) return; ticking = true;
        w.requestAnimationFrame(function () { header.classList.toggle('is-scrolled', w.scrollY > 8); ticking = false; });
      }
      w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
  }

  /* ---------- SITE bilgileri ---------- */
  function initSite() {
    var hrefs = {
      telefonHref: SITE.telefonHref || (SITE.telefon ? 'tel:+' + String(SITE.telefon).replace(/\D/g, '') : ''),
      whatsappHref: SITE.whatsapp ? 'https://wa.me/' + SITE.whatsapp : '',
      epostaHref: SITE.eposta ? 'mailto:' + SITE.eposta : ''
    };
    $$('[data-site]').forEach(function (el) { var k = el.getAttribute('data-site'); if (SITE[k]) el.textContent = SITE[k]; });
    $$('[data-site-href]').forEach(function (el) {
      var k = el.getAttribute('data-site-href'), v = hrefs[k] || SITE[k];
      if (v) el.setAttribute('href', v);
    });
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- cookie / to-top ---------- */
  function initCookie() {
    var bar = $('#cookie-bar') || $('.cookie-bar');
    if (!bar) return;
    if (!lsGet(LS_CEREZ)) w.setTimeout(function () { bar.hidden = false; }, 900);
    $$('[data-cookie]', bar).forEach(function (btn) {
      btn.addEventListener('click', function () {
        lsSet(LS_CEREZ, btn.getAttribute('data-cookie') === 'all' ? 'all' : 'essential');
        bar.hidden = true;
      });
    });
  }
  function initToTop() {
    var btn = $('.to-top'); if (!btn) return;
    function check() { btn.hidden = w.scrollY < 600; }
    w.addEventListener('scroll', check, { passive: true }); check();
    btn.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  }

  /* ---------- SSS tek açık ---------- */
  function initFaq() {
    $$('.faq').forEach(function (faq) {
      faq.addEventListener('toggle', function (e) {
        var det = e.target;
        if (!det.open || !det.matches('details')) return;
        $$('details[open]', faq).forEach(function (o) { if (o !== det) o.open = false; });
      }, true);
    });
  }

  /* ---------- favori butonları (delegasyon) ---------- */
  function initFavButtons() {
    d.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fav]'); if (!btn) return;
      e.preventDefault();
      var id = btn.getAttribute('data-fav');
      var added = toggleFavori(id);
      toast(added ? 'İlan favorilerinize eklendi.' : 'İlan favorilerinizden çıkarıldı.', added ? 'ok' : '');
    });
  }

  /* ---------- formlar ---------- */
  var KONULAR = { katalog: 'Katalog talebi', bilgi: 'İlan bilgi talebi', satis: 'Arazi satış başvurusu', iletisim: 'İletişim formu' };
  function fieldLabel(input, form) {
    var lbl = input.id ? $('label[for="' + input.id + '"]', form) : null;
    if (!lbl) { var f = input.closest('.field, .filters__group'); if (f) lbl = $('label', f); }
    var t = lbl ? lbl.textContent.replace(/\*/g, '').trim() : (input.getAttribute('placeholder') || input.name);
    return t.replace(/\s+/g, ' ');
  }
  function validTel(v) {
    var dgt = String(v || '').replace(/\D/g, '');
    if (dgt.indexOf('90') === 0 && dgt.length === 12) dgt = dgt.slice(2);
    if (dgt.indexOf('0') === 0) dgt = dgt.slice(1);
    return dgt.length === 10 && dgt.charAt(0) !== '0';
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function setInvalid(input, msg) {
    var f = input.closest('.field') || input.parentElement;
    f.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    var err = $('.field__error', f);
    if (!err) { err = d.createElement('span'); err.className = 'field__error'; f.appendChild(err); }
    err.textContent = msg;
  }
  function clearInvalid(form) {
    $$('.is-invalid', form).forEach(function (f) { f.classList.remove('is-invalid'); });
    $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }
  function showStatus(form, msg, ok) {
    var st = $('.form__status', form);
    if (!st) { st = d.createElement('div'); st.className = 'form__status'; form.appendChild(st); }
    st.className = 'form__status ' + (ok ? 'form__status--ok' : 'form__status--err');
    st.setAttribute('role', ok ? 'status' : 'alert');
    st.innerHTML = (ok ? ICON.check : ICON.alert) + '<span>' + esc(msg) + '</span>';
    st.hidden = false;
    if (!ok) st.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      form.setAttribute('novalidate', '');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearInvalid(form);
        var tip = form.getAttribute('data-form');
        var hp = form.querySelector('input[name="website"]');
        if (hp && hp.value) { form.reset(); showStatus(form, 'Teşekkürler, mesajınız alındı.', true); return; }

        var fields = $$('input, select, textarea', form).filter(function (i) { return i.name && i.name !== 'website' && i.type !== 'submit' && i.type !== 'button' && i.type !== 'hidden'; });
        var first = null, errs = 0;
        fields.forEach(function (i) {
          var v = i.type === 'checkbox' ? i.checked : String(i.value || '').trim();
          var msg = '';
          if (i.required && (i.type === 'checkbox' ? !v : !v)) msg = i.name === 'kvkk' ? 'Devam etmek için KVKK metnini onaylayın.' : 'Bu alan zorunludur.';
          else if (v && (i.type === 'tel' || i.name === 'telefon') && !validTel(v)) msg = 'Geçerli bir telefon numarası girin (örn. 0532 000 00 00).';
          else if (v && (i.type === 'email' || i.name === 'eposta') && !validEmail(v)) msg = 'Geçerli bir e-posta adresi girin.';
          if (msg) { errs++; setInvalid(i, msg); if (!first) first = i; }
        });
        var kvkk = form.querySelector('input[name="kvkk"]');
        if (kvkk && !kvkk.checked && !kvkk.closest('.is-invalid')) { errs++; setInvalid(kvkk, 'Devam etmek için KVKK metnini onaylayın.'); if (!first) first = kvkk; }
        if (errs) { showStatus(form, 'Lütfen işaretli alanları kontrol edin.', false); if (first) first.focus(); return; }

        var konu = form.getAttribute('data-subject') || KONULAR[tip] || 'Form';
        var payload = { konu: konu, form: tip, sayfa: w.location.href, tarih: new Date().toISOString() };
        var satirlar = ['Merhaba, ' + konu + ' için yazıyorum.'];
        var ilanInput = form.querySelector('input[name="ilan"]');
        if (ilanInput && ilanInput.value) { payload.ilan = ilanInput.value; satirlar.push('İlan: ' + ilanInput.value); }
        fields.forEach(function (i) {
          if (i.name === 'kvkk') { payload.kvkk = i.checked; return; }
          var v = i.type === 'checkbox' ? (i.checked ? 'Evet' : '') : String(i.value || '').trim();
          if (i.type === 'radio' && !i.checked) return;
          if (i.tagName === 'SELECT' && i.selectedIndex > -1) { var opt = i.options[i.selectedIndex]; if (opt && !opt.value) v = ''; else v = opt ? opt.textContent.trim() : v; }
          payload[i.name] = v;
          if (v) satirlar.push(fieldLabel(i, form) + ': ' + v);
        });

        var btn = form.querySelector('[type="submit"]'), btnText = btn ? btn.innerHTML : '';
        function busy(state) { if (!btn) return; btn.disabled = state; btn.innerHTML = state ? 'Gönderiliyor…' : btnText; }

        if (SITE.formEndpoint) {
          busy(true);
          w.fetch(SITE.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
            .then(function () { busy(false); form.reset(); showStatus(form, 'Mesajınız bize ulaştı. En kısa sürede sizi arayacağız.', true); toast('Mesajınız gönderildi.', 'ok'); })
            .catch(function () { busy(false); showStatus(form, 'Gönderim sırasında bir sorun oluştu. Lütfen bizi arayın veya WhatsApp\'tan yazın.', false); });
        } else {
          var url = whatsappUrl(satirlar.join('\n'));
          var win = null;
          try { win = w.open(url, '_blank', 'noopener'); } catch (err) { win = null; }
          form.reset();
          showStatus(form, win ? 'Mesajınız hazırlandı ve WhatsApp açıldı. Göndermeniz yeterli; en kısa sürede dönüş yapacağız.' : 'WhatsApp açılamadı. Bize ' + (SITE.telefon || '') + ' numarasından ulaşabilirsiniz.', true);
          var st = $('.form__status', form);
          if (st && !win) st.innerHTML += ' <a href="' + esc(url) + '" target="_blank" rel="noopener">WhatsApp\'ı aç</a>';
        }
        d.dispatchEvent(new CustomEvent('tarlaal:form', { detail: payload }));
      });
      $$('input, select, textarea', form).forEach(function (i) {
        i.addEventListener('input', function () { var f = i.closest('.field'); if (f) f.classList.remove('is-invalid'); i.removeAttribute('aria-invalid'); });
      });
    });
  }

  /* ---------- filtre paneli (mobil) ---------- */
  function initFilterToggle() {
    $$('.filters__toggle').forEach(function (btn) {
      var target = btn.getAttribute('aria-controls') ? d.getElementById(btn.getAttribute('aria-controls')) : $('.filters');
      if (!target) return;
      btn.addEventListener('click', function () {
        var open = target.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---------- init ---------- */
  function init() {
    d.documentElement.classList.remove('no-js');
    d.documentElement.classList.add('js');
    initSite();
    initNav();
    initCookie();
    initToTop();
    initFaq();
    initFavButtons();
    initForms();
    initFilterToggle();
    initRenders(d);
    refresh(d);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();

  /* ---------- dışa aç ---------- */
  w.TARLAAL = {
    data: data, ilanBul: ilanBul, bolgeSayilari: bolgeSayilari,
    formatFiyat: formatFiyat, formatSayi: formatSayi, formatM2: formatM2, formatBirim: formatBirim, formatTarih: formatTarih, parseTarih: parseTarih,
    turAdi: turAdi, durumAdi: durumAdi, konum: konum, esc: esc, slug: slug, basHarf: basHarf,
    ilanUrl: ilanUrl, fallbackFoto: fallbackFoto, getQuery: getQuery, setQuery: setQuery, whatsappUrl: whatsappUrl,
    ilanKarti: ilanKarti, renderIlanlar: renderIlanlar, rozet: rozet, blogKarti: blogKarti, yorumHTML: yorumHTML, sssHTML: sssHTML, danismanKarti: danismanKarti, bolgeKarti: bolgeKarti,
    refresh: refresh, initReveal: initReveal, initCounters: initCounters, initRenders: initRenders,
    favoriler: favoriler, isFavori: isFavori, toggleFavori: toggleFavori,
    toast: toast, copy: copy, setTitle: setTitle, icons: ICON, AYLAR: AYLAR, TURLER: TURLER
  };
})(window, document);
