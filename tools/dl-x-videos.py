#!/usr/bin/env python3
"""
X (Twitter) 视频/帖子信息提取工具

功能:
    使用本地安装的 yt-dlp 命令行工具，从指定的 X (Twitter) 帖子 URL 中提取
    元数据，包括作者信息、帖子内容、发布时间、缩略图以及视频下载链接。

依赖:
    - Python 3.x
    - yt-dlp (需安装在指定路径或系统 PATH 中)

使用方法:
    python tools/dl-x-videos.py <URL> [选项]

参数:
    url         X (Twitter) 帖子的 URL 地址
    --json      (可选/默认) 以格式化的 JSON 字符串输出提取结果
"""

import subprocess
import json
import sys
import argparse
import os
import shutil
import requests
from bs4 import BeautifulSoup


def normalize_url(url: str) -> str:
    # yt-dlp 对 'x.com' 的域名支持可能不如 'twitter.com' 稳定，
    # 将域名替换为旧版 'twitter.com' 以提高解析成功率
    if "x.com" in url:
        return url.replace("x.com", "twitter.com", 1)
    return url


def get_fixupx_text(url: str) -> str:
    """尝试从 fixupx.com 获取完整的帖子文本"""
    # 将 x.com/twitter.com 替换为 fixupx.com
    fixup_url = url
    if "x.com" in fixup_url:
        fixup_url = fixup_url.replace("x.com", "fixupx.com")
    elif "twitter.com" in fixup_url:
        fixup_url = fixup_url.replace("twitter.com", "fixupx.com")
    else:
        return None

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"
        }
        
        # 短超时，避免阻塞太久
        response = requests.get(fixup_url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
            
        soup = BeautifulSoup(response.text, "html.parser")
        meta_desc = soup.find("meta", property="og:description")
        
        if meta_desc and meta_desc.get("content"):
            return meta_desc["content"]
            
        return None
    except Exception:
        # 失败时不影响主流程
        return None


def extract_tweet_info(url: str) -> dict:
    normalized = normalize_url(url)

    # 构造 yt-dlp 系统调用命令
    cmd = [
        # 使用绝对路径指定 yt-dlp，避免环境差异问题
        "/Users/semonxue/miniconda3/bin/yt-dlp",
        "--dump-json",      # 获取元数据 JSON
        "--skip-download",  # 不下载实际视频文件
        normalized
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=30
        )

        # 解析 yt-dlp 返回的 JSON 数据
        data = json.loads(result.stdout.strip())

        # 提取业务需要的核心字段
        extracted = {
            "success": True,
            "url": url,
            "post_id": data.get("id"),
            "text": data.get("description", ""),
            "author_name": data.get("uploader", ""),
            "author_username": data.get("uploader_id", ""),
            "author_url": data.get("uploader_url", ""),
            "post_date": data.get("upload_date", ""),
            "thumbnail": data.get("thumbnail"),
            "videos": []
        }

        # 尝试补全可能被截断的文本
        # yt-dlp 有时获取的 description 是不完整的，通过 fixupx 可以获取完整内容
        full_text = get_fixupx_text(url)
        if full_text and len(full_text) > len(extracted["text"]):
            # fixupx有时会在末尾保留截断指示或乱码，但通常包含更多内容
            # 这里简单做一个替换
            extracted["text"] = full_text

        # 筛选视频格式流 (过滤掉纯音频或无效格式)
        for f in data.get("formats", []):
            if f.get("vcodec") != "none" and "url" in f:
                extracted["videos"].append({
                    "resolution": f"{f.get('width', '?')}x{f.get('height', '?')}",
                    "url": f.get("url"),
                    "format_id": f.get("format_id")
                })

        return extracted

    except Exception as e:
        return {"success": False, "error": str(e)}


def process_download(metadata: dict, url: str) -> dict:
    """下载视频、生成预览并保存相关文件到 temp 目录"""
    post_id = metadata.get("post_id")
    if not post_id:
        return metadata

    # 准备目录: temp/<post_id>
    base_dir = "temp"
    output_dir = os.path.join(base_dir, post_id)
    os.makedirs(output_dir, exist_ok=True)

    normalized = normalize_url(url)
    
    # 构造 yt-dlp 下载命令
    # 强制 mp4 格式以便后续处理
    output_template = os.path.join(output_dir, "video.%(ext)s")
    cmd = [
        "/Users/semonxue/miniconda3/bin/yt-dlp",
        "--no-warnings",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        "--write-thumbnail",
        "--convert-thumbnails", "jpg",
        normalized
    ]

    # 使用 stderr 输出日志，以免污染 stdout 的 JSON 输出
    print(f"Downloading video and thumbnail to {output_dir}...", file=sys.stderr)
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        metadata["download_error"] = str(e)
        return metadata

    # 查找下载的文件
    video_path = None
    thumbnail_path = None

    for f in os.listdir(output_dir):
        full_path = os.path.join(output_dir, f)
        if f.startswith("video."):
            if f.endswith(".mp4"):
                video_path = full_path
            elif f.endswith(".jpg"):
                thumbnail_path = full_path

    if video_path:
        metadata["local_video_path"] = os.path.abspath(video_path)
        
        # 生成预览版本 (480p)
        # 进一步降低分辨率和质量以控制在 500k 以内
        preview_path = os.path.join(output_dir, "preview_480p.mp4")
        if shutil.which("ffmpeg"):
            print(f"Generating preview video {preview_path}...", file=sys.stderr)
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", "scale=-2:480", # 降低到 480p
                "-r", "12",            # 进一步降低帧率到 12fps
                "-c:v", "libx264",
                "-c:a", "aac",
                "-ac", "1",            # 单声道
                "-b:a", "24k",         # 更低音质
                "-crf", "42",          # 极高压缩率 (由 35 调整为 42)
                "-preset", "veryfast",
                "-fs", "480k",         # 严格限制在 500k 以内
                preview_path
            ]
            try:
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
                metadata["local_preview_path"] = os.path.abspath(preview_path)
            except subprocess.CalledProcessError as e:
                print(f"Preview generation failed: {e}", file=sys.stderr)
                metadata["preview_error"] = str(e)
        else:
            print("ffmpeg not found, skipping preview generation.", file=sys.stderr)

    if thumbnail_path:
        metadata["local_thumbnail_path"] = os.path.abspath(thumbnail_path)

    # 保存 JSON 到文件夹
    json_path = os.path.join(output_dir, "info.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    metadata["local_json_path"] = os.path.abspath(json_path)

    return metadata


def main():
    parser = argparse.ArgumentParser(description="提取 X 帖子信息")
    parser.add_argument("url", nargs="?", help="帖子 URL")
    parser.add_argument("--json", action="store_true", help="纯 JSON 输出")
    parser.add_argument("--debug", action="store_true", help="调试模式：不下载视频，仅抓取信息")

    args = parser.parse_args()

    if not args.url:
        print("用法: python dl-x-videos.py <url>")
        sys.exit(1)

    # 执行提取逻辑
    result = extract_tweet_info(args.url)

    # 如果抓取成功且未开启 debug 模式，则执行下载和处理
    if result.get("success") and not args.debug:
        result = process_download(result, args.url)

    # 输出结果
    print(json.dumps(result, ensure_ascii=False, indent=2))



if __name__ == "__main__":
    main()