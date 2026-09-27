const fs = require('fs');
let app = fs.readFileSync('assets/js/app.js', 'utf8');

const supabaseInit = `
const supabaseUrl = 'https://rxgywnzandkdpyiopnys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3l3bnphbmRrZHB5aW9wbnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDU1MTMsImV4cCI6MjEwNjAyMTUxM30.vfqAZjk0wZPh6LwHo6dLiKpHqVgte2RKH_6y2SSqbZk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
`;

app = app.replace("let displayedCount = 12;\nconst PAGE_SIZE = 12;", "let displayedCount = 12;\nconst PAGE_SIZE = 12;\n\n" + supabaseInit);

const newLoad = `
async function load() {
  try {
    const savedFavs = localStorage.getItem('vt_favs');
    const savedUser = localStorage.getItem('vt_user');
    const savedMsgs = localStorage.getItem('vt_msgs');

    favorites = savedFavs ? JSON.parse(savedFavs) : [];
    currentUser = savedUser ? JSON.parse(savedUser) : null;
    messages = savedMsgs ? JSON.parse(savedMsgs) : {};

    // Fetch ads from Supabase
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      ads = DEMO_ADS.map(a => ({ ...a })); // Fallback
    } else if (data && data.length > 0) {
      ads = data.map(mapDbAd);
    } else {
      // Seed DB with demo ads if empty
      for (const ad of DEMO_ADS) {
        await supabase.from('ads').insert({
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
      const { data: newData } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (newData) ads = newData.map(mapDbAd);
    }
    
    updateHeroStats();
    updateCategoryCounts();
    renderAds();
  } catch(e) {
    console.error(e);
  }
}
`;

app = app.replace(/function load\(\) \{[\s\S]*?favorites = \[\];\n    currentUser = null;\n    messages = \{\};\n  \}\n\}/, newLoad);

const newSaveAd = `
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
  if (!phone) return showToast('Telefon numarası gerekli!', 'error');

  const editId = document.getElementById('fEditId').value;

  document.querySelector('.btn-submit').textContent = 'Kaydediliyor...';
  document.querySelector('.btn-submit').disabled = true;

  try {
    if (editId) {
      await supabase.from('ads').update({
        title, price, city, district, category, subcategory, description: desc, phone, wa, condition, 
        imgs: tempPhotos.length ? tempPhotos : undefined
      }).eq('id', editId);
      showToast('İlan güncellendi!', 'success');
    } else {
      await supabase.from('ads').insert({
        title, price, city, district, category, subcategory, description: desc, phone, wa, condition,
        seller_email: currentUser.email,
        seller_name: currentUser.name,
        imgs: tempPhotos.length ? tempPhotos : [],
        views: 0,
        featured: false
      });
      showToast('İlanınız yayınlandı! 🎉', 'success');
    }

    // Refresh ads
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (data) ads = data.map(mapDbAd);
    
    tempPhotos = [];
    updateHeroStats();
    updateCategoryCounts();
    renderAds();
    if (document.getElementById('dashOv').classList.contains('open')) renderDash();
    closeModal('addAdOv');
  } catch(e) {
    showToast('Bir hata oluştu', 'error');
  } finally {
    document.querySelector('.btn-submit').textContent = 'İlanı Yayınla';
    document.querySelector('.btn-submit').disabled = false;
  }
}
`;

app = app.replace(/function saveAd\(\) \{[\s\S]*?closeModal\('addAdOv'\);\n\}/, newSaveAd);

const newDeleteAd = `
async function deleteAd(id) {
  if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
  
  await supabase.from('ads').delete().eq('id', id);
  
  const idx = ads.findIndex(a => a.id === id);
  if (idx > -1) ads.splice(idx, 1);
  
  renderAds();
  updateHeroStats();
  updateCategoryCounts();
  showToast('İlan silindi', 'info');
  openDash(); // refresh dash
}
`;

app = app.replace(/function deleteAd\(id\) \{[\s\S]*?openDash\(\); \/\/ refresh dash\n  \}\n\}/, newDeleteAd);

const newToggleFeatured = `
async function toggleFeatured(id) {
  const ad = ads.find(a => a.id === id);
  if (!ad) return;
  
  const newStatus = !ad.featured;
  await supabase.from('ads').update({ featured: newStatus }).eq('id', id);
  ad.featured = newStatus;
  
  renderDash();
  renderAds();
  showToast(newStatus ? 'İlan öne çıkarıldı!' : 'İlan normal duruma getirildi.', 'success');
}
`;

app = app.replace(/function toggleFeatured\(id\) \{[\s\S]*?showToast\(.*?\);\n\}/, newToggleFeatured);

const oldOpenAdDetail = "ad.views = (ad.views || 0) + 1;\n  save();";
const newOpenAdDetail = `ad.views = (ad.views || 0) + 1;
  supabase.from('ads').update({ views: ad.views }).eq('id', id).then();`;
app = app.replace(oldOpenAdDetail, newOpenAdDetail);

const oldInit = "load();\n  updateHeaderUser();";
const newInit = "load().then(() => { updateHeaderUser(); });";
app = app.replace(oldInit, newInit);

fs.writeFileSync('assets/js/app.js', app, 'utf8');
console.log("Success");
