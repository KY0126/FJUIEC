import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
ROOT = _os.path.dirname(ROOT)
import asyncio,os,base64
from playwright.async_api import async_playwright
from PIL import Image
# square face crop for center
im=Image.open(ROOT + '/persona/src_w.jpg').convert('RGB')
im.crop((250,170,770,690)).resize((360,360),Image.LANCZOS).save('face_w.jpg',quality=92)
FACE='data:image/jpeg;base64,'+base64.b64encode(open('face_w.jpg','rb').read()).decode()
SRC={'obs':('觀察','#3F7A8C'),'proto':('原型數據','#C9822E'),'iv':('待訪談','#5E8A4E'),'hyp':('團隊推測','#8A7398')}
def d(k): return f'<i class="dot" style="background:{SRC[k][1]}" title="{SRC[k][0]}"></i>'
def li(k,t): return f'<div class="li">{d(k)}<span>{t}</span></div>'
def pill(k): n,c=SRC[k]; return f'<i class="src" style="--c:{c}">{n}</i>'
CSS='''*{box-sizing:border-box}body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#EFE7D8;color:#2B2B33}
#fig{width:760px;padding:16px 22px;background:#EFE7D8;display:flex;flex-direction:column;gap:9px}
.hd{display:flex;gap:14px;align-items:center;justify-content:space-between}.hd img{width:58px;height:58px;border-radius:50%;border:2px solid #E8A54F;object-fit:cover}
h1{margin:0;font-size:22px;color:#2F4C6E;line-height:1.3}.sub{font-size:14.5px;color:#665F53;margin-top:-5px}
.legend{display:flex;gap:6px 12px;flex-wrap:wrap;align-items:center;font-size:13.5px;color:#665F53}
.src{font-style:normal;display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--c);border:1.3px solid var(--c);border-radius:999px;padding:0 8px;line-height:20px;background:#FFFDF8}
.src:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.map{position:relative;height:290px;background:#FBF7EF;border:1.5px solid #E2D7C2;border-radius:14px;overflow:hidden}
.map svg{position:absolute;inset:0}
.q{position:absolute;display:flex;flex-direction:column;gap:3px}
.q h3{margin:0 0 3px;font-size:14px;letter-spacing:.08em;color:#8B6A3E}
.q.t,.q.b{left:50%;transform:translateX(-50%);width:max-content;align-items:flex-start}.q.t h3,.q.b h3{align-self:center}
.q.t{top:6px}.q.b{bottom:5px}
.q.l{left:16px;top:50%;transform:translateY(-50%);width:205px}.q.r{right:16px;top:50%;transform:translateY(-50%);width:max-content}
.li{display:flex;gap:6px;align-items:baseline;font-size:14px;line-height:1.32}

.dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex:none;transform:translateY(-1px)}
.me{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px}
.me img{width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid #FBF7EF;box-shadow:0 0 0 2px #2F4C6E}
.me b{background:#2F4C6E;color:#fff;font-size:13.5px;border-radius:6px;padding:1px 10px}
.pg{display:grid;grid-template-columns:1.25fr 1fr;gap:12px}
.box{background:#FBF7EF;border:1.5px solid #E2D7C2;border-radius:12px;padding:8px 14px;display:flex;flex-direction:column;gap:4px}
.box h3{margin:0 0 2px;font-size:15px;display:flex;align-items:center;gap:8px}
.pain h3{color:#A3473C}.gain h3{color:#4E7A3E}
.pr{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font-size:14px;line-height:1.4}
.pr .t{display:flex;gap:6px;align-items:baseline}
.fx{font-size:12.5px;font-weight:700;color:#2F4C6E;background:#E6EDF4;border-radius:6px;padding:1px 7px;white-space:nowrap}
.ins{background:#FBF1E2;border:2px solid #E8A54F;border-radius:12px;padding:8px 14px;font-size:14.5px;line-height:1.55}
.ins b{color:#2F4C6E}'''
html=f'''<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div id="fig">
<div class="hd"><h1>同理心地圖：林雅婷</h1><div class="legend">來源：{pill('obs')}{pill('proto')}{pill('iv')}{pill('hyp')}</div></div>
<div class="sub">對應圖 2-1 人物誌：28 歲台北行銷企劃，主要客群，柴郡貓型（慢遊生活家）</div>
<div class="map">
<svg width="712" height="290" viewBox="0 0 712 290"><path d="M0 0L712 290M712 0L0 290" stroke="#D9CDB6" stroke-width="1.5" stroke-dasharray="5 5"/></svg>
<div class="q t"><h3>想法與感受</h3>{li('hyp','「有沒有人能直接告訴我適合什麼？」')}{li('hyp','滑到歐洲照片很心動，被問國家就卡住')}{li('hyp','怕選錯，浪費一年一次的長假')}</div>
<div class="q l"><h3>聽到</h3>{li('obs','顧問問：「想去哪些國家？」')}{li('iv','朋友說跟團每天都很趕')}{li('iv','朋友分享自己的歐洲行程')}</div>
<div class="q r"><h3>看到</h3>{li('hyp','朋友 IG 上的歐洲照片')}{li('obs','官網依國家排的一長串行程')}{li('obs','社群上的折扣廣告')}</div>
<div class="q b"><h3>說與做</h3>{li('obs','說「都可以」「目前沒有太多想法」')}{li('hyp','說「告訴我幾個適合我的就好」')}{li('obs','傳 LINE 詢問，收到官網連結就關掉')}</div>
<div class="me"><img src="{FACE}"><b>林雅婷</b></div>
</div>
<div class="pg">
<div class="box pain"><h3>痛點 <span style="font-size:12.5px;color:#8B8273;font-weight:400">→ 對應第五章功能</span></h3>
<div class="pr"><span class="t">{d('obs')}說不出國家，對話就斷了</span><span class="fx">旅行風格測驗</span></div>
<div class="pr"><span class="t">{d('obs')}等回覆，只收到官網連結</span><span class="fx">LINE 保底回覆</span></div>
<div class="pr"><span class="t">{d('iv')}每天換飯店、趕景點很累</span><span class="fx">同團三節奏（留白檔）</span></div>
<div class="pr"><span class="t">{d('proto')}怕超出 10–13 萬預算</span><span class="fx">結果頁預算篩選</span></div>
<div class="pr"><span class="t">{d('hyp')}怕選錯，浪費長假</span><span class="fx">換個角色＋顧問接手</span></div></div>
<div class="box gain"><h3>獲得</h3>
{li('hyp','很快拿到幾個合自己節奏的行程')}{li('hyp','有人接著討論，不必重講一次')}{li('proto','暑假和朋友成行，留白多、少換飯店')}{li('proto','行程有藝術主題')}</div>
</div>
<div class="ins"><b>洞察</b><span style="font-size:12.5px;color:#8B8273">（待原型驗證）</span>　她說「都可以」，其實有偏好，只是說不出想要的樣子。<br><b>POV</b>　雅婷需要一種不必先說出國家，也能表達「留白、藝術、少換飯店」這些偏好的方式。</div>
</div></body></html>'''
open('emp2.html','w').write(html)
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':760,'height':900},device_scale_factor=3)
        await pg.goto('file://'+os.path.abspath('emp2.html')); await pg.wait_for_timeout(300)
        await (await pg.query_selector('#fig')).screenshot(path='emp2.png'); await b.close()
asyncio.run(m())
im=Image.open('emp2.png'); print(im.size); im.resize((im.width//2,im.height//2)).save('emp2_prev.png')
