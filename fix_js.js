const fs = require('fs');
let content = fs.readFileSync('assets/js/app.js', 'utf8');

// These constants + state vars got deleted when we removed the store block
// Add them back at the beginning
const header = `
// =============================================
// APP STATE (store.js'den yüklenen veriler
// burada state olarak tutulur)
// =============================================
let tempImgs    = [];
let activeFilter= 'all';
let activeCat   = 'all';
let searchQ     = '';
let viewMode    = 'grid';
let priceMin    = '';
let priceMax    = '';
let compareList = [];
let chatSellerId= null;
let cartCoupon  = null;
let globalCoupon= null;
let activeRevStar = {};
let currentDetailId = null;
let activeDashTab = 'products';
let activeChartTab = 'views';
let darkMode = localStorage.getItem('vt_dark') === '1';
let lbImgs = [];
let lbIdx = 0;
let flashFilter = false;
let flashEndTime = Date.now() + 3600000 * 5;

const COUPONS  = {'VITRINIM10':10,'SUPER20':20,'YENI30':30};
const TRENDING = ['Nike Ayakkabı','iPhone Kılıf','Kadın Çanta','Akıllı Saat','Kahve Makinesi','Kitaplık','Spor Taytı'];
const CATS     = ['Tümü','Giyim','Ayakkabı','Çanta & Aksesuar','Elektronik','Ev & Yaşam','Spor','Güzellik & Kişisel Bakım','Kitap & Müzik','Oyuncak','Diğer'];

`;

content = header + content;

fs.writeFileSync('assets/js/app.js', content, 'utf8');
console.log('Done. Total length:', content.length);
console.log('Has CATS:', content.includes("'Tümü'"));
console.log('Has TRENDING:', content.includes('Kadın Çanta'));
console.log('Has tempImgs:', content.includes('tempImgs'));
console.log('Has darkMode:', content.includes('let darkMode'));
