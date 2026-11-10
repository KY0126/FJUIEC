/* 歐洲旅人護照 App 原型｜旅客端 v2
   路由：網址 # 後面的路徑（#/home、#/trip/3…），手機返回手勢可用
   資料：Supabase（匿名登入，只讀寫自己的資料）；試玩與示範帳號只存在這支手機，不寫入資料庫 */
const SB_URL = 'https://mmownoqzrhvgguxpukgl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tb3dub3F6cmh2Z2d1eHB1a2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMzA0NzEsImV4cCI6MjEwOTgwNjQ3MX0.yNToPLdGYZAQn9FfwmVk19Y1vOv6r5wC60bteGj_Yc4';
const sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SB_URL, SB_KEY) : null;

/* ===== 旅人檔案：A–E 五張卡（一題一頁，不放進一分鐘測驗） ===== */
const MONTHS = ['1 月','2 月','3 月','4 月','5 月','6 月','7 月','8 月','9 月','10 月','11 月','12 月'];
const CARDS = [
  {k:'card_a', t:'出發條件', pts:100, use:'推薦會依同行者、月份、天數與預算排序', qs:[
    {id:'companion', t:'和誰一起去？', o:['自己','另一半','朋友','家人']},
    {id:'months', t:'比較能出發的月份', multi:true, o:['1–3 月','4–6 月','7–8 月','9–11 月','12 月'], h:'可複選；推薦會優先排這些月份有出發的團'},
    {id:'days', t:'想玩幾天？', o:['8 天內','8–10 天','10–12 天','12 天以上']},
    {id:'budget', t:'每人預算', o:['8 萬以下','8–10 萬','10–13 萬','13–16 萬','16 萬以上']}]},
  {k:'card_b', t:'旅行耐受度', pts:100, use:'推薦會避開太熱、太累或有購物站的行程', qs:[
    {id:'hot', t:'怕熱嗎？', o:['很怕熱','還好','不怕熱'], d:['想避開 7–8 月與大太陽','夏天也可以，中午排室內就好','夏天出發完全沒問題'], h:'用來避開炎熱的月份與地區'},
    {id:'walk', t:'一天可以走多少路？', o:['輕鬆就好','逛街散步可以','走多也沒問題'], d:['一天 1 萬步內','一天 1–2 萬步','健行、爬坡都可以'], h:'用來避開太累的行程'},
    {id:'maxDrive', t:'一次坐車最多幾小時？', o:['3 小時內','4 小時內','不在意'], h:'用來避開長時間拉車'},
    {id:'shop', t:'行程裡的購物站', o:['不要購物站','可以有一站','不在意'], h:'不要的話，只推無購物站的團'}]},
  {k:'card_c', t:'興趣', pts:100, use:'推薦原因與口袋名單會依你的興趣', qs:[
    {id:'interests', t:'旅行時最想做的事', multi:true, o:['咖啡與甜點','展覽與美術館','音樂會','極光','自由購物時間','在地美食','拍照打卡'], h:'可複選'},
    {id:'explore', t:'吃東西的方式', o:['網紅名店','在地小店','名店先拍，再找在地小店']}]},
  {k:'card_d', t:'聯絡偏好', pts:50, use:'顧問會用你習慣的方式和時段聯絡，不用重問', qs:[
    {id:'contact', t:'怎麼聯絡你最方便？', o:['只要 LINE 文字','LINE 文字或電話','電話']},
    {id:'time', t:'方便的時段', multi:true, o:['平日白天','午休','平日晚上','週末'], h:'可複選'}]},
  {k:'card_e', t:'生日與禮遇', pts:50, use:'生日月會收到小禮；禮物會挑你喜歡的類型', qs:[
    {id:'birthMonth', t:'生日月份', o:MONTHS, h:'只記月份，不記日期'},
    {id:'gift', t:'喜歡哪種小禮？', o:['香氛小樣','甜點禮盒','咖啡券','旅行小物']},
    {id:'surprise', t:'驚喜偏好', o:['私下的小驚喜','大家一起慶祝也可以']}]}
];
const PERKS = [['啟程','完成旅人檔案','生日月小禮、角色卡'],['銀','第 2 次出團','同一位顧問接手；行前小禮包'],
  ['金','第 3–4 次出團','早鳥價或選位優先；異業周邊'],['晶鑽','第 5 次以上','依足跡推薦下一站；限量周邊']];
const EARN = [['完成檔案卡','每張 50–100 點'],['旅伴完成測驗','每位 100 點'],['出團回饋','回國後 200 點'],['報名成團','團費 [比例待定]']];
const POPULAR = ['奧捷慢遊 10 天','北歐極光 10 天'];

/* ===== 示範帳號：林雅婷（只在這支手機，不寫入資料庫） ===== */
const DEMO = {
  name:'林雅婷', ans:{q1:1,q2:2,q3:2,q4:2,q5:0,q6:4,q7:1,q8:2,q9:3,q10:3,q11:2,q12:[0,1,4]},
  prof:{card_a:{companion:2,months:[0],days:1,budget:3}, card_b:{hot:0,walk:1,maxDrive:0,shop:0}},
  favs:['巴黎精品與甜點 10 天｜巴黎連泊、精品自由逛、購物後司機送回飯店'],
  buddy:{nickname:'怡君', role_key:'rabbit', answers:{q1:2,q2:1,q3:0,q4:2,q5:2,q6:1,q7:2,q8:2,q9:2,q10:2,q11:1,q12:[1]},
         card_a:{months:[0,1],budget:2}, card_b:{shop:0}, demo:true}
};
const daysAgo = n => new Date(Date.now() - n*864e5).toISOString();
function demoNotes(){ return [
  {id:'d1', kind:'advisor', title:'顧問回覆', body:'巴黎精品與甜點 3/18 出發還有 6 個名額，連泊飯店都有冷氣。', link:'#/trip/'+tripId('巴黎精品與甜點'), at:daysAgo(.08)},
  {id:'d2', kind:'buddy', title:'旅伴完成測驗', body:'怡君是白兔型，看看你們都適合的 3 團。', link:'#/buddy', at:daysAgo(1)},
  {id:'d3', kind:'perk', title:'收藏的團降價', body:'荷比法 10 天 4 月團每人折 3,000 元，限前 10 名。', link:'#/trip/'+tripId('荷比法'), at:daysAgo(3)},
  {id:'d4', kind:'perk', title:'生日月禮', body:'這個月是你的生日月，憑交接代碼領香氛小樣一份。', link:'#/pass', at:daysAgo(9), read:true},
  {id:'d5', kind:'perk', title:'早鳥開賣', body:'2027 北歐極光團開放預約，金等級以上優先選位。', link:'#/trip/'+tripId('北歐極光'), at:daysAgo(13), read:true}]; }
function demoLedger(){ return [
  {reason:'card_a', label:'完成「出發條件」', points:100, status:'posted', at:daysAgo(1)},
  {reason:'card_b', label:'完成「旅行耐受度」', points:100, status:'posted', at:daysAgo(1)},
  {reason:'trip:demo', label:'報名巴黎精品與甜點（試算）', points:300, status:'pending', at:daysAgo(0)}]; }

/* ===== 狀態 ===== */
const LS = 'ys_app_v2';
const S = Object.assign({consent:null, demo:false, ans:{}, pace:null, view:null, prof:{}, favs:[], cmp:[], quizDone:false,
  notes:[], ledger:[], buddies:[], nickname:'', lineSync:true, me:null, inv:null, flt:null, region:null,
  inq:[], avatar:null, region_tw:null, prefs:{}, fltDefault:null, photo:null, photoOn:false},
  (()=>{try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return {}}})());
S.me = null; state.ans = S.ans || {}; if (S.pace) { state.pace = S.pace; state.view = S.view || S.pace; }
const invParam = new URLSearchParams(location.search).get('inv'); if (invParam) { S.inv = invParam.toUpperCase().slice(0,6); }
function save(){ S.ans = state.ans; S.pace = state.pace; S.view = state.view;
  const keep = {...S}; delete keep.me;
  try{localStorage.setItem(LS, JSON.stringify(keep))}catch(e){} }
