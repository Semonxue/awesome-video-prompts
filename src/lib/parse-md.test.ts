/**
 * 单元测试：MD 解析工具函数
 * 覆盖：detectLocale, extractSlug, parseDate, parsePromptMeta
 */

import { describe, it, expect } from 'vitest';
import {
  detectLocale,
  extractSlug,
  parseDate,
  parsePromptMeta,
} from '@/lib/parse-md';

describe('detectLocale', () => {
  it('检测中文路径', () => {
    expect(detectLocale('/content/zh-cn/prompts/2026-03/xxx.md')).toBe('zh');
    expect(detectLocale('/content\\zh-cn\\prompts\\xxx.md')).toBe('zh');
  });

  it('检测日语路径', () => {
    expect(detectLocale('/content/ja/prompts/2026-03/xxx.md')).toBe('ja');
    expect(detectLocale('/content\\ja\\prompts\\xxx.md')).toBe('ja');
  });

  it('默认英文路径', () => {
    expect(detectLocale('/content/prompts/2026-03/xxx.md')).toBe('en');
    expect(detectLocale('/content/en/prompts/xxx.md')).toBe('en');
    expect(detectLocale('/content/zh-cn/prompts/ja-special.md')).toBe('zh');
  });

  it('混合路径以第一个 locale 文件夹为准', () => {
    expect(detectLocale('/content/prompts/zh-cn/2026-03/xxx.md')).toBe('zh');
    expect(detectLocale('/content/prompts/ja/2026-03/xxx.md')).toBe('ja');
    expect(detectLocale('/content/prompts/2026-03/xxx.md')).toBe('en');
  });
});

describe('extractSlug', () => {
  it('标准格式 YYYY-MM-XXX-slug.md', () => {
    expect(extractSlug('2026-03-001-my-first-prompt.md')).toBe('my-first-prompt');
    expect(extractSlug('2025-12-042-cinematic-landscape.md')).toBe('cinematic-landscape');
  });

  it('标准格式 YYYY-MM-DD-XXX-slug.md', () => {
    expect(extractSlug('2026-06-17-005-dark-cityscape.md')).toBe('dark-cityscape');
    expect(extractSlug('2026-01-01-001-happy-new-year.md')).toBe('happy-new-year');
  });

  it('无序号的文件名取掉 .md', () => {
    expect(extractSlug('my-prompt.md')).toBe('my-prompt');
    expect(extractSlug('about.md')).toBe('about');
  });

  it('草稿文件返回空字符串', () => {
    expect(extractSlug('_draft-001-my-prompt.md')).toBe('');
    expect(extractSlug('_xxx.md')).toBe('');
  });

  it('特殊字符的 slug', () => {
    expect(extractSlug('2026-03-001-kling-2.6-cinematic.md')).toBe('kling-2.6-cinematic');
    expect(extractSlug('2026-03-001-sea__turtle-swimming.md')).toBe('sea__turtle-swimming');
  });
});

describe('parseDate', () => {
  it('YYYY-MM-DD 格式直接返回', () => {
    expect(parseDate('2026-03-15')).toBe('2026-03-15');
  });

  it('YYYY-MM 格式补 -01', () => {
    expect(parseDate('2026-03')).toBe('2026-03-01');
    expect(parseDate('2025-12')).toBe('2025-12-01');
  });

  it('undefined 返回 null', () => {
    expect(parseDate(undefined)).toBe(null);
  });

  it('非法格式返回 null', () => {
    expect(parseDate('2026')).toBe(null);
    expect(parseDate('03-15-2026')).toBe(null);
    expect(parseDate('invalid')).toBe(null);
    expect(parseDate('')).toBe(null);
  });
});

describe('parsePromptMeta', () => {
  it('解析完整 front matter', () => {
    const data = {
      title: 'Epic Mountain Scene',
      video: '/prompts/2026-03/001/video.mp4',
      image: '/prompts/2026-03/001/cover.jpg',
      date: '2026-03-15',
      tags: ['mountain', 'cinematic', 'nature'],
      model: 'kling26',
      author: 'Semon',
      source_url: 'https://x.com/xxx',
      draft: false,
    };
    const meta = parsePromptMeta(data, 'A beautiful mountain landscape...');

    expect(meta.title).toBe('Epic Mountain Scene');
    expect(meta.videoUrl).toBe('/prompts/2026-03/001/video.mp4');
    expect(meta.coverUrl).toBe('/prompts/2026-03/001/cover.jpg');
    expect(meta.promptDate).toBe('2026-03-15');
    expect(meta.tags).toEqual(['mountain', 'cinematic', 'nature']);
    expect(meta.models).toEqual(['kling26']);
    expect(meta.author).toBe('Semon');
    expect(meta.sourceUrl).toBe('https://x.com/xxx');
    expect(meta.description).toBe('A beautiful mountain landscape...');
    expect(meta.isDraft).toBe(false);
  });

  it('draft: true 标记为草稿', () => {
    const data = { title: 'Draft Prompt', draft: true };
    const meta = parsePromptMeta(data, '');
    expect(meta.isDraft).toBe(true);
  });

  it('draft: false / 不存在 draft 字段 → 非草稿', () => {
    const data = { title: 'Normal Prompt' };
    const meta = parsePromptMeta(data, '');
    expect(meta.isDraft).toBe(false);
  });

  it('models 数组支持多模型', () => {
    const data = { models: ['kling26', 'veo3', 'sora'] };
    const meta = parsePromptMeta(data, '');
    expect(meta.models).toEqual(['kling26', 'veo3', 'sora']);
  });

  it('model 单值转数组', () => {
    const data = { model: 'seedance2' };
    const meta = parsePromptMeta(data, '');
    expect(meta.models).toEqual(['seedance2']);
  });

  it('tags 字符串逗号分隔', () => {
    const data = { tags: 'cinematic, action, fantasy' };
    const meta = parsePromptMeta(data, '');
    expect(meta.tags).toEqual(['cinematic', 'action', 'fantasy']);
  });

  it('tags 数组直接使用', () => {
    const data = { tags: ['fpv', 'drone'] };
    const meta = parsePromptMeta(data, '');
    expect(meta.tags).toEqual(['fpv', 'drone']);
  });

  it('cover 字段兜底 image', () => {
    const data = { cover: '/cover.jpg' };
    const meta = parsePromptMeta(data, '');
    expect(meta.coverUrl).toBe('/cover.jpg');
  });

  it('缺少可选字段返回 null', () => {
    const data = { title: 'Minimal Prompt' };
    const meta = parsePromptMeta(data, 'prompt content');
    expect(meta.videoUrl).toBe(null);
    expect(meta.coverUrl).toBe(null);
    expect(meta.sourceUrl).toBe(null);
    expect(meta.author).toBe(null);
    expect(meta.promptDate).toBe(null);
    expect(meta.tags).toEqual([]);
    expect(meta.models).toEqual([]);
  });

  it('空 description 用 content 替代', () => {
    const data = { description: '' };
    const meta = parsePromptMeta(data, 'real content here');
    expect(meta.description).toBe('real content here');
  });

  it('content trim 去除首尾空白', () => {
    const data = {};
    const meta = parsePromptMeta(data, '  \n  real content  \n  ');
    expect(meta.description).toBe('real content');
  });

  it('大小写不敏感去重 tags', () => {
    const data = { tags: ['CINEMATIC', 'Cinematic', '  Action  '] };
    const meta = parsePromptMeta(data, '');
    expect(meta.tags).toEqual(['cinematic', 'cinematic', 'action']);
  });
});
