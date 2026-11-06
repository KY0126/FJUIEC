import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import sys, asyncio
sys.path.insert(0, ROOT + '')
from cameo import avatar
import json as _json
_PAV=_json.load(open(ROOT + '/pav.json'))
def pav(ch,t,uid,size):
    return _PAV[ch+'.'+t].replace('UID',uid).replace('<svg ',f'<svg width="{size}" height="{size}" ',1)
from playwright.async_api import async_playwright
D = ROOT + '/'
CSS = '''
.be{display:flex;flex-direction:column;gap:12px;margin-top:6px}
.be h2{margin:0;font-size:21px;color:#2F4C6E}.be .sub2{font-size:15px;line-height:1.5;color:#665F53;margin-top:-6px}
.bg{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;align-items:start}
.bc{display:flex;flex-direction:column;gap:6px;background:#FBF7EF;border:1px solid #E2D7C2;border-radius:12px;padding:10px}
.bc img{width:100%;height:auto;display:block;border:1px solid #D9D2C3;border-radius:6px;background:#fff}
.bc b{font-size:17px;color:#2F4C6E}.bc span{font-size:15px;color:#665F53;line-height:1.45}

*{box-sizing:border-box}body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#EFE7D8;color:#2B2B33}
.fig{width:760px;box-sizing:border-box;padding:22px 22px;background:#EFE7D8;display:flex;flex-direction:column;gap:14px}
.fig h1{margin:0;font-size:23px;line-height:1.4;color:#2F4C6E}.fig .sub{font-size:15.5px;line-height:1.5;color:#665F53;margin-top:-6px}
.tag{display:inline-block;background:#2F4C6E;color:#fff;border-radius:999px;padding:2px 12px;font-size:14px;margin-right:8px;vertical-align:3px}
.row4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 18px;align-items:start}
.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 18px;align-items:start}
.col{display:flex;flex-direction:column;gap:10px}
.cap b{display:block;font-size:18px;color:#2F4C6E}.cap span{font-size:15.5px;color:#665F53;line-height:1.5}
.ph{width:100%;border-radius:22px;overflow:hidden;border:1px solid #CFC4AE;background:#8CABD9;display:flex;flex-direction:column;box-shadow:0 6px 16px rgba(47,76,110,.12)}
.top{background:#fff;padding:10px 12px;display:flex;align-items:center;gap:9px;font-weight:700;font-size:15px;border-bottom:1px solid #ddd}
.top small{font-weight:400;color:#888;font-size:10.5px;display:block}
.av{width:30px;height:30px;border-radius:50%;background:#fff;border:1.5px solid #E8A54F;color:#C98A3E;display:grid;place-items:center;font-size:10px;font-weight:700;flex:none}
.chat{padding:12px 10px;display:flex;flex-direction:column;gap:9px;min-height:250px}
.m{display:flex;gap:7px;align-items:flex-start}.me{justify-content:flex-end}
.b{background:#fff;border-radius:14px;padding:8px 11px;font-size:14px;line-height:1.55;max-width:230px}
.me .b{background:#A6E3A1}
.card{background:#FBF7EF;border-radius:14px;overflow:hidden;width:250px;font-size:14px}
.card .h{background:#2F4C6E;color:#fff;padding:9px 12px;font-weight:700;font-size:13.5px}.card .h small{display:block;color:#F2D78A;font-weight:400;font-size:10.5px;letter-spacing:.08em}
.card .bd{padding:9px 12px;display:flex;flex-direction:column;gap:6px}
.card .btn{background:#E8A54F;color:#1E3A5C;text-align:center;padding:8px;font-weight:700;font-size:13px}
.card .btn2{border-top:1px solid #E2D7C2;text-align:center;padding:8px;color:#2F4C6E;font-weight:700;font-size:13px}
.menu{background:#F9F6EF}.tabs{display:grid;grid-template-columns:1fr 1fr;font-size:12px;font-weight:700;text-align:center}
.tabs div{padding:6px;background:#2F4C6E;color:#AFC0D2}.tabs .on{background:#F9F6EF;color:#2F4C6E;border-top:3px solid #E8A54F}
.mg{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:3px;background:#E6DFD2}
.mg div{background:#fff;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#2F4C6E;text-align:center;line-height:1.3;padding:4px}
.mg div small{font-weight:400;color:#6B5B45;font-size:10px}
.mg .hero{grid-column:span 2;background:#E8A54F;color:#1E3A5C;font-size:13.5px}
.bar{background:#fff;text-align:center;font-size:11px;color:#555;padding:5px;border-top:1px solid #ddd}
.note{font-size:10.5px;color:#2a3a55;text-align:center;opacity:.85}
.sys{align-self:center;background:rgba(0,0,0,.22);color:#fff;font-size:12px;text-align:center;border-radius:999px;padding:2px 10px}
.adm{background:#FBF7EF;min-height:520px;padding:12px;display:flex;flex-direction:column;gap:10px;font-size:12px}
.adm h4{margin:0;font-size:13px;color:#2F4C6E}
.it{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center;background:#fff;border:1px solid #E2D7C2;border-radius:10px;padding:7px}
.it .n{font-weight:700}.chips{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.chip{font-size:12px;border-radius:999px;padding:1px 8px;background:#E7EEF6;color:#2F4C6E}.chip.o{background:#FBEEDC;color:#8A5A1C}.chip.g{background:#E8EEDF;color:#4F6B3A}
.box{background:#fff;border:1px solid #E2D7C2;border-radius:10px;padding:9px;display:flex;flex-direction:column;gap:6px}
.kv{display:grid;grid-template-columns:62px 1fr;gap:4px 8px}.kv span{color:#665F53}
.pbtn{background:#2F4C6E;color:#fff;text-align:center;border-radius:8px;padding:7px;font-weight:700}
.stars{display:flex;gap:6px;justify-content:center;font-size:20px;color:#E8A54F}
.cpn{background:#F6EDD3;border:2px dashed #C9A24A;border-radius:12px;padding:10px;display:flex;gap:10px;align-items:center}
.liff{background:#fff;display:flex;flex-direction:column}
.lbar{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;font-size:12.5px;font-weight:700;border-bottom:1px solid #ddd;background:#fff}
.lbody{background:#EFE7D8;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:500px}
.opt{background:#FBF7EF;border:1.5px solid #E2D7C2;border-radius:10px;padding:9px 11px;font-size:14px}
.opt.on{border-color:#E8A54F;background:#FBEEDC}
.dlg{margin:auto 12px;background:#fff;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.dim{background:rgba(30,40,60,.55);min-height:560px;display:flex;flex-direction:column;justify-content:center}
.qr{display:flex;gap:5px;flex-wrap:wrap;padding:7px 9px;background:rgba(255,255,255,.45)}
.qr span{background:#fff;border:1.5px solid #E8A54F;color:#1E3A5C;border-radius:14px;padding:4px 9px;font-size:13px;font-weight:700}
.ai{font-size:9.5px;color:#fff;background:#6B5B45;border-radius:4px;padding:0 4px;margin-left:4px;vertical-align:1px}
'''
def top(sub='提案示意畫面'):
    return f'<div class="top"><span style="color:#888">‹</span><div class="av">YS</div><div>永信旅遊<small>{sub}</small></div></div>'
