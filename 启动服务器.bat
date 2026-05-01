@echo off
chcp 65001 >nul
title LittleGame 游戏服务器
color 0B

echo.
echo ╔══════════════════════════════════════╗
echo ║     LittleGame 游戏服务器启动器     ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Python，正在尝试使用python3...
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ 错误：未检测到Python或python3
        echo 请先安装Python 3.6或更高版本
        echo.
        echo 下载地址：https://www.python.org/downloads/
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
echo 正在启动服务器...
echo.

:: 获取本机IP地址
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%a"
)
set "ip=%ip: =%"

:: 启动服务器
echo ┌──────────────────────────────────────┐
echo │  服务器信息                          │
echo ├──────────────────────────────────────┤
echo │  本地访问:   http://localhost:8080    │
echo │  局域网访问: http://%ip%:8080/      │
echo └──────────────────────────────────────┘
echo.
echo 📌 提示：
echo    1. 本机访问请使用 localhost 地址
echo    2. 其他设备请使用局域网IP地址
echo    3. 按 Ctrl+C 停止服务器
echo.
echo ═══════════════════════════════════════
echo.

%PYTHON_CMD% -m http.server 8080

echo.
echo 服务器已停止
pause