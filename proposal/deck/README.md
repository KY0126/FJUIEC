# 提案簡報產生器（13 頁，可匯入 Canva）

| 檔案 | 說明 |
|---|---|
| `build_deck.js` | pptxgenjs 產生器；座標用 px（1920×1080），`I(px)` 轉英吋、`P(px)` 轉字級 |
| `img/` | 簡報用圖：封面地圖、App 手機截圖（`app_*.png`）、林雅婷頭貼（示意照片，非本人）、QR（只有 p.3 的 `qr_app.png`） |
| `林雅婷人物誌_完整版.md` | 主要客群人物誌 A–H，簡報 p.4 備忘稿只留一句話輪廓 |
| `永信旅遊_提案簡報.pptx` | 最新成品 |
| `永信旅遊_備忘稿全文.txt` | 每頁備忘稿 |

重新產生：
```bash
npm i pptxgenjs            # 需要 /mnt/skills/public/pptx/scripts/apply_theme.js（Claude 環境內建）
node build_deck.js         # 產生 deck.pptx
soffice --headless --convert-to pdf deck.pptx && pdftoppm -r 60 -png deck.pdf s   # 預覽
```
開場影片配上品牌 Jingle（AI 合成男聲、手風琴、照筆順的寫字聲、「永信・旅遊」全體收音，詳見 `jingle/README.md`）。開場／結尾影片：`img/open_p1.mp4`（約 4.6 秒，手寫標語→底線→永信 Logo→淡入封面）、`img/open_p13.mp4`（約 5 秒，p.13 淡出後寫出標語與 Logo）。兩段影片各自是**獨立一頁**：第 1 張是開場影片、第 15 張是結尾影片，內容頁仍是 1–13 頁；時間不夠時直接跳過影片頁。預覽圖 `img/cover_open.png`、`img/cover_p13.png`；改了封面或 p.13 要重新產生截圖與影片（`NO_VIDEO=1 node build_deck.js` 輸出沒有影片頁的版本來截圖）。主色 #F59312。

規則：只有 p.3 放 QR 與可點擊網址（ky0126.github.io/FJUIEC/find-my-europe）；所有內容用「林雅婷」，不出現「林小美」。
