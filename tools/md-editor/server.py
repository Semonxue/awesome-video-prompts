#!/usr/bin/env python3
"""Markdown 编辑器后端"""

import os
import re
import json
import shutil
import subprocess
import tempfile
import yaml
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
CONTENT_DIR = PROJECT_ROOT / "content" / "prompts"
DRAFT_CONTENT_DIR = PROJECT_ROOT / "content" / "_drafts" / "prompts"
STATIC_DIR = PROJECT_ROOT / "static"
DRAFT_STATIC_DIR = STATIC_DIR / "_drafts"
DATA_DIR = PROJECT_ROOT / "data"


class EditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path.startswith("/media/"):
            self.handle_media(path[7:])
        elif path == "/api/files":
            self.handle_list_files()
        elif path == "/api/metadata":
            self.handle_metadata(query.get("type", [""])[0])
        elif path == "/api/file":
            self.handle_read_file(query.get("path", [""])[0])
        elif path.startswith("/templates/"):
            super().do_GET()
        else:
            self.serve_index()

    def serve_index(self):
        p = PROJECT_ROOT / "tools" / "md-editor" / "templates" / "index.html"
        if p.exists():
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            with open(p, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)

    def handle_media(self, media_path):
        """媒体代理"""
        mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                    '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm'}
        full = self.resolve_media_path(media_path)

        if full and full.exists() and full.is_file():
            ext = full.suffix.lower()
            self.send_response(200)
            self.send_header("Content-type", mime_map.get(ext, 'application/octet-stream'))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            with open(full, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)

    def do_PUT(self):
        if self.path == "/api/file":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length).decode("utf-8"))
                full = (PROJECT_ROOT / body["path"].lstrip("/")).resolve()
                if "frontmatter" in body and "body" in body:
                    fm = body["frontmatter"]
                    content = self.build_markdown_content(fm, body["body"])
                    is_draft = self.frontmatter_is_draft(fm)
                else:
                    content = body["content"]
                    fm = self.parse_fm(content)
                    is_draft = self.parse_is_draft_content(content)

                target = self.resolve_target_content_path(full, is_draft)
                self.validate_prompt_assets(full, target, fm)
                temp_target = self.write_content_temp(target, content)
                asset_move = None

                try:
                    asset_move = self.move_prompt_assets(full, target)
                    self.commit_temp_content(temp_target, target)

                    if target != full and full.exists():
                        full.unlink()
                except Exception:
                    self.rollback_temp_content(temp_target)
                    self.rollback_prompt_assets(asset_move)
                    raise
                else:
                    self.commit_prompt_assets(asset_move)

                self.log_save_transition(full, target, is_draft)

                rel_path = str(target.relative_to(PROJECT_ROOT))
                self.send_json({"success": True, "path": rel_path, "draft": is_draft})
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode())

    def parse_is_draft_fast(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                head = f.read(8192)
                return self.parse_is_draft_content(head)
        except:
            pass
        return False

    def parse_is_draft_content(self, content):
        return bool(re.search(r'^draft\s*[:=]\s*true\b', content, re.MULTILINE | re.IGNORECASE))

    def frontmatter_is_draft(self, fm):
        return self.parse_boolish(fm.get("draft", False))

    def parse_boolish(self, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "yes", "on", "1"}:
                return True
            if lowered in {"false", "no", "off", "0", ""}:
                return False
        return bool(value)

    def build_markdown_content(self, fm, body):
        class CustomDumper(yaml.SafeDumper):
            def represent_scalar(self, tag, value, style=None):
                if isinstance(value, str) and '\n' in value.strip():
                    style = '|'
                return super().represent_scalar(tag, value, style)

        yaml_str = yaml.dump(
            fm,
            Dumper=CustomDumper,
            allow_unicode=True,
            sort_keys=False,
            default_flow_style=False,
        )
        return f"---\n{yaml_str}---\n\n{body}"

    def write_content(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    def write_content_temp(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False, prefix=f".{path.name}.", suffix=".tmp") as f:
            f.write(content)
            return Path(f.name)

    def commit_temp_content(self, temp_path, target_path):
        os.replace(temp_path, target_path)

    def rollback_temp_content(self, temp_path):
        if temp_path and temp_path.exists():
            temp_path.unlink()

    def resolve_media_path(self, media_path):
        relative_media = Path(media_path.lstrip("/"))
        for root in (STATIC_DIR, DRAFT_STATIC_DIR):
            candidate = root / relative_media
            if candidate.exists() and candidate.is_file():
                return candidate
        return None

    def resolve_target_content_path(self, current_path, is_draft):
        root_name, relative_path = self.get_content_root(current_path)
        if relative_path is None:
            raise ValueError(f"Unsupported content path: {current_path}")

        target_root = DRAFT_CONTENT_DIR if is_draft else CONTENT_DIR
        return target_root / relative_path

    def get_content_root(self, path):
        for name, root in (("draft", DRAFT_CONTENT_DIR), ("published", CONTENT_DIR)):
            try:
                return name, path.relative_to(root)
            except ValueError:
                continue
        return None, None

    def get_prompt_asset_dir(self, content_path):
        root_name, relative_path = self.get_content_root(content_path)
        if relative_path is None:
            raise ValueError(f"Unsupported content path: {content_path}")

        asset_root = DRAFT_STATIC_DIR if root_name == "draft" else STATIC_DIR
        return asset_root / "prompts" / relative_path.with_suffix("")

    def move_prompt_assets(self, source_path, target_path):
        if source_path == target_path:
            return None

        source_asset_dir = self.get_prompt_asset_dir(source_path)
        target_asset_dir = self.get_prompt_asset_dir(target_path)
        if source_asset_dir == target_asset_dir or not source_asset_dir.exists():
            return None

        target_asset_dir.parent.mkdir(parents=True, exist_ok=True)
        backup_asset_dir = None
        if target_asset_dir.exists():
            backup_asset_dir = target_asset_dir.with_name(f".{target_asset_dir.name}.md-editor-backup")
            if backup_asset_dir.exists():
                shutil.rmtree(backup_asset_dir)
            shutil.move(str(target_asset_dir), str(backup_asset_dir))
        shutil.move(str(source_asset_dir), str(target_asset_dir))
        return {
            "source": source_asset_dir,
            "target": target_asset_dir,
            "backup": backup_asset_dir,
        }

    def validate_prompt_assets(self, source_path, target_path, fm):
        if source_path == target_path:
            return

        source_asset_dir = self.get_prompt_asset_dir(source_path)
        media_fields = [fm.get("image"), fm.get("video")]
        has_prompt_media = any(
            isinstance(value, str) and value.startswith("/prompts/")
            for value in media_fields
        )

        if has_prompt_media and not source_asset_dir.exists():
            rel_source = source_path.relative_to(PROJECT_ROOT)
            rel_assets = source_asset_dir.relative_to(PROJECT_ROOT)
            raise ValueError(
                f"Missing prompt assets for {rel_source}: expected {rel_assets}"
            )

    def rollback_prompt_assets(self, move_state):
        if not move_state:
            return

        source_asset_dir = move_state["source"]
        target_asset_dir = move_state["target"]
        backup_asset_dir = move_state["backup"]

        if target_asset_dir.exists() and not source_asset_dir.exists():
            source_asset_dir.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(target_asset_dir), str(source_asset_dir))

        if backup_asset_dir and backup_asset_dir.exists() and not target_asset_dir.exists():
            target_asset_dir.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(backup_asset_dir), str(target_asset_dir))

    def commit_prompt_assets(self, move_state):
        if not move_state:
            return

        backup_asset_dir = move_state["backup"]
        if backup_asset_dir and backup_asset_dir.exists():
            shutil.rmtree(backup_asset_dir)

    def log_save_transition(self, source_path, target_path, is_draft):
        if source_path == target_path:
            print(f"[md-editor] saved draft={is_draft} path={target_path.relative_to(PROJECT_ROOT)}")
            return

        source_asset_dir = self.get_prompt_asset_dir(source_path)
        target_asset_dir = self.get_prompt_asset_dir(target_path)
        print(
            "[md-editor] moved "
            f"draft={is_draft} "
            f"content={source_path.relative_to(PROJECT_ROOT)} -> {target_path.relative_to(PROJECT_ROOT)} "
            f"assets={source_asset_dir.relative_to(PROJECT_ROOT)} -> {target_asset_dir.relative_to(PROJECT_ROOT)}"
        )

    def should_list_file(self, path):
        root_name, _ = self.get_content_root(path)
        if root_name == "draft":
            return True
        if root_name == "published":
            return self.parse_is_draft_fast(path)
        return False

    def handle_list_files(self):
        files_dict = {}
        for root in (DRAFT_CONTENT_DIR, CONTENT_DIR):
            if not root.exists():
                continue
            for mf in root.rglob("*.md"):
                if not self.should_list_file(mf):
                    continue
                rel_path = str(mf.relative_to(PROJECT_ROOT))
                files_dict[rel_path] = {
                    "path": rel_path,
                    "name": mf.name,
                    "date": self.get_date(mf),
                    "status": "committed",
                }
        try:
            result = subprocess.run(["git", "status", "--porcelain", "content/prompts/", "content/_drafts/", "static/prompts/", "static/_drafts/"],
                cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=10)
            for line in result.stdout.strip().split("\n"):
                if line.strip():
                    status_code = line[:2]
                    fp = line[3:].strip()
                    if "->" in fp:
                        fp = fp.split("->")[-1].strip()

                    if fp.startswith(("content/prompts/", "content/_drafts/")) and fp.endswith(".md"):
                        full_path = PROJECT_ROOT / fp
                        if not self.should_list_file(full_path):
                            continue

                        if fp in files_dict:
                            files_dict[fp]["status"] = "new" if status_code.strip() == "??" else "modified"
                        else:
                            files_dict[fp] = {
                                "path": fp, "name": Path(fp).name,
                                "date": self.get_date(full_path) if full_path.exists() else "Unknown",
                                "status": "new" if status_code.strip() == "??" else "modified"
                            }
        except Exception as e:
            pass
            
        files = list(files_dict.values())
        files.sort(key=lambda x: x["date"], reverse=True)
        self.send_json(files)

    def handle_metadata(self, mtype):
        if mtype == "models":
            data = self.parse_models(DATA_DIR / "models.yaml")
        elif mtype == "tags":
            data = self.parse_tags(DATA_DIR / "tags.yaml")
        else:
            data = {}
        self.send_json(data)

    def handle_read_file(self, file_path):
        if not file_path:
            self.send_error(400)
            return
        full = PROJECT_ROOT / file_path.lstrip("/")
        if not full.exists():
            self.send_error(404)
            return
        try:
            with open(full, "r", encoding="utf-8") as f:
                content = f.read()
            fm = self.parse_fm(content)
            
            # 分离 body 和 fm
            body = content
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    body = parts[2].lstrip()
            
            # 预处理某些特殊字段以防前端崩溃（例如如果 tags 没有正确解析）
            if 'tags' in fm and isinstance(fm['tags'], str):
                fm['tags'] = [t.strip() for t in fm['tags'].split(',')]
            if 'models' in fm and isinstance(fm['models'], str):
                fm['models'] = [m.strip() for m in fm['models'].split(',')]
                
            self.send_json({"path": file_path, "frontmatter": fm, "raw": content, "body": body})
        except Exception as e:
            self.send_error(500, str(e))

    def normalize_fm(self, fm):
        """预处理数组等"""
        from datetime import date, datetime
        result = {}
        for key, value in fm.items():
            if isinstance(value, list):
                result[key] = [str(v).strip() for v in value if str(v).strip()]
            elif isinstance(value, str) and key in ['tags', 'models']:
                # 兼容偶尔误把 tags 写成字符串以逗号分隔的情况
                result[key] = [v.strip() for v in value.split(',') if v.strip()]
            elif isinstance(value, (date, datetime)):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

    def parse_fm(self, content):
        """解析 YAML front matter 使用 PyYAML"""
        fm = {}
        if not content.startswith("---"):
            return fm
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                fm = yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                pass
        return fm

    def parse_models(self, yaml_path):
        models = {}
        try:
            with open(yaml_path, "r", encoding="utf-8") as f:
                current = None
                for line in f.read().split("\n"):
                    if line and not line.startswith(" ") and ":" in line:
                        current = line.split(":")[0].strip()
                        models[current] = {"name": current.replace("_", " ").title()}
                    elif current and "name:" in line:
                        models[current]["name"] = line.split("name:", 1)[1].strip()
        except: pass
        return models

    def parse_tags(self, yaml_path):
        tags = {}
        try:
            with open(yaml_path, "r", encoding="utf-8") as f:
                current = None
                for line in f.read().split("\n"):
                    if line and not line.startswith(" ") and ":" in line and not line.startswith("#"):
                        current = line.split(":")[0].strip()
                        tags[current] = {"en": current.replace("_", " ").title()}
                    elif current and "en:" in line:
                        tags[current]["en"] = line.split("en:", 1)[1].strip().strip('"\'')
        except: pass
        return tags

    def get_date(self, path):
        try:
            from datetime import datetime
            return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        except:
            return "Unknown"


def run_server(port=3000):
    print(f"🚀 Markdown 编辑器已启动 http://localhost:{port}")
    server = HTTPServer(("localhost", port), EditorHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 已停止")
        server.shutdown()


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    run_server(port)
