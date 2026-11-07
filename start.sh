#!/usr/bin/env bash
# One-command launcher: installs what is missing, starts backend + frontend,
# opens the browser, and shuts both down when you press Ctrl+C.
#
#   ./start.sh            start everything
#   ./start.sh --no-open  start without opening a browser
#   ./start.sh --mocks    frontend only, using built-in sample data
set -euo pipefail
cd "$(dirname "$0")"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"
OPEN_BROWSER=1
MOCKS=0
for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_BROWSER=0 ;;
    --mocks) MOCKS=1 ;;
  esac
done

LOG_DIR=".logs"; mkdir -p "$LOG_DIR"
PIDS=()

say()  { printf '\033[36m▸\033[0m %s\n' "$*"; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
fail() { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

cleanup() {
  echo
  say "Shutting down…"
  for pid in "${PIDS[@]:-}"; do [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true; done
  # uvicorn --reload and vite spawn children; make sure they go too.
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  pkill -f "vite --port $FRONTEND_PORT" 2>/dev/null || true
  ok "Stopped."
}
trap cleanup EXIT INT TERM

# ---- prerequisites --------------------------------------------------------
command -v node >/dev/null || fail "Node.js not found. Install from https://nodejs.org (LTS)."
command -v npm  >/dev/null || fail "npm not found."
if [[ $MOCKS -eq 0 ]]; then
  if ! command -v uv >/dev/null; then
    say "uv not found, installing…"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

[[ -d frontend/node_modules ]] || { say "Installing frontend dependencies…"; (cd frontend && npm install --no-fund --no-audit); }
if [[ $MOCKS -eq 0 ]]; then
  [[ -d backend/.venv ]] || { say "Installing backend dependencies…"; (cd backend && uv sync); }
fi

# ---- port check -----------------------------------------------------------
port_busy() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
if [[ $MOCKS -eq 0 ]] && port_busy "$BACKEND_PORT"; then
  say "Port $BACKEND_PORT already in use; assuming a backend is running there."
  BACKEND_EXTERNAL=1
else
  BACKEND_EXTERNAL=0
fi
port_busy "$FRONTEND_PORT" && fail "Port $FRONTEND_PORT is busy. Stop the other process or run: FRONTEND_PORT=5174 ./start.sh"

# ---- start ----------------------------------------------------------------
if [[ $MOCKS -eq 0 && $BACKEND_EXTERNAL -eq 0 ]]; then
  say "Starting backend on http://localhost:$BACKEND_PORT (log: $LOG_DIR/backend.log)"
  (cd backend && exec uv run uvicorn app.main:app --reload --port "$BACKEND_PORT") >"$LOG_DIR/backend.log" 2>&1 &
  PIDS+=($!)
fi

say "Starting frontend on http://localhost:$FRONTEND_PORT (log: $LOG_DIR/frontend.log)"
if [[ $MOCKS -eq 1 ]]; then
  (cd frontend && VITE_USE_MOCKS=true exec npx vite --port "$FRONTEND_PORT" --strictPort) >"$LOG_DIR/frontend.log" 2>&1 &
else
  (cd frontend && exec npx vite --port "$FRONTEND_PORT" --strictPort) >"$LOG_DIR/frontend.log" 2>&1 &
fi
PIDS+=($!)

# ---- wait until ready -----------------------------------------------------
for _ in $(seq 1 60); do
  if port_busy "$FRONTEND_PORT" && { [[ $MOCKS -eq 1 ]] || port_busy "$BACKEND_PORT"; }; then break; fi
  sleep 0.5
done
port_busy "$FRONTEND_PORT" || { tail -20 "$LOG_DIR/frontend.log"; fail "Frontend did not start."; }
[[ $MOCKS -eq 1 ]] || port_busy "$BACKEND_PORT" || { tail -20 "$LOG_DIR/backend.log"; fail "Backend did not start."; }

URL="http://localhost:$FRONTEND_PORT"
ok "Ready: $URL"
[[ $MOCKS -eq 1 ]] || ok "API docs: http://localhost:$BACKEND_PORT/docs"

# ---- open browser (Linux, WSL, macOS) -------------------------------------
if [[ $OPEN_BROWSER -eq 1 ]]; then
  if grep -qi microsoft /proc/version 2>/dev/null; then
    (cmd.exe /c start "" "$URL" >/dev/null 2>&1 || explorer.exe "$URL" >/dev/null 2>&1 || true)
  elif command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null; then open "$URL" || true
  fi
fi

say "Press Ctrl+C to stop both servers."
wait
