# 行程預覽示意圖（推薦團卡、行程預覽、第一次跟團流程）。地圖先在本資料夾 npm i d3-geo topojson-client world-atlas 後執行 node map.mjs
import json, os, asyncio
from playwright.async_api import async_playwright

D = os.path.dirname(os.path.abspath(__file__))
PAV = json.load(open(os.path.join(os.path.dirname(D), 'pav.json')))
cat = PAV['cat.start'].replace('UID', 'catstart')
MAP = open(os.path.join(D, 'map.svg')).read()

CSS = '''
*{box-sizing:border-box;margin:0;padding:0}
body{width:1200px;background:#EFE7D8;font-family:'Noto Sans CJK TC',sans-serif;color:#2B2A27;padding:28px 30px 26px}
h1{font-size:26px;color:#2F4C6E;font-weight:900;margin-bottom:6px}
.lead{font-size:15px;color:#5B5348;margin-bottom:18px;line-height:1.55}
.flow{display:flex;gap:8px;align-items:center;margin-bottom:20px;flex-wrap:wrap}
.flow span{background:#FBF7EF;border:1.5px solid #D9CDB8;border-radius:16px;padding:4px 12px;font-size:14px;font-weight:700;color:#2F4C6E}
.flow span.new{background:#2F4C6E;color:#fff;border-color:#2F4C6E}
.flow i{font-style:normal;color:#C9822E;font-weight:900}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:start}
.h{font-size:19px;font-weight:900;color:#2F4C6E;margin-bottom:9px}
.ph{background:#FBF7EF;border:1.5px solid #DCD0BC;border-radius:18px;padding:18px 16px}
.cap{font-size:14.5px;color:#4A4339;margin-top:9px;line-height:1.5}
.lbl{font-size:13px;color:#7A705F;margin-bottom:6px}
.t{font-size:19px;font-weight:900;line-height:1.35;color:#2B2A27}
.sub{font-size:13.5px;color:#7A705F;margin-top:4px}
.me{display:flex;gap:10px;align-items:center;background:#F3EBDD;border-radius:12px;padding:9px 11px;margin-bottom:14px}
.me .av{width:46px;height:46px;flex:none}.me .av svg{width:100%;height:100%}
.me b{font-size:15px}.me small{display:block;font-size:13px;color:#7A705F}
.tour{border:1.5px solid #E2D6C2;border-radius:14px;padding:14px;background:#fff}
.why{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.why div{font-size:14px;line-height:1.5;padding-left:12px;border-left:3px solid #E8A54F}
.why b{color:#9A6A2A}
.price{display:flex;justify-content:space-between;margin-top:12px;font-size:14px;border-top:1px dashed #D9CDB8;padding-top:10px}
.btn{display:block;text-align:center;border-radius:12px;padding:11px;font-size:15px;font-weight:900;margin-top:12px}
.btn.o{background:#E8A54F;color:#2B2A27;box-shadow:0 3px 0 #C9822E}
.btn.w{background:#fff;border:1.5px solid #D9CDB8;color:#2F4C6E}
.other{margin-top:14px;font-size:13.5px;color:#7A705F}
.other div{border:1.5px solid #E7DDCC;border-radius:10px;padding:9px 11px;margin-top:6px;color:#4A4339;background:#FDFBF6}
.map{border-radius:12px;overflow:hidden;border:1.5px solid #DCD0BC;margin:10px 0 6px}
.map svg{display:block;width:100%;height:auto}
.legend{display:flex;gap:14px;font-size:13px;color:#5B5348;margin-bottom:10px}
.legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.sec{font-size:15px;font-weight:900;color:#2F4C6E;margin:12px 0 6px}
.kv{display:grid;grid-template-columns:76px 1fr;gap:6px 8px;font-size:14px;line-height:1.45}
.kv b{color:#7A705F;font-weight:500}
.note{font-size:13px;color:#7A705F;margin-top:12px;line-height:1.5;background:#F3EBDD;border-radius:8px;padding:8px 10px}
.steps{display:flex;flex-direction:column;gap:0;margin-top:6px}
.st{display:grid;grid-template-columns:34px 1fr;gap:10px;position:relative;padding-bottom:16px}
.st:before{content:'';position:absolute;left:16px;top:32px;bottom:2px;width:2px;background:#E2D6C2}
.st:last-child:before{display:none}
.n{width:34px;height:34px;border-radius:50%;background:#2F4C6E;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:15px}
.st h5{font-size:15.5px;font-weight:900;margin:5px 0 3px}
.st p{font-size:14px;line-height:1.5;color:#4A4339}
.tbc{display:inline-block;font-size:12.5px;font-weight:700;color:#9A4A1E;background:#F8E3D3;border-radius:6px;padding:1px 6px;margin-top:4px}
.hl{background:#FFF1D9;border-radius:6px;padding:1px 4px}
.src{margin-top:20px;font-size:13px;color:#6E6555;line-height:1.6;border-top:1px solid #D9CDB8;padding-top:10px}
'''

