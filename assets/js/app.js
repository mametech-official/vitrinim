// ============================================================
// app.js - Vitrinim Ana Uygulama Kodu v3.0
// Supabase Auth + Storage + Realtime + Harita + Puanlama
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

// ========================= SUPABASE =========================
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

// ========================= STORAGE (Persist user+favs) =========================
function save() {
  try {
    localStorage.setItem('vt_favs', JSON.stringify(favorites));
    localStorage.setItem('vt_user', currentUser ? JSON.stringify(currentUser) : '');
  } catch(e) {}
}

// ========================= SKELETON =========================
function showSkeletons(count = 8) {
  const grid = document.getElementById('adsGrid');
  if (!grid) return;
  grid.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"><div class="skeleton"></div></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-price"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-title-2"></div>
        <div class="skeleton skeleton-meta"></div>
      </div>
    </div>
  `).join('');
}

// ========================= LOAD =========================
async function load() {
  try {
    const savedFavs = localStorage.getItem('vt_favs');
    const savedUser = localStorage.getItem('vt_user');

    favorites = savedFavs ? JSON.parse(savedFavs) : [];
    currentUser = savedUser ? JSON.parse(savedUser) : null;

    // Check active Supabase session
    const { data: { session } } = await getSupabase().auth.getSession();
    if (session?.user) {
      const u = session.user;
      const meta = u.user_metadata || {};
      currentUser = {
        id: u.id,
        email: u.email,
        name: meta.name || meta.full_name || u.email.split('@')[0],
        isAdmin: u.email === 'admin@vitrinim.com',
        isSeller: true,
        avatarUrl: meta.avatar_url || null
      };
      save();
      // Load cloud favorites
      const { data: favData } = await getSupabase()
        .from('favorites')
        .select('ad_id')
        .eq('user_email', currentUser.email);
      if (favData) favorites = favData.map(f => f.ad_id);
    }

    showSkeletons(8);

    const { data, error } = await getSupabase()
      .from('ads')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      ads = DEMO_ADS.map(a => ({ ...a }));
    } else if (data && data.length > 0) {
      ads = data.map(mapDbAd);
    } else {
      const inserts = DEMO_ADS.map(ad => ({
        title: ad.title, category: ad.category, subcategory: ad.subcategory,
        price: ad.price, city: ad.city, district: ad.district,
        condition: ad.condition, description: ad.desc || '',
        phone: ad.phone || null, wa: ad.wa || null,
        seller_email: 'demo@vitrinim.com', seller_name: ad.seller,
        imgs: ad.imgs, views: ad.views || 0, featured: ad.featured || false
      }));
      await getSupabase().from('ads').insert(inserts);
      const { data: newData } = await getSupabase().from('ads').select('*').order('created_at', { ascending: false });
      if (newData) ads = newData.map(mapDbAd);
    }

    updateHeroStats();
    updateCategoryCounts();
    renderAds();
    subscribeRealtime();
  } catch(e) {
    console.error(e);
    ads = DEMO_ADS.map(a => ({ ...a }));
    renderAds();
  }
}

// ========================= REALTIME =========================
let realtimeChannel = null;

function subscribeRealtime() {
  if (!currentUser) return;
  if (realtimeChannel) realtimeChannel.unsubscribe();

  realtimeChannel = getSupabase()
    .channel('new-messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conv_id=ilike.%${currentUser.email}%`
    }, (payload) => {
      const msg = payload.new;
      if (msg.from_email !== currentUser.email) {
        showRealtimeNotif('💬 Yeni mesaj: ' + msg.text.slice(0, 40));
        updateBadges();
      }
    })
    .subscribe();
}

let notifTimer = null;
function showRealtimeNotif(text) {
  let notif = document.getElementById('realtimeNotif');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'realtimeNotif';
    notif.style.cssText = `
      position:fixed; bottom:80px; right:20px; z-index:9999;
      background:#1a1a2e; color:#fff; padding:14px 20px;
      border-radius:12px; font-size:14px; font-weight:500;
      box-shadow:0 8px 30px rgba(0,0,0,0.3);
      cursor:pointer; max-width:280px; line-height:1.4;
      animation: slideInRight 0.3s ease;
    `;
    notif.onclick = () => { notif.remove(); openMsgs(); };
    document.body.appendChild(notif);
  }
  notif.textContent = text;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => notif.remove(), 5000);
}

// ========================= HERO STATS =========================
function updateHeroStats() {
  const el = document.getElementById('heroAdCount');
  if (el) el.textContent = ads.length.toLocaleString('tr-TR');
}

