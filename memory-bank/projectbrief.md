# 项目概述：Awesome Video Prompts

## 项目目标
构建一个基于 Hugo 的静态网站，用于展示和分享视频生成提示词（Video Prompts），支持 AI 视频生成工具（如 Sora、Runway、Pika、Kling 等）的提示词收藏与检索。

## 核心需求

### 1. 内容定位
- **提示词语言**：英文为主（提示词内容本身不翻译）
- **标签语言**：英文为主，但显示支持中英双语
- **界面语言**：支持多语言（默认英文，支持简体中文）

### 2. 技术约束
- **框架**：Hugo 静态网站生成器
- **主题**：基于 Ananke 主题定制
- **依赖限制**：尽量使用 Hugo 原生功能，避免过多外部 JS/CSS 库
  - 搜索：Pagefind（Hugo 官方推荐的静态搜索）
  - 无限滚动：原生 Intersection Observer + fetch
  - 瀑布流：纯 CSS multi-column 或 grid masonry（无需 Masonry.js）

### 3. 多语言架构
- **默认语言**：English (en)，URL 无语言前缀
- **支持语言**：English (en) + Simplified Chinese (zh-cn)
- **URL 结构**：
  - 英文：`/prompts/001-20260130/`（根路径，无语言前缀）
  - 中文：`/zh-cn/prompts/001-20260130/`
- **单主机模式**（single-host）：避免多主机部署复杂性

### 4. 内容管理
- 提示词文件：`content/prompts/001-100/*.md`
- 标签元数据：`data/tags.yaml`（集中定义标签的多语言显示名称）
- 界面翻译：`i18n/en.toml`、`i18n/zh-cn.toml`

## 项目边界

### 在范围内
- 首页瀑布流展示提示词卡片
- 标签筛选与搜索功能
- 提示词详情页
- 多语言界面支持
- 响应式设计

### 不在范围内（未来扩展）
- 用户登录/账户系统
- 提示词评分/评论
- 动态内容提交（当前使用静态文件）
- 提示词内容本身的翻译

## 成功指标
- 网站构建时间 < 30 秒（100+ 提示词）
- Lighthouse 性能评分 > 90
- 支持静态托管（GitHub Pages/Cloudflare Pages）