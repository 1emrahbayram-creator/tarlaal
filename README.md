# Tarlaal.com

**Tarlaal** ("tarla al"), Marmara Bölgesi'nde arsa, tarla ve arazi **satın alan ve satan** bir gayrimenkul markasıdır. Bu depo, tarlaal.com'un **tamamen statik** web sitesini içerir: HTML + CSS + vanilla JavaScript. Derleme adımı, framework ve npm bağımlılığı yoktur; klasörü olduğu gibi herhangi bir statik sunucuya kopyalamanız yeterlidir.

- Adres: Bankalar Caddesi, Kartal / İstanbul
- Tasarım ve içerik kuralları: [`docs/DESIGN.md`](docs/DESIGN.md) (tek doğruluk kaynağı)

## İçindekiler

1. [Dosya yapısı](#dosya-yapısı)
2. [Yerelde açma](#yerelde-açma)
3. [Yeni ilan ekleme ve düzenleme](#yeni-ilan-ekleme-ve-düzenleme)
4. [Telefon ve iletişim bilgilerini değiştirme](#telefon-ve-iletişim-bilgilerini-değiştirme)
5. [Form gönderimi (endpoint)](#form-gönderimi-endpoint)
6. [Yayınlama](#yayınlama)
7. [Kalite araçları](#kalite-araçları)
8. [Sayfa şablonu](#sayfa-şablonu)

## Dosya yapısı

```
tarlaal.com/
├── index.html                  Ana sayfa
├── ilanlar.html                İlan listesi (filtre, sıralama, sayfalama — URL ile senkron)
├── ilan.html                   İlan detayı (?id=TR-2026-0101)
├── arazinizi-satin.html        Satıcılar için "biz alalım" sayfası + satış formu
├── hakkimizda.html             Hikâye, değerler, ekip
├── iletisim.html               İletişim kartları, harita, form
├── blog.html                   Blog listesi
├── blog-*.html                 Tam blog yazıları (3 adet)
├── sss.html                    Sıkça sorulan sorular
├── kvkk.html, gizlilik-politikasi.html, cerez-politikasi.html
├── 404.html                    Bulunamadı sayfası
├── sitemap.xml, robots.txt
├── assets/
│   ├── css/style.css           Ortak stiller (tokenlar, bileşenler)
│   ├── css/<sayfa>.css         Sayfaya özel stil (varsa)
│   ├── js/config.js            İletişim bilgileri ve ayarlar (window.SITE)
│   ├── js/data.js              Tüm içerik verisi (window.TARLAAL_DATA)
│   ├── js/main.js              Ortak davranış ve yardımcılar (window.TARLAAL)
│   ├── js/<sayfa>.js           Sayfaya özel script (ilanlar.js, ilan.js …)
│   ├── img/                    Logo (logo.svg, logo-light.svg, logo-mark.svg), favicon.svg
│   ├── img/icons/              Şu an boş — arayüz ikonları partial'larda ve sayfalarda inline SVG olarak kullanılır
│   └── img/ilan/               İlan yedek görselleri (fallback-1…6.svg) ve kendi fotoğraflarınız
├── partials/
│   ├── header.html             Ortak üst bölüm (her sayfaya birebir kopyalanır)
│   └── footer.html             Ortak alt bölüm + WhatsApp butonu + çerez çubuğu
├── tools/
│   ├── sync_partials.py        Header/footer bloklarını tüm sayfalara dağıtır
│   ├── check.py                Bağlantı, meta ve veri tutarlılık kontrolü
│   ├── probe.sh / shot.sh / dom.sh   Headless Chrome ile ölçüm ve ekran görüntüsü
│   └── serve.js                Yerel sunucu; eksik yollar için 404.html'i servis eder (node tools/serve.js [port])
└── docs/DESIGN.md              Marka, renk, tipografi, bileşen ve veri modeli brief'i
```

Tüm yollar **göreli**dir (`assets/…`, `ilanlar.html`). Bu sayede site hem `file://` ile çift tıklayarak hem alt klasörde hem de kökte çalışır.

## Yerelde açma

Sayfalar `fetch()` kullanmadığı için dosyaları doğrudan tarayıcıda açabilirsiniz. Yine de Google Haritalar iframe'leri ve bazı tarayıcı kısıtları için yerel bir sunucu önerilir:

```bash
cd tarlaal.com
python3 -m http.server 8080
# → http://localhost:8080/
```

Özel 404 sayfasını (`404.html`) da görmek istiyorsanız depodaki küçük Node sunucusunu kullanın; `http.server` bilinmeyen yollar için kendi düz hata sayfasını döndürür, `serve.js` ise `404.html`'i servis eder:

```bash
node tools/serve.js        # → http://127.0.0.1:8765/
node tools/serve.js 3000   # farklı port
```

Alternatifler: `npx serve .` veya VS Code "Live Server" eklentisi.

## Yeni ilan ekleme ve düzenleme

Tüm ilanlar `assets/js/data.js` içindeki `ilanlar` dizisinde tutulur. Yeni ilan için diziye aşağıdaki alanlarla bir nesne ekleyin (sıra önemli değil; `ilanlar.html` eklenme tarihine göre sıralar):

```js
{
  id: "TR-2026-0131",                 // benzersiz; biçim TR-YYYY-NNNN (ilan.html?id=… ile açılır)
  slug: "sarkoy-murefte-deniz-manzarali-tarla",   // Türkçe karaktersiz, tire ile
  baslik: "Şarköy Mürefte'de Deniz Manzaralı Tarla",
  tur: "tarla",                       // tarla | arsa | arazi | bahce (bahce = bağ-bahçe / hobi bahçesi)
  il: "Tekirdağ", ilce: "Şarköy", mahalle: "Mürefte",
  m2: 2450,
  fiyat: 1850000,                     // TL, tam sayı (site "1.850.000 ₺" olarak biçimler)
  imar: "Tarla vasıflı",              // Tarla vasıflı | Konut imarlı | Ticari imarlı | Bağ-bahçe | Köy yerleşik alanı | Sanayi imarlı
  tapu: "Müstakil tapu",              // Müstakil tapu | Hisseli tapu
  ada: "118", parsel: "7",            // string; bilinmiyorsa "0"
  durum: "satista",                   // satista | rezerve | satildi
  rozetler: ["Yeni", "Deniz Manzaralı"],   // 0–3 adet: Yeni, Fırsat, Deniz Manzaralı, Yola Cepheli, Taksit İmkânı
  ozellikler: ["Yola cepheli", "Elektrik yakın", "Düz arazi"],
  aciklama: "Birinci paragraf.\n\nİkinci paragraf.",   // HTML yok; paragraflar \n\n ile
  foto: u(15),                        // kapak fotoğrafı (aşağıya bakın)
  fotolar: fotolar([15, 19, 13]),     // 3–4 foto; ilki = foto
  koordinat: { lat: 40.63, lng: 27.26 },
  eklenme: "2026-10-06",              // ISO tarih
  oneCikan: false,                    // ana sayfadaki "Öne çıkanlar" (tam 6 ilan true olmalı)
  taksit: false,                      // true ise rozetlere "Taksit İmkânı" da ekleyin
  danisman: "Ayşe Demir"              // danismanlar dizisindeki bir ad
}
```

**Fotoğraflar.** `data.js` başındaki `PHOTO` tablosu, `docs/DESIGN.md §2.1`'de doğrulanmış Unsplash fotoğraf ID'lerini numaralandırır; `u(n)` tek URL, `fotolar([..])` dizi üretir. Kendi fotoğrafınızı kullanmak için:

1. Dosyayı `assets/img/ilan/` altına koyun (öneri: 1200×900, JPEG, ≤ 250 KB).
2. `foto: "assets/img/ilan/sarkoy-118-7-1.jpg"` ve `fotolar: ["assets/img/ilan/…-1.jpg", "…-2.jpg"]` şeklinde göreli yol yazın.

**Yedek görsel.** Fotoğraf yüklenemezse kartlar ve galeri otomatik olarak `assets/img/ilan/fallback-1…6.svg` dosyalarından birini gösterir (`TARLAAL.fallbackFoto`). Bu dosyaları silmeyin.

**Durum değiştirme.** Satılan ilanı silmek yerine `durum: "satildi"` yapın; kart "SATILDI" şeridiyle görünür ve ilan bölge sayılarına (`TARLAAL.bolgeSayilari`) dahil edilmez. Rezerve ilanlar için `durum: "rezerve"` yapın; kart "Rezerve" rozetiyle görünür, listelerde ve bölge sayılarında kalmaya devam eder.

**Bölgeler, danışmanlar, yorumlar, SSS, blog.** Aynı dosyadaki `bolgeler`, `danismanlar`, `yorumlar`, `sss` ve `blog` dizilerini düzenleyin. Blog yazısına ait sayfa yoksa `sayfa: null` bırakın; liste onu "Yakında" rozetiyle, linksiz gösterir.

Düzenledikten sonra sözdizimini ve içeriği doğrulayın:

```bash
node --check assets/js/data.js
python3 tools/check.py
```

## Telefon ve iletişim bilgilerini değiştirme

1. **`assets/js/config.js`** — telefon, WhatsApp, e-posta, adres, çalışma saatleri ve sosyal medya adresleri burada (`window.SITE`). Sayfa yüklendiğinde `main.js`, `[data-site]` ve `[data-site-href]` öznitelikli tüm elemanları bu değerlerle günceller; formlar WhatsApp numarasını buradan okur.

   ```js
   telefon: "+90 542 370 08 08",
   telefonHref: "tel:+905423700808",
   whatsapp: "905423700808",      // ülke kodu ile, boşluksuz
   eposta: "info@tarlaal.com",
   adres: "Bankalar Caddesi, Kartal / İstanbul",
   ```

2. **`partials/header.html` ve `partials/footer.html`** — JS kapalıyken ve arama motorları için statik metinlerin de doğru olması gerekir. Aynı değerleri bu iki dosyada da güncelleyin (telefon, `tel:` linki, `wa.me/…`, e-posta, adres, saatler, sosyal medya linkleri).

3. Partial'ları tüm sayfalara dağıtın:

   ```bash
   python3 tools/sync_partials.py          # @header/@footer bloklarını yeniden yazar
   python3 tools/sync_partials.py --check  # sadece kontrol eder, fark varsa 1 ile çıkar
   ```

   Sayfalardaki header/footer'ı **elle düzenlemeyin**; bir sonraki senkronda üzerine yazılır.

4. Hukuki metinlerde (`kvkk.html`, `gizlilik-politikasi.html`, `cerez-politikasi.html`) adres geçiyorsa oraları da güncelleyin.

5. **Harita.** `iletisim.html`'deki Google Haritalar iframe'i adresi doğrudan kendi `src` sorgusundan alır (`maps.google.com/maps?q=Bankalar+Caddesi,+Kartal,+İstanbul&…`, dosyada `<iframe` satırı). `config.js`'deki `mapsQuery` alanı **şu an hiçbir yerde okunmuyor**; haritayı taşımak için iframe `src`'sini elle değiştirin (ve tutarlılık için `mapsQuery`'yi de güncelleyin).

## Form gönderimi (endpoint)

Site backend içermez. `form[data-form]` öznitelikli tüm formları `assets/js/main.js` yönetir: zorunlu alan, telefon/e-posta ve KVKK onayı doğrulanır; bot tuzağı (`input name="website"`) dolu gelirse gönderim yapılmaz.

- **`SITE.formEndpoint` boşsa (varsayılan):** form verisi hazır bir mesaja dönüştürülür ve `https://wa.me/<SITE.whatsapp>` ile WhatsApp açılır; sayfada başarı mesajı görünür. Kurulum gerektirmez.
- **`SITE.formEndpoint` doluysa:** veri JSON olarak `POST` edilir (`Content-Type: application/json`). Gönderilen gövde örneği:

  ```json
  {
    "konu": "Bilgi talebi", "form": "bilgi", "sayfa": "https://tarlaal.com/ilan.html?id=TR-2026-0101",
    "tarih": "2026-10-06T09:12:00.000Z", "ilan": "TR-2026-0101",
    "ad": "Mehmet Kaya", "telefon": "0532 000 00 00", "mesaj": "…", "kvkk": true
  }
  ```

**Formspree örneği**

1. [formspree.io](https://formspree.io) üzerinde bir form oluşturun; size `https://formspree.io/f/abcdwxyz` gibi bir adres verilir.
2. `assets/js/config.js` içinde `formEndpoint: "https://formspree.io/f/abcdwxyz"` yazın.
3. Formspree panelinde alan adınızı (tarlaal.com) izinli listeye ekleyin. JSON gönderimi ve `Accept: application/json` başlığı Formspree tarafından desteklenir.

**Netlify Forms örneği**

Netlify Forms, HTML'de `netlify` özniteliği bulunan formları derleme sırasında yakalar; JSON gönderimi kabul etmez. Bu yüzden iki seçenek var:

- *Netlify Functions:* `netlify/functions/form.js` adında bir fonksiyon yazıp JSON'u e-postaya/CRM'e iletin ve `formEndpoint: "/.netlify/functions/form"` ayarlayın.
- *Doğrudan Netlify Forms:* her `<form>`'a `name="…" netlify netlify-honeypot="website"` ekleyin ve `main.js`'teki `fetch` çağrısını `application/x-www-form-urlencoded` biçimine çevirin. Bu yol `main.js`'de değişiklik gerektirir.

Her iki durumda da WhatsApp yedeği olduğu için endpoint hata verirse kullanıcıya "bizi arayın / WhatsApp'tan yazın" mesajı gösterilir.

## Yayınlama

Derleme olmadığı için klasörün tamamı doğrudan yayınlanır.

### Netlify

1. Depoyu GitHub/GitLab'a gönderin veya klasörü Netlify panelinde sürükleyip bırakın.
2. Build command: *boş*; Publish directory: `.` (kök).
3. 404 yönlendirmesi için köke `_redirects` dosyası ekleyin:

   ```
   /*  /404.html  404
   ```

4. Alan adını (tarlaal.com) bağlayın; SSL otomatik verilir.

### Vercel

1. `vercel` CLI veya panelden projeyi içe aktarın; Framework Preset: *Other*, Output Directory: `.`.
2. Vercel kökteki `404.html` dosyasını otomatik olarak özel 404 sayfası olarak kullanır. İsterseniz `vercel.json` ile temiz URL açabilirsiniz:

   ```json
   { "cleanUrls": true, "trailingSlash": false }
   ```

### cPanel / klasik paylaşımlı hosting

1. Dosya Yöneticisi veya FTP ile klasör içeriğini `public_html/` altına yükleyin (`index.html` doğrudan `public_html/` içinde olmalı).
2. 404 sayfası için `public_html/.htaccess` dosyasına ekleyin:

   ```apache
   ErrorDocument 404 /404.html
   AddDefaultCharset UTF-8
   ```

3. `docs/`, `partials/` ve `tools/` klasörlerini sunucuya yüklemeniz gerekmez; yüklerseniz `robots.txt` zaten bunları taramadan hariç tutar.

### Yayın öncesi kontrol listesi

- `assets/js/config.js` içindeki telefon/WhatsApp/e-posta gerçek değerler mi?
- `python3 tools/check.py --warnings-as-errors` temiz çıkıyor mu? (check.py nokta ile başlayan geçici dosyaları — `.shot-wrap-*`, `.probe-*` — taramaz.)
- `sitemap.xml` içindeki `lastmod` tarihleri güncellendi mi?
- Google Search Console'a `https://tarlaal.com/sitemap.xml` gönderildi mi?

## Kalite araçları

Hepsi `tools/` altında; kök dizinden çalıştırın. Shell araçları macOS'ta `/Applications/Google Chrome.app` yolundaki Chrome'u headless kullanır.

| Araç | Ne yapar |
|------|----------|
| `python3 tools/check.py` | Kökteki her sayfa için: `lang="tr"`, tek `h1`, `@header/@footer` blokları partial'larla birebir mi, `title`/`description`/canonical/favicon/`style.css`, script sırası (config → data → main), tüm yerel `href`/`src` hedefleri mevcut mu, sayfa içi ve çapraz çapalar (`#b7`, `kvkk.html#b8`) hedef sayfada `id` olarak var mı, `ilan.html?id=…` linkleri `data.js`'deki bir ilana gidiyor mu (`ilanlar.html?il=…` için bölge listesi uyarısı), `img alt`, form alanlarında `<label for>` ya da sarmalayan `<label>`. Ayrıca `data.js`'yi node ile yükleyip ilan sayısı, benzersiz id, zorunlu alanlar, gerçek ISO tarihler ve foto ID'lerini (DESIGN §2.1) doğrular; `sitemap.xml`'i XML olarak ayrıştırır (kaçışsız `&`, eksik kapanış etiketi → hata), girdilerini dosyalarla ve canonical'larla karşılaştırır, `robots.txt`'yi kontrol eder. Bulgular `dosya:satır` ile yazılır; hata varsa çıkış kodu 1, bilinmeyen bayrakta kullanım satırı + çıkış kodu 2. Seçenekler: `--no-data`, `--warnings-as-errors`, `--quiet`, `-h/--help`. |
| `python3 tools/sync_partials.py [--check]` | Header/footer bloklarını partial'lardan tüm sayfalara dağıtır veya farkları listeler. |
| `tools/probe.sh <sayfa.html[?query]> [genişlik]` | Headless Chrome'da sayfayı açar, JSON rapor basar: JS hataları, yatay taşma (`overflowX`, taşan elemanlar), alt'sız ve kırık görseller, `h1` sayısı, title/meta. Hedef: `errors` boş, `overflowX` false (390 ve 1366'da), `h1Count` 1. |
| `tools/shot.sh <sayfa.html[?query]> <genişlik> <çıktı.png> [yükseklik]` | Ekran görüntüsü alır (390 gibi dar genişlikler desteklenir). **Dar genişliklerde (< 500 px) yalnızca dosya yolu verin** (`ilan.html?id=…` → `file://`): sayfa iframe içinde render edildiği için `http://localhost…` URL'lerinde Chrome'un sanal zaman bütçesi iframe'e uygulanmaz ve `.reveal` animasyonları tamamlanmadan (soluk/boş görünen) görüntü alınabilir. Geniş ekranlarda http URL sorunsuzdur. |
| `tools/dom.sh <sayfa.html[?query]> [genişlik]` | JS çalıştıktan sonraki DOM'u döker; JS ile üretilen içeriği doğrulamak için. |
| `for f in assets/js/*.js; do node --check "$f" \|\| exit 1; done` | JavaScript sözdizimi kontrolü. `node --check` yalnızca **ilk** dosya argümanını denetler (`node --check a.js b.js` b.js'yi atlar); bu yüzden döngü gerekir. |

Örnek tam tur:

```bash
for f in assets/js/*.js; do node --check "$f" || exit 1; done
python3 tools/sync_partials.py --check && python3 tools/check.py
tools/probe.sh ilanlar.html?tur=tarla 390
mkdir -p .shots   # shot.sh çıktı klasörünü oluşturmaz; .shots/ git'e dahil değildir (.gitignore)
tools/shot.sh ilan.html?id=TR-2026-0101 1366 .shots/ilan-1366.png 4000
```

`shot.sh` ve `probe.sh` çalışırken kök dizine geçici `.shot-wrap-*.html` / `.probe-*.html` dosyaları yazar. `check.py` nokta ile başlayan bu dosyaları taramaz; `sync_partials.py --check`'i ise bu geçici dosyalar oluşmadan önce çalıştırın (yukarıdaki tam tur örneği bu sırayı korur), aksi halde kalıntı dosyalar için sahte `@header/@footer yok` uyarısı verir. Chrome yarıda kesilirse kalan dosyayı silebilirsiniz: `rm -f .shot-wrap-*.html .probe-*.html`. `.gitignore` çıktıları ve kalıntıları depo dışında tutar: `.shots/` ve `.probe-*`. `.shot-wrap-*.html` henüz `.gitignore`'da listeli değildir; tam tur sonrası `rm` ile temizleyin (veya `.gitignore`'a bir `.shot-wrap-*` satırı ekleyin).

## Sayfa şablonu

Yeni bir sayfa eklerken sırayı koruyun:

```html
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sayfa Adı | Tarlaal</title>
  <meta name="description" content="140–160 karakter, Türkçe açıklama.">
  <link rel="canonical" href="https://tarlaal.com/sayfa.html">
  <meta property="og:title" content="…"> <!-- og:description, og:type, og:url, og:image -->
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300..800;1,300..800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"> <!-- docs/DESIGN.md §1.2 -->
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/sayfa.css"> <!-- varsa -->
</head>
<body>
<!-- @header -->
… partials/header.html içeriği (sync_partials.py doldurur) …
<!-- @/header -->
<main id="icerik">
  …
</main>
<!-- @footer -->
… partials/footer.html içeriği …
<!-- @/footer -->
<script src="assets/js/config.js"></script>
<script src="assets/js/data.js"></script>
<script src="assets/js/main.js"></script>
<script src="assets/js/sayfa.js"></script> <!-- varsa -->
</body>
</html>
```

Yeni sayfayı `sitemap.xml`'e ekleyin ve `python3 tools/check.py` ile doğrulayın. Ortak JS API'si (`TARLAAL.ilanKarti`, `TARLAAL.formatFiyat`, `[data-render]` yardımcıları vb.) `assets/js/main.js` dosyasının başındaki yorum bloğunda belgelenmiştir.

---

© 2026 Tarlaal Gayrimenkul. Site içeriği ve görsel kimlik Tarlaal'a aittir.
