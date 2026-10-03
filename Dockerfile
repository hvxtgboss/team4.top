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
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

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
CMD ["/entrypoint.sh"]
