/* ==========================================================================
   Tarlaal — ilanlar.html sayfa betiği
   Filtre ↔ URL query iki yönlü senkron, sıralama, 9'lu sayfalama, bölge kartı
   ile il filtresi, dinamik başlık/kırıntı. Bağımlılık: config.js, data.js, main.js.
   Query sözleşmesi: tur, il, ilce, fiyatMin, fiyatMax, m2Min, m2Max, imar, tapu,
   taksit=1, deniz=1, sira, sayfa.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var T = w.TARLAAL;
  if (!T) return;

  var PER_PAGE = 9;
  var TURLER = ['tarla', 'arsa', 'arazi', 'bahce'];
  var SIRALAR = ['yeni', 'fiyat-artan', 'fiyat-azalan', 'm2-azalan', 'm2fiyat-artan'];
  var SIRA_ADI = { yeni: 'En yeni', 'fiyat-artan': 'Fiyat (artan)', 'fiyat-azalan': 'Fiyat (azalan)', 'm2-azalan': 'm² (büyükten küçüğe)', 'm2fiyat-artan': '₺/m² (artan)' };
  var IMAR_SIRA = ['Tarla vasıflı', 'Konut imarlı', 'Ticari imarlı', 'Bağ-bahçe', 'Köy yerleşik alanı', 'Sanayi imarlı'];
  var SSS_SORULAR = ['Tarla ile arsa arasındaki fark nedir?', 'Hisseli tapu nedir, riskleri nelerdir?', 'İmar durumunu nereden teyit edebilirim?', 'Taksitle arsa alabilir miyim?', 'Satın almadan önce hangi belgeleri inceleyebilirim?', 'İlandaki arsayı yerinde görebilir miyim?'];
  var SSS_KATEGORILER = ['Satın alma', 'Tapu & İmar', 'Ödeme'];
  var ICON_X = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function esc(s) { return T.esc(s); }
  function trCmp(a, b) { return String(a).localeCompare(String(b), 'tr'); }
  function uniq(list) { var out = []; list.forEach(function (x) { if (x && out.indexOf(x) === -1) out.push(x); }); return out; }
  function toInt(v) { var n = parseInt(String(v === null || v === undefined ? '' : v).replace(/[^\d]/g, ''), 10); return isFinite(n) && n > 0 ? n : null; }

  var D = T.data();
  var ILANLAR = D.ilanlar;
  var ILLER = D.bolgeler.map(function (b) { return b.il; });
  ILANLAR.forEach(function (x) { if (x.il && ILLER.indexOf(x.il) === -1) ILLER.push(x.il); });

  var el = {
    form: $('#filtreler'), grid: $('#ilan-listesi'), count: $('#sonuc-sayisi'), sort: $('#f-sira'),
    pag: $('#sayfalama'), title: $('#sayfa-baslik'), lead: $('#sayfa-lead'), meta: $('#sayfa-meta'), crumb: $('#kirinti'),
    summary: $('#filtre-ozeti'), toggle: $('.filters__toggle'), toggleCount: $('[data-filter-count]'),
    il: $('#f-il'), ilce: $('#f-ilce'), imar: $('#f-imar'), tapu: $('#f-tapu'), bolgeler: $('#bolge-listesi'),
    resultsBar: $('.results-bar'), sss: $('#sss-liste')
  };
  if (!el.form || !el.grid) return;

  /* ---------- il / ilçe eşleme ---------- */
  function ilBul(v) {
    if (!v) return '';
    var s = T.slug(v);
    for (var i = 0; i < ILLER.length; i++) { if (ILLER[i] === v || T.slug(ILLER[i]) === s) return ILLER[i]; }
    return '';
  }
  function ilceler(il) {
    return uniq(ILANLAR.filter(function (x) { return x.il === il; }).map(function (x) { return x.ilce; })).sort(trCmp);
  }
  function ilceBul(il, v) {
    if (!il || !v) return '';
    var s = T.slug(v), list = ilceler(il);
    for (var i = 0; i < list.length; i++) { if (list[i] === v || T.slug(list[i]) === s) return list[i]; }
    return '';
  }
  function secenekBul(list, v) {
    if (!v) return '';
    var s = T.slug(v);
    for (var i = 0; i < list.length; i++) { if (list[i] === v || T.slug(list[i]) === s) return list[i]; }
    return '';
  }
  var IMARLAR = uniq(ILANLAR.map(function (x) { return x.imar; })).sort(function (a, b) {
    var ia = IMAR_SIRA.indexOf(a), ib = IMAR_SIRA.indexOf(b);
    if (ia === -1) ia = 99; if (ib === -1) ib = 99;
    return ia - ib || trCmp(a, b);
  });
  var TAPULAR = uniq(ILANLAR.map(function (x) { return x.tapu; })).sort(trCmp);

  /* ---------- durum ---------- */
  function bosDurum() {
    return { tur: [], il: '', ilce: '', fiyatMin: null, fiyatMax: null, m2Min: null, m2Max: null, imar: '', tapu: '', taksit: false, deniz: false, sira: 'yeni', sayfa: 1 };
  }
  function queryOku() {
    var q = T.getQuery(), s = bosDurum();
    var tur = (q.get('tur') || '').split(',').map(function (t) { return T.slug(t); });
    s.tur = TURLER.filter(function (t) { return tur.indexOf(t) !== -1; });
    s.il = ilBul(q.get('il'));
    s.ilce = ilceBul(s.il, q.get('ilce'));
    s.fiyatMin = toInt(q.get('fiyatMin')); s.fiyatMax = toInt(q.get('fiyatMax'));
    s.m2Min = toInt(q.get('m2Min')); s.m2Max = toInt(q.get('m2Max'));
    s.imar = secenekBul(IMARLAR, q.get('imar'));
    s.tapu = secenekBul(TAPULAR, q.get('tapu'));
    s.taksit = q.get('taksit') === '1';
    s.deniz = q.get('deniz') === '1';
    s.sira = SIRALAR.indexOf(q.get('sira')) !== -1 ? q.get('sira') : 'yeni';
    s.sayfa = toInt(q.get('sayfa')) || 1;
    return s;
  }
  function queryNesnesi(s) {
    return {
      tur: s.tur.length ? s.tur.join(',') : null, il: s.il || null, ilce: s.ilce || null,
      fiyatMin: s.fiyatMin, fiyatMax: s.fiyatMax, m2Min: s.m2Min, m2Max: s.m2Max,
      imar: s.imar || null, tapu: s.tapu || null, taksit: s.taksit ? '1' : null, deniz: s.deniz ? '1' : null,
      sira: s.sira !== 'yeni' ? s.sira : null, sayfa: s.sayfa > 1 ? s.sayfa : null
    };
  }
  function queryString(s) {
    var o = queryNesnesi(s), q = new URLSearchParams();
    Object.keys(o).forEach(function (k) { if (o[k] !== null && o[k] !== undefined && o[k] !== '') q.set(k, String(o[k])); });
    var qs = q.toString();
    return qs ? '?' + qs : '';
  }
  function formOku() {
    var s = bosDurum(), f = el.form;
    s.tur = $$('input[name="tur"]:checked', f).map(function (i) { return i.value; });
    s.il = ilBul(el.il.value);
    s.ilce = ilceBul(s.il, el.ilce.value);
    s.fiyatMin = toInt($('#f-fiyat-min', f).value); s.fiyatMax = toInt($('#f-fiyat-max', f).value);
    s.m2Min = toInt($('#f-m2-min', f).value); s.m2Max = toInt($('#f-m2-max', f).value);
    if (s.fiyatMin && s.fiyatMax && s.fiyatMin > s.fiyatMax) { var t1 = s.fiyatMin; s.fiyatMin = s.fiyatMax; s.fiyatMax = t1; }
    if (s.m2Min && s.m2Max && s.m2Min > s.m2Max) { var t2 = s.m2Min; s.m2Min = s.m2Max; s.m2Max = t2; }
    s.imar = el.imar.value; s.tapu = el.tapu.value;
    s.taksit = !!$('input[name="taksit"]', f).checked;
    s.deniz = !!$('input[name="deniz"]', f).checked;
    s.sira = el.sort.value;
    s.sayfa = 1;
    return s;
  }
  function formDoldur(s) {
    var f = el.form;
    $$('input[name="tur"]', f).forEach(function (i) { i.checked = s.tur.indexOf(i.value) !== -1; });
    el.il.value = s.il;
    ilceDoldur(s.il, s.ilce);
    $('#f-fiyat-min', f).value = s.fiyatMin || ''; $('#f-fiyat-max', f).value = s.fiyatMax || '';
    $('#f-m2-min', f).value = s.m2Min || ''; $('#f-m2-max', f).value = s.m2Max || '';
    el.imar.value = s.imar; el.tapu.value = s.tapu;
    $('input[name="taksit"]', f).checked = s.taksit;
    $('input[name="deniz"]', f).checked = s.deniz;
    el.sort.value = s.sira;
  }
  function ilceDoldur(il, secili) {
    var list = il ? ilceler(il) : [];
    el.ilce.innerHTML = '<option value="">' + (il ? 'Tüm ilçeler' : 'Önce il seçin') + '</option>' +
      list.map(function (x) { return '<option value="' + esc(x) + '"' + (x === secili ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
    el.ilce.disabled = !il;
  }
  function secenekleriDoldur() {
    el.il.innerHTML = '<option value="">Tüm iller</option>' + ILLER.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('');
    el.imar.innerHTML = '<option value="">Tümü</option>' + IMARLAR.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('');
    el.tapu.innerHTML = '<option value="">Tümü</option>' + TAPULAR.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('');
  }

  /* ---------- süzme / sıralama ---------- */
  function denizManzarali(x) {
    return (x.rozetler || []).some(function (r) { return T.slug(r) === 'deniz-manzarali'; });
  }
  function suz(s) {
    return ILANLAR.filter(function (x) {
      if (s.tur.length && s.tur.indexOf(x.tur) === -1) return false;
      if (s.il && x.il !== s.il) return false;
      if (s.ilce && x.ilce !== s.ilce) return false;
      if (s.fiyatMin && x.fiyat < s.fiyatMin) return false;
      if (s.fiyatMax && x.fiyat > s.fiyatMax) return false;
      if (s.m2Min && x.m2 < s.m2Min) return false;
      if (s.m2Max && x.m2 > s.m2Max) return false;
      if (s.imar && x.imar !== s.imar) return false;
      if (s.tapu && x.tapu !== s.tapu) return false;
      if (s.taksit && !x.taksit) return false;
      if (s.deniz && !denizManzarali(x)) return false;
      return true;
    });
  }
  function sirala(list, sira) {
    var cmp;
    switch (sira) {
      case 'fiyat-artan': cmp = function (a, b) { return a.fiyat - b.fiyat; }; break;
      case 'fiyat-azalan': cmp = function (a, b) { return b.fiyat - a.fiyat; }; break;
      case 'm2-azalan': cmp = function (a, b) { return b.m2 - a.m2; }; break;
      case 'm2fiyat-artan': cmp = function (a, b) { return (a.fiyat / (a.m2 || 1)) - (b.fiyat / (b.m2 || 1)); }; break;
      default: cmp = function (a, b) { return String(b.eklenme || '').localeCompare(String(a.eklenme || '')) || String(b.id).localeCompare(String(a.id)); };
    }
    return list.slice().sort(function (a, b) {
      var sa = a.durum === 'satildi' ? 1 : 0, sb = b.durum === 'satildi' ? 1 : 0; /* satılanlar hep sonda */
      return (sa - sb) || cmp(a, b) || String(a.id).localeCompare(String(b.id));
    });
  }

  /* ---------- başlık / kırıntı ---------- */
  function turMetni(s) {
    if (!s.tur.length) return '';
    var adlar = s.tur.map(T.turAdi);
    return adlar.length > 1 ? adlar.slice(0, -1).join(', ') + ' ve ' + adlar[adlar.length - 1] : adlar[0];
  }
  function baslikHTML(s) {
    var tur = turMetni(s);
    var yer = s.il ? (s.ilce ? s.ilce + ', ' + s.il : s.il) : '';
    if (yer) return '<em class="em-accent">' + esc(yer) + '</em> Satılık ' + esc(tur || 'Arsa, Tarla ve Arazi') + ' İlanları';
    if (tur) return 'Satılık <em class="em-accent">' + esc(tur) + '</em> İlanları';
    return 'Satılık Arsa, Tarla ve <em class="em-accent">Arazi</em> İlanları';
  }
  function baslikDuz(s) { return baslikHTML(s).replace(/<[^>]+>/g, ''); }
  function yerMetni(s) { return s.il ? (s.ilce ? s.ilce + ' / ' + s.il : s.il) + ' bölgesinde' : 'Marmara genelinde'; }
  function leadMetni(s, n) {
    var tur = turMetni(s), turK = tur ? tur.toLocaleLowerCase('tr') : '';
    if (!n) return yerMetni(s) + ' tapu ve imar durumu kontrol edilmiş, yerinde gösterilen portföy. Bu filtrelere uygun ' + (turK ? turK + ' ilanı' : 'ilan') + ' şu an yok; filtreleri genişletin ya da bize yazın.';
    return yerMetni(s) + ' tapu ve imar durumu kontrol edilmiş, yerinde gösterilen ' + n + (turK ? ' ' + turK + ' ilanı.' : ' ilan.') + ' Her ilanda ada/parsel, imar ve tapu bilgisi açıkça yazılı.';
  }
  /* Sayısız, sabit meta açıklaması (yalnızca ilk yüklemede yazılır) */
  function aciklamaMetni(s) {
    var tur = turMetni(s), turK = tur ? tur.toLocaleLowerCase('tr') : 'arsa, tarla ve arazi';
    return yerMetni(s).replace(/^./, function (c) { return c.toLocaleUpperCase('tr'); }) + ' satılık ' + turK + ' ilanları. Tapu ve imar durumu kontrol edilmiş, yerinde gösterilen parseller; il, fiyat ve m² filtreleriyle arayın.';
  }
  var ilkYukleme = true;
  function basliklariGuncelle(s, n) {
    if (el.title) el.title.innerHTML = baslikHTML(s);
    if (el.lead) el.lead.textContent = leadMetni(s, n);
    T.setTitle(baslikDuz(s), ilkYukleme ? aciklamaMetni(s) : '');
    ilkYukleme = false;
    if (el.crumb) {
      var parts = ['<li><a href="index.html">Anasayfa</a></li>'];
      if (s.il || s.tur.length) {
        parts.push('<li><a href="ilanlar.html">İlanlar</a></li>');
        var ilLink = !!(s.tur.length || s.ilce);
        if (s.il) parts.push('<li' + (ilLink ? '' : ' aria-current="page"') + '>' + (ilLink ? '<a href="ilanlar.html?il=' + encodeURIComponent(s.il) + '">' + esc(s.il) + '</a>' : esc(s.il)) + '</li>');
        if (s.ilce) parts.push('<li' + (s.tur.length ? '' : ' aria-current="page"') + '>' + (s.tur.length ? '<a href="ilanlar.html?il=' + encodeURIComponent(s.il) + '&ilce=' + encodeURIComponent(s.ilce) + '">' + esc(s.ilce) + '</a>' : esc(s.ilce)) + '</li>');
        if (s.tur.length) parts.push('<li aria-current="page">' + esc(turMetni(s)) + '</li>');
      } else {
        parts.push('<li aria-current="page">İlanlar</li>');
      }
      el.crumb.innerHTML = parts.join('');
    }
    if (el.meta && !el.meta.getAttribute('data-ready')) {
      var toplam = ILANLAR.filter(function (x) { return x.durum !== 'satildi'; }).length;
      var sonTarih = ILANLAR.map(function (x) { return x.eklenme || ''; }).sort().pop();
      el.meta.innerHTML = '<li>' + toplam + ' aktif ilan · ' + ILLER.length + ' il</li><li>Yerinde gösterim</li>' + (sonTarih ? '<li>Son güncelleme: ' + esc(T.formatTarih(sonTarih)) + '</li>' : '');
      el.meta.setAttribute('data-ready', '1');
    }
  }

  /* ---------- filtre özeti ---------- */
  /* Tek taraflı aralıkları Türkçe ifade et: "1.000.000 ₺'ye kadar", "2.000.000 ₺ ve üzeri", "1.000 – 5.000 m²" */
  function aralikMetni(min, max, birim) {
    if (min && max) return T.formatSayi(min) + ' – ' + T.formatSayi(max) + ' ' + birim;
    if (max) return T.formatSayi(max) + ' ' + birim + '\u2019ye kadar';
    return T.formatSayi(min) + ' ' + birim + ' ve üzeri';
  }
  function aktifFiltreler(s) {
    var out = [];
    if (s.tur.length) s.tur.forEach(function (t) { out.push({ k: 'tur', v: t, ad: T.turAdi(t) }); });
    if (s.il) out.push({ k: 'il', ad: s.il });
    if (s.ilce) out.push({ k: 'ilce', ad: s.ilce });
    if (s.fiyatMin || s.fiyatMax) out.push({ k: 'fiyat', ad: 'Fiyat: ' + aralikMetni(s.fiyatMin, s.fiyatMax, '₺') });
    if (s.m2Min || s.m2Max) out.push({ k: 'm2', ad: 'Büyüklük: ' + aralikMetni(s.m2Min, s.m2Max, 'm²') });
    if (s.imar) out.push({ k: 'imar', ad: s.imar });
    if (s.tapu) out.push({ k: 'tapu', ad: s.tapu });
    if (s.taksit) out.push({ k: 'taksit', ad: 'Taksitli' });
    if (s.deniz) out.push({ k: 'deniz', ad: 'Deniz manzaralı' });
    return out;
  }
  function filtreKaldir(s, k, v) {
    switch (k) {
      case 'tur': s.tur = s.tur.filter(function (t) { return t !== v; }); break;
      case 'il': s.il = ''; s.ilce = ''; break;
      case 'ilce': s.ilce = ''; break;
      case 'fiyat': s.fiyatMin = null; s.fiyatMax = null; break;
      case 'm2': s.m2Min = null; s.m2Max = null; break;
      case 'imar': s.imar = ''; break;
      case 'tapu': s.tapu = ''; break;
      case 'taksit': s.taksit = false; break;
      case 'deniz': s.deniz = false; break;
    }
    s.sayfa = 1;
    return s;
  }
  function ozetGuncelle(s) {
    var list = aktifFiltreler(s);
    if (el.toggleCount) { el.toggleCount.textContent = String(list.length); el.toggleCount.hidden = !list.length; }
    if (!el.summary) return;
    if (!list.length) { el.summary.hidden = true; el.summary.innerHTML = ''; return; }
    el.summary.innerHTML = '<span class="filters__summary-label">AKTİF FİLTRELER</span>' +
      list.map(function (f) {
        return '<button class="chip" type="button" data-remove="' + esc(f.k) + '"' + (f.v ? ' data-value="' + esc(f.v) + '"' : '') + ' aria-label="' + esc(f.ad) + ' filtresini kaldır">' + esc(f.ad) + ICON_X + '</button>';
      }).join('') +
      '<button class="btn-link" type="button" data-clear>Tümünü temizle</button>';
    el.summary.hidden = false;
  }

  /* ---------- sayfalama ---------- */
  function sayfalamaHTML(s, toplamSayfa) {
    if (toplamSayfa <= 1) return '';
    var cur = s.sayfa, items = [], i;
    function href(n) { var c = JSON.parse(JSON.stringify(s)); c.sayfa = n; return 'ilanlar.html' + queryString(c) + '#ilanlar'; }
    function link(n, label, aria, cls) {
      return '<li><a class="' + (cls || '') + '" href="' + esc(href(n)) + '" data-sayfa="' + n + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + (n === cur ? ' aria-current="page"' : '') + '>' + label + '</a></li>';
    }
    items.push(cur > 1 ? link(cur - 1, '‹', 'Önceki sayfa') : '<li><span class="is-disabled" aria-hidden="true">‹</span></li>');
    var pages = [];
    for (i = 1; i <= toplamSayfa; i++) { if (toplamSayfa <= 7 || i === 1 || i === toplamSayfa || Math.abs(i - cur) <= 2) pages.push(i); }
    var last = 0;
    pages.forEach(function (p) {
      if (p - last > 1) items.push('<li><span class="pagination__dots" aria-hidden="true">…</span></li>');
      items.push(link(p, String(p), 'Sayfa ' + p));
      last = p;
    });
    items.push(cur < toplamSayfa ? link(cur + 1, '›', 'Sonraki sayfa') : '<li><span class="is-disabled" aria-hidden="true">›</span></li>');
    return '<ul class="pagination">' + items.join('') + '</ul>';
  }

  /* ---------- boş sonuçta en yakın ilanlar ---------- */
  function enYakinHTML(s) {
    /* Fiyat/m² sınırlarını ve ilçeyi gevşet; tür/il korunursa ona, yoksa tüm portföye bak */
    var g = JSON.parse(JSON.stringify(s)); g.fiyatMin = null; g.fiyatMax = null; g.m2Min = null; g.m2Max = null; g.ilce = '';
    var list = suz(g).filter(function (x) { return x.durum !== 'satildi'; });
    if (!list.length) { g.tur = []; g.taksit = false; g.deniz = false; g.imar = ''; g.tapu = ''; list = suz(g).filter(function (x) { return x.durum !== 'satildi'; }); }
    if (!list.length) return '';
    list = sirala(list, s.fiyatMax ? 'fiyat-artan' : s.sira).slice(0, 3);
    return '<div class="nearest"><h3 class="nearest__title">Kriterlerinize en yakın ilanlar</h3>' +
      '<div class="grid grid--3 nearest__grid">' + list.map(T.ilanKarti).join('') + '</div></div>';
  }

  /* ---------- SSS: alıcı / tapu-imar / ödeme soruları ---------- */
  function sssDoldur() {
    if (!el.sss || el.sss.children.length) return;
    var havuz = (D.sss || []).filter(function (x) { return SSS_KATEGORILER.indexOf(x.kategori) !== -1; });
    var secili = SSS_SORULAR.map(function (q) { return havuz.filter(function (x) { return x.soru === q; })[0]; }).filter(Boolean);
    havuz.forEach(function (x) { if (secili.length < 6 && secili.indexOf(x) === -1) secili.push(x); });
    if (!secili.length) return;
    el.sss.innerHTML = secili.slice(0, 6).map(T.sssHTML).join('');
    T.refresh(el.sss);
  }

  /* ---------- render ---------- */
  var durum = bosDurum();
  function render(s, opts) {
    opts = opts || {};
    var list = sirala(suz(s), s.sira);
    var toplam = list.length, toplamSayfa = Math.max(1, Math.ceil(toplam / PER_PAGE));
    if (s.sayfa > toplamSayfa) { s.sayfa = toplamSayfa; T.setQuery(queryNesnesi(s), { replace: true }); }
    var bas = (s.sayfa - 1) * PER_PAGE, sayfaListesi = list.slice(bas, bas + PER_PAGE);

    el.grid.setAttribute('aria-busy', 'true');
    var satilan = list.filter(function (x) { return x.durum === 'satildi'; }).length;
    var aktif = toplam - satilan;
    if (!toplam) {
      el.grid.innerHTML =
        '<div class="empty">' +
          '<h3>Bu kriterlere uygun ilan bulunamadı</h3>' +
          '<p>Filtreleri genişletmeyi deneyin ya da bize yazın; aradığınız bölgede yeni bir parsel girdiğinde haber verelim.</p>' +
          '<div class="empty__actions"><button class="btn btn--primary" type="button" data-clear>Filtreleri Temizle</button><a class="btn btn--ghost" href="#katalog">Katalog isteyin</a></div>' +
        '</div>' + enYakinHTML(s);
      T.refresh(el.grid);
    } else {
      T.renderIlanlar(el.grid, sayfaListesi);
    }
    el.grid.setAttribute('aria-busy', 'false');

    if (el.count) {
      var aralik = toplam ? (bas + 1) + '–' + Math.min(bas + PER_PAGE, toplam) + ' arası gösteriliyor' : '';
      var tumuAktif = ILANLAR.filter(function (x) { return x.durum !== 'satildi'; }).length;
      el.count.innerHTML = '<strong>' + aktif + '</strong> ilan bulundu' +
        (satilan ? ' <span class="results-bar__meta">· ' + satilan + ' satılan ilan listenin sonunda</span>' : '') +
        (aktif !== tumuAktif ? ' <span class="results-bar__meta">· toplam ' + tumuAktif + ' aktif ilan içinde</span>' : '') +
        (s.sira !== 'yeni' && SIRA_ADI[s.sira] ? ' <span class="results-bar__meta">· ' + esc(SIRA_ADI[s.sira]) + ' sırasıyla</span>' : '') +
        (toplamSayfa > 1 ? ' <span class="results-bar__meta">· ' + esc(aralik) + '</span>' : '');
    }
    if (el.pag) el.pag.innerHTML = sayfalamaHTML(s, toplamSayfa);
    basliklariGuncelle(s, aktif);
    ozetGuncelle(s);
    if (el.bolgeler) $$('.region-card', el.bolgeler).forEach(function (c) { c.classList.toggle('is-active', !!s.il && c.getAttribute('data-il') === s.il); });
    if (opts.scroll && el.resultsBar) {
      el.resultsBar.scrollIntoView({ block: 'start', behavior: w.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    /* Klavye/ekran okuyucu: yeniden basılan sayfalama/çip alanından sonra odağı sonuç sayacına taşı */
    if ((opts.scroll || opts.focus) && el.count) {
      try { el.count.focus({ preventScroll: true }); } catch (e) { el.count.focus(); }
    }
  }
  function uygula(s, opts) {
    opts = opts || {};
    durum = s;
    formDoldur(s);
    if (!opts.noPush) T.setQuery(queryNesnesi(s), { replace: !!opts.replace, hash: '' });
    render(s, opts);
  }

  /* ---------- olaylar ---------- */
  function bagla() {
    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      uygula(formOku(), { scroll: true });
    });
    el.il.addEventListener('change', function () { ilceDoldur(ilBul(el.il.value), ''); });
    el.sort.addEventListener('change', function () {
      var s = JSON.parse(JSON.stringify(durum)); s.sira = el.sort.value; s.sayfa = 1;
      uygula(s);
    });
    d.addEventListener('click', function (e) {
      var t = e.target;
      var clear = t.closest('[data-clear]');
      if (clear) { e.preventDefault(); var b = bosDurum(); b.sira = durum.sira; uygula(b, { scroll: !!clear.closest('.empty'), focus: true }); return; }
      var rm = t.closest('[data-remove]');
      if (rm) { e.preventDefault(); uygula(filtreKaldir(JSON.parse(JSON.stringify(durum)), rm.getAttribute('data-remove'), rm.getAttribute('data-value')), { focus: true }); return; }
      var pg = t.closest('[data-sayfa]');
      if (pg && el.pag && el.pag.contains(pg)) {
        e.preventDefault();
        var n = parseInt(pg.getAttribute('data-sayfa'), 10);
        if (n && n !== durum.sayfa) { var s = JSON.parse(JSON.stringify(durum)); s.sayfa = n; uygula(s, { scroll: true }); }
        return;
      }
      var rc = t.closest('.region-card');
      if (rc && el.bolgeler && el.bolgeler.contains(rc)) {
        e.preventDefault();
        var il = ilBul(rc.getAttribute('data-il'));
        var c = JSON.parse(JSON.stringify(durum));
        c.il = c.il === il ? '' : il; c.ilce = ''; c.sayfa = 1;
        uygula(c, { scroll: true });
        T.toast(c.il ? c.il + ' ilanları listelendi.' : 'İl filtresi kaldırıldı.', 'ok', 2200);
      }
    });
    w.addEventListener('popstate', function () { uygula(queryOku(), { noPush: true }); });
  }

  /* Header'da aynı anda birden çok aria-current="page" kalmasın (main.js initNav genel düzeltmesine kadar
     sayfa düzeyinde hafifletme): yol + query tam eşleşen tek link current olur, diğerleri .is-active alır. */
  function tekAriaCurrent() {
    var nav = $('.site-header');
    if (!nav) return;
    var search = w.location.search || '';
    var links = $$('a[aria-current="page"]', nav);
    if (links.length < 2) return;
    function skor(a) {
      var href = (a.getAttribute('href') || '').split('#')[0];
      var q = href.indexOf('?') !== -1 ? href.slice(href.indexOf('?')) : '';
      var hasHash = (a.getAttribute('href') || '').indexOf('#') !== -1;
      if (q === search && !hasHash) return 3;
      if (q === search) return 2;
      return q ? 0 : 1;
    }
    var best = links.slice().sort(function (a, b) { return skor(b) - skor(a); })[0];
    links.forEach(function (a) { if (a !== best) { a.removeAttribute('aria-current'); a.classList.add('is-active'); } });
  }

  function init() {
    secenekleriDoldur();
    tekAriaCurrent();
    sssDoldur();
    if (el.bolgeler && !el.bolgeler.getAttribute('data-rendered')) T.initRenders(d);
    bagla();
    uygula(queryOku(), { noPush: true });
    /* sayfa/sıra gibi geçersiz query değerlerini sessizce düzelt */
    var temiz = queryString(durum), mevcut = w.location.search || '';
    if (temiz !== mevcut) T.setQuery(queryNesnesi(durum), { replace: true });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
