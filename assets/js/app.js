// ============================================================
// app.js - Vitrinim Ana Uygulama Kodu
// Tamamen temiz yeniden yazım - UTF-8 - Türkçe
// ============================================================

'use strict';

// ========================= STATE =========================
let ads = [];
let favorites = [];
let currentUser = null;
let currentSort = 'newest';
let currentView = 'grid';
let activeCategory = 'all';
let filterState = { city: '', minPrice: null, maxPrice: null, cond: '' };
let tempPhotos = [];
let editingAdId = null;
let authMode = 'login';
let messages = {};
let currentConvId = null;
let displayedCount = 12;
const PAGE_SIZE = 12;


let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = window.supabase.createClient(
      'https://rxgywnzandkdpyiopnys.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3l3bnphbmRrZHB5aW9wbnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDU1MTMsImV4cCI6MjEwNjAyMTUxM30.vfqAZjk0wZPh6LwHo6dLiKpHqVgte2RKH_6y2SSqbZk'
    );
  }
  return _supabase;
}

function mapDbAd(dbAd) {
  return {
    id: dbAd.id,
    title: dbAd.title,
    category: dbAd.category,
    subcategory: dbAd.subcategory,
    price: dbAd.price,
    city: dbAd.city,
    district: dbAd.district,
    condition: dbAd.condition,
    desc: dbAd.description,
    phone: dbAd.phone,
    wa: dbAd.wa,
    seller: dbAd.seller_email,
    sellerName: dbAd.seller_name,
    sellerSince: '2024',
    imgs: dbAd.imgs || [],
    views: dbAd.views,
    featured: dbAd.featured,
    date: dbAd.created_at
  };
}


// ========================= STORAGE =========================
function save() {
  try {
    localStorage.setItem('vt_ads', JSON.stringify(ads));
    localStorage.setItem('vt_favs', JSON.stringify(favorites));
    localStorage.setItem('vt_user', currentUser ? JSON.stringify(currentUser) : '');
    localStorage.setItem('vt_msgs', JSON.stringify(messages));
  } catch(e) {}
}


async function load() {
  try {
    const savedFavs = localStorage.getItem('vt_favs');
    const savedUser = localStorage.getItem('vt_user');
    const savedMsgs = localStorage.getItem('vt_msgs');

    favorites = savedFavs ? JSON.parse(savedFavs) : [];
    currentUser = savedUser ? JSON.parse(savedUser) : null;
    messages = savedMsgs ? JSON.parse(savedMsgs) : {};

    // Fetch ads from Supabase
    const { data, error } = await getSupabase().from('ads').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      ads = DEMO_ADS.map(a => ({ ...a })); // Fallback
    } else if (data && data.length > 0) {
      ads = data.map(mapDbAd);
    } else {
      // Seed DB with demo ads if empty
      for (const ad of DEMO_ADS) {
        await getSupabase().from('ads').insert({
          title: ad.title,
          category: ad.category,
          subcategory: ad.subcategory,
          price: ad.price,
          city: ad.city,
          district: ad.district,
          condition: ad.condition,
          description: ad.desc || '',
          phone: ad.phone || '05555555555',
          wa: ad.wa || '',
          seller_email: 'demo@vitrinim.com',
          seller_name: ad.seller,
          imgs: ad.imgs,
          views: ad.views || 0,
          featured: ad.featured || false
        });
      }
      const { data: newData } = await getSupabase().from('ads').select('*').order('created_at', { ascending: false });
      if (newData) ads = newData.map(mapDbAd);
    }
    
    updateHeroStats();
    updateCategoryCounts();
    renderAds();
  } catch(e) {
    console.error(e);
  }
}


// ========================= INIT =========================
document.addEventListener('DOMContentLoaded', function() {
  load().then(() => { updateHeaderUser(); });
  updateBadges();
  updateHeroStats();
  updateCategoryCounts();
  renderAds();
  initSearch();
});

// ========================= NAVIGATION =========================
function goHome() {
  activeCategory = 'all';
  filterState = { city: '', minPrice: null, maxPrice: null, cond: '' };
  displayedCount = PAGE_SIZE;
  document.querySelectorAll('.cat-item').forEach(el => el.classList.toggle('active', el.dataset.cat === 'all'));
  document.getElementById('listingTitle').textContent = 'Son İlanlar';
  document.getElementById('heroSection').style.display = '';
  document.getElementById('catBoxesSection').style.display = '';
  renderAds();
}

function setCategory(cat) {
  activeCategory = cat;
  displayedCount = PAGE_SIZE;
  document.querySelectorAll('.cat-item').forEach(el => el.classList.toggle('active', el.dataset.cat === cat));
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('catBoxesSection').style.display = 'none';
  document.getElementById('listingTitle').textContent = cat === 'all' ? 'Tüm İlanlar' : cat + ' İlanları';
  renderAds();
  document.getElementById('listingSection').scrollIntoView({ behavior: 'smooth' });
}

