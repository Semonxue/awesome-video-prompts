with open("tools/md-editor/server.py", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("r'^draft:\s*true\\\\b'", "r'^draft\\s*[:=]\\s*true\\\\b'")

with open("tools/md-editor/server.py", "w", encoding="utf-8") as f:
    f.write(text)
