import logging
import re
from typing import List, Optional, Tuple

from openai import OpenAI

from app.config import get_settings
from app.services.audio import audio_to_base64_data_url

logger = logging.getLogger(__name__)

settings = get_settings()
client = OpenAI(api_key=settings.tokendance_api_key, base_url=settings.tokendance_base_url)

_TRANSCRIPTION_PROMPT = """你是一位吴语戏剧字幕专家。请仔细听下面这段音频，将其中的吴语（如上海话、苏州话、宁波话、杭州话等）台词逐句转写成原文字幕。

要求：
1. 保留原汁原味的吴语方言用词与发音对应的汉字写法。
2. 每行输出格式：[MM:SS.mmm-MM:SS.mmm] 说话人：台词
   - 时间戳采用 mm:ss.mmm 格式，是相对本段音频的时间。
   - 如果无法判断说话人，可省略“说话人：”，只输出 [时间] 台词。
3. 若听不清，在该行末尾标注 [听不清]。
4. 只输出吴语原文，不要翻译成普通话或英文。
5. 不要输出任何解释、总结或markdown代码块，只输出台词行。
"""


def _parse_timestamp(ts: str) -> Optional[float]:
    """将 mm:ss.mmm 或 ss.mmm 解析为秒。"""
    ts = ts.strip()
    parts = ts.split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        return float(parts[0])
    except ValueError:
        return None


def transcribe_audio_chunk(audio_path: str, retries: int = 3) -> str:
    """调用 mimo-v2-omni 转写单段音频，返回原始文本。对临时无可用端点做指数退避重试。"""
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
            return response.choices[0].message.content or ""
        except Exception as exc:
            last_error = exc
            err_msg = str(exc).lower()
            # 临时无可用端点 / 503 / 429 可重试
            if "no_endpoints_available" in err_msg or "503" in err_msg or "429" in err_msg:
                wait = 2 ** attempt
                logger.warning("mimo-v2-omni transient error, retrying in %ss: %s", wait, exc)
                time.sleep(wait)
                continue
            raise
    raise last_error or RuntimeError("mimo-v2-omni 转写失败")


def parse_transcription(text: str, offset_seconds: float = 0.0) -> List[Tuple[float, float, Optional[str], str]]:
    """解析转写文本，返回 (start, end, speaker, wu_text) 列表。"""
    results: List[Tuple[float, float, Optional[str], str]] = []
    # 匹配 [MM:SS.mmm-MM:SS.mmm] 说话人：台词
    pattern = re.compile(
        r"\[\s*(\d{1,2}:\d{2}\.\d+|[\d\.]+)\s*-\s*(\d{1,2}:\d{2}\.\d+|[\d\.]+)\s*\]"
        r"\s*(?:([^：:\n]+)[:：]\s*)?(.*)"
    )

    last_end = 0.0
    for line in text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        m = pattern.match(line)
        if m:
            start = _parse_timestamp(m.group(1)) or last_end
            end = _parse_timestamp(m.group(2)) or (start + 3.0)
            speaker = m.group(3)
            content = m.group(4).strip()
            if speaker:
                speaker = speaker.strip() or None
            if content:
                results.append((start + offset_seconds, end + offset_seconds, speaker, content))
            last_end = end
        else:
            # 没有时间戳的整行，作为上一句的延续或独立一句
            if results:
                prev = results[-1]
                results[-1] = (prev[0], prev[1], prev[2], prev[3] + " " + line)
            else:
                results.append((offset_seconds + last_end, offset_seconds + last_end + 3.0, None, line))
                last_end += 3.0

    return results


