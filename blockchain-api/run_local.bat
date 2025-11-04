@echo off
echo Starting Blockchain API Service...
echo.

REM .env 파일 확인
if not exist .env (
    echo WARNING: .env file not found. Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM 환경 변수 로드 및 서버 시작
call npm run dev

