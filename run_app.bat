@echo off
set "EXE=%~dp0dist\start-gps.exe"
if not exist "%EXE%" (
  echo Exe not found: "%EXE%"
  pause
  exit /b 1
)
start "" "%EXE%"
timeout /t 1 >nul
start "" "http://127.0.0.1:5000"
