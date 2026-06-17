/**
 * 首页 /[locale]/
 */
import { getTranslations } from 'next-intl/server';
import { PromptCard } from '@/components/PromptCard';
import type { Locale } from '@/i18n/request';
import type { PromptCard as PromptCardType } from '@/lib/prompts';

export const revalidate = 3600; // ISR: 1 小时

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string; model?: string; q?: string; page?: string }>;
}

export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations();

  const page = parseInt(sp.page || '1');
  const pageSize = 24;

  // 查 D1（SSR，数据总比前端加载更早）
  // 注意：在 App Router + OpenNext 里，DB binding 通过 context.env 传入
  // 这里我们通过 fetch 自己的 API 来保持一致（也可直接调用 lib 函数）
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesomevideoprompts.com';
  const apiUrl = new URL(`${baseUrl}/api/prompts`);
  apiUrl.searchParams.set('locale', locale);
  if (sp.tag) apiUrl.searchParams.set('tag', sp.tag);
  if (sp.model) apiUrl.searchParams.set('model', sp.model);
  if (sp.q) apiUrl.searchParams.set('q', sp.q);
  apiUrl.searchParams.set('page', String(page));
  apiUrl.searchParams.set('pageSize', String(pageSize));

  let prompts: PromptCardType[] = [];
  let total = 0;
  let hasMore = false;

  try {
    const res = await fetch(apiUrl.toString(), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      ({ items: prompts, total, hasMore } = data);
    }
  } catch (error) {
    // 本地开发时可能没有 D1，显示空状态
    console.warn('Failed to fetch prompts:', error);
  }

  return (
    <main>
      <header>
        <h1>{t('site.title')}</h1>
        <p>{t('site.description')}</p>

        {/* 统计 */}
        <div className="stats-bar">
          <span>{total.toLocaleString()} {t('stats.prompts')}</span>
        </div>

        {/* 筛选表单 */}
        <form className="filter-bar" method="get">
          <input name="q" defaultValue={sp.q} placeholder={t('nav.search')} />
          <select name="tag" defaultValue={sp.tag || ''}>
            <option value="">{t('filter.allTags')}</option>
          </select>
          <select name="model" defaultValue={sp.model || ''}>
            <option value="">{t('filter.allModels')}</option>
          </select>
          <button type="submit">Search</button>
        </form>
      </header>

      {prompts.length === 0 ? (
        <div className="empty-state">
          <p>{t('empty.noResults')}</p>
        </div>
      ) : (
        <>
          <div className="prompt-grid">
            {prompts.map((p) => (
              <PromptCard key={`${p.locale}-${p.id}`} prompt={p} locale={locale} />
            ))}
          </div>

          {/* 分页 */}
          <div className="pagination">
            {page > 1 && (
              <a href={`/${locale}?${buildQueryString({ ...sp, page: String(page - 1) })}`}>
                ← Prev
              </a>
            )}
            <span>Page {page}</span>
            {hasMore && (
              <a href={`/${locale}?${buildQueryString({ ...sp, page: String(page + 1) })}`}>
                Next →
              </a>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function buildQueryString(params: Record<string, string>) {
  return new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
}
