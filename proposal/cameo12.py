import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import asyncio,re
from playwright.async_api import async_playwright
D=ROOT + '/'
tpl=open(D+'hd/cameo.html',encoding='utf8').read()
head=tpl[:tpl.index('<div class="rh">')]
tail_i=tpl.rindex('</div></div>')  # end of grid + fig
rest=tpl[tpl.index('</div>',tpl.rindex('<div class="cell">'))+6:]
ROWS=[('rabbit','白兔','經典收藏家','精準・經典'),('queen','紅心皇后','嚴選鑑賞家','精準・深度'),('alice','愛麗絲','從容探索家','均衡'),('hatter','瘋帽匠','隨興巡禮者','留白・經典'),('cat','柴郡貓','慢遊生活家','留白・深度')]
TI=['start','silver','gold','crystal']
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page()
    await pg.goto('file://'+D+'shots3/page.html'); await pg.wait_for_timeout(300)
    svgs=await pg.evaluate("(rows)=>rows.map(r=>['start','silver','gold','crystal'].map(t=>av(r,t)))",[r[0] for r in ROWS])
    body=''.join(f'<div class="rh"><b>{nm}</b><span>{role}<br>{pace}</span></div>'+''.join(f'<div class="cell">{s}</div>' for s in svgs[i]) for i,(k,nm,role,pace) in enumerate(ROWS))
    h=head.replace('三種旅人 × 四種材質','五種旅人與四種材質')
    doc=h+body+rest
    open(D+'hd/cameo12.html','w',encoding='utf8').write(doc)
    pg2=await b.new_page(viewport={'width':760,'height':900},device_scale_factor=3)
    await pg2.goto('file://'+D+'hd/cameo12.html'); await pg2.wait_for_timeout(400)
    await (await pg2.query_selector('#fig')).screenshot(path=D+'hd/cameo12.png'); await b.close()
asyncio.run(m())
from PIL import Image; im=Image.open(D+'hd/cameo12.png'); print(im.size); im.resize((im.width//3,im.height//3)).save(D+'cameo_prev.png')