def menu1():
    return '<div class="menu"><div class="mg"><div class="hero">旅行風格測驗<small style="color:#1E3A5C">1 分鐘・12 題</small></div><div>歐洲探索地圖</div><div>我的旅程</div><div>我要詢價</div><div>找真人顧問</div></div></div><div class="bar">選單 ▾</div>'
def menu_tabs():
    return '<div class="menu"><div class="tabs"><div class="on">找旅程</div><div>我的旅程</div></div><div class="mg"><div class="hero">旅行風格測驗<small style="color:#1E3A5C">1 分鐘・12 題</small></div><div>歐洲探索地圖</div><div>本季精選</div><div>我要詢價</div><div>找真人顧問</div></div></div><div class="bar">找旅程｜我的旅程 ▾</div>'
def phone(inner): return f'<div class="ph">{inner}</div>'
def col(ph, title, desc): return f'<div class="col">{ph}<div class="cap"><b>{title}</b><span>{desc}</span></div></div>'

# ---------- 階段一 MVP ----------
s1a = phone(top() + f'''<div class="chat"><div class="sys">已加入好友・來源：台北門市 QR</div>
<div class="m"><div class="av">YS</div><div class="b">您好，歡迎加入永信旅遊 🌍<br>還沒決定去哪也沒關係，花 1 分鐘做旅行風格測驗，我們依您的節奏推薦歐洲行程，再由顧問接手。</div></div>
<div class="m"><div class="av">YS</div><div class="card"><div class="h"><small>TRAVEL STYLE</small>您是哪一種歐洲旅人？</div><div class="bd"><div style="display:flex;gap:4px">{pav('rabbit','start','a1',40)}{pav('queen','start','a4',40)}{pav('alice','start','a2',40)}{pav('hatter','start','a5',40)}{pav('cat','start','a3',40)}</div>12 題・約 1 分鐘</div><div class="btn">開始測驗</div></div></div></div>''' + menu1())
s1b = phone(top() + '''<div class="chat">
<div class="m"><div class="av">YS</div><div class="b">請問您有比較想去歐洲的哪些國家呢？</div></div>
<div class="m me"><div class="b">都可以，目前沒有太多想法</div></div>
<div class="m"><div class="av">YS</div><div class="b">沒問題！很多旅客一開始都還沒想好 😊<br>先用 1 分鐘測驗找出您的旅行節奏，結果會交給顧問，不必再重複說明。<br>👉 開始測驗（連結）<br>👉 想直接找顧問，請點選單「找真人顧問」</div></div>
<div class="sys">保底回覆已送出・同時通知值班顧問</div></div>''' + menu1())
s1c = phone('<div class="top"><div class="av" style="border-color:#2F4C6E;color:#2F4C6E">後台</div><div>管理後台<small>提案示意・顧問視角</small></div></div>' + f'''<div class="adm">
<h4>聊天｜依標籤與負責顧問整理</h4>
<div class="it"><div class="av">林</div><div><span class="n">林小姐</span>　<span style="color:#888">都可以，目前沒有太多…</span><div class="chips"><span class="chip">來源：台北門市</span><span class="chip o">未測驗</span><span class="chip g">顧問 A</span></div></div></div>
<div class="it"><div class="av">陳</div><div><span class="n">陳先生</span>　<span style="color:#888">想問西班牙 11 天…</span><div class="chips"><span class="chip">來源：IG</span><span class="chip o">愛麗絲型</span><span class="chip o">花季</span><span class="chip g">顧問 B</span></div></div></div>
<div class="it"><div class="av">王</div><div><span class="n">王太太</span>　<span style="color:#888">謝謝！我再跟家人討論</span><div class="chips"><span class="chip">來源：旅展</span><span class="chip o">柴郡貓型</span><span class="chip g">顧問 A</span></div></div></div>
<h4>分眾推播</h4>
<div class="box"><div class="kv"><span>對象</span><b>標籤＝愛麗絲型 且 花季</b><span>內容</span><b>荷比法花季示意行程＋顧問邀約</b><span>頻率</span><b>每人每月最多 2 則</b></div><div class="pbtn">預約發送</div></div>
<h4>優惠券（後台內建）</h4>
<div class="box"><div class="kv"><span>發送</span><b>顧問依護照等級手動發送</b><span>內容</span><b>行前說明會優先席（示意）</b></div></div>
<h4>分析報表</h4>
<div class="box"><div class="kv"><span>加入來源</span><b>門市 QR｜旅展｜IG｜官網</b><span>追蹤</span><b>測驗完成率、詢價率</b></div></div>
</div>''')
s1s = phone(top() + f'''<div class="chat"><div class="sys">返國後第 3 天・以分眾訊息傳送網頁連結</div>
<div class="m"><div class="av">YS</div><div class="card"><div class="h"><small>WELCOME HOME</small>歡迎回家！1 分鐘返國問卷</div><div class="bd">這趟「奧捷 10 天」整體滿意嗎？<div class="stars">★★★★☆</div>最喜歡的一段？<div style="display:flex;gap:4px;flex-wrap:wrap"><span class="chip">導覽</span><span class="chip o">自由時間</span><span class="chip">飯店</span><span class="chip">美食</span></div></div><div class="btn">開啟問卷網頁 →</div></div></div>
<div class="m"><div class="av">YS</div><div class="b">謝謝填寫！顧問會幫您在旅人護照點亮這次去過的地方 🗺️</div></div></div>''' + menu1())
S1 = (s1a, '① 雅婷：新客加入', '對應：認證帳號、來源 QR、歡迎訊息、單一選單'), (s1b, '② 雅婷說「都可以」也接得住', '對應：自動回應與保底回覆（文字連結）'), (s1s, '③ 返國問卷', '對應：問卷改用測驗網頁製作（後台問卷調查將於 2026/12/2 停止服務）')