function updateCategoryCounts() {
  const cats = ['Vasıta','Emlak','Elektronik','Giyim','Ev & Yaşam','Spor','Hayvanlar','Diğer'];
  cats.forEach(cat => {
    const key = cat.toLowerCase().replace(/\s/g,'').replace('&','');
    const els = document.querySelectorAll(`[data-cat-count="${cat}"]`);
    const count = ads.filter(a => a.category === cat).length;
    els.forEach(el => el.textContent = count + ' İlan');
  });
}

// ========================= RENDER ADS =========================
function getFilteredAds() {
  let result = [...ads];
  const q = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
  if (q) result = result.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q) ||
    (a.desc || '').toLowerCase().includes(q)
  );
  if (activeCategory !== 'all') result = result.filter(a => a.category === activeCategory);
  const city = filterState.city;
  if (city) result = result.filter(a => a.city === city);
  if (filterState.minPrice !== null) result = result.filter(a => a.price >= filterState.minPrice);
  if (filterState.maxPrice !== null) result = result.filter(a => a.price <= filterState.maxPrice);
  if (filterState.cond) result = result.filter(a => a.condition === filterState.cond);

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

function renderAds() {
  const grid = document.getElementById('adsGrid');
  if (!grid) return;
  const filtered = getFilteredAds();
  const visible = filtered.slice(0, displayedCount);

  if (visible.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <h3>İlan bulunamadı</h3>
      <p>Farklı filtreler deneyin veya yeni bir ilan ekleyin.</p>
    </div>`;
    document.getElementById('loadMoreWrap').style.display = 'none';
    return;
  }

  if (currentView === 'grid') {
    grid.className = 'ads-grid';
    grid.innerHTML = visible.map(ad => renderAdCard(ad)).join('');
  } else {
    grid.className = 'ads-list';
    grid.innerHTML = visible.map(ad => renderAdCardList(ad)).join('');
  }

  const loadMoreWrap = document.getElementById('loadMoreWrap');
  if (loadMoreWrap) {
    loadMoreWrap.style.display = filtered.length > displayedCount ? 'flex' : 'none';
    const countEl = document.getElementById('showingCount');
    if (countEl) countEl.textContent = `${visible.length} / ${filtered.length} ilan gösteriliyor`;
  }
}

function renderAdCard(ad) {
  const isFav = favorites.includes(ad.id);
  const img = ad.imgs?.[0] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="%23f0f0f0" width="200" height="150"/><text fill="%23aaa" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle">Fotoğraf Yok</text></svg>';
  return `
    <div class="ad-card" onclick="openAdDetail(${ad.id})">
      <div class="ad-img-wrap">
        <img class="ad-img" src="${img}" alt="${escHtml(ad.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 150%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22150%22/><text fill=%22%23aaa%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22>Fotoğraf Yok</text></svg>'">
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFav(${ad.id})" title="${isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        ${ad.condition ? `<span class="ad-badge ${ad.condition}">${ad.condition === 'sıfır' ? 'Sıfır' : '2. El'}</span>` : ''}
        ${ad.featured ? `<span class="ad-badge" style="background:#f59e0b; left:auto; right:8px; bottom:8px;">⭐ Öne Çıkan</span>` : ''}
      </div>
      <div class="ad-body">
        <div class="ad-price">${formatPrice(ad.price)}</div>
        <div class="ad-title">${escHtml(ad.title)}</div>
        <div class="ad-meta">
          <span>📍 ${escHtml(ad.city)}${ad.district ? ' / ' + escHtml(ad.district) : ''}</span>
          <span>${formatDate(ad.date)}</span>
        </div>
      </div>
    </div>`;
}

function renderAdCardList(ad) {
  const isFav = favorites.includes(ad.id);
  const img = ad.imgs?.[0] || '';
  return `
    <div class="ad-list-item" onclick="openAdDetail(${ad.id})">
      ${img ? `<img class="ad-list-img" src="${img}" alt="" loading="lazy">` : '<div class="ad-list-img" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;">Fotoğraf Yok</div>'}
      <div class="ad-list-info">
        <div class="ad-list-title">${escHtml(ad.title)}</div>
        <div class="ad-list-price">${formatPrice(ad.price)}</div>
        <div class="ad-list-meta">📍 ${escHtml(ad.city)} • ${escHtml(ad.category)} • ${formatDate(ad.date)}</div>
      </div>
      <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFav(${ad.id})">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>`;
}

function loadMore() {
  displayedCount += PAGE_SIZE;
  renderAds();
}

function setView(v) {
  currentView = v;
  document.getElementById('viewGrid').classList.toggle('active', v === 'grid');
  document.getElementById('viewList').classList.toggle('active', v === 'list');
  renderAds();
}

function setSort(v) {
  currentSort = v;
  displayedCount = PAGE_SIZE;
  renderAds();
}

function setCategory(cat) {
  activeCategory = cat;
  displayedCount = PAGE_SIZE;
  document.querySelectorAll('.cat-tab').forEach(el => el.classList.toggle('active', el.dataset.cat === cat));
  renderAds();
}

function applyFilters() {
  const city = document.getElementById('filterCity')?.value || '';
  const min = parseFloat(document.getElementById('filterMin')?.value) || null;
  const max = parseFloat(document.getElementById('filterMax')?.value) || null;
  const cond = document.querySelector('.cond-radio:checked')?.value || '';
  filterState = { city, minPrice: min, maxPrice: max, cond };
  displayedCount = PAGE_SIZE;
  renderAds();
}

function clearFilters() {
  filterState = { city: '', minPrice: null, maxPrice: null, cond: '' };
  const cityEl = document.getElementById('filterCity');
  const minEl = document.getElementById('filterMin');
  const maxEl = document.getElementById('filterMax');
  if (cityEl) cityEl.value = '';
  if (minEl) minEl.value = '';
  if (maxEl) maxEl.value = '';
  document.querySelectorAll('.cond-radio').forEach(r => r.checked = r.value === '');
  displayedCount = PAGE_SIZE;
  renderAds();
}

// ========================= AD DETAIL =========================
async function openAdDetail(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;

  ad.views = (ad.views || 0) + 1;
  getSupabase().from('ads').update({ views: ad.views }).eq('id', id).then();

  // Fetch seller rating
  let ratingHtml = '';
  try {
    const { data: ratingData } = await getSupabase()
      .from('ratings')
      .select('score')
      .eq('rated_email', ad.seller);
    if (ratingData && ratingData.length > 0) {
      const avg = ratingData.reduce((s, r) => s + r.score, 0) / ratingData.length;
      const stars = '⭐'.repeat(Math.round(avg));
      ratingHtml = `<div style="margin:8px 0; font-size:13px; color:var(--gray2);">${stars} ${avg.toFixed(1)} / 5 (${ratingData.length} değerlendirme)</div>`;
    }
  } catch(e) {}

  // Fetch seller's other ads
  const sellerOtherAds = ads.filter(a => a.seller === ad.seller && a.id !== id).slice(0, 4);

  const imgs = ad.imgs?.length ? ad.imgs : [''];
  const el = document.getElementById('adDetailContent');
  el.innerHTML = `
    <div class="ad-detail-modal">
      <div class="ad-detail-imgs">
        <div class="ad-detail-main-img-wrap">
          <img id="mainDetailImg" src="${imgs[0]}" alt="${escHtml(ad.title)}" onerror="this.style.display='none'">
        </div>
        ${imgs.length > 1 ? `<div class="ad-detail-thumbs">${imgs.map((img, i) => `<img src="${img}" class="ad-detail-thumb ${i===0?'active':''}" onclick="document.getElementById('mainDetailImg').src='${img}'; document.querySelectorAll('.ad-detail-thumb').forEach((t,ti)=>t.classList.toggle('active',ti===${i}))" alt="">`).join('')}</div>` : ''}
      </div>
      <div class="ad-detail-info">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div>
            ${ad.featured ? '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">⭐ ÖNE ÇIKAN</span>' : ''}
            <h2 class="ad-detail-title" style="margin-top:4px;">${escHtml(ad.title)}</h2>
          </div>
          <button onclick="openShare(${ad.id})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;flex-shrink:0;">🔗 Paylaş</button>
        </div>
        <div class="ad-detail-price">${formatPrice(ad.price)}</div>
        <div class="ad-detail-meta-grid">
          <div><span>📍 Konum</span><strong>${escHtml(ad.city)}${ad.district ? ' / ' + escHtml(ad.district) : ''}</strong></div>
          <div><span>📁 Kategori</span><strong>${escHtml(ad.category)}${ad.subcategory ? ' > ' + escHtml(ad.subcategory) : ''}</strong></div>
          ${ad.condition ? `<div><span>📦 Durum</span><strong>${ad.condition === 'sıfır' ? '✨ Sıfır' : '🔄 İkinci El'}</strong></div>` : ''}
          <div><span>👁️ Görüntülenme</span><strong>${ad.views}</strong></div>
          <div><span>📅 Tarih</span><strong>${formatDate(ad.date)}</strong></div>
        </div>
        ${ad.desc ? `<div class="ad-detail-desc"><h4>Açıklama</h4><p>${escHtml(ad.desc)}</p></div>` : ''}

        <div class="ad-detail-seller" onclick="openSellerProfile('${ad.seller}')">
          <div class="seller-avatar">${(ad.sellerName || '?').charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;">${escHtml(ad.sellerName || ad.seller)}</div>
            <div style="font-size:12px;color:var(--gray3);">Üye ${ad.sellerSince}</div>
            ${ratingHtml}
          </div>
          <span style="margin-left:auto;color:var(--brand);font-size:12px;font-weight:600;">Profili Gör →</span>
        </div>

        <div class="ad-detail-actions">
          ${ad.phone ? `<a href="tel:${ad.phone}" class="btn-call">📞 Ara</a>` : ''}
          ${ad.wa ? `<a href="https://wa.me/${ad.wa.replace(/\D/g,'')}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>` : ''}
          <button class="btn-msg" onclick="startChat(${ad.id})">✉️ Mesaj Gönder</button>
        </div>

        ${currentUser && currentUser.email !== ad.seller ? `
        <div style="margin-top:12px; padding:12px; background:#fffbeb; border-radius:8px;">
          <div style="font-size:13px; font-weight:600; margin-bottom:8px;">⭐ Bu satıcıyı puanla:</div>
          <div style="display:flex;gap:6px;align-items:center;">
            ${[1,2,3,4,5].map(s => `<button onclick="rateAd(${ad.id},'${ad.seller}',${s})" style="background:none;border:none;font-size:22px;cursor:pointer;line-height:1;" title="${s} yıldız">⭐</button>`).join('')}
          </div>
        </div>` : ''}

        ${sellerOtherAds.length > 0 ? `
        <div style="margin-top:16px;">
          <h4 style="margin-bottom:10px; font-size:14px;">Satıcının Diğer İlanları</h4>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            ${sellerOtherAds.map(a => `
              <div onclick="closeModal('adDetailOv');openAdDetail(${a.id})" style="cursor:pointer;border:1px solid var(--border);border-radius:8px;overflow:hidden;">
                ${a.imgs?.[0] ? `<img src="${a.imgs[0]}" style="width:100%;height:60px;object-fit:cover;" alt="">` : ''}
                <div style="padding:6px 8px;"><div style="font-size:11px;font-weight:600;">${escHtml(a.title)}</div><div style="font-size:12px;color:var(--brand);font-weight:700;">${formatPrice(a.price)}</div></div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- Harita -->
        <div style="margin-top:16px;">
          <h4 style="margin-bottom:8px;font-size:14px;">📍 Konum</h4>
          <div id="adMap" style="height:180px;border-radius:8px;border:1px solid var(--border);"></div>
        </div>
      </div>
    </div>
  `;

  openModal('adDetailOv');

  // Load Leaflet map after modal opens
  setTimeout(() => loadMap(ad.city, ad.district), 300);
}

// ========================= MAP =========================
function loadMap(city, district) {
  const mapEl = document.getElementById('adMap');
  if (!mapEl) return;

  // If Leaflet not loaded, load it
  if (!window.L) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => showMap(mapEl, city, district);
    document.head.appendChild(script);
  } else {
    showMap(mapEl, city, district);
  }
}

function showMap(mapEl, city, district) {
  // Turkey city coordinates lookup
  const cityCoords = {
    'İstanbul': [41.015, 28.979], 'Ankara': [39.920, 32.854], 'İzmir': [38.419, 27.129],
    'Bursa': [40.183, 29.066], 'Antalya': [36.897, 30.713], 'Adana': [37.000, 35.321],
    'Konya': [37.871, 32.485], 'Gaziantep': [37.066, 37.383], 'Trabzon': [41.005, 39.727],
    'Kayseri': [38.732, 35.487], 'Diyarbakır': [37.914, 40.230], 'Mersin': [36.812, 34.641],
    'Eskişehir': [39.776, 30.520], 'Samsun': [41.286, 36.330], 'Erzurum': [39.905, 41.270]
  };
  const coords = cityCoords[city] || [39.000, 35.000];

  if (mapEl._leaflet_id) {
    mapEl._leaflet_id = null;
    mapEl.innerHTML = '';
  }

  const map = window.L.map(mapEl).setView(coords, city ? 12 : 6);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  window.L.marker(coords).addTo(map)
    .bindPopup(`<b>${city}${district ? ' / ' + district : ''}</b>`).openPopup();
}

// ========================= RATING =========================
async function rateAd(adId, sellerEmail, score) {
  if (!currentUser) { showToast('Puanlamak için giriş yapın!', 'error'); return; }

  const { error } = await getSupabase().from('ratings').upsert({
    rated_email: sellerEmail,
    rater_email: currentUser.email,
    ad_id: adId,
    score
  }, { onConflict: 'rater_email,ad_id' });

  if (error) { showToast('Puan verilemedi: ' + error.message, 'error'); return; }
  showToast(`${score} yıldız verdiniz! ⭐`, 'success');
  openAdDetail(adId); // Refresh
}

// ========================= SELLER PROFILE =========================
async function openSellerProfile(email) {
  closeModal('adDetailOv');
  const sellerAds = ads.filter(a => a.seller === email);
  const { data: profileData } = await getSupabase().from('user_profiles').select('*').eq('email', email).single();
  const { data: ratingData } = await getSupabase().from('ratings').select('score, comment, rater_email, created_at').eq('rated_email', email);

  const profile = profileData || {};
  const ratings = ratingData || [];
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : null;

  const sellerName = profile.name || sellerAds[0]?.sellerName || email.split('@')[0];

  const el = document.getElementById('adDetailContent');
  el.innerHTML = `
    <div style="padding:24px; max-width:700px; margin:0 auto;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;flex-shrink:0;">
          ${sellerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style="margin:0 0 4px;">${escHtml(sellerName)}</h2>
          <div style="font-size:13px;color:var(--gray3);">${email}</div>
          ${avgRating ? `<div style="margin-top:4px;">⭐ ${avgRating} / 5 (${ratings.length} değerlendirme)</div>` : '<div style="font-size:12px;color:var(--gray3);">Henüz değerlendirme yok</div>'}
        </div>
      </div>

      <h3 style="margin-bottom:12px;">İlanları (${sellerAds.length})</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:24px;">
        ${sellerAds.map(a => `
          <div onclick="openModal('adDetailOv');openAdDetail(${a.id})" style="cursor:pointer;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#fff;">
            ${a.imgs?.[0] ? `<img src="${a.imgs[0]}" style="width:100%;height:80px;object-fit:cover;" alt="">` : '<div style="height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;">Fotoğraf Yok</div>'}
            <div style="padding:6px 8px;">
              <div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(a.title)}</div>
              <div style="font-size:12px;color:var(--brand);font-weight:700;">${formatPrice(a.price)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      ${ratings.length > 0 ? `
      <h3 style="margin-bottom:12px;">Değerlendirmeler</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${ratings.slice(0, 5).map(r => `
          <div style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:600;font-size:13px;">${r.rater_email.split('@')[0]}</span>
              <span>${'⭐'.repeat(r.score)}</span>
            </div>
            ${r.comment ? `<div style="font-size:13px;color:var(--gray2);">${escHtml(r.comment)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  `;
  openModal('adDetailOv');
}

// ========================= FAVORITES =========================
async function toggleFav(id) {
  if (!currentUser) { openModal('authOv'); return; }

  const isFav = favorites.includes(id);
  if (isFav) {
    favorites = favorites.filter(f => f !== id);
    // Remove from DB
    await getSupabase().from('favorites').delete().eq('user_email', currentUser.email).eq('ad_id', id);
    showToast('Favorilerden çıkarıldı', 'info');
  } else {
    favorites.push(id);
    // Add to DB
    await getSupabase().from('favorites').insert({ user_email: currentUser.email, ad_id: id });
    showToast('Favorilere eklendi ❤️', 'success');
  }
  save();
  updateBadges();
  renderAds();
}

function toggleFavCore(id) { toggleFav(id); }

function toggleFavs() {
  if (!currentUser) { openModal('authOv'); return; }
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
  const fields = ['fTitle','fPrice','fCity','fDistrict','fDesc','fPhone','fWhatsapp'];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const catEl = document.getElementById('fCategory'); if (catEl) catEl.value = '';
  const condEl = document.getElementById('fCondition'); if (condEl) condEl.value = '';
  renderPhotoSlots();
  updateSubcategories();
  openModal('addAdOv');
}

function openEditAd(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;
  if (!currentUser || (currentUser.email !== ad.seller && !currentUser.isAdmin)) {
    showToast('Bu ilanı düzenleme yetkiniz yok', 'error'); return;
  }
  editingAdId = id;
  tempPhotos = [...(ad.imgs || [])];
  document.getElementById('addAdTitle').textContent = 'İlanı Düzenle';
  document.getElementById('fEditId').value = id;
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
  set('fTitle', ad.title); set('fPrice', ad.price); set('fCity', ad.city);
  set('fDistrict', ad.district); set('fDesc', ad.desc); set('fPhone', ad.phone);
  set('fWhatsapp', ad.wa);
  const catEl = document.getElementById('fCategory'); if (catEl) { catEl.value = ad.category; updateSubcategories(); }
  const subEl = document.getElementById('fSubcategory'); if (subEl) subEl.value = ad.subcategory || '';
  const condEl = document.getElementById('fCondition'); if (condEl) condEl.value = ad.condition || '';
  renderPhotoSlots();
  closeModal('dashOv');
  openModal('addAdOv');
}

function handlePhotoUpload(event) {
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
        views: 0, featured: false
      });
      sbError = error;
      if (!error) {
        showToast('İlanınız yayınlandı! 🎉', 'success');
        // Save seller profile if not exists
        await getSupabase().from('user_profiles').upsert({
          email: currentUser.email, name: currentUser.name
        }, { onConflict: 'email' });
      }
    }

    if (sbError) {
      console.error('Supabase error:', sbError);
      showToast('Hata: ' + (sbError.message || 'Bilinmeyen hata'), 'error');
      return;
    }

    const { data } = await getSupabase().from('ads').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false });
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
  openDash();
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
      <div style="margin-top:12px;text-align:center;"><button onclick="forgotPassword()" style="background:none;border:none;color:var(--brand);cursor:pointer;font-size:13px;">Şifremi Unuttum</button></div>
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

async function doAuth() {
  const email = document.getElementById('aEmail')?.value.trim();
  const pass = document.getElementById('aPass')?.value;
  const name = document.getElementById('aName')?.value?.trim();

  if (!email || !pass) return showToast('E-posta ve şifre gerekli!', 'error');
  if (!email.includes('@')) return showToast('Geçerli bir e-posta girin!', 'error');
  if (pass.length < 6) return showToast('Şifre en az 6 karakter olmalı!', 'error');
  if (authMode === 'register' && !name) return showToast('Ad soyad gerekli!', 'error');

  // Admin shortcut
  if (email === 'admin@vitrinim.com' && pass === 'admin123') {
    currentUser = { email, name: 'Admin', isAdmin: true, isSeller: true };
    save(); updateHeaderUser(); updateBadges();
    closeModal('authOv');
    showToast('Admin paneline hoş geldiniz! 🔐', 'success');
    openDash(); return;
  }

  const submitBtn = document.querySelector('#authOv .btn-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Lütfen bekleyin...'; }

  try {
    let result;
    if (authMode === 'register') {
      result = await getSupabase().auth.signUp({
        email, password: pass,
        options: { data: { name, full_name: name } }
      });
    } else {
      result = await getSupabase().auth.signInWithPassword({ email, password: pass });
    }

    const { data, error } = result;
    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login')) msg = 'E-posta veya şifre hatalı!';
      if (msg.includes('already registered')) msg = 'Bu e-posta zaten kayıtlı!';
      if (msg.includes('Email not confirmed')) msg = 'E-posta doğrulanmamış! Gelen kutunuzu kontrol edin.';
      showToast(msg, 'error'); return;
    }

    const u = data.user;
    const meta = u?.user_metadata || {};
    currentUser = {
      id: u.id, email: u.email,
      name: meta.name || meta.full_name || name || u.email.split('@')[0],
      isSeller: true, isAdmin: u.email === 'admin@vitrinim.com'
    };

    // Save profile
    await getSupabase().from('user_profiles').upsert({
      email: currentUser.email, name: currentUser.name
    }, { onConflict: 'email' });

    // Load favorites from cloud
    const { data: favData } = await getSupabase().from('favorites').select('ad_id').eq('user_email', currentUser.email);
    if (favData) favorites = favData.map(f => f.ad_id);

    save();
    updateHeaderUser();
    updateBadges();
    closeModal('authOv');

    if (authMode === 'register') {
      showToast('Hoş geldiniz! E-postanızı doğrulamayı unutmayın. 📧', 'success');
    } else {
      showToast('Hoş geldiniz, ' + currentUser.name.split(' ')[0] + '! 👋', 'success');
    }

    subscribeRealtime();
    if (currentUser.isAdmin) openDash();
  } catch(e) {
    showToast('Bir hata oluştu: ' + e.message, 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = authMode === 'login' ? 'Giriş Yap' : 'Üye Ol'; }
  }
}

async function forgotPassword() {
  const email = document.getElementById('aEmail')?.value.trim();
  if (!email) return showToast('E-posta alanını doldurun', 'error');
  const { error } = await getSupabase().auth.resetPasswordForEmail(email);
  if (error) { showToast('Hata: ' + error.message, 'error'); return; }
  showToast('Şifre sıfırlama e-postası gönderildi! 📧', 'success');
}

async function logout() {
  await getSupabase().auth.signOut();
  currentUser = null;
  favorites = [];
  if (realtimeChannel) realtimeChannel.unsubscribe();
  save();
  updateHeaderUser();
  updateBadges();
  closeModal('dashOv');
  renderAds();
  showToast('Çıkış yapıldı. Görüşürüz! 👋', 'info');
}

function demoLogin() {
  currentUser = { email: 'demo@vitrinim.com', name: 'Demo Kullanıcı', isSeller: true };
  save(); updateHeaderUser(); updateBadges(); closeModal('authOv');
  showToast('Demo girişi yapıldı! 🎭', 'success');
}

function demoSellerLogin() { demoLogin(); }

function adminLogin() {
  currentUser = { email: 'admin@vitrinim.com', name: 'Admin', isAdmin: true, isSeller: true };
  save(); updateHeaderUser(); updateBadges();
  closeModal('adminAuthOv');
  openDash();
  showToast('Admin girişi yapıldı! 🔐', 'success');
}

// ========================= HEADER =========================
function updateHeaderUser() {
  const userBtn = document.getElementById('userBtn');
  const userInfo = document.getElementById('userInfo');
  if (!currentUser) {
    if (userBtn) userBtn.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
    return;
  }
  if (userBtn) userBtn.style.display = 'none';
  if (userInfo) {
    userInfo.style.display = 'flex';
    const nameEl = document.getElementById('headerUserName');
    if (nameEl) nameEl.textContent = currentUser.name?.split(' ')[0] || 'Hesabım';
  }
}

async function updateBadges() {
  const favBadge = document.getElementById('favCount');
  if (favBadge) favBadge.textContent = favorites.length || '';

  if (!currentUser) {
    const msgBadge = document.getElementById('msgCount');
    if (msgBadge) msgBadge.textContent = '';
    return;
  }

  // Count unread messages from DB
  const { count } = await getSupabase()
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .ilike('conv_id', `%${currentUser.email}%`)
    .neq('from_email', currentUser.email);

  const msgBadge = document.getElementById('msgCount');
  if (msgBadge) msgBadge.textContent = count || '';
}

// ========================= DASHBOARD =========================
let activeDashTab = 'myads';

function openDash() {
  if (!currentUser) { openModal('authOv'); return; }
  activeDashTab = currentUser.isAdmin ? 'admin' : 'myads';
  renderDash();
  openModal('dashOv');
}

function renderDash() {
  if (!currentUser) return;
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
        ${currentUser.isAdmin ? `<button class="dash-tab${activeDashTab==='admin'?' active':''}" onclick="setDashTab('admin')">Admin Panel</button>` : ''}
      </div>
      <div id="dashTabContent"></div>
    </div>
  `;
  renderDashTab();
}

function setDashTab(tab) { activeDashTab = tab; renderDash(); }

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
        <button class="btn-del-ad" onclick="event.stopPropagation(); toggleFav(${ad.id}); setDashTab('favs');">Kaldır</button>
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

// ========================= MESSAGES =========================
function openMsgs() {
  if (!currentUser) { openModal('authOv'); return; }
  renderMsgs();
  openModal('msgsOv');
}

async function renderMsgs() {
  const el = document.getElementById('msgsContent');
  if (!el) return;

  el.innerHTML = `<div style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><h2>Mesajlarım</h2><button onclick="closeModal('msgsOv')" style="background:none;border:none;font-size:20px;color:var(--gray3);">✕</button></div><div style="text-align:center;padding:20px;color:var(--gray3);">Yükleniyor...</div></div>`;

  const { data, error } = await getSupabase()
    .from('messages')
    .select('*')
    .ilike('conv_id', `%${currentUser.email}%`)
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  const convMap = {};
  (data || []).forEach(m => {
    if (!convMap[m.conv_id]) convMap[m.conv_id] = [];
    convMap[m.conv_id].push(m);
  });

  const myConvs = Object.entries(convMap).map(([k, msgs]) => ({ id: k, msgs }));

  const convId2Name = (id) => {
    const parts = id.split('-');
    const withoutLast = parts.slice(0, -1).join('-');
    return withoutLast.replace(currentUser.email, '').replace(/^-|-$/g, '') || 'Kullanıcı';
  };

  el.innerHTML = `
    <div style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2>Mesajlarım</h2>
        <button onclick="closeModal('msgsOv')" style="background:none;border:none;font-size:20px;color:var(--gray3);">✕</button>
      </div>
      ${myConvs.length === 0
        ? '<div class="empty-state"><h3>Mesajınız yok</h3><p>Bir ilan sayfasından satıcıya mesaj gönderin.</p></div>'
        : myConvs.map(c => {
            const last = c.msgs[0];
            const name = convId2Name(c.id);
            return `<div class="conv-item" onclick="openConv('${c.id}')">
              <div class="conv-avatar">${name.charAt(0).toUpperCase()}</div>
              <div class="conv-info">
                <div class="conv-name">${escHtml(name)}</div>
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
  if (ad.seller === currentUser.email) { showToast('Kendi ilanınıza mesaj gönderemezsiniz', 'error'); return; }
  const convId = [currentUser.email, ad.seller || 'seller'].sort().join('-') + '-' + adId;
  currentConvId = convId;
  closeModal('adDetailOv');
  openConv(convId);
}

async function openConv(convId) {
  currentConvId = convId;
  const el = document.getElementById('msgsContent');

  el.innerHTML = `
    <div class="chat-window open">
      <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px;">
        <button onclick="renderMsgs()" style="background:none;border:none;color:var(--brand); display:flex; align-items:center; gap:4px; font-weight:600; font-size:14px;">
          <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg> Geri
        </button>
        <div style="font-weight:600; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(convId)}</div>
        <button onclick="closeModal('msgsOv')" style="margin-left:auto;background:none;border:none;font-size:20px;color:var(--gray3);">✕</button>
      </div>
      <div class="chat-msgs" id="chatMsgArea"><div style="text-align:center;color:var(--gray3);padding:20px;">Yükleniyor...</div></div>
      <div class="chat-input-row" style="padding:0 24px 24px;">
        <input type="text" id="chatInput" placeholder="Mesajınızı yazın..." onkeydown="if(event.key==='Enter')sendChatMsg()">
        <button class="chat-send-btn" onclick="sendChatMsg()">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Gönder
        </button>
      </div>
    </div>
  `;

  openModal('msgsOv');

  const { data } = await getSupabase()
    .from('messages')
    .select('*')
    .eq('conv_id', convId)
    .order('created_at', { ascending: true });

  const msgArea = document.getElementById('chatMsgArea');
  if (!msgArea) return;

  const msgs = data || [];
  if (msgs.length === 0) {
    msgArea.innerHTML = '<div style="text-align:center;color:var(--gray3);padding:20px;">Konuşmayı başlatmak için mesaj gönderin</div>';
  } else {
    msgArea.innerHTML = msgs.map(m => `
      <div class="chat-msg ${m.from_email === currentUser.email ? 'sent' : 'recv'}">
        <div class="chat-bubble-msg">${escHtml(m.text)}</div>
        <div class="chat-msg-time">${new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    `).join('');
    msgArea.scrollTop = msgArea.scrollHeight;
  }
}

async function sendChatMsg() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentConvId || !currentUser) return;
  input.value = '';

  const { error } = await getSupabase().from('messages').insert({
    conv_id: currentConvId,
    from_email: currentUser.email,
    from_name: currentUser.name,
    text
  });

  if (error) { console.error(error); showToast('Mesaj gönderilemedi', 'error'); return; }
  updateBadges();
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
        <button class="share-btn share-wa" onclick="window.open('https://wa.me/?text=${encodeURIComponent(ad.title + ' - ' + url)}','_blank')">📱 WhatsApp</button>
        <button class="share-btn share-copy" onclick="copyToClipboard('${escHtml(url)}')">📋 Linki Kopyala</button>
        <button class="share-btn share-twitter" onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(ad.title)}&url=${encodeURIComponent(url)}','_blank')">🐦 Twitter</button>
      </div>
      <button onclick="closeModal('shareOv')" style="width:100%;margin-top:16px;padding:10px;background:var(--gray6);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;">Kapat</button>
    </div>
  `;
  closeModal('adDetailOv');
  openModal('shareOv');
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text)
    .then(() => showToast('Link kopyalandı! 📋', 'success'))
    .catch(() => showToast('Kopyalanamadı', 'error'));
}

// ========================= UTILS =========================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrice(price) {
  if (!price && price !== 0) return 'Fiyat Sorulur';
  if (price === 0) return 'Ücretsiz';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return Math.floor(diff/60) + ' dk önce';
  if (diff < 86400) return Math.floor(diff/3600) + ' sa önce';
  if (diff < 604800) return Math.floor(diff/86400) + ' gün önce';
  return d.toLocaleDateString('tr-TR');
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ========================= INIT =========================
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
  load().then(() => { updateHeaderUser(); updateBadges(); });

  // Supabase Auth state listener
  getSupabase().auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null; favorites = [];
      save(); updateHeaderUser(); updateBadges(); renderAds();
    }
  });
});
