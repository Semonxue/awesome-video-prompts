import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // 验证 locale
  if (!locale || !locales.includes(locale as Locale)) {
    return { locale: defaultLocale };
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