const online = () => !!sb && S.consent === 'yes' && !S.demo;
const $h = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true, 2600); }
const tripId = q => TRIPS.findIndex(t => t.name.startsWith(q));
const short = t => t.name.split('｜')[0];
const regionOf = t => REGIONS.find(x => x.id === t.region);
const fmtDate = iso => { const d = new Date(iso), diff = (Date.now()-d)/36e5; return diff < 1 ? '剛剛' : diff < 24 ? `${Math.floor(diff)} 小時前` : diff < 48 ? '昨天' : `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; };

/* ===== 圖示 ===== */
const I = {
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  explore:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  buddy:'<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20c.8-3.4 3.2-5.2 6-5.2s5.2 1.8 6 5.2"/><path d="M15 15c2.6-.4 4.9 1 5.8 4"/>',
  pass:'<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
  me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bell:'<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>',
  back:'<path d="M15 5l-7 7 7 7"/>', close:'<path d="M6 6l12 12M18 6L6 18"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  cmp:'<rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/>',
  map:'<path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>', chev:'<path d="M9 5l7 7-7 7"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  share:'<path d="M12 4v11"/><path d="M8 8l4-4 4 4"/><path d="M5 13v6h14v-6"/>', gift:'<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  star:'<path d="M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z"/>'
};
const ic = (k, cls='') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

/* ===== 路由 ===== */
const route = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   // 捲動位置由 App 自己還原
let curIdx = 0, dir = 'fwd';
const scrollMem = {};                       // 每一筆歷史紀錄離開時捲到哪裡，返回時還原
function nav(p, replace, extra={}){ const h = '#/' + p;
  if (replace) history.replaceState({i:curIdx, ...extra}, '', h);
  else { scrollMem[curIdx] = scrollY; history.pushState({i:++curIdx, ...extra}, '', h); }
  render(); }
window.addEventListener('popstate', e => { const i = e.state && typeof e.state.i === 'number' ? e.state.i : null;
  if (i === null) { scrollMem[curIdx] = scrollY; history.replaceState({i:++curIdx}, '', location.hash); } else { if (i < curIdx) dir = 'back'; curIdx = i; }
  render(); });
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (!a || e.defaultPrevented) return;
  e.preventDefault(); const p = a.getAttribute('href').slice(2); if ('#/' + p !== location.hash) nav(p); });
/* 上一頁：App 內有上一頁就回去；從 QR、連結或通知直接打開的，回到這頁的上層，不會跳出 App */
function parentOf(p){ const r = p.split('/');
  if (r[0] === 'trip' || r[0] === 'compare') return 'explore';
  if (r[0] === 'me' && r[1] === 'legal') return 'me/settings';
  if (['explore','pass','me','inbox'].includes(r[0]) && r[1]) return r[0];
  if (!r[0] || r[0] === 'home') return null;
  return 'home'; }
function back(fallback){ dir = 'back'; if (curIdx > 0) history.back(); else nav(fallback || parentOf(route().join('/')) || 'home', true); }
const GATED = new Set(['buddy','pass','compare','advisor']);
const TABS = [['home','首頁'],['explore','探索'],['buddy','旅伴'],['pass','護照'],['me','會員']];
const TAB_ROOTS = new Set(['home','explore','buddy','pass','me']);
const NO_TOP = new Set(['quiz','welcome','result']);

function render(){
  const r = route(), app = document.getElementById('app');
  if (GATED.has(r[0]) && !S.quizDone) { S.after = r.join('/'); save(); return nav('welcome', true); }
  const views = {home:()=>S.quizDone?homeView():homeNewView(), welcome:welcomeView, quiz:quizView, result:resultView,
    explore:()=>r[1]==='map'?mapView():exploreView(), trip:tripView, compare:compareView, buddy:buddyView, pass:()=>r[1]==='points'?pointsView():passView(),
    me:()=>({card:()=>cardQView(r[2], +r[3]||0), edit:editView, settings:settingsView, favs:favsView, inquiries:inquiriesView, legal:()=>legalView(r[2])}[r[1]] || meView)(), inbox:inboxView, advisor:advisorView};
  onScroll = null; clearInterval(flipTimer);
  const v = (views[r[0]] || views.home)(), goingBack = dir === 'back';
  v.classList.add('screen', goingBack ? 'in-back' : 'in-fwd'); dir = 'fwd';
  v.querySelectorAll('[data-back]').forEach(b => { if (!b.onclick) b.onclick = () => back(); });
  v.querySelectorAll('[data-top]').forEach(b => { if (!b.onclick) b.onclick = toTop; });
  app.replaceChildren(v);
  const tabbed = TAB_ROOTS.has(r[0]) && !((r[0]==='pass' || r[0]==='me') && r[1]);
  drawTabs(tabbed ? r[0] : null);
  document.body.classList.toggle('has-tabs', tabbed);
  document.body.classList.toggle('has-cmp', !!v.querySelector('.cmp-bar'));
  document.body.classList.toggle('has-buy', !!v.querySelector('.buy-bar'));
  fabs.line.hidden = !tabbed; fabs.page = r.join('/'); fabs.noTop = NO_TOP.has(r[0]) || (r[0]==='me' && r[1]==='card');
  if (tabbed) showFabTip();
  const y = goingBack ? (scrollMem[curIdx] || 0) : 0;
  scrollTo(0, y); requestAnimationFrame(() => { scrollTo(0, y); scrolled(); });
}
function drawTabs(cur){
  const n = document.getElementById('tabs'); n.hidden = !cur; if (!cur) return;
  n.innerHTML = TABS.map(([k,t]) => `<button class="tb" data-t="${k}" aria-label="${t}" ${cur===k?'aria-current="page"':''}>${ic(k)}<span>${t}</span>${k==='buddy'&&S.quizDone&&S.buddies.some(b=>!b.seen)?'<i class="dot"></i>':''}</button>`).join('');
  n.querySelectorAll('button').forEach(b => b.onclick = () => {
    if (b.dataset.t !== cur) return nav(b.dataset.t, false, {tab:true});
    // 再點一次目前的分頁：不在頂部就捲回頂部；已在頂部就回到這個分頁的第一層（例：地圖 → 推薦清單）
    if (scrollY > 40) return toTop();
    if (route()[1]) nav(cur, true, {tab:true});
  });
}
/* 頂部列：固定不捲走。back：true 一定有、'auto' 從別頁點進來才有；home：右上回首頁 */
function head(title, o={}){
  const st = history.state || {};
  const showBack = o.back === true || (o.back === 'auto' && curIdx > 0 && !st.tab);
  const left = showBack ? `<button class="icon-btn" data-back aria-label="${o.x?'離開':'返回上一頁'}">${ic(o.x?'close':'back')}</button>` : (o.big ? '' : '<span class="icon-btn ghost"></span>');
  const right = (o.right || '') + (o.home ? `<a class="icon-btn" href="#/home" aria-label="回首頁">${ic('home')}</a>` : '');
  return `<header class="bar sticky ${o.big?'big':''}">${left}<h1 class="bar-t" data-top>${title}</h1><div class="bar-r">${right || (o.big ? '' : '<span class="icon-btn ghost"></span>')}</div></header>`;
}
const topbar = (title, opts={}) => head(title, { back:true, ...opts });
function bindBack(el, fb){
  el.querySelectorAll('[data-back]').forEach(b => b.onclick = () => back(fb));
  el.querySelectorAll('[data-top]').forEach(b => b.onclick = toTop);
}

/* ===== 懸浮按鈕：回到頂部、LINE 問顧問 ===== */
let onScroll = null, flipTimer = null;
const fabs = (() => {
  const box = $h(`<div class="fabs"><span class="fab-tip" hidden>有問題問顧問</span>
    <button class="fab top" aria-label="回到頂部" hidden><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6"/></svg></button>
    <button class="fab line" aria-label="用 LINE 問顧問" hidden><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 7C11.7 7 5 12.4 5 19c0 5.9 5.3 10.9 12.5 11.8.5.1 1.2.3 1.3.8.1.4.1 1.1 0 1.5l-.2 1.3c-.1.4-.3 1.5 1.3.8s8.7-5.1 11.8-8.8C33.9 24 35 21.6 35 19 35 12.4 28.3 7 20 7z" fill="#fff"/><text x="20" y="22.6" text-anchor="middle" font-size="7.6" font-weight="800" fill="#06C755" font-family="Arial,sans-serif">LINE</text></svg></button></div>`);
  document.body.append(box);
  const o = { box, top:box.querySelector('.top'), line:box.querySelector('.line'), tip:box.querySelector('.fab-tip'), page:'', noTop:false };
  o.top.onclick = toTop; o.line.onclick = lineSheet;
  return o;
})();
function toTop(){ scrollTo({ top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
let lastY = 0;
function scrolled(){
  fabs.top.hidden = fabs.noTop || scrollY < innerHeight * 1.5;
  // 往下滑時 LINE 按鈕先讓開，往上滑或停在頂部再出現，避免擋住清單右側的「比較」與愛心
  const dy = scrollY - lastY; if (Math.abs(dy) > 6) { fabs.line.classList.toggle('away', dy > 0 && scrollY > 120); lastY = scrollY; }
  if (scrollY < 120) fabs.line.classList.remove('away');
  document.body.classList.toggle('scrolled', scrollY > 8);
  if (onScroll) onScroll(scrollY);
}
addEventListener('scroll', scrolled, { passive:true });
function showFabTip(){ if (S.fabTip) return; S.fabTip = true; save(); fabs.tip.hidden = false; setTimeout(() => fabs.tip.hidden = true, 3000); }
function lineSheet(){
  track('line_fab', { page:fabs.page });
  const fav = S.favs[0] ? short(TRIPS.find(t => t.name === S.favs[0]) || {name:S.favs[0]}) : '';
  const canCode = S.quizDone;
  openSheet(`<h3>用 LINE 問顧問</h3>
    ${canCode?`<button class="sheet-opt op" id="withData"><b>帶著我的資料問顧問</b><span>自動附上交接代碼${fav?`和收藏的「${esc(fav)}」`:''}，顧問不用重問</span></button>`:''}
    <button class="sheet-opt op" id="justAsk"><b>只是想先問問</b><span>直接打開永信 LINE 官方帳號</span></button>
    <p class="muted small center">晚上送出，隔天早上 10 點前回覆${S.demo?'・示範帳號不會真的傳出':''}</p>
    <button class="btn2 b2" data-close>取消</button>`, (sh, close) => {
    const w = sh.querySelector('#withData');
    if (w) w.onclick = async () => {
      if (S.demo) { close(); return toast('示範帳號不會真的傳出；正式版會開啟 LINE 並附上交接代碼'); }
      if (S.consent !== 'yes') { close(); return nav('advisor'); }
      const me = await ensureCustomer(); close(); if (!me) return toast('目前連不上資料庫，先直接開 LINE');
      openLine(lineMsg(`我的交接代碼是 ${me.code}${fav?`，想了解「${fav}」`:''}`));
    };
    sh.querySelector('#justAsk').onclick = () => { close(); if (S.demo) return toast('示範帳號不會真的傳出；正式版會開啟永信 LINE 官方帳號'); openLine(lineMsg('你好，我想詢問歐洲行程')); };
  });
}

/* ===== Supabase ===== */
async function ensureAuth(){
  if (!sb) return null;
  let { data:{ session } } = await sb.auth.getSession();
  if (!session) { const r = await sb.auth.signInAnonymously(); if (r.error) { toast('連線失敗，先以本機模式繼續'); return null; } session = r.data.session; }
  return session.user;
}
async function ensureCustomer(){
  if (!online()) return null;
  if (S.me && S.me.id) return S.me;
  const u = await ensureAuth(); if (!u) return null;
  let { data } = await sb.from('customers').select('*').eq('user_id', u.id).maybeSingle();
  if (!data) {
    const ins = await sb.from('customers').insert({ user_id:u.id, consent_at:new Date().toISOString(), nickname:S.nickname||null,
      source: new URLSearchParams(location.search).get('src') || (S.inv ? '旅伴邀請' : '現場 QR') }).select().single();
    if (ins.error) { toast('建立資料失敗：' + ins.error.message); return null; }
    data = ins.data;
  }
  S.me = data; return data;
}
async function loadRemote(){
  if (!online()) return;
  const me = await ensureCustomer(); if (!me) return;
  const [p, f, n, l] = await Promise.all([
    sb.from('profiles').select('*').eq('customer_id', me.id).maybeSingle(),
    sb.from('favorites').select('trip_name').eq('customer_id', me.id),
    sb.from('notifications').select('*').eq('customer_id', me.id).order('created_at', {ascending:false}).limit(50),
    sb.from('point_ledger').select('*').eq('customer_id', me.id).order('created_at', {ascending:false})]);
  if (p.data) CARDS.forEach(c => { if (p.data[c.k]) S.prof[c.k] = p.data[c.k]; });
  if (f.data) S.favs = f.data.map(x => x.trip_name);
  if (n.data) { const local = S.notes.filter(x => !x.db); S.notes = [...n.data.map(dbNote), ...local]; }
  if (l.data && l.data.length) { const reasons = new Set(l.data.map(x=>x.reason)); S.ledger = [...l.data.map(x=>({reason:x.reason,label:x.label,points:x.points,status:x.status,at:x.created_at})), ...S.ledger.filter(x=>!reasons.has(x.reason))]; }
  if (me.role_key && !state.pace) { state.pace = me.role_key; state.view = me.role_key; state.ans = me.answers || {}; S.quizDone = true; }
  if (me.nickname) S.nickname = me.nickname;
  if (me.avatar_key) S.avatar = me.avatar_key; if (me.region) S.region_tw = me.region;
  if (me.prefs && Object.keys(me.prefs).length) { const { line, filters, ...rest } = me.prefs; S.prefs = rest; if (line !== undefined) S.lineSync = line; if (filters) S.fltDefault = filters; }
  const iq = await sb.from('inquiries').select('trip_name,status,created_at').eq('customer_id', me.id).order('created_at', {ascending:false});
  if (iq.data) S.inq = iq.data.map(x => ({ trip:x.trip_name, status:x.status, at:x.created_at }));
  await loadBuddies();
  save();
  sb.channel('notif-' + me.id).on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`customer_id=eq.${me.id}` },
    async payload => { S.notes.unshift(dbNote(payload.new)); if (payload.new.kind === 'buddy') await loadBuddies(); save(); toast(payload.new.title); render(); }).subscribe();
}
const dbNote = x => ({ id:'db'+x.id, dbid:x.id, db:true, kind:x.kind, title:x.title, body:x.body, link:x.link, at:x.created_at, read:!!x.read_at });
async function loadBuddies(){
  if (!online()) return; const r = await sb.rpc('my_buddies'); if (r.error || !r.data) return;
  const seen = new Set(S.buddies.filter(b=>b.seen).map(b=>b.buddy_id));
  S.buddies = r.data.filter(b => b.role_key).map(b => ({...b, seen:seen.has(b.buddy_id)}));
}
async function track(type, payload={}){ if (!online()) return; const me = await ensureCustomer(); if (!me) return;
  sb.from('events').insert({ customer_id:me.id, type, payload }).then(()=>{}); }
async function pushProfile(){
  if (!online()) return; const me = await ensureCustomer(); if (!me) return;
  const row = { customer_id:me.id, completion:completion(), points:points(), updated_at:new Date().toISOString() };
  CARDS.forEach(c => { if (S.prof[c.k]) row[c.k] = S.prof[c.k]; });
  const r = await sb.from('profiles').upsert(row); if (r.error) toast('檔案儲存失敗：' + r.error.message);
}
async function pushQuiz(){
  if (!online() || !state.pace) return; const me = await ensureCustomer(); if (!me) return;
  const sh = scores(), sc = Object.fromEntries(Object.entries(sh).map(([k,v])=>[k, Math.round(v*100)/100]));
  const r = await sb.from('customers').update({ role_key:state.pace, role_scores:sc, answers:state.ans, updated_at:new Date().toISOString() }).eq('id', me.id).select().single();
  if (r.data) S.me = r.data;
  if (S.inv && S.inv !== (S.me && S.me.code)) {
    const j = await sb.rpc('join_buddy', { p_code:S.inv });
    if (!j.error) { S.inv = null; S.ledger.unshift({reason:'buddy', label:'和旅伴一起測', points:100, status:'posted', at:new Date().toISOString()}); await loadBuddies(); toast('已和邀請你的旅伴配對，各得 100 點'); }
  }
  await pushProfile(); save();
}

/* ===== 檔案 → 推薦 ===== */
const doneCard = c => { const v = S.prof[c.k]; return !!v && c.qs.every(q => v[q.id] !== undefined && !(Array.isArray(v[q.id]) && !v[q.id].length)); };
const completion = () => Math.round(CARDS.filter(doneCard).length / CARDS.length * 100);
const points = () => S.ledger.filter(x => x.status === 'posted').reduce((s,x) => s + x.points, 0);
const pending = () => S.ledger.filter(x => x.status === 'pending').reduce((s,x) => s + x.points, 0);
const cardPtsLeft = () => CARDS.filter(c => !doneCard(c)).reduce((s,c) => s + c.pts, 0);
function monthsOf(t){ const out = new Set(); t.months.replace(/\s*月/g,'').split('、').forEach(seg => { const [a,b] = seg.split('–').map(Number);
  if (!b) { out.add(a); return; } let m = a; for (let i=0;i<12;i++){ out.add(m); if (m===b) break; m = m%12+1; } }); return out; }
const MONTH_SETS = [[1,2,3],[4,5,6],[7,8],[9,10,11],[12]];
function merged(ans, prof){
  const a = JSON.parse(JSON.stringify(ans || {})), q12 = new Set(a.q12 || []);
  const A = prof.card_a || {}, B = prof.card_b || {}, C = prof.card_c || {};
  if (B.hot === 0) q12.add(4); if (B.shop === 0) q12.add(1); if (B.maxDrive === 0) q12.add(2);
  a.q12 = [...q12]; if (A.budget !== undefined) a.q10 = A.budget;
  if (C.interests && C.interests.length) { const map = {0:4, 3:3, 5:0, 1:1}; const hit = C.interests.map(i=>map[i]).find(x=>x!==undefined); if (hit!==undefined) a.q6 = hit; }
  return a;
}
function scoreFor(role, ans, prof){
  const saved = state.ans; state.ans = merged(ans, prof); let r; try { r = scoreAll(role); } finally { state.ans = saved; }
  const A = prof.card_a || {}, B = prof.card_b || {}, C = prof.card_c || {};
  const want = new Set((A.months || []).flatMap(i => MONTH_SETS[i]));
  r.forEach(x => { const t = x.t;
    if (want.size) { if ([...monthsOf(t)].some(m => want.has(m))) { x.s += 1.5; x.why.push('能出發的月份有團'); } else x.s -= 1; }
    if (A.days != null) { const ok = [t.days<8, t.days>=8&&t.days<=10, t.days>=10&&t.days<=12, t.days>=12][A.days]; if (ok) x.s += .5; }
    if (B.walk === 0 && t.walk >= 3) x.s -= 1; if (B.maxDrive === 1 && t.maxDrive > 4) x.s -= 1;
    if ((C.interests||[]).includes(2) && /at-cz/.test(t.region)) { x.s += .5; x.why.push('有音樂會'); }
  });
  return r.sort((a,b) => b.s - a.s);
}
const mine = () => scoreFor(state.view, state.ans, S.prof);
const fitPct = (list, s) => { const xs = list.map(x=>x.s), lo = Math.min(...xs), hi = Math.max(...xs); return Math.round(60 + 38 * (hi===lo ? 1 : (s-lo)/(hi-lo))); };
const greet = () => { const h = new Date().getHours(); return h < 11 ? '早安' : h < 18 ? '午安' : '晚安'; };
const tierIdx = () => { const n = (S.me && S.me.trips_taken) || 0; return n >= 5 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0; };
const unread = () => S.notes.filter(n => !n.read).length;

/* ===== 共用元件 ===== */
function cover(t, cls=''){
  const g = regionOf(t), on = new Set(g.cc);
  const paths = GEO.filter(x => HOME[x.c]).map(x => `<path d="${x.d}" class="${on.has(x.c)?'hit':''}"/>`).join('');
  return `<div class="cover-art ${g.area} ${cls}"><svg viewBox="40 60 720 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${paths}</svg>
    <span class="cv-l">${AREA_NAME[g.area]}・${g.full.replace(/（.*）/,'')}</span></div>`;
}
function tripTile(x){ const t = x.t, i = TRIPS.indexOf(t);
  return `<a class="tile op" href="#/trip/${i}">${cover(t)}<div class="tile-b"><b>${short(t)}</b>
    <span>${(t.name.split('｜')[1]||'').split('、')[0]}・${t.from.toFixed(1)} 萬起</span>
    <span class="chips"><i class="${t.shop?'':'ok'}">${t.shop?'含購物站':'無購物站'}</i><i>${t.months}</i></span></div></a>`; }
function tripRow(x, opts={}){ const t = x.t, i = TRIPS.indexOf(t), fav = S.favs.includes(t.name), inCmp = S.cmp.includes(i), g = regionOf(t);
  return `<div class="row-card op" data-i="${i}">
    <a class="rc-main" href="#/trip/${i}"><b>${short(t)}</b>
      <span>${AREA_NAME[g.area]}・${t.stay?'連泊':(t.name.split('｜')[1]||'').split('、')[0]}・${t.from.toFixed(1)} 萬起${t.est?'（示意）':''}</span>
      <span class="muted">步行${WALK[t.walk]}・車程 ${t.maxDrive}h・${t.shop?'含購物站':'無購物站'}${opts.fit!=null?`・合拍 ${opts.fit}%`:''}</span></a>
    <div class="rc-acts"><button class="cmp-tg" data-cmp="${i}" aria-pressed="${inCmp}">${inCmp?'已選':'比較'}</button>
      <button class="hb heart" data-fav="${i}" aria-pressed="${fav}" aria-label="收藏">${ic('heart')}</button></div></div>`; }
function bindRows(el){
  el.querySelectorAll('[data-fav]').forEach(b => b.onclick = e => { e.preventDefault(); toggleFav(TRIPS[+b.dataset.fav].name, b); });
  el.querySelectorAll('[data-cmp]').forEach(b => b.onclick = e => { e.preventDefault(); toggleCmp(+b.dataset.cmp); render(); });
}
function toggleCmp(i){ if (S.cmp.includes(i)) S.cmp = S.cmp.filter(x => x !== i); else { if (S.cmp.length >= 3) { toast('最多比較 3 團'); return; } S.cmp = [...S.cmp, i]; } save(); }
async function toggleFav(name, btn){
  const on = !S.favs.includes(name); S.favs = on ? [...S.favs, name] : S.favs.filter(x => x !== name); save();
  if (btn) { btn.setAttribute('aria-pressed', on); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  toast(on ? '已收藏，降價或名額變動會通知你' : '已取消收藏');
  if (online()) { const me = await ensureCustomer(); if (!me) return;
    if (on) { await sb.from('favorites').insert({ customer_id:me.id, trip_name:name }); track('favorite', { trip:name }); }
    else await sb.from('favorites').delete().eq('customer_id', me.id).eq('trip_name', name); }
}
function addNote(kind, title, body, link){ S.notes.unshift({ id:'l'+Date.now(), kind, title, body, link, at:new Date().toISOString() }); save(); }
function addPoints(reason, label, pts){
  if (S.ledger.some(x => x.reason === reason)) return false;
  S.ledger.unshift({ reason, label, points:pts, status:'posted', at:new Date().toISOString() }); save();
  if (online()) ensureCustomer().then(me => me && sb.from('point_ledger').upsert({ customer_id:me.id, reason, label, points:pts }, { onConflict:'customer_id,reason', ignoreDuplicates:true }));
  return true;
}
function plusPop(n){ const p = $h(`<div class="plus-pop">+${n} 點</div>`); document.body.append(p); setTimeout(() => p.remove(), 1400); }
async function shareText(text, done){
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch(e) { return; }
  try { await navigator.clipboard.writeText(text); toast(done || '已複製，可以貼給旅伴'); } catch(e) { toast('請截圖分享'); }
}
const baseUrl = () => location.href.split('#')[0].split('?')[0];
function openSheet(html, bind){
  const bg = document.getElementById('sheetBg'), sh = document.getElementById('sheet');
  const close = () => { bg.hidden = true; sh.hidden = true; };
  sh.innerHTML = `<div class="grab"></div>${html}`; bg.hidden = false; sh.hidden = false; bg.onclick = close;
  sh.querySelectorAll('[data-close]').forEach(b => b.onclick = close); if (bind) bind(sh, close);
}

/* ===== 00 首頁（尚未測驗） ===== */
const resumeAt = () => { if (!S.consent || S.quizDone) return 0; const n = QUESTIONS.findIndex(q => state.ans[q.id] === undefined); return n > 0 ? n : 0; };
function homeNewView(){
  const pop = POPULAR.map(q => ({t:TRIPS[tripId(q)]}));
  const el = $h(`<section class="pad">
    <div class="hello"><p>歡迎來到</p><h1>歐洲旅人護照</h1></div>
    <a class="quiz-box b3" href="#/${resumeAt()?'quiz/'+resumeAt():'welcome'}">
      <div class="qb-h"><span class="qmark">?</span><div><b>你是哪一種歐洲旅人？</b><span>12 題・約 1 分鐘・不用登入</span></div></div>
      <span class="btn-fake">${resumeAt()?`繼續測驗（第 ${resumeAt()+1} 題）`:'開始測驗，看我的 3 團推薦'}</span>
      <small>完成後這裡會換成你的角色卡、點數與推薦</small></a>
    <div class="sec-h"><h2>大家最常看的行程</h2><a href="#/explore">全部</a></div>
    <div class="tiles">${pop.map(tripTile).join('')}</div>
    <div class="locked">${ic('star')}<span>比較行程、旅伴共同推薦、護照點數　<b>測驗後開啟</b></span></div>
    <a class="link-row op" href="#/explore/map">${ic('map')}<span>先逛逛歐洲探索地圖</span>${ic('chev','end')}</a>
  </section>`);
  return el;
}

/* ===== 01 啟動與同意 ===== */
function welcomeView(){
  const el = $h(`<section class="welcome">
    <button class="skip" data-back>略過</button>
    <div class="w-art">${(()=>{ const paths = GEO.filter(x=>HOME[x.c]).map(x=>`<path d="${x.d}" class="${HOME[x.c]}"/>`).join(''); return `<svg viewBox="40 60 720 680" aria-hidden="true">${paths}</svg>`; })()}</div>
    <h1>一分鐘找到<br>自己的歐洲</h1>
    <p>12 題情境測驗，找出你的旅人角色，拿到 3 團剛好適合你的行程。</p>
    ${S.inv?'<p class="inv-note">你的旅伴邀請你一起測；做完會看到你們都適合的團。</p>':''}
    <button class="btn1 b1" id="yes">同意並開始測驗</button>
    <button class="btn2 b2" id="member">我已經是永信旅客</button>
    <p class="fine">會記錄測驗與旅人檔案，用來推薦行程；不需姓名電話，可隨時刪除。<button class="txt" id="more">了解更多</button>　<button class="txt" id="no">不儲存，先試玩</button></p>
  </section>`);
  bindBack(el, 'home');
  const start = consent => { S.consent = consent; S.demo = false; state.ans = {}; save(); dir = 'fwd'; nav('quiz/0', true); if (consent === 'yes') ensureCustomer().then(() => track('quiz_start')); };
  el.querySelector('#yes').onclick = () => start('yes');
  el.querySelector('#no').onclick = () => start('no');
  el.querySelector('#more').onclick = () => openSheet(`<h3>我們會記錄什麼</h3><ul class="plain">
    <li>測驗答案與旅人檔案：用來推薦行程，讓顧問接手時不用重問。</li><li>不需要姓名、電話；用 6 碼交接代碼辨識你。</li>
    <li>隨時可以在「會員 → 設定」刪除全部資料。</li><li>課程原型（輔大創新創業社），行程與價格為示意。</li></ul><button class="btn2 b2" data-close>知道了</button>`);
  el.querySelector('#member').onclick = () => openSheet(`<h3>我已經是永信旅客</h3>
    <p>正式版會用 LINE 登入，自動帶入你的出團紀錄與護照等級。</p>
    <p class="muted">原型先用示範帳號體驗：主要客群「林雅婷」，已做完測驗、填了 2 張旅人檔案，也有一位旅伴。示範帳號只存在這支手機，不會寫入資料庫。</p>
    <button class="btn1 b1" id="demo">用示範帳號（林雅婷）進入</button><button class="btn2 b2" data-close>取消</button>`,
    (sh, close) => sh.querySelector('#demo').onclick = () => { close(); enterDemo(); });
  return el;
}
function enterDemo(){
  Object.assign(S, { consent:'demo', demo:true, prof:JSON.parse(JSON.stringify(DEMO.prof)), favs:[...DEMO.favs], cmp:[], quizDone:true,
    notes:demoNotes(), ledger:demoLedger(), buddies:[{...DEMO.buddy, buddy_id:'demo', seen:false}], nickname:DEMO.name, flt:null, region:null,
    avatar:'cat', photo:'img/lin.jpg', photoOn:true, region_tw:'北部', prefs:{}, fltDefault:null, inq:[{trip:TRIPS[tripId('巴黎精品與甜點')].name, status:'replied', at:daysAgo(.3)}] });
  state.ans = JSON.parse(JSON.stringify(DEMO.ans)); state.pace = topPace(scores()); state.view = state.pace; save();
  toast(`已進入示範帳號：${DEMO.name}`); nav('home', true);
}

/* ===== 02 測驗（沿用原型 12 題） ===== */
function quizView(){
  const i = Math.min(+route()[1] || 0, QUESTIONS.length-1), q = QUESTIONS[i], multi = !!q.multi, cur = state.ans[q.id];
  const el = $h(`<section class="quiz">
    <header class="bar sticky"><button class="icon-btn" id="qx" aria-label="離開測驗">${ic('close')}</button>
      <div class="qprog"><span>${i+1} / ${QUESTIONS.length}</span><div class="prog"><i style="width:${(i+1)/QUESTIONS.length*100}%"></i></div></div><span class="icon-btn ghost"></span></header>
    <div class="vig">${QIMG[i]}</div>
    <h2 class="qtitle">${q.t}</h2>${q.sub?`<p class="qsub">${q.sub}</p>`:''}
    <div class="opts">${q.o.map((o,k)=>{const on = multi ? (cur||[]).includes(k) : cur===k;
      return `<button class="opt op" data-k="${k}" aria-pressed="${on}"><span class="k">${String.fromCharCode(65+k)}</span><span>${o[0]}</span></button>`}).join('')}</div>
    ${multi?'<button class="btn1 b1" id="done">完成，看我的旅人角色</button><p class="hint">可複選，也可以都不選</p>':'<p class="hint">點一下答案，自動進到下一題</p>'}
    ${i?'<button class="txt prev-q" id="prevq">‹ 上一題</button>':''}
  </section>`);
  el.querySelector('#qx').onclick = () => openSheet(`<h3>要離開測驗嗎？</h3><p>已作答的題目會保留，回首頁點測驗方框，可以從第 ${i+1} 題繼續。</p>
    <button class="btn1 b1" data-close>繼續作答</button><button class="btn2 b2" id="leave">離開，回首頁</button>`,
    (sh, close) => sh.querySelector('#leave').onclick = () => { close(); back('home'); });
  const pq = el.querySelector('#prevq'); if (pq) pq.onclick = () => { dir = 'back'; nav('quiz/'+(i-1), true); };
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => { const k = +b.dataset.k;
    if (multi) { const s = new Set(state.ans[q.id]||[]); s.has(k)?s.delete(k):s.add(k); state.ans[q.id]=[...s]; b.setAttribute('aria-pressed', s.has(k)); return; }
    state.ans[q.id] = k; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b)); save();
    setTimeout(() => nav('quiz/' + (i+1), true), 180); });
  const d = el.querySelector('#done'); if (d) d.onclick = finishQuiz;
  return el;
}
function finishQuiz(){
  state.ans.q12 = state.ans.q12 || [];
  state.pace = topPace(scores()); state.view = state.pace; S.quizDone = true;
  addNote('system', '歡迎加入歐洲旅人護照', `你的角色是「${PACES[state.pace].name}」。補完旅人檔案，推薦會更準。`, '#/me');
  save(); nav('result', true);
  if (online()) pushQuiz().then(() => track('quiz_complete', { role:state.pace }));
}

