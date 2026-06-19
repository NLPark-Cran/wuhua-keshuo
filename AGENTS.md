# 吴话可说 — Agent 开发指南

## 项目概述

- **名称**：吴话可说（WuHuaKeShuo）
- **定位**：吴语戏剧解析网页应用。用户上传吴语戏剧音视频，后端用 AI 解析出：
  - 吴语原文台词
  - 普通话翻译
  - 英文翻译
  - 场/幕背景
  - 剧情梗概
  - 角色介绍
- **前端**：随播放进度同步高亮显示三语字幕，提供场景、梗概、台词侧边栏。
- **域名**：https://wu.hub.tt2.li
- **仓库**：https://github.com/NLPark-Cran/wuhua-keshuo

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + shadcn/ui (Base UI / Radix) |
| 字体 | Noto Sans SC（正文）、Noto Serif SC（标题） |
| 后端 | FastAPI + SQLAlchemy 2.0 + SQLite |
| 媒体 | ffmpeg + pydub |
| AI | mimo-v2.5（TokenDance，音频→吴语原文）+ qwen3.7-max（TokenDance，翻译/背景/角色/梗概） |
| 部署 | Nginx + systemd + Let's Encrypt |

## 重要路径

```
/root/workspace/test0607/test5/
├── backend/app/
│   ├── main.py              # FastAPI 入口
│   ├── routers/works.py     # REST API：上传、CRUD、状态、媒体流
│   ├── services/
│   │   ├── audio.py         # ffmpeg 音频提取/切片
│   │   ├── transcribe.py    # mimo-v2.5 吴语转写
│   │   ├── translate.py     # qwen3.7-max 翻译/场景/梗概/角色
│   │   └── pipeline.py      # 异步处理流水线
│   └── scripts/seed_demo.py # 插入示例数据
├── frontend/
│   ├── app/                 # 页面路由
│   │   ├── page.tsx         # 首页（Hero + 上传 + 列表）
│   │   └── works/[id]/page.tsx # 播放/解析页
│   ├── components/          # UI 组件
│   │   ├── site-header.tsx
│   │   ├── footer.tsx
│   │   ├── hero.tsx
│   │   ├── upload-form.tsx
│   │   ├── work-list.tsx
│   │   ├── work-detail.tsx
│   │   ├── media-player.tsx
│   │   ├── scene-panel.tsx
│   │   ├── summary-panel.tsx
│   │   └── segment-list.tsx
│   ├── lib/api.ts           # 前端 API 客户端 + 工具函数
│   └── app/globals.css      # 主题色、字体、Tailwind 变量
├── deploy/                  # Nginx / systemd 配置
├── uploads/                 # 运行时上传目录
└── data/                    # SQLite 数据库目录
```

## 设计系统

- **视觉风格**：剧院 × 新中式。暖纸色背景、宫墙红主色、衬线标题。
- **Light 主题**：
  - 背景 `#F7F5F2`
  - 卡片 `#FFFFFF`
  - 主色 `#B83A2F`（朱红）
  - 文字 `#1A1A1A` / 次要 `#5C5C5C`
  - 边框 `#E8E4DF`
- **Dark 主题**：
  - 背景 `#121212`
  - 卡片 `#1E1E1E`
  - 主色 `#D96C5F`
- **组件规范**：
  - 卡片使用 `border-border/60 shadow-sm rounded-2xl`。
  - 标题使用 `font-serif`。
  - 按钮、输入框尽量使用 shadcn/ui 组件。
  - 重要卡片头部可带 `bg-muted/30`。

## 开发规范

### Python（后端）

- 使用 Python 3.11+ 类型注解。
- 配置通过 `pydantic-settings` 读取 `.env`。
- 模型用 SQLAlchemy 2.0 声明式（`Mapped` / `mapped_column`）。
- 路由返回 Pydantic schema。
- AI 调用使用 OpenAI SDK，统一 `base_url=https://tokendance.space/gateway/v1`。
- 长耗时处理放在 `FastAPI BackgroundTasks` 中，避免阻塞响应。

### TypeScript / React（前端）

- App Router 页面默认可为 Server Component；交互组件标记 `"use client"`。
- API 请求统一封装在 `lib/api.ts`。
- 数据获取使用 `swr`，并设置合理的 `refreshInterval` 轮询状态。
- 组件使用函数声明式，props 接口命名 `XxxProps`。
- 避免在 Client Component 中直接 import server-only 模块。

## 环境变量

### 后端 `/etc/wuhua/backend.env`（生产）或 `backend/.env`（开发）

```env
TOKENDANCE_API_KEY=sk-...
TOKENDANCE_BASE_URL=https://tokendance.space/gateway/v1
BASE_URL=https://wu.hub.tt2.li
```

### 前端 `frontend/.env.local`

```env
API_BASE_URL=http://127.0.0.1:8005
```

只在 SSR Server Component 中用到；浏览器端通过 Nginx/Next.js rewrite 访问 `/api/*`。

## 常用命令

```bash
# 后端开发
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload

# 前端开发
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # 生成 .next/standalone/server.js

# 插入示例数据
PYTHONPATH=. python backend/scripts/seed_demo.py

# 服务管理
systemctl status wuhua-backend
systemctl status wuhua-frontend

# Nginx
nginx -t
systemctl reload nginx
```

## 部署流程

1. `git pull` 更新代码。
2. 若后端依赖有变，重装 `pip install -r backend/requirements.txt`。
3. 若前端依赖/配置有变，执行 `cd frontend && npm install && npm run build`。
4. `systemctl restart wuhua-backend wuhua-frontend`。
5. `nginx -t && systemctl reload nginx`。

## 已知问题与注意事项

- `mimo-v2.5` 在 TokenDance 上偶尔返回 503「无可用端点」，后端已实现指数退避重试。
- 长音频默认按 5 分钟切片；模型时间戳为近似值。
- 上传文件大小限制由 Nginx `client_max_body_size` 与后端 `MAX_FILE_SIZE_MB` 共同控制。
- `.env`、`.env.local`、`uploads/`、`data/` 不要提交到 Git。
