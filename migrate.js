const fs = require('fs');

// --- 1. Modify index.html ---
let html = fs.readFileSync('index.html', 'utf8');

// Remove Cart button from header
html = html.replace(/<div class="hdr-act-btn" onclick="openCart\(\)">[\s\S]*?<\/div>/, '');

// Update Sidebar to add City filter
const cityFilterHTML = `
    <div class="sidebar-widget">
      <div class="sw-title">Şehir</div>
      <div class="sw-range" style="margin-bottom:0">
        <select id="fltCity" style="border:none;background:#f5f5f5;padding:8px;border-radius:6px;width:100%;font-size:13px;outline:none;cursor:pointer" onchange="activeCity=this.value; handleSearch()">
          <option value="all">Tüm Şehirler</option>
          <option value="İstanbul">İstanbul</option>
          <option value="Ankara">Ankara</option>
          <option value="İzmir">İzmir</option>
          <option value="Bursa">Bursa</option>
          <option value="Antalya">Antalya</option>
        </select>
      </div>
    </div>
`;
html = html.replace('<div class="sidebar-widget">\n      <div class="sw-title">Fiyat', cityFilterHTML + '\n    <div class="sidebar-widget">\n      <div class="sw-title">Fiyat');

// Remove Cart Panel
html = html.replace(/<div class="cart-ov" id="cartOv"[\s\S]*?<!-- CHAT BUBBLE & PANEL -->/, '<!-- CHAT BUBBLE & PANEL -->');
// If there's any other cart HTML, we can ignore it since it won't be triggered, but let's try to keep it clean.

// Rewrite Add Product Modal
const addModalHTML = `
<div class="ov" id="addOv" onclick="ovClick(event,'addOv')">
  <div class="ov-inner">
    <div class="add-modal" style="max-width: 500px; padding: 25px;">
      <div class="modal-ttl" id="addModalTtl" style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">
        Yeni İlan Ekle
      </div>
      
      <label for="imgInp" class="img-up" id="imgUpLbl" style="display:flex; flex-direction:column; align-items:center; padding: 30px; border: 2px dashed #ddd; border-radius: 8px; cursor: pointer; margin-bottom: 20px; background: #fafafa;">
        <svg viewBox="0 0 24 24" style="width:32px; height:32px; stroke:#888; fill:none; margin-bottom:10px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span id="imgUpTxt" style="color:#666; font-size: 13px;">Fotoğraf Ekle (Tıkla, max 5)</span>
        <img id="prvImg" style="display:none; max-width: 100%; margin-top: 10px; border-radius: 4px;">
      </label>
      <input type="file" id="imgInp" accept="image/*" style="display:none" onchange="handleImg(event)" multiple>
      
      <div class="fg" style="margin-bottom: 15px;">
        <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">İlan Başlığı</label>
        <input type="text" id="mBaslik" placeholder="Örn: Temiz kullanılmış iPhone 13" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
      </div>
      
      <div class="fg-row" style="display:flex; gap:15px; margin-bottom: 15px;">
        <div class="fg" style="flex:1;">
          <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">Fiyat (TL)</label>
          <input type="number" id="mFiyat" placeholder="0" min="0" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
        </div>
        <div class="fg" style="flex:1;">
          <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">Şehir</label>
          <select id="mSehir" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; outline:none;">
            <option value="">Seçiniz</option>
            <option value="İstanbul">İstanbul</option>
            <option value="Ankara">Ankara</option>
            <option value="İzmir">İzmir</option>
            <option value="Bursa">Bursa</option>
            <option value="Antalya">Antalya</option>
          </select>
        </div>
      </div>
      
      <div class="fg-row" style="display:flex; gap:15px; margin-bottom: 15px;">
        <div class="fg" style="flex:1;">
          <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">Kategori</label>
          <select id="mKat" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; outline:none;">
            <option value="">Seçiniz</option>
            <option>Kadın</option><option>Erkek</option><option>Anne & Çocuk</option>
            <option>Ev & Yaşam</option><option>Süpermarket</option><option>Kozmetik</option>
            <option>Ayakkabı & Çanta</option><option>Elektronik</option><option>Spor & Outdoor</option><option>Diğer</option>
          </select>
        </div>
        <div class="fg" style="flex:1;">
          <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">Marka (Opsiyonel)</label>
          <input type="text" id="mMarka" placeholder="Örn: Apple" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
        </div>
      </div>
      
      <div class="fg" style="margin-bottom: 15px;">
        <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">Açıklama</label>
        <textarea id="mAck" placeholder="Ürün detaylarını yazın..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; min-height:80px; resize:vertical;"></textarea>
      </div>
      
      <div class="fg" style="margin-bottom: 25px;">
        <label style="font-size:12px; font-weight:700; color:#444; display:block; margin-bottom:5px;">WhatsApp No (Opsiyonel)</label>
        <input type="text" id="mWa" placeholder="5xx xxx xx xx" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
      </div>
      
      <input type="hidden" id="editProductId">
      <div style="display:flex; gap:10px;">
        <button class="btn-pub" id="btnPub" onclick="saveProduct()" style="flex:1; background:var(--primary); color:#fff; border:none; border-radius:6px; padding:12px; font-weight:700; cursor:pointer;">İlanı Yayınla</button>
        <button class="btn-cancel" onclick="closeModal('addOv')" style="flex:1; background:#eee; color:#333; border:none; border-radius:6px; padding:12px; font-weight:700; cursor:pointer;">Vazgeç</button>
      </div>
    </div>
  </div>
</div>
`;
html = html.replace(/<div class="ov" id="addOv" onclick="ovClick\(event,'addOv'\)">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, addModalHTML);

fs.writeFileSync('index.html', html, 'utf8');

