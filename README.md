 # Awesome Video Prompts

<div align="center">

![Prompt Count](https://img.shields.io/badge/dynamic/json?label=Prompts&query=$.prompt_count&url=https%3A%2F%2Fawesomevideoprompts.com%2Fapi%2Fstats.json)
![Models](https://img.shields.io/badge/17-Models-blue)
![Tags](https://img.shields.io/badge/504-Tags-green)

**🎬 1841 条精选提示词** | **17 个模型标签** | **504 个活跃标签**

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
content/prompts/           # 提示词内容目录
├── 2025-12/              # 按月份组织
├── 2026-01/
├── 2026-02/
└── 2026-03/
    └── [id]-[slug].md    # 每个提示词一个Markdown文件

static/prompts/           # 素材文件目录
└── 2026-03/
    └── [id]-[slug]/      # 每个提示词对应一个文件夹
        ├── cover.jpg     # 封面图片
        └── video.mp4     # 视频文件

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

## 🔥 冷热分离存储

通过 Cloudflare R2 实现媒体文件的智能分层存储，优化部署效率：

- **节省 Pages 配额**：历史视频迁移到 R2，大幅减少 Pages 存储占用
- **自动化流程**：构建时自动识别、自动迁移，无需手动管理
- **无感切换**：URL 自动更新，用户访问体验不变

### 业务流程

每月新发布的提示词 → 视频在 Pages（热访问）  
历史月份提示词 → 视频自动迁移到 R2（冷存储）  
访问时自动解析对应地址，用户无感知差异

具体实现：[migrate-cold-hot.js](scripts/migrate-cold-hot.js)

---

## 🤝 贡献提示词

欢迎提交你发现或创作的优秀提示词！只需：

1. 在 `content/prompts/当前月份/` 创建新的Markdown文件
2. 将视频和封面图放入 `static/prompts/对应路径/`
3. 按照上述格式填写信息
4. 提交Pull Request

---

**让AI视频创作更简单，一起发现更多可能！** 🎥✨
