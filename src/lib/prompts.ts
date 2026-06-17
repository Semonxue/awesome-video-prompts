import type { Prompt, Tag, Model } from '@/db/schema';

/** D1 查询结果（扁平化，JOIN 后的） */
export interface PromptRow {
  id: number;
  slug: string;
  locale: string;
  title: string;
  description: string;
  video_url: string | null;
  cover_url: string | null;
  source_url: string | null;
  author: string | null;
  prompt_date: string | null;
  created_at: string;
  updated_at: string;
  // 附加字段（JSON 序列化后，D1 可能返回字符串 'null'）
  tags: string | null;   // JSON array string: '["cinematic","action"]'
  models: string | null;  // JSON array string
}

/** 传给前端的 Prompt 类型 */
export interface PromptCard {
  id: number;
  slug: string;
  locale: string;
  title: string;
  description: string;
  videoUrl: string | null;
  coverUrl: string | null;
  sourceUrl: string | null;
  author: string | null;
  promptDate: string | null;
  tags: string[];
  models: string[];
}

/** 分页结果 */
export interface PaginatedPrompts {
  items: PromptCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** 辅助：将 D1 行转成 PromptCard */
export function rowToCard(row: PromptRow): PromptCard {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    coverUrl: row.cover_url,
    sourceUrl: row.source_url,
    author: row.author,
    promptDate: row.prompt_date,
    tags: safeParseJsonArray(row.tags),
    models: safeParseJsonArray(row.models),
  };
}

function safeParseJsonArray(str: string | null): string[] {
  if (str === null || str === 'null' || str === 'NULL') return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}
