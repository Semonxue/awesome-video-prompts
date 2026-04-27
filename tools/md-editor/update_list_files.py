import re

with open("tools/md-editor/server.py", "r", encoding="utf-8") as f:
    text = f.read()

old_list = """    def handle_list_files(self):
        files_dict = {}
        for mf in CONTENT_DIR.rglob("*.md"):
            rel_path = str(mf.relative_to(PROJECT_ROOT))
            files_dict[rel_path] = {
                "path": rel_path, "name": mf.name,
                "date": self.get_date(mf),
                "status": "committed"
            }
        try:
            result = subprocess.run(["git", "status", "--porcelain", "content/prompts/"],
                cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=10)
            for line in result.stdout.strip().split("\\n"):
                if line.strip():
                    status_code = line[:2]
                    fp = line[3:].strip()
                    if "->" in fp:
                        fp = fp.split("->")[-1].strip()
                        
                    if fp.startswith("content/prompts/") and fp.endswith(".md"):
                        if fp in files_dict:
                            files_dict[fp]["status"] = "new" if status_code.strip() == "??" else "modified"
                        else:
                            full_path = PROJECT_ROOT / fp
                            files_dict[fp] = {
                                "path": fp, "name": Path(fp).name,
                                "date": self.get_date(full_path) if full_path.exists() else "Unknown",
                                "status": "new" if status_code.strip() == "??" else "modified"
                            }
        except Exception as e:
            pass
            
        files = list(files_dict.values())
        files.sort(key=lambda x: x["date"], reverse=True)
        self.send_json(files)"""

new_list = """    def parse_is_draft_fast(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                head = f.read(1024)
                if re.search(r'^draft:\s*true\\b', head, re.MULTILINE | re.IGNORECASE):
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
            for line in result.stdout.strip().split("\\n"):
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
        self.send_json(files)"""

print("Match:", old_list in text)
text = text.replace(old_list, new_list)
with open("tools/md-editor/server.py", "w", encoding="utf-8") as f:
    f.write(text)
