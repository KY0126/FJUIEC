import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import json,asyncio
from playwright.async_api import async_playwright
D=ROOT + '/'
B=json.load(open(D+'shots3/boxes.json'))
W=310
panels=[
 dict(key='q',img='s1_question.png',no='①',title='題目頁',lead='用情境題取代問卷，1 分鐘完成',
   crop=None,marks=[('progress','右',"進度條：共 12 題，讓客人知道很快就結束"),('title','右',"情境題：問「會怎麼做」，不問「你是哪種人」"),('opt','右',"點一下就跳下一題，每題答案匿名記錄")]),
 dict(key='role',img='s2_role.png',no='②',title='角色卡',lead='把答案翻譯成客人看得懂的旅行節奏',
   crop=None,marks=[('name','左',"角色與代表人物：節奏 5 題、取向 2 題計分，分出五種角色"),('bars','右',"節奏與取向分數都保留，客人可以換個角色"),('tiers','右',"護照等級預覽：升級只換外框，可選擇不顯示頭像"),('share','右',"分享角色卡到 LINE／IG，帶來新客")]),
 dict(key='recs',img='s3_recs.png',no='③',title='推薦卡',lead='依節奏、主題、預算與避雷項目排序',
   crop='btn',marks=[('chips','右',"換個角色：結果只是建議，客人可自己切換"),('price','左',"價格取自永信官網同區域標價"),('why','左',"推薦原因：讓客人知道為什麼是這一團"),('btn','右',"我想了解這團：開啟 LINE，帶入行程名稱交給顧問")]),
 dict(key='map1',img='s4_map_country.png',no='④',title='歐洲探索地圖',lead='真實國界，點國家即顯示永信的行程分類',
   crop='cats',marks=[('map','左',"底色依官網四大區；未經營的國家為灰色"),('pin','左',"點選的國家以橘色突出、標上國名"),('info','右',"同步顯示這國涵蓋的分類、天數與價格"),('cats','右',"23 個官網分類也能直接點，小國不必在地圖上找")]),
]
html=['<!doctype html><html><head><meta charset=utf8><style>',
':root{--o:#F39500;--n:#00223D;--m:#5F6B77}',
'body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#fff;color:#1F2A35}',
'#fig{display:flex;flex-direction:column;gap:18px;padding:22px 22px;width:760px;box-sizing:border-box}',
'h1{margin:0;font-size:24px;line-height:1.35;color:var(--n)} .sub{font-size:15.5px;line-height:1.5;color:var(--m);margin-top:-8px}',
'.flow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 20px;align-items:start}',
'.p{display:flex;flex-direction:column;gap:10px}',
'.hd{display:flex;align-items:baseline;gap:8px}.hd b{font-size:22px;color:var(--n)}.hd .no{font-size:24px;color:var(--o);font-weight:700}',
'.lead{font-size:16px;color:var(--m);min-height:22px}',
'.frame{position:relative;margin-left:30px;width:'+str(W)+'px}','.shot{position:relative;width:'+str(W)+'px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px #E1E4E8,0 6px 18px rgba(0,34,61,.10);background:#F5F5F5}',
'.shot img{width:100%;display:block}',
'.mk{position:absolute;width:26px;height:26px;border-radius:50%;background:var(--n);color:#fff;font-size:14px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 3px #fff}',
'.hl{position:absolute;border:2.5px solid var(--o);border-radius:8px}',
'ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}',
'li{display:grid;grid-template-columns:24px 1fr;gap:8px;font-size:16px;line-height:1.5}',
'li i{font-style:normal;width:22px;height:22px;border-radius:50%;background:var(--n);color:#fff;font-size:12.5px;font-weight:700;display:grid;place-items:center;margin-top:1px}',
'.arrow{position:absolute;right:-22px;top:120px;color:var(--o);font-size:26px;font-weight:700}',
'.foot{font-size:15.5px;line-height:1.5;color:var(--m);border-top:1px solid #E1E4E8;padding-top:10px}',
'</style></head><body><div id="fig"><h1>旅行風格測驗原型：客人看到什麼、系統記下什麼</h1>',
'<div class="sub">手機實際畫面（390px 寬）；編號對應下方說明，橘框為該說明指的位置。推薦行程為示意，價格依永信官網 2026/10/17 標價。</div><div class="flow">']
for i,p in enumerate(panels):
    bx=B[p['key']]; sc=W/bx['size'][0]
    crop=None
    if p['crop']:
        c=bx[p['crop']]; crop=(c[1]+ (c[3] if p['crop']=='btn' else 96)+14)*sc
    h=f' style="height:{crop:.0f}px"' if crop else ''
    html.append(f'<div class="p"><div class="hd"><span class="no">{p["no"]}</span><b>{p["title"]}</b></div><div class="lead">{p["lead"]}</div><div class="frame"><div class="shot"{h}><img src="shots3/{p["img"]}">'); mks=[]
    for n,(k,side,_) in enumerate(p['marks'],1):
        x,y,w,hh=bx[k]; x*=sc;y*=sc;w*=sc;hh*=sc
        if k=='cats': hh=min(hh,96*sc)
        html.append(f'<div class="hl" style="left:{x-3:.0f}px;top:{y-3:.0f}px;width:{w+6:.0f}px;height:{hh+6:.0f}px"></div>')
        my=y+hh/2-13
        if mks and my<mks[-1]+28: my=mks[-1]+28
        mks.append(my)
        html.append(f'<div class="hl" style="left:-12px;top:{y+hh/2-1:.0f}px;width:9px;height:0;border-width:1.5px 0 0 0;border-radius:0"></div>')
    html.append('</div>'+''.join(f'<div class="mk" style="left:-31px;top:{m:.0f}px">{n}</div>' for n,m in enumerate(mks,1))+'</div><ol>'+''.join(f'<li><i>{n}</i><span>{t}</span></li>' for n,(_,_,t) in enumerate(p['marks'],1))+'</ol></div>')
html.append('</div><div class="foot">收集開啟時，每一步都會匿名記錄：開始測驗 → 每題作答 → 完成 → 換角色 → 點推薦 → 點地圖 → 分享；網址加上 #stats 即可看到統計。</div></div></body></html>')
open(D+'annot_quiz12.html','w',encoding='utf8').write(''.join(html))
async def m():
  async with async_playwright() as pw:
    b=await pw.chromium.launch();pg=await b.new_page(viewport={'width':760,'height':900},device_scale_factor=3)
    await pg.goto('file://'+D+'annot_quiz12.html');await pg.wait_for_timeout(500)
    await (await pg.query_selector('#fig')).screenshot(path=D+'hd/quiz_annot12.png');await b.close()
asyncio.run(m())
