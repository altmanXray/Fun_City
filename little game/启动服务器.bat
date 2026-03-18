@echo off
chcp 65001 >nul
title Schulte Game Server
echo ========================================
echo   Schulte Game Server
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%a"
)

set "ip=%ip: =%"

echo Your LAN IP: %ip%
echo.
echo Open in browser: http://%ip%:8080
echo.
echo Press Ctrl+C to stop server
echo.

python -m http.server 8080