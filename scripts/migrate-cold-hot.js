#!/usr/bin/env node
/**
 * Cold-Hot Media Migration Script
 * 
 * 冷热分离逻辑：
 * - 热文件（当月）：保留在 Pages
 * - 冷文件（上个月及以前）：迁移到 R2
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

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

async function uploadToR2(localPath, r2Key) {
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
}

function getMDDate(content) {
  const dateMatch = content.match(/^date:\s*(\d{4}-\d{2})/m);
  return dateMatch ? dateMatch[1] : null;
}

function processMDFile(mdPath) {
  let content = fs.readFileSync(mdPath, 'utf8');
  const mdDate = getMDDate(content);
  
  if (!mdDate) {
    console.log(`⚠️ 跳过（无日期）: ${mdPath}`);
    return;
  }
  
  const isHot = mdDate === CURRENT_MONTH;
  console.log(`${isHot ? '🔥' : '❄️'} ${path.basename(mdPath)} (${mdDate})`);
  
  if (isHot) {
    console.log(`   保留在 Pages（当月文件）`);
    return;
  }

  // 处理 video 字段 - 支持 /prompts/ 或 prompts/ 格式
  const videoMatch = content.match(/^video:\s*["']?(\/?prompts\/[^"'\s]+)["']?/m);
  if (videoMatch) {
    let localPath = videoMatch[1];
    // 去掉前导斜杠
    localPath = localPath.replace(/^\//, '');
    
    // 如果已经是完整 URL（http开头），跳过
    if (localPath.startsWith('http')) {
      console.log(`   📹 已是 R2 URL`);
      return;
    }
    
    const fullLocalPath = path.join(projectRoot, 'static', localPath);
    
    if (fs.existsSync(fullLocalPath)) {
      uploadToR2(fullLocalPath, localPath).then(() => {
        const newVideoUrl = `${PUBLIC_URL}/${localPath}`;
        // 替换为完整 URL
        content = content.replace(
          /^video:\s*["']?\/?.+?["']?\s*$/m,
          `video: "${newVideoUrl}"`
        );
        fs.writeFileSync(mdPath, content);
        fs.unlinkSync(fullLocalPath);
        console.log(`   📹 已迁移: ${localPath}`);
      }).catch(err => console.error(`   ❌ 失败: ${localPath}`, err.message));
    } else {
      console.log(`   📹 本地文件不存在: ${localPath}`);
    }
  }

  // 处理 image/cover 字段
  const imageMatch = content.match(/^(?:image|cover):\s*["']?(\/?prompts\/[^"'\s]+)["']?/m);
  if (imageMatch) {
    let localPath = imageMatch[1];
    localPath = localPath.replace(/^\//, '');
    
    if (localPath.startsWith('http')) {
      console.log(`   🖼️ 已是 R2 URL`);
      return;
    }
    
    const fullLocalPath = path.join(projectRoot, 'static', localPath);
    
    if (fs.existsSync(fullLocalPath)) {
      uploadToR2(fullLocalPath, localPath).then(() => {
        const newImageUrl = `${PUBLIC_URL}/${localPath}`;
        content = content.replace(
          /^(?:image|cover):\s*["']?\/?.+?["']?\s*$/m,
          `image: "${newImageUrl}"`
        );
        fs.writeFileSync(mdPath, content);
        fs.unlinkSync(fullLocalPath);
        console.log(`   🖼️ 已迁移: ${localPath}`);
      }).catch(err => console.error(`   ❌ 失败: ${localPath}`, err.message));
    } else {
      console.log(`   🖼️ 本地文件不存在: ${localPath}`);
    }
  }
}

function cleanupEmptyDirs() {
  const promptsDir = path.join(projectRoot, 'static', 'prompts');
  const coldMonths = ['2025-02', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
  
  for (const month of coldMonths) {
    const monthDir = path.join(promptsDir, month);
    if (fs.existsSync(monthDir)) {
      try {
        const entries = fs.readdirSync(monthDir, { withFileTypes: true });
        const hasFiles = entries.some(e => e.isFile());
        if (!hasFiles) {
          fs.rmdirSync(monthDir, { recursive: true });
          console.log(`🗑️ 删除空目录: ${month}`);
        }
      } catch (e) {
        // 目录可能不存在或无法读取
      }
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('❄️ Cold-Hot Media Migration Script');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📅 当前月份: ${CURRENT_MONTH}`);
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
    } catch (e) {
      // 忽略无法读取的目录
    }
  }
  
  walkDir(contentDir);
  console.log(`📄 发现 ${mdFiles.length} 个 MD 文件\n`);
  
  for (const mdPath of mdFiles) {
    processMDFile(mdPath);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('\n🧹 清理空目录...');
  cleanupEmptyDirs();
  
  console.log('\n🎉 冷热分离完成！');
}

main().catch(console.error);
