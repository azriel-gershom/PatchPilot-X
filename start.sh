#!/usr/bin/env bash
set -e

# PatchPilot X One-Click Startup Script
# Starts both Backend and Frontend, then opens the web interface.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}        Starting PatchPilot X           ${NC}"
echo -e "${CYAN}========================================${NC}"

# 1. Environment file check
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo -e "${YELLOW}[!] backend/.env not found. Creating from backend/.env.example...${NC}"
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}[!] Please ensure GEMINI_API_KEY is configured in backend/.env.${NC}"
    fi
fi

# 2. Virtual environment check
if [ ! -d "backend/.venv" ]; then
    echo -e "${YELLOW}[*] Creating Python virtual environment in backend/.venv...${NC}"
    python3 -m venv backend/.venv
    echo -e "${YELLOW}[*] Installing backend dependencies...${NC}"
    backend/.venv/bin/pip install --upgrade pip
    backend/.venv/bin/pip install -e backend
fi

# 3. Frontend node_modules check
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}[*] Installing frontend dependencies (npm install)...${NC}"
    (cd frontend && npm install)
fi

# 4. Port Conflict Check (clean up stale processes on 8000 or 5173 if any)
if lsof -i :8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Port 8000 is already in use. Freeing port 8000...${NC}"
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
fi
if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Port 5173 is already in use. Freeing port 5173...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
fi

# Trap to gracefully shutdown child processes on Ctrl+C or exit
cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo -e "${YELLOW}Stopping PatchPilot X services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        pkill -P "$BACKEND_PID" 2>/dev/null || true
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        pkill -P "$FRONTEND_PID" 2>/dev/null || true
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    wait 2>/dev/null || true
    echo -e "${GREEN}All services stopped successfully.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 5. Start Backend
echo -e "${GREEN}[*] Starting Backend (FastAPI on port 8000)...${NC}"
(
    cd "$SCRIPT_DIR/backend"
    source .venv/bin/activate
    exec python -m uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${CYAN}[*] Waiting for backend to become ready...${NC}"
for i in {1..20}; do
    if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}[✓] Backend is ready!${NC}"
        break
    fi
    sleep 0.5
done

# 6. Start Frontend
echo -e "${GREEN}[*] Starting Frontend (Vite on port 5173)...${NC}"
(
    cd "$SCRIPT_DIR/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!

# Wait for frontend dev server
for i in {1..20}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}[✓] Frontend is ready!${NC}"
        break
    fi
    sleep 0.5
done

# 7. Open Browser
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN} PatchPilot X is now running!${NC}"
echo -e "   Frontend:    ${CYAN}http://localhost:5173${NC}"
echo -e "   Backend API: ${CYAN}http://127.0.0.1:8000${NC}"
echo -e "   API Docs:    ${CYAN}http://127.0.0.1:8000/docs${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}Press [Ctrl + C] anytime to stop all services.${NC}"

# Open in default browser
if command -v open >/dev/null 2>&1; then
    open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173"
fi

wait