# ---------- 階段二 試辦後 ----------
def menu_alice():
    return '<div class="menu"><div class="tabs"><div class="on">為你推薦</div><div>我的旅程</div></div><div class="mg"><div class="hero">柴郡貓型精選<small style="color:#1E3A5C">留白多・少換飯店</small></div><div>藝術主題</div><div>換個節奏</div><div>我要詢價</div><div>我的顧問</div></div></div><div class="bar">為你推薦｜我的旅程 ▾</div>'
def menu_mine():
    return '<div class="menu"><div class="tabs"><div>為你推薦</div><div class="on">我的旅程</div></div><div class="mg"><div class="hero">旅人護照<small style="color:#1E3A5C">新點亮西葡・金等級</small></div><div>出發須知</div><div>專屬禮遇</div><div>推薦朋友</div><div>找我的顧問</div></div></div><div class="bar">為你推薦｜我的旅程 ▾</div>'
s2a = phone(top() + f'''<div class="chat"><div class="sys">完成測驗・自動加上標籤「柴郡貓型」「藝術」「暑假」</div>
<div class="m"><div class="av">YS</div><div class="card"><div class="h"><small>YOUR TRAVEL STYLE</small>慢遊生活家｜柴郡貓型</div><div class="bd" style="flex-direction:row;align-items:center">{avatar('cat','start',uid='b1',size=64)}<span>往哪走都可以，像當地人一樣生活。下方選單已換成適合您的推薦。</span></div><div class="btn2">看我的推薦行程</div></div></div></div>''' + menu_alice())
s2b = phone(top() + '''<div class="chat">
<div class="m"><div class="av">YS</div><div class="b">請問您有比較想去歐洲的哪些國家呢？</div></div>
<div class="m me"><div class="b">都可以，目前沒有太多想法</div></div>
<div class="m"><div class="av">YS</div><div class="b">沒問題！很多旅客一開始都還沒想好 😊<br>點下方按鈕，告訴我們您在意什麼，或直接做 1 分鐘測驗。</div></div>
<div class="sys">保底回覆＋快速回覆按鈕（開發者介面）</div></div>
<div class="qr"><span>開始 1 分鐘測驗</span><span>想看藝術主題</span><span>預算 10–13 萬</span><span>暑假出發</span><span>找真人顧問</span></div>''' + menu_alice())
s2c = phone(top() + f'''<div class="chat"><div class="sys">去完西葡回來・護照升級「金」・自動發送禮遇券</div>
<div class="m"><div class="av">YS</div><div class="card"><div class="h"><small>PASSPORT UPGRADE</small>恭喜升級：金等級旅人</div><div class="bd"><div style="display:flex;gap:6px;align-items:center">{avatar('alice','silver',uid='c1',size=54)}<span style="font-size:18px">→</span>{avatar('alice','gold',uid='c2',size=54)}</div>
<div class="cpn"><div style="font-size:24px">🗝️</div><div><b>專屬禮遇券</b><br>行前說明會優先席・顧問一對一行程規劃</div></div><span style="font-size:11px;color:#665F53">禮遇內容與期限待永信確認（示意）</span></div><div class="btn">出示給顧問</div></div></div></div>''' + menu_mine())
S2 = (s2a, '① 雅婷：自動標籤＋專屬選單', '對應：兩分頁選單、自動標籤、依標籤顯示選單'), (s2b, '② 雅婷：快速回覆按鈕', '對應：保底回覆加上一鍵選項，客人不必打字'), (s2c, '③ 建宏：升級自動發券', '對應：依護照等級自動發送禮遇券')

