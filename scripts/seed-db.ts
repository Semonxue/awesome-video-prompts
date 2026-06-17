#!/usr/bin/env tsx
/**
 * 数据库 Seed 脚本 - 添加测试数据
 * 
 * 用法：
 *   npx tsx scripts/seed-db.ts --local
 *   npx tsx scripts/seed-db.ts --remote
 */

import { parseArgs } from 'util';
import { execSync } from 'child_process';

const { values: args } = parseArgs({
  options: {
    local: { type: 'boolean', default: false },
    remote: { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (!args.local && !args.remote) {
  console.error('❌ 必须指定 --local 或 --remote');
  process.exit(1);
}

const DB_FLAG = args.local ? '--local' : '--remote';

// 测试数据
const testPrompts = [
  {
    slug: 'astronaut-space-station',
    locale: 'en',
    title: 'Astronaut Space Station Chase',
    description: 'Intense shaky handheld chase camera sprinting behind panicked astronaut',
    videoUrl: '/prompts/2026-06/astronaut-space-station/video.mp4',
    coverUrl: '/prompts/2026-06/astronaut-space-station/cover.jpg',
    sourceUrl: 'https://x.com/i/status/2050882809502265669',
    author: 'VideoGen AI',
    promptDate: '2025-10-30',
  },
  {
    slug: 'grindhouse-bmovie',
    locale: 'en',
    title: 'Grindhouse B-Movie Style',
    description: 'Retro 70s grindhouse exploitation film aesthetic with film grain and scratches',
    videoUrl: '/prompts/2026-06/grindhouse-bmovie/video.mp4',
    coverUrl: '/prompts/2026-06/grindhouse-bmovie/cover.jpg',
    sourceUrl: 'https://x.com/i/status/2051060163629490579',
    author: 'VideoGen AI',
    promptDate: '2025-11-01',
  },
  {
    slug: 'cyberpunk-neon-city',
    locale: 'zh-cn',
    title: '赛博朋克霓虹城市',
    description: '未来感赛博朋克风格，霓虹灯光闪烁的雨夜城市街道',
    videoUrl: '/prompts/2026-06/cyberpunk-neon-city/video.mp4',
    coverUrl: '/prompts/2026-06/cyberpunk-neon-city/cover.jpg',
    sourceUrl: 'https://x.com/i/status/2060000000000000000',
    author: 'VideoGen AI',
    promptDate: '2025-11-15',
  },
  {
    slug: 'nature-documentary',
    locale: 'ja',
    title: '自然ドキュメンタリー',
    description: '息をのむ美しい自然風景、晨霧の中の森林と川',
    videoUrl: '/prompts/2026-06/nature-documentary/video.mp4',
    coverUrl: '/prompts/2026-06/nature-documentary/cover.jpg',
    sourceUrl: 'https://x.com/i/status/2061000000000000000',
    author: 'VideoGen AI',
    promptDate: '2025-11-20',
  },
];

const testTags = [
  { name: 'space' },
  { name: 'astronaut' },
  { name: 'sci-fi' },
  { name: 'action' },
  { name: 'handheld' },
  { name: 'space-station' },
  { name: 'retro' },
  { name: 'grindhouse' },
  { name: 'cyberpunk' },
  { name: 'neon' },
  { name: 'nature' },
  { name: 'documentary' },
];

const testModels = [
  { slug: 'hailuo', name: 'Hailuo' },
  { slug: 'sora', name: 'Sora' },
  { slug: 'kling', name: 'Kling' },
  { slug: 'veo', name: 'Veo' },
];

async function seed() {
  console.log('🌱 开始 Seed 数据...\n');

  // 1. 创建 tags
  console.log('📦 插入 Tags...');
  for (const tag of testTags) {
    try {
      execSync(
        `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR IGNORE INTO tags (name) VALUES ('${tag.name}')"`,
        { encoding: 'utf-8' }
      );
      console.log(`  ✅ Tag: ${tag.name}`);
    } catch (e) {
      console.log(`  ⚠️  Tag 已存在: ${tag.name}`);
    }
  }

  // 2. 创建 models
  console.log('\n📦 插入 Models...');
  for (const model of testModels) {
    try {
      execSync(
        `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR IGNORE INTO models (slug, name) VALUES ('${model.slug}', '${model.name}')"`,
        { encoding: 'utf-8' }
      );
      console.log(`  ✅ Model: ${model.name}`);
    } catch (e) {
      console.log(`  ⚠️  Model 已存在: ${model.name}`);
    }
  }

  // 3. 创建 prompts 并关联
  console.log('\n📦 插入 Prompts...');
  for (const prompt of testPrompts) {
    const createdAt = new Date().toISOString();
    const slug = prompt.slug;
    const locale = prompt.locale;
    
    try {
      execSync(
        `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR REPLACE INTO prompts (slug, locale, title, description, video_url, cover_url, source_url, author, prompt_date, created_at, updated_at) VALUES ('${slug}', '${locale}', '${prompt.title.replace(/'/g, "''")}', '${prompt.description.replace(/'/g, "''")}', '${prompt.videoUrl || ''}', '${prompt.coverUrl || ''}', '${prompt.sourceUrl || ''}', '${prompt.author || ''}', '${prompt.promptDate || ''}', '${createdAt}', '${createdAt}')"`,
        { encoding: 'utf-8' }
      );
      console.log(`  ✅ Prompt: ${prompt.title}`);

      // 获取插入的 prompt id
      const result = execSync(
        `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="SELECT id FROM prompts WHERE slug='${slug}' AND locale='${locale}'" --json 2>/dev/null || echo '[]'`,
        { encoding: 'utf-8' }
      );

      try {
        const rows = JSON.parse(result);
        if (rows.length > 0) {
          const promptId = rows[0].id;

          // 关联 tags
          if (prompt.slug === 'astronaut-space-station') {
            const tagIds = [1, 2, 3, 4, 5, 6]; // space, astronaut, sci-fi, action, handheld, space-station
            for (const tagId of tagIds) {
              execSync(
                `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (${promptId}, ${tagId})"`,
                { encoding: 'utf-8' }
              );
            }
          } else if (prompt.slug === 'grindhouse-bmovie') {
            const tagIds = [7, 8]; // retro, grindhouse
            for (const tagId of tagIds) {
              execSync(
                `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (${promptId}, ${tagId})"`,
                { encoding: 'utf-8' }
              );
            }
          }

          // 关联 models
          const modelId = prompt.slug === 'astronaut-space-station' ? 1 : 
                          prompt.slug === 'grindhouse-bmovie' ? 2 :
                          prompt.slug === 'cyberpunk-neon-city' ? 3 : 4;
          execSync(
            `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="INSERT OR IGNORE INTO prompt_models (prompt_id, model_id) VALUES (${promptId}, ${modelId})"`,
            { encoding: 'utf-8' }
          );
        }
      } catch (e) {
        console.log(`  ⚠️  无法获取 prompt ID`);
      }

    } catch (e: any) {
      console.log(`  ❌ Prompt 失败: ${prompt.title}`);
      console.log(`     ${e.message}`);
    }
  }

  // 4. 显示结果
  console.log('\n📊 数据统计:');
  const promptsCount = execSync(
    `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="SELECT COUNT(*) as count FROM prompts" --json 2>/dev/null || echo '[{"count":0}]'`,
    { encoding: 'utf-8' }
  );
  const tagsCount = execSync(
    `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="SELECT COUNT(*) as count FROM tags" --json 2>/dev/null || echo '[{"count":0}]'`,
    { encoding: 'utf-8' }
  );
  const modelsCount = execSync(
    `npx wrangler d1 execute prompts-db ${DB_FLAG} --command="SELECT COUNT(*) as count FROM models" --json 2>/dev/null || echo '[{"count":0}]'`,
    { encoding: 'utf-8' }
  );

  try {
    console.log(`  - Prompts: ${JSON.parse(promptsCount)[0]?.count || 0}`);
    console.log(`  - Tags: ${JSON.parse(tagsCount)[0]?.count || 0}`);
    console.log(`  - Models: ${JSON.parse(modelsCount)[0]?.count || 0}`);
  } catch (e) {
    console.log('  (无法获取统计)');
  }

  console.log('\n✨ Seed 完成！');
}

seed().catch(console.error);
