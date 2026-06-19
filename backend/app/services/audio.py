import base64
import shutil
import subprocess
from pathlib import Path
from typing import List, Tuple


def _run_ffmpeg(args: List[str]) -> subprocess.CompletedProcess:
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args]
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def get_media_duration(path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip() or 0)


def extract_audio(input_path: str, output_path: str) -> None:
    """将视频/音频提取为 MP3（128k，双声道）。"""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "-i",
            input_path,
            "-vn",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-b:a",
            "128k",
            "-f",
            "mp3",
            output_path,
        ]
    )


def chunk_audio(input_path: str, output_dir: str, chunk_seconds: int = 300) -> List[Tuple[str, float]]:
    """按固定时长切片，返回 [(chunk_path, start_offset), ...]。"""
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    duration = get_media_duration(input_path)
    chunks: List[Tuple[str, float]] = []

    stem = Path(input_path).stem
    start = 0.0
    idx = 0
    while start < duration:
        end = min(start + chunk_seconds, duration)
        chunk_path = out_dir / f"{stem}_chunk_{idx:04d}.mp3"
        _run_ffmpeg(
            [
                "-i",
                input_path,
                "-ss",
                str(start),
                "-to",
                str(end),
                "-c",
                "copy",
                str(chunk_path),
            ]
        )
        chunks.append((str(chunk_path), start))
        start = end
        idx += 1

    return chunks


def audio_to_base64_data_url(path: str) -> str:
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:audio/mp3;base64,{data}"


def cleanup_paths(*paths: str) -> None:
    for p in paths:
        if not p:
            continue
        try:
            path = Path(p)
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            else:
                path.unlink(missing_ok=True)
        except Exception:
            pass
