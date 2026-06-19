# 吴话可说 · WuHuaKeShuo

> 吴语戏剧解析网页应用：上传一段吴语戏剧音视频，自动解析出 **吴语原文**、**普通话翻译**、**英文翻译**，并随播放进度同步显示“舞台字幕”，同时提供剧情梗概、场景背景与角色介绍。

## ✨ 功能特性

- 🎭 **上传解析**：支持 `mp4 / mov / avi / mkv / mp3 / wav / flac / m4a`。
- 📝 **三语字幕**：播放时同步高亮显示吴语原文、普通话、English。
- 🎬 **场景背景**：AI 自动划分场/幕并生成背景介绍。
- 👤 **角色介绍**：自动提取剧中人物并给出身份说明。
- 📖 **剧情梗概**：一键生成全剧故事概要。
- 🔍 **台词跳转**：点击场景或台词即可跳转到对应时间。
- 🌓 **明暗主题**：支持剧院暗色模式。

## 🏗️ 技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** | 现代 App Router、SSR、高性能媒体播放器与字幕渲染 |
| 字体 | **Noto Sans SC + Noto Serif SC** | 正文用无衬线，标题用衬线，呈现新中式剧场感 |
| 后端 | **FastAPI + SQLAlchemy 2.0 + SQLite** | Python 异步 API，零额外数据库服务 |
| 媒体处理 | **ffmpeg + pydub** | 音频提取、切片 |
| AI 转写 | **mimo-v2.5（TokenDance）** | 多模态音频输入，输出吴语原文 |
| AI 翻译 / 内容 | **qwen3.7-max（TokenDance）** | 普通话/英文翻译、场景背景、梗概、角色 |
| 部署 | **Nginx + systemd + Let's Encrypt** | 域名 `wu.hub.tt2.li` |

## 🎨 设计说明

- 视觉主题围绕「暖纸 × 宫墙红」，营造剧场感与中式美学。
- 首页包含 Hero 区域、特性卡片、拖拽上传与剧目列表。
- 播放页采用沉浸式播放器 + 右侧信息面板（场景 / 梗概 / 台词）。
- 支持明暗主题切换（按 `D` 键或点击右上角图标）。

## 📁 目录结构

```
.
├── backend/           # FastAPI 后端 + AI 解析核心（Python）
│   ├── app/
│   │   ├── routers/works.py      # REST API
│   │   └── services/             # 音频处理、转写、翻译、pipeline
│   ├── scripts/seed_demo.py      # 示例数据
│   └── .env.example
├── frontend/          # Next.js 前端（TypeScript/React）
│   ├── app/                      # 页面路由
│   ├── components/               # UI 组件
│   └── lib/api.ts                # API 客户端
├── deploy/            # Nginx / systemd 配置
├── uploads/           # 上传的媒体文件（运行时）
└── data/              # SQLite 数据库（运行时）
```

## 🚀 本地开发

### 1. 环境要求

- Python 3.11+
- Node.js 20+
- ffmpeg

### 2. 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 编辑 .env，填入 TokenDance API Key
cp .env.example .env

# 启动
uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```

### 3. 前端

```bash
cd frontend
npm install
npm run build
PORT=3005 npm run start
```

打开 http://127.0.0.1:3005 即可使用。

### 4. 插入示例数据（不调用 AI）

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. python scripts/seed_demo.py
```

## 🌐 生产部署

已在 `deploy/` 中提供 Nginx 与 systemd 配置模板，步骤如下：

1. 将 `deploy/wuhua-backend.service` 与 `deploy/wuhua-frontend.service` 放入 `/etc/systemd/system/`。
2. 创建 `/etc/wuhua/backend.env` 写入 `TOKENDANCE_API_KEY`。
3. 构建前端：
   ```bash
   cd frontend && npm install && npm run build
   ```
4. 启动服务：
   ```bash
   systemctl daemon-reload
   systemctl enable --now wuhua-backend wuhua-frontend
   ```
5. 配置 Nginx（`deploy/nginx-wu.hub.tt2.li.conf`），并申请证书：
   ```bash
   certbot --nginx -d wu.hub.tt2.li
   ```

## ⚠️ 已知限制

- `mimo-v2.5` 偶尔会出现“无可用端点”的临时 503 错误，后端已实现指数退避重试。
- 长音频会自动切片为 5 分钟一段，模型返回的时间戳为近似值。
- 首次解析一部完整戏剧可能需要数分钟并消耗较多 Token，请留意 TokenDance 额度。

## 📜 License

MIT © 2026 吴话可说