/* ===== 03 結果 ===== */
function resultView(){
  if (!S.quizDone) { setTimeout(() => nav('welcome', true)); return $h('<section></section>'); }
  const sh = scores(), P = PACES[state.pace], top3 = ROLE_ORDER.slice().sort((a,b)=>sh[b]-sh[a]).slice(0,3);
  const el = $h(`<section class="result pad">
    <header class="bar sticky res-bar"><span class="icon-btn ghost"></span><p class="eyebrow bar-t">你的旅人角色</p><a class="icon-btn" href="#/home" aria-label="回首頁">${ic('home')}</a></header>
    <div class="r-av pop-in">${av(P.ch,'start')}</div>
    <h1>${P.name}</h1><p class="r-alias">${P.alias}・${P.pace}</p>
    <p class="r-desc">${P.desc}</p>
    <div class="r-bars">${top3.map(k=>`<div class="rb ${k===state.pace?'top':''}"><span>${PACES[k].short}</span><div class="prog"><i style="width:${Math.round(sh[k]*100)}%"></i></div><b>${Math.round(sh[k]*100)}%</b></div>`).join('')}</div>
    <button class="btn1 b1" id="go">看我的 3 團推薦</button>
    <button class="btn2 b2" id="share">分享角色卡</button>
    <a class="txt-link" href="#/buddy">邀請旅伴一起測</a>
    ${S.inv && S.consent!=='yes' ? '<p class="inv-note">試玩模式不會和邀請你的旅伴配對；到「會員」成為會員（同意儲存）後就會配對。</p>' : ''}
  </section>`);
  el.querySelector('#go').onclick = () => { const a = S.after; S.after = null; save(); nav(a || 'home', true); };
  el.querySelector('#share').onclick = () => { track('share', {what:'role'}); shareText(`我是「${P.name}」（${P.alias}）！一分鐘測你是哪一種歐洲旅人：${baseUrl()}`); };
  return el;
}

