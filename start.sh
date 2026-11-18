#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "QuantumShield: Classical and Post-Quantum Cryptography Evaluation Platform"
echo "======================================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend
echo "[1/2] Starting FastAPI Backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend
sleep 2

# Start frontend
echo "[2/2] Starting React Frontend on http://localhost:5173 ..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "Platform running. Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
