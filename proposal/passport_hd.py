import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import sys,asyncio
sys.path.insert(0,'.')
from cameo import avatar, TIER
import json
GEO=json.load(open('geo/europe.json'))
C={g['c']:(g['x'],g['y']) for g in GEO}
from playwright.async_api import async_playwright
D=ROOT + '/'
emblem='''<svg viewBox="0 0 100 100" width="{w}" height="{w}"><circle cx="50" cy="50" r="40" fill="none" stroke="{c}" stroke-width="3"/><circle cx="50" cy="50" r="33" fill="none" stroke="{c}" stroke-width="1.2"/>
<path d="M50 20 L56 50 L50 80 L44 50Z" fill="{c}"/><path d="M20 50 L50 45 L80 50 L50 55Z" fill="{c}" opacity=".55"/>
<circle cx="50" cy="50" r="5" fill="none" stroke="{c}" stroke-width="2.5"/></svg>'''
covers=''
for t in ['start','silver','gold','crystal']:
    T=TIER[t]
    foil = T['light'] if t!='gold' else '#F2D78A'
    covers+=f'''<div class="cv" style="background:{T['deep']};color:{foil}"><span class="cv1">EUROPE TRAVELER</span>{emblem.format(w=64,c=foil)}<b>歐洲旅人護照</b><span class="cv2">PASSPORT</span><span class="tg" style="background:{T['ring']};color:{'#FFFFFF' if t=='crystal' else T['deep']}">{T['name']}</span></div>'''
trips=[('奧捷','2022.05',['AT','CZ'],'#2F4C6E'),('奧捷匈','2023.10',['AT','CZ','HU'],'#9C5B3C'),('德瑞','2024.07',['DE','CH'],'#4F6B3A'),('德捷','2025.04',['DE','CZ'],'#B5534A'),('義大利','2025.10',['IT'],'#6B5B45')]
cnt={}
for nm,d,ccs,col in trips:
    for c in ccs: cnt[c]=cnt.get(c,0)+1
NAMES={'DE':'德國','CZ':'捷克','AT':'奧地利'}
POS={'DE':(372,404),'CZ':(478,428),'AT':(430,498)}
COL={'DE':'#4F6B3A','CZ':'#B5534A','AT':'#2F4C6E'}
marks=''
for c,(x,y) in POS.items():
    n=cnt[c]; col=COL[c]
    for k in range(n-1,-1,-1):
        dx,dy=k*7,-k*6; op='.35' if k else '.92'
        marks+=f'<g transform="translate({x+dx} {y+dy}) rotate({(-8,6,-3)[k%3]})" opacity="{op}"><circle r="27" fill="#F7F1E5" fill-opacity=".55" stroke="{col}" stroke-width="3.5"/><circle r="22" fill="none" stroke="{col}" stroke-width="1.3"/></g>'
    marks+=f'<g transform="translate({x} {y}) rotate(-8)"><text y="-2" text-anchor="middle" font-size="12.5" font-weight="700" fill="{col}">{NAMES[c]}</text><text y="14" text-anchor="middle" font-size="12" font-weight="700" fill="{col}">×{n}</text></g>'
