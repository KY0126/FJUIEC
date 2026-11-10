"""從上一層的 index.html 抽出共用資料與計分邏輯，產生 core.js 與 base.css。
原型（index.html）更新題目、行程或地圖後，重新執行：python3 app/build_core.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root.parent / 'index.html').read_text(encoding='utf-8')
lines = src.split('\n')
def find(prefix, start=0):
    for i in range(start, len(lines)):
        if lines[i].startswith(prefix): return i
    raise SystemExit('找不到：' + prefix)
css = '\n'.join(lines[find('<style>') + 1: find('</style>')])
geo = lines[find('const GEO=')]
line_helpers = lines[find('const LINE_OA'): find('const openLine') + 1]
data = lines[find('/* ===== 資料 ===== */'): find('/* ===== 狀態與記錄 ===== */')]
state = ["const state = {ans:{}, pace:null, view:null, filters:new Set(), mapSel:null};", "function log(){}"]
scoring = lines[find('/* ===== 計分與推薦'): find('/* ===== 畫面 ===== */')]
s, e = find('const price='), find('const DEMO_TRIPS')
mapui = lines[s:e]
out = ['/* 由 build_core.py 自動產生，請勿手動修改 */', geo, *line_helpers, *data, *state, *scoring, *mapui]
(root / 'core.js').write_text('\n'.join(out) + '\n', encoding='utf-8')
(root / 'base.css').write_text('/* 由 build_core.py 自動產生：沿用原型的配色與元件樣式 */\n' + css, encoding='utf-8')
print('core.js', len('\n'.join(out)), 'bytes；base.css', len(css), 'bytes')

# 版本戳：app/index.html 引用的 js/css 加上 ?v=內容雜湊，改版後手機不會讀到舊檔
import hashlib, os, re as _re
_d = os.path.dirname(os.path.abspath(__file__))
_h = hashlib.md5(b''.join(open(os.path.join(_d, f), 'rb').read() for f in ['core.js', 'base.css', 'app.css', 'app.js', 'splash.js'])).hexdigest()[:8]
_p = os.path.join(_d, 'index.html'); _s = open(_p, encoding='utf8').read()
_s = _re.sub(r'(href|src)="(base\.css|app\.css|core\.js|app\.js|splash\.js)(\?v=\w+)?"', lambda m: f'{m.group(1)}="{m.group(2)}?v={_h}"', _s)
open(_p, 'w', encoding='utf8').write(_s); print('版本戳', _h)
