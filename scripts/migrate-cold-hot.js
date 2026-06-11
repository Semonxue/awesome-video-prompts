#!/usr/bin/env node
/**
 * Cold-Hot Media Migration Script (v3)
 *
 * 设计目标：
 * - Pages 部署：仅渲染 HTML + 主题/静态资源（媒体不在 Pages 部署包里）
 * - 媒体：≤ RECENT_MONTHS 月的（默认 2 = 当月+上月）→ 保留在本地 static/，由 Pages 直接提供
 *         更老的 → 上传 R2 + 从本地 static/ unlink（让 hugo 不会把它复制到 public/）
 * - 避免反复覆盖：上传前 HeadObject 探一下，R2 已有就跳过 PUT
 * - 并发上传：8 路（可调）
 *
 * 环境变量：
 *   HOT_MEDIA_DAYS       热数据天数（默认 14，保留在 Pages）
 *   RECENT_MONTHS        保留窗口大小（默认 2 = 当月+上月）
 *   MIGRATE_CONCURRENCY  并发数（默认 8）
 *   MIGRATE_FORCE         =1 时全量处理（首次建基线）
 *   DRY_RUN               =1 时只打印不真传
 *   R2_*                  Cloudflare R2 凭证
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// ============== 配置 ==============
const HOT_MEDIA_DAYS = Number(process.env.HOT_MEDIA_DAYS || 14);
const RECENT_MONTHS = Number(process.env.RECENT_MONTHS || 2);
const MIGRATE_CONCURRENCY = Number(process.env.MIGRATE_CONCURRENCY || 8);
const MIGRATE_FORCE = process.env.MIGRATE_FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";

const TODAY = new Date();
const HOT_CUTOFF = new Date(TODAY);
HOT_CUTOFF.setUTCHours(0, 0, 0, 0);
HOT_CUTOFF.setUTCDate(HOT_CUTOFF.getUTCDate() - HOT_MEDIA_DAYS);

// 保留窗口起点：当月往前推 (RECENT_MONTHS - 1) 月
// 例：当前 2026-06, RECENT_MONTHS=2 → 保留窗口起点 = 2026-05
//     → 2026-05、2026-06 视为"近"，保留在 Pages
//     → ≤ 2026-04 视为"老"，上传 R2
const KEEP_FROM = new Date(Date.UTC(
  TODAY.getUTCFullYear(),
  TODAY.getUTCMonth() - (RECENT_MONTHS - 1),
  1
));
const KEEP_FROM_STR = `${KEEP_FROM.getUTCFullYear()}-${String(KEEP_FROM.getUTCMonth() + 1).padStart(2, "0")}`;

const R2_CONFIG = {
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
const s3Client = new S3Client(R2_CONFIG);

// ============== 工具函数 ==============
function getMDMonth(mdPath) {
  // 从 content/prompts/YYYY-MM/... 抽月份
  const m = mdPath.match(/content\/prompts\/(\d{4}-\d{2})\//);
  return m ? m[1] : null;
}

/**
 * 是否"老月份"（需要上传 R2）
 * - 路径不规范 → 保守当"老"处理（宁传不少传）
 * - MIGRATE_FORCE → 全量
 * - month < KEEP_FROM_STR → 老（需处理）
 * - month >= KEEP_FROM_STR → 近（保留 Pages）
 */
function isOldMonth(mdPath) {
  if (MIGRATE_FORCE) return true;
  const month = getMDMonth(mdPath);
  if (!month) return true; // 路径不规范 → 当老处理
  return month < KEEP_FROM_STR;
}

