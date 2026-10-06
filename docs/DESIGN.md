# Tarlaal.com — Tasarım ve Uygulama Brief'i

Bu belge, sitenin tüm sayfalarını ve bileşenlerini üreten herkes için **tek doğruluk kaynağıdır**.
Siteyi yazan her ajan bu belgeyi başından sonuna okur ve buradaki kurallara uyar.

---

## 0. Marka özeti

- **Marka:** Tarlaal (okunuşu "tarla al"). Alan adı: tarlaal.com
- **Ne yapar:** Arsa, tarla ve arazi **satın alır ve satar**. İki yönlü iş modeli:
  1. **Satılık ilanlar** — Tarlaal portföyündeki arsa/tarla/arazi ilanları (ana gelir).
  2. **"Arazinizi Satın" / Biz alalım** — Elinde tarla/arsa olan kişiden doğrudan satın alma (ekspertiz + hızlı ödeme).
- **Adres:** Bankalar Caddesi, Kartal / İstanbul (kapı numarası henüz yok; "No:" yazma).
- **Telefon ve WhatsApp (aynı numara):** +90 542 370 08 08 → `tel:+905423700808`, `https://wa.me/905423700808`.
- **E-posta:** info@tarlaal.com
- **Çalışma saatleri:** Hafta içi 09.00–18.30 · Cumartesi 10.00–16.00
- **Ton:** Dürüst, sakin, bilgi veren, baskı kurmayan. "Bir malı zorla satmıyoruz; gerçekleri konuşuyoruz." tavrı.
  Satış dili değil, **danışman** dili. Yatırımcıya saygılı, tapu/imar gibi teknik konularda net.
- **Kilit mesajlar (slogan adayları):**
  - "Tarlanı al. Tarlanı sat." (ana slogan)
  - "Toprağa yatırım, elinde tapu."
  - "Arsa, tarla, arazi — alırken de satarken de yanınızdayız."
- **Marka hikâyesi (kurgusal, tutarlı kullan):** 2014'te Kartal'da kurulmuş. Marmara (İstanbul, Tekirdağ, Kırklareli, Edirne, Çanakkale, Balıkesir, Sakarya, Kocaeli, Bursa) ağırlıklı portföy. 1.200+ tamamlanmış satış, 3.400+ dönüm el değiştirmiş arazi, 2.100+ mutlu yatırımcı, 9 ilde saha ekibi. (Bu sayılar sitede tutarlı kullanılmalı.)

## 1. Estetik yön: **"Kadastro editöryali"**

Tapu senedi, kadastro haritası ve toprak dokusundan ilham alan, sıcak ve ciddi bir **editöryal** görünüm.
Genel "kurumsal emlak sitesi" kalıbından uzak dur. Hatırlanacak tek şey: **parsel çizgileri + büyük Montserrat başlıklar + sıcak kâğıt zemin + tek ochre vurgu.**

- Zemin: sıcak kireç/kâğıt rengi (beyaz değil). Koyu bölümler: derin toprak kahvesi veya koyu çimen yeşili, üzerinde ince **grain** (noise) dokusu.
- Dekoratif motif: ince **parsel çizgileri** (hafif eğik grid), **kontur çizgileri** (topografya), tapu damgası gibi **küçük büyük-harfli etiketler** (letter-spacing 0.14–0.2em).
- Başlıklar: büyük, Montserrat 700, kelimenin bir kısmı *italik* ve ochre (örn. "Tarlanı **al**." → "al" ochre + italik).
- Fotoğraflar: hafif sıcak ton; kartlarda üstte foto, altta "parsel etiketi" çipleri (m², imar, tapu).
- Animasyon: sayfa yüklenince kademeli reveal (animation-delay), scroll ile `.reveal` sınıfı (IntersectionObserver), hover'da foto hafif scale(1.04) + kart gölgesi. Abartma; `prefers-reduced-motion` desteklenir.

### 1.1 Renk tokenları (CSS değişkenleri, `:root`)