HTML = f'''<html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<h1>行程預覽示意：讓新客在問顧問之前，先看懂這團長什麼樣子</h1>
<div class="lead">以林雅婷（柴郡貓型、最不想每天換飯店）為例。行程內容全部取自永信官網的實際團型，不經過 AI 改寫。這團是官網上住宿與體驗資料最完整的一團，示意用；正式版會先依預算篩選，雅婷的預算是 10–13 萬。</div>
<div class="flow"><span>測驗結果頁</span><i>→</i><span class="new">① 推薦給你的團</span><i>→</i><span class="new">② 行程預覽</span><i>→</i><span class="new">③ 第一次跟團看這裡</span><i>→</i><span>加入 LINE，讓顧問接手</span></div>
<div class="cols">

<div><div class="h">① 結果頁下方：推薦給你的團</div><div class="ph">
<div class="me"><span class="av">{cat}</span><div><b>慢遊生活家</b><small>柴郡貓型・留白節奏・深度體驗</small></div></div>
<div class="lbl">依你的答案挑的團</div>
<div class="tour">
<div class="t">蓄「士」待發．瑞士<br>四大列車．四大名峰美景 12 天</div>
<div class="sub">永信旅遊・瑞士・12 天・阿聯酋航空</div>
<div class="why">
<div><b>你最不想每天換飯店：</b>霞慕尼、策馬特各連住兩晚，這兩個早上不用收行李。</div>
<div><b>你的節奏是留白：</b>四段景觀列車和兩段遊湖，移動的時候也在看風景。</div>
<div><b>你偏好深度體驗：</b>行程有蒙特維爾冰河和瑞士藍冰洞。</div>
</div>
<div class="price"><span>團費</span><b>依出發日期，請洽顧問</b></div>
</div>
<span class="btn o">看行程預覽 →</span>
<div class="other">在你的預算 10–13 萬以內
<div>【阿聯假期】瑞法阿爾卑斯三峰 10 天．安錫小鎮．米蘭<br><b>118,900 元起</b></div>
<div>瑞士～好「士」連連．三大景觀列車．三大名峰 10 天<br><b>128,900 元起</b></div></div>
</div><div class="cap">推薦原因直接引用客人在測驗裡的答案，讓她知道為什麼是這一團。</div></div>

<div><div class="h">② 行程預覽</div><div class="ph">
<div class="t" style="font-size:17px">瑞士 12 天會住在哪裡、看到什麼</div>
<div class="map">{MAP}</div>
<div class="legend"><span><i style="background:#2F4C6E"></i>住宿地點</span><span><i style="background:#E8A54F"></i>景點與列車</span></div>
<div class="sec">住宿</div>
<div class="kv"><b>霞慕尼</b><span><span class="hl">連住兩晚</span> 白朗峰山腳的小鎮</span><b>策馬特</b><span><span class="hl">連住兩晚</span> 馬特洪峰山腳的小鎮</span><b>伯恩</b><span>瑞士首都</span><b>盧森湖一帶</b><span>阿爾卑斯渡假景觀旅館</span></div>
<div class="sec">交通與體驗</div>
<div class="kv"><b>景觀列車</b><span>黃金號、冰河列車、白朗峰景觀列車、伯連那</span><b>遊湖</b><span>藍湖手搖船、盧加諾湖遊船</span><b>名峰</b><span>馬特洪峰、白朗峰、少女峰</span></div>
<div class="note">單人入住一間房另加 38,000 元。每天的順序以出團行程表為準。</div>
<span class="btn o">第一次跟團？看出團流程 →</span>
</div><div class="cap">地圖只標住宿和景點的實際位置，不畫每日路線，避免和實際出團順序不一致。</div></div>

<div><div class="h">③ 第一次跟團看這裡</div><div class="ph">
<div class="t" style="font-size:17px">從報名到回國，會發生這些事</div>
<div class="steps">
<div class="st"><span class="n">1</span><div><h5>報名、付訂金</h5><p>和顧問確認出發日期與房型，付訂金保留名額。</p><span class="tbc">訂金金額待永信確認</span></div></div>
<div class="st"><span class="n">2</span><div><h5>行前說明</h5><p>出發前說明集合時間、行李、天氣與換匯，並拿到書面行程表。</p><span class="tbc">說明會形式待永信確認</span></div></div>
<div class="st"><span class="n">3</span><div><h5>機場集合</h5><p>出發當天在桃園機場和領隊會合，領隊協助報到與託運行李。</p></div></div>
<div class="st"><span class="n">4</span><div><h5>旅途中</h5><p>領隊全程同行，處理交通、住宿和門票。霞慕尼和策馬特那幾天，行李可以留在房間。</p></div></div>
<div class="st"><span class="n">5</span><div><h5>回國之後</h5><p>收到永信的手寫明信片；填一份回國問卷，護照地圖點亮瑞士。</p></div></div>
</div>
<span class="btn o">加入 LINE，讓顧問接手 →</span>
<span class="btn w">回到我的結果</span>
</div><div class="cap">寫給沒跟過團的人。永信內部流程的細節先標「待永信確認」，不先寫死。</div></div>

</div>
<div class="src">資料來源：永信旅行社官網〈【阿聯假期】蓄「士」待發．瑞士．四大列車．四大名峰美景 12 天〉團型頁（ZRH12EKS206S）與瑞士分類頁，2026 年 11 月 6 日查詢；手寫明信片服務見蕃薯藤新聞〈永信旅遊 2024 金旅獎・優旅選〉，2024/12/18。地圖底圖：Natural Earth（world-atlas）。</div>
</body></html>'''

async def main():
    open(os.path.join(D, 'mock.html'), 'w').write(HTML)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1200, 'height': 800}, device_scale_factor=2)
        await pg.goto('file://' + os.path.join(D, 'mock.html'))
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(D, '行程預覽示意.png'), full_page=True)
        await b.close()
asyncio.run(main())
