/**
 * 集成测试：迁移脚本完整解析流程
 * 直接构造已解析的 front matter data，模拟 matter(raw) 输出，不依赖 gray-matter
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { detectLocale, extractSlug, parsePromptMeta } from '@/lib/parse-md';

// ============================================================
// 测试数据：直接用已解析的 front matter data
// ============================================================

/** 英文完整 MD */
const FIXTURE_EN = {
  raw: 'A stunning aerial view of snow-capped mountains...',
  data: {
    title: 'Cinematic Mountain Flight',
    image: '/prompts/2026-03/001/cover.jpg',
    video: '/prompts/2026-03/001/video.mp4',
    date: '2026-03-15',
    description: 'A beautiful mountain landscape',
    model: 'kling26',
    tags: ['cinematic', 'mountain', 'fpv'],
    author: 'Semon',
    source_url: 'https://x.com/123',
    draft: false,
  },
  filePath: '/content/prompts/2026-03/2026-03-001-cinematic-mountain.md',
};

/** 中文 MD */
const FIXTURE_ZH = {
  raw: 'Neon lights illuminate rain-soaked streets in a futuristic metropolis...',
  data: {
    title: '赛博朋克城市夜景',
    image: '/prompts/2026-03/002/cover.jpg',
    video: '/prompts/2026-03/002/video.mp4',
    date: '2026-03',
    description: 'A cyberpunk city at night',
    models: ['veo3', 'sora'],
    tags: 'urban, sci-fi, night, neon',
    author: '小明',
    source_url: '',
    draft: false,
  },
  filePath: '/content/zh-cn/prompts/2026-03/2026-03-002-cyberpunk-city.md',
};

/** 日语 MD */
const FIXTURE_JA = {
  raw: 'A girl gracefully dancing under cherry blossoms...',
  data: {
    title: '桜の下で踊る少女',
    image: '/prompts/2026-03/003/cover.jpg',
    date: '2026-03-01',
    model: 'seedance2',
    tags: ['anime', 'dance', 'nature'],
    author: 'さくら',
    draft: false,
  },
  filePath: '/content/ja/prompts/2026-03/2026-03-003-cherry-blossom-dance.md',
};

/** 草稿 MD */
const FIXTURE_DRAFT = {
  raw: 'This should be skipped...',
  data: { title: 'Draft Prompt', draft: true },
  filePath: '/content/prompts/2026-03/2026-03-999-draft.md',
};

/** 最简 MD */
const FIXTURE_MINIMAL = {
  raw: 'Just a simple prompt without optional fields.',
  data: { title: 'Minimal Prompt', date: '2025-12' },
  filePath: '/content/prompts/2025-12/2025-12-001-minimal.md',
};

// ============================================================
// 解析测试
// ============================================================

// 定义宽松的 fixture 类型，允许部分字段缺失
type TestFixture = {
  raw: string;
  data: Partial<{
    title: string;
    image: string;
    video: string;
    date: string;
    description: string;
    model: string;
    models: string[];
    tags: string | string[];
    author: string;
    source_url: string;
    draft: boolean;
  }>;
  filePath: string;
};

