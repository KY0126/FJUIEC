// 品牌提案簡報模板（16:9，10 頁）— 匯入 Canva 編輯用
// 座標以 1920×1080 的 px 撰寫，換算：1px = 1/144 英吋，字級 px ÷ 2 = pt
const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/mnt/skills/public/pptx/scripts/apply_theme.js');

const OUT = process.argv[2] || 'deck.pptx';
const IMG = __dirname + '/img/';
const FONT = 'Noto Sans TC';
const THEME = {
  name: 'YS Orange', headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: '3A3330', lt1: 'FFFFFF', dk2: 'F59312', lt2: 'FBF8F4',
    accent1: 'F59312', accent2: 'EE8A45', accent3: 'F7B98A', accent4: 'FDE3CC',
    accent5: '7A6E66', accent6: 'EFEBE7', hlink: 'F59312', folHlink: '8A3C0A' }
};
const K = { main: 'F59312', mainDk: '8A3C0A', mainMid: 'EE8A45', pink: 'F7B98A', pinkL: 'FDE3CC', pinkLine: 'F6C9A4',
  bg: 'FBF8F4', ink: '3A3330', sub: '7A6E66', gray: 'EFEBE7', grayT: 'B5ADA6', grayLine: 'DDD6CF',
  ph: 'F1EBE4', phLine: 'D6CBC0', phT: '93877C', white: 'FFFFFF', alt: 'FDF9F5', rowLine: 'ECE2D8', capOn: 'F6C29A' };

const I = v => v / 144;          // px → inch
const P = v => v / 2;            // px → pt

const pres = new pptxgen();
pres.defineLayout({ name: 'HD', width: 13.333, height: 7.5 });
pres.layout = 'HD';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = '永信旅遊 × 旅行風格測驗 提案簡報';

const CHAPTERS = [
  { name: '開場痛點', subs: ['①破冰與自我介紹', '②市場痛點'] },
  { name: '方案價值', subs: ['③你的解決方案', '④獨特價值與優勢'] },
  { name: '模式實績', subs: ['⑤商業與獲利模式', '⑥競爭品與成本結構'] },
  { name: '行動結論', subs: ['⑦未來藍圖與本次請求', '⑧強力結論'] },
];
const SUB_ALL = CHAPTERS.flatMap(c => c.subs);

// ---------- 基本元件 ----------
function rect(s, x, y, w, h, o = {}) {
  s.addShape(o.r ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE, {
    x: I(x), y: I(y), w: I(w), h: I(h),
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: o.line ? { color: o.line, width: o.lw || 1.5, dashType: o.dash || 'solid' } : { type: 'none' },
    rectRadius: o.r ? I(Math.min(o.r, Math.min(w, h) / 2)) : undefined,
    objectName: o.name,
  });
}
function text(s, t, x, y, w, h, o = {}) {
  s.addText(t, {
    x: I(x), y: I(y), w: I(w), h: I(h), isTextBox: true, margin: 0,
    fontFace: FONT, fontSize: P(o.size || 30), color: o.color || K.ink, bold: !!o.bold,
    align: o.align || 'left', valign: o.valign || 'middle', fit: 'none',
    lineSpacingMultiple: o.ls || 1.15, charSpacing: o.cs, objectName: o.name,
  });
}
// 可點擊的網址（只放在 p.3 的 QR 旁）：名稱取自標語「一分鐘找到自己的歐洲」
const APP_URL = 'https://ky0126.github.io/FJUIEC/find-my-europe';
function appLink(s, x, y, w, h) {
  const o = { hyperlink: { url: APP_URL, tooltip: '開啟歐洲旅人護照 App' } };
  s.addText([{ text: 'ky0126.github.io/FJUIEC/', options: { ...o, breakLine: true } }, { text: 'find-my-europe', options: o }], {
    x: I(x), y: I(y), w: I(w), h: I(h), isTextBox: true, margin: 0, fontFace: FONT, fontSize: P(19), color: K.main, bold: true,
    underline: { style: 'sng' }, align: 'left', valign: 'top', fit: 'none', lineSpacingMultiple: 1.05, objectName: '網址_find-my-europe' });
}
// 依字數估算寬度（中文字 = 1，英數 = 0.55）
function tw(str, size) { let n = 0; for (const ch of str) n += /[\x00-\x7F]/.test(ch) ? 0.56 : 1; return n * size; }

// ---------- 上方進度條 ----------
function progressBar(s, curSub /* 0..7，-1 = 目錄 */) {
  rect(s, 0, 0, 1920, 190, { fill: K.white, name: '進度條底' });
  rect(s, 0, 189, 1920, 2, { fill: 'EEE4DA', name: '進度條分隔線' });
  text(s, '永信旅遊', 24, 40, 170, 48, { size: 32, bold: true, color: K.main, align: 'center', name: '進度條_品牌名稱' });
  const tocOn = curSub < 0;
  rect(s, 49, 104, 120, 44, { r: 22, fill: tocOn ? K.main : K.white, line: K.main, lw: 1.8, name: '目錄按鈕' });
  text(s, '☰ 目錄', 49, 104, 120, 44, { size: 22, color: tocOn ? K.white : K.main, align: 'center', name: '目錄按鈕文字' });

  // 章節寬度依細項文字長度分配
  const capW = CHAPTERS.map(c => c.subs.map(t => tw(t, 20) + 24));
  const need = capW.map(a => a[0] + a[1] + 8 + 32);
  const total = 1920 - 24 - 208 - 14 * 3;
  const extra = (total - need.reduce((a, b) => a + b, 0)) / 4;
  let x = 208;
  CHAPTERS.forEach((c, ci) => {
    const w = need[ci] + extra;
    const on = Math.floor(curSub / 2) === ci;
    rect(s, x, 16, w, 158, { r: 18, fill: on ? K.pinkL : K.gray, name: `進度條_第${ci + 1}章底` });
    text(s, c.name, x + 16, 28, w - 32, 64, { size: 44, bold: true, color: on ? K.main : K.grayT, cs: 2, name: `進度條_第${ci + 1}章` });
    let cx = x + 16;
    c.subs.forEach((t, si) => {
      const idx = ci * 2 + si, now = idx === curSub;
      const cw = capW[ci][si];
      rect(s, cx, 116, cw, 40, { r: 10, fill: now ? K.main : K.white, line: now ? K.main : (on ? K.capOn : K.grayLine), lw: 1.2, name: `細項${idx + 1}` });
      text(s, t, cx, 116, cw, 40, { size: 20, color: now ? K.white : (on ? K.main : K.grayT), align: 'center', name: `細項${idx + 1}文字` });
      cx += cw + 8;
    });
    x += w + 14;
  });
}

function titleRow(s, chip, title) {
  const cw = tw(chip, 26) + 36;
  rect(s, 96, 230, cw, 52, { r: 10, fill: K.main, name: '章節標籤' });
  text(s, chip, 96, 230, cw, 52, { size: 26, bold: true, color: K.white, align: 'center', name: '章節標籤文字' });
  text(s, title, 96 + cw + 22, 218, 1824 - (96 + cw + 22), 76, { size: 56, bold: true, name: '標題（寫主旨）' });
}

function footer(s, page, speaker = 1) {
  s.addShape(pres.shapes.OVAL, { x: I(96), y: I(1014), w: I(40), h: I(40), fill: { color: K.main }, line: { type: 'none' }, objectName: '講者編號底' });
  text(s, String(speaker), 96, 1014, 40, 40, { size: 24, bold: true, color: K.white, align: 'center', name: '講者編號' });
  text(s, '講者姓名', 148, 1012, 400, 44, { size: 28, bold: true, name: '講者姓名' });
  text(s, `${page} / 13`, 1624, 1012, 200, 44, { size: 24, color: K.sub, align: 'right', name: '頁碼' });
}

function imgBox(s, x, y, w, h, hint, name = '圖片框') {
  rect(s, x, y, w, h, { r: 24, fill: K.ph, line: K.phLine, lw: 2, dash: 'dash', name });
  text(s, '拖入圖片', x, y + h / 2 - 50, w, 52, { size: 34, bold: true, color: K.phT, align: 'center', name: name + '_提示' });
  text(s, hint, x + 30, y + h / 2 + 8, w - 60, 44, { size: 26, color: K.phT, align: 'center', name: name + '_說明' });
}

// 右側三張卡：第三張實心，代表這頁最重要的一句
function cards(s, items, x = 1132, w = 692) {
  const top = 330, gap = 26, h = (660 - gap * 2) / 3;
  items.forEach(([label, main, hint], i) => {
    const y = top + i * (h + gap), solid = i === 2;
    rect(s, x, y, w, h, { r: 24, fill: solid ? K.main : K.white, line: i === 0 ? K.pinkLine : K.main, lw: 2.2, name: `卡片${i + 1}` });
    text(s, label, x + 34, y, 130, h, { size: 38, bold: true, color: solid ? 'FFE6D1' : 'F59312', name: `卡片${i + 1}_標籤` });
    text(s, main, x + 180, y + 34, w - 214, 70, { size: 54, bold: true, color: solid ? K.white : K.ink, valign: 'bottom', name: `卡片${i + 1}_主句` });
    text(s, hint, x + 180, y + 110, w - 214, 46, { size: 32, color: solid ? 'FFF1E3' : K.sub, valign: 'top', name: `卡片${i + 1}_說明` });
  });
}

function contentSlide({ sub, chip, title, page, speaker, img, imgs, items, notes, left, after }) {
  const s = pres.addSlide({ sectionTitle: CHAPTERS[Math.floor(sub / 2)].name });
  s.background = { color: K.bg };
  progressBar(s, sub);
  titleRow(s, chip, title);
  if (left) left(s);
  else if (imgs) { imgBox(s, 96, 330, 487, 660, imgs[0], '圖片框1'); imgBox(s, 609, 330, 487, 660, imgs[1], '圖片框2'); }
  else imgBox(s, 96, 330, 1000, 660, img);
  cards(s, items);
  if (after) after(s);
  footer(s, page, speaker);
  s.addNotes(notes);
  return s;
}


