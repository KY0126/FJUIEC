import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
import sys, json, asyncio
sys.path.insert(0, ROOT + '')
from cameo import avatar, rabbit, alice, cat
_PAV = json.load(open(ROOT + '/pav.json'))
def pav(ch, t, uid, size):
    return _PAV[ch + '.' + t].replace('UID', uid).replace('<svg ', f'<svg width="{size}" height="{size}" ', 1)
FIVE = ['rabbit', 'queen', 'alice', 'hatter', 'cat']
def five(t, pre, size, gap):
    return f'<div style="display:flex;gap:{gap}px;align-items:center">' + ''.join(pav(c, t, pre + c, size) for c in FIVE) + '</div>'
from playwright.async_api import async_playwright
D = ROOT + '/'
OUT = ROOT + '/deliverables/line/v2/'
import os; os.makedirs(OUT, exist_ok=True)
GEO = json.load(open(D + 'geo/europe.json'))
FONT = '"Noto Sans CJK TC",sans-serif'
P, PAPER, INK, NAVY, ORANGE, SEPIA, LINE = '#F3EBDD', '#FBF7EF', '#2B2B33', '#2F4C6E', '#E8A54F', '#6B5B45', '#E2D7C2'
def europe(op=.35):
    return f'<svg viewBox="40 40 720 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;opacity:{op}">' + ''.join(f'<path d="{g["d"]}" fill="#E8E1D3" stroke="#C4B8A2" stroke-width="1.2"/>' for g in GEO) + '</svg>'
def sil(fn, w, uid):
    return f'<svg viewBox="0 0 200 220" width="{w}" aria-hidden="true">{fn("#4E4438", P)}</svg>'
def page(w, h, body, extra=''):
    return f'''<!doctype html><meta charset=utf8><style>*{{box-sizing:border-box}}body{{margin:0;font-family:{FONT};color:{INK}}}
#c{{width:{w}px;height:{h}px;position:relative;overflow:hidden;background:{P}}}{extra}</style><div id="c">{body}</div>'''

