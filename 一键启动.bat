@echo off
chcp 65001 >nul
title LittleGame 启动器
color 0B

echo.
echo ╔══════════════════════════════════════╗
echo ║       LittleGame 一键启动器         ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ 错误：未检测到Python
        echo 请先安装Python 3.6或更高版本
        echo.
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

echo ✅ 检测到Python环境
echo.

:: 获取本机IP地址
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%a"
)
set "ip=%ip: =%"

:: 启动服务器（后台运行）
echo 🚀 正在启动服务器...
start /min cmd /c "%PYTHON_CMD% -m http.server 8080"

:: 等待服务器启动
timeout /t 2 /nobreak >nul

:: 自动打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:8080

echo.
echo ┌──────────────────────────────────────┐
echo │  服务器信息                          │
echo ├──────────────────────────────────────┤
echo │  本地访问:   http://localhost:8080    │
echo │  局域网访问: http://%ip%:8080/      │
echo └──────────────────────────────────────┘
echo.
echo ✅ 服务器已启动！
echo.
echo 📌 提示：
echo    - 浏览器已自动打开游戏页面
echo    - 其他设备可使用局域网IP访问
echo    - 关闭此窗口将停止服务器
echo    - 按 Ctrl+C 也可停止服务器
echo.
echo ═══════════════════════════════════════
echo.

:: 等待用户按键
pause >nul

:: 停止服务器
echo.
echo 正在停止服务器...
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo 服务器已停止
timeout /t 1 /nobreak >nul
exit