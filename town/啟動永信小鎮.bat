@echo off
cd /d "%~dp0"
title 永信小鎮 AI Town（免費本機版）

where node >nul 2>nul
if errorlevel 1 goto nonode
where ollama >nul 2>nul
if errorlevel 1 goto noollama

echo [1/4] 準備免費語言模型（第一次會下載約 5 GB，請耐心等候）
call ollama pull qwen2.5
if errorlevel 1 goto fail
call ollama pull mxbai-embed-large
if errorlevel 1 goto fail

if exist node_modules goto setupcheck
echo [2/4] 第一次使用：安裝套件中，需要幾分鐘
call npm install
if errorlevel 1 goto fail
call npm install-scripts approve esbuild >nul 2>nul
call npm rebuild esbuild >nul 2>nul

:setupcheck
if exist .env.local goto run
echo.
echo [3/4] 第一次設定 Convex
echo 出現 Welcome to Convex 時，選 Start without an account 後按 Enter
echo 這會在你自己的電腦上建立小鎮的資料庫，不需要帳號，也不會收費
echo.
call npx convex logout >nul 2>nul
call npx convex dev --once
if errorlevel 1 goto fail

:run
echo.
echo [4/4] 啟動永信小鎮，瀏覽器會自動打開 http://localhost:5173
echo 角色第一次思考比較慢，請等幾分鐘；要關閉小鎮就在這個視窗按 Ctrl+C
start "" http://localhost:5173
call npm run dev
goto end

:nonode
echo 找不到 Node.js，請先到 https://nodejs.org 安裝 LTS 版，裝好後再雙擊這個檔案
start "" https://nodejs.org
pause
goto end

:noollama
echo 找不到 Ollama，請先到 https://ollama.com 下載安裝，裝好後再雙擊這個檔案
start "" https://ollama.com/download
pause
goto end

:fail
echo.
echo 發生錯誤，請把這個視窗的畫面截圖傳給 Claude
pause

:end