```css
/* Toprak */
--toprak-900:#1C1410; --toprak-800:#2E2119; --toprak-700:#4A3528; --toprak-500:#7A5A3E; --toprak-300:#B9977A;
/* Çimen */
--cimen-900:#14301F; --cimen-700:#1F4D32; --cimen-500:#2F7A4B; --cimen-300:#8FBF9F; --cimen-100:#E3F0E7;
/* Buğday (vurgu) */
--bugday-500:#D9A441; --bugday-300:#EFD08A; --bugday-100:#FBF3DF;
/* Kireç (kâğıt zemin) */
--kirec-50:#FBF8F2; --kirec-100:#F3EEE4; --kirec-200:#E6DFD2; --kirec-300:#D3C9B8;
/* Metin */
--ink:#1C1410; --ink-2:#4A4038; --ink-3:#7B7066; --ink-inverse:#FBF8F2;
/* Durum */
--ok:#2F7A4B; --warn:#C27C1A; --danger:#B23A3A;
/* Semantik */
--bg:var(--kirec-50); --surface:#FFFFFF; --surface-2:var(--kirec-100); --border:var(--kirec-200);
--primary:var(--cimen-700); --primary-hover:var(--cimen-900); --accent:var(--bugday-500);
--radius-s:6px; --radius:12px; --radius-l:20px; --radius-xl:28px;
--shadow-s:0 1px 2px rgba(28,20,16,.06), 0 1px 1px rgba(28,20,16,.04);
--shadow:0 10px 30px -12px rgba(28,20,16,.18);
--shadow-l:0 30px 60px -20px rgba(28,20,16,.28);
--container:1200px; --gutter:clamp(16px, 4vw, 32px);
```

Kullanım: Birincil buton = `--primary` zemin + kireç metin. Vurgu (ochre) sadece: başlık içi italik kelime, fiyat, rozet "Fırsat", logo'daki "al" parseli, hover alt çizgi. **Mor/mavi gradient yok.**

### 1.2 Tipografi