function getContentType(r2Key) {
  if (r2Key.endsWith(".mp4")) return "video/mp4";
  if (r2Key.endsWith(".jpg") || r2Key.endsWith(".jpeg")) return "image/jpeg";
  if (r2Key.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getMDDate(content) {
  // 支持 date: 2026-04-12 / '2026-04-12' / "2026-04-12"，兼容 YYYY-MM
  const dateMatch = content.match(/^date:\s*['"]?(\d{4}-\d{2}(?:-\d{2})?)/m);
  if (!dateMatch) return null;
  const normalizedDate = dateMatch[1].length === 7 ? `${dateMatch[1]}-01` : dateMatch[1];
  const parsedDate = new Date(`${normalizedDate}T00:00:00Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// ============== R2 操作 ==============
async function r2Exists(r2Key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key }));
    return true;
  } catch (err) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
    if (err.name === "NotFound") return false;
    return false;
  }
}

async function uploadToR2(localPath, r2Key) {
  if (DRY_RUN) {
    console.log(`   🧪 [DRY_RUN] 假装上传: ${r2Key}`);
    return;
  }
  const fileContent = fs.readFileSync(localPath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: getContentType(r2Key),
    })
  );
  console.log(`   ✅ 上传到 R2: ${r2Key}`);
}

async function ensureUploaded(localPath, r2Key) {
  // 细筛：先探后传
  if (!DRY_RUN && (await r2Exists(r2Key))) {
    console.log(`   ⏭️  R2 已有: ${r2Key}`);
    return;
  }
  await uploadToR2(localPath, r2Key);
}

// ============== MD 处理 ==============
async function migrateMediaField(content, mdPath, fieldPattern, label) {
  const mediaMatch = content.match(fieldPattern);
  if (!mediaMatch) return content;

  const fieldName = mediaMatch[1];
  const mediaPath = mediaMatch[2];

  if (mediaPath.startsWith("http://") || mediaPath.startsWith("https://")) {
    console.log(`   ${label} 已是 R2 URL`);
    return content;
  }

  const localPath = mediaPath.replace(/^\//, "");
  const fullLocalPath = path.join(projectRoot, "static", localPath);

  if (!fs.existsSync(fullLocalPath)) {
    console.log(`   ${label} 本地文件不存在: ${localPath}`);
    return content;
  }

  try {
    await ensureUploaded(fullLocalPath, localPath);
    const newMediaUrl = `${PUBLIC_URL}/${localPath}`;
    const replacePattern = new RegExp(`^${fieldName}:\\s*["']?[^\\n]+["']?\\s*$`, "m");

    if (DRY_RUN) {
      console.log(`   🧪 [DRY_RUN] 本应重写: ${fieldName}: "${newMediaUrl}"`);
    } else {
      content = content.replace(replacePattern, `${fieldName}: "${newMediaUrl}"`);
      if (fs.existsSync(fullLocalPath)) {
        fs.unlinkSync(fullLocalPath);
      }
      console.log(`   ${label} 已迁移: ${localPath}`);
    }
  } catch (err) {
    console.error(`   ❌ 上传失败: ${localPath}`, err.message);
  }

  return content;
}

async function processMDFile(mdPath) {
  let content = fs.readFileSync(mdPath, "utf8");
  const mdDate = getMDDate(content);

  if (!mdDate) {
    console.log(`⚠️ 跳过（无日期）: ${path.basename(mdPath)}`);
    return;
  }

  const isHot = mdDate >= HOT_CUTOFF;
  console.log(`${isHot ? "🔥" : "❄️"} ${path.basename(mdPath)} (${formatDate(mdDate)})`);

  if (isHot) {
    console.log(`   保留在 Pages（${HOT_MEDIA_DAYS} 天内文件）`);
    return;
  }

  content = await migrateMediaField(
    content,
    mdPath,
    /^(video):\s*["']?(\/?prompts\/[^"'\s]+|https?:\/\/[^"'\s]+)["']?/m,
    "📹"
  );
  content = await migrateMediaField(
    content,
    mdPath,
    /^(image|cover):\s*["']?(\/?prompts\/[^"'\s]+|https?:\/\/[^"'\s]+)["']?/m,
    "🖼️"
  );

  if (!DRY_RUN) {
    fs.writeFileSync(mdPath, content);
  }
}

// ============== 清理 ==============
function cleanupEmptyDirs() {
  const promptsDir = path.join(projectRoot, "static", "prompts");

  function removeEmptyDirs(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        removeEmptyDirs(path.join(dir, entry.name));
      }
    }
    if (dir === promptsDir) return;
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      console.log(`🗑️ 删除空目录: ${path.relative(promptsDir, dir)}`);
    }
  }

  if (fs.existsSync(promptsDir)) {
    removeEmptyDirs(promptsDir);
  }
}

// ============== 主流程 ==============
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("❄️ Cold-Hot Media Migration Script (v3)");
  console.log("═══════════════════════════════════════════════════");
  console.log(`📅 当前日期: ${formatDate(TODAY)}`);
  console.log(`🔥 热数据阈值: 最近 ${HOT_MEDIA_DAYS} 天（>= ${formatDate(HOT_CUTOFF)}）`);
  console.log(`📆 保留窗口: >= ${KEEP_FROM_STR}（当月 + ${RECENT_MONTHS - 1} 月，RECENT_MONTHS=${RECENT_MONTHS}）`);
  console.log(`⚡ 并发: ${MIGRATE_CONCURRENCY}（MIGRATE_CONCURRENCY）`);
  console.log(`🔧 强制全量: ${MIGRATE_FORCE ? "是" : "否"}（MIGRATE_FORCE）`);
  console.log(`🧪 DRY_RUN: ${DRY_RUN ? "是" : "否"}`);
  console.log(`📦 R2 Bucket: ${BUCKET_NAME}`);
  console.log(`🌐 R2 URL: ${PUBLIC_URL}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (!process.env.R2_ACCOUNT_ID) {
    console.warn("⚠️  未配置 R2 凭证（缺少 R2_ACCOUNT_ID）");
    console.warn("   → 跳过 R2 迁移，保留所有媒体在本地 static/，hugo 将直接从本地渲染");
    console.warn("   → 之后本地跑 MIGRATE_FORCE=1 可补齐 R2 基线");
    return;
  }

  const contentDir = path.join(projectRoot, "content");
  const mdFiles = [];

  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(fullPath);
        else if (entry.name.endsWith(".md")) mdFiles.push(fullPath);
      }
    } catch (e) {}
  }

  walkDir(contentDir);
  console.log(`📄 发现 ${mdFiles.length} 个 MD 文件`);

  // 月份粗筛（反向：处理老月份）
  const toProcess = mdFiles.filter(isOldMonth);
  const skippedRecent = mdFiles.length - toProcess.length;
  console.log(
    `⏭️  保留窗口：跳过 ${skippedRecent} 个近端月份（>= ${KEEP_FROM_STR}），处理 ${toProcess.length} 个老月份${
      MIGRATE_FORCE ? "（MIGRATE_FORCE=1）" : ""
    }\n`
  );

  if (toProcess.length === 0) {
    console.log("🎉 没有需要处理的 MD，跳过上传环节。");
    return;
  }

  // 并发处理
  const limit = pLimit(MIGRATE_CONCURRENCY);
  const tasks = toProcess.map((mdPath) => limit(() => processMDFile(mdPath)));
  await Promise.all(tasks);

  if (DRY_RUN) {
    console.log("\n🧪 [DRY_RUN] 跳过清理空目录和写文件操作。");
  } else {
    console.log("\n🧹 清理空目录...");
    cleanupEmptyDirs();
  }

  console.log("\n🎉 冷热分离完成！");
}

main().catch(console.error);