// ========================= FILTERING & SORTING =========================
function getFilteredAds() {
  let result = [...ads];

  // Category filter
  if (activeCategory !== 'all') {
    result = result.filter(a => a.category === activeCategory);
  }

  // Text search
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  if (q) {
    result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.desc && a.desc.toLowerCase().includes(q)) ||
      (a.city && a.city.toLowerCase().includes(q))
    );
  }

  // City filter (header)
  const hdrCity = document.getElementById('hdrCity')?.value;
  if (hdrCity) result = result.filter(a => a.city === hdrCity);

  // Sidebar filters
  if (filterState.city) result = result.filter(a => a.city === filterState.city);
  if (filterState.minPrice != null) result = result.filter(a => a.price >= filterState.minPrice);
  if (filterState.maxPrice != null) result = result.filter(a => a.price <= filterState.maxPrice);
  if (filterState.cond) result = result.filter(a => a.condition === filterState.cond);

  // Sorting
  if (currentSort === 'newest') {
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.id - a.id;
    });
  }
  else if (currentSort === 'oldest') result.sort((a, b) => a.id - b.id);
  else if (currentSort === 'price_asc') result.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price_desc') result.sort((a, b) => b.price - a.price);

  return result;
}

function applyFilters() {
  displayedCount = PAGE_SIZE;
  renderAds();
}

function clearFilters() {
  filterState = { city: '', minPrice: null, maxPrice: null, cond: '' };
  document.querySelector('.filter-select').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.querySelectorAll('.filter-radio input').forEach(r => r.checked = r.value === '');
  renderAds();
}

function handleSort(val) {
  currentSort = val;
  renderAds();
}

function handleCityChange() {
  displayedCount = PAGE_SIZE;
  renderAds();
}

// ========================= RENDER ADS =========================
function renderAds() {
  const grid = document.getElementById('adsGrid');
  if (!grid) return;

  const filtered = getFilteredAds();
  const shown = filtered.slice(0, displayedCount);
  const hasMore = filtered.length > displayedCount;

  document.getElementById('loadMoreWrap').style.display = hasMore ? 'block' : 'none';

  if (shown.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>İlan bulunamadı</h3>
        <p>Farklı filtreler deneyin veya yeni bir ilan verin.</p>
      </div>
    `;
    return;
  }

  if (currentView === 'grid') {
    grid.classList.remove('list-view');
  } else {
    grid.classList.add('list-view');
  }

  grid.innerHTML = shown.map(ad => renderAdCard(ad)).join('');
}

function renderAdCard(ad) {
  const isFav = favorites.includes(ad.id);
  const imgHtml = ad.imgs && ad.imgs.length
    ? `<img class="ad-img" src="${ad.imgs[0]}" alt="${escHtml(ad.title)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
       <div class="ad-no-img" style="display:none">📷</div>`
    : `<div class="ad-no-img">📷</div>`;

  return `
    <div class="ad-card" onclick="openAdDetail(${ad.id})">
      <div class="ad-img-wrap">
        ${imgHtml}
        <button class="ad-fav-btn${isFav ? ' active' : ''}" onclick="toggleFav(event, ${ad.id})" title="${isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        ${ad.condition ? `<span class="ad-badge ${ad.condition}">${ad.condition === 'sıfır' ? 'Sıfır' : '2. El'}</span>` : ''}
        ${ad.featured ? `<span class="ad-badge" style="background:#f59e0b; left:auto; right:8px; bottom:8px;">⭐ Öne Çıkan</span>` : ''}
      </div>
      <div class="ad-body">
        <div class="ad-price">${formatPrice(ad.price)}</div>
        <div class="ad-title">${escHtml(ad.title)}</div>
        <div class="ad-meta">
          <span class="ad-location">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escHtml(ad.city)}${ad.district ? ' / ' + escHtml(ad.district) : ''}
          </span>
          <span class="ad-date">${formatDate(ad.date)}</span>
        </div>
      </div>
    </div>
  `;
}

function loadMore() {
  displayedCount += PAGE_SIZE;
  renderAds();
}

function setView(v) {
  currentView = v;
  document.getElementById('gridViewBtn').classList.toggle('active', v === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', v === 'list');
  renderAds();
}

// ========================= AD DETAIL =========================
function openAdDetail(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;

  // Increment view count
  ad.views = (ad.views || 0) + 1;
  getSupabase().from('ads').update({ views: ad.views }).eq('id', id).then();

  const isFav = favorites.includes(ad.id);
  const photos = ad.imgs && ad.imgs.length ? ad.imgs : [];

  let photosHtml = '';
  if (photos.length) {
    photosHtml = `
      <div class="adm-photos">
        <img class="adm-main-img" id="admMainImg" src="${photos[0]}" alt="${escHtml(ad.title)}">
        ${photos.length > 1 ? `
          <div class="adm-thumbs">
            ${photos.map((p, i) => `<img class="adm-thumb${i===0?' active':''}" src="${p}" onclick="changeAdPhoto(this, '${p}')">`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  const waBtn = ad.wa
    ? `<a href="https://wa.me/${ad.wa.replace(/\D/g,'')}" target="_blank" class="btn-whatsapp">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        WhatsApp ile İletişim
       </a>`
    : '';

  const callBtn = ad.phone
    ? `<button class="btn-call" onclick="callSeller('${escHtml(ad.phone)}')">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.14 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
        Telefon: ${escHtml(ad.phone)}
       </button>`
    : '';

  const sellerInitial = ad.seller ? ad.seller.charAt(0).toUpperCase() : '?';

  document.getElementById('adDetailContent').innerHTML = `
    <div class="adm-header">
      <h1>${escHtml(ad.title)}</h1>
      <div style="display:flex; gap:8px; flex-shrink:0;">
        <button class="btn-share" onclick="openShare(${ad.id})">
          <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Paylaş
        </button>
      </div>
    </div>
    ${photosHtml}
    <div class="adm-body">
      <div class="adm-price">${formatPrice(ad.price)}</div>
      <div class="adm-details-grid">
        <div class="adm-detail-item"><span class="adm-detail-label">Kategori:</span><span class="adm-detail-value">${escHtml(ad.category)}${ad.subcategory ? ' > ' + escHtml(ad.subcategory) : ''}</span></div>
        <div class="adm-detail-item"><span class="adm-detail-label">Şehir:</span><span class="adm-detail-value">${escHtml(ad.city)}${ad.district ? ' / ' + escHtml(ad.district) : ''}</span></div>
        <div class="adm-detail-item"><span class="adm-detail-label">Durum:</span><span class="adm-detail-value">${ad.condition === 'sıfır' ? 'Sıfır' : 'İkinci El'}</span></div>
        <div class="adm-detail-item"><span class="adm-detail-label">Görüntülenme:</span><span class="adm-detail-value">${ad.views || 0} kez</span></div>
      </div>
      ${ad.desc ? `<div class="adm-section-title">İlan Açıklaması</div><div class="adm-desc">${escHtml(ad.desc)}</div>` : ''}
      <div class="adm-actions">
        ${waBtn}
        ${callBtn}
        <button class="btn-msg" onclick="startChat(${ad.id})">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Mesaj Gönder
        </button>
        <button class="btn-fav-det${isFav ? ' active' : ''}" id="detFavBtn" onclick="toggleFavDet(${ad.id})">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          ${isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        </button>
      </div>
      <div class="adm-seller-info">
        <div class="adm-seller-row">
          <div class="adm-seller-avatar">${sellerInitial}</div>
          <div>
            <div class="adm-seller-name">${escHtml(ad.seller || 'Satıcı')}</div>
            <div class="adm-seller-date">Üye: ${ad.sellerSince || '2024'}</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--gray3);">Bu satıcının diğer ilanlarını <span style="color:var(--brand);cursor:pointer;" onclick="closeModal('adDetailOv');setCategory('${escHtml(ad.category)}')">görmek için tıklayın</span></div>
      </div>
    </div>
  `;
  openModal('adDetailOv');
}

function changeAdPhoto(thumbEl, src) {
  document.getElementById('admMainImg').src = src;
  document.querySelectorAll('.adm-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function callSeller(phone) {
  window.location.href = 'tel:' + phone;
}

function toggleFavDet(id) {
  toggleFavCore(id);
  const btn = document.getElementById('detFavBtn');
  if (btn) {
    const isFav = favorites.includes(id);
    btn.classList.toggle('active', isFav);
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>${isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}`;
  }
}

