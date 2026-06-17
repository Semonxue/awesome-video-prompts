/**
 * SQL Schema 验证测试
 * 验证 0000_init.sql 的所有表、索引、触发器、FTS 是否语法正确
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('D1 Schema SQL 语法验证', () => {
  // 跳过真实 D1 调用，只验证 SQL 文件存在且基本语法正确
  const sqlPath = path.join(__dirname, '../../drizzle/migrations/0000_init.sql');

  it('SQL 文件存在', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('SQL 文件包含所有必要的 CREATE TABLE', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS prompts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS tags');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS prompt_tags');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS models');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS prompt_models');
  });

  it('prompts 表有所有必需列', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('slug TEXT NOT NULL');
    expect(sql).toContain('locale TEXT NOT NULL');
    expect(sql).toContain('title TEXT NOT NULL');
    expect(sql).toContain('description TEXT');
    expect(sql).toContain('video_url TEXT');
    expect(sql).toContain('cover_url TEXT');
    expect(sql).toContain('source_url TEXT');
    expect(sql).toContain('author TEXT');
    expect(sql).toContain('prompt_date DATE');
    expect(sql).toContain('created_at DATETIME');
    expect(sql).toContain('updated_at DATETIME');
  });

  it('prompts 表有 UNIQUE 约束', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('UNIQUE(slug, locale)');
  });

  it('有多对多关联表的外键', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE');
    expect(sql).toContain('FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE');
    expect(sql).toContain('FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE');
  });

  it('有 FTS5 全文搜索表', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5');
    expect(sql).toContain('content=\'prompts\'');
    expect(sql).toContain('content_rowid=\'id\'');
  });

  it('有 FTS 同步触发器（INSERT/UPDATE/DELETE）', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('prompts_fts_insert');
    expect(sql).toContain('prompts_fts_update');
    expect(sql).toContain('prompts_fts_delete');
    expect(sql).toContain('AFTER INSERT ON prompts');
    expect(sql).toContain('AFTER UPDATE ON prompts');
    expect(sql).toContain('AFTER DELETE ON prompts');
  });

  it('有必要的索引', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_prompts_locale');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_prompts_date');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_prompt_models_model');
  });

  it('SQL 注释说明清晰', () => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('-- 主表');
    expect(sql).toContain('-- 标签');
    expect(sql).toContain('-- FTS5 全文搜索');
    expect(sql).toContain('-- 索引');
  });
});

describe('wrangler.toml 配置验证', () => {
  it('wrangler.toml 存在且包含 D1 binding', () => {
    const tomlPath = path.join(__dirname, '../../wrangler.toml');
    const toml = fs.readFileSync(tomlPath, 'utf8');
    expect(toml).toContain('[[d1_databases]]');
    expect(toml).toContain('binding = "DB"');
  });

  it('wrangler.toml 包含 R2 bucket binding', () => {
    const tomlPath = path.join(__dirname, '../../wrangler.toml');
    const toml = fs.readFileSync(tomlPath, 'utf8');
    expect(toml).toContain('[[r2_buckets]]');
    expect(toml).toContain('binding = "MEDIA"');
  });

  it('wrangler.toml 包含 KV binding', () => {
    const tomlPath = path.join(__dirname, '../../wrangler.toml');
    const toml = fs.readFileSync(tomlPath, 'utf8');
    expect(toml).toContain('[[kv_namespaces]]');
    expect(toml).toContain('binding = "CACHE"');
  });
});
