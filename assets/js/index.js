/* Tarlaal — ana sayfa (index.js). main.js'teki TARLAAL API'sini kullanır. */
(function (w, d) {
  'use strict';
  var T = w.TARLAAL;
  if (!T) return;

  /* Foto tekrar-önleme artık kalıcı olarak data.js'te (hero + öne çıkan 6 ilan +
     ilk 6 bölge kartı foto kümesinde benzersizlik orada sağlanıyor). */

  /* Hero arama: boş alanları URL'ye yazma (ilanlar.html?tur=&il= yerine temiz sorgu) */
  var form = d.querySelector('.hero__search');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = new URLSearchParams();
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.value) q.set(el.name, el.value);
      });
      var qs = q.toString();
      w.location.href = (form.getAttribute('action') || 'ilanlar.html') + (qs ? '?' + qs : '');
    });
  }

  /* Satıştaki ilan sayısı (satildi hariç) */
  var aktif = T.data().ilanlar.filter(function (i) { return i && i.durum !== 'satildi'; }).length;
  Array.prototype.forEach.call(d.querySelectorAll('[data-ilan-sayisi]'), function (el) {
    el.textContent = T.formatSayi(aktif);
  });

  /* İl seçeneklerine canlı ilan sayısını ekle ("Tekirdağ (5)") */
  var ilSel = d.getElementById('ara-il');
  if (ilSel) {
    var sayilar = T.bolgeSayilari();
    Array.prototype.forEach.call(ilSel.options, function (opt) {
      if (opt.value && sayilar[opt.value]) opt.textContent = opt.value + ' (' + sayilar[opt.value] + ')';
    });
  }
})(window, document);
