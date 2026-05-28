 # Awesome Video Prompts

<div align="center">

![Prompt Count](https://img.shields.io/badge/dynamic/json?label=Prompts&query=$.prompt_count&url=https%3A%2F%2Fawesomevideoprompts.com%2Fapi%2Fstats.json)
![Models](https://img.shields.io/badge/26-Models-blue)
![Tags](https://img.shields.io/badge/210-Tags-green)

**🎬 3097 条精选提示词** | **26 个模型标签** | **210 个活跃标签**

</div>

> An open-source collection of awesome video prompts.
> 
> 开源的精彩视频提示词合集 - 为视频创作者提供灵感与参考

## 📖 项目概况

这是一个专注于收集和分享高质量AI视频生成提示词的开源项目。我们的目标是帮助视频创作者：

- **快速找到灵感**：从优秀案例中学习如何描述你想要的画面
- **提升创作效率**：参考已验证有效的提示词结构和描述方式
- **掌握技巧**：了解不同AI视频模型的提示词特点

### 支持的 AI 视频模型

Seedance 2.0 · Kling 3.0 · Kling 2.6 · Veo 3 · Grok · Hailuo · Gen 4.5 · Sora · Vidu Q3 · 以及更多

### 热门标签 (Top 20)

`cinematic` · `action` · `fantasy` · `urban` · `realistic` · `portrait` · `nature` · `multi-shot` · `dark` · `bright` · `sci-fi` · `fpv` · `drama` · `comedy` · `animal` · `futuristic` · `pov` · `car` · `anime` · `aerial`

## 🎬 使用方式

访问网站：[AwesomeVideoPrompts.com/](https://awesomevideoprompts.com/)

**主要功能：**

1. **浏览提示词** - 查看所有提示词及其生成的视频效果
2. **按标签筛选** - 根据风格、场景快速找到需要的提示词（如：`cinematic`、`fpv`、`anime`等）
3. **按模型筛选** - 查看特定AI模型的优秀案例
4. **查看原始效果** - 每条提示词都包含生成的视频预览和原始来源链接

## 📁 提示词存储结构

如果你想贡献提示词或了解源代码组织方式：

```
content/_drafts/prompts/   # 草稿内容目录（默认不进入 Git）
└── 2026-03/
    └── [id]-[slug].md

content/prompts/           # 已审核发布内容目录
├── 2025-12/               # 按月份组织
├── 2026-01/
├── 2026-02/
└── 2026-03/
    └── [id]-[slug].md

static/_drafts/prompts/    # 草稿素材目录（默认不进入 Git）
└── 2026-03/
    └── [id]-[slug]/
        ├── cover.jpg
        └── video.mp4

static/prompts/            # 已审核发布素材目录
└── 2026-03/
    └── [id]-[slug]/       # 每个提示词对应一个文件夹
        ├── cover.jpg      # 封面图片
        └── video.mp4      # 视频文件

data/
├── models.yaml           # AI模型定义
└── tags.yaml             # 标签定义
```

**单个提示词文件结构：**

```markdown
---
title: "提示词标题"
image: "/prompts/2026-01/xxx/cover.jpg"
video: "/prompts/2026-01/xxx/video.mp4"
date: "2026-01-23"
description: "完整的提示词内容..."
models: "kling26"         # 使用的AI模型 (也可以使用 model: "kling26")
tags: ["mountain", "aerial", "fpv"]  # 标签
author: "作者名"
source_url: "原始来源链接"
---
```

### 草稿审核与发布流程

当前工作流分成“草稿池”和“正式发布”两层：

1. 新抓取内容先进入 `content/_drafts/prompts/` 与 `static/_drafts/prompts/`
2. `draft: true` 的文件会出现在 md-editor 列表里供人工审核
3. 在 md-editor 中保存为 `draft: false` 后，md 和素材会一起移动到正式目录
4. Hugo 生产逻辑保持不变，只发布正式目录中的非草稿内容

这意味着：

- 草稿默认不进入 Git 管理
- 已审核内容才进入 `content/prompts/` 与 `static/prompts/`
- 如果某个正式文件被改回 `draft: true`，md-editor 仍能重新扫描出来，并在再次保存时回到草稿目录

## 🔥 冷热分离存储

Cloudflare Pages 有 20,000 文件部署限制。随着提示词积累，视频文件很快超过配额。通过 Cloudflare R2 实现媒体文件的冷热分层存储：

- **突破配额限制**：14 天前的媒体迁移到 R2，Pages 仅保留近 14 天文件
- **零成本实现**：R2 + Pages 同属 Cloudflare 生态，无额外费用
- **自动化运维**：构建时自动识别日期阈值、自动迁移，URL 无感切换

### 业务流程

```
Git Push → 构建触发
    ↓
[prebuild] 遍历 content/prompts/*.md
    ↓
识别 date 字段 → 提取年月
    ↓
├── 近 14 天文件 → 保留本地路径 → Hugo → Pages 部署
│
└── 超过 14 天文件 → 上传到 R2 → MD URL 替换为 R2 地址
                ↓
            Hugo → 生成 HTML 使用 R2 URL
                ↓
            Pages 部署（文件数大幅减少）
```

实现脚本：[migrate-cold-hot.js](scripts/migrate-cold-hot.js)

可通过环境变量 `HOT_MEDIA_DAYS` 调整热数据窗口，默认值为 `14`。

---

## 🤝 贡献提示词

欢迎提交你发现或创作的优秀提示词！只需：

1. 先在 `content/_drafts/prompts/当前月份/` 创建新的 Markdown 文件
2. 将视频和封面图放入 `static/_drafts/prompts/对应路径/`
3. 在 front matter 中保持 `draft: true`
4. 运行 `./tools/start-md-editor.sh` 进行人工审核
5. 审核通过后在 md-editor 中切换为发布状态并保存，文件会自动移动到正式目录
6. 确认内容进入 `content/prompts/` 与 `static/prompts/` 后再提交 Pull Request

---

**让AI视频创作更简单，一起发现更多可能！** 🎥✨
