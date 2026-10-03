#!/bin/sh
set -e

PORT="${PORT:-8000}"
NODE_PORT="${NODE_PORT:-3001}"
PY_PORT="${PY_BACKEND_PORT:-5001}"
export PORT

envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "[entrypoint] TEAM_NAME=${TEAM_NAME:-} PORT=${PORT}"
echo "[entrypoint] starting Express on 127.0.0.1:${NODE_PORT} ..."

cd /app/backend
PORT="${NODE_PORT}" \
STATIC_DIR="${STATIC_DIR:-/app/frontend/dist}" \
SQLITE_PATH="${SQLITE_PATH:-/app/data/xuedao.sqlite}" \
NODE_ENV=production \
  npx tsx src/index.ts &
NODE_PID=$!

echo "[entrypoint] starting py_backend on 127.0.0.1:${PY_PORT} ..."
cd /app/py_backend
PY_BACKEND_HOST=127.0.0.1 \
PY_BACKEND_PORT="${PY_PORT}" \
  python -m uvicorn app:app --host 127.0.0.1 --port "${PY_PORT}" &
PY_PID=$!

# 等待 Node 就绪
i=0
while [ "$i" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${NODE_PORT}/api/health" >/dev/null 2>&1; then
    echo "[entrypoint] Express is ready"
    break
  fi
  i=$((i + 1))
  sleep 0.5
done

# 等待 py_backend 就绪（允许稍慢）
j=0
while [ "$j" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${PY_PORT}/health" >/dev/null 2>&1; then
    echo "[entrypoint] py_backend is ready"
    break
  fi
  j=$((j + 1))
  sleep 0.5
done

cleanup() {
  kill "$NODE_PID" "$PY_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[entrypoint] starting Nginx on 0.0.0.0:${PORT} ..."
exec nginx -g 'daemon off;'
