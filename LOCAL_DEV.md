# 本地开发指南

## ✅ 已完成工作

### 1. TypeScript 类型错误修复
- ✅ `src/app/api/prompts/route.ts` - page 变量作用域问题
- ✅ `src/app/[locale]/page.tsx` - PromptCard 类型导入
- ✅ `src/lib/prompts.ts` - safeParseJson 返回类型
- ✅ `src/db/schema.ts` - drizzle-orm 0.45.x API 适配
- ✅ `scripts/import-md-to-d1.test.ts` - fixture 类型
- ✅ `src/db/schema.test.ts` - 日期类型

### 2. package.json 构建脚本修复
- ❌ 原始问题：`"build": "opennextjs-cloudflare build"` 内部调用 `npm run build` 导致无限递归
- ✅ 已修复为：`"build": "next build && node node_modules/@opennextjs/cloudflare/dist/cli/build/build.js"`

### 3. 本地数据文件
- ✅ `.d1/prompts-db.sqlite` - SQLite 数据库（4 条测试数据）
- ✅ `public/prompts-index.json` - 静态 JSON 数据

---

## 运行方式

### 方式 1: 普通开发模式（无 D1 数据）
```bash
npm run dev
# 访问 http://localhost:3000/en
```
✅ **页面正常工作（HTTP 200）**
❌ API 返回 `{"error":"DB not available"}`（因为 Edge Runtime 无法访问本地 SQLite）

### 方式 2: 本地开发 + 数据
需要手动分步执行（避免 proxy 问题）：

```bash
# 1. 先清理构建缓存
rm -rf .open-next .next

# 2. 构建 Next.js
npx next build

# 3. 构建 OpenNext（如果 proxy 导致问题，跳过这步）
node node_modules/@opennextjs/cloudflare/dist/cli/build/build.js

# 4. 使用 Wrangler 本地运行
npx wrangler dev --local
# 访问 http://127.0.0.1:8787
```

### 方式 3: 部署到 Cloudflare 远程
```bash
# 同步数据库
npx wrangler d1 execute prompts-db --remote --file=./drizzle/migrations/0000_init.sql

# 部署
npm run deploy
```

---

## ⚠️ 已知问题

### proxy 导致构建问题
系统设置了 HTTP proxy，`opennextjs-cloudflare build` 检测到 proxy 后会尝试通过 proxy 连接，导致：
1. 构建失败或超时
2. 无限递归调用 `npm run build`

**解决方案**：
```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
npm run build
```

### Edge Runtime 无法访问本地 SQLite
Next.js App Router 使用 Edge Runtime，无法直接访问本地文件系统。
- 本地开发：API 返回空数据或错误
- 远程部署：正常工作（通过 Cloudflare Workers D1 binding）

---

## 文件结构

```
.d1/
  prompts-db.sqlite    # 本地 SQLite 数据库

public/
  prompts-index.json   # 静态 JSON 备用数据

open-next.config.ts   # OpenNext 配置
wrangler.toml         # Cloudflare Workers 配置
```

---

## 建议

1. **本地开发**：使用 `npm run dev`，接受无数据库的空状态
2. **完整测试**：部署到 Cloudflare 远程（需要配置 `wrangler login`）
3. **数据导入**：使用 `npm run import:md` 导入 markdown 内容
