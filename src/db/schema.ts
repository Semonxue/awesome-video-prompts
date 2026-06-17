/**
 * Drizzle ORM Schema — 类型安全地操作 D1
 * 对应 drizzle/migrations/0000_init.sql
 * 
 * 使用 drizzle-orm 0.45.x API
 */

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const prompts = sqliteTable('prompts', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  locale: text('locale').notNull().default('en'),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  videoUrl: text('video_url'),
  coverUrl: text('cover_url'),
  sourceUrl: text('source_url'),
  author: text('author'),
  promptDate: text('prompt_date'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const tags = sqliteTable('tags', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const promptTags = sqliteTable('prompt_tags', {
  promptId: integer('prompt_id', { mode: 'number' }).notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id', { mode: 'number' }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export const models = sqliteTable('models', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const promptModels = sqliteTable('prompt_models', {
  promptId: integer('prompt_id', { mode: 'number' }).notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  modelId: integer('model_id', { mode: 'number' }).notNull().references(() => models.id, { onDelete: 'cascade' }),
});

export type Prompt = typeof prompts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Model = typeof models.$inferSelect;
