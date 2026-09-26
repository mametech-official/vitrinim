const fs = require('fs');
let c = fs.readFileSync('assets/js/app.js','utf8');

const buildFiltersFunc = `function buildFilters(){
  const bar=document.getElementById('fltBar');
  bar.innerHTML =
    \`<button class="flt-pill\${activeFilter==='all'?' active':''}" onclick="setFilter('all')">Tüm Ürünler</button>\`+
    \`<button class="flt-pill\${activeFilter==='favs'?' active':''}" onclick="setFilter('favs')">Favorilerim ❤️<span class="cnt">\${favorites.length}</span></button>\`+
    \`<button class="flt-pill\${activeFilter==='following'?' active':''}" onclick="setFilter('following')">Takip Ettiğim</button>\`+
    \`<button class="flt-pill\${flashFilter?' active':''}" onclick="filterFlash()">⚡ Flash Sale</button>\`+
    '<div class="flt-sep"></div>'+
    '<select class="sort-sel" onchange="sortProducts(this.value)">'+
      '<option value="new">En Yeniler</option>'+
      '<option value="asc">Fiyat (Düşük > Yüksek)</option>'+
      '<option value="desc">Fiyat (Yüksek > Düşük)</option>'+
    '</select>'+
    '<div class="flt-sep"></div>'+
    '<input type="number" id="pMin" class="price-inp" placeholder="Min TL" value="'+priceMin+'">'+
    '<span style="color:var(--text3);font-size:12px;font-weight:700">-</span>'+
    '<input type="number" id="pMax" class="price-inp" placeholder="Max TL" value="'+priceMax+'">'+
    '<button class="price-go" onclick="applyPriceFilter()">Git</button>';
}`;

const start = c.indexOf('function buildFilters()');
const end = c.indexOf('\n}', start) + 2;
c = c.slice(0, start) + buildFiltersFunc + c.slice(end);

fs.writeFileSync('assets/js/app.js', c, 'utf8');
