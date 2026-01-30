#!/usr/bin/env python3
"""
从 X 帖子 URL 提取核心信息（作者、文本、视频链接等）
使用本地最新 yt-dlp 命令行
"""

import subprocess
import json
import sys
import argparse


def normalize_url(url: str) -> str:
    if "x.com" in url:
        return url.replace("x.com", "twitter.com", 1)
    return url


def extract_tweet_info(url: str) -> dict:
    normalized = normalize_url(url)

    cmd = [
        "/Users/semonxue/miniconda3/bin/yt-dlp",
        "--dump-json",
        "--skip-download",
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

        data = json.loads(result.stdout.strip())

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


def main():
    parser = argparse.ArgumentParser(description="提取 X 帖子信息")
    parser.add_argument("url", nargs="?", help="帖子 URL")
    parser.add_argument("--json", action="store_true", help="纯 JSON 输出")

    args = parser.parse_args()

    if not args.url:
        print("用法: python dl-x-videos.py <url>")
        sys.exit(1)

    result = extract_tweet_info(args.url)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()