// 影片獨立成頁（不佔內容頁）：最前面的開場影片（寫完淡入封面）、最後面的結尾影片（結論頁淡出後寫出標語與 Logo）
// 預覽圖：開場用影片第一格、結尾用結論頁截圖，所以從上一頁切過來看不出接縫；按一下播放
function videoSlide(kind){
  if (process.env.NO_VIDEO) return;   // 產生結論頁截圖時，先輸出沒有影片頁的版本
  const n = kind === 'open' ? 'p1' : 'p13', coverFile = kind === 'open' ? 'cover_open.png' : 'cover_p13.png';
  pres.addSection({ title: kind === 'open' ? '開場影片' : '結尾影片' });
  const s = pres.addSlide({ sectionTitle: kind === 'open' ? '開場影片' : '結尾影片' });
  s.background = { color: K.bg };
  const cover = 'data:image/png;base64,' + require('fs').readFileSync(IMG + coverFile).toString('base64');
  s.addMedia({ type: 'video', path: IMG + `open_${n}.mp4`, x: 0, y: 0, w: I(1920), h: I(1080), cover, objectName: kind === 'open' ? '開場影片（按一下播放）' : '結尾影片（按一下播放）' });
  s.addNotes(kind === 'open'
    ? '【開場影片・不算頁數】上台後按一下播放（約 4.6 秒，有聲音，先確認教室喇叭）：品牌 Jingle「一分鐘找到自己的歐洲～咿呦，永信旅遊～」，手風琴伴奏、標語照筆順一筆一筆寫出、每一筆都有寫字聲，「咿呦」配一聲牛鈴；接著橘色底線 → 永信 Logo 逐筆寫出 → 淡入封面。人聲是 AI 合成的示意歌聲。播完翻到下一頁就是封面，畫面會接起來。時間不夠時可以直接跳過這頁。'
    : '【結尾影片・不算頁數】結論與 Q&A 講完後翻到這頁、按一下播放（約 5 秒）：結論頁淡出 → 手寫標語 → 橘色底線 → 永信 Logo，停在 Logo 畫面。時間不夠時可以直接略過。');
}
videoSlide('open');

// ================= 1 封面 =================
pres.addSection({ title: '封面與目錄' });
{
  const s = pres.addSlide({ sectionTitle: '封面與目錄' });
  s.background = { color: 'F59312' };
  text(s, '輔大創新創業社 課程專案｜2026 年 11 月', 120, 120, 900, 44, { size: 26, color: 'FFE6D1', name: '場合與日期' });
  s.addImage({ path: IMG + 'ys_mark_white.png', x: I(120), y: I(184), w: I(112), h: I(60), objectName: '封面_永信旅遊標誌' });
  text(s, '永信旅遊', 120, 250, 900, 170, { size: 150, bold: true, color: K.white, cs: 4, name: '封面_品牌名稱' });
  text(s, '一分鐘找到自己的歐洲', 120, 450, 900, 80, { size: 60, bold: true, color: K.white, name: '封面_品牌標語' });
  text(s, '旅行風格測驗 × LINE 分眾經營提案', 120, 548, 900, 50, { size: 32, color: 'FFF1E3', name: '封面_副標' });
  // 地圖圖例（配色沿用原型：北歐、西歐、東歐、南歐為永信官網歐洲分類；灰色為非永信歐洲線）
  [['D6E1EC', '北歐'], ['FDE3B5', '西歐'], ['EBDDC3', '東歐'], ['FAEFC8', '南歐'], ['CFC8C1', '非永信歐洲線']].forEach(([c, t], i) => {
    const x = 120 + i * 138;
    rect(s, x, 806, 26, 26, { r: 6, fill: c, line: 'FFFFFF', lw: 1.5, name: `圖例_${t}_色塊` });
    text(s, t, x + 34, 800, 150, 38, { size: 22, color: 'FFF1E3', name: `圖例_${t}` });
  });
  s.addShape(pres.shapes.LINE, { x: I(120), y: I(870), w: I(40), h: 0, line: { color: 'E0201B', width: 3, dashType: 'dash' }, objectName: '圖例_歐洲範圍_線' });
  text(s, '歐洲範圍（永信歐洲線涵蓋國家）', 172, 852, 600, 38, { size: 22, color: 'FFF1E3', name: '圖例_歐洲範圍' });
  text(s, '輔大創新創業社', 120, 930, 900, 44, { size: 26, color: 'FFE6D1', name: '封面_單位' });
  s.addImage({ path: IMG + 'cover_map_cut.png', x: I(870), y: I(40), w: I(970), h: I(970 * 3040 / 3069), objectName: '封面主視覺（原型歐洲探索地圖，去背）' });
  text(s, '1 / 13', 1624, 1012, 200, 44, { size: 24, color: 'FFE6D1', align: 'right', name: '頁碼' });
  s.addNotes([
    '【這頁要做到】讓主管一眼認出品牌：名稱、標誌、標語三個品牌要素都要清楚。',
    '【概念】品牌要素（名稱、標誌、標語、代表色）；品牌再認＝看到時認得出來。',
    '【開場影片】封面前一頁是獨立的開場影片（不算頁數），播完淡入這頁；時間不夠可以直接從這頁開始。',
    '【提醒】標語「一分鐘找到自己的歐洲」和第 2 頁漏斗下方、第 13 頁結論一字不差；主視覺為原型的「歐洲探索地圖」（測驗完成後的結果頁），已去背放大並標上國名，拿掉「第一站」標記。配色沿用原型：藍＝北歐、淺橘＝西歐、米褐＝東歐、淺黃＝南歐（永信官網歐洲分類），灰＝不在永信歐洲線；紅色虛線框出永信歐洲線涵蓋的歐洲國家（不含摩洛哥）。縮寫：盧＝盧森堡、斯＝斯洛維尼亞、波赫＝波士尼亞、蒙＝蒙特內哥羅、北馬＝北馬其頓、阿＝阿爾巴尼亞。永信標誌（白色版）放在品牌名稱上方，第 2 頁漏斗入口也有。',
  ].join('\n'));
}

// ================= 2 目錄 =================
{
  const s = pres.addSlide({ sectionTitle: '封面與目錄' });
  s.background = { color: K.bg };
  progressBar(s, -1);
  titleRow(s, '目錄', '四個段落，從認識我們一路走到互信');
  // 品牌名稱與標語（漏斗入口）
  s.addImage({ path: IMG + 'ys_mark.png', x: I(112), y: I(302), w: I(112), h: I(60), objectName: '目錄_永信旅遊標誌' });
  text(s, '永信旅遊', 238, 300, 320, 38, { size: 32, bold: true, color: K.main, name: '目錄_品牌名稱' });
  text(s, '一分鐘找到自己的歐洲', 238, 336, 320, 30, { size: 24, name: '目錄_品牌標語' });
  const X = [628, 1108, 1438], CW = [440, 300, 372];
  ['概念', '工具', '結論'].forEach((t, j) => text(s, t, X[j], 306, 200, 50, { size: 34, bold: true, color: K.main, name: `表頭_${t}` }));
  const W = [460, 420, 380, 340, 300], cx = 96 + 230, Y0 = 378, H = 128, G = 10;
  const rows = [
    ['開場痛點', K.pinkL, K.main, 'C46A2A', 'p.3–4', '品牌要素、品牌再認\nSTP 區隔與目標', '6W、AEIOU、親和圖\n同理心地圖、人物誌', '客人說「都可以」，\n對話就斷了'],
    ['方案價值', K.pink, K.mainDk, K.main, 'p.5–6', 'STP 定位\n品牌形象（強度、偏好度、獨特性）', 'POV、HMW\n原型、價值主張圖', '一分鐘測驗＋LINE 接手，\n被懂、不被推銷'],
    ['模式實績', K.mainMid, '5C2A08', '7A3A10', 'p.7–11', '品牌價值鏈\n競爭定位（共同點與差異點）', '服務藍圖', '降低選擇成本，\n提高成交與回購'],
    ['行動結論', K.main, K.white, 'FFE6D1', 'p.12–13', '品牌金字塔（共鳴）\n品牌回想', 'MVP（試辦計畫）', '先用一條線、四個月\n證明它有效'],
  ];
  rows.forEach(([name, fill, tc, pc, pg, c, t, r], i) => {
    const y = Y0 + i * (H + G), a = W[i] / 2, b = W[i + 1] / 2;
    rect(s, 590, y, 1234, H, { r: 18, fill: i % 2 ? K.alt : K.white, line: K.rowLine, lw: 1.2, name: `表格第${i + 1}列` });
    // 漏斗梯形：用自由形狀畫，Canva 可改顏色
    s.addShape(pres.shapes.TRAPEZOID, { x: I(cx - a), y: I(y), w: I(2 * a), h: I(H), fill: { color: fill }, line: { type: 'none' },
      flipV: true, rectRadius: I(a - b), objectName: `漏斗第${i + 1}層` });
    text(s, name, 96, y + 14, 460, 64, { size: 48, bold: true, color: tc, align: 'center', cs: 3, name: `漏斗第${i + 1}層_章名` });
    text(s, pg, 96, y + 80, 460, 32, { size: 24, color: pc, align: 'center', name: `漏斗第${i + 1}層_頁碼` });
    [c, t, r].forEach((v, j) => text(s, v, X[j], y, CW[j] + 10, H, { size: 28, ls: 1.3, name: `表格第${i + 1}列_${['概念', '工具', '結論'][j]}` }));
  });
  [1096, 1414].forEach((xx, k) => rect(s, xx, Y0 + 14, 2, 4 * (H + G) - G - 28, { fill: K.rowLine, name: `欄分隔線${k + 1}` }));
  const yb = Y0 + 4 * (H + G) - G;
  rect(s, 166, yb + 18, 320, 62, { r: 31, fill: K.white, line: K.main, lw: 2.2, name: '目錄_標語膠囊' });
  text(s, '一分鐘找到自己的歐洲', 166, yb + 18, 320, 62, { size: 28, bold: true, color: K.main, align: 'center', name: '目錄_標語膠囊文字' });
  footer(s, 2);
  s.addNotes([
    '【這頁要做到】主管只看這頁，就知道整份簡報的四段、每段根據什麼、得到什麼結論。',
    '【漏斗】由上往下越來越窄：範圍越收越小、關係越來越深。上方是品牌入口（再認），下方是品牌出口（回想），兩處標語要相同。',
    '【右側四句結論】開場痛點：客人說「都可以」，對話就斷了。方案價值：一分鐘測驗加 LINE 接手，客人被懂、不被推銷。模式實績：降低選擇成本，提高成交與回購。行動結論：先用一條線、四個月證明它有效。',
    '【對照品牌金字塔】開場痛點＝顯著性；方案價值＝表現與形象；模式實績＝判斷與感受；行動結論＝共鳴。',
    '【引用】STP 與品牌知識、品牌金字塔、品牌價值鏈參考 Keller 的 CBBE 架構；把它們排成一條漏斗是本簡報的整理方式。',
  ].join('\n'));
}

