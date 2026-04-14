@echo off
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
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ไม่พบ Node.js กรุณาติดตั้งจาก https://nodejs.org/
    start https://nodejs.org/
    pause
    exit
)

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ไม่พบ Docker กรุณาติดตั้งและเปิด Docker Desktop ทิ้งไว้
    start https://www.docker.com/products/docker-desktop/
    pause
    exit
)

:: 2. เตรียมไฟล์คอนฟิก
if not exist .env (
    echo [!] ไม่พบไฟล์ .env กำลังสร้างไฟล์เริ่มต้นให้...
    copy .env.example .env >nul
    echo [!] กรุณาตั้งค่าในไฟล์ .env ให้ถูกต้องก่อนใช้งาน (ถ้ามีคีย์ Cloud)
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
    echo [!] ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาเปิด Docker Desktop ก่อน!
    pause
    exit
)

:: 5. แจ้ง IP เครื่องลูก
echo.
echo ============================================================
echo   ความสำเร็จ! ระบบพร้อมใช้งานแล้ว
echo   เครื่องแม่: เข้าไปใช้งานที่ http://localhost:5173
echo.
echo   สำหรับเครื่องลูก (อีก 9 เครื่อง):
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.0"') do set IP=%%a
echo   ให้พิมพ์ IP: http://%IP%:5173 ใน Chrome ของเครื่องลูก
echo ============================================================
echo.

:: 6. รันระบบหน้าเว็บ
call npm run dev -- --host

pause
