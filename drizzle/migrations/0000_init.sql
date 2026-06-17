-- ============================================================
-- Awesome Video Prompts: D1 Schema Init
-- Run: wrangler d1 execute prompts-db --remote --file=./drizzle/migrations/0000_init.sql
-- ============================================================

-- 主表
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  cover_url TEXT,
  source_url TEXT,
  author TEXT,
  prompt_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, locale)
);

-- 标签
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- 提示词-标签 多对多
CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY(prompt_id, tag_id),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 模型
CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

-- 提示词-模型 多对多
CREATE TABLE IF NOT EXISTS prompt_models (
  prompt_id INTEGER NOT NULL,
  model_id INTEGER NOT NULL,
  PRIMARY KEY(prompt_id, model_id),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prompts_locale ON prompts(locale);
CREATE INDEX IF NOT EXISTS idx_prompts_date ON prompts(prompt_date DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_locale_date ON prompts(locale, prompt_date DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_prompt_models_model ON prompt_models(model_id);

-- ============================================================
-- FTS5 全文搜索（英文为主，中文/日文走 LIKE）
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title,
  description,
  content='prompts',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- FTS 触发器：保持同步
CREATE TRIGGER IF NOT EXISTS prompts_fts_insert AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS prompts_fts_update AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
  INSERT INTO prompts_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS prompts_fts_delete AFTER DELETE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
END;
