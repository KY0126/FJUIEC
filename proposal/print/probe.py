import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
ROOT = _os.path.dirname(ROOT)
import asyncio
from playwright.async_api import async_playwright
P=ROOT + '/print/'
src=open(P+'build.py',encoding='utf-8').read()
PACK=src.split('PACK = r"""')[1].split('"""')[0]
PACK=PACK.replace("return [...document.querySelectorAll('.page')].map(","return [...document.querySelectorAll('.page')].map((p,i)=>[i+1,...[...p.querySelectorAll('.chunk > .blk')].map(b=>Math.round(b.getBoundingClientRect().height*25.4/96)+':'+b.textContent.trim().slice(0,14))]);const _x=(")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':794,'height':1123})
        await pg.goto('file://'+P+'print.html');await pg.wait_for_timeout(1500)
        r=await pg.evaluate(PACK)
        for x in r: print(x)
        await b.close()
asyncio.run(main())