// ================= 3–10 內容頁 =================
pres.addSection({ title: '開場痛點' });
function imgIn(s, file, iw, ih, x, y, w, h, name) {
  const sc = Math.min(w / iw, h / ih), W = iw * sc, H = ih * sc;
  s.addImage({ path: IMG + file, x: I(x + (w - W) / 2), y: I(y + (h - H) / 2), w: I(W), h: I(H), objectName: name });
}
function imgPanel(s, file, iw, ih, name) {
  rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: name + '_底框' });
  imgIn(s, file, iw, ih, 120, 350, 952, 620, name);
}
contentSlide({ sub: 0, chip: '開場痛點｜①破冰與自我介紹', title: '我們不只帶簡報，帶了一個能用的原型', page: 3, speaker: 1,
  left: s => {
    rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '原型外觀_底框' });
    const ph = (x, file, nm) => s.addImage({ path: IMG + file, x: I(x), y: I(342), w: I(320), h: I(636), objectName: `手機畫面_${nm}` });
    ph(116, 'app_homenew.png', 'App首頁'); ph(456, 'phone_line.png', 'LINE官方帳號');
    const dot = (n, x, y) => {
      s.addShape(pres.shapes.OVAL, { x: I(x), y: I(y), w: I(50), h: I(50), fill: { color: K.main }, line: { color: K.white, width: 2.5 }, objectName: `重點圈${n}` });
      text(s, String(n), x, y, 50, 50, { size: 28, bold: true, color: K.white, align: 'center', name: `重點圈${n}_數字` });
    };
    dot(1, 400, 500); dot(2, 400, 384); dot(3, 740, 860);
    const feats = [['1', '手機打開就能玩', '不用下載，一分鐘做完'], ['2', '加入主畫面', '像 App 一樣全螢幕開啟'], ['3', '接上 LINE', '結果直接交給顧問']];
    feats.forEach(([n, h, d], i) => {
      const y = 380 + i * 138;
      s.addShape(pres.shapes.OVAL, { x: I(814), y: I(y + 4), w: I(40), h: I(40), fill: { color: K.main }, line: { type: 'none' }, objectName: `重點說明${n}_圈` });
      text(s, n, 814, y + 4, 40, 40, { size: 22, bold: true, color: K.white, align: 'center', name: `重點說明${n}_數字` });
      text(s, h, 866, y, 210, 48, { size: 26, bold: true, name: `重點說明${n}_標題` });
      text(s, d, 866, y + 46, 210, 70, { size: 20, color: K.sub, valign: 'top', name: `重點說明${n}_說明` });
    });
    s.addImage({ path: IMG + 'qr_app.png', x: I(820), y: I(800), w: I(120), h: I(120), objectName: '原型 QR Code（App 首頁）' });
    appLink(s, 812, 926, 280, 58);
    text(s, '掃描試玩\n手機 App', 952, 812, 130, 96, { size: 22, bold: true, color: K.main, ls: 1.3, name: '原型_掃描說明' });
  },
  items: [['名稱', '輔大創新創業社', '課程專案團隊'], ['帶來', '可操作原型', '加上 13 頁提案'], ['標語', '找到自己的歐洲', '完整：一分鐘找到自己的歐洲']],
  notes: ['【這頁要回答】我們是誰、帶了什麼來：輔大創新創業社的課程專案，為永信旅遊歐洲線提案，而且帶了一個主管可以當場用手機試的原型。',
    '【左側原型】左手機是 App 版原型首頁（ky0126.github.io/FJUIEC/app/），還沒做測驗時，最上方就是測驗入口；做完會換成角色卡、點數與推薦。是手機網頁，不用下載；在 iPhone Safari 按「分享 → 加入主畫面」、Android Chrome 按「安裝」後，會像 App 一樣全螢幕開啟。右手機是 LINE 官方帳號示意畫面：歡迎訊息附測驗入口，圖文選單可找真人顧問。這頁只講外觀，功能細節留到第 5 頁。右下 QR 與網址 ky0126.github.io/FJUIEC/find-my-europe（取自標語「一分鐘找到自己的歐洲」，可直接點）開 App 首頁；全份簡報只有這頁放 QR；評審若沒時間做測驗，可在啟動頁按「我已經是永信旅客」用示範帳號林雅婷進入。',
    '【講稿】本案延續永信「旅行・由你定義」的品牌主張：讓說不出想去哪裡的人，一分鐘找到自己的歐洲。請主管掃右下 QR，邊聽邊試。',
    '【概念】品牌要素與品牌再認：永信標誌（YS）出現在第 2 頁漏斗入口，與品牌名稱、標語一起建立再認。標語「一分鐘找到自己的歐洲」會在第 13 頁原句重複，用來做品牌回想。LINE 畫面為提案示意，非永信現有帳號畫面。'].join('\n') });

