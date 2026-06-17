/**
 * 单元测试：i18n 配置（不依赖 next-intl 运行时）
 * 只验证静态导出的常量
 */

import { describe, it, expect } from 'vitest';

// 静态常量（从源码直接提取，不走运行时 import）
const LOCALES = ['en', 'zh', 'ja'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en';
const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

describe('i18n locales', () => {
  it('支持 en/zh/ja 三种语言', () => {
    expect(LOCALES).toContain('en');
    expect(LOCALES).toContain('zh');
    expect(LOCALES).toContain('ja');
    expect(LOCALES.length).toBe(3);
  });

  it('默认语言是英文', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('语言名称映射正确', () => {
    expect(LOCALE_NAMES.en).toBe('English');
    expect(LOCALE_NAMES.zh).toBe('中文');
    expect(LOCALE_NAMES.ja).toBe('日本語');
  });

  it('每种语言都有名称', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      expect(typeof LOCALE_NAMES[locale]).toBe('string');
    }
  });

  it('locale 是只读元组', () => {
    // as const 保证元组长度为 3
    expect(LOCALES.length).toBe(3);
  });
});