Google Fonts (tek `<link>`; her sayfada aynı):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300..800;1,300..800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```
- `--font-display: "Montserrat", "Segoe UI", system-ui, sans-serif;` → h1–h3, fiyatlar, öne çıkan sayılar, logo yazısı (ağırlık 700; vurgu kelimeleri italik + ochre).
- `--font-body: "Montserrat", "Segoe UI", system-ui, sans-serif;` → gövde, butonlar, form (400/500/600).
- `--font-mono: "IBM Plex Mono", ui-monospace, monospace;` → ada/parsel numaraları, etiketler, küçük meta.
- Ölçek (clamp ile akışkan): h1 `clamp(2.4rem, 5.5vw, 4.5rem)` / lh 1.02 / wght 500 / letter-spacing -0.02em; h2 `clamp(1.9rem, 3.6vw, 3rem)`; h3 `clamp(1.25rem, 2vw, 1.6rem)`; gövde 1rem/1.6; küçük .875rem; etiket .75rem uppercase tracking .16em (mono veya body 600).
- Vurgu için `font-style: italic` (Montserrat italik) + ochre renk.
- Türkçe karakterler (ı, İ, ş, ğ, ü, ö, ç) her yerde doğru yazılır. Büyük harf dönüşümünde `text-transform: uppercase` yerine mümkünse metni elle büyük yaz (İ/ı sorunu için `lang="tr"` html'de zorunlu).

### 1.3 Logo

- **Mark:** 2×2 parsel ızgarası; parseller hafif eğik (kadastro gibi). Üç parsel yeşil tonları, **sağ alt parsel ochre** → "al" (satın al) fikri: "bu parsellerden biri sizin".
- **Wordmark:** `tarla` + `al` (ochre). Küçük harf, Montserrat 700, `letter-spacing:-0.03em`. Altında isteğe bağlı küçük etiket: `ARSA · TARLA · ARAZİ`.
- Dosyalar: `assets/img/logo.svg` (açık zemin için), `assets/img/logo-light.svg` (koyu zemin için), `assets/img/logo-mark.svg`, `assets/img/favicon.svg`.
- Header'da logo **partials/header.html** içinde inline SVG + HTML wordmark olarak gelir. Yeniden çizme.

## 2. Teknik kurallar

- **Saf statik site:** HTML + CSS + vanilla JS. Build yok, framework yok, npm bağımlılığı yok. Tüm sayfalar kök dizinde, tüm yollar **göreli** (`assets/...`, `ilanlar.html`). `file://` ile açıldığında da çalışmalı → **`fetch()` ile JSON yükleme yok**; veri `assets/js/data.js` içinde global değişkenle gelir.
- `<html lang="tr">`, `<meta charset="utf-8">`, viewport, `<title>` (biçim: `Sayfa Adı | Tarlaal`), `<meta name="description">` (140–160 karakter, Türkçe), Open Graph (`og:title`, `og:description`, `og:type`, `og:url`, `og:image` → Unsplash hero foto), `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">`, `<link rel="canonical" href="https://tarlaal.com/<sayfa>.html">`.
- Her sayfa sırasıyla yükler: Google Fonts link → `assets/css/style.css` → (varsa) `assets/css/<sayfa>.css`. Body sonunda: `assets/js/config.js` → `assets/js/data.js` → `assets/js/main.js` → (varsa) `assets/js/<sayfa>.js`.
- **Header ve footer, `partials/header.html` ve `partials/footer.html` dosyalarındaki HTML'in birebir kopyasıdır.** Sayfaya `<!-- @header -->…<!-- @/header -->` ve `<!-- @footer -->…<!-- @/footer -->` işaretleri arasında yapıştırılır. `python3 tools/sync_partials.py` bu blokları senkronlar; elle farklılaştırma yapma. Aktif menü vurgusu JS ile (`aria-current="page"`) atanır.
- Ana içerik `<main id="icerik">` içinde. Skip-link header partial'ında var.
- Erişilebilirlik: anlamlı başlık hiyerarşisi (sayfada tek `h1`), tüm `img` için `alt`, formlarda `label`, odak halkaları görünür (`:focus-visible`), kontrast AA, buton/link ayrımı doğru (`<a>` gezinir, `<button>` eylem).
- Responsive: mobil 360px'den 1600px'e. Breakpoint'ler: `640px`, `900px`, `1200px`. Mobilde hamburger menü (partial'da var, main.js açar/kapar). Hiçbir sayfada yatay kaydırma olmaz.
- Performans: `loading="lazy"` (hero hariç), `decoding="async"`, `width/height` veya `aspect-ratio`. Unsplash URL'lerinde `?auto=format&fit=crop&w=1200&q=70` kullan (küçük kartlar için `w=800`).
- Görseller: Unsplash (aşağıdaki havuz) + `onerror="this.onerror=null;this.src='assets/img/ilan/fallback-<n>.svg'"` yedeği (fallback-1.svg … fallback-6.svg; `n` = 1–6). Marka görselleri (logo, ikonlar, desenler) yerel SVG.
- Formlar: backend yok. `assets/js/main.js` içindeki `initForms()` tüm `form[data-form]` elemanlarını yönetir: honeypot alanı (`input name="website"` gizli), KVKK onay kutusu zorunlu, `SITE.formEndpoint` doluysa `fetch` POST (JSON), boşsa WhatsApp'a (`wa.me`) hazır mesajla yönlendirir ve sayfada başarı mesajı gösterir. Form HTML'i ajan tarafından, davranış main.js tarafından sağlanır.
- JS modülleri `window.TARLAAL` ad alanında (`TARLAAL.formatFiyat`, `TARLAAL.ilanKarti(ilan)` vb.). Sayfa script'leri bunları kullanır; aynı kart HTML'ini iki yerde yazma.
- Kod stili: 2 boşluk girinti, Türkçe sınıf adı **yok** (BEM-vari İngilizce: `.card`, `.card__media`, `.btn--primary`), Türkçe içerik **var**. Yorumlar kısa.

### 2.1 Fotoğraf havuzu (Unsplash, hepsi doğrulandı — 200 OK)

Format: `https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=1200&q=70`