describe('迁移脚本：完整解析流程', () => {
  function parseFixture(fixture: TestFixture) {
    const { data, raw } = fixture;
    const meta = parsePromptMeta(data as Record<string, unknown>, raw);
    const filename = path.basename(fixture.filePath);
    const slug = extractSlug(filename);
    const locale = detectLocale(fixture.filePath);
    return { slug, locale, meta };
  }

  it('英文完整 MD 解析正确', () => {
    const { slug, locale, meta } = parseFixture(FIXTURE_EN);

    expect(slug).toBe('cinematic-mountain');
    expect(locale).toBe('en');
    expect(meta.title).toBe('Cinematic Mountain Flight');
    expect(meta.videoUrl).toBe('/prompts/2026-03/001/video.mp4');
    expect(meta.coverUrl).toBe('/prompts/2026-03/001/cover.jpg');
    expect(meta.promptDate).toBe('2026-03-15');
    expect(meta.tags).toEqual(['cinematic', 'mountain', 'fpv']);
    expect(meta.models).toEqual(['kling26']);
    expect(meta.author).toBe('Semon');
    expect(meta.sourceUrl).toBe('https://x.com/123');
    expect(meta.isDraft).toBe(false);
    expect(meta.description).toContain('A stunning aerial view');
  });

  it('中文 MD 解析正确', () => {
    const { slug, locale, meta } = parseFixture(FIXTURE_ZH);

    expect(slug).toBe('cyberpunk-city');
    expect(locale).toBe('zh');
    expect(meta.title).toBe('赛博朋克城市夜景');
    expect(meta.promptDate).toBe('2026-03-01');
    expect(meta.tags).toEqual(['urban', 'sci-fi', 'night', 'neon']);
    expect(meta.models).toEqual(['veo3', 'sora']);
    expect(meta.author).toBe('小明');
  });

  it('日语 MD 解析正确', () => {
    const { slug, locale, meta } = parseFixture(FIXTURE_JA);

    expect(slug).toBe('cherry-blossom-dance');
    expect(locale).toBe('ja');
    expect(meta.title).toBe('桜の下で踊る少女');
    expect(meta.promptDate).toBe('2026-03-01');
    expect(meta.tags).toEqual(['anime', 'dance', 'nature']);
    expect(meta.models).toEqual(['seedance2']);
    expect(meta.author).toBe('さくら');
  });

  it('草稿 MD 标记为草稿', () => {
    const { meta } = parseFixture(FIXTURE_DRAFT);
    expect(meta.isDraft).toBe(true);
  });

  it('最简 MD 解析正确', () => {
    const { slug, locale, meta } = parseFixture(FIXTURE_MINIMAL);

    expect(slug).toBe('minimal');
    expect(locale).toBe('en');
    expect(meta.title).toBe('Minimal Prompt');
    expect(meta.promptDate).toBe('2025-12-01');
    expect(meta.videoUrl).toBe(null);
    expect(meta.coverUrl).toBe(null);
    expect(meta.sourceUrl).toBe(null);
    expect(meta.author).toBe(null);
    expect(meta.tags).toEqual([]);
    expect(meta.models).toEqual([]);
    expect(meta.isDraft).toBe(false);
  });
});

describe('迁移脚本：批量解析统计', () => {
  it('混合语言批量解析统计正确', () => {
    const fixtures = [FIXTURE_EN, FIXTURE_ZH, FIXTURE_JA, FIXTURE_MINIMAL, FIXTURE_DRAFT];

    const results = fixtures
      .map(fixture => {
        const { data, raw } = fixture;
        const meta = parsePromptMeta(data as Record<string, unknown>, raw);
        if (meta.isDraft) return null;
        const filename = path.basename(fixture.filePath);
        const slug = extractSlug(filename);
        if (!slug) return null;
        const locale = detectLocale(fixture.filePath);
        return { slug, locale, meta };
      })
      .filter(Boolean);

    expect(results.length).toBe(4); // 草稿被过滤

    const localeCounts = results.reduce((acc, r) => {
      acc[r!.locale] = (acc[r!.locale] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(localeCounts).toEqual({ en: 2, zh: 1, ja: 1 });
  });

  it('所有 slug 唯一', () => {
    const fixtures = [FIXTURE_EN, FIXTURE_MINIMAL];
    const results = fixtures.map(fixture => {
      const { data, raw } = fixture;
      const meta = parsePromptMeta(data as Record<string, unknown>, raw);
      const filename = path.basename(fixture.filePath);
      return extractSlug(filename);
    });
    const uniqueSlugs = new Set(results);
    expect(uniqueSlugs.size).toBe(results.length);
  });
});

describe('迁移脚本：SQL 转义', () => {
  function escapeSql(str: string | null): string {
    if (str === null) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
  }

  it('单引号正确转义', () => {
    expect(escapeSql("O'Brien")).toBe("'O''Brien'");
    expect(escapeSql("it's cool")).toBe("'it''s cool'");
    expect(escapeSql(null)).toBe('NULL');
    expect(escapeSql('normal text')).toBe("'normal text'");
    expect(escapeSql('')).toBe("''");
  });

  it('Unicode 内容正确处理', () => {
    expect(escapeSql('桜の下で踊る少女')).toBe("'桜の下で踊る少女'");
    expect(escapeSql('赛博朋克城市夜景')).toBe("'赛博朋克城市夜景'");
    expect(escapeSql("It's テスト")).toBe("'It''s テスト'");
  });
});
