/* 歐洲旅人護照 App 原型｜旅客端
   資料：Supabase（匿名登入，只能讀寫自己的資料）；不同意時只在本機試玩，不寫入資料庫 */
const SB_URL = 'https://mmownoqzrhvgguxpukgl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tb3dub3F6cmh2Z2d1eHB1a2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMzA0NzEsImV4cCI6MjEwOTgwNjQ3MX0.yNToPLdGYZAQn9FfwmVk19Y1vOv6r5wC60bteGj_Yc4';
const sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SB_URL, SB_KEY) : null;

/* ===== 旅人檔案：A–E 五張卡（不放進一分鐘測驗） ===== */
const MONTHS = ['1 月','2 月','3 月','4 月','5 月','6 月','7 月','8 月','9 月','10 月','11 月','12 月'];
const CARDS = [
  {k:'card_a', t:'出發條件', pts:100, use:'推薦會依同行者、月份、天數與預算排序', qs:[
    {id:'companion', t:'和誰一起去？', o:['自己','另一半','朋友','家人']},
    {id:'months', t:'比較能出發的月份（可複選）', multi:true, o:['1–3 月','4–6 月','7–8 月','9–11 月','12 月']},
    {id:'days', t:'想玩幾天？', o:['8 天內','8–10 天','10–12 天','12 天以上']},
    {id:'budget', t:'每人預算', o:['8 萬以下','8–10 萬','10–13 萬','13–16 萬','16 萬以上']}]},
  {k:'card_b', t:'旅行耐受度', pts:100, use:'推薦會避開太熱、太累或有購物站的行程', qs:[
    {id:'hot', t:'怕熱嗎？', o:['很怕熱，想避開 7–8 月','還好','不怕熱']},
    {id:'walk', t:'一天可以走多少路？', o:['輕鬆就好','1–2 萬步可以','走多也沒問題']},
    {id:'maxDrive', t:'一次坐車最多幾小時？', o:['3 小時內','4 小時內','不在意']},
    {id:'shop', t:'購物站', o:['不要購物站','可以有一站','不在意']}]},
  {k:'card_c', t:'興趣', pts:100, use:'推薦原因與口袋名單會依你的興趣', qs:[
    {id:'interests', t:'旅行時最想做的事（可複選）', multi:true, o:['咖啡與甜點','展覽與美術館','音樂會','極光','自由購物時間','在地美食','拍照打卡']},
    {id:'explore', t:'吃東西的方式', o:['網紅名店','在地小店','名店先拍，再找在地小店']}]},
  {k:'card_d', t:'聯絡偏好', pts:50, use:'顧問會用你習慣的方式和時段聯絡，不用重問', qs:[
    {id:'contact', t:'怎麼聯絡你最方便？', o:['只要 LINE 文字','LINE 文字或電話','電話']},
    {id:'time', t:'方便的時段（可複選）', multi:true, o:['平日白天','午休','平日晚上','週末']}]},
  {k:'card_e', t:'生日與禮遇', pts:50, use:'生日月會收到小禮；禮物會挑你喜歡的類型', qs:[
    {id:'birthMonth', t:'生日月份', o:MONTHS},
    {id:'gift', t:'喜歡哪種小禮？', o:['香氛小樣','甜點禮盒','咖啡券','旅行小物']},
    {id:'surprise', t:'驚喜偏好', o:['私下的小驚喜','大家一起慶祝也可以']}]}
];
const PERKS = [['啟程','完成旅人檔案','生日月推播與小禮、角色卡'],['銀','第 2 次出團','由上次的顧問接手，不用重講需求；行前小禮包'],
  ['金','第 3–4 次出團','早鳥價或選位優先；異業合作周邊（咖啡、香氛、甜點）'],['晶鑽','第 5 次以上','返國後依足跡專屬推薦下一站；限量周邊']];

/* ===== 狀態（本機保存作答與檔案草稿） ===== */
const LS = 'ys_app_v1';
const S = Object.assign({tab:'home', screen:null, consent:null, i:0, me:null, prof:{}, favs:[], trip:null, quizDone:false},
  (()=>{try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return {}}})());
S.screen = null; S.trip = null;
if (S.ans) state.ans = S.ans; else S.ans = state.ans;
if (S.pace) { state.pace = S.pace; state.view = S.view || S.pace; }
function save(){ S.ans = state.ans; S.pace = state.pace; S.view = state.view;
  try{localStorage.setItem(LS, JSON.stringify({consent:S.consent, ans:S.ans, pace:S.pace, view:S.view, prof:S.prof, favs:S.favs, quizDone:S.quizDone, tab:S.tab}))}catch(e){} }
