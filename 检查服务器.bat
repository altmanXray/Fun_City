@echo off
chcp 65001 >nul
title LittleGame 服务器状态
color 0B

echo.
echo ╔══════════════════════════════════════╗
echo ║     LittleGame 服务器状态检查        ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查端口占用
echo 📊 正在检查8080端口...
echo.

netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo ┌──────────────────────────────────────┐
    echo │  状态: ⏸️  服务器未运行              │
    echo ├──────────────────────────────────────┤
    echo │  端口8080当前未被占用               │
    echo └──────────────────────────────────────┘
    echo.
    echo 💡 提示：双击"一键启动.bat"启动服务器
    echo.
) else (
    echo ┌──────────────────────────────────────┐
    echo │  状态: 🟢 服务器正在运行            │
    echo ├──────────────────────────────────────┤
    echo │  端口: 8080                         │
    echo └──────────────────────────────────────┘
    echo.
    
    :: 获取进程信息
    for /f "tokens=2,5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
        set "addr=%%a"
        set "pid=%%b"
    )
    set "addr=%addr:~1,-1%"
    
    :: 获取本机IP
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
        set "ip=%%a"
    )
    set "ip=%ip: =%"
    
    echo 📍 访问地址:
    echo    本地:   http://localhost:8080
    echo    局域网: http://%ip%:8080/
    echo.
    echo 🖥️  进程信息:
    echo    PID: %pid%
    echo    地址: %addr%
    echo.
    echo 💡 提示：
    echo    - 点击浏览器访问上方地址
    echo    - 双击"停止服务器.bat"关闭服务器
    echo.
)

echo 按任意键刷新状态...
pause >nul
cls
goto :eof

call "%~f0"