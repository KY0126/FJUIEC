import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import asyncio, os
from playwright.async_api import async_playwright
D=ROOT + '/'
CSS='''body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#EFE7D8;color:#2B2B33}
#fig{width:760px;padding:22px 22px 26px;box-sizing:border-box;background:#EFE7D8;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:24px;line-height:1.35;color:#2F4C6E}.sub{font-size:16px;color:#5B5448;line-height:1.5;margin-top:-4px}
.g{display:grid;gap:20px 18px;align-items:start}
.c{display:flex;flex-direction:column;gap:8px}.c b{font-size:19px;color:#2F4C6E}
.c img{width:100%;display:block;border-radius:14px;box-shadow:0 0 0 1px #D9CDB5}
.c small{font-size:16px;color:#4F493F;line-height:1.5}
.tag{font-size:14px;color:#5B5448;border:1px solid #BFB29A;border-radius:6px;padding:1px 8px;margin-left:8px;font-weight:400;vertical-align:2px}
'''
def html(title,sub,items,cols):
    cells=''.join(f'<div class="c"><b>{t}</b><img src="{p}">{f"<small>{s}</small>" if s else ""}</div>' for p,t,s in items)
    return f'<!doctype html><meta charset=utf8><style>{CSS}</style><div id="fig"><h1>{title}</h1>{f"<div class=sub>{sub}</div>" if sub else ""}<div class="g" style="grid-template-columns:repeat({cols},minmax(0,1fr))">{cells}</div></div>'
async def render(name,doc):
    open(D+'hd/'+name+'.html','w',encoding='utf8').write(doc)
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':760,'height':900},device_scale_factor=3)
        await pg.goto('file://'+D+'hd/'+name+'.html');await pg.wait_for_timeout(500)
        await (await pg.query_selector('#fig')).screenshot(path=D+'hd/'+name+'.png');await b.close()
def run(name,*a): asyncio.run(render(name,html(*a)))