const online = () => sb && S.consent === 'yes';
const $h = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true, 2600); }

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
    const ins = await sb.from('customers').insert({ user_id:u.id, consent_at:new Date().toISOString(), source: new URLSearchParams(location.search).get('src') || '現場 QR' }).select().single();
    if (ins.error) { toast('建立資料失敗：' + ins.error.message); return null; }
    data = ins.data;
  }
  S.me = data; return data;
}
async function loadRemote(){
  if (!online()) return;
  const me = await ensureCustomer(); if (!me) return;
  const [p, f] = await Promise.all([
    sb.from('profiles').select('*').eq('customer_id', me.id).maybeSingle(),
    sb.from('favorites').select('trip_name').eq('customer_id', me.id)]);
  if (p.data) { CARDS.forEach(c => { if (p.data[c.k]) S.prof[c.k] = p.data[c.k]; }); }
  if (f.data) S.favs = f.data.map(x => x.trip_name);
  if (me.role_key && !state.pace) { state.pace = me.role_key; state.view = me.role_key; state.ans = me.answers || {}; S.quizDone = true; }
  save();
}
async function track(type, payload={}){ if (!online()) return; const me = await ensureCustomer(); if (!me) return;
  sb.from('events').insert({ customer_id:me.id, type, payload }).then(()=>{}); }

/* ===== 檔案 → 推薦：把檔案答案套進計分 ===== */
const done = c => { const v = S.prof[c.k]; return !!v && c.qs.every(q => v[q.id] !== undefined && !(Array.isArray(v[q.id]) && !v[q.id].length)); };
const completion = () => Math.round(CARDS.filter(done).length / CARDS.length * 100);
const points = () => CARDS.filter(done).reduce((s,c)=>s+c.pts, 0);
function applyProfile(){
  const a = Object.assign({}, S.ans || state.ans); const q12 = new Set(a.q12 || []);
  const b = S.prof.card_b || {}, A = S.prof.card_a || {}, C = S.prof.card_c || {};
  if (b.hot === 0) q12.add(4); if (b.shop === 0) q12.add(1); if (b.maxDrive === 0) q12.add(2);
  a.q12 = [...q12];
  if (A.budget !== undefined) a.q10 = A.budget;
  if (C.interests && C.interests.length) { const map = {0:4, 3:3, 5:0, 1:1}; const hit = C.interests.map(i=>map[i]).find(x=>x!==undefined); if (hit!==undefined) a.q6 = hit; }
  state.ans = a;
}
function recs(n=3){ applyProfile(); const r = recommend(state.view); state.ans = S.ans || state.ans; return r.slice(0,n); }
function scoreList(){ applyProfile(); const r = scoreAll(state.view); state.ans = S.ans || state.ans; return r; }