// ----- 4：市場痛點（左：林雅婷完整資訊，右：神秘客截圖） -----
{
  const s = pres.addSlide({ sectionTitle: '開場痛點' });
  s.background = { color: K.bg };
  progressBar(s, 1);
  titleRow(s, '開場痛點｜②市場痛點', '客人說「都可以」，對話就斷了');
  rect(s, 96, 330, 1000, 566, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '林雅婷_底框' });
  // 林雅婷頭貼：圓框＋人像超出上緣（可在 Canva 替換）
  s.addImage({ path: IMG + 'lin_avatar.png', x: I(116), y: I(344), w: I(158), h: I(166), objectName: '林雅婷_頭貼（示意照片，非本人）' });
  text(s, '林雅婷｜主要客群', 288, 360, 500, 46, { size: 34, bold: true, name: '林雅婷_姓名' });
  text(s, '28 歲・台北・行銷企劃（小網美）・柴郡貓型', 288, 408, 790, 36, { size: 26, color: K.sub, name: '林雅婷_背景' });
  text(s, '「告訴我幾個適合我的就好。」', 288, 458, 780, 46, { size: 32, bold: true, color: K.main, name: '林雅婷_引言' });
  [['個性', '懶得排行程、慢熟、喜歡獨處；怕熱，一熱就煩躁'], ['生活', '和閨蜜同行・養貓「抹茶」・晚上 9 點後才做旅遊決定'], ['想要', '1–3 月去芬蘭看極光，下次去巴黎買 Cartier']].forEach(([l, t], i) => {
    text(s, l, 126, 524 + i * 36, 70, 34, { size: 22, bold: true, color: K.main, name: `林雅婷_${l}_標籤` });
    text(s, t, 196, 524 + i * 36, 880, 34, { size: 22, name: `林雅婷_${l}` });
  });
  const emp = [
    ['想法', '「給我幾個適合的就好，\n不要一大堆資料」', K.alt], ['看見', '小紅書的極光貼文\n官網一長串行程', K.alt], ['聽見', '閨蜜說想一起去\n朋友說跟團很趕又熱', K.alt],
    ['說法', '「都可以」\n「目前沒有太多想法」', K.alt], ['痛點', '被丟官網連結、購物站\n怕熱、怕擠、怕花錯錢', 'FBEAE3'], ['獲得', '三個排好的選項\n不早起、有自己的時間', 'EEF5E8'],
  ];
  const ew = (940 - 24) / 3;
  emp.forEach(([l, t, f], i) => {
    const x = 126 + (i % 3) * (ew + 12), y = 642 + Math.floor(i / 3) * 124;
    rect(s, x, y, ew, 114, { r: 14, fill: f, line: K.rowLine, lw: 1, name: `同理心地圖_${l}` });
    text(s, l, x + 18, y + 8, ew - 30, 34, { size: 24, bold: true, color: K.main, name: `同理心地圖_${l}_標題` });
    text(s, t, x + 18, y + 44, ew - 30, 66, { size: 22, valign: 'top', ls: 1.2, name: `同理心地圖_${l}_內容` });
  });
  rect(s, 1132, 330, 692, 566, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '神秘客截圖_底框' });
  const ch = 500, cw = 648 * ch / 985, cx0 = 1156, cy0 = 346;
  s.addImage({ path: IMG + 'mystery_chat.png', x: I(cx0), y: I(cy0), w: I(cw), h: I(ch), objectName: '神秘客截圖（永信 LINE 官方帳號）' });
  [[0.25, '反問目的地', '約 5 分鐘後\n只問想去哪些國家'], [0.48, '客人沒有想法', '「都可以」\n「沒有太多想法」'], [0.72, '收到官網首頁', '約 24 分鐘後\n對話結束，沒留資料']].forEach(([f, h, d], i) => {
    const y = cy0 + ch * f - 26, x = cx0 + cw + 18;
    s.addShape(pres.shapes.OVAL, { x: I(x), y: I(y), w: I(40), h: I(40), fill: { color: K.mainMid }, line: { type: 'none' }, objectName: `標註${i + 1}_圓` });
    text(s, String(i + 1), x, y, 40, 40, { size: 24, bold: true, color: K.white, align: 'center', name: `標註${i + 1}_號碼` });
    text(s, h, x + 52, y - 2, 1806 - x - 52, 40, { size: 26, bold: true, name: `標註${i + 1}_標題` });
    text(s, d, x + 52, y + 40, 1806 - x - 52, 64, { size: 21, color: K.sub, valign: 'top', ls: 1.25, name: `標註${i + 1}_說明` });
  });
  text(s, '團隊神秘客實測，2026/10/17', 1150, 852, 656, 34, { size: 22, color: K.sub, align: 'center', name: '神秘客截圖_來源' });
  // 底部三點結論列
  [['客群', '說不出想去哪的年輕客'], ['證據', '24 分鐘只收到官網連結'], ['時機', '團費漲，客人更怕選錯']].forEach(([l, t], i) => {
    const w = (1728 - 32) / 3, x = 96 + i * (w + 16), solid = i === 2;
    rect(s, x, 912, w, 76, { r: 38, fill: solid ? K.main : K.white, line: i === 0 ? K.pinkLine : K.main, lw: 2.2, name: `結論列${i + 1}` });
    text(s, l, x + 34, 912, 80, 76, { size: 28, bold: true, color: solid ? 'FFE6D1' : 'F59312', name: `結論列${i + 1}_標籤` });
    text(s, t, x + 120, 912, w - 140, 76, { size: 28, bold: true, color: solid ? K.white : K.ink, name: `結論列${i + 1}_文字` });
  });
  footer(s, 4, 1);
  s.addNotes(['【這頁要回答】市場痛點：客人說「都可以」的那一刻，選擇又回到客人身上。',
    '【右側故事】團隊擔任神秘客詢問「歐洲有哪些產品」，服務人員約 5 分鐘後反問想去哪些國家；客人回答「都可以」「目前沒有太多想法」後，約 24 分鐘收到官網首頁連結，對話就此結束，沒有留下客人資料。服務人員有顧問直覺，問題是問不出目的地時，手上沒有工具。',
    '【左側人物】林雅婷，28 歲台北行銷企劃，主要客群。頭貼為示意照片（非本人）。人物誌與同理心地圖依團隊假設與觀察案例建立，待原型數據與訪談驗證；「說法」取自右側觀察案例。',
    '【人物補充｜一句話】28 歲台北行銷企劃，和大學閨蜜同行，家裡有一隻英短貓「抹茶」。上班有效率、下班只想被安排；慢熟、怕熱、懶得排行程。喜歡抹茶、甜點、精品咖啡和香氛，旅行是找靈感和充電。第一趟想 1–3 月去芬蘭看極光，下一趟想去巴黎買 Cartier 手環。她要的不是便宜，而是「很像我、不用動腦、照片好看，而且值得離開抹茶這幾天」。',
    '【完整人物誌】個性、作息、飲食、穿搭、美妝、節日與旅行行為等細節，見《林雅婷人物誌（完整版）》，供提案書與組員排練使用；被問到時口頭補充即可。',
    '【F 對提案】推薦卡只給三張並附原因，加標籤：每日步行量、最長車程、室內外比例、無購物站（p.5）；LINE 自動承接、顧問隔天用文字接手（p.5）；依角色推薦現有行程、不推購物站（p.6）；不打擾的領隊與口袋名單（p.9）；兩趟歐洲由旅人護照帶來回購（p.12）。',
    '【底部結論】客群：說不出想去哪的年輕客／證據：24 分鐘只收到官網連結／時機：團費漲 NT$1,000–5,000，客人更怕選錯。',
    '【數據】官網歐洲線 23 個子區域、超過百個行程，18% 標示「請電洽」。歐美團費漲 NT$1,000–5,000（三立新聞 2026/11/2），客人更怕選錯。次要客群陳建宏（56 歲、2024 年後沉睡的老客）於商業模式頁說明。',
    '【概念】STP 區隔與目標＋同理工具（人物誌、同理心地圖、6W）。這頁只講問題，服務留到下一頁。'].join('\n'));
}

pres.addSection({ title: '方案價值' });
contentSlide({ sub: 2, chip: '方案價值｜③你的解決方案', title: '一分鐘測驗，把「都可以」變成三個選項', page: 5, speaker: 2,
  left: s => {
    rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '原型底框' });
    // 手機示意：圓角螢幕、狀態列、動態島（整張圖可在 Canva 替換）
    const ph = (x, file, nm) => s.addImage({ path: IMG + file, x: I(x), y: I(342), w: I(320), h: I(636), objectName: `手機畫面_${nm}` });
    ph(116, 'app_result.png', '角色卡'); ph(456, 'app_trip.png', '行程詳情');
    const dot = (n, x, y) => {
      s.addShape(pres.shapes.OVAL, { x: I(x), y: I(y), w: I(50), h: I(50), fill: { color: K.main }, line: { color: K.white, width: 2.5 }, objectName: `重點圈${n}` });
      text(s, String(n), x, y, 50, 50, { size: 28, bold: true, color: K.white, align: 'center', name: `重點圈${n}_數字` });
    };
    dot(1, 400, 720); dot(2, 400, 470); dot(3, 740, 700); dot(4, 740, 850);
    const feats = [['1', '五種角色分數', '不被定型，可換角色'], ['2', '護照等級換材質', '出團越多，頭像越精緻'], ['3', '累不累一眼看', '步行量、最長車程\n室內外、無購物站'], ['4', '推薦原因＋找顧問', '按一下就交給 LINE']];
    feats.forEach(([n, h, d], i) => {
      const y = 370 + i * 112;
      s.addShape(pres.shapes.OVAL, { x: I(814), y: I(y + 4), w: I(40), h: I(40), fill: { color: K.main }, line: { type: 'none' }, objectName: `重點說明${n}_圈` });
      text(s, n, 814, y + 4, 40, 40, { size: 22, bold: true, color: K.white, align: 'center', name: `重點說明${n}_數字` });
      text(s, h, 866, y, 210, 48, { size: 26, bold: true, name: `重點說明${n}_標題` });
      text(s, d, 866, y + 46, 210, 60, { size: 20, color: K.sub, valign: 'top', ls: 1.15, name: `重點說明${n}_說明` });
    });
  },
  items: [['痛點', '說不出想去哪', 'POV：現在只會被問目的地'], ['服務', '測驗＋LINE 接手', '旅人護照帶回下一次'], ['好處', '一分鐘拿到推薦', '顧問接得住，不必重問']],
  notes: ['【這頁要回答】我們怎麼解決：前端 12 題旅行風格測驗，把模糊偏好轉成五種旅人角色與推薦；中段由 LINE 官方帳號立即承接、把客人摘要交給顧問；後段以歐洲旅人護照帶來回購。',
    '【原型】左側為 App 版原型（ky0126.github.io/FJUIEC/app/）的實際畫面：左手機是角色卡，保留五種角色分數；右手機是林雅婷第一名推薦「巴黎精品與甜點 10 天」的行程詳情，上方四格標示累不累，下方寫出推薦原因，按「我想了解」就產生交接代碼交給顧問。在 App 裡按「加入比較」可和另一團並排比較；現場請評審用第 3 頁的 QR 進 App 操作。',
    '【四個行程標籤】③ 每張推薦卡標示：每日步行量（輕鬆／適中／較多）、最長單趟車程、室內外比例、無購物站。來自林雅婷人物誌：怕累、怕熱、懶得看行程表、討厭購物站；她不用打開行程表就知道累不累。App 行程詳情與比較頁已用這四個標籤，並附建議出發月份與當地均溫；Q12 可選「天氣太熱」「購物站太多」，會影響排序與推薦原因。目前數字為示意，正式版需永信提供各團的步行量、車程與購物安排。',
    '【NES 分眾】N 新客：測驗把說不出目的地的人分成五種角色，LINE 承接；E 既有客：顧問依角色與偏好推薦、記錄在數位旅人護照（CRM）；S 沉睡客：從訂單紀錄回溯點亮足跡地圖，分眾喚醒回購。行程沿用永信現有產品，不改團體作業。',
    '【方案架構】三層架構圖（提案書圖 6）未放在畫面上：新客從測驗進入，老客從訂單紀錄進入，兩者都回到旅人護照。',
    '【MVP】第一階段只用 LINE 後台內建功能（認證帳號、來源 QR、歡迎訊息、圖文選單、保底回覆、手動標籤、分眾推播），不需要開發。',
    '【概念與工具】POV 定義問題、HMW 轉成機會、原型呈現解法；「痛點、服務、好處」第一次完整出現，第 13 頁用同樣關鍵字收尾。'].join('\n') });

