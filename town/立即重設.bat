@echo off
cd /d "%~dp0"
title 永信小鎮重設中
echo 這個檔案要在「啟動永信小鎮」黑色視窗開著的時候執行。
echo.
echo [1/2] 清空小鎮資料...
call npx convex run testing:wipeAllTables
if errorlevel 1 goto fail
echo.
echo [2/2] 用永信街區地圖與 7 位角色重新建立小鎮...
call npx convex run init
if errorlevel 1 goto fail
echo.
echo 完成！回到瀏覽器按 F5 重新整理即可。這個視窗可以關掉。
pause
goto end
:fail
echo.
echo 重設失敗，請把這個視窗截圖傳給 Claude。
pause
:end
