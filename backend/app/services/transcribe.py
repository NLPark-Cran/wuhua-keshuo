import logging
import re
from typing import List, Optional, Tuple

from openai import OpenAI

from app.config import get_settings
from app.services.audio import audio_to_base64_data_url

settings = get_settings()
client = OpenAI(api_key=settings.tokendance_api_key, base_url=settings.tokendance_base_url)
logger = logging.getLogger(__name__)

_TRANSCRIPTION_PROMPT = """你是一位吴语戏剧字幕专家。请仔细听下面这段音频，将其中的吴语（如温州话、上海话、苏州话、宁波话、杭州话等）台词逐句转写成原文字幕。

要求：
1. 保留原汁原味的吴语方言用词与发音对应的汉字写法。
2. 每行输出格式：[MM:SS.mmm-MM:SS.mmm] 说话人：台词
   - 时间戳采用 mm:ss.mmm 格式，是相对本段音频的时间。
   - 如果无法判断说话人，可省略“说话人：”，只输出 [时间] 台词。
3. 若听不清，在该行末尾标注 [听不清]。
4. 只输出吴语原文，不要翻译成普通话或英文。
5. 不要输出任何解释、总结或 markdown 代码块，只输出台词行。
6. 每一句台词必须单独一行，不要合并多句到同一行。"""


_TIMESTAMP_RE = re.compile(
    r"\[\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*[-~～]\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*\]"
)

_SPEAKER_RE = re.compile(r"^([^：:\n]{1,20})[：:]\s*(.*)$")


def _parse_timestamp(ts: str) -> Optional[float]:
    """将 mm:ss.mmm 或 ss.mmm 解析为秒。"""
    ts = ts.strip()
    if ":" in ts:
        parts = ts.split(":")
        if len(parts) == 2:
            try:
                return int(parts[0]) * 60 + float(parts[1])
            except ValueError:
                return None
        if len(parts) == 3:
            try:
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
            except ValueError:
                return None
    try:
        return float(ts)
    except ValueError:
        return None


def _clean_text(text: str) -> str:
    """清理台词文本：去除首尾空白、 markdown 标记等。"""
    text = text.strip()
    # 去除前后可能的 markdown 粗体
    text = re.sub(r"^\*+|\*+$", "", text)
    # 去除 [听不清] 等标记保留原样（已在文本中）
    return text


def parse_transcription(text: str, offset_seconds: float = 0.0) -> List[Tuple[float, float, Optional[str], str]]:
    """解析转写文本，返回 (start, end, speaker, wu_text) 列表。"""
    text = text.strip()
    if not text:
        return []

    logger.debug("Parsing transcription (offset=%.2f):\n%s", offset_seconds, text[:2000])

    results: List[Tuple[float, float, Optional[str], str]] = []

    # 策略 1：按行匹配时间戳
    lines = text.splitlines()
    current_block: Optional[dict] = None

    def flush_block():
        nonlocal current_block
        if not current_block:
            return
        content = _clean_text(" ".join(current_block["lines"]))
        if content:
            results.append((
                current_block["start"] + offset_seconds,
                current_block["end"] + offset_seconds,
                current_block["speaker"],
                content,
            ))
        current_block = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            flush_block()
            continue

        ts_match = _TIMESTAMP_RE.match(line)
        if ts_match:
            flush_block()
            start = _parse_timestamp(ts_match.group(1))
            end = _parse_timestamp(ts_match.group(2))
            if start is None or end is None:
                continue
            if end < start:
                end = start + 3.0
            remaining = line[ts_match.end():].strip()
            speaker: Optional[str] = None
            content = remaining
            sp_match = _SPEAKER_RE.match(remaining)
            if sp_match:
                speaker = sp_match.group(1).strip() or None
                content = sp_match.group(2).strip()
            current_block = {
                "start": start,
                "end": end,
                "speaker": speaker,
                "lines": [content] if content else [],
            }
        else:
            # 当前行没有新时间戳，合并到当前块
            if current_block is not None:
                current_block["lines"].append(line)
            else:
                # 没有时间戳的孤立行，作为独立一句估算时间
                estimated_start = offset_seconds + (len(results) * 4.0)
                results.append((estimated_start, estimated_start + 4.0, None, _clean_text(line)))

    flush_block()

    # 策略 2：如果策略 1 没解析出任何带时间戳的片段，尝试更宽松的搜索
    if not results:
        logger.warning("No timestamped lines found, falling back to loose extraction")
        for m in _TIMESTAMP_RE.finditer(text):
            start = _parse_timestamp(m.group(1))
            end = _parse_timestamp(m.group(2))
            if start is None or end is None:
                continue
            # 取时间戳后到下一个时间戳（或结尾）之间的文本
            slice_start = m.end()
            next_match = _TIMESTAMP_RE.search(text, m.end())
            slice_end = next_match.start() if next_match else len(text)
            snippet = text[slice_start:slice_end].strip()
            speaker = None
            content = snippet
            sp_match = _SPEAKER_RE.match(snippet)
            if sp_match:
                speaker = sp_match.group(1).strip() or None
                content = sp_match.group(2).strip()
            if content:
                results.append((start + offset_seconds, end + offset_seconds, speaker, _clean_text(content)))

    # 后处理：排序、修复时间、去重
    results.sort(key=lambda x: x[0])
    deduped: List[Tuple[float, float, Optional[str], str]] = []
    for seg in results:
        start, end, speaker, content = seg
        # 跳过过短的噪声
        if len(content) < 2:
            continue
        # 合并连续完全重复的文本
        if deduped and deduped[-1][3] == content:
            prev = deduped[-1]
            deduped[-1] = (prev[0], end, prev[2] or speaker, content)
            continue
        # 如果 end 早于 start，给一个默认时长
        if end <= start:
            end = start + 4.0
        # 限制单句最大时长 60s
        if end - start > 60:
            end = start + 30.0
        deduped.append((start, end, speaker, content))

    logger.info("Parsed %d segments from transcription (offset=%.2f)", len(deduped), offset_seconds)
    return deduped


def transcribe_audio_chunk(audio_path: str, retries: int = 3) -> str:
    """调用 mimo-v2.5 转写单段音频，返回原始文本。对临时无可用端点做指数退避重试。"""
    import time

    data_url = audio_to_base64_data_url(audio_path)
    last_error = None
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=settings.mimo_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_audio", "input_audio": {"data": data_url}},
                            {"type": "text", "text": _TRANSCRIPTION_PROMPT},
                        ],
                    }
                ],
                max_completion_tokens=4096,
                temperature=0.0,
            )
            raw = response.choices[0].message.content or ""
            logger.info("Transcribed chunk %s -> %d chars", audio_path, len(raw))
            return raw
        except Exception as exc:
            last_error = exc
            err_msg = str(exc).lower()
            # 临时无可用端点 / 503 / 429 可重试
            if "no_endpoints_available" in err_msg or "503" in err_msg or "429" in err_msg:
                wait = 2 ** attempt
                logger.warning("mimo-v2.5 transient error, retrying in %ss: %s", wait, exc)
                time.sleep(wait)
                continue
            raise
    raise last_error or RuntimeError("mimo-v2.5 转写失败")
