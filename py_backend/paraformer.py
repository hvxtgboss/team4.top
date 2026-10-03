"""
Paraformer 录音文件识别（Python SDK）示例。

对照官方文档：
https://help.aliyun.com/zh/model-studio/paraformer-recorded-speech-recognition-python-sdk

关于时间戳（易混淆）：
- timestamp_alignment_enabled：只控制「时间戳校准」（识别结果与播放是否对齐），
  默认 False = 关闭校准，并不是「不要返回时间戳」。
- 接口固定会返回句子/词级 begin_time、end_time、words；文档无「关闭时间戳输出」参数。
- 若只需要正文，可在本地剥除时间字段（见下方 strip_timestamps）。
"""

from http import HTTPStatus
from dashscope.audio.asr import Transcription
from urllib import request
import dashscope
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# 环境变量（优先读取本目录 basic-skill/.env）
# ---------------------------------------------------------------------------
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

api_key = os.getenv("DASHSCOPE_API_KEY")
workspace_id = os.getenv("DASHSCOPE_WORKSPACE_ID", "").strip()
region = os.getenv("DASHSCOPE_REGION", "cn-beijing")
# 是否在打印时去掉时间戳字段（本地处理，非接口参数）
strip_ts = os.getenv("STRIP_TIMESTAMPS", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

if not api_key:
    raise ValueError("请在 .env 中配置 DASHSCOPE_API_KEY")
if not workspace_id:
    raise ValueError("请在 .env 中配置 DASHSCOPE_WORKSPACE_ID")

dashscope.api_key = api_key
dashscope.base_http_api_url = f"https://{workspace_id}.{region}.maas.aliyuncs.com/api/v1"
print(f"使用接入点: {dashscope.base_http_api_url}")


def strip_timestamps(obj):
    """递归删除 begin_time / end_time，并去掉词级 words 数组（只保留文本）。"""
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


# ---------------------------------------------------------------------------
# 1. async_call：异步提交转写任务
# ---------------------------------------------------------------------------
# timestamp_alignment_enabled=False：关闭「校准」，结果里仍会有时间戳字段
task_response = Transcription.async_call(
    model="paraformer-v2",
    file_urls=[
        "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav"
    ],
    language_hints=["zh", "en"],
    timestamp_alignment_enabled=False,
)

if task_response.status_code != HTTPStatus.OK or not task_response.output:
    print("提交转写任务失败：")
    print(f"  status_code : {task_response.status_code}")
    print(f"  code        : {task_response.code}")
    print(f"  message     : {task_response.message}")
    raise SystemExit(1)

# ---------------------------------------------------------------------------
# 2. wait：同步等待任务结束
# ---------------------------------------------------------------------------
transcribe_response = Transcription.wait(task=task_response.output.task_id)

# ---------------------------------------------------------------------------
# 3. 下载并输出识别正文
# ---------------------------------------------------------------------------
if transcribe_response.status_code != HTTPStatus.OK:
    print("Error:", transcribe_response.code, transcribe_response.message)
    raise SystemExit(1)

for item in transcribe_response.output["results"]:
    if item.get("subtask_status") != "SUCCEEDED":
        print("transcription failed!")
        print(item)
        continue

    result = json.loads(request.urlopen(item["transcription_url"]).read().decode("utf8"))
    if strip_ts:
        result = strip_timestamps(result)
        print("# 已本地剥除 begin_time / end_time / words（接口本身仍会返回时间戳）")
    print(json.dumps(result, indent=4, ensure_ascii=False))

print("transcription done!")
