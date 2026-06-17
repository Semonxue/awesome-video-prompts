/**
 * Cloudflare Pages Functions: 301 重定向旧 Hugo URL
 * 文件路径: functions/_middleware.ts
 * 对应 OpenNext 部署后会映射到 /_middleware
 */

export async function onRequest(context: { request: Request; next: (opts?: { request?: Request }) => Promise<Response> }) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // ============================================================
  // 老 Hugo URL → 新 Next.js URL 301 重定向
  // ============================================================

  // 1. /zh-cn/* → /zh/*
  if (pathname.startsWith('/zh-cn/')) {
    const newPath = pathname.replace('/zh-cn/', '/zh/');
    return Response.redirect(`${url.origin}${newPath}${url.search}`, 301);
  }

  // 2. /ja/* → /ja/* (Hugo 的 ja 在 content/ja，没前缀，Next.js 要一致)
  // 如果旧站 /ja/xxx 也有 prefix，这段删掉

  // 3. /prompts/YYYY/MM/slug/ → /en/prompts/YYYY/MM/slug/
  // 英文默认语言
  const promptsMatch = pathname.match(/^\/prompts\/(\d{4})\/(\d{2})\/(.+)\/?$/);
  if (promptsMatch) {
    const [, year, month, slug] = promptsMatch;
    // 尝试从 URL 或其他地方判断原始语言（这里默认英文）
    const newPath = `/en/prompts/${year}/${month}/${slug}/`;
    return Response.redirect(`${url.origin}${newPath}${url.search}`, 301);
  }

  // 4. 旧 Tags 页: /tags/ → /en?tag=
  const oldTagsMatch = pathname.match(/^\/tags\/(.+)\/?$/);
  if (oldTagsMatch) {
    const tag = oldTagsMatch[1];
    const newPath = `/en?tag=${encodeURIComponent(tag)}`;
    return Response.redirect(`${url.origin}${newPath}${url.search}`, 301);
  }

  // 5. 旧 Models 页: /models/ → /en?model=
  const oldModelsMatch = pathname.match(/^\/models\/(.+)\/?$/);
  if (oldModelsMatch) {
    const model = oldModelsMatch[1];
    const newPath = `/en?model=${encodeURIComponent(model)}`;
    return Response.redirect(`${url.origin}${newPath}${url.search}`, 301);
  }

  // 继续交给 Workers 处理
  return context.next();
}