land=''.join(f'<path d="{g["d"]}" fill="{"#E9DEC8" if g["c"] not in cnt else ("#F1D9AE","#E3A55A","#C98A50")[min(cnt[g["c"]],3)-1]}" stroke="#C4B8A2" stroke-width="1"/>' for g in GEO)
ex,ey=C['ES']
nextm=f'<g transform="translate({ex+14} {ey-30})"><circle r="30" fill="none" stroke="#2F4C6E" stroke-width="3" stroke-dasharray="6 5"/><text y="5" text-anchor="middle" font-size="14" fill="#2F4C6E" font-weight="700">下一站？</text></g>'
mapsvg=f'<svg viewBox="140 340 440 330" width="100%" style="display:block;border-radius:8px;background:#DCE6EE">{land}{marks}{nextm}</svg>'
html=f'''<!doctype html><html><head><meta charset=utf8><style>
body{{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#F3ECDF;color:#2B2B33}}
#fig{{background:#F3ECDF;width:760px;padding:22px 20px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px}}
h1{{margin:0;font-size:23px;line-height:1.4;color:#2F4C6E}}.sub{{font-size:15.5px;line-height:1.5;color:#5F6B77;margin-top:-6px}}
.row{{display:grid;grid-template-columns:1fr;gap:26px;align-items:start}}
.lab{{font-size:18px;font-weight:700;color:#1E3A5C;margin-bottom:10px}}
.covers{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}
.cv{{aspect-ratio:88/125;border-radius:6px 12px 12px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative;box-shadow:inset 6px 0 0 rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}}
.cv1,.cv2{{font-size:9px;letter-spacing:.18em}}.cv b{{font-size:15px;letter-spacing:.1em}}
.tg{{position:absolute;bottom:-12px;font-size:12.5px;font-weight:700;padding:2px 12px;border-radius:20px}}
.note{{font-size:15px;color:#5F6B77;margin-top:22px;line-height:1.6}}
.spread{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:#F7F1E5;border:1px solid #E2D6BE;border-radius:12px;box-shadow:0 8px 20px rgba(30,58,92,.12);position:relative;min-height:380px}}
.spread::after{{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;background:linear-gradient(#0000,#cdbf a3,#0000);background:#E2D6BE}}
.pg{{padding:20px 18px;display:flex;flex-direction:column;gap:12px}}
.pg h3{{margin:0;font-size:13px;letter-spacing:.16em;color:#6B5B45}}
.id{{display:grid;grid-template-columns:110px 1fr;gap:16px;align-items:center}}
.kv{{display:grid;grid-template-columns:64px 1fr;gap:6px 10px;font-size:15px}}.kv span{{color:#6B5B45;font-size:14px}}
.mrz{{font-family:"Noto Sans Mono CJK TC",monospace;font-size:12.5px;color:#6B5B45;letter-spacing:.08em;border-top:1px dashed #CDBFA3;padding-top:10px;margin-top:auto}}
.mapline{{font-size:14.5px;color:#1E3A5C;background:#FBEEDC;border-radius:8px;padding:8px 10px}}
.stamps{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 12px;align-items:center;justify-items:center}}
.st{{width:100px;height:84px;border:3px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;opacity:.88;font-family:"Noto Sans CJK TC",sans-serif}}
.st b{{font-size:14.5px;white-space:nowrap}}.st small{{font-size:10.5px;letter-spacing:.12em}}
.st.circle{{border-radius:50%;width:92px;height:92px;outline:1.5px solid currentColor;outline-offset:3px}}
.st.rect{{border-radius:6px;outline:1.5px dashed currentColor;outline-offset:3px}}
.st.oval{{border-radius:50%/40%;width:108px}}
.st.empty{{border:2px dashed #CDBFA3;color:#A89A80;border-radius:10px;opacity:1}}
.leg{{display:flex;gap:12px;flex-wrap:wrap;font-size:14px;color:#6B5B45}}.leg i{{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:-1px}}.badge{{position:absolute;right:22px;bottom:18px;width:88px;transform:rotate(8deg)}}
</style></head><body><div id="fig">
<h1>實體護照示意：行前說明會發放，出團時由領隊蓋章</h1>
<div class="sub">與數位旅人護照同步；年長客人不用手機也能參與。提案示意，未使用永信標誌。</div>
<div class="row">
 <div><div class="lab">封面依護照等級更換顏色</div><div class="covers">{covers}</div>
 <div class="note">啟程：入會即發｜銀、金、晶鑽：依累計出團次數升級，升級時換發新封面（門檻待與永信討論）。<br>封面燙印與數位頭像外框同色系，實體與線上看起來是同一本護照。</div></div>
 <div><div class="lab">內頁：持照人頁與區域郵戳</div>
 <div class="spread">
  <div class="pg"><h3>HOLDER｜持照人</h3>
   <div class="id">{avatar('rabbit','gold',uid='pp',size=110)}<div class="kv"><span>旅人角色</span><b>經典收藏家</b><span>代表角色</span><b>白兔</b><span>護照等級</span><b>金</b><span>出團</span><b>5 次・7 國</b><span>已點亮</span><b>5 / 23 區</b></div></div>
   <div class="mapline">下一站推薦：還沒點亮的「西班牙」，顧問會依白兔型的節奏挑行程</div>
   <div class="mrz">P&lt;EUR&lt;TRAVELER&lt;&lt;CLASSIC&lt;COLLECTOR&lt;&lt;&lt;&lt;<br>YS0003&lt;&lt;23&lt;&lt;GOLD&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
  </div>
  <div class="pg" style="position:relative"><h3>STAMPS｜區域郵戳（歐洲地圖底）</h3>{mapsvg}<div class="leg"><span><i style="background:#F1D9AE"></i>1 次</span><span><i style="background:#E3A55A"></i>2 次</span><span><i style="background:#C98A50"></i>3 次以上</span><span>同一國重複出團＝郵戳疊蓋；虛線＝下一站</span></div></div>
 </div></div>
</div></div></body></html>'''
open(D+'hd/passport.html','w',encoding='utf8').write(html)
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':760,'height':800},device_scale_factor=3)
    await pg.goto('file://'+D+'hd/passport.html');await pg.wait_for_timeout(400)
    await (await pg.query_selector('#fig')).screenshot(path=D+'hd/passport.png');await b.close()
asyncio.run(m())
