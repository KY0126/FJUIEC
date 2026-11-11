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
  prof:{card_a:{companion:2,months:[0],days:1,budget:3,leave:{who:'work',left:14,max:7,busy:[10,11],rest:false}}, card_b:{hot:0,walk:1,maxDrive:0,shop:0}},
  favs:['巴黎精品與甜點 10 天｜巴黎連泊、精品自由逛、購物後司機送回飯店'],
  buddy:{nickname:'怡君', role_key:'rabbit', answers:{q1:2,q2:1,q3:0,q4:2,q5:2,q6:1,q7:2,q8:2,q9:2,q10:2,q11:1,q12:[1]},
         card_a:{months:[0,1],budget:2,leave:{who:'work',max:7,busy:[6,7],rest:false}}, card_b:{shop:0}, demo:true}
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
  inq:[], avatar:null, region_tw:null, prefs:{}, fltDefault:null, photo:null, photoOn:false,
  intro:null, reminders:[], stage:'deciding', polls:[], groups:[], pendPoll:null, pendJoin:null, metoo:[], demoPoll:null, demoGroup:null},
  (()=>{try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return {}}})());
S.me = null;
const DEMO_VER = 7;   // 示範帳號資料版本：App 加了新功能時調高，舊手機上的示範帳號會自動補齊
if (S.demo && S.demoVer !== DEMO_VER) {
  Object.assign(S, { photo:'img/lin.jpg', photoOn:true, avatar:S.avatar || 'cat', region_tw:S.region_tw || '北部', nickname:S.nickname || '林雅婷', demoVer:DEMO_VER });
  if (S.prof) { S.prof.card_a = S.prof.card_a || {}; if (!S.prof.card_a.leave) S.prof.card_a.leave = JSON.parse(JSON.stringify(DEMO.prof.card_a.leave)); }
  (S.buddies || []).forEach(b => { if (b.demo) b.card_a = JSON.parse(JSON.stringify(DEMO.buddy.card_a)); });
  S.stage = 'deciding';
  if (!S.inq || !S.inq.length) S.inq = [{ trip:'巴黎精品與甜點 10 天｜巴黎連泊、精品自由逛、購物後司機送回飯店', status:'replied', at:new Date(Date.now() - .3*864e5).toISOString() }];
  if (S.inq && !S.inq.some(q => q.trip.startsWith('北歐極光'))) S.inq.push({ trip:TRIPS[tripId('北歐極光')].name, status:'replied', at:new Date(Date.now() - 2*864e5).toISOString() });
}
state.ans = S.ans || {}; if (S.pace) { state.pace = S.pace; state.view = S.view || S.pace; }
const _qs = new URLSearchParams(location.search), invParam = _qs.get('inv'); if (invParam) { S.inv = invParam.toUpperCase().slice(0,6); }
if (_qs.get('poll')) S.pendPoll = _qs.get('poll').toUpperCase().slice(0,6);
if (_qs.get('join')) S.pendJoin = _qs.get('join').toUpperCase().slice(0,6);
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
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* 行程卡展開：瀏覽器支援 View Transitions 時，卡片封面直接放大成行程頁封面；不支援就用原本的滑入 */
let vtTrip = null;
function withVT(fn){ if (!document.startViewTransition || reducedMotion()) return fn(); document.documentElement.classList.add('vt'); const t = document.startViewTransition(fn); t.finished.finally(() => { document.documentElement.classList.remove('vt'); document.querySelectorAll('.cover-art').forEach(c => c.style.viewTransitionName = ''); }); }
const scrollMem = {};                       // 每一筆歷史紀錄離開時捲到哪裡，返回時還原
function nav(p, replace, extra={}){ const h = '#/' + p;
  if (replace) history.replaceState({i:curIdx, ...extra}, '', h);
  else { scrollMem[curIdx] = scrollY; history.pushState({i:++curIdx, ...extra}, '', h); }
  render(); }
window.addEventListener('popstate', e => { const i = e.state && typeof e.state.i === 'number' ? e.state.i : null;
  if (i === null) { scrollMem[curIdx] = scrollY; history.replaceState({i:++curIdx}, '', location.hash); } else { if (i < curIdx) dir = 'back'; curIdx = i; }
  const leavingTrip = document.querySelector('.trip-cover');
  if (leavingTrip && vtTrip !== null && document.startViewTransition && !reducedMotion()) withVT(() => render()); else render(); });
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (!a || e.defaultPrevented) return;
  e.preventDefault(); const p = a.getAttribute('href').slice(2); if ('#/' + p === location.hash) return;
  const cv = a.querySelector('.cover-art');
  if (cv && /^trip\/\d+$/.test(p) && document.startViewTransition && !reducedMotion()) { cv.style.viewTransitionName = 'trip-cover'; vtTrip = +p.split('/')[1]; withVT(() => { cv.style.viewTransitionName = ''; nav(p); }); return; }
  nav(p); });
/* 上一頁：App 內有上一頁就回去；從 QR、連結或通知直接打開的，回到這頁的上層，不會跳出 App */
function parentOf(p){ const r = p.split('/');
  if (r[0] === 'trip' || r[0] === 'compare') return 'explore';
  if (r[0] === 'team') return 'me';
  if (r[0] === 'me' && r[1] === 'legal') return 'me/settings';
  if (['explore','pass','me','inbox'].includes(r[0]) && r[1]) return r[0];
  if (!r[0] || r[0] === 'home') return null;
  return 'home'; }
function back(fallback){ dir = 'back'; if (curIdx > 0) history.back(); else nav(fallback || parentOf(route().join('/')) || 'home', true); }
const GATED = new Set(['buddy','pass','compare','advisor','team']);
const TABS = [['home','首頁'],['explore','探索'],['buddy','旅伴'],['pass','護照'],['me','會員']];
const TAB_ROOTS = new Set(['home','explore','buddy','pass','me']);
const NO_TOP = new Set(['quiz','welcome','result']);