# ---------- 階段三 擴大 ----------
s3a = phone('<div class="liff"><div class="lbar"><span>✕</span><span>旅行風格測驗</span><span>⋯</span></div><div class="lbody">' + '''
<div style="font-size:11px;color:#665F53">在 LINE 裡直接作答，不用跳出瀏覽器</div>
<div style="display:flex;gap:4px">''' + ''.join(f'<span style="flex:1;height:4px;border-radius:2px;background:{"#F39500" if i<3 else "#E2D7C2"}"></span>' for i in range(12)) + '''</div>
<div style="font-size:11px;color:#665F53">Q3 / 12</div><div style="font-size:16px;font-weight:700">行程臨時變動時，你的反應是？</div>
<div class="opt">A　希望照原計畫走</div><div class="opt on">B　看情況調整</div><div class="opt">C　順勢換個玩法也不錯</div>
<div style="font-size:11px;color:#665F53;text-align:center">點一下答案，就會自動進到下一題</div>
<div class="box" style="font-size:11.5px"><b style="color:#2F4C6E">LIFF 的好處</b>作答結果直接寫回 LINE 帳號，顧問在後台看得到，不必再問一次。</div></div></div>''')
s3b = phone(top('提案示意畫面') + f'''<div class="dim"><div class="dlg"><div style="display:flex;gap:8px;align-items:center"><div class="av">YS</div><b>永信旅遊 會員綁定</b></div>
<span>綁定後，系統會取得：</span><div class="box" style="font-size:12px">✓ 顯示名稱與大頭貼<br>✓ 用來對應會員資料的 LINE 帳號識別碼</div>
<div style="display:flex;gap:8px;align-items:center">{avatar('alice','silver',uid='d1',size=56)}<span>綁定後，旅人護照會自動同步您過去 3 次出團紀錄，點亮德瑞、法國、義大利。</span></div>
<div class="pbtn" style="background:#06C755">同意並綁定</div><div style="text-align:center;color:#665F53">稍後再說</div></div></div>''')
s3c = phone(top('AI 代理 ＋ 真人顧問') + f'''<div class="chat">
<div class="m me"><div class="b">都可以，目前沒有太多想法</div></div>
<div class="m"><div class="av">YS</div><div class="b"><span class="ai">AI</span><br>沒問題！先問兩件事就能幫您縮小範圍：<br>① 大概什麼時候出發？<br>② 比較想要排滿，還是留點自由時間？</div></div>
<div class="m me"><div class="b">暑假，想多一點自由時間，不想每天換飯店</div></div>
<div class="m"><div class="av">YS</div><div class="card"><div class="h"><small>需求摘要・已交給顧問</small>暑假・留白節奏・藝術</div><div class="bd">推薦先看：義大利、法國分類中自由時間較多的行程<br><span style="color:#665F53;font-size:11px">台北門市顧問會在營業時間內接手</span></div><div class="btn2">直接跟顧問聊</div></div></div></div>
<div class="qr"><span>看推薦行程</span><span>換個月份</span><span>找真人顧問</span></div>''')
S3 = (s3a, '① 雅婷：LIFF 內嵌測驗', '對應：LIFF；在 LINE 內完成測驗，結果寫回帳號'), (s3b, '② 建宏：LINE Login 帳號連動', '對應：LINE Login；綁定會員，旅人護照同步出團紀錄'), (s3c, '③ 雅婷：AI 代理先問、顧問接手', '對應：Messaging API、AI 代理；AI 只整理需求，報價與成交由顧問處理')

