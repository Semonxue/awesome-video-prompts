# API 文档

Base URL: `https://awesomevideoprompts.com`

---

## GET `/api/prompts`

获取提示词列表，支持分页、筛选、搜索。

### Query Parameters

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `locale` | `en \| zh \| ja` | `en` | **必需**。语言 |
| `tag` | string | — | 按标签筛选（精确匹配）|
| `model` | string | — | 按模型筛选（精确匹配）|
| `q` | string | — | 搜索词（英文用 FTS5，中文/日文用 LIKE）|
| `page` | number | `1` | 页码（从 1 开始）|
| `pageSize` | number | `20` | 每页数量（最大 100）|
| `sort` | `date_desc \| date_asc` | `date_desc` | 排序方向 |

### Response

```json
{
  "items": [
    {
      "id": 1,
      "slug": "cinematic-mountain-flight",
      "locale": "en",
      "title": "Cinematic Mountain Flight",
      "description": "A stunning aerial view of snow-capped mountains...",
      "videoUrl": "https://media.r2.dev/prompts/2026-03/001/video.mp4",
      "coverUrl": "https://media.r2.dev/prompts/2026-03/001/cover.jpg",
      "sourceUrl": "https://x.com/123",
      "author": "Semon",
      "promptDate": "2026-03-15",
      "tags": ["cinematic", "mountain", "fpv"],
      "models": ["kling26"]
    }
  ],
  "total": 3824,
  "page": 1,
  "pageSize": 20,
  "hasMore": true,
  "cacheKey": "prompts:en::::1:20:date_desc"
}
```

### HTTP Response Headers

```
Content-Type: application/json
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
```

> **缓存策略**：边缘缓存 1 小时，浏览器 5 分钟，stale 最多 1 天

### Status Codes

| Code | 说明 |
|---|---|
| 200 | 成功 |
| 400 | 缺少必需参数 |
| 500 | 服务器错误（D1 连接失败等）|

### Examples

```bash
# 获取英文首页（最新 20 条）
curl "https://awesomevideoprompts.com/api/prompts?locale=en"

# 筛选 cinematic 标签，第 3 页
curl "https://awesomevideoprompts.com/api/prompts?locale=en&tag=cinematic&page=3"

# 搜索 "mountain"
curl "https://awesomevideoprompts.com/api/prompts?locale=en&q=mountain"

# 组合筛选：kling26 模型 + cinematic 标签
curl "https://awesomevideoprompts.com/api/prompts?locale=en&model=kling26&tag=cinematic"

# 中文最新提示词
curl "https://awesomevideoprompts.com/api/prompts?locale=zh&pageSize=10"
```

---

## Response Field 说明

### `items[].promptDate`

格式：`YYYY-MM-DD`，来自 Hugo front matter 的 `date` 字段。

- 原始 MD 是 `YYYY-MM` 格式时，自动补为 `YYYY-MM-01`
- 可能为 `null`（MD 里没有 `date` 字段）

### `items[].videoUrl` / `items[].coverUrl`

R2 完整 URL（包含域名），格式：
- 视频：`https://media.r2.dev/prompts/YYYY/MM/slug/video.mp4`
- 封面：`https://media.r2.dev/prompts/YYYY/MM/slug/cover.jpg`

### `items[].tags` / `items[].models`

始终为数组（可能为空）。已去重、转为小写。

---

## 内部实现

### 数据库查询（伪代码）

```sql
-- 基础查询
SELECT p.*,
  (SELECT GROUP_CONCAT(t.name, ',') FROM prompt_tags pt
   JOIN tags t ON t.id = pt.tag_id WHERE pt.prompt_id = p.id) as tags,
  (SELECT GROUP_CONCAT(m.slug, ',') FROM prompt_models pm
   JOIN models m ON m.id = pm.model_id WHERE pm.prompt_id = p.id) as models
FROM prompts p
WHERE p.locale = :locale
  AND (:tag IS NULL OR p.id IN (SELECT prompt_id FROM prompt_tags pt
                                  JOIN tags t ON t.id = pt.tag_id
                                  WHERE t.name = :tag))
  AND (:model IS NULL OR p.id IN (SELECT prompt_id FROM prompt_models pm
                                    JOIN models m ON m.id = pm.model_id
                                    WHERE m.slug = :model))
ORDER BY p.prompt_date DESC
LIMIT :pageSize OFFSET :offset
```

### 缓存策略

1. **Cloudflare Cache API**：按 URL Key 缓存，命中时直接返回，0ms 延迟
2. **ISR ( Incremental Static Regeneration)**：详情页 + 首页每小时重新生成
3. **D1 查询**：实际只有 ~1% 的请求打到 D1（大部分走缓存）

---

## 错误处理

```json
// 400 缺少 locale
{ "error": "locale is required" }

// 500 服务器错误
{ "error": "DB not available" }
```

所有错误响应 `Content-Type: application/json`，HTTP 状态码对应错误类型。