| # | ID | İçerik | Kullan |
|---|----|--------|--------|
| 1 | 1500382017468-9049fed747ef | Gün batımında buğday tarlası, yol | Ana sayfa hero, tarla ilanları |
| 3 | 1500937386664-56d1dfef3854 | Buğday tarlasında el ele iki kişi | "Arazinizi satın" hero, hakkımızda |
| 4 | 1472214103451-9374bd1c798e | Yeşil vadi, gün batımı | Arazi ilanları |
| 6 | 1444858291040-58f756a3bdd6 | Ahır ve çiftlik arazisi, sonbahar | Çiftlik/bağ-bahçe ilanları |
| 8 | 1470071459604-3b5ec3a7fe05 | Sisli yeşil tepeler | Arazi/dağ manzaralı |
| 9 | 1506744038136-46273834b3fb | Dağ, nehir vadisi | Arazi |
| 11 | 1469474968028-56623f02e42e | Sisli tepeler, gün doğumu | Arazi, blog |
| 13 | 1465146344425-f00d5f5c8f07 | Gelincik tarlası | Tarla, bahar |
| 15 | 1475924156734-496f6cac6ec1 | Deniz, gün batımı | Deniz manzaralı arsa |
| 16 | 1501785888041-af3ef285b470 | Dağ gölü, tekne | Göl kenarı arazi |
| 17 | 1502082553048-f009c37129b9 | Çayırda büyük ağaç | Arsa, bahçe |
| 18 | 1518495973542-4542c06a5843 | Ağaç dalları arasından güneş | Blog, hakkımızda |
| 19 | 1507525428034-b723cf961d3e | Kumsal, dalga | Sahil arsası |
| 24 | 1495107334309-fcf20504a5ab | Yeşil tarla ve ağaç, mavi gök | Tarla, ilanlar hero |
| 27 | 1476231682828-37e571bc172f | Havadan orman ve yol | Orman kenarı arazi |
| 28 | 1533460004989-cef01064af7e | Çim yakın plan | Doku, arka plan |
| 5 | 1501004318641-b39e6451bec6 | Tek fidan (beyaz zemin) | Hakkımızda ikonik görsel |
| 7 | 1523348837708-15d4a09cfac2 | Saksıda fideler (üstten) | Blog, "Nasıl çalışır" |
| 22 | 1542601906990-b4d3fb778b09 | Avuçta fidan | Hakkımızda, değerler |
| 23 | 1416879595882-3373a0480b5b | Toprak ve kürek | Blog (toprak analizi) |
| 25 | 1466692476868-aef1dfb1e735 | Fide tepsisi | Blog |
| 2 | 1464226184884-fa280b87c399 | Sebze hasadı | Blog (tarım) |
| 26 | 1500651230702-0e2d8a49d4ad | Çilek toplama | Blog (hobi bahçesi) |
| 10 | 1441974231531-c6227db76b6e | Orman yolu | Orman arazisi |
| 14 | 1448375240586-882707db888b | Koyu orman | (az kullan) |
| 12 | 1426604966848-d7adac402bff | Kaya ve çam | Dağ arazisi |
| 20 | 1510798831971-661eb04b3739 | Göl kenarı ahşap ev | Hobi bahçesi / tiny house |
| 21 | 1504280390367-361c6d9f38f4 | Çadırdan orman manzarası | Blog (kamp alanı) |

Geçersiz (kullanma): 1473448912268-2022ce9509d6, 1455218873455-21062cc9c0ea.

## 3. Bileşen sözlüğü (style.css'te tanımlı olacak sınıflar)

Sayfa ajanları **bu sınıfları kullanır**; sayfaya özel ek stil gerekirse `assets/css/<sayfa>.css` dosyasına yazar.

- Düzen: `.container` (max `--container`, yan `--gutter`), `.container--narrow` (760px), `.container--wide` (1400px), `.section` (padding-block `clamp(56px, 9vw, 120px)`), `.section--tight`, `.section--dark` (toprak-900 zemin + grain + açık metin), `.section--green` (cimen-900), `.section--paper` (kirec-100), `.grid` + `.grid--2/--3/--4` (auto-fit, responsive), `.stack` (dikey boşluk), `.cluster` (yatay sarma).
- Tipografi: `.eyebrow` (etiket: mono/uppercase/ochre nokta ile), `.h-display` (h1 dev), `.lead` (büyük paragraf, ink-2), `.em-accent` (başlık içinde italik ochre kelime için `<em class="em-accent">`), `.muted`, `.mono`, `.price` (Montserrat 700, büyük), `.price__unit`.
- Butonlar: `.btn`, `.btn--primary`, `.btn--accent` (ochre zemin, koyu metin), `.btn--ghost` (çerçeveli), `.btn--light` (koyu zemin üstü), `.btn--sm`, `.btn--lg`, `.btn--block`, `.btn--icon`. İçinde `<svg class="icon">` olabilir.
- Rozet/çip: `.badge` (+ `.badge--new`, `.badge--deal` ochre, `.badge--sold`, `.badge--reserved`), `.chip` (parsel etiketi: ikon + metin; `.chip--mono`).
- Kart: `.card` (surface, radius-l, shadow-s, hover shadow), `.card__media` (aspect-ratio 4/3, overflow hidden, img scale hover), `.card__body`, `.card__title`, `.card__meta` (konum satırı, pin ikonu), `.card__chips`, `.card__footer` (fiyat + buton), `.card__fav` (kalp buton, sağ üst).
  - **İlan kartı HTML'i** `TARLAAL.ilanKarti(ilan)` fonksiyonundan (main.js) üretilir. Sayfalar bu fonksiyonu çağırır.