/* ===== 分頁 ===== */
const ICON = {
  home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  recs:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/></svg>',
  map:'<svg viewBox="0 0 24 24"><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  pass:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/></svg>',
  me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'};
const TABS = [['home','首頁'],['recs','推薦'],['map','地圖'],['pass','護照'],['me','我的']];
function drawTabs(){ const n = document.getElementById('tabs'); const hide = S.screen === 'start' || S.screen === 'quiz';
  n.hidden = hide; document.body.style.paddingBottom = hide ? '0' : '';
  n.innerHTML = TABS.map(([k,t]) => `<button data-t="${k}" ${S.tab===k && !S.screen ? 'aria-current="page"' : ''}>${ICON[k]}<span>${t}</span></button>`).join('');
  n.querySelectorAll('button').forEach(b => b.onclick = () => go(b.dataset.t)); }
function go(tab){ S.tab = tab; S.screen = null; S.trip = null; save(); render(); scrollTo(0,0); }
function render(){
  const app = document.getElementById('app'); app.innerHTML = '';
  if (!S.consent) S.screen = 'start'; else if (!S.quizDone && S.screen !== 'quiz') S.screen = S.screen || 'quizIntro';
  const v = S.screen === 'start' ? startView() : S.screen === 'quizIntro' ? quizIntro() : S.screen === 'quiz' ? quizView() :
    S.screen === 'result' ? resultView() : S.screen === 'trip' ? tripView() :
    ({home:homeView, recs:recsView, map:mapView, pass:passView, me:meView}[S.tab] || homeView)();
  app.append(v); drawTabs();
}

/* ===== 0. 啟動與同意 ===== */
function startView(){
  const el = $h(`<section class="screen">
    <div class="page">
      <p class="eyebrow">TRAVEL STYLE PASSPORT</p>
      <h1 style="font-size:28px">一分鐘找到自己的歐洲</h1>
      <p>12 題情境測驗，找出你的旅人角色，拿到 3 團適合你的歐洲行程。</p>
      <div class="consent">
        <b>我們會記錄什麼、用來做什麼</b>
        <ul style="margin:0;padding:0;display:flex;flex-direction:column;gap:6px">
          <li>測驗答案與旅人檔案：用來推薦行程，讓顧問接手時不用重問。</li>
          <li>不需要姓名、電話；用 6 碼交接代碼辨識你。</li>
          <li>隨時可以在「我的」刪除全部資料。</li>
        </ul>
      </div>
      <button class="btn cta" id="yes">同意並開始</button>
      <button class="btn ghost" id="no">不儲存，先試玩</button>
      <p class="help">課程原型（輔大創新創業社），行程與價格為示意。</p>
    </div></section>`);
  el.querySelector('#yes').onclick = async () => { S.consent = 'yes'; save(); S.screen = 'quiz'; S.i = 0; render(); await ensureCustomer(); track('quiz_start'); };
  el.querySelector('#no').onclick = () => { S.consent = 'no'; save(); S.screen = 'quiz'; S.i = 0; render(); };
  return el;
}
function quizIntro(){
  const el = $h(`<section class="screen"><div class="page"><h2>先做一分鐘測驗</h2><p>做完才能看推薦、地圖與護照。</p><button class="btn cta" id="go">開始 12 題測驗 →</button></div></section>`);
  el.querySelector('#go').onclick = () => { S.screen = 'quiz'; S.i = 0; render(); track('quiz_start'); };
  return el;
}

/* ===== 1. 測驗（沿用原型 12 題） ===== */
function quizView(){
  const q = QUESTIONS[S.i], multi = !!q.multi, cur = state.ans[q.id];
  const el = $h(`<section class="screen page">
    <div class="vig">${QIMG[S.i]}</div>
    <div class="progress">${QUESTIONS.map((_,k)=>`<span class="${k<=S.i?'on':''}"></span>`).join('')}</div>
    <div class="qhead"><span class="qnum">Q${S.i+1} / ${QUESTIONS.length}</span>${S.i>0?'<button class="back" id="back">← 上一題</button>':''}</div>
    <h2 class="qtitle">${q.t}</h2>${q.sub?`<p class="qsub">${q.sub}</p>`:''}
    <div class="opts">${q.o.map((o,k)=>{const on = multi ? (cur||[]).includes(k) : cur===k;
      return `<button class="opt" data-k="${k}" aria-pressed="${on}"><span class="k">${String.fromCharCode(65+k)}</span><span>${o[0]}</span></button>`}).join('')}</div>
    ${multi?'<button class="btn cta" id="done">完成，看我的旅人角色 →</button><p class="help">可複選，也可以都不選</p>':'<p class="help">點一下答案，就會自動進到下一題</p>'}
  </section>`);
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => { const k = +b.dataset.k;
    if (multi) { const s = new Set(state.ans[q.id]||[]); s.has(k)?s.delete(k):s.add(k); state.ans[q.id]=[...s]; b.setAttribute('aria-pressed', s.has(k)); return; }
    state.ans[q.id] = k; if (S.i < QUESTIONS.length-1) { S.i++; render(); } });
  const back = el.querySelector('#back'); if (back) back.onclick = () => { S.i--; render(); };
  const d = el.querySelector('#done'); if (d) d.onclick = finishQuiz;
  return el;
}
async function finishQuiz(){
  state.ans.q12 = state.ans.q12 || [];
  const sh = scores(); state.pace = topPace(sh); state.view = state.pace; S.quizDone = true; S.screen = 'result'; save(); render(); scrollTo(0,0);
  if (online()) { const me = await ensureCustomer(); if (me) {
    const sc = Object.fromEntries(Object.entries(sh).map(([k,v])=>[k, Math.round(v*100)/100]));
    const r = await sb.from('customers').update({ role_key:state.pace, role_scores:sc, answers:state.ans, updated_at:new Date().toISOString() }).eq('id', me.id).select().single();
    if (r.data) S.me = r.data; track('quiz_complete', { role:state.pace }); } }
}

