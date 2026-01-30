# 系统架构：Awesome Video Prompts

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      Content Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Markdown    │  │ Data Files  │  │ i18n Files      │ │
│  │ /content/   │  │ /data/      │  │ /i18n/          │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
└─────────┼────────────────┼──────────────────┼──────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Build Layer (Hugo)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Hugo Gen    │  │ Taxonomy    │  │ Templates       │ │
│  │ Static Gen  │  │ System      │  │ Go Templates    │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
└─────────┼────────────────┼──────────────────┼──────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                     Output Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Static HTML │  │ JSON Index  │  │ Pagefind        │ │
│  │ /public/    │  │ Search Data │  │ Search Index    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 多语言架构详解

### 语言配置策略

**单主机模式（Single Host）**
- 默认语言 `en`：无前缀路径 `/prompts/...`
- 次要语言 `zh-cn`：前缀路径 `/zh-cn/prompts/...`
- 配置于 `hugo.toml`

```toml
defaultContentLanguage = 'en'
defaultContentLanguageInSubdir = false

[languages]
  [languages.en]
    weight = 1
    languageName = 'English'
    contentDir = 'content'  # 所有语言共享同一内容目录
  [languages.zh-cn]
    weight = 2
    languageName = '简体中文'
    contentDir = 'content'  # 共享内容，不重复文件
```

### 内容共享机制

**关键设计：不创建多语言内容文件**

```yaml
# 内容文件只存一份：content/prompts/001-100/001-20260130.md
# 所有语言版本都渲染同一文件
```

原理：
1. Hugo 的 `contentDir` 指向同一目录
2. 内容文件中的 `language` 字段默认为 `en`
3. Hugo 会在所有语言的站点中渲染该页面
4. 模板根据 `.Site.Language.Lang` 切换界面语言

### 标签多语言实现

**数据文件方式（推荐）**

```yaml
# data/tags.yaml
dreamy:
  en: dreamy
  zh-cn: 梦幻
  description_en: "Dream-like atmosphere..."
  description_zh-cn: "梦幻氛围..."

nature:
  en: nature
  zh-cn: 自然
```

**模板中显示标签**

```html
{{ $tagData := index $.Site.Data.tags . }}
{{ with $tagData }}
  {{ if eq $.Site.Language.Lang "zh-cn" }}
    {{ .zh-cn | default .en }}
  {{ else }}
    {{ .en }}
  {{ end }}
{{ else }}
  {{ . }}  <!-- 回退：显示原始 slug -->
{{ end }}
```

**优势**
- 一处修改，全局生效
- 不依赖外部插件
- 支持未来添加更多语言
- 标签 slug 保持一致（利于 URL 和筛选）

## 页面结构

### 布局层级

```
layouts/
├── _default/
│   ├── baseof.html      # 基础模板（头部、导航、底部）
│   ├── single.html      # 提示词详情页
│   ├── list.html        # 列表页（首页、标签页）
│   ├── taxonomy.html    # 单个标签页
│   └── terms.html       # 所有标签/分类页
├── index.html           # 首页（瀑布流）
└── partials/
    ├── prompt-card.html     # 提示词卡片
    ├── tag-cloud.html       # 标签云
    ├── tag-display.html     # 标签显示（带翻译）
    └── language-switcher.html  # 语言切换器
```

### 关键模板模式

**1. 基础模板结构**

```html
<!-- baseof.html -->
<!DOCTYPE html>
<html lang="{{ .Site.Language.Lang }}">
<head>
  <!-- 通用头部 -->
</head>
<body>
  {{ partial "header.html" . }}
  
  <main>
    {{ block "main" . }}{{ end }}
  </main>
  
  {{ partial "footer.html" . }}
  
  <!-- 全局 JS -->
</body>
</html>
```

**2. 提示词卡片组件**

```html
<!-- partials/prompt-card.html -->
<article class="prompt-card">
  <div class="card-image">
    <img src="{{ .Params.image }}" alt="{{ .Title }}" loading="lazy">
    <div class="card-overlay">
      <button class="copy-btn" data-prompt="{{ .Params.prompt }}">
        {{ T "copy_prompt" }}
      </button>
    </div>
  </div>
  <div class="card-content">
    <h3>{{ .Title }}</h3>
    <p>{{ .Params.description }}</p>
    <div class="card-tags">
      {{ range .Params.tags }}
        {{ partial "tag-display.html" (dict "tag" . "page" $) }}
      {{ end }}
    </div>
  </div>
</article>
```

**3. 标签显示组件**

```html
<!-- partials/tag-display.html -->
{{ $tag := .tag }}
{{ $page := .page }}
{{ $tagData := index $page.Site.Data.tags $tag }}

<a href="/tags/{{ $tag | urlize }}" class="tag">
  {{ with $tagData }}
    {{ if eq $page.Site.Language.Lang "zh-cn" }}
      {{ .zh-cn | default .en }}
    {{ else }}
      {{ .en }}
    {{ end }}
  {{ else }}
    {{ $tag }}
  {{ end }}
</a>
```

## 数据流

### 构建时数据流

```
Markdown Front Matter ──► Hugo 解析 ──► Page 对象 ──┐
                                                    │
data/tags.yaml ─────────► 加载 ───────► Site.Data ──┼──► 渲染 ──► HTML
                                                    │
i18n/*.toml ────────────► 加载 ───────► Site.T ────┘
```

### 运行时数据流（前端）

```
用户交互 ──► JS 处理 ──► 筛选/搜索 ──► DOM 更新 ──► 提示词列表

Intersection Observer ──► 触发 ──► 加载更多 ──► fetch ──► 下一页数据
```

## 关键设计决策

### 1. 为什么用 data/tags.yaml 而不是 i18n？

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| data/tags.yaml | 结构化、可扩展、支持描述字段 | 需要额外文件 | ✅ 选用 |
| i18n 文件 | 与界面翻译统一 | 扁平结构、不适合元数据 | ❌ 不适用 |
| front matter | 每个提示词自包含 | 数据重复、难维护 | ❌ 不适用 |

### 2. 为什么单主机模式？

- **SEO 友好**：默认语言无前缀，权重更高
- **部署简单**：单一代码库，单一构建流程
- **用户体验**：中文用户看到 `/zh-cn/` 明确知道是中文版本

### 3. 为什么内容不翻译？

- **准确性**：AI 提示词的精细表达难以翻译
- **复用性**：用户直接复制英文提示词使用
- **维护成本**：无需维护双语内容文件