@echo off
chcp 65001 >nul
title LittleGame 服务器管理器
color 0C

echo.
echo ╔══════════════════════════════════════╗
echo ║     LittleGame 服务器管理器         ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查8080端口是否被占用
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo ℹ️  8080端口未被占用，服务器未运行
    echo.
    pause
    exit /b 0
)

:: 停止服务器
echo 🛑 正在停止8080端口的服务器...
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo ✅ 已停止进程 PID: %%a
)

timeout /t 1 /nobreak >nul

:: 再次检查
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo.
    echo ✅ 服务器已成功停止！
) else (
    echo.
    echo ⚠️  部分进程可能仍在运行
    echo 请手动检查任务管理器
)

echo.
pause