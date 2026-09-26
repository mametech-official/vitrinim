const fs = require('fs');

// Add trendyol.css to index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('trendyol.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="assets/css/trendyol.css?v=1">\n</head>');
}

// Replace header and top parts
const newTop = `
<header>
  <div class="logo" onclick="goHome()">
    vitrinim
  </div>
  <div class="srch-wrap">
    <button class="srch-btn" onclick="doSearch()" aria-label="Ara">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    <input type="text" id="srchInp" placeholder="Ürün, kategori veya marka ara" oninput="handleSearch()" onkeydown="if(event.key==='Enter')doSearch()" onfocus="renderSearchDrop()" autocomplete="off" aria-label="Arama">
    <div class="srch-drop" id="srchDrop"></div>
  </div>
  <div class="hdr-acts">
    <div class="hdr-act-btn" onclick="currentUser?openDashboard():openModal('authOv')">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>Giriş Yap</span>
      <div class="auth-drop" style="display:none;" id="authDropCustom">
        <button class="auth-drop-btn" onclick="openModal('authOv');event.stopPropagation();">Giriş Yap</button>
        <button class="auth-drop-btn outline" onclick="openModal('authOv');event.stopPropagation();">Kayıt Ol</button>
      </div>
    </div>
    <div class="hdr-act-btn" onclick="toggleFavFilter()">
      <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      <span>Favorilerim</span>
      <span class="badge-dot" id="favBadge" style="display:none">0</span>
    </div>
    <div class="hdr-act-btn" onclick="openCart()">
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <span>Sepetim</span>
      <span class="badge-dot" id="cartBadge" style="display:none">0</span>
    </div>
  </div>
</header>

<div class="cat-nav-main">
  <div class="cat-link kategoriler">
    <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    Kategoriler
  </div>
  <div class="cat-link active" onclick="setFilter('all')">Kadın</div>
  <div class="cat-link" onclick="setFilter('all')">Erkek</div>
  <div class="cat-link" onclick="setFilter('all')">Anne & Çocuk</div>
  <div class="cat-link" onclick="setFilter('all')">Ev & Yaşam</div>
  <div class="cat-link" onclick="setFilter('all')">Süpermarket</div>
  <div class="cat-link" onclick="setFilter('all')">Kozmetik</div>
  <div class="cat-link" onclick="setFilter('all')">Ayakkabı & Çanta</div>
  <div class="cat-link" onclick="setFilter('all')">Elektronik</div>
  <div class="cat-link" onclick="setFilter('all')">Spor & Outdoor</div>
  <div class="cat-link has-new" style="color: #ef4444;" onclick="filterFlash()">Flaş Ürünler</div>
</div>

<div class="stories-wrap">
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">🔥</span></div>
    <div class="story-txt">Ürünleri Keşfet</div>
  </div>
  <div class="story-item" onclick="filterFlash()">
    <div class="story-circle"><span style="font-size:32px;">📉</span></div>
    <div class="story-txt">Bugün Fiyatı Düşenler</div>
  </div>
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">🍔</span></div>
    <div class="story-txt">Yemek</div>
  </div>
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">✨</span></div>
    <div class="story-txt">Ayrıcalıkları Keşfet</div>
  </div>
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">🎁</span></div>
    <div class="story-txt">Kampanya Detayları</div>
  </div>
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">💍</span></div>
    <div class="story-txt">Evlilik Destek Kampanyası</div>
  </div>
  <div class="story-item" onclick="setFilter('all')">
    <div class="story-circle"><span style="font-size:32px;">🎨</span></div>
    <div class="story-txt">Sanat Eserleri</div>
  </div>
</div>

<div class="main-bg-section" id="mainBgSec">
  <div class="section-hdr">
    <h2>Popüler Ürünler</h2>
    <a href="#" onclick="setFilter('all'); return false;">Tümünü Gör ></a>
  </div>
  <div class="prod-grid-new" id="prodGrid"></div>
</div>

<!-- Old Layout items hidden -->
<div class="hide-old">
`;

const topbarStart = html.indexOf('<div class="topbar">');
const prodGridEnd = html.indexOf('<div class="prod-grid" id="prodGrid"></div>');
if (topbarStart > -1 && prodGridEnd > -1) {
  html = html.slice(0, topbarStart) + newTop + html.slice(prodGridEnd + '<div class="prod-grid" id="prodGrid"></div>'.length);
}
// We have a missing closing div for hide-old. Let's add it before footer
html = html.replace('<footer>', '</div>\n<footer>');
fs.writeFileSync('index.html', html, 'utf8');

// Update app.js renderGrid and renderDetail to use new classes
let app = fs.readFileSync('assets/js/app.js', 'utf8');

