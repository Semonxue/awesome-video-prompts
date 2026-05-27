#!/usr/bin/env python3
"""规范化draft文件的格式"""

import re
from pathlib import Path

def clean(val):
    """清理值"""
    if not val:
        return val
    val = str(val).strip()
    # 去除首尾引号
    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
        val = val[1:-1]
    return val

def process_file(f):
    """处理单个文件"""
    content = f.read_text(encoding='utf-8')
    lines = content.split('\n')
    
    # 找到所有的 --- 行
    dash_lines = []
    for i, line in enumerate(lines):
        if line.strip() == '---':
            dash_lines.append(i)
    
    if len(dash_lines) < 2:
        return False
    
    # 第一个 --- 是开始
    start = dash_lines[0]
    # 找到第二个 --- 作为frontmatter结束
    if len(dash_lines) >= 2:
        end = dash_lines[1]
        fm_lines = lines[start+1:end]
        body_lines = lines[end+1:]
    else:
        return False
    
    fm_text = '\n'.join(fm_lines)
    body = '\n'.join(body_lines).strip()
    
    # 解析字段
    fm = {}
    for line in fm_lines:
        line = line.strip()
        if ':' not in line:
            continue
        key, val = line.split(':', 1)
        fm[key.strip()] = val.strip()
    
    # 确保有draft
    fm['draft'] = 'true'
    
    # 构建新的frontmatter
    out_lines = []
    
    if 'image' in fm: out_lines.append(f"image: {fm['image']}")
    if 'video' in fm: out_lines.append(f"video: {fm['video']}")
    if 'date' in fm: out_lines.append(f"date: '{clean(fm['date'])}'")
    if 'title' in fm: out_lines.append(f"title: {clean(fm['title'])}")
    
    if 'description' in fm:
        desc = clean(fm['description'])
        out_lines.append("description: |-")
        for line in desc.split('\n'):
            out_lines.append(f"  {line}")
    
    if 'models' in fm:
        models = clean(fm['models'])
        models = models.strip('[]')
        out_lines.append(f"models:\n- {models}")
    
    if 'tags' in fm:
        tags = clean(fm['tags'])
        tags = tags.strip('[]')
        out_lines.append(f"tags:\n- {tags}")
    
    if 'author' in fm:
        author = clean(fm['author'])
        if author.startswith('@'):
            author = author[1:]
        out_lines.append(f"author: {author}")
    
    if 'source_url' in fm: out_lines.append(f"source_url: {fm['source_url']}")
    out_lines.append(f"draft: {fm['draft']}")
    
    new_content = "---\n" + '\n'.join(out_lines) + "\n---\n\n" + body
    f.write_text(new_content, encoding='utf-8')
    return True

def main():
    draft_dir = Path("content/_drafts/prompts")
    files = list(draft_dir.rglob("*.md"))
    print(f"=== 规范化 {len(files)} 个draft文件 ===\n")
    
    for f in sorted(files):
        if process_file(f):
            print(f"✓ {f.relative_to(draft_dir)}")
        else:
            print(f"❌ {f.relative_to(draft_dir)} - 解析失败")
    
    print("\n完成！")

if __name__ == "__main__":
    main()
