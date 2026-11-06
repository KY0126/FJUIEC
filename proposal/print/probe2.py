import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
ROOT = _os.path.dirname(ROOT)
import asyncio
from playwright.async_api import async_playwright
P=ROOT + '/print/'
JS=r"""()=>{const out=[];for(const s of document.querySelectorAll('.src')){s.style.display='flex';s.style.flexDirection='column';s.style.gap='2.2mm';s.style.width='176mm';
 const r=s.getBoundingClientRect();const kids=[...s.children].map(e=>Math.round(e.getBoundingClientRect().height*25.4/96)+':'+e.tagName+':'+e.textContent.trim().slice(0,10));
 out.push([s.dataset.label,Math.round(r.height*25.4/96),kids.join(' | ')]);}return out}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':794,'height':1123})
        await pg.goto('file://'+P+'print.html');await pg.wait_for_timeout(1500)
        r=await pg.evaluate(JS);t=0
        for x in r: print(x[0],x[1]);print('   ',x[2]);t+=x[1]
        print('total',t)
        await b.close()
asyncio.run(main())
