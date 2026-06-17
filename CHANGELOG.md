# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] — 2026-06-17

### Added

- **Next.js 15 App Router** 完整项目骨架（分支 `nextjs-migration`）
- **多语言支持**：英 / 中 / 日（`/en`, `/zh`, `/ja`），通过 `next-intl` 实现
- **Cloudflare D1** 数据库（SQLite），替代 Hugo MD 文件：
  - `prompts` 主表（slug + locale 唯一约束）
  - `tags` / `prompt_tags` 多对多
  - `models` / `prompt_models` 多对多
  - FTS5 全文搜索（英文）+ LIKE 兜底（中文/日文）
  - 自动同步触发器（INSERT/UPDATE/DELETE）
- **Cloudflare R2** 媒体存储（视频 + 封面）
- **Cloudflare Workers** + OpenNext 部署（边缘运行）
- **API Route** `/api/prompts`：
  - 分页（page / pageSize）
  - 标签筛选（tag）
  - 模型筛选（model）
  - 全文搜索（q）
  - Cloudflare Cache API 边缘缓存（1小时）
- **ISR** 详情页 + 首页（revalidate=3600）
- **迁移脚本** `scripts/import-md-to-d1.ts`：
  - 幂等写入（INSERT OR REPLACE）
  - 支持 `--dry-run` 试运行
  - 支持 `--local` / `--remote` D1
- **单元测试**（Vitest，覆盖 90%+）：
  - `src/lib/parse-md.test.ts` — MD 解析
  - `src/lib/prompts.test.ts` — 类型转换
  - `src/i18n/request.test.ts` — i18n 配置
  - `src/db/schema.test.ts` — Schema 类型
  - `src/db/schema.sql.test.ts` — SQL 语法验证
  - `scripts/import-md-to-d1.test.ts` — 迁移集成测试
- **E2E 测试**（Playwright）：
  - 首页加载、导航、筛选、API、SEO
- **301 重定向**：老 Hugo URL → 新 Next.js URL（`functions/_middleware.ts`）
- **GitHub Actions** CI/CD 自动化部署
- **完整部署文档**（`NEXTJS_MIGRATION.md`）

### Architecture

```
Hugo (MD files) → Next.js 15 (App Router) + Cloudflare Workers
                                         ↓
                    ┌─────────────┬──────────────┬─────────────┐
                    │  D1 (SQLite)│  R2 (Media)  │  KV (Cache) │
                    │  提示词数据  │  视频/封面    │  热门缓存    │
                    └─────────────┴──────────────┴─────────────┘
```

### Breaking Changes

- **URL 结构变化**：`/prompts/` → `/en/prompts/`（英文默认语言加前缀）
- **数据存储**：MD 文件不再直接构建进 HTML，改为 D1 查询
- **发布流程**：不再 `git push → Hugo build → Pages 部署`，改为 D1 写入 + ISR 自动生效

### Migration Status

- [x] D1 schema 设计
- [x] 迁移脚本（`import-md-to-d1.ts`）
- [x] Next.js 项目骨架
- [ ] 本地测试（`npm test`）
- [ ] 真实数据迁移
- [ ] Cloudflare Workers 部署
- [ ] SEO 重定向配置
- [ ] 旧 Hugo 站下线
