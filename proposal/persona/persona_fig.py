import asyncio, sys
from playwright.async_api import async_playwright
import base64
B=lambda f:'data:image/jpeg;base64,'+base64.b64encode(open(f,'rb').read()).decode()
W=f'<img class="ph" src="{B("photo_w.jpg")}">'; M=f'<img class="ph" src="{B("photo_m.jpg")}">'
SRC={'obs':('觀察','#3F7A8C'),'proto':('原型數據','#C9822E'),'iv':('待訪談','#5E8A4E'),'hyp':('團隊推測','#8A7398'),'ys':('待永信確認','#B5574B')}
def t(k): n,c=SRC[k]; return f'<i class="src" style="--c:{c}">{n}</i>'
CSS='''
.fig.pr{width:1000px;gap:12px}.fig.pr .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:stretch}
.pr .card{grid-template-columns:1fr;gap:10px;padding:14px}
.pr .who{display:grid;grid-template-columns:118px 1fr;gap:4px 14px;align-items:center}
.pr .who .ph{width:118px;grid-row:1/6}.pr .who b{margin-top:0;font-size:23px}.pr .who .note{margin-top:2px}.pr .who .seg{justify-self:start;margin-top:4px}
.pr .q{font-size:19px}.pr .li{font-size:16.5px}.pr .chip,.pr .st,.pr .r,.pr .ops{font-size:15.5px}.pr .pp{font-size:15px;gap:5px}.pr .pp .lit,.pr .pp .unlit{padding-left:6px;padding-right:6px}
.pr .journey{grid-template-columns:1fr}.pr .st{display:flex;gap:10px;align-items:center;padding:6px 10px}.pr .st .n{margin:0;flex:none;width:150px;font-size:14.5px}
.pr .st+.st:before{display:none}.pr .rfm{grid-template-columns:1fr}.pr .r{display:flex;gap:12px;align-items:center;padding:5px 10px}.pr .r .k{flex:none;width:140px;font-size:20px}
.pr h1{font-size:25px}.pr .sub{font-size:16px}.pr .sec h3{font-size:15px}
*{box-sizing:border-box}body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#EFE7D8;color:#2B2B33}
.fig{width:760px;padding:22px;background:#EFE7D8;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:23px;line-height:1.35;color:#2F4C6E}.sub{font-size:15px;color:#665F53;margin-top:-8px;line-height:1.5}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px;color:#665F53;align-items:center}
.src{font-style:normal;display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--c);border:1.3px solid var(--c);border-radius:999px;padding:0 8px;line-height:20px;background:#FFFDF8;white-space:nowrap;flex:none}
.src:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.card{background:#FBF7EF;border:1.5px solid #E2D7C2;border-radius:14px;padding:16px;display:grid;grid-template-columns:172px 1fr;gap:18px}
.card.main{border:2px solid #E8A54F;box-shadow:0 4px 14px rgba(232,165,79,.15)}
.who .ph{width:172px;height:auto;display:block;border-radius:12px;border:1px solid #D9CDB6}
.who b{display:block;font-size:21px;color:#2F4C6E;margin-top:10px}.who .p{font-size:14.5px;color:#665F53;margin-top:2px}
.seg{display:inline-block;margin-top:8px;font-size:13.5px;font-weight:700;color:#fff;background:#2F4C6E;border-radius:6px;padding:2px 9px}.main .seg{background:#C9822E}
.who .note{font-size:12.5px;color:#8B8273;margin-top:8px;line-height:1.45}
.body{display:flex;flex-direction:column;gap:11px;min-width:0}
.q{font-size:18.5px;font-weight:700;color:#2B2B33;line-height:1.4}
.sec{display:flex;flex-direction:column;gap:6px}.sec h3{margin:0;font-size:14px;letter-spacing:.06em;color:#8B6A3E;display:flex;align-items:center;gap:8px}
.sec h3:after{content:"";flex:1;height:1px;background:#E2D7C2}
.li{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:15.5px;line-height:1.45}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{font-size:14.5px;background:#fff;border:1px solid #DDD1BB;border-radius:7px;padding:3px 9px;line-height:1.4}.chip b{color:#2F4C6E}
.chip.role{background:#2F4C6E;color:#fff;border-color:#2F4C6E}.chip.role b{color:#F2D78A}
.journey{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;position:relative}
.st{background:#fff;border:1px solid #DDD1BB;border-radius:9px;padding:8px 10px 9px;font-size:14.5px;line-height:1.42;position:relative}
.st .n{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:#8B8273;margin-bottom:3px}
.emo{font-size:13px;font-weight:700;border-radius:999px;padding:0 8px;line-height:20px}
.e1{background:#E7F0E1;color:#4E7A3E}.e2{background:#F6EBD3;color:#9A6B1F}.e3{background:#F3DEDA;color:#A3473C}
.st+.st:before{content:"";position:absolute;left:-9px;top:50%;border:5px solid transparent;border-left-color:#B9AC92;transform:translate(0,-50%)}
.rfm{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.r{background:#fff;border:1px solid #DDD1BB;border-radius:9px;padding:7px 10px;font-size:14.5px;line-height:1.4}
.r .k{font-size:22px;font-weight:800;color:#2F4C6E;line-height:1.1}.r .k small{font-size:13px;font-weight:700;color:#8B8273;margin-left:6px}
.r .v{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:3px}
.ops{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14.5px;line-height:1.45}
.ops div{background:#F3ECDD;border-radius:8px;padding:6px 10px}.ops b{color:#2F4C6E;display:block;font-size:13px}
.pp{display:flex;gap:5px;flex-wrap:wrap;align-items:center;font-size:14px}.pp .chip{padding:3px 7px}
.lit{background:#E9C88A;border-radius:6px;padding:2px 8px}.unlit{border:1.5px dashed #9C8F78;border-radius:6px;padding:1px 8px;color:#665F53}
'''
def li(text,k): return f'<div class="li"><span>{text}</span>{t(k)}</div>'
html=f'''<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="fig" id="fig">
<h1>兩群客人，需要兩種經營方式</h1>
<div class="sub">依團隊假設建立的虛構人物；每一條都標出來源，未驗證的部分將以原型數據與訪談補正。</div>
<div class="legend">來源：{t('obs')}{t('proto')}{t('iv')}{t('hyp')}{t('ys')}</div>

<div class="card main">
 <div class="who">{W}<b>林雅婷</b><div class="p">28 歲・台北・行銷企劃</div><span class="seg">主要客群・新客</span><div class="note">示意照片，非本人</div></div>
 <div class="body">
  <div class="q">「告訴我幾個適合我的就好。」</div>
  <div class="sec"><h3>背景</h3>
   {li('想去歐洲，但沒有特定國家','hyp')}
   {li('跟過日本團，覺得每天趕景點很累','iv')}
   {li('收到官網連結，看到一長串行程就關掉','obs')}
  </div>
  <div class="sec"><h3>旅行輪廓 {t('proto')}</h3>
   <div class="chips"><span class="chip role"><b>柴郡貓型</b>・慢遊生活家</span><span class="chip">節奏 <b>留白 0.7／精準 0.3</b></span><span class="chip">興趣 <b>藝術</b></span><span class="chip">出發 <b>暑假</b></span><span class="chip">同行 <b>朋友</b></span><span class="chip">預算 <b>10–13 萬</b></span><span class="chip">避開 <b>每天換飯店</b></span></div>
  </div>
  <div class="sec"><h3>情境 {t('hyp')}</h3>
   <div class="journey">
    <div class="st"><div class="n">① 滑 IG<span class="emo e1">心動</span></div>看到朋友的歐洲照片，「我也想去」</div>
    <div class="st"><div class="n">② 問 LINE<span class="emo e2">卡住</span></div>被問「想去哪個國家？」，答不出來</div>
    <div class="st"><div class="n">③ 收到連結<span class="emo e3">放棄</span></div>一長串行程看不完，關掉</div>
   </div>
  </div>
  <div class="ops"><div><b>分群依據</b>測驗結果與互動行為</div><div><b>經營方式</b>測驗推薦、顧問接手</div></div>
 </div>
</div>

<div class="card">
 <div class="who">{M}<b>陳建宏</b><div class="p">56 歲・台中・自營業</div><span class="seg">次要客群・S2 半睡老客</span><div class="note">示意照片，非本人</div></div>
 <div class="body">
  <div class="q">「有新的深度路線，我會考慮。」</div>
  <div class="sec"><h3>背景</h3>
   {li('滿意永信的服務，但最近沒有吸引他的訊息','hyp')}
   {li('偏好深度、少換點的路線','iv')}
  </div>
  <div class="sec"><h3>RFM 與 NES（訂單紀錄）{t('ys')}</h3>
   <div class="rfm">
    <div class="r"><div class="k">R<small>最近一次出團</small></div>2024 年 3 月，約 2.6 年未出團（週期約 1 年）</div>
    <div class="r"><div class="k">F<small>出團次數</small></div>2022–2024 年每年 1 次</div>
    <div class="r"><div class="k">M<small>累計金額</small></div>待永信以訂單 CSV 提供</div>
   </div>
  </div>
  <div class="sec"><h3>歐洲旅人護照 {t('hyp')}</h3>
   <div class="pp"><span class="chip role"><b>愛麗絲型</b>・銀等級</span><span style="flex-basis:100%;height:0"></span>已點亮 <span class="lit">德瑞</span><span class="lit">法國</span><span class="lit">義大利</span><span style="color:#B9AC92">｜</span>未點亮 <span class="unlit">北歐</span><span class="unlit">西葡</span></div>
  </div>
  <div class="sec"><h3>什麼會讓他再出發 {t('iv')}</h3>
   <div class="li"><span>顧問傳來他的點亮地圖，附一條「還沒去過」區域的深度路線</span></div>
  </div>
  <div class="ops"><div><b>分群依據</b>訂單紀錄（RFM）</div><div><b>經營方式</b>回溯點亮地圖、分眾喚醒</div></div>
 </div>
</div>
</div></body></html>'''
open('persona_fig.html','w').write(html)
ph=html.replace('<div class="fig" id="fig">','<div class="fig pr" id="fig">',1)
i=ph.index('<div class="card main">'); j=ph.rindex('</div></body>')
ph=ph[:i]+'<div class="cards">'+ph[i:j]+'</div>'+ph[j:]
open('persona_print.html','w').write(ph)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':760,'height':900},device_scale_factor=3)
        await pg.goto('file://'+__import__('os').path.abspath('persona_fig.html')); await pg.wait_for_timeout(300)
        await (await pg.query_selector('#fig')).screenshot(path='persona_fig.png')
        await pg.set_viewport_size({'width':1000,'height':900}); await pg.goto('file://'+__import__('os').path.abspath('persona_print.html')); await pg.wait_for_timeout(300)
        await (await pg.query_selector('#fig')).screenshot(path='persona_print.png'); await b.close()
asyncio.run(main())
from PIL import Image; im=Image.open('persona_fig.png'); print(im.size); im.resize((im.width//2,im.height//2)).save('persona_prev.png'); im2=Image.open('persona_print.png'); print(im2.size); im2.resize((im2.width//3,im2.height//3)).save('print_prev.png')
