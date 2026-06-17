# Awesome Video Prompts — Next.js + Cloudflare 部署指南

> 本项目从 Hugo 静态站升级到 Next.js 15 + Cloudflare Workers + D1 + R2
> 分支：`nextjs-migration` | 目标：零停机迁移

---

## 目录

1. [架构概览](#架构概览)
2. [Cloudflare 后台配置（图解）](#cloudflare-后台配置图解)
   - [2.1 创建 Cloudflare Workers](#21-创建-cloudflare-workers)
   - [2.2 创建 D1 数据库](#22-创建-d1-数据库)
   - [2.3 创建 R2 Bucket](#23-创建-r2-bucket)
   - [2.4 创建 KV Namespace（可选）](#24-创建-kv-namespace可选)
   - [2.5 配置 wrangler.toml](#25-配置-wranglertoml)
3. [安装与本地开发](#安装与本地开发)
4. [数据迁移](#数据迁移)
5. [部署到 Cloudflare](#部署到-cloudflare)
6. [测试](#测试)
7. [SEO 迁移（旧 Hugo URL → 新 Next.js）](#seo-迁移)
8. [监控与成本](#监控与成本)
9. [回滚方案](#回滚方案)

---

## 架构概览

```
用户请求
   ↓
Cloudflare CDN / Edge Network
   ↓
┌──────────────────────────────────────────────┐
│  Cloudflare Workers + Pages                   │
│  ┌─────────────────────────────────────────┐ │
│  │  Next.js 15 App Router (OpenNext)       │ │
│  │  ├── SSR / ISR (revalidate=3600)        │ │
│  │  ├── API Routes (/api/prompts)           │ │
│  │  └── i18n Routing (/en /zh /ja)         │ │
│  └─────────────────────────────────────────┘ │
│         ↓                                    │
│  ┌──────────────┬──────────┬──────────────┐  │
│  │   D1 (SQLite)│   R2     │   KV (缓存)  │  │
│  │  提示词数据   │  视频/封面│  热门数据    │  │
│  │  5GB 免费     │  10GB 免费│  免费         │  │
│  └──────────────┴──────────┴──────────────┘  │
└──────────────────────────────────────────────┘
```

**免费额度消耗：**
- D1：5GB 存储 + 5M 读/天 + 10w 写/天
- R2：10GB 存储 + 10M 读请求/月
- Workers：10w 请求/天
- Pages：500 次构建/月，无限带宽

---

## Cloudflare 后台配置（图解）

### 2.1 创建 Cloudflare Workers

> **目的**：运行 Next.js App Router + API Routes

**操作步骤：**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages**
3. 点击 **创建应用程序**
4. 选择 **创建 Worker**
5. 名称填写：`awesome-video-prompts`
6. 点击 **部署**
7. **立即编辑代码** → 随便写个 `return new Response('ok')` → 部署
8. **之后在项目里用 `wrangler deploy` 覆盖**，这里只是建个入口

> **注意**：Workers 不是必须的 —— 如果只用 **Pages + OpenNext**，Workers 会自动被 OpenNext 生成出来，这步可以跳过。**建议跳过，直接到 Pages**。

---

### 2.2 创建 D1 数据库

> **目的**：存储提示词数据（替代 Hugo MD 文件）

**操作步骤：**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **D1 数据库**
3. 点击 **创建数据库**
4. 填写：
   - **数据库名称**：`prompts-db`
   - **区域**：选择离你用户最近的（默认自动）
5. 点击 **创建**
6. **创建完成后，页面会显示 database_id，复制它**，格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
7. 同时复制 **账户 ID**（右侧用户头像 → 概况 → 账户 ID）

> **D1 创建后默认没有表**，需要用迁移脚本初始化（见 [数据迁移](#数据迁移)）

---

### 2.3 创建 R2 Bucket

> **目的**：存储视频 + 封面文件（替代 Cloudflare Pages 内置存储）

**操作步骤：**

1. 左侧菜单 → **R2 对象存储**
2. 点击 **创建存储桶**
3. **存储桶名称**：`awesome-video-prompts-media`
4. **区域**：默认即可
5. 点击 **创建**
6. **添加公网访问**：点击存储桶 → **设置** → **允许访问**
7. 选择 **自定义域** 或直接用 **R2.dev 公开 URL**
8. 勾选 **启用公共访问**
9. 域名填写：`media.awesomevideoprompts.com`（可选，也可以直接用 `*.r2.dev` 格式）

> **已有 R2 bucket？** 直接用现有的，只需要在 wrangler.toml 里改名字

---

### 2.4 创建 KV Namespace（可选）

> **目的**：缓存热门提示词标签列表，提升二次访问速度
> **跳过也可以**：API route 里用了 Cloudflare Cache API（内置缓存），KV 不是必须的。

**操作步骤：**

1. 左侧菜单 → **Workers & Pages** → **KV**
2. 点击 **创建命名空间**
3. 名称：`awesome-video-prompts-cache`
4. 点击 **创建**
5. 复制 **命名空间 ID**

---

### 2.5 配置 wrangler.toml

创建项目根目录的 `wrangler.toml`，填入上一步获取的信息：

```toml
name = "awesome-video-prompts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# ===== D1 数据库 =====
[[d1_databases]]
binding = "DB"                    # 代码里用 env.DB 访问
database_name = "prompts-db"      # 你的数据库名称
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 替换这里

# ===== R2 Bucket =====
[[r2_buckets]]
binding = "MEDIA"                 # 代码里用 env.MEDIA 访问
bucket_name = "awesome-video-prompts-media"  # ← 替换为你的 bucket 名称

# ===== KV（可选）=====
[[kv_namespaces]]
binding = "CACHE"                # 代码里用 env.CACHE 访问
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"    # ← 替换 KV ID

# ===== 环境变量 =====
[vars]
NEXT_PUBLIC_SITE_URL = "https://awesomevideoprompts.com"
```

> **获取 D1 database_id**：
> ```bash
> wrangler d1 list
> # 输出：name: prompts-db, id: xxxxxxxx-... ← 复制这个
> ```

---

## 安装与本地开发

### 安装依赖

```bash
# 使用 Next.js 专用 package.json（和 Hugo 的 package.json 分开）
mv package.next.json package.json
npm install

# 安装测试依赖
npm install -D vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium
```

### 配置本地环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入：

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token          # Dashboard → 右上角头像 → API Token → 创建令牌
CLOUDFLARE_D1_DATABASE_ID=your_database_id    # 从 wrangler d1 list 获取
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=change_me_to_random_string
```

> **创建 Cloudflare API Token**：
> Dashboard → 右上角头像 → API Token → 创建自定义令牌
> 权限：Account: D1 读/写, Pages 读/写, Account Settings 读

### 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:3000/zh
# 访问 http://localhost:3000/ja
```

---

## 数据迁移

### 步骤 1：本地建 D1 + 跑 schema

```bash
# 创建本地 D1（测试用）
wrangler d1 create prompts-db --local

# 运行 schema（会自动建表 + FTS）
wrangler d1 execute prompts-db --local --file=./drizzle/migrations/0000_init.sql

# 验证
wrangler d1 execute prompts-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 步骤 2：试运行迁移脚本（看预览）

```bash
npx tsx scripts/import-md-to-d1.ts --local --dry-run
```

预期输出：
```
🔍 试运行预览（前 5 条）：

  [1] en | cinematic-mountain
       title: Cinematic Mountain Flight...
       tags: cinematic, mountain, fpv | models: kling26

  [2] zh | cyberpunk-city
       title: 赛博朋克城市夜景...
       tags: urban, sci-fi, night, neon | models: veo3, sora

语言分布: {"en":2100,"zh":1200,"ja":524}
```

### 步骤 3：执行迁移

```bash
npx tsx scripts/import-md-to-d1.ts --local
```

### 步骤 4：远程 D1（上线前）

```bash
# 创建远程 D1（仅首次）
wrangler d1 create prompts-db --remote

# 运行 schema
wrangler d1 execute prompts-db --remote --file=./drizzle/migrations/0000_init.sql

# 执行迁移
npx tsx scripts/import-md-to-d1.ts --remote
```

---

## 部署到 Cloudflare

### 方式一：GitHub Actions（推荐，自动化）

#### 第一步：在 GitHub 仓库设置 Secrets

仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret 名称 | 值来源 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 账户 ID（Dashboard 右上角） |
| `CLOUDFLARE_D1_DATABASE_ID` | `wrangler d1 list` 获取 |
| `NEXT_PUBLIC_SITE_URL` | `https://awesomevideoprompts.com` |

#### 第二步：创建 GitHub Actions 工作流

```bash
mkdir -p .github/workflows
```

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, nextjs-migration]
  workflow_dispatch:   # 允许手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: awesome-video-prompts
          directory: .open-next/assets
          wranglerVersion: '3'
          # 自动注入 D1/R2 环境变量
          secrets: |
            {
              "NEXT_PUBLIC_SITE_URL": "${{ secrets.NEXT_PUBLIC_SITE_URL }}",
              "CLOUDFLARE_D1_DATABASE_ID": "${{ secrets.CLOUDFLARE_D1_DATABASE_ID }}"
            }
```

#### 第三步：推送触发

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
git push origin nextjs-migration
# 在 GitHub 上创建 PR → 合并到 main → 自动部署
```

### 方式二：手动部署

```bash
npm install
npm test          # 运行单元测试
npm run build     # OpenNext 构建
wrangler pages deploy .open-next/assets --project-name=awesome-video-prompts
```

---

## 测试

### 单元测试

```bash
# 运行所有单元测试
npm test

# 带覆盖率报告
npm run test:coverage

# 监听模式（开发时）
npm run test:watch
```

**覆盖率目标：**
- statements: 90%+
- functions: 90%+
- branches: 80%+
- lines: 90%

### E2E 测试

```bash
# 启动开发服务器
npm run dev &

# 运行 E2E
npx playwright test

# 带 UI 界面
npx playwright test --ui
```

### 测试文件清单

| 文件 | 覆盖范围 |
|---|---|
| `src/lib/parse-md.test.ts` | MD 解析工具：locale / slug / date / front matter |
| `src/lib/prompts.test.ts` | rowToCard 类型转换 |
| `src/i18n/request.test.ts` | i18n 配置 |
| `src/db/schema.test.ts` | Drizzle schema 类型 |
| `src/db/schema.sql.test.ts` | SQL 语法验证 + wrangler.toml 配置 |
| `scripts/import-md-to-d1.test.ts` | 迁移脚本完整流程（mock）|
| `e2e/basic.spec.ts` | 首页加载 / 导航 / 筛选 / API / SEO |

---

## SEO 迁移

### URL 变化

| 旧（Hugo）| 新（Next.js）|
|---|---|
| `/prompts/2026-03/001-slug/` | `/en/prompts/2026-03/001-slug/` |
| `/zh-cn/prompts/2026-03/001-slug/` | `/zh/prompts/2026/03/001-slug/` |
| `/ja/prompts/2026-03/001-slug/` | `/ja/prompts/2026-03/001-slug/` |
| `/tags/cinematic/` | `/en?tag=cinematic` |
| `/models/kling26/` | `/en?model=kling26` |

### Cloudflare Pages 重定向配置

在 Cloudflare Dashboard → Pages → 你的项目 → **重定向规则**：

```
# 规则 1：zh-cn 前缀 → zh
来源: /zh-cn/*
目标: /zh/:path
类型: 301 永久重定向

# 规则 2：英文 /prompts/ → /en/prompts/
来源: /prompts/*
目标: /en/prompts/:path
类型: 301 永久重定向

# 规则 3：旧 Tags 页
来源: /tags/*
目标: /en?tag=:tag
类型: 301
```

> **上线流程**：
> 1. 新站先以子域名部署：`next.awesomevideoprompts.com`
> 2. 验证所有 URL 正常
> 3. 确认无误后，把域名解析切到新站
> 4. 在 Cloudflare Pages 设置重定向规则

---

## 监控与成本

### Cloudflare Dashboard 监控

- **Workers** → 查看请求量、CPU 时间、错误率
- **D1** → 查看读/写操作量
- **R2** → 查看存储使用量 + 读请求数
- **Pages** → 查看构建次数、带宽

### 成本预警阈值

| 资源 | 免费额度 | 预警阈值 | 到达后 |
|---|---|---|---|
| D1 读 | 5M/天 | 3M/天 | 加边缘缓存（已有）|
| R2 读请求 | 10M/月 | 7M/月 | 加 Cloudflare Cache Rules |
| Workers | 10w/天 | 7w/天 | 检查是否有异常流量 |

---

## 回滚方案

**如果新站出问题，30 秒回滚：**

1. Cloudflare Dashboard → Pages → 你的项目
2. 点击 **回滚** 按钮 → 选择上一个正常版本
3. Hugo 站仍然在 GitHub，可以切回 Hugo 分支重新部署

**或者保持 Hugo 站点在子目录运行：**
```
awesomevideoprompts.com  → Next.js 新站（主域名）
old.awesomevideoprompts.com → Hugo 旧站（备用）
```
