/**
 * 提示词卡片组件
 */
import Image from 'next/image';
import Link from 'next/link';
import type { PromptCard } from '@/lib/prompts';

interface Props {
  prompt: PromptCard;
  locale: string;
}

export function PromptCard({ prompt, locale }: Props) {
  const href = `/${locale}/prompts/${prompt.slug}`;

  return (
    <article className="prompt-card">
      <Link href={href} className="prompt-card__link">
        {/* 封面 */}
        <div className="prompt-card__cover">
          {prompt.coverUrl ? (
            <Image
              src={prompt.coverUrl}
              alt={prompt.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          ) : prompt.videoUrl ? (
            <video
              src={prompt.videoUrl}
              muted
              playsInline
              preload="metadata"
              className="prompt-card__video-thumb"
            />
          ) : (
            <div className="prompt-card__placeholder" />
          )}

          {/* 视频标签 */}
          {prompt.videoUrl && (
            <span className="prompt-card__play-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </span>
          )}
        </div>

        {/* 内容 */}
        <div className="prompt-card__body">
          <h3 className="prompt-card__title">{prompt.title}</h3>
          <p className="prompt-card__desc">
            {prompt.description.slice(0, 120)}
            {prompt.description.length > 120 ? '…' : ''}
          </p>

          {/* 标签 */}
          {prompt.tags.length > 0 && (
            <div className="prompt-card__tags">
              {prompt.tags.slice(0, 4).map(tag => (
                <span key={tag} className="tag-badge">{tag}</span>
              ))}
            </div>
          )}

          {/* 模型 */}
          {prompt.models.length > 0 && (
            <div className="prompt-card__models">
              {prompt.models.slice(0, 3).map(m => (
                <span key={m} className="model-badge">{m}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