contentSlide({ sub: 3, chip: '方案價值｜④獨特價值與優勢', title: '這個位置只有大廠做得到，我們讓中小型也做得起', page: 6, speaker: 2,
  left: s => {
    rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '定位圖_底框' });
    const X0 = 196, Y0 = 356, PW = 874, PH = 530, MX = X0 + PW / 2, MY = Y0 + PH / 2;
    // 四格
    rect(s, X0, Y0, PW / 2, PH / 2, { fill: 'F6F2EE', line: K.white, lw: 3, name: '定位圖_左上格' });
    rect(s, X0, MY, PW / 2, PH / 2, { fill: 'F6F2EE', line: K.white, lw: 3, name: '定位圖_左下格' });
    rect(s, MX, MY, PW / 2, PH / 2, { fill: 'F6F2EE', line: K.white, lw: 3, name: '定位圖_右下格' });
    rect(s, MX, Y0, PW / 2, PH / 2, { fill: K.pinkL, line: K.mainMid, lw: 3, name: '定位圖_右上格（空位）' });
    text(s, '人工・深引導\n靠個人經驗', X0 + 18, Y0 + 12, 300, 70, { size: 22, color: K.sub, valign: 'top', ls: 1.2, name: '格名_左上' });
    text(s, '人工・淺引導', X0 + 18, Y0 + PH - 50, 300, 40, { size: 22, color: K.sub, name: '格名_左下' });
    text(s, '自動・淺引導\n產品分類與折扣', MX + PW / 2 - 318, MY + 12, 300, 70, { size: 22, color: K.sub, align: 'right', valign: 'top', ls: 1.2, name: '格名_右下' });
    text(s, '自動＋深引導', MX + 22, Y0 + 14, 260, 46, { size: 30, bold: true, color: K.main, name: '格名_右上' });
    rect(s, MX + 24, Y0 + 66, 220, 44, { r: 22, fill: K.main, name: '大廠才做得到_標籤' });
    text(s, '只有大廠做得到', MX + 24, Y0 + 66, 220, 44, { size: 22, bold: true, color: K.white, align: 'center', name: '大廠才做得到_文字' });
    // 軸
    text(s, '深', X0 - 58, Y0, 44, 40, { size: 24, bold: true, color: K.sub, align: 'center', name: '縱軸_深' });
    text(s, '淺', X0 - 58, Y0 + PH - 40, 44, 40, { size: 24, bold: true, color: K.sub, align: 'center', name: '縱軸_淺' });
    s.addText('需求引導深度 →', { x: I(X0 - 196), y: I(MY - 22), w: I(300), h: I(44), rotate: 270, fontFace: 'Noto Sans TC', fontSize: P(26), bold: true, color: K.ink, align: 'center', valign: 'middle', margin: 0, objectName: '縱軸標題' });
    text(s, '低', X0, Y0 + PH + 8, 60, 36, { size: 22, color: K.sub, name: '橫軸_低' });
    text(s, '高', X0 + PW - 60, Y0 + PH + 8, 60, 36, { size: 22, color: K.sub, align: 'right', name: '橫軸_高' });
    text(s, '自動化程度 →（不用等真人就有回應）', X0 + 100, Y0 + PH + 8, PW - 200, 40, { size: 26, bold: true, align: 'center', name: '橫軸標題' });
    // 同業灰點
    const gdot = (nm, x, y) => {
      s.addShape(pres.shapes.OVAL, { x: I(x - 16), y: I(y - 16), w: I(32), h: I(32), fill: { color: 'C9C1BA' }, line: { type: 'none' }, objectName: `點_${nm}` });
      text(s, nm, x + 24, y - 22, 140, 44, { size: 26, color: '6E6560', name: `點_${nm}_名稱` });
    };
    gdot('五福', 371, 572); gdot('山富', 698, 668); gdot('可樂', 853, 712); gdot('雄獅', 961, 818);
    rect(s, X0 + 4, MY + 4, PW / 2 - 8, PH / 2 - 8, { line: K.main, lw: 3, dash: 'dash', name: '人工淺引導格_虛線框（永信現況）' });
    s.addShape(pres.shapes.OVAL, { x: I(328), y: I(742), w: I(36), h: I(36), fill: { color: K.white }, line: { color: K.main, width: 3 }, objectName: '點_永信現況（空心）' });
    text(s, '永信現況', 266, 782, 160, 40, { size: 26, bold: true, color: K.main, align: 'center', name: '點_永信現況_名稱' });
    s.addShape(pres.shapes.OVAL, { x: I(948), y: I(392), w: I(64), h: I(64), fill: { color: K.main }, line: { color: K.white, width: 3 }, objectName: '點_永信提案' });
    text(s, '永信提案', 900, 460, 160, 44, { size: 30, bold: true, color: K.main, align: 'center', name: '點_永信提案_名稱' });
    s.addShape(pres.shapes.OVAL, { x: I(684), y: I(530), w: I(32), h: I(32), fill: { color: 'C9C1BA' }, line: { type: 'none' }, objectName: '點_雄獅LiLi' });
    text(s, '雄獅 AI 客服 LiLi', 726, 516, 330, 36, { size: 24, color: '6E6560', name: '點_雄獅LiLi_名稱' });
    text(s, '投入約 3 億元', 726, 552, 330, 32, { size: 20, color: K.sub, name: '點_雄獅LiLi_說明' });
    text(s, '團隊 2026/10/17 觀察旅行社 LINE 官方帳號；LiLi 依經濟日報 2026/4/10，位置為相對區域', 120, 942, 952, 32, { size: 18, color: K.sub, align: 'center', name: '定位圖_資料來源' });
  },
  items: [['強度', '五種旅人角色', '好記、可分享的角色卡'], ['偏好度', '被懂不被推銷', '依角色推薦現有行程'], ['獨特性', '先懂人再推團', '測驗分群＋NES 經營']],
  notes: ['【這頁要回答】為什麼選我們：右上角「自動化又深度引導」不是沒人做，而是只有大廠做得到：雄獅投入約 3 億元做 AI 客服 LiLi。其他同業的 LINE 官方帳號入口以產品分類與折扣為主；五福等同業會口頭詢問體驗，但依賴個人經驗、無法記錄。本提案用測驗分群加 LINE 內建功能，讓永信用中小型的成本走到這個位置。',
    '【與雄獅 LiLi 的差別】LiLi 2025 Q1 上線，24 小時文字接手並主動推薦，成交客人平均年輕 15 歲、約四成服務量在晚上 6 點到隔天早上 9 點（經濟日報 2026/4/10、蕃新聞 2026/4/23），證明「深夜、文字、年輕客」的需求是真的。差別：LiLi 是投入約 3 億元、由 70–80 位真人業務在後台承接的大型專案；本提案第一年約 12–28 萬，用測驗分角色、LINE 內建功能與數位護照，同時經營新客、既有客、沉睡客（NES）。雄獅右下角的灰點是它的 LINE 官方帳號，右上角是網站上的 LiLi，兩者是不同入口。',
    '【概念】STP 定位＋品牌形象：聯想的強度（五種旅人角色）、偏好度（被懂、不被推銷）、獨特性（先懂人再推團，測驗分群＋NES）。',
    '【資料】定位圖為團隊 2026/10/17 單次實測；第 10 頁會用歐洲線競品資料補強這個差異點。',
    '【App 對照】App 的旅伴頁：邀請同行的人做測驗，系統算出合拍度、兩人都在意的事和都適合的 3 團，雙方各得 100 點，邀請人收到通知。這是「先懂人再推團」的擴散環節：一位客人帶來一位新客（NES 的 N）。'].join('\n') });