function render(){
  const r = route(), app = document.getElementById('app');
  if (GATED.has(r[0]) && !S.quizDone) { S.after = r.join('/'); save(); return nav('welcome', true); }
  const views = {home:()=>S.quizDone?homeView():homeNewView(), welcome:welcomeView, quiz:quizView, result:resultView,
    explore:()=>r[1]==='map'?mapView():exploreView(), trip:tripView, compare:compareView, buddy:buddyView, pass:()=>r[1]==='points'?pointsView():passView(),
    me:()=>({card:()=>cardQView(r[2], +r[3]||0), edit:editView, settings:settingsView, favs:favsView, inquiries:inquiriesView, legal:()=>legalView(r[2]), intro:introView, leave:leaveView, trips:tripsView, colors:colorsView}[r[1]] || meView)(), team:teamView, inbox:inboxView, advisor:advisorView};
  onScroll = null; clearInterval(flipTimer);
  const v = (views[r[0]] || views.home)(), goingBack = dir === 'back';
  v.classList.add('screen', goingBack ? 'in-back' : 'in-fwd'); dir = 'fwd';
  v.querySelectorAll('[data-back]').forEach(b => { if (!b.onclick) b.onclick = () => back(); });
  v.querySelectorAll('[data-top]').forEach(b => { if (!b.onclick) b.onclick = toTop; });
  app.replaceChildren(v); startFlips(v);
  if (vtTrip !== null && r[0] !== 'trip') { const tl = v.querySelector(`a.tile[href="#/trip/${vtTrip}"] .cover-art`); if (tl) tl.style.viewTransitionName = 'trip-cover'; vtTrip = null; }
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
/* 頭像：示範帳號有照片時，照片與角色頭像每 4 秒翻面；點一下手動翻 */
function avatarHTML(cls){
  const P = PACES[avatarKey()], T = TIERS[tierIdx()];
  if (S.photo && S.photoOn) return `<span class="${cls} flip" role="button" tabindex="0" aria-label="頭像：照片與${P.short}頭像輪流顯示，點一下翻面"><span class="flip-in"><span class="face front"><img src="${S.photo}" alt="${esc(S.nickname)}（示意照片）"></span><span class="face back">${av(P.ch, T[0])}</span></span></span>`;
  return `<div class="${cls}">${av(P.ch, T[0])}</div>`;
}
function startFlips(el){
  const fls = [...el.querySelectorAll('.flip')]; if (!fls.length) return;
  const turn = () => fls.forEach(f => f.classList.toggle('flipped'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  fls.forEach(f => { f.onclick = e => { e.preventDefault(); e.stopPropagation(); f.classList.toggle('flipped'); clearInterval(flipTimer); if (!reduced) flipTimer = setInterval(turn, 4000); };
    f.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') f.onclick(e); }; });
  if (!reduced) flipTimer = setInterval(turn, 4000);
}
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
function showFabTip(){ if (S.fabTip) return; if (document.querySelector('.splash')) return setTimeout(showFabTip, 2600); S.fabTip = true; save(); fabs.tip.hidden = false; setTimeout(() => fabs.tip.hidden = true, 3000); }
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
  if (p.data) { CARDS.forEach(c => { if (p.data[c.k]) S.prof[c.k] = p.data[c.k]; }); if (p.data.intro) S.intro = p.data.intro; }
  if (f.data) S.favs = f.data.map(x => x.trip_name);
  if (n.data) { const local = S.notes.filter(x => !x.db); S.notes = [...n.data.map(dbNote), ...local]; }
  if (l.data && l.data.length) { const reasons = new Set(l.data.map(x=>x.reason)); S.ledger = [...l.data.map(x=>({reason:x.reason,label:x.label,points:x.points,status:x.status,at:x.created_at})), ...S.ledger.filter(x=>!reasons.has(x.reason))]; }
  if (me.role_key && !state.pace) { state.pace = me.role_key; state.view = me.role_key; state.ans = me.answers || {}; S.quizDone = true; }
  if (me.nickname) S.nickname = me.nickname;
  if (typeof me.trips_taken === 'number') { if (S.lastTrips != null && me.trips_taken > S.lastTrips) welcomeBackMoment((S.inq[0] || {}).trip || ''); S.lastTrips = me.trips_taken; }
  if (me.avatar_key) S.avatar = me.avatar_key; if (me.region) S.region_tw = me.region;
  if (me.prefs && Object.keys(me.prefs).length) { const { line, filters, ...rest } = me.prefs; S.prefs = rest; if (line !== undefined) S.lineSync = line; if (filters) S.fltDefault = filters; }
  const iq = await sb.from('inquiries').select('trip_name,status,created_at').eq('customer_id', me.id).order('created_at', {ascending:false});
  if (iq.data) S.inq = iq.data.map(x => ({ trip:x.trip_name, status:x.status, at:x.created_at }));
  await loadBuddies();
  save(); processPending();
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
  if (S.intro) row.intro = S.intro;
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
  await pushProfile(); save(); processPending();
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
    if (prof === S.prof) { const lw = lvWhy(t, A.leave); if (lw) { if (lw.warn) { x.s -= 1.5; x.warn = lw.warn; } else if (lw.chip) x.why.push(lw.chip); } }
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
      <span class="muted">步行${WALK[t.walk]}・車程 ${t.maxDrive}h・${t.shop?'含購物站':'無購物站'}${opts.fit!=null?`・合拍 ${opts.fit}%`:''}</span>${x.warn?`<span class="lv-w">${x.warn}</span>`:''}</a>
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
    ${S.inv||S.pendPoll||S.pendJoin?`<p class="inv-note">${S.pendJoin?'旅伴邀你一起揪團':S.pendPoll?'旅伴邀你一起投票':'你的旅伴邀請你一起測'}；按「同意並開始測驗」，做完就會自動加入。</p>`:''}
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
    avatar:'cat', photo:'img/lin.jpg', photoOn:true, demoVer:DEMO_VER, stage:'deciding', region_tw:'北部', prefs:{}, fltDefault:null, inq:[{trip:TRIPS[tripId('巴黎精品與甜點')].name, status:'replied', at:daysAgo(.3)}, {trip:TRIPS[tripId('北歐極光')].name, status:'replied', at:daysAgo(2)}] });
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
  save();
  if (online()) pushQuiz().then(() => track('quiz_complete', { role:state.pace }));
  revealThen(() => nav('result', true));
}

/* ===== 02b 結果揭曉動畫：地圖亮起 → 推近第一站 → 角色卡翻面（約 1.5 秒，點一下跳過） ===== */
function revealThen(go){
  if (reducedMotion()) return go();
  const top = mine()[0].t, g = regionOf(top), on = new Set(g.cc), P = PACES[state.view];
  const el = document.createElement('div'); el.className = 'reveal';
  el.innerHTML = `<svg class="rv-map" viewBox="40 60 720 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${GEO.filter(x => HOME[x.c]).map(x => `<path class="${on.has(x.c)?'hit':''}" d="${x.d}"/>`).join('')}</svg>
    <p class="rv-msg">正在找你的歐洲…<small>比對 12 題答案與 ${TRIPS.length} 團行程</small></p>
    <div class="rv-card"><div class="rv-face back">?</div><div class="rv-face front"><div class="rv-av">${av(P.ch,'start')}</div><b>${P.name}</b><span>${P.alias}</span></div></div>`;
  document.body.append(el);
  const svg = el.querySelector('svg'), msg = el.querySelector('.rv-msg');
  const bb = [...svg.querySelectorAll('path.hit')].map(p => p.getBBox()).reduce((a, b) => ({ x:Math.min(a.x,b.x), y:Math.min(a.y,b.y), x2:Math.max(a.x2,b.x+b.width), y2:Math.max(a.y2,b.y+b.height) }), { x:1e9, y:1e9, x2:-1e9, y2:-1e9 });
  const cx = (bb.x + bb.x2) / 2, cy = (bb.y + bb.y2) / 2, w1 = Math.max(160, (bb.x2 - bb.x) * 2.6);
  let finished = false; const timers = [];
  const end = () => { if (finished) return; finished = true; timers.forEach(clearTimeout); go(); el.classList.add('out'); setTimeout(() => el.remove(), 300); };
  el.addEventListener('click', end);
  timers.push(setTimeout(() => { el.classList.add('lit'); const t0 = performance.now();
    const step = now => { if (finished) return; const k = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - k, 3), w = 720 + (w1 - 720) * e, h = w * 680 / 720;
      svg.setAttribute('viewBox', `${40 + (cx - w/2 - 40) * e} ${60 + (cy - h/2 - 60) * e} ${w} ${h}`); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); msg.innerHTML = `你的第一站：${g.full.replace(/（.*）/,'').split('・')[0]}<small>${short(top)}</small>`; }, 300));
  timers.push(setTimeout(() => el.classList.add('flip'), 850));
  timers.push(setTimeout(end, 1550));
}

/* ===== 02c 重要時刻：生日卡、準備出發、歡迎回來（手寫動畫，showMoment 在 splash.js） ===== */
const afterSplash = fn => document.querySelector('.splash') ? setTimeout(() => afterSplash(fn), 400) : fn();
function checkBirthday(){
  const bm = birthMonth(), now = new Date(); if (bm === null || bm !== now.getMonth() || !S.quizDone) return;
  const key = `${now.getFullYear()}-${bm}`; if (S.bdayShown === key) return;
  S.bdayShown = key; save();
  if (!S.notes.some(n => n.title === '生日月禮' && new Date(n.at).getMonth() === bm)) addNote('perk', '生日月禮', '這個月是你的生日月，憑交接代碼領香氛小樣一份。', '#/pass');
  afterSplash(() => showMoment({ hand:'生日快樂', sub:`${esc(S.nickname || '旅人')}，這個月是你的生日月`,
    extra:`<div class="mo-gift">${ic('gift')}<span>生日月禮：憑交接代碼到門市或請顧問寄送香氛小樣一份（示意）</span></div>` }));
  track('moment', { kind:'birthday' });
}
function departMoment(trip, sub, key){
  S.seenMoments = S.seenMoments || []; if (S.seenMoments.includes(key)) return;
  S.seenMoments.push(key); save();
  const t = TRIPS.find(x => x.name === trip || x.name.startsWith(trip)); const lit = t ? regionOf(t).cc : [];
  afterSplash(() => showMoment({ hand:'準備出發', sub, lit })); track('moment', { kind:'depart' });
}
function welcomeBackMoment(trip){
  const t = TRIPS.find(x => x.name === trip || x.name.startsWith(trip)) || mine()[0].t, g = regionOf(t);
  const nxt = mine().find(x => x.t.region !== t.region);
  afterSplash(() => showMoment({ hand:'歡迎回來', lit:g.cc, seq:true, hold:2,
    sub:`${short(t)}・足跡點亮 ${g.cc.length} 國，回國回饋 200 點入帳`,
    extra: nxt ? `<div class="mo-next">下一站推薦：<b>${short(nxt.t)}</b><span>${esc(nxt.why.slice(0,2).join('・'))}</span></div>` : '' }));
  track('moment', { kind:'welcome_back' });
}

/* ===== 02d 分享角色卡：3 秒動態影片（或圖片）＋連結 ===== */
function shareRoleSheet(){
  const P = PACES[state.view], link = baseUrl().replace(/app\/?$/, 'find-my-europe');
  const txt = `我是「${P.name}」（${P.alias}）！一分鐘測你是哪一種歐洲旅人：${link}`;
  openSheet(`<h3>分享角色卡</h3>
    <button class="sheet-opt op" id="clip"><b>動態角色卡（3 秒影片）</b><span>手寫「我是${P.short}」＋底線，適合 IG 限動、LINE</span></button>
    <button class="sheet-opt op" id="link"><b>只傳連結</b><span>朋友點開就能做測驗</span></button>
    <div id="prog" hidden>${loaderHTML('製作中')}</div>
    <button class="btn2 b2" data-close>取消</button>`, (sh, close) => {
    sh.querySelector('#link').onclick = () => { close(); track('share', { what:'role_link' }); shareText(txt); };
    sh.querySelector('#clip').onclick = async () => {
      sh.querySelector('#prog').hidden = false; sh.querySelectorAll('.sheet-opt').forEach(b => b.disabled = true);
      try {
        const r = await makeRoleClip({ roleShort:P.short, roleName:P.name, alias:P.alias, avatarSVG:av(P.ch, TIERS[tierIdx()][0]) });
        const file = new File([r.blob], `travel-role-${state.view}.${r.ext}`, { type:r.type }); close(); track('share', { what:'role_clip', ext:r.ext });
        if (navigator.canShare && navigator.canShare({ files:[file] })) { try { await navigator.share({ files:[file], text:txt }); return; } catch(e) { if (e.name === 'AbortError') return; } }
        const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.append(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); toast(r.ext === 'png' ? '已存成圖片（這支手機不支援錄影片）' : '已下載動態角色卡');
      } catch(e) { close(); toast('製作失敗，改傳連結'); shareText(txt); }
    };
  });
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
    <div class="r-bars grow">${top3.map(k=>`<div class="rb ${k===state.pace?'top':''}"><span>${PACES[k].short}</span><div class="prog"><i style="width:${Math.round(sh[k]*100)}%"></i></div><b>${Math.round(sh[k]*100)}%</b></div>`).join('')}</div>
    <button class="btn1 b1" id="go">看我的 3 團推薦</button>
    <button class="btn2 b2" id="share">分享角色卡</button>
    <a class="txt-link" href="#/buddy">邀請旅伴一起測</a>
    ${S.inv && S.consent!=='yes' ? '<p class="inv-note">試玩模式不會和邀請你的旅伴配對；到「會員」成為會員（同意儲存）後就會配對。</p>' : ''}
  </section>`);
  el.querySelector('#go').onclick = () => { const a = S.after; S.after = null; save(); nav(a || 'home', true); };
  el.querySelector('#share').onclick = () => shareRoleSheet();
  return el;
}

/* ===== 04 首頁（測驗後） ===== */
function homeView(){
  const P = PACES[state.view], list = mine().slice(0,3), c = completion(), T = TIERS[tierIdx()], b = S.buddies[0];
  const el = $h(`<section class="pad">
    <div class="home-h"><div><p>${greet()}${S.nickname?`，${esc(S.nickname)}`:''}</p><h1>${P.name}</h1></div>
      <a class="icon-btn bell" href="#/inbox" aria-label="通知">${ic('bell')}${unread()?`<i class="badge">${unread()}</i>`:''}</a></div>
    ${S.demo?'<p class="demo-tag">示範帳號・不會存檔</p>':''}
    <a class="pass-card b3" href="#/pass">${avatarHTML('pc-av')}
      <div><b>${P.short}・${T[1]}等級</b><span>${points()} 點・可折抵 ${points()} 元</span></div>${ic('chev','end')}</a>
    ${c<100?`<a class="prof-row op" href="#/me"><div><b>旅人檔案 ${c}%</b><span>補完再拿 ${cardPtsLeft()} 點</span></div><div class="prog"><i style="width:${c}%"></i></div></a>`:''}
    <div class="sec-h"><h2>為你推薦</h2><a href="#/explore">全部</a></div>
    <div class="tiles">${list.map(tripTile).join('')}</div>
    <div class="quick">
      <a class="q op" href="#/compare">${ic('cmp')}<span>比較行程</span></a>
      <a class="q op" href="#/buddy">${ic('buddy')}<span>邀請旅伴</span></a>
      <a class="q op" href="#/explore/map">${ic('map')}<span>探索地圖</span></a>
      <a class="q op" href="#/advisor">${ic('chat')}<span>找顧問</span></a></div>
    ${(() => { const L = myLeave(); return L && L.at && +L.at.slice(0,4) < new Date().getFullYear() ? `<a class="buddy-banner op" href="#/me/leave">新的一年，特休重新計算了：<b>更新請假條件</b> ${ic('chev','end')}</a>` : ''; })()}
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
      ${leaveBox(t)}
    </div>
    <div class="buy-bar"><div><span>每人</span><b>${t.from.toFixed(1)} 萬起</b>${t.est?'<small>示意價格</small>':''}</div>
      <button class="btn2 b2" id="cmp">${inCmp?'已加入比較':'加入比較'}</button><button class="btn1 b1" id="ask">我想了解</button></div>
  </section>`);
  bindBack(el, 'explore');
  el.querySelector('#fv').onclick = e => toggleFav(t.name, e.currentTarget);
  const bar = el.querySelector('.trip-top'); onScroll = y => bar.classList.toggle('solid', y > 100);
  el.querySelector('#cmp').onclick = () => { if (!S.quizDone) return toast('做完一分鐘測驗就能比較行程'); toggleCmp(i); if (S.cmp.includes(i) && S.cmp.length >= 2) nav('compare'); else render(); };
  el.querySelector('#ask').onclick = () => nav('advisor/' + i);
  bindLeave(el, t);
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
      <div class="rows">${B.joint.map(j => `<div class="row-card op"><a class="rc-main" href="#/trip/${TRIPS.indexOf(j.t)}"><b>${short(j.t)}</b><span>${j.why}</span><span class="muted">${j.t.from.toFixed(1)} 萬起・${j.t.months}</span>${commonLine(j.t, buddyLeave(b))}</a><button class="cmp-tg grp-btn" data-group-from="${TRIPS.indexOf(j.t)}">揪這團</button></div>`).join('')}</div>
      ${S.buddies.length>1?`<p class="muted small">另外還有 ${S.buddies.length-1} 位旅伴：${S.buddies.slice(1).map(x=>esc(x.nickname||PACES[x.role_key].short)).join('、')}</p>`:''}`; }
  const el = $h(`<section class="pad">
    ${head('旅伴', {big:true, back:'auto', right:'<button class="txt-btn" id="inv">＋ 邀請</button>'})}
    ${body}
    <div class="sec-h"><h2>一起決定</h2><button class="txt-btn" id="newPoll">＋ 發起投票</button></div>
    <div id="polls">${loaderHTML()}</div>
    <div class="sec-h"><h2>揪團</h2><span class="muted small">湊滿有優惠＋點數</span></div>
    <div id="groups"></div>
  </section>`);
  el.querySelector('#newPoll').onclick = () => pollSheet(b ? buddyInfo(b).joint.concat(mine().slice(0,3)).filter((x,i,arr)=>arr.findIndex(y=>y.t===x.t)===i) : mine().slice(0,4));
  el.querySelectorAll('.rows [data-group-from]').forEach(x => x.onclick = () => groupSheet(+x.dataset.groupFrom));
  fillSocial(el);
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

/* ===== 09b 自我介紹模板：依作答產生，三種版本，可增減標籤、換一句、自己改 ===== */
const TAG_DEF = {
  '愛美食':['like','吃在地美食','有推薦的小店請告訴我！'], '愛建築藝術':['like','看建築和美術館','有順路的展覽歡迎揪我！'],
  '追花季':['like','看花季','花開的地方一起拍照吧！'], '追極光':['like','看極光','極光夜一起熬夜吧！'],
  '愛咖啡甜點':['like','吃甜點喝咖啡','有好吃的甜點店歡迎推薦！'], '愛逛美術館':['like','逛美術館','有順路的展覽歡迎揪我！'],
  '聽音樂會':['like','聽音樂會','有音樂會可以一起去！'], '愛逛街':['like','逛街','自由時間可以一起逛！'],
  '愛拍照':['like','拍照','需要拍照可以找我！'], '愛巷弄小店':['like','找巷弄小店','有推薦的小店請告訴我！'],
  '愛聽在地故事':['like','聽在地故事','有好玩的小故事歡迎分享！'], '愛名景打卡':['like','去名景打卡','一起拍經典照吧！'],
  '慢慢逛':['style','慢慢逛'], '跟著導覽走':['style','把精華一次看完'], '半導覽半自由':['style','半天導覽半天自由'],
  '名店先拍再找小店':['style','名店先拍、再找在地小店'],
  '怕熱':['avoid','比較怕熱'], '不愛購物站':['avoid','不太愛購物站'], '怕長途拉車':['avoid','怕長途拉車'],
  '要有自由時間':['avoid','喜歡有自由時間'], '喜歡連泊':['avoid','喜歡連泊不換飯店'], '走路慢慢來':['avoid','走路慢慢來']
};
function introPool(ans = state.ans, prof = S.prof, role = state.view){
  const out = [], add = t => { if (t && !out.includes(t)) out.push(t); }, C = prof.card_c || {}, B = prof.card_b || {};
  add(['愛美食','愛建築藝術','追花季','追極光','愛咖啡甜點'][ans.q6]);
  (C.interests || []).forEach(i => add(['愛咖啡甜點','愛逛美術館','聽音樂會','追極光','愛逛街','愛美食','愛拍照'][i]));
  add({slow:'慢慢逛', precise:'跟著導覽走', balanced:'半導覽半自由'}[PACES[role] && PACES[role].tempo]);
  (ans.q12 || []).forEach(i => add(['喜歡連泊','不愛購物站','怕長途拉車','要有自由時間','怕熱'][i]));
  if (B.hot === 0) add('怕熱'); if (B.shop === 0) add('不愛購物站'); if (B.walk === 0) add('走路慢慢來');
  add({0:'愛聽在地故事', 2:'愛名景打卡'}[ans.q5]);
  add({0:'愛巷弄小店', 2:'愛名景打卡', 3:'名店先拍再找小店'}[ans.q9]);
  add({0:'愛巷弄小店', 1:'名店先拍再找小店'}[C.explore]);
  return out;
}
const AVOID_ORDER = ['怕熱','不愛購物站','怕長途拉車','要有自由時間','走路慢慢來','喜歡連泊'];   // 最常讓人不舒服的排前面
function defaultTags(pool){ const pick = t => pool.find(x => TAG_DEF[x][0] === t);
  const avoid = AVOID_ORDER.find(x => pool.includes(x));
  return [pick('like'), pick('style'), avoid].filter(Boolean).slice(0, 3); }
const TONES = [['short','一句話'],['std','標準'],['invite','揪人版']];
function introText(tone, tags, v = 0, nick = S.nickname, role = state.view){
  const P = PACES[role], kind = k => tags.find(t => TAG_DEF[t] && TAG_DEF[t][0] === k);
  const like = kind('like'), sty = kind('style'), avoid = kind('avoid');
  const likeV = like ? TAG_DEF[like][1] : '', avoidV = avoid ? TAG_DEF[avoid][1] : '', styV = sty ? TAG_DEF[sty][1] : '';
  const ask = like ? TAG_DEF[like][2] : '請多指教！', me = nick ? `我是${nick}，` : '';
  const T = {
    short: [`${P.short}一枚，${[like, avoidV].filter(Boolean).join('、')}，請多指教！`,
            `${P.short}報到！${[likeV && '喜歡' + likeV, avoidV].filter(Boolean).join('，')}。`,
            `${me}${P.short}，${[styV, likeV].filter(Boolean).join('、')}，${ask}`],
    std:   [`嗨，${me}測出來是${P.short}（${P.name}）。${likeV ? '喜歡' + likeV : ''}${styV ? (likeV ? '，習慣' : '習慣') + styV : ''}${avoidV ? '；' + avoidV : ''}。${ask}`,
            `大家好，${me}旅人角色是${P.short}。這趟想${[styV, likeV].filter(Boolean).join('、') || '好好放鬆'}${avoidV ? '，' + avoidV : ''}。${ask}`],
    invite:[`我是${P.short}，這趟想${[styV || '好好玩', likeV].filter(Boolean).join('、')}${avoidV ? '，' + avoidV : ''}，一起來嗎？`,
            `找旅伴！${P.short}一枚，想${likeV || styV || '放鬆一下'}${avoidV ? '，' + avoidV : ''}，有興趣嗎？`]
  }[tone] || [];
  return (T[v % T.length] || '').replace(/，，/g, '，').replace(/。。/g, '。').replace(/，。/g, '。');
}
const CONTACT_RE = /((\+?886|0)9\d{2}[- ]?\d{3}[- ]?\d{3})|(\d{2,4}[- ]?\d{3,4}[- ]?\d{3,4})|https?:\/\/|www\.|line\s*(id)?\s*[:：]|@[a-z0-9_.]{3,}|[\w.+-]+@[\w-]+\.[\w.]+/i;
function myIntro(){
  const pool = introPool();
  if (S.intro) return S.intro;
  const tags = defaultTags(pool);
  return { tone:'short', tags, v:0, text:introText('short', tags, 0), custom:false, vis:'team' };
}
function introView(){
  const pool = introPool(), it = JSON.parse(JSON.stringify(myIntro()));
  const el = $h(`<section class="pad intro-ed">${topbar('我的自我介紹', {home:true})}
    <p class="muted small">依你的測驗與旅人檔案自動產生，不用打字；可以換版本、增減標籤，也能自己改。</p>
    <div class="seg seg3">${TONES.map(([k,l])=>`<button data-tone="${k}" aria-current="${it.tone===k?'page':'false'}">${l}</button>`).join('')}</div>
    <div class="fld"><span>標籤（最多 5 個，點一下拿掉）</span><div class="chips-s" id="tags"></div></div>
    <div class="fld"><span>從你的作答再加</span><div class="chips-s" id="pool"></div></div>
    <label class="fld"><span>介紹文字</span><textarea id="tx" maxlength="60" rows="3"></textarea><small id="cnt"></small><small class="warn-t" id="warn" hidden>這裡會給同團的人看到，電話、LINE ID、網址請私下交換</small></label>
    <div class="row2"><button class="btn2 b2" id="next">換一句</button><button class="btn2 b2" id="reset">回到模板</button></div>
    <div class="fld"><span>預覽：團友看到的角色卡</span><div id="pv"></div></div>
    <div class="fld"><span>公開範圍</span><div class="seg seg3" id="vis">${[['team','只給領隊'],['all','全團'],['none','不公開']].map(([k,l])=>`<button data-vis="${k}" aria-current="${it.vis===k?'page':'false'}">${l}</button>`).join('')}</div>
      <small>預設只給領隊；隨時可以改或收回。不顯示照片與真實姓名</small></div>
    <button class="btn1 b1" id="save">儲存</button></section>`);
  bindBack(el, 'me');
  const tx = el.querySelector('#tx');
  const regen = () => { if (!it.custom) it.text = introText(it.tone, it.tags, it.v); draw(); };
  const draw = () => {
    el.querySelector('#tags').innerHTML = it.tags.map(t => `<button class="fc on" data-rm="${t}">${t} ✕</button>`).join('') || '<span class="muted small">至少選一個</span>';
    el.querySelector('#pool').innerHTML = pool.filter(t => !it.tags.includes(t)).map(t => `<button class="fc" data-add="${t}">＋ ${t}</button>`).join('') || '<span class="muted small">沒有更多了</span>';
    tx.value = it.text; el.querySelector('#cnt').textContent = `${it.text.length}／60 字${it.custom ? '・已自訂' : ''}`;
    el.querySelector('#warn').hidden = !CONTACT_RE.test(it.text);
    el.querySelector('#pv').innerHTML = mateCard({ nick:S.nickname || '旅人', role:state.view, tags:it.tags, text:it.text, me:true });
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { it.tags = it.tags.filter(x => x !== b.dataset.rm); regen(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (it.tags.length >= 5) return toast('最多 5 個標籤'); it.tags.push(b.dataset.add); regen(); });
  };
  el.querySelectorAll('[data-tone]').forEach(b => b.onclick = () => { it.tone = b.dataset.tone; it.v = 0; it.custom = false; el.querySelectorAll('[data-tone]').forEach(x => x.setAttribute('aria-current', x === b ? 'page' : 'false')); regen(); });
  el.querySelectorAll('[data-vis]').forEach(b => b.onclick = () => { it.vis = b.dataset.vis; el.querySelectorAll('[data-vis]').forEach(x => x.setAttribute('aria-current', x === b ? 'page' : 'false')); });
  el.querySelector('#next').onclick = () => { it.v++; it.custom = false; regen(); };
  el.querySelector('#reset').onclick = () => { it.custom = false; it.v = 0; regen(); };
  tx.oninput = () => { it.text = tx.value; it.custom = true; el.querySelector('#cnt').textContent = `${it.text.length}／60 字・已自訂`; el.querySelector('#warn').hidden = !CONTACT_RE.test(it.text);
    el.querySelector('#pv').innerHTML = mateCard({ nick:S.nickname || '旅人', role:state.view, tags:it.tags, text:it.text, me:true }); };
  el.querySelector('#save').onclick = () => {
    if (CONTACT_RE.test(it.text)) return toast('請拿掉電話、LINE ID 或網址再儲存');
    if (!it.tags.length) return toast('至少留一個標籤');
    S.intro = { ...it, updated_at:new Date().toISOString() }; save(); pushProfile(); toast('已儲存自我介紹'); back('me');
  };
  draw(); return el;
}
function mateCard(m, opts = {}){
  const P = PACES[m.role] || PACES.alice, mine = new Set((myIntro().tags) || []);
  return `<div class="mate ${m.me?'me':''}"><div class="mate-av">${av(P.ch,'start')}</div><div class="mate-b">
    <div class="mate-h"><b>${esc(m.nick)}</b><span>${P.short}</span>${m.me&&opts.vis?`<em>${({team:'只給領隊',all:'全團公開',none:'不公開'})[opts.vis]}</em>`:''}</div>
    <p>${esc(m.text)}</p><div class="mate-tags">${(m.tags||[]).map(t => opts.metoo && !m.me ? `<button class="metoo ${S.metoo.includes(m.nick+'|'+t)?'on':''} ${mine.has(t)?'same':''}" data-mt="${esc(m.nick)}|${t}">${t}${mine.has(t)?'・我也是':''}</button>` : `<i>${t}</i>`).join('')}</div></div></div>`;
}

/* ===== 09c 投票與揪團 ===== */
const GROUP_PERKS = '揪團方案（示意，待業師確認）：2 人同行第二人折 2,000 元；4 人成團加贈旅行周邊；湊滿每人 +100 點';
const VOTE_L = ['不行','可以','想去'];
function demoPoll(){ const t = q => TRIPS[tripId(q)].name;
  return S.demoPoll || (S.demoPoll = { code:'DEMO01', mine:true, owner:S.nickname, trips:[t('巴黎精品與甜點'), t('西葡'), t('北歐極光')],
    votes:[{ nick:'林雅婷', role:'cat', votes:[2,1,1], months:[0], me:true }, { nick:'怡君', role:'rabbit', votes:[2,0,1], months:[0,1] }] }); }
function demoGroup(){ return S.demoGroup || (S.demoGroup = { code:'DEMO02', mine:true, owner:S.nickname, trip:TRIPS[tripId('巴黎精品與甜點')].name, depart:'3 月', target:3,
    deadline:new Date(Date.now()+5*864e5).toISOString().slice(0,10), status:'open', members:[{ nick:'林雅婷', role:'cat', me:true }, { nick:'怡君', role:'rabbit' }] }); }
function pollResult(p){
  const score = p.trips.map((t, i) => p.votes.reduce((s, v) => s + (v.votes[i] || 0), 0));
  const best = score.indexOf(Math.max(...score)), months = {};
  p.votes.forEach(v => (v.months || []).forEach(m => months[m] = (months[m] || 0) + 1));
  const mBest = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
  return { score, best, month: mBest ? CARDS[0].qs[1].o[+mBest[0]] : null };
}
function pollCard(p){
  const R = pollResult(p), mineV = (p.votes.find(v => v.me) || {}).votes || [];
  const others = p.leave ? aggLeave(p.leave) : S.demo && S.buddies[0] ? buddyLeave(S.buddies[0]) : null;
  return `<div class="poll box" data-code="${p.code}"><div class="sec-h"><h3>${p.mine?'你發起的投票':esc(p.owner)+' 發起的投票'}</h3><span class="muted small">${p.votes.length} 人已選</span></div>
    ${p.trips.map((t, i) => { const cnt = [0,1,2].map(k => p.votes.filter(v => v.votes[i] === k).length);
      const tt = TRIPS.find(x => x.name === t);
      return `<div class="pq"><div class="pq-h"><b>${short({name:t})}</b><span class="muted small">想去 ${cnt[2]}・可以 ${cnt[1]}・不行 ${cnt[0]}</span></div>${tt ? commonLine(tt, others) : ''}
        <div class="vote3">${[2,1,0].map(k => `<button data-v="${i}:${k}" aria-pressed="${mineV[i]===k}">${VOTE_L[k]}</button>`).join('')}</div></div>`; }).join('')}
    ${p.votes.length?`<p class="poll-res">目前推薦：<b>${short({name:p.trips[R.best]})}</b>${R.month?`・${R.month}出發`:''}</p>`:''}
    <div class="row2">${p.mine?`<button class="btn2 b2" data-share-poll="${p.code}">再傳給旅伴</button>`:''}<button class="btn1 b1" data-group-from="${TRIPS.findIndex(x => x.name === p.trips[R.best])}">揪這團</button></div></div>`;
}
function groupCard(g){
  const n = g.members.length, pct = Math.min(100, Math.round(n / g.target * 100));
  const st = g.status === 'sent' ? '已送給顧問' : g.status === 'full' ? '已湊滿' : `還差 ${Math.max(0, g.target - n)} 人`;
  return `<div class="group box"><div class="sec-h"><h3>揪團：${short({name:g.trip})}</h3><span class="st st-${g.status==='open'?'new':'won'}">${st}</span></div>
    <p class="muted small">${g.depart||'月份未定'}出發・截止 ${String(g.deadline).slice(5).replace('-','/')}・${g.mine?'你發起':esc(g.owner)+' 發起'}</p>
    ${(() => { const tt = TRIPS.find(x => x.name === g.trip), oth = g.leave ? aggLeave(g.leave) : S.demo && S.buddies[0] ? buddyLeave(S.buddies[0]) : null; return tt ? commonLine(tt, oth, parseInt(g.depart) || null) : ''; })()}
    <div class="prog"><i style="width:${pct}%"></i></div><p class="small"><b>${n}／${g.target} 人</b>　${g.members.map(m => esc(m.nick) + (m.role?`（${PACES[m.role].short}）`:'')).join('、')}</p>
    <p class="muted small">${GROUP_PERKS}</p>
    <div class="row2">${g.status==='open'?`<button class="btn2 b2" data-share-group="${g.code}">傳揪團小卡</button>`:''}${g.mine && n >= 2 && g.status !== 'sent' ? `<button class="btn1 b1" data-send-group="${g.code}">送給顧問確認名額</button>` : ''}</div>
    <p class="muted small">App 只收「想一起報」的意願；名額、訂金與契約由顧問用永信正式流程處理。</p></div>`;
}
function shareGroup(code, trip){
  const it = myIntro(), txt = introText('invite', it.tags, 0);
  shareText(`${txt}\n我在揪「${short({name:trip})}」，點這裡加入：${baseUrl()}?join=${code}`, '揪團小卡已複製，貼給旅伴就好');
}
function groupSheet(i){
  const t = TRIPS[i]; if (!t) return;
  const ms = [...monthsOf(t)].map(m => m + ' 月');
  openSheet(`<h3>揪「${short(t)}」</h3>
    <div class="fld"><span>想哪個月出發</span><div class="chips-s" id="gm">${ms.map((m,k)=>`<button class="fc ${k?'':'on'}" data-m="${m}">${m}</button>`).join('')}</div></div>
    <div class="fld"><span>目標人數</span><div class="seg seg3" id="gt">${[2,3,4].map(n=>`<button data-n="${n}" aria-current="${n===2?'page':'false'}">${n} 人</button>`).join('')}</div></div>
    <p class="muted small">${GROUP_PERKS}；7 天內有效</p>
    <button class="btn1 b1" id="go">建立揪團並傳小卡</button><button class="btn2 b2" data-close>取消</button>`, (sh, close) => {
    let m = ms[0], n = 2;
    sh.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { m = b.dataset.m; sh.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); });
    sh.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { n = +b.dataset.n; sh.querySelectorAll('[data-n]').forEach(x => x.setAttribute('aria-current', x === b ? 'page' : 'false')); });
    sh.querySelector('#go').onclick = async () => {
      close();
      if (S.demo) { S.demoGroup = { ...demoGroup(), trip:t.name, depart:m, target:n, status:'open' }; save(); render(); return toast('示範帳號不會真的傳出；已更新示範揪團'); }
      if (S.consent !== 'yes') return toast('揪團需要成為會員（會員 → 成為會員）');
      await ensureCustomer(); const r = await sb.rpc('create_group', { p_trip:t.name, p_depart:m, p_target:n });
      if (r.error || !r.data) return toast('建立失敗，請稍後再試');
      S.groups = [r.data, ...S.groups]; save(); track('group_create', { trip:t.name, target:n }); render(); shareGroup(r.data, t.name);
    };
  });
}
function pollSheet(cands){
  openSheet(`<h3>發起投票</h3><p class="muted small">選 2–3 團，旅伴按「想去／可以／不行」，不用打字。</p>
    <div class="chips-s" id="pc">${cands.map((x,k)=>`<button class="fc ${k<3?'on':''}" data-i="${TRIPS.indexOf(x.t)}">${short(x.t)}</button>`).join('')}</div>
    <button class="btn1 b1" id="go">建立並傳給旅伴</button><button class="btn2 b2" data-close>取消</button>`, (sh, close) => {
    sh.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const on = sh.querySelectorAll('[data-i].on').length;
      if (!b.classList.contains('on') && on >= 3) return toast('最多 3 團'); b.classList.toggle('on'); });
    sh.querySelector('#go').onclick = async () => {
      const picks = [...sh.querySelectorAll('[data-i].on')].map(b => TRIPS[+b.dataset.i].name);
      if (picks.length < 2) return toast('至少選 2 團');
      close();
      if (S.demo) { S.demoPoll = { ...demoPoll(), trips:picks, votes:demoPoll().votes.map(v => ({ ...v, votes:picks.map((_, i) => v.votes[i] ?? 1) })) }; save(); render(); return toast('示範帳號不會真的傳出；已更新示範投票'); }
      if (S.consent !== 'yes') return toast('投票需要成為會員（會員 → 成為會員）');
      await ensureCustomer(); const r = await sb.rpc('create_poll', { p_trips:picks });
      if (r.error || !r.data) return toast('建立失敗，請稍後再試');
      S.polls = [r.data, ...S.polls]; save(); track('poll_create'); render();
      shareText(`幫我選一下！這幾團你想去哪個？點一下就好：${baseUrl()}?poll=${r.data}`, '投票連結已複製，貼給旅伴就好');
    };
  });
}
async function processPending(){
  if (!online() || !S.quizDone) return;
  let msg = null;
  if (S.pendJoin) { const r = await sb.rpc('join_group', { p_code:S.pendJoin });
    if (!r.error && r.data !== 'notfound') { if (!S.groups.includes(S.pendJoin)) S.groups.unshift(S.pendJoin); msg = r.data === 'closed' ? '這個揪團已截止或額滿' : '已加入揪團'; } else msg = '找不到這個揪團';
    S.pendJoin = null; }
  if (S.pendPoll) { if (!S.polls.includes(S.pendPoll)) S.polls.unshift(S.pendPoll); S.pendPoll = null; msg = msg || '旅伴邀你投票，選一下吧'; }
  save(); if (msg) { toast(msg); nav('buddy'); }
}
async function fillSocial(el){
  const pb = el.querySelector('#polls'), gb = el.querySelector('#groups'); if (!pb) return;
  if (S.demo) { pb.innerHTML = pollCard(demoPoll()); gb.innerHTML = groupCard(demoGroup()); bindSocial(el); return; }
  if (!online()) { pb.innerHTML = '<p class="muted small">成為會員後就能發起投票與揪團。</p>'; gb.innerHTML = ''; return; }
  const [ps, gs] = await Promise.all([Promise.all(S.polls.slice(0,3).map(c => sb.rpc('get_poll', { p_code:c }))), Promise.all(S.groups.slice(0,3).map(c => sb.rpc('get_group', { p_code:c })))]);
  const P = ps.map(r => r.data).filter(Boolean), G = gs.map(r => r.data).filter(Boolean);
  pb.innerHTML = P.length ? P.map(pollCard).join('') : '<p class="muted small">還沒有投票。決定不了去哪團？發起一個，讓旅伴點一下就好。</p>';
  gb.innerHTML = G.length ? G.map(groupCard).join('') : '<p class="muted small">還沒有揪團。在上面任一團按「揪這團」就能開始。</p>';
  bindSocial(el);
}
function bindSocial(el){
  el.querySelectorAll('.poll [data-v]').forEach(b => b.onclick = async () => {
    const card = b.closest('.poll'), code = card.dataset.code, [i, k] = b.dataset.v.split(':').map(Number);
    if (S.demo) { const me = demoPoll().votes.find(v => v.me); me.votes[i] = k; save(); return fillSocial(el); }
    const cur = [...card.querySelectorAll('.vote3')].map(row => { const on = row.querySelector('[aria-pressed="true"]'); return on ? +on.dataset.v.split(':')[1] : 1; });
    cur[i] = k; await sb.rpc('vote_poll', { p_code:code, p_votes:cur, p_months:(S.prof.card_a || {}).months || [] }); track('poll_vote'); fillSocial(el);
  });
  el.querySelectorAll('[data-share-poll]').forEach(b => b.onclick = () => S.demo ? toast('示範帳號不會真的傳出') : shareText(`幫我選一下！這幾團你想去哪個？${baseUrl()}?poll=${b.dataset.sharePoll}`, '投票連結已複製'));
  el.querySelectorAll('[data-group-from]').forEach(b => b.onclick = () => groupSheet(+b.dataset.groupFrom));
  el.querySelectorAll('[data-share-group]').forEach(b => b.onclick = () => S.demo ? toast('示範帳號不會真的傳出；正式版會傳出揪團小卡（附自我介紹揪人版）') : shareGroup(b.dataset.shareGroup, b.closest('.group').querySelector('h3').textContent.replace('揪團：','')));
  el.querySelectorAll('[data-send-group]').forEach(b => b.onclick = async () => {
    if (S.demo) { demoGroup().status = 'sent'; S.inq.unshift({ trip:demoGroup().trip + '（揪團 2 人）', status:'new', at:new Date().toISOString() }); save(); toast('已送給顧問確認名額（示範）；成團後才會開放團友牆'); return fillSocial(el); }
    const r = await sb.rpc('send_group', { p_code:b.dataset.sendGroup }); if (r.data) { toast('已送給顧問，會用交接代碼聯絡你'); track('group_send'); fillSocial(el); } });
}

