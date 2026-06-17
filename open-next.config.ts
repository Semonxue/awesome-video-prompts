import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// wrangler.toml 里已配置 D1 (DB) + R2 (MEDIA) + KV (CACHE)
// incrementalCache 用 dummy，等 R2 bucket 建好再升级
export default defineCloudflareConfig({});