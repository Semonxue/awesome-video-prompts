# 技术上下文：Awesome Video Prompts

## 技术栈

### 核心框架
| 组件 | 版本 | 用途 |
|------|------|------|
| Hugo | 0.155.0+extended | 静态网站生成器 |
| Ananke Theme | 内置 | 基础主题（已重度定制） |
| Go Templates | Hugo 内置 | 模板引擎 |

### 前端技术
| 技术 | 用途 | 说明 |
|------|------|------|
| 纯 CSS | 瀑布流布局 | CSS columns / Grid masonry |
| 原生 JS | 交互逻辑 | 无框架依赖 |
| Intersection Observer | 无限滚动 | 原生 API |
| Pagefind | 搜索 | 静态搜索索引 |

### 构建与部署
| 工具 | 用途 |
|------|------|
| GitHub Actions | CI/CD |
| GitHub Pages | 静态托管 |
| Hugo CLI | 本地开发 |

## 项目结构

```
awesome-video-prompts/
├── archetypes/              # 内容模板
│   └── default.md
├── assets/                  # 资源文件（需要 Hugo 处理）
├── content/                 # 网站内容
│   ├── _index.md           # 首页内容
│   ├── about.md            # 关于页面
│   └── prompts/            # 提示词内容
│       └── 001-100/        # 提示词批次目录
│           ├── 001-20260130.md
│           ├── 002-20260130.md
│           └── ...
├── data/                    # 数据文件
│   └── tags.yaml           # 标签多语言定义
├── i18n/                    # 翻译文件
│   ├── en.toml             # 英文界面翻译
│   └── zh-cn.toml          # 中文界面翻译
├── layouts/                 # 模板文件
│   ├── _default/           # 默认布局
│   │   ├── baseof.html     # 基础模板
│   │   ├── list.html       # 列表页
│   │   ├── single.html     # 详情页
│   │   ├── taxonomy.html   # 标签页
│   │   └── terms.html      # 分类页
│   ├── index.html          # 首页
│   └── partials/           # 可复用组件
│       ├── prompt-card.html
│       ├── tag-display.html
│       └── tag-cloud.html
├── public/                  # 构建输出（Git 忽略）
├── static/                  # 静态文件（直接复制）
├── themes/                  # 主题目录
│   └── ananke/             # Ananke 主题
├── tools/                   # 辅助工具
│   └── dl-x-videos.py      # 视频下载脚本
├── hugo.toml               # Hugo 配置
└── .github/                # GitHub 配置
    └── workflows/          # CI/CD 工作流
```

## 关键配置文件

### hugo.toml
```toml
baseURL = 'https://example.org/'
title = 'Awesome Video Prompts'
theme = 'ananke'

# 多语言配置
defaultContentLanguage = 'en'
defaultContentLanguageInSubdir = false

[languages]
  [languages.en]
    title = 'Awesome Video Prompts'
    weight = 1
    languageName = 'English'
    contentDir = 'content'      # 关键：共享内容目录
  [languages.zh-cn]
    title = '精彩视频提示词'
    weight = 2
    languageName = '简体中文'
    contentDir = 'content'      # 关键：共享内容目录

[params]
  author = 'Your Name'
  description = 'A collection of awesome video prompts'
```

### data/tags.yaml
标签元数据，支持多语言显示：
```yaml
dreamy:
  en: dreamy
  zh-cn: 梦幻
  description_en: "Dream-like atmosphere..."
  description_zh-cn: "梦幻氛围..."
```

### i18n/*.toml
界面文字翻译：
```toml
[search_placeholder]
other = "Search prompts..."

[filter_tags]
other = "Filter by tags"
```

## 内容文件格式

### 提示词 Markdown 结构
```markdown
+++
title = "Dreamy Forest Path"
description = "A mystical forest pathway..."
prompt = "A dreamy forest path winding through..."
tags = ["dreamy", "nature", "cinematic", "forest", "sunset"]
model = "Sora"
image = "https://images.unsplash.com/..."
date = "2026-01-30T14:30:00+08:00"
draft = false
+++

# Dreamy Forest Path

This prompt creates a magical forest scene...

## Key Elements
- **Atmosphere**: Dreamy, mystical...

## Best Used For
- Fantasy video sequences...
```

## 开发环境设置

### 前置要求
- Hugo Extended 0.155.0+
- Git
- Node.js（可选，用于 Pagefind 构建）

### 本地开发命令
```bash
# 启动开发服务器
hugo server -D --bind 127.0.0.1 -p 1313

# 构建站点
hugo --minify

# 构建并包含草稿
hugo -D
```

### Pagefind 搜索集成
```bash
# 安装 Pagefind
npm install -g pagefind

# 构建 Hugo 后生成搜索索引
hugo
npx pagefind --site public

# 或整合到构建脚本
hugo && npx pagefind --site public
```

## 依赖管理策略

### 外部依赖（最小化原则）

**允许使用的依赖：**
- **Google Fonts**（通过 CDN）- 字体加载
- **Pagefind**（可选）- 搜索功能
- **Unsplash API** - 示例图片

**避免引入的依赖：**
- ❌ jQuery（使用原生 JS）
- ❌ Bootstrap/Tailwind（使用自定义 CSS）
- ❌ Masonry.js（使用 CSS columns）
- ❌ infinite-scroll.js（使用 Intersection Observer）
- ❌ React/Vue/Angular（静态页面无需框架）

### CSS 架构

**布局策略：**
```css
/* 瀑布流 - CSS Columns */
.masonry-grid {
  columns: 4 300px;        /* 4 列，最小宽度 300px */
  column-gap: 1.5rem;
}

.masonry-item {
  break-inside: avoid;     /* 防止卡片跨列断开 */
  margin-bottom: 1.5rem;
}

/* 或 CSS Grid Masonry（现代浏览器） */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 10px;    /* 密集布局 */
}
```

## 性能优化

### 图片优化
- 使用 Unsplash 的图片参数控制尺寸（`?w=800&h=600&fit=crop`）
- 添加 `loading="lazy"` 属性
- 使用 `srcset` 响应式图片（未来优化）

### 构建优化
- Hugo 的 `--minify` 标志压缩 HTML/CSS/JS
- 启用 Hugo 的资源指纹（`resources.Fingerprint`）用于缓存破坏

### 运行时优化
- 无限滚动分批加载，减少首屏 DOM 节点
- 使用 `Intersection Observer` 替代滚动事件监听

## 部署配置

### GitHub Pages 部署
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.155.0'
          extended: true
      - name: Build
        run: hugo --minify
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 故障排除

### 常见问题

**1. 构建错误：`function "jsEscape" not defined`**
- 原因：Hugo 模板中使用了未定义的函数
- 解决：检查模板语法，使用 `jsonify` 或手动转义

**2. 标签显示为英文**
- 原因：data/tags.yaml 中缺少对应标签的定义
- 解决：在 tags.yaml 中添加标签的多语言映射

**3. 多语言页面 404**
- 原因：语言配置错误，contentDir 不一致
- 解决：确保所有语言的 contentDir 指向同一目录