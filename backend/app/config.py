import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # AI
    tokendance_api_key: str = ""
    tokendance_base_url: str = "https://tokendance.space/gateway/v1"
    mimo_model: str = "mimo-v2.5"
    qwen_model: str = "qwen3.7-max"

    # App
    app_name: str = "吴话可说"
    debug: bool = False
    base_url: str = "https://wu.hub.tt2.li"

    # Storage
    database_url: str = f"sqlite:///{PROJECT_ROOT.parent / 'data' / 'wuhua.db'}"
    upload_dir: str = str(PROJECT_ROOT.parent.parent / "uploads")

    # Processing
    audio_chunk_seconds: int = 300  # 5 minutes
    max_file_size_mb: int = 2048
    translation_batch_size: int = 20

    class Config:
        env_file = PROJECT_ROOT / ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def ensure_dirs() -> None:
    settings = get_settings()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.database_url.replace("sqlite:///", "")).parent.mkdir(parents=True, exist_ok=True)
