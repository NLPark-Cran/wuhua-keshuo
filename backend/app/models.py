from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Work(Base):
    __tablename__ = "works"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_path: Mapped[str] = mapped_column(String(512), nullable=False)
    audio_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending", index=True
    )  # pending / processing / completed / failed
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    characters: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    segments: Mapped[List["Segment"]] = relationship(
        "Segment", back_populates="work", cascade="all, delete-orphan", lazy="selectin"
    )
    scenes: Mapped[List["Scene"]] = relationship(
        "Scene", back_populates="work", cascade="all, delete-orphan", lazy="selectin"
    )


class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("works.id"), index=True)
    start_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    end_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    speaker: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    wu_text: Mapped[str] = mapped_column(Text, nullable=False)
    mandarin_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    english_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    work: Mapped["Work"] = relationship("Work", back_populates="segments")


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("works.id"), index=True)
    start_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    end_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    background: Mapped[str] = mapped_column(Text, nullable=False)

    work: Mapped["Work"] = relationship("Work", back_populates="scenes")