/* ===== 09d 團友牆（示範團） ===== */
const DEMO_TEAM = { trip:'巴黎精品與甜點 10 天', date:'2027-03-18', leader:'王領隊', meet:'3/18（四）21:30 桃園機場第二航廈・永信旅遊櫃檯（示意）',
  notes:['行前說明會 3/4（四）晚上 7:30，線上參加，會後寄講義', '巴黎 3 月均溫 6–13°C，早晚冷，請帶一件保暖外套', '自由日推薦清單已放在這頁下方，出發前一週更新'],
  mates:[{nick:'怡君', role:'rabbit', tags:['跟著導覽走','愛建築藝術','不愛購物站'], text:'白兔一枚，想把精華一次看完，有順路的展覽歡迎揪我！'},
         {nick:'Ken', role:'alice', tags:['半導覽半自由','愛美食','怕長途拉車'], text:'愛麗絲報到！喜歡吃在地美食，怕長途拉車。'},
         {nick:'小魚', role:'cat', tags:['慢慢逛','愛咖啡甜點','怕熱'], text:'柴郡貓，慢慢逛、吃甜點喝咖啡，有好吃的甜點店歡迎推薦！'},
         {nick:'阿哲', role:'hatter', tags:['慢慢逛','愛拍照','要有自由時間'], text:'瘋帽匠一枚，愛拍照、喜歡有自由時間，需要拍照可以找我！'},
         {nick:'May', role:'queen', tags:['跟著導覽走','愛聽在地故事','喜歡連泊'], text:'紅心皇后，喜歡聽在地故事，請多指教！'}],
  dist:{cat:4, rabbit:2, alice:2, hatter:2, queen:2} };
