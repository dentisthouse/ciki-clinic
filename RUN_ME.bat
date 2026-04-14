@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
TITLE ระบบบริหารจัดการคลินิกทันตกรรม Baan Mor Fun
COLOR 0B

echo ############################################################
echo #                                                          #
echo #   BAAN MOR FUN DENTAL CLINIC - ONE-CLICK INSTALLER       #
echo #                                                          #
echo ############################################################
echo.

:: 1. ตรวจสอบสภาพแวดล้อม
echo [ตรวจสอบสภาพแวดล้อม...]

:: ตรวจสอบ Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ไม่พบ Node.js กรุณาติดตั้งจาก https://nodejs.org/
    start https://nodejs.org/
    pause
    exit
)

:: ตรวจสอบ Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ไม่พบ Docker Desktop กรูณาติดตั้งและเปิดใช้งานก่อน
    start https://www.docker.com/products/docker-desktop/
    pause
    exit
)

:: ตรวจสอบสถานะ Docker
echo [กำลังตรวจสอบสถานะ Docker...]
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ตรวจพบว่า Docker Desktop ยังไม่ได้เปิดใช้งาน หรือกำลังเริ่มต้น
    echo [!] กำลังพยายามเปิดให้...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo [!] กรุณารอจนไอคอน Docker เป็นสีเขียวแล้วรันไฟล์นี้ใหม่
    pause
    exit
)

:: 2. เตรียมไฟล์คอนฟิก
if not exist .env (
    echo [!] ไม่พบไฟล์ .env กำลังสร้างไฟล์เริ่มต้นให้...
    if exist .env.example (
        copy .env.example .env >nul
    ) else (
        echo PORT=5173 > .env
    )
    echo [!] กรุณาตั้งค่าในไฟล์ .env ให้ถูกต้องก่อนใช้งาน
)

:: 3. ติดตั้งโมดูล
if not exist node_modules (
    echo [กำลังติดตั้งระบบครั้งแรก - โปรดรอสักครู่...]
    call npm install
)

:: 4. เปิดฐานข้อมูล
echo [กำลังเปิดฐานข้อมูลเครื่องแม่...]
docker-compose -f docker-compose.local.yml up -d
if %errorlevel% neq 0 (
    echo.
    echo [!] ไม่สามารถเปิดฐานข้อมูลได้! 
    echo [!] ตรวจสอบว่า Docker พร้อมรัน (Ready) และ Port ไม่ซ้ำ
    pause
    exit
)

:: 5. แจ้ง IP เครื่องลูก
echo.
echo ============================================================
echo   ความสำเร็จ! ระบบพร้อมใช้งานแล้ว
echo   เครื่องแม่: เข้าไปใช้งานที่ http://localhost:5173
echo.
echo   สำหรับเครื่องลูก (เครื่องใกล้เคียง):
:: ดึง IP
set IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set tempIP=%%a
    set IP=!tempIP:~1!
)
echo   ให้พิมพ์ IP: http://!IP!:5173 ใน Chrome ของเครื่องลูก
echo ============================================================
echo.

:: 6. รันระบบหน้าเว็บ
echo [กำลังเริ่มระบบหน้าเว็บ...]
call npm run dev -- --host

pause
