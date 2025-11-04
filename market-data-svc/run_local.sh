#!/usr/bin/env bash
set -euo pipefail
PORT=${1:-8001}
HOST=0.0.0.0
exec uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