- Bölge kartı: `.region-card` (foto üstüne gradient, il adı + ilan sayısı + "İlanları Gör" oku).
- Sayfa banner'ı (referans sitedeki gibi): `.page-hero` (foto + koyu yeşil/toprak gradient, min-height 320px, radius-xl, container içinde kenarlardan boşluklu), `.page-hero__title`, `.breadcrumb` (Anasayfa / İlanlar), sağ altta büyük soluk logo mark (`.page-hero__mark`).
- Hero (ana sayfa): `.hero` (tam genişlik foto, gradient, min-height 88vh), `.hero__content`, `.hero__search` (arama kutusu: Tür / İl / Bütçe select'leri + "İlan Ara" butonu → `ilanlar.html?tur=&il=&fiyatMax=`), `.hero__stats` (3–4 sayı).
- Filtre barı: `.filters` (ilanlar sayfası: üstte yatay bar, mobilde "Filtrele" butonu ile açılan panel), `.filters__group`, `.select`, `.input`, `.range`, `.filters__actions`. Sonuç başlığı `.results-bar` (sonuç sayısı + sıralama select + görünüm).
- Form: `.form`, `.form__row` (2 kolon), `.field` (`label` + `input/select/textarea`), `.field--check` (checkbox satırı), `.form__note`, `.form__status` (başarı/hata mesajı, `[hidden]`), `.form-card` (kart içinde form, sticky sidebar için `.sticky`).
- SSS: `.faq` + `<details class="faq__item"><summary>…</summary><div class="faq__body">…</div></details>`; main.js tek seferde bir tane açık tutar (opsiyonel).
- Adım/süreç: `.steps` (numaralı 3–4 adım, mono numara, bağlayıcı çizgi), `.step`.
- Yorumlar: `.testimonial` (tırnak, metin, ad + şehir + "Tarla aldı / Arazisini sattı" etiketi), `.testimonial-grid` veya kaydırmalı `.carousel` (CSS scroll-snap; JS gerekmez).
- İstatistik: `.stat` (`.stat__num` Montserrat 700 büyük, `data-count` ile sayaç animasyonu main.js'te), `.stat__label`.
- Özellik/ikon kutusu: `.feature` (ikon daire + başlık + metin), `.feature--inline`.
- Tablo: `.spec-table` (ilan detay özellik tablosu, 2 kolon, zebra), `.spec-table th` küçük etiket.
- Galeri: `.gallery` (ana görsel + 4 küçük; mobilde yatay kaydırma), `.gallery__main`, `.gallery__thumb` (JS ile değişir).
- Banner/CTA: `.cta-band` (koyu yeşil, büyük başlık, iki buton), `.cta-band--accent`.
- Dekor: `.parcel-lines` (arka plana ince eğik grid; `background-image` ile iki `linear-gradient`), `.contours` (SVG data-URI kontur deseni), `.grain` (`::after` noise, inline SVG feTurbulence data-URI, opacity .08, `pointer-events:none`).
- Yardımcılar: `.reveal` (+`.reveal--delay-1..4`; görünür olunca `.is-visible` eklenir), `.visually-hidden`, `.text-center`, `.mt-*`/`.mb-*` (1–6), `.sticky` (top: header yüksekliği + 24px).
- Header/footer/çerez/WhatsApp butonu: partial'larda; stiller style.css'te (`.site-header`, `.topbar`, `.navbar`, `.brand`, `.nav`, `.nav__list`, `.has-sub`, `.sub`, `.nav-toggle`, `.site-footer`, `.footer__grid`, `.footer__bottom`, `.social`, `.cookie-bar`, `.wa-float`, `.to-top`).

## 4. Veri modeli — `assets/js/data.js`

```js
window.TARLAAL_DATA = {
  bolgeler: [ // ilanlar.html'de bölge kartları; sayılar data'dan JS ile hesaplanır
    { il: "İstanbul", slug: "istanbul", foto: "<unsplash url>", ozet: "Silivri, Çatalca, Şile hattında konut ve bağ-bahçe arsaları" },
    { il: "Tekirdağ", ... }, { il: "Kırklareli" }, { il: "Edirne" }, { il: "Çanakkale" }, { il: "Balıkesir" }, { il: "Sakarya" }, { il: "Kocaeli" }, { il: "Bursa" }
  ],
  ilanlar: [ {
    id: "TR-2026-0142",            // benzersiz, mono gösterilir ("İlan No")
    slug: "sarkoy-murefte-deniz-manzarali-tarla",
    baslik: "Şarköy Mürefte'de Deniz Manzaralı Tarla",
    tur: "tarla" | "arsa" | "arazi" | "bahce",   // bahce = bağ-bahçe / hobi bahçesi
    il: "Tekirdağ", ilce: "Şarköy", mahalle: "Mürefte",
    m2: 2450,
    fiyat: 1850000,                 // TL, tam sayı
    imar: "Tarla vasıflı" | "Konut imarlı" | "Ticari imarlı" | "Bağ-bahçe" | "Köy yerleşik alanı" | "Sanayi imarlı",
    tapu: "Müstakil tapu" | "Hisseli tapu",
    ada: "118", parsel: "7",
    durum: "satista" | "rezerve" | "satildi",
    rozetler: ["Yeni", "Fırsat", "Deniz Manzaralı", "Yola Cepheli", "Taksit İmkânı"],  // 0–3 adet
    ozellikler: ["Yola cepheli", "Elektrik yakın", "Su kuyusu", "Düz arazi", "Köye 2 km", "Asfalt yol"],
    aciklama: "2–4 paragraf, HTML yok, \n\n ile paragraf.",
    foto: "<unsplash url w=1200>", fotolar: ["<url>", "<url>", "<url>"],   // 3–4 foto, ilk foto = foto
    koordinat: { lat: 40.63, lng: 27.26 },
    eklenme: "2026-09-18",          // ISO
    oneCikan: true,                 // ana sayfa "Öne çıkanlar"
    taksit: true,
    danisman: "Ayşe Demir"          // isteğe bağlı
  } ],
  danismanlar: [ { ad: "Ayşe Demir", unvan: "Kıdemli Gayrimenkul Danışmanı", bolge: "Tekirdağ – Kırklareli", tel: "+90 542 370 08 08" }, ... 4 kişi ],
  yorumlar: [ { ad: "Mehmet K.", sehir: "Kadıköy", tip: "Tarla aldı", metin: "…", puan: 5 }, ... 6 adet ],
  sss: [ { soru: "…", cevap: "…", kategori: "Satın alma" | "Satış" | "Tapu & İmar" | "Ödeme" }, ... 10–12 adet ],
  blog: [ { slug: "arsa-alirken-dikkat-edilmesi-gerekenler", baslik: "…", ozet: "…", tarih: "2026-09-12", kategori: "Rehber", foto: "<url>", okuma: "6 dk", sayfa: "blog-arsa-alirken-dikkat-edilmesi-gerekenler.html" | null }, ... 6 adet ]
};
```

Gerçekçilik: **28–32 ilan**, 9 ilde dağılmış; fiyatlar bölgeye göre mantıklı (Kırklareli tarla ~250–900 TL/m², Silivri konut imarlı ~4.000–9.000 TL/m², Şarköy deniz manzaralı ~700–1.500 TL/m², Çanakkale ~500–1.200 TL/m²). m² 500–45.000 arası. Durum: çoğu `satista`, 3 `rezerve`, 2 `satildi`. İlçeler gerçek olsun (Silivri, Çatalca, Şile, Şarköy, Saray, Lüleburgaz, Vize, Pınarhisar, Keşan, İpsala, Enez, Biga, Lapseki, Ezine, Manyas, Bandırma, Erdek, Karasu, Kaynarca, Kandıra, Karamürsel, Mudanya, Karacabey, İznik…).

## 5. Sayfa haritası ve her sayfanın içeriği

Tüm sayfalar: `partials/header.html` + `<main id="icerik">` + `partials/footer.html`.

1. **index.html — Ana Sayfa**
   - `.hero`: foto #1, eyebrow "Kartal / İstanbul · 2014'ten beri", h1 "Tarlanı <em>al</em>. Tarlanı <em>sat</em>." lead; arama kutusu (Tür, İl, Bütçe → ilanlar.html query); altında 4 stat.
   - "Öne çıkan ilanlar" (6 kart, `oneCikan`), "Tümünü gör" linki.
   - "Nasıl çalışır" — iki yol yan yana: *Arsa/tarla alıyorum* (3 adım) · *Arazimi satıyorum* (3 adım).
   - "Neden Tarlaal" — 6 feature (Tapu güvencesi, İmar kontrolü, Yerinde gösterim, Şeffaf fiyat, Taksit seçenekleri, Satış sonrası destek).
   - Bölgeler (region-card, 6 tanesi + "Tüm bölgeler").
   - Yorumlar (3–6).
   - Blog'dan 3 yazı.
   - `.cta-band`: "Elinizde satmak istediğiniz bir tarla mı var?" → arazinizi-satin.html.
2. **ilanlar.html — İlanlar (referans sayfanın karşılığı)**
   - `.page-hero` (foto #24): h1 "Satılık Arsa, Tarla ve Arazi İlanları", breadcrumb Anasayfa / İlanlar. (Query'de `tur` varsa JS başlığı "Satılık Tarla İlanları" vb. yapar; `il` varsa "Tekirdağ Satılık Arsa İlanları".)
   - Bölge kartları şeridi (9 il, ilan sayısı dinamik; tıklayınca `?il=` filtresi uygulanır, sayfa yenilenmeden).
   - `.filters`: Tür (checkbox grubu veya select), İl, İlçe (ile bağlı), Fiyat min/max, m² min/max, İmar, Tapu, "Sadece taksitli", "Deniz manzaralı"; Temizle / Uygula. Filtreler URL query ile senkron (geri/ileri çalışır, link paylaşılabilir).
   - `.results-bar`: "24 ilan bulundu", sıralama (En yeni, Fiyat ↑, Fiyat ↓, m² ↓, ₺/m² ↑), görünüm grid/list (opsiyonel).
   - Kart ızgarası (`TARLAAL.ilanKarti`), sayfalama 9'ar (JS). Boş durum mesajı.
   - "Katalog talep formu" (ad, telefon, e-posta, ilgilendiği il, mesaj, KVKK) — `data-form="katalog"`.
   - Müşteri yorumları (3).
   - Bilgilendirici içerik + SSS (referanstaki gibi: "Arsa alırken nelere dikkat edilmeli?", "İmarlı arsa / tarla farkı", "Hisseli tapu nedir?"…) — 4–6 `details`.
   - Script: `assets/js/ilanlar.js`.
3. **ilan.html — İlan Detay** (`?id=TR-2026-0142`)
   - JS data'dan ilanı bulur; yoksa "İlan bulunamadı" + ilanlara dön. `<title>` ve meta JS ile güncellenir.
   - Breadcrumb, h1 başlık, konum satırı, rozetler, İlan No (mono), eklenme tarihi, paylaş (kopyala/WhatsApp), favori.
   - Galeri (ana + küçükler), sağda sticky `.form-card`: fiyat (büyük) + ₺/m² + "Bilgi Al" formu (ad, telefon, mesaj, KVKK) `data-form="bilgi"` + "Ara" ve "WhatsApp" butonları (wa.me mesajında ilan no + başlık).
   - `.spec-table`: İlan No, Tür, İl/İlçe/Mahalle, m², Fiyat, ₺/m², İmar, Tapu, Ada/Parsel, Durum, Taksit, Eklenme.
   - Açıklama, Özellikler (chip), Konum (Google Maps iframe: `https://maps.google.com/maps?q=LAT,LNG&z=13&output=embed`, `loading="lazy"`, `title`), "Benzer ilanlar" (aynı il veya tür, 3 kart), danışman kutusu.
   - JSON-LD (`RealEstateListing`/`Offer`) JS ile eklenir.
   - Script: `assets/js/ilan.js`.
4. **arazinizi-satin.html — Arazinizi Satın**
   - `.page-hero` (foto #3): h1 "Tarlanızı, arsanızı biz alalım." Satıcı odaklı.
   - 3 adım: Bilgi ver → 48 saatte ön değerleme → Noter/tapu ve ödeme. Neden bize satmalısınız (4 feature: komisyon yok, 48 saat, nakit/peşin, tapu masrafları bizden).
   - Büyük form (`data-form="satis"`): ad, telefon, e-posta, il, ilçe, m², tapu tipi (select), imar (select), ada/parsel (opsiyonel), beklenen fiyat (opsiyonel), açıklama, KVKK.
   - "Hangi arazileri alıyoruz?" (liste), SSS (4), yorum (2 "arazisini sattı").
5. **hakkimizda.html — Hakkımızda**
   - page-hero (foto #18), hikâye (2014, Kartal), değerler (dürüstlük, şeffaflık, yerinde inceleme), rakamlar (4 stat), ekip/danışmanlar (data'dan 4), zaman çizelgesi (2014 → 2026, 5 madde), belgeler/üyelikler metni, CTA.
6. **iletisim.html — İletişim**
   - h1 "Bize ulaşın", 3 kart (Telefon, WhatsApp, E-posta), adres kartı (Bankalar Caddesi, Kartal / İstanbul; saatler), Google Maps iframe (`https://maps.google.com/maps?q=Bankalar+Caddesi,+Kartal,+İstanbul&z=15&output=embed`), iletişim formu (`data-form="iletisim"`), "Ofise nasıl gelirim" (Marmaray/Metro Kartal, otopark).
7. **blog.html** — Liste (data'dan 6 yazı, kategori çipleri) · **blog-arsa-alirken-dikkat-edilmesi-gerekenler.html**, **blog-tarla-ile-arsa-arasindaki-fark.html**, **blog-hisseli-tapu-nedir.html** — 3 tam yazı (700–1000 kelime, h2/h3 yapısı, alıntı kutusu, "ilgili ilanlar" 3 kart, yazar kutusu, paylaş). Diğer 3 yazı listede var ama sayfası yok → **olmayan sayfa linki vermeyin**: yalnızca mevcut 3 yazıyı listede linkli göster, diğer 3'ü "Yakında" rozetiyle linksiz göster (`sayfa: null`).
8. **sss.html** — Tüm SSS (data'dan + ek), kategorili (Satın alma, Satış, Tapu & İmar, Ödeme).
9. **kvkk.html**, **gizlilik-politikasi.html**, **cerez-politikasi.html** — `.container--narrow`, hukuki metin (Türkçe, KVKK 6698 sayılı Kanun'a atıf, veri sorumlusu: Tarlaal Gayrimenkul, Bankalar Caddesi, Kartal / İstanbul). Birbirine ve iletişime link.
10. **404.html** — kısa, logo, "Bu parsel haritada yok." + ana sayfa / ilanlar linkleri.
11. **sitemap.xml**, **robots.txt**, **README.md** (kurulum, ilan ekleme, telefon/WhatsApp/form endpoint değiştirme, yayınlama: Netlify/Vercel/cPanel), **tools/sync_partials.py**, **tools/check.py** (link ve tutarlılık kontrolü).

## 6. Metin ve içerik ilkeleri

- Türkçe, "siz" hitabı, kısa cümleler. Emlak klişelerinden kaçın ("kaçırmayın!!!" yok). Sayılar tutarlı (bkz. §0).
- Yasal: Her formda KVKK onay kutusu: "Kişisel verilerimin <a href="kvkk.html">KVKK Aydınlatma Metni</a> kapsamında işlenmesini kabul ediyorum."
- Fiyat biçimi: `1.850.000 ₺` (binlik nokta, sonda ₺), ₺/m² tek ondalık yok: `755 ₺/m²`. m² biçimi: `2.450 m²`. Tarih: `18 Eylül 2026`.
- Rozet renkleri: Yeni=yeşil, Fırsat=ochre, Rezerve=gri, Satıldı=koyu/çizgili.
