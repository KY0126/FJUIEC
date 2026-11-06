import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
ROOT = _os.path.dirname(ROOT)
import asyncio, json, sys
from playwright.async_api import async_playwright
P = ROOT + '/print/'
S = '../shots3/'; H = '../hd/'; W = 'wt/'; O = '../oa/'

CSS = '''
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:"Noto Sans CJK TC","Noto Sans TC",sans-serif;color:#24262B;font-size:9.6pt;line-height:1.45;background:#fff;
 -webkit-print-color-adjust:exact;print-color-adjust:exact}
.src{display:none}
.page{width:210mm;height:297mm;padding:13mm 17mm 11mm;position:relative;overflow:hidden;break-after:page;display:flex;flex-direction:column}
.page:last-child{break-after:auto}
.hdr{position:absolute;left:17mm;right:17mm;top:5.5mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#7A7468;border-bottom:.5pt solid #E2D7C2;padding-bottom:1mm}
.ftr{position:absolute;left:0;right:0;bottom:4.5mm;text-align:center;font-size:8pt;color:#7A7468}
.chunk{flex:1;display:flex;flex-direction:column;gap:2.2mm;min-height:0;overflow:hidden}
.blk{display:flex;flex-direction:column;gap:1.9mm;flex-shrink:0}
.fill{flex:1}
.chunk>*{flex-shrink:0}
.appx{break-before:page}
h2,h3{break-after:avoid}
.row,.cards,.card,.kpi,.qr,.cover,tr{break-inside:avoid}
h1{font-size:19pt;line-height:1.3;margin:0;color:#2F4C6E}
h2{font-size:13pt;line-height:1.35;margin:1.5mm 0 0;color:#2F4C6E;padding-left:2.5mm;border-left:1.4mm solid #E8A54F}
h3{font-size:10.8pt;margin:1mm 0 0;color:#2F4C6E}
p{margin:0;text-align:justify}
table{width:100%;border-collapse:collapse;font-size:8.5pt;line-height:1.36;break-inside:avoid}
th{background:#EFE7D8;color:#2F4C6E;font-weight:600;text-align:left}
th,td{border:.5pt solid #D9D0BE;padding:.65mm 1.5mm;vertical-align:top}
.pps th{background:#2F4C6E;color:#fff}
.pps td{background:#FBF7EF}
figure{margin:0;break-inside:avoid;display:flex;flex-direction:column;gap:1.2mm}
figure img{display:block;max-width:100%}
figcaption{font-size:8pt;color:#6B6457}
.row{display:flex;gap:4mm;align-items:flex-start}
.row>*{min-width:0}
.cards{display:grid;gap:3mm}
.card{border:.5pt solid #D9D0BE;border-radius:2mm;padding:1.5mm;background:#FAF7F1;break-inside:avoid;display:flex;flex-direction:column;gap:1mm}
.card img{width:100%;display:block;border-radius:1mm}
.card b{font-size:8.5pt;color:#2F4C6E}
.card span{font-size:7.6pt;color:#5B5448;line-height:1.4}
ol,ul{margin:0;padding-left:5mm}
li{margin:0}
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.kpi div{background:#FBF7EF;border:.5pt solid #E2D7C2;border-radius:2mm;padding:2mm 3mm}
.kpi b{display:block;font-size:15pt;color:#C9822F;line-height:1.2}
.kpi span{font-size:8.3pt;color:#5B5448}
.qr{border:.8pt dashed #B9AD96;border-radius:2mm;padding:2mm 3mm;font-size:8.3pt;color:#5B5448;display:flex;gap:3mm;align-items:center}
.qr i{display:block;width:16mm;height:16mm;border:.8pt solid #B9AD96;flex:none;font-style:normal;font-size:6.5pt;display:grid;place-items:center;text-align:center;color:#9A9384}
.note{font-size:8pt;color:#6B6457}
.cover{background:#F7F1E5;border-radius:3mm;padding:4.5mm 6mm;display:flex;flex-direction:column;gap:2mm}
.cover .k{font-size:8.5pt;letter-spacing:.2em;color:#8A7A5E}
.cover .s{font-size:11pt;color:#4A4438}
.small{font-size:8.5pt}
.cols2{columns:2;column-gap:6mm}
.cols2 li{break-inside:avoid}
'''

def page(n, label, body):
    ap = 'A' if str(n) in ('A1','B2','C1') else ''
    return f'<div class="src" data-appx="{ap}" data-label="{label}">{body}</div>'
def t(rows, head=True, cls='', widths=None):
    cg = ''.join(f'<col style="width:{w}">' for w in widths) if widths else ''
    h = '<tr>' + ''.join(f'<th>{c}</th>' for c in rows[0]) + '</tr>' if head else ''
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in (rows[1:] if head else rows))
    return f'<table class="{cls}"><colgroup>{cg}</colgroup>{h}{b}</table>'
def pps(a, b, c): return t([['現象', '產品', '解決'], [a, b, c]], cls='pps', widths=['34%', '33%', '33%'])
def fig(src, cap, w='100%', style=''):
    return f'<figure style="width:{w};{style}"><img src="{src}" style="width:100%">{f"<figcaption>{cap}</figcaption>" if cap else ""}</figure>'
def cards(items, cols, gap='3mm'):
    return f'<div class="cards" style="grid-template-columns:repeat({cols},minmax(0,1fr));gap:{gap}">' + ''.join(
        f'<div class="card"><b>{a}</b><img src="{s}">{f"<span>{c}</span>" if c else ""}</div>' for s, a, c in items) + '</div>'

