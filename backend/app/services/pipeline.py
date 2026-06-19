import logging
import os
from pathlib import Path
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Scene, Segment, Work
from app.services.audio import (
    audio_to_base64_data_url,
    chunk_audio,
    cleanup_paths,
    extract_audio,
    get_media_duration,
)
from app.services.transcribe import parse_transcription, transcribe_audio_chunk
from app.services.translate import (
    generate_scenes,
    generate_summary_and_characters,
    translate_segments,
)

settings = get_settings()
logger = logging.getLogger(__name__)


def _work_dir(work_id: int) -> Path:
    return Path(settings.upload_dir) / "works" / str(work_id)


def process_work(work_id: int) -> None:
    """在后台任务中处理一部作品。"""
    # 注意：BackgroundTasks 运行在线程池中，这里新建独立 Session
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        work = db.get(Work, work_id)
        if not work:
            logger.error("Work %s not found", work_id)
            return

        work.status = "processing"
        work.error_message = None
        db.commit()

        try:
            _do_process(work, db)
            work.status = "completed"
            work.error_message = None
        except Exception as exc:
            logger.exception("Failed to process work %s", work_id)
            work.status = "failed"
            work.error_message = str(exc)
        db.commit()
    finally:
        db.close()


def _do_process(work: Work, db: Session) -> None:
    work_dir = _work_dir(work.id)
    work_dir.mkdir(parents=True, exist_ok=True)

    # 1. 提取音频
    audio_path = work_dir / "audio.mp3"
    if not work.audio_path or not Path(work.audio_path).exists():
        extract_audio(work.media_path, str(audio_path))
        work.audio_path = str(audio_path)
        db.commit()
    else:
        audio_path = Path(work.audio_path)

    # 2. 时长
    work.duration_seconds = get_media_duration(str(audio_path))
    db.commit()

    # 3. 切片并转写
    chunks_dir = work_dir / "chunks"
    chunks: List[Tuple[str, float]] = chunk_audio(
        str(audio_path), str(chunks_dir), chunk_seconds=settings.audio_chunk_seconds
    )

    raw_segments: List[Tuple[float, float, str | None, str]] = []
    for chunk_path, offset in chunks:
        logger.info("Transcribing chunk %s with offset %.2f", chunk_path, offset)
        raw_text = transcribe_audio_chunk(chunk_path)
        parsed = parse_transcription(raw_text, offset_seconds=offset)
        raw_segments.extend(parsed)

    # 4. 创建 Segment 对象
    segments = [
        Segment(
            work_id=work.id,
            start_seconds=start,
            end_seconds=end,
            speaker=speaker,
            wu_text=wu_text,
        )
        for start, end, speaker, wu_text in raw_segments
    ]

    # 5. 翻译
    if segments:
        translate_segments(segments)

    # 6. 保存 segments
    for seg in segments:
        db.add(seg)
    db.commit()

    # 7. 生成场景
    if segments:
        scenes_data = generate_scenes(segments)
        for sc in scenes_data:
            db.add(
                Scene(
                    work_id=work.id,
                    start_seconds=float(sc["start_seconds"]),
                    end_seconds=float(sc["end_seconds"]),
                    title=str(sc["title"]),
                    background=str(sc["background"]),
                )
            )

        # 8. 生成梗概和角色
        summary, characters = generate_summary_and_characters(segments, work.title)
        work.summary = summary
        work.characters = characters

    db.commit()

    # 9. 清理切片临时文件（保留原始音频和媒体）
    cleanup_paths(str(chunks_dir))
