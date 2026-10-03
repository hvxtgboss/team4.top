#!/usr/bin/env python3
"""调用阿里云百炼「应用」(Agent / 工作流)。

官方参考：
  https://bailian.console.aliyun.com/cn-beijing?tab=api#/api/?type=app&url=3003869
  https://help.aliyun.com/zh/model-studio/agent-and-workflow-application-api-reference

快速开始：
  cp bailian.env.example bailian.env   # 至少填写 DASHSCOPE_API_KEY
  echo '你是谁？' > input1.txt
  python bailian.py
  python bailian.py -i notes.txt -o answer.txt
  python bailian.py -a YOUR_APP_ID -i input1.txt -o output1.txt
  python bailian.py --prompt '用三句话介绍你自己' --stream

优先级（应用 ID）：--app-id / -a  >  环境变量 BAILIAN_APP_ID
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from http import HTTPStatus
from pathlib import Path

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ENV_FILE = SCRIPT_DIR / "bailian.env"
ERROR_DOC = "https://help.aliyun.com/zh/model-studio/developer-reference/error-code"
CONSOLE_DOC = (
    "https://bailian.console.aliyun.com/cn-beijing"
    "?tab=api#/api/?type=app&url=3003869"
)


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def load_env(env_file: Path | None) -> Path | None:
    """加载 bailian.env；不覆盖操作系统里已有的环境变量。"""
    path = (env_file or DEFAULT_ENV_FILE).expanduser().resolve()
    if path.is_file():
        load_dotenv(path, override=False)
        return path
    return None


def read_prompt(input_path: Path | None, inline: str | None) -> str:
    if inline is not None:
        text = inline.strip()
        if not text:
            raise SystemExit("错误：--prompt 不能为空")
        return text

    if input_path is None:
        raise SystemExit("错误：未指定输入文件，也未提供 --prompt")

    path = input_path.expanduser()
    if not path.is_file():
        raise SystemExit(
            f"错误：找不到输入文件 {path}\n"
            "请写入提示词，或用 --prompt / -i 指定。"
        )

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise SystemExit(f"错误：输入文件为空：{path}")
    return text


def write_output(output_path: Path | None, text: str) -> None:
    if output_path is None:
        return
    path = output_path.expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    if not text.endswith("\n"):
        text = text + "\n"
    path.write_text(text, encoding="utf-8")


def parse_biz_params(raw: str | None) -> dict | None:
    if not raw or not raw.strip():
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"错误：--biz-params 必须是合法 JSON：{exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit('错误：--biz-params 须为 JSON 对象，如 \'{"city":"杭州"}\'')
    return data


def build_parser() -> argparse.ArgumentParser:
    return argparse.ArgumentParser(
        description="调用百炼应用（Application.call），从文件读写提示词与回复。",
        epilog=f"控制台文档：{CONSOLE_DOC}",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )


def add_arguments(parser: argparse.ArgumentParser) -> None:
    env_input = os.getenv("BAILIAN_INPUT_FILE", "input1.txt")
    env_output = os.getenv("BAILIAN_OUTPUT_FILE", "output1.txt")
    env_app = os.getenv("BAILIAN_APP_ID") or os.getenv("DASHSCOPE_APP_ID") or ""

    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=None,
        help=f"提示词文件（默认：{env_input}）",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help=f"输出文件（默认：{env_output}）",
    )
    parser.add_argument("--prompt", default=None, help="直接传入提示词（优先于输入文件）")
    parser.add_argument(
        "-a",
        "--app-id",
        default=None,
        metavar="APP_ID",
        help=(
            "百炼应用 ID，覆盖 bailian.env 中的 BAILIAN_APP_ID"
            f"（当前默认：{env_app or '未设置'}）"
        ),
    )
    parser.add_argument("--api-key", default=None, help="覆盖 DASHSCOPE_API_KEY（不推荐）")
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help=f"环境变量文件（默认：{DEFAULT_ENV_FILE.name}）",
    )
    parser.add_argument("--session-id", default=None, help="多轮对话 session_id")
    parser.add_argument(
        "--biz-params",
        default=None,
        help='工作流自定义参数 JSON，例如 \'{"city":"杭州"}\'',
    )
    parser.add_argument("--stream", action="store_true", default=None, help="流式输出")
    parser.add_argument("--no-stream", action="store_true", help="强制关闭流式")
    parser.add_argument("--stdout-only", action="store_true", help="只打印，不写文件")
    parser.add_argument("--quiet", action="store_true", help="少打调试信息")


def resolve_paths(args: argparse.Namespace) -> tuple[Path | None, Path | None]:
    input_path = args.input
    if input_path is None and args.prompt is None:
        input_path = Path(os.getenv("BAILIAN_INPUT_FILE", "input1.txt"))

    if args.stdout_only:
        output_path = None
    elif args.output is not None:
        output_path = args.output
    else:
        output_path = Path(os.getenv("BAILIAN_OUTPUT_FILE", "output1.txt"))

    return input_path, output_path


def call_app(
    *,
    api_key: str,
    app_id: str,
    prompt: str,
    session_id: str | None,
    biz_params: dict | None,
    stream: bool,
):
    from dashscope import Application

    kwargs: dict = {
        "api_key": api_key,
        "app_id": app_id,
        "prompt": prompt,
        "stream": stream,
    }
    if session_id:
        kwargs["session_id"] = session_id
    if biz_params:
        kwargs["biz_params"] = biz_params
    return Application.call(**kwargs)


def print_error(response) -> None:
    print("调用失败", file=sys.stderr)
    print(f"  request_id = {getattr(response, 'request_id', None)}", file=sys.stderr)
    print(f"  code       = {getattr(response, 'status_code', None)}", file=sys.stderr)
    print(f"  message    = {getattr(response, 'message', None)}", file=sys.stderr)
    print(f"  错误码文档：{ERROR_DOC}", file=sys.stderr)
    print(f"  应用 API：{CONSOLE_DOC}", file=sys.stderr)


def _output_text(response) -> str:
    output = getattr(response, "output", None)
    return getattr(output, "text", None) or ""


def _output_session_id(response) -> str | None:
    output = getattr(response, "output", None)
    return getattr(output, "session_id", None)


def consume_stream(responses, quiet: bool) -> tuple[str, str | None]:
    """兼容「增量片段」与「全文刷新」两种流式返回。"""
    printed = ""
    full = ""
    session_id: str | None = None

    for response in responses:
        if response.status_code != HTTPStatus.OK:
            print()
            print_error(response)
            raise SystemExit(1)

        text = _output_text(response)
        if text:
            if text.startswith(full) and len(text) >= len(full):
                delta = text[len(full) :]
                full = text
            else:
                delta = text
                full += text
            if delta:
                print(delta, end="", flush=True)
                printed += delta

        sid = _output_session_id(response)
        if sid:
            session_id = sid

    if printed or full:
        print()

    final = full or printed
    if not quiet and session_id:
        print(f"[session_id] {session_id}", file=sys.stderr)
    return final, session_id


def consume_once(response, quiet: bool) -> tuple[str, str | None]:
    if response.status_code != HTTPStatus.OK:
        print_error(response)
        raise SystemExit(1)

    text = _output_text(response)
    session_id = _output_session_id(response)
    print(text)

    if not quiet:
        rid = getattr(response, "request_id", None)
        if rid:
            print(f"[request_id] {rid}", file=sys.stderr)
        if session_id:
            print(f"[session_id] {session_id}", file=sys.stderr)
        usage = getattr(response, "usage", None)
        if usage:
            print(f"[usage] {usage}", file=sys.stderr)

    return text, session_id


def main(argv: list[str] | None = None) -> int:
    pre = argparse.ArgumentParser(add_help=False)
    pre.add_argument("--env-file", type=Path, default=None)
    pre_args, remaining = pre.parse_known_args(argv)

    loaded = load_env(pre_args.env_file)

    parser = build_parser()
    add_arguments(parser)
    args = parser.parse_args(remaining)

    if args.env_file is not None and (
        pre_args.env_file is None or args.env_file != pre_args.env_file
    ):
        loaded = load_env(args.env_file) or loaded

    api_key = (args.api_key or os.getenv("DASHSCOPE_API_KEY") or "").strip()
    app_id = (
        args.app_id
        or os.getenv("BAILIAN_APP_ID")
        or os.getenv("DASHSCOPE_APP_ID")
        or ""
    ).strip()

    if not api_key:
        print(
            "错误：未设置 DASHSCOPE_API_KEY。\n"
            f"请执行：cp {DEFAULT_ENV_FILE.name}.example {DEFAULT_ENV_FILE.name} 并填写。",
            file=sys.stderr,
        )
        return 2
    if not app_id or app_id in {"APP_ID", "YOUR_APP_ID"}:
        print(
            "错误：未设置有效应用 ID。\n"
            "可用：python bailian.py -a <APP_ID> ...\n"
            "或在 bailian.env 中设置 BAILIAN_APP_ID。\n"
            "APP_ID 在百炼控制台应用卡片上复制。",
            file=sys.stderr,
        )
        return 2

    input_path, output_path = resolve_paths(args)
    prompt = read_prompt(input_path, args.prompt)
    session_id = (args.session_id or os.getenv("BAILIAN_SESSION_ID") or "").strip() or None
    biz_params = parse_biz_params(args.biz_params or os.getenv("BAILIAN_BIZ_PARAMS"))

    if args.no_stream:
        stream = False
    elif args.stream is True:
        stream = True
    else:
        stream = _env_bool("BAILIAN_STREAM", False)

    if not args.quiet:
        if loaded:
            print(f"[env] {loaded}", file=sys.stderr)
        else:
            print(
                f"[env] 未找到 {DEFAULT_ENV_FILE.name}，仅使用进程环境变量",
                file=sys.stderr,
            )
        src = f"--prompt ({len(prompt)} chars)" if args.prompt is not None else str(input_path)
        print(f"[app] {app_id}", file=sys.stderr)
        print(f"[in]  {src}", file=sys.stderr)
        print(f"[out] {output_path or '(stdout only)'}", file=sys.stderr)
        print(f"[stream] {stream}", file=sys.stderr)

    result = call_app(
        api_key=api_key,
        app_id=app_id,
        prompt=prompt,
        session_id=session_id,
        biz_params=biz_params,
        stream=stream,
    )

    if stream:
        text, _ = consume_stream(result, args.quiet)
    else:
        text, _ = consume_once(result, args.quiet)

    write_output(output_path, text)

    if not args.quiet and output_path is not None:
        print(f"[saved] {output_path.resolve()}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
