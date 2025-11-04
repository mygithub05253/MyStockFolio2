@echo off
setlocal enabledelayedexpansion
set PORT=%1
if "%PORT%"=="" set PORT=8003
uvicorn app.main:app --host 0.0.0.0 --port %PORT% --reload