/* ===== 共用元件 ===== */
function roleCard(full){
  const sh = scores(), p = state.view, P = PACES[p];
  return `<div class="visa"><span class="stamp">${S.me && S.me.code ? S.me.code : 'Lv.1'}</span>
    <p class="eyebrow">你的旅人角色</p>
    <div class="vhead"><div class="av">${av(P.ch,'start')}</div><div><h2>${P.name}</h2><span class="alias">${P.alias}</span></div></div>
    <p class="pace">${P.pace}${p!==state.pace?'（你自己切換的角色）':''}</p>
    ${full?`<p class="desc">${P.desc}</p>
    <div class="bars">${ROLE_ORDER.map(k=>`<div class="bar ${k===state.pace?'top':''}"><span>${PACES[k].short}</span><div class="track"><div class="fill" style="width:${Math.round(sh[k]*100)}%"></div></div><span class="v">${Math.round(sh[k]*100)}%</span></div>`).join('')}</div>
    <p class="note">五種分數都會保留，可以在推薦頁換個角色看看。</p>`:''}</div>`;
}
const regionOf = t => REGIONS.find(x => x.id === t.region);
function tripCard(r, k){
  const t = r.t, fav = S.favs.includes(t.name);
  return `<div class="card" data-k="${k}"><span class="t">${t.name}</span>
    <span class="m"><span>${AREA_NAME[regionOf(t).area]}・${regionOf(t).full}</span><span>${t.days} 天</span></span>
    <span class="price">約 ${t.from.toFixed(1)} 萬元起${t.est?'（示意）':''}</span>
    <span class="ttags"><i>步行 ${WALK[t.walk]}</i><i>最長車程 ${t.maxDrive} 小時</i><i>室內 ${t.indoor}%</i><i class="${t.shop?'warn':'ok'}">${t.shop?'含購物站':'無購物站'}</i></span>
    <span class="when">建議出發 ${t.months}｜當地均溫 ${t.temp}°C</span>
    ${r.why.length?`<span class="why">推薦原因：${r.why.join('、')}</span>`:''}
    <div class="acts"><button class="btn ghost" data-open="${k}">看行程 →</button><button class="fav" data-fav="${k}" aria-pressed="${fav}">${fav?'已收藏':'收藏'}</button></div></div>`;
}
function bindCards(el, list){
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { S.trip = list[+b.dataset.open].t.name; S.screen = 'trip'; render(); scrollTo(0,0); track('rec_click', { trip:S.trip }); });
  el.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => toggleFav(list[+b.dataset.fav].t.name, b));
}
async function toggleFav(name, btn){
  const on = !S.favs.includes(name); S.favs = on ? [...S.favs, name] : S.favs.filter(x => x !== name); save();
  if (btn) { btn.setAttribute('aria-pressed', on); btn.textContent = on ? '已收藏' : '收藏'; }
  toast(on ? '已收藏' : '已取消收藏');
  if (online()) { const me = await ensureCustomer(); if (!me) return;
    if (on) { await sb.from('favorites').insert({ customer_id:me.id, trip_name:name }); track('favorite', { trip:name }); }
    else await sb.from('favorites').delete().eq('customer_id', me.id).eq('trip_name', name); }
}

/* ===== 2. 結果頁 ===== */
function resultView(){
  const list = recs();
  const el = $h(`<section class="screen">${roleCard(true)}
    <div class="page"><div class="section-h"><h3>適合你的 3 團</h3><span class="tag">示意行程</span></div>
      <div class="cards">${list.map(tripCard).join('')}</div></div>
    <div class="page"><h3>補 5 張旅人檔案，推薦更準</h3>
      <p class="help">怕熱、走路、預算、興趣……完成可得 400 點、解鎖「啟程」禮遇</p>
      <button class="btn cta" id="toMe">填旅人檔案 →</button>
      <button class="btn ghost" id="toHome">先逛逛首頁</button></div></section>`);
  bindCards(el, list);
  el.querySelector('#toMe').onclick = () => go('me');
  el.querySelector('#toHome').onclick = () => go('home');
  return el;
}

/* ===== 3. 首頁 ===== */
function homeView(){
  const list = recs(), c = completion(), P = PACES[state.view];
  const el = $h(`<section class="screen">
    <div class="hello"><p class="eyebrow">WELCOME BACK</p><h1>${P.name}，今天想去哪？</h1></div>
    <div class="page"><div class="mini-role"><div class="av">${av(P.ch,'start')}</div><div><b>${P.name}</b><p class="help" style="margin:0">${P.alias}・${P.pace}</p></div></div>
      <div class="kv"><span>旅人檔案 ${c}%</span><span>${points()} 點</span></div><div class="prog"><i style="width:${c}%"></i></div>
      ${c<100?`<button class="btn ghost" id="fill">補檔案，推薦更準（還可得 ${400-points()} 點）</button>`:'<p class="help">檔案完成，已解鎖「啟程」禮遇</p>'}</div>
    <div class="page"><div class="section-h"><h3>為你推薦</h3><button class="tag" id="more" style="cursor:pointer">看全部 →</button></div>
      <div class="cards">${list.map(tripCard).join('')}</div></div>
    ${S.favs.length?`<div class="page"><h3>我的收藏</h3><ul class="hl">${S.favs.map(f=>`<li>${f}</li>`).join('')}</ul></div>`:''}
    <div class="page"><h3>想問問看？</h3><p class="help">按右上角「找顧問」，拿到交接代碼；顧問看到代碼就知道你的角色與在意的事。</p></div>
  </section>`);
  bindCards(el, list);
  const f = el.querySelector('#fill'); if (f) f.onclick = () => go('me');
  el.querySelector('#more').onclick = () => go('recs');
  return el;
}