pages = []
# ---------- P1 ----------
pages.append(page(1, '提案摘要', f'''
<div class="cover"><span class="k">YS TRAVEL ・ FJU ENTREPRENEURSHIP CLUB</span>
<h1>永信旅遊 旅行風格測驗與 LINE 分眾經營提案</h1>
<span class="note">輔大創新創業社 課程專案・2026 年 10 月 17 日</span></div>
<h2>提案摘要</h2>
{pps('客人說「都可以」的那一刻，對話就中斷，選擇又回到客人身上', '旅行風格測驗、同團三節奏產品、LINE 即時回覆、歐洲旅人護照', '客人不必先想好目的地；永信也能留下客人的偏好與出團紀錄')}
<p>永信旅遊的服務人員有引導客人的意願，卻缺少引導的工具。需求尚未成形的客人一旦說不出目的地，就只能收到官網連結；但官網是依目的地分類，客人還是得自己選。同時，客戶資料分散在不同系統，高單價長線團的老客也容易在成交後沉睡。</p>
<p>我們提出三件事：用 12 題測驗把「都可以」轉成推薦；讓 LINE 先回覆，再把客人摘要交給顧問；用「歐洲旅人護照」記錄每位客人去過哪裡，作為下次推薦的依據。</p>
<div class="kpi"><div><b>0 家</b><span>觀察的四家同業 LINE，都沒有固定問客人「想怎麼玩」的流程</span></div>
<div><b>39%</b><span>永信官網歐洲團體行程中，團費在 10 萬元以下的比例；這些團已經有了，只是客人不容易找到</span></div>
<div><b>1 條線、4 個月</b><span>試辦範圍與決策時間點</span></div></div>
{t([['問題', '方案', '驗證', '資源'], ['引導中斷、年輕客排斥被安排、資料分散、老客沉睡', '旅行風格測驗、同團三節奏、LINE 即時回覆、歐洲旅人護照', '一條歐洲線、新客與老客兩條 A/B、第 4 個月底決策', 'LINE 官方帳號、訂單 CSV、顧問人力（待永信提供）']], widths=['25%', '27%', '26%', '22%'])}
<div class="qr"><img src="qr_pdf.png" style="width:22mm;height:22mm;flex:none"><span><b>可操作原型</b>　ky0126.github.io/FJUIEC<br>手機掃描即可體驗 12 題測驗、五種旅人角色卡、推薦行程與歐洲探索地圖；作答匿名，每一題有多少人作答都會記下來，看得出客人在哪一題離開。<br>完整畫面請見附錄 A，LINE 三階段介面與後台截圖見附錄 B。</span></div>
'''))
# ---------- P2 ----------
pages.append(page(2, '一、觀察到的產業或使用者問題', f'''
<h2>一、觀察到的產業或使用者問題</h2>
<p class="lead">2026 年 10 月 17 日，我們用自己的 LINE 帳號詢問永信和四家同業的歐洲行程，記錄他們怎麼回應。</p>
<h3>1-1 觀察案例：由團隊成員擔任神秘客的對話</h3>
<div class="row">{fig('../fig1_ys_line.png', '圖 1-1　永信 LINE 觀察案例（團隊實測，2026 年 10 月 17 日）', '84mm')}
<div style="flex:1;display:flex;flex-direction:column;gap:2.4mm">
<p>客人詢問「歐洲有哪些產品」，服務人員約 5 分鐘後反問想去哪些國家。客人回答「都可以」「目前沒有太多想法」後，約 24 分鐘收到官網首頁連結，對話就此結束，沒有留下任何客人資料。</p>
<p>服務人員主動反問，顯示他具備顧問式服務的直覺；問題在於目的地問不出來時，他手上沒有其他引導工具。同一天觀察的五福旅遊，服務人員則列出歐洲四大區域，並詢問想要什麼樣的旅遊體驗。同樣是真人服務，引導品質卻因人而異。</p>
<p>官網呈現同樣的結構：主選單依目的地分類，歐洲之下共 23 個子區域、超過百個行程，其中 18% 標示「請電洽」而沒有價格。還沒想好目的地的客人，很難從官網首頁開始找。</p></div></div>
<h3>1-2 四個問題</h3>
{t([['問題', '現象', '影響'], ['引導', '客人沒有想法時，只能收到官網連結', '需求未成形的客人流失'], ['產品', '年輕客群排斥行程固定、自由時間不足的跟團', '潛在客群不考慮跟團'], ['資料', '官網會員、LINE、訂單與五地門市紀錄各自獨立（待永信確認）', '客人重複說明，顧問無從接續'], ['關係', '長線旅遊一到數年才出國一次', '成交後沉睡，或被同業接走']], widths=['12%', '50%', '38%'])}
<h3>1-3 6W 問題釐清</h3>
{t([['Who', '需求未成形的年輕新客、高價值沉睡老客、缺乏引導工具的顧問', 'Where', 'LINE、官網、五地門市（台北、桃園、台中、台南、高雄）、旅展'], ['What', '不知道怎麼選，引導中斷，資料未留存，老客沉睡', 'When', '尚未決定目的地的探索期、提問當下、返國後到下次出發之間'], ['Why', '產品以目的地清單呈現，引導依賴個人經驗，系統未整合，長線消費週期長', 'How（現況）', '真人回覆，提供官網連結']], head=False, widths=['9%', '41%', '10%', '40%'])}
'''))
# ---------- P3 ----------
pages.append(page(3, '二、目標客群　三、使用者核心需求', f'''
<h2>二、目標客群</h2>
<p class="lead">我們鎖定兩群人：還沒想好去哪的年輕新客，以及過了平常的出團週期、還沒再出團的老客。</p>
{fig(W+'persona.png', '圖 2-1　Persona 人物卡（依團隊假設建立；照片為示意，非本人；每條資訊標註來源）', '100%')}
<p>主要客群的來源包括社群、搜尋與廣告、五地門市、旅展與朋友分享；次要客群為超過個人出團週期 2 倍還沒再出團（NES 的 S1 到 S3，見 5-8），且累計金額高或出團次數多的老客。兩位人物為依團隊假設建立的虛構角色，將以原型數據與訪談驗證。</p>
<h2>三、使用者核心需求</h2>
<p class="lead">從觀察案例和團隊三份草案整理下來，新客最常卡在說不出自己的偏好；老客則是收到的訊息都跟自己無關。</p>
<h3>3-1 同理心地圖：林雅婷與陳建宏</h3>
{fig(W+'empathy.png', '圖 3-1　同理心地圖：林雅婷（對應圖 2-1 人物誌；痛點右側為對應的第五章功能）。陳建宏的同理心地圖（圖 3-2）見附錄 C', '100%')}
'''))
# ---------- P4 ----------
pages.append(page(4, '三、使用者核心需求　四、問題形成原因與需求缺口', f'''
<h3>3-2 親和圖：從聲音到四項需求</h3>
{fig(W+'kj.png', '圖 3-3　KJ 親和圖：四項核心需求對應測驗題目與結果頁篩選', '100%')}
<p>需求將以原型的實際作答分布、補充題與 5 位深度訪談驗證，數據於試辦後補入本章，並註明樣本數與組成。</p>
<h2>四、問題形成原因與需求缺口</h2>
<p class="lead">每個問題背後各有原因，我們逐一找出缺口，再對應到第五章的方案。</p>
<h3>4-1 需求缺口矩陣</h3>
{t([['現象', '形成原因', '需求缺口', '要補上的產品'], ['客人沒想法時對話中斷', '引導依賴個人經驗，只能問目的地', '缺少引導工具', '旅行風格測驗'], ['客人打字詢問沒有即時回覆', '純真人回覆，沒有保底機制', '缺少即時回覆', 'LINE 保底回覆與選單'], ['年輕客群不喜歡傳統團', '行程與節奏固定', '缺少彈性產品', '同團三節奏選項'], ['顧問需要重複詢問', '資料分散在不同系統', '缺少客戶資料摘要', '單一客戶資料卡'], ['老客長期沉睡', '長線消費週期長，缺少再出發理由', '缺少分群與觸發機制', 'NES 分群＋歐洲旅人護照']], widths=['26%', '30%', '20%', '24%'])}
'''))
# ---------- P5 ----------
pages.append(page(5, '四、問題形成原因與需求缺口', f'''
<h3>4-2 競品定位</h3>
<div class="row">{fig(W+'position.png', '圖 4-1　五家旅行社 LINE 官方帳號定位（團隊實測，2026 年 10 月 17 日單次觀察）', '96mm')}
<div style="flex:1;display:flex;flex-direction:column;gap:2mm"><p>大型同業有自動化，但入口以產品分類與折扣為主；五福等同業的服務人員會口頭詢問體驗，但依賴個人經驗、無法記錄，也無法立即推薦。</p><p>圖中右上角（自動回覆、也會深入了解需求）目前沒有同業；我們用測驗做引導、用 LINE 即時回覆，想補上這一塊。</p></div></div>
{t([['項目', '雄獅', '可樂', '山富', '五福', '永信現況'], ['回覆模式', '自動，對話框無回應', '通用回覆＋快速按鈕', '自動問答＋真人', '真人，約 15 分鐘', '真人，約 5 分鐘'], ['需求釐清', 'AI 客服在選單內', '旅遊問與答', '旅伴、時間、機場', '口頭詢問體驗與時間', '口頭詢問目的地'], ['主要訴求', '折扣、會員日', 'APP 禮包', '主打行程', '成團保證', '—'], ['圖文選單', '4 格＋橫幅＋3 分頁', '2 分頁 × 6 格', '8 格', '1 大＋3 小', '實測時未顯示']], widths=['13%', '17%', '18%', '17%', '17%', '18%'])}
<h3>4-3 POV 與 HMW</h3>
<p class="small">POV 是站在客人角度寫下的問題；HMW 把它改寫成「我們可以怎麼做」的問句。</p>
<p><b>POV</b>：對於想去歐洲、卻說不出自己想要什麼的年輕客人，他們需要一個能表達偏好、能比較節奏、並有顧問接得住的選擇方式，因為現在的服務只會問目的地，問不出來時，就只能給官網連結。</p>
<p><b>HMW</b>：我們如何能夠讓還沒有想法的客人，在不被定型的前提下，一分鐘內找到適合自己節奏的歐洲旅程，再把結果交給顧問，客人不必重講一次？</p>
<h3>4-4 服務品質缺口（PZB 模式）</h3>
<p class="lead">PZB 模式把服務品質問題拆成五個缺口：前四個發生在公司內部，最後一個是客人感受到的落差。我們把觀察到的現象對進去，確認每個缺口都有對應的方案。</p>
{t([['缺口', '意思', '永信現況', '對應方案'], ['1 認知缺口', '公司以為的客人需求，和客人真正的期待不同', '服務先問目的地，但需求未成形的客人說不出來', '測驗改問「怎麼旅行」；人物誌與同理心地圖'], ['2 規格缺口', '知道需求，卻沒有寫成服務標準', '客人說「都可以」時沒有標準做法', '保底回覆與測驗成為固定流程'], ['3 傳遞缺口', '有標準，實際做得不一致', '引導品質因人而異；觀察案例 24 分鐘後才收到連結', '客戶資料卡、顧問收到客人摘要'], ['4 溝通缺口', '對外說的和實際提供的不同', '官網 18% 行程標「請電洽」而沒有價格', '推薦卡寫出價格與推薦原因'], ['5 服務缺口', '客人的期待與實際感受的落差', '收到官網首頁後，對話就結束了', '返國問卷以服務品質五構面設計']], widths=['13%', '29%', '31%', '27%'])}
<p class="small">返國問卷依 SERVQUAL 五個構面出題：有形性（行程與飯店）、可靠性（行程照說好的執行）、回應性（詢問多久有人回）、保證性（顧問與領隊的專業）、同理性（推薦是否符合自己），每個構面一題，約 1 分鐘完成。</p>
'''))
# ---------- P6 ----------
pages.append(page(6, '五、初步解決方案（一）旅行風格測驗', f'''
<h2>五、初步解決方案（一）旅行風格測驗與三種節奏</h2>
<p class="lead">客人說不出想要什麼，我們就改問他怎麼旅行，再依答案推薦行程。</p>
{fig(W+'arch.png', '圖 5-1　方案架構總覽：7 個環節、新客與老客兩個入口', '100%')}
<p>新客從測驗進入，老客從訂單紀錄進入；兩者都會回到旅人護照，由未點亮的區域觸發下一次推薦。</p>
<h3>5-1 旅行風格測驗</h3>
{t([['題號', '內容', '用途'], ['Q1、Q2、Q3、Q7、Q11', '行前準備、第一天、路標改變、街角的兔子洞、排隊', '節奏：精準、均衡或留白'], ['Q5、Q9', '想帶回什麼、想去哪種餐廳', '取向：經典名景、深度體驗或放鬆'], ['Q4、Q6、Q8', '旅伴、主題、出發時間', '篩選'], ['Q10', '預算：8 萬以下／8–10 萬／10–13 萬／13–16 萬／16 萬以上／還不確定', '篩選'], ['Q12', '最不想遇到的安排（可複選）', '避雷']], widths=['20%', '52%', '28%'])}
<p>預算區間依永信官網 103 個歐洲團體行程的實際價格設定：團費 65,900 至 228,900 元，中位數 109,900 元，每一個區間都有對應的真實產品。</p>
'''))
# ---------- P7 ----------
pages.append(page(7, '五、初步解決方案（一）旅行風格測驗', f'''
{fig(W+'price.png', '圖 5-6　永信官網歐洲 23 個分類頁中有標價的團體行程（2026 年 10 月 17 日查詢）', '100%')}
<div class="row">{fig(S+'s2_role.png', '圖 5-4（節錄）　角色卡', '32%')}{fig('w/recs_crop12.png', '圖 5-4（節錄）　推薦卡', '32%')}
<div style="flex:1;display:flex;flex-direction:column;gap:2mm" class="small"><p><b>角色卡</b>：節奏與取向分數全保留，客人可以「換個角色」；頭像依護照等級換材質，也可以選擇不顯示。</p><p><b>推薦卡</b>：依節奏、主題、預算與避雷項目排序，並寫出推薦原因；價格取自永信官網同區域標價。按「我想了解這團」即交給顧問。</p><p><b>篩選</b>：結果頁可依親和圖的四項需求自選條件，例如連泊不換飯店、少拉車、預算以內。</p></div></div>
<p class="note">原型另有開場動畫、12 題情境插畫、真實歐洲探索地圖與旅人護照足跡頁，見附錄 A。</p>
<div class="row"><div style="flex:2.1">{t([['角色', '代表人物', '節奏', '取向', '一句話'], ['經典收藏家', '白兔', '精準', '經典名景', '總知道下一站幾點出發，想在有限時間看完經典'], ['嚴選鑑賞家', '紅心皇后', '精準', '深度體驗', '對品質有自己的標準，寧可提早訂好也不將就'], ['從容探索家', '愛麗絲', '均衡', '不分取向', '跟著路線走，也為有趣的事停下腳步'], ['隨興巡禮者', '瘋帽匠', '留白', '經典名景', '名景想看，但不想照表操課'], ['慢遊生活家', '柴郡貓', '留白', '深度體驗', '往哪走都可以，像住在當地一樣生活']], widths=['17%', '14%', '9%', '14%', '46%'])}</div>
<div style="flex:1" class="small"><b style="color:#2F4C6E">設計原則</b><ol><li>系統存的是節奏與取向分數，不只存角色；客人可以隨時換個角色看看。</li><li>結果只是建議，一律提供「換個角色」。</li><li>先取得同意才寫入標籤。</li><li>對外名稱為「旅行風格測驗」，不使用 MBTI。</li></ol></div></div>
<h3>5-2 同一團，三種節奏選項</h3>
{t([['項目', '精準檔', '均衡檔', '留白檔'], ['核心行程與接送', '共用', '共用', '共用，另加自由日'], ['每日安排', '全程導覽', '半天導覽、半天自由', '必要元素以外自由探索'], ['加購', '少量精選', '依興趣選擇', '自選體驗模組']], widths=['22%', '26%', '26%', '26%'])}
<p>永信約 20 人成團，拆成三個團將難以成團；一團裡給三種選項，人數夠成團，客人也能選自己的節奏。選擇相同節奏的客人在自由時段一起行動，也回應「跟同頻的人出遊」（待訪談驗證）。</p>
<p>永信每個行程已有產品代碼，只需加上節奏、主題、季節、團費區間與天數標籤，就能與客人標籤配對。預算較低的客人可導向永信既有的 GOOD GO 系列與東歐 10 天行程（約 6.6 至 8 萬元），不需開發新產品。</p>
'''))
# ---------- P8 ----------
pages.append(page(8, '五、初步解決方案（二）LINE 官方帳號', f'''
<h2>五、初步解決方案（二）LINE 官方帳號</h2>
<p class="lead">先讓每一則訊息都有人或系統回覆，再交給顧問。</p>
<h3>5-3 前後對照：同一位客人，同一句話</h3>
{fig(W+'beforeafter.png', '圖 5-7　前後對照：同一位客人、同一句話（現況取自圖 1-1）', '100%')}
<h3>5-4 圖文選單與保底回覆</h3>
<div class="row">{fig(H+'ys_line.png', '圖 5-9　導入後畫面示意（未使用永信標誌）', '82mm')}
<div style="flex:1;display:flex;flex-direction:column;gap:2.2mm" class="small">
<p>本案建議永信採用 <b>2 分頁的大型選單</b>：「找旅程」分頁為 1 大 4 小，最大的一格給旅行風格測驗，直接補上「客人說都可以」的引導斷點；「我的旅程」分頁為 6 格，以歐洲旅人護照為首。選單控制在 6 格以內：永信靠的是顧問服務，不是大量促銷，入口太多，客人反而找不到測驗；「找真人顧問」固定在右下角，保留永信目前真人回覆的做法。各家版型對照見附錄 B（圖 5-8）。</p></div></div>
{t([['分頁', '對象', '入口'], ['找旅程', '新客', '旅行風格測驗（主視覺大格）、歐洲探索地圖、本季歐洲精選、我要詢價、找真人顧問（含五地門市與常見問題）'], ['我的旅程', '老客', '旅人護照、出發須知、返國問卷、專屬禮遇、推薦朋友、找我的顧問']], widths=['13%', '10%', '77%'])}
<p>第一階段先用單一選單；試辦後串接開發者介面，新客預設看到「找旅程」分頁，有出團紀錄的老客以標籤自動切換為「我的旅程」分頁。客人輸入任何系統無法辨識的訊息，立即回覆測驗邀請（第一階段為文字連結，試辦後加上快速按鈕），同時通知顧問。客人主動發起的互動不計入付費訊息則數，只有主動群發才計費，因此本案以服務型互動為主、群發為輔。全公司使用單一帳號，以標籤區分五地門市。</p>
'''))
# ---------- P9 ----------
pages.append(page(9, '五、初步解決方案（二）（三）', f'''
<h3>5-5 LINE 功能三階段</h3>
{t([['階段', '功能', '是否需要開發'], ['MVP', '認證帳號、來源 QR、歡迎訊息、單一圖文選單、自動回應與保底回覆、聊天標籤（手動）、多人管理、分眾推播（則數依方案計費）、問卷（後台問卷調查將於 2026/12/2 停止服務，返國問卷改用測驗網頁或替代表單）、優惠券（手動發送）、分析報表', '否，管理後台內建'], ['試辦後', '兩分頁選單、自動標籤、依標籤顯示選單、快速回覆按鈕、依護照等級自動發送禮遇券', '小，串接開發者介面（Messaging API）'], ['擴大', 'LINE Login 帳號連動與 LIFF 內嵌測驗（一起上線）、AI 代理（只整理需求、交給顧問，依 LINE 當時提供的功能評估）', '中高，需對應會員系統'], ['不做', '集點卡（頻率太低）、抽獎與簽到（不符質感）、大量定期群發', '—']], widths=['10%', '70%', '20%'])}
<p class="small">名詞說明：MVP 指先用現成功能上線、不需開發的第一版；Messaging API 是讓自己的程式自動回覆、貼標籤的 LINE 串接方式；LINE Login 讓客人用 LINE 帳號登入會員；LIFF 則是在 LINE 裡直接開網頁，不必跳到瀏覽器。</p>
<p class="note">三個階段的介面示意（圖 5-10 至 5-12）與 LINE 官方帳號管理後台實際截圖見附錄 B。</p>
<h2>五、初步解決方案（三）CRM：客戶資料卡、NES 分群與歐洲旅人護照</h2>
<p class="lead">CRM 分四步：用測驗取得客人、用資料卡記下偏好、用 NES 與護照等級決定怎麼經營、在預測的出發時間前喚醒。資料集中在一張卡上，顧問不必重問；老客則有一本記錄去過哪裡的護照。</p>
<h3>5-6 一張客戶資料卡：以林雅婷為例</h3>
{t([['來源', '社群 IG、台北門市', '旅程狀態', '已測驗 → 已詢價'], ['偏好', '節奏分數 留白 0.7／精準 0.3、藝術、暑假、10–13 萬、避開每天換飯店', '價值', '互動分數（新客）；成交後改以 RFM 判斷'], ['合規', '行銷同意與日期', '', '']], head=False, widths=['10%', '44%', '13%', '33%'])}
<p>標籤以客人自己選的為準，其次看實際行為，最後才是測驗結果；90 天無互動的標籤降級。RFM 的三個指標各有用途：R（最近一次出團）改用 NES 依個人週期判斷，決定什麼時候聯繫；F（出團次數）就是護照等級，決定給什麼禮遇；M（累計金額）決定同一群客人裡誰先聯繫，也用在 7-2 的效益試算。試辦以訂單 CSV 計算，不必先串接公司內部系統。</p>
<h3>5-7 歐洲旅人護照</h3>
{t([['層次', '依據', '作用'], ['旅人角色：白兔、紅心皇后、愛麗絲、瘋帽匠、柴郡貓', '旅行風格測驗；客人可自行切換', '身分與樂趣；五種角色各自累積旅歷，不被定型'], ['護照等級：啟程、銀、金、晶鑽', '累計出團次數，不設年度降級', '實質禮遇；升級時只換頭像材質與實體護照封面，角色不變'], ['足跡地圖', '去過的國家依造訪次數分三級著色，2 次以上加次數圓章', '一眼看出「去過哪裡、哪裡最常去」；未點亮的區域就是下一次的推薦']], widths=['28%', '34%', '38%'])}
'''))
# ---------- P10 ----------
pages.append(page(10, '五、初步解決方案（三）旅人護照', f'''
<div class="row">{fig(H+'cameo12.png', '圖 5-13　五種旅人與四種材質（原創造型，避開迪士尼版本）', '64mm')}
<div style="flex:1;display:flex;flex-direction:column;gap:2mm" class="small"><b style="color:#2F4C6E;font-size:9.5pt">設計原則：只記錄客人去過哪裡，不派任務</b>
<ol><li>不給任務清單；行程中本來就會到的景點由領隊集章，客人不必多做任何事。</li><li>全部選填，不設倒數與排行榜，不顯示未完成。</li><li>收藏密度依角色調整：收藏家最多，生活家最少且為開放式。</li><li>用語與視覺採護照、郵戳與維多利亞剪影風格，全程米紙底、低飽和配色，客人可選擇不顯示頭像。</li><li>出團即自動點亮（被動參與）；行前說明會發放實體護照，年長客人也能參與。</li><li>老客依訂單紀錄回溯點亮去過的區域，一加入就有內容。</li></ol>
<p>地圖直接採用永信官網的歐洲分類：東歐 5 區、西歐 8 區、南歐 8 區、北歐 2 區，每一區背後都有真實行程。</p></div></div>
<h3>5-8 依 NES 三類五態與護照等級決定行動</h3>
<p class="lead">NES 依每位客人自己的出團週期分群，不用固定的 12 個月：長線旅遊有人一年一次、有人三年一次，用同一個時間判斷會把正常的客人誤當成沉睡。只出過一次團、還沒有個人週期的客人，先用永信全體客人的平均週期（待永信提供）。同一格裡的客人，累計金額高的先聯繫。</p>
{t([['狀態', '判斷方式', '金、晶鑽', '銀', '啟程'], ['N 新客', '第一次出團或已測驗未成交', '—', '—', '顧問跟進第一次出團'], ['E0 主力客', '在個人週期 2 倍內再出團', '邀請推薦與揪團', '主題內容與講座保溫', '顧問跟進下一次'], ['S1 瞌睡客', '超過 2 倍未再出團', '專屬顧問問候', '主題內容與講座保溫', '主題內容'], ['S2 半睡客', '超過 2.5 倍', '專屬顧問聯繫，附未點亮區域推薦', '回溯點亮地圖＋分眾喚醒', '分眾喚醒'], ['S3 沉睡客', '超過 3 倍', '專屬顧問聯繫', '一年一次大型喚醒', '降低聯繫頻率']], widths=['13%', '24%', '23%', '22%', '18%'])}
<p class="small">以陳建宏為例：2022–2024 年每年出團一次，個人週期約 1 年，最後一次在 2024 年 3 月，到 2026 年 10 月約 2.6 年，屬於 S2 半睡客；他是銀等級，所以用回溯點亮地圖加分眾喚醒。</p>
<h2>五、初步解決方案（四）服務藍圖與試辦；六、可行性分析</h2>
<h3>5-9 服務藍圖</h3>
{fig(W+'blueprint.png', '圖 5-15　服務藍圖：6 個階段、4 層', '100%')}
'''))
# ---------- P11 ----------
pages.append(page(11, '五（四）試辦　六、可行性分析', f'''
<h3>5-10 MVP 試辦</h3>
<p class="small lead">試辦前，原型已經改過四個地方：</p>
{t([['改了什麼', '原本', '現在', '原因'], ['角色主題', '荷馬史詩', '愛麗絲夢遊仙境', '要整個歐洲都適用、不一定用神話，改用知名角色'], ['頭像風格', 'Q 版公仔', '維多利亞剪影', '過於卡通、缺少識別性，但保持非寫實'], ['題數與角色', '8 題、三種角色', '12 題、五種角色', '加入「取向」計分，同一種節奏再分成重經典名景與重深度體驗兩種人'], ['返國問卷', 'LINE 後台問卷', '測驗網頁', '實際後台顯示「問卷調查將於 2026/12/2 停止服務」'], ['後台畫面', '團隊自繪示意', '測試帳號實際截圖', '自繪示意不是 LINE 真實介面；實際截圖也順帶證明第一階段功能後台都有']], widths=['13%', '16%', '19%', '52%'])}
{fig(W+'pilot.png', '圖 5-16　試辦設計：4 個階段、1 個決策關卡', '100%')}
{t([['驗證線', '假設', '通過標準'], ['新客', '測驗推薦優於一般推薦', '詢價率或報價率高於對照組'], ['老客', '回溯點亮地圖＋分眾喚醒優於一般訊息', '回覆率或諮詢率高於對照組'], ['原型', '角色卡與地圖能引發興趣', '完成率、分享率、地圖點擊率（基準待取得）']], widths=['12%', '48%', '40%'])}
<p class="small">長線旅遊決策期長，試辦以詢價率與報價率為主要判斷依據。旅程中的集章需等新客出團，列為擴大階段；若永信同意，可在試辦期內由一團試發紙本集章卡。</p>
<h3>6 可行性七項條件</h3>
<div class="row">{fig(W+'risk.png', '圖 6-1　風險矩陣：七項可行性條件初步自評', '66mm')}
<div style="flex:1">{t([['條件', '評估', '對策'], ['執行難度', '中高（最高）', '同團三選項需產品企劃重新設計；試辦只改一條線'], ['競爭者', '高', '同業不是自動回覆但不問需求，就是會問但靠個人經驗；我們兩者都做，再加上旅人護照'], ['使用者接受度', '中', '先同意後貼標、可自選、推播頻率上限、遊戲化全選填'], ['時間限制', '中', '分階段，第 4 個月底決策'], ['商業模式', '中', '見七、商業模式的效益試算'], ['技術', 'MVP 低（不需開發）／試辦後 中低／擴大 中高', 'MVP 只用管理後台內建功能；試辦後才串接開發者介面；擴大階段再對應會員系統。官網已裝有 Google 的網站追蹤工具'], ['成本', '中低', '以服務型互動為主；試辦總成本約 1–6 萬元，見 7-2']], widths=['19%', '27%', '54%'])}</div></div>
'''))
# ---------- P12 ----------
pages.append(page(12, '七、商業模式　八、市場推廣策略', f'''
<h2>七、商業模式</h2>
{fig(W+'bmc.png', '圖 7-1　商業模式九宮格', '100%')}
<h3>7-1 市場規模</h3>
<p class="small lead">2025 年國人出國 1,894 萬人次，創下新高；其中歐洲約占 8%，人次不多，花費卻占出國總花費兩成以上。我們用永信官網歐洲團體行程的團費中位數 109,900 元推估：</p>
{t([['層級', '範圍', '推估', '依據'], ['整體市場', '國人赴歐洲旅遊', '約 152 萬人次／年', '觀光署 2025 年出國人次 × 歐洲占比約 8%'], ['可服務市場', '其中參加團體旅遊的人', '約 45–76 萬人次，約 500–830 億元／年', '跟團比例假設 3–5 成（待講師確認），乘以團費中位數'], ['試辦目標', '一條歐洲線、4 個月', '多成交 1–6 位即可打平', '見 7-2 效益試算']], widths=['13%', '22%', '30%', '35%'])}
<p class="small">雄獅也指出，疫情後 12 天以上的歐洲團成長超過 3 倍，客人越來越願意花時間慢慢玩，這和留白檔、深度路線的方向一致。</p>
<h3>7-2 效益試算</h3>
<div class="row">{fig(W+'driver.png', '圖 7-2　效益驅動因子樹：新客 6 個、老客 4 個因子', '80mm')}
<div style="flex:1;display:flex;flex-direction:column;gap:2mm" class="small"><p><b>損益兩平成交數 ＝ 試辦總成本 ÷（平均團費 × 毛利率）</b></p>
{t([['參數', '來源'], ['測驗完成率、預算分布', '原型實測'], ['平均團費', '永信官網歐洲團中位數 109,900 元；試辦以實際路線團費為準'], ['毛利率', '公開資料推估：雄獅 2025 年第三季為 17.1%；保守、基準情境取 10%、15%'], ['詢價率、成交率、沉睡名單數', '待講師提供'], ['試辦成本', '見下表；LINE 方案依 2026/11/1 新制計價']], widths=['42%', '58%'])}</div></div>
{t([['項目', '保守', '基準', '樂觀'], ['LINE 方案（4 個月）', '高用量 5,600 元', '中用量 4,000 元', '輕用量 0 元'], ['紙本護照與集章卡', '200 本 × 80 元＝16,000 元', '100 本 × 60 元＝6,000 元', '50 本 × 50 元＝2,500 元'], ['顧問時間', '60 小時 × 400 元＝24,000 元', '40 小時 × 350 元＝14,000 元', '20 小時 × 300 元＝6,000 元'], ['禮遇', '10,000 元', '5,000 元', '2,000 元'], ['<b>試辦總成本</b>', '<b>55,600 元</b>', '<b>29,000 元</b>', '<b>10,500 元</b>'], ['毛利率', '10%', '15%', '17.1%'], ['每位客人毛利', '10,990 元', '16,485 元', '18,793 元'], ['<b>損益兩平成交數</b>', '<b>6 位</b>', '<b>2 位</b>', '<b>1 位</b>']], widths=['22%', '26%', '26%', '26%'])}
<p class="small">損益兩平成交數等於試辦總成本除以每位客人毛利，無條件進位。測驗網頁架在 GitHub Pages，不另計費；印製單價、時數與時薪為團隊假設。三種情境下，試辦期間只要多成交 1 到 6 位客人就能打平；取得永信實際的毛利率與人力成本後再更新。</p>
<h2>八、市場推廣策略（草稿，11/12 課後定稿）</h2>
{t([['階段', '管道', '做法', '指標'], ['觸及', '社群', '角色卡分享、「你是哪種歐洲旅人」', '分享率、來源人數'], ['觸及', '搜尋與 AI 搜尋', '以「第一次去歐洲怎麼選」「歐洲慢旅行」等問題建立內容，文末接測驗', '自然流量、AI 回答中的能見度'], ['觸及', '旅展與五地門市', '攤位與門市來源 QR，顧問以測驗作為引導工具', '各來源加入數'], ['轉換', 'LINE', '測驗 → 推薦 → 顧問接手', '詢價率、報價率'], ['留存', '旅人護照', '返國點亮、未點亮區域推薦', '回購率、推薦成團數']], widths=['9%', '19%', '47%', '25%'])}
<p class="small">推廣時先把 LINE 的回覆流程補好，再花錢做曝光。</p>
<h3>8-1 用行銷新 4P 檢查經營方式</h3>
<p class="small lead">傳統 4P 看產品、價格、通路、推廣；新 4P 把焦點放在每一位客人身上，剛好對應本案的 CRM。</p>
{t([['新 4P', '意思', '本案怎麼做'], ['People 人', '以客人為核心，隨時掌握每位客人的狀態', '每位客人有旅人角色、NES 狀態與護照等級'], ['Performance 成效', '用客人數、客單價、活躍度判斷經營結果', '追蹤測驗完成率、詢價率、各 NES 狀態人數的變化'], ['Process 步驟', '先找出哪裡出問題，再依順序處理', '先補 LINE 的回覆斷點，再喚醒 S2、S3，最後才花錢做曝光'], ['Prediction 預測', '預測每位客人下一次購買的時間', '依個人出團週期推算下次出發時間，提前 3 個月推薦未點亮區域']], widths=['19%', '36%', '45%'])}
<h3>想請教講師的問題</h3>
<ol class="small"><li>永信現有的會員制度與等級為何？旅人護照應如何對應？</li><li>LINE 詢價到成交的比例、平均客單價與毛利率的大致範圍？</li><li>訂單系統能否匯出 CSV？沉睡老客的大約數量？</li><li>試辦期內是否有一團能試發紙本集章卡？</li><li>同團三節奏選項，在產品企劃與當地供應商上是否可行？</li></ol>
'''))
# ---------- Appendix ----------
qlab = ['Q1 行前準備', 'Q2 第一天', 'Q3 路標改變', 'Q4 旅伴', 'Q5 想帶回什麼', 'Q6 主題', 'Q7 街角的兔子洞', 'Q8 出發時間', 'Q9 哪種餐廳', 'Q10 預算', 'Q11 排隊', 'Q12 最不想遇到（複選）']
pages.append(page('A1', '附錄 A　測驗原型', f'''
<h2>附錄 A　測驗原型：12 題、開場動畫與測驗之後的流程（圖 5-3 至 5-5）</h2>
<p class="small">Q1、Q2、Q3、Q7、Q11 決定節奏，Q5、Q9 決定取向，合起來對應五種旅人；Q4、Q6、Q8、Q10 篩選行程，Q12 避開不想要的安排。每題上方為低飽和的愛麗絲情境插畫。</p>
{cards([(S + f'q{i+1}.png', qlab[i], '') for i in range(12)] + [(S+'i2.png', '開場：掉進兔子洞', ''), (S+'cover2.png', '封面與按鈕', ''), (S+'r_pp.png', '旅人護照足跡頁', ''), (S+'r_fit.png', '推薦符合度', ''), (S+'r_extra.png', '補充題', ''), (S+'r_thanks.png', '感謝頁', '')], 6, '2mm')}
'''))
pages.append(page('B1', '附錄 B　LINE 後台與介面', f'''
<h2>附錄 B-1　管理後台實際截圖</h2>
<p class="small">團隊測試帳號實際截圖（2026/10/17）；帳號名稱與大頭貼改為永信旅遊示意，好友資料已匿名。</p>
{cards([(O+'hd_chatB.png', '聊天標籤與負責人', '顧問手動貼標籤、指派負責人'), (O+'hd_push.png', '群發訊息（分眾）', '傳送對象可選「篩選目標」'), (O+'hd_coupon.png', '優惠券', '依護照等級手動發送'), (O+'hd_insight.png', '分析報表', '加入、封鎖的每日變化')], 4, '2.5mm')}
'''))
pages.append(page('B2', '附錄 B　LINE 介面與選單', f'''
<h2>附錄 B-2　LINE 功能三階段介面示意（圖 5-10 至 5-12）</h2>
{cards([(W+'st1_1.png', 'MVP① 雅婷：新客加入', ''), (W+'st1_2.png', 'MVP② 雅婷說「都可以」', ''), (W+'st1_3.png', 'MVP③ 返國問卷（網頁）', ''), (W+'st2_1.png', '試辦後① 雅婷：依標籤換選單', ''), (W+'st2_2.png', '試辦後② 雅婷：快速回覆', ''), (W+'st2_3.png', '試辦後③ 建宏：升級發券', ''), (W+'st3_1.png', '擴大① 雅婷：LIFF 測驗', ''), (W+'st3_2.png', '擴大② 建宏：帳號連動', ''), (W+'st3_3.png', '擴大③ 雅婷：AI 先問', '')], 5, '2.2mm')}
<h2>附錄 B-3　選單對照與實體護照</h2>
<div class="row">{fig(H+'grid_compare.png', '圖 5-8　圖文選單版型對照', '88mm')}{fig(H+'passport.png', '圖 5-14　實體護照示意；原型的數位足跡頁使用同一套次數規則', '1fr', 'flex:1')}</div>
'''))
pages.append(page('C1', '附錄 C　陳建宏同理心地圖、請教問題與資料來源', f'''
<h2>附錄 C　同理心地圖：陳建宏</h2>
{fig(W+'empathy_chen.png', '圖 3-2　同理心地圖：陳建宏（對應圖 2-1 人物誌；痛點右側為對應的第五章功能）', '100%')}
<h3>資料來源</h3>
<ul class="small cols2"><li>永信旅行社官網 ystravel.com.tw：歐洲 23 個分類頁與 8 個遊輪分類頁，共 138 個行程，2026 年 10 月 17 日查詢</li><li>蕃薯藤新聞，永信旅遊 2024 金旅獎・優旅選，2024/12/18（n.yam.com/Article/20241218360732）：成團人數、手寫明信片服務</li><li>中央社，2025 年國人出國 1,894 萬人次，2026/1/26（cna.com.tw/news/ahel/202601260266.aspx）；資料來源為交通部觀光署</li><li>工商時報旺得富，歐洲約占出境人次 8%、花費兩成以上，2026/1/20（wantrich.chinatimes.com/news/20260120900654-420501）</li><li>鉅亨網，雄獅曝旅遊線的隱形冠軍不是日韓，2025/8/28（news.cnyes.com/news/id/6130800）</li><li>永豐金證券，雄獅 3Q25 EPS 4.8 元優於預期，2025/11/6（sinotrade.com.tw）：毛利率 17.1%</li><li>Omnichat，LINE 官方帳號方案最新調整，2026/8/12（blog.omnichat.ai/tw/line-pricing-sep2026-zh）；actgsys.com，LINE 官方帳號月費新制整理：2026/11/1 起的方案價格，以 LINE 官方公告為準</li><li>科技新報，LINE 官方帳號 2.0 客服功能免費，2019/3/7（technews.tw）：客人主動發起的互動不計入訊息則數</li><li>雄獅、可樂、山富、五福、永信 LINE 官方帳號：團隊實測截圖，2026 年 10 月 17 日</li><li>陳傑豪，數位時代，從舊 4P 到新 4P，大數據究竟如何顛覆傳統行銷，2015/9/27（bnext.com.tw/article/37493）：新 4P 與 NES 模型</li><li>林玲瑩，遠見雜誌，精準行銷，營收獲利水位圖，2015/8/27（gvm.com.tw/article/53410）：NES 三類五態的判斷方式</li><li>Parasuraman, Zeithaml &amp; Berry, A Conceptual Model of Service Quality and Its Implications for Future Research, Journal of Marketing, 1985（doi.org/10.1177/002224298504900403）：服務品質五個缺口</li><li>Parasuraman, Zeithaml &amp; Berry, SERVQUAL: A Multiple-Item Scale for Measuring Consumer Perceptions of Service Quality, Journal of Retailing, 1988：服務品質五構面</li></ul>
'''))
html = f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
open(P + 'print.html', 'w', encoding='utf8').write(html)