pres.addSection({ title: '模式實績' });
// ----- 7–8：商業模式圖（完整九宮格＋品牌價值鏈，非本頁格子加遮罩） -----
const VC = ['行銷投入', '顧客心智', '市場表現', '帶來價值'];
const TAGS = { 投入: ['F7B98A', '8A3C0A'], 心智: [K.main, K.white], '表現・價值': [K.mainMid, '5C2A08'] };
const CW5 = (1728 - 40) / 5, GX = i => 96 + i * (CW5 + 10), TOPY = 400, RH = (590 - 156 - 20) / 2;
const BLOCKS = {
  kp: { n: '關鍵夥伴', t: '投入', x: GX(0), y: TOPY, w: CW5, h: RH * 2 + 10, lines: ['航空、歐洲飯店', '地接與體驗供應商', 'LINE 官方帳號', '領隊、導遊', '異業合作品牌'] },
  ka: { n: '關鍵活動', t: '投入', x: GX(1), y: TOPY, w: CW5, h: RH, lines: ['測驗分群、推薦', '顧問接手', '旅人護照經營'] },
  kr: { n: '關鍵資源', t: '投入', x: GX(1), y: TOPY + RH + 10, w: CW5, h: RH, lines: ['103 團歐洲產品', '顧問與領隊經驗', 'LINE 帳號、訂單'] },
  vp: { n: '價值主張', t: '心智', x: GX(2), y: TOPY, w: CW5, h: RH * 2 + 10, big: '一分鐘找到\n適合自己的\n歐洲旅程', lines: ['依角色推薦現有行程', '被懂、不被推銷', '每趟旅程留下', '下次出發的理由'] },
  cr: { n: '顧客關係', t: '心智', x: GX(3), y: TOPY, w: CW5, h: RH, lines: ['測驗互動、顧問接手', '護照等級與禮遇', '返國後分眾喚醒'] },
  ch: { n: '通路', t: '心智', x: GX(3), y: TOPY + RH + 10, w: CW5, h: RH, lines: ['LINE、官網、社群', '搜尋、五地門市', '旅展'] },
  cs: { n: '目標客群', t: '心智', x: GX(4), y: TOPY, w: CW5, h: RH * 2 + 10, seg: [['主要', '想去歐洲、\n說不出目的地的\n年輕新客'], ['次要', '12 個月未出團的\n高價值老客']] },
  co: { n: '成本結構', t: '投入', x: GX(0), y: TOPY + RH * 2 + 20, w: CW5 * 3 + 20, h: 156, lines: ['團體成本（機票、住宿、地接）　顧問人力　LINE 月費 1,000 起', '網頁開發 5–15 萬（含數位護照）　禮遇與周邊獎品（團費 1–3%）'] },
  rv: { n: '收益流', t: '表現・價值', x: GX(3), y: TOPY + RH * 2 + 20, w: CW5 * 2 + 10, h: 156, lines: ['詢價、成交、回購 → 團費（中位數 10.99 萬）', '沉睡客喚醒回購　推薦帶來的新客'] },
};
function bmcSlide({ title, page, vcOn, focus, notes }) {
  const s = pres.addSlide({ sectionTitle: '模式實績' });
  s.background = { color: K.bg };
  progressBar(s, 4);
  titleRow(s, '模式實績｜⑤商業與獲利模式', title);
  // 品牌價值鏈箭頭
  VC.forEach((v, i) => {
    const on = vcOn.includes(i), x = 96 + i * 432;
    s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, { x: I(x), y: I(322), w: I(438), h: I(64), fill: { color: on ? K.main : K.gray }, line: { type: 'none' }, rectRadius: I(26), objectName: `價值鏈_${v}` });
    text(s, v, x + (i ? 30 : 0), 322, 400, 64, { size: 28, bold: true, color: on ? K.white : 'C4BCB5', align: 'center', name: `價值鏈_${v}_文字` });
  });
  Object.entries(BLOCKS).forEach(([k, b]) => {
    const vp = k === 'vp', [tagBg, tagFg] = TAGS[b.t];
    rect(s, b.x, b.y, b.w, b.h, { r: 16, fill: vp ? K.main : K.white, line: vp ? K.main : K.rowLine, lw: 1.5, name: `九宮格_${b.n}` });
    text(s, b.n, b.x + 18, b.y + 12, 140, 42, { size: 28, bold: true, color: vp ? 'FFE6D1' : K.main, name: `九宮格_${b.n}_標題` });
    const tw2 = tw(b.t, 17) + 18, tx = b.x + 18 + tw(b.n, 28) + 12;
    rect(s, tx, b.y + 20, tw2, 26, { r: 6, fill: vp ? K.white : tagBg, name: `九宮格_${b.n}_標籤底` });
    text(s, b.t, tx, b.y + 20, tw2, 26, { size: 17, color: vp ? K.main : tagFg, align: 'center', name: `九宮格_${b.n}_標籤` });
    let y = b.y + 60;
    if (b.big) { text(s, b.big, b.x + 18, y, b.w - 30, 132, { size: 32, bold: true, color: K.white, valign: 'top', ls: 1.25, name: `九宮格_${b.n}_主句` }); y += 140; }
    if (b.seg) b.seg.forEach(([h, t], si) => {
      text(s, h, b.x + 18, y, b.w - 30, 40, { size: 28, bold: true, name: `九宮格_${b.n}_${h}` });
      const n = t.split('\n').length;
      text(s, t, b.x + 18, y + 42, b.w - 30, n * 36, { size: 26, valign: 'top', ls: 1.2, name: `九宮格_${b.n}_${h}內容` });
      y += 42 + n * 36 + 16;
    });
    if (b.lines) text(s, b.lines.join('\n'), b.x + 18, y, b.w - 30, b.y + b.h - y - 10, { size: 26, valign: 'top', ls: 1.2, color: vp ? K.white : K.ink, name: `九宮格_${b.n}_內容` });
    if (!focus.includes(k)) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: I(b.x - 1), y: I(b.y - 1), w: I(b.w + 2), h: I(b.h + 2), fill: { color: K.bg, transparency: 26 }, line: { type: 'none' }, rectRadius: I(16), objectName: `遮罩_${b.n}（調整透明度可顯示）` });
  });
  footer(s, page, 3);
  s.addNotes(notes);
  return s;
}
bmcSlide({ title: '先改變客人的心智：為誰、創造什麼價值', page: 7, vcOn: [1], focus: ['vp', 'cr', 'ch', 'cs'],
  notes: ['【這頁要回答】商業與獲利模式（一）：我們為誰、創造什麼價值，怎麼接觸並維持關係。',
    '【概念】商業模式圖右半（顧客面）＝品牌價值鏈的「顧客心智」。上方箭頭只亮顧客心智，九宮格只亮四格，其他格子用遮罩淡化。',
    '【講稿】價值主張：一分鐘找到適合自己的歐洲旅程；依角色推薦永信現有行程，客人被懂、不被推銷；旅人護照讓每趟旅程留下下次出發的理由。目標客群：主要是想去歐洲、說不出目的地的年輕新客；次要是 12 個月未出團的高價值老客。對應 NES：新客（N）用測驗獲取、既有客（E）用 LINE 與數位護照經營、沉睡客（S）分眾喚醒。',
    '【Canva】遮罩是 74% 不透明的暖白色塊；匯入後若整塊變不透明，點選色塊、把透明度調到約 30%。'].join('\n') });
const p8 = bmcSlide({ title: '投入什麼，換來什麼表現與營收', page: 8, vcOn: [0, 2, 3], focus: ['kp', 'ka', 'kr', 'co', 'rv'],
  notes: ['【這頁要回答】商業與獲利模式（二）：靠哪些夥伴、活動和資源做到，花多少、怎麼賺回來。',
    '【概念】商業模式圖左半與底部＝品牌價值鏈的「行銷投入」，收益流＝「市場表現」與「帶來價值」。九宮格沒有獨立的市場表現格，所以併入收益流：詢價、成交、回購 → 團費與加購。',
    '【App 對照】App 的點數明細：完成旅人檔案卡、旅伴完成測驗、出團回饋都會入帳，報名時折抵；點數只在成交時折抵，每團上限示意 3%，待業師確認。這是收益流裡「回購」的工具。',
    '【銜接】成本與收益只講關鍵詞，接下來第 9–11 頁會展開：歐洲線成本結構、競品比較、本提案成本與打平。'].join('\n') });

// 通用表格：左側白框內的多欄表
function gridTable(s, { title, cols, widths, rows, x0 = 136, y0 = 410, head = 44, rowH = 84, size = 26, hl = -1, src = [] }) {
  rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '表格底框' });
  text(s, title, 136, 352, 920, 50, { size: 30, bold: true, color: K.main, name: '表格標題' });
  const xs = []; widths.reduce((x, w) => (xs.push(x), x + w), x0);
  cols.forEach((h, j) => text(s, h, xs[j], y0, widths[j], head, { size: 24, bold: true, color: K.sub, name: `表頭_${h}` }));
  rect(s, x0, y0 + head + 4, 920, 2, { fill: K.rowLine, name: '表頭線' });
  rows.forEach((r, i) => {
    const y = y0 + head + 12 + i * rowH, me = i === hl;
    if (me) rect(s, x0 - 16, y + 3, 952, rowH - 6, { r: 14, fill: K.pinkL, name: '表格_強調列底色' });
    r.forEach((v, j) => text(s, v, xs[j], y, widths[j] + 8, rowH, { size, ls: 1.2, bold: me || j === 0, color: me ? K.mainDk : K.ink, name: `表格第${i + 1}列_${cols[j]}` }));
    if (i < rows.length - 1 && i + 1 !== hl && !me) rect(s, x0, y + rowH - 1, 920, 1.5, { fill: 'F3ECE5', name: `表格列線${i + 1}` });
  });
  src.forEach((t, k) => text(s, t, 136, 900 + k * 36, 920, 34, { size: 20, color: K.sub, name: `資料來源${k + 1}` }));
}

// ----- 8：永信歐洲線成本結構 -----
contentSlide({ sub: 5, chip: '模式實績｜⑥競爭品與成本結構', title: '歐洲團賺不賺，關鍵在能不能湊滿一團', page: 9, speaker: 3,
  left: s => {
    rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '團費組成底框' });
    text(s, '團費組成示意：一團歐洲團的錢花在哪', 136, 352, 920, 50, { size: 30, bold: true, color: K.main, name: '團費組成標題' });
    const blocks = [
      ['每人變動', K.pinkL, K.mainDk, '機票與燃油、住宿、餐食、門票、保險', '住宿約占不含機票的地面團費四成（量級參考）'],
      ['每團固定', K.pink, K.mainDk, '領隊、遊覽車、當地導遊', '遊覽車約每天 €800，由約 20 人分攤'],
      ['毛利', K.main, K.white, '團費扣掉上面兩塊', '以業界 13–17% 試算（五福、鳳凰、雄獅）'],
    ];
    blocks.forEach(([lab, fill, tc, items, ref], i) => {
      const y = 420 + i * 140;
      rect(s, 136, y, 920, 124, { r: 18, fill: i === 2 ? 'FDF3EA' : K.alt, line: K.rowLine, lw: 1.2, name: `團費區塊${i + 1}` });
      rect(s, 156, y + 22, 170, 80, { r: 14, fill, name: `團費區塊${i + 1}_標籤底` });
      text(s, lab, 156, y + 22, 170, 80, { size: 30, bold: true, color: tc, align: 'center', name: `團費區塊${i + 1}_標籤` });
      text(s, items, 350, y + 16, 690, 50, { size: 30, bold: true, name: `團費區塊${i + 1}_項目` });
      text(s, ref, 350, y + 68, 690, 40, { size: 24, color: K.sub, name: `團費區塊${i + 1}_參考` });
    });
    text(s, '永信實際比例：待業師提供（機票占比、成團人數、毛利率）', 136, 846, 920, 44, { size: 26, bold: true, color: 'F59312', name: '團費待補說明' });
    text(s, '資料：永安旅遊 2026/10/30、部落客估算 2024/3/1、工商時報 2025/8/8', 136, 900, 920, 34, { size: 20, color: K.sub, name: '資料來源1' });
    text(s, '價格帶為團隊查詢永信官網（2026/10/17）；機票漲幅：工商時報 2026/4/30', 136, 936, 920, 34, { size: 20, color: K.sub, name: '資料來源2' });
  },
  items: [['價格帶', '中位數 10.99 萬', '103 團中 39% 低於 10 萬'], ['漲價', '機票漲 15–20%', '團費漲 1,000–5,000 元'], ['門檻', '約 20 人成團', '人數不足，毛利就掉']],
  notes: ['【這頁要回答】永信歐洲線的錢花在哪、毛利多少，以及為什麼「湊滿一團」是關鍵。',
    '【結構】每人變動成本：機票與燃油附加費、住宿、餐食、門票、保險。每團固定成本：領隊、遊覽車、當地導遊，由團員分攤，人數越少每人分攤越高。',
    '【有來源的參考】住宿約占不含機票的地面團費四成（永安旅遊 2026/10/30，量級參考）。義大利團估算：餐約每餐 €25、遊覽車每天 €800 由 20 人分攤、每人每天約 NT$1,350（CP 潘思璇 2024/3/1，作者非業內人士）。毛利率：五福 2025 年 13.28%（工商時報 2026/6/15）、鳳凰 2025 年約 14.92%（工商時報 2026/6/1）、雄獅 2025 上半年 16.67%（工商時報 2025/8/8）、疫情前 9–12%，皆為公司整體數字。',
    '【成本壓力】歐洲長程機票漲約 15–20%、約 NT$4,000（工商時報 2026/4/30）；歐美團費漲 NT$1,000–5,000（三立新聞 2026/11/2）。',
    '【價格帶】永信官網歐洲團 103 團有標價，團費 65,900–228,900 元，中位數 109,900 元，39% 低於 10 萬，另有 18% 寫「請電洽」（團隊 2026/10/17 查詢）。',
    '【銜接】固定成本靠人頭分攤，所以「湊滿一團」是關鍵。本提案不改行程，而是用測驗與 LINE 把說不出目的地的新客、12 個月未出團的沉睡老客導回現有團體行程，幫忙補足成團人數。永信實際成本比例請業師提供，不要自行估算。'].join('\n') });