/* ===== 4. 推薦頁（篩選＋全部行程） ===== */
function recsView(){
  const p = state.view;
  const el = $h(`<section class="screen"><div class="page">
    <div class="section-h"><h3>適合你的行程</h3><span class="tag">示意行程</span></div>
    <div class="row" role="group" aria-label="換個角色">${ROLE_ORDER.map(k=>`<button class="chip" data-p="${k}" aria-pressed="${k===p}">${PACES[k].short}</button>`).join('')}</div>
    ${completion()?'<p class="help" style="margin:0">已套用你的旅人檔案（怕熱、購物站、預算、興趣）</p>':''}
    <div class="flt" id="flt"></div><div class="cards" id="cards"></div></div></section>`);
  el.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.view = b.dataset.p; save(); render(); });
  const defs = filterDefs(p), flt = el.querySelector('#flt'), cards = el.querySelector('#cards');
  function draw(){
    const on = [...state.filters].filter(id => defs.some(d => d.id === id));
    flt.innerHTML = `<div class="fh"><b>依你在意的事篩選</b>${on.length?'<button class="fclear" id="fclear">清除</button>':'<span class="fcount">可複選</span>'}</div>
      ${GROUPS.map(g=>{const fs=defs.filter(d=>d.g===g);return fs.length?`<div class="fg"><span>${g}</span><div class="fc">${fs.map(f=>`<button class="fchip" data-f="${f.id}" aria-pressed="${state.filters.has(f.id)}">${f.label}</button>`).join('')}</div></div>`:''}).join('')}`;
    const list = on.length ? scoreList().filter(r => on.every(id => defs.find(d => d.id === id).test(r.t))).slice(0,6) : scoreList().slice(0,6);
    cards.innerHTML = list.length ? list.map(tripCard).join('') : '<div class="empty">沒有同時符合的示意行程，試著取消一個條件。</div>';
    bindCards(cards, list);
    flt.querySelectorAll('.fchip').forEach(b => b.onclick = () => { const f = b.dataset.f; state.filters.has(f)?state.filters.delete(f):state.filters.add(f); draw(); });
    const c = flt.querySelector('#fclear'); if (c) c.onclick = () => { state.filters.clear(); draw(); };
  }
  draw(); return el;
}

/* ===== 5. 行程詳情 ===== */
function tripView(){
  const r = scoreList().find(x => x.t.name === S.trip) || { t:TRIPS.find(x=>x.name===S.trip), why:[] }; const t = r.t, g = regionOf(t);
  const [title, sub] = t.name.split('｜'); const fav = S.favs.includes(t.name);
  const lo = +t.temp.split('–')[0], tip = lo <= 5 ? '天冷乾燥：洋蔥式保暖、手套毛帽，記得加強保濕' : hot(t) ? '天熱日曬：中午排室內，帶防曬與水' : '早晚溫差大：帶一件薄外套，好走的鞋';
  const fits = ROLE_ORDER.filter(k => PACES[k].tempo === t.pace).map(k => PACES[k].short).join('、');
  const el = $h(`<section class="screen">
    <button class="back" id="bk" style="align-self:flex-start">← 返回</button>
    <div class="page"><div class="trip-h"><p class="eyebrow">${AREA_NAME[g.area]}・${g.full}</p><h2>${title}</h2><p>${sub||''}</p></div>
      <div class="kv"><span>${t.days} 天</span><span>約 ${t.from.toFixed(1)} 萬元起${t.est?'（示意）':''}</span></div>
      <span class="ttags"><i>步行 ${WALK[t.walk]}</i><i>最長車程 ${t.maxDrive} 小時</i><i>室內 ${t.indoor}%</i><i class="${t.shop?'warn':'ok'}">${t.shop?'含購物站':'無購物站'}</i></span>
      ${r.why.length?`<p class="why">推薦原因：${r.why.join('、')}</p>`:''}
      ${fits?`<p class="help" style="margin:0">最適合：${fits}</p>`:''}</div>
    <div class="page"><h3>行程重點</h3><ul class="hl">${(sub||'').split('、').map(s=>`<li>${s}</li>`).join('')}<li>${t.stay?'連泊為主，不用每天換飯店':'每 1–2 晚換一次城市'}</li><li>${t.shop?'安排一站購物':'不安排購物站'}</li></ul>
      <p class="note">每日行程為課程示意，正式版改用永信行程表。</p></div>
    <div class="page"><h3>出發與天氣</h3><div class="kv"><span>建議出發</span><b>${t.months}</b></div><div class="kv"><span>當地均溫</span><b>${t.temp}°C</b></div><p class="help" style="margin:0">${tip}</p></div>
    <div class="page"><button class="btn cta" id="ask">我想了解這團 →</button>
      <div class="row2"><button class="fav" id="fv" aria-pressed="${fav}">${fav?'已收藏':'收藏'}</button><button class="fav" id="sh">傳給旅伴</button></div></div>
  </section>`);
  el.querySelector('#bk').onclick = () => { S.screen = null; render(); };
  el.querySelector('#fv').onclick = e => toggleFav(t.name, e.currentTarget);
  el.querySelector('#ask').onclick = () => openAdvisor(t.name);
  el.querySelector('#sh').onclick = () => shareTrips([t]);
  return el;
}
async function shareTrips(trips){
  const text = `我是「${PACES[state.view].name}」，想跟你一起看看：\n${trips.map((t,i)=>`${i+1}. ${t.name}（約 ${t.from.toFixed(1)} 萬元起）`).join('\n')}\n你也做做看一分鐘測驗：${location.href.split('#')[0].split('?')[0]}`;
  track('share', { n:trips.length });
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch(e) {}
  try { await navigator.clipboard.writeText(text); toast('已複製，可以貼給旅伴'); } catch(e) { toast('請截圖傳給旅伴'); }
}

