@echo off
chcp 950 >nul
cd /d "%~dp0"
echo == 永信小鎮：讓模型常駐記憶體（只需要做一次）==
setx OLLAMA_KEEP_ALIVE -1 >nul
echo.
echo 已設定完成：Ollama 不會再閒置 5 分鐘就把模型移出記憶體。
echo 要讓設定生效，請做一次：
echo   1. 在右下角工作列的 Ollama 圖示按右鍵，選 Quit
echo   2. 從開始選單重新打開 Ollama
echo （會多占用約 5GB 記憶體；想取消就執行：setx OLLAMA_KEEP_ALIVE 5m）
pause