BE='<div class="be"><h2>④ 顧問後台：LINE 官方帳號管理後台實際畫面</h2><div class="sub2">團隊測試帳號實際截圖（2026/10/17）；帳號名稱與大頭貼已改為永信旅遊示意，好友名稱與大頭貼已匿名。</div>\n<div class="bc"><img src="oa/hd_chatA.png"><b>聊天列表</b><span>所有好友的對話集中在同一個帳號，由多位顧問共同管理</span></div>\n<div class="bg" style="grid-template-columns:repeat(2,minmax(0,1fr))">\n<div class="bc"><img src="oa/hd_chatB.png"><b>聊天標籤與負責人</b><span>顧問手動貼標籤、指派負責人；記事本只有成員看得到</span></div>\n<div class="bc"><img src="oa/hd_push.png"><b>建立群發訊息（分眾）</b><span>傳送對象可選「篩選目標」，依屬性與標籤發送；推播則數依方案計費</span></div>\n<div class="bc"><img src="oa/hd_coupon.png"><b>優惠券</b><span>設定有效期限、使用次數與折扣類型；由顧問依護照等級手動發送</span></div>\n<div class="bc"><img src="oa/hd_insight.png"><b>分析報表（好友）</b><span>加入好友、目標好友數、封鎖數的每日變化，可下載</span></div>\n</div></div>'
def fig(fid, tag, title, sub, items):
    rc='row4' if len(items)==4 else 'row'
    st=''
    return f'<div class="fig" id="{fid}"{st}><h1><span class="tag">{tag}</span>{title}</h1><div class="sub">{sub}</div><div class="{rc}">' + ''.join(col(*it) for it in items) + '</div>' + (BE if fid=='st1' else '') + '</div>'