/* ===== 6. 地圖（沿用原型探索地圖） ===== */
function mapView(){
  const first = recs()[0].t.region;
  const el = $h(`<section class="screen"><div class="page">
    <div class="section-h"><h3>歐洲探索地圖</h3><span class="tag">永信官網 23 個歐洲分類</span></div>
    <p class="note">青綠色是推薦你的第一站。點國家或分類，看看那裡有哪些行程。</p>
    <div class="mapbox" id="map"></div>
    <div class="legend"><span><i style="background:var(--north)"></i>北歐</span><span><i style="background:var(--west)"></i>西歐</span><span><i style="background:var(--east)"></i>東歐</span><span><i style="background:var(--south)"></i>南歐</span><span><i style="background:var(--sel)"></i>目前選取</span><span><i style="background:var(--off-area)"></i>非永信歐洲線</span></div>
    <div class="info" id="info" aria-live="polite"></div><div class="cats" id="cats"></div></div></section>`);
  state.mapSel = null; mapUI(el, first); return el;
}

/* ===== 7. 護照 ===== */
function passView(){
  const P = PACES[state.view], trips = (S.me && S.me.trips_taken) || 0, lv = trips >= 5 ? 3 : trips >= 3 ? 2 : trips >= 2 ? 1 : 0;
  const el = $h(`<section class="screen">
    <div class="page"><div class="pp-head"><div class="av">${av(P.ch, TIERS[lv][0])}</div><div><p class="eyebrow">我的歐洲旅人護照</p><h2 style="font-size:22px">${P.name}</h2><span class="alias">${P.alias}・${TIERS[lv][1]}等級</span></div></div>
      <div class="pp-stats"><div><b>${trips}</b><span>出團次數</span></div><div><b>${points()}</b><span>旅人點數</span></div><div><b>${completion()}%</b><span>檔案完成</span></div></div></div>
    <div class="page"><div class="section-h"><h3>等級禮遇</h3><span class="tag">數位護照，不印實體</span></div>
      <div class="perks">${PERKS.map(([n,c,d],i)=>`<div class="${i===lv?'now':''}"><b>${n}${i===lv?'<small>目前</small>':''}</b><span>${d}<small>${c}</small></span></div>`).join('')}</div>
      <p class="help">點數在報名時折抵團費（1 點折 1 元，示意）；護照只在 App 與 LINE 裡。</p></div>
    <div class="page"><div class="section-h"><h3>足跡地圖</h3><span class="tag">出團後點亮</span></div>
      <p class="help" style="margin:0">${trips?`已出團 ${trips} 次，足跡會依永信訂單紀錄點亮。`:'第一次出團後，這裡會點亮你去過的國家，並推薦下一站。'}</p></div>
  </section>`);
  return el;
}

