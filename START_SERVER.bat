@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
TITLE คลินิกทันตกรรมบ้านหมอฟัน - Server Manager
COLOR 0F

echo ============================================================
echo   ระบบจัดการคลินิกทันตกรรมบ้านหมอฟัน (BAAN MOR FUN)
echo ============================================================
echo.

:: 1. ตรวจสอบสภาพแวดล้อม
echo [ตรวจสอบสภาพแวดล้อม...]

:: ตรวจสอบ Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Node.js กรุณาติดตั้งจาก https://nodejs.org/
    pause
    exit /b
)

:: ตรวจสอบ Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Docker Desktop กรุณาติดตั้งและเปิดใช้งานก่อน
    start https://www.docker.com/products/docker-desktop/
    pause
    exit /b
)

:: ตรวจสอบสถานะ Docker Daemon
echo [กำลังตรวจสอบสถานะ Docker...]
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ตรวจพบว่า Docker Desktop ยังไม่ได้เปิดใช้งาน
    echo [!] กำลังพยายามเปิดให้ โปรดรอสักครู่...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo [!] กรุณารอจนไอคอน Docker เป็นสีเขียวแล้วกดรันไฟล์นี้ใหม่
    pause
    exit /b
)

echo [1/3] กำลังเปิดฐานข้อมูลภายใน (Docker Supabase Local)...
docker-compose -f docker-compose.local.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] ไม่สามารถเปิดฐานข้อมูลได้! 
    echo [!] กรุณาตรวจสอบว่าไม่มีโปรแกรมอื่นใช้งาน Port 5432 อยู่
    pause
    exit /b
)
echo ✅ ฐานข้อมูลพร้อมใช้งาน

echo.
echo [2/3] กำลังติดตั้ง Dependencies (npm install)...
if not exist node_modules (
    call npm install
) else (
    echo ✅ พบโมดูลที่ติดตั้งไว้แล้ว ข้ามขั้นตอนการติดตั้ง...
)

echo.
echo [3/3] กำลังรันหน้าเว็บคลินิก (npm run dev -- --host)...
echo.
echo ------------------------------------------------------------
echo 💡 คำแนะนำสำหรับเครื่องลูก (เครื่องใกล้เคียง):
echo 1. เชื่อมต่อ Wi-Fi หรือ LAN เดียวกับเครื่องนี้
echo 2. เปิด Browser (Chrome) แล้วพิมพ์ IP ของเครื่องนี้
:: ดึง IP
set IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set tempIP=%%a
    set IP=!tempIP:~1!
)
echo    URL: http://!IP!:5173
echo ------------------------------------------------------------
echo.

:: Start the dev server
call npm run dev -- --host

pause
