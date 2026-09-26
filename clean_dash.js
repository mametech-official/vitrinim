const fs = require('fs');
let app = fs.readFileSync('assets/js/app.js', 'utf8');

app = app.replace(/K y Satıcı & Alışveriş Paneli/g, '👑 İlan Yönetim Paneli');
app = app.replace(/Hoş geldin, \${currentUser\.name\.split\(' '\)\[0\]\}! K 9/g, '👋 Hoş geldin, ${currentUser.name.split(" ")[0]}!');
app = app.replace(/const tabs=\['products','orders','following','alerts'\];/g, "const tabs=['products','following','alerts'];");
app = app.replace(/const tabLabels=\['rnlerim','Siparişlerim','Takip','Fiyat Alarmları'\];/g, "const tabLabels=['İlanlarım','Takip','İlan Alarmları'];");

app = app.replace(/<div class="sc-l">rn<\/div>/g, '<div class="sc-l">İlan</div>');
app = app.replace(/<div class="sc-l">Sipariş<\/div>/g, '<div class="sc-l">Mesaj</div>');

// Fix dashboard body missing "orders" tab logic.
app = app.replace(/if\(activeDashTab==='orders'\)\{[\s\S]*?\}else if\(activeDashTab==='following'\)/g, "if(activeDashTab==='following')");
app = app.replace(/if\(myOrders\.length\===0\)/g, "if(false)");

fs.writeFileSync('assets/js/app.js', app, 'utf8');