// ========================= FAVORITES =========================
function toggleFav(event, id) {
  event.stopPropagation();
  toggleFavCore(id);
  renderAds();
}

function toggleFavCore(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('Favorilerden çıkarıldı', 'info');
  } else {
    favorites.push(id);
    showToast('Favorilere eklendi ❤️', 'success');
  }
  save();
  updateBadges();
}

function toggleFavs() {
  if (!currentUser) { openModal('authOv'); return; }
  // Filter to show only favs
  const favAds = ads.filter(a => favorites.includes(a.id));
  const grid = document.getElementById('adsGrid');
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('catBoxesSection').style.display = 'none';
  document.getElementById('listingTitle').textContent = 'Favorilerim (' + favAds.length + ')';
  document.getElementById('loadMoreWrap').style.display = 'none';
  if (favAds.length === 0) {
    grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><h3>Favori ilanınız yok</h3><p>Beğendiğiniz ilanları favorilere ekleyin.</p></div>`;
    return;
  }
  grid.innerHTML = favAds.map(ad => renderAdCard(ad)).join('');
}

// ========================= SEARCH =========================
function initSearch() {
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
      document.getElementById('searchDrop').classList.remove('open');
    }
  });
}

function handleSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const drop = document.getElementById('searchDrop');
  if (!q) { drop.classList.remove('open'); renderAds(); return; }

  const suggestions = ads
    .filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    .slice(0, 6);

  if (suggestions.length === 0) { drop.classList.remove('open'); renderAds(); return; }

  drop.innerHTML = suggestions.map(a => `
    <div class="drop-item" onclick="openAdDetail(${a.id})">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>${escHtml(a.title)}</span>
      <span style="margin-left:auto; font-size:11px; color:var(--gray3);">${formatPrice(a.price)}</span>
    </div>
  `).join('');
  drop.classList.add('open');
  renderAds();
}

function doSearch() {
  document.getElementById('searchDrop').classList.remove('open');
  displayedCount = PAGE_SIZE;
  renderAds();
}

// ========================= ADD / EDIT AD =========================
function openAddAd() {
  if (!currentUser) { openModal('authOv'); return; }
  editingAdId = null;
  tempPhotos = [];
  document.getElementById('addAdTitle').textContent = 'İlan Ver';
  document.getElementById('fEditId').value = '';
  // Reset form
  ['fTitle','fDesc','fPhone','fWhatsapp','fDistrict'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  ['fCategory','fSubcategory','fCity','fCondition'].forEach(id => { const el = document.getElementById(id); if(el) el.selectedIndex = 0; });
  document.getElementById('fPrice').value = '';
  renderPhotoSlots();
  updateCharCount('fTitle', 'titleCount', 100);
  updateCharCount('fDesc', 'descCount', 2000);
  openModal('addAdOv');
}

function openEditAd(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;
  if (!currentUser || (currentUser.email !== ad.seller && !currentUser.isAdmin)) {
    showToast('Bu ilanı düzenleme yetkiniz yok', 'error');
    return;
  }
  editingAdId = id;
  tempPhotos = ad.imgs ? [...ad.imgs] : [];
  document.getElementById('addAdTitle').textContent = 'İlanı Düzenle';
  document.getElementById('fEditId').value = id;
  document.getElementById('fTitle').value = ad.title || '';
  document.getElementById('fPrice').value = ad.price || '';
  document.getElementById('fDesc').value = ad.desc || '';
  document.getElementById('fPhone').value = ad.phone || '';
  document.getElementById('fWhatsapp').value = ad.wa || '';
  document.getElementById('fDistrict').value = ad.district || '';
  setSelectValue('fCategory', ad.category);
  setSelectValue('fCity', ad.city);
  setSelectValue('fCondition', ad.condition);
  updateSubcategories();
  setTimeout(() => setSelectValue('fSubcategory', ad.subcategory), 50);
  renderPhotoSlots();
  updateCharCount('fTitle', 'titleCount', 100);
  updateCharCount('fDesc', 'descCount', 2000);
  closeModal('dashOv');
  openModal('addAdOv');
}

function handlePhotos(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    if (tempPhotos.length >= 8) { showToast('En fazla 8 fotoğraf ekleyebilirsiniz', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      tempPhotos.push(e.target.result);
      renderPhotoSlots();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function renderPhotoSlots() {
  const container = document.getElementById('photoSlots');
  if (!container) return;
  let html = tempPhotos.map((src, i) => `
    <div class="photo-slot" style="border-style:solid; border-color:var(--border);">
      <img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
      <button class="remove-photo" onclick="removePhoto(${i})" title="Kaldır">✕</button>
    </div>
  `).join('');
  if (tempPhotos.length < 8) {
    html += `
      <div class="photo-slot add-slot" onclick="document.getElementById('photoInput').click()">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Fotoğraf Ekle</span>
        <small>max 8 adet</small>
      </div>
    `;
  }
  container.innerHTML = html;
}

function removePhoto(idx) {
  tempPhotos.splice(idx, 1);
  renderPhotoSlots();
}

function updateSubcategories() {
  const cat = document.getElementById('fCategory')?.value;
  const subSel = document.getElementById('fSubcategory');
  if (!subSel) return;
  const subs = SUBCATEGORIES[cat] || [];
  subSel.innerHTML = '<option value="">Seçiniz</option>' +
    subs.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('');
}


async function saveAd() {
  const title = document.getElementById('fTitle').value.trim();
  const price = parseFloat(document.getElementById('fPrice').value);
  const city = document.getElementById('fCity').value;
  const category = document.getElementById('fCategory').value;
  const subcategory = document.getElementById('fSubcategory').value;
  const district = document.getElementById('fDistrict').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const wa = document.getElementById('fWhatsapp').value.trim();
  const condition = document.getElementById('fCondition').value;

  if (!title) return showToast('İlan başlığı gerekli!', 'error');
  if (isNaN(price) || price < 0) return showToast('Geçerli bir fiyat girin!', 'error');
  if (!city) return showToast('Şehir seçmelisiniz!', 'error');
  if (!category) return showToast('Kategori seçmelisiniz!', 'error');

  const editId = document.getElementById('fEditId').value;

  const submitBtn = document.querySelector('#addAdOv .btn-submit');
  if (submitBtn) { submitBtn.textContent = 'Kaydediliyor...'; submitBtn.disabled = true; }

  try {
    let sbError = null;

    if (editId) {
      const { error } = await getSupabase().from('ads').update({
        title, price, city, district, category, subcategory, description: desc,
        phone: phone || null, wa: wa || null, condition,
        imgs: tempPhotos.length ? tempPhotos : undefined
      }).eq('id', editId);
      sbError = error;
      if (!error) showToast('İlan güncellendi!', 'success');
    } else {
      const { error } = await getSupabase().from('ads').insert({
        title, price, city, district, category, subcategory, description: desc,
        phone: phone || null, wa: wa || null, condition,
        seller_email: currentUser.email,
        seller_name: currentUser.name,
        imgs: tempPhotos.length ? tempPhotos : [],
        views: 0,
        featured: false
      });
      sbError = error;
      if (!error) showToast('İlanınız yayınlandı! 🎉', 'success');
    }

    if (sbError) {
      console.error('Supabase insert/update error:', sbError);
      showToast('Hata: ' + (sbError.message || 'Bilinmeyen hata'), 'error');
      return;
    }

    // Refresh ads from DB
    const { data, error: fetchErr } = await getSupabase().from('ads').select('*').order('created_at', { ascending: false });
    if (fetchErr) console.error('Fetch error:', fetchErr);
    if (data) ads = data.map(mapDbAd);

    tempPhotos = [];
    updateHeroStats();
    updateCategoryCounts();
    renderAds();
    if (document.getElementById('dashOv').classList.contains('open')) renderDash();
    closeModal('addAdOv');
  } catch(e) {
    console.error('saveAd exception:', e);
    showToast('Bir hata oluştu: ' + e.message, 'error');
  } finally {
    if (submitBtn) { submitBtn.textContent = 'İlanı Yayınla'; submitBtn.disabled = false; }
  }
}




async function deleteAd(id) {
  if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
  
  await getSupabase().from('ads').delete().eq('id', id);
  
  const idx = ads.findIndex(a => a.id === id);
  if (idx > -1) ads.splice(idx, 1);
  
  renderAds();
  updateHeroStats();
  updateCategoryCounts();
  showToast('İlan silindi', 'info');
  openDash(); // refresh dash
}


// ========================= AUTH =========================
function setAuthTab(mode) {
  authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  renderAuthForm();
}

function renderAuthForm() {
  const el = document.getElementById('authForm');
  if (!el) return;
  if (authMode === 'login') {
    el.innerHTML = `
      <div class="form-group"><label>E-posta</label><input type="email" id="aEmail" placeholder="ornek@email.com"></div>
      <div class="form-group"><label>Şifre</label><input type="password" id="aPass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doAuth()"></div>
      <button class="btn-submit" onclick="doAuth()" style="margin-top:8px;">Giriş Yap</button>
    `;
  } else {
    el.innerHTML = `
      <div class="form-group"><label>Ad Soyad</label><input type="text" id="aName" placeholder="Adınız Soyadınız"></div>
      <div class="form-group"><label>E-posta</label><input type="email" id="aEmail" placeholder="ornek@email.com"></div>
      <div class="form-group"><label>Şifre</label><input type="password" id="aPass" placeholder="En az 6 karakter" onkeydown="if(event.key==='Enter')doAuth()"></div>
      <button class="btn-submit" onclick="doAuth()" style="margin-top:8px;">Üye Ol</button>
    `;
  }
}

document.getElementById('authOv').addEventListener('click', function() {
  // Render form on open
});

// Render auth form when modal opens
const origOpenModal = window.openModal;

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id === 'authOv') renderAuthForm();
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  const anyOpen = document.querySelectorAll('.modal-overlay.open').length > 0;
  if (!anyOpen) document.body.style.overflow = '';
}

function ovClick(event, id) {
  if (event.target === event.currentTarget) closeModal(id);
}

function doAuth() {
  const email = document.getElementById('aEmail')?.value.trim();
  const pass = document.getElementById('aPass')?.value;
  const name = document.getElementById('aName')?.value?.trim();

  if (!email || !pass) return showToast('E-posta ve şifre gerekli!', 'error');
  if (!email.includes('@')) return showToast('Geçerli bir e-posta girin!', 'error');
  if (pass.length < 6) return showToast('Şifre en az 6 karakter olmalı!', 'error');
  if (authMode === 'register' && !name) return showToast('Ad soyad gerekli!', 'error');

  // Simulate auth
  if (email === 'admin@vitrinim.com' && pass === 'admin123') {
    currentUser = { email, name: 'Admin', isAdmin: true, isSeller: true };
    showToast('Admin paneline hoş geldiniz! 🔐', 'success');
  } else if (authMode === 'login') {
    // Check if user exists (simulate)
    currentUser = { email, name: name || email.split('@')[0], isSeller: true };
    showToast('Hoş geldiniz, ' + currentUser.name.split(' ')[0] + '! 👋', 'success');
  } else {
    currentUser = { email, name, isSeller: true };
    showToast('Hoş geldiniz, ' + currentUser.name.split(' ')[0] + '! 👋', 'success');
  }
  
  save();
  updateHeaderUser();
  updateBadges();
  closeModal('authOv');
  if (currentUser.isAdmin) openDash();
}

function demoLogin() {
  currentUser = { email: 'demo@vitrinim.com', name: 'Demo Kullanıcı', isSeller: true };
  save();
  updateHeaderUser();
  updateBadges();
  closeModal('authOv');
  showToast('Demo girişi yapıldı! 🎭', 'success');
}

function demoSellerLogin() {
  currentUser = { email: 'seller@vitrinim.com', name: 'Demo Satıcı', isSeller: true };
  save();
  updateHeaderUser();
  updateBadges();
  closeModal('authOv');
  showToast('Demo satıcı girişi yapıldı! 🏪', 'success');
}

function adminLogin() {
  const email = document.getElementById('adminEmail')?.value.trim();
  const pass = document.getElementById('adminPass')?.value;
  if (email === 'admin@vitrinim.com' && pass === 'admin123') {
    currentUser = { email, name: 'Admin', isAdmin: true, isSeller: true };
    save();
    updateHeaderUser();
    updateBadges();
    closeModal('adminAuthOv');
    showToast('Admin paneline hoş geldiniz! 🔐', 'success');
    openDash();
  } else {
    showToast('Geçersiz admin bilgileri!', 'error');
  }
}

function logout() {
  currentUser = null;
  save();
  updateHeaderUser();
  updateBadges();
  closeModal('dashOv');
  showToast('Çıkış yapıldı', 'info');
}

function updateHeaderUser() {
  const lbl = document.getElementById('hdrUserLabel');
  if (lbl) lbl.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Giriş Yap';
}

// ========================= DASHBOARD =========================
function openDash() {
  if (!currentUser) { openModal('authOv'); return; }
  renderDash();
  openModal('dashOv');
}

let activeDashTab = 'myads';

function renderDash() {
  const myAds = ads.filter(a => a.seller === currentUser.email);
  const favCount = favorites.length;

  document.getElementById('dashContent').innerHTML = `
    <div class="dash-modal">
      <div class="dash-header">
        <h2>👤 ${escHtml(currentUser.name)}</h2>
        <div style="display:flex; gap:10px; align-items:center;">
          <span style="font-size:12px; color:var(--gray3);">${escHtml(currentUser.email)}</span>
          <button onclick="logout()" style="background:var(--gray6); border:1px solid var(--border); border-radius:var(--radius-sm); padding:6px 14px; font-size:13px; color:var(--gray2);">Çıkış Yap</button>
          <button onclick="closeModal('dashOv')" style="background:none;border:none;font-size:20px;color:var(--gray3);line-height:1;">✕</button>
        </div>
      </div>
      <div class="dash-stats">
        <div class="stat-card"><div class="stat-num">${myAds.length}</div><div class="stat-lbl">Aktif İlanım</div></div>
        <div class="stat-card"><div class="stat-num">${favCount}</div><div class="stat-lbl">Favorilerim</div></div>
        <div class="stat-card"><div class="stat-num">${myAds.reduce((s,a) => s + (a.views||0), 0)}</div><div class="stat-lbl">Toplam Görüntülenme</div></div>
      </div>
      <div class="dash-tabs">
        <button class="dash-tab${activeDashTab==='myads'?' active':''}" onclick="setDashTab('myads')">İlanlarım</button>
        <button class="dash-tab${activeDashTab==='favs'?' active':''}" onclick="setDashTab('favs')">Favorilerim</button>
        ${currentUser.isAdmin ? '<button class="dash-tab' + (activeDashTab==='admin'?' active':'') + '" onclick="setDashTab(\'admin\')">Admin Panel</button>' : ''}
      </div>
      <div id="dashTabContent"></div>
    </div>
  `;
  renderDashTab();
}

function setDashTab(tab) {
  activeDashTab = tab;
  renderDash();
}

function renderDashTab() {
  const el = document.getElementById('dashTabContent');
  if (!el) return;

  if (activeDashTab === 'myads') {
    const myAds = ads.filter(a => a.seller === currentUser.email);
    if (myAds.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:40px;"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg><h3>Henüz ilanınız yok</h3><p><a onclick="closeModal('dashOv'); openAddAd();" style="color:var(--brand); cursor:pointer;">İlk ilanınızı verin!</a></p></div>`;
      return;
    }
    el.innerHTML = `<div class="my-ads-list" style="margin-top:16px;">${myAds.map(ad => `
      <div class="my-ad-item">
        <img class="my-ad-img" src="${ad.imgs?.[0] || ''}" onerror="this.style.display='none'" alt="">
        <div class="my-ad-info">
          <div class="my-ad-title">${escHtml(ad.title)}</div>
          <div class="my-ad-price">${formatPrice(ad.price)}</div>
          <div class="my-ad-meta">${escHtml(ad.city)} • ${ad.views||0} görüntülenme • ${formatDate(ad.date)}</div>
        </div>
        <div class="my-ad-actions">
          <button class="btn-edit-ad" onclick="openEditAd(${ad.id})">Düzenle</button>
          <button class="btn-del-ad" onclick="deleteAd(${ad.id})">Sil</button>
        </div>
      </div>
    `).join('')}</div>`;
  } else if (activeDashTab === 'favs') {
    const favAds = ads.filter(a => favorites.includes(a.id));
    if (favAds.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:40px;"><h3>Favori ilanınız yok</h3></div>`;
      return;
    }
    el.innerHTML = `<div class="my-ads-list" style="margin-top:16px;">${favAds.map(ad => `
      <div class="my-ad-item" onclick="closeModal('dashOv'); openAdDetail(${ad.id});" style="cursor:pointer;">
        <img class="my-ad-img" src="${ad.imgs?.[0] || ''}" onerror="this.style.display='none'" alt="">
        <div class="my-ad-info">
          <div class="my-ad-title">${escHtml(ad.title)}</div>
          <div class="my-ad-price">${formatPrice(ad.price)}</div>
          <div class="my-ad-meta">${escHtml(ad.city)} • ${formatDate(ad.date)}</div>
        </div>
        <button class="btn-del-ad" onclick="event.stopPropagation(); toggleFavCore(${ad.id}); setDashTab('favs');">Kaldır</button>
      </div>
    `).join('')}</div>`;
  } else if (activeDashTab === 'admin' && currentUser.isAdmin) {
    el.innerHTML = `
      <div style="margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3>Admin Panel - İlan Yönetimi (${ads.length})</h3>
        </div>
        <div class="my-ads-list">${ads.map(ad => `
          <div class="my-ad-item">
            <img class="my-ad-img" src="${ad.imgs?.[0] || ''}" onerror="this.style.display='none'" alt="">
            <div class="my-ad-info">
              <div class="my-ad-title">
                ${ad.featured ? '<span style="color:#f59e0b;font-weight:bold;margin-right:5px;">⭐ ÖNE ÇIKAN</span>' : ''}
                ${escHtml(ad.title)}
              </div>
              <div class="my-ad-price">${formatPrice(ad.price)}</div>
              <div class="my-ad-meta">Satıcı: ${escHtml(ad.seller || '?')} • ${escHtml(ad.city)} • ${ad.views||0} görüntülenme</div>
            </div>
            <div class="my-ad-actions" style="display:flex; flex-direction:column; gap:6px; min-width:100px;">
              <button class="btn-edit-ad" style="background:#f59e0b; border-color:#f59e0b; color:#fff;" onclick="toggleFeatured(${ad.id})">${ad.featured ? '⭐ İndir' : '⭐ Öne Çıkar'}</button>
              <button class="btn-edit-ad" onclick="openEditAd(${ad.id})">✏️ Düzenle</button>
              <button class="btn-del-ad" onclick="deleteAd(${ad.id})">🗑️ Sil</button>
            </div>
          </div>
        `).join('')}</div>
      </div>
    `;
  }
}