/* ===== 04 首頁（測驗後） ===== */
function homeView(){
  const P = PACES[state.view], list = mine().slice(0,3), c = completion(), T = TIERS[tierIdx()], b = S.buddies[0];
  const el = $h(`<section class="pad">
    <div class="home-h"><div><p>${greet()}${S.nickname?`，${esc(S.nickname)}`:''}</p><h1>${P.name}</h1></div>
      <a class="icon-btn bell" href="#/inbox" aria-label="通知">${ic('bell')}${unread()?`<i class="badge">${unread()}</i>`:''}</a></div>
    ${S.demo?'<p class="demo-tag">示範帳號・不會存檔</p>':''}
    <a class="pass-card b3" href="#/pass"><div class="pc-av">${av(PACES[avatarKey()].ch, T[0])}</div>
      <div><b>${P.short}・${T[1]}等級</b><span>${points()} 點・可折抵 ${points()} 元</span></div>${ic('chev','end')}</a>
    ${c<100?`<a class="prof-row op" href="#/me"><div><b>旅人檔案 ${c}%</b><span>補完再拿 ${cardPtsLeft()} 點</span></div><div class="prog"><i style="width:${c}%"></i></div></a>`:''}
    <div class="sec-h"><h2>為你推薦</h2><a href="#/explore">全部</a></div>
    <div class="tiles">${list.map(tripTile).join('')}</div>
    <div class="quick">
      <a class="q op" href="#/compare">${ic('cmp')}<span>比較行程</span></a>
      <a class="q op" href="#/buddy">${ic('buddy')}<span>邀請旅伴</span></a>
      <a class="q op" href="#/explore/map">${ic('map')}<span>探索地圖</span></a>
      <a class="q op" href="#/advisor">${ic('chat')}<span>找顧問</span></a></div>
    ${b?`<a class="buddy-banner op" href="#/buddy"><b>${esc(b.nickname||'你的旅伴')}</b> 完成測驗了，看你們的共同推薦 ${ic('chev','end')}</a>`:''}
  </section>`);
  return el;
}

/* ===== 05 探索：推薦清單 ===== */
const FLT = [['noshop','無購物站'],['cool','避開炎熱'],['walk','走路不累'],['short','10 天內'],['stay','連泊不換飯店'],['budget',null],['free','自由時間多']];
function defaultFlt(){ if (S.fltDefault) return [...S.fltDefault]; const B = S.prof.card_b || {}, f = []; if (B.shop === 0) f.push('noshop'); if (B.hot === 0) f.push('cool'); if (B.walk === 0) f.push('walk'); return f; }
function exploreView(){
  if (!S.flt) S.flt = S.quizDone ? defaultFlt() : [];
  const defs = filterDefs(state.view || 'alice'), byId = Object.fromEntries(defs.map(d => [d.id, d]));
  const all = S.quizDone ? mine() : TRIPS.map(t => ({t, s:0, why:[]}));
  const on = S.flt.filter(id => byId[id]);
  let list = all.filter(x => on.every(id => byId[id].test(x.t)));
  if (S.region) list = list.filter(x => x.t.region === S.region);
  const reg = S.region && REGIONS.find(r => r.id === S.region);
  const el = $h(`<section class="pad">
    ${head('探索', {big:true, back:'auto'})}
    <div class="seg"><a aria-current="page" href="#/explore">推薦</a><a href="#/explore/map">地圖</a></div>
    <div class="fchips">${reg?`<button class="fc on" id="rg">只看${reg.full.replace(/（.*）/,'')} ✕</button>`:''}${FLT.map(([id,l]) => byId[id] ? `<button class="fc ${on.includes(id)?'on':''}" data-f="${id}">${l || byId[id].label}</button>` : '').join('')}</div>
    <p class="muted small">${S.quizDone && completion() ? '已套用你的旅人檔案・' : ''}符合 ${list.length} 團</p>
    <div class="rows ${S.cmp.length?"has-bar":""}">${list.length ? list.map(x => tripRow(x, {fit:S.quizDone?fitPct(all, x.s):null})).join('') : '<div class="empty">沒有同時符合的行程，取消一個條件試試。</div>'}</div>
    ${S.cmp.length?`<a class="cmp-bar b3" href="#/compare">已選 ${S.cmp.length} 團　比較 →</a>`:''}
  </section>`);
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { const f = b.dataset.f; S.flt = on.includes(f) ? on.filter(x => x !== f) : [...on, f]; save(); render(); });
  const rg = el.querySelector('#rg'); if (rg) rg.onclick = () => { S.region = null; save(); render(); };
  bindRows(el);
  if (!S.quizDone) el.querySelectorAll('.cmp-tg').forEach(b => b.onclick = e => { e.preventDefault(); toast('做完一分鐘測驗就能比較行程'); });
  return el;
}

/* ===== 06 探索：地圖 ===== */
function mapView(){
  const first = S.quizDone ? mine()[0].t.region : 'benelux';
  const el = $h(`<section class="pad">
    ${head('探索', {big:true, back:'auto'})}
    <div class="seg"><a href="#/explore">推薦</a><a aria-current="page" href="#/explore/map">地圖</a></div>
    <div class="mapbox" id="map"></div>
    <div class="info" id="info" aria-live="polite"></div>
    <button class="btn1 b1" id="see"></button>
    <div class="legend"><span><i style="background:var(--north)"></i>北歐</span><span><i style="background:var(--west)"></i>西歐</span><span><i style="background:var(--east)"></i>東歐</span><span><i style="background:var(--south)"></i>南歐</span><span><i style="background:var(--sel)"></i>目前選取</span><span><i style="background:var(--off-area)"></i>非永信歐洲線</span></div>
    <div class="cats" id="cats"></div>
  </section>`);
  state.mapSel = null; mapUI(el, first);
  const see = el.querySelector('#see');
  const sync = () => { const sel = state.mapSel;
    if (sel && sel.type === 'region') { const n = TRIPS.filter(t => t.region === sel.id).length, g = REGIONS.find(r => r.id === sel.id);
      see.hidden = false; see.textContent = `看${g.full.replace(/（.*）/,'').split('・')[0]}這區 ${n} 團`; see.onclick = () => { S.region = sel.id; S.flt = []; save(); nav('explore'); }; }
    else see.hidden = true; };
  el.addEventListener('click', () => setTimeout(sync)); sync();
  return el;
}

