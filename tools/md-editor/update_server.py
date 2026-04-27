import re

with open("tools/md-editor/server.py", "r", encoding="utf-8") as f:
    text = f.read()

# Replace normalize_fm and parse_fm
code_to_replace = """    def normalize_fm(self, fm):
        \"\"\"标准化 frontmatter 字段格式\"\"\"
        result = {}
        for key, value in fm.items():
            if isinstance(value, list):
                # 已经是列表
                result[key] = [str(v).strip() for v in value if str(v).strip()]
            elif isinstance(value, str):
                stripped = value.strip()
                # 检查是否是内联数组格式
                if stripped.startswith('[') and stripped.endswith(']'):
                    items = []
                    for m in re.findall(r'["\']([^"\']+)["\']', stripped):
                        items.append(m.strip())
                    if not items:
                        items = [i.strip() for i in stripped[1:-1].split(',') if i.strip()]
                    result[key] = items
                else:
                    result[key] = stripped
            else:
                result[key] = str(value) if value else ""
        return result

    def parse_fm(self, content):
        \"\"\"解析 YAML front matter\"\"\"
        fm = {}
        if not content.startswith("---"):
            return fm

        parts = content[3:].split("---", 1)
        if len(parts) < 2:
            return fm

        yaml_text = parts[0].strip()
        lines = yaml_text.split("\n")
        current_key = None
        multiline = []
        in_ml = False

        for line in lines:
            # 多行值开始
            ml_match = re.match(r'^(\w+):\s*\|?\s*$', line)
            if ml_match:
                if in_ml and current_key:
                    fm[current_key] = "\n".join(multiline)
                current_key = ml_match.group(1)
                multiline = []
                in_ml = "|" in line
                continue

            # 列表项
            list_match = re.match(r'^\s+-\s+(.+)$', line)
            if list_match:
                item = list_match.group(1).strip().strip('"\'')
                if current_key:
                    if current_key not in fm:
                        fm[current_key] = []
                    fm[current_key].append(item)
                continue

            # 内联数组
            inline = re.match(r"^(\w+):\s*\[(.+)\]\s*$", line.strip())
            if inline:
                key = inline.group(1)
                items_str = inline.group(2)
                items = []
                for m in re.findall(r'["\']([^"\']+)["\']', items_str):
                    items.append(m)
                if not items:
                    items = [i.strip() for i in items_str.split(',') if i.strip()]
                fm[key] = items
                current_key = key
                continue

            # 简单键值
            kv = re.match(r"^(\w+):\s*(.*)$", line.strip())
            if kv:
                key, val = kv.groups()
                val = val.strip().strip('"\'')
                # 如果之前在多行模式，关闭它
                if in_ml and current_key:
                    fm[current_key] = "\n".join(multiline)
                    in_ml = False
                fm[key] = val
                current_key = key
                if val.endswith("|") or val.endswith(">"):
                    in_ml = True
                    multiline = []
                    fm[key] = ""
                continue

            # 多行内容续行（需要缩进）
            if in_ml and line.startswith("  "):
                multiline.append(line.strip())
            elif in_ml:
                # 无缩进的新键，关闭多行模式
                fm[current_key] = "\n".join(multiline)
                in_ml = False

        if in_ml and current_key:
            fm[current_key] = "\n".join(multiline)
            
        return fm"""

new_code = """    def parse_fm(self, content):
        \"\"\"解析 YAML front matter 使用 PyYAML\"\"\"
        fm = {}
        if not content.startswith("---"):
            return fm
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                fm = yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                pass
        return fm"""

text = text.replace(code_to_replace, new_code)

read_file_code = """    def handle_read_file(self, file_path):
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
            # 预处理：标准化数组和字符串格式
            fm = self.normalize_fm(fm)
            self.send_json({"path": file_path, "frontmatter": fm, "raw": content})
        except Exception as e:
            self.send_error(500, str(e))"""

new_read_file = """    def handle_read_file(self, file_path):
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
            self.send_error(500, str(e))"""

text = text.replace(read_file_code, new_read_file)

with open("tools/md-editor/server.py", "w", encoding="utf-8") as f:
    f.write(text)