// --- 2. Modify app.js ---
let app = fs.readFileSync('assets/js/app.js', 'utf8');

// Add activeCity state
app = app.replace(/let activeCat   = 'all';/, "let activeCat   = 'all';\nlet activeCity  = 'all';");

// Update Demo Products to include city
app = app.replace(
  /\{id:Date\.now\(\)-1e9,brand:'Nike',title:'Air Max 270 Koşu Ayakkabısı',price:2199,category:'Ayakkabı'/g,
  "{id:Date.now()-1e9,brand:'Nike',title:'Air Max 270 Koşu Ayakkabısı',price:2199,category:'Ayakkabı',city:'İstanbul'"
);
app = app.replace(
  /\{id:Date\.now\(\)-9e8,brand:'Apple',title:'iPhone 15 Pro 256GB Titanyum',price:54999,category:'Elektronik'/g,
  "{id:Date.now()-9e8,brand:'Apple',title:'iPhone 15 Pro 256GB Titanyum',price:54999,category:'Elektronik',city:'Ankara',wa:'5551234567'"
);
app = app.replace(/category:'Giyim'/g, "category:'Kadın',city:'İzmir'"); // fix some cats and add cities
app = app.replace(/category:'Ev & Yaşam'/g, "category:'Ev & Yaşam',city:'Bursa'");
app = app.replace(/category:'Spor'/g, "category:'Spor & Outdoor',city:'Antalya'");

// Add city to card renderGrid
app = app.replace(
  /<span class="card-brand-new">\$\{p\.brand\}<\/span>/g,
  '<span class="card-brand-new">${p.brand}</span> <span style="color:#888;font-size:11px;float:right;">📍 ${p.city||"İstanbul"}</span>'
);

// getFiltered logic update to include city
app = app.replace(
  /if\(activeCat!=='all'\) fp=fp\.filter\(x=>x\.category===activeCat\);/g,
  "if(activeCat!=='all') fp=fp.filter(x=>x.category===activeCat);\n  if(activeCity!=='all') fp=fp.filter(x=>x.city===activeCity);"
);

// showDetail logic to replace cart with WhatsApp / Chat
const oldDetailActions = /<div class="d-action-row">[\s\S]*?<\/button>\s*<\/div>\s*<div style="margin-top:20px;padding:15px;background:#f8fafc;border-radius:6px;font-size:13px;color:#0f172a;display:flex;align-items:center;gap:10px;">[\s\S]*?<\/div>/;

const newDetailActions = `
        <div class="d-action-row" style="flex-direction:column; gap:10px;">
          \${p.wa ? \`<a href="https://wa.me/\${p.wa}" target="_blank" style="background:#25D366; color:#fff; text-align:center; padding:16px; border-radius:6px; font-weight:700; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
            <svg style="width:24px;height:24px;fill:currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            WhatsApp ile İletişim
          </a>\` : ''}
          <div style="display:flex; gap:10px;">
            <button class="btn-add-cart" onclick="openChat(\${p.id})" style="background:#333; flex:1;">Mesaj Gönder</button>
            <button class="btn-fav-large\${isFav?' active':''}" onclick="toggleFav(event, \${p.id})">
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </button>
          </div>
        </div>
`;
app = app.replace(oldDetailActions, newDetailActions);

// Update saveProduct logic to match new fields
const newSaveProduct = `function saveProduct(){
  if(!currentUser){showToast('Önce giriş yapmalısın!','error');return;}
  const marka=document.getElementById('mMarka').value.trim();
  const fiyat=document.getElementById('mFiyat').value;
  const kat=document.getElementById('mKat').value;
  const sehir=document.getElementById('mSehir').value;
  const baslik=document.getElementById('mBaslik').value.trim();
  const ack=document.getElementById('mAck').value.trim();
  const wa=document.getElementById('mWa').value.trim();
  const editId=document.getElementById('editProductId').value;
  
  if(!baslik) return showToast('İlan başlığı gerekli!','error');
  if(!fiyat||isNaN(fiyat)||fiyat<=0) return showToast('Geçerli bir fiyat girin!','error');
  if(!sehir) return showToast('Şehir seçmelisiniz!','error');
  if(!kat) return showToast('Kategori seçmelisiniz!','error');
  
  if(editId){
    const idx=products.findIndex(p=>p.id===+editId);
    if(idx>-1){
      products[idx]={...products[idx],brand:marka,price:+fiyat,category:kat,city:sehir,title:baslik,desc:ack,wa:wa};
      if(tempImgs.length) products[idx].imgs=tempImgs;
    }
  }else{
    const p={
      id:Date.now(),
      seller:currentUser.email,
      brand:marka, price:+fiyat, category:kat, city:sehir, title:baslik, desc:ack, wa:wa,
      imgs:tempImgs.length?tempImgs:null,
      stock:1
    };
    products.unshift(p);
  }
  save();
  renderGrid();
  closeModal('addOv');
  showToast(editId?'İlan güncellendi!':'İlan başarıyla eklendi!','success');
}`;
app = app.replace(/function saveProduct\(\)\{[\s\S]*?showToast\(editId\?'Ürün güncellendi!':'Ürün eklendi!','success'\);\n\}/, newSaveProduct);

// Also we should hide/remove generateDesc() since the button is gone, but it's safe to just leave it dead code, or we can replace it.
app = app.replace(/function generateDesc\(\)\{[\s\S]*?catch\(err\)\{showToast\('AI bağlantı hatası. Manuel giriş yapabilirsin.','error'\);\}[\s\S]*?\n\}/, 'function generateDesc(){}');

fs.writeFileSync('assets/js/app.js', app, 'utf8');

console.log("Migration done");