/* ===== 07 行程詳情 ===== */
function tripView(){
  const i = +route()[1], t = TRIPS[i]; if (!t) { setTimeout(() => nav('explore', true)); return $h('<section></section>'); }
  const x = (S.quizDone ? mine() : scoreAll('alice')).find(r => r.t === t) || {why:[]}, g = regionOf(t);
  const [title, sub] = t.name.split('｜'), fav = S.favs.includes(t.name), inCmp = S.cmp.includes(i);
  const lo = +t.temp.split('–')[0], tip = lo <= 5 ? '天冷乾燥：洋蔥式保暖、手套毛帽，記得加強保濕' : hot(t) ? '天熱日曬：中午排室內，帶防曬與水' : '早晚溫差大：帶一件薄外套，好走的鞋';
  const parts = (sub||'').split('、'), half = Math.ceil(t.days/2);
  track('trip_view', { trip:t.name });
  const el = $h(`<section class="trip">
    <div class="trip-cover">${cover(t,'big')}
    </div>
    <header class="trip-top"><button class="icon-btn" data-back aria-label="返回上一頁">${ic('back')}</button><h1 class="bar-t" data-top>${title}</h1>
      <button class="icon-btn hb heart" id="fv" aria-pressed="${fav}" aria-label="收藏">${ic('heart')}</button><a class="icon-btn" href="#/home" aria-label="回首頁">${ic('home')}</a></header>
    <div class="pad">
      <p class="eyebrow">${AREA_NAME[g.area]}・${g.full}</p>
      <h1>${title}</h1><p class="sub">${sub||''}</p>
      <div class="stats"><div><span>步行</span><b>${WALK[t.walk]}</b></div><div><span>最長車程</span><b>${t.maxDrive} 小時</b></div>
        <div><span>室內</span><b>${t.indoor}%</b></div><div><span>購物站</span><b class="${t.shop?'':'okc'}">${t.shop?'有':'無'}</b></div></div>
      ${S.quizDone && x.why.length?`<div class="box"><h3>為什麼推薦你</h3><div class="chips">${x.why.map(w=>`<i class="ok">${w}</i>`).join('')}</div></div>`:''}
      <div class="box"><h3>行程亮點</h3><ul class="tl">
        <li><b>D1–${half}</b>${parts[0]||''}</li><li><b>D${half+1}–${t.days-1}</b>${parts.slice(1).join('、')||'深度停留'}</li>
        <li><b>住宿</b>${t.stay?'連泊為主，不用每天換飯店':'每 1–2 晚換一次城市'}</li></ul>
        <p class="muted small">每日行程為課程示意，正式版改用永信行程表。</p></div>
      <div class="box"><h3>出發與天氣</h3><p>建議 <b>${t.months}</b>　均溫 <b>${t.temp}°C</b></p><p class="muted small">${tip}</p></div>
    </div>
    <div class="buy-bar"><div><span>每人</span><b>${t.from.toFixed(1)} 萬起</b>${t.est?'<small>示意價格</small>':''}</div>
      <button class="btn2 b2" id="cmp">${inCmp?'已加入比較':'加入比較'}</button><button class="btn1 b1" id="ask">我想了解</button></div>
  </section>`);
  bindBack(el, 'explore');
  el.querySelector('#fv').onclick = e => toggleFav(t.name, e.currentTarget);
  const bar = el.querySelector('.trip-top'); onScroll = y => bar.classList.toggle('solid', y > 100);
  el.querySelector('#cmp').onclick = () => { if (!S.quizDone) return toast('做完一分鐘測驗就能比較行程'); toggleCmp(i); if (S.cmp.includes(i) && S.cmp.length >= 2) nav('compare'); else render(); };
  el.querySelector('#ask').onclick = () => nav('advisor/' + i);
  return el;
}

/* ===== 08 比較 ===== */
function compareView(){
  if (S.cmp.length < 2) { const top = mine().map(x => TRIPS.indexOf(x.t)).filter(i => !S.cmp.includes(i)); while (S.cmp.length < 2) S.cmp.push(top.shift()); save(); }
  const all = mine(), xs = S.cmp.map(i => all.find(x => x.t === TRIPS[i])), B = S.prof.card_b || {};
  const best = (vals, mode) => { const v = mode === 'min' ? Math.min(...vals) : Math.max(...vals); return vals.map(x => x === v && vals.filter(y=>y===v).length < vals.length); };
  const rows = [
    ['價格', xs.map(x => `${x.t.from.toFixed(1)} 萬起`), best(xs.map(x=>x.t.from),'min')],
    ['天數', xs.map(x => `${x.t.days} 天`), xs.map(()=>false)],
    ['步行', xs.map(x => WALK[x.t.walk]), best(xs.map(x=>x.t.walk),'min')],
    ['最長車程', xs.map(x => `${x.t.maxDrive} 小時`), best(xs.map(x=>x.t.maxDrive),'min')],
    ['室內比例', xs.map(x => `${x.t.indoor}%`), B.hot===0 ? best(xs.map(x=>x.t.indoor),'max') : xs.map(()=>false)],
    ['購物站', xs.map(x => x.t.shop?'有':'無'), best(xs.map(x=>x.t.shop?1:0),'min')],
    ['連泊', xs.map(x => x.t.stay?'是':'否'), best(xs.map(x=>x.t.stay?1:0),'max')],
    ['建議月份', xs.map(x => x.t.months), xs.map(()=>false)],
    ['當地均溫', xs.map(x => `${x.t.temp}°C`), B.hot===0 ? best(xs.map(x=>-(+x.t.temp.split('–').pop())),'max') : xs.map(()=>false)],
    ['和你合拍', xs.map(x => `${fitPct(all, x.s)}%`), best(xs.map(x=>x.s),'max')]];
  const el = $h(`<section class="pad cmp">
    ${topbar(`比較 ${xs.length} 團`, {home:true, right: xs.length<3?'<a class="txt-btn" href="#/explore">＋ 加一團</a>':''})}
    <div class="ctab" style="--n:${xs.length}">
      <div class="ch"></div>${xs.map((x,k)=>`<div class="ch"><a href="#/trip/${S.cmp[k]}">${short(x.t)}</a><button class="txt" data-rm="${S.cmp[k]}">移除</button></div>`).join('')}
      ${rows.map(([k,vals,hi]) => `<div class="ck">${k}</div>${vals.map((v,j)=>`<div class="cv ${hi[j]?'hi':''}">${v}</div>`).join('')}`).join('')}
    </div>
    <p class="muted small">橘色粗體＝比較符合你檔案的一項</p>
    <div class="cmp-acts" style="--n:${xs.length}">${xs.map((x,k)=>`<a class="btn${k?2:1} b${k?2:1}" href="#/advisor/${S.cmp[k]}">問${short(x.t).replace(/ \d+ 天$/,'')}</a>`).join('')}</div>
  </section>`);
  bindBack(el, 'explore');
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { S.cmp = S.cmp.filter(i => i !== +b.dataset.rm); save(); if (S.cmp.length < 2) nav('explore', true); else render(); });
  track('compare', { trips:xs.map(x=>x.t.name) });
  return el;
}

/* ===== 09 旅伴與共同推薦 ===== */
const Q12 = i => QUESTIONS.find(q=>q.id==='q12').o[i][0];
function buddyInfo(b){
  const myA = merged(state.ans, S.prof), bA = merged(b.answers || {}, b), common = [], diff = [];
  const qs = new Set(myA.q12||[]); (bA.q12||[]).filter(i => qs.has(i)).forEach(i => common.push({1:'無購物站',4:'避開炎熱',2:'少拉車',0:'連泊',3:'自由時間多'}[i]));
  const mm = new Set(((S.prof.card_a||{}).months||[])); ((b.card_a||{}).months||[]).filter(i => mm.has(i)).forEach(i => common.push(CARDS[0].qs[1].o[i]+'出發'));
  const mt = PACES[state.view].tempo, bt = PACES[b.role_key].tempo, nm = b.nickname || '旅伴';
  if (mt !== bt) diff.push(bt === 'precise' ? `${nm}想要全程導覽，你想要自由時間` : mt === 'precise' ? `你想要全程導覽，${nm}想要自由時間` : `${nm}想要${bt==='slow'?'更多留白':'半日導覽'}，你想要${mt==='slow'?'更多留白':'半日導覽'}`);
  if (myA.q10 != null && bA.q10 != null && myA.q10 !== bA.q10) diff.push(`預算不同：你 ${QUESTIONS.find(q=>q.id==='q10').o[myA.q10][0]}，${nm} ${QUESTIONS.find(q=>q.id==='q10').o[bA.q10][0]}`);
  const me = mine(), them = scoreFor(b.role_key, b.answers || {}, b);
  const sOf = (list, t) => list.find(x => x.t === t).s;
  const joint = TRIPS.map(t => { const a = sOf(me, t), c = sOf(them, t); return { t, a, c, s: a + c - Math.abs(a - c) * .9 }; }).sort((x,y) => y.s - x.s).slice(0,3);
  joint.forEach(j => { j.why = j.t.pace === 'balanced' ? '半日導覽、半日自由：兩人各取所需' : j.t.pace === mt && j.a >= j.c ? `你最愛；${nm}也合適` : j.t.pace === bt ? `${nm}最愛；你也合適` : '兩人分數最接近'; });
  const sh = scores(), saved = state.ans; state.ans = b.answers || {}; const bsh = scores(); state.ans = saved;
  const fit = Math.round(100 * ROLE_ORDER.reduce((s,k) => s + Math.min(sh[k], bsh[k]), 0));
  const cm = [...new Set(common)];
  return { common:cm, diff, joint, fit:Math.min(98, Math.round(50 + fit * .4 + cm.length * 6)), nm };
}
function buddyView(){
  S.buddies.forEach(b => b.seen = true); save();
  const P = PACES[state.view], b = S.buddies[0];
  let body;
  if (!b) body = `<div class="empty-card"><div class="ec-ic">${ic('buddy')}</div><h2>邀旅伴一起測</h2>
      <p>旅伴做完一分鐘測驗，這裡會算出你們的合拍度、都在意的事，和兩人都適合的 3 團。</p>
      <button class="btn1 b1" id="inv2">傳邀請給旅伴</button><p class="muted small">旅伴完成測驗，你們各得 100 點。</p></div>`;
  else { const B = buddyInfo(b), BP = PACES[b.role_key];
    body = `<div class="pair"><div class="pa"><div class="pav">${av(P.ch,'start')}</div><span>你・${P.short}</span></div>
        <div class="fit"><b>${B.fit}%</b><span>合拍度</span></div>
        <div class="pa"><div class="pav">${av(BP.ch,'start')}</div><span>${esc(B.nm)}・${BP.short}</span></div></div>
      <div class="box"><p><b>你們都在意</b>　${B.common.join('、') || '還看不出來，請旅伴補旅人檔案'}</p>
        ${B.diff.length?`<p><b>不一樣的地方</b>　${B.diff.join('；')}</p>`:''}</div>
      <div class="sec-h"><h2>兩人都適合的 3 團</h2><span class="muted small">依兩人檔案交集</span></div>
      <div class="rows">${B.joint.map(j => `<a class="row-card op" href="#/trip/${TRIPS.indexOf(j.t)}"><div class="rc-main"><b>${short(j.t)}</b><span>${j.why}</span><span class="muted">${j.t.from.toFixed(1)} 萬起・${j.t.months}</span></div>${ic('chev','end')}</a>`).join('')}</div>
      <p class="muted small">兩人都完成旅人檔案，同團報名第二人享折扣（示意），各得 100 點。</p>
      ${S.buddies.length>1?`<p class="muted small">另外還有 ${S.buddies.length-1} 位旅伴：${S.buddies.slice(1).map(x=>esc(x.nickname||PACES[x.role_key].short)).join('、')}</p>`:''}`; }
  const el = $h(`<section class="pad">
    ${head('旅伴', {big:true, back:'auto', right:'<button class="txt-btn" id="inv">＋ 邀請</button>'})}
    ${body}</section>`);
  const invite = () => inviteSheet();
  el.querySelector('#inv').onclick = invite; const i2 = el.querySelector('#inv2'); if (i2) i2.onclick = invite;
  return el;
}
function inviteSheet(){
  if (S.demo) return openSheet(`<h3>邀請旅伴</h3><p>示範帳號不會產生真的邀請連結。</p><p class="muted">實際使用時，邀請連結會帶你的交接代碼；旅伴做完測驗，雙方會自動配對、各得 100 點，並收到通知。</p><button class="btn2 b2" data-close>知道了</button>`);
  if (S.consent !== 'yes') return openSheet(`<h3>邀請旅伴</h3><p>邀請需要儲存你的測驗結果，旅伴做完才能和你配對。</p>
    <button class="btn1 b1" id="ok">同意儲存，產生邀請</button><button class="btn2 b2" data-close>先不要</button>`,
    (sh, close) => sh.querySelector('#ok').onclick = async () => { S.consent = 'yes'; save(); close(); await ensureCustomer(); await pushQuiz(); inviteSheet(); });
  openSheet(`<h3>邀請旅伴</h3><label class="fld"><span>你的暱稱（旅伴會看到）</span><input id="nn" maxlength="12" value="${esc(S.nickname)}" placeholder="例如：雅婷"></label>
    <button class="btn1 b1" id="send">傳邀請給旅伴</button><button class="btn2 b2" data-close>取消</button>`, (sh, close) => {
    sh.querySelector('#send').onclick = async () => {
      const nn = sh.querySelector('#nn').value.trim(); const me = await ensureCustomer(); if (!me) return toast('目前連不上資料庫');
      if (nn && nn !== me.nickname) { S.nickname = nn; save(); await sb.from('customers').update({ nickname:nn }).eq('id', me.id); }
      close(); track('share', { what:'invite' });
      shareText(`${nn || '我'}是「${PACES[state.view].name}」，一起做一分鐘歐洲旅人測驗，看我們都適合哪幾團：${baseUrl()}?inv=${me.code}`, '邀請連結已複製，貼給旅伴就好');
    }; });
}

