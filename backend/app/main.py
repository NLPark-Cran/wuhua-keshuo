from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ensure_dirs, get_settings
from app.database import init_db
from app.routers import works

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_dirs()
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="吴语戏剧解析网页应用后端 —— 吴话可说",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境由 Nginx 统一入口，内部可放宽
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(works.router, prefix="/api/works", tags=["works"])

# 上传的媒体文件静态服务（本地调试）
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "ok", "app": settings.app_name}
