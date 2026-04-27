#!/usr/bin/env python3
"""Markdown 编辑器后端"""

import os
import re
import json
import subprocess
import yaml
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
CONTENT_DIR = PROJECT_ROOT / "content" / "prompts"
STATIC_DIR = PROJECT_ROOT / "static"
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
        full = STATIC_DIR / media_path.lstrip("/")
        mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                    '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm'}
        ext = full.suffix.lower()
        
        if full.exists() and full.is_file():
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
                full = PROJECT_ROOT / body["path"].lstrip("/")
                with open(full, "w", encoding="utf-8") as f:
                    if "frontmatter" in body and "body" in body:
                        fm = body["frontmatter"]
                        class CustomDumper(yaml.SafeDumper):
                            def represent_scalar(self, tag, value, style=None):
                                if isinstance(value, str) and '\n' in value.strip():
                                    style = '|'
                                return super().represent_scalar(tag, value, style)
                        yaml_str = yaml.dump(fm, Dumper=CustomDumper, allow_unicode=True, sort_keys=False, default_flow_style=False)
                        f.write(f"---\n{yaml_str}---\n\n{body['body']}")
                    else:
                        f.write(body["content"])
                self.send_json({"success": True})
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
                if re.search(r'^draft\s*[:=]\s*true\b', head, re.MULTILINE | re.IGNORECASE):
                    return True
        except:
            pass
        return False

    def handle_list_files(self):
        files_dict = {}
        for mf in CONTENT_DIR.rglob("*.md"):
            if not self.parse_is_draft_fast(mf):
                continue
            rel_path = str(mf.relative_to(PROJECT_ROOT))
            files_dict[rel_path] = {
                "path": rel_path, "name": mf.name,
                "date": self.get_date(mf),
                "status": "committed"
            }
        try:
            result = subprocess.run(["git", "status", "--porcelain", "content/prompts/"],
                cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=10)
            for line in result.stdout.strip().split("\n"):
                if line.strip():
                    status_code = line[:2]
                    fp = line[3:].strip()
                    if "->" in fp:
                        fp = fp.split("->")[-1].strip()
                        
                    if fp.startswith("content/prompts/") and fp.endswith(".md"):
                        full_path = PROJECT_ROOT / fp
                        if not self.parse_is_draft_fast(full_path):
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
