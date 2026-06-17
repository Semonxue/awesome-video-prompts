#!/usr/bin/env tsx
/**
 * MD 文件 → D1 数据库迁移脚本
 *
 * 用法：
 *   # 本地 D1 测试（首次需要先建库）
 *   wrangler d1 create prompts-db --local
 *   npx tsx scripts/import-md-to-d1.ts --local
 *
 *   # 生产 D1
 *   npx tsx scripts/import-md-to-d1.ts --remote
 *
 * 幂等：UNIQUE(slug, locale) + INSERT OR REPLACE，可重复执行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { detectLocale, extractSlug, parsePromptMeta } from '../src/lib/parse-md';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const { values: args } = parseArgs({
  options: {
    local: { type: 'boolean', default: false },
    remote: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    'content-dir': { type: 'string', default: path.join(ROOT, 'content') },
    'db': { type: 'string' },
  },
  allowPositionals: false,
});

if (!args.local && !args.remote) {
  console.error('❌ 必须指定 --local 或 --remote');
  console.error('   npx tsx scripts/import-md-to-d1.ts --local');
  process.exit(1);
}

const DB_FLAG = args.local ? '--local' : '--remote';
const DB_NAME = args.db || 'prompts-db';

// ============================================================
// 工具
// ============================================================

function findMdFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findMdFiles(full));
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
        results.push(full);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function wranglerExec(sql: string): any {
  const escaped = sql.replace(/'/g, "'\\''");
  const cmd = `wrangler d1 execute ${DB_NAME} ${DB_FLAG} --command "${escaped}" --json 2>&1`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    return JSON.parse(out);
  } catch (err: any) {
    const msg = (err.stdout as string)?.toString() || err.message || '';
    if (msg.includes('not found') || msg.includes('Unknown database')) {
      console.error(`\n❌ D1 数据库 "${DB_NAME}" 未找到！`);
      console.error('   请先运行: wrangler d1 create prompts-db\n');
    }
    throw new Error(`wrangler failed: ${msg.slice(0, 300)}`);
  }
}

function escapeSql(str: string | null): string {
  if (str === null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// ============================================================
// 主逻辑
// ============================================================

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📦 MD → D1 迁移脚本');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📂 内容目录: ${args['content-dir']}`);
  console.log(`🗄️  目标: ${args.local ? '本地 D1' : '远程 D1'} (${DB_NAME})`);
  console.log(`🔍 试运行: ${args['dry-run'] ? '是（不写入）' : '否'}`);
  console.log('═══════════════════════════════════════════════════\n');

  const promptsDir = path.join(args['content-dir'], 'prompts');
  if (!fs.existsSync(promptsDir)) {
    console.error(`❌ 目录不存在: ${promptsDir}`);
    process.exit(1);
  }

  // 验证 D1 连接
  if (!args['dry-run']) {
    console.log('🔗 验证 D1 连接...');
    try {
      wranglerExec(`SELECT 1 as ok`);
      console.log('   ✅ D1 连接正常\n');
    } catch {
      console.error('   ❌ D1 连接失败，请检查 --db 参数和 wrangler 配置\n');
      process.exit(1);
    }
  }

  const mdFiles = findMdFiles(promptsDir);
  console.log(`🔍 发现 ${mdFiles.length} 个 MD 文件`);

  const parsed: Array<{ slug: string; locale: string; meta: ReturnType<typeof parsePromptMeta> }> = [];

  for (const filePath of mdFiles) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const meta = parsePromptMeta(data as Record<string, unknown>, content);

    if (meta.isDraft) continue;

    const filename = path.basename(filePath);
    const slug = extractSlug(filename);
    if (!slug) continue;

    const locale = detectLocale(filePath);
    parsed.push({ slug, locale, meta });
  }

  console.log(`✅ 解析完成，共 ${parsed.length} 条有效记录\n`);

  if (args['dry-run']) {
    console.log('🔍 试运行预览（前 5 条）：\n');
    parsed.slice(0, 5).forEach((p, i) => {
      console.log(`  [${i + 1}] ${p.locale} | ${p.slug}`);
      console.log(`       title: ${p.meta.title.slice(0, 50)}${p.meta.title.length > 50 ? '...' : ''}`);
      console.log(`       tags: ${p.meta.tags.slice(0, 6).join(', ')} | models: ${p.meta.models.join(', ')}`);
      console.log();
    });
    const localeStats = parsed.reduce((a, p) => { a[p.locale] = (a[p.locale] || 0) + 1; return a; }, {} as Record<string, number>);
    console.log(`语言分布: ${JSON.stringify(localeStats)}`);
    console.log('\n✅ 试运行完成，未写入任何数据');
    return;
  }

  // 写入 D1
  let written = 0;
  for (const { slug, locale, meta } of parsed) {
    // 1. Upsert prompts
    wranglerExec(
      `INSERT OR REPLACE INTO prompts (slug, locale, title, description, video_url, cover_url, source_url, author, prompt_date, updated_at)
       VALUES (${escapeSql(slug)}, ${escapeSql(locale)}, ${escapeSql(meta.title)}, ${escapeSql(meta.description)}, ${escapeSql(meta.videoUrl)}, ${escapeSql(meta.coverUrl)}, ${escapeSql(meta.sourceUrl)}, ${escapeSql(meta.author)}, ${escapeSql(meta.promptDate)}, CURRENT_TIMESTAMP)`
    );

    // 2. Tags 多对多
    for (const tag of meta.tags) {
      wranglerExec(`INSERT OR IGNORE INTO tags (name) VALUES (${escapeSql(tag)})`);
      const tagRow = wranglerExec(`SELECT id FROM tags WHERE name=${escapeSql(tag)}`);
      const tagId = tagRow.result?.[0]?.id;
      if (tagId) {
        const promptRow = wranglerExec(`SELECT id FROM prompts WHERE slug=${escapeSql(slug)} AND locale=${escapeSql(locale)}`);
        const promptId = promptRow.result?.[0]?.id;
        if (promptId) {
          wranglerExec(`INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (${promptId}, ${tagId})`);
        }
      }
    }

    // 3. Models 多对多
    for (const model of meta.models) {
      wranglerExec(`INSERT OR IGNORE INTO models (slug, name) VALUES (${escapeSql(model)}, ${escapeSql(model)})`);
      const modelRow = wranglerExec(`SELECT id FROM models WHERE slug=${escapeSql(model)}`);
      const modelId = modelRow.result?.[0]?.id;
      if (modelId) {
        const promptRow = wranglerExec(`SELECT id FROM prompts WHERE slug=${escapeSql(slug)} AND locale=${escapeSql(locale)}`);
        const promptId = promptRow.result?.[0]?.id;
        if (promptId) {
          wranglerExec(`INSERT OR IGNORE INTO prompt_models (prompt_id, model_id) VALUES (${promptId}, ${modelId})`);
        }
      }
    }

    written++;
    if (written % 200 === 0) console.log(`  📤 进度 ${written}/${parsed.length}...`);
  }

  console.log('\n🎉 迁移完成！');
  console.log(`   总计写入: ${written} 条`);
  const localeStats = parsed.reduce((a, p) => { a[p.locale] = (a[p.locale] || 0) + 1; return a; }, {} as Record<string, number>);
  console.log(`   语言分布: ${JSON.stringify(localeStats)}`);
}

main().catch(err => {
  console.error('\n❌ 迁移失败:', err.message);
  process.exit(1);
});
