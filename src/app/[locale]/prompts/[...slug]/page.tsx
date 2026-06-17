/**
 * 提示词详情页 /[locale]/prompts/[...slug]/
 * slug 格式: YYYY/MM/slug 或直接 slug
 */
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/request';
import type { PromptCard } from '@/lib/prompts';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string[] }>;
}

export async function generateStaticParams() {
  // 预生成最热门的页面（可选）
  return [];
}

export default async function PromptDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const slugPath = slug.join('/');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesomevideoprompts.com';
  const apiUrl = `${baseUrl}/api/prompts?locale=${locale}&q=${encodeURIComponent(slugPath)}&pageSize=1`;

  const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
  if (!res.ok) notFound();

  const data = await res.json();
  const prompt: PromptCard | undefined = data.items?.[0];

  if (!prompt) notFound();

  return (
    <article className="prompt-detail">
      <nav>
        <Link href={`/${locale}`}>← {locale === 'zh' ? '返回' : locale === 'ja' ? '戻る' : 'Back'}</Link>
      </nav>

      {/* 视频/封面 */}
      <div className="prompt-detail__media">
        {prompt.videoUrl ? (
          <video
            src={prompt.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="prompt-detail__video"
          />
        ) : prompt.coverUrl ? (
          <Image
            src={prompt.coverUrl}
            alt={prompt.title}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        ) : null}
      </div>

      <h1>{prompt.title}</h1>

      {/* 元信息 */}
      <div className="prompt-detail__meta">
        {prompt.author && <span>👤 {prompt.author}</span>}
        {prompt.sourceUrl && (
          <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer">
            🔗 {locale === 'zh' ? '来源' : locale === 'ja' ? 'ソース' : 'Source'}
          </a>
        )}
      </div>

      {/* 标签 & 模型 */}
      <div className="prompt-detail__tags">
        {prompt.tags.map(tag => (
          <Link key={tag} href={`/${locale}?tag=${tag}`} className="tag-badge">{tag}</Link>
        ))}
        {prompt.models.map(m => (
          <Link key={m} href={`/${locale}?model=${m}`} className="model-badge">{m}</Link>
        ))}
      </div>

      {/* 提示词正文 */}
      <div className="prompt-detail__content">
        <h2>{locale === 'zh' ? '提示词' : locale === 'ja' ? 'プロンプト' : 'Prompt'}</h2>
        <pre className="prompt-text">{prompt.description}</pre>
      </div>

      {/* 复制按钮 */}
      <button
        className="copy-btn"
        onClick={() => { navigator.clipboard.writeText(prompt.description || ''); }}
      >
        📋 {locale === 'zh' ? '复制提示词' : locale === 'ja' ? 'プロンプトをコピー' : 'Copy Prompt'}
      </button>
    </article>
  );
}
