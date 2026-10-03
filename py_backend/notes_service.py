# -*- coding: utf-8 -*-
"""调用百炼应用生成复习重点与考点。"""

from __future__ import annotations

import os
from http import HTTPStatus
from typing import Any

from bailian import call_app, _output_text, _output_session_id


def _bailian_credentials() -> tuple[str, str]:
    api_key = (os.getenv("DASHSCOPE_API_KEY") or "").strip()
    app_id = (
        os.getenv("BAILIAN_APP_ID") or os.getenv("DASHSCOPE_APP_ID") or ""
    ).strip()
    if not api_key:
        raise ValueError("未配置 DASHSCOPE_API_KEY")
    if not app_id:
        raise ValueError("未配置 BAILIAN_APP_ID")
    return api_key, app_id


def build_review_prompt(*, course_name: str, transcript: str) -> str:
    course = (course_name or "本课程").strip()
    return (
        f"请根据以下《{course}》课堂录音转写内容，整理「课程复习重点」与「高频考点」。\n"
        "要求：\n"
        "1. 用清晰的中文分点输出；\n"
        "2. 先给出复习重点，再给出考点/易错点；\n"
        "3. 尽量紧扣转写原文，不要编造未出现的知识点。\n\n"
        "【课堂转写】\n"
        f"{transcript.strip()}"
    )


def generate_review_notes(
    *,
    transcript: str,
    course_name: str = "",
) -> dict[str, Any]:
    if not (transcript or "").strip():
        raise ValueError("transcript 不能为空")

    api_key, app_id = _bailian_credentials()
    prompt = build_review_prompt(course_name=course_name, transcript=transcript)

    # Application.call 走默认百炼网关；不覆盖 ASR 用的 base_http_api_url 现场配置
    import dashscope

    prev_base = getattr(dashscope, "base_http_api_url", None)
    try:
        # 百炼应用 API 默认域名
        dashscope.base_http_api_url = os.getenv(
            "BAILIAN_BASE_URL", "https://dashscope.aliyuncs.com/api/v1"
        )
        response = call_app(
            api_key=api_key,
            app_id=app_id,
            prompt=prompt,
            session_id=None,
            biz_params=None,
            stream=False,
        )
    finally:
        if prev_base is not None:
            dashscope.base_http_api_url = prev_base

    if response.status_code != HTTPStatus.OK:
        raise RuntimeError(
            f"百炼调用失败: status={response.status_code} "
            f"code={getattr(response, 'code', None)} "
            f"message={getattr(response, 'message', None)}"
        )

    text = (_output_text(response) or "").strip()
    if not text:
        raise RuntimeError("百炼返回内容为空")

    return {
        "ok": True,
        "app_id": app_id,
        "text": text,
        "session_id": _output_session_id(response),
        "request_id": getattr(response, "request_id", None),
    }
