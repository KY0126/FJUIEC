@echo off
cd /d "%~dp0"
echo 這會清空小鎮所有對話與記憶，並重新載入角色設定
set /p OK=確定要清空嗎？輸入 Y 後按 Enter：
if /i not "%OK%"=="Y" goto end
call npx convex run testing:wipeAllTables
echo 已清空，請重新雙擊「啟動永信小鎮.bat」
:end
pause
