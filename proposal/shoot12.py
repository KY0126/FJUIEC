import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import asyncio,json
from playwright.async_api import async_playwright
D=ROOT + '/'
OUT=D+'shots3/'
s=open(_os.environ.get('FJUIEC_INDEX', _os.path.join(ROOT, '..', 'index.html')),encoding='utf8').read().replace('const COLLECT = false;','const COLLECT = true;',1)
open(OUT+'page.html','w',encoding='utf8').write(s)
PICKS=[1,2,2,2,0,1,0,0,0,2,2]  # 留白 + 深度 → 柴郡貓；朋友、藝術、暑假、10–13 萬
async def box(pg,sel,ref):
    b=await pg.eval_on_selector(sel,'e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}')
    return [b[0]-ref[0],b[1]-ref[1],b[2],b[3]]
async def main():
  boxes={}
  async with async_playwright() as p:
    b=await p.chromium.launch()
    pg=await b.new_page(viewport={'width':400,'height':800},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+OUT+'page.html')
    prev=0
    for t,name in [(1100,'i1'),(3700,'i2'),(7200,'i3')]:
        await pg.wait_for_timeout(t-prev); prev=t
        await (await pg.query_selector('.intro')).screenshot(path=OUT+f'{name}.png')
    await pg.click('#enter',force=True); await pg.wait_for_timeout(400)
    await (await pg.query_selector('.cover')).screenshot(path=OUT+'cover2.png')
    await pg.click('#start',force=True); await pg.wait_for_timeout(300)
    # annotated Q1: select option then go back
    await pg.click(f'.opt[data-k="{PICKS[0]}"]'); await pg.wait_for_timeout(250); await pg.click('.back'); await pg.wait_for_timeout(250)
    q=await pg.query_selector('.page'); r=await q.bounding_box(); ref=[r['x'],r['y']]
    boxes['q']={'progress':await box(pg,'.progress',ref),'title':await box(pg,'.qtitle',ref),'opt':await box(pg,f'.opt[data-k="{PICKS[0]}"]',ref),'back':None,'size':[r['width'],r['height']]}
    await q.screenshot(path=OUT+'s1_question.png')
    for i in range(12):
        await pg.wait_for_timeout(250)
        await (await pg.query_selector('.page')).screenshot(path=OUT+f'q{i+1}.png')
        if i<11: await pg.click(f'.opt[data-k="{PICKS[i]}"]')
    await pg.click('.opt[data-k="0"]'); await pg.click('#done',force=True); await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT+'r_top.png')
    await pg.add_style_tag(content='.dock{display:none!important}')
    v=await pg.query_selector('#visa'); r=await v.bounding_box(); ref=[r['x'],r['y']]
    boxes['role']={'name':await box(pg,'#visa .vhead',ref),'bars':await box(pg,'#visa .bars',ref),'share':await box(pg,'#share',ref),'stamp':await box(pg,'.stamp',ref),'tiers':await box(pg,'.tiers',ref),'size':[r['width'],r['height']]}
    await v.screenshot(path=OUT+'s2_role.png')
    pages=await pg.query_selector_all('.page'); r=await pages[0].bounding_box(); ref=[r['x'],r['y']]
    boxes['recs']={'chips':await box(pg,'.row[role=group]',ref),'why':await box(pg,'.card .why',ref),'price':await box(pg,'.card .price',ref),'btn':await box(pg,'.card button',ref),'size':[r['width'],r['height']]}
    await pages[0].screenshot(path=OUT+'s3_recs.png')
    await pg.click('#map path[aria-label="奧地利"]'); await pg.wait_for_timeout(250)
    r=await pages[1].bounding_box(); ref=[r['x'],r['y']]
    boxes['map1']={'map':await box(pg,'#map',ref),'info':await box(pg,'#info',ref),'cats':await box(pg,'#cats',ref),'size':[r['width'],r['height']]}
    pin=await pg.eval_on_selector('#map .pin rect','e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}')
    boxes['map1']['pin']=[pin[0]-ref[0],pin[1]-ref[1],pin[2],pin[3]]
    await pages[1].screenshot(path=OUT+'s4_map_country.png')
    await pg.click('#pp');await pg.wait_for_timeout(300)
    await pg.click('#fmap path[class*="c3"]',force=True);await pg.wait_for_timeout(250)
    await pg.screenshot(path=OUT+'r_pp.png',full_page=False)
    await pg.click('#back2');await pg.wait_for_timeout(250)
    await pg.evaluate("document.querySelectorAll('style').forEach(e=>{if(e.textContent.includes('.dock{display:none'))e.remove()})")
    await pg.click('#next',force=True);await pg.wait_for_timeout(250)
    await (await pg.query_selector('.page')).screenshot(path=OUT+'r_fit.png')
    await pg.click('.scale button[data-n="4"]');await pg.wait_for_timeout(250)
    await (await pg.query_selector('.page')).screenshot(path=OUT+'r_extra.png')
    await pg.click('#skip');await pg.wait_for_timeout(250)
    await (await pg.query_selector('.page')).screenshot(path=OUT+'r_contact.png')
    await pg.click('#no');await pg.wait_for_timeout(250)
    await (await pg.query_selector('.cover')).screenshot(path=OUT+'r_thanks.png')
    print('errors',errs, await pg.evaluate("document.querySelector('.cover h1')?.textContent"))
    await b.close()
  json.dump(boxes,open(OUT+'boxes.json','w'))
asyncio.run(main())
