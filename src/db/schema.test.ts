/**
 * 单元测试：Drizzle schema 类型定义
 */

import { describe, it, expect } from 'vitest';
import type { Prompt, Tag, Model } from '@/db/schema';

describe('Drizzle schema types', () => {
  it('Prompt 类型有必需字段', () => {
    const prompt: Prompt = {
      id: 1,
      slug: 'cinematic-mountain',
      locale: 'en',
      title: 'Cinematic Mountain',
      description: 'A beautiful mountain scene',
      videoUrl: 'https://r2.dev/v.mp4',
      coverUrl: 'https://r2.dev/c.jpg',
      sourceUrl: null,
      author: 'Semon',
      promptDate: '2026-03-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(prompt.slug).toBe('cinematic-mountain');
    expect(prompt.locale).toBe('en');
  });

  it('Prompt 类型允许 null 字段', () => {
    const prompt: Prompt = {
      id: 2,
      slug: 'minimal',
      locale: 'zh',
      title: 'Minimal',
      description: '',
      videoUrl: null,
      coverUrl: null,
      sourceUrl: null,
      author: null,
      promptDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(prompt.videoUrl).toBe(null);
    expect(prompt.author).toBe(null);
  });

  it('Tag 类型', () => {
    const tag: Tag = { id: 1, name: 'cinematic' };
    expect(tag.name).toBe('cinematic');
  });

  it('Model 类型', () => {
    const model: Model = { id: 1, slug: 'kling26', name: 'Kling 2.6' };
    expect(model.slug).toBe('kling26');
    expect(model.name).toBe('Kling 2.6');
  });

  it('slug + locale 唯一约束间接保证', () => {
    // Schema 定义了 UNIQUE(slug, locale)，这里验证类型允许该组合
    const now = new Date().toISOString();
    const prompt1: Prompt = { id: 1, slug: 'same-slug', locale: 'en', title: 'T1', description: '', videoUrl: null, coverUrl: null, sourceUrl: null, author: null, promptDate: null, createdAt: now, updatedAt: now };
    const prompt2: Prompt = { id: 2, slug: 'same-slug', locale: 'zh', title: 'T2', description: '', videoUrl: null, coverUrl: null, sourceUrl: null, author: null, promptDate: null, createdAt: now, updatedAt: now };
    expect(prompt1.locale).not.toBe(prompt2.locale);
  });
});
