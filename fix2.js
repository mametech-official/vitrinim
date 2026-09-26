const fs = require('fs');
let c = fs.readFileSync('assets/js/app.js','utf8');

const reps = {
  'giri_': 'giriş', 'Giri_': 'Giriş', 'giri?': 'giriş', 'Giri?': 'Giriş',
  'yapmal1s1n': 'yapmalısın',
  'ba_ar1l1': 'başarılı',
  'kay1tl1': 'kayıtlı',
  'sat1c1': 'satıcı', 'Sat1c1': 'Satıcı', 'Sat?c?': 'Satıcı', 'sat?c?': 'satıcı',
  'al1_veri_': 'alışveriş', 'Al1_veri_': 'Alışveriş',
  'g?r?_?n?z? yaz1n': 'görüşünüzü yazın',
  '?r?n': 'ürün', '?r?nler': 'ürünler', '?R?N': 'ÜRÜN', 'Ürün': 'Ürün', 'ürün': 'ürün',
  'i?in': 'için', 'iin': 'için', 'iin': 'için',
  'Sipari_': 'Sipariş', 'sipari_': 'sipariş',
  'bo_!': 'boş!', 'Bo_': 'Boş',
  '?nce': 'Önce',
  'ba_l1k': 'başlık', 'ba_l1 1': 'başlığı',
  'a?1klama': 'açıklama',
  'olu_turdu': 'oluşturdu',
  'yan1t': 'yanıt',
  'ba lant1 hatas1': 'bağlantı hatası',
  'Ge?erli': 'Geçerli',
  '^ifre': 'Şifre',
  'Tm': 'Tümü', 'Tm': 'Tümü',
  'sa land1': 'sağlandı',
  'Ho_ geldin': 'Hoş geldin',
  'yap1ld1': 'yapıldı',
  'giri_i': 'girişi',
  'ke_fet': 'keşfet',
  '?zellikleri': 'özellikleri',
  'T?m': 'Tüm',
  'yapt1n': 'yaptın',
  'Kay1t': 'Kayıt',
  'ornek': 'ornek',
  'K? 9': '👋',
  'K???': '🎭',
  '?S&': '✅',
  '?S?': '✨',
  'K? ?': '👑',
  '? ': '👉',
  'K?R"': '🌙',
  'K?   ': '💡',
  '0?in': 'İçin',
  '?stteki': 'Üstteki',
  's1n1rl1 s?reli f1rsatlar': 'sınırlı süreli fırsatlar',
  'k1rm1z1': 'kırmızı',
  'Sa  ?stteki': 'Sağ üstteki',
  'ay/g?ne_': 'ay/güneş',
  't1kla': 'tıkla'
};

for (const [k, v] of Object.entries(reps)) {
  c = c.split(k).join(v);
}
fs.writeFileSync('assets/js/app.js', c, 'utf8');
console.log('Done.');
