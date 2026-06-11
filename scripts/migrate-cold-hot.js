#!/usr/bin/env node
/**
 * Cold-Hot Media Migration Script
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const HOT_MEDIA_DAYS = Number(process.env.HOT_MEDIA_DAYS || 14);
const CONCURRENCY = Number(process.env.R2_CONCURRENCY || 5);
const TODAY = new Date();
const HOT_CUTOFF = new Date(TODAY);

HOT_CUTOFF.setUTCHours(0, 0, 0, 0);
HOT_CUTOFF.setUTCDate(HOT_CUTOFF.getUTCDate() - HOT_MEDIA_DAYS);

const R2_CONFIG = {
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL.replace(/\/$/, '');

const s3Client = new S3Client(R2_CONFIG);

async function uploadToR2(localPath, r2Key, semaphore) {
  await semaphore.acquire();
  try {
    const fileContent = fs.readFileSync(localPath);
    const contentType = r2Key.endsWith('.mp4') ? 'video/mp4' : 
                       r2Key.endsWith('.jpg') || r2Key.endsWith('.jpeg') ? 'image/jpeg' :
                       r2Key.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
    }));
    
    console.log(`✅ 上传到 R2: ${r2Key}`);
  } finally {
    semaphore.release();
  }
}

// 简易信号量实现
class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }
  
  acquire() {
    return new Promise(resolve => {
      if (this.count < this.max) {
        this.count++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  release() {
    this.count--;
    const next = this.queue.shift();
    if (next) {
      this.count++;
      next();
    }
  }
}

function getMDDate(content) {
  // 支持 date: 2026-04-12 / '2026-04-12' / "2026-04-12"，兼容 YYYY-MM
  const dateMatch = content.match(/^date:\s*['"]?(\d{4}-\d{2}(?:-\d{2})?)/m);

  if (!dateMatch) return null;

  const normalizedDate = dateMatch[1].length === 7 ? `${dateMatch[1]}-01` : dateMatch[1];
  const parsedDate = new Date(`${normalizedDate}T00:00:00Z`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function collectMediaToMigrate(content, fieldPattern, label) {
  const mediaMatch = content.match(fieldPattern);
  if (!mediaMatch) return [];
  
  const fieldName = mediaMatch[1];
  const mediaPath = mediaMatch[2];
  
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    console.log(`   ${label} 已是 R2 URL`);
    return [];
  }
  
  const localPath = mediaPath.replace(/^\//, '');
  const fullLocalPath = path.join(projectRoot, 'static', localPath);
  
  if (!fs.existsSync(fullLocalPath)) {
    console.log(`   ${label} 本地文件不存在: ${localPath}`);
    return [];
  }
  
  return [{ fieldName, localPath, fullLocalPath, label }];
}

async function processMDFile(mdPath, semaphore) {
  let content = fs.readFileSync(mdPath, 'utf8');
  const mdDate = getMDDate(content);
  
  if (!mdDate) {
    console.log(`⚠️ 跳过（无日期）: ${path.basename(mdPath)}`);
    return [];
  }
  
  const isHot = mdDate >= HOT_CUTOFF;
  console.log(`${isHot ? '🔥' : '❄️'} ${path.basename(mdPath)} (${formatDate(mdDate)})`);
  
  if (isHot) {
    console.log(`   保留在 Pages（${HOT_MEDIA_DAYS} 天内文件）`);
    return [];
  }

  const mediaList = [
    ...collectMediaToMigrate(content, /^(video):\s*["']?(\/?prompts\/[^"'\s]+|https?:\/\/[^"'\s]+)["']?/m, '📹'),
    ...collectMediaToMigrate(content, /^(image|cover):\s*["']?(\/?prompts\/[^"'\s]+|https?:\/\/[^"'\s]+)["']?/m, '🖼️'),
  ];
  
  return { mdPath, content, mediaList };
}

async function migrateMediaBatch(batch, semaphore) {
  const uploadTasks = [];
  
  for (const { mdPath, content, mediaList } of batch) {
    for (const { fieldName, localPath, fullLocalPath, label } of mediaList) {
      uploadTasks.push(
        uploadToR2(fullLocalPath, localPath, semaphore).then(() => {
          const newMediaUrl = `${PUBLIC_URL}/${localPath}`;
          const replacePattern = new RegExp(`^${fieldName}:\\s*["']?[^\\n]+["']?\\s*$`, 'm');
          
          const fileContent = fs.readFileSync(mdPath, 'utf8');
          const newContent = fileContent.replace(replacePattern, `${fieldName}: "${newMediaUrl}"`);
          fs.writeFileSync(mdPath, newContent);
          
          if (fs.existsSync(fullLocalPath)) {
            fs.unlinkSync(fullLocalPath);
          }
          
          console.log(`   ${label} 已迁移: ${localPath}`);
        }).catch(err => {
          console.error(`   ❌ 上传失败: ${localPath}`, err.message);
        })
      );
    }
  }
  
  await Promise.all(uploadTasks);
}

function cleanupEmptyDirs() {
  const promptsDir = path.join(projectRoot, 'static', 'prompts');

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

async function main() {
  const semaphore = new Semaphore(CONCURRENCY);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('❄️ Cold-Hot Media Migration Script');
  console.log('═══════════════════════════════════════════════════');
 console.log(`📅 当前日期: ${formatDate(TODAY)}`);
  console.log(`🔥 热数据阈值: 最近 ${HOT_MEDIA_DAYS} 天（>= ${formatDate(HOT_CUTOFF)}，保留在 Pages）`);
  console.log(`❄️ 冷数据: 超过 ${HOT_MEDIA_DAYS} 天，迁移到 R2`);
  console.log(`⚡ 并发数: ${CONCURRENCY}`);
  console.log(`📦 R2 Bucket: ${BUCKET_NAME}`);
  console.log(`🌐 R2 URL: ${PUBLIC_URL}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  if (!process.env.R2_ACCOUNT_ID) {
    console.error('❌ 缺少 R2 环境变量');
    process.exit(1);
  }
  
  const contentDir = path.join(projectRoot, 'content');
  const mdFiles = [];
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(fullPath);
        else if (entry.name.endsWith('.md')) mdFiles.push(fullPath);
      }
    } catch (e) {}
  }
  
  walkDir(contentDir);
 console.log(`📄 发现 ${mdFiles.length} 个 MD 文件\n`);
  
  // 第一阶段：收集所有需要迁移的文件
  const batchTasks = [];
  for (const mdPath of mdFiles) {
    batchTasks.push(processMDFile(mdPath, semaphore));
  }
  const results = await Promise.all(batchTasks);
  const batches = results.filter(r => r.mediaList && r.mediaList.length > 0);
  
  console.log(`\n📤 发现 ${batches.reduce((sum, b) => sum + b.mediaList.length, 0)} 个媒体文件待迁移到 R2\n`);
  
  // 第二阶段：并行上传（带并发控制）
  await migrateMediaBatch(batches, semaphore);

  console.log('\n🧹 清理空目录...');
  cleanupEmptyDirs();
  
  console.log('\n🎉 冷热分离完成！');
}

main().catch(console.error);