async function toggleFeatured(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;
  
  const newStatus = !ad.featured;
  await getSupabase().from('ads').update({ featured: newStatus }).eq('id', id);
  ad.featured = newStatus;
  
  renderDash();
  renderAds();
  showToast(newStatus ? 'İlan öne çıkarıldı!' : 'İlan normal duruma getirildi.', 'success');
}


// ========================= MESSAGES =========================
function openMsgs() {
  if (!currentUser) { openModal('authOv'); return; }
  renderMsgs();
  openModal('msgsOv');
}

function renderMsgs() {
  const el = document.getElementById('msgsContent');
  if (!el) return;

  const myConvs = Object.entries(messages)
    .filter(([k]) => k.includes(currentUser.email))
    .map(([k, msgs]) => ({ id: k, msgs }));

  el.innerHTML = `
    <div style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2>Mesajlarım</h2>
        <button onclick="closeModal('msgsOv')" style="background:none;border:none;font-size:20px;color:var(--gray3);">✕</button>
      </div>
      ${myConvs.length === 0
        ? '<div class="empty-state"><h3>Mesajınız yok</h3><p>Bir ilan sayfasından satıcıya mesaj gönderin.</p></div>'
        : myConvs.map(c => {
            const last = c.msgs[c.msgs.length - 1];
            return `<div class="conv-item" onclick="openConv('${c.id}')">
              <div class="conv-avatar">${c.id.replace(currentUser.email,'').replace('-','').charAt(0).toUpperCase()}</div>
              <div class="conv-info">
                <div class="conv-name">${c.id.replace(currentUser.email,'').replace(/-/g,'')}</div>
                <div class="conv-last">${last ? escHtml(last.text) : ''}</div>
              </div>
            </div>`;
          }).join('')}
    </div>
  `;
}

