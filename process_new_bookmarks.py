#!/usr/bin/env python3
import json
import os
import re
import shutil

# 当前下载的目录
completed = [
    '2041490161561936001',
    '2041480587186229337',
    '2041254614440325250',  # 注意：这是2041254635248156696等三个链接的合并视频
    '2041245371419263456',
    '2041221355140530369',
    '2041220934841844200',
    '2041218777833152786'
]

# Model keywords to filter from title
model_keywords = [
    'kling', 'hailuo', 'veo', 'sora', 'ltx', 'grok', 'luma', 'ray',
    'gen ', 'vidu', 'seedance', 'dreamina', 'hedra', 'wan ', 'pixverse',
    '@klingai', '@dreamina', '@runwayml', '@hailuoai', '@openai', '@sora',
    'seedance', 'seedream'
]

def contains_model(text):
    text_lower = text.lower()
    for mk in model_keywords:
        if mk.lower() in text_lower:
            return mk
    return None

def generate_title(text, author):
    """Generate title from text, ensuring no model names"""
    lines = text.split('\n')
    for line in lines[:5]:
        line = line.strip()
        # Skip short lines, links, hashtags
        if len(line) > 15 and 'http' not in line and not line.startswith('#') and not line.startswith('@'):
            # Clean emoji and special chars but keep essential punctuation
            clean_line = re.sub(r'[^\w\s\-.,;:!?\'\"]', ' ', line)
            clean_line = ' '.join(clean_line.split())  # normalize whitespace
            
            # Check if clean title contains model
            found_model = contains_model(clean_line)
            if found_model:
                continue
            
            # Truncate if too long
            if len(clean_line) > 80:
                clean_line = clean_line[:77] + '...'
            
            return clean_line
    
    # Fallback: generate from author
    return f"AI Video by {author}"[:80]

def detect_model(text):
    """Detect model from text content"""
    text_lower = text.lower()
    
    if 'seedance' in text_lower:
        return 'seedance'
    if 'kling' in text_lower:
        return 'kling'
    if 'grok' in text_lower:
        return 'grok'
    if 'nano banana' in text_lower:
        return 'nanobanana'
    if 'veo' in text_lower:
        return 'veo'
    if 'runway' in text_lower:
        return 'runway'
    if 'dreamina' in text_lower or 'capcut' in text_lower:
        return 'dreamina'
    if 'luma' in text_lower or 'ray' in text_lower:
        return 'luma'
    
    return 'unknown'

def detect_tags(text):
    """Detect tags from text"""
    tags = []
    text_lower = text.lower()
    
    tag_keywords = {
        'cinematic': 'cinematic',
        'fpv': 'fpv',
        'drone': 'drone',
        'action': 'action',
        'pov': 'pov',
        'portrait': 'portrait',
        'landscape': 'landscape',
        'horror': 'horror',
        'fantasy': 'fantasy',
        'anime': 'anime',
        'animation': 'animation',
        'commercial': 'commercial',
        'documentary': 'documentary',
        'macro': 'macro',
        'timelapse': 'timelapse',
        'slow-motion': 'slow-motion',
        'slow motion': 'slow-motion',
        'dramatic': 'dramatic',
        'realistic': 'realistic',
        '3d': '3d',
        '2d': '2d',
        'ultra': 'ultra',
        'photorealistic': 'photorealistic',
        'epic': 'epic',
        'hero': 'hero',
    }
    
    for keyword, tag in tag_keywords.items():
        if keyword in text_lower:
            if tag not in tags:
                tags.append(tag)
    
    if len(tags) > 5:
        tags = tags[:5]
    if not tags:
        tags = ['cinematic']
    
    return tags