/* ===== 10 找顧問 ===== */
function summaryLines(tripName){
  const P = PACES[state.view], a = S.prof.card_a||{}, b = S.prof.card_b||{}, c = S.prof.card_c||{}, d = S.prof.card_d||{};
  const lab = (k, q, v) => { if (v === undefined) return null; const qq = CARDS.find(x=>x.k===k).qs.find(x=>x.id===q); return Array.isArray(v) ? v.map(i=>qq.o[i]).join('、') : qq.o[v]; };
  return [['角色', `${P.name}（${P.short}）`], ['同行', lab('card_a','companion',a.companion)], ['月份', lab('card_a','months',a.months)], ['預算', lab('card_a','budget',a.budget)],
    ['在意', [b.hot===0?'怕熱':null, b.shop===0?'不要購物站':null, b.walk===0?'走路輕鬆':null, b.maxDrive===0?'車程 3 小時內':null].filter(Boolean).join('、')||null],
    ['興趣', lab('card_c','interests',c.interests)], ['聯絡', [lab('card_d','contact',d.contact), lab('card_d','time',d.time)].filter(Boolean).join('，')||null]].filter(x => x[1]);
}
function advisorView(){
  const ti = route()[1], t = ti != null && ti !== '' ? TRIPS[+ti] : null;
  const el = $h(`<section class="pad adv">${topbar('找顧問', {home:true})}<div id="body"><p class="muted">準備交接代碼中…</p></div></section>`);
  bindBack(el, t ? 'trip/' + ti : 'home');
  const body = el.querySelector('#body');
  const draw = code => {
    const qr = (()=>{ try { const q = qrcode(0, 'M'); q.addData(code); q.make(); return q.createSvgTag({ cellSize:5, margin:2, scalable:true }); } catch(e) { return ''; } })();
    body.innerHTML = `<div class="code-card"><div class="qr">${qr}</div><div><span class="muted small">交接代碼${S.demo?'（示範）':''}</span><p class="code">${code}</p>
        <p class="small">報給顧問或讓顧問掃描，不用重講一次需求</p></div></div>
      <div class="sumcard">${t?`<b>想了解：${short(t)}</b>`:'<b>我的摘要</b>'}${summaryLines().map(([k,v])=>`<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('')}
        ${completion()<100?`<a class="small" href="#/me">旅人檔案 ${completion()}%，補完會更準 →</a>`:''}</div>
      <button class="btn1 b1" id="line">開啟 LINE 傳給顧問</button>
      <p class="muted small center">顧問上班時間內回覆；晚上送出，隔天早上 10 點前回覆</p>`;
    body.querySelector('#line').onclick = () => { if (S.demo) return toast('示範帳號不會真的傳出'); openLine(lineMsg(`我的交接代碼是 ${code}${t?`，想了解「${t.name}」`:''}`)); };
  };
  if (S.demo) { draw('YT0126'); return el; }
  if (S.consent !== 'yes') { body.innerHTML = `<div class="empty-card"><h2>交接代碼需要儲存資料</h2><p>同意後，顧問才看得到你的角色、檔案與收藏，不用重問。</p>
      <button class="btn1 b1" id="ok">同意儲存，產生代碼</button><a class="txt-link" data-back2>先不要</a></div>`;
    body.querySelector('#ok').onclick = async () => { S.consent = 'yes'; save(); body.innerHTML = '<p class="muted">產生中…</p>'; await ensureCustomer(); await pushQuiz(); render(); };
    body.querySelector('[data-back2]').onclick = () => back('home'); return el; }
  ensureCustomer().then(async me => {
    if (!me) { body.innerHTML = `<div class="empty-card"><h2>目前連不上資料庫</h2><p>請稍後再試，或直接開 LINE 詢問。</p></div>`; return; }
    if (t) { await sb.from('inquiries').insert({ customer_id:me.id, trip_name:t.name }); track('inquiry', { trip:t.name });
      if (!S.inq.some(q => q.trip === t.name)) { S.inq.unshift({ trip:t.name, status:'new', at:new Date().toISOString() }); save(); } }
    draw(me.code);
  });
  return el;
}

/* ===== 11 通知中心 ===== */
const KIND = {advisor:['顧問','chat'], buddy:['旅伴','buddy'], perk:['優惠與禮遇','gift'], system:['系統','star']};
function inboxView(){
  const f = route()[1] || 'all', list = S.notes.filter(n => f === 'all' || n.kind === f || (f === 'perk' && n.kind === 'system'));
  const el = $h(`<section class="pad">${topbar('通知', {home:true, right:'<button class="txt-btn" id="allread">全部已讀</button>'})}
    <div class="fchips">${[['all','全部'],['advisor','顧問'],['buddy','旅伴'],['perk','優惠與禮遇']].map(([k,l])=>`<a class="fc ${f===k?'on':''}" href="#/inbox/${k}">${l}</a>`).join('')}</div>
    <div class="notes">${list.length ? list.map(n => `<a class="note op ${n.read?'':'unread'}" href="${n.link||'#/home'}" data-id="${n.id}">
      <span class="n-ic k-${n.kind}">${ic(KIND[n.kind][1])}</span><div><div class="n-h"><b>${esc(n.title)}</b><span>${fmtDate(n.at)}</span></div><p>${esc(n.body||'')}</p></div></a>`).join('')
      : '<div class="empty">還沒有通知。收藏行程、邀請旅伴或找顧問後，消息會出現在這裡。</div>'}</div>
    <p class="muted small center">通知也會同步到永信 LINE 官方帳號；可在「會員 → 設定」調整</p></section>`);
  bindBack(el, 'home');
  const mark = async ids => { const db = S.notes.filter(n => ids.includes(n.id) && n.db && !n.read).map(n => n.dbid);
    S.notes.forEach(n => { if (ids.includes(n.id)) n.read = true; }); save();
    if (db.length && online()) await sb.from('notifications').update({ read_at:new Date().toISOString() }).in('id', db); };
  el.querySelector('#allread').onclick = async () => { await mark(S.notes.map(n => n.id)); render(); };
  el.querySelectorAll('.note').forEach(a => a.addEventListener('click', () => mark([a.dataset.id])));
  return el;
}

/* ===== 12 護照 ===== */
function passView(){
  const P = PACES[state.view], lv = tierIdx(), trips = (S.me && S.me.trips_taken) || 0, next = PERKS[lv+1];
  const need = [2,3,5][lv] - trips;
  const el = $h(`<section class="pad">
    ${head('護照', {big:true, back:'auto'})}
    <div class="passport b3"><div class="pp-top"><span>歐洲旅人護照・數位版</span><span class="stamp">${TIERS[lv][1]}</span></div>
      <div class="pp-id"><div class="pp-av">${av(PACES[avatarKey()].ch, TIERS[lv][0])}</div><div><b>${P.name}</b><span>${P.alias}・${TIERS[lv][1]}等級</span>${S.nickname?`<span>${esc(S.nickname)}</span>`:''}</div></div>
      <div class="pp-stats"><div><b>${trips}</b><span>出團次數</span></div><a href="#/pass/points"><b>${points()}</b><span>旅人點數 ›</span></a><a href="#/me"><b>${completion()}%</b><span>檔案完成</span></a></div></div>
    ${next?`<p class="next-lv">下一級：<b>${next[0]}</b>　再出團 ${need} 次</p>`:''}
    <div class="sec-h"><h2>等級禮遇</h2><span class="muted small">數位護照，不印實體</span></div>
    <div class="tiers">${PERKS.map(([n,c,d],i)=>`<div class="tier ${i===lv?'now':''} ${i<lv?'past':''}"><b>${n}${i===lv?'<small>目前</small>':''}</b><span>${d}</span><small>${c}</small></div>`).join('')}</div>
    <div class="sec-h"><h2>足跡地圖</h2><span class="muted small">第一次出團後點亮</span></div>
    <div class="foot">${(()=>{ const paths = GEO.filter(x=>HOME[x.c]).map(x=>`<path d="${x.d}"/>`).join(''); return `<svg viewBox="40 60 720 680" aria-hidden="true">${paths}</svg>`; })()}
      <p>${trips?`已出團 ${trips} 次，足跡會依永信訂單紀錄點亮。`:'第一次出團後，這裡會點亮你去過的國家，並推薦下一站。'}</p></div>
  </section>`);
  return el;
}

/* ===== 13 點數明細 ===== */
function pointsView(){
  const el = $h(`<section class="pad">${topbar('點數明細', {home:true})}
    <div class="pts-card b3"><span>目前點數</span><b>${points()} 點</b><small>報名時可折抵 ${points()} 元・2027/12/31 前有效</small></div>
    ${pending()?`<p class="pend">待入帳 ${pending()} 點：出團回國後入帳</p>`:''}
    <h2 class="h2">紀錄</h2>
    <div class="ledger">${S.ledger.length ? S.ledger.map(x => `<div class="lg"><div><b>${esc(x.label)}</b><span>${fmtDate(x.at)}・${x.status==='pending'?'待出團・回國後入帳':x.reason.startsWith('card')?'旅人檔案':x.reason.startsWith('buddy')?'旅伴':'其他'}</span></div><em class="${x.status}">+${x.points}</em></div>`).join('')
      : '<div class="empty">還沒有點數紀錄。完成一張旅人檔案卡就能拿到第一筆點數。</div>'}</div>
    <h2 class="h2">怎麼賺點數</h2>
    <div class="earn">${EARN.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>
    <p class="muted small">點數只在成交時折抵，每團折抵上限為團費 3%（示意，待業師確認）。</p></section>`);
  bindBack(el, 'pass');
  return el;
}

/* ===== 14 會員：個人卡、收藏、詢問、旅人檔案；齒輪進設定 ===== */
const REGIONS_TW = ['北部','中部','南部','東部','離島'];
const INQ_STATUS = {new:'待回覆', replied:'已回覆', quoted:'已報價', won:'已報名', lost:'已結案'};
const APP_VER = 'v2.3（2026/11/10）';
const avatarKey = () => S.avatar || state.view || 'alice';
const birthMonth = () => { const v = (S.prof.card_e || {}).birthMonth; return v === undefined ? null : v; };
const memberState = () => S.demo ? 'demo' : !S.quizDone ? 'guest' : S.consent === 'yes' ? 'member' : 'trial';
async function pushMember(fields){
  if (!online()) return; const me = await ensureCustomer(); if (!me) return;
  const r = await sb.from('customers').update(fields).eq('id', me.id).select().single();
  if (r.error) toast('儲存失敗：' + r.error.message); else S.me = r.data;
}
async function optIn(){ S.consent = 'yes'; save(); await ensureCustomer(); await pushQuiz();
  await pushMember({ nickname:S.nickname || null, avatar_key:S.avatar || null, region:S.region_tw || null, prefs:S.prefs || {} }); render(); toast('已成為會員'); }
function meView(){
  const ms = memberState(), gear = `<a class="icon-btn" href="#/me/settings" aria-label="設定">${ic('gear')}</a>`;
  if (ms === 'guest') {
    const el = $h(`<section class="pad">${head('會員', {big:true, back:'auto', right:gear})}
      <div class="join-card b3"><b>做完一分鐘測驗，就是啟程會員</b><span>不用填姓名電話，也不用下載</span>
        <ul>${['拿到 3 團剛好適合你的行程','完成旅人檔案領點數，報名可折抵','生日月小禮與旅伴共同推薦','顧問用交接代碼接手，不用重講需求'].map(x=>`<li>${x}</li>`).join('')}</ul>
        <a class="btn-fake" href="#/welcome">開始測驗，成為會員</a></div>
      <button class="btn2 b2" id="demo">我已經是永信旅客（示範帳號）</button>
      <a class="link-row op" href="#/me/legal/privacy">${ic('shield')}<span>我們怎麼使用你的資料</span>${ic('chev','end')}</a></section>`);
    el.querySelector('#demo').onclick = enterDemo; return el;
  }
  const P = PACES[avatarKey()], T = TIERS[tierIdx()], c = completion(), bm = birthMonth();
  const inqN = (S.inq || []).length, favN = S.favs.length;
  const flip = S.photo && S.photoOn;
  const tag = {demo:`<i class="mtag">示範帳號${flip?'・示意照片非本人':'・只存在這支手機'}</i>`, trial:'<i class="mtag warn">試玩中・尚未成為會員</i>', member:''}[ms];
  const code = S.demo ? 'YT0126' : ms === 'member' ? (S.me && S.me.code || '…') : null;
  const el = $h(`<section class="pad">
    ${head('會員', {big:true, back:'auto', right:gear})}
    <div class="mcard">
      <div class="mc-top">${flip?`<button class="mc-av flip" aria-label="頭像：照片與${P.short}頭像輪流顯示，點一下翻面"><span class="flip-in"><span class="face front"><img src="${S.photo}" alt="${esc(S.nickname)}（示意照片）"></span><span class="face back">${av(P.ch, T[0])}</span></span></button>`:`<div class="mc-av">${av(P.ch, T[0])}</div>`}
        <div class="mc-id"><b>${esc(S.nickname || '旅人')}</b><span>${T[1]}會員・${PACES[state.view].short}</span>${tag}</div>
        <a class="icon-btn" href="#/me/edit" aria-label="編輯個人資料">${ic('pen')}</a></div>
      <div class="mc-rows">
        <div><span>生日月份</span><b>${bm===null?'<a href="#/me/edit">未填，填了領生日月禮 +50 點</a>':MONTHS[bm]}</b></div>
        <div><span>交接代碼</span><b>${code?`<span class="code-s" id="code">${code}</span><button class="txt-btn" id="copy">複製</button>`:'<button class="txt-btn" id="optin">成為會員後產生</button>'}</b></div>
      </div>
      ${ms==='trial'?'<button class="btn1 b1" id="optin2">成為會員（同意儲存）</button>':''}
    </div>
    <div class="mstats">
      <a class="op" href="#/pass/points"><b>${points()}</b><span>點數</span></a>
      <a class="op" href="#/me/favs"><b>${favN}</b><span>收藏</span></a>
      <a class="op" href="#/me/inquiries"><b>${inqN}</b><span>詢問</span></a></div>
    <details class="box prof-box" ${c<100?'open':''}><summary><div class="sec-h"><h2>旅人檔案</h2><span class="muted small">${c}%・已得 ${CARDS.filter(doneCard).reduce((s,x)=>s+x.pts,0)} 點</span></div>
      <div class="prog"><i style="width:${c}%"></i></div></summary>
      <div class="cards5">${CARDS.map(card => { const ok = doneCard(card), v = S.prof[card.k] || {}, n = card.qs.filter(q => v[q.id] !== undefined && !(Array.isArray(v[q.id]) && !v[q.id].length)).length;
        const first = ok ? 0 : Math.max(0, card.qs.findIndex(q => v[q.id] === undefined || (Array.isArray(v[q.id]) && !v[q.id].length)));
        return `<a class="c5 op ${ok?'ok':''}" href="#/me/card/${card.k}/${first}"><div><b>${card.t}</b><span>${card.use}</span></div><em>${ok?'已完成':n?`${n}/${card.qs.length}・+${card.pts}`:`+${card.pts} 點`}</em></a>`; }).join('')}</div>
      <p class="muted small">每一題都寫了用途；不放進一分鐘測驗，想到再補就好。</p></details>
    <div class="menu">
      <a class="op" href="#/buddy">${ic('buddy')}<span>旅伴</span>${S.buddies.length?`<em>${S.buddies.length} 位</em>`:''}${ic('chev','end')}</a>
      <a class="op" href="#/inbox">${ic('bell')}<span>通知</span>${unread()?`<em>${unread()} 則未讀</em>`:''}${ic('chev','end')}</a>
      <a class="op" href="#/me/settings">${ic('gear')}<span>設定與隱私</span>${ic('chev','end')}</a></div>
  </section>`);
  const fl = el.querySelector('.mc-av.flip');
  if (fl) { const turn = () => fl.classList.toggle('flipped'); fl.onclick = () => { turn(); clearInterval(flipTimer); flipTimer = setInterval(turn, 4000); };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) flipTimer = setInterval(turn, 4000); }
  const cp = el.querySelector('#copy'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(el.querySelector('#code').textContent); toast('已複製交接代碼'); } catch(e) { toast('請長按代碼複製'); } };
  el.querySelectorAll('#optin,#optin2').forEach(b => b.onclick = optIn);
  if (ms === 'member' && !(S.me && S.me.code)) ensureCustomer().then(() => { const p = el.querySelector('#code'); if (p && S.me) p.textContent = S.me.code; });
  return el;
}

/* ----- 編輯個人資料 ----- */
function editView(){
  const T = TIERS[tierIdx()], bm = birthMonth();
  let av0 = avatarKey(), reg = S.region_tw || null, b0 = bm;
  const el = $h(`<section class="pad">${topbar('編輯個人資料')}
    <label class="fld"><span>暱稱</span><input id="nn" maxlength="12" value="${esc(S.nickname)}" placeholder="例如：雅婷"><small>旅伴和顧問會看到；不用填真實姓名</small></label>
    ${S.photo?`<label class="sw"><span>照片與角色頭像輪流顯示<small>每 4 秒翻面一次；關掉就只顯示下面選的角色頭像</small></span><input type="checkbox" id="pon" ${S.photoOn?'checked':''}><i></i></label>`:''}
    <div class="fld"><span>頭像</span><div class="avs">${ROLE_ORDER.map(k=>`<button class="avo op" data-av="${k}" aria-pressed="${k===av0}" aria-label="${PACES[k].short}">${av(PACES[k].ch, T[0])}<i>${PACES[k].short}</i></button>`).join('')}</div>
      <small>只能選角色頭像，不上傳照片；材質會跟著護照等級（目前：${T[1]}）變精緻</small></div>
    <label class="fld"><span>生日月份</span><select id="bm"><option value="">未填</option>${MONTHS.map((m,i)=>`<option value="${i}" ${b0===i?'selected':''}>${m}</option>`).join('')}</select>
      <small>只記月份、不記日期；生日月會收到小禮。和旅人檔案「生日與禮遇」是同一題</small></label>
    <div class="fld"><span>居住地區（選填）</span><div class="chips-s">${REGIONS_TW.map(r=>`<button class="fc ${reg===r?'on':''}" data-rg="${r}">${r}</button>`).join('')}</div>
      <small>用來通知附近的旅遊說明會、找最近的門市</small></div>
    <button class="btn1 b1" id="save">儲存</button>
    <p class="muted small center">${memberState()==='member'?'會存到會員資料，可隨時在「設定 → 隱私與資料」刪除':'目前只存在這支手機'}</p>
  </section>`);
  bindBack(el, 'me');
  el.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { av0 = b.dataset.av; el.querySelectorAll('[data-av]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  el.querySelectorAll('[data-rg]').forEach(b => b.onclick = () => { reg = reg === b.dataset.rg ? null : b.dataset.rg; el.querySelectorAll('[data-rg]').forEach(x => x.classList.toggle('on', x.dataset.rg === reg)); });
  el.querySelector('#save').onclick = async () => {
    S.nickname = el.querySelector('#nn').value.trim(); S.avatar = av0; S.region_tw = reg;
    const pon = el.querySelector('#pon'); if (pon) S.photoOn = pon.checked;
    const v = el.querySelector('#bm').value, e = S.prof.card_e = S.prof.card_e || {};
    if (v === '') delete e.birthMonth; else e.birthMonth = +v;
    save();
    const card = CARDS.find(c => c.k === 'card_e');
    if (doneCard(card) && addPoints('card_e', `完成「${card.t}」`, card.pts)) { plusPop(card.pts); addNote('perk', `完成「${card.t}」+${card.pts} 點`, card.use, '#/pass/points'); }
    await pushMember({ nickname:S.nickname || null, avatar_key:S.avatar, region:S.region_tw }); pushProfile();
    toast('已儲存'); back('me');
  };
  return el;
}

/* ----- 收藏、詢問紀錄 ----- */
function favsView(){
  const all = S.quizDone ? mine() : TRIPS.map(t => ({t, s:0, why:[]}));
  const list = all.filter(x => S.favs.includes(x.t.name));
  const el = $h(`<section class="pad">${topbar(`我的收藏（${list.length}）`, {home:true})}
    <div class="rows ${S.cmp.length?'has-bar':''}">${list.length ? list.map(x => tripRow(x, {fit:S.quizDone?fitPct(all, x.s):null})).join('') : '<div class="empty">還沒有收藏。看到喜歡的團，按右邊的愛心；降價或名額變動會通知你。</div>'}</div>
    ${list.length?'':'<a class="btn2 b2" href="#/explore">去探索行程</a>'}
    ${S.cmp.length?`<a class="cmp-bar b3" href="#/compare">已選 ${S.cmp.length} 團　比較 →</a>`:''}</section>`);
  bindBack(el, 'me'); bindRows(el);
  el.querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', () => setTimeout(render, 300)));
  return el;
}
function inquiriesView(){
  const list = S.inq || [];
  const el = $h(`<section class="pad">${topbar('詢問紀錄', {home:true})}
    <div class="rows">${list.length ? list.map(q => { const i = tripId(q.trip.split('｜')[0]); return `<a class="row-card op" href="#/${i>=0?'advisor/'+i:'advisor'}">
      <div class="rc-main"><b>${esc(q.trip.split('｜')[0])}</b><span class="muted">${fmtDate(q.at)}詢問</span></div><em class="st st-${q.status||'new'}">${INQ_STATUS[q.status||'new']}</em>${ic('chev','end')}</a>`; }).join('')
      : '<div class="empty">還沒有詢問。在行程頁按「我想了解」，顧問就會用交接代碼接手。</div>'}</div>
    <p class="muted small">狀態由顧問更新：待回覆 → 已回覆 → 已報價 → 已報名。</p></section>`);
  bindBack(el, 'me'); return el;
}

/* ----- 設定 ----- */
function settingsView(){
  const ms = memberState(), pf = S.prefs = Object.assign({ advisor:true, buddy:true, perk:true, birthday:true, quiet:true }, S.prefs || {});
  const dflt = S.fltDefault || defaultFlt();
  const sw = (id, label, on, sub='') => `<label class="sw"><span>${label}${sub?`<small>${sub}</small>`:''}</span><input type="checkbox" data-sw="${id}" ${on?'checked':''}><i></i></label>`;
  const row = (href, label, sub='') => `<a class="srow op" href="${href}"><span>${label}${sub?`<small>${sub}</small>`:''}</span>${ic('chev','end')}</a>`;
  const el = $h(`<section class="pad settings">${topbar('設定', {home:true})}
    <h2 class="sh">帳號</h2><div class="sgroup">
      <div class="srow"><span>交接代碼<small>${ms==='member'?'把代碼告訴顧問就能接手':ms==='demo'?'示範代碼':'成為會員後產生'}</small></span><b class="code-s">${ms==='demo'?'YT0126':ms==='member'?(S.me&&S.me.code||'…'):'—'}</b></div>
      <div class="srow"><span>LINE 綁定<small>正式版開放：綁定後自動帶入出團紀錄與護照等級</small></span><em class="muted">尚未開放</em></div>
      ${ms==='demo'?'<button class="srow danger-t" id="exitDemo"><span>離開示範帳號</span></button>':ms==='trial'?'<button class="srow" id="optin"><span>成為會員（同意儲存）</span></button>':''}
    </div>
    <h2 class="sh">通知</h2><div class="sgroup">
      ${sw('line','同步到永信 LINE 官方帳號', S.lineSync)}
      ${sw('advisor','顧問回覆', pf.advisor)}${sw('buddy','旅伴', pf.buddy)}${sw('perk','優惠與禮遇', pf.perk, '收藏的團降價、早鳥開賣')}${sw('birthday','生日月禮', pf.birthday)}
      ${sw('quiet','勿擾時段', pf.quiet, '晚上 10 點到早上 9 點不推播，訊息留到早上')}
    </div>
    <h2 class="sh">推薦偏好</h2><div class="sgroup">
      ${row('#/me','管理旅人檔案', `完成 ${completion()}%`)}
      <div class="srow col"><span>探索頁預設篩選<small>打開探索時自動套用</small></span><div class="chips-s">${[['noshop','無購物站'],['cool','避開炎熱'],['walk','走路不累']].map(([k,l])=>`<button class="fc ${dflt.includes(k)?'on':''}" data-df="${k}">${l}</button>`).join('')}</div></div>
      <button class="srow" id="redo"><span>重新做測驗<small>角色與推薦會重算；旅人檔案保留</small></span>${ic('chev','end')}</button>
    </div>
    <h2 class="sh">隱私與資料</h2><div class="sgroup">
      ${row('#/me/legal/data','我們記錄什麼、用途與保存期間')}
      <div class="srow"><span>同意紀錄<small>${ms==='member'&&S.me&&S.me.consent_at?`${new Date(S.me.consent_at).toLocaleDateString('zh-TW')} 同意儲存`:ms==='demo'?'示範帳號不儲存':'尚未同意，資料只在這支手機'}</small></span></div>
      <button class="srow" id="dl"><span>下載我的資料<small>一個 JSON 檔：測驗、檔案、收藏、點數、詢問</small></span>${ic('chev','end')}</button>
      ${ms==='member'?'<button class="srow" id="withdraw"><span>撤回同意<small>刪除雲端資料，改回只存在這支手機</small></span></button>':''}
      ${ms==='demo'?'':'<button class="srow danger-t" id="del"><span>刪除全部資料<small>測驗、檔案、收藏、點數與詢問都會清除，無法復原</small></span></button>'}
    </div>
    <h2 class="sh">條款</h2><div class="sgroup">
      ${row('#/me/legal/privacy','隱私權政策')}${row('#/me/legal/terms','服務條款')}${row('#/me/legal/notice','個人資料蒐集告知事項')}
    </div>
    <h2 class="sh">關於</h2><div class="sgroup">
      <div class="srow"><span>版本</span><em class="muted">${APP_VER}</em></div>
      <button class="srow" id="fb"><span>意見回饋<small>用 LINE 告訴我們哪裡不好用</small></span>${ic('chev','end')}</button>
      <div class="srow col"><span>關於這個 App<small>輔大創新創業社課程專案的原型，不是永信旅遊的官方 App；行程、價格與點數規則皆為示意。</small></span></div>
    </div>
  </section>`);
  bindBack(el, 'me');
  el.querySelectorAll('[data-sw]').forEach(i => i.onchange = () => { const k = i.dataset.sw;
    if (k === 'line') S.lineSync = i.checked; else pf[k] = i.checked; save();
    pushMember({ prefs:{ ...pf, line:S.lineSync, filters:S.fltDefault || null } }); });
  el.querySelectorAll('[data-df]').forEach(b => b.onclick = () => { const k = b.dataset.df, cur = new Set(S.fltDefault || defaultFlt());
    cur.has(k) ? cur.delete(k) : cur.add(k); S.fltDefault = [...cur]; S.flt = null; save(); b.classList.toggle('on', cur.has(k));
    pushMember({ prefs:{ ...pf, line:S.lineSync, filters:S.fltDefault } }); });
  el.querySelector('#redo').onclick = () => openSheet(`<h3>重新做測驗？</h3><p>角色與推薦會依新答案重算；旅人檔案、收藏與點數都保留。</p>
    <button class="btn1 b1" id="go">重新開始</button><button class="btn2 b2" data-close>取消</button>`,
    (sh, close) => sh.querySelector('#go').onclick = () => { close(); state.ans = {}; S.quizDone = false; S.flt = null; save(); nav('quiz/0'); });
  el.querySelector('#dl').onclick = () => {
    const data = { exported_at:new Date().toISOString(), app:'歐洲旅人護照（課程原型）', member:memberState(), nickname:S.nickname, avatar:S.avatar, region:S.region_tw,
      code:S.me && S.me.code, role:state.pace, answers:state.ans, profile:S.prof, favorites:S.favs, points:S.ledger, inquiries:S.inq || [], notifications:S.notes, prefs:S.prefs };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type:'application/json' }));
    a.download = `travel-passport-data-${new Date().toISOString().slice(0,10)}.json`; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('已下載我的資料'); track('data_export');
  };
  const wd = el.querySelector('#withdraw'); if (wd) wd.onclick = () => openSheet(`<h3>撤回同意？</h3><p>雲端的測驗、檔案、收藏、點數、詢問與旅伴配對都會刪除，交接代碼失效；這支手機上的測驗結果會保留，改成試玩模式。</p>
    <button class="btn1 b1 danger-b" id="go">撤回並刪除雲端資料</button><button class="btn2 b2" data-close>取消</button>`, (sh, close) => sh.querySelector('#go').onclick = async () => {
      close(); const me = await ensureCustomer(); if (me) await sb.from('customers').delete().eq('id', me.id); await sb.auth.signOut();
      S.consent = 'no'; S.me = null; S.ledger = S.ledger.filter(x => x.reason.startsWith('card')); S.buddies = []; S.notes = S.notes.filter(n => !n.db); S.inq = []; save(); toast('已撤回同意，雲端資料已刪除'); render(); });
  const del = el.querySelector('#del'); if (del) del.onclick = () => openSheet(`<h3>刪除全部資料？</h3><p>測驗、旅人檔案、收藏、點數、詢問與旅伴配對都會清除，無法復原。</p>
    <button class="btn1 b1 danger-b" id="go">確定刪除</button><button class="btn2 b2" data-close>取消</button>`, (sh, close) => sh.querySelector('#go').onclick = async () => {
      close(); if (online()) { const me = await ensureCustomer(); if (me) await sb.from('customers').delete().eq('id', me.id); await sb.auth.signOut(); }
      try { localStorage.removeItem(LS); } catch(e) {} location.href = baseUrl() + '#/home'; location.reload(); });
  const ex = el.querySelector('#exitDemo'); if (ex) ex.onclick = () => { try { localStorage.removeItem(LS); } catch(e) {} location.href = baseUrl() + '#/home'; location.reload(); };
  const oi = el.querySelector('#optin'); if (oi) oi.onclick = optIn;
  el.querySelector('#fb').onclick = () => { if (S.demo) return toast('示範帳號不會真的傳出'); openLine(lineMsg('意見回饋：')); };
  return el;
}

/* ----- 隱私與條款（課程原型草稿，正式版需永信法務審閱） ----- */
const LEGAL = {
  data: ['我們記錄什麼', [
    ['會記錄', '測驗答案與旅人角色；旅人檔案（出發條件、耐受度、興趣、聯絡偏好、生日月份）；暱稱、頭像、居住地區；收藏、比較、詢問、點數與旅伴配對；在 App 裡的操作事件（例如看了哪一團、按了哪個按鈕）。'],
    ['不會記錄', '真實姓名、電話、身分證字號、完整生日、照片、所在位置、通訊錄。'],
    ['用途', '推薦行程、讓顧問用交接代碼接手、發送你開啟的通知、計算點數與等級、以不具名的方式統計測驗與推薦成效。'],
    ['存在哪裡', 'Supabase 雲端資料庫（東京或新加坡機房）；只有你本人與負責顧問看得到個別資料，主管只看彙總數字。'],
    ['保存多久', '最後一次使用起 12 個月；課程專案結束後一併刪除。你也可以隨時在「設定 → 隱私與資料」刪除。'],
    ['試玩與示範帳號', '只存在這支手機的瀏覽器，不會上傳。']]],
  privacy: ['隱私權政策', [
    ['提供者', '本 App 為輔大創新創業社「永信旅遊」課程專案的原型，由課程團隊提供，不是永信旅遊的官方服務。'],
    ['蒐集方式', '你按「同意並開始測驗」後，才會建立匿名會員並儲存資料；不按同意則只存在這支手機。'],
    ['資料類別與用途', '見「我們記錄什麼」。'],
    ['分享對象', '不出售、不提供給第三方廣告；只在提供推薦與顧問服務必要的範圍內，由課程團隊與擔任顧問的成員存取。'],
    ['你的權利', '查詢、下載、更正、停止使用、刪除你的資料；撤回同意後，雲端資料會刪除。'],
    ['安全', '資料庫以列層級權限控管：旅客只能讀寫自己的資料；網頁只放公開金鑰，不放管理金鑰。'],
    ['政策更新', '更新時會在 App 內通知，並註明版本日期。'],
    ['版本', '草稿 2026/11/10；正式上線前須由永信旅遊法務審閱。']]],
  terms: ['服務條款', [
    ['服務內容', '旅行風格測驗、行程推薦、比較、旅伴共同推薦、點數與等級、顧問交接。'],
    ['行程與價格', 'App 內行程、價格、月份與名額皆為課程示意，以永信旅遊正式報價與契約為準。'],
    ['點數', '點數只在報名成交時折抵，每團折抵上限為團費 3%（示意），不得兌換現金、不可轉讓；有效期限以 App 顯示為準。'],
    ['帳號', '匿名會員以交接代碼辨識；請勿把代碼提供給不認識的人。'],
    ['禁止行為', '大量自動作答、冒用他人代碼、干擾系統運作。'],
    ['免責', '原型可能有錯誤或中斷，課程團隊會盡力修正；旅遊安全、簽證與保險資訊請以官方公告為準。'],
    ['版本', '草稿 2026/11/10。']]],
  notice: ['個人資料蒐集告知事項', [
    ['蒐集者', '輔大創新創業社「永信旅遊」課程團隊（課程原型）。'],
    ['蒐集目的', '行銷、客戶管理與服務（推薦行程、顧問接手、會員權益）、統計分析。'],
    ['個人資料類別', '暱稱、生日月份、居住地區、旅遊偏好與測驗答案、在 App 內的操作紀錄（屬可辨識個人之識別類、特徵類與社會情況類資料）。'],
    ['利用期間、地區、對象與方式', '期間：最後一次使用起 12 個月或課程結束時；地區：臺灣及雲端機房所在地；對象：課程團隊與擔任顧問的成員；方式：以電子方式處理與利用。'],
    ['當事人權利', '依個人資料保護法第 3 條，你可以查詢或請求閱覽、製給複製本、補充或更正、請求停止蒐集處理利用、請求刪除；在「設定 → 隱私與資料」即可操作。'],
    ['不提供的影響', '你可以不提供任何資料，仍能使用測驗與探索；只是推薦較不準，也不能使用交接代碼、點數與旅伴配對。']]]
};
function legalView(k){
  const L = LEGAL[k] || LEGAL.privacy;
  const el = $h(`<section class="pad legal">${topbar(L[0], {home:true})}
    <p class="muted small">輔大創新創業社課程原型・草稿 2026/11/10・非永信旅遊官方條款</p>
    ${L[1].map(([h, t]) => `<div class="lg-sec"><h3>${h}</h3><p>${t}</p></div>`).join('')}
    <p class="muted small">我們不是律師；本頁為原型草稿，正式版須由永信旅遊法務審閱。</p></section>`);
  bindBack(el, 'me/settings'); return el;
}

/* ===== 15 旅人檔案：一題一頁 ===== */
function cardQView(k, i){
  const card = CARDS.find(c => c.k === k); if (!card) { setTimeout(() => nav('me', true)); return $h('<section></section>'); }
  i = Math.min(Math.max(i, 0), card.qs.length - 1);
  const q = card.qs[i], v = S.prof[card.k] = S.prof[card.k] || {}, cur = v[q.id], last = i === card.qs.length - 1;
  const el = $h(`<section class="pad cardq">
    <header class="bar sticky"><button class="icon-btn" data-back aria-label="返回會員">${ic('back')}</button>
      <div class="qprog"><span>${card.t}・${i+1} / ${card.qs.length}</span><div class="prog"><i style="width:${(i+1)/card.qs.length*100}%"></i></div></div>
      <span class="pts-badge ${doneCard(card)?'got':''}">${doneCard(card)?'已完成':'+'+card.pts+' 點'}</span></header>
    <h2 class="qtitle">${q.t}</h2>
    <p class="muted">${q.h || card.use}；隨時可以改</p>
    <div class="opts">${q.o.map((o,j)=>{ const on = q.multi ? (cur||[]).includes(j) : cur === j;
      return `<button class="opt op" data-k="${j}" aria-pressed="${on}"><span class="ot"><b>${o}</b>${q.d?`<small>${q.d[j]}</small>`:''}</span></button>`; }).join('')}</div>
    <div class="qnav"><button class="btn2 b2" id="prev" ${i?'':'disabled'}>上一題</button><button class="btn1 b1" id="next">${last?'完成':'下一題'}</button></div>
  </section>`);
  bindBack(el, 'me');
  const go = async () => {
    save();
    if (!last) return nav(`me/card/${k}/${i+1}`, true);
    if (doneCard(card)) {
      if (addPoints(card.k, `完成「${card.t}」`, card.pts)) { plusPop(card.pts); addNote('perk', `完成「${card.t}」+${card.pts} 點`, card.use, '#/pass/points'); if (completion() === 100) addNote('perk', '旅人檔案完成，解鎖「啟程」禮遇', '生日月小禮與角色卡已開啟。', '#/pass'); track('profile_card', { card:card.k }); }
      else toast('已更新');
    } else toast('已儲存，還有題目沒填');
    pushProfile(); back('me');
  };
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => { const j = +b.dataset.k;
    if (q.multi) { const s = new Set(v[q.id]||[]); s.has(j)?s.delete(j):s.add(j); v[q.id] = [...s]; b.setAttribute('aria-pressed', s.has(j)); save(); return; }
    v[q.id] = j; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b)); save(); setTimeout(go, 220); });
  el.querySelector('#prev').onclick = () => { dir = 'back'; nav(`me/card/${k}/${i-1}`, true); };
  el.querySelector('#next').onclick = go;
  return el;
}

/* ===== 啟動 ===== */
/* 從 QR、連結直接打開深層頁面時，先在歷史紀錄墊上層頁面，手機返回鍵會一路回到首頁，不會直接跳出 App */
(() => { const start = location.hash.startsWith('#/') ? location.hash.slice(2) : 'home', chain = [start];
  for (let p = parentOf(start); p; p = parentOf(p)) chain.unshift(p);
  if (chain[0] !== 'home' && chain[0] !== '') chain.unshift('home');
  history.replaceState({i:0}, '', '#/' + chain[0]);
  for (let k = 1; k < chain.length; k++) history.pushState({i:++curIdx}, '', '#/' + chain[k]); })();
render();
loadRemote().then(() => render());