ASSETS = {}
# 1. 大頭貼 640x640（LINE 會裁成圓形，主體留在中央）
ASSETS['profile_640x640.png'] = (640, 640, page(640, 640, f'''
<div style="position:absolute;inset:0;display:grid;place-items:center">{avatar('rabbit','gold',uid='pf',size=560)}</div>'''))
# 2. 封面 1080x878
ASSETS['cover_1080x878.png'] = (1080, 878, page(1080, 878, f'''{europe(.55)}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:radial-gradient(circle at 50% 45%,rgba(243,235,221,.92) 0,rgba(243,235,221,.75) 45%,rgba(243,235,221,.2) 75%)">
 <div style="font-size:30px;letter-spacing:.3em;color:{SEPIA}">EUROPE TRAVELER PASSPORT</div>
 <div style="font-size:88px;font-weight:700;color:{NAVY};letter-spacing:.06em">歐洲旅人護照</div>
 {five('start','c',165,22)}
 <div style="font-size:40px;color:{INK}">你是哪一種歐洲旅人？</div>
</div>'''))
# 3. 大型圖文選單 2500x1686（後台版型：上 1 大、下 3 小）
cell = lambda x, w, inner, bg=PAPER: f'<div style="position:absolute;left:{x}px;top:843px;width:{w}px;height:843px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;border-left:{6 if x else 0}px solid {LINE}">{inner}</div>'
icon_roles = f'<div style="height:300px;display:flex;align-items:center">{five("start","m",140,8)}</div>'
icon_pass = f'<svg viewBox="0 0 100 100" width="300" height="300"><rect x="22" y="8" width="56" height="84" rx="6" fill="{NAVY}"/><circle cx="50" cy="44" r="15" fill="none" stroke="#F2D78A" stroke-width="3"/><path d="M50 30 L54 44 L50 58 L46 44Z" fill="#F2D78A"/><path d="M36 74 H64" stroke="#F2D78A" stroke-width="3"/></svg>'
icon_msg = f'<svg viewBox="0 0 100 100" width="300" height="300"><path d="M14 20 H86 V68 H48 L30 84 V68 H14Z" fill="none" stroke="{SEPIA}" stroke-width="6" stroke-linejoin="round"/><path d="M30 38 H70 M30 52 H58" stroke="{SEPIA}" stroke-width="6" stroke-linecap="round"/></svg>'
ASSETS['richmenu_large_2500x1686.png'] = (2500, 1686, page(2500, 1686, f'''
<div style="position:absolute;left:0;top:0;width:2500px;height:843px;background:{ORANGE};overflow:hidden">
  <div style="position:absolute;inset:0;opacity:.18">{europe(1)}</div>
  <div style="position:absolute;left:150px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:34px">
    <div style="display:inline-block;align-self:flex-start;background:{NAVY};color:#fff;font-size:64px;font-weight:700;padding:14px 44px;border-radius:60px">1 分鐘・12 題・匿名</div>
    <div style="font-size:140px;font-weight:700;color:{NAVY};line-height:1.05">開始旅行風格測驗</div>
    <div style="font-size:76px;color:{NAVY}">你是哪一種歐洲旅人？ →</div>
  </div>
  <div style="position:absolute;right:120px;top:0;bottom:0;display:flex;align-items:center;gap:24px">{five('gold','h',190,14)}</div>
</div>
{cell(0,833,icon_roles+f'<div style="font-size:104px;font-weight:700;color:{NAVY}">五種旅人</div><div style="font-size:58px;color:{SEPIA}">我是哪一型？</div>')}
{cell(833,834,icon_pass+f'<div style="font-size:104px;font-weight:700;color:{NAVY}">旅人護照</div><div style="font-size:58px;color:{SEPIA}">足跡地圖示意</div>')}
{cell(1667,833,icon_msg+f'<div style="font-size:104px;font-weight:700;color:{NAVY}">給我們建議</div><div style="font-size:58px;color:{SEPIA}">匿名回饋</div>')}
'''))
# 4. 小型圖文選單 2500x843（後台版型：3 等分）— 備用
c3 = lambda x, w, inner, bg: f'<div style="position:absolute;left:{x}px;top:0;width:{w}px;height:843px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;border-left:{6 if x else 0}px solid {LINE}">{inner}</div>'
ASSETS['richmenu_compact_2500x843.png'] = (2500, 843, page(2500, 843, f'''
{c3(0,833,f'{five("start","s",112,6)}<div style="font-size:110px;font-weight:700;color:{NAVY}">開始測驗</div><div style="font-size:54px;color:{NAVY}">1 分鐘・12 題 →</div>',ORANGE)}
{c3(833,834,icon_pass.replace('width="300" height="300"','width="220" height="220"')+f'<div style="font-size:100px;font-weight:700;color:{NAVY}">旅人護照</div><div style="font-size:54px;color:{SEPIA}">足跡地圖示意</div>',PAPER)}
{c3(1667,833,icon_msg.replace('width="300" height="300"','width="220" height="220"')+f'<div style="font-size:100px;font-weight:700;color:{NAVY}">給我們建議</div><div style="font-size:54px;color:{SEPIA}">匿名回饋</div>',PAPER)}
'''))
# 5. 三種旅人介紹圖 1040x1040（歡迎訊息與關鍵字「三種旅人」的圖片訊息）
role = lambda ch, name, alias, line: f'''<div style="display:grid;grid-template-columns:132px 1fr;gap:24px;align-items:center;background:{PAPER};border:2px solid {LINE};border-radius:24px;padding:10px 26px">
 {pav(ch,'start','r'+ch,132)}<div><div style="font-size:26px;color:{SEPIA}">{alias}</div><div style="font-size:42px;font-weight:700;color:{NAVY};line-height:1.2">{name}</div><div style="font-size:26px;line-height:1.4;margin-top:2px">{line}</div></div></div>'''
