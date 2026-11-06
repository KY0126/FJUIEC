@echo off
chcp 950 >nul
cd /d "%~dp0"
echo == 永信小鎮：改用比較快的小模型 qwen2.5:3b ==
echo 請先確認「啟動永信小鎮」的黑色視窗還開著。
ollama pull qwen2.5:3b
if errorlevel 1 (
  echo 下載失敗，請確認 Ollama 有在執行。
  pause
  exit /b
)
call npx convex env set OLLAMA_MODEL qwen2.5:3b
echo.
echo 已切換成小模型，不用重設小鎮，下一句對話就會用新模型。
echo 想換回原本的模型，請雙擊「切換標準模型.bat」。
pause