// ----- 9：歐洲線競品比較 -----
contentSlide({ sub: 5, chip: '模式實績｜⑥競爭品與成本結構', title: '同業拚折扣與會員，永信可以先懂客人再推團', page: 10, speaker: 3,
  left: s => gridTable(s, {
    title: '歐洲線競品：價格、打法、會員與數位接手',
    cols: ['業者', '主力價格', '差異化主軸', '會員與回購', '分眾與接手'], widths: [140, 180, 200, 206, 194], y0: 404, head: 40, rowH: 72, size: 22, hl: 5,
    rows: [
      ['雄獅', '10 天\n10.8–11.9 萬', '高端線主打\n連泊少拉車', '新會員制 200 萬人\n雄獅幣折抵', 'AI 客服 LiLi\n24 小時文字'],
      ['五福', '6 日德捷\n5.99 萬', '旅展折扣\n郵輪', '福幣回饋\n2026 改會員分級', '官網改版\n數據優化下單'],
      ['鳳凰', '10 天\n7.6–9 萬起', '高端河輪\n極地包船', '聯名卡\n信用卡紅利折抵', '旅展、發表會\n未見分眾'],
      ['可樂', '10 天\n8.2–11 萬', '奧捷占歐洲\n營收六成', '百元得 1 幣\n10 枚折 6 元', 'APP 專屬價\n未見分眾'],
      ['永信現況', '中位數\n10.99 萬', '23 個子區域\n目的地齊全', '待永信提供', 'LINE 真人回覆\n24 分鐘丟連結'],
      ['本提案', '沿用\n現有行程', '測驗分群\n先懂人再推團', '數位旅人護照\nNES 分眾喚醒', '測驗＋LINE\n交給顧問'],
    ],
    src: ['資料（皆 2026）：輕旅行 11/4、經濟日報 4/10、工商時報 1/26、5/7、11/6、鏡週刊 7/16', '可樂官網 2026/11/9、風傳媒 2026/11/9、雄獅會員頁；永信為團隊查詢（2026/10/17）'],
  }),
  items: [['主流', '8–12 萬／10 天', '各家主力都在這個價位'], ['打法', '折扣＋會員點數', '大廠開始做 AI 與分級'], ['機會', '先懂人再推團', '中小型做得起的 NES']],
  notes: ['【這頁要回答】歐洲線的同業怎麼賣、怎麼經營會員與數位接手，永信的機會在哪。',
    '【雄獅】奧捷國王湖 10 天 107,900 元起、義大利 10 天 118,900 元起；璽品慢旅芬蘭極光 12 天 259,900 元（輕旅行 2026/11/4）。2025/10 推新會員制度，會員破 200 萬，30 歲以下新會員占比 2026 Q1 增 15%；雄獅幣 1 點折 1 元。AI 客服 LiLi 2025 Q1 上線，24 小時文字接手，成交客人平均年輕 15 歲，約四成服務量在晚上 6 點到隔天早上 9 點，每月轉換營收逾 3,000 萬元（經濟日報 2026/4/10、蕃新聞 2026/4/23）。',
    '【五福】旅展：伴自由德捷 6 日 59,900 元一口價（鏡週刊 2026/7/16）；ITF 德瑞 10 天每人折 11,111 元、義大利 10 天第二人折 6,000 元（經濟日報 2026/11/2），10 天原價未公布。2026 年把「福幣」回饋升級為會員分級制度，並用數據分析優化下單轉換（工商時報 2026/1/26）。2025 年毛利率 13.28%（工商時報 2026/6/15）。',
    '【鳳凰】ITF 歐洲 10 天：奧捷 75,999 元、義大利與德國 84,999 元、荷比盧 89,900 元起（工商時報 2026/11/6）；高端河輪約 12 天 30 萬元起。回饋以聯名卡與信用卡紅利折抵為主（鳳凰官網），公開資料未見分眾經營。2025 年毛利率約 14.92%（工商時報 2026/6/1）。',
    '【可樂】官網歐洲 10 天約 75,900–112,900 元起，例如星耀奧捷 98,900 元、德瑞雙峰 99,900 元、托斯卡尼 96,900 元（可樂官網 2026/11/9 查詢）。奧捷行程占其歐洲營收逾六成（風傳媒 2026/11/9）。可樂旅遊幣每 NT$100 得 1 枚，10 枚折 NT$6（工商時報 2026/5/7）。公開資料未見分眾經營。',
    '【結論】同業的打法是折扣、會員點數，大廠開始用 AI 客服接住深夜與年輕客；但除了雄獅，公開資料未見中型旅行社用「先了解客人、再推薦」的方式分眾。本提案的機會是用測驗與 LINE，讓永信用中小型的成本做到 NES 分眾經營。「未見」是搜尋結果，不代表完全沒有。',
    '【提醒】旅展價格會過期，提報前一週再核對一次。'].join('\n') });

// ----- 10：本提案的成本與打平 -----
contentSlide({ sub: 5, chip: '模式實績｜⑥競爭品與成本結構', title: '第一年約 12–28 萬，多成交 8–28 位就能打平', page: 11, speaker: 3,
  left: s => gridTable(s, {
    title: '本提案成本明細：試辦一條歐洲線',
    cols: ['項目', '類型', '金額', '依據'], widths: [290, 110, 230, 290], y0: 410, head: 44, rowH: 70, size: 26,
    rows: [
      ['LINE 中用量', '固定', 'NT$1,000／月', '含 3,000 則訊息'],
      ['升級高用量（需要時）', '固定', 'NT$1,400／月', '6,000 則，超量每則 0.2'],
      ['網頁開發', '一次性', 'NT$5–15 萬', '含測驗與數位護照'],
      ['網頁維運與主機', '固定', 'NT$5千–1萬／月', '業界維運級距'],
      ['禮遇與周邊獎品', '變動', '每位 1,100–3,300', '團費 1–3%，業界級距'],
      ['顧問時間', '變動', '每小時 250–300', '業務月薪約 3.9 萬推算'],
    ],
    src: ['LINE 費率：Omnichat 2026/8 整理；開發與維運：藍圖思維 2026 公開級距', '打平：固定 12–28 萬 ÷ 每位淨賺 1.0–1.7 萬（毛利率 13–17% − 禮遇與顧問）'],
  }),
  items: [['開發', 'NT$5–15 萬', '網頁含數位護照，一次性'], ['變動', '每位 2–4 千', '禮遇 1–3%＋顧問 2–3 小時'], ['打平', '8–28 位客人', '第一年固定成本 12–28 萬']],
  notes: ['【這頁要回答】做這件事要花多少錢，多成交幾位客人就能打平。',
    '【LINE 費率】2026 年 11 月起：輕用量免費 200 則；中用量 NT$1,000／月 3,000 則；高用量 NT$1,400／月 6,000 則，超量每則 NT$0.2（5 萬則以上 NT$0.15）。來源為 Omnichat 2026/8 整理，請以 LINE 官方為準。',
    '【打平試算】第一年固定成本：網頁開發 NT$5–15 萬＋維運 NT$6–12 萬（每月 5,000–10,000）＋LINE 中用量 NT$1.2 萬，合計約 NT$12.2–28.2 萬。毛利率採業界 2025 年數字：五福 13.28%、鳳凰 14.92%、雄獅上半年 16.67%（工商時報 2026/6/15、2026/6/1、2025/8/8）；每位客人毛利＝團費中位數 NT$109,900 × 13.28%–16.67%＝NT$14,595–18,320。扣掉禮遇與顧問 NT$1,600–4,200，每位淨賺約 NT$10,395–16,720。打平人數：樂觀 12.2 萬 ÷ 16,720 ≈ 7.3，取 8 位；保守 28.2 萬 ÷ 10,395 ≈ 27.1，取 28 位。注意：財報毛利率是公司整體（含機票、自由行），歐洲團體線實際毛利率請業師提供後替換。',
    '【網頁開發】測驗網頁與數位旅人護照算在同一個網頁開發專案，不另外列。旅人護照只做數位版，用於行銷與 CRM（記錄角色、出團次數與偏好）。依業界公開級距（藍圖思維 2026）：單一流程、不串接既有系統的開發 NT$5–15 萬，每月維運 NT$5,000–10,000（含監控與雲端主機）；若要串接永信 ERP 或 CRM，級距提高到 NT$20–50 萬、每月 NT$8,000–15,000。業界年度維護費約為開發費的 10%–36%，沒有統一標準。目前原型放在 GitHub Pages 免費展示，正式上線依上述級距估算。',
    '【禮遇】依護照等級給的老客回饋，例如：生日月小禮、行前小禮包、優先由同一位顧問服務、早鳥價或選位優先、返國後專屬推薦。周邊獎品可用角色卡造型周邊（貼紙、行李吊牌），或與咖啡店、香氛、甜點品牌異業合作，降低成本。',
    '【禮遇估算】業界會員回饋常抓營收的 1%–3%（Growave 整理）。以永信歐洲團中位數 NT$109,900 計，每位成交客人約 NT$1,100–3,300，可用於生日月小禮、行前小禮包與周邊獎品；若周邊由異業合作提供，實際支出可再降低。',
    '【顧問估算】104 薪資情報（2023/9 整理）：旅遊業務月均約 3.9 萬、OP 約 3 萬。以 3.9 萬加勞健保與勞退約 2 成、每月約 176 工時推算，每小時約 NT$250–300。團隊假設每位成交客人需顧問 2–3 小時（LINE 文字溝通、報價、行前說明），約 NT$500–900。實際以永信人事成本替換。',
    '【變動合計】每位成交客人約 NT$1,600–4,200（禮遇 1,100–3,300＋顧問 500–900），已從每位毛利中扣除，計入上方打平試算。',
    '【銜接】這頁列出的資源，就是下一頁「本次請求」要爭取的內容。'].join('\n') });

