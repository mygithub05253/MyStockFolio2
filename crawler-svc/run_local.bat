@echo off
echo Starting Crawler Service...
cd /d %~dp0
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8005

