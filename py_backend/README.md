# 学到 · py_backend

## 启动

```bash
cd py_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 填入七牛 / 百炼 / Paraformer 配置
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```

健康检查：`http://localhost:5001/health`

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/upload/audio` | 上传录音到七牛 |
| POST | `/api/asr/transcribe` | Paraformer 识别 `audio_url` |
| POST | `/api/notes/generate` | ASR + 百炼生成复习重点/考点，并写入 `outputs/` |

第三步结果本地落盘目录：`outputs/<课程名>/<时间戳>/transcript.txt`、`review_notes.txt`。