const STAGES = [['挑團中','探索、比較、和旅伴投票或揪團、問顧問'],['已報名・等成團','顧問確認名額與訂金'],['成團確認','開放團友牆、整團行事曆與集合資訊']];
function teamView(){
  const booked = S.demo && S.stage === 'confirmed';
  if (!booked) { const now = 0;
    const el = $h(`<section class="pad">${topbar('我的團', {home:true})}
      <div class="empty-card lock-card"><div class="ec-ic">${ic('star')}</div><h2>成團確認後開啟</h2><p>團友牆、整團行事曆、集合資訊與領隊公告，要等顧問確認成團才會出現；挑團時一起討論的是你自己邀的旅伴。</p>
      <ol class="stages">${STAGES.map(([t, d], k) => `<li class="${k < now ? 'done' : k === now ? 'now' : ''}"><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
      ${S.demo ? '<button class="btn1 b1" id="toConf">看成團後的樣子（示範）</button>' : ''}
      <a class="btn2 b2" href="#/me/intro">先準備我的自我介紹</a></div></section>`);
    bindBack(el, 'me');
    const tc = el.querySelector('#toConf'); if (tc) tc.onclick = () => { S.stage = 'confirmed'; save(); toast('示範：巴黎 3/18 團已成團'); render(); };
    return el; }
  const T = DEMO_TEAM, it = myIntro(), days = Math.max(0, Math.ceil((new Date(T.date) - Date.now()) / 864e5));
  const all = [{ nick:S.nickname || '我', role:state.view, tags:it.tags, text:it.text, me:true }, ...T.mates];
  const total = Object.values(T.dist).reduce((a, b) => a + b, 0);
  const el = $h(`<section class="pad team">${topbar('我的團', {home:true})}
    <div class="demo-stage"><span>示範：已成團</span><button class="txt-btn" id="toDec">切回挑團中</button></div>
    <div class="team-hero b3"><span>${T.trip}</span><b>${days} 天後出發</b><small>${T.date.slice(5).replace('-','/')} 出發・領隊 ${T.leader}・共 ${total} 位旅人（示範團）</small></div>
    <div class="box"><h3>集合資訊</h3><p class="small">${T.meet}</p></div>
    <div class="box cal-sub"><div class="sec-h"><h3>整團行程加入行事曆</h3><span class="muted small">會自動更新</span></div>
      <ul class="plain small"><li>2/16 跟主管請假提醒</li><li>2/25 繳尾款截止（示意）</li><li>3/4 19:30 行前說明會</li><li>3/18 21:30 機場集合・3/18–3/27 出團</li></ul>
      <button class="btn1 b1" id="calSub">加入我的行事曆</button>
      <p class="muted small">成團確認後開放訂閱。iPhone 按一下就會訂閱，顧問改時間你的行事曆跟著變；Android 先下載檔案加入。只放行程，不放你的請假天數。</p></div>
    <div class="box"><h3>領隊公告</h3><ul class="plain small">${T.notes.map(n=>`<li>${n}</li>`).join('')}</ul></div>
    <div class="box"><div class="sec-h"><h3>這團的旅人組成</h3><span class="muted small">領隊也看得到，用來安排自由時間</span></div>
      <div class="dist">${ROLE_ORDER.map(k=>`<div><span>${PACES[k].short}</span><div class="prog"><i style="width:${(T.dist[k]||0)/total*100}%"></i></div><b>${T.dist[k]||0}</b></div>`).join('')}</div></div>
    <div class="sec-h"><h2>團友角色卡</h2><a href="#/me/intro">編輯我的</a></div>
    <div class="vis-row"><span class="small">我的角色卡給誰看</span><div class="seg seg3" id="vis">${[['team','只給領隊'],['all','全團'],['none','不公開']].map(([k,l])=>`<button data-vis="${k}" aria-current="${it.vis===k?'page':'false'}">${l}</button>`).join('')}</div></div>
    <div class="mates">${all.map(m => mateCard(m, { metoo:true, vis:it.vis })).join('')}</div>
    <p class="muted small">只顯示設成「全團」的團友（${T.mates.length}/${total - 1} 位）；點對方的標籤表示「我也是」，相同的標籤會配成小隊。沒有聊天室，想多聊請私下交換 LINE。</p>
    <div id="squad"></div></section>`);
  bindBack(el, 'me');
  el.querySelector('#toDec').onclick = () => { S.stage = 'deciding'; save(); toast('已切回挑團中'); render(); };
  el.querySelector('#calSub').onclick = () => {
    const rel = 'cal/paris-0318.ics', url = new URL(rel, location.href);
    if (/iPhone|iPad|Macintosh/.test(navigator.userAgent) && url.protocol === 'https:') { location.href = 'webcal://' + url.host + url.pathname; track('team_cal', { how:'webcal' }); return; }
    const a = document.createElement('a'); a.href = rel; a.download = 'ys-paris-0318.ics'; document.body.append(a); a.click(); a.remove();
    toast('已下載行事曆檔，打開就能加入'); track('team_cal', { how:'ics' }); };
  const squad = () => { const mine = new Set(it.tags), hit = {};
    S.metoo.forEach(k => { const [n, t] = k.split('|'); if (mine.has(t)) (hit[t] = hit[t] || []).push(n); });
    el.querySelector('#squad').innerHTML = Object.keys(hit).length ? `<div class="box squad">${Object.entries(hit).map(([t, ns]) => `<p>你和 <b>${ns.map(esc).join('、')}</b> 是「${t}」小隊</p>`).join('')}</div>` : ''; };
  el.querySelectorAll('[data-mt]').forEach(b => b.onclick = () => { const k = b.dataset.mt; S.metoo = S.metoo.includes(k) ? S.metoo.filter(x => x !== k) : [...S.metoo, k]; save(); b.classList.toggle('on'); squad(); });
  el.querySelectorAll('#vis [data-vis]').forEach(b => b.onclick = () => { S.intro = { ...myIntro(), vis:b.dataset.vis }; save(); pushProfile(); render(); toast('已更新公開範圍'); });
  squad();
  departMoment(T.trip, `${T.trip}・${days} 天後出發`, 'team:' + T.trip + T.date);
  return el;
}

/* ===== 10 找顧問 ===== */
function summaryLines(t){
  const P = PACES[state.view], a = S.prof.card_a||{}, b = S.prof.card_b||{}, c = S.prof.card_c||{}, d = S.prof.card_d||{};
  const lab = (k, q, v) => { if (v === undefined) return null; const qq = CARDS.find(x=>x.k===k).qs.find(x=>x.id===q); return Array.isArray(v) ? v.map(i=>qq.o[i]).join('、') : qq.o[v]; };
  return [['角色', `${P.name}（${P.short}）`], ['同行', lab('card_a','companion',a.companion)], ['月份', lab('card_a','months',a.months)], ['預算', lab('card_a','budget',a.budget)],
    ['在意', [b.hot===0?'怕熱':null, b.shop===0?'不要購物站':null, b.walk===0?'走路輕鬆':null, b.maxDrive===0?'車程 3 小時內':null].filter(Boolean).join('、')||null],
    ['興趣', lab('card_c','interests',c.interests)], ['聯絡', [lab('card_d','contact',d.contact), lab('card_d','time',d.time)].filter(Boolean).join('，')||null], ['請假', leaveSummary(t)]].filter(x => x[1]);
}
function advisorView(){
  const ti = route()[1], t = ti != null && ti !== '' ? TRIPS[+ti] : null;
  const el = $h(`<section class="pad adv">${topbar('找顧問', {home:true})}<div id="body">${loaderHTML('準備交接代碼中')}</div></section>`);
  bindBack(el, t ? 'trip/' + ti : 'home');
  const body = el.querySelector('#body');
  const draw = code => {
    const qr = (()=>{ try { const q = qrcode(0, 'M'); q.addData(code); q.make(); return q.createSvgTag({ cellSize:5, margin:2, scalable:true }); } catch(e) { return ''; } })();
    body.innerHTML = `<div class="code-card"><div class="qr">${qr}</div><div><span class="muted small">交接代碼${S.demo?'（示範）':''}</span><p class="code">${code}</p>
        <p class="small">報給顧問或讓顧問掃描，不用重講一次需求</p></div></div>
      <div class="sumcard">${t?`<b>想了解：${short(t)}</b>`:'<b>我的摘要</b>'}${summaryLines(t).map(([k,v])=>`<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('')}
        ${completion()<100?`<a class="small" href="#/me">旅人檔案 ${completion()}%，補完會更準 →</a>`:''}</div>
      <button class="btn1 b1" id="line">開啟 LINE 傳給顧問</button>
      <p class="muted small center">顧問上班時間內回覆；晚上送出，隔天早上 10 點前回覆</p>`;
    body.querySelector('#line').onclick = () => { if (S.demo) return toast('示範帳號不會真的傳出'); openLine(lineMsg(`我的交接代碼是 ${code}${t?`，想了解「${t.name}」`:''}`)); };
  };
  if (S.demo) { draw('YT0126'); return el; }
  if (S.consent !== 'yes') { body.innerHTML = `<div class="empty-card"><h2>交接代碼需要儲存資料</h2><p>同意後，顧問才看得到你的角色、檔案與收藏，不用重問。</p>
      <button class="btn1 b1" id="ok">同意儲存，產生代碼</button><a class="txt-link" data-back2>先不要</a></div>`;
    body.querySelector('#ok').onclick = async () => { S.consent = 'yes'; save(); body.innerHTML = loaderHTML('產生交接代碼中'); await ensureCustomer(); await pushQuiz(); render(); };
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
      <div class="pp-id"><div class="pp-av-wrap"><div class="pp-av">${av(PACES[avatarKey()].ch, TIERS[lv][0])}</div>${S.photo&&S.photoOn?`<img class="pp-photo" src="${S.photo}" alt="${esc(S.nickname)}（示意照片）">`:''}</div><div><b>${P.name}</b><span>${P.alias}・${TIERS[lv][1]}等級</span>${S.nickname?`<span>${esc(S.nickname)}</span>`:''}</div></div>
      <div class="pp-stats"><div><b>${trips}</b><span>出團次數</span></div><a href="#/pass/points"><b>${points()}</b><span>旅人點數 ›</span></a><a href="#/me"><b>${completion()}%</b><span>檔案完成</span></a></div></div>
    ${next?`<p class="next-lv">下一級：<b>${next[0]}</b>　再出團 ${need} 次</p>`:''}
    <div class="sec-h"><h2>等級禮遇</h2><span class="muted small">數位護照，不印實體</span></div>
    <div class="tiers">${PERKS.map(([n,c,d],i)=>`<div class="tier ${i===lv?'now':''} ${i<lv?'past':''}"><b>${n}${i===lv?'<small>目前</small>':''}</b><span>${d}</span><small>${c}</small></div>`).join('')}</div>
    <div class="sec-h"><h2>足跡地圖</h2><span class="muted small">第一次出團後點亮</span></div>
    <div class="foot">${(()=>{ const paths = GEO.filter(x=>HOME[x.c]).map(x=>`<path d="${x.d}"/>`).join(''); return `<svg viewBox="40 60 720 680" aria-hidden="true">${paths}</svg>`; })()}
      <p>${trips?`已出團 ${trips} 次，足跡會依永信訂單紀錄點亮。`:'第一次出團後，這裡會點亮你去過的國家，並推薦下一站。'}</p>
      ${S.demo?'<button class="btn2 b2" id="wb">看回國後的樣子（示範）</button>':''}</div>
  </section>`);
  const wb = el.querySelector('#wb'); if (wb) wb.onclick = () => welcomeBackMoment('巴黎精品與甜點');
  return el;
}

/* ===== 13 點數明細 ===== */
function pointsView(){
  const el = $h(`<section class="pad">${topbar('點數明細', {home:true})}
    <div class="pts-card b3"><span>目前點數</span><b>${points()} 點</b><small>報名時可折抵 ${points()} 元・2027/12/31 前有效</small></div>
    ${pending()?`<p class="pend">待入帳 ${pending()} 點：出團回國後入帳</p>`:''}
    <h2 class="h2">紀錄</h2>
    <div class="ledger">${S.ledger.length ? S.ledger.map(x => `<div class="lg"><div><b>${esc(x.label)}</b><span>${fmtDate(x.at)}・${x.status==='pending'?'待出團・回國後入帳':x.reason.startsWith('card')?'旅人檔案':x.reason.startsWith('buddy')?'旅伴':x.reason.startsWith('group')?'揪團':'其他'}</span></div><em class="${x.status}">+${x.points}</em></div>`).join('')
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
const APP_VER = (() => { const sc = [...document.scripts].find(x => /app\.js\?v=/.test(x.src)); return 'v2.4・' + (sc ? sc.src.split('v=')[1] : '本機'); })();
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
      <div class="mc-top">${avatarHTML('mc-av')}
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
    ${tripSummaryHTML()}
    <details class="box prof-box" ${c<100?'open':''}><summary><div class="sec-h"><h2>旅人檔案</h2><span class="muted small">${c}%・已得 ${CARDS.filter(doneCard).reduce((s,x)=>s+x.pts,0)} 點</span></div>
      <div class="prog"><i style="width:${c}%"></i></div></summary>
      <div class="cards5">${CARDS.map(card => { const ok = doneCard(card), v = S.prof[card.k] || {}, n = card.qs.filter(q => v[q.id] !== undefined && !(Array.isArray(v[q.id]) && !v[q.id].length)).length;
        const first = ok ? 0 : Math.max(0, card.qs.findIndex(q => v[q.id] === undefined || (Array.isArray(v[q.id]) && !v[q.id].length)));
        return `<a class="c5 op ${ok?'ok':''}" href="#/me/card/${card.k}/${first}"><div><b>${card.t}</b><span>${card.use}</span></div><em>${ok?'已完成':n?`${n}/${card.qs.length}・+${card.pts}`:`+${card.pts} 點`}</em></a>`; }).join('')}</div>
      <p class="muted small">每一題都寫了用途；不放進一分鐘測驗，想到再補就好。</p></details>
    <div class="menu">
      <a class="op" href="#/me/intro">${ic('chat')}<span>我的自我介紹</span><em>${S.intro?({team:'只給領隊',all:'全團公開',none:'不公開'}[S.intro.vis]):'用作答自動產生'}</em>${ic('chev','end')}</a>
      <a class="op" href="#/me/leave">${ic('pass')}<span>請假條件</span><em>${myLeave()?WHO.find(x=>x[0]===myLeave().who)[1]:'算出要請幾天'}</em>${ic('chev','end')}</a>
      <a class="op" href="#/buddy">${ic('buddy')}<span>旅伴</span>${S.buddies.length?`<em>${S.buddies.length} 位</em>`:''}${ic('chev','end')}</a>
      <a class="op" href="#/inbox">${ic('bell')}<span>通知</span>${unread()?`<em>${unread()} 則未讀</em>`:''}${ic('chev','end')}</a>
      <a class="op" href="#/me/settings">${ic('gear')}<span>設定與隱私</span>${ic('chev','end')}</a></div>
  </section>`);
  const cp = el.querySelector('#copy'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(el.querySelector('#code').textContent); toast('已複製交接代碼'); } catch(e) { toast('請長按代碼複製'); } };
  el.querySelectorAll('#optin,#optin2').forEach(b => b.onclick = optIn);
  el.querySelectorAll('[data-open-trip]').forEach(b => b.onclick = () => { S.tripHl = b.dataset.openTrip; S.tripFlt = 'all'; nav('me/trips'); });
  if (ms === 'member' && !(S.me && S.me.code)) ensureCustomer().then(() => { const p = el.querySelector('#code'); if (p && S.me) p.textContent = S.me.code; });
  return el;
}

/* ----- 編輯個人資料 ----- */
function editView(){
  const T = TIERS[tierIdx()], bm = birthMonth();
  let av0 = avatarKey(), reg = S.region_tw || null, b0 = bm;
  const el = $h(`<section class="pad">${topbar('編輯個人資料')}
    <label class="fld"><span>暱稱</span><input id="nn" maxlength="12" value="${esc(S.nickname)}" placeholder="例如：雅婷"><small>旅伴和顧問會看到；不用填真實姓名</small></label>
    ${S.photo?`<div class="photo-row"><img src="${S.photo}" alt="${esc(S.nickname)}（示意照片）"><label class="sw"><span>照片與角色頭像輪流顯示<small>每 4 秒翻面一次；關掉就只顯示下面選的角色頭像。示範帳號照片為示意，非本人</small></span><input type="checkbox" id="pon" ${S.photoOn?'checked':''}><i></i></label></div>`:''}
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
    toast('已儲存'); back('me'); setTimeout(checkBirthday, 450);
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
      ${row('#/me/colors','行程顏色', (Object.entries(THEMES).find(([, [, m]]) => COLOR_CATS.every(([k]) => m[k] === tripColors()[k])) || [0,['自訂']])[1][0])}
      ${row('#/me/leave','請假條件', myLeave()?leaveSummary():'填了就能在行程頁看到要請幾天')}
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
      <button class="srow" id="replay"><span>重播開場動畫</span>${ic('chev','end')}</button>
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
  el.querySelector('#replay').onclick = () => showSplash(true);
  el.querySelector('#fb').onclick = () => { if (S.demo) return toast('示範帳號不會真的傳出'); openLine(lineMsg('意見回饋：')); };
  return el;
}

/* ----- 隱私與條款（課程原型草稿，正式版需永信法務審閱） ----- */
const LEGAL = {
  data: ['我們記錄什麼', [
    ['會記錄', '測驗答案與旅人角色；旅人檔案（出發條件、耐受度、興趣、聯絡偏好、生日月份）；請假條件（身分、剩餘特休、一次最多請幾天、不方便的月份；不記錄到職日與公司名稱）；暱稱、頭像、居住地區；收藏、比較、詢問、點數與旅伴配對；在 App 裡的操作事件（例如看了哪一團、按了哪個按鈕）。'],
    ['不會記錄', '真實姓名、電話、身分證字號、完整生日、照片、所在位置、通訊錄。'],
    ['用途', '推薦行程、算出各團要請幾天假（旅伴只看到共同出發日期，看不到你的天數）、讓顧問用交接代碼接手、發送你開啟的通知、計算點數與等級、以不具名的方式統計測驗與推薦成效。'],
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

/* ===== 請假試算：自己填的 4 欄＋身分；連假依行政院 116 年（2027）政府行政機關辦公日曆表 ===== */
const HOL = { '2026-12-25':'行憲紀念日', '2027-01-01':'元旦', '2027-02-04':'春節', '2027-02-05':'春節', '2027-02-08':'春節', '2027-02-09':'春節', '2027-02-10':'春節',
  '2027-03-01':'228', '2027-04-05':'清明', '2027-04-06':'清明', '2027-04-30':'勞動節', '2027-06-09':'端午節', '2027-09-15':'中秋節', '2027-09-28':'教師節',
  '2027-10-11':'國慶', '2027-10-25':'光復節', '2027-12-24':'行憲紀念日', '2027-12-31':'跨年' };
const LONG = [['行憲紀念日連假','2026-12-25','2026-12-27'],['元旦連假','2027-01-01','2027-01-03'],['春節','2027-02-04','2027-02-10'],['228 連假','2027-02-27','2027-03-01'],
  ['清明連假','2027-04-03','2027-04-06'],['勞動節連假','2027-04-30','2027-05-02','labor'],['國慶連假','2027-10-09','2027-10-11'],['光復節連假','2027-10-23','2027-10-25'],
  ['行憲紀念日連假','2027-12-24','2027-12-26'],['跨年連假','2027-12-31','2028-01-02']];
const BREAKS = [['2027-01-16','2027-02-21'],['2027-06-26','2027-09-12']];   // 大專院校寒暑假（示意，依各校行事曆）
const CAL_END = '2028-01-02', LEAD_DAYS = 14;
const WHO = [['work','上班族','依勞基法'],['gov','公務員','依公務人員請假規則'],['student','學生','看寒暑假'],['free','其他','自由業、退休、待業']];
const DAY = 864e5, WD = '日一二三四五六';
const dms = s => Date.UTC(+s.slice(0,4), +s.slice(5,7) - 1, +s.slice(8,10));
const dkey = ms => new Date(ms).toISOString().slice(0,10);
const dlab = ms => { const d = new Date(ms); return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${WD[d.getUTCDay()]}）`; };
const dshort = ms => { const d = new Date(ms); return `${d.getUTCMonth()+1}/${d.getUTCDate()}`; };
const n1 = n => (Math.round(n * 2) / 2).toString();
const todayMs = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
const myLeave = () => (S.prof.card_a || {}).leave || null;
function offDay(ms, who){
  const wd = new Date(ms).getUTCDay(), k = dkey(ms);
  if (wd === 0 || wd === 6) return true;
  if (HOL[k] && !(k === '2027-04-30' && who === 'gov')) return true;
  if (who === 'student' && BREAKS.some(([a,b]) => ms >= dms(a) && ms <= dms(b))) return true;
  return false;
}
/* 第 1 天晚上搭機：上班日只算下午半天；中間每個上班日 1 天；最後一天早上抵台：上班日算 1 天；想多休一天就再加回國隔天 */
function leaveOf(start, days, L){
  if (L.who === 'free') return 0;
  let n = offDay(start, L.who) ? 0 : .5;
  for (let i = 1; i < days; i++) if (!offDay(start + i*DAY, L.who)) n += 1;
  if (L.rest && !offDay(start + days*DAY, L.who)) n += 1;
  return n;
}
function longOf(start, days, who){ const end = start + (days-1)*DAY;
  return LONG.find(([, a, b, lab]) => !(lab && who === 'gov') && dms(a) <= end && dms(b) >= start) || null; }
const PREMIUM = { '春節':.15 };   // 示意：春節團費約高 15%，其他連假約高 5%；待業師給實際價差
const premOf = lg => lg ? (PREMIUM[lg[0]] ?? .05) : 0;
function busyHit(start, days, L){ const b = new Set(L.busy || []); if (!b.size) return false;
  for (let i = 0; i < days; i++) if (b.has(new Date(start + i*DAY).getUTCMonth())) return true; return false; }
const capOf = L => Math.min(L.max ?? 99, (L.who === 'work' || L.who === 'gov') && L.left != null ? L.left : 99);
/* 所有可出發日（今天起 14 天後，到行事曆已公布的範圍），依請假天數排序 */
const _lvCache = new Map();
function windowsFor(t, Ls, monthOnly){
  const key = t.name + '|' + JSON.stringify(Ls) + '|' + (monthOnly || '') + '|' + todayMs();
  if (_lvCache.has(key)) return _lvCache.get(key);
  const ms = monthOnly ? new Set([monthOnly]) : monthsOf(t), out = [], last = dms(CAL_END) - (t.days - 1) * DAY;
  for (let s = todayMs() + LEAD_DAYS*DAY; s <= last; s += DAY) {
    if (!ms.has(new Date(s).getUTCMonth() + 1)) continue;
    const per = Ls.map(L => leaveOf(s, t.days, L)), lg = longOf(s, t.days, Ls[0].who);
    const ok = Ls.every((L, k) => per[k] <= capOf(L) && !busyHit(s, t.days, L));
    out.push({ start:s, end:s + (t.days-1)*DAY, per, leave:Math.max(...per), lg, ok });
  }
  out.sort((a, b) => a.leave - b.leave || premOf(a.lg) - premOf(b.lg) || a.start - b.start);
  if (_lvCache.size > 300) _lvCache.clear(); _lvCache.set(key, out); return out;
}
function planFor(t, Ls, monthOnly){
  const all = windowsFor(t, Ls, monthOnly);
  if (!all.length) return { none:true };
  const okList = all.filter(w => w.ok), best = okList[0] || null;
  const alt = best && best.lg ? (okList.find(w => !w.lg) || all.find(w => !w.lg && !Ls.some(L => busyHit(w.start, t.days, L))) || null) : null;
  return { best, alt, any:all[0], ok:!!best };
}
const lvWhy = (t, L) => { if (!L || L.who === 'free') return null; const p = planFor(t, [L]); if (p.none) return null;
  if (!p.ok) { const a = p.any; return { warn: busyHit(a.start, t.days, L) && a.leave <= capOf(L) ? '出發月份落在你不方便請假的月份' : `至少要請 ${n1(a.leave)} 天，超過你${L.max != null && a.leave > (L.max ?? 99) ? `一次最多 ${n1(L.max)} 天` : `剩下的 ${n1(L.left)} 天特休`}` }; }
  return { leave:p.best.leave, chip: p.best.leave <= 4 ? `請 ${n1(p.best.leave)} 天就能去` : null }; };
const whoWord = L => L.who === 'student' ? '請課假' : '請假';
function winLine(w, t, L){
  const brk = L.who === 'student' && BREAKS.some(([x,y]) => w.start >= dms(x) && w.start <= dms(y));
  const how = w.lg ? `搭${w.lg[0]}` : brk ? '放假時出發' : '平日出發';
  const half = !offDay(w.start, L.who) ? '，出發日下午請半天' : '';
  return `<b>${how}</b>：${dlab(w.start)}晚上出發 – ${dlab(w.end)}回國，${L.who==='free' || !w.leave ?'<b>不用請假</b>':`${whoWord(L)} <b>${n1(w.leave)}</b> 天${half}`}`;
}
function leaveDates(w, L, t){   // 要請假的日期，給複製與行事曆用
  const out = []; if (!offDay(w.start, L.who)) out.push(dshort(w.start) + ' 下午');
  for (let i = 1; i < t.days; i++) { const d = w.start + i*DAY; if (!offDay(d, L.who)) out.push(dshort(d)); }
  if (L.rest && !offDay(w.start + t.days*DAY, L.who)) out.push(dshort(w.start + t.days*DAY) + '（休息）');
  return out;
}
function leaveMap(w, L, t){   // 每一天：half／full 要請假
  const m = new Map(); if (L.who === 'free') return m;
  if (!offDay(w.start, L.who)) m.set(w.start, 'half');
  for (let i = 1; i < t.days; i++) { const d = w.start + i*DAY; if (!offDay(d, L.who)) m.set(d, 'full'); }
  if (L.rest && !offDay(w.start + t.days*DAY, L.who)) m.set(w.start + t.days*DAY, 'full');
  return m;
}
function monthCal(w, L, t){
  const lv = leaveMap(w, L, t), last = Math.max(w.end, ...lv.keys()), out = [];
  let y = new Date(w.start).getUTCFullYear(), mo = new Date(w.start).getUTCMonth();
  while (Date.UTC(y, mo, 1) <= last) {
    const first = Date.UTC(y, mo, 1), n = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(), pad = new Date(first).getUTCDay(), cells = [];
    for (let k = 0; k < pad; k++) cells.push('<i></i>');
    for (let d = 1; d <= n; d++) { const ms = Date.UTC(y, mo, d), k = dkey(ms), c = [];
      const hol = HOL[k] && !(k === '2027-04-30' && L.who === 'gov'), brk = L.who === 'student' && BREAKS.some(([a,b]) => ms >= dms(a) && ms <= dms(b));
      if (offDay(ms, L.who)) c.push('off'); if (hol || brk) c.push('hol');
      if (ms >= w.start && ms <= w.end) c.push('in'); if (ms === w.start) c.push('st'); if (ms === w.end) c.push('en');
      if (lv.has(ms)) c.push(lv.get(ms) === 'half' ? 'lvh' : 'lvf');
      cells.push(`<i class="${c.join(' ')}" title="${hol ? HOL[k] : ''}">${d}</i>`); }
    out.push(`<div class="mcal"><b>${y} 年 ${mo + 1} 月</b><div class="mc-g">${[...WD].map(x => `<em>${x}</em>`).join('')}${cells.join('')}</div></div>`);
    if (++mo > 11) { mo = 0; y++; }
  }
  return `<div class="mcals">${out.join('')}</div><p class="mc-key"><span class="k-in">旅行期間</span><span class="k-hol">國定假日${L.who==='student'?'／寒暑假':''}</span><span class="k-lv">要請假</span><span class="k-h">請半天</span><span class="k-se">出發／回國</span></p>`;
}
function leaveBox(t){
  const L = myLeave();
  if (!L) return `<div class="box lv"><h3>請假試算</h3><p>填幾題（身分、剩幾天特休、一次最多請幾天、不方便的月份），就會算出這團最省假的出發日。</p>
    <a class="btn2 b2" href="#/me/leave">填請假條件</a></div>`;
  const p = planFor(t, [L]);
  if (p.none) return `<div class="box lv"><h3>請假試算</h3><p class="muted">這團建議月份在行事曆已公布的範圍（到 2027 年底）之外，先問顧問團期。</p></div>`;
  if (L.who === 'free') { const w = p.alt || p.best || p.any;
    return `<div class="box lv"><h3>出發日建議</h3><p>時間自己安排，建議<b>避開連假</b>出發，團費比較省。</p><p>${winLine(w, t, L)}</p><div class="lv-cal">${monthCal(w, L, t)}</div>${lvActions(w)}${lvFoot(L)}</div>`; }
  const w = p.best || p.any, left = (L.who === 'work' || L.who === 'gov') && L.left != null ? L.left - w.leave : null;
  const warn = !p.ok ? `<p class="warn-t">${lvWhy(t, L).warn}；下面是最省假的日期，供你評估。</p>` : '';
  const alt = p.alt ? (() => { const d = p.alt.leave - w.leave, save = Math.round(t.from * 1e4 * (premOf(w.lg) - premOf(p.alt.lg)) / 100) * 100;
    return `<div class="lv-alt"><p><b>避開連假</b>：${dlab(p.alt.start)}出發，${whoWord(L)} ${n1(p.alt.leave)} 天${d > 0 ? `（多請 ${n1(d)} 天）` : ''}${p.alt.ok ? '' : '<span class="lv-w">・超過你的請假上限</span>'}</p>
      ${save > 0 ? `<p class="small">連假團費通常較高，這個日期每人約少 <b>${save.toLocaleString()} 元</b>（示意，待永信實際價差）</p>` : ''}
      <button class="txt-btn" data-pick="alt">改用這個日期</button></div>`; })() : '';
  return `<div class="box lv"><div class="sec-h"><h3>請假試算</h3><a class="small" href="#/me/leave">修改條件</a></div>
    ${warn}<p class="lv-main">${winLine(w, t, L)}</p><div class="lv-cal">${monthCal(w, L, t)}</div>
    ${left != null ? `<p class="small">請完特休還剩 <b>${n1(Math.max(0, left))}</b> 天${L.max != null ? `・在你一次最多 ${n1(L.max)} 天${w.leave <= L.max ? '內' : '之外'}` : ''}</p>` : ''}
    ${alt}${lvActions(w)}${lvFoot(L)}</div>`;
}
const lvActions = w => `<div class="row3"><button class="btn2 b2" data-lv="copy">複製請假日期</button><button class="btn2 b2" data-lv="ics">加入行事曆</button><button class="btn2 b2" data-lv="remind">出發前 30 天提醒我</button></div>`;
const lvFoot = L => `<p class="muted small">連假依行政院 116 年辦公日曆表；團期為示意，實際出發日請問顧問。${!L || L.who==='free' ? '' : L.who==='student' ? '寒暑假日期為示意，依你的學校行事曆。' : L.who==='gov' ? '公務員不放勞動節；休假天數以機關核定為準。' : '勞動節只適用勞基法勞工；特休天數以公司為準。'}</p>`;
function bindLeave(el, t){
  const box = el.querySelector('.lv'); if (!box) return; const L = myLeave(); if (!L) return;
  let p = planFor(t, [L]), w = p.best || p.any;
  box.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { w = p.alt; box.querySelector('.lv-main').innerHTML = winLine(w, t, L); box.querySelector('.lv-cal').innerHTML = monthCal(w, L, t); b.closest('.lv-alt').remove(); toast('已改用避開連假的日期'); });
  box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
    if (!w) return;
    const name = short(t), ds = leaveDates(w, L, t);
    if (b.dataset.lv === 'copy') shareText(`${name}｜${dlab(w.start)}出發 – ${dlab(w.end)}回國\n${L.who==='free'?'不用請假':`${whoWord(L)} ${n1(w.leave)} 天：${ds.join('、') || '不用請假'}`}`, '請假日期已複製');
    if (b.dataset.lv === 'ics') downloadICS(t, w, L, ds);
    if (b.dataset.lv === 'remind') setReminder(t, w);
  });
}
function downloadICS(t, w, L, ds){
  const f = ms => dkey(ms).replace(/-/g, ''), stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FJUIEC//YS Travel Prototype//ZH','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${f(w.start)}-${TRIPS.indexOf(t)}@fjuiec`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${f(w.start)}`, `DTEND;VALUE=DATE:${f(w.end + DAY)}`,
    `SUMMARY:${short(t)}（永信旅遊・示意團期）`, `DESCRIPTION:${L.who==='free'?'不用請假':`${whoWord(L)} ${n1(w.leave)} 天：${ds.join('、')}`}\\n輔大創新創業社課程原型，非永信官方`,
    'BEGIN:VALARM','TRIGGER:-P30D','ACTION:DISPLAY','DESCRIPTION:記得跟主管請假','END:VALARM','END:VEVENT','END:VCALENDAR'];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type:'text/calendar' }));
  a.download = 'ys-trip-leave.ics'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('已下載行事曆檔，打開就能加入（含出發前 30 天提醒）');
}
async function setReminder(t, w){
  const on = Math.max(todayMs() + DAY, w.start - 30*DAY), when = dshort(on);
  S.reminders = (S.reminders || []).filter(r => r.trip !== t.name).concat([{ trip:t.name, depart:dkey(w.start), on:dkey(on) }]);
  addNote('system', `已設定 ${when} 提醒你請假`, `${short(t)} ${dshort(w.start)} 出發；${when} 會提醒你跟主管提假。正式版由永信 LINE 官方帳號推播。`, '#/trip/' + TRIPS.indexOf(t));
  save(); toast(`好了，${when} 會提醒你請假`);
  if (online()) { const me = await ensureCustomer(); if (me) sb.from('leave_reminders').upsert({ customer_id:me.id, trip_name:t.name, depart_on:dkey(w.start), remind_on:dkey(on) }, { onConflict:'customer_id,trip_name' }).then(() => {}); }
  track('leave_remind', { trip:t.name });
}
/* 多人共同窗口：只回傳日期，不顯示每個人請幾天 */
function commonLine(t, others, monthOnly){
  const L = myLeave(); if (!L || !others || !others.length) return '';
  const Ls = [L, ...others].map(x => ({ ...x, who:x.who || 'work' })); const p = planFor(t, Ls, monthOnly);
  if (p.none) return '';
  if (!p.ok) return `<p class="lv-c warn">找不到大家都請得了假的日期，可以改月份或少一天的團</p>`;
  const w = p.best; return `<p class="lv-c">大家都能去：${w.lg ? w.lg[0] + ' ' : ''}${dshort(w.start)}–${dshort(w.end)}</p>`;
}
const aggLeave = lv => lv && lv.n ? [{ who:lv.who || 'work', max:lv.max, busy:lv.busy || [], rest:!!lv.rest }] : null;
const buddyLeave = b => { const l = (b.card_a || {}).leave; return l ? [l] : null; };

/* 年資 → 特休（法定最低天數） */
function legalDays(who, y, m){
  const now = new Date(), mon = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (mon < 0) return null; const yr = Math.floor(mon / 12);
  if (who === 'gov') return yr < 1 ? 0 : yr < 3 ? 7 : yr < 6 ? 14 : yr < 9 ? 21 : yr < 14 ? 28 : 30;
  return mon < 6 ? 0 : yr < 1 ? 3 : yr < 2 ? 7 : yr < 3 ? 10 : yr < 5 ? 14 : yr < 10 ? 15 : Math.min(30, 16 + (yr - 10));
}
function leaveView(){
  const cur = myLeave(), L = Object.assign({ who:'work', left:null, max:5, busy:[], rest:false }, cur || {});
  const el = $h(`<section class="pad lvset">${topbar('請假條件', {home:true})}
    <p class="muted">用來算「這團要請幾天、哪天出發最省假」。只有你和你的顧問看得到；旅伴只會看到你們共同的出發日期。</p>
    <div class="box"><h3>你的身分</h3><div class="who4">${WHO.map(([k,l,s]) => `<button class="opt op" data-who="${k}" aria-pressed="${L.who===k}"><span class="ot"><b>${l}</b><small>${s}</small></span></button>`).join('')}</div></div>
    <div class="box" data-for="work gov"><h3>今年還剩幾天特休？</h3>
      <div class="stp"><button class="op" data-st="left:-0.5" aria-label="減半天">−</button><output id="left">${L.left == null ? '—' : n1(L.left)}</output><span>天</span><button class="op" data-st="left:0.5" aria-label="加半天">＋</button></div>
      <details class="lv-help"><summary>不確定？用到職年月估算</summary>
        <div class="row2"><label class="fld"><span>到職年</span><select id="sy">${Array.from({length:41}, (_, k) => 2026 - k).map(y => `<option>${y}</option>`).join('')}</select></label>
          <label class="fld"><span>月</span><select id="sm">${MONTHS.map((x, k) => `<option value="${k+1}">${x}</option>`).join('')}</select></label></div>
        <button class="btn2 b2" id="calc">估算並填入</button>
        <p class="muted small" id="calcNote">依法定最低天數估算；公司若用曆年制或給得比較多，以公司為準。到職年月不會儲存。</p></details></div>
    <div class="box" data-for="work gov student"><h3>一次最多能請幾天？</h3>
      <div class="stp"><button class="op" data-st="max:-0.5" aria-label="減半天">−</button><output id="max">${n1(L.max)}</output><span>天</span><button class="op" data-st="max:0.5" aria-label="加半天">＋</button></div>
      <p class="muted small">很多人特休夠，但一次請不了太多天；這個數字最決定能不能去。</p></div>
    <div class="box"><h3>不方便請假的月份</h3><p class="muted small">可複選，例如年底檔期、結帳月；推薦會避開</p>
      <div class="chips-s">${MONTHS.map((x, k) => `<button class="fc ${L.busy.includes(k)?'on':''}" data-busy="${k}">${x}</button>`).join('')}</div></div>
    <div class="box" data-for="work gov student"><h3>回國隔天要上班（上課）嗎？</h3>
      <div class="seg"><button data-rest="0" aria-current="${!L.rest?'page':'false'}">要，直接上班</button><button data-rest="1" aria-current="${L.rest?'page':'false'}">想多休一天</button></div>
      <p class="muted small">歐洲回程多半早上抵台；想多休一天會算進請假天數。</p></div>
    <button class="btn1 b1" id="save">儲存</button>
    ${cur ? '<button class="btn2 b2" id="clear">清除請假條件</button>' : ''}
  </section>`);
  bindBack(el, 'me');
  const show = () => { el.querySelectorAll('[data-for]').forEach(b => b.hidden = !b.dataset.for.split(' ').includes(L.who));
    el.querySelectorAll('[data-who]').forEach(b => b.setAttribute('aria-pressed', b.dataset.who === L.who)); };
  el.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { L.who = b.dataset.who; show(); });
  el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const [k, d] = b.dataset.st.split(':'), lim = k === 'left' ? 30 : 10;
    L[k] = Math.min(lim, Math.max(k === 'max' ? .5 : 0, (L[k] ?? (k === 'left' ? 7 : 5)) + +d)); el.querySelector('#' + k).textContent = n1(L[k]); });
  el.querySelectorAll('[data-busy]').forEach(b => b.onclick = () => { const k = +b.dataset.busy; L.busy = L.busy.includes(k) ? L.busy.filter(x => x !== k) : [...L.busy, k].sort((a,b)=>a-b); b.classList.toggle('on'); });
  el.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { L.rest = b.dataset.rest === '1'; el.querySelectorAll('[data-rest]').forEach(x => x.setAttribute('aria-current', x === b ? 'page' : 'false')); });
  el.querySelector('#calc').onclick = () => { const d = legalDays(L.who, +el.querySelector('#sy').value, +el.querySelector('#sm').value);
    if (d == null) return toast('到職日期在未來，請再確認');
    L.left = d; el.querySelector('#left').textContent = n1(d);
    el.querySelector('#calcNote').textContent = d ? `估算：依${L.who==='gov'?'公務人員請假規則':'勞基法第 38 條'}，你今年有 ${d} 天${L.who==='gov'?'休假':'特休'}。已填入，扣掉今年用掉的再調整。` : `年資未滿${L.who==='gov'?' 1 年':' 6 個月'}，依法還沒有${L.who==='gov'?'休假':'特休'}；公司另有規定以公司為準。`; };
  el.querySelector('#save').onclick = () => {
    const keep = { who:L.who, busy:L.busy, rest:L.who === 'free' ? false : L.rest, at:new Date().toISOString().slice(0,7) };
    if (L.who === 'work' || L.who === 'gov') { if (L.left != null) keep.left = L.left; }
    if (L.who !== 'free') keep.max = L.max;
    S.prof.card_a = Object.assign(S.prof.card_a || {}, { leave:keep }); _lvCache.clear(); save(); pushProfile(); track('leave_set', { who:L.who });
    toast('已儲存，行程頁會顯示請假試算'); back('me'); };
  const cl = el.querySelector('#clear'); if (cl) cl.onclick = () => { delete S.prof.card_a.leave; _lvCache.clear(); save(); pushProfile(); toast('已清除'); back('me'); };
  show(); return el;
}
function leaveSummary(t){ const L = myLeave(); if (!L) return null;
  const who = WHO.find(x => x[0] === L.who)[1], parts = [who];
  if (L.left != null && (L.who === 'work' || L.who === 'gov')) parts.push(`特休剩 ${n1(L.left)} 天`);
  if (L.max != null && L.who !== 'free') parts.push(`一次最多 ${n1(L.max)} 天`);
  if ((L.busy || []).length) parts.push(`避開 ${L.busy.map(k => k + 1).join('、')} 月`);
  if (L.rest) parts.push('回國想多休一天');
  if (t) { const p = planFor(t, [L]); if (p.best) parts.push(`想${p.best.lg ? '搭' + p.best.lg[0] : '平日出發'}（${dshort(p.best.start)} 出發）`); }
  return parts.join('，'); }

/* ===== 我的行程：月曆＋行程卡片同一頁（接下來／已結束、狀態橫條、點日期看詳情、可自訂顏色） ===== */
const PAL = { peach:['#FEF0E1','#F59312','#7A3D00','淺橘'], sky:['#E6EEF5','#00223D','#00223D','淺藍'], mint:['#E9F3E6','#5E9A55','#2F5A29','淺綠'], lilac:['#EFE8F6','#8B6BB8','#4F3A73','淺紫'],
  rose:['#FBE7EF','#C2557F','#7A2A4B','淺粉'], sand:['#FBF3DC','#C9A227','#6E5710','淺黃'], stone:['#F0EDE8','#8B847A','#5E584F','淺灰'], blush:['#FCE9E6','#D0281C','#8E1E14','淺紅'] };
const TRIP_PAL = ['peach','sky','mint','lilac','rose','sand','stone'], TODO_PAL = ['blush','sand','lilac','mint','sky','peach','rose','stone'];
const COLOR_CATS = [['ok','已成團','trip'],['wait','等成團','trip'],['go','旅行中','trip'],['leave','請假','todo'],['pay','尾款','todo'],['event','說明會・集合','todo']];
const THEMES = { ys:['永信橘',{ ok:'peach', wait:'peach', go:'sky', leave:'blush', pay:'blush', event:'blush' }], sea:['海洋藍',{ ok:'sky', wait:'sky', go:'mint', leave:'blush', pay:'sand', event:'lilac' }],
  forest:['森林綠',{ ok:'mint', wait:'mint', go:'sky', leave:'blush', pay:'sand', event:'peach' }], calm:['低調灰',{ ok:'stone', wait:'stone', go:'sky', leave:'blush', pay:'stone', event:'stone' }] };
const tripColors = () => Object.assign({}, THEMES.ys[1], (S.prefs && S.prefs.colors) || {});
const colOf = cat => PAL[tripColors()[cat]] || PAL.stone;
const SHORTS = { '巴黎精品與甜點':'巴黎甜點' };
const shortName = name => { const b = name.split('｜')[0].replace(/\s*\d+\s*天.*$/, ''); return SHORTS[b] || b.slice(0, 4); };
const nowMs = () => S.previewGo ? dms('2027-03-20') : todayMs();
const fullName = n => n.split('｜')[0];
/* 行程資料：示範帳號用示意資料並跟著「挑團中／已成團」切換；會員用詢問紀錄＋請假提醒 */
function myTrips(){
  const out = [];
  if (S.demo) {
    const paris = TRIPS[tripId('巴黎精品與甜點')].name, conf = S.stage === 'confirmed';
    out.push(conf ? { id:'paris', name:paris, status:'ok', start:dms('2027-03-18'), end:dms('2027-03-27'), meta:'領隊 王領隊・同團 12 人（示範團）', team:true,
      todos:[{ d:dms('2027-02-16'), cat:'leave', t:'跟主管請假', k:'請假' }, { d:dms('2027-02-25'), cat:'pay', t:'繳尾款（示意）', k:'尾款' },
             { d:dms('2027-03-04'), cat:'event', t:'行前說明會（線上）', k:'說明會', tm:'19:30' }, { d:dms('2027-03-18'), cat:'event', t:'機場集合', k:'集合', tm:'21:30', at:'桃園機場第二航廈・永信櫃檯（示意）' }] }
      : { id:'paris', name:paris, status:'ask', sub:'顧問已回覆', note:'顧問：3/18 出發還有 6 個名額，連泊飯店都有冷氣。', todos:[] });
    out.push({ id:'nordic', name:TRIPS[tripId('北歐極光')].name, status:'ask', sub:'顧問已回覆', note:'顧問：2 月團還有 4 個名額，要幫你保留嗎？', todos:[] });
    out.push({ id:'atcz', name:TRIPS[tripId('奧捷慢遊')].name, status:'done', start:dms('2025-10-08'), end:dms('2025-10-17'), note:'填回饋拿 200 點・點亮護照足跡', todos:[] });
  } else {
    (S.inq || []).forEach((q, k) => { const st = { won:'wait', lost:'x' }[q.status] || 'ask';
      out.push({ id:'q' + k, name:q.trip, status:st, sub:{ new:'已送出', replied:'顧問已回覆', quoted:'已報價' }[q.status] || '', todos:[] }); });
  }
  (S.reminders || []).forEach(r => { let t = out.find(x => x.name === r.trip || x.name.startsWith(fullName(r.trip)));
    if (!t) { t = { id:'r' + r.trip, name:r.trip, status:'plan', sub:'自己規劃中', planStart:dms(r.depart), todos:[] }; out.push(t); }
    if (!t.todos.some(x => x.cat === 'leave')) t.todos.push({ d:dms(r.on), cat:'leave', t:`跟主管請假（${dshort(dms(r.depart))} 出發）`, k:'請假' }); });
  const now = nowMs();
  out.forEach(t => { if (t.start && t.status === 'ok' && now >= t.start && now <= t.end) { t.status = 'go'; t.day = Math.round((now - t.start) / DAY) + 1; }
    if (t.start && t.status === 'ok' && now > t.end) t.status = 'done'; t.todos.sort((a, b) => a.d - b.d); });
  return out;
}
const ENDED = new Set(['done','x']);
function stLabel(t){ const now = nowMs();
  return { ask:`詢問中${t.sub ? '・' + t.sub : ''}`, plan:'自己規劃中', wait:'已報名・等成團', ok:`已成團・${Math.max(0, Math.round((t.start - now) / DAY))} 天後出發`,
    go:`旅行中・第 ${t.day} 天`, done:`已回國・${t.end ? dshort(t.end) : ''}`, x:'未成團' }[t.status]; }
const stClass = s => ({ ask:'st-ask', plan:'st-ask', wait:'st-wait', ok:'st-ok', go:'st-go', done:'st-done', x:'st-x' }[s]);
const progOf = s => ({ ask:20, plan:10, wait:40, ok:60, go:80 }[s] || 0);
const stStyle = s => { if (s === 'ok' || s === 'go' || s === 'wait') { const c = colOf(s); return s === 'wait' ? `border:1.5px dashed ${c[1]};color:${c[2]}` : `background:${c[0]};color:${c[2]};box-shadow:inset 3px 0 0 ${c[1]}`; } return ''; };
const nextTodo = list => list.flatMap(t => t.todos.map(x => ({ ...x, trip:t }))).filter(x => x.d >= nowMs()).sort((a, b) => a.d - b.d)[0] || null;
function nextStep(t){
  if (t.status === 'go') return `今天第 ${t.day} 天`;
  if (t.status === 'ok') { const x = t.todos.find(y => y.d >= nowMs()); return x ? `<b class="red-d">${dshort(x.d)}</b> ${esc(x.t)}` : `${dshort(t.start)} 出發`; }
  if (t.status === 'wait') return '等顧問確認名額與訂金';
  if (t.status === 'plan') { const x = t.todos.find(y => y.d >= nowMs()); return x ? `<b class="red-d">${dshort(x.d)}</b> ${esc(x.t)}` : `預計 ${dshort(t.planStart)} 出發`; }
  return esc(t.note || (t.sub === '已送出' ? '已送給顧問，等回覆' : '看顧問回覆'));
}
function tripSummaryHTML(){
  const act = myTrips().filter(t => !ENDED.has(t.status)).sort((a, b) => ({ go:0, ok:1, wait:2, plan:3, ask:4 }[a.status] - { go:0, ok:1, wait:2, plan:3, ask:4 }[b.status]));
  if (!act.length) return `<a class="card trip-sum op" href="#/me/trips"><div class="hd"><h3>我的行程</h3><span class="txt-a">›</span></div><p class="muted small">還沒有行程。看到喜歡的團按「我想了解」，就會出現在這裡。</p></a>`;
  return `<div class="card trip-sum"><a class="hd" href="#/me/trips"><h3>我的行程</h3><span class="txt-a">全部 ›</span></a>
    ${act.slice(0, 2).map(t => `<button class="ts-row op" data-open-trip="${t.id}"><span class="ts-top"><span class="st ${stClass(t.status)}" style="${stStyle(t.status)}">${stLabel(t).split('・')[0]}</span><b>${esc(fullName(t.name))}</b></span><span class="ts-next">${nextStep(t)}</span></button>`).join('')}
    ${act.length > 2 ? `<a class="ts-more" href="#/me/trips">還有 ${act.length - 2} 趟 ›</a>` : ''}</div>`;
}
/* 月曆 */
const weekStart = ms => ms - new Date(ms).getUTCDay() * DAY;
function dayItems(ms, list){
  const out = [];
  list.forEach(t => { t.todos.filter(x => x.d === ms).forEach(x => out.push({ kind:'todo', x, t }));
    if (t.start && ms >= t.start && ms <= t.end) out.push({ kind:'span', t, first:ms === t.start, last:ms === t.end, n:Math.round((ms - t.start) / DAY) + 1 }); });
  return out.sort((a, b) => (a.kind === 'todo' ? 0 : 1) - (b.kind === 'todo' ? 0 : 1));
}
function holName(ms){ const k = dkey(ms), L = LONG.find(([, a]) => a === k); if (L) return L[0].replace(/\s*連假/, '');
  if (LONG.some(([, a, b]) => ms > dms(a) && ms <= dms(b))) return ''; return HOL[k] || ''; }
const isRedDay = ms => { const w = new Date(ms).getUTCDay(); return w === 0 || w === 6 || !!HOL[dkey(ms)]; };
function weekRow(ws, list, opts = {}){
  const days = [...Array(7)].map((_, i) => ws + i*DAY), spans = [], todos = [];
  list.forEach(t => { if (!t.start || t.end < ws || t.start > ws + 6*DAY) return; const a = Math.max(t.start, ws), b = Math.min(t.end, ws + 6*DAY);
    spans.push({ t, c1:(a - ws) / DAY + 1, c2:(b - ws) / DAY + 2, label:a === t.start }); });
  days.forEach((d, i) => { const its = dayItems(d, list), td = its.filter(x => x.kind === 'todo'), sp = its.find(x => x.kind === 'span' && x.first);
    if (td.length || sp) todos.push({ i, td, more:td.length + (sp ? 1 : 0) - 1 - (sp && td.length ? 0 : 0) }); });
  const rows = ['22px','13px']; if (spans.length) rows.push('18px'); if (todos.some(x => x.td.length)) rows.push('18px');
  const spanRow = 3, tdRow = spans.length ? 4 : 3;
  let h = days.map((d, i) => { const out = d < (opts.monthStart || -Infinity) || d > (opts.monthEnd || Infinity);
    const cls = ['cn', isRedDay(d) ? 'r' : '', d === nowMs() ? 'today' : '', d === opts.ring ? 'ring' : '', out ? 'out' : ''].join(' ');
    return `<button class="${cls}" style="grid-column:${i+1}" data-day="${d}" aria-label="${dshort(d)}">${new Date(d).getUTCDate()}</button>`; }).join('');
  days.forEach((d, i) => { const hn = holName(d), its = dayItems(d, list), n = its.filter(x => x.kind === 'todo').length;
    const more = n > 1 ? `＋${n - 1}` : ''; if (hn || more) h += `<span class="chn ${hn ? 'r' : ''}" style="grid-column:${i+1}">${hn || more}</span>`; });
  spans.forEach(s => { const c = colOf(s.t.status === 'go' ? 'go' : s.t.status === 'wait' ? 'wait' : s.t.status === 'done' ? 'done' : 'ok');
    const st = s.t.status === 'wait' ? `border:1.3px dashed ${c[1]};color:${c[2]};background:#fff` : s.t.status === 'done' ? `background:#F0EDE8;color:#8B847A` : `background:${c[0]};color:${c[2]};${s.label ? `box-shadow:inset 3px 0 0 ${c[1]}` : ''}`;
    h += `<span class="cev" style="grid-row:${spanRow};grid-column:${s.c1}/${s.c2};${st}">${s.label ? shortName(s.t.name) : '&nbsp;'}</span>`; });
  todos.forEach(x => { if (!x.td.length) return; const it = x.td[0].x, c = colOf(it.cat);
    h += `<span class="cev" style="grid-row:${tdRow};grid-column:${x.i+1};background:${c[0]};color:${c[2]};box-shadow:inset 3px 0 0 ${c[1]}">${it.k}</span>`; });
  const fw = opts.fw != null && opts.fw >= ws && opts.fw < ws + 7*DAY;
  return `<div class="cwk${fw ? ' focus' : ''}" style="grid-template-rows:${rows.join(' ')}">${h}</div>`;
}
function calHTML(list){
  const cs = S.tripCal = Object.assign({ open:true, focus:null, ring:null }, S.tripCal || {});
  const focus = cs.focus || nowMs(), seg = `<span class="cseg" role="tablist"><button data-cm="week" aria-pressed="${!cs.open}">週</button><button data-cm="month" aria-pressed="${cs.open}">月</button></span>`;
  const hd = `<div class="cdh">${[...WD].map((x, i) => `<span class="${i===0||i===6?'r':''}">${x}</span>`).join('')}</div>`;
  if (!cs.open) {
    const ws = weekStart(focus), has = list.some(t => t.todos.some(x => x.d >= ws && x.d < ws + 7*DAY) || (t.start && t.start <= ws + 6*DAY && t.end >= ws));
    const nx = nextTodo(list.filter(t => !ENDED.has(t.status))) || null;
    const nxSpan = list.filter(t => t.start && t.start > ws + 6*DAY && !ENDED.has(t.status)).sort((a,b) => a.start - b.start)[0];
    const target = nx && (!nxSpan || nx.d <= nxSpan.start) ? { d:nx.d, t:nx.t } : nxSpan ? { d:nxSpan.start, t:shortName(nxSpan.name) + ' 出發' } : null;
    const isNow = ws <= nowMs() && nowMs() < ws + 7*DAY;
    return `<div class="ccard"><div class="ctop"><span class="cnav"><button data-wk="-1" aria-label="上一週">‹</button><b>${isNow ? '本週・' : ''}${dshort(ws)}–${dshort(ws + 6*DAY)}</b><button data-wk="1" aria-label="下一週">›</button>${isNow ? '' : '<button class="txt-btn" data-today>今天</button>'}</span>${seg}</div>
      ${hd}${weekRow(ws, list, { ring:cs.ring })}
      ${!has ? `<div class="cempty"><span>這週沒有安排</span>${target ? `<button class="txt-btn" data-goto="${target.d}">下一件 <b class="red-d">${dshort(target.d)}</b> ${esc(target.t)} ›</button>` : ''}</div>` : ''}</div>`;
  }
  const f = new Date(focus), y = f.getUTCFullYear(), m = f.getUTCMonth(), m0 = Date.UTC(y, m, 1), m1 = Date.UTC(y, m + 1, 0);
  let rows = ''; for (let ws = weekStart(m0); ws <= m1; ws += 7*DAY) rows += weekRow(ws, list, { ring:cs.ring, monthStart:m0, monthEnd:m1, fw:cs.ring || (nowMs() >= m0 && nowMs() <= m1 ? nowMs() : m0) });
  const nowIn = nowMs() >= m0 && nowMs() <= m1;
  const mHas = list.some(t => t.todos.some(x => x.d >= m0 && x.d <= m1) || (t.start && t.start <= m1 && t.end >= m0));
  const nxM = list.filter(t => !ENDED.has(t.status)).flatMap(t => [...t.todos.map(x => ({ d:x.d, t:x.t })), ...(t.start ? [{ d:t.start, t:shortName(t.name) + ' 出發' }] : [])]).filter(x => x.d > m1).sort((a, b) => a.d - b.d)[0];
  const mEmpty = mHas ? '' : `<div class="cempty"><span>這個月沒有安排</span>${nxM ? `<button class="txt-btn" data-goto="${nxM.d}">下一件 <b class="red-d">${dshort(nxM.d)}</b> ${esc(nxM.t)} ›</button>` : ''}</div>`;
  return `<div class="ccard"><div class="ctop"><span class="cnav"><button data-mo="-1" aria-label="上個月">‹</button><b>${y} 年 ${m + 1} 月</b><button data-mo="1" aria-label="下個月">›</button>${nowIn ? '' : '<button class="txt-btn" data-today>今天</button>'}</span>${seg}</div>${hd}${rows}${mEmpty}</div>`;
}
function tripCard(t, hl){
  const nx = t.todos.filter(x => x.d >= nowMs()).slice(0, 2), st = stLabel(t);
  const dates = t.start ? `${dshort(t.start)}–${dshort(t.end)}` : t.planStart ? `預計 ${dshort(t.planStart)} 出發` : '日期未定';
  const link = t.team ? `<a class="go-l" href="#/team">團友牆與整團行事曆 ›</a>` : S.demo && t.id === 'paris' ? `<a class="go-l" href="#/team">成團後開啟團友牆 ›</a>` : t.status === 'ask' ? `<a class="go-l" href="#/me/inquiries">看詢問紀錄 ›</a>` : '';
  return `<div class="tcard ${hl ? 'hl' : ''}" data-trip="${t.id}"><div class="tt"><span class="st ${stClass(t.status)}" style="${stStyle(t.status)}">${st}</span><span class="muted small">${dates}</span></div>
    <h4>${esc(fullName(t.name))}</h4>${t.meta ? `<p class="muted small">${t.meta}</p>` : ''}
    ${progOf(t.status) ? `<div class="thin"><i style="width:${progOf(t.status)}%;background:${t.status==='ask'||t.status==='plan'?'#AFC0CE':colOf(t.status==='go'?'go':'ok')[1]}"></i></div>` : ''}
    ${nx.map(x => `<button class="todo-b" data-todo="${x.d}"><b class="red-d">${dshort(x.d)}</b>${x.tm ? ` ${x.tm}` : ''}　${esc(x.t)}</button>`).join('')}
    ${t.note ? `<p class="small muted">${esc(t.note)}</p>` : ''}${link}</div>`;
}
function tripsView(){
  if (!S._keepCal) S.tripCal = { open:true, focus:null, ring:null }; S._keepCal = false;
  const ended = route()[2] === 'ended', all = myTrips(), act = all.filter(t => !ENDED.has(t.status)), past = all.filter(t => ENDED.has(t.status));
  const flt = S.tripFlt || 'all', cnt = k => act.filter(t => k === 'ok' ? (t.status === 'ok' || t.status === 'go') : k === 'ask' ? (t.status === 'ask' || t.status === 'plan') : t.status === k).length;
  const shown = flt === 'all' ? act : act.filter(t => flt === 'ok' ? (t.status === 'ok' || t.status === 'go') : flt === 'ask' ? (t.status === 'ask' || t.status === 'plan') : t.status === flt);
  const go = shown.find(t => t.status === 'go'), hl = S.tripHl;
  const body = ended ? `<div class="rows">${past.length ? past.map(t => `<div class="ended-row"><div><span class="st ${stClass(t.status)}">${stLabel(t)}</span><b>${esc(fullName(t.name))}</b><p class="muted small">${t.start ? `${new Date(t.start).getUTCFullYear()}/${dshort(t.start)}–${dshort(t.end)}・` : ''}${t.note || ''}</p></div></div>`).join('') : '<p class="muted small">還沒有結束的行程。</p>'}</div>
      <p class="muted small center">未成團、取消的行程也會收在這裡</p>`
    : `<div class="chips-s trip-flt">${[['all','全部',act.length],['ask','詢問中',cnt('ask')],['wait','等成團',cnt('wait')],['ok','已成團',cnt('ok')]].map(([k, l, n]) => `<button class="fc ${flt===k?'on':''} ${n||k==='all'?'':'dim'}" data-tf="${k}">${l} ${n}</button>`).join('')}</div>
      ${calHTML(shown)}
      ${go ? `<div class="trav-card" style="background:${colOf('go')[0]};border-left-color:${colOf('go')[1]};color:${colOf('go')[2]}"><b>旅行中・${shortName(go.name)}</b>　今天第 ${go.day} 天：${['抵達巴黎、塞納河散步','瑪黑區甜點與咖啡','羅浮宮半日、下午自由','精品自由逛','凡爾賽宮','自由日','蒙馬特與聖心堂','奧賽美術館','整理行李、機場','抵達台灣'][go.day-1] || '自由活動'}（示意，以領隊公告為準）</div>` : ''}
      <div class="rows">${shown.length ? shown.map(t => tripCard(t, hl === t.id)).join('') : `<p class="muted small">${act.length ? '這個狀態目前沒有行程。' : '還沒有行程。看到喜歡的團按「我想了解」，就會出現在這裡。'}</p>`}</div>
      ${S.demo ? `<div class="demo-row">${S.stage === 'confirmed' ? `<button class="txt-btn" id="toDec">示範：切回挑團中</button><button class="txt-btn" id="pvGo">${S.previewGo ? '結束旅行中預覽' : '預覽旅行中的樣子'}</button>` : '<button class="txt-btn" id="toConf">示範：看成團後的樣子</button>'}</div>` : ''}`;
  const el = $h(`<section class="pad mytrips">${topbar('我的行程', {home:true})}
    <div class="tabs2"><a href="#/me/trips" class="${ended?'':'on'}" ${ended?'':'aria-current="page"'}>接下來</a><a href="#/me/trips/ended" class="${ended?'on':''}">已結束 ${past.length}</a></div>
    ${body}</section>`);
  bindBack(el, 'me');
  if (hl) setTimeout(() => { const c = el.querySelector('.tcard.hl'); if (c) c.scrollIntoView({ block:'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); }, 120);
  S.tripHl = null;
  const re = () => { S._keepCal = true; save(); render(); };
  el.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => { S.tripFlt = b.dataset.tf; re(); });
  el.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { S.tripCal.open = b.dataset.cm === 'month'; re(); });
  el.querySelectorAll('[data-today]').forEach(b => b.onclick = () => { S.tripCal.focus = null; S.tripCal.ring = null; re(); });
  el.querySelectorAll('[data-wk]').forEach(b => b.onclick = () => { S.tripCal.focus = weekStart(S.tripCal.focus || nowMs()) + (+b.dataset.wk) * 7*DAY; S.tripCal.ring = null; re(); });
  el.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => { const f = new Date(S.tripCal.focus || nowMs()); S.tripCal.focus = Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + (+b.dataset.mo), 1); S.tripCal.ring = null; re(); });
  el.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => { S.tripCal.focus = +b.dataset.goto; S.tripCal.ring = +b.dataset.goto; re(); });
  el.querySelectorAll('[data-todo]').forEach(b => b.onclick = () => { const d = +b.dataset.todo; S.tripCal = { ...S.tripCal, open:true, focus:d, ring:d }; S.tripHl = b.closest('[data-trip]').dataset.trip; re(); });
  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => daySheet(+b.dataset.day, shown));
  const tc = el.querySelector('#toConf'); if (tc) tc.onclick = () => { S.stage = 'confirmed'; S.tripCal = { open:false, focus:null, ring:null }; save(); toast('示範：巴黎 3/18 團已成團'); render(); };
  const td = el.querySelector('#toDec'); if (td) td.onclick = () => { S.stage = 'deciding'; S.previewGo = false; save(); toast('已切回挑團中'); render(); };
  const pg = el.querySelector('#pvGo'); if (pg) pg.onclick = () => { S.previewGo = !S.previewGo; S.tripCal = { open:false, focus:null, ring:null }; save(); render(); };
  return el;
}
function daySheet(ms, list){
  const its = dayItems(ms, list), d = new Date(ms), hn = holName(ms);
  const rows = its.map(it => { if (it.kind === 'todo') { const c = colOf(it.x.cat);
      return `<div class="ds-it"><span class="tm">${it.x.tm || '全天'}</span><div class="bx" style="background:${c[0]};box-shadow:inset 3px 0 0 ${c[1]}"><b>${esc(it.x.t)}</b><span>${esc(shortName(it.t.name))}${it.x.at ? '・' + esc(it.x.at) : ''}</span></div></div>`; }
    const c = colOf(it.t.status === 'go' ? 'go' : it.t.status === 'wait' ? 'wait' : 'ok');
    const sub = it.first ? `今天出發，${dshort(it.t.end)} 回國` : it.last ? '今天回國' : `旅行第 ${it.n} 天`;
    return `<div class="ds-it"><span class="tm">全天</span><div class="bx" style="background:${it.t.status==='done'?'#F0EDE8':c[0]};box-shadow:inset 3px 0 0 ${it.t.status==='done'?'#8B847A':c[1]}"><b>${esc(fullName(it.t.name))}・${stLabel(it.t).split('・')[0]}</b><span>${sub}</span></div></div>`; }).join('');
  const team = its.some(it => it.t.team);
  openSheet(`<div class="sh-h"><b>${d.getUTCMonth()+1}/${d.getUTCDate()} 週${WD[d.getUTCDay()]}</b><span class="muted small">${hn ? `<b class="red-d">${hn}</b>・` : ''}${its.length} 件</span></div>
    ${rows || '<p class="muted small" style="padding:12px 0">這天沒有安排。</p>'}
    <div class="row3">${team ? '<a class="btn2 b2" href="#/team" data-close>團友牆</a>' : ''}${its.length ? '<button class="btn2 b2" id="dsIcs">加入行事曆</button>' : ''}<a class="btn2 b2" href="#/me/colors" data-close>修改顏色</a></div>`, (sh, close) => {
    const ic = sh.querySelector('#dsIcs'); if (ic) ic.onclick = () => { dayICS(ms, its); close(); };
    sh.querySelectorAll('a[data-close]').forEach(a => a.addEventListener('click', close)); });
}
function dayICS(ms, its){
  const f = x => dkey(x).replace(/-/g, ''), stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', ev = [];
  its.forEach((it, k) => { if (it.kind === 'todo') { const x = it.x, tm = x.tm ? x.tm.replace(':', '') + '00' : null;
      ev.push('BEGIN:VEVENT', `UID:${f(ms)}-${k}-${it.t.id}@fjuiec`, `DTSTAMP:${stamp}`, tm ? `DTSTART;TZID=Asia/Taipei:${f(ms)}T${tm}` : `DTSTART;VALUE=DATE:${f(ms)}`, tm ? `DURATION:PT1H` : `DTEND;VALUE=DATE:${f(ms + DAY)}`, `SUMMARY:${x.t}・${shortName(it.t.name)}`, x.at ? `LOCATION:${x.at}` : '', 'END:VEVENT'); }
    else if (it.first) ev.push('BEGIN:VEVENT', `UID:${f(ms)}-trip-${it.t.id}@fjuiec`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${f(it.t.start)}`, `DTEND;VALUE=DATE:${f(it.t.end + DAY)}`, `SUMMARY:${fullName(it.t.name)}（永信旅遊・示意）`, 'END:VEVENT'); });
  if (!ev.length) return toast('這天沒有可以加入的項目');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FJUIEC//YS Travel Prototype//ZH', ...ev.filter(Boolean), 'END:VCALENDAR'];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type:'text/calendar' })); a.download = 'ys-day.ics'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('已下載行事曆檔，打開就能加入');
}
function colorsView(){
  const cur = tripColors(), theme = Object.entries(THEMES).find(([, [, m]]) => COLOR_CATS.every(([k]) => m[k] === cur[k]));
  const prev = (k, kind) => { const c = PAL[cur[k]]; return k === 'wait' ? `<span class="cpv" style="border:1.3px dashed ${c[1]};color:${c[2]}">巴黎甜點</span>` : `<span class="cpv" style="background:${c[0]};color:${c[2]};box-shadow:inset 3px 0 0 ${c[1]}">${kind === 'trip' ? '巴黎甜點' : COLOR_CATS.find(x => x[0] === k)[1].split('・')[0]}</span>`; };
  const el = $h(`<section class="pad colors">${topbar('行程顏色', {home:true})}
    <div class="box"><h3>一鍵換主題</h3><div class="themes">${Object.entries(THEMES).map(([k, [l, m]]) => `<button class="th op ${theme && theme[0]===k?'on':''}" data-th="${k}"><i>${['ok','go','leave'].map(c => `<u style="background:${PAL[m[c]][0]};box-shadow:inset 0 0 0 1.5px ${PAL[m[c]][1]}"></u>`).join('')}</i>${l}</button>`).join('')}</div></div>
    <div class="box"><h3>逐項自訂</h3><p class="muted small">從淺色裡挑；意思靠文字，顏色只是好認</p>
      ${COLOR_CATS.map(([k, l, kind]) => `<div class="crow"><span class="cl">${l}</span>${prev(k, kind)}<span class="sw">${(kind === 'trip' ? TRIP_PAL : TODO_PAL).map(p => `<button class="${cur[k]===p?'on':''}" style="background:${PAL[p][0]};box-shadow:inset 0 0 0 1.5px ${PAL[p][1]}55" data-c="${k}:${p}" aria-label="${l}用${PAL[p][3]}"></button>`).join('')}</span></div>`).join('')}
      <p class="muted small">紅色數字固定代表六日與國定假日；已回國固定淡灰。</p>
      <button class="btn2 b2" id="reset">恢復預設</button></div></section>`);
  bindBack(el, 'me/trips');
  const put = colors => { S.prefs = { ...(S.prefs || {}), colors }; save(); pushMember({ prefs:{ ...S.prefs, line:S.lineSync, filters:S.fltDefault || null } }); render(); };
  el.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { put({ ...THEMES[b.dataset.th][1] }); toast('已換成「' + THEMES[b.dataset.th][0] + '」'); });
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const [k, p] = b.dataset.c.split(':'); put({ ...tripColors(), [k]:p }); });
  el.querySelector('#reset').onclick = () => { put(null); toast('已恢復預設'); };
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
if (typeof showSplash === 'function') showSplash();
checkBirthday();
loadRemote().then(() => { render(); checkBirthday(); });
