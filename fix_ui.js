const fs = require('fs');

// Fix CSS colors to be Black & White
let css = fs.readFileSync('assets/css/trendyol.css', 'utf8');
css = css.replace(/--primary: #4f46e5;/g, '--primary: #111111;');
css = css.replace(/--primary-d: #4338ca;/g, '--primary-d: #000000;');
css = css.replace(/--primary-l: #e0e7ff;/g, '--primary-l: #e5e5e5;');
css = css.replace(/background: linear-gradient\(135deg, var\(--primary\), var\(--primary-d\)\);/g, 'background: #f8f9fa; border: 1px solid var(--border-c);');
// Fix popular products text color on the new light bg
css = css.replace(/\.section-hdr \{ display: flex; justify-content: space-between; align-items: center; color: #fff; margin-bottom: 20px; \}/g, '.section-hdr { display: flex; justify-content: space-between; align-items: center; color: #111; margin-bottom: 20px; }');
css = css.replace(/\.section-hdr a \{ font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 5px; color: #fff; \}/g, '.section-hdr a { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 5px; color: #111; }');

// Add specific styles to fix overlaps
css += `
/* Fix Search dropdown z-index and spacing */
.srch-drop { z-index: 1000; top: calc(100% + 5px); }
.srch-wrap { z-index: 999; }
.cat-nav-main { z-index: 10; position: relative; }

/* Hide Flash Timer in category row to match simple look */
.tab-flash { display: none !important; }
`;
fs.writeFileSync('assets/css/trendyol.css', css, 'utf8');

// Fix app.js mojibake and UX issues
let app = fs.readFileSync('assets/js/app.js', 'utf8');

// Modals
app = app.replace(/Ad1n1z Soyad1n1z/g, 'Adınız Soyadınız');
app = app.replace(/K Demo Giriş/g, '🎭 Demo Giriş');
app = app.replace(/var\(--or\)/g, 'var(--primary)');
app = app.replace(/var\(--or-d\)/g, 'var(--primary-d)');
app = app.replace(/var\(--or-l\)/g, 'var(--primary-l)');
app = app.replace(/background:#1976d2/g, 'background:#333');
app = app.replace(/background='#1565c0'/g, 'background=\\\'#000\\\'');
app = app.replace(/background='#1976d2'/g, 'background=\\\'#333\\\'');

app = app.replace(/K\? 9 Ho_ geldin!/g, '👋 Hoş geldin!');
app = app.replace(/K\?\?\? Demo giri\? yap1ld1/g, '🎭 Demo girişi yapıldı');
app = app.replace(/K\?\?\? Demo sat\?c\? giri_i/g, '🎭 Demo satıcı girişi');
app = app.replace(/K\?R" Karanl1k mod aktif/g, '🌙 Karanlık mod aktif');
app = app.replace(/⩬︈ A1k mod aktif/g, '☀️ Açık mod aktif');
app = app.replace(/Te_ekkrler! En k1sa srede dnece im\. K"/g, 'Teşekkürler! En kısa sürede döneceğim. 👋');
app = app.replace(/rn stok durumu iin ltfen bekleyin\./g, 'Ürün stok durumu için lütfen bekleyin.');
app = app.replace(/Kargo 2-3 i_ gn iinde teslim edilir\./g, 'Kargo 2-3 iş günü içinde teslim edilir.');
app = app.replace(/Sorular1n1z iin buraday1m, yard1mc1 olmaya al1_aca 1m\./g, 'Sorularınız için buradayım, yardımcı olmaya çalışacağım.');
app = app.replace(/S& Admin Paneline Ho_ Geldiniz! K /g, '✅ Admin Paneline Hoş Geldiniz! 👑');

// Fixing UX annoyances (Toasts)
app = app.replace(/showToast\('Favoriler için giriş yapmalısın!','error'\);openModal\('authOv'\);return;/g, 'openModal(\'authOv\');return;');
app = app.replace(/showToast\('Takip için giriş yapmalısın!','error'\);openModal\('authOv'\);return;/g, 'openModal(\'authOv\');return;');
app = app.replace(/showToast\('Alarm için giriş yapmalısın!','error'\);openModal\('authOv'\);return;/g, 'openModal(\'authOv\');return;');
app = app.replace(/showToast\('Önce giriş yapmal1s1n!','error'\);openModal\('authOv'\);/g, 'openModal(\'authOv\');');
app = app.replace(/showToast\('Mesaj için giriş yapmalısın!','error'\);openModal\('authOv'\);return;/g, 'openModal(\'authOv\');return;');
app = app.replace(/showToast\('Giriş yapmalısın!','error'\);openModal\('authOv'\);return;/g, 'openModal(\'authOv\');return;');

// Fixing search timeout logic that might cause dropdown overlaps or glitches if z-index is not enough (z-index is fixed in CSS)

fs.writeFileSync('assets/js/app.js', app, 'utf8');

// Update index.html to remove the Flash Sale menu item if it doesn't fit the vibe
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<div class="cat-link has-new" style="color: #ef4444;" onclick="filterFlash\(\)">Flaş Ürünler<\/div>/, '<div class="cat-link" onclick="filterFlash()">Flaş Ürünler</div>');
fs.writeFileSync('index.html', html, 'utf8');