/* ===== 8. 我的：旅人檔案、交接代碼、資料管理 ===== */
function meView(){
  const c = completion();
  const el = $h(`<section class="screen">
    <div class="page"><div class="section-h"><h3>我的旅人檔案</h3><span class="tag">${c}%・${points()} 點</span></div>
      <div class="prog"><i style="width:${c}%"></i></div>
      <p class="help" style="margin:0">每一題旁邊都寫了用途；可隨時修改。${S.consent==='yes'?'':'目前是試玩模式，不會存到資料庫。'}</p>
      <div id="cards" style="display:flex;flex-direction:column;gap:12px"></div></div>
    <div class="page"><h3>交接代碼</h3>
      ${S.consent==='yes'?`<p class="code">${S.me&&S.me.code||'…'}</p><p class="help" style="margin:0">把代碼告訴顧問，顧問就能看到你的角色、檔案與收藏。</p>`:'<p class="help" style="margin:0">試玩模式沒有交接代碼。</p><button class="btn ghost" id="optin">同意儲存，產生代碼</button>'}</div>
    <div class="page"><h3>資料與設定</h3>
      <button class="btn ghost" id="redo">重新做測驗</button>
      <button class="danger" id="del">刪除我的全部資料</button>
      <p class="help" style="margin:0">刪除後，測驗、檔案、收藏與詢問紀錄都會清除，無法復原。</p></div>
  </section>`);
  const box = el.querySelector('#cards');
  CARDS.forEach(card => box.append(profileCard(card)));
  const o = el.querySelector('#optin'); if (o) o.onclick = async () => { S.consent = 'yes'; save(); await ensureCustomer(); await pushAll(); render(); toast('已同意儲存'); };
  el.querySelector('#redo').onclick = () => { state.ans = {}; S.ans = {}; S.quizDone = false; S.i = 0; S.screen = 'quiz'; save(); render(); };
  const del = el.querySelector('#del'); del.onclick = async () => {
    if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = '再按一次，確定刪除'; return; }
    if (online() && S.me) { await sb.from('customers').delete().eq('id', S.me.id); await sb.auth.signOut(); }
    try { localStorage.removeItem(LS); } catch(e) {}
    location.reload();
  };
  if (S.consent === 'yes' && !S.me) ensureCustomer().then(() => { const p = el.querySelector('.code'); if (p && S.me) p.textContent = S.me.code; });
  return el;
}
function profileCard(card){
  const v = Object.assign({}, S.prof[card.k] || {}); const ok = done(card);
  const el = $h(`<div class="pcard"><div class="h"><b>${card.t}</b><span class="st ${ok?'ok':''}">${ok?'已完成':'+'+card.pts+' 點'}</span></div>
    <p class="use">用途：${card.use}</p>
    ${card.qs.map(q=>`<div class="pq" data-q="${q.id}"><span>${q.t}</span><div class="fc">${q.o.map((o,k)=>{const on = q.multi ? (v[q.id]||[]).includes(k) : v[q.id]===k;
      return `<button class="fchip" data-k="${k}" aria-pressed="${on}">${o}</button>`}).join('')}</div></div>`).join('')}
    <button class="btn ghost" data-save>儲存「${card.t}」</button></div>`);
  el.querySelectorAll('.pq').forEach(div => { const q = card.qs.find(x => x.id === div.dataset.q);
    div.querySelectorAll('.fchip').forEach(b => b.onclick = () => { const k = +b.dataset.k;
      if (q.multi) { const s = new Set(v[q.id]||[]); s.has(k)?s.delete(k):s.add(k); v[q.id] = [...s]; b.setAttribute('aria-pressed', s.has(k)); }
      else { v[q.id] = k; div.querySelectorAll('.fchip').forEach(x => x.setAttribute('aria-pressed', x === b)); } }); });
  el.querySelector('[data-save]').onclick = async () => {
    const before = done(card); S.prof[card.k] = v; save(); const after = done(card);
    toast(after ? (before ? '已更新' : `完成「${card.t}」，+${card.pts} 點`) : '已儲存，還有題目沒填');
    await pushAll(); if (after && !before) track('profile_card', { card:card.k });
    render();
  };
  return el;
}
async function pushAll(){
  if (!online()) return; const me = await ensureCustomer(); if (!me) return;
  const row = { customer_id:me.id, completion:completion(), points:points(), updated_at:new Date().toISOString() };
  CARDS.forEach(c => { if (S.prof[c.k]) row[c.k] = S.prof[c.k]; });
  const r = await sb.from('profiles').upsert(row); if (r.error) toast('檔案儲存失敗：' + r.error.message);
}

