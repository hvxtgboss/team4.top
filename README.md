# 学到（Team4）

课程群学习平台 + AI 课堂笔记（录音上传 / Paraformer 转写 / 百炼复习考点）。

## 本地开发

```bash
# 前端
npm install && npm run dev

# Node API
cd backend && npm install && npm run dev

# Python AI 服务
cd py_backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 填入七牛 / 百炼 Key
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```

## Docker / IPS2026Summer-Deploy

根目录 `Dockerfile` 符合 Deploy 约定：

- 容器内监听环境变量 `PORT`（默认 **8000**）
- Deploy 映射：`8004:8000` → `team4.ooyyee.top`
- 同容器内：Nginx(对外) + Express(API/静态) + FastAPI(py_backend)
- 前端生产构建：`VITE_API_BASE_URL=/api`，`VITE_PY_API_BASE_URL=/py`

本地试构建：

```bash
docker build -t xuedao-team4 .
docker run --rm -p 8004:8000 \
  -e PORT=8000 \
  -e TEAM_NAME=Team4 \
  -e QINIU_ACCESS_KEY=... \
  -e QINIU_SECRET_KEY=... \
  -e DASHSCOPE_API_KEY=... \
  -e BAILIAN_APP_ID=... \
  xuedao-team4
```

健康检查：`http://localhost:8004/health`、`/api/health`、`/py/health`
