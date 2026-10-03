# 学到 · 生产镜像（符合 IPS2026Summer-Deploy）
# 约定：容器内监听 PORT（默认 8000）；host 映射 8004:8000
ARG NODE_IMAGE=node:20-slim

FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /ui
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public
ENV VITE_API_BASE_URL=/api \
    VITE_PY_API_BASE_URL=/py
# 生产构建用 vite；严格 tsc 留给本地 npm run build / CI
RUN npx vite build

FROM ${NODE_IMAGE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       nginx gettext-base curl ca-certificates \
       python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default \
  && ln -sf /usr/bin/python3 /usr/local/bin/python \
  && node -v && python3 --version

WORKDIR /app
RUN mkdir -p /app/data /app/uploads/materials /app/py_backend/uploads /app/py_backend/outputs

# Node API
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev && npm install tsx
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Python AI 服务
WORKDIR /app
COPY py_backend/requirements.txt ./py_backend/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/py_backend/requirements.txt \
  || pip3 install --no-cache-dir -r /app/py_backend/requirements.txt
COPY py_backend/ ./py_backend/
RUN rm -rf /app/py_backend/.venv /app/py_backend/__pycache__ \
  && rm -f /app/py_backend/.env /app/py_backend/bailian.env \
  && find /app/py_backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true \
  && find /app/py_backend/uploads /app/py_backend/outputs -mindepth 1 -delete 2>/dev/null || true

COPY --from=frontend-build /ui/dist /app/frontend/dist
COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template

# 启动脚本（构建时内联生成，不依赖外部 entrypoint.sh）：
# 1) envsubst 渲染 nginx.conf（替换 ${PORT}） 2) 后台启动 Node/Python 后端 3) 前台运行 nginx
RUN cat > /start.sh <<'EOF'
#!/bin/sh
set -e
PORT="${PORT:-8000}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "[start] TEAM_NAME=${TEAM_NAME:-} PORT=${PORT}"
cd /app/backend
PORT="${NODE_PORT:-3001}" \
STATIC_DIR="${STATIC_DIR:-/app/frontend/dist}" \
SQLITE_PATH="${SQLITE_PATH:-/app/data/xuedao.sqlite}" \
NODE_ENV=production \
  npx tsx src/index.ts &
NODE_PID=$!
cd /app/py_backend
PY_BACKEND_HOST=127.0.0.1 \
PY_BACKEND_PORT="${PY_BACKEND_PORT:-5001}" \
  python -m uvicorn app:app --host 127.0.0.1 --port "${PY_BACKEND_PORT}" &
PY_PID=$!
i=0
while [ "$i" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${NODE_PORT:-3001}/api/health" >/dev/null 2>&1; then
    echo "[start] Express is ready"
    break
  fi
  i=$((i + 1))
  sleep 0.5
done
j=0
while [ "$j" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${PY_BACKEND_PORT:-5001}/health" >/dev/null 2>&1; then
    echo "[start] py_backend is ready"
    break
  fi
  j=$((j + 1))
  sleep 0.5
done
cleanup() {
  kill "$NODE_PID" "$PY_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
exec nginx -g 'daemon off;'
EOF
RUN chmod +x /start.sh

ENV PORT=8000 \
    TEAM_NAME=Team4 \
    NODE_ENV=production \
    STATIC_DIR=/app/frontend/dist \
    SQLITE_PATH=/app/data/xuedao.sqlite \
    NODE_PORT=3001 \
    PY_BACKEND_HOST=127.0.0.1 \
    PY_BACKEND_PORT=5001 \
    QINIU_BUCKET=team4 \
    QINIU_DOMAIN=http://titw4rjei.hd-bkt.clouddn.com \
    DASHSCOPE_WORKSPACE_ID=llm-nt6wkjgugn4k8l49 \
    DASHSCOPE_REGION=cn-beijing \
    DASHSCOPE_BASE_URL=https://llm-nt6wkjgugn4k8l49.cn-beijing.maas.aliyuncs.com/api/v1 \
    BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/api/v1

EXPOSE 8000
CMD ["/start.sh"]
