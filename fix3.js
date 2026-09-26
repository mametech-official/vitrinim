const fs = require('fs');
let c = fs.readFileSync('assets/js/app.js','utf8');
const reps = {
  'K y': '👑',
  'K 9': '👋',
  'KR"': '🌙',
  '⩬︈': '☀️',
  'K  Ayl1k Gelir': '💰 Aylık Gelir',
  'K ~︈ Ayl1k Grntlenme': '👁️ Aylık Görüntülenme',
  'Grntlenme': 'Görüntülenme',
  'Ayl1k': 'Aylık',
  '^ub': 'Şub',
  'A u': 'Ağu',
  'K ': '📷',
  'rn': 'Ürün',
  'rnlerim': 'Ürünlerim',
  '': 'Ü', // catch-all for remaining broken Ü
};
// specific chart tab text fixes
c = c.replace(/Grntlenme/g, 'Görüntülenme');
c = c.replace(/rn/g, 'Ürün');
c = c.replace(/rnlerim/g, 'Ürünlerim');
c = c.replace(/KR"/g, '🌙');
c = c.replace(/K y/g, '👑');
c = c.replace(/K 9/g, '👋');
c = c.replace(/K /g, '💰');
c = c.replace(/K ~/g, '👁️');
c = c.replace(/\^ub/g, 'Şub');
c = c.replace(/A u/g, 'Ağu');
c = c.replace(/Ayl1k/g, 'Aylık');

// the "VITRMINM10" might just be a typo, but let's make sure the coupons are correct
c = c.replace("'VITRINIM10':10", "'VITRINIM10':10");

fs.writeFileSync('assets/js/app.js',c,'utf8');
console.log('Fixed dash strings');