function startChat(adId) {
  if (!currentUser) { openModal('authOv'); return; }
  const ad = ads.find(a => a.id === adId);
  if (!ad) return;
  const convId = [currentUser.email, ad.seller || 'seller'].sort().join('-') + '-' + adId;
  currentConvId = convId;
  if (!messages[convId]) messages[convId] = [];
  closeModal('adDetailOv');
  openConv(convId, ad);
}

function openConv(convId, ad) {
  currentConvId = convId;
  const el = document.getElementById('msgsContent');
  const msgs = messages[convId] || [];

  el.innerHTML = `
    <div class="chat-window open">
      <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px;">
        <button onclick="renderMsgs()" style="background:none;border:none;color:var(--brand); display:flex; align-items:center; gap:4px; font-weight:600; font-size:14px;">
          <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg> Geri
        </button>
        <div style="font-weight:600;">${convId}</div>
        <button onclick="closeModal('msgsOv')" style="margin-left:auto;background:none;border:none;font-size:20px;color:var(--gray3);">✕</button>
      </div>
      <div class="chat-msgs" id="chatMsgArea">
        ${msgs.length === 0 ? '<div style="text-align:center;color:var(--gray3);padding:20px;">Konuşma başlatmak için mesaj gönderin</div>' : ''}
        ${msgs.map(m => `
          <div class="chat-msg ${m.from === currentUser.email ? 'sent' : 'recv'}">
            <div class="chat-bubble-msg">${escHtml(m.text)}</div>
            <div class="chat-msg-time">${m.time}</div>
          </div>
        `).join('')}
      </div>
      <div class="chat-input-row" style="padding:0 24px 24px;">
        <input type="text" id="chatInput" placeholder="Mesajınızı yazın..." onkeydown="if(event.key==='Enter')sendChatMsg()">
        <button class="chat-send-btn" onclick="sendChatMsg()">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Gönder
        </button>
      </div>
    </div>
  `;
  const msgArea = document.getElementById('chatMsgArea');
  if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
  openModal('msgsOv');
}

