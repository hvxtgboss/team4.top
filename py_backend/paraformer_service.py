# -*- coding: utf-8 -*-
"""Paraformer 录音文件识别（可被 app 调用的封装）。

对照：IPSchool2026SummerBootcamp-Base/basic-skill/paraformer.py
"""

from __future__ import annotations

import json
import os
from http import HTTPStatus
from typing import Any
from urllib import request

import dashscope
from dashscope.audio.asr import Transcription


def strip_timestamps(obj: Any) -> Any:
    """递归删除 begin_time / end_time / words，只保留文本结构。"""
    if isinstance(obj, list):
        return [strip_timestamps(item) for item in obj]
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if key in {"begin_time", "end_time", "words"}:
                continue
            cleaned[key] = strip_timestamps(value)
        return cleaned
    return obj


def extract_plain_text(result: dict) -> str:
    """从转写 JSON 中提取纯文本。"""
    texts: list[str] = []
    for tr in result.get("transcripts") or []:
        if isinstance(tr, dict):
            t = (tr.get("text") or "").strip()
            if t:
                texts.append(t)
                continue
            for sent in tr.get("sentences") or []:
                if isinstance(sent, dict):
                    s = (sent.get("text") or "").strip()
                    if s:
                        texts.append(s)
    if texts:
        return "\n".join(texts)
    # 兜底：尝试顶层 text
    top = (result.get("text") or "").strip()
    return top


def _configure_dashscope() -> str:
    api_key = (os.getenv("DASHSCOPE_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("未配置 DASHSCOPE_API_KEY")

    workspace_id = (os.getenv("DASHSCOPE_WORKSPACE_ID") or "").strip()
    region = (os.getenv("DASHSCOPE_REGION") or "cn-beijing").strip()
    base_url = (os.getenv("DASHSCOPE_BASE_URL") or "").strip()
    if not base_url:
        if not workspace_id:
            raise ValueError("未配置 DASHSCOPE_WORKSPACE_ID 或 DASHSCOPE_BASE_URL")
        base_url = f"https://{workspace_id}.{region}.maas.aliyuncs.com/api/v1"

    dashscope.api_key = api_key
    dashscope.base_http_api_url = base_url
    return base_url


def transcribe_audio_url(
    file_url: str,
    *,
    language_hints: list[str] | None = None,
    strip_ts: bool = True,
) -> dict[str, Any]:
    """对公开可访问的音频 URL 做 Paraformer 转写，返回结构化结果。"""
    if not file_url or not file_url.strip():
        raise ValueError("audio_url 不能为空")

    base_url = _configure_dashscope()
    hints = language_hints or ["zh", "en"]

    task_response = Transcription.async_call(
        model="paraformer-v2",
        file_urls=[file_url.strip()],
        language_hints=hints,
        timestamp_alignment_enabled=False,
    )

    if task_response.status_code != HTTPStatus.OK or not task_response.output:
        raise RuntimeError(
            f"提交转写失败: status={task_response.status_code} "
            f"code={getattr(task_response, 'code', None)} "
            f"message={getattr(task_response, 'message', None)}"
        )

    task_id = task_response.output.task_id
    transcribe_response = Transcription.wait(task=task_id)

    if transcribe_response.status_code != HTTPStatus.OK:
        raise RuntimeError(
            f"等待转写失败: {transcribe_response.code} {transcribe_response.message}"
        )

    results = (transcribe_response.output or {}).get("results") or []
    if not results:
        raise RuntimeError("转写结果为空")

    transcripts: list[dict] = []
    plain_parts: list[str] = []

    for item in results:
        if item.get("subtask_status") != "SUCCEEDED":
            raise RuntimeError(f"转写子任务失败: {item}")

        raw = json.loads(request.urlopen(item["transcription_url"]).read().decode("utf8"))
        if strip_ts:
            raw = strip_timestamps(raw)
        transcripts.append(raw)
        text = extract_plain_text(raw)
        if text:
            plain_parts.append(text)

    plain_text = "\n".join(plain_parts).strip()
    if not plain_text:
        raise RuntimeError("未能从转写结果中提取到文本")

    return {
        "ok": True,
        "endpoint": base_url,
        "task_id": task_id,
        "text": plain_text,
        "raw": transcripts[0] if len(transcripts) == 1 else transcripts,
    }
