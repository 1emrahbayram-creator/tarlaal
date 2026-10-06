# Tarlaal.com — Yayın ve Alan Adı Bağlama

Site **GitHub Pages** üzerinde yayında.
Depo: https://github.com/1emrahbayram-creator/tarlaal
GitHub tarafı hazır; geriye yalnızca **alan adınızın DNS kayıtlarını** GitHub'a yönlendirmek kaldı.

---

## 1. DNS kayıtlarını ekleyin (GoDaddy / Namecheap vb.)

Alan adı panelinizde (tarlaal.com → DNS yönetimi) aşağıdaki kayıtları ekleyin.

### A kayıtları — kök alan (tarlaal.com)
Host/Name alanına **@** yazın (Namecheap'te "Host: @", GoDaddy'de "Name: @").
Dört ayrı A kaydı ekleyin:

| Tür | Host/Name | Değer (Points to) | TTL |
|-----|-----------|-------------------|-----|
| A | @ | 185.199.108.153 | otomatik / 600 |
| A | @ | 185.199.109.153 | otomatik / 600 |
| A | @ | 185.199.110.153 | otomatik / 600 |
| A | @ | 185.199.111.153 | otomatik / 600 |

> Panelde önceden duran "@" için park/yönlendirme A kaydı varsa **silin**; çakışmasın.

### CNAME kaydı — www (www.tarlaal.com)

| Tür | Host/Name | Değer (Points to) | TTL |
|-----|-----------|-------------------|-----|
| CNAME | www | 1emrahbayram-creator.github.io | otomatik / 600 |

### (İsteğe bağlı) AAAA kayıtları — IPv6
Daha iyi erişim için dört AAAA kaydı da ekleyebilirsiniz (Host: @):
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**Namecheap notu:** "Advanced DNS" sekmesini kullanın. Kök (@) için CNAME **kullanılamaz**; yukarıdaki A kayıtları doğrudur.
**GoDaddy notu:** "DNS Yönetimi" → "Kayıt Ekle".

---

## 2. Yayılmayı bekleyin (birkaç dakika – birkaç saat)

Kontrol için terminalde:
```bash
dig tarlaal.com +short
```
Çıktıda `185.199.108.153` gibi adresler görünürse yayılma tamamlanmıştır.
(Alternatif: https://dnschecker.org adresine tarlaal.com yazın.)

---

## 3. HTTPS'i zorunlu kılın (DNS yayıldıktan sonra)

1. https://github.com/1emrahbayram-creator/tarlaal/settings/pages adresine girin.
2. "Custom domain" alanında **tarlaal.com** yazılı ve yanında yeşil ✓ (DNS check successful) görün.
3. Biraz bekleyince **"Enforce HTTPS"** kutusu aktifleşir; işaretleyin.
   (SSL sertifikası GitHub tarafından otomatik ve ücretsiz üretilir.)

Bundan sonra site **https://tarlaal.com** adresinde yayında olur.
www.tarlaal.com otomatik olarak tarlaal.com'a yönlenir.

---

## İçeriği güncelleme (yayından sonra)

Dosyaları düzenleyip push edin; GitHub Pages ~1 dakikada yeniden yayınlar:
```bash
cd /Users/emrah.bayram/Desktop/tarlaal.com
# ... düzenlemeler ...
git add -A
git commit -m "İçerik güncellemesi"
git push
```
İlan eklemek/çıkarmak, iletişim bilgisi veya form adresini değiştirmek için bkz. [README.md](README.md).

## Form e-postaları
Şu an formlar WhatsApp'a yönleniyor. E-postaya düşmesi için [Formspree](https://formspree.io) (ücretsiz) adresinden bir form oluşturup verdiği adresi `assets/js/config.js` içindeki `formEndpoint` alanına yazın, push edin.