function sendChatMsg() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentConvId) return;
  if (!messages[currentConvId]) messages[currentConvId] = [];
  messages[currentConvId].push({
    from: currentUser.email,
    text,
    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  });
  save();
  updateBadges();
  input.value = '';
  openConv(currentConvId);
}

// ========================= SHARE =========================
function openShare(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;
  const url = window.location.href;
  document.getElementById('shareContent').innerHTML = `
    <div class="share-modal">
      <h3 style="margin-bottom:16px;">İlanı Paylaş</h3>
      <div style="padding:12px; background:var(--gray6); border-radius:var(--radius-sm); font-size:13px; margin-bottom:16px; word-break:break-all;">${escHtml(ad.title)}</div>
      <div class="share-btns">
        <button class="share-btn share-wa" onclick="window.open('https://wa.me/?text=${encodeURIComponent(ad.title + ' - ' + url)}','_blank')">
          📱 WhatsApp
        </button>
        <button class="share-btn share-copy" onclick="copyToClipboard('${escHtml(url)}')">
          📋 Linki Kopyala
        </button>
        <button class="share-btn share-twitter" onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(ad.title)}&url=${encodeURIComponent(url)}','_blank')">
          🐦 Twitter
        </button>
        <button class="share-btn share-link" onclick="copyToClipboard('${escHtml(url)}')">
          🔗 Link Kopyala
        </button>
      </div>
      <button onclick="closeModal('shareOv')" style="width:100%;margin-top:16px;padding:10px;background:var(--gray6);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;">Kapat</button>
    </div>
  `;
  closeModal('adDetailOv');
  openModal('shareOv');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Link kopyalandı!', 'success')).catch(() => showToast('Kopyalanamadı', 'error'));
}

