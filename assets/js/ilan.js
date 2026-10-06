/* ==========================================================================
   Tarlaal — ilan detay sayfası (ilan.js)
   ilan.html?id=<ilan.id> → data.js'teki ilanı bulur, iskeleti doldurur.
   Bağımlılık: config.js → data.js → main.js (window.TARLAAL). fetch yok.
   Bölümler: head/meta + JSON-LD, breadcrumb, başlık alanı (paylaş/favori),
   galeri, sticky fiyat kartı + "Bilgi Al" formu, özellik tabloları,
   açıklama, özellik çipleri, konum haritası, danışman, benzer ilanlar.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var T = w.TARLAAL;
  if (!T) return;
  var SITE = w.SITE || {};
  var I = T.icons;
  var esc = T.esc;
  var SITE_URL = String(SITE.url || 'https://tarlaal.com').replace(/\/+$/, '');
  var TEL_HREF = SITE.telefonHref || 'tel:+905423700808';

  var ICON_LINK = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
  var ICON_WA = '<svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.5 0 .2 5.3.2 11.8c0 2.1.5 4.1 1.6 5.9L0 24l6.5-1.7a11.8 11.8 0 0 0 5.5 1.4c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.3-8.4zM12 21.7c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4A9.8 9.8 0 0 1 2.2 11.8C2.2 6.4 6.6 2 12 2c2.6 0 5.1 1 6.9 2.9a9.7 9.7 0 0 1 2.9 6.9c0 5.4-4.4 9.9-9.8 9.9zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>';
  var ICON_PREV = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
  var ICON_NEXT = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  var ICON_SOLD = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22h14M5 18h14a1 1 0 0 0 1-1v-2a3 3 0 0 0-3-3h-3l1-5a3 3 0 1 0-6 0l1 5H7a3 3 0 0 0-3 3v2a1 1 0 0 0 1 1z"/></svg>';

  /* ---------- yardımcılar ---------- */
  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function el(id) { return d.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function thumbUrl(url) { return String(url || '').replace(/([?&])w=1200(?=&|$)/, '$1w=800'); }
  function fallbackN(n) { return 'assets/img/ilan/fallback-' + ((Math.abs(n) % 6) + 1) + '.svg'; }
  function telHref(tel) {
    /* "+90 542 370 08 08" | "0542 370 08 08" | "542…" → tel:+905423700808 */
    var dgt = String(tel || '').replace(/\D/g, '');
    if (!dgt) return TEL_HREF;
    if (dgt.charAt(0) === '0') dgt = dgt.slice(1);
    if (dgt.indexOf('90') !== 0) dgt = '90' + dgt;
    if (SITE.telefonHref && dgt === String(SITE.telefonHref).replace(/\D/g, '')) return SITE.telefonHref;
    return 'tel:+' + dgt;
  }
  function hasKoordinat(ilan) {
    var k = ilan && ilan.koordinat;
    return !!(k && typeof k.lat === 'number' && typeof k.lng === 'number' && isFinite(k.lat) && isFinite(k.lng));
  }
  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }
  function clampText(s, max) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    var cut = s.slice(0, max - 1), sp = cut.lastIndexOf(' ');
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut) + '…';
  }
  function pageUrl(ilan) { return SITE_URL + '/ilan.html?id=' + encodeURIComponent(ilan.id); }
  function rozetListesi(ilan) {
    var list = arr(ilan.rozetler).slice(0, 3);
    if ((ilan.durum || 'satista') !== 'satista') list = list.filter(function (r) { var k = T.slug(r); return k !== 'yeni' && k !== 'firsat'; });
    return list;
  }
  function adaParsel(ilan) {
    var ada = String(ilan.ada || '').trim(), parsel = String(ilan.parsel || '').trim();
    if (!ada && !parsel) return '—';
    if (!ada || ada === '0') return 'Parsel ' + parsel;
    return 'Ada ' + ada + ' / Parsel ' + parsel;
  }
  function waMesaj(ilan) {
    return 'Merhaba, ' + ilan.id + ' numaralı "' + ilan.baslik + '" ilanı hakkında bilgi almak istiyorum.';
  }

  /* ---------- head: title/meta/canonical + JSON-LD ---------- */
  function setHeadMeta(ilan) {
    var birim = T.formatBirim(ilan.fiyat, ilan.m2);
    var base = ilan.baslik + ' — ' + T.konum(ilan) + '. ' + T.formatM2(ilan.m2) + ', ' + ilan.imar + ', ' +
      String(ilan.tapu || '').toLocaleLowerCase('tr') + '. ' + T.formatFiyat(ilan.fiyat) + (birim ? ' (' + birim + ')' : '') + '.';
    var ek = ' Tapu ve imar kontrolü yapılmış, yerinde gösterilen ilan.';
    /* son cümle yalnızca 160 karaktere sığıyorsa eklenir; clampText güvenlik ağı */
    var desc = (base + ek).length <= 160 ? base + ek : base;
    T.setTitle(ilan.baslik + ' · ' + T.formatM2(ilan.m2), clampText(desc, 160));
    var canon = $('link[rel="canonical"]'); if (canon) canon.setAttribute('href', pageUrl(ilan));
    var ogu = $('meta[property="og:url"]'); if (ogu) ogu.setAttribute('content', pageUrl(ilan));
    var ogi = $('meta[property="og:image"]'); if (ogi && ilan.foto) ogi.setAttribute('content', ilan.foto);
  }
  function injectJsonLd(ilan) {
    var avail = { satista: 'https://schema.org/InStock', rezerve: 'https://schema.org/LimitedAvailability', satildi: 'https://schema.org/SoldOut' };
    var ld = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      '@id': pageUrl(ilan),
      url: pageUrl(ilan),
      name: ilan.baslik,
      description: clampText(ilan.aciklama, 300),
      identifier: ilan.id,
      datePosted: ilan.eklenme,
      image: arr(ilan.fotolar).length ? ilan.fotolar : (ilan.foto ? [ilan.foto] : []),
      inLanguage: 'tr',
      about: {
        '@type': 'Place',
        name: T.konum(ilan),
        address: { '@type': 'PostalAddress', addressLocality: ilan.ilce || '', addressRegion: ilan.il || '', addressCountry: 'TR' }
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Tür', value: T.turAdi(ilan.tur) },
        { '@type': 'PropertyValue', name: 'Alan', value: ilan.m2, unitCode: 'MTK' },
        { '@type': 'PropertyValue', name: 'İmar durumu', value: ilan.imar },
        { '@type': 'PropertyValue', name: 'Tapu', value: ilan.tapu },
        { '@type': 'PropertyValue', name: 'Ada/Parsel', value: adaParsel(ilan) }
      ],
      offers: {
        '@type': 'Offer',
        url: pageUrl(ilan),
        price: ilan.fiyat,
        priceCurrency: 'TRY',
        availability: avail[ilan.durum] || avail.satista,
        validFrom: ilan.eklenme,
        seller: {
          '@type': 'RealEstateAgent',
          name: SITE.unvan || 'Tarlaal Gayrimenkul',
          telephone: SITE.telefon || '',
          address: { '@type': 'PostalAddress', streetAddress: 'Bankalar Caddesi', addressLocality: 'Kartal', addressRegion: 'İstanbul', addressCountry: 'TR' }
        }
      }
    };
    if (hasKoordinat(ilan)) {
      ld.about.geo = { '@type': 'GeoCoordinates', latitude: ilan.koordinat.lat, longitude: ilan.koordinat.lng };
    }
    var s = d.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    d.head.appendChild(s);
  }

  /* ---------- breadcrumb + başlık alanı ---------- */
  function renderBreadcrumb(ilan) {
    var ol = el('ilan-breadcrumb'); if (!ol) return;
    ol.innerHTML =
      '<li><a href="index.html">Anasayfa</a></li>' +
      '<li><a href="ilanlar.html">İlanlar</a></li>' +
      (ilan.il ? '<li><a href="ilanlar.html?il=' + encodeURIComponent(ilan.il) + '">' + esc(ilan.il) + '</a></li>' : '') +
      '<li><span aria-current="page" title="' + esc(ilan.baslik) + '">' + esc(ilan.baslik) + '</span></li>';
  }
  function setFavLabel(ilan, active) {
    $$('[data-fav="' + ilan.id + '"] [data-fav-label]').forEach(function (s) { s.textContent = active ? 'Favorilerde' : 'Favorilere ekle'; });
  }
  function renderHead(ilan) {
    var durum = ilan.durum || 'satista';
    el('ilan-kicker').innerHTML =
      '<span class="type">' + esc(T.turAdi(ilan.tur)) + '</span>' +
      '<span class="sep" aria-hidden="true">·</span><span>İlan No <b>' + esc(ilan.id) + '</b></span>' +
      (ilan.eklenme ? '<span class="sep" aria-hidden="true">·</span><time datetime="' + esc(ilan.eklenme) + '">' + esc(T.formatTarih(ilan.eklenme)) + '</time>' : '');
    el('ilan-title').textContent = ilan.baslik;
    el('ilan-loc').innerHTML = I.pin + '<span>' + esc(T.konum(ilan)) + '</span>' + (hasKoordinat(ilan) ? '<a href="#konum">Haritada gör</a>' : '');

    var badges = (durum !== 'satista' ? T.rozet(T.durumAdi(durum)) : '') + rozetListesi(ilan).map(T.rozet).join('');
    var bEl = el('ilan-badges');
    bEl.innerHTML = badges; bEl.hidden = !badges;

    var url = pageUrl(ilan);
    var waText = ilan.baslik + ' — ' + T.formatFiyat(ilan.fiyat) + ' · ' + T.formatM2(ilan.m2) + '\n' + url;
    el('ilan-actions').innerHTML =
      '<span class="share__label">Paylaş</span>' +
      '<button class="btn btn--ghost btn--sm" type="button" id="btn-copy">' + ICON_LINK + 'Kopyala</button>' +
      '<a class="btn btn--ghost btn--sm" href="https://wa.me/?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener" aria-label="WhatsApp\'ta paylaş">' + ICON_WA + 'WhatsApp</a>' +
      (durum !== 'satildi'
        ? '<button class="btn btn--ghost btn--sm fav-btn" type="button" data-fav="' + esc(ilan.id) + '" aria-pressed="false">' + I.heart + '<span data-fav-label>Favorilere ekle</span></button>'
        : '');
    el('btn-copy').addEventListener('click', function () {
      var p;
      try { p = T.copy(url); } catch (e) { p = Promise.reject(e); }
      p.then(function () { T.toast('İlan bağlantısı kopyalandı.', 'ok'); },
        function () { T.toast('Kopyalanamadı. Bağlantıyı adres çubuğundan kopyalayabilirsiniz.', 'err'); });
    });
    setFavLabel(ilan, T.isFavori(ilan.id));
    d.addEventListener('tarlaal:favori', function (e) { if (e.detail && e.detail.id === ilan.id) setFavLabel(ilan, e.detail.added); });
  }

  /* ---------- galeri ---------- */
  function renderGallery(ilan) {
    var root = el('ilan-gallery'); if (!root) return;
    var durum = ilan.durum || 'satista';
    var fotolar = arr(ilan.fotolar).filter(Boolean);
    if (!fotolar.length && ilan.foto) fotolar = [ilan.foto];
    if (!fotolar.length) fotolar = [T.fallbackFoto(ilan)];
    var n = fotolar.length, fbMain = T.fallbackFoto(ilan);
    var cls = 'gallery' + (n === 1 ? ' gallery--1' : n === 2 ? ' gallery--2' : n === 3 ? ' gallery--3' : '') + (durum === 'satildi' ? ' gallery--sold' : '');
    var rozetler = rozetListesi(ilan);
    var badge = durum !== 'satista' ? T.rozet(T.durumAdi(durum)) : (rozetler[0] ? T.rozet(rozetler[0]) : '');
    function altOf(i) { return ilan.baslik + ' — fotoğraf ' + (i + 1) + ' / ' + n; }

    var thumbs = n > 1 ? fotolar.map(function (f, i) {
      return '<button class="gallery__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" data-index="' + i + '" aria-label="Fotoğraf ' + (i + 1) + ' / ' + n + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
        '<img src="' + esc(thumbUrl(f)) + '" alt="" width="400" height="300" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(fallbackN(i)) + '\'">' +
        '</button>';
    }).join('') : '';

    root.innerHTML =
      '<div class="' + cls + '" id="gallery" role="group" aria-label="İlan fotoğrafları">' +
        '<figure class="gallery__main">' +
          '<span class="gallery__next gallery__next--static">' +
          '<img id="gallery-img" src="' + esc(fotolar[0]) + '" alt="' + esc(altOf(0)) + '" width="1200" height="900" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src=\'' + esc(fbMain) + '\'">' +
          '</span>' +
          badge +
          (n > 1
            ? '<button class="gallery__nav gallery__nav--prev" type="button" id="gallery-prev" aria-label="Önceki fotoğraf" title="Önceki fotoğraf">' + ICON_PREV + '</button>' +
              '<button class="gallery__nav gallery__nav--next" type="button" id="gallery-next" aria-label="Sonraki fotoğraf" title="Sonraki fotoğraf">' + ICON_NEXT + '</button>' +
              '<span class="gallery__count" id="gallery-count" aria-live="polite">1 / ' + n + '</span>'
            : '') +
        '</figure>' +
        thumbs +
      '</div>';

    if (n < 2) return;
    var img = el('gallery-img'), count = el('gallery-count'), btns = $$('.gallery__thumb', root), current = 0;
    function show(i) {
      i = ((i % n) + n) % n;
      if (i === current && img.getAttribute('src') === fotolar[i]) return;
      img.onerror = function () { this.onerror = null; this.src = fallbackN(i); };
      img.src = fotolar[i];
      img.alt = altOf(i);
      if (count) count.textContent = (i + 1) + ' / ' + n;
      btns.forEach(function (b, j) { b.classList.toggle('is-active', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      current = i;
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(parseInt(b.getAttribute('data-index'), 10) || 0); }); });
    el('gallery').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); btns[current].focus(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); btns[current].focus(); }
    });
    el('gallery-prev').addEventListener('click', function () { show(current - 1); });
    el('gallery-next').addEventListener('click', function () { show(current + 1); });
  }

  /* ---------- sağ sütun: fiyat + form ---------- */
  function renderSide(ilan) {
    var root = el('ilan-side'); if (!root) return;
    var durum = ilan.durum || 'satista';
    var birim = T.formatBirim(ilan.fiyat, ilan.m2);
    var head =
      '<div class="form-card__head">' +
        '<p class="eyebrow">' + (durum === 'satildi' ? 'Satıldığı fiyat' : 'Satış fiyatı') + '</p>' +
        '<span class="price price--lg">' + esc(T.formatFiyat(ilan.fiyat)) + '</span>' +
        '<span class="price__unit">' + esc([birim, T.formatM2(ilan.m2)].filter(Boolean).join(' · ')) + '</span>' +
        (durum === 'satista'
          ? '<p class="listing-card__note">' + (ilan.taksit
              ? '<span class="chip chip--accent">Taksit İmkânı</span><span>Bir kısmı peşin, kalanı vadeli ödeme planı yapılabilir; detayı danışmanınızla konuşun.</span>'
              : '<span class="chip">Peşin satış</span><span>Tapu devri genellikle ödemeyle aynı gün tapu müdürlüğünde yapılır; takvimi danışmanınızla netleştirin.</span>') + '</p>'
          : '') +
      '</div>';

    var body;
    if (durum === 'satildi') {
      body =
        '<div class="sold-box">' +
          '<span class="sold-box__icon" aria-hidden="true">' + ICON_SOLD + '</span>' +
          '<h3>Bu ilan satıldı</h3>' +
          '<p>Bu parsel yeni sahibini buldu. Aynı bölgede benzer özelliklerde ilanlarımız var; aşağıdan inceleyebilir ya da aradığınız parseli bize tarif edebilirsiniz.</p>' +
          '<a class="btn btn--primary btn--block" href="#benzer">Benzer ilanlara bakın</a>' +
          '<a class="btn btn--ghost btn--block" href="ilanlar.html?il=' + encodeURIComponent(ilan.il || '') + '">' + esc(ilan.il || 'Tüm') + ' ilanları</a>' +
        '</div>';
    } else {
      var rez = durum === 'rezerve'
        ? '<p class="listing-card__status">' + I.alert + '<span>Bu ilan şu an <strong>rezerve</strong>. Satış tamamlanmazsa ilk size haber verelim; bilgilerinizi bırakmanız yeterli.</span></p>'
        : '';
      body =
        rez +
        '<form class="form" data-form="bilgi" data-subject="İlan bilgi talebi" aria-label="İlan bilgi talebi formu">' +
          '<input type="hidden" name="ilan" value="' + esc(ilan.id + ' – ' + ilan.baslik) + '">' +
          '<div class="hp" aria-hidden="true"><label for="f-website">Web siteniz</label><input id="f-website" type="text" name="website" tabindex="-1" autocomplete="off"></div>' +
          '<div class="field"><label for="f-ad">Ad Soyad *</label><input id="f-ad" name="ad" type="text" required autocomplete="name" placeholder="Adınız ve soyadınız"></div>' +
          '<div class="field"><label for="f-telefon">Telefon *</label><input id="f-telefon" name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx"></div>' +
          '<div class="field"><label for="f-mesaj">Mesajınız</label><textarea id="f-mesaj" name="mesaj" rows="3">' + esc(ilan.id + ' numaralı ilan hakkında bilgi almak ve yerinde görmek istiyorum.') + '</textarea></div>' +
          '<div class="field field--check"><input id="f-kvkk" name="kvkk" type="checkbox" required><label for="f-kvkk">Kişisel verilerimin <a href="kvkk.html">KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum.</label></div>' +
          '<button class="btn btn--primary btn--block" type="submit">Bilgi Al</button>' +
          '<div class="form__status" hidden></div>' +
        '</form>' +
        '<div class="listing-card__cta">' +
          '<a class="btn btn--ghost btn--block" href="' + esc(TEL_HREF) + '">' + I.phone + 'Hemen Ara</a>' +
          '<a class="btn btn--wa btn--block" href="' + esc(T.whatsappUrl(waMesaj(ilan))) + '" target="_blank" rel="noopener">' + ICON_WA + 'WhatsApp</a>' +
        '</div>' +
        '<p class="form__note">' + esc(SITE.saatler || 'Hafta içi 09.00–18.30 · Cumartesi 10.00–16.00') + '. Yerinde gösterim için randevu alın.</p>';
    }
    root.innerHTML = '<div class="form-card listing-card">' + head + body + '</div>';
  }

  /* ---------- gövde: tablo, açıklama, özellikler, konum, danışman ---------- */
  function specTable(rows, caption) {
    return '<table class="spec-table"><caption class="visually-hidden">' + esc(caption) + '</caption><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }
  function danismanBul(ad) {
    var list = T.data().danismanlar;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].ad === ad) return list[i]; }
    return list[0] || null;
  }
  function agentHTML(ilan) {
    var k = danismanBul(ilan.danisman) || { ad: SITE.unvan || 'Tarlaal Gayrimenkul', unvan: 'Satış ekibi', bolge: '', tel: SITE.telefon || '' };
    var tel = k.tel || SITE.telefon || '';
    var wa = T.whatsappUrl('Merhaba ' + k.ad + ', ' + ilan.id + ' numaralı ilan için yazıyorum.');
    return (
      '<div class="agent">' +
        '<span class="agent__avatar" aria-hidden="true">' + esc(T.basHarf(k.ad)) + '</span>' +
        '<div class="agent__body">' +
          '<h3 class="agent__name">' + esc(k.ad) + '<span class="agent__role">' + esc(k.unvan || '') + '</span></h3>' +
          '<ul class="agent__meta">' +
            (k.bolge ? '<li>' + I.pin + '<span>' + esc(k.bolge) + '</span></li>' : '') +
            (tel ? '<li>' + I.phone + '<a href="' + esc(telHref(tel)) + '">' + esc(tel) + '</a></li>' : '') +
            '<li>' + I.check + '<span>Yerinde gösterim ve tapu takibi</span></li>' +
          '</ul>' +
        '</div>' +
        '<div class="agent__actions">' +
          '<a class="btn btn--primary btn--sm" href="' + esc(telHref(tel)) + '">' + I.phone + 'Ara</a>' +
          '<a class="btn btn--ghost btn--sm" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ICON_WA + 'WhatsApp</a>' +
        '</div>' +
      '</div>'
    );
  }
  function renderBody(ilan) {
    var root = el('ilan-body'); if (!root) return;
    var durum = ilan.durum || 'satista';
    var birim = T.formatBirim(ilan.fiyat, ilan.m2);
    var rows = [
      ['İlan No', '<span class="mono">' + esc(ilan.id) + '</span>'],
      ['Tür', esc(T.turAdi(ilan.tur))],
      ['Konum', esc(T.konum(ilan))],
      ['Alan', esc(T.formatM2(ilan.m2))],
      ['Fiyat', esc(T.formatFiyat(ilan.fiyat))],
      ['Birim fiyat', esc(birim || '—')],
      ['İmar durumu', esc(ilan.imar || '—')],
      ['Tapu', esc(ilan.tapu || '—')],
      ['Ada / Parsel', '<span class="mono">' + esc(adaParsel(ilan)) + '</span>'],
      ['Durum', durum === 'satista' ? '<span class="badge badge--new">Satışta</span>' : T.rozet(T.durumAdi(durum))],
      ['Taksit', ilan.taksit ? 'Var' : 'Yok'],
      ['Eklenme', esc(T.formatTarih(ilan.eklenme) || '—')]
    ];
    var ozellikler = arr(ilan.ozellikler).filter(Boolean);
    var k = hasKoordinat(ilan) ? ilan.koordinat : null;
    var ll = k ? k.lat + ',' + k.lng : '';

    root.innerHTML =
      '<section class="listing__section reveal" id="ozellikler-tablo" aria-labelledby="h-ozet">' +
        '<p class="eyebrow">Parsel bilgileri</p><h2 id="h-ozet">İlan özellikleri</h2>' +
        '<div class="specs-grid">' + specTable(rows, 'İlan kimlik, fiyat, imar, tapu ve durum bilgileri') + '</div>' +
      '</section>' +
      '<section class="listing__section reveal" id="aciklama" aria-labelledby="h-aciklama">' +
        '<p class="eyebrow">Danışman notu</p><h2 id="h-aciklama">Açıklama</h2>' +
        '<div class="prose">' + (paragraphs(ilan.aciklama) || '<p>Bu ilan için açıklama henüz eklenmedi; detaylar için bize ulaşın.</p>') + '</div>' +
      '</section>' +
      (ozellikler.length
        ? '<section class="listing__section reveal" id="ozellikler" aria-labelledby="h-ozellikler">' +
            '<p class="eyebrow">Öne çıkanlar</p><h2 id="h-ozellikler">Özellikler</h2>' +
            '<ul class="features-list">' + ozellikler.map(function (o) { return '<li class="chip chip--green">' + I.check + esc(o) + '</li>'; }).join('') + '</ul>' +
          '</section>'
        : '') +
      (k
        ? '<section class="listing__section reveal" id="konum" aria-labelledby="h-konum">' +
            '<p class="eyebrow">Harita</p><h2 id="h-konum">Konum</h2>' +
            '<div class="map-embed"><iframe src="https://maps.google.com/maps?q=' + esc(ll) + '&z=13&output=embed" title="' + esc(ilan.baslik) + ' — konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
            '<div class="map-meta"><span class="mono">' + esc(T.konum(ilan)) + ' · ' + esc(ll.replace(',', ', ')) + '</span>' +
            '<a href="https://www.google.com/maps?q=' + esc(ll) + '" target="_blank" rel="noopener">Google Haritalar\'da aç</a></div>' +
            '<p class="map-note">' + I.alert + '<span>Konum yaklaşıktır; kesin parsel sınırı yerinde gösterilir.</span></p>' +
          '</section>'
        : '') +
      '<section class="listing__section reveal" id="danisman" aria-labelledby="h-danisman">' +
        '<p class="eyebrow">Size yardımcı olacak kişi</p><h2 id="h-danisman">İlan danışmanı</h2>' +
        agentHTML(ilan) +
      '</section>';
  }

  /* ---------- benzer ilanlar ---------- */
  function renderBenzer(ilan) {
    var grid = el('benzer-grid'); if (!grid) return;
    var all = T.data().ilanlar.filter(function (x) { return x && x.durum !== 'satildi' && (!ilan || x.id !== ilan.id); });
    var list, title, eyebrow, linkHref, linkText;
    if (ilan) {
      var sameIl = all.filter(function (x) { return x.il === ilan.il; });
      sameIl.sort(function (a, b) { return (b.tur === ilan.tur ? 1 : 0) - (a.tur === ilan.tur ? 1 : 0); });
      var sameTur = all.filter(function (x) { return x.il !== ilan.il && x.tur === ilan.tur; });
      var rest = all.filter(function (x) { return x.il !== ilan.il && x.tur !== ilan.tur; });
      list = sameIl.concat(sameTur, rest).slice(0, 3);
      title = 'Benzer ilanlar';
      eyebrow = (ilan.il ? ilan.il + ' ve çevresi' : 'Portföyden');
      linkHref = 'ilanlar.html?il=' + encodeURIComponent(ilan.il || '');
      linkText = (ilan.il ? ilan.il + ' ilanları' : 'Tüm ilanlar');
    } else {
      list = all.filter(function (x) { return x.oneCikan; }).slice(0, 3);
      if (list.length < 3) list = list.concat(all.filter(function (x) { return !x.oneCikan; })).slice(0, 3);
      title = 'Öne çıkan ilanlar';
      eyebrow = 'Portföyden';
      linkHref = 'ilanlar.html';
      linkText = 'Tüm ilanlar';
    }
    el('benzer-title').textContent = title;
    el('benzer-eyebrow').textContent = eyebrow;
    var link = el('benzer-link'); link.setAttribute('href', linkHref); link.textContent = linkText;
    T.renderIlanlar(grid, list);
  }

  /* ---------- bulunamadı ---------- */
  function renderNotFound(id) {
    T.setTitle('İlan bulunamadı', 'Aradığınız ilan yayından kaldırılmış ya da bağlantı hatalı olabilir. Tarlaal portföyündeki satılık arsa, tarla ve arazi ilanlarının tamamına göz atın.');
    el('ilan-kicker').innerHTML = '<span class="type">İlan</span><span class="sep" aria-hidden="true">·</span><span>' +
      (id ? 'İlan No <b>' + esc(id) + '</b>' : 'İlan numarası belirtilmedi') + '</span>';
    el('ilan-title').textContent = 'İlan bulunamadı';
    el('ilan-loc').innerHTML = I.alert + '<span>Bu numarayla eşleşen bir ilan bulamadık.</span>';
    el('ilan-badges').hidden = true;
    el('ilan-actions').innerHTML = ''; /* tek CTA grubu .listing-notfound kutusunda */
    el('ilan-layout').hidden = true;
    el('ilan-notfound').hidden = false;
  }

  /* ---------- başlat ---------- */
  function boot() {
    var id = String(T.getQuery().get('id') || '').trim();
    var ilan = id ? T.ilanBul(id) : null;
    if (!ilan) {
      renderNotFound(id);
      renderBenzer(null);
      T.refresh(d);
      return;
    }
    el('ilan-layout').classList.toggle('listing--sold', ilan.durum === 'satildi');
    setHeadMeta(ilan);
    injectJsonLd(ilan);
    renderBreadcrumb(ilan);
    renderHead(ilan);
    renderGallery(ilan);
    renderSide(ilan);
    renderBody(ilan);
    renderBenzer(ilan);
    T.refresh(d);
    w.TARLAAL_ILAN = ilan;
  }
  /* Script body sonunda; iskelet DOM'da hazır → senkron çalış ki main.js'in
     DOMContentLoaded init'i (form yönetimi, favori, reveal) üretilen DOM'u da yakalasın. */
  if (el('ilan-layout')) boot(); else d.addEventListener('DOMContentLoaded', boot);
})(window, document);
