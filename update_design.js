const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('assets/css/style.css','utf8');
css = css.replace(/--or:#f27a1a/g, '--or:#212121'); 
css = css.replace(/--or-d:#d4660e/g, '--or-d:#000000');
css = css.replace(/--or-l:#fff4ec/g, '--or-l:#f5f5f5');
css = css.replace(/--or-m:#fde8d4/g, '--or-m:#eeeeee');

const newCSS = `
/* Redesign Overrides */
.topbar { background: #2b2b2b; padding: 10px 5%; font-size: 11px; }
.topbar a { color: #d0d0d0; font-weight: 500; font-size: 13px; margin-right: 15px; }
.topbar-l { display: flex; gap: 20px; }
.topbar-l a { margin-right: 0; display: flex; align-items: center; gap: 6px; }

header { padding: 15px 5%; box-shadow: none; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 220px 1fr 220px; gap: 20px; align-items: center; }
.logo { color: #111; font-size: 26px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; }
.logo em { display: none; }
.srch-wrap { max-width: 600px; margin: 0 auto; width: 100%; position: relative; }
.srch-wrap input { background: #f5f5f5; border-radius: 30px; padding: 12px 20px 12px 40px; font-size: 13px; font-weight: 400; border: 1px solid #eee; }
.srch-wrap input:focus { box-shadow: 0 0 0 2px #ddd; border-color: #ddd; }
.srch-btn { background: transparent; left: 10px; right: auto; width: 30px; border-radius: 50%; }
.srch-btn svg { stroke: #666; width: 16px; height: 16px; }
.srch-btn:hover { background: transparent; }
.hdr-acts { justify-content: flex-end; gap: 10px; }
.ico-btn { background: transparent; color: #333; width: 40px; height: 40px; }
.ico-btn:hover { background: #f5f5f5; }
.ico-btn svg { stroke: #444; width: 22px; height: 22px; stroke-width: 1.5; }
.hdr-btn-wh { display: none; }
.badge-dot { background: #111; color: #fff; }

/* Main Layout */
.main-content { display: flex; padding: 30px 5%; gap: 30px; align-items: flex-start; }
.main-left { flex: 1; min-width: 0; }
.main-right { width: 260px; flex-shrink: 0; }

.banner-wrap { padding: 0 0 30px 0; }
.banner { background: #e0dedc; padding: 60px 40px; border-radius: 4px; justify-content: center; text-align: center; color: #333; }
.banner::before, .banner::after { display: none; }
.ban-txt h2 { color: #111; font-size: 32px; font-weight: 300; letter-spacing: 2px; margin-bottom: 15px; }
.ban-txt p { display: none; }
.ban-cta { background: transparent; border: 1px solid #111; color: #111; font-weight: 500; padding: 12px 30px; margin: 0 auto; display: inline-block; letter-spacing: 1px; border-radius: 0; }
.ban-cta:hover { background: #111; color: #fff; }

/* Filter Tabs / Cat Nav */
.layout-tabs-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); margin-bottom: 24px; flex-wrap: wrap; gap: 10px; }
.cat-nav { padding: 0; border: none; flex: 1; }
.cat-it { padding: 12px 20px; font-weight: 600; color: #666; font-size: 15px; }
.cat-it.active { color: #111; border-bottom-color: #111; }

/* Sidebar */
.sidebar-widget { background: #fff; border: 1px solid #eee; border-radius: 6px; padding: 24px; margin-bottom: 20px; }
.sw-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; color: #222; }
.sw-range { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.sw-range span { font-size: 13px; color: #555; font-weight: 600; }
.sw-range .range-val { background: #f5f5f5; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
input[type=range] { width: 100%; margin-top: 10px; accent-color: #111; }
.sw-list { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
.sw-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #444; }
.sw-item input[type=checkbox] { width: 16px; height: 16px; accent-color: #111; }

/* Flash Sale Timer in tabs */
.tab-flash { display: flex; align-items: center; gap: 8px; background: #fff5f5; padding: 6px 14px; border-radius: 20px; }
.tab-flash span { font-size: 13px; font-weight: 700; color: #d32f2f; }
.tab-flash .timer-block { background: #222; padding: 4px 8px; font-size: 12px; border-radius: 4px; }
.tab-flash .timer-sep { color: #222; }

/* Product Grid */
.prod-grid { padding: 0; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.card { border: 1px solid #eee; border-radius: 6px; box-shadow: none; overflow: visible; }
.card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.06); transform: translateY(-3px); }
.card-img-box { background: #f5f5f5; padding-top: 120%; border-radius: 6px 6px 0 0; }
.card-body { padding: 16px; }
.card-brand { display: none; }
.card-title { font-size: 13px; color: #333; font-weight: 400; margin-bottom: 8px; line-height: 1.4; }
.card-pr { font-size: 16px; color: #111; font-weight: 800; }
.card-pr-row { margin-top: 4px; align-items: center; }
.fav-btn { top: 12px; right: 12px; background: transparent; box-shadow: none; width: 34px; height: 34px; }
.fav-btn svg { stroke: #999; }
.fav-btn:hover svg { stroke: #111; }
.fav-btn.active svg { stroke: #111; fill: #111; }
.badge-new, .badge-hot, .badge-disc, .badge-stock, .badge-flash, .badge-bundle { display: none; } /* Hide old badges for clean look */
.flash-sale-bar { display: none; } /* Hide old flash bar */
.flt-bar, .res-info { display: none; } /* Hide old filter bar */
`;
css += newCSS;
fs.writeFileSync('assets/css/style.css', css, 'utf8');

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
const newTop = `
<div class="topbar">
  <div class="topbar-l">
    <a style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Kategoriler</a>
    <a>Markalar</a>
    <a>Kampanyalar</a>
  </div>
  <div class="topbar-r">
    <a onclick="currentUser?openDashboard():openModal('authOv')">Giriş Yap</a>
    <a onclick="currentUser?openDashboard():openModal('authOv')">Üye Ol</a>
  </div>
</div>

<header>
  <div class="logo" onclick="goHome()">VITRINIM</div>
  <div class="srch-wrap">
    <button class="srch-btn" onclick="doSearch()" aria-label="Ara">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    <input type="text" id="srchInp" placeholder="Ürün veya kategori ara..." oninput="handleSearch()" onkeydown="if(event.key==='Enter')doSearch()" onfocus="renderSearchDrop()" autocomplete="off" aria-label="Arama">
    <div class="srch-drop" id="srchDrop"></div>
  </div>
  <div class="hdr-acts">
    <button class="ico-btn" onclick="currentUser?openDashboard():openModal('authOv')" title="Hesabım" aria-label="Hesabım">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </button>
    <button class="ico-btn" onclick="toggleFavFilter()" title="Favorilerim" aria-label="Favorilerim">
      <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      <span class="badge-dot" id="favBadge" style="display:none">0</span>
    </button>
    <button class="ico-btn" onclick="openCart()" title="Sepet" aria-label="Sepet">
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <span class="badge-dot" id="cartBadge" style="display:none">0</span>
    </button>
  </div>
</header>

<div class="main-content">
  <div class="main-left">
    <div class="banner-wrap">
      <div class="banner">
        <div class="ban-txt"><h2>YENİ SEZON KOLEKSİYONU</h2></div>
        <button class="ban-cta" onclick="checkLoginForAdd()">KEŞFET</button>
      </div>
    </div>
    
    <div class="layout-tabs-row">
      <div class="cat-nav" id="catNav"></div>
      <div class="tab-flash">
        <span>Fırsatlar</span>
        <div class="timer-block" id="timerH">06</div>
        <span class="timer-sep">:</span>
        <div class="timer-block" id="timerM">30</div>
        <span class="timer-sep">:</span>
        <div class="timer-block" id="timerS">08</div>
      </div>
    </div>

    <div class="prod-grid" id="prodGrid"></div>
  </div>
  
  <div class="main-right">
    <div class="sidebar-widget">
      <div class="sw-title">Fiyat Aralığı</div>
      <div class="sw-range">
        <span>₺ 0</span>
        <span class="range-val" id="swRangeVal">3000 ₺</span>
      </div>
      <input type="range" min="0" max="5000" value="3000" oninput="document.getElementById('swRangeVal').textContent=this.value+' ₺'; priceMax=this.value; handleSearch()">
    </div>
    <div class="sidebar-widget">
      <div class="sw-title">Marka</div>
      <div class="sw-range" style="margin-bottom:0">
        <span>Marka</span>
        <select style="border:none;background:#f5f5f5;padding:4px 8px;border-radius:12px;font-size:12px;outline:none" onchange="handleSearch()">
          <option value="">Seçiniz</option>
          <option value="Nike">Nike</option>
          <option value="Apple">Apple</option>
          <option value="Zara">Zara</option>
          <option value="IKEA">IKEA</option>
          <option value="Adidas">Adidas</option>
          <option value="Samsung">Samsung</option>
        </select>
      </div>
    </div>
    <div class="sidebar-widget">
      <div class="sw-title">Renk</div>
      <div class="sw-list">
        <label class="sw-item"><input type="checkbox"> Siyah</label>
        <label class="sw-item"><input type="checkbox"> Beyaz</label>
        <label class="sw-item"><input type="checkbox"> Gri</label>
        <label class="sw-item"><input type="checkbox"> Mavi</label>
        <label class="sw-item"><input type="checkbox"> Kırmızı</label>
      </div>
    </div>
  </div>
</div>
`;

// Extract old things to replace
const topbarStart = html.indexOf('<div class="topbar">');
const prodGridEnd = html.indexOf('<div class="cmp-bar"'); // right after prod-grid
if (topbarStart > -1 && prodGridEnd > -1) {
  html = html.slice(0, topbarStart) + newTop + html.slice(prodGridEnd);
}
fs.writeFileSync('index.html', html, 'utf8');

// 3. Update app.js (Remove old buildFilters and flash bar logic that is now static or replaced)
let app = fs.readFileSync('assets/js/app.js', 'utf8');
// buildFilters no longer populates fltBar because we deleted it, let's empty it
app = app.replace(/function buildFilters\(\)\{[\s\S]*?\}\n/, 'function buildFilters(){}\n');
fs.writeFileSync('assets/js/app.js', app, 'utf8');
console.log('Update complete');
