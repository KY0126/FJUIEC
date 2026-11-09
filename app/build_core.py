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
