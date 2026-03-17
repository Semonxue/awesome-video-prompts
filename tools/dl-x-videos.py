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
import re


def extract_tweet_id(url: str) -> str:
    """从 URL 中提取 tweet ID"""
    match = re.search(r'/status/(\d+)', url)
    if match:
        return match.group(1)
    return None


def normalize_url(url: str) -> str:
    """标准化 URL，将 x.com 转换为 twitter.com"""
    if "x.com" in url:
        return url.replace("x.com", "twitter.com", 1)
    return url


def extract_tweet_info(url: str) -> dict:
    """提取 tweet 信息，优先使用 twitter CLI，失败时 fallback 到 yt-dlp"""
    
    tweet_id = extract_tweet_id(url)
    
    # 优先使用 twitter CLI 获取完整帖子信息
    if tweet_id:
        try:
            cmd = [
                "twitter", "tweet", tweet_id,
                "--json", "--full-text","-n 1"
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )
            
            data = json.loads(result.stdout.strip())
            
            # 检查返回结构
            if data.get("ok") and data.get("data") and len(data["data"]) > 0:
                tweet = data["data"][0]
                author = tweet.get("author", {})
                media = tweet.get("media", [])
                
                # 提取视频信息
                videos = []
                for m in media:
                    if m.get("type") == "video" and m.get("url"):
                        videos.append({
                            "resolution": f"{m.get('width', '?')}x{m.get('height', '?')}",
                            "url": m.get("url"),
                            "format_id": "twitter"
                        })
                
                # 提取缩略图（从媒体中获取）
                thumbnail = None
                if media and media[0].get("url"):
                    # 视频缩略图通常可以从 twitter 获取，这里先留空
                    # 后续可以通过 yt-dlp 或其他方式获取
                    pass
                
                extracted = {
                    "success": True,
                    "url": url,
                    "post_id": tweet.get("id"),
                    "text": tweet.get("text", ""),
                    "author_name": author.get("name", ""),
                    "author_username": author.get("screenName", ""),
                    "author_url": f"https://twitter.com/{author.get('screenName', '')}",
                    "post_date": tweet.get("createdAt", ""),
                    "thumbnail": thumbnail,
                    "videos": videos,
                    "source": "twitter-cli"
                }
                
                return extracted
                
        except Exception as e:
            # twitter CLI 失败，记录错误但继续使用 yt-dlp
            print(f"twitter CLI failed: {e}, falling back to yt-dlp", file=sys.stderr)
    
    # Fallback: 使用 yt-dlp 获取信息
    return extract_tweet_info_yt_dlp(url)


def extract_tweet_info_yt_dlp(url: str) -> dict:
    """使用 yt-dlp 提取 tweet 信息（fallback 方案）"""
    # yt-dlp 对 'x.com' 的域名支持可能不如 'twitter.com' 稳定，
    # 将域名替换为旧版 'twitter.com' 以提高解析成功率
    normalized = url
    if "x.com" in url:
        normalized = url.replace("x.com", "twitter.com", 1)

    # 构造 yt-dlp 系统调用命令
    cmd = [
        # 使用绝对路径指定 yt-dlp，避免环境差异问题
        "/opt/homebrew/bin/yt-dlp",
        "--no-warnings",
        "--playlist-items", "1",
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
            timeout=60
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
            "videos": [],
            "source": "yt-dlp"
        }

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
    
    # 构造 yt-dlp 下载命令，使用 --output 模板自动处理多个视频
    # %(autonumber)s 会为多个视频自动编号 (1, 2, 3...)
    output_template = os.path.join(output_dir, "video_%(autonumber)s.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-warnings",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        "--write-thumbnail",
        "--convert-thumbnails", "jpg",
        "--autonumber-start", "1",
        normalized
    ]

    # 使用 stderr 输出日志，以免污染 stdout 的 JSON 输出
    print(f"Downloading video(s) and thumbnail(s) to {output_dir}...", file=sys.stderr)
    try:
        subprocess.run(cmd, check=True, timeout=300)
    except subprocess.CalledProcessError as e:
        metadata["download_error"] = str(e)
        return metadata

    # 查找所有下载的视频和缩略图
    video_paths = []
    thumbnail_paths = []

    for f in sorted(os.listdir(output_dir)):
        full_path = os.path.join(output_dir, f)
        if f.startswith("video_") and f.endswith(".mp4"):
            video_paths.append(full_path)
        elif f.startswith("video_") and f.endswith(".jpg"):
            thumbnail_paths.append(full_path)

    # 存储所有视频和预览路径
    metadata["local_videos"] = []
    
    for idx, video_path in enumerate(video_paths, 1):
        video_info = {
            "index": idx,
            "path": os.path.abspath(video_path)
        }
        
        # 为每个视频生成对应的缩略图
        if idx <= len(thumbnail_paths):
            video_info["thumbnail"] = os.path.abspath(thumbnail_paths[idx-1])
        
        metadata["local_videos"].append(video_info)
    
    # 为每个视频生成预览
    if shutil.which("ffmpeg"):
        for video_info in metadata.get("local_videos", []):
            video_path = video_info["path"]
            idx = video_info["index"]
            preview_path = os.path.join(output_dir, f"preview_{idx}_480p.mp4")
            
            print(f"Generating preview video {preview_path}...", file=sys.stderr)
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", "scale=-2:480", # 降低到 480p
                "-r", "12",            # 进一步降低帧率到 12fps
                "-an",                 # 不保留音频
                "-c:v", "libx264",
                "-crf", "34",          # 提高画质
                "-preset", "veryfast",
                "-fs", "1024k",        # 放宽体积上限以提升清晰度
                preview_path
            ]
            try:
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
                video_info["preview"] = os.path.abspath(preview_path)
            except subprocess.CalledProcessError as e:
                print(f"Preview generation failed for video {idx}: {e}", file=sys.stderr)
                video_info["preview_error"] = str(e)
    else:
        print("ffmpeg not found, skipping preview generation.", file=sys.stderr)
    
    # 兼容旧版本字段
    if metadata.get("local_videos"):
        first_video = metadata["local_videos"][0]
        metadata["local_video_path"] = first_video["path"]
        if "preview" in first_video:
            metadata["local_preview_path"] = first_video["preview"]
        if "thumbnail" in first_video:
            metadata["local_thumbnail_path"] = first_video["thumbnail"]

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