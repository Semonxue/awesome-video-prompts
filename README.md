# Awesome Video Prompts

> Next.js 15 + Cloudflare Workers + D1 + R2
> 分支：`nextjs-migration`

开源的 AI 视频生成提示词合集。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 (App Router) + next-intl (i18n) |
| 后端 | Cloudflare Workers (Edge Runtime) |
| 数据库 | Cloudflare D1 (SQLite) + FTS5 全文搜索 |
| 媒体 | Cloudflare R2 对象存储 |
| 缓存 | Cloudflare Cache API + ISR |
| 部署 | OpenNext + Cloudflare Pages |

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .dev.vars.example .dev.vars
# 填写 CLOUDFLARE_API_TOKEN 等

# 创建本地 D1
wrangler d1 create prompts-db --local
wrangler d1 execute prompts-db --local --file=./drizzle/migrations/0000_init.sql

# 迁移数据（试运行）
npx tsx scripts/import-md-to-d1.ts --local --dry-run

# 迁移数据（正式）
npx tsx scripts/import-md-to-d1.ts --local

# 启动开发服务器
npm run dev
```

## 测试

```bash
# 单元测试
npm test

# 带覆盖率
npm run test:coverage

# E2E 测试
npx playwright test
```

## 部署

详见 [NEXTJS_MIGRATION.md](./NEXTJS_MIGRATION.md)

## 多语言

- `/en` — English
- `/zh` — 中文
- `/ja` — 日本語
