# 永信旅遊提案：原始檔

輔大創新創業社的永信旅遊提案：旅行風格測驗、LINE 官方帳號、CRM（RFM、NES）與歐洲旅人護照。這個資料夾放列印版、圖檔與 LINE 素材的原始檔，讓新的對話可以重新產生所有交付物。測驗原型是上一層的 `index.html`。

## 各交付物的正本

| 交付物 | 正本位置 | 說明 |
| --- | --- | --- |
| 提案文件 | Claude Docs：https://claude.ai/artifact/Qw8i6XVKXKWirwq2VTn36P | 內容以這份為準，列印版跟著它改 |
| 列印版 PDF | `proposal/print/build.py` 產生，成品放 `proposal/deliverables/` | A4 15 頁（正文 12＋附錄 3） |
| 測驗原型 | 同一個 repo 根目錄的 `index.html`（ky0126.github.io/FJUIEC） | 改了介面要重跑 `shoot12.py` 換截圖 |
| LINE 上架包 | `proposal/deliverables/line/`（`lineassets.py` 產生圖片） | 設定說明在 `deliverables/line/v2/LINE官方帳號設定_完整版.md` |
| 提案簡報 | `proposal/deck/build_deck.js` 產生 13 頁 pptx（可匯入 Canva），說明見 `proposal/deck/README.md` | 截圖、QR、人物誌也在同資料夾 |
| 組會資料包 | Claude Docs：https://claude.ai/artifact/YVfsn5mn2hqap1By1ofBz8 | 11/12 組會用 |

## 資料夾

| 路徑 | 內容 |
| --- | --- |
| `print/build.py` | 列印版產生器：組 HTML → Playwright 排版分頁 → `print/proposal.pdf`；`probe.py` 列出每頁區塊高度，`probe2.py` 量不分頁的總高度 |
| `print/wt/`、`print/w/` | 列印版用的圖（調色後的圖表、同理心地圖、人物誌、LINE 截圖裁切） |
| `persona/` | `persona_fig.py` 人物誌、`emp2.py` 林雅婷同理心地圖、`emp3.py` 陳建宏同理心地圖；照片為使用者提供的示意照片（非本人） |
| `shoot12.py`、`annot12.py` | 擷取 12 題原型畫面到 `shots3/`、產生標註圖 `hd/quiz_annot12.png` |
| `cameo.py`、`cameo12.py`、`pav.json` | 五種旅人頭像與四種材質（`hd/cameo12.png`） |
| `stages_hd.py` | LINE 三階段介面示意（`hd/stage1–3.png`、`hd/st*_*.png`） |
| `lineassets.py` | LINE 圖片：大頭貼、封面、圖文選單、角色介紹、護照 |
| `passport_hd.py`、`geo/` | 實體護照與歐洲地圖 |
| `grid.py` | 五家旅行社圖文選單對照 |
| `recolor/recolor.py` | 把文件圖表調成羊皮紙配色、裁邊、加圓角框 |
| `oa/` | LINE 官方帳號後台實際截圖 |
| `deliverables/` | 最新的 PDF、逐頁縮圖、LINE 上架包 |

## 重新產生

需要 Python 3、Playwright（Chromium）、Pillow、poppler-utils（`pdfinfo`、`pdftoppm`）。以下指令都在 `proposal/` 內執行。

```bash
python3 print/build.py              # 產生 print/proposal.pdf，印出每頁剩餘空間與頁數
cp print/proposal.pdf deliverables/永信旅遊_提案_A4列印版.pdf
cd persona && python3 emp2.py && python3 emp3.py && python3 persona_fig.py   # 這三支在 persona/ 內執行
python3 shoot12.py                  # 原型畫面；預設讀上一層的 index.html，可用 FJUIEC_INDEX 指定
python3 lineassets.py               # 輸出到 deliverables/line/v2/
```

改了圖以後，記得把新圖複製到 `print/wt/`，並同步上傳到 Claude Docs 文件（上傳 asset → 建 blob → 換圖）。

## 版面規則（列印版）

- 15 頁上限：正文 12 頁、附錄 3 頁。`build.py` 印出的 `free mm` 是每頁剩餘空間，超過 30 mm 就要調整。
- 全寬圖不縮小，左右邊線和文字對齊；只有並排（`.row`）裡的圖可以縮。
- 標題不能和內容分頁；字級不縮小（內文 9.6pt、表格 8.5pt）。
