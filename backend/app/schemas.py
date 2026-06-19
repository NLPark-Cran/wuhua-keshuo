from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SegmentBase(BaseModel):
    start_seconds: float
    end_seconds: float
    speaker: Optional[str] = None
    wu_text: str
    mandarin_text: Optional[str] = None
    english_text: Optional[str] = None
    notes: Optional[str] = None


class SegmentResponse(SegmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_id: int


class SceneBase(BaseModel):
    start_seconds: float
    end_seconds: float
    title: str
    background: str


class SceneResponse(SceneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_id: int


class WorkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class WorkCreate(WorkBase):
    pass


class WorkResponse(WorkBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    media_path: str
    audio_path: Optional[str] = None
    duration_seconds: Optional[float] = None
    status: str
    summary: Optional[str] = None
    characters: Optional[list] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    segments: List[SegmentResponse] = []
    scenes: List[SceneResponse] = []


class WorkListItem(WorkBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    duration_seconds: Optional[float] = None
    created_at: datetime


class WorkListResponse(BaseModel):
    items: List[WorkListItem]
    total: int


class WorkStatusResponse(BaseModel):
    id: int
    status: str
    error_message: Optional[str] = None
    segment_count: int
    scene_count: int
