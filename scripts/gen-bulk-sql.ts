#!/usr/bin/env tsx
/**
 * 生成完整批量 SQL（含 prompt_tags / prompt_models），直接:
 *   wrangler d1 execute prompts-db --remote --file=/tmp/bulk-import.sql
 *
 * 策略：显式 ID — 所有表用我们算好的 ID，不依赖 SQLite autoincrement
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { detectLocale, extractSlug, parsePromptMeta } from '../src/lib/parse-md';

const ROOT = path.join(__dirname, '..');

function findMdFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMdFiles(full));
    else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) out.push(full);
  }
  return out;
}

function esc(s: string | null | undefined): string {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

const promptsDir = path.join(ROOT, 'content/prompts');
const files = findMdFiles(promptsDir);
console.log(`🔍 解析 ${files.length} 个 MD 文件...`);

// Pass 1: 收集 + 分配固定 ID
const tagNames = new Set<string>();
const modelSlugs = new Set<string>();
const slugToPid = new Map<string, number>(); // key = "slug|locale"
let pid = 1;
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const { data, content } = matter(raw);
  const meta = parsePromptMeta(data as Record<string, unknown>, content);
  if (meta.isDraft) continue;
  const slug = extractSlug(path.basename(f));
  if (!slug) continue;
  const locale = detectLocale(f);
  slugToPid.set(`${slug}|${locale}`, pid++);
  meta.tags.forEach(t => tagNames.add(t.trim()));
  meta.models.forEach(m => modelSlugs.add(m.trim()));
}

const tagIdMap = new Map<string, number>();
let tid = 1;
for (const t of [...tagNames].sort()) {
  tagIdMap.set(t, tid++);
}

const modelIdMap = new Map<string, number>();
let mid = 1;
for (const m of [...modelSlugs].sort()) {
  modelIdMap.set(m, mid++);
}

// Pass 2: 生成 SQL（显式 ID）
const promptSql: string[] = [];
const tagSql: string[] = [];
const modelSql: string[] = [];
const ptSql: string[] = [];
const pmSql: string[] = [];

pid = 1;
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const { data, content } = matter(raw);
  const meta = parsePromptMeta(data as Record<string, unknown>, content);
  if (meta.isDraft) continue;
  const slug = extractSlug(path.basename(f));
  if (!slug) continue;
  const locale = detectLocale(f);
  const thisPid = slugToPid.get(`${slug}|${locale}`)!;

  promptSql.push(
    `INSERT OR REPLACE INTO prompts (id, slug, locale, title, description, video_url, cover_url, source_url, author, prompt_date, updated_at) ` +
    `VALUES (${thisPid}, ${esc(slug)}, ${esc(locale)}, ${esc(meta.title)}, ${esc(meta.description)}, ${esc(meta.videoUrl)}, ${esc(meta.coverUrl)}, ${esc(meta.sourceUrl)}, ${esc(meta.author)}, ${esc(meta.promptDate)}, CURRENT_TIMESTAMP);`
  );

  for (const t of meta.tags) {
    const myTid = tagIdMap.get(t.trim());
    if (myTid) ptSql.push(`INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (${thisPid}, ${myTid});`);
  }
  for (const m of meta.models) {
    const myMid = modelIdMap.get(m.trim());
    if (myMid) pmSql.push(`INSERT OR IGNORE INTO prompt_models (prompt_id, model_id) VALUES (${thisPid}, ${myMid});`);
  }
}

for (const t of [...tagNames].sort()) {
  tagSql.push(`INSERT OR IGNORE INTO tags (id, name) VALUES (${tagIdMap.get(t)}, ${esc(t)});`);
}

for (const m of [...modelSlugs].sort()) {
  modelSql.push(`INSERT OR IGNORE INTO models (id, slug, name) VALUES (${modelIdMap.get(m)}, ${esc(m)}, ${esc(m)});`);
}

// 写文件
const out = [
  '-- ============================================================',
  `-- Bulk import: ${promptSql.length} prompts, ${tagSql.length} tags, ${modelSql.length} models`,
  `-- Generated at ${new Date().toISOString()}`,
  '-- ============================================================',
  '',
  '-- Phase 1: tags (FK 先就位)',
  ...tagSql,
  '',
  '-- Phase 2: models (FK 先就位)',
  ...modelSql,
  '',
  '-- Phase 3: prompts',
  ...promptSql,
  '',
  '-- Phase 4: prompt_tags',
  ...ptSql,
  '',
  '-- Phase 5: prompt_models',
  ...pmSql,
].join('\n');

const outPath = '/tmp/bulk-import.sql';
fs.writeFileSync(outPath, out);
const stats = fs.statSync(outPath);
console.log(`✅ 已生成 ${outPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
console.log(`   prompts:       ${promptSql.length}`);
console.log(`   tags:          ${tagSql.length}`);
console.log(`   models:        ${modelSql.length}`);
console.log(`   prompt_tags:   ${ptSql.length}`);
console.log(`   prompt_models: ${pmSql.length}`);
console.log(`\n📋 下一步: wrangler d1 execute prompts-db --remote --file=${outPath}`);