PACK = r"""()=>{
 const body=document.body, srcs=[...document.querySelectorAll('.src')];
 let pn=0, page=null, chunk=null;
 const newPage=()=>{pn++;page=document.createElement('section');page.className='page';
   page.innerHTML=(pn>1?'<div class="hdr"><span>永信旅遊 旅行風格測驗與 LINE 分眾經營提案</span><span>輔大創新創業社 課程提案・2026/10</span></div>':'')+'<div class="chunk"></div><div class="ftr">'+pn+'</div>';
   body.append(page);chunk=page.querySelector('.chunk');};
 const over=()=>chunk.scrollHeight>chunk.clientHeight+1;
 const blocks=[];
 for(const s of srcs){const els=[...s.children];let i=0,first=true;
   while(i<els.length){const g=[];
     if(/^H[23]$/.test(els[i].tagName)){while(i<els.length&&(/^H[23]$/.test(els[i].tagName)||els[i].classList.contains('pps')||els[i].classList.contains('lead')))g.push(els[i++]);if(i<els.length)g.push(els[i++]);}
     else g.push(els[i++]);
     blocks.push({g,appx:first&&s.dataset.appx==='A'});first=false;}}
 newPage();
 for(const b of blocks){
   if(b.appx&&chunk.children.length)newPage();
   const w=document.createElement('div');w.className='blk';b.g.forEach(e=>w.append(e));chunk.append(w);
   if(!over())continue;
   const figs=[...w.querySelectorAll(':scope > .row > figure')];
   let ok=false;
   if(figs.length){const base=figs.map(f=>f.style.width);
     for(let k=97;k>=82;k-=3){figs.forEach((f,j)=>{f.style.width='calc('+(base[j]||'100%')+' * '+(k/100)+')';f.style.alignSelf='center'});if(!over()){ok=true;break}}
     if(!ok)figs.forEach((f,j)=>{f.style.width=base[j];f.style.alignSelf=''});}
   if(!ok&&chunk.children.length>1){
     const pf=[...chunk.querySelectorAll('.row > figure')].filter(f=>!w.contains(f)&&!f.closest('.cards'));
     const base=pf.map(f=>f.style.width||'100%');
     for(let k=97;k>=82;k-=3){pf.forEach((f,j)=>{f.style.width='calc('+base[j]+' * '+(k/100)+')';f.style.alignSelf='center'});if(!over()){ok=true;break}}
     if(!ok){pf.forEach((f,j)=>{f.style.width=base[j]==='100%'?'':base[j];f.style.alignSelf=''});w.remove();newPage();chunk.append(w);}
   }
 }
 srcs.forEach(s=>s.remove());
 for(const p of document.querySelectorAll('.page')){
   chunk=p.querySelector('.chunk');
   const rf=[...chunk.querySelectorAll('.row > figure')];
   if(p.querySelector('h2')&&/附錄/.test(p.querySelector('h2').textContent))continue;
   for(const f of rf){const mm=v=>v*25.4/96;let w=mm(f.getBoundingClientRect().width);const cap=Math.min(100,mm(f.parentElement.getBoundingClientRect().width)-72);
     while(w<cap){f.style.width=(w+3)+'mm';if(over()){f.style.width=w+'mm';break}w+=3}}
   const r=chunk.getBoundingClientRect();let m=r.top;for(const k of chunk.children)m=Math.max(m,k.getBoundingClientRect().bottom);
   const free=r.bottom-m, n=chunk.children.length;
   if(n>1&&free>8){const add=Math.min(free/(n-1), 42);chunk.style.gap='calc(2.2mm + '+add+'px)';}
 }
 return [...document.querySelectorAll('.page')].map(p=>{const c=p.querySelector('.chunk');const r=c.getBoundingClientRect();let m=r.top;for(const k of c.children)m=Math.max(m,k.getBoundingClientRect().bottom);return Math.round((r.bottom-m)*25.4/96)});
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':794,'height':1123})
        await pg.goto('file://' + P + 'print.html'); await pg.wait_for_timeout(1500)
        print('free mm:', await pg.evaluate(PACK))
        await pg.pdf(path=P + 'proposal.pdf', prefer_css_page_size=True, print_background=True)
        await b.close()
    from pypdf import PdfReader
    print('pages', len(PdfReader(P + 'proposal.pdf').pages))
asyncio.run(main())