html = f'<!doctype html><meta charset=utf8><style>{CSS}</style>' + \
  fig('st1', '階段一 MVP', '先接住每一位客人：只用後台內建功能，不需開發', '①–③ 為提案示意畫面，未使用永信標誌；④ 為實際後台截圖。', S1) + \
  fig('st2', '階段二 試辦後', '串接開發者介面，讓選單、回覆與禮遇自動跟著客人走', '提案示意畫面；禮遇內容待永信確認。', S2) + \
  fig('st3', '階段三 擴大', '把測驗和會員搬進 LINE：LIFF、帳號連動與 AI 代理', '提案示意畫面；AI 只負責整理需求，報價與成交仍由顧問處理。', S3)
open(D + 'hd_stages.html', 'w', encoding='utf8').write(html)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 760, 'height': 900}, device_scale_factor=3)
        await pg.goto('file://' + D + 'hd_stages.html'); await pg.wait_for_timeout(500)
        for i in (1, 2, 3):
            await (await pg.query_selector(f'#st{i}')).screenshot(path=D + f'hd/stage{i}.png')
            phs = await pg.query_selector_all(f'#st{i} .col .ph')
            for j, e in enumerate(phs[:3]): await e.screenshot(path=D + f'hd/st{i}_{j+1}.png')
        await b.close()
asyncio.run(main())
