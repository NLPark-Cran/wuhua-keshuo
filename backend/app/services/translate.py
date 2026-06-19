import json
import re
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Segment

settings = get_settings()
client = OpenAI(api_key=settings.tokendance_api_key, base_url=settings.tokendance_base_url)


def _extract_json(text: str) -> Any:
    """从模型输出中提取 JSON。"""
    text = text.strip()
    # 尝试直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 尝试提取 ```json ... ```
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    # 尝试提取第一个 [ 或 { 到最后一个 ] 或 }
    start = min((text.find("["), text.find("{")))
    end = max((text.rfind("]"), text.rfind("}")))
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"无法从模型输出中提取 JSON: {text[:200]}")


def _call_qwen(messages: List[Dict[str, str]], max_tokens: int = 4096, temperature: float = 0.2) -> str:
    response = client.chat.completions.create(
        model=settings.qwen_model,
        messages=messages,
        max_completion_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""


def translate_segments(segments: List[Segment]) -> None:
    """批量翻译台词，直接修改 Segment 对象（尚未 commit）。"""
    batch_size = settings.translation_batch_size
    for i in range(0, len(segments), batch_size):
        batch = segments[i : i + batch_size]
        lines_text = "\n".join(
            f"{idx + 1}. {seg.speaker + '：' if seg.speaker else ''}{seg.wu_text}"
            for idx, seg in enumerate(batch)
        )
        prompt = f"""你是一位资深的吴语戏剧翻译。请将以下 {len(batch)} 句吴语台词逐句翻译为普通话和英文，并为涉及的文化典故添加注释。

要求：
1. 普通话翻译自然、符合戏剧语境。
2. 英文翻译适合外国观众理解。
3. 输出严格的 JSON 数组，数组长度必须等于 {len(batch)}，每项字段：mandarin, english, notes。
4. 不要输出任何解释、markdown 代码块或其他内容。
5. 必须输出完整、可解析的 JSON，不要中途截断。

台词列表：
{lines_text}
"""
        content = _call_qwen([{"role": "user", "content": prompt}], max_tokens=8192)
        translations = _extract_json(content)
        if not isinstance(translations, list):
            raise ValueError("翻译结果不是 JSON 数组")
        for seg, trans in zip(batch, translations):
            seg.mandarin_text = str(trans.get("mandarin", "")).strip() or None
            seg.english_text = str(trans.get("english", "")).strip() or None
            seg.notes = str(trans.get("notes", "")).strip() or None


def generate_scenes(segments: List[Segment]) -> List[Dict[str, Any]]:
    """根据全部台词生成场景/幕信息。"""
    if not segments:
        return []
    lines_text = "\n".join(
        f"[{seg.start_seconds:.2f}-{seg.end_seconds:.2f}] {seg.speaker + '：' if seg.speaker else ''}{seg.wu_text}"
        for seg in segments
    )
    prompt = f"""你是一位吴语戏剧研究学者。请根据以下带时间戳的台词，将全剧划分为若干“场/幕”，并为每一场输出背景介绍。

要求：
1. 划分依据：剧情转折、场景切换、新角色登场、情绪变化等。
2. 输出严格的 JSON 数组，每项字段：
   - title: 场/幕标题（简洁，10字以内）
   - start_seconds: 该场第一句台词的开始时间（秒，浮点数）
   - end_seconds: 该场最后一句台词的结束时间（秒，浮点数）
   - background: 该场背景介绍（80-150字，包含场景、人物关系、情绪氛围）
3. 第一场 start_seconds 不得超过 {segments[0].start_seconds:.2f}，最后一场 end_seconds 不得超过 {segments[-1].end_seconds:.2f}。
4. 不要输出任何解释或 markdown 代码块。

台词：
{lines_text}
"""
    content = _call_qwen([{"role": "user", "content": prompt}], max_tokens=8192)
    scenes = _extract_json(content)
    if not isinstance(scenes, list):
        raise ValueError("场景结果不是 JSON 数组")
    return scenes


def generate_summary_and_characters(
    segments: List[Segment], title: str
) -> Tuple[str, List[Dict[str, str]]]:
    """生成剧情梗概和角色表。"""
    lines_text = "\n".join(
        f"{seg.speaker + '：' if seg.speaker else ''}{seg.wu_text}"
        for seg in segments
    )
    prompt = f"""你是一位吴语戏剧研究学者。请根据以下《{title}》的台词，生成剧情梗概和角色表。

要求：
1. 输出严格的 JSON 对象，字段：
   - summary: 剧情梗概（300字以内，包含起因、经过、高潮、结局）
   - characters: 角色数组，每项包含 name（角色名）和 description（身份/性格/作用，50字以内）
2. 不要输出任何解释或 markdown 代码块。

台词：
{lines_text}
"""
    content = _call_qwen([{"role": "user", "content": prompt}], max_tokens=8192)
    data = _extract_json(content)
    if not isinstance(data, dict):
        raise ValueError("梗概结果不是 JSON 对象")
    summary = str(data.get("summary", "")).strip()
    characters = data.get("characters", [])
    if not isinstance(characters, list):
        characters = []
    return summary, characters
