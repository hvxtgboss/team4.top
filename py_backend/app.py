#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学到 · py_backend 可调用服务

当前能力：
  - GET  /health
  - POST /api/upload/audio     上传课程录音到七牛
  - POST /api/asr/transcribe   Paraformer 识别音频 URL
  - POST /api/notes/generate   ASR + 百炼生成复习重点/考点（一步完成）

启动（在 py_backend 目录）：
  source .venv/bin/activate
  uvicorn app:app --host 0.0.0.0 --port 5001 --reload
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from QiniuUploader import QiniuUploader
from notes_service import generate_review_notes
from paraformer_service import transcribe_audio_url

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "bailian.env")
load_dotenv()

UPLOAD_TMP = ROOT / "uploads"
UPLOAD_TMP.mkdir(exist_ok=True)
OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

BUCKET = os.getenv("QINIU_BUCKET", "team4")
DOMAIN = os.getenv("QINIU_DOMAIN", "http://titw4rjei.hd-bkt.clouddn.com")
ACCESS_KEY = os.getenv("QINIU_ACCESS_KEY", "")
SECRET_KEY = os.getenv("QINIU_SECRET_KEY", "")

app = FastAPI(title="学到 py_backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_segment(value: str, fallback: str = "misc") -> str:
    value = (value or "").strip()
    if not value:
        return fallback
    value = re.sub(r"[^\w\u4e00-\u9fff\-]+", "_", value)
    return value[:64] or fallback


def _get_uploader() -> QiniuUploader:
    if not ACCESS_KEY or not SECRET_KEY:
        raise HTTPException(status_code=500, detail="未配置 QINIU_ACCESS_KEY / QINIU_SECRET_KEY")
    return QiniuUploader(
        access_key=ACCESS_KEY,
        secret_key=SECRET_KEY,
        bucket_name=BUCKET,
        domain=DOMAIN,
    )


def _save_outputs(
    *,
    course_seg: str,
    audio_url: str,
    transcript: str,
    review_notes: str,
) -> dict[str, str]:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    folder = OUTPUT_DIR / course_seg / stamp
    folder.mkdir(parents=True, exist_ok=True)

    meta = {
        "audio_url": audio_url,
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    (folder / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (folder / "transcript.txt").write_text(
        transcript if transcript.endswith("\n") else transcript + "\n",
        encoding="utf-8",
    )
    (folder / "review_notes.txt").write_text(
        review_notes if review_notes.endswith("\n") else review_notes + "\n",
        encoding="utf-8",
    )
    return {
        "dir": str(folder),
        "transcript_path": str(folder / "transcript.txt"),
        "review_path": str(folder / "review_notes.txt"),
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "py_backend",
        "bucket": BUCKET,
        "domain": DOMAIN,
        "bailian_app_id": (os.getenv("BAILIAN_APP_ID") or "")[:8] + "…"
        if os.getenv("BAILIAN_APP_ID")
        else None,
        "asr_workspace": os.getenv("DASHSCOPE_WORKSPACE_ID") or None,
    }


@app.post("/api/upload/audio")
async def upload_audio(
    file: UploadFile = File(...),
    course_id: str = Form(""),
    course_name: str = Form(""),
):
    """上传音频到七牛，返回可公开访问的 URL。"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")

    suffix = Path(file.filename).suffix.lower() or ".mp3"
    allowed = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".webm"}
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"不支持的音频格式: {suffix}")

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    course_seg = _safe_segment(course_name or course_id, "course")
    key = f"audio/{course_seg}/{stamp}_{uuid.uuid4().hex[:8]}{suffix}"

    tmp_path = UPLOAD_TMP / f"{uuid.uuid4().hex}{suffix}"
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="文件为空")
        tmp_path.write_bytes(content)

        uploader = _get_uploader()
        ret = uploader.upload_file(str(tmp_path), key)
        url = uploader.get_file_url(ret["key"])

        return {
            "ok": True,
            "key": ret["key"],
            "hash": ret.get("hash"),
            "url": url,
            "course_id": course_id or None,
            "course_name": course_name or None,
            "original_filename": file.filename,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {e}") from e
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass


class TranscribeBody(BaseModel):
    audio_url: str = Field(..., min_length=1)
    course_id: str = ""
    course_name: str = ""


@app.post("/api/asr/transcribe")
def asr_transcribe(body: TranscribeBody):
    """仅做 Paraformer 语音识别，并落盘 transcript。"""
    try:
        result = transcribe_audio_url(body.audio_url)
        course_seg = _safe_segment(body.course_name or body.course_id, "course")
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder = OUTPUT_DIR / course_seg / stamp
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / "transcript.txt"
        text = result["text"]
        path.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")
        return {
            "ok": True,
            "text": text,
            "task_id": result.get("task_id"),
            "saved_path": str(path),
            "course_id": body.course_id or None,
            "course_name": body.course_name or None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音识别失败: {e}") from e


class GenerateNotesBody(BaseModel):
    audio_url: str = Field(..., min_length=1)
    course_id: str = ""
    course_name: str = ""
    transcript: str = ""  # 若已有转写可跳过 ASR


@app.post("/api/notes/generate")
def generate_notes(body: GenerateNotesBody):
    """第三步：识别音频（若未提供 transcript）+ 百炼生成复习重点/考点，并本地保存。"""
    try:
        transcript = (body.transcript or "").strip()
        asr_meta: dict = {}
        if not transcript:
            asr = transcribe_audio_url(body.audio_url)
            transcript = asr["text"]
            asr_meta = {"task_id": asr.get("task_id"), "endpoint": asr.get("endpoint")}

        notes = generate_review_notes(
            transcript=transcript,
            course_name=body.course_name or body.course_id or "",
        )

        course_seg = _safe_segment(body.course_name or body.course_id, "course")
        saved = _save_outputs(
            course_seg=course_seg,
            audio_url=body.audio_url,
            transcript=transcript,
            review_notes=notes["text"],
        )

        return {
            "ok": True,
            "audio_url": body.audio_url,
            "course_id": body.course_id or None,
            "course_name": body.course_name or None,
            "transcript": transcript,
            "review_notes": notes["text"],
            "asr": asr_meta or None,
            "bailian": {
                "app_id": notes.get("app_id"),
                "request_id": notes.get("request_id"),
                "session_id": notes.get("session_id"),
            },
            "saved": saved,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {e}") from e


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("PY_BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("PY_BACKEND_PORT", "5001"))
    uvicorn.run("app:app", host=host, port=port, reload=True)
