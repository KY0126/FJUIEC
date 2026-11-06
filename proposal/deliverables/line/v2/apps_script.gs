/**
 * 歐洲旅人護照｜匿名事件記錄（Google Apps Script）
 * 1. 新增一份 Google 試算表 → 擴充功能 → Apps Script，貼上本檔
 * 2. 部署 → 新增部署作業 → 網頁應用程式；執行身分：我；存取權：任何人
 * 3. 把部署網址填進 index.html 的 ENDPOINT
 */
const SHEET = 'events';
function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(['ts', 'sid', 'ev', 'src', 'data']); }
  return sh;
}
function doPost(e) {
  try {
    const r = JSON.parse(e.postData.contents);
    const ok = ['page_view','quiz_start','answer','quiz_complete','switch_pace','rec_click','fit','extra','map_click','share','interview_optin','avatar_toggle','passport_preview','footprint_click','intro_skip','intro_done','filter','line_add'];
    if (ok.indexOf(r.ev) < 0) return ContentService.createTextOutput('skip');
    sheet_().appendRow([r.ts, String(r.sid).slice(0, 60), r.ev, String(r.src).slice(0, 30), String(r.data).slice(0, 2000)]);
    return ContentService.createTextOutput('ok');
  } catch (err) { return ContentService.createTextOutput('error'); }
}
function doGet(e) {
  if (!e || e.parameter.action !== 'list') return ContentService.createTextOutput('ok');
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[2] !== 'interview_optin')   // 統計頁不回傳聯絡方式
    .map(r => ({ ts: r[0], sid: r[1], ev: r[2], src: r[3], data: r[4] }));
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}
