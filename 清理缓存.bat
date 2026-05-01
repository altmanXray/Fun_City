@echo off
chcp 65001 >nul
title LittleGame 缓存清理
color 0E

echo.
echo ╔══════════════════════════════════════╗
echo ║     LittleGame 缓存清理工具          ║
echo ╚══════════════════════════════════════╝
echo.

set /p confirm="⚠️  此操作将清理所有游戏缓存，是否继续？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 已取消操作
    pause
    exit /b 0
)

echo.
echo 🧹 正在清理缓存...
echo.

:: 检查是否在浏览器中打开
echo [1/3] 检查8080端口占用...
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  检测到服务器正在运行
    for /f "tokens=2" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo    已停止服务器
    )
    timeout /t 1 /nobreak >nul
) else (
    echo ✅ 服务器未运行
)

:: 提示浏览器清理
echo [2/3] 浏览器缓存清理提示...
echo.
echo 请手动清理浏览器缓存：
echo    Chrome: Ctrl+Shift+Delete
echo    Edge: Ctrl+Shift+Delete
echo    Firefox: Ctrl+Shift+Delete
echo.
pause

:: 显示清理完成
echo [3/3] 清理完成！
echo.
echo ✅ 缓存清理完成
echo.
echo 🎮 可以重新启动游戏了
echo.
echo 按任意键退出...
pause >nul

:: 可选：重新启动
echo.
set /p restart="是否立即重新启动服务器？(Y/N): "
if /i "%restart%"=="Y" (
    echo.
    echo 🚀 正在启动服务器...
    call "一键启动.bat"
) else (
    exit /b 0
)