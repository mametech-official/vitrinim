// ==========================================
// STORE — Veri Yönetimi (localStorage)
// İleride gerçek bir API'ye bağlanmak için
// sadece bu dosyayı güncellemeniz yeterli.
// ==========================================

let products      = JSON.parse(localStorage.getItem('vt_prods'))     || [];
let users         = JSON.parse(localStorage.getItem('vt_users'))     || [];
let currentUser   = JSON.parse(localStorage.getItem('vt_active'))    || null;
let favorites     = JSON.parse(localStorage.getItem('vt_favs'))      || [];
let cart          = JSON.parse(localStorage.getItem('vt_cart'))      || [];
let reviews       = JSON.parse(localStorage.getItem('vt_revs'))      || {};
let messages      = JSON.parse(localStorage.getItem('vt_msgs'))      || {};
let notifications = JSON.parse(localStorage.getItem('vt_notifs'))    || [];
let orders        = JSON.parse(localStorage.getItem('vt_orders'))    || [];
let following     = JSON.parse(localStorage.getItem('vt_following')) || [];
let priceAlerts   = JSON.parse(localStorage.getItem('vt_alerts'))    || [];
let searchHistory = JSON.parse(localStorage.getItem('vt_srchHist'))  || [];

function save() {
  localStorage.setItem('vt_prods',     JSON.stringify(products));
  localStorage.setItem('vt_users',     JSON.stringify(users));
  if (currentUser) localStorage.setItem('vt_active', JSON.stringify(currentUser));
  else localStorage.removeItem('vt_active');
  localStorage.setItem('vt_favs',      JSON.stringify(favorites));
  localStorage.setItem('vt_cart',      JSON.stringify(cart));
  localStorage.setItem('vt_revs',      JSON.stringify(reviews));
  localStorage.setItem('vt_msgs',      JSON.stringify(messages));
  localStorage.setItem('vt_notifs',    JSON.stringify(notifications));
  localStorage.setItem('vt_orders',    JSON.stringify(orders));
  localStorage.setItem('vt_following', JSON.stringify(following));
  localStorage.setItem('vt_alerts',    JSON.stringify(priceAlerts));
  localStorage.setItem('vt_srchHist',  JSON.stringify(searchHistory));
}
