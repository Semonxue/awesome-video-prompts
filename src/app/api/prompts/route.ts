/**
 * GET /api/prompts
 *
 * Query params:
 *   locale     - 'en' | 'zh' | 'ja'  (required)
 *   tag        - tag name filter
 *   model      - model slug filter
 *   q          - search query (uses FTS5 or LIKE)
 *   page       - page number (default 1)
 *   pageSize   - items per page (default 20, max 100)
 *   sort       - 'date_desc' | 'date_asc' (default: date_desc)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rowToCard, PaginatedPrompts, PromptRow } from '@/lib/prompts';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const locale = searchParams.get('locale') || 'en';
  const tag = searchParams.get('tag') || '';
  const model = searchParams.get('model') || '';
  const q = searchParams.get('q') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'));
  const sort = searchParams.get('sort') || 'date_desc';
  const offset = (page - 1) * pageSize;

  // OpenNext Cloudflare 用 incrementalCache: 'dummy' 管理缓存，不需要自己调 caches API
  const db = (req as any).env?.DB;
  if (!db) {
    return NextResponse.json({ error: 'DB not available' }, { status: 500 });
  }

  try {
    const result = await buildAndExecuteQuery(db, { locale, tag, model, q, page, pageSize, sort, offset });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
      },
    });
  } catch (err: any) {
    console.error('API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

interface QueryParams {
  locale: string;
  tag: string;
  model: string;
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  offset: number;
}

async function buildAndExecuteQuery(
  db: any,
  { locale, tag, model, q, page, pageSize, sort, offset }: QueryParams
): Promise<Omit<PaginatedPrompts, 'cacheKey'>> {

  // 构建 WHERE 子句
  const conditions: string[] = ['p.locale = ?'];
  const binds: (string | number)[] = [locale];

  if (tag) {
    conditions.push(`p.id IN (SELECT prompt_id FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.name = ?)`);
    binds.push(tag);
  }

  if (model) {
    conditions.push(`p.id IN (SELECT prompt_id FROM prompt_models pm JOIN models m ON m.id = pm.model_id WHERE m.slug = ?)`);
    binds.push(model);
  }

  const where = conditions.join(' AND ');

  // 全文搜索：中文/日文用 LIKE，英文用 FTS5
  let searchWhere = '';
  if (q) {
    if (locale === 'en') {
      searchWhere = ` AND p.id IN (SELECT rowid FROM prompts_fts WHERE prompts_fts MATCH ?) `;
      binds.push(q + '*'); // FTS5 前缀搜索
    } else {
      // CJK 语言：LIKE 兜底
      searchWhere = ` AND (p.title LIKE ? OR p.description LIKE ?) `;
      binds.push(`%${q}%`, `%${q}%`);
    }
  }

  const orderCol = sort === 'date_asc' ? 'prompt_date ASC' : 'prompt_date DESC';
  const orderNulls = sort === 'date_asc' ? 'NULLS LAST' : 'NULLS LAST';

  const finalWhere = where + searchWhere;

  // 查询数据（带 JSON group_concat 拉 tag/model）
  const dataSql = `
    SELECT p.*,
      (SELECT GROUP_CONCAT(t.name, ',') FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.prompt_id = p.id) as tags,
      (SELECT GROUP_CONCAT(m.slug, ',') FROM prompt_models pm JOIN models m ON m.id = pm.model_id WHERE pm.prompt_id = p.id) as models
    FROM prompts p
    WHERE ${finalWhere}
    ORDER BY p.${orderCol} ${orderNulls}
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) as total FROM prompts p
    WHERE ${finalWhere}
  `;

  const [dataResult, countResult]: [any, any] = await Promise.all([
    db.prepare(dataSql).bind(...binds, pageSize, offset).all(),
    db.prepare(countSql).bind(...binds).first(),
  ]);

  const items = (dataResult.results as PromptRow[]).map(rowToCard);
  const total = (countResult?.total as number) ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  };
}