/* ===== 9. 找顧問：交接代碼＋QR＋摘要 ===== */
function label(card, qid, val){ const q = CARDS.find(c=>c.k===card).qs.find(x=>x.id===qid); if (val===undefined) return null;
  return Array.isArray(val) ? val.map(i=>q.o[i]).join('、') : q.o[val]; }
function summaryLines(){
  const P = PACES[state.view], a = S.prof.card_a||{}, b = S.prof.card_b||{}, c = S.prof.card_c||{}, d = S.prof.card_d||{};
  return [['角色', `${P.name}（${P.short}）`], ['同行', label('card_a','companion',a.companion)], ['月份', label('card_a','months',a.months)],
    ['預算', label('card_a','budget',a.budget)], ['在意', [b.hot===0?'怕熱':null, b.shop===0?'不要購物站':null, b.walk===0?'走路輕鬆':null, b.maxDrive===0?'車程 3 小時內':null].filter(Boolean).join('、')||null],
    ['興趣', label('card_c','interests',c.interests)], ['聯絡', [label('card_d','contact',d.contact), label('card_d','time',d.time)].filter(Boolean).join('，')||null]].filter(x => x[1]);
}
async function openAdvisor(tripName){
  const bg = document.getElementById('sheetBg'), sh = document.getElementById('sheet');
  const close = () => { bg.hidden = true; sh.hidden = true; };
  bg.onclick = close; bg.hidden = false; sh.hidden = false;
  if (!S.quizDone) { sh.innerHTML = `<div class="grab"></div><h3>先做一分鐘測驗</h3><p class="help">做完測驗，顧問才知道怎麼推薦你。</p><button class="btn ghost" id="x">關閉</button>`; sh.querySelector('#x').onclick = close; return; }
  if (S.consent !== 'yes') {
    sh.innerHTML = `<div class="grab"></div><h3>找顧問</h3><p>交接代碼需要儲存你的測驗與檔案，顧問才看得到。</p>
      <button class="btn cta" id="ok">同意儲存，產生代碼</button><button class="btn ghost" id="x">先不要</button>`;
    sh.querySelector('#x').onclick = close;
    sh.querySelector('#ok').onclick = async () => { S.consent = 'yes'; save(); await ensureCustomer(); await finishSync(); openAdvisor(tripName); };
    return;
  }
  sh.innerHTML = `<div class="grab"></div><h3>產生交接代碼中…</h3>`;
  const me = await ensureCustomer();
  if (!me) { sh.innerHTML = `<div class="grab"></div><h3>目前連不上資料庫</h3><p class="help">請稍後再試，或直接開 LINE 詢問。</p><button class="btn ghost" id="x">關閉</button>`; sh.querySelector('#x').onclick = close; return; }
  if (tripName) { await sb.from('inquiries').insert({ customer_id:me.id, trip_name:tripName }); track('inquiry', { trip:tripName }); }
  const qr = (()=>{ try { const q = qrcode(0, 'M'); q.addData(me.code); q.make(); return q.createSvgTag({ cellSize:5, margin:2, scalable:true }); } catch(e) { return ''; } })();
  const lines = summaryLines();
  sh.innerHTML = `<div class="grab"></div>
    <p class="eyebrow">交接代碼</p><p class="code">${me.code}</p><div class="qr">${qr}</div>
    <p class="help" style="margin:0">把代碼報給顧問，或讓顧問掃 QR；顧問會看到下面這張摘要，不用再重問一次。</p>
    <div class="sumcard">${tripName?`<b>想了解：${tripName}</b>`:'<b>我的摘要</b>'}${lines.map(([k,v])=>`<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('')}
      ${completion()<100?`<p class="help" style="margin:0">旅人檔案 ${completion()}%，補完會更準</p>`:''}</div>
    <button class="btn cta" id="line">開啟 LINE 傳給顧問</button><button class="btn ghost" id="x">關閉</button>`;
  sh.querySelector('#x').onclick = close;
  sh.querySelector('#line').onclick = () => openLine(lineMsg(`我的交接代碼是 ${me.code}${tripName?`，想了解「${tripName}」`:''}`));
}
async function finishSync(){ if (!online() || !state.pace) return; const me = await ensureCustomer(); if (!me) return;
  const sh = scores(); await sb.from('customers').update({ role_key:state.pace, role_scores:Object.fromEntries(Object.entries(sh).map(([k,v])=>[k,Math.round(v*100)/100])), answers:state.ans }).eq('id', me.id);
  await pushAll(); }

/* ===== 啟動 ===== */
document.getElementById('goHome').onclick = () => { if (S.quizDone) go('home'); };
document.getElementById('openAdvisor').onclick = () => openAdvisor(null);
render();
loadRemote().then(() => { if (!S.screen || S.screen === 'result') render(); });