const newRenderGrid = `function renderGrid() {
  const c = document.getElementById('prodGrid');
  if(!c) return;
  const fp = getFiltered();
  if(!fp.length) { c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">Ürün bulunamadı</div>'; return; }
  c.innerHTML = fp.map(p=>{
    const isFav = favorites.includes(p.id);
    const starStr = '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(5);
    const revCnt = (reviews[p.id]||[]).length || Math.floor(Math.random()*100)+5;
    return \`
      <div class="card-new" onclick="showDetail(\${p.id})">
        <div class="card-img-box-new">
          <div class="img-badge b-sat">EN ÇOK<br>SATAN</div>
          \${Math.random()>0.5 ? '<div class="img-badge b-kargo">KARGO BEDAVA</div>' : ''}
          <div class="fav-btn-new\${isFav?' active':''}" onclick="toggleFav(event,\${p.id})">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </div>
          <img src="\${p.imgs?p.imgs[0]:'https://via.placeholder.com/400x500?text='+encodeURIComponent(p.title)}" class="card-img-new" loading="lazy">
        </div>
        <div class="card-body-new">
          <div class="card-title-wrap">
            <span class="card-brand-new">\${p.brand}</span>
            <span class="card-title-new">\${p.title}</span>
          </div>
          <div class="card-rating-new">
            \${starStr} <span class="rcount">(\${revCnt})</span>
          </div>
          <div class="card-price-wrap">
            <div class="card-pr-new">\${p.price.toLocaleString('tr-TR')} TL</div>
            \${Math.random()>0.5 ? '<div class="card-tag">Kupon Fırsatı</div>' : ''}
          </div>
        </div>
      </div>
    \`;
  }).join('');
}`;

const renderGridRegex = /function renderGrid\(\)\{[\s\S]*?c\.innerHTML=fp\.map\([\s\S]*?\}\)\.join\(''\);\n\}/;
app = app.replace(renderGridRegex, newRenderGrid);

const newShowDetail = `function showDetail(id) {
  const p = products.find(x=>x.id===id); if(!p)return;
  currentDetailId = id;
  const isFav = favorites.includes(p.id);
  const oldPr = Math.round(p.price * 1.3);
  const revCnt = (reviews[p.id]||[]).length || Math.floor(Math.random()*100)+5;
  const starStr = '<svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(5);

  document.getElementById('mainBgSec').innerHTML = \`
    <div class="det-container-new">
      <div class="det-img-sec">
        <div class="img-badge b-sat" style="top:20px;left:20px;width:60px;height:60px;font-size:12px;">EN ÇOK<br>SATAN</div>
        <img src="\${p.imgs?p.imgs[0]:'https://via.placeholder.com/600x800?text='+encodeURIComponent(p.title)}">
      </div>
      <div class="det-info-sec">
        <div class="d-title-wrap">
          <span class="d-brand">\${p.brand}</span>
          <h1 class="d-title">\${p.title}</h1>
        </div>
        <div class="d-rating">
          \${starStr} <span style="color:var(--text-muted);font-size:13px;margin-left:5px;">\${revCnt} Değerlendirme</span>
        </div>
        
        <div class="d-price-box">
          <div style="display:flex;align-items:center;">
            <span class="d-old-pr">\${oldPr.toLocaleString('tr-TR')} TL</span>
            <span class="d-new-pr">\${p.price.toLocaleString('tr-TR')} TL</span>
          </div>
        </div>

        <div class="d-action-row">
          <button class="btn-add-cart" onclick="addToCart(\${p.id})">Sepete Ekle</button>
          <button class="btn-fav-large\${isFav?' active':''}" onclick="toggleFav(event, \${p.id})">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div style="margin-top:20px;padding:15px;background:#f8fafc;border-radius:6px;font-size:13px;color:#0f172a;display:flex;align-items:center;gap:10px;">
          <svg style="width:20px;height:20px;stroke:#10b981;fill:none;stroke-width:2;" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2" ry="2"/><line x1="16" y1="8" x2="16" y2="4"/><line x1="8" y1="8" x2="8" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
          Bu üründen en fazla 10 adet sipariş verilebilir.
        </div>
      </div>
      <div class="det-seller-sec">
        <div class="s-box">
          <div class="s-box-row">
            <svg style="width:20px;height:20px;stroke:var(--text-muted);fill:none;stroke-width:2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            <span>350 TL ve Üzeri Kargo Bedava <br><small style="color:var(--text-muted)">(Satıcı Karşılar)</small></span>
          </div>
        </div>
        <div class="s-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <strong style="color:var(--text-main);font-size:14px;">\${p.brand} Mağazası</strong>
            <span style="background:#22c55e;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold;">9.8</span>
          </div>
          <div class="s-box-row" style="color:#22c55e;font-weight:600;">
            <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Hızlı Satıcı
          </div>
          <button class="s-box-btn">Mağazaya Git</button>
        </div>
      </div>
    </div>
  \`;
}`;

const showDetailRegex = /function showDetail\(id\)\{[\s\S]*?function changeDetQty/;
app = app.replace(showDetailRegex, newShowDetail + '\nfunction changeDetQty');

fs.writeFileSync('assets/js/app.js', app, 'utf8');
console.log('UI Updated successfully');
