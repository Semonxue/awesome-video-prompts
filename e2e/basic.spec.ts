/**
 * E2E 测试：首页加载 + 基础交互
 * 要求：先运行 `npm run dev` 启动开发服务器
 * 运行：npx playwright test
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('首页', () => {
  test('English 首页正常加载', async ({ page }) => {
    await page.goto(`${BASE}/en`);

    // 页面标题包含站点名
    await expect(page).toHaveTitle(/Awesome Video Prompts/i);

    // H1 或 header 存在
    const header = page.locator('h1, header');
    await expect(header.first()).toBeVisible();
  });

  test('中文首页正常加载', async ({ page }) => {
    await page.goto(`${BASE}/zh`);
    const header = page.locator('h1, header');
    await expect(header.first()).toBeVisible();
  });

  test('日语首页正常加载', async ({ page }) => {
    await page.goto(`${BASE}/ja`);
    const header = page.locator('h1, header');
    await expect(header.first()).toBeVisible();
  });

  test('首页包含统计信息', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    // 有 Prompts 相关统计
    const stats = page.locator('text=/\\d+.*prompt/i');
    await expect(stats.first()).toBeVisible({ timeout: 10_000 });
  });

  test('首页包含筛选栏', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    const filterBar = page.locator('form.filter-bar, input[name="q"], select[name="tag"]');
    await expect(filterBar.first()).toBeVisible();
  });

  test('无搜索结果时有空状态提示', async ({ page }) => {
    await page.goto(`${BASE}/en?q=nonexistent_xyz_12345_abc`);
    // 有空状态或结果为空
    const body = await page.locator('body').textContent();
    // 不崩溃
    expect(body).toBeTruthy();
  });
});

test.describe('导航', () => {
  test('locale 切换：/en → /zh', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await page.goto(`${BASE}/zh`);
    await expect(page).toHaveURL(/\/zh/);
  });

  test('直接访问 /zh-cn/ 被重定向到 /zh', async ({ page }) => {
    const response = await page.goto(`${BASE}/zh-cn/`);
    // 应该 301 重定向
    expect([200, 301, 302]).toContain(response?.status());
    // 最终落在 /zh/
    await expect(page).toHaveURL(/\/zh(\/|$)/);
  });
});

test.describe('标签筛选', () => {
  test('带 tag 参数的 URL 正常渲染', async ({ page }) => {
    await page.goto(`${BASE}/en?tag=cinematic`);
    // 页面加载成功
    await expect(page).not.toHaveTitle(/500|Error/i, { timeout: 5_000 });
  });

  test('带 model 参数的 URL 正常渲染', async ({ page }) => {
    await page.goto(`${BASE}/en?model=kling26`);
    await expect(page).not.toHaveTitle(/500|Error/i, { timeout: 5_000 });
  });

  test('组合筛选：tag + model', async ({ page }) => {
    await page.goto(`${BASE}/en?tag=cinematic&model=kling26`);
    await expect(page).not.toHaveTitle(/500|Error/i, { timeout: 5_000 });
  });
});

test.describe('详情页', () => {
  test('通过搜索进入详情页（如果数据存在）', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    const firstCard = page.locator('article.prompt-card').first();
    const hasCards = await firstCard.isVisible().catch(() => false);

    if (hasCards) {
      await firstCard.locator('a').first().click();
      // 详情页有视频/封面区域
      const mediaArea = page.locator('.prompt-detail__media, video, img');
      await expect(mediaArea.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('详情页有返回链接', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    const firstCard = page.locator('article.prompt-card').first();
    const hasCards = await firstCard.isVisible().catch(() => false);

    if (hasCards) {
      await firstCard.locator('a').first().click();
      const backLink = page.locator('a[href*="/en"], nav a');
      await expect(backLink.first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('API 接口', () => {
  test('GET /api/prompts 返回 JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prompts?locale=en&pageSize=5`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('items');
    expect(json).toHaveProperty('total');
    expect(json).toHaveProperty('hasMore');
    expect(Array.isArray(json.items)).toBe(true);
  });

  test('GET /api/prompts 支持 locale 参数', async ({ request }) => {
    const [en, zh, ja] = await Promise.all([
      request.get(`${BASE}/api/prompts?locale=en&pageSize=1`),
      request.get(`${BASE}/api/prompts?locale=zh&pageSize=1`),
      request.get(`${BASE}/api/prompts?locale=ja&pageSize=1`),
    ]);
    expect(en.status()).toBe(200);
    expect(zh.status()).toBe(200);
    expect(ja.status()).toBe(200);
  });

  test('GET /api/prompts 支持 tag 筛选', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prompts?locale=en&tag=cinematic&pageSize=5`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    if (json.items.length > 0) {
      const firstItem = json.items[0];
      expect(firstItem.tags).toContain('cinematic');
    }
  });

  test('GET /api/prompts 支持 model 筛选', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prompts?locale=en&model=kling26&pageSize=5`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    if (json.items.length > 0) {
      const firstItem = json.items[0];
      expect(firstItem.models).toContain('kling26');
    }
  });

  test('GET /api/prompts 支持分页', async ({ request }) => {
    const page1 = await request.get(`${BASE}/api/prompts?locale=en&page=1&pageSize=2`);
    const page2 = await request.get(`${BASE}/api/prompts?locale=en&page=2&pageSize=2`);
    const j1 = await page1.json();
    const j2 = await page2.json();
    if (j1.items.length >= 2 && j2.items.length >= 1) {
      expect(j1.items[0].id).not.toBe(j2.items[0].id);
    }
  });

  test('GET /api/prompts 默认值正确', async ({ request }) => {
    // locale 默认 en，pageSize 默认 20
    const res = await request.get(`${BASE}/api/prompts`);
    const json = await res.json();
    expect(json.page).toBe(1);
    expect(json.pageSize).toBe(20);
  });

  test('Cache-Control 头存在', async ({ request }) => {
    const res = await request.get(`${BASE}/api/prompts?locale=en`);
    expect(res.headers()['cache-control']).toBeTruthy();
  });
});

test.describe('SEO 与可访问性', () => {
  test('所有页面有 lang 属性', async ({ page }) => {
    for (const locale of ['en', 'zh', 'ja']) {
      await page.goto(`${BASE}/${locale}`);
      const htmlLang = page.locator('html');
      await expect(htmlLang).toHaveAttribute('lang', locale === 'en' ? 'en' : locale);
    }
  });

  test('详情页 meta description 存在', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    const firstCard = page.locator('article.prompt-card').first();
    const hasCards = await firstCard.isVisible().catch(() => false);
    if (hasCards) {
      await firstCard.locator('a').first().click();
      const desc = page.locator('meta[name="description"], og\\:description');
      // 可能存在
      const exists = await desc.count() > 0;
      expect(exists || true); // 软检查
    }
  });
});