// ========================= HELPERS =========================
function updateHeroStats() {
  const el1 = document.getElementById('hsTotalAds');
  const el2 = document.getElementById('hsTotalUsers');
  if (el1) el1.textContent = ads.length.toLocaleString('tr-TR');
  if (el2) el2.textContent = Math.max(247, ads.length * 3).toLocaleString('tr-TR');
}

function updateCategoryCounts() {
  const cats = ['Vasıta','Emlak','Elektronik','Giyim','Ev & Yaşam','Spor','Hayvanlar','Diğer'];
  cats.forEach(cat => {
    const el = document.getElementById('cnt-' + cat);
    if (el) {
      const count = ads.filter(a => a.category === cat).length;
      el.textContent = count.toLocaleString('tr-TR') + ' ilan';
    }
  });
}

function updateBadges() {
  const favBadge = document.getElementById('favBadge');
  if (favBadge) {
    favBadge.textContent = favorites.length;
    favBadge.style.display = favorites.length > 0 ? 'flex' : 'none';
  }
  const msgCount = Object.values(messages).reduce((s, v) => s + v.length, 0);
  const msgBadge = document.getElementById('msgBadge');
  if (msgBadge) {
    msgBadge.textContent = msgCount;
    msgBadge.style.display = msgCount > 0 ? 'flex' : 'none';
  }
}

function formatPrice(price) {
  if (price == null) return '';
  return price.toLocaleString('tr-TR') + ' TL';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Bugün';
    if (diff === 1) return 'Dün';
    if (diff < 7) return diff + ' gün önce';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch(e) { return dateStr; }
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setSelectValue(id, val) {
  const el = document.getElementById(id);
  if (!el || !val) return;
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === val) { el.selectedIndex = i; break; }
  }
}

function updateCharCount(inputId, countId, max) {
  const inp = document.getElementById(inputId);
  const cnt = document.getElementById(countId);
  if (!inp || !cnt) return;
  cnt.textContent = inp.value.length + '/' + max;
  inp.addEventListener('input', () => { cnt.textContent = inp.value.length + '/' + max; });
}

let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}
