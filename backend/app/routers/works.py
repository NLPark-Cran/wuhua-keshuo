import os
import shutil
from pathlib import Path
from typing import List

import aiofiles
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Work
from app.schemas import WorkCreate, WorkListResponse, WorkResponse, WorkStatusResponse
from app.services.pipeline import process_work

router = APIRouter()
settings = get_settings()

ALLOWED_MEDIA = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
}
MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024


def _work_dir(work_id: int) -> Path:
    return Path(settings.upload_dir) / "works" / str(work_id)


@router.post("", response_model=WorkResponse)
async def create_work(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_MEDIA:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式：{ext}")

    work = Work(title=title, description=description, media_path="", status="pending")
    db.add(work)
    db.commit()
    db.refresh(work)

    work_dir = _work_dir(work.id)
    work_dir.mkdir(parents=True, exist_ok=True)
    media_path = work_dir / f"original{ext}"

    try:
        async with aiofiles.open(media_path, "wb") as out:
            total = 0
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="文件超过最大限制")
                await out.write(chunk)
    except HTTPException:
        shutil.rmtree(work_dir, ignore_errors=True)
        db.delete(work)
        db.commit()
        raise

    work.media_path = str(media_path)
    db.commit()

    # 自动开始后台处理
    background_tasks.add_task(process_work, work.id)
    work.status = "processing"
    db.commit()
    db.refresh(work)
    return work


@router.get("", response_model=WorkListResponse)
def list_works(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    works = db.query(Work).order_by(Work.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(Work).count()
    return WorkListResponse(items=works, total=total)


@router.get("/{work_id}", response_model=WorkResponse)
def get_work(work_id: int, db: Session = Depends(get_db)):
    work = db.get(Work, work_id)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    return work


@router.post("/{work_id}/process", response_model=WorkResponse)
def trigger_process(
    work_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    work = db.get(Work, work_id)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    if work.status == "processing":
        raise HTTPException(status_code=409, detail="作品正在处理中")

    # 清空旧解析结果
    work.segments = []
    work.scenes = []
    work.summary = None
    work.characters = None
    work.error_message = None
    work.status = "processing"
    db.commit()

    background_tasks.add_task(process_work, work.id)
    db.refresh(work)
    return work


@router.get("/{work_id}/status", response_model=WorkStatusResponse)
def get_status(work_id: int, db: Session = Depends(get_db)):
    work = db.get(Work, work_id)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    return WorkStatusResponse(
        id=work.id,
        status=work.status,
        error_message=work.error_message,
        segment_count=len(work.segments),
        scene_count=len(work.scenes),
    )


@router.get("/{work_id}/media")
def serve_media(work_id: int, db: Session = Depends(get_db)):
    work = db.get(Work, work_id)
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    if not work.media_path or not Path(work.media_path).exists():
        raise HTTPException(status_code=404, detail="媒体文件不存在")

    ext = Path(work.media_path).suffix.lower()
    content_type = ALLOWED_MEDIA.get(ext, "application/octet-stream")
    return FileResponse(work.media_path, media_type=content_type, filename=f"{work.id}{ext}")
