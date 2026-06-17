/**
 * 单元测试：rowToCard 类型转换 + prompts 类型定义
 */

import { describe, it, expect } from 'vitest';
import { rowToCard } from '@/lib/prompts';
import type { PromptRow, PromptCard } from '@/lib/prompts';

describe('rowToCard', () => {
  it('正常转换所有字段', () => {
    const row: PromptRow = {
      id: 1,
      slug: 'epic-mountain',
      locale: 'en',
      title: 'Epic Mountain',
      description: 'A stunning mountain scene',
      video_url: 'https://r2.dev/video.mp4',
      cover_url: 'https://r2.dev/cover.jpg',
      source_url: 'https://x.com/123',
      author: 'Semon',
      prompt_date: '2026-03-15',
      created_at: '2026-03-15T10:00:00Z',
      updated_at: '2026-03-15T10:00:00Z',
      tags: '["cinematic","mountain","nature"]',
      models: '["kling26","veo3"]',
    };

    const card = rowToCard(row);

    expect(card.id).toBe(1);
    expect(card.slug).toBe('epic-mountain');
    expect(card.locale).toBe('en');
    expect(card.title).toBe('Epic Mountain');
    expect(card.description).toBe('A stunning mountain scene');
    expect(card.videoUrl).toBe('https://r2.dev/video.mp4');
    expect(card.coverUrl).toBe('https://r2.dev/cover.jpg');
    expect(card.sourceUrl).toBe('https://x.com/123');
    expect(card.author).toBe('Semon');
    expect(card.promptDate).toBe('2026-03-15');
    expect(card.tags).toEqual(['cinematic', 'mountain', 'nature']);
    expect(card.models).toEqual(['kling26', 'veo3']);
  });

  it('空 tags 返回空数组', () => {
    const row: PromptRow = {
      ...baseRow(),
      tags: 'null',
    };
    expect(rowToCard(row).tags).toEqual([]);
  });

  it('空 models 返回空数组', () => {
    const row: PromptRow = {
      ...baseRow(),
      models: '[]',
    };
    expect(rowToCard(row).models).toEqual([]);
  });

  it('tags 逗号分隔兜底解析', () => {
    const row: PromptRow = {
      ...baseRow(),
      tags: 'cinematic,action,fpv', // 逗号分隔
    };
    // rowToCard 用 JSON.parse，逗号字符串会报错 → fallback []
    expect(rowToCard(row).tags).toEqual([]);
  });

  it('无 media URL 返回 null', () => {
    const row: PromptRow = {
      ...baseRow(),
      video_url: null,
      cover_url: null,
      source_url: null,
      author: null,
      prompt_date: null,
    };
    const card = rowToCard(row);
    expect(card.videoUrl).toBe(null);
    expect(card.coverUrl).toBe(null);
    expect(card.sourceUrl).toBe(null);
    expect(card.author).toBe(null);
    expect(card.promptDate).toBe(null);
  });

  it('中文语言', () => {
    const row: PromptRow = { ...baseRow(), locale: 'zh' };
    expect(rowToCard(row).locale).toBe('zh');
  });

  it('日语语言', () => {
    const row: PromptRow = { ...baseRow(), locale: 'ja' };
    expect(rowToCard(row).locale).toBe('ja');
  });

  it('单标签单模型', () => {
    const row: PromptRow = {
      ...baseRow(),
      tags: '["cinematic"]',
      models: '["sora"]',
    };
    const card = rowToCard(row);
    expect(card.tags).toEqual(['cinematic']);
    expect(card.models).toEqual(['sora']);
  });

  it('不损坏原始 row', () => {
    const row: PromptRow = baseRow();
    rowToCard(row);
    expect(row.id).toBe(42); // 验证原对象未被修改
  });
});

function baseRow(): PromptRow {
  return {
    id: 42,
    slug: 'test-slug',
    locale: 'en',
    title: 'Test Title',
    description: 'Test description',
    video_url: null,
    cover_url: null,
    source_url: null,
    author: null,
    prompt_date: '2026-01-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    tags: '[]',
    models: '[]',
  };
}

describe('PromptCard type guard', () => {
  it('PromptCard 有所有必要字段', () => {
    const card: PromptCard = {
      id: 1,
      slug: 'test',
      locale: 'en',
      title: 'Title',
      description: 'Desc',
      videoUrl: null,
      coverUrl: null,
      sourceUrl: null,
      author: null,
      promptDate: null,
      tags: [],
      models: [],
    };
    expect(card.slug).toBe('test');
  });
});