pres.addSection({ title: '行動結論' });
contentSlide({ sub: 6, chip: '行動結論｜⑦未來藍圖與本次請求', title: '先用一條線、四個月證明它有效', page: 12, speaker: 4,
  left: s => {
    rect(s, 96, 330, 1000, 660, { r: 24, fill: K.white, line: K.rowLine, lw: 1.5, name: '金字塔底框' });
    text(s, '品牌金字塔：從被認識到被選擇', 136, 356, 900, 50, { size: 30, bold: true, color: K.main, name: '金字塔標題' });
    const lv = [['共鳴', '願意持續往來'], ['判斷與感受', '肯定、喜歡'], ['表現與形象', '理解能做什麼'], ['顯著性', '認識我們']];
    // 四層共用同一組斜邊：寬度與離頂點的距離成正比，金字塔才不會歪
    const cx = 486, top = 430, h = 118, g = 8, B = 700, Ht = 4 * h + 3 * g;
    lv.forEach(([n, d], i) => {
      const y = top + i * (h + g), wT = B * (i * (h + g)) / Ht, wB = B * (i * (h + g) + h) / Ht;
      const fill = [K.main, K.mainMid, K.pink, K.pinkL][i], tc = i < 1 ? K.white : K.mainDk;
      if (i === 0) s.addShape(pres.shapes.ISOSCELES_TRIANGLE, { x: I(cx - wB / 2), y: I(y), w: I(wB), h: I(h), fill: { color: fill }, line: { type: 'none' }, objectName: '金字塔第1層' });
      else s.addShape(pres.shapes.TRAPEZOID, { x: I(cx - wB / 2), y: I(y), w: I(wB), h: I(h), fill: { color: fill }, line: { type: 'none' }, rectRadius: I((wB - wT) / 2), objectName: `金字塔第${i + 1}層` });
      text(s, n, cx - 160, y + (i === 0 ? 62 : 22), 320, 50, { size: i === 0 ? 26 : 30, bold: true, color: tc, align: 'center', name: `金字塔第${i + 1}層_名稱` });
      if (i > 0) text(s, d, cx - 160, y + 70, 320, 34, { size: 22, color: tc, align: 'center', name: `金字塔第${i + 1}層_說明` });
    });
    // 目前與目標標記
    [['目標', 1, K.main], ['目前', 3, 'F59312']].forEach(([t, i, c]) => {
      const y = top + i * (h + g) + h / 2 - 28;
      rect(s, 840, y, 196, 56, { r: 28, fill: K.white, line: c, lw: 2.2, name: `標記_${t}` });
      text(s, `◀ ${t}`, 840, y, 196, 56, { size: 28, bold: true, color: c, align: 'center', name: `標記_${t}_文字` });
    });
    text(s, '擴大階段（共鳴）：回國後旅伴「再揪下一趟」；領隊看全團角色分布安排自由時間', 136, 938, 920, 40, { size: 21, color: K.sub, name: '金字塔_擴大階段' });
  },
  items: [['需要', 'LINE 與訂單資料', '顧問每位約 2–3 小時'], ['達成', '詢價率勝對照組', '或報價率高於一般推薦'], ['時程', '第 4 個月底決策', '一條歐洲線，新舊客 A/B']],
  notes: ['【這頁要回答】本次請求：先用一條歐洲線、四個月證明它有效，第 4 個月底決定是否擴大。',
    '【需要】LINE 官方帳號、訂單 CSV、顧問人力（每位成交客人約 2–3 小時）；成本明細與打平試算見第 11 頁。',
    '【驗證】新客：測驗推薦優於一般推薦，看詢價率或報價率是否高於對照組。老客：回溯點亮地圖＋分眾喚醒優於一般訊息，看回覆率或諮詢率。原型：完成率、分享率、地圖點擊率（基準待取得；線上版目前不收集數據，試辦前需打開）。',
    '【金字塔】新客目前在「顯著性」（還不認識我們），四個月試辦的目標是推到「判斷與感受」（肯定、喜歡）；「共鳴」留給擴大階段。',
    '【擴大階段】App 原型已示範揪團、三選一投票與團友牆；擴大時再加兩件事：回國後依兩人足跡推薦旅伴「再揪下一趟」（喚回沉睡客 S），以及領隊看到全團角色分布（例如 4 位柴郡貓、2 位白兔），用來安排自由時間與推薦店家。這是服務資訊，不是把同一團拆成不同步調。',
    '【風險】執行難度中（不改行程，只改行銷與接手流程，試辦一條線）；競爭者高（雄獅已有 AI 客服，以低成本的測驗分群＋NES 差異化）；使用者接受度中（先同意後貼標、推播有上限）；技術低（MVP 只用後台內建功能）；成本中低。',
    '【想請教業師】永信會員制度；LINE 詢價到成交比例、客單價與毛利率；ERP 能否匯出訂單 CSV、沉睡老客數量；試辦期能否提供周邊，或洽談異業合作獎品；永信目前如何定義新客、既有客、沉睡客（NES），以及沉睡老客的名單能否分眾推播。'].join('\n') });

// ================= 10 結論 =================
{
  const s = pres.addSlide({ sectionTitle: '行動結論' });
  s.background = { color: K.bg };
  progressBar(s, 7);
  titleRow(s, '行動結論｜⑧強力結論', '一句話記住我們');
  rect(s, 96, 330, 1728, 360, { r: 32, fill: 'F59312', name: '願景大卡' });
  text(s, '一分鐘找到自己的歐洲', 136, 380, 1648, 140, { size: 96, bold: true, color: K.white, align: 'center', name: '結論_品牌標語' });
  text(s, '讓每一趟旅程，都留下下一次出發的理由', 136, 540, 1648, 70, { size: 40, color: 'FFF1E3', align: 'center', name: '結論_願景' });
  const pills = [['痛點', '說不出想去哪'], ['服務', '測驗＋LINE 接手'], ['好處', '一分鐘拿到推薦']];
  pills.forEach(([l, t], i) => {
    const x = 96 + i * 592;
    rect(s, x, 730, 544, 120, { r: 60, fill: K.white, line: i === 2 ? K.main : K.pinkLine, lw: 2.2, name: `結論膠囊${i + 1}` });
    text(s, l, x + 40, 730, 110, 120, { size: 36, bold: true, color: 'F59312', name: `結論膠囊${i + 1}_標籤` });
    text(s, t, x + 160, 730, 360, 120, { size: 40, bold: true, name: `結論膠囊${i + 1}_文字` });
  });
  rect(s, 760, 892, 400, 80, { r: 40, fill: K.white, line: K.main, lw: 2.2, name: '提問按鈕' });
  text(s, '歡迎提問 Q&A', 760, 892, 400, 80, { size: 36, bold: true, color: K.main, align: 'center', name: '提問按鈕文字' });
  footer(s, 13, 4);
  s.addNotes([
    '【這頁要回答】強力結論：一分鐘找到自己的歐洲；讓每一趟旅程，都留下下一次出發的理由。',
    '【概念】品牌回想：標語和第 1、2 頁一字不差，讓主管散會後不看簡報也想得起來。',
    '【結尾影片】講完這頁與 Q&A 後，下一頁是獨立的結尾影片（不算頁數），時間不夠可以略過。',
    '【三個膠囊】沿用第 5 頁「痛點、服務、好處」的關鍵字：說不出想去哪／測驗＋LINE 接手／一分鐘拿到推薦。說完切入問答。',
  ].join('\n'));
}

videoSlide('close');

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
