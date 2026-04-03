from __future__ import annotations

from collections import Counter
from pathlib import Path
import re

import yaml


ROOT = Path(__file__).resolve().parent.parent
README_PATH = ROOT / "README.md"
MODELS_PATH = ROOT / "data/models.yaml"
PROMPTS_DIR = ROOT / "content/prompts"


def parse_front_matter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}

    end = text.find("\n---", 4)
    if end == -1:
        return {}

    return yaml.safe_load(text[4:end]) or {}


def normalize_to_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    return [str(value)]


def collect_stats() -> dict:
    models_data = yaml.safe_load(MODELS_PATH.read_text(encoding="utf-8"))
    model_counts = Counter({key: 0 for key in models_data})
    tag_counts: Counter[str] = Counter()
    prompt_files = sorted(PROMPTS_DIR.rglob("*.md"))
    valid_prompt_files = []

    for prompt_file in prompt_files:
        front_matter = parse_front_matter(prompt_file)
        
        # Skip drafts to ensure README stats match the published site
        # Only explicitly skip if draft is literally true or "true"
        draft_val = front_matter.get("draft")
        if str(draft_val).lower() == "true":
            continue
            
        valid_prompt_files.append(prompt_file)

        models = normalize_to_list(front_matter.get("models", front_matter.get("model")))
        for model in models:
            model_counts[model] += 1

        for tag in normalize_to_list(front_matter.get("tags")):
            tag_counts[tag] += 1

    sorted_models = sorted(
        (
            {
                "key": key,
                "name": model["name"],
                "count": model_counts[key],
            }
            for key, model in models_data.items()
        ),
        key=lambda item: (-item["count"], item["name"].lower()),
    )
    sorted_tags = sorted(tag_counts.items(), key=lambda item: (-item[1], item[0]))

    return {
        "prompt_count": len(valid_prompt_files),
        "model_total": len(models_data),
        "active_model_total": sum(1 for model in sorted_models if model["count"] > 0),
        "tag_total": len(tag_counts),
        "top_models": sorted_models[:10],
        "top_tags": sorted_tags[:20],
    }


def replace_once(text: str, pattern: str, replacement: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE | re.DOTALL)
    if count != 1:
        raise ValueError(f"Pattern not found or ambiguous: {pattern}")
    return updated


def render_model_table(top_models: list[dict]) -> str:
    lines = ["| 模型 | 提示词数量 |", "|------|-----------|"]
    lines.extend(f"| {model['name']} | {model['count']} |" for model in top_models)
    return "\n".join(lines)


def render_top_tags(top_tags: list[tuple[str, int]]) -> str:
    return " · ".join(f"`{tag}` ({count})" for tag, count in top_tags)


def update_readme() -> None:
    stats = collect_stats()
    readme = README_PATH.read_text(encoding="utf-8")

    readme = replace_once(
        readme,
        r"^!\[Models\]\([^\n]+\)$",
        f"![Models](https://img.shields.io/badge/{stats['model_total']}-Models-blue)",
    )
    readme = replace_once(
        readme,
        r"^!\[Tags\]\([^\n]+\)$",
        f"![Tags](https://img.shields.io/badge/{stats['tag_total']}-Tags-green)",
    )
    readme = replace_once(
        readme,
        r"^\*\*🎬 .*?\*\*$",
        f"**🎬 {stats['prompt_count']} 条精选提示词** | **{stats['model_total']} 个模型标签** | **{stats['tag_total']} 个活跃标签**",
    )
    readme = replace_once(
        readme,
        r"### 支持的 AI 视频模型\n\n\| 模型 \| 提示词数量 \|\n\|------\|-----------\|\n.*?\n(?=### 热门标签 \(Top 20\))",
        f"### 支持的 AI 视频模型\n\n{render_model_table(stats['top_models'])}\n\n",
    )
    readme = replace_once(
        readme,
        r"### 热门标签 \(Top 20\)\n\n.*?\n(?=## )",
        f"### 热门标签 (Top 20)\n\n{render_top_tags(stats['top_tags'])}\n\n",
    )

    README_PATH.write_text(readme, encoding="utf-8")

    print(
        "Synced README stats:",
        f"prompts={stats['prompt_count']}",
        f"models={stats['model_total']}",
        f"active_models={stats['active_model_total']}",
        f"tags={stats['tag_total']}",
    )


if __name__ == "__main__":
    update_readme()