ASSETS['roles_1040x1040.png'] = (1040, 1040, page(1040, 1040, f'''
<div style="position:absolute;inset:0;padding:36px 46px;display:flex;flex-direction:column;gap:14px">
 <div style="font-size:48px;font-weight:700;color:{NAVY}">你是哪一種歐洲旅人？</div>
 {role('rabbit','經典收藏家','白兔型｜精準・經典名景','有限假期把經典看好看滿')}
 {role('queen','嚴選鑑賞家','紅心皇后型｜精準・深度體驗','好餐廳、好住宿，寧可早訂不將就')}
 {role('alice','從容探索家','愛麗絲型｜均衡節奏','半天導覽、半天自由')}
 {role('hatter','隨興巡禮者','瘋帽匠型｜留白・經典名景','名景想看，但不想照表操課')}
 {role('cat','慢遊生活家','柴郡貓型｜留白・深度體驗','像當地人一樣過日子')}
</div>'''))
# 6. 旅人護照說明圖 1040x1040（關鍵字「旅人護照」）
cnt = {'AT':2,'CZ':3,'HU':1,'SK':1,'DE':2,'CH':1,'IT':1}
fills = {1:'#F1D9AE',2:'#E3A55A',3:'#A8692C'}
mp = ''.join(f'<path d="{g["d"]}" fill="{fills[min(cnt[g["c"]],3)] if g["c"] in cnt else "#E8E1D3"}" stroke="#C4B8A2" stroke-width="1.2"/>' for g in GEO)
ASSETS['passport_1040x1040.png'] = (1040, 1040, page(1040, 1040, f'''
<div style="position:absolute;inset:0;padding:46px 54px;display:flex;flex-direction:column;gap:20px">
 <div style="font-size:52px;font-weight:700;color:{NAVY}">每趟旅程，都會點亮你的歐洲地圖</div>
 <div style="font-size:30px;color:{SEPIA}">顏色越深＝去越多次；升級時頭像從剪紙換成銀、金、藍白浮雕瓷</div>
 <div style="flex:1;border-radius:24px;overflow:hidden;background:#DCE6EE;border:2px solid {LINE}"><svg viewBox="180 330 480 360" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">{mp}</svg></div>
 <div style="display:flex;gap:26px;font-size:30px;align-items:center"><span><b style="display:inline-block;width:34px;height:34px;border-radius:8px;background:#F1D9AE;vertical-align:-6px"></b> 1 次</span><span><b style="display:inline-block;width:34px;height:34px;border-radius:8px;background:#E3A55A;vertical-align:-6px"></b> 2 次</span><span><b style="display:inline-block;width:34px;height:34px;border-radius:8px;background:#A8692C;vertical-align:-6px"></b> 3 次以上</span><span style="margin-left:auto;display:flex;gap:8px">{avatar('alice','start',uid='p1',size=90)}{avatar('alice','silver',uid='p2',size=90)}{avatar('alice','gold',uid='p3',size=90)}{avatar('alice','crystal',uid='p4',size=90)}</span></div>
 <div style="font-size:26px;color:{SEPIA}">課程原型示意，範例資料</div>
</div>'''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, (w, h, html) in ASSETS.items():
            open(D + 'la_tmp.html', 'w', encoding='utf8').write(html)
            pg = await b.new_page(viewport={'width': w, 'height': h})
            await pg.goto('file://' + D + 'la_tmp.html'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT + name, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
            await pg.close()
        await b.close()
asyncio.run(main())
from PIL import Image
for n in ['richmenu_large_2500x1686', 'richmenu_compact_2500x843']:
    im = Image.open(OUT + n + '.png').convert('RGB'); im.save(OUT + n + '.jpg', quality=88, optimize=True); os.remove(OUT + n + '.png')
for f in sorted(os.listdir(OUT)):
    im = Image.open(OUT + f); print(f, im.size, round(os.path.getsize(OUT + f) / 1024), 'KB')