for tweet_id in completed:
    temp_dir = f'temp/{tweet_id}'
    if not os.path.exists(temp_dir):
        print(f'Skipping {tweet_id} - temp dir not found')
        continue
    
    info_path = f'{temp_dir}/info.json'
    if not os.path.exists(info_path):
        print(f'Skipping {tweet_id} - info.json not found')
        continue
    
    with open(info_path, 'r', encoding='utf-8') as f:
        info = json.load(f)
    
    text = info.get('text', '')
    author = info.get('author_name', '')
    post_date = info.get('post_date', '')
    source_url = info.get('url', '')
    
    # Parse date
    date_match = re.search(r'(\w{3}) (\w{3}) (\d{2}) (\d{2}):(\d{2}):(\d{2}) \+0000 (\d{4})', post_date)
    if date_match:
        year = date_match.group(7)
        month_map = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06',
                     'Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
        month = month_map.get(date_match.group(3), '04')
        day = date_match.group(4)
        date_str = f'{year}-{month}-{day}'
        yyyy_mm = f'{year}-{month}'
    else:
        date_str = '2026-04-07'
        yyyy_mm = '2026-04'
    
    # Generate title
    title = generate_title(text, author)
    
    # Create slug
    title_part = title[:40]
    title_cleaned = re.sub(r'[^a-zA-Z0-9\-]', '-', title_part)
    title_cleaned = re.sub(r'-+', '-', title_cleaned)
    slug = f'{tweet_id}-{title_cleaned.lower()}'
    slug = slug.strip('-')
    
    # Detect model
    model = detect_model(text)
    
    # Detect tags
    tags = detect_tags(text)
    
    print(f'\n=== {tweet_id} ===')
    print(f'Title: {title}')
    print(f'Slug: {slug}')
    print(f'Model: {model}')
    print(f'Tags: {tags}')
    
    # Create static resource directory
    static_dir = f'static/prompts/{yyyy_mm}/{slug}'
    os.makedirs(static_dir, exist_ok=True)
    
    # Move files
    if os.path.exists(f'{temp_dir}/video_00001.jpg'):
        shutil.copy(f'{temp_dir}/video_00001.jpg', f'{static_dir}/cover.jpg')
        print(f'  + cover.jpg')
    
    # Use preview version or original
    if os.path.exists(f'{temp_dir}/preview_1_480p.mp4'):
        shutil.copy(f'{temp_dir}/preview_1_480p.mp4', f'{static_dir}/video.mp4')
        print(f'  + video.mp4 (preview)')
    elif os.path.exists(f'{temp_dir}/video_00001.mp4'):
        shutil.copy(f'{temp_dir}/video_00001.mp4', f'{static_dir}/video.mp4')
        print(f'  + video.mp4 (original)')
    
    # Compress cover image (600px max, 60% quality)
    if os.path.exists(f'{static_dir}/cover.jpg'):
        os.system(f'convert "{static_dir}/cover.jpg" -resize 600x600\\> -quality 60 "{static_dir}/cover.jpg"')
        print(f'  + cover.jpg compressed')
    
    # Compress video to 1M
    if os.path.exists(f'{static_dir}/video.mp4'):
        size = os.path.getsize(f'{static_dir}/video.mp4')
        if size > 1024*1024:
            os.system(f'ffmpeg -y -i "{static_dir}/video.mp4" -vf "scale=-2:480" -r 12 -c:v libx264 -crf 34 -preset veryfast -fs 1024k "{static_dir}/video_comp.mp4" 2>/dev/null')
            if os.path.exists(f'{static_dir}/video_comp.mp4'):
                os.rename(f'{static_dir}/video_comp.mp4', f'{static_dir}/video.mp4')
                print(f'  + video.mp4 compressed')
    
    # Create Hugo content file
    content_path = f'content/prompts/{yyyy_mm}/{slug}.md'
    
    # Prepare description
    description = text.replace('\\n', '\n')
    # Escape double quotes in description
    description_escaped = description.replace('"', '\\"')
    
    # front matter
    frontmatter = f'''---
title: "{title}"
date: {date_str}
draft: true
image: /prompts/{yyyy_mm}/{slug}/cover.jpg
video: /prompts/{yyyy_mm}/{slug}/video.mp4
description: |
  {description_escaped}
models: [{model}]
tags: [{', '.join(tags)}]
author: "{author}"
source_url: "{source_url}"
---

<!-- Content generated from Twitter bookmark: {tweet_id} -->
'''
    
    with open(content_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
    print(f'  + {content_path}')

print("\n\nDone processing!")
